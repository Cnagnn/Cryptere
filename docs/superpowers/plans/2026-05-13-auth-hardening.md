# Auth Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make login, registration, forgot password, and reset password reliable, consistent, localized, and covered by automated tests.

**Architecture:** Keep Laravel Fortify as the authentication backend and Inertia React as the UI layer. Stabilize the existing flow first, then harden validation, privacy, translations, and test coverage without replacing Fortify defaults unnecessarily.

**Tech Stack:** Laravel 13, Fortify 1, Inertia Laravel/React 3, Wayfinder, React 19, Pest 4, Playwright, TypeScript.

---

## Current Findings

- Fortify features are enabled for registration, password reset, email verification, and 2FA in `config/fortify.php`.
- Fortify view callbacks render Inertia auth pages from `app/Providers/FortifyServiceProvider.php`.
- Login and forgot password use Wayfinder form helpers. Register and reset password pass route objects directly to `<Form>`, leaving Inertia's `action` prop empty.
- Register uses hidden `name` and hidden `password_confirmation` fields, so users cannot enter a display name or confirm a password typo.
- The terms checkbox is enforced only by the browser. Backend validation does not require `terms`.
- Forgot/reset password feature tests are missing.
- Auth tests currently cannot run locally because `phpunit.xml` points at MySQL database `crypter_test`, and MySQL on `127.0.0.1:3306` is unavailable.
- Auth UI text is mostly Indonesian, but Laravel auth/password validation translations are not present in `lang/`, so backend messages can fall back to English.
- `/api/users/check-username` is a closure route and is called through a hardcoded URL, so it is outside the normal Wayfinder pattern.

## Approach Options

**Recommended: Production hardening.** Fix the endpoint binding bug, make tests runnable, add missing feature/E2E coverage, align register UI with backend validation, add neutral password reset responses, and localize auth messages. This is the best balance of scope and risk.

**Minimal stabilization.** Only fix reset/register form bindings and add the smallest tests. Faster, but leaves weak register validation, account enumeration behavior, and localization gaps.

**Full auth redesign.** Redesign all auth screens, social login hints, 2FA, i18n, and onboarding as one larger project. Higher risk and not needed to make the requested flows solid.

---

## File Structure

### Create

- `tests/Feature/Auth/PasswordResetTest.php` - forgot/reset password backend coverage.
- `tests/Feature/Auth/RegistrationTest.php` - registration validation coverage.
- `tests/Feature/Auth/UsernameAvailabilityTest.php` - username availability endpoint coverage.
- `tests/e2e/auth.spec.ts` - browser-level checks for form actions and basic auth pages.
- `app/Http/Controllers/Auth/UsernameAvailabilityController.php` - named controller for username availability.
- `app/Http/Responses/Auth/NeutralPasswordResetLinkResponse.php` - neutral response for both known and unknown reset-link requests.
- `lang/id/auth.php` - Indonesian auth messages.
- `lang/id/passwords.php` - Indonesian password broker messages.
- `lang/id/validation.php` - Indonesian validation messages and auth field attributes.

### Modify

- `phpunit.xml` - make local/CI tests runnable without a missing MySQL service.
- `routes/web.php` - replace username availability closure with a named controller route.
- `app/Actions/Fortify/CreateNewUser.php` - validate accepted terms and preserve display name.
- `app/Providers/AppServiceProvider.php` - bind neutral password reset link responses.
- `resources/js/pages/auth/register.tsx` - use `store.form()`, add display name and confirm password fields, remove hidden confirmation.
- `resources/js/pages/auth/reset-password.tsx` - use `update.form()`.
- `resources/js/pages/auth/login.tsx` - align failed login handling with translated backend messages.
- `tests/Feature/Auth/AuthenticationTest.php` - keep the existing happy-path registration test aligned with new backend rules.
- `resources/js/routes/**` and `resources/js/actions/**` - regenerate Wayfinder output after route changes.

---

## Task 1: Make Auth Tests Runnable

**Files:**
- Modify: `phpunit.xml`

- [ ] **Step 1: Confirm the current failure**

Run:

```bash
php artisan test --compact --filter="login page renders" --stop-on-failure
```

Expected before changes:

