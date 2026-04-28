<?php

use App\Models\Badge;
use App\Models\Certificate;
use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\QuizSubmission;
use App\Models\User;
use App\Services\Dashboard\AdminAnalyticsService;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    Cache::flush();
    $this->service = new AdminAnalyticsService;
});

// ─── getCohortRetention ──────────────────────────────────────────────

it('returns empty array when no users exist', function () {
    $result = $this->service->getCohortRetention();

    expect($result)->toBeArray()->toBeEmpty();
});

it('returns cohort retention data for users created within the window', function () {
    // Create users in the current week
    User::factory()->count(3)->create([
        'created_at' => now()->startOfWeek(),
        'last_active_date' => now(),
    ]);

    $result = $this->service->getCohortRetention(8);

    expect($result)->toBeArray()
        ->not->toBeEmpty();

    $cohort = $result[0];
    expect($cohort)->toHaveKeys(['cohort_week', 'signup_count', 'retention'])
        ->and($cohort['signup_count'])->toBe(3)
        ->and($cohort['retention'])->toBeArray()
        ->and($cohort['retention'])->toHaveKey('week_0');
});

it('calculates retention percentage correctly', function () {
    $weekStart = now()->startOfWeek();

    // 2 users signed up this week, both active
    User::factory()->count(2)->create([
        'created_at' => $weekStart,
        'last_active_date' => $weekStart,
    ]);

    $result = $this->service->getCohortRetention(8);

    $cohort = $result[0];
    // week_0 retention should be 100% since both users are active in signup week
    expect($cohort['retention']['week_0'])->toBe(100.0);
});

it('respects the weeks parameter', function () {
    User::factory()->create([
        'created_at' => now()->subWeeks(2),
        'last_active_date' => now(),
    ]);

    $result = $this->service->getCohortRetention(4);

    expect($result)->not->toBeEmpty();

    $cohort = $result[0];
    // Should have retention keys for 4 weeks (week_0 through week_3)
    expect($cohort['retention'])->toHaveKeys(['week_0', 'week_1', 'week_2', 'week_3'])
        ->and($cohort['retention'])->not->toHaveKey('week_4');
});

it('caches cohort retention results', function () {
    User::factory()->create([
        'created_at' => now(),
        'last_active_date' => now(),
    ]);

    $first = $this->service->getCohortRetention();

    // Create more users — should not affect cached result
    User::factory()->count(5)->create([
        'created_at' => now(),
        'last_active_date' => now(),
    ]);

    $second = $this->service->getCohortRetention();

    expect($second)->toBe($first);
});

// ─── getGamificationFunnel ───────────────────────────────────────────

it('returns correct funnel structure with zero users', function () {
    $result = $this->service->getGamificationFunnel();

    expect($result)->toBeArray()->toHaveCount(6);

    $stages = array_column($result, 'stage');
    expect($stages)->toBe([
        'Registered',
        'Enrolled',
        'Completed Lesson',
        'Completed Quiz',
        'Solved Challenge',
        'Earned Certificate',
    ]);

    // All counts should be 0
    foreach ($result as $stage) {
        expect($stage['count'])->toBe(0);
    }
});

it('calculates funnel percentages correctly with data', function () {
    $users = User::factory()->count(10)->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->for($course)->create();
    $challenge = Challenge::factory()->create();

    // 8 users enrolled
    foreach ($users->take(8) as $user) {
        Enrollment::factory()->create(['user_id' => $user->id, 'course_id' => $course->id]);
    }

    // 6 users completed a lesson
    foreach ($users->take(6) as $user) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    // 4 users completed a quiz
    foreach ($users->take(4) as $user) {
        QuizSubmission::factory()->create([
            'user_id' => $user->id,
            'submitted_at' => now(),
        ]);
    }

    // 3 users solved a challenge
    foreach ($users->take(3) as $user) {
        ChallengeSubmission::factory()->create([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
            'is_correct' => true,
            'submitted_at' => now(),
        ]);
    }

    // 2 users earned a certificate
    foreach ($users->take(2) as $user) {
        Certificate::factory()->create([
            'user_id' => $user->id,
            'course_id' => $course->id,
        ]);
    }

    $result = $this->service->getGamificationFunnel();

    expect($result[0]['count'])->toBe(10)  // Registered
        ->and($result[0]['percentage'])->toBe(100)
        ->and($result[1]['count'])->toBe(8)  // Enrolled
        ->and($result[1]['percentage'])->toBe(80.0)
        ->and($result[2]['count'])->toBe(6)  // Completed Lesson
        ->and($result[2]['percentage'])->toBe(60.0)
        ->and($result[3]['count'])->toBe(4)  // Completed Quiz
        ->and($result[3]['percentage'])->toBe(40.0)
        ->and($result[4]['count'])->toBe(3)  // Solved Challenge
        ->and($result[4]['percentage'])->toBe(30.0)
        ->and($result[5]['count'])->toBe(2)  // Earned Certificate
        ->and($result[5]['percentage'])->toBe(20.0);
});

