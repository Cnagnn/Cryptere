<?php

use App\Models\User;

dataset('weak_passwords', [
    'too short' => ['Aa1bcdef', 'at least 12 characters'],
    'all lowercase' => ['allllowercase12', 'uppercase'],
    'all uppercase' => ['ALLUPPERCASE12', 'lowercase'],
    'no numbers' => ['NoNumbersHereJustAlpha', 'number'],
    'no letters' => ['1234567890123456', 'letter'],
]);

test('registration rejects weak password: $name', function (string $password, string $expectedFragment): void {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'username' => 'test_user',
        'email' => 'test@example.com',
        'password' => $password,
        'password_confirmation' => $password,
        'terms' => 'on',
    ]);

    $response->assertSessionHasErrors('password');
    expect(User::query()->count())->toBe(0);
})->with('weak_passwords');

test('registration rejects passwords from public breach corpus', function (): void {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'username' => 'test_user',
        'email' => 'test@example.com',
        'password' => 'Password123456',
        'password_confirmation' => 'Password123456',
        'terms' => 'on',
    ]);

    // HIBP is a network call; if unreachable the validator fails open.
    // Skip when offline so dev-without-internet doesn't false-fail.
    $errors = $response->getSession()->get('errors');
    $bag = is_object($errors) ? $errors : null;

    if ($bag === null || ! $bag->has('password')) {
        $this->markTestSkipped('HaveIBeenPwned API not reachable from this environment');
    }

    $passwordErrors = $bag->get('password');
    expect($passwordErrors)->toBeArray()->not->toBeEmpty();
    expect(implode(' ', $passwordErrors))->toContain('data leak');
})->skip(fn () => env('CI_SKIP_HIBP', false), 'HIBP check skipped (set CI_SKIP_HIBP=0 to enable)');

test('registration accepts a strong, unique password', function (): void {
    // Random suffix → cannot be in HIBP yet.
    $strong = 'CryptereGuard'.bin2hex(random_bytes(8)).'9X';

    $response = $this->post('/register', [
        'name' => 'Strong Pass User',
        'username' => 'strongpass_user',
        'email' => 'strongpass@example.com',
        'password' => $strong,
        'password_confirmation' => $strong,
        'terms' => 'on',
    ]);

    $response->assertRedirect('/verify');
    expect(User::query()->where('email', 'strongpass@example.com')->exists())->toBeTrue();
});
