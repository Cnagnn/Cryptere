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

            $message = 'Akun dengan email ini sudah terdaftar. Silakan masuk terlebih dahulu, lalu hubungkan akun '.ucfirst($provider).' Anda di pengaturan.';

            return $this->popupOrRedirect($request, route('login', ['message' => $message]));
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

    private function socialiteDriver(string $provider): AbstractProvider
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