```text
FAILED Tests\Feature\Auth\AuthenticationTest > login page renders
SQLSTATE[HY000] [2002] No connection could be made ...
Connection: mysql, Database: crypter_test
```

- [ ] **Step 2: Switch test DB to SQLite memory**

In `phpunit.xml`, replace:

```xml
<env name="DB_CONNECTION" value="mysql"/>
<env name="DB_DATABASE" value="crypter_test"/>
```

with:

```xml
<env name="DB_CONNECTION" value="sqlite"/>
<env name="DB_DATABASE" value=":memory:"/>
```

- [ ] **Step 3: Verify auth tests run**

Run:

```bash
php artisan test --compact tests/Feature/Auth/AuthenticationTest.php tests/Feature/AuthenticationLoginTest.php
```

Expected:

```text
PASS Tests\Feature\Auth\AuthenticationTest
PASS Tests\Feature\AuthenticationLoginTest
```

- [ ] **Step 4: Commit**

```bash
git add phpunit.xml
git commit -m "test: make auth tests use sqlite"
```

---

## Task 2: Fix Inertia Auth Form Targets

**Files:**
- Create: `tests/e2e/auth.spec.ts`
- Modify: `resources/js/pages/auth/register.tsx`
- Modify: `resources/js/pages/auth/reset-password.tsx`

- [ ] **Step 1: Add failing E2E tests**

Create `tests/e2e/auth.spec.ts`:

```typescript
import { expect, test } from '@playwright/test';

test('registration form posts to the Fortify register endpoint', async ({ page }) => {
    await page.goto('/register');

    const form = page.locator('form').first();

    await expect(form).toHaveAttribute('action', /\/register$/);
    await expect(form).toHaveAttribute('method', 'post');
});

test('reset password form posts to the Fortify reset endpoint', async ({ page }) => {
    await page.goto('/reset-password/test-token?email=student@example.com');

    const form = page.locator('form').first();

    await expect(form).toHaveAttribute('action', /\/reset-password$/);
    await expect(form).toHaveAttribute('method', 'post');
});
```

- [ ] **Step 2: Run the E2E tests to verify the reset form fails**

Run:

```bash
npm run e2e -- tests/e2e/auth.spec.ts --project=chromium
```

Expected before implementation:

```text
1 failed
reset password form posts to the Fortify reset endpoint
```

- [ ] **Step 3: Use Wayfinder form helpers**

In `resources/js/pages/auth/register.tsx`, change:

```tsx
<Form
    {...store()}
```

to:

```tsx
<Form
    {...store.form()}
```

In `resources/js/pages/auth/reset-password.tsx`, change:

```tsx
<Form
    {...update()}
```

to:

```tsx
<Form
    {...update.form()}
```

- [ ] **Step 4: Verify E2E and TypeScript**

Run:

```bash
npm run e2e -- tests/e2e/auth.spec.ts --project=chromium
npm run types:check
```

Expected:

```text
2 passed
tsc --noEmit exits 0
```

- [ ] **Step 5: Commit**

```bash
git add tests/e2e/auth.spec.ts resources/js/pages/auth/register.tsx resources/js/pages/auth/reset-password.tsx
git commit -m "fix: target fortify auth forms explicitly"
```

---

## Task 3: Harden Registration Data and Validation

**Files:**
- Create: `tests/Feature/Auth/RegistrationTest.php`
- Modify: `app/Actions/Fortify/CreateNewUser.php`
- Modify: `resources/js/pages/auth/register.tsx`
- Modify: `tests/Feature/Auth/AuthenticationTest.php`

- [ ] **Step 1: Create failing registration tests**

Run:

```bash
php artisan make:test Auth/RegistrationTest --pest --no-interaction
```

Replace the generated file with:

