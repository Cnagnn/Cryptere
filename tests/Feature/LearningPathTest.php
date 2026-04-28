<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
});

test('learning path page renders for authenticated user', function () {
    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('learning-path')
            ->has('learningPath')
            ->has('learningPath.nodes')
            ->has('learningPath.categories')
            ->has('summary')
        );
});

test('learning path page requires authentication', function () {
    $this->get(route('learning-path'))
        ->assertRedirect(route('login'));
});

test('learning path includes published courses', function () {
    $course = Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    Course::factory()->create(['is_published' => false]);

    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertInertia(fn ($page) => $page
            ->component('learning-path')
            ->has('learningPath.nodes', 1)
            ->where('learningPath.nodes.0.title', $course->title)
        );
});

test('learning path shows enrollment status', function () {
    $course = Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
        'progress_percentage' => 50,
        'completed_at' => null,
    ]);

    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertInertia(fn ($page) => $page
            ->where('learningPath.nodes.0.isEnrolled', true)
            ->where('learningPath.nodes.0.progressPercentage', 50)
            ->where('learningPath.nodes.0.isCompleted', false)
        );
});

test('learning path shows completed courses', function () {
    $course = Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertInertia(fn ($page) => $page
            ->where('learningPath.nodes.0.isCompleted', true)
        );
});

test('learning path shows locked courses when prerequisite not completed', function () {
    $prereq = Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    $course = Course::factory()->create([
        'is_published' => true,
        'path_position' => 2,
        'prerequisite_course_id' => $prereq->id,
    ]);

    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertInertia(fn ($page) => $page
            ->has('learningPath.nodes', 2)
            ->where('learningPath.nodes.1.isLocked', true)
            ->where('learningPath.nodes.1.prerequisiteId', $prereq->id)
        );
});

test('learning path unlocks course when prerequisite is completed', function () {
    $prereq = Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    $course = Course::factory()->create([
        'is_published' => true,
        'path_position' => 2,
        'prerequisite_course_id' => $prereq->id,
    ]);

    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $prereq->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertInertia(fn ($page) => $page
            ->where('learningPath.nodes.1.isLocked', false)
        );
});

test('learning path summary stats are correct', function () {
    $courses = Course::factory()->count(3)->create([
        'is_published' => true,
        'path_position' => 1,
    ]);

    // Complete first course
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $courses[0]->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    // In progress second course
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $courses[1]->id,
        'progress_percentage' => 40,
        'completed_at' => null,
    ]);

    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertInertia(fn ($page) => $page
            ->where('summary.totalCourses', 3)
            ->where('summary.completedCourses', 1)
            ->where('summary.inProgressCourses', 1)
        );
});

test('learning path returns categories', function () {
    Course::factory()->create([
        'is_published' => true,
        'path_position' => 1,
        'category' => 'Symmetric',
    ]);

    Course::factory()->create([
        'is_published' => true,
        'path_position' => 2,
        'category' => 'Asymmetric',
    ]);

    $this->actingAs($this->user)
        ->get(route('learning-path'))
        ->assertInertia(fn ($page) => $page
            ->has('learningPath.categories', 2)
        );
});
