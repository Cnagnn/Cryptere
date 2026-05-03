<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require_once __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Courses ===" . PHP_EOL;
echo "Count: " . App\Models\Course::count() . PHP_EOL;
foreach (App\Models\Course::select('id', 'title')->get() as $c) {
    echo "  {$c->id}: {$c->title}" . PHP_EOL;
}

echo PHP_EOL . "=== Topics ===" . PHP_EOL;
echo "Count: " . App\Models\Topic::count() . PHP_EOL;
foreach (App\Models\Topic::select('id', 'name', 'course_id')->limit(15)->get() as $t) {
    echo "  {$t->id}: {$t->name} (course {$t->course_id})" . PHP_EOL;
}

echo PHP_EOL . "=== Assessments ===" . PHP_EOL;
echo "Count: " . App\Models\Assessment::count() . PHP_EOL;
