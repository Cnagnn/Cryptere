<?php

namespace App\Http\Middleware;

use App\Services\LevelService;
use App\Services\XpService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function __construct(
        private readonly XpService $xpService,
        private readonly LevelService $levelService,
    ) {}

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();

        if ($user !== null) {
            $this->xpService->updateDailyStreak($user);
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'avatar' => $user->avatar,
                    'points' => $user->points,
                    'current_streak' => $user->current_streak,
                    'longest_streak' => $user->longest_streak,
                    'is_admin' => $user->is_admin,
                    'role' => $user->role,
                    'level' => $this->levelService->getUserLevel($user),
                    'badge_count' => $user->badges()->count(),
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'toast' => fn () => $request->session()->get('toast'),
                'newBadges' => fn () => $request->session()->get('newBadges'),
                'levelUp' => fn () => $request->session()->get('levelUp'),
            ],
        ];
    }
}
