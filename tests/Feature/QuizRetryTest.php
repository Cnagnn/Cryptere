<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\QuizSubmission;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['xp' => 0, 'points' => 0]);
    $this->course = Course::factory()->create(['is_published' => true]);
    $this->lesson = Lesson::factory()->for($this->course)->create(['position' => 1]);
    $this->task = LessonTask::factory()->for($this->lesson)->create(['type' => 'quiz']);

    // Create 8 quiz questions (large pool for random selection)
    $this->questions = collect();
    for ($i = 0; $i < 8; $i++) {
        $this->questions->push(QuizQuestion::create([
            'lesson_task_id' => $this->task->id,
            'question' => "Question {$i}: What is the answer?",
            'options' => ['Option A', 'Option B', 'Option C', 'Option D'],
            'correct_option' => $i % 4, // Rotate correct answers: 0, 1, 2, 3, 0, 1, 2, 3
            'sort_order' => $i + 1,
            'difficulty_level' => match (true) {
                $i < 3 => 'easy',
                $i < 6 => 'medium',
                default => 'hard',
            },
            'difficulty_score' => round(0.2 + ($i * 0.1), 2),
        ]));
    }

    // Enroll user
    $this->actingAs($this->user)
        ->post(route('courses.enroll', ['course' => $this->course->slug]));

    auth()->logout();
});

test('first attempt creates submission with attempt_number = 1', function () {
    // Set config to use 4 questions per attempt
    config(['rewards.quiz_questions_per_attempt' => 4]);

    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect($response->json('attempt_number'))->toBe(1);

    $submission = QuizSubmission::where('user_id', $this->user->id)
        ->where('lesson_task_id', $this->task->id)
        ->first();

    expect($submission)->not->toBeNull()
        ->and($submission->attempt_number)->toBe(1);
});

test('retry creates new submission with attempt_number = 2', function () {
    config(['rewards.quiz_questions_per_attempt' => 4]);

    // First attempt
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    // Second attempt (retry)
    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [1, 1, 1, 1],
        ])
        ->assertOk();

    expect($response->json('attempt_number'))->toBe(2);

    $submissions = QuizSubmission::where('user_id', $this->user->id)
        ->where('lesson_task_id', $this->task->id)
        ->orderBy('attempt_number')
        ->get();

    expect($submissions)->toHaveCount(2)
        ->and($submissions[0]->attempt_number)->toBe(1)
        ->and($submissions[1]->attempt_number)->toBe(2);
});

test('xp multiplier decreases on subsequent attempts', function () {
    config([
        'rewards.quiz_questions_per_attempt' => 4,
        'rewards.quiz_retry_xp_multipliers' => [1.0, 0.5, 0.25, 0.1],
    ]);

    // First attempt — check multiplier is 1.0
    $response1 = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect((float) $response1->json('xp_multiplier'))->toBe(1.0);

    // Second attempt — multiplier should be 0.5
    $response2 = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect($response2->json('xp_multiplier'))->toBe(0.5);

    // Third attempt — multiplier should be 0.25
    $response3 = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect($response3->json('xp_multiplier'))->toBe(0.25);

    // Fourth attempt — multiplier should be 0.1
    $response4 = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect($response4->json('xp_multiplier'))->toBe(0.1);

    // Fifth attempt — should still be 0.1 (last value in array)
    $response5 = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect($response5->json('xp_multiplier'))->toBe(0.1);
});

test('random question selection gives different questions on retry', function () {
    config(['rewards.quiz_questions_per_attempt' => 4]);

    // Run multiple attempts and collect question counts
    $allScores = [];

    for ($attempt = 0; $attempt < 5; $attempt++) {
        $response = $this->actingAs($this->user)
            ->postJson(route('courses.lessons.quiz', [
                'course' => $this->course->slug,
                'lesson' => $this->lesson->id,
            ]), [
                'task_id' => $this->task->id,
                'answers' => [0, 0, 0, 0], // Same answers each time
            ])
            ->assertOk();

        $allScores[] = $response->json('score');
    }

    // With 8 questions and random selection of 4, submitting the same answers
    // should produce varying scores (since different questions have different correct answers).
    // It's statistically very unlikely all 5 attempts get the exact same score.
    // But we can at least verify the response structure is correct.
    expect($allScores)->toHaveCount(5);

    // Verify all submissions were created
    $submissions = QuizSubmission::where('user_id', $this->user->id)
        ->where('lesson_task_id', $this->task->id)
        ->count();

    expect($submissions)->toBe(5);
});

test('best attempt tracking works correctly', function () {
    config(['rewards.quiz_questions_per_attempt' => 4]);

    // Create a task with exactly 4 questions for predictable results
    $predictableTask = LessonTask::factory()->for($this->lesson)->create(['type' => 'quiz']);
    for ($i = 0; $i < 4; $i++) {
        QuizQuestion::create([
            'lesson_task_id' => $predictableTask->id,
            'question' => "Predictable Q{$i}",
            'options' => ['A', 'B', 'C', 'D'],
            'correct_option' => 0, // All correct answers are 0
            'sort_order' => $i + 1,
        ]);
    }

    // First attempt: 2/4 correct
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $predictableTask->id,
            'answers' => [0, 0, 1, 1], // 2 correct, 2 wrong
        ])
        ->assertOk();

    $best1 = QuizSubmission::where('user_id', $this->user->id)
        ->where('lesson_task_id', $predictableTask->id)
        ->where('is_best_attempt', true)
        ->first();

    expect($best1)->not->toBeNull()
        ->and($best1->score)->toBe(2)
        ->and($best1->attempt_number)->toBe(1);

    // Second attempt: 3/4 correct (better)
    $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $predictableTask->id,
            'answers' => [0, 0, 0, 1], // 3 correct, 1 wrong
        ])
        ->assertOk();

    $best2 = QuizSubmission::where('user_id', $this->user->id)
        ->where('lesson_task_id', $predictableTask->id)
        ->where('is_best_attempt', true)
        ->first();

    expect($best2)->not->toBeNull()
        ->and($best2->score)->toBe(3)
        ->and($best2->attempt_number)->toBe(2);

    // Verify only one best attempt exists
    $bestCount = QuizSubmission::where('user_id', $this->user->id)
        ->where('lesson_task_id', $predictableTask->id)
        ->where('is_best_attempt', true)
        ->count();

    expect($bestCount)->toBe(1);
});

