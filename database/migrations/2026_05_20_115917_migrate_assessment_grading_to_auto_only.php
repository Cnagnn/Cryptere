<?php

use App\Models\AssessmentSubmission;
use App\Services\AssessmentGradingService;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * The application now grades every quiz and assessment automatically. This
     * migration normalises legacy data so:
     *
     *  - assessments and questions previously flagged manual/mixed are flipped
     *    to auto so the new grading service handles them;
     *  - any submission that had been queued for manual review (status =
     *    submitted/grading) is auto-graded immediately by re-finalising via
     *    the grading service, so learners are not left in limbo.
     */
    public function up(): void
    {
        DB::table('assessments')
            ->whereIn('grading_type', ['manual', 'mixed'])
            ->update(['grading_type' => 'auto']);

        DB::table('assessment_questions')
            ->whereIn('grading_type', ['manual', 'mixed'])
            ->update(['grading_type' => 'auto']);

        // Re-grade any submission that was previously queued for manual review.
        AssessmentSubmission::query()
            ->whereIn('status', ['submitted', 'grading'])
            ->with('assessment')
            ->each(function (AssessmentSubmission $submission): void {
                /** @var AssessmentGradingService $service */
                $service = app(AssessmentGradingService::class);
                $service->processSubmission($submission);
            });
    }

    public function down(): void
    {
        // Irreversible: we cannot reconstruct the previous manual/mixed grading
        // configuration. Leaving the data normalised on rollback is safe.
    }
};
