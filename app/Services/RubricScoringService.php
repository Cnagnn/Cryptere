<?php

namespace App\Services;

use App\Models\AssessmentQuestion;

class RubricScoringService
{
    /**
     * Validate rubric scores against the question's rubric definition.
     *
     * @param  array<string, array{score: int, feedback?: string}>  $rubricScores
     * @return array{valid: bool, errors: array<string>}
     */
    public function validateRubricScores(AssessmentQuestion $question, array $rubricScores): array
    {
        $errors = [];
        $criteria = $question->getRubricCriteria();

        if (empty($criteria)) {
            return ['valid' => false, 'errors' => ['Question has no rubric defined.']];
        }

        $criteriaNames = collect($criteria)->pluck('name')->all();

        // Check all criteria are scored
        foreach ($criteriaNames as $name) {
            if (! isset($rubricScores[$name])) {
                $errors[] = "Missing score for criterion: {$name}";
            }
        }

        // Check scores are within valid range
        foreach ($rubricScores as $name => $scoreData) {
            if (! in_array($name, $criteriaNames)) {
                $errors[] = "Unknown criterion: {$name}";

                continue;
            }

            $criterion = collect($criteria)->firstWhere('name', $name);
            $maxPoints = $criterion['max_points'] ?? 0;
            $score = $scoreData['score'] ?? 0;

            if ($score < 0) {
                $errors[] = "Score for '{$name}' cannot be negative.";
            }

            if ($score > $maxPoints) {
                $errors[] = "Score for '{$name}' exceeds maximum ({$score} > {$maxPoints}).";
            }
        }

        return ['valid' => empty($errors), 'errors' => $errors];
    }

    /**
     * Calculate total points from rubric scores.
     *
     * @param  array<string, array{score: int, feedback?: string}>  $rubricScores
     */
    public function calculateTotalFromRubric(array $rubricScores): int
    {
        return collect($rubricScores)->sum(fn (array $data) => $data['score'] ?? 0);
    }

    /**
     * Generate a default rubric template for a given Bloom level and question type.
     *
     * @return array{criteria: array<int, array{name: string, description: string, max_points: int, levels: array}>}
     */
    public function generateDefaultRubric(string $bloomLevel, string $questionType, int $totalPoints): array
    {
        return match ($bloomLevel) {
            'C2' => $this->understandRubric($totalPoints),
            'C4' => $this->analyzeRubric($totalPoints),
            'C5' => $this->evaluateRubric($totalPoints),
            'C6' => $this->createRubric($totalPoints),
            default => $this->genericRubric($totalPoints),
        };
    }

    /**
     * C2 (Understand) rubric: explanation quality.
     */
    private function understandRubric(int $totalPoints): array
    {
        $half = (int) ceil($totalPoints / 2);
        $remainder = $totalPoints - $half;

        return [
            'criteria' => [
                [
                    'name' => 'Accuracy',
                    'description' => 'Correctness of the explanation and understanding of the concept.',
                    'max_points' => $half,
                    'levels' => [
                        ['score' => $half, 'description' => 'Fully accurate explanation with correct terminology.'],
                        ['score' => (int) ceil($half * 0.7), 'description' => 'Mostly accurate with minor errors.'],
                        ['score' => (int) ceil($half * 0.4), 'description' => 'Partially correct but significant gaps.'],
                        ['score' => 0, 'description' => 'Incorrect or irrelevant explanation.'],
                    ],
                ],
                [
                    'name' => 'Clarity',
                    'description' => 'Clear communication using own words (not copied from source).',
                    'max_points' => $remainder,
                    'levels' => [
                        ['score' => $remainder, 'description' => 'Clear, well-structured explanation in own words.'],
                        ['score' => (int) ceil($remainder * 0.7), 'description' => 'Mostly clear with some awkward phrasing.'],
                        ['score' => (int) ceil($remainder * 0.4), 'description' => 'Unclear or appears copied from source.'],
                        ['score' => 0, 'description' => 'Incomprehensible or entirely copied.'],
                    ],
                ],
            ],
        ];
    }

