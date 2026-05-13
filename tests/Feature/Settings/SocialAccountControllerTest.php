<?php

use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Support\Facades\DB;

test('guest cannot access social accounts settings', function () {
    $this->get(route('settings.social-accounts.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user can view social accounts', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.social-accounts.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/social-accounts')
            ->has('socialAccounts')
            ->has('hasPassword')
        );
});

test('user can disconnect social account when they have password', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);
    $social = SocialAccount::factory()->create(['user_id' => $user->id, 'provider' => 'github']);

    $this->actingAs($user)
        ->delete(route('settings.social-accounts.destroy', $social))
        ->assertRedirect(route('settings.social-accounts.edit'));

    expect(SocialAccount::find($social->id))->toBeNull();
});

test('user with password can disconnect even last social account', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);
    $social = SocialAccount::factory()->create(['user_id' => $user->id, 'provider' => 'google']);

    $this->actingAs($user)
        ->delete(route('settings.social-accounts.destroy', $social))
        ->assertRedirect();

    expect(SocialAccount::find($social->id))->toBeNull();
});

test('user cannot disconnect another users social account', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $social = SocialAccount::factory()->create(['user_id' => $otherUser->id]);

    $this->actingAs($user)
        ->delete(route('settings.social-accounts.destroy', $social))
        ->assertForbidden();
});

test('user without password cannot disconnect last social account', function (): void {
    $user = User::factory()->create();
    DB::table('users')->where('id', $user->id)->update(['password' => '']);
    $social = SocialAccount::factory()->create(['user_id' => $user->id, 'provider' => 'google']);

    $this->actingAs($user)
        ->delete(route('settings.social-accounts.destroy', $social))
        ->assertSessionHasErrors('social');

    expect(SocialAccount::find($social->id))->not->toBeNull();
});
