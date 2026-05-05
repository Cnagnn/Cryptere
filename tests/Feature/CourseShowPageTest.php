<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('renders the course detail page with safe learning props', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'title' => 'Applied Cryptography',
        'summary' => 'Learn modern cryptography workflows.',
    ]);
    $lesson = Lesson::factory()->for($course)->create([
        'title' => 'Symmetric Encryption',
        'position' => 1,
        'content' => 'AES lesson content.',
    ]);
    $task = LessonTask::query()->create([
        'lesson_id' => $lesson->id,
        'title' => 'Quiz: AES Basics',
        'type' => 'quiz',
        'sort_order' => 1,
        'published_at' => now(),
    ]);

    QuizQuestion::factory()->for($task, 'task')->create([
        'question' => 'Which algorithm is symmetric?',
        'options' => ['AES', 'RSA', 'ECC', 'DSA'],
        'correct_option' => 0,
        'explanation' => 'AES uses the same key for encryption and decryption.',
    ]);

    Enrollment::factory()->for($user)->for($course)->create([
        'progress_percentage' => 0,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->get(route('courses.show', $course))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/show')
            ->has('course', fn (Assert $courseProps) => $courseProps
                ->where('id', $course->id)
                ->where('slug', $course->slug)
                ->where('title', 'Applied Cryptography')
                ->where('summary', 'Learn modern cryptography workflows.')
                ->has('estimatedMinutes')
                ->has('enrollmentCount')
            )
            ->has('lessons', 1)
            ->where('lessons.0.id', $lesson->id)
            ->where('lessons.0.title', 'Symmetric Encryption')
            ->where('lessons.0.tasks.0.taskId', $task->id)
            ->where('lessons.0.tasks.0.questions.0.question', 'Which algorithm is symmetric?')
            ->missing('lessons.0.tasks.0.questions.0.correctOption')
            ->where('enrollment.progressPercentage', '0.00')
            ->where('enrollment.completedAt', null)
            ->has('assessments')
        );
});