```php
<?php

use App\Models\User;

test('registration requires accepted terms', function () {
    $this->post('/register', [
        'name' => 'Student Example',
        'username' => 'student_example',
        'email' => 'student@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
    ])
        ->assertSessionHasErrors('terms');

    $this->assertGuest();
});

test('registration stores the display name separately from username', function () {
    $this->post('/register', [
        'name' => 'Student Example',
        'username' => 'student_example',
        'email' => 'student@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Password123!',
        'terms' => 'on',
    ])->assertRedirect('/dashboard');

    $user = User::query()->where('email', 'student@example.com')->firstOrFail();

    expect($user->name)->toBe('Student Example')
        ->and($user->username)->toBe('student_example');
});

test('registration requires password confirmation', function () {
    $this->post('/register', [
        'name' => 'Student Example',
        'username' => 'student_example',
        'email' => 'student@example.com',
        'password' => 'Password123!',
        'password_confirmation' => 'Different123!',
        'terms' => 'on',
    ])
        ->assertSessionHasErrors('password');

    $this->assertGuest();
});
```

- [ ] **Step 2: Run tests and verify failures**

Run:

```bash
php artisan test --compact tests/Feature/Auth/RegistrationTest.php
```

Expected before implementation:

```text
FAILED registration requires accepted terms
FAILED registration stores the display name separately from username
```

- [ ] **Step 3: Validate terms server-side**

In `app/Actions/Fortify/CreateNewUser.php`, add the terms rule:

```php
Validator::make($input, [
    ...$this->profileRules(),
    'username' => ['required', 'string', 'min:4', 'max:255', 'unique:users,username', 'regex:/^[a-zA-Z0-9._]+$/'],
    'password' => $this->passwordRules(),
    'terms' => ['accepted'],
], [
    'username.regex' => 'The username may only contain letters, numbers, dots (.), and underscores (_).',
])->validate();
```

- [ ] **Step 4: Add visible display name and confirmation fields**

In `resources/js/pages/auth/register.tsx`:

- Add a display name `<Input name="name" ... />` above username.
- For social registration, set `defaultValue={socialUser?.name ?? ''}`.
- Remove the hidden `name` input.
- Add a visible password confirmation `<PasswordInput name="password_confirmation" ... />`.
- Remove the hidden `password_confirmation` input.

Use this JSX pattern for the confirmation field:

```tsx
<Field data-invalid={Boolean(errors.password_confirmation)}>
    <FieldLabel htmlFor="password_confirmation">
        Konfirmasi Kata Sandi <span className="text-destructive">*</span>
    </FieldLabel>
    <PasswordInput
        id="password_confirmation"
        required
        tabIndex={5}
        autoComplete="new-password"
        name="password_confirmation"
        placeholder="Ulangi kata sandi"
        aria-invalid={Boolean(errors.password_confirmation) || undefined}
        icon={<Lock className="size-4" />}
    />
    {errors.password_confirmation && (
        <p className="text-sm text-destructive">
            {errors.password_confirmation}
        </p>
    )}
</Field>
```

- [ ] **Step 5: Update the existing registration happy-path test**

In `tests/Feature/Auth/AuthenticationTest.php`, update the `user can register` payload to include:

```php
'terms' => 'on',
```

- [ ] **Step 6: Verify backend and frontend**

Run:

```bash
php artisan test --compact tests/Feature/Auth/RegistrationTest.php tests/Feature/Auth/AuthenticationTest.php
npm run types:check
```

Expected:

```text
PASS Tests\Feature\Auth\RegistrationTest
PASS Tests\Feature\Auth\AuthenticationTest
tsc --noEmit exits 0
```

- [ ] **Step 7: Commit**

```bash
git add app/Actions/Fortify/CreateNewUser.php resources/js/pages/auth/register.tsx tests/Feature/Auth/RegistrationTest.php tests/Feature/Auth/AuthenticationTest.php
git commit -m "feat: harden registration validation"
```

---

## Task 4: Add Forgot and Reset Password Coverage

**Files:**
- Create: `tests/Feature/Auth/PasswordResetTest.php`
- Create: `app/Http/Responses/Auth/NeutralPasswordResetLinkResponse.php`
- Modify: `app/Providers/AppServiceProvider.php`

- [ ] **Step 1: Create password reset tests**

Run:

```bash
php artisan make:test Auth/PasswordResetTest --pest --no-interaction
```

Replace the generated file with:

