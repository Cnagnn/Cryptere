<?php

use App\Models\Assessment;
use App\Models\AssessmentAnswer;
use App\Models\AssessmentQuestion;
use App\Models\AssessmentSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\TaskProgress;
use App\Models\User;

test('course with learner history cannot be deleted', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $course = Course::factory()->create();
    Enrollment::factory()->for($course)->create();

    $this->actingAs($admin)
        ->delete(route('admin.courses.destroy', $course))
        ->assertSessionHasErrors('course');

    $this->assertDatabaseHas('courses', ['id' => $course->id]);
});

test('lesson with progress cannot be deleted', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $lesson = Lesson::factory()->create();
    LessonProgress::factory()->for($lesson)->create();

    $this->actingAs($admin)
        ->delete(route('admin.courses.lessons.destroy', $lesson))
        ->assertSessionHasErrors('lesson');

    $this->assertDatabaseHas('lessons', ['id' => $lesson->id]);
});

test('task with progress cannot be deleted', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $task = LessonTask::factory()->create();
    TaskProgress::query()->create([
        'user_id' => User::factory()->create()->id,
        'lesson_task_id' => $task->id,
        'completed_at' => now(),
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.courses.tasks.destroy', $task))
        ->assertSessionHasErrors('task');

    $this->assertDatabaseHas('lesson_tasks', ['id' => $task->id]);
});

test('assessment with submissions cannot be deleted', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $assessment = Assessment::factory()->create();
    AssessmentSubmission::factory()->for($assessment)->create();

    $this->actingAs($admin)
        ->delete(route('admin.assessments.destroy', $assessment))
        ->assertSessionHasErrors('assessment');

    $this->assertDatabaseHas('assessments', ['id' => $assessment->id]);
});

test('assessment question with submitted answers cannot be deleted', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $question = AssessmentQuestion::factory()->create();
    AssessmentAnswer::factory()->for($question, 'question')->create();

    $this->actingAs($admin)
        ->delete(route('admin.assessments.questions.destroy', [$question->assessment, $question]))
        ->assertSessionHasErrors('question');

    $this->assertDatabaseHas('assessment_questions', ['id' => $question->id]);
});

test('admin cannot delete users with learning history', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $user = User::factory()->create(['role' => 'student', 'is_admin' => false]);
    Enrollment::factory()->for($user)->create();

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $user))
        ->assertSessionHasErrors('user');

    $this->assertDatabaseHas('users', ['id' => $user->id]);
});

test('admin cannot delete self', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', $admin))
        ->assertSessionHasErrors('user');

    $this->assertDatabaseHas('users', ['id' => $admin->id]);
});
