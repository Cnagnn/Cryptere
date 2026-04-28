<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
});

test('analytics page renders for authenticated user', function () {
    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('analytics')
            ->has('skillRadar')
            ->has('heatmap')
            ->has('weeklyTrends')
            ->has('studyStats')
            ->has('recommendations')
            ->has('level')
            ->has('stats')
        );
});

test('analytics page requires authentication', function () {
    $this->get(route('analytics'))
        ->assertRedirect(route('login'));
});

test('analytics returns correct study stats structure', function () {
    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertInertia(fn ($page) => $page
            ->has('studyStats.totalLessons')
            ->has('studyStats.totalChallenges')
            ->has('studyStats.totalEnrollments')
            ->has('studyStats.completedCourses')
            ->has('studyStats.estimatedStudyMinutes')
            ->has('studyStats.completionRate')
        );
});

test('analytics returns weekly trends for 8 weeks', function () {
    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertInertia(fn ($page) => $page
            ->has('weeklyTrends', 8)
        );
});

test('analytics returns skill radar data when enrolled', function () {
    $course = Course::factory()->create([
        'is_published' => true,
        'category' => 'Symmetric',
    ]);

    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
        'progress_percentage' => 75,
    ]);

    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertInertia(fn ($page) => $page
            ->has('skillRadar', 1)
            ->where('skillRadar.0.category', 'Symmetric')
        );
});

test('analytics returns streak recommendation when no streak', function () {
    $this->user->update(['current_streak' => 0]);

    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertInertia(fn ($page) => $page
            ->where('recommendations.0.type', 'streak')
        );
});

test('analytics returns continue recommendation for in-progress course', function () {
    $course = Course::factory()->create([
        'is_published' => true,
        'title' => 'AES Encryption',
    ]);

    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
        'progress_percentage' => 60,
        'completed_at' => null,
    ]);

    $this->user->update(['current_streak' => 5]); // avoid streak recommendation

    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertInertia(fn ($page) => $page
            ->where('recommendations.0.type', 'continue')
        );
});

test('analytics returns user stats', function () {
    $this->user->update([
        'xp' => 500,
        'points' => 200,
        'current_streak' => 7,
        'longest_streak' => 14,
    ]);

    $this->actingAs($this->user)
        ->get(route('analytics'))
        ->assertInertia(fn ($page) => $page
            ->where('stats.totalXp', 500)
            ->where('stats.totalPoints', 200)
            ->where('stats.currentStreak', 7)
            ->where('stats.longestStreak', 14)
        );
});
