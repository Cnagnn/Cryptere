<?php

use App\Models\Challenge;
use App\Services\ChallengeHelperService;
use Carbon\CarbonImmutable;
use Tests\TestCase;

uses(TestCase::class);

beforeEach(function () {
    $this->service = new ChallengeHelperService;
});

// ============================================================
// normalizeAnswer — Positive Scenarios
// ============================================================

test('normalizes answer to lowercase', function () {
    expect($this->service->normalizeAnswer('HELLO'))->toBe('hello');
});

test('normalizes answer by trimming whitespace', function () {
    expect($this->service->normalizeAnswer('  hello  '))->toBe('hello');
});

test('normalizes answer by squishing multiple spaces', function () {
    expect($this->service->normalizeAnswer('hello   world'))->toBe('hello world');
});

test('normalizes mixed case with extra spaces', function () {
    expect($this->service->normalizeAnswer('  Hello   WORLD  '))->toBe('hello world');
});

test('normalizes already clean answer unchanged', function () {
    expect($this->service->normalizeAnswer('clean'))->toBe('clean');
});

// ============================================================
// normalizeAnswer — Negative / Edge Scenarios
// ============================================================

test('normalizes empty string to empty', function () {
    expect($this->service->normalizeAnswer(''))->toBe('');
});

test('normalizes whitespace-only string to empty', function () {
    expect($this->service->normalizeAnswer('   '))->toBe('');
});

test('normalizes string with tabs and newlines', function () {
    $result = $this->service->normalizeAnswer("hello\t\n  world");

    expect($result)->toBe('hello world');
});

// ============================================================
// resolveTimeLimitSeconds — Positive Scenarios
// ============================================================

test('time limit is 30 seconds', function () {
    expect($this->service->resolveTimeLimitSeconds())->toBe(30);
});

test('time limit matches class constant', function () {
    expect($this->service->resolveTimeLimitSeconds())
        ->toBe(ChallengeHelperService::ROUND_TIME_LIMIT_SECONDS);
});

// ============================================================
// resolveAvailabilityStatus — Positive Scenarios
// ============================================================

test('challenge with no time window is active', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => null,
        'time_end' => null,
    ]);

    $now = CarbonImmutable::parse('2026-04-28 12:00:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('active');
});

test('challenge is upcoming when current time is before start', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => CarbonImmutable::parse('2026-05-01 00:00:00'),
        'time_end' => CarbonImmutable::parse('2026-05-31 23:59:59'),
    ]);

    $now = CarbonImmutable::parse('2026-04-28 12:00:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('upcoming');
});

test('challenge is active when current time is within window', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => CarbonImmutable::parse('2026-04-01 00:00:00'),
        'time_end' => CarbonImmutable::parse('2026-05-31 23:59:59'),
    ]);

    $now = CarbonImmutable::parse('2026-04-28 12:00:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('active');
});

test('challenge is ended when current time is after end', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => CarbonImmutable::parse('2026-03-01 00:00:00'),
        'time_end' => CarbonImmutable::parse('2026-03-31 23:59:59'),
    ]);

    $now = CarbonImmutable::parse('2026-04-28 12:00:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('ended');
});

test('challenge with only start time is active after start', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => CarbonImmutable::parse('2026-04-01 00:00:00'),
        'time_end' => null,
    ]);

    $now = CarbonImmutable::parse('2026-04-28 12:00:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('active');
});

test('challenge with only end time is active before end', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => null,
        'time_end' => CarbonImmutable::parse('2026-05-31 23:59:59'),
    ]);

    $now = CarbonImmutable::parse('2026-04-28 12:00:00');

    expect($this->service->resolveAvailabilityStatus($challenge, $now))->toBe('active');
});

// ============================================================
// resolveAvailabilityStatus — Boundary Scenarios
// ============================================================

test('challenge is active at exact start time', function () {
    $startTime = CarbonImmutable::parse('2026-04-28 12:00:00');
    $challenge = Challenge::factory()->make([
        'time_start' => $startTime,
        'time_end' => CarbonImmutable::parse('2026-05-31 23:59:59'),
    ]);

    // At exact start time, lt() returns false, so it should be active
    expect($this->service->resolveAvailabilityStatus($challenge, $startTime))->toBe('active');
});

