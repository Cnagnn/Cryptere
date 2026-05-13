<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AvatarUpdateRequest;
use App\Services\UserAvatarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
}
