<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('task management does not auto-select a topic', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);
    $course = Course::factory()->create();
    Lesson::factory()->for($course)->create();

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'task']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->where('selectedCourseId', 0)
            ->where('selectedLessonId', 0)
            ->where('tasks.data', [])
        );
});
