<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\User;
use App\Services\SocialAvatarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function __construct(private readonly SocialAvatarService $socialAvatarService) {}

    /**
     * Redirect the user to the provider authentication page.
     *
     * @return \Symfony\Component\HttpFoundation\RedirectResponse
     */
    public function redirect(string $provider)
    {
        return Socialite::driver($provider)->redirect();
    }

    /**
     * Obtain the user information from the provider.
     *
     * @return RedirectResponse
     */
    public function callback(\Illuminate\Http\Request $request, string $provider)
    {
        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Exception $e) {
            return redirect()->route('login')->withErrors(['email' => 'Unable to authenticate with '.ucfirst($provider).'. Please try again.']);
        }

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

        if (! $user) {
            $resolvedName = $socialUser->getName() ?? $socialUser->getNickname() ?? 'User';
            $isFirstUser = ! User::query()->exists();

            $user = User::create([
                'name' => $resolvedName,
                'email' => $socialUser->getEmail(),
                'username' => $this->generateUsername($resolvedName),
                'password' => bcrypt(\Illuminate\Support\Str::random(16)),
                'is_admin' => $isFirstUser,
                'role' => $isFirstUser ? 'admin' : 'member',
                'status' => 'active',
            ]);

            $user->markEmailAsVerified();
        }

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

        return redirect()->intended(route('dashboard'));
    }

    /**
     * Generate a unique username.
     *
     * @return string
     */
    protected function generateUsername(string $name)
    {
        $baseUsername = Str::slug($name, '_');

        if (empty($baseUsername)) {
            $baseUsername = 'user';
        }

        $username = $baseUsername;
        $counter = 1;

        while (User::where('username', $username)->exists()) {
            $username = $baseUsername.$counter;
            $counter++;
        }

        return $username;
    }
}
