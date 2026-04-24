<?php

namespace App\Http\Controllers\Note;

use App\Http\Controllers\Controller;
use App\Models\Note;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class NoteController extends Controller
{
    /**
     * Get notes for a specific lesson.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
        ]);

        $notes = Note::query()
            ->where('user_id', $request->user()->id)
            ->where('lesson_id', $validated['lesson_id'])
            ->latest()
            ->get(['id', 'content', 'created_at', 'updated_at']);

        return response()->json(['notes' => $notes]);
    }

    /**
     * Store a new note for a lesson.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lesson_id' => ['required', 'integer', 'exists:lessons,id'],
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $note = Note::query()->create([
            'user_id' => $request->user()->id,
            'lesson_id' => $validated['lesson_id'],
            'content' => $validated['content'],
        ]);

        return response()->json(['note' => $note], 201);
    }

    /**
     * Update an existing note.
     */
    public function update(Request $request, Note $note): JsonResponse
    {
        Gate::authorize('update', $note);

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:5000'],
        ]);

        $note->update($validated);

        return response()->json(['note' => $note]);
    }

    /**
     * Delete a note.
     */
    public function destroy(Request $request, Note $note): JsonResponse
    {
        Gate::authorize('delete', $note);

        $note->delete();

        return response()->json(['success' => true]);
    }
}
