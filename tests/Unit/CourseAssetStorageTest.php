<?php

use App\Support\CourseAssetStorage;

test('it resolves legacy public storage urls', function (): void {
    $storage = app(CourseAssetStorage::class);

    expect($storage->pathFromUrl('/storage/lesson-documents/sample.pdf'))
        ->toBe('lesson-documents/sample.pdf');
});
