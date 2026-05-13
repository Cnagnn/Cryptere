<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('course detail exposes only learner safe published lessons and tasks', function (): void {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'status' => 'published',
        'is_published' => true,
    ]);

    $publishedLesson = Lesson::factory()->for($course)->create([
        'title' => 'Published Lesson',
        'position' => 1,
        'status' => 'published',
    ]);

    Lesson::factory()->for($course)->create([
        'title' => 'Draft Lesson',
        'position' => 2,
        'status' => 'draft',
    ]);

    $quizTask = LessonTask::factory()->for($publishedLesson, 'lesson')->create([
        'title' => 'Quiz Task',
        'type' => 'quiz',
        'status' => 'published',
        'published_at' => now(),
    ]);

    LessonTask::factory()->for($publishedLesson, 'lesson')->create([
        'title' => 'Draft Task',
        'type' => 'read',
        'status' => 'draft',
        'published_at' => null,
    ]);

    QuizQuestion::factory()->for($quizTask, 'task')->create([
        'question' => 'Which cipher is symmetric?',
        'options' => ['AES', 'RSA', 'ECC', 'DSA'],
        'correct_option' => 0,
        'explanation' => 'AES is symmetric.',
    ]);

    Enrollment::factory()->for($user)->for($course)->create();

    $this->actingAs($user)
        ->get(route('courses.show', $course))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/show')
            ->has('lessons', 1)
            ->where('lessons.0.title', 'Published Lesson')
            ->has('lessons.0.tasks', 1)
            ->where('lessons.0.tasks.0.title', 'Quiz Task')
            ->missing('lessons.0.tasks.0.questions.0.correctOption')
            ->missing('lessons.0.tasks.0.questions.0.correct_answer')
        );
});
