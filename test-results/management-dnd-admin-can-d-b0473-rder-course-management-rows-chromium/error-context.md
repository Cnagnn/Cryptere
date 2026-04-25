# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: management-dnd.spec.ts >> admin can drag and drop reorder course management rows
- Location: tests\e2e\management-dnd.spec.ts:15:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: 'Course Management Title' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('heading', { name: 'Course Management Title' })

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e3]:
    - generic [ref=e6]:
      - list [ref=e8]:
        - listitem [ref=e9]:
          - link "Crypter" [ref=e10] [cursor=pointer]:
            - /url: /dashboard
            - img "Crypter" [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Dashboard
          - list [ref=e17]:
            - listitem [ref=e18]:
              - link "Dashboard" [ref=e19] [cursor=pointer]:
                - /url: /dashboard
                - img [ref=e20]
                - generic [ref=e25]: Dashboard
            - listitem [ref=e26]:
              - link "Courses" [ref=e27] [cursor=pointer]:
                - /url: /courses
                - img [ref=e28]
                - generic [ref=e31]: Courses
            - listitem [ref=e32]:
              - link "Challenges" [ref=e33] [cursor=pointer]:
                - /url: /challenges
                - img [ref=e34]
                - generic [ref=e43]: Challenges
            - listitem [ref=e44]:
              - link "Leaderboard" [ref=e45] [cursor=pointer]:
                - /url: /leaderboard
                - img [ref=e46]
                - generic [ref=e52]: Leaderboard
            - listitem [ref=e53]:
              - link "Labs" [ref=e54] [cursor=pointer]:
                - /url: /labs
                - img [ref=e55]
                - generic [ref=e57]: Labs
        - generic [ref=e58]:
          - generic [ref=e59]: Management
          - list [ref=e61]:
            - listitem [ref=e63]:
              - button "Courses" [expanded] [ref=e64]:
                - img [ref=e65]
                - generic [ref=e68]: Courses
                - img [ref=e69]
              - list [ref=e72]:
                - listitem [ref=e73]:
                  - link "Title" [ref=e74] [cursor=pointer]:
                    - /url: /admin/courses?section=catalog
                    - generic [ref=e75]: Title
                - listitem [ref=e76]:
                  - link "Topic" [ref=e77] [cursor=pointer]:
                    - /url: /admin/courses?section=lesson
                    - generic [ref=e78]: Topic
                - listitem [ref=e79]:
                  - link "Task" [ref=e80] [cursor=pointer]:
                    - /url: /admin/courses?section=task
                    - generic [ref=e81]: Task
            - listitem [ref=e82]:
              - link "Challenges" [ref=e83] [cursor=pointer]:
                - /url: /admin/challenges
                - img [ref=e84]
                - generic [ref=e93]: Challenges
            - listitem [ref=e94]:
              - link "Users" [ref=e95] [cursor=pointer]:
                - /url: /admin/users
                - img [ref=e96]
                - generic [ref=e101]: Users
      - list [ref=e103]:
        - listitem [ref=e104]:
          - button "AU @admin Lv.16" [ref=e105]:
            - generic [ref=e107]: AU
            - generic [ref=e108]:
              - generic [ref=e109]: "@admin"
              - generic [ref=e111]: Lv.16
            - img [ref=e114]
    - main [ref=e117]:
      - generic [ref=e120]:
        - button "Toggle Sidebar" [ref=e121]:
          - img
          - generic [ref=e122]: Toggle Sidebar
        - navigation "breadcrumb" [ref=e124]:
          - list [ref=e125]:
            - listitem [ref=e126]:
              - link "Home" [ref=e127] [cursor=pointer]:
                - /url: /dashboard
            - listitem [ref=e128]:
              - img [ref=e129]
            - listitem [ref=e131]:
              - link "Management" [ref=e132] [cursor=pointer]:
                - /url: /admin/courses
            - listitem [ref=e133]:
              - img [ref=e134]
            - listitem [ref=e136]:
              - link "Courses" [disabled] [ref=e137]
      - generic [ref=e138]:
        - generic [ref=e139]:
          - generic [ref=e140]:
            - heading "Course Title Management" [level=1] [ref=e141]
            - paragraph [ref=e142]: Manage course titles, publication status, and high-level metadata.
          - generic [ref=e143]:
            - textbox "Search Course..." [ref=e145]
            - button "Create Course" [ref=e146]:
              - img
              - text: Create Course
        - generic [ref=e149]:
          - table [ref=e152]:
            - rowgroup [ref=e153]:
              - row "Title Topics Tasks Enrollments Status" [ref=e154]:
                - columnheader [ref=e155]
                - columnheader "Title" [ref=e156]
                - columnheader "Topics" [ref=e157]
                - columnheader "Tasks" [ref=e158]
                - columnheader "Enrollments" [ref=e159]
                - columnheader "Status" [ref=e160]
                - columnheader [ref=e161]
            - rowgroup [ref=e162]:
              - row "Drag row CRS-0001 Crypto Foundations 3 0 12 Published" [ref=e163]:
                - cell "Drag row CRS-0001" [ref=e164]:
                  - button "Drag row CRS-0001" [ref=e166]:
                    - img [ref=e167]
                - cell "Crypto Foundations" [ref=e174]:
                  - paragraph [ref=e176]: Crypto Foundations
                - cell "3" [ref=e177]
                - cell "0" [ref=e178]
                - cell "12" [ref=e179]
                - cell "Published" [ref=e180]:
                  - generic [ref=e182]:
                    - img
                    - text: Published
                - cell [ref=e183]:
                  - button [ref=e185]:
                    - img
              - row "Drag row CRS-0002 Applied Classical Ciphers 3 0 14 Published" [ref=e186]:
                - cell "Drag row CRS-0002" [ref=e187]:
                  - button "Drag row CRS-0002" [ref=e189]:
                    - img [ref=e190]
                - cell "Applied Classical Ciphers" [ref=e197]:
                  - paragraph [ref=e199]: Applied Classical Ciphers
                - cell "3" [ref=e200]
                - cell "0" [ref=e201]
                - cell "14" [ref=e202]
                - cell "Published" [ref=e203]:
                  - generic [ref=e205]:
                    - img
                    - text: Published
                - cell [ref=e206]:
                  - button [ref=e208]:
                    - img
              - row "Drag row CRS-0003 Modern Crypto Principles 3 0 12 Published" [ref=e209]:
                - cell "Drag row CRS-0003" [ref=e210]:
                  - button "Drag row CRS-0003" [ref=e212]:
                    - img [ref=e213]
                - cell "Modern Crypto Principles" [ref=e220]:
                  - paragraph [ref=e222]: Modern Crypto Principles
                - cell "3" [ref=e223]
                - cell "0" [ref=e224]
                - cell "12" [ref=e225]
                - cell "Published" [ref=e226]:
                  - generic [ref=e228]:
                    - img
                    - text: Published
                - cell [ref=e229]:
                  - button [ref=e231]:
                    - img
              - row "Drag row CRS-0004 Blockchain Cryptography 3 0 10 Published" [ref=e232]:
                - cell "Drag row CRS-0004" [ref=e233]:
                  - button "Drag row CRS-0004" [ref=e235]:
                    - img [ref=e236]
                - cell "Blockchain Cryptography" [ref=e243]:
                  - paragraph [ref=e245]: Blockchain Cryptography
                - cell "3" [ref=e246]
                - cell "0" [ref=e247]
                - cell "10" [ref=e248]
                - cell "Published" [ref=e249]:
                  - generic [ref=e251]:
                    - img
                    - text: Published
                - cell [ref=e252]:
                  - button [ref=e254]:
                    - img
              - row "Drag row CRS-0005 Network Security Essentials 3 0 16 Published" [ref=e255]:
                - cell "Drag row CRS-0005" [ref=e256]:
                  - button "Drag row CRS-0005" [ref=e258]:
                    - img [ref=e259]
                - cell "Network Security Essentials" [ref=e266]:
                  - paragraph [ref=e268]: Network Security Essentials
                - cell "3" [ref=e269]
                - cell "0" [ref=e270]
                - cell "16" [ref=e271]
                - cell "Published" [ref=e272]:
                  - generic [ref=e274]:
                    - img
                    - text: Published
                - cell [ref=e275]:
                  - button [ref=e277]:
                    - img
          - generic [ref=e278]:
            - generic [ref=e279]: Showing 1 - 5 of 5 Course Titles
            - generic [ref=e280]:
              - group [ref=e281]:
                - generic [ref=e282]: Rows per page
                - combobox "Rows per page" [ref=e283]:
                  - generic: "10"
                  - img
              - navigation "pagination" [ref=e284]:
                - list [ref=e285]:
                  - listitem [ref=e286]:
                    - link "Go to previous page" [disabled]:
                      - /url: "#"
                      - img
                      - generic: Previous
                  - listitem [ref=e287]:
                    - link "1" [ref=e288] [cursor=pointer]:
                      - /url: "#"
                  - listitem [ref=e289]:
                    - link "Go to next page" [disabled]:
                      - /url: "#"
                      - generic: Next
                      - img
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
  12 |     await expect(page).toHaveURL(/dashboard|courses/);
  13 | }
  14 | 
  15 | test('admin can drag and drop reorder course management rows', async ({ page }) => {
  16 |     await loginAsAdmin(page);
  17 | 
  18 |     await page.goto('/admin/courses?section=catalog');
> 19 |     await expect(page.getByRole('heading', { name: 'Course Management Title' })).toBeVisible();
     |                                                                                  ^ Error: expect(locator).toBeVisible() failed
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