<?php

use App\Models\LabVisit;
use App\Models\User;

test('lab visit is tracked for authenticated user', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('labs.show', 'caesar-cipher-lab'))
        ->assertOk();

    expect(LabVisit::query()->whereBelongsTo($user)->count())->toBe(1);

    $visit = LabVisit::query()->whereBelongsTo($user)->first();
    expect($visit)
        ->lab_slug->toBe('caesar-cipher-lab')
        ->visit_count->toBe(1);
});

test('repeat lab visit increments visit count', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('labs.show', 'caesar-cipher-lab'));

    $this->actingAs($user)
        ->get(route('labs.show', 'caesar-cipher-lab'));

    $visit = LabVisit::query()->whereBelongsTo($user)->first();
    expect($visit->visit_count)->toBe(2);
});

test('lab visit is not tracked for guest', function () {
    $this->get(route('labs.show', 'caesar-cipher-lab'));

    expect(LabVisit::query()->count())->toBe(0);
});

test('visiting different labs creates separate records', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('labs.show', 'caesar-cipher-lab'));

    $this->actingAs($user)
        ->get(route('labs.show', 'aes-lab'));

    expect(LabVisit::query()->whereBelongsTo($user)->count())->toBe(2);
});

test('invalid lab slug returns 404', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('labs.show', 'nonexistent-lab'))
        ->assertNotFound();
});
