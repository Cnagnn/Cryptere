<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ReorderAdminLessonsRequest;
use App\Http\Requests\Admin\StoreAdminLessonRequest;
use App\Http\Requests\Admin\UpdateAdminLessonRequest;
use App\Models\Course;
use App\Models\Lesson;
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

        Lesson::query()->create([
            'course_id' => $course->id,
            'slug' => $slug,
            'title' => $validated['title'],
            'description' => $validated['description'],
            'content' => '',
            'position' => $nextPosition,
        ]);

        return back();
    }

    public function update(UpdateAdminLessonRequest $request, Lesson $lesson): RedirectResponse
    {
        $validated = $request->validated();

        $lesson->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
        ]);

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
        $lesson->delete();

        return back();
    }
}
