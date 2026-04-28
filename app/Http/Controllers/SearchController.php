<?php

namespace App\Http\Controllers;

use App\Models\Challenge;
use App\Models\Course;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class SearchController extends Controller
{
    /**
     * Global search across courses, challenges, lessons, and labs.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $query = $request->string('q')->trim()->toString();

        if (mb_strlen($query) < 2) {
            return response()->json(['results' => []]);
        }

        $cacheKey = 'search:'.md5($query);

        $results = Cache::remember($cacheKey, now()->addMinutes(5), function () use ($query) {
            $keyword = "%{$query}%";

            $courses = Course::query()
                ->published()
                ->where(fn ($q) => $q
                    ->where('title', 'like', $keyword)
                    ->orWhere('summary', 'like', $keyword)
                    ->orWhere('category', 'like', $keyword)
                )
                ->select('slug', 'title', 'summary', 'difficulty', 'category')
                ->limit(5)
                ->get()
                ->map(fn (Course $course) => [
                    'type' => 'course',
                    'title' => $course->title,
                    'description' => str($course->summary)->limit(80)->toString(),
                    'url' => route('courses.show', $course->slug),
                    'meta' => [
                        'difficulty' => $course->difficulty,
                        'category' => $course->category,
                    ],
                ]);

            $challenges = Challenge::query()
                ->published()
                ->where(fn ($q) => $q
                    ->where('title', 'like', $keyword)
                    ->orWhere('prompt', 'like', $keyword)
                )
                ->select('slug', 'title', 'prompt', 'difficulty')
                ->limit(5)
                ->get()
                ->map(fn (Challenge $challenge) => [
                    'type' => 'challenge',
                    'title' => $challenge->title,
                    'description' => str($challenge->prompt)->limit(80)->toString(),
                    'url' => route('challenges.show', $challenge->slug),
                    'meta' => [
                        'difficulty' => $challenge->difficulty,
                    ],
                ]);

            $lessons = Lesson::query()
                ->whereHas('course', fn ($q) => $q->published())
                ->where(fn ($q) => $q
                    ->where('title', 'like', $keyword)
                    ->orWhere('description', 'like', $keyword)
                )
                ->with('course:id,slug,title')
                ->select('id', 'course_id', 'title', 'description')
                ->limit(5)
                ->get()
                ->map(fn (Lesson $lesson) => [
                    'type' => 'lesson',
                    'title' => $lesson->title,
                    'description' => str($lesson->description ?? '')->limit(80)->toString(),
                    'url' => route('courses.show', $lesson->course->slug),
                    'meta' => [
                        'course' => $lesson->course->title,
                    ],
                ]);

            $labs = collect(config('labs', []))
                ->filter(fn (array $lab) => str($lab['title'])->lower()->contains(mb_strtolower($query))
                    || str($lab['summary'])->lower()->contains(mb_strtolower($query))
                )
                ->take(5)
                ->map(fn (array $lab, string $slug) => [
                    'type' => 'lab',
                    'title' => $lab['title'],
                    'description' => str($lab['summary'])->limit(80)->toString(),
                    'url' => route('labs.show', $slug),
                    'meta' => [
                        'group' => $lab['group'],
                    ],
                ])
                ->values();

            return $courses
                ->concat($challenges)
                ->concat($lessons)
                ->concat($labs)
                ->values()
                ->all();
        });

        return response()->json(['results' => $results]);
    }
}
