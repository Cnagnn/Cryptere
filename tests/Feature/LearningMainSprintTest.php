<?php

use App\Models\Challenge;
use App\Models\ChallengeSubmission;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\LessonProgress;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

test('authenticated users can view the course catalog', function () {
    $user = User::factory()->create();

    $publishedCourse = Course::factory()->create([
        'slug' => 'course-visible',
        'is_published' => true,
    ]);

    Course::factory()->create([
        'slug' => 'course-hidden',
        'is_published' => false,
    ]);

    $this->actingAs($user)
        ->get(route('courses.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/index')
            ->has('courses', 1)
            ->where('courses.0.slug', $publishedCourse->slug),
        );
});

test('users must complete lessons in sequence to finish a course', function () {
    $user = User::factory()->create([
        'points' => 0,
        'last_active_date' => now()->toDateString(),
        'daily_goal_met_at' => now()->toDateString(),
    ]);

    $course = Course::factory()->create([
        'slug' => 'sequence-course',
        'is_published' => true,
    ]);

    $lessonOne = Lesson::factory()->for($course)->create([
        'position' => 1,
    ]);

    $lessonTwo = Lesson::factory()->for($course)->create([
        'position' => 2,
    ]);

    $this->actingAs($user)
        ->post(route('courses.enroll', ['course' => $course->slug]))
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', ['course' => $course->slug, 'lesson' => $lessonTwo->id]))
        ->assertRedirect();

    expect(LessonProgress::query()
        ->whereBelongsTo($user)
        ->whereBelongsTo($lessonTwo)
        ->exists())->toBeFalse();

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', ['course' => $course->slug, 'lesson' => $lessonOne->id]))
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', ['course' => $course->slug, 'lesson' => $lessonTwo->id]))
        ->assertRedirect();

    $enrollment = Enrollment::query()
        ->whereBelongsTo($user)
        ->whereBelongsTo($course)
        ->first();

    expect($enrollment)->not->toBeNull();
    expect($enrollment?->progress_percentage)->toBe(100);
    expect($enrollment?->completed_at)->not->toBeNull();
    // Points = 2 × lesson_completion_xp (30) + course completion bonus + level-up bonus
    $lessonXp = (int) config('rewards.lesson_completion_xp');
    $completionBonus = (int) config('rewards.course_completion_points');
    expect($user->refresh()->points)->toBeGreaterThanOrEqual(($lessonXp * 2) + $completionBonus);
});

test('enrolled users can reset their course progress', function () {
    $user = User::factory()->create(['points' => 0, 'last_active_date' => now()->toDateString()]);

    $course = Course::factory()->create([
        'slug' => 'resettable-course',
        'is_published' => true,
    ]);

    $lessonOne = Lesson::factory()->for($course)->create([
        'position' => 1,
    ]);

    $lessonTwo = Lesson::factory()->for($course)->create([
        'position' => 2,
    ]);

    $this->actingAs($user)
        ->post(route('courses.enroll', ['course' => $course->slug]))
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('courses.lessons.complete', ['course' => $course->slug, 'lesson' => $lessonOne->id]))
        ->assertRedirect();

    $enrollmentBeforeReset = Enrollment::query()
        ->whereBelongsTo($user)
        ->whereBelongsTo($course)
        ->first();

    $lessonXp = (int) config('rewards.lesson_completion_xp', 30);
    expect($enrollmentBeforeReset?->progress_percentage)->toBe(50);
    expect($user->refresh()->points)->toBe($lessonXp);

    $this->actingAs($user)
        ->post(route('courses.reset', ['course' => $course->slug]))
        ->assertRedirect();

    $enrollmentAfterReset = Enrollment::query()
        ->whereBelongsTo($user)
        ->whereBelongsTo($course)
        ->first();

    expect($enrollmentAfterReset?->progress_percentage)->toBe(0);
    expect($enrollmentAfterReset?->completed_at)->toBeNull();

    expect(LessonProgress::query()
        ->whereBelongsTo($user)
        ->whereIn('lesson_id', [$lessonOne->id, $lessonTwo->id])
        ->exists())->toBeFalse();

    expect($user->refresh()->points)->toBe(0);
});

