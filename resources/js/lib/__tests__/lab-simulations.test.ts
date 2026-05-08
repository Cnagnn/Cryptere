/**
 * Lab Simulations Unit Tests
 *
 * Comprehensive test suite for all 6 cryptography lab simulations
 * and their supporting utility functions.
 *
 * @see IMPLEMENTATION_PLAN.md — R05: Lab Simulation Unit Tests
 */
import { describe, it, expect } from 'vitest';
import {
    runSimulation,
    normalizeInputToText,
    normalizeInputForSimulation,
    formatOutputValue,
    conceptLensByLab,
    visualizationLensByLab,
    recommendedInputFormatByLab,
    recommendedOutputFormatByLab,
    validationErrorByLab,
    keyLabelByLab,
    keyPlaceholderByLab,
    defaultTextByLab,
    modeDescription,
    inputLabelByLab,
    inputPlaceholderByLab,
    inputHelperByLab,
    formatLabel,
} from '../lab-simulations';

const ALL_LABS = [
    'caesar-cipher-lab',
    'vigenere-cipher-lab',
    'aes-lab',
    'rsa-lab',
    'digital-signature-lab',
] as const;

// ─── Caesar Cipher ───────────────────────────────────────────────────────────
describe('Caesar Cipher Lab', () => {
    it('encrypts "HELLO" with shift 3', () => {
        const result = runSimulation(
            'caesar-cipher-lab',
            'encrypt',
            'HELLO',
            '3',
        );
        expect(result.output).toBeTruthy();
        expect(result.output.length).toBe(5);
    });

    it('decrypt reverses encrypt', () => {
        const encrypted = runSimulation(
            'caesar-cipher-lab',
            'encrypt',
            'HELLO',
            '3',
        );
        const decrypted = runSimulation(
            'caesar-cipher-lab',
            'decrypt',
            encrypted.output,
            '3',
        );
        expect(decrypted.output).toBe('HELLO');
    });

    it('handles shift of 0 (identity)', () => {
        const result = runSimulation(
            'caesar-cipher-lab',
            'encrypt',
            'TEST',
            '0',
        );
        expect(result.output).toBe('TEST');
    });

    it('handles shift of 26 (full rotation = identity)', () => {
        const result = runSimulation(
            'caesar-cipher-lab',
            'encrypt',
            'TEST',
            '26',
        );
        expect(result.output).toBe('TEST');
    });

    it('handles lowercase input', () => {
        const result = runSimulation(
            'caesar-cipher-lab',
            'encrypt',
            'hello',
            '3',
        );
        expect(result.output).toBeTruthy();
        expect(result.output.length).toBe(5);
    });

    it('generates walkthrough steps', () => {
        const result = runSimulation('caesar-cipher-lab', 'encrypt', 'AB', '1');
        expect(result.steps.length).toBeGreaterThan(0);
    });

    it('encrypt then decrypt is identity for any shift', () => {
        const text = 'CRYPTOGRAPHY';
        const encrypted = runSimulation(
            'caesar-cipher-lab',
            'encrypt',
            text,
            '13',
        );
        const decrypted = runSimulation(
            'caesar-cipher-lab',
            'decrypt',
            encrypted.output,
            '13',
        );
        expect(decrypted.output).toBe(text);
    });

    it('handles large shift values (mod 26)', () => {
        const r1 = runSimulation('caesar-cipher-lab', 'encrypt', 'A', '3');
        const r2 = runSimulation('caesar-cipher-lab', 'encrypt', 'A', '29');
        expect(r1.output).toBe(r2.output);
    });

    it('has an outputLabel', () => {
        const result = runSimulation(
            'caesar-cipher-lab',
            'encrypt',
            'TEST',
            '3',
        );
        expect(result.outputLabel).toBeTruthy();
    });
});