test('challenge is active at exact end time', function () {
    $endTime = CarbonImmutable::parse('2026-04-28 12:00:00');
    $challenge = Challenge::factory()->make([
        'time_start' => CarbonImmutable::parse('2026-04-01 00:00:00'),
        'time_end' => $endTime,
    ]);

    // At exact end time, gt() returns false, so it should be active
    expect($this->service->resolveAvailabilityStatus($challenge, $endTime))->toBe('active');
});

// ============================================================
// resolveAvailabilityStatusFromDates — Positive Scenarios
// ============================================================

test('from dates: active when no time constraints', function () {
    $now = CarbonImmutable::parse('2026-04-28 12:00:00');

    expect($this->service->resolveAvailabilityStatusFromDates(null, null, $now))->toBe('active');
});

test('from dates: upcoming when before start', function () {
    $now = CarbonImmutable::parse('2026-04-28 12:00:00');
    $start = CarbonImmutable::parse('2026-05-01 00:00:00');

    expect($this->service->resolveAvailabilityStatusFromDates($start, null, $now))->toBe('upcoming');
});

test('from dates: ended when after end', function () {
    $now = CarbonImmutable::parse('2026-04-28 12:00:00');
    $end = CarbonImmutable::parse('2026-03-31 23:59:59');

    expect($this->service->resolveAvailabilityStatusFromDates(null, $end, $now))->toBe('ended');
});

test('from dates: active when within window', function () {
    $now = CarbonImmutable::parse('2026-04-28 12:00:00');
    $start = CarbonImmutable::parse('2026-04-01 00:00:00');
    $end = CarbonImmutable::parse('2026-05-31 23:59:59');

    expect($this->service->resolveAvailabilityStatusFromDates($start, $end, $now))->toBe('active');
});

// ============================================================
// resolveChallengeAvailabilityError — Positive Scenarios
// ============================================================

test('no error for active challenge', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => null,
        'time_end' => null,
    ]);

    expect($this->service->resolveChallengeAvailabilityError($challenge))->toBeNull();
});

test('error message for upcoming challenge', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => now()->addDays(5),
        'time_end' => now()->addDays(30),
    ]);

    $error = $this->service->resolveChallengeAvailabilityError($challenge);

    expect($error)->toBe('This challenge has not started yet.');
});

test('error message for ended challenge', function () {
    $challenge = Challenge::factory()->make([
        'time_start' => now()->subDays(30),
        'time_end' => now()->subDays(5),
    ]);

    $error = $this->service->resolveChallengeAvailabilityError($challenge);

    expect($error)->toBe('This challenge has ended.');
});

// ============================================================
// hashAnswer — Positive Scenarios
// ============================================================

test('hash answer produces sha256 hash', function () {
    $hash = $this->service->hashAnswer('hello');

    expect($hash)->toBe(hash('sha256', 'hello'))
        ->and(strlen($hash))->toBe(64); // SHA-256 produces 64 hex chars
});

test('hash answer is deterministic', function () {
    $hash1 = $this->service->hashAnswer('test answer');
    $hash2 = $this->service->hashAnswer('test answer');

    expect($hash1)->toBe($hash2);
});

test('different answers produce different hashes', function () {
    $hash1 = $this->service->hashAnswer('answer1');
    $hash2 = $this->service->hashAnswer('answer2');

    expect($hash1)->not->toBe($hash2);
});

// ============================================================
// hashAnswer — Edge Scenarios
// ============================================================

test('hash of empty string is valid sha256', function () {
    $hash = $this->service->hashAnswer('');

    expect($hash)->toBe(hash('sha256', ''))
        ->and(strlen($hash))->toBe(64);
});

// ============================================================
// Integration: normalizeAnswer + hashAnswer pipeline
// ============================================================

test('normalized then hashed answers match regardless of original formatting', function () {
    $answer1 = $this->service->hashAnswer($this->service->normalizeAnswer('  Hello  WORLD  '));
    $answer2 = $this->service->hashAnswer($this->service->normalizeAnswer('hello world'));

    expect($answer1)->toBe($answer2);
});

test('differently formatted same answers produce same hash after normalization', function () {
    $variants = ['ANSWER', 'answer', '  answer  ', 'Answer', "answer\t"];

    $hashes = array_map(
        fn ($v) => $this->service->hashAnswer($this->service->normalizeAnswer($v)),
        $variants
    );

    expect(array_unique($hashes))->toHaveCount(1);
});
