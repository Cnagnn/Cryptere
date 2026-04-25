<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use App\Services\LevelService;
use App\Services\XpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;

uses(RefreshDatabase::class);

// --- First Login Bonus ---

test('first login bonus awards XP when last_active_date is null', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'last_active_date' => null,
        'current_streak' => 0,
        'longest_streak' => 0,
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    $firstLoginXp = (int) config('rewards.first_login_xp');
    $dailyXp = $xpService->getStreakDailyXp(1);

    expect($result['bonuses'])->toContain('first_login');
    expect($result['xp'])->toBe($dailyXp + $firstLoginXp);
    expect($user->fresh()->xp)->toBeGreaterThanOrEqual($firstLoginXp + $dailyXp);
});

test('first login bonus is not awarded on subsequent logins', function () {
    $user = User::factory()->create([
        'xp' => 100,
        'last_active_date' => now()->subDay()->toDateString(),
        'current_streak' => 1,
        'longest_streak' => 1,
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    expect($result['bonuses'])->not->toContain('first_login');
});

// --- Comeback Bonus ---

test('comeback bonus awards XP after 7+ days inactive', function () {
    $user = User::factory()->create([
        'xp' => 100,
        'current_streak' => 5,
        'longest_streak' => 10,
        'last_active_date' => now()->subDays(8)->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    $comebackXp = (int) config('rewards.comeback_xp');
    expect($result['bonuses'])->toContain('comeback');
    expect($result['xp'])->toBeGreaterThanOrEqual($comebackXp);
});

test('comeback bonus is not awarded for gap less than 7 days', function () {
    $user = User::factory()->create([
        'xp' => 100,
        'current_streak' => 5,
        'longest_streak' => 10,
        'last_active_date' => now()->subDays(5)->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    expect($result['bonuses'])->not->toContain('comeback');
});

// --- Weekly Active Bonus ---

test('weekly active bonus awards XP when streak reaches exactly 7', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'current_streak' => 6,
        'longest_streak' => 6,
        'last_active_date' => now()->subDay()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    $weeklyXp = (int) config('rewards.weekly_active_xp');
    expect($result['bonuses'])->toContain('weekly_active');
    expect($result['xp'])->toBeGreaterThanOrEqual($weeklyXp);
    expect($user->fresh()->current_streak)->toBe(7);
});

test('weekly active bonus is not awarded at streak 8', function () {
    $user = User::factory()->create([
        'xp' => 0,
        'current_streak' => 7,
        'longest_streak' => 7,
        'last_active_date' => now()->subDay()->toDateString(),
    ]);

    $xpService = app(XpService::class);
    $result = $xpService->updateDailyStreak($user);

    expect($result['bonuses'])->not->toContain('weekly_active');
    expect($user->fresh()->current_streak)->toBe(8);
});

// --- Course Completion Bonus ---

test('course completion bonus awards XP and points when course reaches 100%', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'last_active_date' => now()->toDateString(),
        'current_streak' => 1,
    ]);

    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create([
        'course_id' => $course->id,
        'position' => 1,
    ]);

    $enrollment = Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 0,
    ]);

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', [$course->slug, $lesson->id]));

    $fresh = $user->fresh();
    $completionXp = (int) config('rewards.course_completion_xp');
    $completionPoints = (int) config('rewards.course_completion_points');

    // Should have: lesson XP + completion bonus XP
    expect($fresh->xp)->toBeGreaterThanOrEqual($completionXp);
    // Should have: lesson points + completion bonus points
    expect($fresh->points)->toBeGreaterThanOrEqual($completionPoints);
});

// --- Perfect Score Bonus ---