test('learners only receive published tasks while admins see draft tasks', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $learner = User::factory()->create([
        'is_admin' => false,
        'role' => 'member',
    ]);

    $course = Course::factory()->create([
        'slug' => 'task-visibility-course',
        'is_published' => true,
    ]);

    $lesson = Lesson::factory()->for($course)->create([
        'position' => 1,
    ]);

    LessonTask::factory()->for($lesson)->create([
        'title' => 'Draft task',
        'type' => 'video',
        'published_at' => null,
        'published_by' => null,
    ]);

    LessonTask::factory()->for($lesson)->create([
        'title' => 'Published task',
        'type' => 'video',
        'published_at' => now(),
        'published_by' => $admin->id,
    ]);

    $this->actingAs($learner)
        ->post(route('courses.enroll', ['course' => $course->slug]))
        ->assertRedirect();

    $this->actingAs($learner)
        ->get(route('courses.show', ['course' => $course->slug]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/show')
            ->has('lessons.0.tasks', 1)
            ->where('lessons.0.tasks.0.title', 'Published task'),
        );

    $this->actingAs($admin)
        ->get(route('courses.show', ['course' => $course->slug]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/show')
            ->has('lessons.0.tasks', 2),
        );
});

test('course detail payload returns lessons ordered by position', function () {
    $learner = User::factory()->create([
        'is_admin' => false,
        'role' => 'member',
    ]);

    $course = Course::factory()->create([
        'slug' => 'lesson-order-course',
        'is_published' => true,
    ]);

    $lessonOne = Lesson::factory()->for($course)->create([
        'title' => 'Substitution Ciphers',
        'position' => 1,
    ]);

    $lessonTwo = Lesson::factory()->for($course)->create([
        'title' => 'Practice Session',
        'position' => 2,
    ]);

    $this->actingAs($learner)
        ->post(route('courses.enroll', ['course' => $course->slug]))
        ->assertRedirect();

    $this->actingAs($learner)
        ->get(route('courses.show', ['course' => $course->slug]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/show')
            ->has('lessons', 2)
            ->where('lessons.0.id', $lessonOne->id)
            ->where('lessons.0.title', 'Substitution Ciphers')
            ->where('lessons.1.id', $lessonTwo->id)
            ->where('lessons.1.title', 'Practice Session')
            ->missing('chapters'),
        );
});

test('challenge points are only awarded once per challenge', function () {
    $user = User::factory()->create(['points' => 0, 'last_active_date' => now()->toDateString()]);

    $challenge = Challenge::factory()->create([
        'slug' => 'points-once',
        'expected_answer' => 'hash',
        'is_published' => true,
    ]);

    $this->actingAs($user)
        ->post(route('challenges.submit', ['challenge' => $challenge->slug]), [
            'answer' => 'hash',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('challenges.submit', ['challenge' => $challenge->slug]), [
            'answer' => 'hash',
        ])
        ->assertRedirect();

    expect($user->refresh()->points)->toBe((int) config('rewards.challenge_base_points'));

    expect(ChallengeSubmission::query()
        ->whereBelongsTo($user)
        ->whereBelongsTo($challenge)
        ->count())->toBe(2);
});

test('challenge index returns published challenges with metadata', function () {
    $user = User::factory()->create();

    Challenge::factory()->create([
        'title' => 'Beginner Cipher',
        'expected_answer' => 'cipher',
        'is_published' => true,
    ]);

    Challenge::factory()->create([
        'title' => 'Beginner Hash',
        'expected_answer' => 'hash',
        'is_published' => true,
    ]);

    Challenge::factory()->create([
        'title' => 'Intermediate Nonce',
        'expected_answer' => 'nonce',
        'is_published' => true,
    ]);

    Challenge::factory()->create([
        'title' => 'Advanced Signature',
        'expected_answer' => 'signature',
        'is_published' => true,
    ]);

    $this->actingAs($user)
        ->get(route('challenges.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/index')
            ->has('challenges', 4)
            ->where('challenges.0.title', fn ($title): bool => is_string($title) && $title !== '')
            ->where('challenges.0.status', fn ($status): bool => in_array($status, ['upcoming', 'active', 'ended'], true)),
        );
});

test('published challenge detail can be viewed by learners', function () {
    $user = User::factory()->create();

    $challenge = Challenge::factory()->create([
        'slug' => 'detail-visible-challenge',
        'title' => 'Detail Visible Challenge',
        'expected_answer' => 'hash',
        'is_published' => true,
    ]);

    $this->actingAs($user)
        ->get(route('challenges.show', ['challenge' => $challenge->slug]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('challenges/show')
            ->where('challenge.slug', $challenge->slug)
            ->where('challenge.title', $challenge->title)
            ->has('challenge.options')
            ->where('submissionSummary.attemptCount', 0),
        );
});

test('unpublished challenge detail returns forbidden for non-admin', function () {
    $user = User::factory()->create();

    $challenge = Challenge::factory()->create([
        'slug' => 'detail-hidden-challenge',
        'is_published' => false,
    ]);

    $this->actingAs($user)
        ->get(route('challenges.show', ['challenge' => $challenge->slug]))
        ->assertForbidden();
});

test('non-admin users cannot update managed user access', function () {
    $member = User::factory()->create([
        'is_admin' => false,
        'role' => 'member',
    ]);

    $targetUser = User::factory()->create([
        'is_admin' => false,
        'role' => 'member',
    ]);

    $this->actingAs($member)
        ->patch(route('admin.users.update', ['user' => $targetUser->id]), [
            'role' => 'admin',
            'points' => 99,
        ])
        ->assertForbidden();

    expect($targetUser->fresh()?->role)->toBe('member');
    expect($targetUser->fresh()?->is_admin)->toBeFalse();
});

test('role-based admin users can access management routes', function () {
    $adminByRole = User::factory()->create([
        'is_admin' => false,
        'role' => 'admin',
    ]);

    $this->actingAs($adminByRole)
        ->get(route('admin.users.index'))
        ->assertOk();
});

test('admin users can update managed user role and points', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $targetUser = User::factory()->create([
        'name' => 'Target User',
        'username' => 'targetuser',
        'email' => 'targetuser@example.test',
        'is_admin' => false,
        'role' => 'member',
        'points' => 5,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.users.update', ['user' => $targetUser->id]), [
            'role' => 'admin',
            'points' => 42,
        ])
        ->assertRedirect();

    expect($targetUser->fresh()?->role)->toBe('admin');
    expect($targetUser->fresh()?->is_admin)->toBeTrue();
    expect($targetUser->fresh()?->points)->toBe(42);

    $this->actingAs($admin)
        ->patch(route('admin.users.update', ['user' => $targetUser->id]), [
            'role' => 'member',
            'points' => 21,
        ])
        ->assertRedirect();

    expect($targetUser->fresh()?->role)->toBe('member');
    expect($targetUser->fresh()?->is_admin)->toBeFalse();
    expect($targetUser->fresh()?->points)->toBe(21);
});

test('admin users index returns avatar from database image blob', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    User::factory()->create([
        'name' => 'Avatar User',
        'email' => 'avatar-user@example.test',
        'avatar_image' => 'avatar-binary',
        'avatar_mime_type' => 'image/png',
    ]);

    $this->actingAs($admin)
        ->get(route('admin.users.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/users/index')
            ->where('users.data', function ($users): bool {
                $matchedUser = collect($users)->first(
                    fn ($user): bool => data_get($user, 'email') === 'avatar-user@example.test'
                );

                $avatar = data_get($matchedUser, 'avatar');

                return is_string($avatar) && str_starts_with($avatar, 'data:image/png;base64,');
            }),
        );
});

test('admin users can soft delete managed users', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $targetUser = User::factory()->create([
        'is_admin' => false,
        'role' => 'member',
        'status' => 'active',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', ['user' => $targetUser->id]))
        ->assertRedirect();

    $this->assertSoftDeleted('users', ['id' => $targetUser->id]);
});

test('admin users cannot soft delete their own account', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', ['user' => $admin->id]))
        ->assertRedirect();

    $this->assertNotSoftDeleted('users', ['id' => $admin->id]);
});

test('admin users cannot delete the last admin account', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->delete(route('admin.users.destroy', ['user' => $admin->id]))
        ->assertRedirect()
        ->assertSessionHas('error', 'The last admin account cannot be deleted.');

    $this->assertNotSoftDeleted('users', ['id' => $admin->id]);
});

test('admin users can create managed courses', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.courses.store'), [
            'title' => 'Applied Cryptography Basics',
            'description' => 'Learn practical encryption fundamentals for day-to-day engineering work.',
            'cover_image' => UploadedFile::fake()->image('course-cover.png'),
        ])
        ->assertRedirect(route('admin.courses.index'));

    $course = Course::query()->where('title', 'Applied Cryptography Basics')->first();

    expect($course)->not->toBeNull();
    expect($course?->summary)->toBe('Learn practical encryption fundamentals for day-to-day engineering work.');
    expect($course?->is_published)->toBeTrue();
    expect($course?->cover_mime_type)->toStartWith('image/');
    expect($course?->cover)->not->toBeNull();
});

