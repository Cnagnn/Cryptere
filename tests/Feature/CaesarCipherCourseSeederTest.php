<?php

use App\Models\Assessment;
use App\Models\AssessmentQuestion;
use App\Models\Course;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

use function Pest\Laravel\assertDatabaseHas;

beforeEach(function (): void {
    Storage::fake('public');
});

test('seeder creates published Caesar Chiper course with Indonesian learning path', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    assertDatabaseHas('courses', [
        'slug' => 'caesar-chiper',
        'title' => 'Caesar Chiper',
        'status' => 'published',
    ]);

    $course = Course::where('slug', 'caesar-chiper')->first();

    expect($course)->not->toBeNull();
    expect($course->is_published)->toBeTrue();
    expect($course->estimated_minutes)->toBe(360);
    expect($course->summary)->toContain('berbahasa Indonesia');
});

test('course has rich published lessons with video read and quiz tasks', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->firstOrFail();
    $lessons = $course->lessons()->with('tasks.quizQuestions')->get();

    expect($lessons)->toHaveCount(6);

    foreach ($lessons as $lesson) {
        expect($lesson->status)->toBe('published');
        expect($lesson->learning_objectives)->toBeArray()->toHaveCount(4);
        expect($lesson->key_concepts)->toBeArray();
        expect(count($lesson->key_concepts))->toBeGreaterThanOrEqual(4);

        $tasks = $lesson->tasks;
        expect($tasks)->toHaveCount(3);
        expect($tasks->pluck('type')->all())->toBe(['video', 'read', 'quiz']);

        $videoTask = $tasks->firstWhere('type', 'video');
        expect($videoTask->video_url)->toStartWith('https://www.youtube.com/watch?v=');
        expect($videoTask->video_processing_status)->toBe('ready');

        $readTask = $tasks->firstWhere('type', 'read');
        expect($readTask->document_name)->toEndWith('.pdf');
        expect($readTask->conversion_status)->toBe('converted');
        expect($readTask->pdf_url)->toStartWith('/storage/lesson-documents/');

        $quizTask = $tasks->firstWhere('type', 'quiz');
        expect($quizTask->quizQuestions)->toHaveCount(5);
    }

    expect(LessonTask::whereHas('lesson.course', fn ($query) => $query->where('slug', 'caesar-chiper'))->count())->toBe(18);
    expect(QuizQuestion::whereHas('task.lesson.course', fn ($query) => $query->where('slug', 'caesar-chiper'))->count())->toBe(30);
});

test('read tasks create local Indonesian PDF documents', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->firstOrFail();
    $readTasks = LessonTask::whereHas('lesson', fn ($query) => $query->where('course_id', $course->id))
        ->where('type', 'read')
        ->get();

    expect($readTasks)->toHaveCount(6);

    foreach ($readTasks as $task) {
        $path = Str::of(parse_url($task->pdf_url, PHP_URL_PATH))
            ->replaceFirst('/storage/', '')
            ->toString();

        Storage::disk('public')->assertExists($path);

        $document = Storage::disk('public')->get($path);
        expect($document)->toStartWith('%PDF-1.4');
        expect($document)->toContain('Sandi Caesar');
        expect($document)->toContain('Bahasa Indonesia');
    }
});

test('assessments cover all Bloom taxonomy levels with complete question sets', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->firstOrFail();
    $assessments = Assessment::where('course_id', $course->id)
        ->with('questions')
        ->orderBy('sort_order')
        ->get();

    expect($assessments)->toHaveCount(6);
    expect($assessments->pluck('bloom_level')->all())->toBe(['C1', 'C2', 'C3', 'C4', 'C5', 'C6']);

    foreach ($assessments as $assessment) {
        expect($assessment->status)->toBe('published');
        expect($assessment->passing_score)->toBe(70);
        expect($assessment->max_attempts)->toBe(3);
        expect($assessment->questions)->toHaveCount(4);

        foreach ($assessment->questions as $question) {
            expect($question->bloom_level)->toBe($assessment->bloom_level);
            expect($question->points)->toBeGreaterThan(0);
            expect($question->explanation)->not->toBeEmpty();
        }
    }
});

test('assessment grading configuration matches Bloom level behavior', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    expect(Assessment::where('slug', 'caesar-cipher-c1-remember')->firstOrFail()->grading_type)->toBe('auto');
    expect(Assessment::where('slug', 'caesar-cipher-c2-understand')->firstOrFail()->grading_type)->toBe('mixed');
    expect(Assessment::where('slug', 'caesar-cipher-c3-apply')->firstOrFail()->grading_type)->toBe('auto');
    expect(Assessment::where('slug', 'caesar-cipher-c4-analyze')->firstOrFail()->grading_type)->toBe('manual');
    expect(Assessment::where('slug', 'caesar-cipher-c5-evaluate')->firstOrFail()->grading_type)->toBe('manual');
    expect(Assessment::where('slug', 'caesar-cipher-c6-create')->firstOrFail()->grading_type)->toBe('manual');

    $manualQuestions = AssessmentQuestion::whereIn('grading_type', ['manual'])->get();
    expect($manualQuestions->count())->toBeGreaterThanOrEqual(8);

    foreach ($manualQuestions as $question) {
        expect($question->rubric)->toBeArray();
        expect($question->rubric)->toHaveKey('criteria');
        expect($question->rubric['criteria'])->not->toBeEmpty();
    }
});

test('seeder is idempotent and can run twice without duplicating content', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->firstOrFail();
    $firstCounts = [
        'courses' => Course::where('slug', 'caesar-chiper')->count(),
        'lessons' => $course->lessons()->count(),
        'tasks' => LessonTask::whereHas('lesson.course', fn ($query) => $query->where('slug', 'caesar-chiper'))->count(),
        'quizQuestions' => QuizQuestion::whereHas('task.lesson.course', fn ($query) => $query->where('slug', 'caesar-chiper'))->count(),
        'assessments' => Assessment::where('course_id', $course->id)->count(),
        'assessmentQuestions' => AssessmentQuestion::whereHas('assessment', fn ($query) => $query->where('course_id', $course->id))->count(),
    ];

    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course->refresh();
    $secondCounts = [
        'courses' => Course::where('slug', 'caesar-chiper')->count(),
        'lessons' => $course->lessons()->count(),
        'tasks' => LessonTask::whereHas('lesson.course', fn ($query) => $query->where('slug', 'caesar-chiper'))->count(),
        'quizQuestions' => QuizQuestion::whereHas('task.lesson.course', fn ($query) => $query->where('slug', 'caesar-chiper'))->count(),
        'assessments' => Assessment::where('course_id', $course->id)->count(),
        'assessmentQuestions' => AssessmentQuestion::whereHas('assessment', fn ($query) => $query->where('course_id', $course->id))->count(),
    ];

    expect($secondCounts)->toBe($firstCounts);
});
