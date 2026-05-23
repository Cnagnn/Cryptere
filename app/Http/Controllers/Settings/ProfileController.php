<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use App\Services\PixabotAvatarService;
use App\Services\ProfilePageData;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class ProfileController extends Controller
{
    public function __construct(
        private ProfilePageData $profilePageData,
        private PixabotAvatarService $pixabotAvatars,
    ) {}

    /**
     * Show the user's profile settings page.
     *
     * Consolidates profile, badges, security, social accounts, and appearance
     * into a single unified settings view (Google Developer Program style).
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Social accounts for the settings tab
        $socialAccounts = $user->socialAccounts()
            ->select('id', 'provider', 'provider_email', 'provider_name', 'created_at')
            ->get();

        // Two-factor props for the settings tab
        $twoFactorProps = [
            'canManageTwoFactor' => Features::canManageTwoFactorAuthentication(),
            'twoFactorEnabled' => false,
            'requiresConfirmation' => false,
        ];

        if (Features::canManageTwoFactorAuthentication()) {
            $twoFactorProps['twoFactorEnabled'] = $user->hasEnabledTwoFactorAuthentication();
            $twoFactorProps['requiresConfirmation'] = Features::optionEnabled(
                Features::twoFactorAuthentication(),
                'confirm',
            );
        }

        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
            'profileUser' => $this->profilePageData->profileUser($user, true),
            'avatarOptions' => $this->pixabotAvatars->options($user),
            'profileUrl' => route('profile.show', $user->username),
            'badges' => $this->profilePageData->badges($user),
            'socialAccounts' => $socialAccounts,
            'hasPassword' => $this->userHasUsablePassword($user),
            ...$twoFactorProps,
        ]);
    }

    /**
     * Check if the user has a usable password set.
     */
    private function userHasUsablePassword(mixed $user): bool
    {
        return $user->password !== null && $user->password !== '';
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('settings.profile.edit');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
