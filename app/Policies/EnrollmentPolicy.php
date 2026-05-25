<?php

namespace App\Policies;

use App\Models\Enrollment;
use App\Models\User;

class EnrollmentPolicy
{
    /**
     * Determine whether the user can view the enrollment.
     */
    public function view(User $user, Enrollment $enrollment): bool
    {
        return $user->id === $enrollment->user_id || $user->can(User::PERMISSION_MANAGE_ENROLLMENTS);
    }

    /**
     * Determine whether the user can reset the enrollment progress.
     */
    public function reset(User $user, Enrollment $enrollment): bool
    {
        return $user->id === $enrollment->user_id;
    }

    /**
     * Determine whether the user can delete the enrollment.
     */
    public function delete(User $user, Enrollment $enrollment): bool
    {
        return $user->can(User::PERMISSION_MANAGE_ENROLLMENTS);
    }
}
