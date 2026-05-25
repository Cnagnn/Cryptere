<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Storage;

class UserAvatarService
{
    public function delete(User $user): void
    {
        if ($user->hasCustomAvatar() && is_string($user->avatar_path) && $user->avatar_path !== '') {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->forceFill([
            'avatar_path' => null,
            'avatar_mime_type' => null,
            'avatar_image' => null,
        ])->save();
    }

    public function selectPixabot(User $user, string $avatarId): void
    {
        $this->delete($user);

        $user->forceFill([
            'pixabot_avatar_id' => strtolower($avatarId),
        ])->save();
    }
}
