<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SocialAccountController extends Controller
{
    /**
     * Disconnect a social account from the user's profile.
     */
    public function destroy(Request $request, SocialAccount $socialAccount): RedirectResponse
    {
        abort_unless($socialAccount->user_id === $request->user()->id, 403);

        $user = $request->user();
        $hasRemainingAccounts = $user->socialAccounts()->whereKeyNot($socialAccount->id)->exists();
        $hasPassword = $this->userHasUsablePassword($user);

        if (! $hasPassword && ! $hasRemainingAccounts) {
            return back()->withErrors([
                'social' => 'You must set a password before disconnecting your last social account.',
            ]);
        }

        $providerName = ucfirst($socialAccount->provider);
        $socialAccount->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$providerName} account disconnected."]);

        return to_route('profile.settings', $user->username);
    }

    /**
     * Determine if the user has a usable (non-empty) password.
     */
    private function userHasUsablePassword(mixed $user): bool
    {
        $password = $user->getAuthPassword();

        return $password !== '' && $password !== null;
    }
}
