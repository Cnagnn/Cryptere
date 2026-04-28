<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminChallengeQuestionsRequest;
use App\Http\Requests\Admin\StoreAdminChallengeQuestionRequest;
use App\Http\Requests\Admin\UpdateAdminChallengeQuestionRequest;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;

class ChallengeQuestionController extends Controller
{
    /**
     * Store a new question for a challenge.
     */
    public function store(StoreAdminChallengeQuestionRequest $request, Challenge $challenge): RedirectResponse
    {
        $validated = $request->validated();
        $nextSortOrder = (int) $challenge->questions()->max('sort_order') + 1;

        $question = $challenge->questions()->create([
            'type' => $validated['type'],
            'question' => $validated['question'],
            'options' => $validated['options'] ?? null,
            'correct_answer' => $validated['correct_answer'],
            'explanation' => $validated['explanation'] ?? null,
            'sort_order' => $nextSortOrder,
        ]);

        app(AuditService::class)->log($request->user(), 'created', $question);

        return back()->with('success', 'Question added.');
    }

    /**
     * Update an existing question.
     */
    public function update(UpdateAdminChallengeQuestionRequest $request, Challenge $challenge, ChallengeQuestion $question): RedirectResponse
    {
        abort_unless($question->challenge_id === $challenge->id, 404);

        $validated = $request->validated();

        $question->update([
            'type' => $validated['type'],
            'question' => $validated['question'],
            'options' => $validated['options'] ?? null,
            'correct_answer' => $validated['correct_answer'],
            'explanation' => $validated['explanation'] ?? null,
        ]);

        app(AuditService::class)->log($request->user(), 'updated', $question);

        return back()->with('success', 'Question updated.');
    }

    /**
     * Delete a question.
     */
    public function destroy(Challenge $challenge, ChallengeQuestion $question): RedirectResponse
    {
        abort_unless($question->challenge_id === $challenge->id, 404);

        app(AuditService::class)->log(request()->user(), 'deleted', $question);

        $question->delete();

        return back()->with('success', 'Question deleted.');
    }

    /**
     * Reorder questions within a challenge.
     */
    public function reorder(ReorderAdminChallengeQuestionsRequest $request, Challenge $challenge): RedirectResponse
    {
        $items = collect($request->validated('items'));

        DB::transaction(function () use ($items): void {
            $items->each(function (array $item): void {
                ChallengeQuestion::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order'] + 1000]);
            });

            $items->each(function (array $item): void {
                ChallengeQuestion::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order']]);
            });
        });

        return back()->with('success', 'Question order updated.');
    }
}
