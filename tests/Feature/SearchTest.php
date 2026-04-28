<?php

use App\Models\Challenge;
use App\Models\Course;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create();
});

test('search requires at least 2 characters', function () {
    $this->actingAs($this->user)
        ->getJson(route('search', ['q' => 'a']))
        ->assertSuccessful()
        ->assertJsonPath('results', []);
});

test('search returns matching courses', function () {
    Course::factory()->create([
        'title' => 'Unique Quantum Cipher Basics',
        'summary' => 'Learn the fundamentals of quantum cipher',
        'is_published' => true,
    ]);

    Course::factory()->create([
        'title' => 'RSA Encryption',
        'summary' => 'Advanced RSA concepts',
        'is_published' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('search', ['q' => 'Quantum']))
        ->assertSuccessful();

    $results = $response->json('results');
    $courseResults = collect($results)->where('type', 'course');

    expect($courseResults)->toHaveCount(1)
        ->and($courseResults->first()['title'])->toBe('Unique Quantum Cipher Basics');
});

test('search returns matching challenges', function () {
    Challenge::factory()->create([
        'title' => 'Decrypt the Enigma',
        'prompt' => 'Can you break this enigma cipher?',
        'is_published' => true,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('search', ['q' => 'Enigma']))
        ->assertSuccessful();

    $results = $response->json('results');
    $challengeResults = collect($results)->where('type', 'challenge');

    expect($challengeResults)->toHaveCount(1)
        ->and($challengeResults->first()['title'])->toBe('Decrypt the Enigma');
});

test('search returns matching labs from config', function () {
    $response = $this->actingAs($this->user)
        ->getJson(route('search', ['q' => 'Caesar']))
        ->assertSuccessful();

    $results = $response->json('results');
    $labResults = collect($results)->where('type', 'lab');

    expect($labResults)->not->toBeEmpty()
        ->and($labResults->first()['title'])->toBe('Caesar Cipher');
});

test('search excludes unpublished courses', function () {
    Course::factory()->create([
        'title' => 'Draft Course',
        'summary' => 'Not published yet',
        'is_published' => false,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson(route('search', ['q' => 'Draft']))
        ->assertSuccessful();

    $results = $response->json('results');

    expect($results)->toBeEmpty();
});

test('search requires authentication', function () {
    $this->getJson(route('search', ['q' => 'test']))
        ->assertUnauthorized();
});

test('search returns empty for no matches', function () {
    $response = $this->actingAs($this->user)
        ->getJson(route('search', ['q' => 'xyznonexistent']))
        ->assertSuccessful();

    expect($response->json('results'))->toBeEmpty();
});
