<?php

namespace App\Policies;

use App\Models\Assessment;
use App\Models\Enrollment;
use App\Models\User;

class AssessmentPolicy
{
    /**
     * Determine whether the user can view any assessments.
     */
    public function viewAny(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can view the assessment.
     */
    public function view(User $user, Assessment $assessment): bool
    {
        return $assessment->is_published || $user->isAdmin();
    }

    /**
     * Determine whether the user can attempt the assessment.
     * Assessment can be attempted even if lessons are not completed.
     */
    public function attempt(User $user, Assessment $assessment): bool
    {
        if (! $assessment->isAvailable()) {
            return false;
        }

        // If assessment belongs to a course, user must be enrolled
        if ($assessment->course_id !== null) {
            $enrollment = Enrollment::query()
                ->where('user_id', $user->id)
                ->where('course_id', $assessment->course_id)
                ->first();

            if (! $enrollment) {
                return false;
            }
        }

        return $assessment->canAttempt($user);
    }

    /**
     * Determine whether the user can create assessments.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can update the assessment.
     */
    public function update(User $user, Assessment $assessment): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the assessment.
     */
    public function delete(User $user, Assessment $assessment): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can grade submissions.
     */
    public function grade(User $user): bool
    {
        return $user->isAdmin();
    }
}
