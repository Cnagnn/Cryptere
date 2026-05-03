/**
 * Content Parser Unit Tests
 *
 * Tests for the parseContentWithChecks function that extracts
 * inline knowledge check blocks from Markdown content.
 *
 * @see resources/js/lib/content-parser.ts
 */
import { describe, it, expect } from 'vitest';
import { parseContentWithChecks } from '../content-parser';
import type {
    ContentSegment,
    CheckSegment,
    MarkdownSegment,
} from '../content-parser';

describe('parseContentWithChecks', () => {
    // ─── Basic Parsing ──────────────────────────────────────────────────────

    it('returns empty array for empty string', () => {
        expect(parseContentWithChecks('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
        expect(parseContentWithChecks('   \n\n  ')).toEqual([]);
    });

    it('returns single markdown segment for content without checks', () => {
        const content = '# Hello World\n\nThis is a paragraph.';
        const result = parseContentWithChecks(content);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('markdown');
        expect((result[0] as MarkdownSegment).content).toBe(content);
    });

    it('parses a single MCQ check block', () => {
        const content = `# Section

Some content here.

:::check
question: What is 2 + 2?
type: mcq
options: ["3", "4", "5", "6"]
answer: 1
hint: It's an even number.
:::

More content after.`;

        const result = parseContentWithChecks(content);

        expect(result).toHaveLength(3);
        expect(result[0].type).toBe('markdown');
        expect(result[1].type).toBe('check');
        expect(result[2].type).toBe('markdown');

        const check = result[1] as CheckSegment;
        expect(check.question).toBe('What is 2 + 2?');
        expect(check.checkType).toBe('mcq');
        expect(check.options).toEqual(['3', '4', '5', '6']);
        expect(check.answer).toBe(1);
        expect(check.hint).toBe("It's an even number.");
    });

    it('parses a true_false check block', () => {
        const content = `Some text.

:::check
question: The sky is blue.
type: true_false
answer: 0
hint: Look outside!
:::

More text.`;

        const result = parseContentWithChecks(content);
        const check = result[1] as CheckSegment;

        expect(check.checkType).toBe('true_false');
        expect(check.question).toBe('The sky is blue.');
        expect(check.answer).toBe(0);
        expect(check.options).toBeUndefined();
    });

    it('parses a fill_blank check block', () => {
        const content = `Introduction.

:::check
question: What does CPU stand for?
type: fill_blank
answer: Central Processing Unit
hint: It's the brain of the computer.
:::

Conclusion.`;

        const result = parseContentWithChecks(content);
        const check = result[1] as CheckSegment;

        expect(check.checkType).toBe('fill_blank');
        expect(check.question).toBe('What does CPU stand for?');
        expect(check.answer).toBe('Central Processing Unit');
        expect(check.options).toBeUndefined();
    });

    // ─── Multiple Checks ────────────────────────────────────────────────────

    it('parses multiple check blocks', () => {
        const content = `# Lesson

Section 1 content.

:::check
question: Question 1?
type: mcq
options: ["A", "B", "C", "D"]
answer: 0
hint: Hint 1.
:::

Section 2 content.

:::check
question: Question 2?
type: true_false
answer: 1
hint: Hint 2.
:::

Section 3 content.

:::check
question: Question 3?
type: fill_blank
answer: Answer3
hint: Hint 3.
:::

Final section.`;

        const result = parseContentWithChecks(content);

        // Should be: md, check, md, check, md, check, md = 7 segments
        expect(result).toHaveLength(7);
        expect(result[0].type).toBe('markdown');
        expect(result[1].type).toBe('check');
        expect(result[2].type).toBe('markdown');
        expect(result[3].type).toBe('check');
        expect(result[4].type).toBe('markdown');
        expect(result[5].type).toBe('check');
        expect(result[6].type).toBe('markdown');

        expect((result[1] as CheckSegment).question).toBe('Question 1?');
        expect((result[3] as CheckSegment).question).toBe('Question 2?');
        expect((result[5] as CheckSegment).question).toBe('Question 3?');
    });

    // ─── Edge Cases ─────────────────────────────────────────────────────────

    it('handles check block at the very start of content', () => {
        const content = `:::check
question: First question?
type: mcq
options: ["A", "B", "C", "D"]
answer: 2
hint: A hint.
:::

Content after.`;

        const result = parseContentWithChecks(content);

        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('check');
        expect(result[1].type).toBe('markdown');
    });

    it('handles check block at the very end of content', () => {
        const content = `Content before.

:::check
question: Last question?
type: true_false
answer: 0
hint: A hint.
:::`;

        const result = parseContentWithChecks(content);

        expect(result).toHaveLength(2);
        expect(result[0].type).toBe('markdown');
        expect(result[1].type).toBe('check');
    });

    it('handles consecutive check blocks without markdown between them', () => {
        const content = `:::check
question: Question 1?
type: mcq
options: ["A", "B", "C", "D"]
answer: 0
hint: Hint 1.
:::
:::check
question: Question 2?
type: true_false
answer: 1
hint: Hint 2.
:::`;

        const result = parseContentWithChecks(content);

        // Both checks should be parsed
        const checks = result.filter((s) => s.type === 'check');
        expect(checks).toHaveLength(2);
        expect((checks[0] as CheckSegment).question).toBe('Question 1?');
        expect((checks[1] as CheckSegment).question).toBe('Question 2?');
    });

    it('handles content that is only a check block', () => {
        const content = `:::check
question: Solo question?
type: fill_blank
answer: Solo
hint: Just one.
:::`;

        const result = parseContentWithChecks(content);

        expect(result).toHaveLength(1);
        expect(result[0].type).toBe('check');
        expect((result[0] as CheckSegment).question).toBe('Solo question?');
    });

    // ─── Malformed Input ────────────────────────────────────────────────────

    it('ignores check blocks without a question', () => {
        const content = `Before.

:::check
type: mcq
options: ["A", "B"]
answer: 0
hint: No question here.
:::

After.`;

        const result = parseContentWithChecks(content);

        // The malformed check block should be skipped
        const checks = result.filter((s) => s.type === 'check');
        expect(checks).toHaveLength(0);
    });

    it('defaults to mcq type when type is missing', () => {
        const content = `:::check
question: What type am I?
options: ["A", "B", "C", "D"]
answer: 0
hint: Default type.
:::`;

        const result = parseContentWithChecks(content);
        const check = result[0] as CheckSegment;

        expect(check.checkType).toBe('mcq');
    });

    it('handles options with single quotes in JSON', () => {
        const content = `:::check
question: Pick one.
type: mcq
options: ["It's A", "B's choice", "C", "D"]
answer: 0
hint: A hint.
:::`;

        const result = parseContentWithChecks(content);
        const check = result[0] as CheckSegment;

        expect(check.options).toHaveLength(4);
        expect(check.options![0]).toBe("It's A");
    });

    // ─── Answer Type Handling ───────────────────────────────────────────────

    it('parses numeric answers correctly', () => {
        const content = `:::check
question: Pick the right one.
type: mcq
options: ["A", "B", "C", "D"]
answer: 3
hint: Last one.
:::`;

        const result = parseContentWithChecks(content);
        const check = result[0] as CheckSegment;

        expect(check.answer).toBe(3);
        expect(typeof check.answer).toBe('number');
    });

    it('parses string answers correctly for fill_blank', () => {
        const content = `:::check
question: What color is the sky?
type: fill_blank
answer: blue
hint: Look up.
:::`;

        const result = parseContentWithChecks(content);
        const check = result[0] as CheckSegment;

        expect(check.answer).toBe('blue');
        expect(typeof check.answer).toBe('string');
    });

    // ─── Real-World Content ─────────────────────────────────────────────────

    it('correctly parses content similar to actual lesson content', () => {
        const content = `# Why Cryptography Matters

## Introduction

Cryptography is the science and art of securing communication.

## The Digital Age Challenge

We live in an era where data is the new currency.

:::check
question: What does the 'C' in CIA triad stand for?
type: mcq
options: ["Cryptography", "Confidentiality", "Certification", "Compliance"]
answer: 1
hint: It's about keeping data secret from unauthorized parties.
:::

## Key Cryptographic Concepts

### Plaintext and Ciphertext

- **Plaintext**: The original, readable data
- **Ciphertext**: The encrypted, unreadable output

:::check
question: Encryption converts plaintext into ciphertext.
type: true_false
answer: 0
hint: Think about what encryption does to readable data.
:::

## Summary

Cryptography protects data in transit and at rest.`;

        const result = parseContentWithChecks(content);

        expect(result).toHaveLength(5);

        // First markdown segment
        expect(result[0].type).toBe('markdown');
        expect((result[0] as MarkdownSegment).content).toContain(
            '# Why Cryptography Matters',
        );
        expect((result[0] as MarkdownSegment).content).toContain(
            'data is the new currency',
        );

        // First check
        expect(result[1].type).toBe('check');
        expect((result[1] as CheckSegment).question).toBe(
            "What does the 'C' in CIA triad stand for?",
        );
        expect((result[1] as CheckSegment).checkType).toBe('mcq');
        expect((result[1] as CheckSegment).options).toEqual([
            'Cryptography',
            'Confidentiality',
            'Certification',
            'Compliance',
        ]);
        expect((result[1] as CheckSegment).answer).toBe(1);

        // Middle markdown
        expect(result[2].type).toBe('markdown');
        expect((result[2] as MarkdownSegment).content).toContain(
            'Plaintext and Ciphertext',
        );

        // Second check
        expect(result[3].type).toBe('check');
        expect((result[3] as CheckSegment).checkType).toBe('true_false');
        expect((result[3] as CheckSegment).answer).toBe(0);

        // Final markdown
        expect(result[4].type).toBe('markdown');
        expect((result[4] as MarkdownSegment).content).toContain('Summary');
    });

    it('preserves markdown content including code blocks', () => {
        const content = `## Code Example

\`\`\`python
def hello():
    print("Hello")
\`\`\`

:::check
question: What does the function print?
type: fill_blank
answer: Hello
hint: Look at the print statement.
:::

## Next Section`;

        const result = parseContentWithChecks(content);

        expect(result).toHaveLength(3);
        expect((result[0] as MarkdownSegment).content).toContain('```python');
        expect((result[0] as MarkdownSegment).content).toContain('def hello()');
    });
});
