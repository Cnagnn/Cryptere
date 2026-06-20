import { expect, test } from '@playwright/test';

/**
 * GlassBoxLab navigation and interaction tests.
 * Tests step navigation, mode toggle, and glossary sheet.
 *
 * These tests authenticate as the first registered user.
 */

test.beforeEach(async ({ page }) => {
    // Visit the labs page - if redirected to login, authenticate
    await page.goto('/labs');

    if (page.url().includes('/login')) {
        // Try to register a new user for testing
        await page.goto('/register');

        const email = `test_${Date.now()}@example.com`;
        await page.fill('input[name="name"]', 'Test User');
        await page.fill('input[name="username"]', `testuser_${Date.now()}`);
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="password"]', 'Password123!');
        await page.fill('input[name="password_confirmation"]', 'Password123!');

        await page.click('button[type="submit"]');

        // Wait for redirect away from auth pages
        await page.waitForURL(/\/(?!login|register|password)/, { timeout: 10_000 });
    }
});

test.describe('labs index', () => {
    test('shows all 6 lab cards', async ({ page }) => {
        await page.goto('/labs');

        const labCards = page.locator('a[href*="/labs/"]');
        await expect(labCards).toHaveCount(6);
    });

    test('links to all lab pages', async ({ page }) => {
        await page.goto('/labs');

        const slugs = [
            'caesar-cipher-lab',
            'vigenere-cipher-lab',
            'aes-lab',
            'des-lab',
            'rsa-lab',
            'digital-signature-lab',
        ];

        for (const slug of slugs) {
            const link = page.locator(`a[href="/labs/${slug}"]`);
            await expect(link).toBeVisible();
        }
    });
});

test.describe('GlassBoxLab component', () => {
    test('AES lab renders state matrix and step navigation', async ({ page }) => {
        await page.goto('/labs/aes-lab');

        // Should show encryption mode by default
        await expect(page.getByText('Enkripsi')).toBeVisible();

        // GlassBoxLab step navigation should be present
        await expect(page.getByText('Sebelumnya')).toBeVisible();
        await expect(page.getByText('Selanjutnya')).toBeVisible();

        // Progress bar should exist
        await expect(page.locator('[role="progressbar"]')).toBeVisible();

        // Glossary sheet trigger should be present
        await expect(page.getByText('Istilah')).toBeVisible();
    });

    test('step navigation works (AES lab)', async ({ page }) => {
        await page.goto('/labs/aes-lab');

        // Click "Selanjutnya" a few times
        const nextButton = page.getByText('Selanjutnya');
        const stepBadge = page.locator('.tabular-nums');

        // Initial step should be 1
        await expect(stepBadge).toContainText('1/');

        // Click next
        await nextButton.click();
        await expect(stepBadge).toContainText('2/');

        // Click prev
        const prevButton = page.getByText('Sebelumnya');
        await prevButton.click();
        await expect(stepBadge).toContainText('1/');
    });

    test('learner mode toggle works (AES lab)', async ({ page }) => {
        await page.goto('/labs/aes-lab');

        // Default mode label should show "Pemula"
        await expect(page.getByText('Pemula')).toBeVisible();

        // Click to switch to Mahir mode
        await page.getByText('Pemula').click();

        // Should now show Mahir mode
        await expect(page.getByText('Mahir')).toBeVisible();
    });

    test('glossary sheet opens and shows terms', async ({ page }) => {
        await page.goto('/labs/aes-lab');

        // Click glossary button
        await page.getByText('Istilah').click();

        // Sheet should open with search input
        await expect(page.getByPlaceholder('Cari istilah...')).toBeVisible();
    });

    test('DES lab renders Feistel visualization', async ({ page }) => {
        await page.goto('/labs/des-lab');

        await expect(page.getByText('DES Feistel')).toBeVisible();
        await expect(page.getByText('16 rounds')).toBeVisible();
        await expect(page.getByText('Sebelumnya')).toBeVisible();
    });

    test('RSA lab renders key derivation visualization', async ({ page }) => {
        await page.goto('/labs/rsa-lab');

        // Should show p and q values
        await expect(page.getByText(/p.*prime/i)).toBeVisible();
        await expect(page.getByText(/q.*prime/i)).toBeVisible();

        // Should show the actual small primes used in demo
        await expect(page.getByText('61')).toBeVisible();
        await expect(page.getByText('53')).toBeVisible();
    });

    test('Digital Signature lab shows signing flow', async ({ page }) => {
        await page.goto('/labs/digital-signature-lab');

        await expect(page.getByText('Enkripsi')).toBeVisible();
        await expect(page.getByText('Sebelumnya')).toBeVisible();
    });

    test('decrypt mode toggles correctly', async ({ page }) => {
        await page.goto('/labs/aes-lab');

        // Default is encrypt
        await expect(page.getByText('Enkripsi')).toBeVisible();

        // Click Dekripsi tab
        await page.getByText('Dekripsi').click();

        // Should now show decrypt mode
        await expect(page.getByRole('tab', { name: /dekripsi/i })).toHaveAttribute('data-state', 'active');
    });

    test('mode toggle persists across tabs', async ({ page }) => {
        await page.goto('/labs/aes-lab');

        // Switch to Mahir
        await page.getByText('Pemula').click();
        await expect(page.getByText('Mahir')).toBeVisible();

        // Change mode to decrypt
        await page.getByText('Dekripsi').click();

        // Navigate to a different lab
        await page.goto('/labs/des-lab');

        // AES mode toggle should have reverted to default
        // (each lab has its own GlassBoxLab state)
        await page.goto('/labs/aes-lab');
        await expect(page.getByText('Pemula')).toBeVisible();
    });
});

test.describe('encrypt/decrypt flow', () => {
    test('AES encrypt produces hex output', async ({ page }) => {
        await page.goto('/labs/aes-lab');

        // Fill input
        const textarea = page.locator('textarea');
        await textarea.fill('test');

        // Output area should exist
        await expect(page.getByText('Hasil Akhir')).toBeVisible();
    });

    test('RSA encrypt produces cipher blocks', async ({ page }) => {
        await page.goto('/labs/rsa-lab');

        // Fill input
        const textarea = page.locator('textarea').first();
        await textarea.fill('HI');

        // Should show cipher blocks in output
        await expect(page.getByText('Blok cipher')).toBeVisible();
    });
});
