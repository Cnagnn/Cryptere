<?php

use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

test('lesson tasks schema does not include uploaded video processing columns', function (): void {
    expect(Schema::hasColumn('lesson_tasks', 'video_processing_status'))->toBeFalse()
        ->and(Schema::hasColumn('lesson_tasks', 'video_mp4_url'))->toBeFalse();
});

test('admin video task rejects uploaded video files', function (): void {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $lesson = Lesson::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Video: Intro Caesar',
            'description' => 'Tonton video pengantar.',
            'type' => 'video',
            'status' => 'published',
            'video_url' => 'https://www.youtube.com/watch?v=sMOZf4GN3oc',
            'video_file' => UploadedFile::fake()->create('intro.mp4', 128, 'video/mp4'),
        ])
        ->assertSessionHasErrors('video_file');

    expect(LessonTask::query()->where('lesson_id', $lesson->id)->exists())->toBeFalse();
    Storage::disk('public')->assertMissing('lesson-videos/originals/intro.mp4');
});

test('admin video task stores supported video links as ready', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $lesson = Lesson::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Video: Intro Caesar',
            'description' => 'Tonton video pengantar.',
            'type' => 'video',
            'status' => 'published',
            'video_url' => 'https://www.youtube.com/watch?v=sMOZf4GN3oc',
        ])
        ->assertRedirect();

    $task = LessonTask::query()->where('lesson_id', $lesson->id)->firstOrFail();

    expect($task->video_url)->toBe('https://www.youtube.com/watch?v=sMOZf4GN3oc')
        ->and($task->getAttributes())->not->toHaveKeys(['video_processing_status', 'video_mp4_url']);
});
