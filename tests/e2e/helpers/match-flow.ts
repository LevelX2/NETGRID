import { expect, type Browser, type BrowserContext, type Locator, type Page, type TestInfo } from "@playwright/test";
import { VIEWPORTS, type ViewportName } from "./viewports";

export const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3100";
const E2E_RUNNER_SNAPSHOT_ID = "demo_runner_008_snapshot_v0_8";
const E2E_CORP_SNAPSHOT_ID = "demo_corp_008_snapshot_v0_8";
const MATCH_START_SETTINGS_STORAGE_KEY = "netgrid.matchStartSettings.v1";

export async function newContextPage(browser: Browser, viewport: ViewportName): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({ viewport: VIEWPORTS[viewport] });
  const page = await context.newPage();
  return { context, page };
}

export async function openApp(page: Page): Promise<void> {
  await installE2eMatchStartSettings(page);
  await page.goto(BASE_URL);
  await expect(page.getByTestId("setup-screen")).toBeVisible();
}

export async function createHumanVsAiGame(page: Page, seed: string): Promise<void> {
  await openApp(page);
  await page.getByTestId("play-mode-human-vs-ai").click();
  await page.getByLabel("Deine Seite").selectOption("runner");
  await page.getByTestId("advanced-match-options").locator("summary").click();
  await page.getByLabel("Seed").fill(seed);
  await page.getByLabel("KI-Decks").selectOption("fixed");
  await page.getByTestId("create-match").click();
  await expect(page.getByTestId("active-game")).toBeVisible({ timeout: 20_000 });
  await resolveSetupChoices(page);
  await advanceAiUntilHumanTurn(page);
}

export async function createHumanVsHumanLobby(page: Page, seed: string, side: "runner" | "corp" = "runner"): Promise<string> {
  await openApp(page);
  await page.getByTestId("play-mode-human-vs-human").click();
  await page.getByTestId("match-format-rules-match").click();
  await selectE2eDecks(page, "Teilnehmer A · Runner-Deck", "Teilnehmer A · Korp-Deck");
  await page.getByTestId("advanced-match-options").locator("summary").click();
  await page.getByLabel("Seitenzuteilung").selectOption(side);
  await page.getByLabel("Countdown").selectOption("3");
  await page.getByLabel("Seed").fill(seed);
  await page.getByLabel("Name").fill(side === "corp" ? "Host Corp V107" : "Host Runner V107");
  await page.getByTestId("create-match").click();
  await expect(page.getByTestId("start-lobby")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /Du startest als/ })).toBeVisible();
  await expect(page.getByText("Gegenüber: Wartet auf Gegenüber")).toBeVisible();
  const joinUrl = await page.getByTestId("join-link").inputValue();
  expect(joinUrl).toContain("joinToken=");
  return joinUrl;
}

export async function joinHumanVsHumanLobby(page: Page, joinUrl: string): Promise<void> {
  await installE2eMatchStartSettings(page);
  await page.goto(joinUrl);
  await expect(page.getByTestId("setup-screen")).toBeVisible();
  await page.getByLabel("Name").fill("Joiner V107");
  await selectE2eDecks(page, "Dein Runner-Deck", "Dein Korp-Deck");
  await expect(page.getByTestId("join-link-input")).toHaveValue(/joinToken=/);
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
  const cardSlots = page.locator(".corpHqHandPanel:not(.corpOpponentHqHandPanel) .cardSlot").filter({ has: page.getByTestId("known-card") });
  const count = await cardSlots.count();
  for (let index = 0; index < count; index += 1) {
    const slot = cardSlots.nth(index);
    const card = slot.getByTestId("known-card");
    const marker = slot.getByTestId("card-action-marker");
    const title = await knownCardTitle(card);
    if (!title) continue;
    await card.click();
    const panelInstall = page.locator('[data-testid="action-button"][data-action-type="install_card"]').first();
    if (await panelInstall.isVisible().catch(() => false)) {
      await panelInstall.click();
      await expect(page.locator('[data-testid="server"] [data-testid="known-card"]').first()).toBeVisible();
      return title;
    }
    if (!(await marker.isVisible().catch(() => false))) continue;
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
  const opponentCue = page.getByTestId("opponent-cue");
  if (await opponentCue.isVisible().catch(() => false)) {
    const dismissCue = page.getByRole("button", { name: /Ausblenden|Hinweis schließen/ }).first();
    if (await dismissCue.isVisible().catch(() => false)) {
      await dismissCue.click();
      await expect(opponentCue).toBeHidden();
    } else {
      await moveOpponentCueAwayFromPreview(page);
    }
  }
  await page.getByTestId("card-display-text").first().click();
  await expect(page.getByTestId("card-preview")).toContainText("Kartenanzeige");
  await page.getByTestId("card-display-compact").first().click();
  await expect(page.getByTestId("card-preview")).toBeVisible();
  await page.getByTestId("card-display-image").first().click();
}

export async function expectActiveBoardBasics(page: Page): Promise<void> {
  await expect(page.getByTestId("legal-actions")).toBeVisible();
  await expect(page.getByTestId("legal-actions").locator("h2")).toContainText(/Zug:\s*\d+\s+(Runner|Korp)\s+Aktionen/);
  await expect(page.getByTestId("action-availability")).toBeVisible();
  await expect(page.getByTestId("run-timeline")).toHaveCount(0);
  await expect.poll(async () => page.getByTestId("server").count()).toBeGreaterThan(2);
  await expect(page.getByTestId("action-slots").first()).toContainText("Aktionen");
  await expect(page.getByTestId("credit-badge").first()).toHaveAttribute("aria-label", /Credits/);
}

export async function expectNoCriticalLayoutOverflow(page: Page): Promise<void> {
  const report = await page.evaluate(() => {
    const horizontalOverflow = Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
    const wideElements = Array.from(document.body.querySelectorAll("*"))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: typeof element.className === "string" ? element.className : "",
          testId: element.getAttribute("data-testid"),
          ariaLabel: element.getAttribute("aria-label"),
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          visible: rect.width > 0 && rect.height > 0,
          out: rect.left < -4 || rect.right > window.innerWidth + 4
        };
      })
      .filter((entry) => entry.visible && entry.out)
      .sort((left, right) => Math.max(Math.abs(right.left), right.right) - Math.max(Math.abs(left.left), left.right))
      .slice(0, 8);
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
    return { horizontalOverflow, outOfViewport: outOfViewport.filter((entry) => entry.visible && entry.out), wideElements };
  });
  expect(report.horizontalOverflow, `document horizontal overflow: ${JSON.stringify(report.wideElements)}`).toBeLessThanOrEqual(12);
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

