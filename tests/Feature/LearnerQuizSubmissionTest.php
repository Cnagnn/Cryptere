<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;

test('quiz submission does not expose answer keys and returns immediate submission payload', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['status' => 'published']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'type' => 'quiz',
        'status' => 'published',
    ]);
    $question = QuizQuestion::factory()->for($task, 'task')->create(['correct_option' => 0]);
    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->postJson(route('courses.lessons.quiz', [$course, $lesson]), [
            'task_id' => $task->id,
            'answers' => [
                ['question_id' => $question->id, 'answer' => 0],
            ],
        ])
        ->assertOk()
        ->assertJsonMissingPath('results.0.correctAnswer')
        ->assertJsonPath('submission.score', 1)
        ->assertJsonMissingPath('submission.results.0.correctAnswer');
});

test('quiz submission rejects questions outside the task', function (): void {
    $user = User::factory()->create();
    $course = Course::factory()->create(['status' => 'published', 'is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['status' => 'published']);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create(['type' => 'quiz', 'status' => 'published']);
    $otherTask = LessonTask::factory()->for($lesson, 'lesson')->create(['type' => 'quiz', 'status' => 'published']);
    $otherQuestion = QuizQuestion::factory()->for($otherTask, 'task')->create();
    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->postJson(route('courses.lessons.quiz', [$course, $lesson]), [
            'task_id' => $task->id,
            'answers' => [
                ['question_id' => $otherQuestion->id, 'answer' => 0],
            ],
        ])
        ->assertUnprocessable();
});
