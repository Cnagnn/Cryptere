<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\User;
use App\Services\Dashboard\LearnerStatsAggregator;

beforeEach(function () {
    $this->service = new LearnerStatsAggregator;
});

test('aggregate returns zero stats for new user', function () {
    $user = User::factory()->create();

    $stats = $this->service->aggregate($user);

    expect($stats['enrolledCourses'])->toBe(0)
        ->and($stats['completedCourses'])->toBe(0)
        ->and($stats['completedLessons'])->toBe(0);
});

test('aggregate counts enrolled and completed courses', function () {
    $user = User::factory()->create();
    $course1 = Course::factory()->create();
    $course2 = Course::factory()->create();

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course1->id,
        'completed_at' => now(),
    ]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course2->id,
        'completed_at' => null,
        'progress_percentage' => 50,
    ]);

    $stats = $this->service->aggregate($user);

    expect($stats['enrolledCourses'])->toBe(2)
        ->and($stats['completedCourses'])->toBe(1)
        ->and($stats['inProgressCourses'])->toBe(1);
});

test('aggregate counts completed lessons', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->create(['course_id' => $course->id]);

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
    ]);

    $stats = $this->service->aggregate($user);

    expect($stats['completedLessons'])->toBe(1);
});

test('successRates calculates overall rate', function () {
    $user = User::factory()->create();

    $rates = $this->service->successRates($user, 10, 3);

    expect($rates['overallSuccessRate'])->toBe(30.0);
});

test('successRates returns zero when no enrollments', function () {
    $user = User::factory()->create();

    $rates = $this->service->successRates($user, 0, 0);

    expect($rates['overallSuccessRate'])->toBe(0.0)
        ->and($rates['previousSuccessRate'])->toBe(0.0);
});