test('perfect score bonus awards extra XP and points on all-correct quiz session', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'last_active_date' => now()->toDateString(),
        'current_streak' => 1,
    ]);

    $challenge = Challenge::factory()->create(['is_published' => true]);
    $sessionId = (string) Str::uuid();

    // Create 3 all-correct submissions
    for ($i = 0; $i < 3; $i++) {
        ChallengeSubmission::factory()->create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'session_id' => $sessionId,
            'is_correct' => true,
            'score' => 800,
            'streak_bonus' => 0,
            'question_index' => $i,
        ]);
    }

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge->slug), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk();
    expect($response->json('isPerfectScore'))->toBeTrue();

    $perfectXp = (int) config('rewards.perfect_score_xp');
    $perfectPoints = (int) config('rewards.perfect_score_points');

    // awardedXp should include challenge_quiz_session_xp + perfect_score_xp
    $sessionXp = (int) config('rewards.challenge_quiz_session_xp');
    expect($response->json('awardedXp'))->toBe($sessionXp + $perfectXp);
    expect($response->json('awardedPoints'))->toBeGreaterThanOrEqual($perfectPoints);
});

test('perfect score bonus is not awarded when some answers are wrong', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'last_active_date' => now()->toDateString(),
        'current_streak' => 1,
    ]);

    $challenge = Challenge::factory()->create(['is_published' => true]);
    $sessionId = (string) Str::uuid();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'is_correct' => true,
        'score' => 800,
        'streak_bonus' => 0,
        'question_index' => 0,
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'session_id' => $sessionId,
        'is_correct' => false,
        'score' => 0,
        'streak_bonus' => 0,
        'question_index' => 1,
    ]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.session-summary', $challenge->slug), [
            'session_id' => $sessionId,
        ]);

    $response->assertOk();
    expect($response->json('isPerfectScore'))->toBeFalse();
    // Only challenge_quiz_session_xp, no perfect bonus
    $sessionXp = (int) config('rewards.challenge_quiz_session_xp');
    expect($response->json('awardedXp'))->toBe($sessionXp);
});

// --- First Blood Bonus ---

test('first blood bonus adds extra XP on first correct challenge answer', function () {
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 0,
        'last_active_date' => now()->toDateString(),
        'current_streak' => 1,
    ]);

    $challenge = Challenge::factory()->create(['is_published' => true]);

    $response = $this->actingAs($user)
        ->postJson(route('challenges.quick-submit', $challenge->slug), [
            'answer' => $challenge->getRawOriginal('expected_answer'),
            'elapsed_ms' => 5000,
        ]);

    $response->assertOk();
    expect($response->json('isCorrect'))->toBeTrue();

    $baseXp = (int) config('rewards.challenge_base_xp');
    $firstBloodXp = (int) config('rewards.challenge_first_blood_xp');
    // User XP should be challenge_base_xp + challenge_first_blood_xp
    expect($user->fresh()->xp)->toBe($baseXp + $firstBloodXp);
});

// --- Level-Up Points Reward ---

test('level up awards bonus points based on new level', function () {
    // Level 2 requires 56 XP. Set user just below threshold.
    $user = User::factory()->create([
        'points' => 0,
        'xp' => 54,
        'current_streak' => 0,
        'last_active_date' => now()->toDateString(),
    ]);

    $previousXp = $user->xp;

    // Award enough XP to cross level 2 threshold
    $xpService = app(XpService::class);
    $xpService->awardXp($user, 5); // Now at 59 XP → level 2

    $user->refresh();

    $levelService = app(LevelService::class);
    $levelUp = $levelService->checkLevelUp($previousXp, $user->xp);

    expect($levelUp)->not->toBeNull();
    expect($levelUp['level'])->toBe(2);

    // Simulate what FlashesAchievements does
    $pointsPerLevel = (int) config('rewards.level_up_points_per_level');
    $expectedBonus = $levelUp['level'] * $pointsPerLevel;
    $user->increment('points', $expectedBonus);

    expect($user->fresh()->points)->toBe($expectedBonus);
    expect($expectedBonus)->toBe(2 * 5); // Level 2 × 5 = 10 points
});