    /**
     * C4 (Analyze) rubric: case study analysis.
     */
    private function analyzeRubric(int $totalPoints): array
    {
        $third = (int) ceil($totalPoints / 3);
        $remainder = $totalPoints - ($third * 2);

        return [
            'criteria' => [
                [
                    'name' => 'Identification',
                    'description' => 'Correctly identifies key components, vulnerabilities, or patterns.',
                    'max_points' => $third,
                    'levels' => [
                        ['score' => $third, 'description' => 'All key elements correctly identified.'],
                        ['score' => (int) ceil($third * 0.7), 'description' => 'Most elements identified.'],
                        ['score' => (int) ceil($third * 0.4), 'description' => 'Some elements identified.'],
                        ['score' => 0, 'description' => 'Failed to identify relevant elements.'],
                    ],
                ],
                [
                    'name' => 'Analysis Depth',
                    'description' => 'Depth of analysis showing relationships and implications.',
                    'max_points' => $third,
                    'levels' => [
                        ['score' => $third, 'description' => 'Deep analysis with clear cause-effect relationships.'],
                        ['score' => (int) ceil($third * 0.7), 'description' => 'Adequate analysis with some depth.'],
                        ['score' => (int) ceil($third * 0.4), 'description' => 'Superficial analysis.'],
                        ['score' => 0, 'description' => 'No meaningful analysis.'],
                    ],
                ],
                [
                    'name' => 'Evidence & Reasoning',
                    'description' => 'Use of evidence and logical reasoning to support analysis.',
                    'max_points' => $remainder,
                    'levels' => [
                        ['score' => $remainder, 'description' => 'Strong evidence-based reasoning throughout.'],
                        ['score' => (int) ceil($remainder * 0.7), 'description' => 'Some evidence provided.'],
                        ['score' => (int) ceil($remainder * 0.4), 'description' => 'Weak or missing evidence.'],
                        ['score' => 0, 'description' => 'No evidence or reasoning.'],
                    ],
                ],
            ],
        ];
    }

    /**
     * C5 (Evaluate) rubric: argumentative/critique.
     */
    private function evaluateRubric(int $totalPoints): array
    {
        $quarter = (int) ceil($totalPoints / 4);
        $remainder = $totalPoints - ($quarter * 3);

        return [
            'criteria' => [
                [
                    'name' => 'Position & Thesis',
                    'description' => 'Clear position or thesis statement with defined scope.',
                    'max_points' => $quarter,
                    'levels' => [
                        ['score' => $quarter, 'description' => 'Clear, well-defined position.'],
                        ['score' => (int) ceil($quarter * 0.5), 'description' => 'Position stated but unclear.'],
                        ['score' => 0, 'description' => 'No clear position.'],
                    ],
                ],
                [
                    'name' => 'Justification',
                    'description' => 'Quality of arguments and justification for the evaluation.',
                    'max_points' => $quarter,
                    'levels' => [
                        ['score' => $quarter, 'description' => 'Strong, well-reasoned justification.'],
                        ['score' => (int) ceil($quarter * 0.5), 'description' => 'Some justification provided.'],
                        ['score' => 0, 'description' => 'No justification.'],
                    ],
                ],
                [
                    'name' => 'Counter-arguments',
                    'description' => 'Consideration of alternative viewpoints or limitations.',
                    'max_points' => $quarter,
                    'levels' => [
                        ['score' => $quarter, 'description' => 'Thoughtfully addresses counter-arguments.'],
                        ['score' => (int) ceil($quarter * 0.5), 'description' => 'Mentions alternatives briefly.'],
                        ['score' => 0, 'description' => 'Ignores alternative viewpoints.'],
                    ],
                ],
                [
                    'name' => 'Technical Accuracy',
                    'description' => 'Correctness of technical claims and references.',
                    'max_points' => $remainder,
                    'levels' => [
                        ['score' => $remainder, 'description' => 'All technical claims are accurate.'],
                        ['score' => (int) ceil($remainder * 0.5), 'description' => 'Mostly accurate with minor errors.'],
                        ['score' => 0, 'description' => 'Significant technical errors.'],
                    ],
                ],
            ],
        ];
    }

