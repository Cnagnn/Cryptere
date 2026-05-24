<?php

use App\Models\User;

test('username availability returns false for invalid username', function (): void {
    $this->getJson('/api/users/check-username?username=bad name')
        ->assertOk()
        ->assertJson(['available' => false]);
});

test('username availability returns false for an existing username', function (): void {
    User::factory()->create(['username' => 'existing_user']);

    $this->getJson('/api/users/check-username?username=existing_user')
        ->assertOk()
        ->assertJson(['available' => false]);
});

test('username availability checks mixed case input as lowercase', function (): void {
    User::factory()->create(['username' => 'existing_user']);

    $this->getJson('/api/users/check-username?username=Existing_User')
        ->assertOk()
        ->assertJson(['available' => false]);
});

test('username availability returns true for an unused valid username', function (): void {
    $this->getJson('/api/users/check-username?username=new_user')
        ->assertOk()
        ->assertJson(['available' => true]);
});
