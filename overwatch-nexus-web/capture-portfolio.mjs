import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const outputDir = "c:/Users/RIYAN/Desktop/QG IA JOB/Projet ANTIGRAVITY/Overwatch DASHBOARD/portfolio-assets";
const baseUrl = "http://localhost:3001";

async function ensureDir() {
  await fs.mkdir(outputDir, { recursive: true });
}

async function main() {
  await ensureDir();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);

  await page.selectOption("select", { label: "King's Row" }).catch(() => {});

  const selects = await page.locator("section select").all();
  const enemyNames = ["Reinhardt", "Tracer", "Widowmaker", "Ana", "Lucio"];
  for (let i = 0; i < Math.min(enemyNames.length, selects.length - 2); i += 1) {
    await selects[i + 2].selectOption({ label: enemyNames[i] }).catch(async () => {
      await selects[i + 2].selectOption({ index: 1 });
    });
  }

  await page.screenshot({
    path: path.join(outputDir, "1_enemy-composition-analysis.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /counter parfait/i }).click();
  await page.waitForTimeout(1400);
  await page.screenshot({
    path: path.join(outputDir, "2_recommended-counters.png"),
    fullPage: true,
  });

  await page.locator("text=3. RECOMMANDATIONS PAR MAP").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outputDir, "3_map-based-recommendations.png"),
    fullPage: true,
  });

  await page.locator("text=4. FICHE DÉTAILLÉE").first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.screenshot({
    path: path.join(outputDir, "4_detailed-hero-stats.png"),
    fullPage: true,
  });

  await browser.close();
}

main();
