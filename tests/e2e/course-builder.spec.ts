import { expect, test } from '@playwright/test';

test('admin can create course from builder', async ({ page }) => {
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'password';

    await page.goto('/login');

    await page.getByLabel('Email or Username').fill(adminEmail as string);
    await page.locator('#password').fill(adminPassword as string);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/dashboard|courses/);

    await page.goto('/admin/courses/builder/new');
    await expect(page.getByRole('heading', { name: 'Course Builder' })).toBeVisible();

    const uniqueTitle = `E2E Course ${Date.now()}`;

    await page.getByLabel('Title').fill(uniqueTitle);
    await page.getByLabel('Description').fill('Created from Playwright e2e test');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL(/\/admin\/courses\/\d+\/builder/);
    await expect(page.getByRole('button', { name: 'Create Lesson' })).toBeVisible();
    await expect(page.getByText('Lesson List')).toBeVisible();
});
