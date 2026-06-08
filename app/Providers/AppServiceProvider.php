<?php

namespace App\Providers;

use App\Events\XpAwarded;
use App\Features\IndonesianLocale;
use App\Features\RealtimeLeaderboard;
use App\Http\Responses\Auth\LoginResponse;
use App\Http\Responses\Auth\NeutralPasswordResetLinkResponse;
use App\Http\Responses\Auth\RegisterResponse;
use App\Listeners\LogXpAward;
use App\Models\User;
use App\Observers\UserBalanceHistoryObserver;
use App\Observers\UserObserver;
use Carbon\CarbonImmutable;
use Dedoc\Scramble\Scramble;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\LoginResponse as LoginResponseContract;
use Laravel\Fortify\Contracts\RegisterResponse as RegisterResponseContract;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
use Laravel\Pennant\Feature;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(LoginResponseContract::class, LoginResponse::class);
        $this->app->singleton(RegisterResponseContract::class, RegisterResponse::class);

        $this->app->singleton(
            FailedPasswordResetLinkRequestResponse::class,
            NeutralPasswordResetLinkResponse::class,
        );

        $this->app->singleton(
            SuccessfulPasswordResetLinkRequestResponse::class,
            NeutralPasswordResetLinkResponse::class,
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureAuthorization();
        $this->configureRateLimiting();
        $this->configureFeatureFlags();
        $this->configureApiDocumentation();

        User::observe(UserBalanceHistoryObserver::class);
        User::observe(UserObserver::class);

        Event::listen(XpAwarded::class, LogXpAward::class);
    }

    /**
     * Configure global authorization rules.
     */
    protected function configureAuthorization(): void
    {
        Gate::before(fn (User $user, string $ability): ?bool => $user->hasRole(User::ROLE_SUPER_ADMIN) ? true : null);
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

        // Quiz question submissions — tightened to prevent brute-force
        RateLimiter::for('quiz-submit', function (Request $request) {
            return Limit::perMinute(10)->by($request->user()?->id ?: $request->ip());
        });

        // Session summary — only called once per quiz session
        RateLimiter::for('session-summary', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // Lesson completion — strict limit to prevent rapid-fire completion
        RateLimiter::for('lesson-complete', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });

        // Anti-cheat heartbeat — allow frequent pings but cap per user
        RateLimiter::for('heartbeat', function (Request $request) {
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
        Scramble::routes(function (Route $route) {
            $jsonRoutes = [
                'health',
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
