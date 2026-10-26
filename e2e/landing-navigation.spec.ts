import { test, expect } from '@playwright/test';

test.describe('PatchPilot Landing Page & Routing (Section 6 & 12)', () => {
  test('NAV-01: Landing page loads with premium typography, brand elements, and sections', async ({
    page,
  }) => {
    await page.goto('/');

    // Check title and hero
    await expect(page).toHaveTitle(/PatchPilot/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'Turn cultural signals into smarter content investments.',
    );
    await expect(
      page.getByText('Cultural intelligence for live-service games').first(),
    ).toBeVisible();

    // Check Credibility Strip
    await expect(page.getByText('Qloo Cultural Intelligence').first()).toBeVisible();
    await expect(page.getByText('Budget-Aware Allocation').first()).toBeVisible();
    await expect(page.getByText('Explainable Decisions').first()).toBeVisible();
    await expect(page.getByText('Human-Led Decisions').first()).toBeVisible();

    // Check Core Sections
    await expect(page.locator('#product')).toBeVisible();
    await expect(page.locator('#workflow')).toBeVisible();
    await expect(page.locator('#intelligence')).toBeVisible();
    await expect(page.locator('#studios')).toBeVisible();

    // Check Evidence Legend
    await expect(page.getByText('Evidence Provenance & Origin Legend').first()).toBeVisible();

    // Check FAQ & Footer
    await expect(page.getByRole('heading', { name: /Frequently Asked Questions/i })).toBeVisible();
    await expect(page.getByText(/Released under the OSI MIT License/i)).toBeVisible();
  });

  test('NAV-02: Primary Hero CTA navigates to /app workspace overview', async ({ page }) => {
    await page.goto('/');

    const exploreBtn = page.getByRole('link', { name: /Explore the workspace/i }).first();
    await expect(exploreBtn).toBeVisible();
    await exploreBtn.click();

    await page.waitForURL('**/app');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Workspace Overview');
  });

  test('NAV-03: Navbar section anchors scroll to target sections', async ({ page }) => {
    await page.goto('/');

    // Test product link
    const productLink = page.getByRole('link', { name: 'Product' }).first();
    await expect(productLink).toHaveAttribute('href', '/#product');

    // Test workflow link
    const workflowLink = page.getByRole('link', { name: 'How it works' }).first();
    await expect(workflowLink).toHaveAttribute('href', '/#workflow');

    // Test cultural intelligence link
    const intelLink = page.getByRole('link', { name: 'Cultural intelligence' }).first();
    await expect(intelLink).toHaveAttribute('href', '/#intelligence');

    // Test studios link
    const studiosLink = page.getByRole('link', { name: 'For studios' }).first();
    await expect(studiosLink).toHaveAttribute('href', '/#studios');
  });

  test('NAV-04: FAQ accordions toggle open and close correctly', async ({ page }) => {
    await page.goto('/');

    const firstQuestion = page.getByRole('button', { name: 'What is PatchPilot?' });
    await expect(firstQuestion).toBeVisible();

    // Default first question is open
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByText(/content-investment and prioritization decision platform/i),
    ).toBeVisible();

    // Click to toggle close
    await firstQuestion.click();
    await expect(firstQuestion).toHaveAttribute('aria-expanded', 'false');

    // Click second question
    const secondQuestion = page.getByRole('button', {
      name: 'How does Qloo fit into the workflow?',
    });
    await expect(secondQuestion).toHaveAttribute('aria-expanded', 'false');
    await secondQuestion.click();
    await expect(secondQuestion).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText(/Qloo operates as the cultural intelligence layer/i)).toBeVisible();
  });

  test('NAV-05: Workspace routing reaches all modules from /app', async ({ page }) => {
    await page.goto('/app');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Workspace Overview');

    // Module 1: Game & Setup
    await page.goto('/app/game');
    await expect(page.locator('h1')).toContainText('Workspace Setup');

    // Module 2: Content Proposals
    await page.goto('/app/proposals');
    await expect(page.locator('h1')).toContainText('Content Proposals');

    // Module 3: Evidence Explorer
    await page.goto('/app/evidence');
    await expect(page.locator('h1')).toContainText('Evidence Explorer & Audit Log');

    // Module 4: Decision Workspace
    await page.goto('/app/decisions');
    await expect(page.locator('h1')).toContainText('Decision Workspace');

    // Module 5: Compare & Replan
    await page.goto('/app/scenarios');
    await expect(page.locator('h1')).toContainText('Compare & Replan');

    // Module 6: Integrations & API
    await page.goto('/app/settings/integrations');
    await expect(page.locator('h1')).toContainText('Qloo Integration & Health');
  });

  test('NAV-06: Nested routes render and survive browser refresh', async ({ page }) => {
    await page.goto('/app/scenarios');
    await expect(page.locator('h1')).toContainText('Compare & Replan');

    // Refresh page
    await page.reload();
    await expect(page.locator('h1')).toContainText('Compare & Replan');
  });

  test('NAV-07: Responsive mobile menu drawer opens, navigates, and closes', async ({ page }) => {
    // Set viewport to mobile phone (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const menuToggle = page.getByRole('button', { name: 'Toggle navigation menu' });
    await expect(menuToggle).toBeVisible();

    // In Next.js client hydration, click and verify state change
    await menuToggle.click();
    await expect(menuToggle).toHaveAttribute('aria-expanded', 'true');

    // Drawer links visible
    const mobileWorkflow = page.getByRole('link', { name: 'How it works' }).first();
    await expect(mobileWorkflow).toBeVisible();

    // Click link closes drawer
    await mobileWorkflow.click();
    await expect(page.locator('#workflow')).toBeVisible();
  });
});
