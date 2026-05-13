# Profile And Settings Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish and harden public profiles and private account settings so users can reliably edit profile data, manage avatar/privacy/security/social accounts/appearance, and understand account state.

**Architecture:** Keep two clear surfaces: `/profile/{username}` is the public learner profile, while `/settings/*` is the authenticated account control center. Laravel controllers and FormRequests own validation and persistence; Inertia React pages use Wayfinder route helpers and focused shared components. Fortify remains responsible for authentication primitives such as password confirmation and two-factor routes, but this plan does not change login, registration, forgot password, or reset password screens.

**Tech Stack:** Laravel 13, Fortify 1, Inertia Laravel/React 3, Wayfinder, React 19, Tailwind CSS 4, Pest 4, Playwright.

---

## Existing Plan Boundary

This plan must not collide with existing plans:

- `2026-05-13-auth-hardening.md` owns login, registration, forgot password, reset password, username availability, and auth message localization.
- `2026-05-13-management-plan-1.md` owns admin user management and admin edits to users.
- `2026-05-13-learner-course-experience-plan-1.md` owns course catalog/detail/lesson/task/quiz/assessment learner flows.
- `2026-05-13-crypto-labs-simulation-plan-1.md` owns labs.

Allowed auth-related scope here:

- Account settings password update.
- Account settings two-factor setup/disable/recovery-code UI using existing Fortify routes.
- Account deletion from `/settings/profile`.
- Email verification status display after profile email changes.

Do not edit:

- `resources/js/pages/auth/login.tsx`
- `resources/js/pages/auth/register.tsx`
- `resources/js/pages/auth/forgot-password.tsx`
- `resources/js/pages/auth/reset-password.tsx`
- admin user management pages/controllers.

## Current Findings

- `routes/settings.php` exposes `GET/PATCH/DELETE /settings/profile`, `GET /settings/security`, and social account routes.
- `app/Http/Controllers/Settings/ProfileController@update` can save profile data, but `resources/js/pages/settings/profile.tsx` does not render an edit form.
- `settings/profile.tsx` has an "Edit Profil" link to `#edit-profile`, but no element with that edit form exists.
- `ProfileValidationRules` omits `username`, even though registration requires it and public profiles route by username.
- `ProfileValidationRules` allows `pronoun` up to 50 characters, while the migration created `pronoun` as 30 characters.
- Avatar data exists on `users` (`avatar_path`, legacy `avatar_image`, `avatar_mime_type`), but there is no user-facing avatar upload/delete setting.
- `settings/profile.tsx`, `settings/security.tsx`, and `settings/social-accounts.tsx` duplicate social and two-factor UI code.
- `settings/security.tsx` and the inline security section contain unfinished two-factor setup modal and recovery code comments.
- `config/fortify.php` enables two-factor authentication with confirmation and password confirmation, and generated Wayfinder routes exist for enable, confirm, disable, QR code, secret key, recovery codes, and regeneration.
- The settings security page has no password change flow. Existing `tests/Feature/Settings/SecurityControllerTest.php` asserts `/settings/password` is not found.
- `settings/appearance.tsx` exists, but `routes/settings.php` does not expose `/settings/appearance`, so the page is not reachable by route.
- Settings navigation is not centralized in `SettingsLayout`.
- Public `profile/show.tsx` and settings profile duplicate badge grid rendering.
- Existing feature tests cover only basic settings page access, profile update endpoint, account delete, social disconnect ownership, and security page access. There is no browser smoke coverage for profile/settings.

## Approach Options

**Recommended: Focused settings system.** Keep the existing route shape, add missing backend endpoints for avatar and password, extract shared profile/settings components, complete 2FA UI, and add tests. This fixes the broken user workflows without a broad redesign.

**Minimal patch.** Add only a profile edit form to `settings/profile.tsx`. Faster, but leaves password, avatar, unfinished 2FA UI, duplicated components, and fragmented navigation unresolved.

**Full account center redesign.** Rebuild settings as a large dashboard with activity logs, session management, notification preferences, and audit history. More complete, but too broad for this plan and overlaps with future account-security work.

Use the recommended approach.

## Target Workflows

### Public Profile

1. User opens `/profile/{username}`.
2. If the profile is private and the visitor is not the owner, only minimal identity data is shown.
3. If visible, the page shows avatar, name, username, joined date, bio, pronoun, location, visibility badge for owner, share action, and badges.
4. Owner can navigate to `/settings/profile` with Wayfinder.

