<?php

use App\Models\ChallengeQuestion;
use Tests\TestCase;

uses(TestCase::class);

// ============================================================
// isCorrect — Positive Scenarios
// ============================================================

test('exact match is correct', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'AES';

    expect($question->isCorrect('AES'))->toBeTrue();
});

test('case insensitive match is correct', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'AES';

    expect($question->isCorrect('aes'))->toBeTrue();
    expect($question->isCorrect('Aes'))->toBeTrue();
    expect($question->isCorrect('aES'))->toBeTrue();
});

test('match with extra whitespace is correct', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'AES';

    expect($question->isCorrect('  AES  '))->toBeTrue();
    expect($question->isCorrect(' aes '))->toBeTrue();
});

test('match with internal whitespace squished', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'public key';

    expect($question->isCorrect('public   key'))->toBeTrue();
    expect($question->isCorrect('PUBLIC  KEY'))->toBeTrue();
});

// ============================================================
// isCorrect — Negative Scenarios
// ============================================================

test('wrong answer is incorrect', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'AES';

    expect($question->isCorrect('RSA'))->toBeFalse();
});

test('empty answer is incorrect', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'AES';

    expect($question->isCorrect(''))->toBeFalse();
});

test('partial match is incorrect', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'AES';

    expect($question->isCorrect('AE'))->toBeFalse();
    expect($question->isCorrect('AESS'))->toBeFalse();
});

test('answer with extra words is incorrect', function () {
    $question = new ChallengeQuestion;
    $question->correct_answer = 'AES';

    expect($question->isCorrect('AES encryption'))->toBeFalse();
});

// ============================================================
// Constants
// ============================================================

test('question types are defined correctly', function () {
    expect(ChallengeQuestion::TYPE_MCQ)->toBe('mcq')
        ->and(ChallengeQuestion::TYPE_TRUE_FALSE)->toBe('true_false')
        ->and(ChallengeQuestion::TYPE_TEXT)->toBe('text')
        ->and(ChallengeQuestion::TYPE_FILL_BLANK)->toBe('fill_blank');
});

test('TYPES array contains all types', function () {
    expect(ChallengeQuestion::TYPES)->toBe([
        'mcq',
        'true_false',
        'text',
        'fill_blank',
    ]);
});

// ============================================================
// Casts
// ============================================================

test('options cast to array when set as array', function () {
    $question = new ChallengeQuestion;
    $question->options = ['A', 'B', 'C', 'D'];

    expect($question->options)->toBeArray()
        ->and($question->options)->toBe(['A', 'B', 'C', 'D']);
});

test('sort_order cast to integer', function () {
    $question = new ChallengeQuestion;
    $question->sort_order = '5';

    expect($question->sort_order)->toBeInt()
        ->and($question->sort_order)->toBe(5);
});
