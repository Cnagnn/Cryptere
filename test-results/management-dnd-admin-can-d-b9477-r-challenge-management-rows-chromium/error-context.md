# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: management-dnd.spec.ts >> admin can drag and drop reorder challenge management rows
- Location: tests\e2e\management-dnd.spec.ts:42:1

# Error details

```
Error: expect(page).toHaveURL(expected) failed

Expected pattern: /dashboard|courses/
Received string:  "http://127.0.0.1:8000/login"
Timeout: 5000ms

Call log:
  - Expect "toHaveURL" with timeout 5000ms
    9 × unexpected value "http://127.0.0.1:8000/login"

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - dialog [active] [ref=e2]:
    - iframe [ref=e3]:
      - main [ref=f1e2]:
        - generic [ref=f1e4]:
          - heading "429" [level=1] [ref=f1e5]
          - generic [ref=f1e6]: Too Many Requests
  - generic [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img "Crypter" [ref=e9]
        - generic [ref=e10]: Sign In
      - generic [ref=e12]:
        - generic [ref=e13]:
          - link "Google" [ref=e14] [cursor=pointer]:
            - /url: /auth/google/redirect
            - img
            - text: Google
          - link "GitHub" [ref=e15] [cursor=pointer]:
            - /url: /auth/github/redirect
            - img
            - text: GitHub
        - generic [ref=e17]: or continue with
        - group [ref=e18]:
          - generic [ref=e19]: Email or Username
          - generic [ref=e20]:
            - img
            - textbox "Email or Username" [ref=e21]:
              - /placeholder: email@domain.com or @username
              - text: admin@example.com
          - paragraph [ref=e22]: Detected email format. Use your full email address.
        - group [ref=e23]:
          - generic [ref=e24]:
            - generic [ref=e25]: Password
            - link "Forgot password?" [ref=e26] [cursor=pointer]:
              - /url: /forgot-password
          - group [ref=e27]:
            - group [ref=e28]:
              - img [ref=e29]
            - textbox "Password" [ref=e32]: password
            - group [ref=e33]:
              - button "Show password" [ref=e34]:
                - img
        - generic [ref=e35]:
          - checkbox "Keep me signed in" [ref=e36]
          - checkbox
          - generic [ref=e37] [cursor=pointer]: Keep me signed in
        - button "Sign In" [ref=e39]
        - generic [ref=e40]:
          - text: Don't have an account?
          - link "Sign Up" [ref=e41] [cursor=pointer]:
            - /url: /register
    - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | async function loginAsAdmin(page: import('@playwright/test').Page): Promise<void> {
  4  |     const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
  5  |     const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'password';
  6  | 
  7  |     await page.goto('/login');
  8  |     await page.getByLabel('Email or Username').fill(adminEmail);
  9  |     await page.locator('#password').fill(adminPassword);
  10 |     await page.getByRole('button', { name: 'Sign In' }).click();
  11 | 
> 12 |     await expect(page).toHaveURL(/dashboard|courses/);
     |                        ^ Error: expect(page).toHaveURL(expected) failed
  13 | }
  14 | 
  15 | test('admin can drag and drop reorder course management rows', async ({ page }) => {
  16 |     await loginAsAdmin(page);
  17 | 
  18 |     await page.goto('/admin/courses?section=catalog');
  19 |     await expect(page.getByRole('heading', { name: 'Course Management Title' })).toBeVisible();
  20 | 
  21 |     const dragHandles = page.locator('button[aria-label^="Drag row CRS-"]');
  22 |     const count = await dragHandles.count();
  23 | 
  24 |     test.skip(count < 2, 'Need at least 2 courses for drag-and-drop test.');
  25 | 
  26 |     const sourceRow = page.locator('tbody tr').first();
  27 |     const targetRow = page.locator('tbody tr').nth(1);
  28 | 
  29 |     const firstTitleBefore = (await sourceRow.locator('td').nth(1).locator('p.font-medium').innerText()).trim();
  30 |     const secondTitleBefore = (await targetRow.locator('td').nth(1).locator('p.font-medium').innerText()).trim();
  31 | 
  32 |     await dragHandles.nth(0).dragTo(targetRow);
  33 | 
  34 |     await expect(page.locator('tbody tr').first().locator('td').nth(1).locator('p.font-medium')).toHaveText(secondTitleBefore);
  35 | 
  36 |     await page.reload();
  37 |     await expect(page.locator('tbody tr').first().locator('td').nth(1).locator('p.font-medium')).toHaveText(secondTitleBefore);
  38 |     const courseTitlesAfterReload = await page.locator('tbody tr td:nth-child(2) p.font-medium').allTextContents();
  39 |     expect(courseTitlesAfterReload.map((title) => title.trim())).toContain(firstTitleBefore);
  40 | });
  41 | 
  42 | test('admin can drag and drop reorder challenge management rows', async ({ page }) => {
  43 |     await loginAsAdmin(page);
  44 | 
  45 |     await page.goto('/admin/challenges');
  46 |     await expect(page.getByRole('heading', { name: 'Challenge Management' })).toBeVisible();
  47 | 
  48 |     const dragHandles = page.locator('button[aria-label^="Drag row CHL-"]');
  49 |     const count = await dragHandles.count();
  50 | 
  51 |     test.skip(count < 2, 'Need at least 2 challenges for drag-and-drop test.');
  52 | 
  53 |     const sourceRow = page.locator('tbody tr').first();
  54 |     const targetRow = page.locator('tbody tr').nth(1);
  55 | 
  56 |     const firstTitleBefore = (await sourceRow.locator('td').nth(1).locator('p.font-medium').innerText()).trim();
  57 |     const secondTitleBefore = (await targetRow.locator('td').nth(1).locator('p.font-medium').innerText()).trim();
  58 | 
  59 |     await dragHandles.nth(0).dragTo(targetRow);
  60 | 
  61 |     await expect(page.locator('tbody tr').first().locator('td').nth(1).locator('p.font-medium')).toHaveText(secondTitleBefore);
  62 | 
  63 |     await page.reload();
  64 |     await expect(page.locator('tbody tr').first().locator('td').nth(1).locator('p.font-medium')).toHaveText(secondTitleBefore);
  65 |     const challengeTitlesAfterReload = await page.locator('tbody tr td:nth-child(2) p.font-medium').allTextContents();
  66 |     expect(challengeTitlesAfterReload.map((title) => title.trim())).toContain(firstTitleBefore);
  67 | });
  68 | 
```