### Profile Settings

1. User opens `/settings/profile`.
2. User sees public profile preview and an editable form.
3. User can update name, username, email, bio, pronoun, location, and visibility.
4. If email changes, verification resets and the UI shows a verification notice.
5. User can upload or remove an avatar.
6. User can delete their account only after current password confirmation.

### Security Settings

1. User opens `/settings/security`.
2. User can update password after entering current password, new password, and confirmation.
3. User can enable 2FA, scan QR code, enter confirmation code, and view recovery codes.
4. User can regenerate recovery codes.
5. User can disable 2FA.

### Social And Appearance Settings

1. User can connect/disconnect Google or GitHub from `/settings/social-accounts`.
2. User cannot disconnect the last social account if they have no usable password.
3. User can switch light/dark/system appearance from `/settings/appearance`.
4. Settings pages share one navigation shell.

---

## File Structure

### Create

- `app/Http/Controllers/Settings/AvatarController.php` - upload and remove the authenticated user's avatar.
- `app/Http/Controllers/Settings/AppearanceController.php` - render the appearance settings page.
- `app/Http/Controllers/Settings/PasswordController.php` - update the authenticated user's password from settings.
- `app/Http/Requests/Settings/AvatarUpdateRequest.php` - validate avatar upload.
- `app/Http/Requests/Settings/PasswordUpdateRequest.php` - validate current password and new password.
- `app/Services/UserAvatarService.php` - store/delete user-uploaded avatars in the public disk.
- `resources/js/types/profile.ts` - shared profile, badge, social-account, and settings prop types.
- `resources/js/features/profile/profile-badges.tsx` - shared badge filtering/sorting/grid.
- `resources/js/features/profile/profile-overview-card.tsx` - shared public/settings profile overview card.
- `resources/js/features/settings/settings-navigation.tsx` - route-aware settings navigation.
- `resources/js/features/settings/profile-settings-form.tsx` - editable profile form.
- `resources/js/features/settings/avatar-settings-card.tsx` - avatar upload/remove UI.
- `resources/js/features/settings/password-settings-card.tsx` - password update UI.
- `resources/js/features/settings/two-factor-settings-card.tsx` - complete 2FA UI.
- `resources/js/features/settings/two-factor-setup-dialog.tsx` - QR/manual key/code confirmation dialog.
- `resources/js/features/settings/two-factor-recovery-codes.tsx` - show/copy/regenerate recovery codes.
- `resources/js/features/settings/social-accounts-card.tsx` - shared social account connect/disconnect UI.
- `resources/js/features/settings/account-delete-card.tsx` - account deletion form.
- `tests/e2e/profile-settings.spec.ts` - browser smoke coverage for public profile and settings pages.
- `tests/Feature/Settings/AppearanceControllerTest.php` - appearance settings route coverage.

### Modify

- `routes/settings.php` - add avatar, password, and appearance settings routes.
- `app/Concerns/ProfileValidationRules.php` - add username rules, align pronoun length with schema, require visibility.
- `app/Http/Requests/Settings/ProfileUpdateRequest.php` - add explicit authorization.
- `app/Http/Requests/Settings/ProfileDeleteRequest.php` - add explicit authorization.
- `app/Http/Controllers/Settings/ProfileController.php` - expose complete settings props and profile URL.
- `app/Http/Controllers/Settings/SecurityController.php` - expose password and 2FA settings props.
- `app/Http/Controllers/Settings/SocialAccountController.php` - keep social ownership and last-account guards aligned with the shared UI.
- `resources/js/hooks/use-two-factor-auth.ts` - support enable, confirm, disable, fetch, and regenerate flows.
- `resources/js/layouts/settings/layout.tsx` - add settings navigation shell.
- `resources/js/pages/settings/profile.tsx` - reduce to page orchestration using settings/profile components.
- `resources/js/pages/settings/security.tsx` - render password and 2FA components.
- `resources/js/pages/settings/social-accounts.tsx` - render shared social accounts component.
- `resources/js/pages/settings/appearance.tsx` - keep appearance control inside the shared settings shell.
- `resources/js/pages/profile/show.tsx` - use shared profile overview and badges components.
- `resources/js/components/app-sidebar.tsx` - keep profile/settings links on Wayfinder routes.
- `tests/Feature/Settings/ProfileControllerTest.php` - add profile contract, username, visibility, private profile, and avatar tests.
- `tests/Feature/Settings\SecurityControllerTest.php` - replace "password route removed" with password update and 2FA props coverage.
- `tests/Feature/Settings/SocialAccountControllerTest.php` - add last-social-without-password error assertion.
- `resources/js/routes/**` and `resources/js/actions/**` - regenerate Wayfinder output after route changes.

