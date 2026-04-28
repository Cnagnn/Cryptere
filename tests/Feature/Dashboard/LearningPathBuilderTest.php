<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Lesson;
use App\Models\User;
use App\Services\Dashboard\LearningPathBuilder;

beforeEach(function () {
    $this->service = new LearningPathBuilder;
});

// ─── build ───────────────────────────────────────────────────────────

it('returns empty nodes and categories when no published courses exist', function () {
    $user = User::factory()->create();

    $result = $this->service->build($user);

    expect($result)->toHaveKeys(['nodes', 'categories'])
        ->and($result['nodes'])->toBeEmpty()
        ->and($result['categories'])->toBeEmpty();
});

it('returns published courses as nodes', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create([
        'is_published' => true,
        'category' => 'Blockchain',
        'difficulty' => 'beginner',
        'path_position' => 1,
    ]);
    Lesson::factory()->count(3)->for($course)->create();

    // Unpublished course should not appear
    Course::factory()->create(['is_published' => false]);

    $result = $this->service->build($user);

    expect($result['nodes'])->toHaveCount(1);

    $node = $result['nodes'][0];
    expect($node)->toHaveKeys([
        'id', 'slug', 'title', 'summary', 'category', 'difficulty',
        'pathPosition', 'prerequisiteId', 'prerequisiteTitle',
        'lessonCount', 'estimatedMinutes', 'cover',
        'isEnrolled', 'progressPercentage', 'isCompleted', 'isLocked',
    ])
        ->and($node['id'])->toBe($course->id)
        ->and($node['lessonCount'])->toBe(3)
        ->and($node['isEnrolled'])->toBeFalse()
        ->and($node['isCompleted'])->toBeFalse()
        ->and($node['isLocked'])->toBeFalse()
        ->and($node['progressPercentage'])->toBe(0);
});

it('marks enrolled courses correctly', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true, 'path_position' => 1]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 45,
        'completed_at' => null,
    ]);

    $result = $this->service->build($user);

    $node = $result['nodes'][0];
    expect($node['isEnrolled'])->toBeTrue()
        ->and($node['progressPercentage'])->toBe(45)
        ->and($node['isCompleted'])->toBeFalse();
});

it('marks completed courses correctly', function () {
    $user = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true, 'path_position' => 1]);
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $course->id,
        'progress_percentage' => 100,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    $node = $result['nodes'][0];
    expect($node['isEnrolled'])->toBeTrue()
        ->and($node['isCompleted'])->toBeTrue();
});

it('locks courses when prerequisite is not completed', function () {
    $user = User::factory()->create();
    $prereq = Course::factory()->create(['is_published' => true, 'path_position' => 1]);
    $course = Course::factory()->create([
        'is_published' => true,
        'path_position' => 2,
        'prerequisite_course_id' => $prereq->id,
    ]);

    $result = $this->service->build($user);

    $nodes = collect($result['nodes']);
    $lockedNode = $nodes->firstWhere('id', $course->id);

    expect($lockedNode['isLocked'])->toBeTrue()
        ->and($lockedNode['prerequisiteId'])->toBe($prereq->id)
        ->and($lockedNode['prerequisiteTitle'])->toBe($prereq->title);
});

it('unlocks courses when prerequisite is completed', function () {
    $user = User::factory()->create();
    $prereq = Course::factory()->create(['is_published' => true, 'path_position' => 1]);
    $course = Course::factory()->create([
        'is_published' => true,
        'path_position' => 2,
        'prerequisite_course_id' => $prereq->id,
    ]);

    // Complete the prerequisite
    Enrollment::factory()->create([
        'user_id' => $user->id,
        'course_id' => $prereq->id,
        'completed_at' => now(),
    ]);

    $result = $this->service->build($user);

    $nodes = collect($result['nodes']);
    $unlockedNode = $nodes->firstWhere('id', $course->id);

    expect($unlockedNode['isLocked'])->toBeFalse();
});

it('returns unique categories from published courses', function () {
    $user = User::factory()->create();
    Course::factory()->create(['is_published' => true, 'category' => 'Blockchain', 'path_position' => 1]);
    Course::factory()->create(['is_published' => true, 'category' => 'Security', 'path_position' => 2]);
    Course::factory()->create(['is_published' => true, 'category' => 'Blockchain', 'path_position' => 3]);

    $result = $this->service->build($user);

    expect($result['categories'])->toHaveCount(2)
        ->and($result['categories']->toArray())->toContain('Blockchain', 'Security');
});

it('orders nodes by path_position then sort_order', function () {
    $user = User::factory()->create();
    $c1 = Course::factory()->create(['is_published' => true, 'path_position' => 2, 'sort_order' => 1]);
    $c2 = Course::factory()->create(['is_published' => true, 'path_position' => 1, 'sort_order' => 2]);
    $c3 = Course::factory()->create(['is_published' => true, 'path_position' => 1, 'sort_order' => 1]);

    $result = $this->service->build($user);

    $ids = collect($result['nodes'])->pluck('id')->toArray();
    expect($ids)->toBe([$c3->id, $c2->id, $c1->id]);
});

it('handles courses with no category gracefully', function () {
    $user = User::factory()->create();
    Course::factory()->create(['is_published' => true, 'category' => null, 'path_position' => 1]);

    $result = $this->service->build($user);

    expect($result['nodes'])->toHaveCount(1)
        ->and($result['categories'])->toBeEmpty(); // null categories are filtered out
});

it('does not show other users enrollment data', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $course = Course::factory()->create(['is_published' => true, 'path_position' => 1]);

    Enrollment::factory()->create([
        'user_id' => $otherUser->id,
        'course_id' => $course->id,
        'progress_percentage' => 80,
    ]);

    $result = $this->service->build($user);

    $node = $result['nodes'][0];
    expect($node['isEnrolled'])->toBeFalse()
        ->and($node['progressPercentage'])->toBe(0);
});
