<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UserAvatarService
{
    public function store(User $user, UploadedFile $avatar): void
    {
        $this->delete($user);

        $extension = $avatar->extension() ?: 'png';
        $path = $avatar->storeAs("avatars/{$user->id}", "avatar.{$extension}", 'public');

        $user->forceFill([
            'avatar_path' => $path,
            'avatar_mime_type' => $avatar->getMimeType(),
            'avatar_image' => null,
            'pixabot_avatar_id' => null,
        ])->save();
    }

    public function delete(User $user): void
    {
        if (is_string($user->avatar_path) && $user->avatar_path !== '') {
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
