<?php

namespace App\Http\Controllers;

use App\Models\StoryChapter;
use App\Services\StoryService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StoryController extends Controller
{
    public function __construct(
        private readonly StoryService $storyService,
    ) {}

    /**
     * Display the story page with all chapters and progress.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $chapters = $this->storyService->getChaptersForUser($user);
        $summary = $this->storyService->getProgressSummary($user);

        return Inertia::render('story', [
            'chapters' => $chapters,
            'summary' => $summary,
        ]);
    }

    /**
     * Mark a story chapter as read.
     */
    public function markAsRead(Request $request, StoryChapter $chapter): RedirectResponse
    {
        $user = $request->user();

        // Verify the user has unlocked this chapter
        $isUnlocked = $user->unlockedChapters()
            ->where('story_chapters.id', $chapter->id)
            ->exists();

        if (! $isUnlocked) {
            abort(403);
        }

        $this->storyService->markAsRead($user, $chapter);

        return back();
    }
}
