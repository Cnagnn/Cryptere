<?php

use App\Models\AssessmentQuestion;
use App\Services\RubricScoringService;

beforeEach(function () {
    $this->service = new RubricScoringService;
});

test('validates rubric scores correctly', function () {
    $question = Mockery::mock(AssessmentQuestion::class);
    $question->shouldReceive('getRubricCriteria')->andReturn([
        ['name' => 'Accuracy', 'max_points' => 10],
        ['name' => 'Clarity', 'max_points' => 5],
    ]);

    $scores = [
        'Accuracy' => ['score' => 8],
        'Clarity' => ['score' => 4],
    ];

    $result = $this->service->validateRubricScores($question, $scores);

    expect($result['valid'])->toBeTrue()
        ->and($result['errors'])->toBeEmpty();
});

test('detects missing criterion score', function () {
    $question = Mockery::mock(AssessmentQuestion::class);
    $question->shouldReceive('getRubricCriteria')->andReturn([
        ['name' => 'Accuracy', 'max_points' => 10],
        ['name' => 'Clarity', 'max_points' => 5],
    ]);

    $scores = [
        'Accuracy' => ['score' => 8],
    ];

    $result = $this->service->validateRubricScores($question, $scores);

    expect($result['valid'])->toBeFalse()
        ->and($result['errors'])->toContain('Missing score for criterion: Clarity');
});

test('detects unknown criterion', function () {
    $question = Mockery::mock(AssessmentQuestion::class);
    $question->shouldReceive('getRubricCriteria')->andReturn([
        ['name' => 'Accuracy', 'max_points' => 10],
    ]);

    $scores = [
        'Accuracy' => ['score' => 8],
        'Unknown' => ['score' => 5],
    ];

    $result = $this->service->validateRubricScores($question, $scores);

    expect($result['valid'])->toBeFalse()
        ->and($result['errors'])->toContain('Unknown criterion: Unknown');
});

test('detects score exceeding maximum', function () {
    $question = Mockery::mock(AssessmentQuestion::class);
    $question->shouldReceive('getRubricCriteria')->andReturn([
        ['name' => 'Accuracy', 'max_points' => 10],
    ]);

    $scores = [
        'Accuracy' => ['score' => 15],
    ];

    $result = $this->service->validateRubricScores($question, $scores);

    expect($result['valid'])->toBeFalse()
        ->and($result['errors'][0])->toContain('exceeds maximum');
});

test('detects negative score', function () {
    $question = Mockery::mock(AssessmentQuestion::class);
    $question->shouldReceive('getRubricCriteria')->andReturn([
        ['name' => 'Accuracy', 'max_points' => 10],
    ]);

    $scores = [
        'Accuracy' => ['score' => -1],
    ];

    $result = $this->service->validateRubricScores($question, $scores);

    expect($result['valid'])->toBeFalse()
        ->and($result['errors'][0])->toContain('cannot be negative');
});

test('returns invalid when question has no rubric', function () {
    $question = Mockery::mock(AssessmentQuestion::class);
    $question->shouldReceive('getRubricCriteria')->andReturn([]);

    $result = $this->service->validateRubricScores($question, []);

    expect($result['valid'])->toBeFalse()
        ->and($result['errors'])->toContain('Question has no rubric defined.');
});

test('calculates total from rubric scores', function () {
    $scores = [
        'Accuracy' => ['score' => 8, 'feedback' => 'Good'],
        'Clarity' => ['score' => 4],
        'Depth' => ['score' => 3],
    ];

    expect($this->service->calculateTotalFromRubric($scores))->toBe(15);
});

test('generates C2 understand rubric', function () {
    $rubric = $this->service->generateDefaultRubric('C2', 'essay', 20);

    expect($rubric)->toHaveKey('criteria')
        ->and($rubric['criteria'])->toHaveCount(2)
        ->and($rubric['criteria'][0]['name'])->toBe('Accuracy')
        ->and($rubric['criteria'][1]['name'])->toBe('Clarity');
});

test('generates C4 analyze rubric', function () {
    $rubric = $this->service->generateDefaultRubric('C4', 'essay', 30);

    expect($rubric['criteria'])->toHaveCount(3)
        ->and($rubric['criteria'][0]['name'])->toBe('Identification')
        ->and($rubric['criteria'][1]['name'])->toBe('Analysis Depth')
        ->and($rubric['criteria'][2]['name'])->toBe('Evidence & Reasoning');
});

test('generates C6 create rubric', function () {
    $rubric = $this->service->generateDefaultRubric('C6', 'essay', 50);

    expect($rubric['criteria'])->toHaveCount(5)
        ->and($rubric['criteria'][0]['name'])->toBe('Completeness');
});

test('generates generic rubric for unknown bloom level', function () {
    $rubric = $this->service->generateDefaultRubric('C1', 'multiple_choice', 10);

    expect($rubric['criteria'])->toHaveCount(2)
        ->and($rubric['criteria'][0]['name'])->toBe('Content Quality')
        ->and($rubric['criteria'][1]['name'])->toBe('Communication');
});
