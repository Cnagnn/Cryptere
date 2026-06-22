import { describe, expect, it } from 'vitest';
import {
    canFormatOutput,
    runSimulation,
    validationErrorByLab,
} from '../lab-simulations';

describe('DES Lab', () => {
    it('encrypts ASCII plaintext with 8-char ASCII key', () => {
        // Key "password" = 0x70617373776F7264 (8 bytes)
        // Plaintext "Halo DES" = 8 bytes (no padding needed, padLen=8 full block)
        const result = runSimulation(
            'des-lab',
            'encrypt',
            'Halo DES',
            'password',
        );

        // Output should be 32 hex chars (2 blocks of 16, because PKCS#7 adds full block when input is exact multiple)
        expect(result.output).toMatch(/^[0-9A-F]{32}$/);
        expect(result.steps.some((step) => step.includes('Putaran 16'))).toBe(
            true,
        );
    });

    it('decrypts ciphertext back to original ASCII plaintext (round-trip)', () => {
        const plaintext = 'Halo DES';
        const key = 'password';

        const encryptResult = runSimulation(
            'des-lab',
            'encrypt',
            plaintext,
            key,
        );

        const decryptResult = runSimulation(
            'des-lab',
            'decrypt',
            encryptResult.output,
            key,
        );

        expect(decryptResult.output).toBe(plaintext);
    });

    it('handles multi-block plaintext longer than 8 bytes', () => {
        const plaintext = 'Ini adalah pesan panjang DES';
        const key = 'mykey123';

        const encryptResult = runSimulation(
            'des-lab',
            'encrypt',
            plaintext,
            key,
        );

        // Multiple blocks → ciphertext longer than 32 hex chars
        expect(encryptResult.output.length).toBeGreaterThan(32);

        const decryptResult = runSimulation(
            'des-lab',
            'decrypt',
            encryptResult.output,
            key,
        );

        expect(decryptResult.output).toBe(plaintext);
    });

    it('handles plaintext shorter than 8 bytes with padding', () => {
        const plaintext = 'Hi';
        const key = 'password';

        const encryptResult = runSimulation(
            'des-lab',
            'encrypt',
            plaintext,
            key,
        );

        // 2 bytes + 6 padding = 8 bytes = 1 block = 16 hex chars
        expect(encryptResult.output).toHaveLength(16);

        const decryptResult = runSimulation(
            'des-lab',
            'decrypt',
            encryptResult.output,
            key,
        );

        expect(decryptResult.output).toBe(plaintext);
    });

    it('accepts any key length (auto-padded/truncated to 8 bytes like AES)', () => {
        // Short key (auto-padded with zeros)
        expect(validationErrorByLab('des-lab', 'encrypt', 'Halo DES', 'ab')).toBeNull();

        // Long key (auto-truncated to 8 bytes)
        expect(validationErrorByLab('des-lab', 'encrypt', 'Halo DES', 'kuncisangatpanjang')).toBeNull();

        // Round-trip with short key
        const shortKeyResult = runSimulation('des-lab', 'encrypt', 'Halo DES', 'ab');
        const shortKeyDecrypt = runSimulation('des-lab', 'decrypt', shortKeyResult.output, 'ab');
        expect(shortKeyDecrypt.output).toBe('Halo DES');

        // Round-trip with long key
        const longKeyResult = runSimulation('des-lab', 'encrypt', 'Halo DES', 'kuncisangatpanjang');
        const longKeyDecrypt = runSimulation('des-lab', 'decrypt', longKeyResult.output, 'kuncisangatpanjang');
        expect(longKeyDecrypt.output).toBe('Halo DES');
    });

    it('validates DES decrypt input must be hex with length multiple of 16', () => {
        expect(validationErrorByLab('des-lab', 'decrypt', 'XYZ', 'password')).toBe(
            'Masukan dekripsi DES harus berupa heksadesimal valid dengan panjang kelipatan 16 karakter (satu blok 64-bit).',
        );

        expect(validationErrorByLab('des-lab', 'decrypt', '85E813540F0AB40', 'password')).toBe(
            'Masukan dekripsi DES harus berupa heksadesimal valid dengan panjang kelipatan 16 karakter (satu blok 64-bit).',
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

    it('encrypts and decrypts multi-block plaintext (round-trip)', () => {
        const plaintext = 'AES multi-block test message';
        const key = 'CRYPTER-LAB-KEY';

        const encryptResult = runSimulation(
            'aes-lab',
            'encrypt',
            plaintext,
            key,
        );

        // Multiple blocks → ciphertext > 32 hex chars
        expect(encryptResult.output.length).toBeGreaterThan(32);
        // Must be multiple of 32 (each block = 16 bytes = 32 hex)
        expect(encryptResult.output.length % 32).toBe(0);

        const decryptResult = runSimulation(
            'aes-lab',
            'decrypt',
            encryptResult.output,
            key,
        );

        expect(decryptResult.output).toBe(plaintext);
    });

    it('encrypts and decrypts single-block plaintext (round-trip)', () => {
        const plaintext = 'short';
        const key = 'mykey1234567890b';

        const encryptResult = runSimulation(
            'aes-lab',
            'encrypt',
            plaintext,
            key,
        );

        // 5 bytes + 11 padding = 16 bytes = 1 block = 32 hex chars
        expect(encryptResult.output).toHaveLength(32);

        const decryptResult = runSimulation(
            'aes-lab',
            'decrypt',
            encryptResult.output,
            key,
        );

        expect(decryptResult.output).toBe(plaintext);
    });
});

describe('RSA lab', () => {
    it('encrypts and decrypts text (round-trip)', () => {
        const plaintext = 'RSA test';

        const encryptResult = runSimulation(
            'rsa-lab',
            'encrypt',
            plaintext,
            '',
        );

        // Output should be space-separated decimal blocks
        expect(encryptResult.output).toMatch(/^\d+( \d+)*$/);

        const decryptResult = runSimulation(
            'rsa-lab',
            'decrypt',
            encryptResult.output,
            '',
        );

        expect(decryptResult.output).toBe(plaintext);
    });

    it('encrypts and decrypts multi-block text (round-trip)', () => {
        const plaintext = 'Pesan RSA yang lebih panjang dari satu blok';

        const encryptResult = runSimulation(
            'rsa-lab',
            'encrypt',
            plaintext,
            '',
        );

        const decryptResult = runSimulation(
            'rsa-lab',
            'decrypt',
            encryptResult.output,
            '',
        );

        expect(decryptResult.output).toBe(plaintext);
    });

    it('produces key generation trace with large primes', () => {
        const result = runSimulation(
            'rsa-lab',
            'encrypt',
            'test',
            '',
        );

        const trace = (result as { trace?: { rsa?: { n?: string } } }).trace?.rsa;

        expect(trace).toBeDefined();
        expect(trace?.n).toBeDefined();
        // n should be ~256-bit (~77 decimal digits)
        expect(trace!.n!.length).toBeGreaterThan(70);
    });
});

describe('Digital Signature lab', () => {
    it('signs a message and verifies it (round-trip)', () => {
        const message = 'Pesan rahasia untuk ditandatangani';

        const signResult = runSimulation(
            'digital-signature-lab',
            'encrypt',
            message,
            '',
        );

        // Output should be a hex signature
        expect(signResult.output).toMatch(/^[0-9A-F]+$/);

        const verifyResult = runSimulation(
            'digital-signature-lab',
            'decrypt',
            signResult.output,
            message,
        );

        expect(verifyResult.output).toContain('VALID');
    });

    it('detects tampered message (verification fails)', () => {
        const originalMessage = 'Pesan asli yang ditandatangani';
        const tamperedMessage = 'Pesan yang telah diubah';

        const signResult = runSimulation(
            'digital-signature-lab',
            'encrypt',
            originalMessage,
            '',
        );

        const verifyResult = runSimulation(
            'digital-signature-lab',
            'decrypt',
            signResult.output,
            tamperedMessage,
        );

        expect(verifyResult.output).toContain('TIDAK VALID');
    });

    it('signs full SHA-256 digest (not truncated)', () => {
        const message = 'test';

        const signResult = runSimulation(
            'digital-signature-lab',
            'encrypt',
            message,
            '',
        );

        const trace = (signResult as { trace?: { signature?: { digestHex?: string } } }).trace?.signature;

        expect(trace).toBeDefined();
        // Full SHA-256 digest = 64 hex chars
        expect(trace!.digestHex).toHaveLength(64);
    });
});

describe('Lab output formatting availability', () => {
    it('allows formatting RSA and digital signature output', () => {
        expect(canFormatOutput('rsa-lab')).toBe(true);
        expect(canFormatOutput('digital-signature-lab')).toBe(true);
    });

    it('disables formatting for DES encrypt (hex output shown as-is)', () => {
        expect(canFormatOutput('des-lab', 'encrypt')).toBe(false);
    });

    it('allows formatting for DES decrypt (ASCII plaintext)', () => {
        expect(canFormatOutput('des-lab', 'decrypt')).toBe(true);
    });
});