```php
<?php

use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;

test('forgot password page renders', function () {
    $this->get('/forgot-password')->assertSuccessful();
});

test('reset password page renders with token and email', function () {
    $this->get('/reset-password/test-token?email=student@example.com')
        ->assertSuccessful();
});

test('known user receives a reset password link', function () {
    Notification::fake();

    $user = User::factory()->create([
        'email' => 'student@example.com',
    ]);

    $this->post('/forgot-password', [
        'email' => 'student@example.com',
    ])->assertSessionHas('status');

    Notification::assertSentTo($user, ResetPassword::class);
});

test('unknown email receives a neutral response without sending notification', function () {
    Notification::fake();

    $this->post('/forgot-password', [
        'email' => 'missing@example.com',
    ])
        ->assertSessionHasNoErrors()
        ->assertSessionHas('status');

    Notification::assertNothingSent();
});

test('user can reset password with a valid token', function () {
    $user = User::factory()->create([
        'email' => 'student@example.com',
        'password' => 'OldPassword123!',
    ]);

    $token = Password::broker()->createToken($user);

    $this->post('/reset-password', [
        'token' => $token,
        'email' => 'student@example.com',
        'password' => 'NewPassword123!',
        'password_confirmation' => 'NewPassword123!',
    ])->assertRedirect('/login');

    expect(Hash::check('NewPassword123!', $user->fresh()->password))->toBeTrue();
});
```

- [ ] **Step 2: Run tests and verify neutral response fails**

Run:

```bash
php artisan test --compact tests/Feature/Auth/PasswordResetTest.php
```

Expected before implementation:

```text
FAILED unknown email receives a neutral response without sending notification
```

- [ ] **Step 3: Create neutral reset link response**

Create `app/Http/Responses/Auth/NeutralPasswordResetLinkResponse.php`:

```php
<?php

namespace App\Http\Responses\Auth;

use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;

class NeutralPasswordResetLinkResponse implements FailedPasswordResetLinkRequestResponse, SuccessfulPasswordResetLinkRequestResponse
{
    public function __construct(private readonly string $status) {}

    public function toResponse($request)
    {
        $message = 'Jika email terdaftar, tautan reset kata sandi akan dikirim.';

        return $request->wantsJson()
            ? response()->json(['message' => $message])
            : back()->with('status', $message);
    }
}
```

- [ ] **Step 4: Bind Fortify response contracts**

In `app/Providers/AppServiceProvider.php`, import:

```php
use App\Http\Responses\Auth\NeutralPasswordResetLinkResponse;
use Laravel\Fortify\Contracts\FailedPasswordResetLinkRequestResponse;
use Laravel\Fortify\Contracts\SuccessfulPasswordResetLinkRequestResponse;
```

In `register()`, bind both contracts:

```php
public function register(): void
{
    $this->app->singleton(
        FailedPasswordResetLinkRequestResponse::class,
        NeutralPasswordResetLinkResponse::class,
    );

    $this->app->singleton(
        SuccessfulPasswordResetLinkRequestResponse::class,
        NeutralPasswordResetLinkResponse::class,
    );
}
```

- [ ] **Step 5: Verify reset tests**

Run:

```bash
php artisan test --compact tests/Feature/Auth/PasswordResetTest.php
```

Expected:

```text
PASS Tests\Feature\Auth\PasswordResetTest
```

- [ ] **Step 6: Commit**

```bash
git add app/Http/Responses/Auth/NeutralPasswordResetLinkResponse.php app/Providers/AppServiceProvider.php tests/Feature/Auth/PasswordResetTest.php
git commit -m "feat: harden password reset flow"
```

---

## Task 5: Localize Auth and Password Messages

**Files:**
- Create: `lang/id/auth.php`
- Create: `lang/id/passwords.php`
- Create: `lang/id/validation.php`
- Modify: `resources/js/pages/auth/login.tsx`

- [ ] **Step 1: Add failing localization tests**

Append to `tests/Feature/Auth/AuthenticationTest.php`:

```php
test('login failure can return Indonesian auth message', function () {
    $this
        ->withHeader('Accept-Language', 'id-ID,id;q=0.9')
        ->post('/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ])
        ->assertSessionHasErrors([
            'email' => 'Masuk gagal. Periksa kredensial atau atur ulang kata sandi.',
        ]);
});
```

- [ ] **Step 2: Run the failing localization test**

Run:

```bash
php artisan test --compact --filter="login failure can return Indonesian auth message"
```

Expected before implementation:

