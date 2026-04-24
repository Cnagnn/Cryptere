<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LevelService;
use Carbon\CarbonImmutable;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    private const PER_PAGE = 10;

    private const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    private const VALID_TIMEFRAMES = ['all', 'weekly', 'monthly'];

    public function __construct(
        private readonly LevelService $levelService,
    ) {}

    /**
     * Show global leaderboard with optional timeframe filtering.
     */
    public function __invoke(Request $request): Response
    {
        $requestedPerPage = (int) $request->integer('per_page', self::PER_PAGE);
        $perPage = in_array($requestedPerPage, self::PER_PAGE_OPTIONS, true)
            ? $requestedPerPage
            : self::PER_PAGE;

        $timeframe = $request->string('timeframe', 'all')->toString();
        if (! in_array($timeframe, self::VALID_TIMEFRAMES, true)) {
            $timeframe = 'all';
        }

        if ($timeframe === 'all') {
            $leaders = $this->allTimeLeaders($perPage);
        } else {
            $leaders = $this->timeframeLeaders($timeframe, $perPage);
        }

        $offset = ($leaders->currentPage() - 1) * $leaders->perPage();

        $leaders->setCollection(
            $leaders->getCollection()->values()->map(function (User $leader, int $index) use ($offset, $timeframe): array {
                $levelInfo = $this->levelService->getLevelForXp($leader->xp);

                return [
                    'id' => $leader->id,
                    'rank' => $offset + $index + 1,
                    'name' => $leader->name,
                    'username' => $leader->username,
                    'avatar' => $leader->avatar,
                    'points' => $timeframe === 'all' ? $leader->points : (int) ($leader->period_points ?? 0),
                    'level' => $levelInfo['level'],
                    'levelName' => $levelInfo['name'],
                    'badgeCount' => (int) $leader->badges_count,
                ];
            })
        );

        $currentUser = $request->user();
        $topScore = $timeframe === 'all'
            ? (int) User::query()->max('points')
            : $this->getTopScoreForTimeframe($timeframe);

        $currentUserPoints = $timeframe === 'all'
            ? $currentUser->points
            : $this->getUserTimeframePoints($currentUser, $timeframe);

        $currentUserRank = $currentUserPoints > 0
            ? ($timeframe === 'all'
                ? (User::query()->where('points', '>', $currentUserPoints)->count() + 1)
                : $this->getUserTimeframeRank($currentUser, $timeframe))
            : 0;

        return Inertia::render('leaderboard/index', [
            'leaders' => $leaders,
            'currentUser' => [
                'rank' => $currentUserRank,
                'points' => $currentUserPoints,
            ],
            'topScore' => $topScore,
            'timeframe' => $timeframe,
            'timeframes' => self::VALID_TIMEFRAMES,
        ]);
    }

    /**
     * All-time leaderboard (original behavior).
     */
    private function allTimeLeaders(int $perPage): LengthAwarePaginator
    {
        return User::query()
            ->withCount('badges')
            ->orderByDesc('points')
            ->orderBy('name')
            ->paginate($perPage, ['id', 'name', 'username', 'points', 'xp', 'avatar_path', 'avatar_image', 'avatar_mime_type'])
            ->withQueryString();
    }

    /**
     * Timeframe-based leaderboard using aggregated points from recent activity.
     */
    private function timeframeLeaders(string $timeframe, int $perPage): LengthAwarePaginator
    {
        $since = $this->resolveSinceDate($timeframe);

        $challengePoints = DB::table('challenge_submissions')
            ->select('user_id', DB::raw('SUM(score + COALESCE(streak_bonus, 0)) as total'))
            ->where('is_correct', true)
            ->where('submitted_at', '>=', $since)
            ->groupBy('user_id');

        $lessonPoints = DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->select('lesson_progress.user_id', DB::raw('SUM(COALESCE(lessons.xp_reward, 0)) as total'))
            ->whereNotNull('lesson_progress.completed_at')
            ->where('lesson_progress.completed_at', '>=', $since)
            ->groupBy('lesson_progress.user_id');

        return User::query()
            ->withCount('badges')
            ->leftJoinSub($challengePoints, 'cp', 'users.id', '=', 'cp.user_id')
            ->leftJoinSub($lessonPoints, 'lp', 'users.id', '=', 'lp.user_id')
            ->selectRaw('users.*, (COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) as period_points')
            ->whereRaw('(COALESCE(cp.total, 0) + COALESCE(lp.total, 0)) > 0')
            ->orderByDesc('period_points')
            ->orderBy('name')
            ->paginate($perPage, ['users.*'])
            ->withQueryString();
    }

    /**
     * Get the top score for a given timeframe.
     */
    private function getTopScoreForTimeframe(string $timeframe): int
    {
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
    private function getUserTimeframePoints(User $user, string $timeframe): int
    {
        $since = $this->resolveSinceDate($timeframe);

        $challengePoints = (int) DB::table('challenge_submissions')
            ->where('user_id', $user->id)
            ->where('is_correct', true)
            ->where('submitted_at', '>=', $since)
            ->sum(DB::raw('score + COALESCE(streak_bonus, 0)'));

        $lessonPoints = (int) DB::table('lesson_progress')
            ->join('lessons', 'lesson_progress.lesson_id', '=', 'lessons.id')
            ->where('lesson_progress.user_id', $user->id)
            ->whereNotNull('lesson_progress.completed_at')
            ->where('lesson_progress.completed_at', '>=', $since)
            ->sum('lessons.xp_reward');

        return $challengePoints + $lessonPoints;
    }

    /**
     * Get a user's rank for a given timeframe.
     */
    private function getUserTimeframeRank(User $user, string $timeframe): int
    {
        $userPoints = $this->getUserTimeframePoints($user, $timeframe);
        if ($userPoints <= 0) {
            return 0;
        }

        $since = $this->resolveSinceDate($timeframe);

        // Count users with more points in this timeframe
        $challengeSub = DB::table('challenge_submissions')
            ->select('user_id', DB::raw('COALESCE(SUM(score + COALESCE(streak_bonus, 0)), 0) as total'))
            ->where('is_correct', true)
            ->where('submitted_at', '>=', $since)
            ->groupBy('user_id');

        $higherCount = (int) DB::query()
            ->fromSub($challengeSub, 'ranked')
            ->where('total', '>', $userPoints)
            ->count();

        return $higherCount + 1;
    }

    /**
     * Resolve the "since" date for a timeframe.
     */
    private function resolveSinceDate(string $timeframe): CarbonImmutable
    {
        return match ($timeframe) {
            'weekly' => CarbonImmutable::now()->subDays(7)->startOfDay(),
            'monthly' => CarbonImmutable::now()->subDays(30)->startOfDay(),
            default => CarbonImmutable::createFromTimestamp(0),
        };
    }
}
