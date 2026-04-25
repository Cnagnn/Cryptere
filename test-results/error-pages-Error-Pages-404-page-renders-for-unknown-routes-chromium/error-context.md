# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: error-pages.spec.ts >> Error Pages >> 404 page renders for unknown routes
- Location: tests\e2e\error-pages.spec.ts:4:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/could not be found|not found|404/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/could not be found|not found|404/i)

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
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Error Pages', () => {
  4  |     test('404 page renders for unknown routes', async ({ page }) => {
  5  |         const response = await page.goto('/this-page-does-not-exist-at-all');
  6  | 
  7  |         expect(response?.status()).toBe(404);
> 8  |         await expect(page.getByText(/could not be found|not found|404/i)).toBeVisible();
     |                                                                           ^ Error: expect(locator).toBeVisible() failed
  9  |     });
  10 | 
  11 |     test('admin routes return 403 for unauthenticated users', async ({ page }) => {
  12 |         // Admin routes require auth, so unauthenticated users get redirected to login
  13 |         await page.goto('/admin/users');
  14 |         await expect(page).toHaveURL(/login/);
  15 |     });
  16 | });
  17 | 
```