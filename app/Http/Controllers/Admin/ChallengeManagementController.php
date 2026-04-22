<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminChallengeQuestionsRequest;
use App\Http\Requests\Admin\ReorderAdminChallengesRequest;
use App\Http\Requests\Admin\StoreAdminChallengeQuestionRequest;
use App\Http\Requests\Admin\StoreAdminChallengeRequest;
use App\Http\Requests\Admin\UpdateAdminChallengeQuestionRequest;
use App\Http\Requests\Admin\UpdateAdminChallengeRequest;
use App\Models\Challenge;
use App\Models\ChallengeQuestion;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ChallengeManagementController extends Controller
{
    private const SECTION_CATALOG = 'catalog';

    private const SECTION_QUESTION = 'question';

    private const ALLOWED_SECTIONS = [
        self::SECTION_CATALOG,
        self::SECTION_QUESTION,
    ];

    /**
     * Display challenges management listing.
     */
    public function index(Request $request): Response
    {
        $section = (string) $request->input('section', self::SECTION_CATALOG);

        if (! in_array($section, self::ALLOWED_SECTIONS, true)) {
            $section = self::SECTION_CATALOG;
        }

        $search = trim((string) $request->input('search', ''));
        $perPage = (int) $request->integer('per_page', 10);
        $perPage = max(10, min($perPage, 100));

        $challenges = Challenge::query()
            ->searchManagement($search)
            ->withCount('questions')
            ->orderBy('sort_order')
            ->orderBy('title')
            ->paginate($perPage, ['id', 'slug', 'title', 'prompt', 'hint', 'expected_answer', 'sort_order', 'is_published', 'time_start', 'time_end', 'time_limit_seconds', 'questions_per_session', 'max_points_per_question', 'created_at'])
            ->withQueryString();

        // Load questions for the selected challenge (if editing question bank)
        $selectedChallengeId = $request->integer('challenge_id');
        $questions = [];

        if ($selectedChallengeId > 0) {
            $questions = ChallengeQuestion::query()
                ->where('challenge_id', $selectedChallengeId)
                ->orderBy('sort_order')
                ->get(['id', 'challenge_id', 'type', 'question', 'options', 'correct_answer', 'explanation', 'sort_order'])
                ->makeVisible('correct_answer')
                ->toArray();
        }

        return Inertia::render('admin/challenges/index', [
            'section' => $section,
            'challenges' => $challenges,
            'questions' => $questions,
            'selectedChallengeId' => $selectedChallengeId,
            'filters' => [
                'search' => $search,
            ],
        ]);
    }

    /**
     * Store a new managed challenge.
     */
    public function store(StoreAdminChallengeRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $nextSortOrder = (int) Challenge::query()->max('sort_order') + 1;

        Challenge::query()->create([
            'title' => $validated['title'],
            'prompt' => $validated['prompt'],
            'hint' => $validated['hint'] ?? null,
            'time_start' => $validated['time_start'],
            'time_end' => $validated['time_end'],
            'expected_answer' => $validated['expected_answer'],
            'slug' => $this->generateUniqueSlug($validated['title']),
            'sort_order' => $nextSortOrder,
            'is_published' => (bool) ($validated['is_published'] ?? true),
            'time_limit_seconds' => $validated['time_limit_seconds'] ?? 20,
            'questions_per_session' => $validated['questions_per_session'] ?? 10,
            'max_points_per_question' => $validated['max_points_per_question'] ?? 1000,
        ]);

        return back()->with('success', 'Challenge created.');
    }

    /**
     * Update an existing managed challenge.
     */
    public function update(UpdateAdminChallengeRequest $request, Challenge $challenge): RedirectResponse
    {
        $validated = $request->validated();

        $challenge->update([
            'title' => $validated['title'],
            'prompt' => $validated['prompt'],
            'hint' => $validated['hint'] ?? null,
            'time_start' => $validated['time_start'],
            'time_end' => $validated['time_end'],
            'expected_answer' => $validated['expected_answer'],
            'is_published' => (bool) ($validated['is_published'] ?? $challenge->is_published),
            'slug' => $challenge->title === $validated['title']
                ? $challenge->slug
                : $this->generateUniqueSlug($validated['title'], $challenge),
            'time_limit_seconds' => $validated['time_limit_seconds'] ?? $challenge->time_limit_seconds,
            'questions_per_session' => $validated['questions_per_session'] ?? $challenge->questions_per_session,
            'max_points_per_question' => $validated['max_points_per_question'] ?? $challenge->max_points_per_question,
        ]);

        return back()->with('success', 'Challenge updated.');
    }

    /**
     * Delete a managed challenge.
     */
    public function destroy(Challenge $challenge): RedirectResponse
    {
        $challenge->delete();

        return back()->with('success', 'Challenge deleted.');
    }

    public function reorder(ReorderAdminChallengesRequest $request): RedirectResponse
    {
        $items = collect($request->validated('items'));

        DB::transaction(function () use ($items): void {
            $items->each(function (array $item): void {
                Challenge::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order'] + 1000]);
            });

            $items->each(function (array $item): void {
                Challenge::query()
                    ->whereKey((int) $item['id'])
                    ->update(['sort_order' => (int) $item['sort_order']]);
            });
        });

        return back()->with('success', 'Challenge order updated.');
    }

    /**
     * Store a new question for a challenge.
     */
    public function storeQuestion(StoreAdminChallengeQuestionRequest $request, Challenge $challenge): RedirectResponse
    {
        $validated = $request->validated();
        $nextSortOrder = (int) $challenge->questions()->max('sort_order') + 1;

        $challenge->questions()->create([
            'type' => $validated['type'],
            'question' => $validated['question'],
            'options' => $validated['options'] ?? null,
            'correct_answer' => $validated['correct_answer'],
            'explanation' => $validated['explanation'] ?? null,
            'sort_order' => $nextSortOrder,
        ]);

        return back()->with('success', 'Question added.');
    }

    /**
     * Update an existing question.
     */
    public function updateQuestion(UpdateAdminChallengeQuestionRequest $request, Challenge $challenge, ChallengeQuestion $question): RedirectResponse
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

        return back()->with('success', 'Question updated.');
    }

    /**
     * Delete a question.
     */
    public function destroyQuestion(Challenge $challenge, ChallengeQuestion $question): RedirectResponse
    {
        abort_unless($question->challenge_id === $challenge->id, 404);

        $question->delete();

        return back()->with('success', 'Question deleted.');
    }

    /**
     * Reorder questions within a challenge.
     */
    public function reorderQuestions(ReorderAdminChallengeQuestionsRequest $request, Challenge $challenge): RedirectResponse
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

    private function generateUniqueSlug(string $title, ?Challenge $except = null): string
    {
        $baseSlug = Str::slug($title);
        $slug = $baseSlug;
        $counter = 2;

        while (Challenge::query()
            ->when($except, fn ($query) => $query->whereKeyNot($except->getKey()))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $baseSlug.'-'.$counter;
            $counter++;
        }

        return $slug;
    }
}
