import { execSync } from 'child_process';

import { test, expect } from '@playwright/test';
import type { Page, BrowserContext } from '@playwright/test';

// ----------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? 'admin@example.com';
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? 'password';
const CHALLENGE_SLUG = 'caesar-warmup';
const QUESTIONS_PER_SESSION = 5;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Login as admin user. Retries if rate-limited.
 */
async function loginAsAdmin(page: Page): Promise<void> {
    for (let attempt = 0; attempt < 3; attempt++) {
        await page.goto('/login');
        await page.getByLabel('Email or Username').fill(ADMIN_EMAIL);
        await page.locator('#password').fill(ADMIN_PASSWORD);
        await page.getByRole('button', { name: 'Sign In' }).click();

        try {
            await expect(page).toHaveURL(/dashboard|courses/, {
                timeout: 10_000,
            });

            return;
        } catch {
            // Possibly rate-limited — wait and retry
            if (attempt < 2) {
                await page.waitForTimeout(15_000);
            }
        }
    }

    // Final attempt — let it throw
    await expect(page).toHaveURL(/dashboard|courses/, { timeout: 15_000 });
}

/**
 * Delete all challenge submissions for admin user (id=1).
 */
function cleanAdminChallengeSubmissions(): void {
    try {
        execSync(
            'php artisan tinker --execute "App\\Models\\ChallengeSubmission::where(\'user_id\', 1)->delete();"',
            {
                cwd: process.cwd(),
                timeout: 15_000,
                stdio: 'pipe',
            },
        );
    } catch {
        // Ignore
    }
}

/**
 * Answer the current quiz question based on its type.
 */
async function answerCurrentQuestion(page: Page): Promise<void> {
    await expect(page.getByText(/Question \d+ of \d+/)).toBeVisible({
        timeout: 10_000,
    });

    // True/False
    const trueButton = page.getByRole('button', { name: 'True', exact: true });

    if (await trueButton.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await trueButton.click();

        return;
    }

    // Fill-in-the-blank
    const fillBlankInput = page.getByPlaceholder('Fill in the blank...');

    if (await fillBlankInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await fillBlankInput.fill('test');
        await page.getByRole('button', { name: 'Submit' }).click();

        return;
    }

    // Text answer
    const textInput = page.getByPlaceholder('Type your answer...');

    if (await textInput.isVisible({ timeout: 500 }).catch(() => false)) {
        await textInput.fill('test');
        await page.getByRole('button', { name: 'Submit' }).click();

        return;
    }

    // MCQ — click the first option
    const optionButton = page.locator('.grid button[type="button"]').first();
    await expect(optionButton).toBeVisible({ timeout: 3_000 });
    await optionButton.click();
}

/**
 * Complete a full quiz session by answering all questions.
 */
async function completeQuizSession(page: Page): Promise<void> {
    for (let i = 0; i < QUESTIONS_PER_SESSION; i++) {
        await expect(
            page.getByText(new RegExp(`Question ${i + 1} of \\d+`)),
        ).toBeVisible({ timeout: 10_000 });

        await answerCurrentQuestion(page);

        await expect(page.getByText(/Correct!|Incorrect/).first()).toBeVisible({
            timeout: 10_000,
        });

        if (i < QUESTIONS_PER_SESSION - 1) {
            const continueButton = page.getByRole('button', {
                name: 'Continue →',
            });

            if (
                await continueButton
                    .isVisible({ timeout: 1_500 })
                    .catch(() => false)
            ) {
                await continueButton.click();
            }

            await page.waitForTimeout(1_000);
        }
    }

    await expect(page.getByText('Quiz Complete!')).toBeVisible({
        timeout: 15_000,
    });
}

// ---------------------------------------------------------------------------
// Tests — Challenge Catalog (login once, reuse context)
// ---------------------------------------------------------------------------

