<?php

use App\Models\Badge;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use App\Services\BadgeService;

beforeEach(function () {
    BadgeService::clearCache();
});

test('badge is awarded after first enrollment', function () {
    Badge::factory()->create([
        'slug' => 'first-enrollment',
        'criteria_type' => 'first_enrollment',
        'criteria_value' => 1,
    ]);
    BadgeService::clearCache();

    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);

    $this->actingAs($user)
        ->post(route('courses.enroll', $course))
        ->assertRedirect();

    expect($user->badges()->count())->toBe(1);
    expect($user->badges->first()->slug)->toBe('first-enrollment');
});

test('badge is awarded after lesson completion', function () {
    Badge::factory()->create([
        'slug' => 'lessons-5',
        'criteria_type' => 'lessons_completed',
        'criteria_value' => 5,
    ]);
    BadgeService::clearCache();

    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true]);
    Enrollment::factory()->for($user)->for($course)->create([
        'progress_percentage' => 0,
        'completed_at' => null,
    ]);

    // Create 5 lessons and complete them sequentially
    $lessons = Lesson::factory()->for($course)->count(5)->sequence(
        ['position' => 1],
        ['position' => 2],
        ['position' => 3],
        ['position' => 4],
        ['position' => 5],
    )->create();

    foreach ($lessons as $lesson) {
        $this->actingAs($user)
            ->post(route('courses.lessons.complete', [$course, $lesson]));
    }

    expect($user->fresh()->badges()->count())->toBe(1);
});

test('level info is shared in inertia props', function () {
    $user = User::factory()->create(['points' => 150, 'xp' => 56, 'last_active_date' => now()->toDateString()]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('auth.user.level')
            ->where('auth.user.level.level', 2)
            ->missing('auth.user.level.name')
        );
});

test('badge count is shared in inertia props', function () {
    $user = User::factory()->create();

    $badge = Badge::factory()->create([
        'criteria_type' => 'first_enrollment',
        'criteria_value' => 1,
    ]);
    $user->badges()->attach($badge->id, ['earned_at' => now()]);

    $this->actingAs($user)
        ->get(route('dashboard'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('auth.user.badge_count', 1)
        );
});
