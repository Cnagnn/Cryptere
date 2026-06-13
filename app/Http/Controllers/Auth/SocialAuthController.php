<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\SocialAvatarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
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

        $isPopup = $request->boolean('popup');

        Log::info('[social-auth] redirect.start', [
            'provider' => $provider,
            'popup' => $isPopup,
            'session_id' => $request->session()->getId(),
        ]);

        if ($isPopup) {
            $request->session()->put('social_popup', true);
        }

        try {
            return $this->socialiteDriver($provider, $isPopup)->redirect();
        } catch (Throwable $e) {
            Log::error('[social-auth] redirect.failed', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'exception' => $e,
            ]);

            return $this->popupOrError(
                $request,
                'Tidak dapat menghubungi '.ucfirst($provider).'. Silakan coba lagi nanti.',
                route('login'),
            );
        }
    }

    /**
     * Obtain the user information from the provider.
     */
    public function callback(Request $request, string $provider): RedirectResponse|Response
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS, true), 404);

        $isPopup = (bool) $request->session()->get('social_popup');

        Log::info('[social-auth] callback.start', [
            'provider' => $provider,
            'popup' => $isPopup,
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

            return $this->popupOrError(
                $request,
                'Otorisasi '.ucfirst($provider).' dibatalkan. Silakan coba lagi.',
                route('login'),
            );
        }

        // If user is already authenticated, skip social auth flow
        if (Auth::check()) {
            Log::info('[social-auth] callback.already_authenticated', [
                'provider' => $provider,
                'user_id' => Auth::id(),
            ]);

            return $this->popupOrRedirect($request, route('dashboard'));
        }

        try {
            $socialUser = $this->socialiteDriver($provider, $isPopup)->user();
        } catch (InvalidStateException $e) {
            Log::error('[social-auth] callback.invalid_state', [
                'provider' => $provider,
                'popup' => $isPopup,
                'message' => $e->getMessage(),
            ]);

            return $this->popupOrError(
                $request,
                'Sesi otentikasi kedaluwarsa atau tidak cocok. Silakan coba login lagi.',
                route('login'),
            );
        } catch (Throwable $e) {
            Log::error('[social-auth] callback.token_exchange_failed', [
                'provider' => $provider,
                'message' => $e->getMessage(),
                'class' => $e::class,
                'exception' => $e,
            ]);

            return $this->popupOrError(
                $request,
                'Gagal menghubungi '.ucfirst($provider).'. Silakan coba lagi nanti.',
                route('login'),
            );
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

            return $this->popupOrError($request, $message, route('login'));
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

            return $this->popupOrRedirect($request, route('dashboard'));
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

            return $this->popupMessage(
                $request,
                'Akun dengan email ini sudah terdaftar. Silakan masuk terlebih dahulu, lalu hubungkan akun '.ucfirst($provider).' Anda di pengaturan.',
                route('login'),
            );
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

        return $this->popupOrRedirect($request, route('register'));
    }

    /**
     * Return a popup-closing HTML response or a standard redirect.
     */
    private function popupOrRedirect(Request $request, string $url): RedirectResponse|Response
    {
        if (! $request->session()->pull('social_popup')) {
            return redirect()->to($url);
        }

        return $this->popupResponse(
            redirectUrl: $url,
            title: 'Authenticating...',
        );
    }

    /**
     * Show an info message inside the popup, or redirect with flashed error
     * for non-popup flow.
     */
    private function popupMessage(Request $request, string $message, string $fallbackUrl): RedirectResponse|Response
    {
        if (! $request->session()->pull('social_popup')) {
            return redirect()->to($fallbackUrl)->withErrors(['email' => $message]);
        }

        return $this->popupResponse(
            redirectUrl: $fallbackUrl,
            title: 'Informasi',
            messageHtml: e($message),
            tone: 'info',
        );
    }

    /**
     * Show an error message inside the popup, or redirect with flashed error
     * for non-popup flow. Used for terminal failures (token exchange, missing
     * email, invalid state, etc.) — never shows a blank screen.
     */
    private function popupOrError(Request $request, string $message, string $fallbackUrl): RedirectResponse|Response
    {
        if (! $request->session()->pull('social_popup')) {
            return redirect()->to($fallbackUrl)->withErrors(['email' => $message]);
        }

        return $this->popupResponse(
            redirectUrl: $fallbackUrl,
            title: 'Otentikasi Gagal',
            messageHtml: e($message),
            tone: 'error',
        );
    }

    /**
     * Render the popup HTML response. When messageHtml is provided, the user
     * sees an info/error card and clicks to close the popup; the parent window
     * is then redirected. When messageHtml is null, the popup auto-redirects
     * the parent window and closes itself silently.
     */
    private function popupResponse(
        string $redirectUrl,
        string $title,
        ?string $messageHtml = null,
        string $tone = 'info',
    ): Response {
        $escapedUrl = json_encode($redirectUrl, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT);
        $escapedHref = htmlspecialchars($redirectUrl, ENT_QUOTES, 'UTF-8');
        $escapedTitle = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');

        // Silent auto-close + parent redirect (success path).
        if ($messageHtml === null) {
            $html = <<<HTML
                <!DOCTYPE html>
                <html lang="id">
                <head>
                    <meta charset="utf-8">
                    <title>{$escapedTitle}</title>
                </head>
                <body>
                    <script>
                        (function () {
                            var url = {$escapedUrl};
                            try {
                                if (window.opener && !window.opener.closed) {
                                    window.opener.location.href = url;
                                    window.close();
                                    return;
                                }
                            } catch (e) {}
                            window.location.href = url;
                        }());
                    </script>
                    <noscript><a href="{$escapedHref}">Click here to continue</a></noscript>
                </body>
                </html>
                HTML;

            return new Response($html);
        }

        // Visible card with info or error message.
        $iconColor = $tone === 'error' ? '#dc2626' : '#2563eb';
        $icon = $tone === 'error' ? '⚠️' : 'ℹ️';

        $html = <<<HTML
            <!DOCTYPE html>
            <html lang="id">
            <head>
                <meta charset="utf-8">
                <title>{$escapedTitle}</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                        display: flex; align-items: center; justify-content: center;
                        min-height: 100vh; padding: 24px; background: #f9fafb;
                    }
                    .card {
                        background: white; border-radius: 12px; padding: 32px;
                        max-width: 420px; width: 100%;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center;
                    }
                    .icon { font-size: 48px; margin-bottom: 16px; }
                    .title { color: {$iconColor}; font-size: 18px; font-weight: 600; margin-bottom: 12px; }
                    .message { color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
                    .btn {
                        display: inline-block; padding: 10px 24px;
                        background: #2563eb; color: white; border: none; border-radius: 8px;
                        font-size: 14px; font-weight: 500; cursor: pointer;
                        transition: background 0.2s;
                    }
                    .btn:hover { background: #1d4ed8; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">{$icon}</div>
                    <div class="title">{$escapedTitle}</div>
                    <p class="message">{$messageHtml}</p>
                    <button class="btn" id="dismiss">Oke</button>
                </div>
                <script>
                    (function () {
                        var url = {$escapedUrl};
                        var btn = document.getElementById('dismiss');
                        var hasOpener = false;
                        try {
                            hasOpener = window.opener && !window.opener.closed;
                        } catch (e) {}

                        btn.addEventListener('click', function () {
                            try {
                                if (hasOpener) {
                                    window.opener.location.href = url;
                                    window.close();
                                    return;
                                }
                            } catch (e) {}
                            window.location.href = url;
                        });
                    }());
                </script>
            </body>
            </html>
            HTML;

        return new Response($html);
    }

    /**
     * Build a configured Socialite driver for the given provider.
     *
     * Stateless mode is REQUIRED for the popup flow because the OAuth
     * "state" parameter is bound to the session that opened the popup;
     * by the time the provider redirects back to /auth/{provider}/callback,
     * cross-site cookie policies (SameSite=Lax/Strict) and the new top-level
     * navigation can prevent the original session from being attached, so
     * the state check fails and InvalidStateException leaves the user
     * staring at a blank screen.
     */
    private function socialiteDriver(string $provider, bool $isPopup): AbstractProvider
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        if ($isPopup) {
            $driver = $driver->stateless();
        }

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
