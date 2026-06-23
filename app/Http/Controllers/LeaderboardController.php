<?php

namespace App\Http\Controllers;

use App\Services\LeaderboardService;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    public const VALID_SORT_BY = ['points', 'xp', 'longest_streak', 'current_streak'];

    public const VALID_SORT_ORDER = ['asc', 'desc'];

    public function __construct(
        private readonly LevelService $levelService,
        private readonly LeaderboardService $leaderboardService,
    ) {}

    /**
     * Show global leaderboard with optional timeframe filtering, sort, and level-range.
     */
    public function __invoke(Request $request): Response
    {
        $perPage = $this->leaderboardService->resolvePerPage($request->integer('per_page', LeaderboardService::PER_PAGE));
        $timeframe = $this->leaderboardService->resolveTimeframe($request->string('timeframe', 'all')->toString());
        $sortBy = $this->resolveSortBy($request->string('sort_by', 'points')->toString());
        $sortOrder = $this->resolveSortOrder($request->string('sort_order', 'desc')->toString());
        $levelMin = $request->integer('level_min', 0);
        $levelMax = $request->integer('level_max', 0);

        $leaders = $this->leaderboardService->getLeaders($timeframe, $perPage);
        $offset = ($leaders->currentPage() - 1) * $leaders->perPage();
        $previousRanks = $this->leaderboardService->getPreviousRankSnapshot($timeframe);

        $leaders->setCollection(
            $leaders->getCollection()->values()->map(
                fn (array $leader, int $index): array => $this->decorateLeader(
                    $leader,
                    $offset + $index + 1,
                    $previousRanks[$leader['id']] ?? null,
                )
            )
        );

        // Apply sort after decoration (so level/streak data is available)
        $sorted = $this->sortLeaders($leaders->getCollection(), $sortBy, $sortOrder);

        // Apply level filter
        if ($levelMin > 0 || $levelMax > 0) {
            $sorted = $sorted->filter(function (array $leader) use ($levelMin, $levelMax): bool {
                if ($levelMin > 0 && $leader['level'] < $levelMin) {
                    return false;
                }

                if ($levelMax > 0 && $leader['level'] > $levelMax) {
                    return false;
                }

                return true;
            })->values();
        }

        $leaders->setCollection($sorted);

        $top3 = collect($this->leaderboardService->getTop3($timeframe))
            ->values()
            ->map(fn (array $leader, int $index): array => $this->decorateLeader(
                $leader,
                $index + 1,
                $previousRanks[$leader['id']] ?? null,
            ))
            ->all();

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
            'sortBy' => $sortBy,
            'sortOrder' => $sortOrder,
            'levelMin' => $levelMin,
            'levelMax' => $levelMax,
        ]);
    }

    /**
     * Decorate a cached leader payload with rank, level, and rank-change info.
     *
     * @param  array<string, mixed>  $leader
     * @return array<string, mixed>
     */
    private function decorateLeader(array $leader, int $rank, ?int $previousRank): array
    {
        $levelInfo = $this->levelService->getLevelForXp((int) ($leader['xp'] ?? 0));

        return [
            'id' => (int) $leader['id'],
            'rank' => $rank,
            'name' => $leader['name'] ?? '',
            'username' => $leader['username'] ?? null,
            'avatar' => $leader['avatar'] ?? null,
            'points' => (int) ($leader['points'] ?? 0),
            'xp' => (int) ($leader['xp'] ?? 0),
            'level' => $levelInfo['level'],
            'longestStreak' => (int) ($leader['longest_streak'] ?? 0),
            'currentStreak' => (int) ($leader['current_streak'] ?? 0),
            'rankChange' => $this->leaderboardService->computeRankChange($rank, $previousRank),
        ];
    }

    /**
     * Sort the leaderboard collection by the given column and direction.
     *
     * @param  Collection<int, array<string, mixed>>  $leaders
     * @return Collection<int, array<string, mixed>>
     */
    private function sortLeaders(Collection $leaders, string $sortBy, string $sortOrder): Collection
    {
        return $leaders->sortBy(
            fn (array $leader) => $leader[$sortBy] ?? 0,
            $sortOrder === 'desc' ? SORT_REGULAR : SORT_REGULAR,
            $sortOrder === 'desc',
        )->values();
    }

    private function resolveSortBy(string $requested): string
    {
        return in_array($requested, self::VALID_SORT_BY, true) ? $requested : 'points';
    }

    private function resolveSortOrder(string $requested): string
    {
        return in_array($requested, self::VALID_SORT_ORDER, true) ? $requested : 'desc';
    }
}