it('handles funnel with only registered users', function () {
    User::factory()->count(5)->create();

    $result = $this->service->getGamificationFunnel();

    expect($result[0]['count'])->toBe(5)
        ->and($result[0]['percentage'])->toBe(100);

    // All other stages should be 0
    for ($i = 1; $i < 6; $i++) {
        expect($result[$i]['count'])->toBe(0)
            ->and($result[$i]['percentage'])->toBe(0.0);
    }
});

it('caches gamification funnel results', function () {
    User::factory()->count(3)->create();

    $first = $this->service->getGamificationFunnel();

    User::factory()->count(5)->create();

    $second = $this->service->getGamificationFunnel();

    expect($second)->toBe($first);
});

// ─── getEconomyHealth ────────────────────────────────────────────────

it('returns economy health metrics with no data', function () {
    // Create at least one user so max(1, count) works
    User::factory()->create();

    $result = $this->service->getEconomyHealth();

    expect($result)->toHaveKeys([
        'total_xp_awarded_today',
        'avg_xp_per_user',
        'avg_points_per_user',
        'median_streak',
        'users_with_streak',
        'total_badges_earned',
        'avg_badges_per_user',
        'top_badge',
    ]);
});

it('calculates economy health metrics correctly', function () {
    $users = User::factory()->count(4)->create([
        'xp' => 100,
        'points' => 200,
        'daily_xp_earned' => 50,
        'current_streak' => 5,
    ]);

    $badge = Badge::factory()->create();
    foreach ($users->take(3) as $user) {
        $user->badges()->attach($badge->id, ['earned_at' => now()]);
    }

    $result = $this->service->getEconomyHealth();

    expect($result['total_xp_awarded_today'])->toBe(200) // 4 * 50
        ->and($result['avg_xp_per_user'])->toBe(100)
        ->and($result['avg_points_per_user'])->toBe(200)
        ->and($result['users_with_streak'])->toBe(4)
        ->and($result['total_badges_earned'])->toBe(3)
        ->and($result['avg_badges_per_user'])->toBe(0.8) // 3/4 rounded to 1 decimal
        ->and($result['top_badge'])->not->toBeNull()
        ->and($result['top_badge']->name)->toBe($badge->name);
});

it('handles economy health with zero streak users', function () {
    User::factory()->count(3)->create([
        'current_streak' => 0,
    ]);

    $result = $this->service->getEconomyHealth();

    expect($result['users_with_streak'])->toBe(0)
        ->and($result['median_streak'])->toBe(0);
});

it('returns null top badge when no badges earned', function () {
    User::factory()->create();

    $result = $this->service->getEconomyHealth();

    expect($result['top_badge'])->toBeNull()
        ->and($result['total_badges_earned'])->toBe(0);
});

it('caches economy health results', function () {
    User::factory()->create(['xp' => 100]);

    $first = $this->service->getEconomyHealth();

    User::factory()->create(['xp' => 500]);

    $second = $this->service->getEconomyHealth();

    expect($second)->toEqual($first);
});

it('identifies the most popular badge as top badge', function () {
    $users = User::factory()->count(5)->create();
    $badgeA = Badge::factory()->create(['name' => 'Popular Badge']);
    $badgeB = Badge::factory()->create(['name' => 'Rare Badge']);

    // 4 users earn badgeA
    foreach ($users->take(4) as $user) {
        $user->badges()->attach($badgeA->id, ['earned_at' => now()]);
    }

    // 1 user earns badgeB
    $users->first()->badges()->attach($badgeB->id, ['earned_at' => now()]);

    $result = $this->service->getEconomyHealth();

    expect($result['top_badge']->name)->toBe('Popular Badge')
        ->and($result['top_badge']->earn_count)->toBe(4);
});
