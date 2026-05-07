<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\Topic;
use App\Services\AuditService;
use App\Services\RubricScoringService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class AssessmentController extends Controller
{
    /**
     * Display assessments management listing.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $bloomFilter = $request->input('bloom_level');
        $perPage = max(10, min($request->integer('per_page', 15), 100));

        $assessments = Assessment::query()
            ->searchManagement($search)
            ->when($bloomFilter, fn ($q) => $q->where('bloom_level', $bloomFilter))
            ->withCount('questions')
            ->orderBy('bloom_level')
            ->orderBy('sort_order')
            ->paginate($perPage)
            ->withQueryString();

        // Load questions for selected assessment
        $selectedId = $request->integer('assessment_id');
        $questions = [];

        if ($selectedId > 0) {
            $questions = AssessmentQuestion::query()
                ->where('assessment_id', $selectedId)
                ->orderBy('sort_order')
                ->get()
                ->makeVisible('correct_answer')
                ->toArray();
        }

        return Inertia::render('admin/assessments/index', [
            'assessments' => $assessments,
            'questions' => $questions,
            'selectedAssessmentId' => $selectedId,
            'courses' => Course::orderBy('title')->get(['id', 'title']),
            'topics' => Topic::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $search,
                'bloom_level' => $bloomFilter,
            ],
        ]);
    }

    /**
     * Store a new assessment.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'topic_id' => ['nullable', 'integer', 'exists:topics,id'],
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'grading_type' => ['required', 'in:auto,manual,mixed'],
            'passing_score' => ['required', 'integer', 'min:1', 'max:100'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:10'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'is_published' => ['boolean'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after:available_from'],
        ]);

        $nextSortOrder = (int) Assessment::query()->max('sort_order') + 1;

        $assessment = Assessment::create([
            ...$validated,
            'slug' => $this->generateUniqueSlug($validated['title']),
            'sort_order' => $nextSortOrder,
            'is_published' => $validated['is_published'] ?? false,
            'status' => $validated['status'] ?? 'draft',
            'version' => 1,
            'published_by' => null,
        ]);

        app(AuditService::class)->log($request->user(), 'created', $assessment);

        return back()->with('success', 'Assessment created.');
    }

    /**
     * Update an existing assessment.
     */
    public function update(Request $request, Assessment $assessment): RedirectResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'course_id' => ['nullable', 'integer', 'exists:courses,id'],
            'topic_id' => ['nullable', 'integer', 'exists:topics,id'],
            'bloom_level' => ['required', 'in:C1,C2,C3,C4,C5,C6'],
            'grading_type' => ['required', 'in:auto,manual,mixed'],
            'passing_score' => ['required', 'integer', 'min:1', 'max:100'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:10'],
            'time_limit_minutes' => ['nullable', 'integer', 'min:1', 'max:480'],
            'is_published' => ['boolean'],
            'status' => ['nullable', 'string', 'in:draft,published,archived'],
            'available_from' => ['nullable', 'date'],
            'available_until' => ['nullable', 'date', 'after:available_from'],
        ]);

        $updateData = $validated;

        // Increment version on update
        $updateData['version'] = $assessment->version + 1;

        $assessment->update($updateData);

        app(AuditService::class)->log($request->user(), 'updated', $assessment);

        return back()->with('success', 'Assessment updated.');
    }

    /**
     * Delete an assessment.
     */
    public function destroy(Request $request, Assessment $assessment): RedirectResponse
    {
        app(AuditService::class)->log($request->user(), 'deleted', $assessment);

        $assessment->delete();

        return back()->with('success', 'Assessment deleted.');
    }

    /**
     * Toggle publish status.
     */
    public function togglePublish(Assessment $assessment): RedirectResponse
    {
        $newStatus = $assessment->status === 'published' ? 'draft' : 'published';
        $assessment->update(['status' => $newStatus]);

        return back()->with('success', $newStatus === 'published' ? 'Assessment published.' : 'Assessment unpublished.');
    }

    /**
     * Publish an assessment (set status to published).
     */
    public function publishAssessment(Assessment $assessment): RedirectResponse
    {
        $assessment->update([
            'status' => 'published',
            'published_by' => request()->user()->id,
            'is_published' => true,
        ]);

        app(AuditService::class)->log(request()->user(), 'published', $assessment);

        return back()->with('success', 'Assessment published.');
    }

    /**
     * Archive an assessment (set status to archived).
     */
    public function archiveAssessment(Assessment $assessment): RedirectResponse
    {
        $assessment->update([
            'status' => 'archived',
            'is_published' => false,
        ]);

        app(AuditService::class)->log(request()->user(), 'archived', $assessment);

        return back()->with('success', 'Assessment archived.');
    }

    /**
     * Reorder assessments.
     */
    public function reorder(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.id' => ['required', 'integer', 'exists:assessments,id'],
            'items.*.sort_order' => ['required', 'integer', 'min:0'],
        ]);

        foreach ($validated['items'] as $item) {
            Assessment::where('id', $item['id'])->update(['sort_order' => $item['sort_order']]);
        }

        return back()->with('success', 'Order updated.');
    }

    private function generateUniqueSlug(string $title): string
    {
        $base = Str::slug($title);
        $slug = $base;
        $counter = 1;

        while (Assessment::where('slug', $slug)->exists()) {
            $slug = "{$base}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
