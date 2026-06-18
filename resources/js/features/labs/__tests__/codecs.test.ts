import { describe, it, expect } from 'vitest';
import { parseLabInput, renderLabOutput, LAB_FORMATS } from '../codecs';
import type { LabFormat } from '../types';

const ROUND_TRIP_FORMATS: LabFormat[] = [
    'hex', 'binary', 'base64', 'decimal-bytes',
];

describe('codecs — parseLabInput', () => {
    it('parses ASCII text directly', () => {
        const r = parseLabInput('Hello', 'ascii');
        expect(r.error).toBeNull();
        expect(r.bytes).toEqual([72, 101, 108, 108, 111]);
    });

    it('parses UTF-8 multibyte', () => {
        const r = parseLabInput('Halo', 'utf8');
        expect(r.error).toBeNull();
        expect(r.bytes).toEqual([72, 97, 108, 111]);
    });

    it('parses hex with spaces', () => {
        const r = parseLabInput('48 65 6C 6C 6F', 'hex');
        expect(r.error).toBeNull();
        expect(r.bytes).toEqual([72, 101, 108, 108, 111]);
    });

    it('parses hex without spaces', () => {
        const r = parseLabInput('48656C6C6F', 'hex');
        expect(r.error).toBeNull();
        expect(r.bytes).toEqual([72, 101, 108, 108, 111]);
    });

    it('rejects odd-length hex', () => {
        const r = parseLabInput('48F', 'hex');
        expect(r.bytes).toEqual([]);
        expect(r.error).toMatch(/genap|even/i);
    });

    it('rejects invalid hex chars', () => {
        const r = parseLabInput('ZZZZ', 'hex');
        expect(r.error).toBeTruthy();
    });

    it('parses binary 8-bit groups', () => {
        const r = parseLabInput('01001000 01101001', 'binary');
        expect(r.error).toBeNull();
        expect(r.bytes).toEqual([0x48, 0x69]);
    });

    it('rejects non-8-bit binary', () => {
        const r = parseLabInput('1010', 'binary');
        expect(r.error).toBeTruthy();
    });

    it('parses decimal bytes', () => {
        const r = parseLabInput('72 101 108 108 111', 'decimal-bytes');
        expect(r.error).toBeNull();
        expect(r.bytes).toEqual([72, 101, 108, 108, 111]);
    });

    it('rejects decimal >255', () => {
        const r = parseLabInput('256', 'decimal-bytes');
        expect(r.error).toBeTruthy();
    });

    it('parses base64', () => {
        const r = parseLabInput('SGVsbG8=', 'base64');
        expect(r.error).toBeNull();
        expect(r.bytes).toEqual([72, 101, 108, 108, 111]);
    });

    it('rejects invalid base64', () => {
        const r = parseLabInput('!!!bad!!!', 'base64');
        expect(r.error).toBeTruthy();
    });

    it('parses integer-blocks', () => {
        const r = parseLabInput('3000 28 2726', 'integer-blocks');
        expect(r.error).toBeNull();
        expect(r.integers).toEqual([3000, 28, 2726]);
    });
});

describe('codecs — renderLabOutput', () => {
    const bytes = [72, 101, 108, 108, 111];

    it('renders ascii', () => {
        expect(renderLabOutput({ bytes }, 'ascii').value).toBe('Hello');
    });

    it('renders hex', () => {
        const r = renderLabOutput({ bytes: [0x48, 0x69] }, 'hex');
        expect(r.value).toMatch(/48[ -]?69/i);
    });

    it('renders binary 8-bit groups', () => {
        const r = renderLabOutput({ bytes: [0x48, 0x69] }, 'binary');
        expect(r.value).toBe('01001000 01101001');
    });

    it('renders decimal-bytes', () => {
        const r = renderLabOutput({ bytes }, 'decimal-bytes');
        expect(r.value).toBe('72 101 108 108 111');
    });

    it('renders base64', () => {
        const r = renderLabOutput({ bytes }, 'base64');
        expect(r.value).toBe('SGVsbG8=');
    });
});

describe('codecs — round-trip', () => {
    const sample = [0x00, 0x01, 0xfe, 0xff, 0x42, 0x7f, 0x80];

    for (const fmt of ROUND_TRIP_FORMATS) {
        it(`round-trips through ${fmt}`, () => {
            const rendered = renderLabOutput({ bytes: sample }, fmt);
            const reparsed = parseLabInput(rendered.value, fmt);
            expect(reparsed.error).toBeNull();
            expect(reparsed.bytes).toEqual(sample);
        });
    }
});

describe('codecs — LAB_FORMATS', () => {
    it('has 8 entries', () => {
        expect(LAB_FORMATS).toHaveLength(8);
    });
});
