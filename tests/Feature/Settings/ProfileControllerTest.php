<?php

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('guest cannot access profile settings', function () {
    $this->get(route('settings.profile.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user can view profile settings', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/profile')
            ->has('mustVerifyEmail')
            ->has('profileUser')
            ->has('badges')
            ->has('socialAccounts')
            ->has('hasPassword')
        );
});

test('user can update profile information', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => 'Updated Name',
            'username' => $user->username,
            'email' => 'newemail@example.com',
            'profile_visibility' => $user->profile_visibility ?? 'private',
        ])
        ->assertRedirect(route('settings.profile.edit'));

    $user->refresh();
    expect($user->name)->toBe('Updated Name')
        ->and($user->email)->toBe('newemail@example.com')
        ->and($user->email_verified_at)->toBeNull();
});

test('email verification resets when email changes', function () {
    $user = User::factory()->create(['email_verified_at' => now()]);

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => $user->name,
            'username' => $user->username,
            'email' => 'changed@example.com',
            'profile_visibility' => $user->profile_visibility ?? 'private',
        ]);

    expect($user->fresh()->email_verified_at)->toBeNull();
});

test('user can delete their account', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);

    $this->actingAs($user)
        ->delete(route('settings.profile.destroy'), [
            'password' => 'password',
        ])
        ->assertRedirect('/');

    $this->assertGuest();
    expect(User::find($user->id))->toBeNull();
});

test('profile update requires valid data', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => '',
            'username' => 'bad username!',
            'email' => 'not-an-email',
            'profile_visibility' => 'hidden',
        ])
        ->assertSessionHasErrors(['name', 'email', 'username', 'profile_visibility']);
});

test('profile settings exposes complete account settings contract', function (): void {
    $user = User::factory()->create([
        'name' => 'Ada Lovelace',
        'username' => 'ada.crypto',
        'bio' => 'Learning cryptography.',
        'pronoun' => 'she/her',
        'location' => 'London',
        'profile_visibility' => 'public',
    ]);

    $this->actingAs($user)
        ->get(route('settings.profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/profile')
            ->where('profileUser.name', 'Ada Lovelace')
            ->where('profileUser.username', 'ada.crypto')
            ->where('profileUser.bio', 'Learning cryptography.')
            ->where('profileUser.pronoun', 'she/her')
            ->where('profileUser.location', 'London')
            ->where('profileUser.profile_visibility', 'public')
            ->where('profileUrl', route('profile.show', 'ada.crypto'))
            ->has('badges')
            ->has('socialAccounts')
            ->has('hasPassword')
            ->has('canManageTwoFactor')
            ->has('twoFactorEnabled')
            ->has('requiresConfirmation')
        );
});

test('user can update profile username and public fields', function (): void {
    $user = User::factory()->create([
        'username' => 'old-name',
        'profile_visibility' => 'private',
    ]);

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => 'Updated Name',
            'username' => 'updated.name',
            'email' => $user->email,
            'bio' => 'Updated public bio',
            'pronoun' => 'they/them',
            'location' => 'Jakarta',
            'profile_visibility' => 'public',
        ])
        ->assertRedirect(route('settings.profile.edit'));

    $user->refresh();

    expect($user->name)->toBe('Updated Name')
        ->and($user->username)->toBe('updated.name')
        ->and($user->bio)->toBe('Updated public bio')
        ->and($user->pronoun)->toBe('they/them')
        ->and($user->location)->toBe('Jakarta')
        ->and($user->profile_visibility)->toBe('public');
});

test('profile username must be unique and match the public profile format', function (): void {
    User::factory()->create(['username' => 'existing.user']);
    $user = User::factory()->create(['username' => 'current.user']);

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => 'Current User',
            'username' => 'existing.user',
            'email' => $user->email,
            'profile_visibility' => 'public',
        ])
        ->assertSessionHasErrors('username');

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => 'Current User',
            'username' => 'bad username!',
            'email' => $user->email,
            'profile_visibility' => 'public',
        ])
        ->assertSessionHasErrors('username');
});

test('profile pronoun validation matches database length', function (): void {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('settings.profile.update'), [
            'name' => $user->name,
            'username' => $user->username,
            'email' => $user->email,
            'pronoun' => str_repeat('a', 31),
            'profile_visibility' => 'private',
        ])
        ->assertSessionHasErrors('pronoun');
});

test('private profile hides owner only fields from other users', function (): void {
    $owner = User::factory()->create([
        'username' => 'private.user',
        'email' => 'private@example.com',
        'bio' => 'Hidden bio',
        'profile_visibility' => 'private',
    ]);
    $viewer = User::factory()->create();

    $this->actingAs($viewer)
        ->get(route('profile.show', $owner->username))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('profile/show')
            ->where('isPrivate', true)
            ->where('profileUser.username', 'private.user')
            ->missing('profileUser.email')
            ->missing('profileUser.bio')
        );
});

test('user can upload an avatar from settings', function (): void {
    Storage::fake('public');
    $user = User::factory()->create();

    $this->actingAs($user)
        ->post(route('settings.avatar.update'), [
            '_method' => 'PATCH',
            'avatar' => UploadedFile::fake()->image('avatar.png', 256, 256),
        ])
        ->assertRedirect(route('settings.profile.edit'));

    $user->refresh();

    expect($user->avatar_path)->not->toBeNull()
        ->and($user->avatar_mime_type)->toBe('image/png');

    Storage::disk('public')->assertExists($user->avatar_path);
});

test('profile settings exposes pixabot avatar choices', function (): void {
    $user = User::factory()->create(['role' => 'member']);

    $this->actingAs($user)
        ->get(route('settings.profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->has('avatarOptions.ids')
            ->where('avatarOptions.baseUrl', asset('avatars/pixabots/png/480'))
            ->where('avatarOptions.extension', 'png')
            ->where('profileUser.avatar', fn (?string $avatar): bool => str_contains($avatar ?? '', '/avatars/pixabots/png/480/'))
        );
});

test('member can select a static png pixabot avatar from settings', function (): void {
    $user = User::factory()->create(['role' => 'member']);

    $this->actingAs($user)
        ->patch(route('settings.avatar.pixabot'), [
            'pixabot_avatar_id' => '4411',
        ])
        ->assertRedirect(route('settings.profile.edit'));

    $user->refresh();

    expect($user->pixabot_avatar_id)->toBe('4411')
        ->and($user->avatar)->toContain('/avatars/pixabots/png/480/4411.png');
});

test('admin pixabot avatar choices use webp', function (): void {
    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true, 'pixabot_avatar_id' => '4411']);

    $this->actingAs($admin)
        ->get(route('settings.profile.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('avatarOptions.baseUrl', asset('avatars/pixabots/webp/480'))
            ->where('avatarOptions.extension', 'webp')
            ->where('profileUser.avatar', fn (?string $avatar): bool => str_contains($avatar ?? '', '/avatars/pixabots/webp/480/4411.webp'))
        );
});

test('user can remove their avatar from settings', function (): void {
    Storage::fake('public');
    $user = User::factory()->create([
        'avatar_path' => 'avatars/1/avatar.png',
        'avatar_mime_type' => 'image/png',
    ]);
    Storage::disk('public')->put('avatars/1/avatar.png', 'avatar');

    $this->actingAs($user)
        ->delete(route('settings.avatar.destroy'))
        ->assertRedirect(route('settings.profile.edit'));

    $user->refresh();

    expect($user->avatar_path)->toBeNull()
        ->and($user->avatar_mime_type)->toBeNull();

    Storage::disk('public')->assertMissing('avatars/1/avatar.png');
});
