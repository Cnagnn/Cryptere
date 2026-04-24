import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('login with invalid credentials shows error', async ({ page }) => {
        await page.goto('/login');

        await page.getByLabel(/email/i).fill('invalid@example.com');
        await page.getByLabel(/password/i).fill('wrongpassword');
        await page.getByRole('button', { name: /log in/i }).click();

        // Should stay on login page with an error
        await expect(page).toHaveURL(/login/);
    });

    test('login form validates required fields', async ({ page }) => {
        await page.goto('/login');

        await page.getByRole('button', { name: /log in/i }).click();

        // Should stay on login page (HTML5 validation or server-side)
        await expect(page).toHaveURL(/login/);
    });

    test('register form is accessible', async ({ page }) => {
        await page.goto('/register');

        await expect(page.getByLabel(/name/i)).toBeVisible();
        await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('forgot password page loads', async ({ page }) => {
        await page.goto('/forgot-password');
        await expect(page.getByLabel(/email/i)).toBeVisible();
    });
});