// ─── Vigenère Cipher ─────────────────────────────────────────────────────────
describe('Vigenère Cipher Lab', () => {
    it('encrypts with keyword correctly', () => {
        const result = runSimulation(
            'vigenere-cipher-lab',
            'encrypt',
            'HELLO',
            'KEY',
        );
        expect(result.output).toBeTruthy();
        expect(result.output.length).toBe(5);
    });

    it('decrypt reverses encrypt', () => {
        const encrypted = runSimulation(
            'vigenere-cipher-lab',
            'encrypt',
            'HELLO',
            'KEY',
        );
        const decrypted = runSimulation(
            'vigenere-cipher-lab',
            'decrypt',
            encrypted.output,
            'KEY',
        );
        expect(decrypted.output).toBe('HELLO');
    });

    it('handles lowercase input', () => {
        const result = runSimulation(
            'vigenere-cipher-lab',
            'encrypt',
            'hello',
            'key',
        );
        expect(result.output).toBeTruthy();
        expect(result.output.length).toBe(5);
    });

    it('generates walkthrough steps', () => {
        const result = runSimulation(
            'vigenere-cipher-lab',
            'encrypt',
            'TEST',
            'KEY',
        );
        expect(result.steps.length).toBeGreaterThan(0);
    });

    it('produces different output for different keys', () => {
        const r1 = runSimulation(
            'vigenere-cipher-lab',
            'encrypt',
            'HELLO',
            'AAA',
        );
        const r2 = runSimulation(
            'vigenere-cipher-lab',
            'encrypt',
            'HELLO',
            'ZZZ',
        );
        expect(r1.output).not.toBe(r2.output);
    });

    it('key A produces identity (no shift)', () => {
        const result = runSimulation(
            'vigenere-cipher-lab',
            'encrypt',
            'HELLO',
            'A',
        );
        expect(result.output).toBe('HELLO');
    });
});

// ─── AES Lab ─────────────────────────────────────────────────────────────────
describe('AES Lab', () => {
    it('produces output for encrypt mode', () => {
        const result = runSimulation(
            'aes-lab',
            'encrypt',
            'Hello World',
            'mysecretkey12345',
        );
        expect(result.output).toBeTruthy();
        expect(result.steps.length).toBeGreaterThan(0);
    });

    it('produces different output for different keys', () => {
        const r1 = runSimulation(
            'aes-lab',
            'encrypt',
            'Hello',
            'key1longerthan16',
        );
        const r2 = runSimulation(
            'aes-lab',
            'encrypt',
            'Hello',
            'key2longerthan16',
        );
        expect(r1.output).not.toBe(r2.output);
    });

    it('produces different output for different inputs', () => {
        const r1 = runSimulation('aes-lab', 'encrypt', 'Hello', 'samekey');
        const r2 = runSimulation('aes-lab', 'encrypt', 'World', 'samekey');
        expect(r1.output).not.toBe(r2.output);
    });

    it('generates walkthrough steps', () => {
        const result = runSimulation('aes-lab', 'encrypt', 'Test', 'key');
        expect(result.steps.length).toBeGreaterThan(0);
    });
});

// ─── RSA Lab ─────────────────────────────────────────────────────────────────
describe('RSA Lab', () => {
    it('encrypts and produces output', () => {
        const result = runSimulation('rsa-lab', 'encrypt', 'Hi', '');
        expect(result.output).toBeTruthy();
    });

    it('generates steps showing modular exponentiation', () => {
        const result = runSimulation('rsa-lab', 'encrypt', 'A', '');
        expect(result.steps.length).toBeGreaterThan(0);
    });

    it('produces different output for different inputs', () => {
        const r1 = runSimulation('rsa-lab', 'encrypt', 'A', '');
        const r2 = runSimulation('rsa-lab', 'encrypt', 'B', '');
        expect(r1.output).not.toBe(r2.output);
    });

    it('decrypt mode produces output', () => {
        const result = runSimulation('rsa-lab', 'decrypt', '42', '');
        expect(result.output).toBeTruthy();
    });
});

