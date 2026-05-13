import { describe, expect, it } from 'vitest';
import {
    canFormatOutput,
    runSimulation,
    validationErrorByLab,
} from '../lab-simulations';

describe('DES Lab', () => {
    it('matches the standard DES known vector', () => {
        const result = runSimulation(
            'des-lab',
            'encrypt',
            '0123456789ABCDEF',
            '133457799BBCDFF1',
        );

        expect(result.output).toBe('85E813540F0AB405');
        expect(result.steps.some((step) => step.includes('Round 16'))).toBe(
            true,
        );
    });

    it('decrypts the standard DES known vector', () => {
        const result = runSimulation(
            'des-lab',
            'decrypt',
            '85E813540F0AB405',
            '133457799BBCDFF1',
        );

        expect(result.output).toBe('0123456789ABCDEF');
    });

    it('validates DES input and key block sizes', () => {
        expect(validationErrorByLab('des-lab', 'encrypt', '1234', 'abcd')).toBe(
            'DES input must be exactly one 64-bit block: 16 hexadecimal characters.',
        );
    });
});

describe('AES-128 lab known vector', () => {
    it('matches the AES-128 known vector', () => {
        const result = runSimulation(
            'aes-lab',
            'encrypt',
            '00112233445566778899AABBCCDDEEFF',
            '000102030405060708090A0B0C0D0E0F',
        );

        expect(result.output).toBe('69C4E0D86A7B0430D8CDB78070B4C55A');
    });
});

describe('Lab output formatting availability', () => {
    it('allows formatting RSA and digital signature output', () => {
        expect(canFormatOutput('rsa-lab')).toBe(true);
        expect(canFormatOutput('digital-signature-lab')).toBe(true);
    });
});
