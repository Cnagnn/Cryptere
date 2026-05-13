<?php

use App\Models\Assessment;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\Topic;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('admin course management returns the frontend course data contract', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $publisher = User::factory()->create(['name' => 'Publisher']);

    $course = Course::factory()->create([
        'status' => 'published',
        'is_published' => true,
        'version' => 2,
        'published_by' => $publisher->id,
    ]);

    Lesson::factory()->for($course)->create();

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'catalog']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/courses/index')
            ->has('courses.data.0', fn (Assert $row) => $row
                ->where('id', $course->id)
                ->where('status', 'published')
                ->where('is_published', true)
                ->where('version', 2)
                ->where('published_by_name', 'Publisher')
                ->has('lessons_count')
                ->has('tasks_count')
                ->has('enrollments_count')
                ->etc()
            )
        );
});

test('admin course management returns lesson task and assessment data contracts', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $publisher = User::factory()->create(['name' => 'Publisher']);
    $topic = Topic::factory()->create(['name' => 'Cryptography']);
    $course = Course::factory()->create();
    $lesson = Lesson::factory()->for($course)->create([
        'topic_id' => $topic->id,
        'status' => 'published',
        'version' => 3,
        'published_by' => $publisher->id,
    ]);
    $task = LessonTask::factory()->for($lesson, 'lesson')->create([
        'status' => 'draft',
        'version' => 4,
        'published_by' => $publisher->id,
        'estimated_minutes' => 12,
        'prerequisite_task_id' => null,
    ]);
    $assessment = Assessment::factory()->for($course)->create([
        'status' => 'draft',
        'version' => 5,
        'published_by' => $publisher->id,
    ]);

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'lesson', 'course_id' => $course->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('lessons.data.0', fn (Assert $row) => $row
                ->where('id', $lesson->id)
                ->where('topic_id', $topic->id)
                ->where('topic_name', 'Cryptography')
                ->where('status', 'published')
                ->where('version', 3)
                ->where('published_by_name', 'Publisher')
                ->has('tasks_count')
                ->etc()
            )
        );

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'task', 'lesson_id' => $lesson->id]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('tasks.data.0', fn (Assert $row) => $row
                ->where('id', $task->id)
                ->where('course_id', $course->id)
                ->where('status', 'draft')
                ->where('version', 4)
                ->where('published_by_name', 'Publisher')
                ->where('estimated_minutes', 12)
                ->has('prerequisite_task_id')
                ->has('video_processing_status')
                ->has('conversion_status')
                ->etc()
            )
        );

    $this->actingAs($admin)
        ->get(route('admin.courses.index', ['section' => 'assessment']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('assessments.data.0', fn (Assert $row) => $row
                ->where('id', $assessment->id)
                ->where('status', 'draft')
                ->where('is_published', false)
                ->where('version', 5)
                ->where('published_by_name', 'Publisher')
                ->has('questions_count')
                ->etc()
            )
        );
});

test('non admin users cannot access admin management routes', function (): void {
    $user = User::factory()->create(['role' => 'student', 'is_admin' => false]);

    $this->actingAs($user)
        ->get(route('admin.courses.index'))
        ->assertForbidden();
});
