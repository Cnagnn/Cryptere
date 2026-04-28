<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Pennant\Feature;

/**
 * Service for managing A/B testing experiments.
 *
 * Uses Laravel Pennant for variant assignment and the audit_logs
 * table for event tracking / conversion analysis.
 *
 * @see IMPLEMENTATION_PLAN.md R13: A/B Testing Framework
 */
class ExperimentService
{
    /**
     * Get the variant for a given experiment and user.
     */
    public function getVariant(string $featureClass, User $user): mixed
    {
        return Feature::for($user)->value($featureClass);
    }

    /**
     * Track an experiment event (conversion, engagement, etc.)
     * Logs to audit_logs table for later analysis.
     */
    public function trackEvent(User $user, string $experiment, string $event, array $metadata = []): void
    {
        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'action' => "experiment:{$event}",
            'target_type' => 'experiment',
            'target_id' => 0,
            'payload' => json_encode([
                'experiment' => $experiment,
                'variant' => $this->getVariant($experiment, $user),
                ...$metadata,
            ]),
            'created_at' => now(),
        ]);
    }
}