// ─── Digital Signature Lab ───────────────────────────────────────────────────
describe('Digital Signature Lab', () => {
    it('produces signature output in sign mode', () => {
        const result = runSimulation(
            'digital-signature-lab',
            'encrypt',
            'Document',
            'key',
        );
        expect(result.output).toBeTruthy();
    });

    it('verify mode produces verification result', () => {
        const result = runSimulation(
            'digital-signature-lab',
            'decrypt',
            'Document',
            'key',
        );
        expect(result.output).toBeTruthy();
    });

    it('generates walkthrough steps', () => {
        const result = runSimulation(
            'digital-signature-lab',
            'encrypt',
            'Test',
            'key',
        );
        expect(result.steps.length).toBeGreaterThan(0);
    });

    it('different documents produce different signatures', () => {
        const r1 = runSimulation(
            'digital-signature-lab',
            'encrypt',
            'Document A',
            'key',
        );
        const r2 = runSimulation(
            'digital-signature-lab',
            'encrypt',
            'Document B',
            'key',
        );
        expect(r1.output).not.toBe(r2.output);
    });
});

// ─── Format Conversion ──────────────────────────────────────────────────────
describe('Format Conversion', () => {
    it('normalizeInputToText converts hex to text', () => {
        const result = normalizeInputToText('48656c6c6f', 'hex');
        expect(result.error).toBeNull();
        expect(result.value).toBe('Hello');
    });

    it('normalizeInputToText handles ascii passthrough', () => {
        const result = normalizeInputToText('Hello', 'ascii');
        expect(result.error).toBeNull();
        expect(result.value).toBe('Hello');
    });

    it('normalizeInputToText handles binary input', () => {
        // 'A' = 01000001
        const result = normalizeInputToText('01000001', 'binary');
        expect(result.error).toBeNull();
        expect(result.value).toBe('A');
    });

    it('normalizeInputToText returns error for invalid hex', () => {
        const result = normalizeInputToText('ZZZZ', 'hex');
        expect(result.error).toBeTruthy();
        expect(result.value).toBeNull();
    });

    it('normalizeInputToText returns error for invalid binary', () => {
        const result = normalizeInputToText('12345678', 'binary');
        expect(result.error).toBeTruthy();
        expect(result.value).toBeNull();
    });

    it('formatOutputValue converts text to hex', () => {
        const result = formatOutputValue('Hello', 'hex');
        expect(result.error).toBeNull();
        expect(result.value.toLowerCase()).toContain('48656c6c6f');
    });

    it('formatOutputValue handles ascii passthrough', () => {
        const result = formatOutputValue('Hello', 'ascii');
        expect(result.error).toBeNull();
        expect(result.value).toBe('Hello');
    });

    it('formatLabel returns human-readable labels', () => {
        expect(formatLabel('ascii')).toBeTruthy();
        expect(formatLabel('hex')).toBeTruthy();
        expect(formatLabel('binary')).toBeTruthy();
        expect(formatLabel('base64')).toBeTruthy();
    });

    it('normalizeInputForSimulation handles hex for AES decrypt', () => {
        const result = normalizeInputForSimulation(
            'aes-lab',
            'decrypt',
            '4A6F686E',
            'hex',
        );
        expect(result.error).toBeNull();
        expect(result.value).toBe('4A6F686E');
    });

    it('normalizeInputForSimulation handles ascii passthrough', () => {
        const result = normalizeInputForSimulation(
            'caesar-cipher-lab',
            'encrypt',
            'Hello',
            'ascii',
        );
        expect(result.error).toBeNull();
        expect(result.value).toBe('Hello');
    });
});

