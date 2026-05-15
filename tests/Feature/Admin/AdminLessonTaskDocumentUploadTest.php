<?php

use App\Models\Lesson;
use App\Models\LessonTask;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

test('admin pdf upload for a new read task is immediately available to learners', function (): void {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $lesson = Lesson::factory()->create();

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.store'), [
            'lesson_id' => $lesson->id,
            'title' => 'Dokumen: Peta Konsep Sandi Caesar',
            'description' => 'Baca materi dan catat poin-poin penting.',
            'type' => 'read',
            'status' => 'published',
            'document' => UploadedFile::fake()->create('peta-konsep-sandi-caesar.pdf', 128, 'application/pdf'),
        ])
        ->assertRedirect();

    $task = LessonTask::query()->where('lesson_id', $lesson->id)->firstOrFail();

    expect($task->document_name)->toBe('peta-konsep-sandi-caesar.pdf')
        ->and($task->conversion_status)->toBe('converted')
        ->and($task->pdf_url)->toStartWith('/storage/lesson-documents/')
        ->and($task->pdf_url)->toEndWith('.pdf');

    $path = str_replace('/storage/', '', parse_url($task->pdf_url, PHP_URL_PATH));
    Storage::disk('public')->assertExists($path);
});

test('admin pdf upload when editing a read task replaces the learner pdf immediately', function (): void {
    Storage::fake('public');

    $admin = User::factory()->create(['role' => 'admin', 'is_admin' => true]);
    $task = LessonTask::factory()->create([
        'type' => 'read',
        'document_name' => null,
        'conversion_status' => null,
        'pdf_url' => null,
    ]);

    $this->actingAs($admin)
        ->post(route('admin.courses.tasks.update', $task), [
            '_method' => 'PATCH',
            'title' => 'Dokumen: Peta Konsep Sandi Caesar',
            'description' => 'Baca materi dan catat poin-poin penting.',
            'type' => 'read',
            'status' => 'published',
            'document' => UploadedFile::fake()->create('peta-konsep-sandi-caesar.pdf', 128, 'application/pdf'),
        ])
        ->assertRedirect();

    $task->refresh();

    expect($task->document_name)->toBe('peta-konsep-sandi-caesar.pdf')
        ->and($task->conversion_status)->toBe('converted')
        ->and($task->pdf_url)->toStartWith('/storage/lesson-documents/')
        ->and($task->pdf_url)->toEndWith('.pdf');

    $path = str_replace('/storage/', '', parse_url($task->pdf_url, PHP_URL_PATH));
    Storage::disk('public')->assertExists($path);
});