async function knownCardTitle(card: Locator): Promise<string | null> {
  const ariaTitle = titleFromKnownCardAriaLabel(await card.getAttribute("aria-label"));
  if (isMeaningfulHiddenTitle(ariaTitle)) return ariaTitle;

  const textTitle = (await card.innerText())
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => isMeaningfulHiddenTitle(line));
  return textTitle ?? null;
}

function titleFromKnownCardAriaLabel(label: string | null): string | null {
  if (!label?.startsWith("Karte ")) return null;
  const withoutPrefix = label.slice("Karte ".length);
  const setIndex = withoutPrefix.indexOf(", Set ");
  return (setIndex >= 0 ? withoutPrefix.slice(0, setIndex) : withoutPrefix.split(", ")[0])?.trim() ?? null;
}

function isMeaningfulHiddenTitle(title: string | null | undefined): title is string {
  return Boolean(title && title.length >= 3 && /[A-Za-z0-9]/.test(title) && !/^Verdeckte Karte$/i.test(title));
}

async function selectE2eDecks(page: Page, runnerLabel: string, corpLabel: string): Promise<void> {
  await page.getByLabel(runnerLabel).selectOption(E2E_RUNNER_SNAPSHOT_ID);
  await page.getByLabel(corpLabel).selectOption(E2E_CORP_SNAPSHOT_ID);
}

async function installE2eMatchStartSettings(page: Page): Promise<void> {
  await page.addInitScript(
    ({ storageKey, runnerSnapshotId, corpSnapshotId }) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          v: 1,
          mode: "host",
          playMode: "human_vs_human",
          humanSideSelection: "runner",
          humanAiSideSelection: "runner",
          matchFormat: "rules_match",
          matchCardPool: "originalset",
          runnerDifficulty: "normal",
          corpDifficulty: "normal",
          aiDeckPolicy: "fixed",
          testSetupMode: false,
          countdownSeconds: 3,
          playerClockMode: "none",
          playerClockMinutes: 10,
          playerClockGraceSeconds: 10,
          seed: "e2e",
          runnerDeckSource: "snapshot",
          corpDeckSource: "snapshot",
          participantBRunnerDeckSource: "snapshot",
          participantBCorpDeckSource: "snapshot",
          selectedRunnerSnapshotId: runnerSnapshotId,
          selectedCorpSnapshotId: corpSnapshotId,
          selectedParticipantBRunnerSnapshotId: runnerSnapshotId,
          selectedParticipantBCorpSnapshotId: corpSnapshotId,
          selectedRunnerLocalDeckId: "",
          selectedCorpLocalDeckId: "",
          selectedParticipantBRunnerLocalDeckId: "",
          selectedParticipantBCorpLocalDeckId: "",
        }),
      );
    },
    {
      storageKey: MATCH_START_SETTINGS_STORAGE_KEY,
      runnerSnapshotId: E2E_RUNNER_SNAPSHOT_ID,
      corpSnapshotId: E2E_CORP_SNAPSHOT_ID,
    },
  );
}

async function moveOpponentCueAwayFromPreview(page: Page): Promise<void> {
  const handle = page.getByRole("button", { name: "Hinweis verschieben" });
  const box = await handle.boundingBox();
  const viewport = page.viewportSize();
  if (!box || !viewport) return;

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(24, Math.max(120, viewport.height - 160), { steps: 8 });
  await page.mouse.up();
}

async function resolveSetupChoices(...pages: Page[]): Promise<void> {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    let clicked = false;
    for (const page of pages) {
      const keep = page.getByRole("button", { name: "Starthand behalten" }).first();
      if (await keep.isVisible().catch(() => false)) {
        await keep.click({ timeout: 2_000 }).catch(() => undefined);
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
