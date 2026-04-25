# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-builder.spec.ts >> admin can create course from builder
- Location: tests\e2e\course-builder.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Course Builder' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Course Builder' })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - generic [ref=e5]:
    - img [ref=e7]
    - generic [ref=e9]: Something went wrong
    - generic [ref=e10]: An unexpected error occurred. Our team has been notified.
  - generic [ref=e11]:
    - button "Try Again" [ref=e12]:
      - img
      - text: Try Again
    - button "Home" [ref=e13]:
      - img
      - text: Home
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test('admin can create course from builder', async ({ page }) => {
  4  |     const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
  5  |     const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'password';
  6  | 
  7  |     await page.goto('/login');
  8  | 
  9  |     await page.getByLabel('Email or Username').fill(adminEmail as string);
  10 |     await page.locator('#password').fill(adminPassword as string);
  11 |     await page.getByRole('button', { name: 'Sign In' }).click();
  12 | 
  13 |     await expect(page).toHaveURL(/dashboard|courses/);
  14 | 
  15 |     await page.goto('/admin/courses/builder/new');
> 16 |     await expect(page.getByRole('heading', { name: 'Course Builder' })).toBeVisible();
     |                                                                         ^ Error: expect(locator).toBeVisible() failed
  17 | 
  18 |     const uniqueTitle = `E2E Course ${Date.now()}`;
  19 | 
  20 |     await page.getByLabel('Title').fill(uniqueTitle);
  21 |     await page.getByLabel('Description').fill('Created from Playwright e2e test');
  22 |     await page.getByRole('button', { name: 'Continue' }).click();
  23 |     await expect(page).toHaveURL(/\/admin\/courses\/\d+\/builder/);
  24 |     await expect(page.getByRole('button', { name: 'Create Lesson' })).toBeVisible();
  25 |     await expect(page.getByText('Lesson List')).toBeVisible();
  26 | });
  27 | 
```