<?php

use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('course catalog returns searchable paginated learner contract', function (): void {
    $user = User::factory()->create();

    $published = Course::factory()->create([
        'title' => 'Applied Cryptography',
        'summary' => 'Modern ciphers and protocols.',
        'status' => 'published',
        'is_published' => true,
        'category' => 'cryptography',
        'difficulty' => 'intermediate',
        'estimated_minutes' => 90,
    ]);

    Course::factory()->create([
        'title' => 'Draft Cryptography',
        'status' => 'draft',
        'is_published' => false,
    ]);

    Enrollment::factory()->for($user)->for($published)->create([
        'progress_percentage' => 35,
        'completed_at' => null,
    ]);

    $this->actingAs($user)
        ->get(route('courses.index', ['search' => 'Applied', 'sort' => 'title']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('courses/index')
            ->where('filters.search', 'Applied')
            ->where('filters.sort', 'title')
            ->has('courses.data', 1)
            ->where('courses.data.0.id', $published->id)
            ->where('courses.data.0.slug', $published->slug)
            ->where('courses.data.0.title', 'Applied Cryptography')
            ->where('courses.data.0.category', 'cryptography')
            ->where('courses.data.0.difficulty', 'intermediate')
            ->where('courses.data.0.isEnrolled', true)
            ->where('courses.data.0.progressPercentage', 35)
            ->has('courses.meta')
        );
});
