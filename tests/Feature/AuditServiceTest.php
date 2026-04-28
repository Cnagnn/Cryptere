<?php

use App\Models\AuditLog;
use App\Models\Course;
use App\Models\User;
use App\Services\AuditService;

// ============================================================
// log — Positive Scenarios
// ============================================================

test('creates audit log entry with correct data', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create();
    $service = new AuditService;

    $service->log($admin, 'course.created', $course, ['title' => $course->title]);

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $admin->id,
        'action' => 'course.created',
        'target_type' => 'Course',
        'target_id' => $course->id,
    ]);

    $log = AuditLog::latest('id')->first();
    expect($log->payload)->toBe(['title' => $course->title]);
});

test('creates audit log with empty payload as null', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create();
    $service = new AuditService;

    $service->log($admin, 'course.deleted', $course);

    $log = AuditLog::latest('id')->first();

    expect($log->payload)->toBeNull();
});

test('creates audit log for different target types', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $targetUser = User::factory()->create();
    $service = new AuditService;

    $service->log($admin, 'user.banned', $targetUser, ['reason' => 'spam']);

    $this->assertDatabaseHas('audit_logs', [
        'user_id' => $admin->id,
        'action' => 'user.banned',
        'target_type' => 'User',
        'target_id' => $targetUser->id,
    ]);
});

test('creates multiple audit logs for same target', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create();
    $service = new AuditService;

    $service->log($admin, 'course.updated', $course, ['field' => 'title']);
    $service->log($admin, 'course.updated', $course, ['field' => 'description']);

    expect(AuditLog::where('target_type', 'Course')->where('target_id', $course->id)->count())->toBe(2);
});

test('audit log stores complex payload', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create();
    $service = new AuditService;

    $payload = [
        'old' => ['title' => 'Old Title', 'status' => 'draft'],
        'new' => ['title' => 'New Title', 'status' => 'published'],
        'changed_fields' => ['title', 'status'],
    ];

    $service->log($admin, 'course.updated', $course, $payload);

    $log = AuditLog::latest('id')->first();

    expect($log->payload)->toEqual($payload);
});

// ============================================================
// log — Edge Scenarios
// ============================================================

test('audit log user relationship works', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $course = Course::factory()->create();
    $service = new AuditService;

    $service->log($admin, 'course.created', $course);

    $log = AuditLog::latest('id')->first();

    expect($log->user->id)->toBe($admin->id);
});

test('audit log has no updated_at column', function () {
    expect(AuditLog::UPDATED_AT)->toBeNull();
});