---

## Task 1: Lock Profile And Settings Backend Contracts

**Files:**
- Modify: `tests/Feature/Settings/ProfileControllerTest.php`

- [ ] **Step 1: Add profile settings contract assertions**

Append these tests:

```php
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
```

- [ ] **Step 2: Add validation and privacy tests**

Append:

```php
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
```

- [ ] **Step 3: Align existing profile update tests with the stricter contract**

In the existing `user can update profile information` payload, include the current username and visibility:

```php
'username' => $user->username,
'profile_visibility' => $user->profile_visibility ?? 'private',
```

In the existing `email verification resets when email changes` payload, include:

```php
'username' => $user->username,
'profile_visibility' => $user->profile_visibility ?? 'private',
```

In the existing `profile update requires valid data` payload, include invalid username and visibility assertions:

```php
'username' => 'bad username!',
'profile_visibility' => 'hidden',
```

Change the assertion to:

```php
->assertSessionHasErrors(['name', 'email', 'username', 'profile_visibility']);
```

- [ ] **Step 4: Run tests to verify they fail**

Run:

```bash
php artisan test --compact tests/Feature/Settings/ProfileControllerTest.php --filter=profile
```

Expected before implementation:

```text
FAILED ... profile settings exposes complete account settings contract
FAILED ... user can update profile username and public fields
FAILED ... profile username must be unique and match the public profile format
```

## Task 2: Complete Profile Validation And Controller Props

**Files:**
- Modify: `app/Concerns/ProfileValidationRules.php`
- Modify: `app/Http/Requests/Settings/ProfileUpdateRequest.php`
- Modify: `app/Http/Requests/Settings/ProfileDeleteRequest.php`
- Modify: `app/Http/Controllers/Settings/ProfileController.php`

- [ ] **Step 1: Update profile validation rules**

Replace `profileRules()` with:

```php
protected function profileRules(?int $userId = null): array
{
    return [
        'name' => $this->nameRules(),
        'username' => $this->usernameRules($userId),
        'email' => $this->emailRules($userId),
        'bio' => ['nullable', 'string', 'max:500'],
        'pronoun' => ['nullable', 'string', 'max:30'],
        'location' => ['nullable', 'string', 'max:255'],
        'profile_visibility' => ['required', 'string', Rule::in(['public', 'private'])],
    ];
}
```

Add:

```php
protected function usernameRules(?int $userId = null): array
{
    return [
        'required',
        'string',
        'min:4',
        'max:255',
        'regex:/^[a-zA-Z0-9._]+$/',
        $userId === null
            ? Rule::unique(User::class, 'username')
            : Rule::unique(User::class, 'username')->ignore($userId),
    ];
}
```

- [ ] **Step 2: Add explicit request authorization**

Add this method to both settings FormRequests:

```php
public function authorize(): bool
{
    return $this->user() !== null;
}
```

- [ ] **Step 3: Expose profile URL and complete props**

In `Settings\ProfileController@edit`, add a `profileUrl` prop:

```php
'profileUrl' => route('profile.show', $user->username),
```

Keep existing props for `mustVerifyEmail`, `status`, `profileUser`, `badges`, `socialAccounts`, `hasPassword`, `canManageTwoFactor`, `twoFactorEnabled`, and `requiresConfirmation`.

- [ ] **Step 4: Verify backend profile tests pass**

Run:

```bash
php artisan test --compact tests/Feature/Settings/ProfileControllerTest.php --filter=profile
```

Expected:

```text
PASS Tests\Feature\Settings\ProfileControllerTest
```

## Task 3: Add Avatar Upload And Removal

**Files:**
- Create: `app/Services/UserAvatarService.php`
- Create: `app/Http/Requests/Settings/AvatarUpdateRequest.php`
- Create: `app/Http/Controllers/Settings/AvatarController.php`
- Modify: `routes/settings.php`
- Modify: `tests/Feature/Settings/ProfileControllerTest.php`

- [ ] **Step 1: Write avatar tests**

