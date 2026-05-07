<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminLessonsRequest;
use App\Http\Requests\Admin\StoreAdminLessonRequest;
use App\Http\Requests\Admin\UpdateAdminLessonRequest;
use App\Models\Course;
use App\Models\Lesson;
use App\Services\AuditService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LessonController extends Controller
{
    public function store(StoreAdminLessonRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $course = Course::query()->findOrFail($validated['course_id']);

        $baseSlug = Str::slug($validated['title']);
        if ($baseSlug === '') {
            $baseSlug = 'lesson';
        }

        $slug = $baseSlug;
        $counter = 2;
        while (Lesson::query()->where('course_id', $course->id)->where('slug', $slug)->exists()) {
            $slug = sprintf('%s-%d', $baseSlug, $counter++);
        }

        $nextPosition = (int) Lesson::query()->where('course_id', $course->id)->max('position') + 1;

        $lesson = Lesson::query()->create([
            'course_id' => $course->id,
            'slug' => $slug,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'content' => '',
            'position' => $nextPosition,
            'topic_id' => $validated['topic_id'] ?? null,
            'prerequisite_lesson_id' => $validated['prerequisite_lesson_id'] ?? null,
            'status' => $validated['status'] ?? 'draft',
            'version' => 1,
            'published_by' => null,
        ]);

        app(AuditService::class)->log($request->user(), 'created', $lesson);

        return back();
    }

    public function update(UpdateAdminLessonRequest $request, Lesson $lesson): RedirectResponse
    {
        $validated = $request->validated();

        $updateData = [
            'title' => $validated['title'],
            'description' => $validated['description'],
        ];

        if (isset($validated['course_id'])) {
            $updateData['course_id'] = (int) $validated['course_id'];
        }

        if (isset($validated['topic_id'])) {
            $updateData['topic_id'] = $validated['topic_id'];
        }

        if (isset($validated['prerequisite_lesson_id'])) {
            // Validate no circular dependency
            if ($this->wouldCreateCircularDependency($lesson, $validated['prerequisite_lesson_id'])) {
                return back()->withErrors(['prerequisite_lesson_id' => 'Circular dependency detected.']);
            }
            $updateData['prerequisite_lesson_id'] = $validated['prerequisite_lesson_id'];
        }

        if (isset($validated['status'])) {
            $updateData['status'] = $validated['status'];
        }

        // Increment version on update
        $updateData['version'] = $lesson->version + 1;

        $lesson->update($updateData);

        app(AuditService::class)->log($request->user(), 'updated', $lesson);

        return back();
    }

    public function reorder(ReorderAdminLessonsRequest $request): RedirectResponse
    {
        $items = collect($request->validated('items'));

        DB::transaction(function () use ($items): void {
            $items->each(function (array $item): void {
                Lesson::query()
                    ->whereKey((int) $item['id'])
                    ->update(['position' => (int) $item['position'] + 1000]);
            });

            $items->each(function (array $item): void {
                Lesson::query()
                    ->whereKey((int) $item['id'])
                    ->update(['position' => (int) $item['position']]);
            });
        });

        return back();
    }

    public function destroy(Lesson $lesson): RedirectResponse
    {
        $this->authorize('delete', $lesson->course);

        app(AuditService::class)->log(request()->user(), 'deleted', $lesson);

        $lesson->delete();

        return back();
    }

    /**
     * Publish a lesson (set status to published).
     */
    public function publishLesson(Lesson $lesson): RedirectResponse
    {
        $lesson->update([
            'status' => 'published',
            'published_by' => request()->user()->id,
        ]);

        app(AuditService::class)->log(request()->user(), 'published', $lesson);

        return back()->with('success', 'Lesson published.');
    }

    /**
     * Check if setting a prerequisite would create a circular dependency.
     */
    private function wouldCreateCircularDependency(Lesson $lesson, ?int $prerequisiteId): bool
    {
        if ($prerequisiteId === null || $prerequisiteId === $lesson->id) {
            return false;
        }

        $visited = [];
        $current = $prerequisiteId;

        while ($current !== null) {
            if ($current === $lesson->id) {
                return true;
            }

            if (in_array($current, $visited)) {
                break;
            }

            $visited[] = $current;
            $prerequisite = Lesson::find($current);
            $current = $prerequisite?->prerequisite_lesson_id;
        }

        return false;
    }
}
