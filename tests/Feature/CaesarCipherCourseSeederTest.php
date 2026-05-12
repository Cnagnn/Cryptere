<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\assertDatabaseHas;

beforeEach(function (): void {
    Storage::fake('public');
});

test('seeder creates caesar cipher course', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    assertDatabaseHas('courses', [
        'slug' => 'caesar-chiper',
        'title' => 'Caesar Chiper',
        'status' => 'published',
    ]);

    $course = Course::where('slug', 'caesar-chiper')->first();
    expect($course)->not->toBeNull();
    expect($course->is_published)->toBeTrue();
    expect($course->estimated_minutes)->toBe(120);
});

test('course has published lesson', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->first();
    $lesson = $course->lessons()->first();

    expect($lesson)->not->toBeNull();
    expect($lesson->slug)->toBe('caesar-cipher-fundamentals');
    expect($lesson->status)->toBe('published');
    expect($lesson->learning_objectives)->toBeArray();
    expect($lesson->key_concepts)->toBeArray();
});

test('lesson has video read and quiz tasks', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->first();
    $lesson = $course->lessons()->first();

    $tasks = $lesson->tasks;
    expect($tasks)->toHaveCount(3);

    $videoTask = $tasks->firstWhere('type', 'video');
    expect($videoTask)->not->toBeNull();
    expect($videoTask->video_url)->toBe('https://www.youtube.com/watch?v=sMOZf4GN3oc');
    expect($videoTask->video_processing_status)->toBe('ready');
    expect($videoTask->status)->toBe('published');

    $readTask = $tasks->firstWhere('type', 'read');
    expect($readTask)->not->toBeNull();
    expect($readTask->conversion_status)->toBe('converted');
    expect($readTask->pdf_url)->not->toBeNull();
    expect($readTask->status)->toBe('published');

    $quizTask = $tasks->firstWhere('type', 'quiz');
    expect($quizTask)->not->toBeNull();
    expect($quizTask->status)->toBe('published');
});

test('quiz task has at least 5 questions', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->first();
    $lesson = $course->lessons()->first();
    $quizTask = $lesson->tasks()->where('type', 'quiz')->first();

    $questions = $quizTask->quizQuestions;
    expect($questions)->toHaveCount(5);

    foreach ($questions as $question) {
        expect($question->question)->not->toBeEmpty();
        expect($question->options)->toBeArray();
        expect($question->options)->toHaveCount(4);
        expect($question->correct_option)->toBeInt();
        expect($question->explanation)->not->toBeEmpty();
    }
});

test('six assessments exist for C1 to C6', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->first();
    $assessments = Assessment::where('course_id', $course->id)->get();

    expect($assessments)->toHaveCount(6);

    $bloomLevels = $assessments->pluck('bloom_level')->toArray();
    expect($bloomLevels)->toContain('C1', 'C2', 'C3', 'C4', 'C5', 'C6');

    foreach ($assessments as $assessment) {
        expect($assessment->status)->toBe('published');
        expect($assessment->passing_score)->toBe(70);
        expect($assessment->max_attempts)->toBe(3);
    }
});

test('C1 assessment is auto graded', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $assessment = Assessment::where('slug', 'caesar-cipher-c1-remember')->first();
    expect($assessment)->not->toBeNull();
    expect($assessment->bloom_level)->toBe('C1');
    expect($assessment->grading_type)->toBe('auto');
    expect($assessment->time_limit_minutes)->toBe(15);
});

test('C6 assessment contains manual design question with rubric', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $assessment = Assessment::where('slug', 'caesar-cipher-c6-create')->first();
    expect($assessment)->not->toBeNull();
    expect($assessment->bloom_level)->toBe('C6');
    expect($assessment->grading_type)->toBe('manual');

    $question = $assessment->questions()->first();
    expect($question)->not->toBeNull();
    expect($question->question_type)->toBe('design');
    expect($question->grading_type)->toBe('manual');
    expect($question->rubric)->toBeArray();
    expect($question->rubric)->toHaveCount(5);
    expect($question->points)->toBe(40);
});

test('seeder is idempotent and can run twice', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);
    $firstCourseCount = Course::where('slug', 'caesar-chiper')->count();
    $firstTaskCount = LessonTask::count();
    $firstQuestionCount = QuizQuestion::count();
    $firstAssessmentCount = Assessment::count();

    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);
    $secondCourseCount = Course::where('slug', 'caesar-chiper')->count();
    $secondTaskCount = LessonTask::count();
    $secondQuestionCount = QuizQuestion::count();
    $secondAssessmentCount = Assessment::count();

    expect($firstCourseCount)->toBe($secondCourseCount);
    expect($firstTaskCount)->toBe($secondTaskCount);
    expect($firstQuestionCount)->toBe($secondQuestionCount);
    expect($firstAssessmentCount)->toBe($secondAssessmentCount);
});

test('PDF file is created', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    Storage::disk('public')->assertExists('lesson-documents/caesar-cipher-guide.pdf');
});

test('all assessments have questions', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $course = Course::where('slug', 'caesar-chiper')->first();
    $assessments = Assessment::where('course_id', $course->id)->get();

    foreach ($assessments as $assessment) {
        $questionCount = $assessment->questions()->count();
        expect($questionCount)->toBeGreaterThan(0);
    }
});

test('C2 assessment has mixed grading', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $assessment = Assessment::where('slug', 'caesar-cipher-c2-understand')->first();
    expect($assessment)->not->toBeNull();
    expect($assessment->grading_type)->toBe('mixed');

    $questions = $assessment->questions;
    $hasAutoGraded = $questions->contains('grading_type', 'auto');
    $hasManualGraded = $questions->contains('grading_type', 'manual');

    expect($hasAutoGraded)->toBeTrue();
    expect($hasManualGraded)->toBeTrue();
});

test('C3 assessment is auto graded for application', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $assessment = Assessment::where('slug', 'caesar-cipher-c3-apply')->first();
    expect($assessment)->not->toBeNull();
    expect($assessment->bloom_level)->toBe('C3');
    expect($assessment->grading_type)->toBe('auto');
});

test('C4 and C5 assessments are manual graded', function (): void {
    Artisan::call('db:seed', ['--class' => 'CaesarCipherCourseSeeder']);

    $c4 = Assessment::where('slug', 'caesar-cipher-c4-analyze')->first();
    expect($c4)->not->toBeNull();
    expect($c4->grading_type)->toBe('manual');

    $c5 = Assessment::where('slug', 'caesar-cipher-c5-evaluate')->first();
    expect($c5)->not->toBeNull();
    expect($c5->grading_type)->toBe('manual');
});
