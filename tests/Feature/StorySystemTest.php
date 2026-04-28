<?php

use App\Models\Badge;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\StoryChapter;
use App\Models\User;
use App\Models\UserStoryProgress;
use App\Services\LevelService;
use App\Services\StoryService;

beforeEach(function () {
    $this->service = new StoryService;
    StoryService::clearCache();
});

// ── Chapter unlocks correctly on course completion ──

test('unlocks chapter when course is completed', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['slug' => 'crypto-foundations']);

    StoryChapter::create([
        'slug' => 'first-assignment',
        'title' => 'First Assignment',
        'narrative' => '# Test narrative',
        'chapter_number' => 1,
        'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
        'unlock_value' => 'crypto-foundations',
        'icon' => 'briefcase',
    ]);

    // Not completed yet — should not unlock
    Enrollment::factory()->for($user)->for($course)->create([
        'completed_at' => null,
    ]);

    $unlocked = $this->service->checkAndUnlock($user);
    expect($unlocked)->toHaveCount(0);

    // Complete the course
    Enrollment::query()
        ->where('user_id', $user->id)
        ->where('course_id', $course->id)
        ->update(['completed_at' => now()]);

    StoryService::clearCache();
    $unlocked = $this->service->checkAndUnlock($user);

    expect($unlocked)->toHaveCount(1);
    expect($unlocked->first()->slug)->toBe('first-assignment');
    expect(UserStoryProgress::where('user_id', $user->id)->count())->toBe(1);
});

// ── Chapter unlocks correctly on badge earning ──

test('unlocks chapter when badge is earned', function () {
    $user = User::factory()->create();

    $badge = Badge::factory()->create([
        'slug' => 'speed-demon',
        'criteria_type' => 'speed_demon',
        'criteria_value' => 1,
    ]);

    StoryChapter::create([
        'slug' => 'speed-demon-files',
        'title' => 'The Speed Demon Files',
        'narrative' => '# Speed narrative',
        'chapter_number' => 6,
        'unlock_type' => StoryChapter::UNLOCK_BADGE_EARNED,
        'unlock_value' => 'speed-demon',
        'icon' => 'zap',
    ]);

    // No badge yet — should not unlock
    $unlocked = $this->service->checkAndUnlock($user);
    expect($unlocked)->toHaveCount(0);

    // Award the badge
    $user->badges()->attach($badge->id, ['earned_at' => now()]);

    StoryService::clearCache();
    $unlocked = $this->service->checkAndUnlock($user);

    expect($unlocked)->toHaveCount(1);
    expect($unlocked->first()->slug)->toBe('speed-demon-files');
});

// ── Chapter unlocks correctly on level reached ──

test('unlocks chapter when level is reached', function () {
    $user = User::factory()->create(['xp' => 0]);

    StoryChapter::create([
        'slug' => 'grandmasters-legacy',
        'title' => "The Grandmaster's Legacy",
        'narrative' => '# Grandmaster narrative',
        'chapter_number' => 9,
        'unlock_type' => StoryChapter::UNLOCK_LEVEL_REACHED,
        'unlock_value' => '25',
        'icon' => 'crown',
    ]);

    // Low level — should not unlock
    $unlocked = $this->service->checkAndUnlock($user);
    expect($unlocked)->toHaveCount(0);

    // Get the XP needed for level 25 from config
    $thresholds = config('levels.thresholds');
    $level25Xp = $thresholds[25]['min_xp'] ?? 50000;

    $user->update(['xp' => $level25Xp]);

    StoryService::clearCache();
    $unlocked = $this->service->checkAndUnlock($user);

    expect($unlocked)->toHaveCount(1);
    expect($unlocked->first()->slug)->toBe('grandmasters-legacy');
});

// ── Chapter unlocks on first enrollment ──

test('unlocks prologue chapter on first enrollment', function () {
    $user = User::factory()->create();

    StoryChapter::create([
        'slug' => 'the-recruitment',
        'title' => 'The Recruitment',
        'narrative' => '# Prologue narrative',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'mail',
    ]);

    // No enrollment — should not unlock
    $unlocked = $this->service->checkAndUnlock($user);
    expect($unlocked)->toHaveCount(0);

    // Enroll in a course
    Enrollment::factory()->for($user)->create();

    StoryService::clearCache();
    $unlocked = $this->service->checkAndUnlock($user);

    expect($unlocked)->toHaveCount(1);
    expect($unlocked->first()->slug)->toBe('the-recruitment');
});

// ── Duplicate unlocks are prevented ──

