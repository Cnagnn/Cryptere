<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;

test('admin routes use the package permission middleware', function (): void {
    $middleware = Route::getRoutes()->getByName('admin.users.index')?->gatherMiddleware() ?? [];

    expect($middleware)
        ->toContain('permission:access admin')
        ->not->toContain('admin');
});

test('admin roles receive granular permissions while user roles do not', function (): void {
    $admin = User::factory()->admin()->create();
    $user = User::factory()->create();

    expect($admin->can('access admin'))->toBeTrue()
        ->and($admin->can('manage users'))->toBeTrue()
        ->and($admin->can('manage courses'))->toBeTrue()
        ->and($user->can('access admin'))->toBeFalse()
        ->and($user->can('manage courses'))->toBeFalse();
});

test('super admin is authorized for every gate ability', function (): void {
    $superAdmin = User::factory()->superAdmin()->create();

    expect($superAdmin->can('ability without explicit permission'))->toBeTrue();
});

test('existing users do not derive their displayed role from legacy columns', function (): void {
    $user = User::factory()->admin()->create();

    DB::table('model_has_roles')
        ->where('model_type', User::class)
        ->where('model_id', $user->id)
        ->delete();

    expect($user->refresh()->primaryRoleName())->toBe(User::ROLE_USER);
});

test('registration assigns the first user super admin and later users user roles', function (): void {
    $this->post('/register', [
        'name' => 'First User',
        'username' => 'first_user',
        'email' => 'first@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => 'on',
    ])->assertRedirect('/dashboard');

    auth()->logout();

    $this->post('/register', [
        'name' => 'Second User',
        'username' => 'second_user',
        'email' => 'second@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => 'on',
    ])->assertRedirect('/dashboard');

    $first = User::query()->where('email', 'first@example.com')->firstOrFail();
    $second = User::query()->where('email', 'second@example.com')->firstOrFail();

    expect($first->hasRole('Super Admin'))->toBeTrue()
        ->and($first->isAdmin())->toBeTrue()
        ->and($second->hasRole('User'))->toBeTrue()
        ->and($second->isAdmin())->toBeFalse();
});

test('canonical roles are created for the permission package', function (): void {
    expect(Role::query()->pluck('name')->all())->toEqualCanonicalizing([
        'Super Admin',
        'Admin',
        'User',
    ]);
});

test('role backfill promotes the first existing user to super admin', function (): void {
    $first = User::factory()->create(['role' => 'member', 'is_admin' => false]);
    $legacyAdmin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $legacyMember = User::factory()->create(['role' => 'member', 'is_admin' => false]);

    DB::table('model_has_roles')->delete();
    DB::table('roles')->delete();
    DB::table('users')->where('id', $first->id)->update(['role' => 'member', 'is_admin' => false]);
    DB::table('users')->where('id', $legacyAdmin->id)->update(['role' => 'admin', 'is_admin' => true]);
    DB::table('users')->where('id', $legacyMember->id)->update(['role' => 'member', 'is_admin' => false]);

    $migration = include database_path('migrations/2026_05_25_110801_seed_permission_roles_and_backfill_users.php');
    $migration->up();

    expect($first->refresh()->hasRole(User::ROLE_SUPER_ADMIN))->toBeTrue()
        ->and($first->primaryRoleName())->toBe(User::ROLE_SUPER_ADMIN)
        ->and($first->is_admin)->toBeTrue()
        ->and($legacyAdmin->refresh()->hasRole(User::ROLE_ADMIN))->toBeTrue()
        ->and($legacyAdmin->primaryRoleName())->toBe(User::ROLE_ADMIN)
        ->and($legacyAdmin->is_admin)->toBeTrue()
        ->and($legacyMember->refresh()->hasRole(User::ROLE_USER))->toBeTrue()
        ->and($legacyMember->primaryRoleName())->toBe(User::ROLE_USER)
        ->and($legacyMember->is_admin)->toBeFalse();
});
