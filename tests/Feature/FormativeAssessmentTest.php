<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Formative Assessment Tests
 *
 * Tests that inline knowledge check content is properly embedded
 * in lesson content files and follows the expected format.
 */
class FormativeAssessmentTest extends TestCase
{
    /**
     * All course content files that should contain inline checks.
     */
    private function getContentFiles(): array
    {
        return [
            'course1-crypto-foundations',
            'course2-classical-ciphers',
            'course3-modern-crypto',
            'course4-blockchain-crypto',
            'course5-network-security',
            'course6-post-quantum',
        ];
    }

    /**
     * Load content from a course content file.
     */
    private function loadCourseContent(string $filename): array
    {
        $path = database_path("seeders/content/{$filename}.php");
        $this->assertFileExists($path, "Content file {$filename}.php should exist");

        return require $path;
    }

    /**
     * Extract all :::check blocks from a markdown string.
     */
    private function extractCheckBlocks(string $markdown): array
    {
        preg_match_all('/:::check\s*\n([\s\S]*?):::/', $markdown, $matches);

        return $matches[1] ?? [];
    }

    /**
     * Parse a single check block into its components.
     */
    private function parseCheckBlock(string $block): array
    {
        $result = [];
        $lines = explode("\n", trim($block));

        foreach ($lines as $line) {
            $line = trim($line);
            if (str_starts_with($line, 'question:')) {
                $result['question'] = trim(substr($line, strlen('question:')));
            } elseif (str_starts_with($line, 'type:')) {
                $result['type'] = trim(substr($line, strlen('type:')));
            } elseif (str_starts_with($line, 'options:')) {
                $result['options'] = trim(substr($line, strlen('options:')));
            } elseif (str_starts_with($line, 'answer:')) {
                $result['answer'] = trim(substr($line, strlen('answer:')));
            } elseif (str_starts_with($line, 'hint:')) {
                $result['hint'] = trim(substr($line, strlen('hint:')));
            }
        }

        return $result;
    }

    // ─── Content File Tests ─────────────────────────────────────────────────

