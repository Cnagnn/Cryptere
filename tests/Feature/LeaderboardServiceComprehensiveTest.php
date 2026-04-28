<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\CacheService;
use App\Services\LeaderboardService;
use Illuminate\Support\Facades\Cache;

beforeEach(function () {
    $this->service = new LeaderboardService;
});

// ============================================================
// resolvePerPage — Positive Scenarios
// ============================================================

test('resolves valid per page values', function () {
    expect($this->service->resolvePerPage(10))->toBe(10)
        ->and($this->service->resolvePerPage(25))->toBe(25)
        ->and($this->service->resolvePerPage(50))->toBe(50)
        ->and($this->service->resolvePerPage(100))->toBe(100);
});

// ============================================================
// resolvePerPage — Negative Scenarios
// ============================================================

test('defaults to 10 for invalid per page values', function () {
    expect($this->service->resolvePerPage(0))->toBe(10)
        ->and($this->service->resolvePerPage(15))->toBe(10)
        ->and($this->service->resolvePerPage(-1))->toBe(10)
        ->and($this->service->resolvePerPage(999))->toBe(10);
});

// ============================================================
// resolveTimeframe — Positive Scenarios
// ============================================================

test('resolves valid timeframe values', function () {
    expect($this->service->resolveTimeframe('weekly'))->toBe('weekly')
        ->and($this->service->resolveTimeframe('monthly'))->toBe('monthly')
        ->and($this->service->resolveTimeframe('all'))->toBe('all');
});

// ============================================================
// resolveTimeframe — Negative Scenarios
// ============================================================

test('defaults to all for invalid timeframe values', function () {
    expect($this->service->resolveTimeframe('daily'))->toBe('all')
        ->and($this->service->resolveTimeframe(''))->toBe('all')
        ->and($this->service->resolveTimeframe('yearly'))->toBe('all')
        ->and($this->service->resolveTimeframe('invalid'))->toBe('all');
});

// ============================================================
// allTimeLeaders — Positive Scenarios
// ============================================================

test('returns users ordered by points descending', function () {
    User::factory()->create(['points' => 100, 'name' => 'Alice']);
    User::factory()->create(['points' => 300, 'name' => 'Bob']);
    User::factory()->create(['points' => 200, 'name' => 'Charlie']);

    $leaders = $this->service->allTimeLeaders(10);

    expect($leaders->items())->toHaveCount(3)
        ->and($leaders->items()[0]->name)->toBe('Bob')
        ->and($leaders->items()[1]->name)->toBe('Charlie')
        ->and($leaders->items()[2]->name)->toBe('Alice');
});

test('paginates results correctly', function () {
    User::factory()->count(15)->create(['points' => 100]);

    $page1 = $this->service->allTimeLeaders(10);

    expect($page1->items())->toHaveCount(10)
        ->and($page1->total())->toBe(15);
});

test('returns empty paginator when no users', function () {
    $leaders = $this->service->allTimeLeaders(10);

    expect($leaders->items())->toHaveCount(0);
});

// ============================================================
// allTimeLeaders — Tie-breaking
// ============================================================

test('breaks ties by name alphabetically', function () {
    User::factory()->create(['points' => 100, 'name' => 'Zara']);
    User::factory()->create(['points' => 100, 'name' => 'Alice']);

    $leaders = $this->service->allTimeLeaders(10);

    expect($leaders->items()[0]->name)->toBe('Alice')
        ->and($leaders->items()[1]->name)->toBe('Zara');
});

// ============================================================
// getUserPoints — Positive Scenarios
// ============================================================

test('returns all-time points for all timeframe', function () {
    $user = User::factory()->create(['points' => 500]);

    $points = $this->service->getUserPoints($user, 'all');

    expect($points)->toBe(500);
});

test('returns zero points for user with no activity in timeframe', function () {
    $user = User::factory()->create(['points' => 500]);

    $points = $this->service->getUserPoints($user, 'weekly');

    expect($points)->toBe(0);
});

test('calculates weekly points from challenge submissions', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 10,
        'submitted_at' => now()->subDay(),
    ]);

    $points = $this->service->getUserPoints($user, 'weekly');

    expect($points)->toBe(110); // 100 + 10
});

test('excludes incorrect submissions from points', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
        'score' => 100,
        'submitted_at' => now()->subDay(),
    ]);

    $points = $this->service->getUserPoints($user, 'weekly');

    expect($points)->toBe(0);
});

test('includes lesson completion points in timeframe', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now()->subDay(),
    ]);

    $lessonXp = (int) config('rewards.lesson_completion_xp', 30);
    $points = $this->service->getUserPoints($user, 'weekly');

    expect($points)->toBe($lessonXp);
});

// ============================================================
// getUserRank — Positive Scenarios
// ============================================================

