<?php

namespace App\Providers;

use App\Events\XpAwarded;
use App\Features\IndonesianLocale;
use App\Features\RealtimeLeaderboard;
use App\Listeners\BroadcastLeaderboardUpdate;
use App\Listeners\LogXpAward;
use Carbon\CarbonImmutable;
use Dedoc\Scramble\Scramble;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureRateLimiting();
        $this->configureFeatureFlags();
        $this->configureApiDocumentation();

        Event::listen(XpAwarded::class, LogXpAward::class);
        Event::listen(XpAwarded::class, BroadcastLeaderboardUpdate::class);
    }

    /**
     * Configure rate limiting for API endpoints.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        RateLimiter::for('api-heavy', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Challenge submissions (standalone + speed-round) — prevent brute-force answer guessing
        RateLimiter::for('challenge-submit', function (Request $request) {
            return Limit::perMinute(20)->by($request->user()?->id ?: $request->ip());
        });

        // Quiz question submissions — higher limit for rapid-fire quiz mode (1 per second max)
        RateLimiter::for('quiz-submit', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        // Session summary — only called once per quiz session
        RateLimiter::for('session-summary', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // Daily reward claim — max 2 per minute (prevent double-click spam)
        RateLimiter::for('daily-reward', function (Request $request) {
            return Limit::perMinute(2)->by($request->user()?->id ?: $request->ip());
        });

        // Lesson completion — prevent rapid-fire completion spam
        RateLimiter::for('lesson-complete', function (Request $request) {
            return Limit::perMinute(30)->by($request->user()?->id ?: $request->ip());
        });

        // Enrollment actions — prevent enrollment spam
        RateLimiter::for('enrollment', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });
    }

    /**
     * Configure Laravel Pennant feature flags.
     */
    protected function configureFeatureFlags(): void
    {
        Feature::define('realtime-leaderboard', RealtimeLeaderboard::class);
        Feature::define('indonesian-locale', IndonesianLocale::class);
    }

    /**
     * Configure Scramble API documentation to include JSON-returning routes.
     *
     * Since Crypter uses web routes (not /api prefix), we register a custom
     * route resolver that picks up all JSON-returning endpoints.
     */
    protected function configureApiDocumentation(): void
    {
        Scramble::routes(function (\Illuminate\Routing\Route $route) {
            $jsonRoutes = [
                'health',
                'daily-rewards.index',
                'daily-rewards.claim',
                'challenges.quick-submit',
                'challenges.quiz-submit',
                'challenges.session-summary',
                'courses.lessons.quiz',
            ];

            return in_array($route->getName(), $jsonRoutes);
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        Model::preventLazyLoading(! app()->isProduction());

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
