<?php

use App\Models\Badge;
use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\LabVisit;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\QuizSubmission;
use App\Models\User;
use App\Services\Dashboard\RecentActivityAggregator;

beforeEach(function () {
    $this->service = new RecentActivityAggregator;
});

// ─── build ───────────────────────────────────────────────────────────

it('returns at least account creation activity for any user', function () {
    $user = User::factory()->create();

    $result = $this->service->build($user);

    expect($result)->not->toBeEmpty();

    $accountCreated = $result->firstWhere('id', 'account-created');
    expect($accountCreated)->not->toBeNull()
        ->and($accountCreated['title'])->toBe('Joined Crypter')
        ->and($accountCreated['tag'])->toBe('Account');
});

it('includes email verification activity', function () {
    $user = User::factory()->create([
        'email_verified_at' => now()->subDay(),
    ]);

    $result = $this->service->build($user);

    $emailVerified = $result->firstWhere('id', 'account-email-verified');
    expect($emailVerified)->not->toBeNull()
        ->and($emailVerified['title'])->toBe('Verified email address')
        ->and($emailVerified['tag'])->toBe('Account');
});

it('includes two-factor authentication activity', function () {
    $user = User::factory()->withTwoFactor()->create();

    $result = $this->service->build($user);

    $twoFa = $result->firstWhere('id', 'account-2fa-enabled');
    expect($twoFa)->not->toBeNull()
        ->and($twoFa['title'])->toBe('Enabled two-factor authentication')
        ->and($twoFa['tag'])->toBe('Security');
});

it('includes lesson completion activities', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create(['title' => 'Intro to Blockchain']);

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    $lessonActivity = $result->first(fn ($a) => str_starts_with($a['id'], 'lesson-'));
    expect($lessonActivity)->not->toBeNull()
        ->and($lessonActivity['title'])->toContain('Intro to Blockchain')
        ->and($lessonActivity['tag'])->toBe('Lesson');
});

it('includes challenge solving activities', function () {
    $user = User::factory()->create();
    $challenge = Challenge::factory()->create(['title' => 'Caesar Cipher']);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    $result = $this->service->build($user);

    $challengeActivity = $result->first(fn ($a) => str_starts_with($a['id'], 'challenge-'));
    expect($challengeActivity)->not->toBeNull()
        ->and($challengeActivity['title'])->toContain('Caesar Cipher')
        ->and($challengeActivity['tag'])->toBe('Challenge');
});

it('does not include incorrect challenge submissions', function () {
    $user = User::factory()->create();

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'is_correct' => false,
        'submitted_at' => now(),
    ]);

    $result = $this->service->build($user);

    $challengeActivities = $result->filter(fn ($a) => str_starts_with($a['id'], 'challenge-'));
    expect($challengeActivities)->toBeEmpty();
});

it('includes enrollment activities', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['title' => 'Advanced Cryptography']);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $result = $this->service->build($user);

    $enrollmentActivity = $result->first(fn ($a) => str_starts_with($a['id'], 'enrollment-'));
    expect($enrollmentActivity)->not->toBeNull()
        ->and($enrollmentActivity['title'])->toContain('Advanced Cryptography')
        ->and($enrollmentActivity['tag'])->toBe('Course');
});

it('includes badge earning activities', function () {
    $user = User::factory()->create();
    $badge = Badge::factory()->create(['name' => 'First Steps']);

    $user->badges()->attach($badge->id, ['earned_at' => now()]);

    $result = $this->service->build($user);

    $badgeActivity = $result->first(fn ($a) => str_starts_with($a['id'], 'badge-'));
    expect($badgeActivity)->not->toBeNull()
        ->and($badgeActivity['title'])->toContain('First Steps')
        ->and($badgeActivity['tag'])->toBe('Badge');
});

it('includes quiz submission activities', function () {
    $user = User::factory()->create();

    QuizSubmission::factory()->create([
        'user_id' => $user->id,
        'score' => 8,
        'total' => 10,
        'submitted_at' => now(),
    ]);

    $result = $this->service->build($user);

    $quizActivity = $result->first(fn ($a) => str_starts_with($a['id'], 'quiz-'));
    expect($quizActivity)->not->toBeNull()
        ->and($quizActivity['title'])->toContain('8/10')
        ->and($quizActivity['tag'])->toBe('Quiz');
});

