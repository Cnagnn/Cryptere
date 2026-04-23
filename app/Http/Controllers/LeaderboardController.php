<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\LevelService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LeaderboardController extends Controller
{
    private const PER_PAGE = 10;

    private const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    public function __construct(
        private readonly LevelService $levelService,
    ) {}

    /**
     * Show global leaderboard.
     */
    public function __invoke(Request $request): Response
    {
        $requestedPerPage = (int) $request->integer('per_page', self::PER_PAGE);
        $perPage = in_array($requestedPerPage, self::PER_PAGE_OPTIONS, true)
            ? $requestedPerPage
            : self::PER_PAGE;

        $leaders = User::query()
            ->withCount('badges')
            ->orderByDesc('points')
            ->orderBy('name')
            ->paginate($perPage, ['id', 'name', 'username', 'points', 'avatar_path', 'avatar_image', 'avatar_mime_type'])
            ->withQueryString();

        $offset = ($leaders->currentPage() - 1) * $leaders->perPage();

        $leaders->setCollection(
            $leaders->getCollection()->values()->map(function (User $leader, int $index) use ($offset): array {
                $levelInfo = $this->levelService->getLevelForPoints($leader->points);

                return [
                    'id' => $leader->id,
                    'rank' => $offset + $index + 1,
                    'name' => $leader->name,
                    'username' => $leader->username,
                    'avatar' => $leader->avatar,
                    'points' => $leader->points,
                    'level' => $levelInfo['level'],
                    'levelName' => $levelInfo['name'],
                    'badgeCount' => (int) $leader->badges_count,
                ];
            })
        );

        $currentUser = $request->user();
        $topScore = (int) User::query()->max('points');

        $currentUserRank = $currentUser->points > 0
            ? (User::query()
                ->where('points', '>', $currentUser->points)
                ->count() + 1)
            : 0;

        return Inertia::render('leaderboard/index', [
            'leaders' => $leaders,
            'currentUser' => [
                'rank' => $currentUserRank,
                'points' => $currentUser->points,
            ],
            'topScore' => $topScore,
        ]);
    }
}