    public function test_all_content_files_exist(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $path = database_path("seeders/content/{$file}.php");
            $this->assertFileExists($path, "Content file {$file}.php should exist");
        }
    }

    public function test_all_content_files_return_arrays(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $content = $this->loadCourseContent($file);
            $this->assertIsArray($content, "{$file} should return an array");
            $this->assertNotEmpty($content, "{$file} should not be empty");
        }
    }

    // ─── Inline Check Presence Tests ────────────────────────────────────────

    public function test_each_lesson_has_inline_checks(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $slug => $lesson) {
                $this->assertArrayHasKey('content', $lesson, "Lesson {$slug} in {$file} should have content");

                $checks = $this->extractCheckBlocks($lesson['content']);
                $this->assertGreaterThanOrEqual(
                    2,
                    count($checks),
                    "Lesson '{$slug}' in {$file} should have at least 2 inline checks, found " . count($checks)
                );
                $this->assertLessThanOrEqual(
                    4,
                    count($checks),
                    "Lesson '{$slug}' in {$file} should have at most 4 inline checks, found " . count($checks)
                );
            }
        }
    }

    public function test_total_inline_checks_across_all_courses(): void
    {
        $totalChecks = 0;

        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $lesson) {
                $checks = $this->extractCheckBlocks($lesson['content']);
                $totalChecks += count($checks);
            }
        }

        // Should have approximately 50-60 checks total
        $this->assertGreaterThanOrEqual(40, $totalChecks, "Should have at least 40 total inline checks");
        $this->assertLessThanOrEqual(80, $totalChecks, "Should have at most 80 total inline checks");
    }

    // ─── Check Block Format Tests ───────────────────────────────────────────

    public function test_all_check_blocks_have_required_fields(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $slug => $lesson) {
                $blocks = $this->extractCheckBlocks($lesson['content']);

                foreach ($blocks as $index => $block) {
                    $parsed = $this->parseCheckBlock($block);

                    $this->assertArrayHasKey(
                        'question',
                        $parsed,
                        "Check block #{$index} in '{$slug}' ({$file}) must have a question"
                    );
                    $this->assertNotEmpty(
                        $parsed['question'],
                        "Check block #{$index} in '{$slug}' ({$file}) question must not be empty"
                    );

                    $this->assertArrayHasKey(
                        'type',
                        $parsed,
                        "Check block #{$index} in '{$slug}' ({$file}) must have a type"
                    );
                    $this->assertContains(
                        $parsed['type'],
                        ['mcq', 'true_false', 'fill_blank'],
                        "Check block #{$index} in '{$slug}' ({$file}) type must be mcq, true_false, or fill_blank"
                    );

                    $this->assertArrayHasKey(
                        'answer',
                        $parsed,
                        "Check block #{$index} in '{$slug}' ({$file}) must have an answer"
                    );

                    $this->assertArrayHasKey(
                        'hint',
                        $parsed,
                        "Check block #{$index} in '{$slug}' ({$file}) must have a hint"
                    );
                    $this->assertNotEmpty(
                        $parsed['hint'],
                        "Check block #{$index} in '{$slug}' ({$file}) hint must not be empty"
                    );
                }
            }
        }
    }

    public function test_mcq_checks_have_options(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $slug => $lesson) {
                $blocks = $this->extractCheckBlocks($lesson['content']);

                foreach ($blocks as $index => $block) {
                    $parsed = $this->parseCheckBlock($block);

                    if (($parsed['type'] ?? '') === 'mcq') {
                        $this->assertArrayHasKey(
                            'options',
                            $parsed,
                            "MCQ check #{$index} in '{$slug}' ({$file}) must have options"
                        );

                        $options = json_decode($parsed['options'], true);
                        $this->assertIsArray(
                            $options,
                            "MCQ check #{$index} in '{$slug}' ({$file}) options must be valid JSON array"
                        );
                        $this->assertGreaterThanOrEqual(
                            2,
                            count($options),
                            "MCQ check #{$index} in '{$slug}' ({$file}) must have at least 2 options"
                        );
                    }
                }
            }
        }
    }

    public function test_true_false_checks_have_valid_answers(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $slug => $lesson) {
                $blocks = $this->extractCheckBlocks($lesson['content']);

                foreach ($blocks as $index => $block) {
                    $parsed = $this->parseCheckBlock($block);

                    if (($parsed['type'] ?? '') === 'true_false') {
                        $this->assertContains(
                            $parsed['answer'],
                            ['0', '1'],
                            "True/false check #{$index} in '{$slug}' ({$file}) answer must be 0 or 1"
                        );
                    }
                }
            }
        }
    }

    public function test_mcq_answers_are_valid_indices(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $slug => $lesson) {
                $blocks = $this->extractCheckBlocks($lesson['content']);

                foreach ($blocks as $index => $block) {
                    $parsed = $this->parseCheckBlock($block);

                    if (($parsed['type'] ?? '') === 'mcq' && isset($parsed['options'])) {
                        $options = json_decode($parsed['options'], true);
                        $answer = (int) $parsed['answer'];

                        if (is_array($options)) {
                            $this->assertGreaterThanOrEqual(
                                0,
                                $answer,
                                "MCQ answer index must be >= 0 in '{$slug}' ({$file})"
                            );
                            $this->assertLessThan(
                                count($options),
                                $answer,
                                "MCQ answer index must be < number of options in '{$slug}' ({$file})"
                            );
                        }
                    }
                }
            }
        }
    }

    // ─── Check Block Syntax Tests ───────────────────────────────────────────

    public function test_check_blocks_are_properly_closed(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $slug => $lesson) {
                $content = $lesson['content'];

                $openCount = substr_count($content, ':::check');
                $closeCount = substr_count($content, ':::') - $openCount;

                // Each :::check should have a matching :::
                $this->assertGreaterThanOrEqual(
                    $openCount,
                    $closeCount,
                    "All :::check blocks in '{$slug}' ({$file}) should have matching closing :::"
                );
            }
        }
    }

    public function test_check_blocks_do_not_interfere_with_markdown(): void
    {
        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $slug => $lesson) {
                $content = $lesson['content'];

                // Remove check blocks and verify remaining content is valid markdown
                $cleanContent = preg_replace('/:::check\s*\n[\s\S]*?:::/', '', $content);

                // Should still have meaningful content
                $this->assertNotEmpty(
                    trim($cleanContent),
                    "Lesson '{$slug}' in {$file} should have content outside of check blocks"
                );

                // Should still have headings
                $this->assertMatchesRegularExpression(
                    '/^#+ /m',
                    $cleanContent,
                    "Lesson '{$slug}' in {$file} should have markdown headings outside check blocks"
                );
            }
        }
    }

    // ─── Variety Tests ──────────────────────────────────────────────────────

    public function test_check_types_have_variety(): void
    {
        $typeCounts = ['mcq' => 0, 'true_false' => 0, 'fill_blank' => 0];

        foreach ($this->getContentFiles() as $file) {
            $lessons = $this->loadCourseContent($file);

            foreach ($lessons as $lesson) {
                $blocks = $this->extractCheckBlocks($lesson['content']);

                foreach ($blocks as $block) {
                    $parsed = $this->parseCheckBlock($block);
                    $type = $parsed['type'] ?? 'unknown';
                    if (isset($typeCounts[$type])) {
                        $typeCounts[$type]++;
                    }
                }
            }
        }

        // Should have at least some of each type
        $this->assertGreaterThan(0, $typeCounts['mcq'], 'Should have at least one MCQ check');
        $this->assertGreaterThan(0, $typeCounts['true_false'], 'Should have at least one true/false check');
        $this->assertGreaterThan(0, $typeCounts['fill_blank'], 'Should have at least one fill_blank check');
    }
}
