import { expect, test } from '@playwright/test';

test('registration form posts to the Fortify register endpoint', async ({
    page,
}) => {
    await page.goto('/register');

    const form = page.locator('form').first();

    await expect(form).toHaveAttribute('action', /\/register$/);
    await expect(form).toHaveAttribute('method', 'post');
});

test('reset password form posts to the Fortify reset endpoint', async ({
    page,
}) => {
    await page.goto('/reset-password/test-token?email=student@example.com');

    const form = page.locator('form').first();

    await expect(form).toHaveAttribute('action', /\/reset-password$/);
    await expect(form).toHaveAttribute('method', 'post');
});