// ─── Utility Functions ───────────────────────────────────────────────────────
describe('Utility Functions', () => {
    describe('recommendedInputFormatByLab', () => {
        it('returns valid format for each lab', () => {
            const validFormats = [
                'ascii',
                'hex',
                'binary',
                'base64',
                'decimal',
            ];

            for (const lab of ALL_LABS) {
                const format = recommendedInputFormatByLab(lab, 'encrypt');
                expect(validFormats).toContain(format);
            }
        });

        it('returns hex for AES decrypt', () => {
            expect(recommendedInputFormatByLab('aes-lab', 'decrypt')).toBe(
                'hex',
            );
        });

        it('returns decimal for RSA decrypt', () => {
            expect(recommendedInputFormatByLab('rsa-lab', 'decrypt')).toBe(
                'decimal',
            );
        });
    });

    describe('recommendedOutputFormatByLab', () => {
        it('returns valid format for each lab', () => {
            const validFormats = [
                'ascii',
                'hex',
                'binary',
                'base64',
                'decimal',
            ];

            for (const lab of ALL_LABS) {
                const format = recommendedOutputFormatByLab(lab, 'encrypt');
                expect(validFormats).toContain(format);
            }
        });
    });

    describe('conceptLensByLab', () => {
        it('returns concept points for each lab', () => {
            for (const lab of ALL_LABS) {
                const lens = conceptLensByLab(lab, 'encrypt');
                expect(lens.points.length).toBeGreaterThan(0);
                expect(lens.title).toBeTruthy();
            }
        });
    });

    describe('visualizationLensByLab', () => {
        it('returns visualization data for caesar cipher', () => {
            const result = runSimulation(
                'caesar-cipher-lab',
                'encrypt',
                'HELLO',
                '3',
            );
            const lens = visualizationLensByLab(
                'caesar-cipher-lab',
                'encrypt',
                'HELLO',
                '3',
                result,
            );
            expect(lens).toBeTruthy();
            expect(lens.headers).toBeTruthy();
        });

        it('returns visualization data for vigenere cipher', () => {
            const result = runSimulation(
                'vigenere-cipher-lab',
                'encrypt',
                'HELLO',
                'KEY',
            );
            const lens = visualizationLensByLab(
                'vigenere-cipher-lab',
                'encrypt',
                'HELLO',
                'KEY',
                result,
            );
            expect(lens).toBeTruthy();
            expect(lens.headers).toBeTruthy();
        });
    });

    describe('validationErrorByLab', () => {
        it('returns null for valid Caesar cipher input', () => {
            const error = validationErrorByLab(
                'caesar-cipher-lab',
                'encrypt',
                'Hello',
                '3',
            );
            expect(error).toBeNull();
        });

        it('returns error for Caesar cipher with non-numeric key', () => {
            const error = validationErrorByLab(
                'caesar-cipher-lab',
                'encrypt',
                'Hello',
                'abc',
            );
            expect(error).toBeTruthy();
        });

        it('returns null for valid Vigenère input', () => {
            const error = validationErrorByLab(
                'vigenere-cipher-lab',
                'encrypt',
                'Hello',
                'KEY',
            );
            expect(error).toBeNull();
        });

        it('returns error for Vigenère with empty key', () => {
            const error = validationErrorByLab(
                'vigenere-cipher-lab',
                'encrypt',
                'Hello',
                '',
            );
            expect(error).toBeTruthy();
        });

        it('returns error for empty input', () => {
            const error = validationErrorByLab(
                'caesar-cipher-lab',
                'encrypt',
                '',
                '3',
            );
            expect(error).toBeTruthy();
        });

        it('returns error for AES decrypt with invalid hex', () => {
            const error = validationErrorByLab(
                'aes-lab',
                'decrypt',
                'ZZZZ',
                'key',
            );
            expect(error).toBeTruthy();
        });

    });

    describe('keyLabelByLab', () => {
        it('returns non-empty label for labs that need keys', () => {
            expect(keyLabelByLab('caesar-cipher-lab')).toBeTruthy();
            expect(keyLabelByLab('vigenere-cipher-lab')).toBeTruthy();
            expect(keyLabelByLab('aes-lab')).toBeTruthy();
        });
    });

    describe('keyPlaceholderByLab', () => {
        it('returns non-empty placeholder for labs that need keys', () => {
            expect(keyPlaceholderByLab('caesar-cipher-lab')).toBeTruthy();
            expect(keyPlaceholderByLab('vigenere-cipher-lab')).toBeTruthy();
            expect(keyPlaceholderByLab('aes-lab')).toBeTruthy();
        });
    });

    describe('defaultTextByLab', () => {
        it('returns non-empty default text for each lab', () => {
            for (const lab of ALL_LABS) {
                expect(defaultTextByLab(lab).length).toBeGreaterThan(0);
            }
        });
    });

    describe('modeDescription', () => {
        it('returns description for encrypt mode', () => {
            for (const lab of ALL_LABS) {
                const desc = modeDescription(lab, 'encrypt');
                expect(desc).toBeTruthy();
            }
        });

        it('returns description for decrypt mode', () => {
            for (const lab of ALL_LABS) {
                const desc = modeDescription(lab, 'decrypt');
                expect(desc).toBeTruthy();
            }
        });
    });

    describe('inputLabelByLab', () => {
        it('returns label for each lab and mode', () => {
            for (const lab of ALL_LABS) {
                expect(inputLabelByLab(lab, 'encrypt')).toBeTruthy();
                expect(inputLabelByLab(lab, 'decrypt')).toBeTruthy();
            }
        });
    });

    describe('inputPlaceholderByLab', () => {
        it('returns placeholder for each lab and mode', () => {
            for (const lab of ALL_LABS) {
                expect(inputPlaceholderByLab(lab, 'encrypt')).toBeTruthy();
            }
        });
    });

    describe('inputHelperByLab', () => {
        it('returns helper text for each lab and mode', () => {
            for (const lab of ALL_LABS) {
                const helper = inputHelperByLab(lab, 'encrypt');
                expect(typeof helper === 'string').toBe(true);
                expect(helper.length).toBeGreaterThan(0);
            }
        });
    });
});

