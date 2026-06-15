<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\SocialAvatarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\AbstractProvider;
use Laravel\Socialite\Two\InvalidStateException;
use Throwable;

class SocialAuthController extends Controller
{
    /**
     * Allowed OAuth providers.
     *
     * @var list<string>
     */
    private const array ALLOWED_PROVIDERS = ['google', 'github'];

    public function __construct(private readonly SocialAvatarService $socialAvatarService) {}

    /**
     * Redirect the user to the provider authentication page.
     *
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function redirect(Request $request, string $provider)
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS, true), 404);

        Log::info('[social-auth] redirect.start', [
            'provider' => $provider,
            'session_id' => $request->session()->getId(),
        ]);

        try {
            return $this->socialiteDriver($provider)->redirect();
        } catch (Throwable $e) {
            Log::error('[social-auth] redirect.failed', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'exception' => $e,
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Tidak dapat menghubungi '.ucfirst($provider).'. Silakan coba lagi nanti.',
            ]);
        }
    }

    /**
     * Obtain the user information from the provider.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS, true), 404);

        Log::info('[social-auth] callback.start', [
            'provider' => $provider,
            'has_code' => $request->filled('code'),
            'has_error' => $request->filled('error'),
            'session_id' => $request->session()->getId(),
        ]);

        // OAuth provider returned an explicit error (user denied, etc.)
        if ($request->filled('error')) {
            Log::warning('[social-auth] callback.provider_error', [
                'provider' => $provider,
                'error' => $request->input('error'),
                'error_description' => $request->input('error_description'),
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Otorisasi '.ucfirst($provider).' dibatalkan. Silakan coba lagi.',
            ]);
        }

        // If user is already authenticated, skip social auth flow
        if (Auth::check()) {
            Log::info('[social-auth] callback.already_authenticated', [
                'provider' => $provider,
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('dashboard');
        }

        try {
            $socialUser = $this->socialiteDriver($provider)->user();
        } catch (InvalidStateException $e) {
            Log::error('[social-auth] callback.invalid_state', [
                'provider' => $provider,
                'message' => $e->getMessage(),
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Sesi otentikasi kedaluwarsa atau tidak cocok. Silakan coba login lagi.',
            ]);
        } catch (Throwable $e) {
            Log::error('[social-auth] callback.token_exchange_failed', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'class' => $e::class,
                'exception' => $e,
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Gagal menghubungi '.ucfirst($provider).'. Silakan coba lagi nanti.',
            ]);
        }

        $providerEmail = $socialUser->getEmail();
        $providerId = $socialUser->getId();

        Log::info('[social-auth] callback.provider_user_received', [
            'provider' => $provider,
            'provider_id' => $providerId,
            'has_email' => ! empty($providerEmail),
            'has_name' => ! empty($socialUser->getName()),
        ]);

        // GitHub users with private email get a null email back. We cannot
        // create or match accounts without an email, so we surface a clear
        // message instead of failing silently.
        if (empty($providerEmail)) {
            Log::warning('[social-auth] callback.email_missing', [
                'provider' => $provider,
                'provider_id' => $providerId,
            ]);

            $message = $provider === 'github'
                ? 'Email akun GitHub Anda bersifat privat. Buka GitHub → Settings → Emails dan aktifkan "Keep my email addresses private = OFF", atau verifikasi minimal satu email primary, lalu coba lagi.'
                : 'Akun '.ucfirst($provider).' Anda tidak mengembalikan alamat email. Silakan gunakan provider lain atau register manual.';

            return redirect()->route('login')->withErrors(['email' => $message]);
        }

        // Case 1: Existing social account — update info and login directly
        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_user_id', $providerId)
            ->first();

        if ($socialAccount) {
            Log::info('[social-auth] callback.existing_social_account', [
                'provider' => $provider,
                'user_id' => $socialAccount->user_id,
            ]);

            $socialAccount->update([
                'provider_email' => $providerEmail,
                'provider_name' => $socialUser->getName(),
                'provider_avatar' => $socialUser->getAvatar(),
            ]);

            if (! $socialAccount->user->hasVerifiedEmail()) {
                $socialAccount->user->markEmailAsVerified();
            }

            $this->socialAvatarService->syncUserAvatarFromUrl(
                $socialAccount->user,
                $socialUser->getAvatar(),
            );

            Auth::login($socialAccount->user, true);
            $request->session()->regenerate();

            return redirect()->route('dashboard');
        }

        // Case 2: Existing user by email — do NOT auto-link (prevents account hijacking)
        $user = User::where('email', $providerEmail)->first();

        if ($user) {
            Log::info('[social-auth] callback.email_already_registered', [
                'provider' => $provider,
                'existing_user_id' => $user->id,
            ]);

            // Stash partial provider data for the in-app linking flow after login.
            $request->session()->put('social_user', [
                'provider' => $provider,
                'id' => $providerId,
                'email' => $providerEmail,
                'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                'avatar' => $socialUser->getAvatar(),
                'nickname' => $socialUser->getNickname(),
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Akun dengan email ini sudah terdaftar. Silakan masuk terlebih dahulu, lalu hubungkan akun '.ucfirst($provider).' Anda di pengaturan.',
            ]);
        }

        // Case 3: New user — store social data in session and redirect to register
        Log::info('[social-auth] callback.new_user_to_register', [
            'provider' => $provider,
            'provider_id' => $providerId,
        ]);

        $request->session()->put('social_user', [
            'provider' => $provider,
            'id' => $providerId,
            'email' => $providerEmail,
            'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
            'avatar' => $socialUser->getAvatar(),
            'nickname' => $socialUser->getNickname(),
            'expires_at' => now()->addMinutes(10)->timestamp,
        ]);

        return redirect()->route('register');
    }

    /**
     * Build a configured Socialite driver for the given provider.
     *
     * Uses the standard stateful flow: the OAuth "state" parameter is bound
     * to the user's session, and since we now use a full-page redirect (no
     * popup window), the session cookie travels with the callback request
     * and the state check succeeds.
     *
     * Return type is intentionally `mixed` so that test suites can stub the
     * full chain via `Socialite::shouldReceive('driver->redirectUrl->user')`
     * without tripping PHP's strict return type check on the demeter mock.
     * In production this always returns an {@see AbstractProvider}.
     */
    private function socialiteDriver(string $provider): mixed
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        return $driver->redirectUrl($this->redirectUriFor($provider));
    }

    private function redirectUriFor(string $provider): string
    {
        $configuredRedirect = config("services.{$provider}.redirect");

        if (is_string($configuredRedirect) && str_starts_with($configuredRedirect, 'http')) {
            return $configuredRedirect;
        }

        $path = is_string($configuredRedirect) && $configuredRedirect !== ''
            ? $configuredRedirect
            : "/auth/{$provider}/callback";

        $path = str_starts_with($path, '/') ? $path : '/'.$path;
        $authUrl = rtrim((string) config('app.urls.auth', config('app.url')), '/');

        return $authUrl.$path;
    }
}
