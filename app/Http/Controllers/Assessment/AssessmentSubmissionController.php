<?php

namespace App\Http\Controllers\Assessment;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentSubmission;
use App\Services\AssessmentGradingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentSubmissionController extends Controller
{
    public function __construct(
        private readonly AssessmentGradingService $gradingService,
    ) {}

    /**
     * Start a new assessment attempt.
     */
    public function start(Request $request, Assessment $assessment): RedirectResponse
    {
        $this->authorize('attempt', $assessment);

        $user = $request->user();

        // Check for existing in-progress submission
        $existing = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->first();

        if ($existing) {
            $redirectRoute = $assessment->course_id
                ? redirect()->route('courses.show', $assessment->course->slug)
                : redirect()->route('assessments.show', $assessment->slug);

            return $redirectRoute->with('info', 'You have an in-progress attempt. Continue where you left off.');
        }

        // Determine attempt number
        $attemptNumber = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->max('attempt_number') + 1;

        // Create submission with empty answers
        DB::transaction(function () use ($user, $assessment, $attemptNumber) {
            $submission = AssessmentSubmission::create([
                'user_id' => $user->id,
                'assessment_id' => $assessment->id,
                'attempt_number' => $attemptNumber,
                'status' => AssessmentSubmission::STATUS_IN_PROGRESS,
                'started_at' => now(),
            ]);

            // Pre-create answer slots for each question
            $questions = $assessment->questions()->get();
            foreach ($questions as $question) {
                AssessmentAnswer::create([
                    'submission_id' => $submission->id,
                    'question_id' => $question->id,
                    'max_points' => $question->points,
                ]);
            }
        });

        $redirectRoute = $assessment->course_id
            ? route('courses.show', $assessment->course->slug)
            : route('assessments.show', $assessment->slug);

        return redirect($redirectRoute)
            ->with('success', 'Assessment started. Good luck!');
    }

    /**
     * Save a single answer (auto-save as student works).
     */
    public function saveAnswer(Request $request, Assessment $assessment): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'question_id' => ['required', 'integer', 'exists:assessment_questions,id'],
            'answer_text' => ['nullable', 'string', 'max:5000'],
            'selected_option' => ['nullable', 'string', 'max:500'],
        ]);

        $submission = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->firstOrFail();

        $answer = AssessmentAnswer::query()
            ->where('submission_id', $submission->id)
            ->where('question_id', $validated['question_id'])
            ->firstOrFail();

        $answer->update([
            'answer_text' => $validated['answer_text'] ?? $answer->answer_text,
            'selected_option' => $validated['selected_option'] ?? $answer->selected_option,
        ]);

        return response()->json(['saved' => true]);
    }

    /**
     * Submit the assessment for grading.
     */
    public function submit(Request $request, Assessment $assessment): RedirectResponse
    {
        $user = $request->user();

        $submission = AssessmentSubmission::query()
            ->forUser($user)
            ->where('assessment_id', $assessment->id)
            ->where('status', AssessmentSubmission::STATUS_IN_PROGRESS)
            ->firstOrFail();

        // Update submission status
        $submission->update([
            'status' => AssessmentSubmission::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ]);

        // Process grading (auto-grade objective, queue manual)
        $this->gradingService->processSubmission($submission);

        $message = $assessment->requiresManualGrading()
            ? 'Assessment submitted! Objective questions have been auto-graded. Subjective answers are queued for manual review.'
            : 'Assessment submitted and graded!';

        $redirectRoute = $assessment->course_id
            ? route('courses.show', $assessment->course->slug)
            : route('assessments.show', $assessment->slug);

        return redirect($redirectRoute)
            ->with('success', $message);
    }

    /**
     * View a graded submission's results.
     */
    public function results(Request $request, Assessment $assessment, AssessmentSubmission $submission): Response
    {
        // Ensure the submission belongs to the user (or admin)
        if ($submission->user_id !== $request->user()->id && ! $request->user()->isAdmin()) {
            abort(403);
        }

        $submission->load(['answers.question', 'grader:id,name']);

        $answers = $submission->answers->map(fn (AssessmentAnswer $answer) => [
            'id' => $answer->id,
            'questionId' => $answer->question_id,
            'questionText' => $answer->question->question_text,
            'questionType' => $answer->question->question_type,
            'bloomLevel' => $answer->question->bloom_level,
            'answerText' => $answer->answer_text,
            'selectedOption' => $answer->selected_option,
            'isCorrect' => $answer->is_correct,
            'pointsAwarded' => $answer->points_awarded,
            'maxPoints' => $answer->max_points,
            'rubricScores' => $answer->rubric_scores,
            'feedback' => $answer->feedback,
            'explanation' => $answer->question->explanation,
            'correctAnswer' => $submission->status === 'graded' ? $answer->question->correct_answer : null,
        ]);

        // Load course context for breadcrumbs
        $courseContext = null;
        if ($assessment->course_id) {
            $course = $assessment->course;
            if ($course) {
                $courseContext = [
                    'slug' => $course->slug,
                    'title' => $course->title,
                ];
            }
        }

        return Inertia::render('assessments/results', [
            'assessment' => [
                'id' => $assessment->id,
                'slug' => $assessment->slug,
                'title' => $assessment->title,
                'bloomLevel' => $assessment->bloom_level,
                'bloomLabel' => $assessment->bloom_label,
                'passingScore' => $assessment->passing_score,
            ],
            'submission' => [
                'id' => $submission->id,
                'attemptNumber' => $submission->attempt_number,
                'status' => $submission->status,
                'totalScore' => $submission->total_score,
                'pointsEarned' => $submission->points_earned,
                'pointsPossible' => $submission->points_possible,
                'passed' => $submission->passed,
                'submittedAt' => $submission->submitted_at?->toIso8601String(),
                'gradedAt' => $submission->graded_at?->toIso8601String(),
                'overallFeedback' => $submission->overall_feedback,
                'graderName' => $submission->grader?->name,
            ],
            'answers' => $answers,
            'courseContext' => $courseContext,
        ]);
    }
}