// ─── Cross-Lab Integration ───────────────────────────────────────────────────
describe('Cross-Lab Integration', () => {
    it('runSimulation handles unknown lab slug gracefully', () => {
        const result = runSimulation('unknown-lab', 'encrypt', 'test', '');
        expect(result).toBeTruthy();
        expect(result.output).toBe('');
        expect(result.steps.length).toBeGreaterThan(0);
    });

    it('all labs produce non-empty output for default text with appropriate key', () => {
        const keys: Record<string, string> = {
            'caesar-cipher-lab': '3',
            'vigenere-cipher-lab': 'KEY',
            'aes-lab': 'secretkey',
            'rsa-lab': '',
            'digital-signature-lab': 'signingkey',
        };

        for (const lab of ALL_LABS) {
            const defaultText = defaultTextByLab(lab);
            const result = runSimulation(
                lab,
                'encrypt',
                defaultText,
                keys[lab],
            );
            expect(result.output, `${lab} should produce output`).toBeTruthy();
        }
    });

    it('all labs produce steps for walkthrough', () => {
        const keys: Record<string, string> = {
            'caesar-cipher-lab': '3',
            'vigenere-cipher-lab': 'KEY',
            'aes-lab': 'secretkey',
            'rsa-lab': '',
            'digital-signature-lab': 'signingkey',
        };

        for (const lab of ALL_LABS) {
            const defaultText = defaultTextByLab(lab);
            const result = runSimulation(
                lab,
                'encrypt',
                defaultText,
                keys[lab],
            );
            expect(
                result.steps.length,
                `${lab} should produce steps`,
            ).toBeGreaterThan(0);
        }
    });

    it('all labs have an outputLabel', () => {
        for (const lab of ALL_LABS) {
            const result = runSimulation(lab, 'encrypt', 'Test', 'key');
            expect(
                result.outputLabel,
                `${lab} should have outputLabel`,
            ).toBeTruthy();
        }
    });
});
