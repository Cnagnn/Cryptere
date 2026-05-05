<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('assessment management starts without a selected course filter', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);
    $course = Course::factory()->create();

    Assessment::factory()->for($course)->create();

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'assessment']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->where('selectedCourseId', 0)
            ->where('courseFilterSelected', false)
        );
});
