<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('task management selects the first available topic when none is selected', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->for($course)->create(['position' => 1]);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'title' => 'Intro Caesar Cipher',
        'sort_order' => 1,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'task']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->where('selectedCourseId', 0)
            ->where('selectedLessonId', 0)
            ->has('tasks.data.0', fn (Assert $row) => $row
                ->where('id', $task->id)
                ->where('lesson_id', $lesson->id)
                ->where('title', 'Intro Caesar Cipher')
                ->etc()
            )
        );
});