test('managed course creation validates required fields', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $this->actingAs($admin)
        ->post(route('admin.courses.store'), [
            'title' => '',
            'description' => '',
        ])
        ->assertRedirect()
        ->assertSessionHasErrors(['title', 'description']);

    expect(Course::query()->count())->toBe(0);
});

test('admin users can update managed courses', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create([
        'title' => 'Old Course Title',
        'summary' => 'Old summary',
        'is_published' => false,
    ]);

    $this->actingAs($admin)
        ->patch(route('admin.courses.update', ['course' => $course->id]), [
            'title' => 'Updated Course Title',
            'description' => 'Updated summary text for admins.',
            'cover_image' => UploadedFile::fake()->image('updated-cover.jpg'),
        ])
        ->assertRedirect(route('admin.courses.index'));

    expect($course->fresh()?->title)->toBe('Updated Course Title');
    expect($course->fresh()?->summary)->toBe('Updated summary text for admins.');
    expect($course->fresh()?->is_published)->toBeTrue();
    expect($course->fresh()?->cover_mime_type)->toStartWith('image/');
    expect($course->fresh()?->cover)->not->toBeNull();
});

test('admin users can delete managed courses', function () {
    $admin = User::factory()->create([
        'is_admin' => true,
        'role' => 'admin',
    ]);

    $course = Course::factory()->create();

    $this->actingAs($admin)
        ->delete(route('admin.courses.destroy', ['course' => $course->id]))
        ->assertRedirect(route('admin.courses.index'));

    $this->assertDatabaseMissing('courses', ['id' => $course->id]);
});

