import type { Page } from '@playwright/test';
import { expect, test } from '@playwright/test';

async function loginAsAdmin(page: Page): Promise<void> {
    const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
    const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'password';

    await page.goto('/login');
    await page.getByLabel('Email or Username').fill(adminEmail);
    await page.locator('#password').fill(adminPassword);
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/dashboard|courses/);
}

test('admin can drag and drop reorder course management rows', async ({
    page,
}) => {
    await loginAsAdmin(page);

    await page.goto('/admin/courses?section=catalog');
    await expect(
        page.getByRole('heading', { name: 'Course Management Title' }),
    ).toBeVisible();

    const dragHandles = page.locator('button[aria-label^="Drag row CRS-"]');
    const count = await dragHandles.count();

    test.skip(count < 2, 'Need at least 2 courses for drag-and-drop test.');

    const sourceRow = page.locator('tbody tr').first();
    const targetRow = page.locator('tbody tr').nth(1);

    const firstTitleBefore = (
        await sourceRow
            .locator('td')
            .nth(1)
            .locator('p.font-medium')
            .innerText()
    ).trim();
    const secondTitleBefore = (
        await targetRow
            .locator('td')
            .nth(1)
            .locator('p.font-medium')
            .innerText()
    ).trim();

    await dragHandles.nth(0).dragTo(targetRow);

    await expect(
        page
            .locator('tbody tr')
            .first()
            .locator('td')
            .nth(1)
            .locator('p.font-medium'),
    ).toHaveText(secondTitleBefore);

    await page.reload();
    await expect(
        page
            .locator('tbody tr')
            .first()
            .locator('td')
            .nth(1)
            .locator('p.font-medium'),
    ).toHaveText(secondTitleBefore);
    const courseTitlesAfterReload = await page
        .locator('tbody tr td:nth-child(2) p.font-medium')
        .allTextContents();
    expect(courseTitlesAfterReload.map((title) => title.trim())).toContain(
        firstTitleBefore,
    );
});

test('admin can drag and drop reorder challenge management rows', async ({
    page,
}) => {
    await loginAsAdmin(page);

    await page.goto('/admin/challenges');
    await expect(
        page.getByRole('heading', { name: 'Challenge Management' }),
    ).toBeVisible();

    const dragHandles = page.locator('button[aria-label^="Drag row CHL-"]');
    const count = await dragHandles.count();

    test.skip(count < 2, 'Need at least 2 challenges for drag-and-drop test.');

    const sourceRow = page.locator('tbody tr').first();
    const targetRow = page.locator('tbody tr').nth(1);

    const firstTitleBefore = (
        await sourceRow
            .locator('td')
            .nth(1)
            .locator('p.font-medium')
            .innerText()
    ).trim();
    const secondTitleBefore = (
        await targetRow
            .locator('td')
            .nth(1)
            .locator('p.font-medium')
            .innerText()
    ).trim();

    await dragHandles.nth(0).dragTo(targetRow);

    await expect(
        page
            .locator('tbody tr')
            .first()
            .locator('td')
            .nth(1)
            .locator('p.font-medium'),
    ).toHaveText(secondTitleBefore);

    await page.reload();
    await expect(
        page
            .locator('tbody tr')
            .first()
            .locator('td')
            .nth(1)
            .locator('p.font-medium'),
    ).toHaveText(secondTitleBefore);
    const challengeTitlesAfterReload = await page
        .locator('tbody tr td:nth-child(2) p.font-medium')
        .allTextContents();
    expect(challengeTitlesAfterReload.map((title) => title.trim())).toContain(
        firstTitleBefore,
    );
});
