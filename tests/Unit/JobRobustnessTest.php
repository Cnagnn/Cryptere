<?php

use App\Jobs\ConvertLessonDocument;
use App\Jobs\ConvertLessonVideo;
use Illuminate\Contracts\Queue\ShouldBeUnique;

test('ConvertLessonVideo implements ShouldBeUnique', function () {
    $job = new ConvertLessonVideo(lessonTaskId: 1);

    expect($job)->toBeInstanceOf(ShouldBeUnique::class);
});

test('ConvertLessonVideo has correct uniqueId', function () {
    $job = new ConvertLessonVideo(lessonTaskId: 42);

    expect($job->uniqueId())->toBe(42);
});

test('ConvertLessonVideo has exponential backoff', function () {
    $job = new ConvertLessonVideo(lessonTaskId: 1);

    expect($job->backoff())->toBe([30, 120]);
});

test('ConvertLessonVideo has correct tries and timeout', function () {
    $job = new ConvertLessonVideo(lessonTaskId: 1);

    expect($job->tries)->toBe(2)
        ->and($job->timeout)->toBe(300);
});

test('ConvertLessonDocument implements ShouldBeUnique', function () {
    $job = new ConvertLessonDocument(storedPath: 'docs/test.pdf', lessonId: 1);

    expect($job)->toBeInstanceOf(ShouldBeUnique::class);
});

test('ConvertLessonDocument has correct uniqueId', function () {
    $job = new ConvertLessonDocument(storedPath: 'docs/test.pdf', lessonId: 5);

    expect($job->uniqueId())->toBe('5:docs/test.pdf');
});

test('ConvertLessonDocument has exponential backoff', function () {
    $job = new ConvertLessonDocument(storedPath: 'docs/test.pdf', lessonId: 1);

    expect($job->backoff())->toBe([10, 60]);
});

test('ConvertLessonDocument has correct tries and timeout', function () {
    $job = new ConvertLessonDocument(storedPath: 'docs/test.pdf', lessonId: 1);

    expect($job->tries)->toBe(3)
        ->and($job->timeout)->toBe(120);
});