test.describe('Challenge Catalog', () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        cleanAdminChallengeSubmissions();
        context = await browser.newContext();
        page = await context.newPage();
        await loginAsAdmin(page);
    });

    test.afterAll(async () => {
        await context?.close();
    });

    test('catalog page loads and shows challenge cards', async () => {
        await page.goto('/challenges');

        await expect(
            page.getByRole('heading', { name: 'Challenges', level: 1 }),
        ).toBeVisible({ timeout: 10_000 });

        const challengeLinks = page.getByRole('link', {
            name: /start challenge|view result|view details|view results/i,
        });
        await expect(challengeLinks.first()).toBeVisible({ timeout: 10_000 });

        const count = await challengeLinks.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('active challenge shows "Start challenge" button', async () => {
        await page.goto('/challenges');

        const startLink = page.getByRole('link', { name: 'Start challenge' });
        await expect(startLink.first()).toBeVisible({ timeout: 10_000 });
    });

    test('clicking challenge action navigates to detail page', async () => {
        await page.goto('/challenges');

        const actionLink = page
            .getByRole('link', {
                name: /start challenge|view result/i,
            })
            .first();
        await expect(actionLink).toBeVisible({ timeout: 10_000 });
        await actionLink.click();

        await expect(page).toHaveURL(/\/challenges\/[\w-]+/, {
            timeout: 10_000,
        });
    });

    test('pre-quiz screen shows challenge info and Start Quiz button', async () => {
        await page.goto(`/challenges/${CHALLENGE_SLUG}`);

        await expect(
            page.getByRole('heading', { name: /Caesar Warmup/i }),
        ).toBeVisible({ timeout: 10_000 });

        await expect(page.getByText(/per question/)).toBeVisible();
        await expect(page.getByText(/questions/)).toBeVisible();

        await expect(
            page.getByRole('button', { name: 'Start Quiz' }),
        ).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Tests — Quiz Interaction (login once, reuse context)
// ---------------------------------------------------------------------------

test.describe('Quiz Interaction', () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        cleanAdminChallengeSubmissions();
        context = await browser.newContext();
        page = await context.newPage();
        await loginAsAdmin(page);
    });

    test.afterAll(async () => {
        cleanAdminChallengeSubmissions();
        await context?.close();
    });

    test('quiz shows question header, score badge, and timer', async () => {
        await page.goto(`/challenges/${CHALLENGE_SLUG}`);
        await page.getByRole('button', { name: 'Start Quiz' }).click();

        await expect(page.getByText(/Question 1 of \d+/)).toBeVisible({
            timeout: 5_000,
        });
        await expect(page.getByText(/\d+ pts/)).toBeVisible();
        await expect(page.getByText(/\d+s/)).toBeVisible();
    });

    test('answering a question shows feedback', async () => {
        // Clean and start fresh (previous test started a session)
        cleanAdminChallengeSubmissions();

        await page.goto(`/challenges/${CHALLENGE_SLUG}`);
        await page.getByRole('button', { name: 'Start Quiz' }).click();
        await expect(page.getByText(/Question 1 of \d+/)).toBeVisible({
            timeout: 5_000,
        });

        await answerCurrentQuestion(page);

        await expect(page.getByText(/Correct!|Incorrect/).first()).toBeVisible({
            timeout: 10_000,
        });
    });

    test('completing all questions shows Quiz Complete summary', async () => {
        cleanAdminChallengeSubmissions();

        await page.goto(`/challenges/${CHALLENGE_SLUG}`);
        await page.getByRole('button', { name: 'Start Quiz' }).click();

        await completeQuizSession(page);

        await expect(page.getByText('Total Points')).toBeVisible();
        await expect(page.getByText('Correct')).toBeVisible();
        await expect(page.getByText('Accuracy')).toBeVisible();
        await expect(page.getByText('Avg Time')).toBeVisible();
    });
});

// ---------------------------------------------------------------------------
// Tests — Completed Challenge Flow (login once, reuse context)
// ---------------------------------------------------------------------------

test.describe('Completed Challenge Flow', () => {
    let context: BrowserContext;
    let page: Page;

    test.beforeAll(async ({ browser }) => {
        cleanAdminChallengeSubmissions();
        context = await browser.newContext();
        page = await context.newPage();
        await loginAsAdmin(page);

        // Complete the challenge once
        await page.goto(`/challenges/${CHALLENGE_SLUG}`);
        await page.getByRole('button', { name: 'Start Quiz' }).click();
        await completeQuizSession(page);
    });

    test.afterAll(async () => {
        cleanAdminChallengeSubmissions();
        await context?.close();
    });

    test('revisiting completed challenge shows "Challenge Completed"', async () => {
        await page.goto(`/challenges/${CHALLENGE_SLUG}`);

        await expect(page.getByText('Challenge Completed')).toBeVisible({
            timeout: 10_000,
        });
        await expect(
            page.getByText('You have already completed this challenge.'),
        ).toBeVisible();
        await expect(page.getByText('Best Score')).toBeVisible();
        await expect(
            page.getByRole('link', { name: 'All Challenges' }),
        ).toBeVisible();
    });

    test('completed challenge shows "View result" on catalog', async () => {
        await page.goto('/challenges');

        await expect(
            page.getByRole('link', { name: 'View result' }).first(),
        ).toBeVisible({ timeout: 10_000 });
    });

    test('"All Challenges" link navigates back to catalog', async () => {
        await page.goto(`/challenges/${CHALLENGE_SLUG}`);
        await expect(page.getByText('Challenge Completed')).toBeVisible({
            timeout: 10_000,
        });

        await page.getByRole('link', { name: 'All Challenges' }).click();

        await expect(page).toHaveURL(/\/challenges$/, { timeout: 10_000 });
    });
});
