<?php

use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
});

test('lab show page renders with collapsible sections', function () {
    $this->actingAs($this->user)
        ->get(route('labs.show', 'caesar-cipher-lab'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('labs/show')
            ->has('lab.slug')
            ->has('lab.title')
            ->has('lab.summary')
        );
});

test('lab index page renders', function () {
    $this->actingAs($this->user)
        ->get(route('labs.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('labs/index')
        );
});

test('all lab slugs render correctly', function () {
    $labs = ['caesar-cipher-lab', 'vigenere-cipher-lab', 'aes-lab', 'rsa-lab', 'sha-lab', 'digital-signature-lab'];

    foreach ($labs as $slug) {
        $this->actingAs($this->user)
            ->get(route('labs.show', $slug))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('labs/show')
                ->where('lab.slug', $slug)
            );
    }
});

test('lab show page returns 404 for unknown lab', function () {
    $this->actingAs($this->user)
        ->get(route('labs.show', 'nonexistent-lab'))
        ->assertNotFound();
});

test('lab show page requires authentication', function () {
    $this->get(route('labs.show', 'caesar-cipher-lab'))
        ->assertRedirect(route('login'));
});
