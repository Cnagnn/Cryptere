import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function readSource(path: string): string {
    return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('courses catalog pagination', () => {
    it('shows six cards per page for both course and labs catalog', () => {
        const source = readSource('resources/js/pages/courses/index.tsx');

        expect(source).toContain('const COURSES_PER_PAGE = 6;');
    });
});
