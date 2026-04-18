<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;

test('admin course management sections render within baseline response budget', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $courses = Course::factory()->count(20)->create();

    $firstCourse = $courses->first();
    expect($firstCourse)->not->toBeNull();

    $lessons = Lesson::factory()
        ->count(30)
        ->for($firstCourse)
        ->sequence(fn ($sequence) => [
            'position' => $sequence->index + 1,
        ])
        ->create();

    $firstLesson = $lessons->first();
    expect($firstLesson)->not->toBeNull();

    LessonTask::factory()
        ->count(80)
        ->for($firstLesson)
        ->create();

    $sectionRequests = [
        'catalog' => route('admin.courses.index', ['section' => 'catalog']),
        'lesson' => route('admin.courses.index', ['section' => 'lesson', 'course_id' => $firstCourse->id]),
        'task' => route('admin.courses.index', [
            'section' => 'task',
            'course_id' => $firstCourse->id,
            'lesson_id' => $firstLesson->id,
        ]),
    ];

    $durationsMs = [];

    foreach ($sectionRequests as $section => $url) {
        $start = microtime(true);

        $this->actingAs($admin)
            ->get($url)
            ->assertSuccessful();

        $durationsMs[$section] = (microtime(true) - $start) * 1000;
    }

    // Baseline budget is intentionally lenient to avoid flaky CI while still catching major regressions.
    expect($durationsMs['catalog'])->toBeLessThan(1500);
    expect($durationsMs['lesson'])->toBeLessThan(1500);
    expect($durationsMs['task'])->toBeLessThan(1500);
});
