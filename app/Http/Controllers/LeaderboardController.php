<?php

namespace App\Http\Controllers;

use App\Services\LeaderboardService;
use App\Services\LevelService;
use Illuminate\Http\Request;
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
            $leaders->getCollection()->values()->map(
                fn (array $leader, int $index): array => $this->decorateLeader(
                    $leader,
                    $offset + $index + 1,
                    $previousRanks[$leader['id']] ?? null,
                )
            )
        );

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
            'level' => $levelInfo['level'],
            'longestStreak' => (int) ($leader['longest_streak'] ?? 0),
            'currentStreak' => (int) ($leader['current_streak'] ?? 0),
            'rankChange' => $this->leaderboardService->computeRankChange($rank, $previousRank),
        ];
    }
}
