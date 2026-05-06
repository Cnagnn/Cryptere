<?php

use App\Models\Challenge;
use App\Services\ChallengeHelperService;
use Carbon\Carbon;

beforeEach(function () {
    $this->service = new ChallengeHelperService;
});

test('normalizes answer by trimming and lowercasing', function () {
    expect($this->service->normalizeAnswer('  Hello   World  '))->toBe('hello world');
});

test('resolves time limit constant', function () {
    expect($this->service->resolveTimeLimitSeconds())->toBe(30);
});

test('resolves active status when within time window', function () {
    $challenge = new Challenge;
    $challenge->time_start = Carbon::parse('2025-01-01 08:00');
    $challenge->time_end = Carbon::parse('2025-01-01 20:00');

    $now = Carbon::parse('2025-01-01 12:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('active');
});

test('resolves upcoming status when before start', function () {
    $challenge = new Challenge;
    $challenge->time_start = Carbon::parse('2025-01-01 08:00');
    $challenge->time_end = Carbon::parse('2025-01-01 20:00');

    $now = Carbon::parse('2025-01-01 06:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('upcoming');
});

test('resolves ended status when after end', function () {
    $challenge = new Challenge;
    $challenge->time_start = Carbon::parse('2025-01-01 08:00');
    $challenge->time_end = Carbon::parse('2025-01-01 20:00');

    $now = Carbon::parse('2025-01-01 22:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('ended');
});

test('resolves active when no time constraints', function () {
    $challenge = new Challenge;
    $challenge->time_start = null;
    $challenge->time_end = null;

    expect($this->service->resolveAvailabilityStatus($challenge, now()))->toBe('active');
});

test('resolves availability from raw dates', function () {
    $start = Carbon::parse('2025-06-01 08:00');
    $end = Carbon::parse('2025-06-01 20:00');
    $now = Carbon::parse('2025-06-01 05:00');

    expect($this->service->resolveAvailabilityStatusFromDates($start, $end, $now))->toBe('upcoming');
});

test('returns error when challenge not started', function () {
    Carbon::setTestNow(Carbon::parse('2025-01-01 06:00'));

    $challenge = new Challenge;
    $challenge->time_start = Carbon::parse('2025-01-01 08:00');
    $challenge->time_end = null;

    expect($this->service->resolveChallengeAvailabilityError($challenge))
        ->toBe('This challenge has not started yet.');

    Carbon::setTestNow();
});

test('returns error when challenge ended', function () {
    Carbon::setTestNow(Carbon::parse('2025-01-01 22:00'));

    $challenge = new Challenge;
    $challenge->time_start = null;
    $challenge->time_end = Carbon::parse('2025-01-01 20:00');

    expect($this->service->resolveChallengeAvailabilityError($challenge))
        ->toBe('This challenge has ended.');

    Carbon::setTestNow();
});

test('returns null when challenge is available', function () {
    Carbon::setTestNow(Carbon::parse('2025-01-01 12:00'));

    $challenge = new Challenge;
    $challenge->time_start = Carbon::parse('2025-01-01 08:00');
    $challenge->time_end = Carbon::parse('2025-01-01 20:00');

    expect($this->service->resolveChallengeAvailabilityError($challenge))->toBeNull();

    Carbon::setTestNow();
});

test('hashes answer deterministically', function () {
    $hash1 = $this->service->hashAnswer('hello world');
    $hash2 = $this->service->hashAnswer('hello world');

    expect($hash1)->toBe($hash2)
        ->and($hash1)->toBe(hash('sha256', 'hello world'));
});
