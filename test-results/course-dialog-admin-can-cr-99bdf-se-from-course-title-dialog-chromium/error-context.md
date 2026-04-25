# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: course-dialog.spec.ts >> admin can create and edit course from course title dialog
- Location: tests\e2e\course-dialog.spec.ts:15:1

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
  15 | test('admin can create and edit course from course title dialog', async ({ page }) => {
  16 |     await loginAsAdmin(page);
  17 | 
  18 |     await page.goto('/admin/courses?section=catalog');
> 19 |     await expect(page.getByRole('heading', { name: 'Course Management Title' })).toBeVisible();
     |                                                                                  ^ Error: expect(locator).toBeVisible() failed
  20 | 
  21 |     const uniqueTitle = `E2E Dialog Course ${Date.now()}`;
  22 |     const updatedTitle = `${uniqueTitle} Updated`;
  23 |     const createDescription = 'Created from dialog via Playwright';
  24 |     const updatedDescription = 'Updated from dialog via Playwright';
  25 | 
  26 |     await page.getByRole('button', { name: 'Create Course' }).click();
  27 |     await expect(page.getByRole('dialog')).toBeVisible();
  28 | 
  29 |     await page.locator('#course-title').fill(uniqueTitle);
  30 |     await page.locator('#course-description').fill(createDescription);
  31 |     await page.getByRole('button', { name: 'Save changes' }).click();
  32 | 
  33 |     await expect(page.getByRole('dialog')).not.toBeVisible();
  34 | 
  35 |     await page.getByPlaceholder('Search Course Title...').fill(uniqueTitle);
  36 | 
  37 |     const courseRow = page
  38 |         .locator('tbody tr')
  39 |         .filter({ has: page.locator('p.font-medium', { hasText: uniqueTitle }) })
  40 |         .first();
  41 | 
  42 |     await expect(courseRow).toBeVisible();
  43 | 
  44 |     await courseRow.getByRole('button').last().click();
  45 |     await page.getByRole('menuitem', { name: 'Edit' }).click();
  46 | 
  47 |     const dialog = page.getByRole('dialog');
  48 |     await expect(dialog).toBeVisible();
  49 | 
  50 |     await dialog.locator('#course-title').fill(updatedTitle);
  51 |     await dialog.locator('#course-description').fill(updatedDescription);
  52 |     await dialog.getByRole('button', { name: 'Update course' }).click();
  53 | 
  54 |     await expect(dialog).not.toBeVisible();
  55 | 
  56 |     await page.getByPlaceholder('Search Course Title...').fill(updatedTitle);
  57 |     await expect(page.locator('tbody tr p.font-medium', { hasText: updatedTitle }).first()).toBeVisible();
  58 | });
  59 | 
```