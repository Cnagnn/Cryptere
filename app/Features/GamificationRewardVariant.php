<?php

namespace App\Features;

use Illuminate\Support\Lottery;

/**
 * A/B test for gamification reward values.
 *
 * 50/50 split: 'control' uses current reward values,
 * 'variant_a' uses boosted values.
 *
 * @see IMPLEMENTATION_PLAN.md R13: A/B Testing Framework
 */
class GamificationRewardVariant
{
    /**
     * Resolve the variant for the given scope (user).
     *
     * Once resolved, Laravel Pennant persists the value so each user
     * stays in the same bucket for the lifetime of the experiment.
     */
    public function resolve(mixed $scope): string
    {
        return Lottery::odds(1, 2)
            ->winner(fn () => 'variant_a')
            ->loser(fn () => 'control')
            ->choose();
    }
}
