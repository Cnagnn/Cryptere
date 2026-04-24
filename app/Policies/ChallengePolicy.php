<?php

namespace App\Policies;

use App\Models\Challenge;
use App\Models\User;

class ChallengePolicy
{
    /**
     * Determine whether the user can view any challenges.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the challenge.
     */
    public function view(User $user, Challenge $challenge): bool
    {
        return $challenge->is_published || $user->isAdmin();
    }

    /**
     * Determine whether the user can create challenges.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the challenge.
     */
    public function update(User $user, Challenge $challenge): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the challenge.
     */
    public function delete(User $user, Challenge $challenge): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can submit answers to the challenge.
     */
    public function submit(User $user, Challenge $challenge): bool
    {
        return $challenge->is_published;
    }
}
