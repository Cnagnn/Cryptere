import { expect, test } from '@playwright/test';

test.describe('profile and settings smoke', () => {
    test('settings pages require authentication', async ({ page }) => {
        await page.goto('/settings/profile');

        await expect(page).toHaveURL(/\/login/);
    });

    test('own profile route requires authentication', async ({ page }) => {
        await page.goto('/profile');

        await expect(page).toHaveURL(/\/login/);
    });
});
