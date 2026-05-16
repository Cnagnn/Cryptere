<?php

namespace App\Services;

use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Sentry\SentrySdk;
use Sentry\Tracing\SpanContext;

class LeaderboardService
{
    public const PER_PAGE = 10;

    public const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    public const VALID_TIMEFRAMES = ['weekly', 'monthly', 'all'];

    /**
     * Resolve a validated per-page value.
     */
    public function resolvePerPage(int $requested): int
    {
        return in_array($requested, self::PER_PAGE_OPTIONS, true)
            ? $requested
            : self::PER_PAGE;
    }

    /**
     * Resolve a validated timeframe value.
     */
    public function resolveTimeframe(string $requested): string
    {
        return in_array($requested, self::VALID_TIMEFRAMES, true)
            ? $requested
            : 'all';
    }

    /**
     * All-time leaderboard (original behavior).
     */
    public function allTimeLeaders(int $perPage): LengthAwarePaginator
    {
        return User::query()
            ->orderByDesc('points')
            ->orderBy('name')
            ->paginate($perPage, ['id', 'name', 'username', 'points', 'xp', 'current_streak', 'longest_streak', 'avatar_path', 'avatar_image', 'avatar_mime_type'])
            ->withQueryString();
    }

    /**
     * Timeframe-based leaderboard using aggregated points from recent activity.
     * Results are cached for 5 minutes keyed by timeframe and perPage (not page number).
     */
    public function timeframeLeaders(string $timeframe, int $perPage): LengthAwarePaginator
    {
        $page = request()->input('page', 1);
        // Cache key based on timeframe and perPage only (not page number)
        $cacheKey = "leaderboard_timeframe_{$timeframe}_page_1_perpage_{$perPage}";

        $results = Cache::remember($cacheKey, 300, function () use ($timeframe) {
            $since = $this->resolveSinceDate($timeframe);

            return $this->periodPointsQuery($since)
                ->whereRaw('(COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) > 0')
                ->orderByDesc('period_points')
                ->orderBy('name')
                ->get(['users.*']);
        });

        // Paginate the cached collection without re-running the query
        return new \Illuminate\Pagination\LengthAwarePaginator(
            $results->forPage($page, $perPage),
            $results->count(),
            $perPage,
            $page,
            [
                'path' => request()->url(),
                'query' => request()->query(),
            ]
        );
    }

    /**
     * Get paginated leaders for any timeframe.
     */
    public function getLeaders(string $timeframe, int $perPage): LengthAwarePaginator
    {
        return $this->traceSpan('leaderboard.get_leaders', "Get leaders ({$timeframe})", function () use ($timeframe, $perPage) {
            return $timeframe === 'all'
                ? $this->allTimeLeaders($perPage)
                : $this->timeframeLeaders($timeframe, $perPage);
        });
    }

    /**
     * Get the top score for a given timeframe.
     */
    public function getTopScore(string $timeframe): int
    {
        if ($timeframe === 'all') {
            return (int) User::query()->max('points');
        }

        $since = $this->resolveSinceDate($timeframe);

        return (int) Cache::remember("leaderboard_top_{$timeframe}", 300, function () use ($since): int {
            $challengeMax = (int) DB::table('challenge_submissions')
                ->select(DB::raw('SUM(score + COALESCE(streak_bonus, 0)) as total'))
                ->where('is_correct', true)
                ->where('submitted_at', '>=', $since)
                ->groupBy('user_id')
                ->orderByDesc('total')
                ->value('total');

            return max($challengeMax, 0);
        });
    }

    /**
     * Get a user's points for a given timeframe.
     */
    public function getUserPoints(User $user, string $timeframe): int
    {
        if ($timeframe === 'all') {
            return $user->points;
        }

        $since = $this->resolveSinceDate($timeframe);

        $challengePoints = (int) DB::table('challenge_submissions')
            ->where('user_id', $user->id)
            ->where('is_correct', true)
            ->where('submitted_at', '>=', $since)
            ->sum(DB::raw('score + COALESCE(streak_bonus, 0)'));

        $lessonXpPerLesson = (int) config('rewards.lesson_completion_xp', 30);
        $completedLessonCount = (int) DB::table('lesson_progress')
            ->where('lesson_progress.user_id', $user->id)
            ->whereNotNull('lesson_progress.completed_at')
            ->where('lesson_progress.completed_at', '>=', $since)
            ->count();

        return $challengePoints + ($completedLessonCount * $lessonXpPerLesson);
    }