test('returns correct rank for all-time', function () {
    $user1 = User::factory()->create(['points' => 300]);
    $user2 = User::factory()->create(['points' => 200]);
    $user3 = User::factory()->create(['points' => 100]);

    expect($this->service->getUserRank($user1, 'all'))->toBe(1)
        ->and($this->service->getUserRank($user2, 'all'))->toBe(2)
        ->and($this->service->getUserRank($user3, 'all'))->toBe(3);
});

test('returns zero rank for user with no points', function () {
    $user = User::factory()->create(['points' => 0]);

    $rank = $this->service->getUserRank($user, 'all');

    expect($rank)->toBe(0);
});

// ============================================================
// getTopScore — Positive Scenarios
// ============================================================

test('returns max points for all-time', function () {
    User::factory()->create(['points' => 100]);
    User::factory()->create(['points' => 500]);
    User::factory()->create(['points' => 300]);

    $topScore = $this->service->getTopScore('all');

    expect($topScore)->toBe(500);
});

test('returns zero when no users exist', function () {
    $topScore = $this->service->getTopScore('all');

    expect($topScore)->toBe(0);
});

// ============================================================
// getTop3Users — Positive Scenarios
// ============================================================

test('returns top 3 users for all-time', function () {
    User::factory()->create(['points' => 100, 'name' => 'Third']);
    User::factory()->create(['points' => 300, 'name' => 'First']);
    User::factory()->create(['points' => 200, 'name' => 'Second']);
    User::factory()->create(['points' => 50, 'name' => 'Fourth']);

    $top3 = $this->service->getTop3Users('all');

    expect($top3)->toHaveCount(3)
        ->and($top3[0]->name)->toBe('First')
        ->and($top3[1]->name)->toBe('Second')
        ->and($top3[2]->name)->toBe('Third');
});

test('returns fewer than 3 when not enough users', function () {
    User::factory()->create(['points' => 100]);

    $top3 = $this->service->getTop3Users('all');

    expect($top3)->toHaveCount(1);
});

test('returns empty collection when no users', function () {
    $top3 = $this->service->getTop3Users('all');

    expect($top3)->toHaveCount(0);
});

// ============================================================
// getLeaders — Integration
// ============================================================

test('getLeaders delegates to allTimeLeaders for all timeframe', function () {
    User::factory()->count(3)->create(['points' => 100]);

    $leaders = $this->service->getLeaders('all', 10);

    expect($leaders->total())->toBe(3);
});

test('getLeaders delegates to timeframeLeaders for weekly', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    $leaders = $this->service->getLeaders('weekly', 10);

    expect($leaders->total())->toBeGreaterThanOrEqual(1);
});

// ============================================================
// Constants Validation
// ============================================================

test('valid timeframes constant is correct', function () {
    expect(LeaderboardService::VALID_TIMEFRAMES)->toBe(['weekly', 'monthly', 'all']);
});

test('per page options constant is correct', function () {
    expect(LeaderboardService::PER_PAGE_OPTIONS)->toBe([10, 25, 50, 100]);
});

test('default per page is 10', function () {
    expect(LeaderboardService::PER_PAGE)->toBe(10);
});

// ============================================================
// Caching — timeframeLeaders()
// ============================================================

test('timeframeLeaders caches results for 5 minutes', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    Cache::flush();

    // First call should populate cache
    $leaders1 = $this->service->timeframeLeaders('weekly', 10);
    expect($leaders1->total())->toBeGreaterThanOrEqual(1);

    // Verify cache key exists
    $cacheKey = 'leaderboard_timeframe_weekly_page_1_perpage_10';
    expect(Cache::has($cacheKey))->toBeTrue();

    // Second call should return cached result (same data)
    $leaders2 = $this->service->timeframeLeaders('weekly', 10);
    expect($leaders2->total())->toBe($leaders1->total());
});

test('timeframeLeaders uses different cache keys for different timeframes', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    Cache::flush();

    $this->service->timeframeLeaders('weekly', 10);
    $this->service->timeframeLeaders('monthly', 10);

    expect(Cache::has('leaderboard_timeframe_weekly_page_1_perpage_10'))->toBeTrue()
        ->and(Cache::has('leaderboard_timeframe_monthly_page_1_perpage_10'))->toBeTrue();
});

test('timeframeLeaders uses different cache keys for different perPage values', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    Cache::flush();

    $this->service->timeframeLeaders('weekly', 10);
    $this->service->timeframeLeaders('weekly', 25);

    expect(Cache::has('leaderboard_timeframe_weekly_page_1_perpage_10'))->toBeTrue()
        ->and(Cache::has('leaderboard_timeframe_weekly_page_1_perpage_25'))->toBeTrue();
});

// ============================================================
// Caching — getUserRank() for timeframe queries
// ============================================================

test('getUserRank caches timeframe rank for 2 minutes', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    Cache::flush();

    $rank = $this->service->getUserRank($user, 'weekly');
    expect($rank)->toBe(1);

    // Verify cache key exists
    $cacheKey = "leaderboard_rank_weekly_user_{$user->id}";
    expect(Cache::has($cacheKey))->toBeTrue();
});