Append:

```php
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

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
```

- [ ] **Step 2: Add avatar request**

Create `AvatarUpdateRequest`:

```php
<?php

namespace App\Http\Requests\Settings;

use Illuminate\Foundation\Http\FormRequest;

class AvatarUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }
}
```

- [ ] **Step 3: Add avatar service**

Create `UserAvatarService`:

```php
<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class UserAvatarService
{
    public function store(User $user, UploadedFile $avatar): void
    {
        $this->delete($user);

        $extension = $avatar->extension() ?: 'png';
        $path = $avatar->storeAs("avatars/{$user->id}", "avatar.{$extension}", 'public');

        $user->forceFill([
            'avatar_path' => $path,
            'avatar_mime_type' => $avatar->getMimeType(),
            'avatar_image' => null,
        ])->save();
    }

    public function delete(User $user): void
    {
        if (is_string($user->avatar_path) && $user->avatar_path !== '') {
            Storage::disk('public')->delete($user->avatar_path);
        }

        $user->forceFill([
            'avatar_path' => null,
            'avatar_mime_type' => null,
            'avatar_image' => null,
        ])->save();
    }
}
```

- [ ] **Step 4: Add avatar controller and routes**

Create `AvatarController`:

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\AvatarUpdateRequest;
use App\Services\UserAvatarService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AvatarController extends Controller
{
    public function update(AvatarUpdateRequest $request, UserAvatarService $avatars): RedirectResponse
    {
        $avatars->store($request->user(), $request->file('avatar'));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Avatar updated.')]);

        return to_route('settings.profile.edit');
    }

    public function destroy(Request $request, UserAvatarService $avatars): RedirectResponse
    {
        $avatars->delete($request->user());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Avatar removed.')]);

        return to_route('settings.profile.edit');
    }
}
```

In `routes/settings.php`, add inside the settings group:

```php
Route::controller(AvatarController::class)->prefix('avatar')->name('avatar.')->group(function () {
    Route::patch('/', 'update')->name('update');
    Route::delete('/', 'destroy')->name('destroy');
});
```

Also import the controller:

```php
use App\Http\Controllers\Settings\AvatarController;
```

- [ ] **Step 5: Verify avatar tests**

Run:

```bash
php artisan test --compact tests/Feature/Settings/ProfileControllerTest.php --filter=avatar
vendor/bin/pint --dirty --format agent
npm run types
```

Expected:

```text
PASS Tests\Feature\Settings\ProfileControllerTest
```

## Task 4: Add Password Update In Security Settings

**Files:**
- Create: `app/Http/Requests/Settings/PasswordUpdateRequest.php`
- Create: `app/Http/Controllers/Settings/PasswordController.php`
- Modify: `routes/settings.php`
- Modify: `tests/Feature/Settings/SecurityControllerTest.php`

- [ ] **Step 1: Replace the removed-route test**

Replace `password update route is removed` with:

```php
test('user can update password from security settings', function (): void {
    $user = User::factory()->create(['password' => bcrypt('OldPassword123!')]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'OldPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertRedirect(route('settings.security.edit'));

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeTrue();
});

test('password update requires current password', function (): void {
    $user = User::factory()->create(['password' => bcrypt('OldPassword123!')]);

    $this->actingAs($user)
        ->put(route('settings.password.update'), [
            'current_password' => 'WrongPassword123!',
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
        ->assertSessionHasErrors('current_password');
});
```

Add the import:

```php
use Illuminate\Support\Facades\Hash;
```

- [ ] **Step 2: Add password request**

Create:

```php
<?php

namespace App\Http\Requests\Settings;

use App\Concerns\PasswordValidationRules;
use Illuminate\Foundation\Http\FormRequest;

class PasswordUpdateRequest extends FormRequest
{
    use PasswordValidationRules;

    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => $this->currentPasswordRules(),
            'password' => $this->passwordRules(),
        ];
    }
}
```

- [ ] **Step 3: Add password controller and route**

Create:

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PasswordUpdateRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;

class PasswordController extends Controller
{
    public function update(PasswordUpdateRequest $request): RedirectResponse
    {
        $request->user()->forceFill([
            'password' => Hash::make($request->validated('password')),
        ])->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Password updated.')]);

        return to_route('settings.security.edit');
    }
}
```

Add route:

```php
Route::put('password', [PasswordController::class, 'update'])->name('password.update');
```

Import:

```php
use App\Http\Controllers\Settings\PasswordController;
```

- [ ] **Step 4: Verify security backend tests**

Run:

```bash
php artisan test --compact tests/Feature/Settings/SecurityControllerTest.php
vendor/bin/pint --dirty --format agent
npm run types
```

Expected:

```text
PASS Tests\Feature\Settings\SecurityControllerTest
```

## Task 5: Extract Shared Profile Types And Badge Components

**Files:**
- Create: `resources/js/types/profile.ts`
- Create: `resources/js/features/profile/profile-badges.tsx`
- Create: `resources/js/features/profile/profile-overview-card.tsx`
- Modify: `resources/js/pages/profile/show.tsx`
- Modify: `resources/js/pages/settings/profile.tsx`

- [ ] **Step 1: Add shared types**

Create:

```ts
export type ProfileBadge = {
    id: number;
    slug: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    tier: string;
    earned_at: string;
};

export type ProfileUser = {
    id?: number;
    name: string;
    username: string | null;
    email?: string | null;
    avatar?: string | null;
    bio?: string | null;
    pronoun?: string | null;
    location?: string | null;
    profile_visibility?: 'public' | 'private';
    xp?: number;
    points?: number;
    current_streak?: number;
    longest_streak?: number;
    created_at?: string;
};

export type SocialAccount = {
    id: number;
    provider: string;
    provider_email: string | null;
    provider_name: string | null;
    created_at: string;
};
```

- [ ] **Step 2: Move duplicated badge grid into `ProfileBadges`**

Create `profile-badges.tsx` by moving the existing `ProfileBadges`, `BadgeItem`, tier maps, category maps, and sort maps from `resources/js/pages/profile/show.tsx`. Export:

```ts
export function ProfileBadges({ badges }: { badges: ProfileBadge[] }) {
    // Move current implementation here unchanged except imports.
}
```

- [ ] **Step 3: Move shared overview card**

Create `profile-overview-card.tsx` with props:

```ts
type ProfileOverviewCardProps = {
    profileUser: ProfileUser;
    isOwner?: boolean;
    editHref?: string;
    profileUrl?: string;
};
```

Move the current overview card behavior from `profile/show.tsx`. Use `editHref` for the owner edit button and `profileUrl ?? window.location.href` for share/copy.

- [ ] **Step 4: Refactor public profile page**

In `profile/show.tsx`, remove duplicated local types and badge/overview component definitions. Import:

```ts
import { ProfileBadges } from '@/features/profile/profile-badges';
import { ProfileOverviewCard } from '@/features/profile/profile-overview-card';
import type { ProfileBadge, ProfileUser } from '@/types/profile';
import { edit as settingsProfileEdit } from '@/routes/settings/profile';
```

Pass:

```tsx
<ProfileOverviewCard
    profileUser={profileUser}
    isOwner={isOwner}
    editHref={settingsProfileEdit.url()}
/>
```

- [ ] **Step 5: Run TypeScript check**

Run:

```bash
npm run types:check
```

Expected:

```text
No TypeScript errors
```

## Task 6: Add Appearance Route And Settings Navigation Shell

**Files:**
- Create: `app/Http/Controllers/Settings/AppearanceController.php`
- Create: `tests/Feature/Settings/AppearanceControllerTest.php`
- Create: `resources/js/features/settings/settings-navigation.tsx`
- Modify: `routes/settings.php`
- Modify: `resources/js/layouts/settings/layout.tsx`

- [ ] **Step 1: Add appearance route test**

Create:

```php
<?php

test('guest cannot access appearance settings', function (): void {
    $this->get(route('settings.appearance.edit'))
        ->assertRedirect(route('login'));
});

test('authenticated user can view appearance settings', function (): void {
    $user = \App\Models\User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.appearance.edit'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('settings/appearance')
        );
});
```

- [ ] **Step 2: Add appearance controller and route**

Create:

```php
<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class AppearanceController extends Controller
{
    public function __invoke(): Response
    {
        return Inertia::render('settings/appearance');
    }
}
```

Add this route inside the authenticated settings group:

```php
Route::get('appearance', AppearanceController::class)->name('appearance.edit');
```

Import:

```php
use App\Http\Controllers\Settings\AppearanceController;
```

- [ ] **Step 3: Regenerate Wayfinder**

Run:

```bash
npm run types
```

Expected:

```text
Wayfinder routes generated
```

- [ ] **Step 4: Create settings navigation**

Create:

```tsx
import { Link, usePage } from '@inertiajs/react';
import { Palette, ShieldCheck, User, WalletCards } from 'lucide-react';

import { cn } from '@/lib/utils';
import { edit as settingsAppearanceEdit } from '@/routes/settings/appearance';
import { edit as settingsProfileEdit } from '@/routes/settings/profile';
import { edit as settingsSecurityEdit } from '@/routes/settings/security';
import { edit as settingsSocialAccountsEdit } from '@/routes/settings/social-accounts';

const items = [
    { label: 'Profile', href: settingsProfileEdit.url(), icon: User },
    { label: 'Security', href: settingsSecurityEdit.url(), icon: ShieldCheck },
    { label: 'Connected Accounts', href: settingsSocialAccountsEdit.url(), icon: WalletCards },
    { label: 'Appearance', href: settingsAppearanceEdit.url(), icon: Palette },
];

export function SettingsNavigation() {
    const { url } = usePage();

    return (
        <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Settings">
            {items.map((item) => {
                const active = url.startsWith(item.href);
                const Icon = item.icon;

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                            'inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3 text-sm transition-colors',
                            active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <Icon className="size-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}
```

- [ ] **Step 5: Render navigation in layout**

Modify `SettingsLayout`:

```tsx
import { SettingsNavigation } from '@/features/settings/settings-navigation';
import type { PropsWithChildren } from 'react';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <SettingsNavigation />
            {children}
        </div>
    );
}
```

- [ ] **Step 6: Verify appearance route and TypeScript**

Run:

```bash
php artisan test --compact tests/Feature/Settings/AppearanceControllerTest.php
npm run types:check
```

Expected:

```text
PASS Tests\Feature\Settings\AppearanceControllerTest
No TypeScript errors
```

## Task 7: Build Profile Settings UI

**Files:**
- Create: `resources/js/features/settings/profile-settings-form.tsx`
- Create: `resources/js/features/settings/avatar-settings-card.tsx`
- Create: `resources/js/features/settings/account-delete-card.tsx`
- Modify: `resources/js/pages/settings/profile.tsx`

- [ ] **Step 1: Create profile form**

Create `ProfileSettingsForm` using Inertia `<Form>` and Wayfinder:

```tsx
import { Form } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { update } from '@/actions/App/Http/Controllers/Settings/ProfileController';
import type { ProfileUser } from '@/types/profile';

export function ProfileSettingsForm({ profileUser }: { profileUser: ProfileUser }) {
    return (
        <Card id="edit-profile">
            <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update the public information shown on your profile.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...update.form()} setDefaultsOnSuccess className="grid gap-4">
                    {({ errors, processing, recentlySuccessful }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Display name</Label>
                                <Input id="name" name="name" defaultValue={profileUser.name} autoComplete="name" />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="username">Username</Label>
                                <Input id="username" name="username" defaultValue={profileUser.username ?? ''} autoComplete="username" />
                                {errors.username && <p className="text-sm text-destructive">{errors.username}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" name="email" type="email" defaultValue={profileUser.email ?? ''} autoComplete="email" />
                                {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="bio">Bio</Label>
                                <Textarea id="bio" name="bio" defaultValue={profileUser.bio ?? ''} maxLength={500} />
                                {errors.bio && <p className="text-sm text-destructive">{errors.bio}</p>}
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="pronoun">Pronoun</Label>
                                    <Input id="pronoun" name="pronoun" defaultValue={profileUser.pronoun ?? ''} maxLength={30} />
                                    {errors.pronoun && <p className="text-sm text-destructive">{errors.pronoun}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" name="location" defaultValue={profileUser.location ?? ''} />
                                    {errors.location && <p className="text-sm text-destructive">{errors.location}</p>}
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label>Profile visibility</Label>
                                <Select name="profile_visibility" defaultValue={profileUser.profile_visibility ?? 'private'}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="private">Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.profile_visibility && <p className="text-sm text-destructive">{errors.profile_visibility}</p>}
                            </div>
                            <div className="flex items-center justify-end gap-3">
                                {recentlySuccessful && <p className="text-sm text-muted-foreground">Saved.</p>}
                                <Button type="submit" disabled={processing}>Save profile</Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}
```

- [ ] **Step 2: Create avatar and deletion cards**

Create `AvatarSettingsCard` with a multipart `<Form>` using the generated avatar route after `npm run types`. Create `AccountDeleteCard` using `destroy.form()` from `Settings\ProfileController` and a password field.

- [ ] **Step 3: Rewrite settings profile page as orchestration**

`settings/profile.tsx` should keep only prop typing and layout:

```tsx
export default function SettingsProfile(props: Props) {
    return (
        <>
            <Head title="Pengaturan Profil" />
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="flex flex-col gap-6">
                    <ProfileOverviewCard
                        profileUser={props.profileUser}
                        isOwner
                        profileUrl={props.profileUrl}
                    />
                    <AvatarSettingsCard profileUser={props.profileUser} />
                </div>
                <div className="flex flex-col gap-6">
                    <ProfileSettingsForm profileUser={props.profileUser} />
                    <AccountDeleteCard />
                </div>
            </div>
        </>
    );
}
```

- [ ] **Step 4: Verify frontend**

Run:

```bash
npm run types:check
npm run lint:check
```

Expected:

```text
No TypeScript or ESLint errors
```

## Task 8: Complete Security Settings UI

**Files:**
- Create: `resources/js/features/settings/password-settings-card.tsx`
- Create: `resources/js/features/settings/two-factor-settings-card.tsx`
- Create: `resources/js/features/settings/two-factor-setup-dialog.tsx`
- Create: `resources/js/features/settings/two-factor-recovery-codes.tsx`
- Modify: `resources/js/hooks/use-two-factor-auth.ts`
- Modify: `resources/js/pages/settings/security.tsx`

- [ ] **Step 1: Build password card**

Use Wayfinder for `settings.password.update` after route generation. The form must include `current_password`, `password`, and `password_confirmation`, and reset all password fields on success.

- [ ] **Step 2: Complete two-factor hook**

Update `use-two-factor-auth.ts` to expose:

```ts
enableTwoFactor: () => Promise<void>;
confirmTwoFactor: (code: string) => Promise<void>;
disableTwoFactor: () => Promise<void>;
regenerateRecoveryCodes: () => Promise<void>;
```

Use generated route helpers:

```ts
import {
    confirm,
    disable,
    enable,
    qrCode,
    recoveryCodes,
    regenerateRecoveryCodes,
    secretKey,
} from '@/routes/two-factor';
```

- [ ] **Step 3: Build setup dialog**

The dialog flow:

1. Enable 2FA.
2. Fetch QR code and manual key.
3. Ask for one-time code when Fortify confirmation is required.
4. Confirm code through `two-factor.confirm`.
5. Fetch recovery codes.
6. Show recovery codes with copy action.

- [ ] **Step 4: Replace duplicated security page code**

`settings/security.tsx` should render:

```tsx
<PasswordSettingsCard />
{canManageTwoFactor ? (
    <TwoFactorSettingsCard
        enabled={twoFactorEnabled}
        requiresConfirmation={requiresConfirmation}
    />
) : null}
```

- [ ] **Step 5: Verify backend and frontend**

Run:

```bash
php artisan test --compact tests/Feature/Settings/SecurityControllerTest.php
npm run types:check
npm run lint:check
```

Expected:

```text
PASS Tests\Feature\Settings\SecurityControllerTest
No TypeScript or ESLint errors
```

## Task 9: Deduplicate Social And Appearance Settings

**Files:**
- Create: `resources/js/features/settings/social-accounts-card.tsx`
- Modify: `resources/js/pages/settings/social-accounts.tsx`
- Modify: `resources/js/pages/settings/profile.tsx`
- Modify: `tests/Feature/Settings/SocialAccountControllerTest.php`

- [ ] **Step 1: Add social account error test**

Append:

```php
test('user without password cannot disconnect last social account', function (): void {
    $user = User::factory()->create(['password' => null]);
    $social = SocialAccount::factory()->create(['user_id' => $user->id, 'provider' => 'google']);

    $this->actingAs($user)
        ->delete(route('settings.social-accounts.destroy', $social))
        ->assertSessionHasErrors('social');

    expect(SocialAccount::find($social->id))->not->toBeNull();
});
```

- [ ] **Step 2: Extract social accounts card**

Move the current social provider rows and disconnect dialog from `settings/social-accounts.tsx` into `features/settings/social-accounts-card.tsx`.

- [ ] **Step 3: Use the shared card**

Render the shared card from `settings/social-accounts.tsx`. If the unified profile page still shows connected accounts summary, render the same shared card there without duplicating logic.

- [ ] **Step 4: Verify**

Run:

```bash
php artisan test --compact tests/Feature/Settings/SocialAccountControllerTest.php
npm run types:check
```

Expected:

```text
PASS Tests\Feature\Settings\SocialAccountControllerTest
No TypeScript errors
```

## Task 10: Add Browser Smoke Coverage

**Files:**
- Create: `tests/e2e/profile-settings.spec.ts`

- [ ] **Step 1: Add smoke test**

Create:

```ts
import { expect, test } from '@playwright/test';

const pages = [
    '/profile',
    '/settings/profile',
    '/settings/security',
    '/settings/social-accounts',
    '/settings/appearance',
];

test.describe('profile and settings smoke', () => {
    test('settings pages require authentication', async ({ page }) => {
        await page.goto('/settings/profile');
        await expect(page).toHaveURL(/\/login/);
    });

    test('public profile route redirects unauthenticated users to login for own profile', async ({ page }) => {
        await page.goto('/profile');
        await expect(page).toHaveURL(/\/login/);
    });
});
```

Add authenticated browser coverage only after the project has a stable Playwright auth helper or seeded test user workflow.

- [ ] **Step 2: Run E2E smoke**

Run:

```bash
npm run e2e -- tests/e2e/profile-settings.spec.ts --project=chromium
```

Expected:

```text
2 passed
```

## Task 11: Final Verification

**Files:**
- All files touched by this plan.

- [ ] **Step 1: Regenerate Wayfinder routes**

Run:

```bash
npm run types
```

Expected:

```text
Wayfinder routes generated
```

- [ ] **Step 2: Format PHP**

Run:

```bash
vendor/bin/pint --dirty --format agent
```

Expected:

```text
PASS
```

- [ ] **Step 3: Run settings feature tests**

Run:

```bash
php artisan test --compact tests/Feature/Settings
```

Expected:

```text
PASS Tests\Feature\Settings\ProfileControllerTest
PASS Tests\Feature\Settings\SecurityControllerTest
PASS Tests\Feature\Settings\SocialAccountControllerTest
PASS Tests\Feature\Settings\AppearanceControllerTest
```

- [ ] **Step 4: Run frontend checks**

Run:

```bash
npm run types:check
npm run lint:check
```

Expected:

```text
No TypeScript or ESLint errors
```

- [ ] **Step 5: Run browser smoke**

Run:

```bash
npm run e2e -- tests/e2e/profile-settings.spec.ts --project=chromium
```

Expected:

```text
2 passed
```

- [ ] **Step 6: Inspect changed files for scope**

Run:

```bash
git diff --name-only
```

Expected touched areas:

```text
app/Http/Controllers/Settings/...
app/Http/Requests/Settings/...
app/Services/UserAvatarService.php
app/Concerns/ProfileValidationRules.php
routes/settings.php
resources/js/features/profile/...
resources/js/features/settings/...
resources/js/hooks/use-two-factor-auth.ts
resources/js/layouts/settings/layout.tsx
resources/js/pages/profile/show.tsx
resources/js/pages/settings/...
resources/js/types/profile.ts
tests/Feature/Settings/...
tests/e2e/profile-settings.spec.ts
resources/js/routes/...
resources/js/actions/...
```

No auth login/register/forgot/reset pages and no admin management files should be changed.

## Out Of Scope

- Login, registration, forgot password, and reset password screens.
- Admin user management.
- Notification preferences.
- Full account activity/audit log.
- Device/session management beyond password update and 2FA.
- Course, lab, assessment, or learner progress changes.
- Adding new OAuth providers beyond providers already present.

## Definition Of Done

- `/settings/profile` has a real editable profile form.
- Users can update name, username, email, bio, pronoun, location, and visibility.
- Email changes still clear email verification.
- Users can upload and remove avatars.
- Public profiles respect `profile_visibility`.
- Shared profile badge and overview components remove duplicated page code.
- Settings pages share one navigation shell.
- `/settings/security` supports password update and complete 2FA setup/disable/recovery-code management.
- Social account connect/disconnect UI is shared and tested.
- Account deletion remains password-confirmed.
- Existing auth, management, course, and labs plans are not overridden.
- Pest settings tests, TypeScript check, lint check, Pint, and profile/settings E2E smoke pass.