    /**
     * C6 (Create) rubric: design document/proposal.
     */
    private function createRubric(int $totalPoints): array
    {
        $fifth = (int) ceil($totalPoints / 5);
        $remainder = $totalPoints - ($fifth * 4);

        return [
            'criteria' => [
                [
                    'name' => 'Completeness',
                    'description' => 'All required components are present in the design.',
                    'max_points' => $fifth,
                    'levels' => [
                        ['score' => $fifth, 'description' => 'All components present and well-defined.'],
                        ['score' => (int) ceil($fifth * 0.5), 'description' => 'Most components present.'],
                        ['score' => 0, 'description' => 'Major components missing.'],
                    ],
                ],
                [
                    'name' => 'Technical Soundness',
                    'description' => 'The design is technically feasible and secure.',
                    'max_points' => $fifth,
                    'levels' => [
                        ['score' => $fifth, 'description' => 'Technically sound and secure design.'],
                        ['score' => (int) ceil($fifth * 0.5), 'description' => 'Mostly sound with some issues.'],
                        ['score' => 0, 'description' => 'Fundamentally flawed design.'],
                    ],
                ],
                [
                    'name' => 'Originality',
                    'description' => 'Creative and original approach to the problem.',
                    'max_points' => $fifth,
                    'levels' => [
                        ['score' => $fifth, 'description' => 'Novel approach with creative solutions.'],
                        ['score' => (int) ceil($fifth * 0.5), 'description' => 'Standard approach with some creativity.'],
                        ['score' => 0, 'description' => 'No original thinking demonstrated.'],
                    ],
                ],
                [
                    'name' => 'Documentation',
                    'description' => 'Quality of documentation, diagrams, and explanations.',
                    'max_points' => $fifth,
                    'levels' => [
                        ['score' => $fifth, 'description' => 'Excellent documentation with clear diagrams.'],
                        ['score' => (int) ceil($fifth * 0.5), 'description' => 'Adequate documentation.'],
                        ['score' => 0, 'description' => 'Poor or missing documentation.'],
                    ],
                ],
                [
                    'name' => 'Integration',
                    'description' => 'Components work together coherently as a system.',
                    'max_points' => $remainder,
                    'levels' => [
                        ['score' => $remainder, 'description' => 'All components integrate seamlessly.'],
                        ['score' => (int) ceil($remainder * 0.5), 'description' => 'Mostly integrated.'],
                        ['score' => 0, 'description' => 'Components are disconnected.'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Generic rubric fallback.
     */
    private function genericRubric(int $totalPoints): array
    {
        $half = (int) ceil($totalPoints / 2);
        $remainder = $totalPoints - $half;

        return [
            'criteria' => [
                [
                    'name' => 'Content Quality',
                    'description' => 'Accuracy and relevance of the response.',
                    'max_points' => $half,
                    'levels' => [
                        ['score' => $half, 'description' => 'Excellent quality.'],
                        ['score' => (int) ceil($half * 0.7), 'description' => 'Good quality.'],
                        ['score' => (int) ceil($half * 0.4), 'description' => 'Acceptable quality.'],
                        ['score' => 0, 'description' => 'Poor quality.'],
                    ],
                ],
                [
                    'name' => 'Communication',
                    'description' => 'Clarity and organization of the response.',
                    'max_points' => $remainder,
                    'levels' => [
                        ['score' => $remainder, 'description' => 'Clear and well-organized.'],
                        ['score' => (int) ceil($remainder * 0.7), 'description' => 'Mostly clear.'],
                        ['score' => (int) ceil($remainder * 0.4), 'description' => 'Somewhat unclear.'],
                        ['score' => 0, 'description' => 'Unclear and disorganized.'],
                    ],
                ],
            ],
        ];
    }
}
