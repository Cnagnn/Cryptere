<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminAssessmentQuestionsRequest;
use App\Http\Requests\Admin\StoreAdminAssessmentQuestionRequest;
use App\Http\Requests\Admin\UpdateAdminAssessmentQuestionRequest;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\QuestionBank;
use Illuminate\Http\RedirectResponse;

class AssessmentQuestionController extends Controller
{
    /**
     * Store a new question for an assessment.
     */
    public function store(StoreAdminAssessmentQuestionRequest $request, Assessment $assessment): RedirectResponse
    {
        $validated = $request->validated();

        $nextSortOrder = (int) $assessment->questions()->max('sort_order') + 1;

        $assessment->questions()->create([
            ...$validated,
            'sort_order' => $nextSortOrder,
            'times_shown' => 0,
            'times_correct' => 0,
        ]);

        // If created from question bank, increment usage
        if (! empty($validated['question_bank_id'])) {
            $questionBank = QuestionBank::find($validated['question_bank_id']);
            $questionBank?->incrementUsage();
        }

        return back()->with('success', 'Question added.');
    }

    /**
     * Update an existing question.
     */
    public function update(UpdateAdminAssessmentQuestionRequest $request, Assessment $assessment, AssessmentQuestion $question): RedirectResponse
    {
        $this->ensureQuestionBelongsToAssessment($assessment, $question);

        $validated = $request->validated();

        $question->update($validated);

        return back()->with('success', 'Question updated.');
    }

    /**
     * Delete a question.
     */
    public function destroy(Assessment $assessment, AssessmentQuestion $question): RedirectResponse
    {
        $this->ensureQuestionBelongsToAssessment($assessment, $question);

        if ($question->answers()->exists()) {
            return back()->withErrors([
                'question' => __('This question already has submitted answers and cannot be deleted.'),
            ]);
        }

        $question->delete();

        return back()->with('success', 'Question deleted.');
    }

    /**
     * Reorder questions within an assessment.
     */
    public function reorder(ReorderAdminAssessmentQuestionsRequest $request, Assessment $assessment): RedirectResponse
    {
        $validated = $request->validated();

        foreach ($validated['items'] as $item) {
            AssessmentQuestion::where('id', $item['id'])
                ->where('assessment_id', $assessment->id)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Question order updated.');
    }

    private function ensureQuestionBelongsToAssessment(Assessment $assessment, AssessmentQuestion $question): void
    {
        abort_unless((int) $question->assessment_id === (int) $assessment->id, 404);
    }
}