test('does not unlock same chapter twice', function () {
    $user = User::factory()->create();
    Enrollment::factory()->for($user)->create();

    StoryChapter::create([
        'slug' => 'the-recruitment',
        'title' => 'The Recruitment',
        'narrative' => '# Prologue',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'mail',
    ]);

    $first = $this->service->checkAndUnlock($user);
    expect($first)->toHaveCount(1);

    StoryService::clearCache();
    $second = $this->service->checkAndUnlock($user);
    expect($second)->toHaveCount(0);

    expect(UserStoryProgress::where('user_id', $user->id)->count())->toBe(1);
});

// ── Mark as read works ──

test('marks chapter as read', function () {
    $user = User::factory()->create();
    $chapter = StoryChapter::create([
        'slug' => 'test-chapter',
        'title' => 'Test Chapter',
        'narrative' => '# Test',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'scroll',
    ]);

    // Create progress entry (unlocked)
    UserStoryProgress::create([
        'user_id' => $user->id,
        'story_chapter_id' => $chapter->id,
        'unlocked_at' => now(),
    ]);

    // Verify not read yet
    $progress = UserStoryProgress::where('user_id', $user->id)
        ->where('story_chapter_id', $chapter->id)
        ->first();
    expect($progress->read_at)->toBeNull();

    // Mark as read
    $this->service->markAsRead($user, $chapter);

    $progress->refresh();
    expect($progress->read_at)->not->toBeNull();
});

test('marking already read chapter does not change read_at', function () {
    $user = User::factory()->create();
    $chapter = StoryChapter::create([
        'slug' => 'test-chapter',
        'title' => 'Test Chapter',
        'narrative' => '# Test',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'scroll',
    ]);

    $readAt = now()->subHour();
    UserStoryProgress::create([
        'user_id' => $user->id,
        'story_chapter_id' => $chapter->id,
        'unlocked_at' => now()->subDay(),
        'read_at' => $readAt,
    ]);

    $this->service->markAsRead($user, $chapter);

    $progress = UserStoryProgress::where('user_id', $user->id)
        ->where('story_chapter_id', $chapter->id)
        ->first();

    // read_at should not have changed since it was already set
    expect($progress->read_at->timestamp)->toBe($readAt->timestamp);
});

// ── Progress summary is accurate ──

test('returns accurate progress summary', function () {
    $user = User::factory()->create();

    $chapter1 = StoryChapter::create([
        'slug' => 'ch-1',
        'title' => 'Chapter 1',
        'narrative' => '# Ch1',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'scroll',
    ]);

    $chapter2 = StoryChapter::create([
        'slug' => 'ch-2',
        'title' => 'Chapter 2',
        'narrative' => '# Ch2',
        'chapter_number' => 1,
        'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
        'unlock_value' => 'some-course',
        'icon' => 'briefcase',
    ]);

    $chapter3 = StoryChapter::create([
        'slug' => 'ch-3',
        'title' => 'Chapter 3',
        'narrative' => '# Ch3',
        'chapter_number' => 2,
        'unlock_type' => StoryChapter::UNLOCK_LEVEL_REACHED,
        'unlock_value' => '50',
        'icon' => 'star',
    ]);

    // Unlock chapter 1 and mark as read
    UserStoryProgress::create([
        'user_id' => $user->id,
        'story_chapter_id' => $chapter1->id,
        'unlocked_at' => now()->subDay(),
        'read_at' => now(),
    ]);

    // Unlock chapter 2 but don't read
    UserStoryProgress::create([
        'user_id' => $user->id,
        'story_chapter_id' => $chapter2->id,
        'unlocked_at' => now(),
    ]);

    StoryService::clearCache();
    $summary = $this->service->getProgressSummary($user);

    expect($summary['total'])->toBe(3);
    expect($summary['unlocked'])->toBe(2);
    expect($summary['read'])->toBe(1);
    expect($summary['next_hint'])->toContain('Level 50');
    expect($summary['latest_chapter'])->not->toBeNull();
    expect($summary['latest_chapter']['slug'])->toBe('ch-2');
});

// ── Story page returns correct data ──

test('story page returns chapters with correct unlock status', function () {
    $user = User::factory()->create();
    Enrollment::factory()->for($user)->create();

    $chapter = StoryChapter::create([
        'slug' => 'the-recruitment',
        'title' => 'The Recruitment',
        'narrative' => '# Secret narrative content',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'mail',
    ]);

    $lockedChapter = StoryChapter::create([
        'slug' => 'locked-chapter',
        'title' => 'Locked Chapter',
        'narrative' => '# This should be hidden',
        'chapter_number' => 1,
        'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
        'unlock_value' => 'nonexistent-course',
        'icon' => 'lock',
    ]);

    // Unlock the first chapter
    UserStoryProgress::create([
        'user_id' => $user->id,
        'story_chapter_id' => $chapter->id,
        'unlocked_at' => now(),
    ]);

    StoryService::clearCache();

    $response = $this->actingAs($user)->get('/story');

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('story')
        ->has('chapters', 2)
        ->has('summary')
    );
});

