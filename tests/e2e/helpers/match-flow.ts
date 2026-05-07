import { expect, type Browser, type BrowserContext, type Page, type TestInfo } from "@playwright/test";
import { VIEWPORTS, type ViewportName } from "./viewports";

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";

export async function newContextPage(browser: Browser, viewport: ViewportName): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: VIEWPORTS[viewport] });
  const page = await context.newPage();
  return { context, page };
}

export async function openApp(page: Page): Promise<void> {
  await page.goto(BASE_URL);
  await expect(page.getByTestId("setup-screen")).toBeVisible();
}

export async function createHumanVsAiGame(page: Page, seed: string): Promise<void> {
  await openApp(page);
  await page.getByLabel("Spielart").selectOption("human_vs_ai");
  await page.getByLabel("Deine Seite").selectOption("runner");
  await page.getByLabel("KI-Decks").selectOption("fixed");
  await page.getByLabel("Seed").fill(seed);
  await page.getByTestId("create-match").click();
  await expect(page.getByTestId("active-game")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("ai-pacing")).toBeVisible();
  await resolveSetupChoices(page);
  await advanceAiUntilHumanTurn(page);
}

export async function createHumanVsHumanLobby(page: Page, seed: string, side: "runner" | "corp" = "runner"): Promise<string> {
  await openApp(page);
  await page.getByLabel("Spielart").selectOption("human_vs_human");
  await page.getByLabel("Seitenzuteilung").selectOption(side);
  await page.getByLabel("Spielziel").selectOption("rules_match");
  await page.getByLabel("Countdown").selectOption("3");
  await page.getByLabel("Seed").fill(seed);
  await page.getByLabel("Name").fill(side === "corp" ? "Host Corp V107" : "Host Runner V107");
  await page.getByTestId("create-match").click();
  await expect(page.getByTestId("start-lobby")).toBeVisible({ timeout: 20_000 });
  const joinUrl = await page.getByTestId("join-link").inputValue();
  expect(joinUrl).toContain("joinToken=");
  return joinUrl;
}

export async function joinHumanVsHumanLobby(page: Page, joinUrl: string): Promise<void> {
  await page.goto(joinUrl);
  await expect(page.getByTestId("setup-screen")).toBeVisible();
  await page.getByLabel("Name").fill("Joiner V107");
  await page.getByTestId("join-match").click();
  await expect(page.getByTestId("start-lobby")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Startbereitschaftslobby")).toBeVisible();
}

export async function readyAndWaitForActive(host: Page, joiner: Page): Promise<void> {
  await host.getByTestId("ready-toggle").click();
  await joiner.getByTestId("ready-toggle").click();
  await expect(host.getByText(/Countdown bis|Startet automatisch/)).toBeVisible();
  await expect(host.getByTestId("active-game")).toBeVisible({ timeout: 20_000 });
  await expect(joiner.getByTestId("active-game")).toBeVisible({ timeout: 20_000 });
  await resolveSetupChoices(host, joiner);
}

export async function clickFirstAction(page: Page, actionType: string): Promise<void> {
  const action = page.locator(`[data-testid="action-button"][data-action-type="${actionType}"]`).first();
  await expect(action).toBeVisible();
  await action.click();
}

export async function installFirstCorpCard(page: Page): Promise<string> {
  await clickActionIfVisible(page, "mandatory_draw");
  const cardSlots = page.locator(".cardSlot").filter({ has: page.getByTestId("known-card") });
  const count = await cardSlots.count();
  for (let index = 0; index < count; index += 1) {
    const slot = cardSlots.nth(index);
    const card = slot.getByTestId("known-card");
    const marker = slot.getByTestId("card-action-marker");
    if (!(await marker.isVisible().catch(() => false))) continue;
    const title = (await card.innerText()).split("\n")[0]?.trim() ?? "";
    await marker.click();
    const install = page.locator('[data-testid="card-action-button"][data-action-type="install_card"]').first();
    if (await install.isVisible().catch(() => false)) {
      await install.click();
      await expect(page.locator('[data-testid="server"] [data-testid="known-card"]').first()).toBeVisible();
      return title;
    }
  }
  throw new Error("No installable Corp card found in browser state");
}

export async function exerciseCardDisplayModes(page: Page): Promise<void> {
  await expect(page.getByTestId("card-preview")).toBeVisible();
  await page.getByTestId("card-display-text").first().click();
  await expect(page.getByTestId("card-preview")).toContainText("Kartenanzeige");
  await page.getByTestId("card-display-compact").first().click();
  await expect(page.getByTestId("card-preview")).toBeVisible();
  await page.getByTestId("card-display-image").first().click();
}

export async function expectActiveBoardBasics(page: Page): Promise<void> {
  await expect(page.getByTestId("legal-actions")).toContainText("Mögliche Aktionen");
  await expect(page.getByTestId("run-timeline")).toContainText(/Kein aktiver Run|Run auf/);
  await expect.poll(async () => page.getByTestId("server").count()).toBeGreaterThan(2);
  await expect(page.getByTestId("action-slots").first()).toContainText("Aktionen");
  await expect(page.getByTestId("credit-badge").first()).toContainText("Credits");
}

export async function expectNoCriticalLayoutOverflow(page: Page): Promise<void> {
  const report = await page.evaluate(() => {
    const horizontalOverflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const selectors = [
      '[data-testid="legal-actions"]',
      '[data-testid="run-timeline"]',
      '[data-testid="card-preview"]',
      '[data-testid="active-board"]',
      ".topbar",
      ".matchStrip"
    ];
    const outOfViewport = selectors.flatMap((selector) =>
      Array.from(document.querySelectorAll(selector)).map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          selector,
          left: rect.left,
          right: rect.right,
          width: rect.width,
          visible: rect.width > 0 && rect.height > 0,
          out: rect.left < -4 || rect.right > window.innerWidth + 4
        };
      })
    );
    return { horizontalOverflow, outOfViewport: outOfViewport.filter((entry) => entry.visible && entry.out) };
  });
  expect(report.horizontalOverflow, "document horizontal overflow").toBeLessThanOrEqual(12);
  expect(report.outOfViewport, "key surfaces outside viewport").toEqual([]);
}

export async function saveFlowScreenshot(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
}

async function clickActionIfVisible(page: Page, actionType: string): Promise<void> {
  const action = page.locator(`[data-testid="action-button"][data-action-type="${actionType}"]`).first();
  if (await action.isVisible().catch(() => false)) {
    await action.click();
  }
}

async function resolveSetupChoices(...pages: Page[]): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let clicked = false;
    for (const page of pages) {
      const keep = page.getByRole("button", { name: "Starthand behalten" }).first();
      if (await keep.isVisible().catch(() => false)) {
        await keep.click();
        clicked = true;
      }
    }
    if (!clicked) return;
    await pages[0]?.waitForTimeout(250);
  }
}

async function advanceAiUntilHumanTurn(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const humanCreditAction = page.locator('[data-testid="action-button"][data-action-type="gain_credit"]').first();
    if (await humanCreditAction.isVisible().catch(() => false)) return;
    const aiStep = page.getByRole("button", { name: /KI-Schritt|Jetzt ausführen/ });
    if (await aiStep.isEnabled().catch(() => false)) {
      await aiStep.click();
      await page.waitForTimeout(250);
      continue;
    }
    await page.waitForTimeout(250);
  }
  await expect(page.locator('[data-testid="action-button"][data-action-type="gain_credit"]').first()).toBeVisible();
}
