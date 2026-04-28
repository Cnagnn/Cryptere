<?php

use App\Models\Course;
use Illuminate\Support\Str;
use Tests\TestCase;

uses(TestCase::class);

test('course cover returns generated svg placeholder when no stored cover exists', function () {
    $course = Course::factory()->make([
        'title' => 'tes',
        'cover_path' => null,
    ]);

    $cover = $course->cover;

    expect($cover)->toStartWith('data:image/svg+xml;utf8,');

    $decodedSvg = urldecode(Str::after($cover, 'data:image/svg+xml;utf8,'));

    expect($decodedSvg)->toContain('<svg');
    expect($decodedSvg)->toContain('>T<');
});

test('course cover keeps storage url when cover path exists', function () {
    $course = Course::factory()->make([
        'cover_path' => 'course-covers/example-cover.png',
    ]);

    expect($course->cover)->toContain('/storage/course-covers/example-cover.png');
});
