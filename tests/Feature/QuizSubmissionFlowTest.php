<?php

use App\Models\Course;
use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\QuizQuestion;
use App\Models\User;

test('enrolled learners can submit quiz and get score', function () {
    $user = User::factory()->create();

    $course = Course::factory()->create([
        'is_published' => true,
    ]);

    $lesson = Lesson::factory()->for($course)->create([
        'position' => 1,
    ]);

    $task = LessonTask::factory()->for($lesson)->create([
        'type' => 'quiz',
    ]);

    QuizQuestion::create([
        'lesson_task_id' => $task->id,
        'question' => 'Sample test question?',
        'options' => ['A', 'B', 'C', 'D'],
        'correct_option' => 1,
        'sort_order' => 1,
    ]);

    // Enroll in the course first!
    $this->actingAs($user)
        ->post(route('courses.enroll', ['course' => $course->slug]))
        ->assertRedirect();

    // Now submit the wrong quiz value
    $this->actingAs($user)
        ->postJson(route('courses.lessons.quiz', ['course' => $course->slug, 'lesson' => $lesson->id]), [
            'task_id' => $task->id,
            'answers' => [0], // Wrong answer
        ])
        ->assertOk()
        ->assertJson([
            'score' => 0,
            'total' => 1,
        ]);

    // Submit correct answer
    $this->actingAs($user)
        ->postJson(route('courses.lessons.quiz', ['course' => $course->slug, 'lesson' => $lesson->id]), [
            'task_id' => $task->id,
            'answers' => [1], // Correct answer
        ])
        ->assertOk()
        ->assertJson([
            'score' => 1,
            'total' => 1,
        ]);
});
