<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Services\RubricScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AssessmentQuestionController extends Controller
{
    public function __construct(
        private readonly RubricScoringService $rubricService,
    ) {}

    /**
     * Store a new question for an assessment.
     */
    public function store(Request $request, Assessment $assessment): RedirectResponse
    {
        $validated = $request->validate([
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'question_type' => ['required', 'in:mcq,true_false,short_answer,essay,computation,case_study,design'],
            'question_text' => ['required', 'string', 'max:5000'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:500'],
            'correct_answer' => ['nullable', 'string', 'max:2000'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'rubric' => ['nullable', 'array'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'grading_type' => ['required', 'in:auto,manual'],
            'min_words' => ['nullable', 'integer', 'min:1'],
            'max_words' => ['nullable', 'integer', 'min:1'],
        ]);

        $nextSortOrder = (int) $assessment->questions()->max('sort_order') + 1;

        // Auto-generate rubric if manual grading and no rubric provided
        if ($validated['grading_type'] === 'manual' && empty($validated['rubric'])) {
            $validated['rubric'] = $this->rubricService->generateDefaultRubric(
                $validated['bloom_level'],
                $validated['question_type'],
                $validated['points'],
            );
        }

        $assessment->questions()->create([
            ...$validated,
            'sort_order' => $nextSortOrder,
        ]);

        return back()->with('success', 'Question added.');
    }

    /**
     * Update an existing question.
     */
    public function update(Request $request, Assessment $assessment, AssessmentQuestion $question): RedirectResponse
    {
        $validated = $request->validate([
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'question_type' => ['required', 'in:mcq,true_false,short_answer,essay,computation,case_study,design'],
            'question_text' => ['required', 'string', 'max:5000'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:500'],
            'correct_answer' => ['nullable', 'string', 'max:2000'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'rubric' => ['nullable', 'array'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'grading_type' => ['required', 'in:auto,manual'],
            'min_words' => ['nullable', 'integer', 'min:1'],
            'max_words' => ['nullable', 'integer', 'min:1'],
        ]);

        $question->update($validated);

        return back()->with('success', 'Question updated.');
    }

    /**
     * Delete a question.
     */
    public function destroy(Assessment $assessment, AssessmentQuestion $question): RedirectResponse
    {
        $question->delete();

        return back()->with('success', 'Question deleted.');
    }

    /**
     * Reorder questions within an assessment.
     */
    public function reorder(Request $request, Assessment $assessment): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:assessment_questions,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['items'] as $item) {
            AssessmentQuestion::where('id', $item['id'])
                ->where('assessment_id', $assessment->id)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Question order updated.');
    }
}