    /**
     * Get a user's rank for a given timeframe.
     * Timeframe-based ranks are cached for 2 minutes.
     */
    public function getUserRank(User $user, string $timeframe): int
    {
        $userPoints = $this->getUserPoints($user, $timeframe);

        if ($userPoints <= 0) {
            return 0;
        }

        if ($timeframe === 'all') {
            return User::query()->where('points', '>', $user->points)->count() + 1;
        }

        $cacheKey = "leaderboard_rank_{$timeframe}_user_{$user->id}";
        CacheService::trackLeaderboardRankUser($user->id);

        return (int) Cache::remember($cacheKey, 120, function () use ($user, $timeframe, $userPoints) {
            $since = $this->resolveSinceDate($timeframe);

            return (int) $this->periodPointsQuery($since)
                ->whereRaw('(COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) > ?', [$userPoints])
                ->where('users.id', '!=', $user->id)
                ->count() + 1;
        });
    }

    /**
     * Get current user's leaderboard standing with fewer aggregate queries.
     *
     * @return array{points: int, rank: int, nextRankPoints: int|null}
     */
    public function getUserStanding(User $user, string $timeframe): array
    {
        $points = $this->getUserPoints($user, $timeframe);

        if ($points <= 0) {
            return [
                'points' => $points,
                'rank' => 0,
                'nextRankPoints' => null,
            ];
        }

        if ($timeframe === 'all') {
            $standing = User::query()
                ->selectRaw('COUNT(CASE WHEN points > ? THEN 1 END) + 1 as rank_position', [$points])
                ->selectRaw('MIN(CASE WHEN points > ? THEN points END) as next_rank_points', [$points])
                ->where('id', '!=', $user->id)
                ->first();

            return [
                'points' => $points,
                'rank' => (int) $standing->rank_position,
                'nextRankPoints' => $standing->next_rank_points !== null ? (int) $standing->next_rank_points : null,
            ];
        }

        $cacheKey = "leaderboard_standing_{$timeframe}_user_{$user->id}";
        CacheService::trackLeaderboardRankUser($user->id);

        $standing = Cache::remember($cacheKey, 120, function () use ($points, $timeframe, $user): object {
            $since = $this->resolveSinceDate($timeframe);

            return DB::query()
                ->fromSub($this->periodPointsQuery($since)->toBase(), 'ranked_users')
                ->selectRaw('COUNT(CASE WHEN period_points > ? THEN 1 END) + 1 as rank_position', [$points])
                ->selectRaw('MIN(CASE WHEN period_points > ? THEN period_points END) as next_rank_points', [$points])
                ->where('id', '!=', $user->id)
                ->first();
        });

        return [
            'points' => $points,
            'rank' => (int) $standing->rank_position,
            'nextRankPoints' => $standing->next_rank_points !== null ? (int) $standing->next_rank_points : null,
        ];
    }

    /**
     * Get top 3 users for the podium display.
     *
     * @return Collection<int, User>
     */
    public function getTop3Users(string $timeframe): Collection
    {
        return $this->traceSpan('leaderboard.get_top3', "Get top 3 ({$timeframe})", function () use ($timeframe) {
            return $this->fetchTop3Users($timeframe);
        });
    }

    /**
     * @return Collection<int, User>
     */
    private function fetchTop3Users(string $timeframe): Collection
    {
        if ($timeframe === 'all') {
            return User::query()
                ->orderByDesc('points')
                ->orderBy('name')
                ->limit(3)
                ->get(['id', 'name', 'username', 'points', 'xp', 'current_streak', 'longest_streak', 'avatar_path', 'avatar_image', 'avatar_mime_type']);
        }

        $since = $this->resolveSinceDate($timeframe);

        return $this->periodPointsQuery($since)
            ->whereRaw('(COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) > 0')
            ->orderByDesc('period_points')
            ->orderBy('name')
            ->limit(3)
            ->get();
    }

    /**
     * Get the points of the user one rank above the current user.
     */
    public function getNextRankPoints(User $user, int $currentPoints, int $currentRank, string $timeframe): ?int
    {
        if ($currentRank <= 1) {
            return null;
        }

        if ($timeframe === 'all') {
            return (int) User::query()
                ->where('points', '>', $currentPoints)
                ->where('id', '!=', $user->id)
                ->orderBy('points')
                ->value('points');
        }

        $since = $this->resolveSinceDate($timeframe);

        return (int) $this->periodPointsQuery($since)
            ->whereRaw('(COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) > ?', [$currentPoints])
            ->where('users.id', '!=', $user->id)
            ->orderByRaw('(COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) ASC')
            ->value(DB::raw('(COALESCE(cp.total, 0) + COALESCE(lp.total, 0))'));
    }

