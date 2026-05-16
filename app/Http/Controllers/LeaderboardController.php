<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\CacheService;
use App\Services\LeaderboardService;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public function __construct(
        private readonly LevelService $levelService,
        private readonly LeaderboardService $leaderboardService,
    ) {}

    /**
     * Show global leaderboard with optional timeframe filtering.
     */
    public function __invoke(Request $request): Response
    {
        $perPage = $this->leaderboardService->resolvePerPage($request->integer('per_page', LeaderboardService::PER_PAGE));
        $timeframe = $this->leaderboardService->resolveTimeframe($request->string('timeframe', 'all')->toString());

        $leaders = $this->leaderboardService->getLeaders($timeframe, $perPage);
        $offset = ($leaders->currentPage() - 1) * $leaders->perPage();
        $previousRanks = $this->leaderboardService->getPreviousRankSnapshot($timeframe);

        $leaders->setCollection(
            $leaders->getCollection()->values()->map(function (User $leader, int $index) use ($offset, $timeframe, $previousRanks): array {
                $levelInfo = $this->levelService->getLevelForXp($leader->xp);
                $rank = $offset + $index + 1;
                $previousRank = $previousRanks[$leader->id] ?? null;

                return [
                    'id' => $leader->id,
                    'rank' => $rank,
                    'name' => $leader->name,
                    'username' => $leader->username,
                    'avatar' => $leader->avatar,
                    'points' => $timeframe === 'all' ? $leader->points : (int) ($leader->period_points ?? 0),
                    'level' => $levelInfo['level'],
                    'longestStreak' => $leader->longest_streak ?? 0,
                    'currentStreak' => $leader->current_streak ?? 0,
                    'rankChange' => $this->leaderboardService->computeRankChange($rank, $previousRank),
                ];
            })
        );

        // Fetch top 3 separately (always from rank 1, regardless of current page) — cached 5 min
        $mapTop3 = fn ($users) => $users->values()->map(function (User $user, int $index) use ($timeframe, $previousRanks): array {
            $levelInfo = $this->levelService->getLevelForXp($user->xp);
            $rank = $index + 1;
            $previousRank = $previousRanks[$user->id] ?? null;

            return [
                'id' => $user->id,
                'rank' => $rank,
                'name' => $user->name,
                'username' => $user->username,
                'avatar' => $user->avatar,
                'points' => $timeframe === 'all' ? $user->points : (int) ($user->period_points ?? 0),
                'level' => $levelInfo['level'],
                'longestStreak' => $user->longest_streak ?? 0,
                'currentStreak' => $user->current_streak ?? 0,
                'rankChange' => $this->leaderboardService->computeRankChange($rank, $previousRank),
            ];
        })->all();

        try {
            $top3Users = Cache::remember("leaderboard_top3_{$timeframe}", CacheService::TTL_MEDIUM, fn () => $this->leaderboardService->getTop3Users($timeframe));
            $top3 = $mapTop3($top3Users);
        } catch (\Throwable) {
            // Cached object was corrupted (incomplete unserialization) — re-fetch from DB
            Cache::forget("leaderboard_top3_{$timeframe}");
            $top3 = $mapTop3($this->leaderboardService->getTop3Users($timeframe));
        }

        $currentUser = $request->user();
        $topScore = (int) ($top3[0]['points'] ?? $this->leaderboardService->getTopScore($timeframe));
        $currentUserStanding = $this->leaderboardService->getUserStanding($currentUser, $timeframe);

        $this->leaderboardService->storeRankSnapshot($timeframe, $leaders);

        return Inertia::render('leaderboard/index', [
            'leaders' => $leaders,
            'top3' => $top3,
            'currentUser' => [
                'id' => $currentUser->id,
                'rank' => $currentUserStanding['rank'],
                'points' => $currentUserStanding['points'],
                'nextRankPoints' => $currentUserStanding['nextRankPoints'],
            ],
            'topScore' => $topScore,
            'timeframe' => $timeframe,
            'timeframes' => LeaderboardService::VALID_TIMEFRAMES,
        ]);
    }
}