// ── Locked chapters don't reveal narrative content ──

test('locked chapters do not reveal narrative content', function () {
    $user = User::factory()->create();

    StoryChapter::create([
        'slug' => 'locked-chapter',
        'title' => 'Locked Chapter',
        'narrative' => '# This is secret content that should not be visible',
        'chapter_number' => 5,
        'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
        'unlock_value' => 'nonexistent-course',
        'icon' => 'lock',
    ]);

    StoryService::clearCache();
    $chapters = $this->service->getChaptersForUser($user);

    $lockedChapter = $chapters->first();
    expect($lockedChapter['is_unlocked'])->toBeFalse();
    expect($lockedChapter['narrative'])->toBeNull();
    expect($lockedChapter['unlock_hint'])->not->toBeNull();
});

// ── Mark as read endpoint requires unlock ──

test('mark as read returns 403 for locked chapter', function () {
    $user = User::factory()->create();

    $chapter = StoryChapter::create([
        'slug' => 'locked-chapter',
        'title' => 'Locked Chapter',
        'narrative' => '# Secret',
        'chapter_number' => 5,
        'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
        'unlock_value' => 'nonexistent-course',
        'icon' => 'lock',
    ]);

    $response = $this->actingAs($user)->post("/story/{$chapter->id}/read");

    $response->assertForbidden();
});

test('mark as read works for unlocked chapter via endpoint', function () {
    $user = User::factory()->create();

    $chapter = StoryChapter::create([
        'slug' => 'unlocked-chapter',
        'title' => 'Unlocked Chapter',
        'narrative' => '# Content',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'mail',
    ]);

    UserStoryProgress::create([
        'user_id' => $user->id,
        'story_chapter_id' => $chapter->id,
        'unlocked_at' => now(),
    ]);

    $response = $this->actingAs($user)->post("/story/{$chapter->id}/read");

    $response->assertRedirect();

    $progress = UserStoryProgress::where('user_id', $user->id)
        ->where('story_chapter_id', $chapter->id)
        ->first();

    expect($progress->read_at)->not->toBeNull();
});

// ── Multiple chapters can unlock at once ──

test('multiple chapters can unlock simultaneously', function () {
    $user = User::factory()->create();
    Enrollment::factory()->for($user)->create();

    $badge = Badge::factory()->create([
        'slug' => 'speed-demon',
        'criteria_type' => 'speed_demon',
        'criteria_value' => 1,
    ]);
    $user->badges()->attach($badge->id, ['earned_at' => now()]);

    StoryChapter::create([
        'slug' => 'prologue',
        'title' => 'Prologue',
        'narrative' => '# Prologue',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'mail',
    ]);

    StoryChapter::create([
        'slug' => 'speed-files',
        'title' => 'Speed Files',
        'narrative' => '# Speed',
        'chapter_number' => 6,
        'unlock_type' => StoryChapter::UNLOCK_BADGE_EARNED,
        'unlock_value' => 'speed-demon',
        'icon' => 'zap',
    ]);

    $unlocked = $this->service->checkAndUnlock($user);

    expect($unlocked)->toHaveCount(2);
    expect(UserStoryProgress::where('user_id', $user->id)->count())->toBe(2);
});

// ── Story page requires authentication ──

test('story page requires authentication', function () {
    $response = $this->get('/story');
    $response->assertRedirect('/login');
});

// ── getChaptersForUser returns ordered chapters ──

test('chapters are returned ordered by chapter number', function () {
    $user = User::factory()->create();

    StoryChapter::create([
        'slug' => 'ch-5',
        'title' => 'Chapter 5',
        'narrative' => '# Ch5',
        'chapter_number' => 5,
        'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
        'unlock_value' => 'test',
        'icon' => 'lock',
    ]);

    StoryChapter::create([
        'slug' => 'ch-0',
        'title' => 'Chapter 0',
        'narrative' => '# Ch0',
        'chapter_number' => 0,
        'unlock_type' => StoryChapter::UNLOCK_FIRST_ENROLLMENT,
        'unlock_value' => '1',
        'icon' => 'mail',
    ]);

    StoryChapter::create([
        'slug' => 'ch-2',
        'title' => 'Chapter 2',
        'narrative' => '# Ch2',
        'chapter_number' => 2,
        'unlock_type' => StoryChapter::UNLOCK_COURSE_COMPLETE,
        'unlock_value' => 'test2',
        'icon' => 'key',
    ]);

    StoryService::clearCache();
    $chapters = $this->service->getChaptersForUser($user);

    $chapterNumbers = $chapters->pluck('chapter_number')->toArray();
    expect($chapterNumbers)->toBe([0, 2, 5]);
});
