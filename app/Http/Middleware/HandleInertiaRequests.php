<?php

namespace App\Http\Middleware;

use App\Services\LevelService;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
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

        $streakResult = ['xp' => 0, 'bonuses' => []];
        if ($user !== null) {
            $streakResult = $this->xpService->updateDailyStreak($user);
            $user->refresh();
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
                    'xp' => $user->xp,
                    'current_streak' => $user->current_streak,
                    'longest_streak' => $user->longest_streak,
                    'is_admin' => $user->is_admin,
                    'role' => $user->role,
                    'level' => $this->levelService->getUserLevel($user),
                    'badge_count' => Cache::remember("user:{$user->id}:badge_count", 300, fn () => $user->badges()->count()),
                    'daily_xp_earned' => $user->daily_xp_earned ?? 0,
                    'daily_goal_target' => (int) config('rewards.daily_goal_target_xp', 100),
                ] : null,
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'toast' => fn () => $request->session()->get('toast'),
                'newBadges' => fn () => $request->session()->get('newBadges'),
                'levelUp' => fn () => $request->session()->get('levelUp'),
                'streakBonuses' => fn () => $streakResult['bonuses'],
            ],
        ];
    }
}
