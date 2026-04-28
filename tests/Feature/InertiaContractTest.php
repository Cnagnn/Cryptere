<?php

use App\Models\Challenge;
use App\Models\Course;
use App\Models\Lesson;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
    $this->actingAs($this->user);
});

test('course catalog returns expected prop shape', function () {
    $course = Course::factory()->create(['is_published' => true]);
    Lesson::factory()->for($course)->create();

    $response = $this->get(route('courses.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('courses/index')
        ->has('courses', 1, fn ($course) => $course
            ->hasAll([
                'id',
                'slug',
                'title',
                'summary',
                'coverImage',
                'estimatedMinutes',
                'lessonCount',
                'enrollmentCount',
                'isEnrolled',
                'progressPercentage',
            ])
            ->where('isEnrolled', false)
            ->where('progressPercentage', null)
        )
    );
});

test('challenge catalog returns expected prop shape', function () {
    Challenge::factory()->create(['is_published' => true]);

    $response = $this->get(route('challenges.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('challenges/index')
        ->has('challenges', 1, fn ($challenge) => $challenge
            ->hasAll([
                'id',
                'slug',
                'title',
                'prompt',
                'hint',
                'timeStart',
                'timeEnd',
                'status',
                'isSolved',
                'hasCompletedSession',
                'hasQuestionBank',
                'questionsCount',
                'bestScore',
            ])
            ->where('isSolved', false)
            ->where('status', 'active')
        )
    );
});

test('leaderboard returns expected prop shape', function () {
    $response = $this->get(route('leaderboard.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('leaderboard/index')
        ->hasAll([
            'leaders',
            'top3',
            'currentUser',
            'timeframe',
            'timeframes',
            'topScore',
        ])
    );
});

test('dashboard returns expected prop shape for learner', function () {
    $response = $this->get(route('dashboard'));

    $response->assertInertia(fn ($page) => $page
        ->component('dashboard')
        ->hasAll([
            'stats',
            'level',
            'recentBadges',
            'dailyChallenge',
            'recentCourses',
            'recommendedCourses',
            'academy',
            'learningPath',
            'analytics',
        ])
    );
});

test('learning path returns expected prop shape', function () {
    $response = $this->get(route('learning-path'));

    $response->assertInertia(fn ($page) => $page
        ->component('learning-path')
        ->hasAll([
            'learningPath',
            'summary',
        ])
    );
});

test('analytics returns expected prop shape', function () {
    $response = $this->get(route('analytics'));

    $response->assertInertia(fn ($page) => $page
        ->component('analytics')
        ->hasAll([
            'stats',
            'skillRadar',
            'heatmap',
            'weeklyTrends',
            'studyStats',
            'recommendations',
            'level',
        ])
    );
});

test('notifications returns expected JSON shape', function () {
    $response = $this->getJson(route('notifications.index'));

    $response->assertOk()
        ->assertJsonStructure([
            'notifications',
            'unread_count',
        ]);
});

test('daily rewards returns expected JSON shape', function () {
    $response = $this->getJson(route('daily-rewards.index'));

    $response->assertOk()
        ->assertJsonStructure([
            'claimed_today',
            'day_number',
            'today_reward',
            'tiers',
            'calendar',
            'current_streak',
        ]);
});

test('notes returns expected JSON shape', function () {
    $response = $this->getJson(route('notes.index'));

    $response->assertOk()
        ->assertJsonStructure([
            'data',
            'current_page',
            'last_page',
        ]);
});

test('certificates returns expected prop shape', function () {
    $response = $this->get(route('certificates.index'));

    $response->assertInertia(fn ($page) => $page
        ->component('certificates/index')
        ->has('certificates')
    );
});
