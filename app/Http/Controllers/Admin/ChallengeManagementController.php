<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminChallengeRequest;
use App\Http\Requests\Admin\UpdateAdminChallengeRequest;
use App\Models\Challenge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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

        $challenges = Challenge::query()
            ->searchManagement($search)
            ->orderBy('title')
            ->paginate(10, ['id', 'slug', 'title', 'prompt', 'hint', 'expected_answer', 'points_reward', 'difficulty', 'is_published', 'time_start', 'time_end', 'created_at'])
            ->withQueryString();

        return Inertia::render('admin/challenges/index', [
            'section' => $section,
            'challenges' => $challenges,
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

        Challenge::query()->create([
            'title' => $validated['title'],
            'prompt' => $validated['prompt'],
            'hint' => $validated['hint'] ?? null,
            'time_start' => $validated['time_start'],
            'time_end' => $validated['time_end'],
            'expected_answer' => $validated['expected_answer'],
            'slug' => $this->generateUniqueSlug($validated['title']),
            'points_reward' => (int) $validated['points_reward'],
            'is_published' => (bool) ($validated['is_published'] ?? true),
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
            'points_reward' => (int) $validated['points_reward'],
            'is_published' => (bool) ($validated['is_published'] ?? $challenge->is_published),
            'slug' => $challenge->title === $validated['title']
                ? $challenge->slug
                : $this->generateUniqueSlug($validated['title'], $challenge),
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
