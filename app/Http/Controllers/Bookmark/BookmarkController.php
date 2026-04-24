<?php

namespace App\Http\Controllers\Bookmark;

use App\Http\Controllers\Controller;
use App\Models\Bookmark;
use App\Models\Challenge;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookmarkController extends Controller
{
    /**
     * Toggle a bookmark for a given resource.
     */
    public function toggle(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'bookmarkable_type' => ['required', 'string', 'in:course,lesson,challenge'],
            'bookmarkable_id' => ['required', 'integer'],
        ]);

        $morphMap = [
            'course' => Course::class,
            'lesson' => Lesson::class,
            'challenge' => Challenge::class,
        ];

        $type = $morphMap[$validated['bookmarkable_type']];

        $bookmark = Bookmark::query()
            ->where('user_id', $request->user()->id)
            ->where('bookmarkable_type', $type)
            ->where('bookmarkable_id', $validated['bookmarkable_id'])
            ->first();

        if ($bookmark !== null) {
            $bookmark->delete();

            return response()->json(['bookmarked' => false]);
        }

        Bookmark::query()->create([
            'user_id' => $request->user()->id,
            'bookmarkable_type' => $type,
            'bookmarkable_id' => $validated['bookmarkable_id'],
        ]);

        return response()->json(['bookmarked' => true]);
    }

    /**
     * List all bookmarks for the current user.
     */
    public function index(Request $request): JsonResponse
    {
        $bookmarks = Bookmark::query()
            ->where('user_id', $request->user()->id)
            ->with('bookmarkable')
            ->latest()
            ->get()
            ->map(fn (Bookmark $bookmark) => [
                'id' => $bookmark->id,
                'type' => class_basename($bookmark->bookmarkable_type),
                'item' => $bookmark->bookmarkable,
                'created_at' => $bookmark->created_at,
            ]);

        return response()->json(['bookmarks' => $bookmarks]);
    }
}
