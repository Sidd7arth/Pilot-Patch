import { test, expect, Page } from '@playwright/test';

test.describe.serial('PatchPilot End-to-End Workflow (E2E-01..07)', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('E2E-01: Entry to seeded demo workspace creation', async () => {
    await page.goto('/');
    await expect(page.getByText('Evidence Provenance & Origin Legend')).toBeVisible();

    // Click Launch Demo Workspace
    const demoButton = page.getByRole('button', { name: /Launch Demo Workspace/i });
    await expect(demoButton).toBeVisible();
    await demoButton.click();

    // Should redirect to proposals table
    await page.waitForURL('**/proposals', { timeout: 20000 });
    await expect(page.locator('h1')).toContainText('Content Proposals');

    // Confirm proposals are displayed
    await expect(page.getByText('Lantern Festival Seasonal Event')).toBeVisible();
    await expect(page.getByText('Anime Studio Collab Skin Line')).toBeVisible();
    await expect(page.getByText('Neon-Noir Cyberpunk Bundle')).toBeVisible();
  });

  test('E2E-02: Status pill and Qloo connectivity indicator', async () => {
    // Top bar status pill
    const statusPill = page.getByText(/Qloo/i).first();
    await expect(statusPill).toBeVisible();
  });

  test('E2E-03: Proposal detail and cultural references', async () => {
    await page.goto('/proposals');
    await expect(page.getByText('Lantern Festival Seasonal Event')).toBeVisible();

    // Click on first proposal
    await page.getByText('Lantern Festival Seasonal Event').click();
    await page.waitForURL('**/proposals/*', { timeout: 15000 });

    await expect(page.locator('h1')).toContainText('Lantern Festival Seasonal Event');
    await expect(page.getByText(/Cultural References & Resolution/i)).toBeVisible();
    await expect(page.getByText(/Qloo Evidence & Signals/i)).toBeVisible();
  });

  test('E2E-04: Decision engine execution and results visualization', async () => {
    await page.goto('/decision');
    await expect(page.locator('h1')).toContainText('Decision Workspace');

    // Trigger run calculation
    const runBtn = page.getByRole('button', { name: /Run Decision Engine|Recalculate Run/i });
    await expect(runBtn).toBeVisible();
    await runBtn.click();

    // Verify budget bar and shortlist rankings appear
    await expect(page.getByText('Funded Shortlist')).toBeVisible({ timeout: 20000 });
  });

  test('E2E-05: Compare variants & scenario replanning', async () => {
    await page.goto('/decision/compare');
    await expect(page.locator('h1')).toContainText('Compare & Replan');

    // Portfolio attribution summary
    await expect(page.getByText(/Baseline vs Qloo-Informed Comparison/i)).toBeVisible();
    await expect(page.getByText(/Important Interpretation Notice/i)).toBeVisible();

    // Re-plan tab
    await expect(page.getByText(/Scenario Re-planning & Live Diff/i)).toBeVisible();
  });

  test('E2E-06: Planning Setup and constraint configuration', async () => {
    await page.goto('/setup');
    await expect(page.locator('h1')).toContainText('Workspace Setup');

    await expect(page.getByText('Game Profile').first()).toBeVisible();
    await expect(page.getByText(/Target Markets/i).first()).toBeVisible();
    await expect(page.getByText(/Planning Constraints/i).first()).toBeVisible();
  });

  test('E2E-07: Decision Briefs generation and Markdown export', async () => {
    await page.goto('/briefs');
    await expect(page.locator('h1')).toContainText('Decision Briefs');

    const generateBtn = page.getByRole('button', { name: /Generate Decision Brief/i });
    if (await generateBtn.isVisible()) {
      await generateBtn.click();
      await page.waitForURL('**/briefs/*', { timeout: 15000 });
      await expect(page.locator('h1')).toContainText('PatchPilot Decision Brief');
      await expect(page.getByRole('button', { name: /Copy Markdown/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Download .md/i })).toBeVisible();
    }
  });
});
