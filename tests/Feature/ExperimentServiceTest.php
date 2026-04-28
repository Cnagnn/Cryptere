<?php

use App\Models\User;
use App\Services\ExperimentService;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->service = new ExperimentService;
});

// ============================================================
// trackEvent — Positive Scenarios
// ============================================================

test('tracks experiment event in audit logs', function () {
    $user = User::factory()->create();

    $this->service->trackEvent($user, 'onboarding_flow', 'conversion', ['step' => 'complete']);

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action' => 'experiment:conversion',
        'target_type' => 'experiment',
        'target_id' => 0,
    ]);

    $log = DB::table('audit_logs')->where('user_id', $user->id)->first();
    $payload = json_decode($log->payload, true);

    expect($payload['experiment'])->toBe('onboarding_flow')
        ->and($payload['step'])->toBe('complete');
});

test('tracks event with empty metadata', function () {
    $user = User::factory()->create();

    $this->service->trackEvent($user, 'test_experiment', 'view');

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $user->id,
        'action' => 'experiment:view',
    ]);
});

test('tracks multiple events for same experiment', function () {
    $user = User::factory()->create();

    $this->service->trackEvent($user, 'pricing_test', 'impression');
    $this->service->trackEvent($user, 'pricing_test', 'click');
    $this->service->trackEvent($user, 'pricing_test', 'conversion');

    $count = DB::table('audit_logs')
        ->where('user_id', $user->id)
        ->where('action', 'like', 'experiment:%')
        ->count();

    expect($count)->toBe(3);
});

test('tracks events for different users independently', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    $this->service->trackEvent($user1, 'test', 'view');
    $this->service->trackEvent($user2, 'test', 'view');

    $count1 = DB::table('audit_logs')->where('user_id', $user1->id)->count();
    $count2 = DB::table('audit_logs')->where('user_id', $user2->id)->count();

    expect($count1)->toBe(1)
        ->and($count2)->toBe(1);
});

test('event payload includes experiment name and variant', function () {
    $user = User::factory()->create();

    $this->service->trackEvent($user, 'feature_flag_test', 'engagement', [
        'duration_ms' => 5000,
        'page' => 'dashboard',
    ]);

    $log = DB::table('audit_logs')->where('user_id', $user->id)->first();
    $payload = json_decode($log->payload, true);

    expect($payload)->toHaveKey('experiment')
        ->and($payload)->toHaveKey('variant')
        ->and($payload)->toHaveKey('duration_ms')
        ->and($payload)->toHaveKey('page')
        ->and($payload['experiment'])->toBe('feature_flag_test')
        ->and($payload['duration_ms'])->toBe(5000);
});

// ============================================================
// trackEvent — Edge Scenarios
// ============================================================

test('event with special characters in experiment name', function () {
    $user = User::factory()->create();

    $this->service->trackEvent($user, 'test:v2.1-beta', 'click');

    $log = DB::table('audit_logs')->where('user_id', $user->id)->first();
    $payload = json_decode($log->payload, true);

    expect($payload['experiment'])->toBe('test:v2.1-beta');
});

test('event timestamp is set', function () {
    $user = User::factory()->create();

    $this->service->trackEvent($user, 'test', 'view');

    $log = DB::table('audit_logs')->where('user_id', $user->id)->first();

    expect($log->created_at)->not->toBeNull();
});
