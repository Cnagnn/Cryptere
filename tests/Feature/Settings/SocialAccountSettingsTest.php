<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;

test('social accounts page is displayed', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('social-accounts.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/social-accounts')
        ->has('socialAccounts')
        ->has('hasPassword')
    );
});

test('social accounts page shows connected accounts', function () {
    $user = User::factory()->create();
    $user->socialAccounts()->create([
        'provider' => 'google',
        'provider_user_id' => 'google-123',
        'provider_email' => 'user@gmail.com',
        'provider_name' => 'Test User',
        'provider_avatar' => null,
    ]);

    $response = $this
        ->actingAs($user)
        ->get(route('social-accounts.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('settings/social-accounts')
        ->has('socialAccounts', 1)
        ->where('socialAccounts.0.provider', 'google')
        ->where('socialAccounts.0.provider_email', 'user@gmail.com')
    );
});

test('user with password can disconnect a social account', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);
    $socialAccount = $user->socialAccounts()->create([
        'provider' => 'github',
        'provider_user_id' => 'gh-456',
        'provider_email' => 'user@github.com',
        'provider_name' => 'Test User',
        'provider_avatar' => null,
    ]);

    $response = $this
        ->actingAs($user)
        ->delete(route('social-accounts.destroy', $socialAccount));

    $response->assertRedirect(route('social-accounts.edit'));
    expect($user->socialAccounts()->count())->toBe(0);
});

test('user without password cannot disconnect last social account', function () {
    $user = User::factory()->create();
    DB::table('users')->where('id', $user->id)->update(['password' => '']);
    $user->refresh();
    $socialAccount = $user->socialAccounts()->create([
        'provider' => 'google',
        'provider_user_id' => 'google-789',
        'provider_email' => 'user@gmail.com',
        'provider_name' => 'Test User',
        'provider_avatar' => null,
    ]);

    $response = $this
        ->actingAs($user)
        ->delete(route('social-accounts.destroy', $socialAccount));

    $response->assertSessionHasErrors('social');
    expect($user->socialAccounts()->count())->toBe(1);
});

test('user without password can disconnect if other social accounts remain', function () {
    $user = User::factory()->create();
    DB::table('users')->where('id', $user->id)->update(['password' => '']);
    $user->refresh();
    $user->socialAccounts()->create([
        'provider' => 'google',
        'provider_user_id' => 'google-111',
        'provider_email' => 'user@gmail.com',
        'provider_name' => 'Test User',
        'provider_avatar' => null,
    ]);
    $githubAccount = $user->socialAccounts()->create([
        'provider' => 'github',
        'provider_user_id' => 'gh-222',
        'provider_email' => 'user@github.com',
        'provider_name' => 'Test User',
        'provider_avatar' => null,
    ]);

    $response = $this
        ->actingAs($user)
        ->delete(route('social-accounts.destroy', $githubAccount));

    $response->assertRedirect(route('social-accounts.edit'));
    expect($user->socialAccounts()->count())->toBe(1);
    expect($user->socialAccounts()->first()->provider)->toBe('google');
});

test('user cannot disconnect another users social account', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $socialAccount = $otherUser->socialAccounts()->create([
        'provider' => 'google',
        'provider_user_id' => 'google-other',
        'provider_email' => 'other@gmail.com',
        'provider_name' => 'Other User',
        'provider_avatar' => null,
    ]);

    $response = $this
        ->actingAs($user)
        ->delete(route('social-accounts.destroy', $socialAccount));

    $response->assertForbidden();
    expect($otherUser->socialAccounts()->count())->toBe(1);
});

test('hasPassword prop is true when user has a password', function () {
    $user = User::factory()->create(['password' => bcrypt('password')]);

    $response = $this
        ->actingAs($user)
        ->get(route('social-accounts.edit'));

    $response->assertInertia(fn ($page) => $page
        ->where('hasPassword', true)
    );
});

test('hasPassword prop is false when user has no password', function () {
    $user = User::factory()->create();
    DB::table('users')->where('id', $user->id)->update(['password' => '']);
    $user->refresh();

    $response = $this
        ->actingAs($user)
        ->get(route('social-accounts.edit'));

    $response->assertInertia(fn ($page) => $page
        ->where('hasPassword', false)
    );
});

test('social accounts page requires authentication', function () {
    $response = $this->get(route('social-accounts.edit'));

    $response->assertRedirect(route('login'));
});
