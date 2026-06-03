<?php

namespace App\Http\Controllers;

use App\Models\User;
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
     * Redirect to the authenticated user's own profile page.
     */
    public function showOwn(Request $request): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        if ($request->query('tab') === 'settings') {
            return redirect()->route('profile.settings', $user->username);
        }

        return redirect()->route('profile.show', [
            'user' => $user->username,
        ]);
    }

    /**
     * Display the given user's profile.
     *
     * If the profile is private and the viewer is not the owner,
     * render a "profile is private" view instead.
     */
    public function show(User $user): Response
    {
        $isOwner = Auth::id() === $user->id;

        // Private profile guard
        if (! $user->isProfilePublic() && ! $isOwner) {
            return Inertia::render('profile/show', [
                'profileUser' => $this->profilePageData->privateProfile($user),
                'isOwner' => false,
                'isPrivate' => true,
                'badges' => [],
            ]);
        }

        return Inertia::render('profile/show', [
            'profileUser' => $this->profilePageData->profileUser($user, $isOwner),
            'isOwner' => $isOwner,
            'isPrivate' => false,
            'mustVerifyEmail' => $isOwner && $user instanceof MustVerifyEmail,
            'status' => $isOwner ? session('status') : null,
            'badges' => $this->profilePageData->badges($user),
        ]);
    }

    /**
     * Display the authenticated owner's profile settings.
     */
    public function settings(User $user): Response
    {
        abort_unless(Auth::id() === $user->id, 403);

        return Inertia::render('profile/settings', [
            'profileUser' => $this->profilePageData->profileUser($user, true),
            'isOwner' => true,
            'isPrivate' => false,
            'mustVerifyEmail' => $user instanceof MustVerifyEmail,
            'status' => session('status'),
            'badges' => $this->profilePageData->badges($user),
            ...$this->settingsProps($user),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function settingsProps(User $user): array
    {
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

        return [
            'avatarOptions' => $this->pixabotAvatars->options($user),
            'profileUrl' => route('profile.show', $user->username),
            'socialAccounts' => $user->socialAccounts()
                ->select('id', 'provider', 'provider_email', 'provider_name', 'created_at')
                ->get(),
            'hasPassword' => $this->userHasUsablePassword($user),
            ...$twoFactorProps,
        ];
    }

    private function userHasUsablePassword(User $user): bool
    {
        $password = $user->getAuthPassword();

        return $password !== null && $password !== '';
    }
}