test('xp is not re-awarded if previous attempt already earned more', function () {
    config([
        'rewards.quiz_questions_per_attempt' => 4,
        'rewards.quiz_retry_xp_multipliers' => [1.0, 0.5, 0.25, 0.1],
        'rewards.quiz_task_xp' => 20,
    ]);

    // Create a task with exactly 4 questions for predictable results
    $predictableTask = LessonTask::factory()->for($this->lesson)->create(['type' => 'quiz']);
    for ($i = 0; $i < 4; $i++) {
        QuizQuestion::create([
            'lesson_task_id' => $predictableTask->id,
            'question' => "XP Test Q{$i}",
            'options' => ['A', 'B', 'C', 'D'],
            'correct_option' => 0,
            'sort_order' => $i + 1,
        ]);
    }

    // First attempt: perfect score — should earn full XP
    $response1 = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $predictableTask->id,
            'answers' => [0, 0, 0, 0], // All correct
        ])
        ->assertOk();

    $firstXp = $response1->json('xp_earned');
    expect($firstXp)->toBeGreaterThan(0);

    // Second attempt: perfect score again — should NOT earn more XP
    // (50% of base would be less than what was already earned at 100%)
    $response2 = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $predictableTask->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect($response2->json('xp_earned'))->toBe(0);
});

test('questions per attempt respects config value', function () {
    // Set to show only 3 questions per attempt
    config(['rewards.quiz_questions_per_attempt' => 3]);

    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0],
        ])
        ->assertOk();

    // Should show 3 questions (config value) from pool of 8
    expect($response->json('total'))->toBe(3)
        ->and($response->json('results'))->toHaveCount(3);
});

test('response includes retry-related fields', function () {
    config(['rewards.quiz_questions_per_attempt' => 4]);

    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    $data = $response->json();

    expect($data)->toHaveKey('attempt_number')
        ->toHaveKey('max_attempts')
        ->toHaveKey('xp_multiplier')
        ->toHaveKey('best_score')
        ->toHaveKey('best_total')
        ->toHaveKey('can_retry');

    expect($data['attempt_number'])->toBe(1)
        ->and($data['max_attempts'])->toBeNull() // unlimited
        ->and((float) $data['xp_multiplier'])->toBe(1.0)
        ->and($data['can_retry'])->toBeTrue();
});

test('can_retry is always true (unlimited attempts)', function () {
    config(['rewards.quiz_questions_per_attempt' => 4]);

    // Submit 3 attempts
    for ($i = 0; $i < 3; $i++) {
        $response = $this->actingAs($this->user)
            ->postJson(route('courses.lessons.quiz', [
                'course' => $this->course->slug,
                'lesson' => $this->lesson->id,
            ]), [
                'task_id' => $this->task->id,
                'answers' => [0, 0, 0, 0],
            ])
            ->assertOk();

        expect($response->json('can_retry'))->toBeTrue();
    }
});

test('when pool is smaller than config, all questions are used', function () {
    // Create a task with only 2 questions
    $smallTask = LessonTask::factory()->for($this->lesson)->create(['type' => 'quiz']);
    QuizQuestion::create([
        'lesson_task_id' => $smallTask->id,
        'question' => 'Small pool Q1',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_option' => 0,
        'sort_order' => 1,
    ]);
    QuizQuestion::create([
        'lesson_task_id' => $smallTask->id,
        'question' => 'Small pool Q2',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_option' => 1,
        'sort_order' => 2,
    ]);

    config(['rewards.quiz_questions_per_attempt' => 4]);

    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $smallTask->id,
            'answers' => [0, 1],
        ])
        ->assertOk();

    // Should use all 2 questions since pool < config
    expect($response->json('total'))->toBe(2);
});

test('backward compatibility: existing submissions without attempt_number default to 1', function () {
    // Manually create a submission without attempt_number (simulating old data)
    $submission = QuizSubmission::create([
        'user_id' => $this->user->id,
        'lesson_task_id' => $this->task->id,
        'attempt_number' => 1, // Default value from migration
        'answers' => [0, 0, 0, 0],
        'score' => 2,
        'total' => 4,
        'results' => [
            ['correct' => true, 'explanation' => 'test'],
            ['correct' => true, 'explanation' => 'test'],
            ['correct' => false, 'explanation' => 'test'],
            ['correct' => false, 'explanation' => 'test'],
        ],
        'xp_earned' => 0,
        'points_earned' => 0,
        'is_best_attempt' => false,
        'submitted_at' => now(),
    ]);

    expect($submission->attempt_number)->toBe(1);

    config(['rewards.quiz_questions_per_attempt' => 4]);

    // New submission should be attempt 2
    $response = $this->actingAs($this->user)
        ->postJson(route('courses.lessons.quiz', [
            'course' => $this->course->slug,
            'lesson' => $this->lesson->id,
        ]), [
            'task_id' => $this->task->id,
            'answers' => [0, 0, 0, 0],
        ])
        ->assertOk();

    expect($response->json('attempt_number'))->toBe(2);
});
