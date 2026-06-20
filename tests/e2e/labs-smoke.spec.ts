import { expect, test } from '@playwright/test';

/**
 * Smoke tests for all 6 cryptography lab pages.
 * Verifies that unauthenticated users are redirected to login.
 */

const labs = [
    { slug: 'caesar-cipher-lab', name: 'Caesar Cipher' },
    { slug: 'vigenere-cipher-lab', name: 'Vigenere Cipher' },
    { slug: 'aes-lab', name: 'AES' },
    { slug: 'des-lab', name: 'DES' },
    { slug: 'rsa-lab', name: 'RSA' },
    { slug: 'digital-signature-lab', name: 'Digital Signature' },
] as const;

test.describe('labs index', () => {
    test('labs index requires authentication', async ({ page }) => {
        await page.goto('/labs');

        await expect(page).toHaveURL(/\/login/);
    });
});

test.describe('individual lab pages', () => {
    for (const lab of labs) {
        test(`${lab.name} lab redirects unauthenticated users to login`, async ({
            page,
        }) => {
            await page.goto(`/labs/${lab.slug}`);

            await expect(page).toHaveURL(/\/login/);
        });
    }
});