test('quick challenge submissions return json and award points once', function () {
    $user = User::factory()->create(['points' => 0, 'last_active_date' => now()->toDateString()]);

    $challenge = Challenge::factory()->create([
        'slug' => 'quick-json-points',
        'expected_answer' => 'hash',
        'is_published' => true,
    ]);

    $this->actingAs($user)
        ->postJson(route('challenges.quick-submit', ['challenge' => $challenge->slug]), [
            'answer' => 'hash',
            'elapsed_ms' => 0,
        ])
        ->assertOk()
        ->assertJsonPath('isCorrect', true)
        ->assertJsonPath('alreadySolved', false)
        ->assertJsonPath('awardedPoints', (int) config('rewards.challenge_base_points'))
        ->assertJsonPath('correctAnswer', 'hash');

    $this->actingAs($user)
        ->postJson(route('challenges.quick-submit', ['challenge' => $challenge->slug]), [
            'answer' => 'hash',
            'elapsed_ms' => 1200,
        ])
        ->assertOk()
        ->assertJsonPath('isCorrect', true)
        ->assertJsonPath('alreadySolved', true)
        ->assertJsonPath('awardedPoints', 0);

    expect($user->refresh()->points)->toBe((int) config('rewards.challenge_base_points'));

    expect(ChallengeSubmission::query()
        ->whereBelongsTo($user)
        ->whereBelongsTo($challenge)
        ->count())->toBe(2);
});

