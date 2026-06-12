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

        if ($request->boolean('popup')) {
            $request->session()->put('social_popup', true);
        }

        return $this->socialiteDriver($provider)->redirect();
    }

    /**
     * Obtain the user information from the provider.
     */
    public function callback(Request $request, string $provider): RedirectResponse|Response
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS, true), 404);

        // If user is already authenticated, skip social auth flow
        if (Auth::check()) {
            return redirect()->route('dashboard');
        }

        try {
            $socialUser = $this->socialiteDriver($provider)->user();
        } catch (\Exception $e) {
            Log::error('Social auth failed for '.$provider.': '.$e->getMessage(), [
                'exception' => $e,
            ]);

            return redirect()->route('login')->withErrors([
                'email' => 'Unable to authenticate with '.ucfirst($provider).'. Please try again.',
            ]);
        }

        // Case 1: Existing social account — update info and login directly
        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_user_id', $socialUser->getId())
            ->first();

        if ($socialAccount) {
            $socialAccount->update([
                'provider_email' => $socialUser->getEmail(),
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

        $user = User::where('email', $socialUser->getEmail())->first();

        // Case 2: Existing user by email — do NOT auto-link (prevents account hijacking)
        if ($user) {
            $request->session()->put('social_user', [
                'provider' => $provider,
                'id' => $socialUser->getId(),
                'email' => $socialUser->getEmail(),
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
        $request->session()->put('social_user', [
            'provider' => $provider,
            'id' => $socialUser->getId(),
            'email' => $socialUser->getEmail(),
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

        $escapedUrl = json_encode($url, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT);
        $escapedHref = htmlspecialchars($url, ENT_QUOTES, 'UTF-8');

        $html = <<<HTML
            <!DOCTYPE html>
            <html>
            <head><title>Authenticating...</title></head>
            <body>
                <script>
                    var url = {$escapedUrl};
                    if (window.opener) {
                        window.opener.location.href = url;
                        window.close();
                    } else {
                        window.location.href = url;
                    }
                </script>
                <noscript><a href="{$escapedHref}">Click here to continue</a></noscript>
            </body>
            </html>
            HTML;

        return new Response($html);
    }

    /**
     * Show a message inside the popup, or redirect with error for non-popup flow.
     */
    private function popupMessage(Request $request, string $message, string $fallbackUrl): RedirectResponse|Response
    {
        if (! $request->session()->pull('social_popup')) {
            return redirect()->to($fallbackUrl)->withErrors(['email' => $message]);
        }

        $escapedMessage = htmlspecialchars($message, ENT_QUOTES, 'UTF-8');
        $escapedFallbackUrl = htmlspecialchars($fallbackUrl, ENT_QUOTES, 'UTF-8');

        $html = <<<HTML
            <!DOCTYPE html>
            <html>
            <head>
                <title>Informasi</title>
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; background: #f9fafb; }
                    .card { background: white; border-radius: 12px; padding: 32px; max-width: 400px; width: 100%; box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-align: center; }
                    .icon { font-size: 48px; margin-bottom: 16px; }
                    .message { color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
                    .btn { display: inline-block; padding: 10px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background 0.2s; }
                    .btn:hover { background: #1d4ed8; }
                </style>
            </head>
            <body>
                <div class="card">
                    <div class="icon">ℹ️</div>
                    <p class="message">{$escapedMessage}</p>
                    <button class="btn" onclick="window.close()">Oke, saya mengerti</button>
                </div>
                <script>
                    // If popup was blocked and this opened as a tab, provide fallback
                    if (!window.opener) {
                        document.querySelector('.btn').onclick = function() {
                            window.location.href = '{$escapedFallbackUrl}';
                        };
                    }
                </script>
            </body>
            </html>
            HTML;

        return new Response($html);
    }

    private function socialiteDriver(string $provider): AbstractProvider
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider);

        // Use stateless mode for popup flow to avoid session/state conflicts
        // between the popup window and the parent window
        if (session()->get('social_popup')) {
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
