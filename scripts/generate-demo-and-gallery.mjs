// scripts/generate-demo-and-gallery.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const docsGalleryDir = path.join(repoRoot, 'docs', 'gallery');
const videoRawDir = path.join(docsGalleryDir, 'video_raw');
const artifactGalleryDir =
  'C:\\Users\\SIDDARTHA\\.gemini\\antigravity\\brain\\07cdbef6-4175-46fc-9352-42f55036d6e8\\gallery';

fs.mkdirSync(docsGalleryDir, { recursive: true });
fs.mkdirSync(videoRawDir, { recursive: true });
fs.mkdirSync(artifactGalleryDir, { recursive: true });

async function run() {
  console.log('======================================================================');
  console.log('PatchPilot: High-Resolution Photo Gallery & Video Demo Generator');
  console.log('======================================================================\n');

  const { chromium } = await import('@playwright/test');

  const browser = await chromium.launch({
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    recordVideo: {
      dir: videoRawDir,
      size: { width: 1920, height: 1080 },
    },
  });

  const page = await context.newPage();

  async function takeShot(filename, description) {
    const docPath = path.join(docsGalleryDir, filename);
    const artPath = path.join(artifactGalleryDir, filename);
    await page.screenshot({ path: docPath, fullPage: false });
    fs.copyFileSync(docPath, artPath);
    console.log(`[Screenshot Captured] ${filename} - ${description}`);
  }

  async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  try {
    // ------------------------------------------------------------------
    // Scene 1: Landing Page Hero & Value Proposition
    // ------------------------------------------------------------------
    console.log('[Scene 1] Navigating to Landing Page (http://localhost:3000)...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await sleep(2000);
    await takeShot(
      '01_landing_hero.png',
      'Landing Page Hero with Cultural Signals value proposition',
    );

    // Smooth scroll down to 3-Stage Pipeline & Architecture
    console.log('[Scene 1] Scrolling to 3-Stage Pipeline & Architecture...');
    await page.evaluate(() => window.scrollBy({ top: 850, behavior: 'smooth' }));
    await sleep(2500);
    await takeShot(
      '02_landing_pipeline_architecture.png',
      '3-Stage Decision Pipeline and Architecture',
    );

    // Smooth scroll down to Evidence Provenance Legend & FAQ
    console.log('[Scene 1] Scrolling to Provenance Legend & Features...');
    await page.evaluate(() => window.scrollBy({ top: 900, behavior: 'smooth' }));
    await sleep(2500);
    await takeShot(
      '03_landing_provenance_legend.png',
      'Evidence Provenance Legend & FAQ Accordions',
    );

    // Scroll back to top
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
    await sleep(1500);

    // ------------------------------------------------------------------
    // Scene 2: Launch Demo Workspace & Content Proposals
    // ------------------------------------------------------------------
    console.log('[Scene 2] Launching Demo Workspace ("Ember Arena")...');
    const demoBtn = page.getByRole('button', { name: /Launch Demo Workspace/i });
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
    } else {
      await page.goto('http://localhost:3000/proposals', { waitUntil: 'networkidle' });
    }

    await page.waitForURL('**/proposals', { timeout: 25000 });
    await sleep(2500);
    await takeShot(
      '04_proposals_roadmap.png',
      'Content Proposals Portfolio with budget allocations',
    );

    // ------------------------------------------------------------------
    // Scene 3: Proposal Detail & Cultural References
    // ------------------------------------------------------------------
    console.log('[Scene 3] Opening Proposal Detail for "Lantern Festival Seasonal Event"...');
    await page.getByText('Lantern Festival Seasonal Event').first().click();
    await page.waitForURL('**/proposals/*', { timeout: 20000 });
    await sleep(2500);
    await takeShot(
      '05_proposal_detail_cultural_signals.png',
      'Proposal Detail: Operational parameters, Qloo candidate resolution, and market signals',
    );

    // ------------------------------------------------------------------
    // Scene 4: Cultural Evidence Explorer
    // ------------------------------------------------------------------
    console.log('[Scene 4] Navigating to Cultural Evidence Explorer...');
    await page.goto('http://localhost:3000/evidence', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2500);
    await takeShot(
      '06_cultural_evidence_explorer.png',
      'Cultural Evidence Explorer: Qloo taste correlations and provenance audit',
    );

    // ------------------------------------------------------------------
    // Scene 5: Workspace Setup & Planning Constraints
    // ------------------------------------------------------------------
    console.log('[Scene 5] Navigating to Workspace Setup...');
    await page.goto('http://localhost:3000/setup', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2500);
    await takeShot(
      '07_workspace_setup_constraints.png',
      'Workspace Setup: Game Profile, Target Markets, and Budget Constraints',
    );

    // ------------------------------------------------------------------
    // Scene 6: Deterministic Decision Workspace (Knapsack Allocation)
    // ------------------------------------------------------------------
    console.log('[Scene 6] Navigating to Decision Workspace...');
    await page.goto('http://localhost:3000/decision', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2000);

    const runBtn = page.getByRole('button', { name: /Run Decision Engine|Recalculate Run/i });
    if (await runBtn.isVisible()) {
      console.log('[Scene 6] Executing Decision Engine...');
      await runBtn.click();
      await sleep(3000);
    }
    await takeShot(
      '08_decision_engine_workspace.png',
      'Decision Workspace: Deterministic greedy knapsack allocation, funded shortlist, and canonical inputHash',
    );

    // ------------------------------------------------------------------
    // Scene 7: Scenario Comparison & Re-planning
    // ------------------------------------------------------------------
    console.log('[Scene 7] Navigating to Compare & Replan...');
    await page.goto('http://localhost:3000/decision/compare', {
      waitUntil: 'networkidle',
      timeout: 20000,
    });
    await sleep(2500);
    await takeShot(
      '09_scenario_replanning_and_comparison.png',
      'Compare & Replan: Baseline vs Qloo-informed attribution and live scenario diffs',
    );

    // ------------------------------------------------------------------
    // Scene 8: Executive Decision Briefs & Export
    // ------------------------------------------------------------------
    console.log('[Scene 8] Navigating to Decision Briefs...');
    await page.goto('http://localhost:3000/briefs', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2000);

    const generateBtn = page.getByRole('button', { name: /Generate Decision Brief/i });
    if (await generateBtn.isVisible()) {
      console.log('[Scene 8] Generating Executive Decision Brief...');
      await generateBtn.click();
      await page.waitForURL('**/briefs/*', { timeout: 20000 });
      await sleep(2500);
    }
    await takeShot(
      '10_decision_brief_export.png',
      'Decision Brief: Audit-grade executive markdown brief with standard disclaimers and export controls',
    );

    // ------------------------------------------------------------------
    // Scene 9: Real Qloo Integration Monitor & Live Probe
    // ------------------------------------------------------------------
    console.log('[Scene 9] Navigating to Qloo Integration Dashboard...');
    await page.goto('http://localhost:3000/integration', {
      waitUntil: 'networkidle',
      timeout: 20000,
    });
    await sleep(2000);

    const probeBtn = page.getByRole('button', { name: /Probe Live API/i });
    if (await probeBtn.isVisible()) {
      console.log('[Scene 9] Triggering live Qloo API health probe...');
      await probeBtn.click();
      await sleep(3500);
    }
    await takeShot(
      '11_qloo_integration_monitor.png',
      'Qloo Integration Monitor: Real-time health, quota meters, capability matrix, and live probe verification',
    );

    // ------------------------------------------------------------------
    // Scene 10: Conclusion & Outro
    // ------------------------------------------------------------------
    console.log('[Scene 10] Returning to Workspace Overview for smooth outro...');
    await page.goto('http://localhost:3000/app', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(3000);
    await takeShot(
      '12_workspace_overview.png',
      'Workspace Overview: High-level studio management and rapid module navigation',
    );

    console.log('\n[Video Finalization] Closing browser context to commit video file...');
    await page.close();
    await context.close();
    await browser.close();

    // Find the generated video
    const videoFiles = fs.readdirSync(videoRawDir).filter((f) => f.endsWith('.webm'));
    if (videoFiles.length > 0) {
      const generatedVideoPath = path.join(videoRawDir, videoFiles[0]);
      const finalVideoDocPath = path.join(docsGalleryDir, 'patchpilot_demo_walkthrough.webm');
      const finalVideoArtPath = path.join(artifactGalleryDir, 'patchpilot_demo_walkthrough.webm');

      fs.copyFileSync(generatedVideoPath, finalVideoDocPath);
      fs.copyFileSync(generatedVideoPath, finalVideoArtPath);

      const stats = fs.statSync(finalVideoDocPath);
      console.log(`\n✓ Video demo successfully saved:`);
      console.log(
        `  - Repository location: ${finalVideoDocPath} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`,
      );
      console.log(`  - Artifact location:   ${finalVideoArtPath}`);
    } else {
      console.warn('Warning: No video file found in videoRawDir.');
    }

    console.log('\n✓ Photo gallery and video demo generation complete!');
  } catch (err) {
    console.error('Error during demo generation:', err);
    await browser.close();
    process.exit(1);
  }
}

run();
