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
    public function redirect(string $provider)
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS, true), 404);

        return $this->socialiteDriver($provider)->redirect();
    }

    /**
     * Obtain the user information from the provider.
     */
    public function callback(Request $request, string $provider): RedirectResponse
    {
        abort_unless(in_array($provider, self::ALLOWED_PROVIDERS, true), 404);

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

            return redirect()->intended(route('dashboard'));
        }

        $user = User::where('email', $socialUser->getEmail())->first();

        // Case 2: Existing user by email — link social account and login
        if ($user) {
            $user->socialAccounts()->create([
                'provider' => $provider,
                'provider_user_id' => $socialUser->getId(),
                'provider_email' => $socialUser->getEmail(),
                'provider_name' => $socialUser->getName(),
                'provider_avatar' => $socialUser->getAvatar(),
            ]);

            if (! $user->hasVerifiedEmail()) {
                $user->markEmailAsVerified();
            }

            $this->socialAvatarService->syncUserAvatarFromUrl($user, $socialUser->getAvatar());

            Auth::login($user, true);
            $request->session()->regenerate();

            return redirect()->intended(route('dashboard'))
                ->with('status', 'Your '.ucfirst($provider).' account has been linked.');
        }

        // Case 3: New user — store social data in session and redirect to register
        $request->session()->put('social_user', [
            'provider' => $provider,
            'id' => $socialUser->getId(),
            'email' => $socialUser->getEmail(),
            'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
            'avatar' => $socialUser->getAvatar(),
            'nickname' => $socialUser->getNickname(),
        ]);

        return redirect()->route('register');
    }

    private function socialiteDriver(string $provider): AbstractProvider
    {
        /** @var AbstractProvider $driver */
        $driver = Socialite::driver($provider)->stateless();

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
