import { expect, test } from '@playwright/test';

async function loginAsAdmin(page: import('@playwright/test').Page): Promise<void> {
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'password';

    await page.goto('/login');
    await page.getByLabel('Email or Username').fill(adminEmail);
    await page.locator('#password').fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/dashboard|courses/);
}

test('admin can create and edit course from course title dialog', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/admin/courses?section=catalog');
    await expect(page.getByRole('heading', { name: 'Course Management Title' })).toBeVisible();

    const uniqueTitle = `E2E Dialog Course ${Date.now()}`;
    const updatedTitle = `${uniqueTitle} Updated`;
    const createDescription = 'Created from dialog via Playwright';
    const updatedDescription = 'Updated from dialog via Playwright';

    await page.getByRole('button', { name: 'Create Course' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.locator('#course-title').fill(uniqueTitle);
    await page.locator('#course-description').fill(createDescription);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();

    await page.getByPlaceholder('Search Course Title...').fill(uniqueTitle);

    const courseRow = page
        .locator('tbody tr')
        .filter({ has: page.locator('p.font-medium', { hasText: uniqueTitle }) })
        .first();

    await expect(courseRow).toBeVisible();

    await courseRow.getByRole('button').last().click();
    await page.getByRole('menuitem', { name: 'Edit' }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    await dialog.locator('#course-title').fill(updatedTitle);
    await dialog.locator('#course-description').fill(updatedDescription);
    await dialog.getByRole('button', { name: 'Update course' }).click();

    await expect(dialog).not.toBeVisible();

    await page.getByPlaceholder('Search Course Title...').fill(updatedTitle);
    await expect(page.locator('tbody tr p.font-medium', { hasText: updatedTitle }).first()).toBeVisible();
});
