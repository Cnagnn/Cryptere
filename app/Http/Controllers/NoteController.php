<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class NoteController extends Controller
{
    /**
     * List notes for the authenticated user, optionally filtered by notable.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()->notes()->latest();

        if ($request->filled('notable_type') && $request->filled('notable_id')) {
            $query->where('notable_type', $request->string('notable_type'))
                ->where('notable_id', $request->integer('notable_id'));
        }

        $notes = $query->paginate(20);

        return response()->json($notes);
    }

    /**
     * Create a new note.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['required', 'string', 'max:50000'],
            'notable_type' => ['nullable', 'string', Rule::in(['lesson', 'course', 'challenge'])],
            'notable_id' => ['nullable', 'integer', 'min:1'],
        ]);

        // Map short notable_type to full class name
        if (isset($validated['notable_type'])) {
            $validated['notable_type'] = match ($validated['notable_type']) {
                'lesson' => Lesson::class,
                'course' => Course::class,
                'challenge' => Challenge::class,
                default => null,
            };
        }

        $note = $request->user()->notes()->create($validated);

        return response()->json([
            'success' => true,
            'note' => $note,
        ], 201);
    }

    /**
     * Update an existing note.
     */
    public function update(Request $request, Note $note): JsonResponse
    {
        if ($note->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'content' => ['sometimes', 'string', 'max:50000'],
        ]);

        $note->update($validated);

        return response()->json([
            'success' => true,
            'note' => $note->fresh(),
        ]);
    }

    /**
     * Delete a note.
     */
    public function destroy(Request $request, Note $note): JsonResponse
    {
        if ($note->user_id !== $request->user()->id) {
            abort(403);
        }

        $note->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Export all user notes as JSON.
     */
    public function export(Request $request): JsonResponse
    {
        $notes = $request->user()->notes()
            ->latest()
            ->get(['id', 'title', 'content', 'notable_type', 'notable_id', 'created_at', 'updated_at']);

        return response()->json([
            'exported_at' => now()->toIso8601String(),
            'count' => $notes->count(),
            'notes' => $notes,
        ]);
    }
}
