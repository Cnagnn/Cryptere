<?php

namespace App\Services;

use App\Models\User;

class SocialAvatarService
{
    /**
     * Social accounts remain available for authentication, but profile avatars
     * are resolved from local Pixabots assets or explicit user uploads.
     */
    public function syncUserAvatarFromUrl(User $user, ?string $avatarUrl): void
    {
        //
    }
}
