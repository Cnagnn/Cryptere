<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->course = Course::factory()->create(['is_published' => true]);
    $this->lesson = Lesson::factory()->for($this->course)->create(['position' => 1]);
    $this->task = LessonTask::factory()->for($this->lesson)->create(['type' => 'quiz']);

    // Create 3 quiz questions (correct answers: 1, 0, 2)
    $this->questions = collect([
        QuizQuestion::create([
            'lesson_task_id' => $this->task->id,
            'question' => 'What is AES?',
            'options' => ['Hash', 'Cipher', 'Protocol', 'Key'],
            'correct_option' => 1,
            'sort_order' => 1,
        ]),
        QuizQuestion::create([
            'lesson_task_id' => $this->task->id,
            'question' => 'What is RSA?',
            'options' => ['Asymmetric', 'Symmetric', 'Hash', 'MAC'],
            'correct_option' => 0,
            'sort_order' => 2,
        ]),
        QuizQuestion::create([
            'lesson_task_id' => $this->task->id,
            'question' => 'What is SHA?',
            'options' => ['Cipher', 'Protocol', 'Hash', 'Key'],
            'correct_option' => 2,
            'sort_order' => 3,
        ]),
    ]);

    // Enroll user via route (use a fresh request so actingAs doesn't persist)
    $this->actingAs($this->user)
        ->post(route('courses.enroll', ['course' => $this->course->slug]));

    // Reset auth state so each test controls its own authentication
    auth()->logout();
});

test('enrolled user can submit quiz with correct answers', function () {
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [1, 0, 2], // All correct
        ])
        ->assertOk()
        ->assertJson([
            'score' => 3,
            'total' => 3,
        ]);

    expect(QuizSubmission::where('user_id', $this->user->id)->exists())->toBeTrue();
});

test('enrolled user can submit quiz with wrong answers', function () {
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 1, 3], // All wrong
        ])
        ->assertOk()
        ->assertJson([
            'score' => 0,
            'total' => 3,
        ]);
});

test('quiz returns per-question results with explanations', function () {
    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [1, 1, 2], // First and third correct
        ])
        ->assertOk();

    $results = $response->json('results');

    expect($results)->toHaveCount(3)
        ->and($results[0]['correct'])->toBeTrue()
        ->and($results[1]['correct'])->toBeFalse()
        ->and($results[2]['correct'])->toBeTrue()
        ->and($results[0])->toHaveKey('explanation')
        ->and($response->json('score'))->toBe(2);
});

test('unenrolled user cannot submit quiz', function () {
    $otherUser = User::factory()->create();

    $this->actingAs($otherUser)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [1, 0, 2],
        ])
        ->assertForbidden();
});

test('guest cannot submit quiz', function () {
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->for($course)->create(['position' => 1]);
    $task = LessonTask::factory()->for($lesson)->create(['type' => 'quiz']);

    $this->withHeaders(['Accept' => 'application/json'])
        ->postJson(route('courses.lessons.quiz', [
            'course' => $course->slug,
            'lesson' => $lesson->id,
        ]), [
            'task_id' => $task->id,
            'answers' => [0],
        ])
        ->assertUnauthorized();
});

test('quiz awards xp only on first perfect score', function () {
    $initialXp = $this->user->xp;

    // Submit wrong answers first
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0],
        ])
        ->assertOk()
        ->assertJson(['xp_earned' => 0]);

    // Submit perfect score
    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [1, 0, 2],
        ])
        ->assertOk();

    expect($response->json('xp_earned'))->toBeGreaterThan(0);

    // Submit perfect score again — should not re-award
    $secondResponse = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [1, 0, 2],
        ])
        ->assertOk();

    expect($secondResponse->json('xp_earned'))->toBe(0);
});

test('quiz validates required fields', function () {
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['task_id', 'answers']);
});

test('quiz rejects task from different lesson', function () {
    $otherLesson = Lesson::factory()->for($this->course)->create(['position' => 2]);
    $otherTask = LessonTask::factory()->for($otherLesson)->create(['type' => 'quiz']);

    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $otherTask->id,
            'answers' => [1, 0, 2],
        ])
        ->assertNotFound();
});

test('quiz rejects unpublished course for non-admin', function () {
    $unpublishedCourse = Course::factory()->create(['is_published' => false]);
    $lesson = Lesson::factory()->for($unpublishedCourse)->create(['position' => 1]);
    $task = LessonTask::factory()->for($lesson)->create(['type' => 'quiz']);

    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $unpublishedCourse->slug,
            'lesson' => $lesson->id,
        ]), [
            'task_id' => $task->id,
            'answers' => [0],
        ])
        ->assertForbidden();
});

test('quiz persists submission record', function () {
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [1, 0, 2],
        ])
        ->assertOk();

    $submission = QuizSubmission::where('user_id', $this->user->id)
        ->where('lesson_task_id', $this->task->id)
        ->first();

    expect($submission)->not->toBeNull()
        ->and($submission->score)->toBe(3)
        ->and($submission->total)->toBe(3)
        ->and($submission->answers)->toBe([1, 0, 2])
        ->and($submission->results)->toHaveCount(3);
});
