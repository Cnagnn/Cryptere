<?php

use App\Models\QuizQuestion;
use App\Models\User;
use App\Services\AdaptiveQuestionService;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->service = new AdaptiveQuestionService;
});

test('getTargetDifficulty returns ability plus offset', function () {
    $user = new User;
    $user->ability_estimate = 0.5;

    expect($this->service->getTargetDifficulty($user))->toBe(0.55);
});

test('getTargetDifficulty defaults to 0.5 when null', function () {
    $user = new User;
    $user->ability_estimate = null;

    expect($this->service->getTargetDifficulty($user))->toBe(0.55);
});

test('getTargetDifficulty clamps to max 1.0', function () {
    $user = new User;
    $user->ability_estimate = 0.99;

    expect($this->service->getTargetDifficulty($user))->toBeLessThanOrEqual(1.0);
});

test('getAdjustedTimeLimit gives more time to low ability users', function () {
    $user = new User;
    $user->ability_estimate = 0.1;

    $time = $this->service->getAdjustedTimeLimit($user, 30);

    expect($time)->toBeGreaterThan(30);
});

test('getAdjustedTimeLimit gives less time to high ability users', function () {
    $user = new User;
    $user->ability_estimate = 0.9;

    $time = $this->service->getAdjustedTimeLimit($user, 30);

    expect($time)->toBeLessThan(30);
});

test('getAdjustedTimeLimit gives base time to average user', function () {
    $user = new User;
    $user->ability_estimate = 0.5;

    $time = $this->service->getAdjustedTimeLimit($user, 30);

    // 0.5 ability → multiplier ~1.1, so ~33
    expect($time)->toBeGreaterThanOrEqual(28)->toBeLessThanOrEqual(35);
});

test('getAdjustedTimeLimit clamps multiplier range', function () {
    $lowUser = new User;
    $lowUser->ability_estimate = 0.0;

    $highUser = new User;
    $highUser->ability_estimate = 1.0;

    $lowTime = $this->service->getAdjustedTimeLimit($lowUser, 30);
    $highTime = $this->service->getAdjustedTimeLimit($highUser, 30);

    // Max 1.5x = 45, Min 0.7x = 21
    expect($lowTime)->toBeLessThanOrEqual(45)
        ->and($highTime)->toBeGreaterThanOrEqual(21);
});

test('updateUserAbility uses exponential moving average', function () {
    $user = User::factory()->create(['ability_estimate' => 0.5]);

    $this->service->updateUserAbility($user, 0.8);

    $user->refresh();
    // 0.7 * 0.5 + 0.3 * 0.8 = 0.35 + 0.24 = 0.59
    expect($user->ability_estimate)->toBe(0.59);
});

test('updateUserAbility clamps to valid range', function () {
    $user = User::factory()->create(['ability_estimate' => 0.9]);

    $this->service->updateUserAbility($user, 1.5); // exceeds 1.0, clamped to 1.0

    $user->refresh();
    // 0.7 * 0.9 + 0.3 * 1.0 = 0.63 + 0.30 = 0.93
    expect($user->ability_estimate)->toBe(0.93);
});

test('updateQuestionStats persists counters and recalculates difficulty in a single query', function () {
    $question = QuizQuestion::factory()->create([
        'times_shown' => 2,
        'times_correct' => 1,
        'difficulty_score' => 0.5,
    ]);

    DB::enableQueryLog();

    $this->service->updateQuestionStats($question, true);

    $queryCount = count(DB::getQueryLog());
    DB::disableQueryLog();

    $question->refresh();

    expect($question->times_shown)->toBe(3)
        ->and($question->times_correct)->toBe(2)
        ->and($question->difficulty_score)->toBe(0.3333)
        ->and($queryCount)->toBeLessThanOrEqual(1);
});