```text
FAILED login failure can return Indonesian auth message
```

- [ ] **Step 3: Add Indonesian language files**

Create `lang/id/auth.php`:

```php
<?php

return [
    'failed' => 'Masuk gagal. Periksa kredensial atau atur ulang kata sandi.',
    'password' => 'Kata sandi yang diberikan salah.',
    'throttle' => 'Terlalu banyak percobaan masuk. Coba lagi dalam :seconds detik.',
];
```

Create `lang/id/passwords.php`:

```php
<?php

return [
    'reset' => 'Kata sandi Anda berhasil diatur ulang.',
    'sent' => 'Jika email terdaftar, tautan reset kata sandi akan dikirim.',
    'throttled' => 'Mohon tunggu sebelum mencoba lagi.',
    'token' => 'Token reset kata sandi tidak valid.',
    'user' => 'Jika email terdaftar, tautan reset kata sandi akan dikirim.',
];
```

Create `lang/id/validation.php` with the auth-specific subset:

```php
<?php

return [
    'accepted' => ':attribute harus diterima.',
    'confirmed' => 'Konfirmasi :attribute tidak cocok.',
    'email' => ':attribute harus berupa alamat email yang valid.',
    'max' => [
        'string' => ':attribute tidak boleh lebih dari :max karakter.',
    ],
    'min' => [
        'string' => ':attribute minimal :min karakter.',
    ],
    'required' => ':attribute wajib diisi.',
    'string' => ':attribute harus berupa teks.',
    'unique' => ':attribute sudah digunakan.',

    'attributes' => [
        'email' => 'email',
        'name' => 'nama',
        'password' => 'kata sandi',
        'terms' => 'ketentuan layanan',
        'username' => 'username',
    ],
];
```

- [ ] **Step 4: Keep login UI handling generic**

In `resources/js/pages/auth/login.tsx`, keep the `failedSignInMessage` value equal to `lang/id/auth.php['failed']`. If the product keeps English locale support later, replace the exact string comparison with a server-provided error bag key instead of another hardcoded translation.

- [ ] **Step 5: Verify localization**

Run:

```bash
php artisan test --compact --filter="login failure can return Indonesian auth message"
php artisan test --compact tests/Feature/Auth/AuthenticationTest.php
vendor/bin/pint --dirty --format agent
```

Expected:

```text
PASS login failure can return Indonesian auth message
PASS Tests\Feature\Auth\AuthenticationTest
```

- [ ] **Step 6: Commit**

```bash
git add lang/id/auth.php lang/id/passwords.php lang/id/validation.php resources/js/pages/auth/login.tsx tests/Feature/Auth/AuthenticationTest.php
git commit -m "feat: localize auth messages"
```

---

## Task 6: Move Username Availability to a Named Wayfinder Route

**Files:**
- Create: `app/Http/Controllers/Auth/UsernameAvailabilityController.php`
- Create: `tests/Feature/Auth/UsernameAvailabilityTest.php`
- Modify: `routes/web.php`
- Modify: `resources/js/pages/auth/register.tsx`
- Regenerate: `resources/js/routes/**`
- Regenerate: `resources/js/actions/**`

- [ ] **Step 1: Add username availability tests**

Run:

```bash
php artisan make:test Auth/UsernameAvailabilityTest --pest --no-interaction
```

Replace the generated file with:

```php
<?php

use App\Models\User;

test('username availability returns false for invalid username', function () {
    $this->getJson('/api/users/check-username?username=bad name')
        ->assertOk()
        ->assertJson(['available' => false]);
});

test('username availability returns false for an existing username', function () {
    User::factory()->create(['username' => 'existing_user']);

    $this->getJson('/api/users/check-username?username=existing_user')
        ->assertOk()
        ->assertJson(['available' => false]);
});

test('username availability returns true for an unused valid username', function () {
    $this->getJson('/api/users/check-username?username=new_user')
        ->assertOk()
        ->assertJson(['available' => true]);
});
```

- [ ] **Step 2: Create controller**

Run:

```bash
php artisan make:controller Auth/UsernameAvailabilityController --invokable --no-interaction
```

Use this implementation:

