<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\QuestionBank;
use App\Services\AuditService;
use App\Services\RubricScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class QuestionBankController extends Controller
{
    public function __construct(
        private readonly RubricScoringService $rubricService,
    ) {}

    /**
     * Display question bank listing.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $bloomFilter = $request->input('bloom_level');
        $typeFilter = $request->input('question_type');
        $categoryFilter = $request->input('category');
        $activeFilter = $request->input('is_active');
        $perPage = max(10, min($request->integer('per_page', 15), 100));

        $questions = QuestionBank::query()
            ->when($search, fn ($q) => $q->where(function ($query) use ($search) {
                $query->where('title', 'like', "%{$search}%")
                    ->orWhere('question_text', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%");
            }))
            ->when($bloomFilter, fn ($q) => $q->where('bloom_level', $bloomFilter))
            ->when($typeFilter, fn ($q) => $q->where('question_type', $typeFilter))
            ->when($categoryFilter, fn ($q) => $q->where('category', $categoryFilter))
            ->when($activeFilter !== null, fn ($q) => $q->where('is_active', (bool) $activeFilter))
            ->with('creator:id,name')
            ->withCount('assessmentQuestions')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/question-bank/index', [
            'questions' => $questions,
            'filters' => [
                'search' => $search,
                'bloom_level' => $bloomFilter,
                'question_type' => $typeFilter,
                'category' => $categoryFilter,
                'is_active' => $activeFilter,
            ],
        ]);
    }

    /**
     * Store a new question in the bank.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'question_type' => ['required', 'in:mcq,true_false,short_answer,essay,computation,case_study,design'],
            'question_text' => ['required', 'string', 'max:5000'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:500'],
            'correct_answer' => ['nullable', 'string', 'max:2000'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'rubric' => ['nullable', 'array'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        // Auto-generate rubric if not provided for manual grading types
        if (empty($validated['rubric']) && in_array($validated['question_type'], ['essay', 'case_study', 'design'])) {
            $validated['rubric'] = $this->rubricService->generateDefaultRubric(
                $validated['bloom_level'],
                $validated['question_type'],
                $validated['points'],
            );
        }

        $question = QuestionBank::create([
            ...$validated,
            'created_by' => $request->user()->id,
            'is_active' => $validated['is_active'] ?? true,
            'times_used' => 0,
        ]);

        app(AuditService::class)->log($request->user(), 'created', $question);

        return back()->with('success', 'Question added to bank.');
    }

    /**
     * Update an existing question in the bank.
     */
    public function update(Request $request, QuestionBank $questionBank): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'max:100'],
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'question_type' => ['required', 'in:mcq,true_false,short_answer,essay,computation,case_study,design'],
            'question_text' => ['required', 'string', 'max:5000'],
            'options' => ['nullable', 'array'],
            'options.*' => ['string', 'max:500'],
            'correct_answer' => ['nullable', 'string', 'max:2000'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'rubric' => ['nullable', 'array'],
            'points' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['boolean'],
        ]);

        $questionBank->update($validated);

        app(AuditService::class)->log($request->user(), 'updated', $questionBank);

        return back()->with('success', 'Question updated.');
    }

    /**
     * Soft delete a question (set is_active = false).
     */
    public function destroy(Request $request, QuestionBank $questionBank): RedirectResponse
    {
        // Check if question is used in any assessments
        if ($questionBank->assessmentQuestions()->exists()) {
            return back()->withErrors(['error' => 'Cannot delete question that is used in assessments. Deactivate instead.']);
        }

        $questionBank->update(['is_active' => false]);

        app(AuditService::class)->log($request->user(), 'deactivated', $questionBank);

        return back()->with('success', 'Question deactivated.');
    }

    /**
     * Duplicate a question.
     */
    public function duplicate(Request $request, QuestionBank $questionBank): RedirectResponse
    {
        $newQuestion = $questionBank->replicate();
        $newQuestion->title = $questionBank->title.' (Copy)';
        $newQuestion->created_by = $request->user()->id;
        $newQuestion->times_used = 0;
        $newQuestion->save();

        app(AuditService::class)->log($request->user(), 'duplicated', $newQuestion);

        return back()->with('success', 'Question duplicated.');
    }

    /**
     * Bulk import questions from CSV/JSON.
     */
    public function bulkImport(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'mimes:csv,json', 'max:10240'],
            'format' => ['required', 'in:csv,json'],
        ]);

        $file = $request->file('file');
        $format = $validated['format'];

        DB::beginTransaction();
        try {
            $imported = 0;

            if ($format === 'json') {
                $data = json_decode($file->get(), true);
                foreach ($data as $item) {
                    QuestionBank::create([
                        ...$item,
                        'created_by' => $request->user()->id,
                        'times_used' => 0,
                    ]);
                    $imported++;
                }
            } elseif ($format === 'csv') {
                $csv = array_map('str_getcsv', file($file->getRealPath()));
                $headers = array_shift($csv);

                foreach ($csv as $row) {
                    $data = array_combine($headers, $row);
                    QuestionBank::create([
                        'title' => $data['title'] ?? '',
                        'category' => $data['category'] ?? null,
                        'bloom_level' => $data['bloom_level'] ?? 'C1',
                        'question_type' => $data['question_type'] ?? 'mcq',
                        'question_text' => $data['question_text'] ?? '',
                        'options' => isset($data['options']) ? json_decode($data['options'], true) : null,
                        'correct_answer' => $data['correct_answer'] ?? null,
                        'explanation' => $data['explanation'] ?? null,
                        'points' => (int) ($data['points'] ?? 1),
                        'created_by' => $request->user()->id,
                        'is_active' => true,
                        'times_used' => 0,
                    ]);
                    $imported++;
                }
            }

            DB::commit();

            return back()->with('success', "Imported {$imported} questions.");
        } catch (\Exception $e) {
            DB::rollBack();

            return back()->withErrors(['error' => 'Import failed: '.$e->getMessage()]);
        }
    }

    /**
     * Show usage statistics for a question.
     */
    public function usageStats(QuestionBank $questionBank): Response
    {
        $usages = $questionBank->assessmentQuestions()
            ->with('assessment:id,title,slug')
            ->get()
            ->map(function ($question) {
                return [
                    'assessment_id' => $question->assessment_id,
                    'assessment_title' => $question->assessment->title,
                    'assessment_slug' => $question->assessment->slug,
                    'times_shown' => $question->times_shown,
                    'times_correct' => $question->times_correct,
                    'difficulty_score' => $question->difficulty_score,
                ];
            });

        return Inertia::render('admin/question-bank/usage-stats', [
            'question' => $questionBank,
            'usages' => $usages,
        ]);
    }
}
