<?php

namespace App\Http\Middleware;

use App\Features\IndonesianLocale;
use App\Features\RealtimeLeaderboard;
use App\Services\LevelService;
use App\Services\XpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;
use Laravel\Pennant\Feature;

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
        $isPublicLandingPage = $request->getHost() === config('app.domains.public') && $request->path() === '/';
        $user = $isPublicLandingPage ? null : $request->user();

        $streakResult = ['xp' => 0, 'bonuses' => []];
        if ($user !== null) {
            // Always run the streak/daily-goal update — even on partial Inertia
            // requests — so that daily_xp_earned is reset on a new day regardless
            // of whether the request asks for partial data only.
            $streakResult = $this->xpService->updateDailyStreak($user);
            $user->refresh();
        }

        $user?->loadMissing('roles:id,name');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'urls' => [
                'public' => config('app.urls.public'),
                'auth' => config('app.urls.auth'),
                'app' => config('app.urls.app'),
                'login' => $this->authUrl('login'),
                'register' => $this->authUrl('register'),
                'logout' => $this->authUrl('logout'),
                'dashboard' => config('app.urls.app'),
            ],
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
                    'is_admin' => $user->canAccessAdmin(),
                    'role' => $user->primaryRoleName(),
                    'level' => $this->levelService->getUserLevel($user),
                    'badge_count' => Cache::remember("user:{$user->id}:badge_count", 300, fn () => $user->badges()->count()),
                    'daily_xp_earned' => $user->daily_xp_earned ?? 0,
                    'daily_goal_target' => (int) config('rewards.daily_goal_target_xp', 100),
                ] : null,
            ],
            'sidebarOpen' => $isPublicLandingPage || ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'locale' => app()->getLocale(),
            'availableLocales' => ['en', 'id'],
            'features' => [
                'realtimeLeaderboard' => Feature::active(RealtimeLeaderboard::class),
                'indonesianLocale' => Feature::active(IndonesianLocale::class),
            ],
            'flash' => [
                'toast' => fn () => $isPublicLandingPage ? null : $request->session()->get('toast'),
                'newBadges' => fn () => $isPublicLandingPage ? null : $request->session()->get('newBadges'),
                'levelUp' => fn () => $isPublicLandingPage ? null : $request->session()->get('levelUp'),
                'streakBonuses' => fn () => $streakResult['bonuses'],
            ],
        ];
    }

    private function authUrl(string $path): string
    {
        return rtrim((string) config('app.urls.auth'), '/').'/'.ltrim($path, '/');
    }
}
