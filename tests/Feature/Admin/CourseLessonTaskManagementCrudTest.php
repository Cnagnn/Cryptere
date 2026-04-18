<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;

test('admin can create update and delete lesson and task from management', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.courses.lessons.store'), [
            'course_id' => $course->id,
            'title' => 'Encryption Basics',
            'xp_reward' => 90,
        ])
        ->assertRedirect();

    $lesson = Lesson::query()->where('course_id', $course->id)->where('title', 'Encryption Basics')->first();

    expect($lesson)->not->toBeNull();
    expect($lesson?->xp_reward)->toBe(90);

    $this->actingAs($admin)
        ->patch(route('admin.courses.lessons.update', ['lesson' => $lesson?->id]), [
            'title' => 'Encryption Basics Updated',
            'xp_reward' => 110,
        ])
        ->assertRedirect();

    expect($lesson?->fresh()?->title)->toBe('Encryption Basics Updated');
    expect($lesson?->fresh()?->xp_reward)->toBe(110);

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson?->id,
            'title' => 'Watch Caesar Video',
            'type' => 'video',
            'minutes' => 12,
            'video_url' => 'https://example.com/video',
        ])
        ->assertRedirect();

    $task = LessonTask::query()->where('lesson_id', $lesson?->id)->where('title', 'Watch Caesar Video')->first();

    expect($task)->not->toBeNull();
    expect($task?->type)->toBe('video');

    $this->actingAs($admin)
        ->patch(route('admin.courses.tasks.update', ['task' => $task?->id]), [
            'title' => 'Watch Caesar Video Updated',
            'type' => 'quiz',
            'minutes' => 8,
            'video_url' => null,
            'quiz_questions' => [
                [
                    'question' => 'What is Caesar cipher shift of A by 3?',
                    'options' => ['A', 'C', 'D', 'E'],
                    'correct_option' => 3,
                    'explanation' => 'A shifted by 3 becomes D.',
                ],
            ],
        ])
        ->assertRedirect();

    expect($task?->fresh()?->title)->toBe('Watch Caesar Video Updated');
    expect($task?->fresh()?->type)->toBe('quiz');
    expect($task?->fresh()?->quizQuestions()->count())->toBe(1);

    $this->actingAs($admin)
        ->delete(route('admin.courses.tasks.destroy', ['task' => $task?->id]))
        ->assertRedirect();

    expect(LessonTask::query()->whereKey($task?->id)->exists())->toBeFalse();

    $this->actingAs($admin)
        ->delete(route('admin.courses.lessons.destroy', ['lesson' => $lesson?->id]))
        ->assertRedirect();

    expect(Lesson::query()->whereKey($lesson?->id)->exists())->toBeFalse();
});
