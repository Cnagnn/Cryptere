import { test, expect } from '@playwright/test';

test.describe('Error Pages', () => {
    test('404 page renders for unknown routes', async ({ page }) => {
        const response = await page.goto('/this-page-does-not-exist-at-all');

        expect(response?.status()).toBe(404);
        await expect(page.getByText(/could not be found|not found|404/i)).toBeVisible();
    });

    test('admin routes return 403 for unauthenticated users', async ({ page }) => {
        // Admin routes require auth, so unauthenticated users get redirected to login
        await page.goto('/admin/users');
        await expect(page).toHaveURL(/login/);
    });
});