    /**
     * Get the previous rank snapshot from cache for rank-change comparison.
     *
     * @return array<int, int> userId => rank
     */
    public function getPreviousRankSnapshot(string $timeframe): array
    {
        return Cache::get("leaderboard_ranks_{$timeframe}", []);
    }

    /**
     * Store current rank snapshot in cache for future comparison.
     */
    public function storeRankSnapshot(string $timeframe, LengthAwarePaginator $leaders): void
    {
        $cacheKey = "leaderboard_ranks_{$timeframe}";
        $lockKey = "leaderboard_ranks_lock_{$timeframe}";

        if (Cache::has($lockKey)) {
            return;
        }

        $existingRanks = Cache::get($cacheKey, []);

        $leaders->getCollection()->each(function (array $leader) use (&$existingRanks): void {
            $existingRanks[$leader['id']] = $leader['rank'];
        });

        Cache::put($cacheKey, $existingRanks, 86400);
        Cache::put($lockKey, true, 3600);
    }

    /**
     * Compute rank change direction.
     */
    public function computeRankChange(int $currentRank, ?int $previousRank): ?string
    {
        if ($previousRank === null) {
            return null;
        }

        if ($currentRank < $previousRank) {
            return 'up';
        }

        if ($currentRank > $previousRank) {
            return 'down';
        }

        return 'same';
    }

    /**
     * Resolve the "since" date for a timeframe.
     */
    public function resolveSinceDate(string $timeframe): CarbonImmutable
    {
        return match ($timeframe) {
            'weekly' => CarbonImmutable::now()->subDays(7)->startOfDay(),
            'monthly' => CarbonImmutable::now()->subDays(30)->startOfDay(),
            default => CarbonImmutable::createFromTimestamp(0),
        };
    }

    /**
     * Build the challenge points subquery for a given timeframe.
     */
    private function challengePointsSubquery(CarbonImmutable $since): Builder
    {
        return DB::table('challenge_submissions')
            ->select('user_id', DB::raw('SUM(score + COALESCE(streak_bonus, 0)) as total'))
            ->where('is_correct', true)
            ->where('submitted_at', '>=', $since)
            ->groupBy('user_id');
    }

    /**
     * Build the lesson points subquery for a given timeframe.
     */
    private function lessonPointsSubquery(CarbonImmutable $since): Builder
    {
        $lessonXpPerLesson = (int) config('rewards.lesson_completion_xp', 30);

        return DB::table('lesson_progress')
            ->select('lesson_progress.user_id', DB::raw('COUNT(*) * '.$lessonXpPerLesson.' as total'))
            ->whereNotNull('lesson_progress.completed_at')
            ->where('lesson_progress.completed_at', '>=', $since)
            ->groupBy('lesson_progress.user_id');
    }

    /**
     * Build a base User query with period_points from challenge + lesson subqueries.
     *
     * @return \Illuminate\Database\Eloquent\Builder<User>
     */
    private function periodPointsQuery(CarbonImmutable $since): \Illuminate\Database\Eloquent\Builder
    {
        return User::query()
            ->leftJoinSub($this->challengePointsSubquery($since), 'cp', 'users.id', '=', 'cp.user_id')
            ->leftJoinSub($this->lessonPointsSubquery($since), 'lp', 'users.id', '=', 'lp.user_id')
            ->selectRaw('users.*, (COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) as period_points');
    }

    /**
     * Execute a callback within a Sentry performance span.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    private function traceSpan(string $op, string $description, callable $callback): mixed
    {
        $parentSpan = SentrySdk::getCurrentHub()->getSpan();

        if ($parentSpan === null) {
            return $callback();
        }

        $context = new SpanContext;
        $context->setOp($op);
        $context->setDescription($description);

        $span = $parentSpan->startChild($context);
        SentrySdk::getCurrentHub()->setSpan($span);

        try {
            $result = $callback();
        } finally {
            $span->finish();
            SentrySdk::getCurrentHub()->setSpan($parentSpan);
        }

        return $result;
    }
}