```php
<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsernameAvailabilityController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $username = $request->string('username')->trim()->toString();

        if (! preg_match('/^[a-zA-Z0-9._]{4,255}$/', $username)) {
            return response()->json(['available' => false]);
        }

        $exists = User::query()
            ->where('username', $username)
            ->exists();

        usleep(random_int(50_000, 100_000));

        return response()->json(['available' => ! $exists]);
    }
}
```

- [ ] **Step 3: Replace closure route**

In `routes/web.php`, import:

```php
use App\Http\Controllers\Auth\UsernameAvailabilityController;
```

Replace the closure route with:

```php
Route::middleware('throttle:10,1')
    ->get('/api/users/check-username', UsernameAvailabilityController::class)
    ->name('users.check-username');
```

- [ ] **Step 4: Regenerate Wayfinder routes**

Run:

```bash
npm run types
```

Expected:

```text
php artisan wayfinder:generate exits 0
```

- [ ] **Step 5: Use generated route in React**

In `resources/js/pages/auth/register.tsx`, replace the hardcoded fetch URL with a Wayfinder import:

```tsx
import { checkUsername } from '@/routes/users';
```

Then call:

```tsx
fetch(checkUsername.url({ query: { username } }))
```

- [ ] **Step 6: Verify username endpoint and types**

Run:

```bash
php artisan test --compact tests/Feature/Auth/UsernameAvailabilityTest.php
npm run types:check
vendor/bin/pint --dirty --format agent
```

Expected:

```text
PASS Tests\Feature\Auth\UsernameAvailabilityTest
tsc --noEmit exits 0
```

- [ ] **Step 7: Commit**

```bash
git add app/Http/Controllers/Auth/UsernameAvailabilityController.php routes/web.php resources/js/pages/auth/register.tsx resources/js/routes resources/js/actions tests/Feature/Auth/UsernameAvailabilityTest.php
git commit -m "refactor: expose username availability through wayfinder"
```

---

## Task 7: Final Verification

**Files:**
- No new files.

- [ ] **Step 1: Run PHP auth tests**

```bash
php artisan test --compact tests/Feature/Auth/AuthenticationTest.php tests/Feature/AuthenticationLoginTest.php tests/Feature/Auth/RegistrationTest.php tests/Feature/Auth/PasswordResetTest.php tests/Feature/Auth/UsernameAvailabilityTest.php
```

Expected:

```text
PASS Tests\Feature\Auth\AuthenticationTest
PASS Tests\Feature\AuthenticationLoginTest
PASS Tests\Feature\Auth\RegistrationTest
PASS Tests\Feature\Auth\PasswordResetTest
PASS Tests\Feature\Auth\UsernameAvailabilityTest
```

- [ ] **Step 2: Run frontend checks**

```bash
npm run types:check
npm run lint:check
npm run format:check
npm run e2e -- tests/e2e/auth.spec.ts --project=chromium
```

Expected:

```text
tsc --noEmit exits 0
ESLint exits 0
Prettier exits 0
2 passed
```

- [ ] **Step 3: Run formatter for PHP changes**

```bash
vendor/bin/pint --dirty --format agent
```

Expected:

```text
No syntax errors and dirty PHP files formatted
```

- [ ] **Step 4: Run full compact test suite**

```bash
php artisan test --compact
```

Expected:

```text
PASS
```

- [ ] **Step 5: Commit final verification fixes if Pint or generated files changed**

```bash
git status --short
git add .
git commit -m "test: verify auth hardening"
```

Only run this commit if `git status --short` shows files changed by formatting or generated output.

---

## Deferred Decisions

- Social login account-specific hints should be reviewed separately. The current `socialHint` improves UX but can reveal that an account has a linked provider after a failed password attempt.
- 2FA setup and challenge flows are enabled, but this plan covers only the requested login/register/forgot/reset scope. Add a separate 2FA plan if those screens must be production-audited too.
- If production must use MySQL in tests, replace Task 1 with a CI/local MySQL service setup and keep `DB_CONNECTION=mysql`.

## Self-Review

- Scope covers login, registration, forgot password, and reset password.
- No implementation changes are included in this document.
- The plan fixes the route binding bug before deeper UX hardening.
- Each task has exact files, commands, expected results, and verification steps.
- No unresolved placeholders remain.
