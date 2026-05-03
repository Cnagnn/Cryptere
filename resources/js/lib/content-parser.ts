/**
 * Content Parser for Inline Knowledge Checks
 *
 * Parses lesson Markdown content that contains :::check blocks
 * and splits it into alternating markdown and check segments.
 *
 * Syntax:
 * :::check
 * question: What does the 'C' in CIA triad stand for?
 * type: mcq
 * options: ["Cryptography", "Confidentiality", "Certification", "Compliance"]
 * answer: 1
 * hint: It's about keeping data secret from unauthorized parties.
 * :::
 */

export type CheckType = 'mcq' | 'true_false' | 'fill_blank';

export type MarkdownSegment = {
    type: 'markdown';
    content: string;
};

export type CheckSegment = {
    type: 'check';
    question: string;
    checkType: CheckType;
    options?: string[];
    answer: number | string;
    hint: string;
};

export type ContentSegment = MarkdownSegment | CheckSegment;

/**
 * Parse a :::check block's inner content into a CheckSegment.
 */
function parseCheckBlock(block: string): CheckSegment | null {
    const lines = block.trim().split('\n');

    let question = '';
    let checkType: CheckType = 'mcq';
    let options: string[] | undefined;
    let answer: number | string = 0;
    let hint = '';

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.startsWith('question:')) {
            question = trimmed.slice('question:'.length).trim();
        } else if (trimmed.startsWith('type:')) {
            const typeValue = trimmed.slice('type:'.length).trim();

            if (
                typeValue === 'mcq' ||
                typeValue === 'true_false' ||
                typeValue === 'fill_blank'
            ) {
                checkType = typeValue;
            }
        } else if (trimmed.startsWith('options:')) {
            const optionsStr = trimmed.slice('options:'.length).trim();

            try {
                const parsed = JSON.parse(optionsStr);

                if (Array.isArray(parsed)) {
                    options = parsed;
                }
            } catch {
                // If JSON parse fails, try splitting by comma
                options = optionsStr
                    .replace(/^\[|\]$/g, '')
                    .split(',')
                    .map((s) => s.trim().replace(/^["']|["']$/g, ''));
            }
        } else if (trimmed.startsWith('answer:')) {
            const answerStr = trimmed.slice('answer:'.length).trim();
            const numAnswer = Number(answerStr);
            answer = isNaN(numAnswer) ? answerStr : numAnswer;
        } else if (trimmed.startsWith('hint:')) {
            hint = trimmed.slice('hint:'.length).trim();
        }
    }

    if (!question) {
        return null;
    }

    return {
        type: 'check',
        question,
        checkType,
        options,
        answer,
        hint,
    };
}

/**
 * Parse Markdown content with embedded :::check blocks into segments.
 *
 * @param markdown - The raw markdown string potentially containing :::check blocks
 * @returns An array of ContentSegment objects (markdown and check segments)
 */
export function parseContentWithChecks(markdown: string): ContentSegment[] {
    if (!markdown || markdown.trim() === '') {
        return [];
    }

    const segments: ContentSegment[] = [];

    // Regex to match :::check ... ::: blocks
    // Uses non-greedy match to handle multiple blocks
    const checkBlockRegex = /:::check\s*\n([\s\S]*?):::/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = checkBlockRegex.exec(markdown)) !== null) {
        // Add markdown segment before this check block
        const beforeContent = markdown.slice(lastIndex, match.index);

        if (beforeContent.trim()) {
            segments.push({
                type: 'markdown',
                content: beforeContent,
            });
        }

        // Parse the check block
        const checkSegment = parseCheckBlock(match[1]);

        if (checkSegment) {
            segments.push(checkSegment);
        }

        lastIndex = match.index + match[0].length;
    }

    // Add remaining markdown after the last check block
    const remaining = markdown.slice(lastIndex);

    if (remaining.trim()) {
        segments.push({
            type: 'markdown',
            content: remaining,
        });
    }

    // If no check blocks were found, return the entire content as a single markdown segment
    if (segments.length === 0 && markdown.trim()) {
        segments.push({
            type: 'markdown',
            content: markdown,
        });
    }

    return segments;
}
