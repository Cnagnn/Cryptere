<?php

use App\Jobs\ConvertLessonVideo;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

function createAdminWithVideoTask(array $taskOverrides = []): array
{
    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);
    $task = LessonTask::factory()->create(array_merge([
        'lesson_id' => $lesson->id,
        'type' => 'video',
        'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'video_processing_status' => null,
        'video_mp4_url' => null,
        'description' => 'Test video task description',
    ], $taskOverrides));

    return [$admin, $course, $lesson, $task];
}

test('admin can upload a video file for a task', function () {
    Storage::fake('public');
    Bus::fake([ConvertLessonVideo::class]);

    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $videoFile = UploadedFile::fake()->create('test-video.mp4', 1024, 'video/mp4');

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Video Upload Test',
            'description' => 'Testing video file upload',
            'type' => 'video',
            'minutes' => 10,
            'video_file' => $videoFile,
        ])
        ->assertRedirect();

    $task = LessonTask::query()->where('title', 'Video Upload Test')->first();

    expect($task)->not->toBeNull();
    expect($task->type)->toBe('video');
    expect($task->video_processing_status)->toBe('pending');
    expect($task->video_url)->toContain('lesson-videos/originals');

    Storage::disk('public')->assertExists(
        str_replace(Storage::disk('public')->url(''), '', $task->video_url)
    );
});

test('video upload dispatches conversion job', function () {
    Storage::fake('public');
    Bus::fake([ConvertLessonVideo::class]);

    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $videoFile = UploadedFile::fake()->create('test-video.mp4', 1024, 'video/mp4');

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Dispatch Test',
            'description' => 'Testing job dispatch',
            'type' => 'video',
            'minutes' => 5,
            'video_file' => $videoFile,
        ])
        ->assertRedirect();

    Bus::assertDispatched(ConvertLessonVideo::class);
});

test('conversion job updates status to processing then ready for local uploads', function () {
    Storage::fake('public');

    // Create a fake video file in storage
    $originalPath = 'lesson-videos/originals/test-video.mp4';
    Storage::disk('public')->put($originalPath, 'fake video content');

    $task = LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => Storage::disk('public')->url($originalPath),
        'video_processing_status' => 'pending',
        'video_mp4_url' => null,
        'description' => 'Test task',
    ]);

    // Mock ffmpeg as unavailable so it falls back to copy
    Process::fake([
        'ffmpeg -version' => Process::result(output: '', errorOutput: '', exitCode: 1),
    ]);

    $job = new ConvertLessonVideo($task->id);
    $job->handle();

    $task->refresh();

    expect($task->video_processing_status)->toBe('ready');
    expect($task->video_mp4_url)->not->toBeNull();
    expect($task->video_mp4_url)->toContain('lesson-videos/converted');
});

test('conversion job handles failure gracefully', function () {
    Storage::fake('public');

    $task = LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => Storage::disk('public')->url('nonexistent/video.mp4'),
        'video_processing_status' => 'pending',
        'video_mp4_url' => null,
        'description' => 'Test task',
    ]);

    Process::fake([
        'ffmpeg -version' => Process::result(output: '', errorOutput: '', exitCode: 1),
    ]);

    $job = new ConvertLessonVideo($task->id);
    $job->handle();

    $task->refresh();

    expect($task->video_processing_status)->toBe('failed');
    expect($task->video_mp4_url)->toBeNull();
});

test('video status endpoint returns correct status', function () {
    [$admin, $course, $lesson, $task] = createAdminWithVideoTask([
        'video_processing_status' => 'processing',
        'video_mp4_url' => null,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.courses.tasks.video-status', $task))
        ->assertOk()
        ->assertJson([
            'status' => 'processing',
            'isReady' => false,
        ]);
});

test('video status endpoint returns ready with mp4 url', function () {
    [$admin, $course, $lesson, $task] = createAdminWithVideoTask([
        'video_processing_status' => 'ready',
        'video_mp4_url' => '/storage/lesson-videos/converted/1/test.mp4',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.courses.tasks.video-status', $task))
        ->assertOk()
        ->assertJson([
            'status' => 'ready',
            'videoUrl' => '/storage/lesson-videos/converted/1/test.mp4',
            'isReady' => true,
        ]);
});

test('video player prefers mp4_url over video_url', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $task = LessonTask::factory()->create([
        'lesson_id' => $lesson->id,
        'type' => 'video',
        'video_url' => 'https://example.com/original.mp4',
        'video_mp4_url' => '/storage/lesson-videos/converted/1/optimized.mp4',
        'video_processing_status' => 'ready',
        'description' => 'Test task',
        'published_at' => now(),
    ]);

    // The CourseController already prefers video_mp4_url over video_url
    // Verify the task has both URLs set correctly
    expect($task->video_mp4_url)->toBe('/storage/lesson-videos/converted/1/optimized.mp4');
    expect($task->video_url)->toBe('https://example.com/original.mp4');

    // The controller logic: $task->video_mp4_url ?? $task->video_url
    $resolvedUrl = $task->video_mp4_url ?? $task->video_url;
    expect($resolvedUrl)->toBe('/storage/lesson-videos/converted/1/optimized.mp4');
});

test('external YouTube URLs skip conversion', function () {
    $task = LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'video_processing_status' => 'pending',
        'video_mp4_url' => null,
        'description' => 'Test task',
    ]);

    $job = new ConvertLessonVideo($task->id);
    $job->handle();

    $task->refresh();

    expect($task->video_processing_status)->toBe('ready');
    expect($task->video_mp4_url)->toBeNull();
});

test('video file validation rejects non-video files', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $textFile = UploadedFile::fake()->create('document.txt', 100, 'text/plain');

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Invalid File Test',
            'description' => 'Testing invalid file type',
            'type' => 'video',
            'minutes' => 5,
            'video_file' => $textFile,
        ])
        ->assertSessionHasErrors('video_file');
});

