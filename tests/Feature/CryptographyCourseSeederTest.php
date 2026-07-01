<?php

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Database\Seeders\CryptographyCourseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('cryptography course seeder creates one material course per lab algorithm', function (): void {
    $labs = collect(config('labs'));

    expect($labs)->not->toBeEmpty();

    $this->seed(CryptographyCourseSeeder::class);

    $expectedCourseSlugs = $labs
        ->keys()
        ->map(fn (string $slug): string => str_replace('-lab', '-course', $slug))
        ->all();

    expect(Course::query()->count())->toBe($labs->count());

    $courses = Course::query()
        ->whereIn('slug', $expectedCourseSlugs)
        ->get()
        ->keyBy('slug');

    expect($courses)->toHaveCount($labs->count());

    foreach ($labs as $labSlug => $lab) {
        $courseSlug = str_replace('-lab', '-course', $labSlug);
        $course = $courses->get($courseSlug);

        expect($course)->not->toBeNull();
        expect($course->title)->toContain($lab['title']);
        expect($course->status)->toBe(Course::STATUS_PUBLISHED);

        $assessments = Assessment::query()
            ->where('course_id', $course->id)
            ->orderBy('sort_order')
            ->get();

        expect($assessments)->toHaveCount(6);
        expect($assessments->pluck('bloom_level')->values()->all())
            ->toBe([
                Assessment::BLOOM_C1,
                Assessment::BLOOM_C2,
                Assessment::BLOOM_C3,
                Assessment::BLOOM_C4,
                Assessment::BLOOM_C5,
                Assessment::BLOOM_C6,
            ]);

        foreach ($assessments as $assessment) {
            expect($assessment->status)->toBe(Assessment::STATUS_PUBLISHED);

            $assessmentQuestions = AssessmentQuestion::query()
                ->where('assessment_id', $assessment->id)
                ->orderBy('sort_order')
                ->get();

            expect($assessmentQuestions->count())->toBeGreaterThanOrEqual(1);
            expect($assessmentQuestions->pluck('bloom_level')->unique()->values()->all())
                ->toBe([$assessment->bloom_level]);
        }

        $lessons = Lesson::query()
            ->where('course_id', $course->id)
            ->orderBy('position')
            ->get();

        expect($lessons->count())->toBeGreaterThanOrEqual(3);

        foreach ($lessons as $lesson) {
            expect(strlen((string) $lesson->content))->toBeGreaterThan(400);
            expect($lesson->learning_objectives)->toBeArray();
            expect(count($lesson->learning_objectives))->toBeGreaterThanOrEqual(3);
            expect($lesson->key_concepts)->toBeArray();
            expect(count($lesson->key_concepts))->toBeGreaterThanOrEqual(3);

            $lessonTasks = LessonTask::query()
                ->where('lesson_id', $lesson->id)
                ->orderBy('sort_order')
                ->get();

            expect($lessonTasks->count())->toBeGreaterThanOrEqual(3);
            expect($lessonTasks->contains(fn (LessonTask $task): bool => $task->type === 'video' && filled($task->video_url)))->toBeTrue();
            expect($lessonTasks->contains(fn (LessonTask $task): bool => $task->type === 'read' && filled($task->document_name) && filled($task->pdf_url)))->toBeTrue();
            expect($lessonTasks->contains(fn (LessonTask $task): bool => $task->type === 'video' && str_contains((string) $task->video_url, 'youtube.com')))->toBeTrue();
            expect($lessonTasks->contains(fn (LessonTask $task): bool => $task->type === 'read' && $task->document_name === 'ta-elearning-kriptografi.pdf' && $task->conversion_status === 'converted'))->toBeTrue();

            $quizTask = $lessonTasks->first(fn (LessonTask $task): bool => $task->type === 'quiz');

            expect($quizTask)->not->toBeNull();
            expect(
                QuizQuestion::query()->where('lesson_task_id', $quizTask->id)->count()
            )->toBeGreaterThan(3);
        }

        $tasks = LessonTask::query()
            ->whereIn('lesson_id', $lessons->pluck('id'))
            ->orderBy('sort_order')
            ->get();

        expect($tasks->count())->toBeGreaterThanOrEqual(9);
        expect($tasks->where('type', 'video')->count())->toBeGreaterThanOrEqual(3);
        expect($tasks->where('type', 'read')->count())->toBeGreaterThanOrEqual(3);
        expect($tasks->contains(fn (LessonTask $task): bool => $task->type === 'quiz'))->toBeTrue();

        foreach ($tasks as $task) {
            expect((string) $task->description)->not->toBe('');
        }

        $quizTaskIds = $tasks
            ->where('type', 'quiz')
            ->pluck('id');

        expect(
            QuizQuestion::query()->whereIn('lesson_task_id', $quizTaskIds)->count()
        )->toBeGreaterThan(0);
    }
});
