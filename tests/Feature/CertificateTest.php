<?php

use App\Models\Certificate;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\User;

beforeEach(function () {
    $this->user = User::factory()->create(['last_active_date' => now()]);
});

test('certificates index renders for authenticated user', function () {
    $this->actingAs($this->user)
        ->get(route('certificates.index'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('certificates/index')
            ->has('certificates')
        );
});

test('certificates index requires authentication', function () {
    $this->get(route('certificates.index'))
        ->assertRedirect(route('login'));
});

test('certificates index shows user certificates', function () {
    $course = Course::factory()->create(['is_published' => true]);
    Certificate::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($this->user)
        ->get(route('certificates.index'))
        ->assertInertia(fn ($page) => $page
            ->has('certificates', 1)
            ->has('certificates.0.certificate_number')
            ->has('certificates.0.course.title')
            ->has('certificates.0.verification_url')
        );
});

test('certificates index does not show other users certificates', function () {
    $otherUser = User::factory()->create(['last_active_date' => now()]);
    Certificate::factory()->create(['user_id' => $otherUser->id]);

    $this->actingAs($this->user)
        ->get(route('certificates.index'))
        ->assertInertia(fn ($page) => $page
            ->has('certificates', 0)
        );
});

test('user can generate certificate for completed course', function () {
    $course = Course::factory()->create(['is_published' => true]);
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
        'completed_at' => now(),
        'progress_percentage' => 100,
    ]);

    $this->actingAs($this->user)
        ->post(route('certificates.store'), ['course_id' => $course->id])
        ->assertRedirect();

    $this->assertDatabaseHas('certificates', [
        'user_id' => $this->user->id,
        'course_id' => $course->id,
    ]);
});

test('user cannot generate certificate for incomplete course', function () {
    $course = Course::factory()->create(['is_published' => true]);
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
        'completed_at' => null,
        'progress_percentage' => 50,
    ]);

    $this->actingAs($this->user)
        ->post(route('certificates.store'), ['course_id' => $course->id])
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'error');

    $this->assertDatabaseMissing('certificates', [
        'user_id' => $this->user->id,
        'course_id' => $course->id,
    ]);
});

test('user cannot generate duplicate certificate', function () {
    $course = Course::factory()->create(['is_published' => true]);
    Enrollment::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
        'completed_at' => now(),
    ]);
    Certificate::factory()->create([
        'user_id' => $this->user->id,
        'course_id' => $course->id,
    ]);

    $this->actingAs($this->user)
        ->post(route('certificates.store'), ['course_id' => $course->id])
        ->assertRedirect()
        ->assertSessionHas('toast.type', 'info');
});

test('certificate show renders for owner', function () {
    $certificate = Certificate::factory()->create([
        'user_id' => $this->user->id,
    ]);

    $this->actingAs($this->user)
        ->get(route('certificates.show', $certificate))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('certificates/show')
            ->has('certificate.certificate_number')
            ->has('certificate.verification_url')
            ->has('certificate.course.title')
            ->has('certificate.user.name')
        );
});

test('certificate show denies access to non-owner', function () {
    $otherUser = User::factory()->create(['last_active_date' => now()]);
    $certificate = Certificate::factory()->create([
        'user_id' => $otherUser->id,
    ]);

    $this->actingAs($this->user)
        ->get(route('certificates.show', $certificate))
        ->assertForbidden();
});

test('public verification page shows valid certificate', function () {
    $certificate = Certificate::factory()->create([
        'user_id' => $this->user->id,
    ]);

    $this->get(route('certificates.verify', $certificate->verification_code))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('certificates/verify')
            ->where('valid', true)
            ->has('certificate.certificate_number')
            ->has('certificate.user_name')
            ->has('certificate.course_title')
        );
});

test('public verification page shows invalid for unknown code', function () {
    $this->get(route('certificates.verify', 'invalid-code-here'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('certificates/verify')
            ->where('valid', false)
            ->where('certificate', null)
        );
});

test('certificate number has correct format', function () {
    $number = Certificate::generateCertificateNumber();
    expect($number)->toStartWith('CRYPT-')
        ->and(strlen($number))->toBeGreaterThan(10);
});
