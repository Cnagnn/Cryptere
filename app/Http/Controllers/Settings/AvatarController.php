<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AvatarUpdateRequest;
use App\Services\PixabotAvatarService;
use App\Services\UserAvatarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

class AvatarController extends Controller
{
    public function update(AvatarUpdateRequest $request, UserAvatarService $avatars): RedirectResponse
    {
        $avatars->store($request->user(), $request->file('avatar'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Avatar updated.')]);

        return to_route('settings.profile.edit');
    }

    public function destroy(Request $request, UserAvatarService $avatars): RedirectResponse
    {
        $avatars->delete($request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Avatar removed.')]);

        return to_route('settings.profile.edit');
    }

    public function pixabot(Request $request, UserAvatarService $avatars, PixabotAvatarService $pixabots): RedirectResponse
    {
        $validated = $request->validate([
            'pixabot_avatar_id' => ['required', 'string', 'regex:/^[a-f0-9]{4}$/i'],
        ]);

        $avatarId = strtolower($validated['pixabot_avatar_id']);

        if (! $pixabots->isValidId($avatarId, $request->user())) {
            throw ValidationException::withMessages([
                'pixabot_avatar_id' => __('Please choose a valid Pixabots avatar.'),
            ]);
        }

        $avatars->selectPixabot($request->user(), $avatarId);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Avatar updated.')]);

        return to_route('settings.profile.edit');
    }
}
