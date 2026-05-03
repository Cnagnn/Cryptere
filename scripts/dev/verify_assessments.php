<?php

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Assessment;
use App\Models\AssessmentQuestion;

$assessments = Assessment::withCount('questions')->orderBy('bloom_level')->get();

echo "=== Assessments Seeded ===" . PHP_EOL;
foreach ($assessments as $a) {
    echo sprintf(
        "  %s | %-45s | %d questions | %s",
        $a->bloom_level,
        $a->title,
        $a->questions_count,
        $a->grading_type
    ) . PHP_EOL;
}

echo PHP_EOL;
echo "Total: {$assessments->count()} assessments, " . AssessmentQuestion::count() . " questions" . PHP_EOL;
echo "Published: " . Assessment::where('is_published', true)->count() . PHP_EOL;
