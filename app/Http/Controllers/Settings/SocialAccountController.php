<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SocialAccountController extends Controller
{
    /**
     * Show the user's connected social accounts.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/social-accounts', [
            'socialAccounts' => $request->user()
                ->socialAccounts()
                ->select('id', 'provider', 'provider_email', 'provider_name', 'created_at')
                ->get(),
            'hasPassword' => $this->userHasUsablePassword($request->user()),
        ]);
    }

    /**
     * Disconnect a social account from the user's profile.
     */
    public function destroy(Request $request, SocialAccount $socialAccount): RedirectResponse
    {
        abort_unless($socialAccount->user_id === $request->user()->id, 403);

        $user = $request->user();
        $remainingAccounts = $user->socialAccounts()->where('id', '!=', $socialAccount->id)->count();
        $hasPassword = $this->userHasUsablePassword($user);

        if (! $hasPassword && $remainingAccounts === 0) {
            return back()->withErrors([
                'social' => 'You must set a password before disconnecting your last social account.',
            ]);
        }

        $providerName = ucfirst($socialAccount->provider);
        $socialAccount->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => "{$providerName} account disconnected."]);

        return to_route('settings.social-accounts.edit');
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