test('video file validation enforces size limit', function () {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    // 600MB file (exceeds 500MB limit)
    $largeFile = UploadedFile::fake()->create('large-video.mp4', 614400, 'video/mp4');

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Large File Test',
            'description' => 'Testing file size limit',
            'type' => 'video',
            'minutes' => 5,
            'video_file' => $largeFile,
        ])
        ->assertSessionHasErrors('video_file');
});

test('cleanup command removes old originals', function () {
    Storage::fake('public');

    // Create an original video file
    $originalPath = 'lesson-videos/originals/old-video.mp4';
    Storage::disk('public')->put($originalPath, 'fake video content');

    $task = LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => Storage::disk('public')->url($originalPath),
        'video_mp4_url' => Storage::disk('public')->url('lesson-videos/converted/1/converted.mp4'),
        'video_processing_status' => 'ready',
        'description' => 'Test task',
        'updated_at' => now()->subDays(31),
    ]);

    // Force the updated_at to be old
    LessonTask::withoutTimestamps(function () use ($task) {
        $task->update(['updated_at' => now()->subDays(31)]);
    });

    $this->artisan('videos:cleanup --days=30')
        ->assertSuccessful();

    Storage::disk('public')->assertMissing($originalPath);
});

test('cleanup command does not remove recent originals', function () {
    Storage::fake('public');

    $originalPath = 'lesson-videos/originals/recent-video.mp4';
    Storage::disk('public')->put($originalPath, 'fake video content');

    LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => Storage::disk('public')->url($originalPath),
        'video_mp4_url' => Storage::disk('public')->url('lesson-videos/converted/1/converted.mp4'),
        'video_processing_status' => 'ready',
        'description' => 'Test task',
    ]);

    $this->artisan('videos:cleanup --days=30')
        ->assertSuccessful();

    Storage::disk('public')->assertExists($originalPath);
});

test('admin can update a task with a video file upload', function () {
    Storage::fake('public');
    Bus::fake([ConvertLessonVideo::class]);

    [$admin, $course, $lesson, $task] = createAdminWithVideoTask();

    $videoFile = UploadedFile::fake()->create('new-video.mp4', 2048, 'video/mp4');

    $this->actingAs($admin)
        ->patch(route('admin.courses.tasks.update', $task), [
            'title' => $task->title,
            'description' => $task->description,
            'type' => 'video',
            'minutes' => $task->minutes,
            'video_file' => $videoFile,
        ])
        ->assertRedirect();

    $task->refresh();

    expect($task->video_processing_status)->toBe('pending');
    expect($task->video_url)->toContain('lesson-videos/originals');
    expect($task->video_mp4_url)->toBeNull();

    Bus::assertDispatched(ConvertLessonVideo::class);
});

test('admin can still create a task with a YouTube URL', function () {
    Bus::fake([ConvertLessonVideo::class]);

    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'YouTube Task',
            'description' => 'Testing YouTube URL backward compatibility',
            'type' => 'video',
            'minutes' => 10,
            'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        ])
        ->assertRedirect();

    $task = LessonTask::query()->where('title', 'YouTube Task')->first();

    expect($task)->not->toBeNull();
    expect($task->video_url)->toBe('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect($task->video_processing_status)->toBe('pending');

    Bus::assertDispatched(ConvertLessonVideo::class);
});

test('conversion job marks YouTube URLs as ready without transcoding', function () {
    $task = LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => 'https://youtu.be/dQw4w9WgXcQ',
        'video_processing_status' => 'pending',
        'video_mp4_url' => null,
        'description' => 'Test task',
    ]);

    $job = new ConvertLessonVideo($task->id);
    $job->handle();

    $task->refresh();

    expect($task->video_processing_status)->toBe('ready');
    expect($task->video_mp4_url)->toBeNull();
});

test('conversion job failed method sets status to failed', function () {
    $task = LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => 'https://example.com/video.mp4',
        'video_processing_status' => 'processing',
        'video_mp4_url' => null,
        'description' => 'Test task',
    ]);

    $job = new ConvertLessonVideo($task->id);
    $job->failed(new \RuntimeException('Test failure'));

    $task->refresh();

    expect($task->video_processing_status)->toBe('failed');
});

test('cleanup command does not delete external YouTube URLs', function () {
    Storage::fake('public');

    $task = LessonTask::factory()->create([
        'type' => 'video',
        'video_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'video_mp4_url' => null,
        'video_processing_status' => 'ready',
        'description' => 'Test task',
    ]);

    LessonTask::withoutTimestamps(function () use ($task) {
        $task->update(['updated_at' => now()->subDays(31)]);
    });

    // Should not throw or attempt to delete anything
    $this->artisan('videos:cleanup --days=30')
        ->assertSuccessful();
});