test('quick challenge scoring gives more points for faster correct answers', function () {
    $user = User::factory()->create([
        'points' => 0,
        'last_active_date' => now()->toDateString(),
        'daily_goal_met_at' => now()->toDateString(),
    ]);

    $fastChallenge = Challenge::factory()->create([
        'slug' => 'speed-fast',
        'expected_answer' => 'hash',
        'is_published' => true,
    ]);

    $slowChallenge = Challenge::factory()->create([
        'slug' => 'speed-slow',
        'expected_answer' => 'hash',
        'is_published' => true,
    ]);

    $fastResponse = $this->actingAs($user)
        ->postJson(route('challenges.quick-submit', ['challenge' => $fastChallenge->slug]), [
            'answer' => 'hash',
            'elapsed_ms' => 1000,
        ])
        ->assertOk();

    $slowResponse = $this->actingAs($user)
        ->postJson(route('challenges.quick-submit', ['challenge' => $slowChallenge->slug]), [
            'answer' => 'hash',
            'elapsed_ms' => 19000,
        ])
        ->assertOk();

    $fastAward = (int) $fastResponse->json('awardedPoints');
    $slowAward = (int) $slowResponse->json('awardedPoints');

    expect($fastAward)->toBeGreaterThan($slowAward);
    expect($slowAward)->toBeGreaterThan(0);
    expect($fastAward)->toBeLessThanOrEqual(100);
    expect($user->refresh()->points)->toBe($fastAward + $slowAward);
});

test('leaderboard is sorted by points descending', function () {
    $viewer = User::factory()->create([
        'name' => 'Viewer',
        'points' => 200,
        'last_active_date' => now()->toDateString(),
    ]);

    User::factory()->create([
        'name' => 'Top User',
        'points' => 320,
        'last_active_date' => now()->toDateString(),
    ]);

    User::factory()->create([
        'name' => 'Third User',
        'points' => 120,
        'last_active_date' => now()->toDateString(),
    ]);

    $this->actingAs($viewer)
        ->get(route('leaderboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('leaderboard/index')
            ->where('leaders.data.0.points', 320)
            ->where('leaders.data.1.points', 200)
            ->where('leaders.current_page', 1)
            ->where('currentUser.rank', 2),
        );
});

test('leaderboard includes database avatar data for leaders', function () {
    $viewer = User::factory()->create([
        'name' => 'Viewer',
        'points' => 200,
    ]);

    User::factory()->create([
        'name' => 'Top User',
        'username' => 'topuser',
        'points' => 320,
        'avatar_image' => 'leader-avatar-binary',
        'avatar_mime_type' => 'image/png',
    ]);

    $this->actingAs($viewer)
        ->get(route('leaderboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('leaderboard/index')
            ->where('leaders.data', function ($leaders): bool {
                $topUser = collect($leaders)->first(
                    fn ($leader): bool => data_get($leader, 'username') === 'topuser'
                );

                $avatar = data_get($topUser, 'avatar');

                return is_string($avatar) && str_starts_with($avatar, 'data:image/png;base64,');
            }),
        );
});

test('leaderboard pagination shows the requested page', function () {
    $viewer = User::factory()->create([
        'name' => 'Viewer',
        'points' => 999,
    ]);

    User::factory()->count(35)->sequence(
        fn ($sequence) => [
            'name' => sprintf('Learner %02d', $sequence->index + 1),
            'points' => 500 - $sequence->index,
        ]
    )->create();

    $this->actingAs($viewer)
        ->get(route('leaderboard.index', ['page' => 2]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('leaderboard/index')
            ->where('leaders.current_page', 2)
            ->where('leaders.last_page', 4)
            ->where('leaders.data.0.rank', 11)
            ->where('leaders.data.0.points', 491),
        );
});

test('leaderboard marks zero-point learners as unranked', function () {
    $viewer = User::factory()->create([
        'name' => 'Viewer',
        'points' => 0,
    ]);

    User::factory()->create([
        'name' => 'Active Learner',
        'points' => 120,
    ]);

    $this->actingAs($viewer)
        ->get(route('leaderboard.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('leaderboard/index')
            ->where('currentUser.rank', 0)
            ->where('currentUser.points', 0),
        );
});

test('labs page can be rendered', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('labs.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('labs/index'),
        );
});

test('labs detail page can be rendered for supported algorithms', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('labs.show', ['lab' => 'caesar-cipher-lab']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('labs/show')
            ->where('lab.slug', 'caesar-cipher-lab')
            ->where('lab.title', 'Caesar Cipher'),
        );
});

test('labs detail page returns 404 for unsupported algorithm slug', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('labs.show', ['lab' => 'unsupported-lab']))
        ->assertNotFound();
});