it('includes lab visit activities', function () {
    $user = User::factory()->create();

    LabVisit::factory()->create([
        'user_id' => $user->id,
        'lab_slug' => 'caesar-cipher-lab',
        'last_visited_at' => now(),
    ]);

    $result = $this->service->build($user);

    $labActivity = $result->first(fn ($a) => str_starts_with($a['id'], 'lab-'));
    expect($labActivity)->not->toBeNull()
        ->and($labActivity['title'])->toContain('Caesar Cipher Lab')
        ->and($labActivity['tag'])->toBe('Lab');
});

it('limits results to 15 activities', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    // Create 5 lesson completions (each with unique lesson) — service takes max 5
    $lessons = Lesson::factory()->count(5)->create();
    foreach ($lessons as $lesson) {
        LessonProgress::factory()->create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
    }

    // Create 5 challenge submissions — service takes max 5
    foreach (range(1, 5) as $i) {
        ChallengeSubmission::factory()->create([
            'user_id' => $user->id,
            'is_correct' => true,
            'submitted_at' => now(),
        ]);
    }

    // Create 5 enrollments — service takes max 5
    foreach (range(1, 5) as $i) {
        Enrollment::factory()->create([
            'user_id' => $user->id,
        ]);
    }

    // Create 5 quiz submissions — service takes max 5
    foreach (range(1, 5) as $i) {
        QuizSubmission::factory()->create([
            'user_id' => $user->id,
            'submitted_at' => now(),
        ]);
    }

    $result = $this->service->build($user);

    // Total possible: 5 lessons + 5 challenges + 5 enrollments + 5 quizzes + 2 account = 22
    // Service limits to 15
    expect($result)->toHaveCount(15);
});

it('sorts activities by date descending', function () {
    $user = User::factory()->create(['created_at' => now()->subDays(10)]);
    $lesson1 = Lesson::factory()->create();
    $lesson2 = Lesson::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson1->id,
        'completed_at' => now()->subDays(5),
    ]);

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson2->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    $dates = $result->pluck('isoDate')->filter()->values();
    $sortedDates = $dates->sort()->reverse()->values();

    expect($dates->toArray())->toBe($sortedDates->toArray());
});

it('does not include other users activities', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    LessonProgress::factory()->count(5)->create([
        'user_id' => $otherUser->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    $lessonActivities = $result->filter(fn ($a) => str_starts_with($a['id'], 'lesson-'));
    expect($lessonActivities)->toBeEmpty();
});

it('each activity has required keys', function () {
    $user = User::factory()->create();
    $lesson = Lesson::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    foreach ($result as $activity) {
        expect($activity)->toHaveKeys(['id', 'title', 'tag', 'timestamp', 'isoDate']);
    }
});

it('filters out activities with null isoDate', function () {
    $user = User::factory()->create();

    $result = $this->service->build($user);

    foreach ($result as $activity) {
        expect($activity['isoDate'])->not->toBeNull();
    }
});

it('merges activities from multiple sources correctly', function () {
    $user = User::factory()->create(['email_verified_at' => now()->subDay()]);
    $lesson = Lesson::factory()->create();
    $challenge = Challenge::factory()->create();
    $course = Course::factory()->create();

    LessonProgress::factory()->create([
        'user_id' => $user->id,
        'lesson_id' => $lesson->id,
        'completed_at' => now(),
    ]);

    ChallengeSubmission::factory()->create([
        'user_id' => $user->id,
        'challenge_id' => $challenge->id,
        'is_correct' => true,
        'submitted_at' => now(),
    ]);

    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
    ]);

    $result = $this->service->build($user);

    $tags = $result->pluck('tag')->unique()->toArray();

    // Should have activities from multiple sources
    expect($tags)->toContain('Lesson')
        ->and($tags)->toContain('Challenge')
        ->and($tags)->toContain('Course')
        ->and($tags)->toContain('Account');
});
