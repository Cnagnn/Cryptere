<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ProfilePageData;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(private ProfilePageData $profilePageData) {}

    /**
     * Redirect to the authenticated user's own profile page.
     */
    public function showOwn(): RedirectResponse
    {
        /** @var User $user */
        $user = Auth::user();

        return redirect()->route('profile.show', $user->username);
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
}