test('getUserRank does not cache all-time rank', function () {
    $user = User::factory()->create(['points' => 100]);

    Cache::flush();

    $rank = $this->service->getUserRank($user, 'all');
    expect($rank)->toBe(1);

    // All-time rank should NOT be cached
    $cacheKey = "leaderboard_rank_all_user_{$user->id}";
    expect(Cache::has($cacheKey))->toBeFalse();
});

test('getUserRank tracks user ID for cache invalidation', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    Cache::flush();

    $this->service->getUserRank($user, 'weekly');

    $tracked = Cache::get('leaderboard_rank_tracked_users', []);
    expect($tracked)->toContain($user->id);
});

// ============================================================
// Cache Invalidation
// ============================================================

test('invalidateLeaderboard clears timeframe leaderboard caches', function () {
    Cache::put('leaderboard_timeframe_weekly_page_1_perpage_10', 'cached_data', 300);
    Cache::put('leaderboard_timeframe_monthly_page_1_perpage_10', 'cached_data', 300);
    Cache::put('leaderboard_timeframe_weekly_page_2_perpage_25', 'cached_data', 300);

    CacheService::invalidateLeaderboard();

    expect(Cache::has('leaderboard_timeframe_weekly_page_1_perpage_10'))->toBeFalse()
        ->and(Cache::has('leaderboard_timeframe_monthly_page_1_perpage_10'))->toBeFalse()
        ->and(Cache::has('leaderboard_timeframe_weekly_page_2_perpage_25'))->toBeFalse();
});

test('invalidateLeaderboard clears user rank caches', function () {
    $user = User::factory()->create();

    // Track the user and set rank cache
    CacheService::trackLeaderboardRankUser($user->id);
    Cache::put("leaderboard_rank_weekly_user_{$user->id}", 1, 120);
    Cache::put("leaderboard_rank_monthly_user_{$user->id}", 2, 120);

    CacheService::invalidateLeaderboard();

    expect(Cache::has("leaderboard_rank_weekly_user_{$user->id}"))->toBeFalse()
        ->and(Cache::has("leaderboard_rank_monthly_user_{$user->id}"))->toBeFalse()
        ->and(Cache::has('leaderboard_rank_tracked_users'))->toBeFalse();
});

test('invalidateLeaderboard clears top score caches', function () {
    Cache::put('leaderboard_top_weekly', 500, 300);
    Cache::put('leaderboard_top_monthly', 1000, 300);

    CacheService::invalidateLeaderboard();

    expect(Cache::has('leaderboard_top_weekly'))->toBeFalse()
        ->and(Cache::has('leaderboard_top_monthly'))->toBeFalse();
});

test('invalidateAll also clears leaderboard caches', function () {
    Cache::put('leaderboard_timeframe_weekly_page_1_perpage_10', 'cached_data', 300);
    Cache::put('leaderboard_top_weekly', 500, 300);

    CacheService::invalidateAll();

    expect(Cache::has('leaderboard_timeframe_weekly_page_1_perpage_10'))->toBeFalse()
        ->and(Cache::has('leaderboard_top_weekly'))->toBeFalse();
});

// ============================================================
// Indexes — Queries still work correctly
// ============================================================

test('timeframeLeaders returns correct results with indexes', function () {
    $user1 = User::factory()->create(['name' => 'Alice']);
    $user2 = User::factory()->create(['name' => 'Bob']);
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user1->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 200,
        'streak_bonus' => 10,
        'submitted_at' => now()->subDay(),
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user2->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 5,
        'submitted_at' => now()->subDay(),
    ]);

    // Incorrect submission should be excluded
    ChallengeSubmission::factory()->create([
        'user_id' => $user2->id,
        'challenge_id' => $challenge->id,
        'is_correct' => false,
        'score' => 500,
        'submitted_at' => now()->subDay(),
    ]);

    Cache::flush();

    $leaders = $this->service->timeframeLeaders('weekly', 10);

    expect($leaders->total())->toBe(2)
        ->and($leaders->items()[0]->name)->toBe('Alice')
        ->and($leaders->items()[1]->name)->toBe('Bob');
});

test('getUserRank returns correct rank with indexes for timeframe queries', function () {
    $user1 = User::factory()->create(['name' => 'Alice']);
    $user2 = User::factory()->create(['name' => 'Bob']);
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user1->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 200,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user2->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 100,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDay(),
    ]);

    Cache::flush();

    expect($this->service->getUserRank($user1, 'weekly'))->toBe(1)
        ->and($this->service->getUserRank($user2, 'weekly'))->toBe(2);
});

test('getUserPoints returns correct points with indexes for timeframe queries', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 150,
        'streak_bonus' => 25,
        'submitted_at' => now()->subDay(),
    ]);

    // Old submission outside weekly window
    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'score' => 999,
        'streak_bonus' => 0,
        'submitted_at' => now()->subDays(10),
    ]);

    $points = $this->service->getUserPoints($user, 'weekly');

    expect($points)->toBe(175); // 150 + 25, excludes old submission
});
