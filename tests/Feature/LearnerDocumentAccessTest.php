<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('document streaming requires enrolled learner with read task access', function (): void {
    Storage::fake('public');
    Storage::disk('public')->put('lesson-documents/sample.pdf', '%PDF-1.4');

    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['status' => 'published']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'type' => 'read',
        'status' => 'published',
        'pdf_url' => '/storage/lesson-documents/sample.pdf',
    ]);

    $this->actingAs($user)
        ->get(route('courses.documents.show', $task))
        ->assertForbidden();

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->get(route('courses.documents.show', $task))
        ->assertOk();
});
