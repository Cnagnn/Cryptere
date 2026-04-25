import { test, expect } from '@playwright/test';

test.describe('Smoke Tests — Public Pages', () => {
    test('home page loads successfully', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/Crypter/);
        await expect(page.locator('body')).toBeVisible();
    });

    test('home page has navigation links', async ({ page }) => {
        await page.goto('/');
        await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    });

    test('login page loads', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByLabel('Email or Username')).toBeVisible();
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('register page loads', async ({ page }) => {
        await page.goto('/register');
        await expect(page.getByLabel('Username')).toBeVisible();
        await expect(page.getByLabel('Email')).toBeVisible();
    });
});

test.describe('Smoke Tests — Auth Required Pages (redirect)', () => {
    test('dashboard redirects to login when unauthenticated', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveURL(/login/);
    });

    test('courses page redirects to login when unauthenticated', async ({ page }) => {
        await page.goto('/courses');
        await expect(page).toHaveURL(/login/);
    });

    test('challenges page redirects to login when unauthenticated', async ({ page }) => {
        await page.goto('/challenges');
        await expect(page).toHaveURL(/login/);
    });

    test('leaderboard page redirects to login when unauthenticated', async ({ page }) => {
        await page.goto('/leaderboard');
        await expect(page).toHaveURL(/login/);
    });

    test('labs page redirects to login when unauthenticated', async ({ page }) => {
        await page.goto('/labs');
        await expect(page).toHaveURL(/login/);
    });
});
