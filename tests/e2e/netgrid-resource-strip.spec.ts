import { expect, test, type Page } from "@playwright/test";
import { GAMEPLAY_SETTINGS_STORAGE_KEY } from "../../apps/web/lib/storage-keys";
import { createHumanVsAiGame } from "./helpers/match-flow";

async function setResourceStrip(
  page: Page,
  pinned: boolean,
  mode: "Ein" | "Auto" | "Aus",
) {
  await page.getByRole("button", { name: "Optionen öffnen" }).click();
  await page.getByRole("tab", { name: "Darstellung" }).click();
  await page.getByTestId("sticky-topbar-toggle").setChecked(pinned);
  await page
    .getByRole("group", { name: "Spielstandsstreifen" })
    .getByRole("button", { name: mode, exact: true })
    .click();
  await page.getByRole("button", { name: "Zurück zum aktiven Spiel" }).click();
}

async function scrollGame(page: Page) {
  await page.evaluate(() => window.scrollTo(0, 380));
  await expect
    .poll(() => page.evaluate(() => window.scrollY))
    .toBeGreaterThan(200);
}

async function setEmulatedViewportTop(page: Page, top: number | null) {
  await page.evaluate((offset) => {
    const viewport = window.visualViewport;
    if (!viewport) throw new Error("VisualViewport fehlt im Testbrowser.");
    if (offset === null) {
      Reflect.deleteProperty(viewport, "offsetTop");
      viewport.dispatchEvent(new Event("resize"));
    } else {
      Object.defineProperty(viewport, "offsetTop", {
        configurable: true,
        value: offset,
      });
      viewport.dispatchEvent(new Event("scroll"));
    }
  }, top);
}

async function expectStripAtTop(page: Page, viewportTop = 0) {
  const strip = page.getByTestId("match-resource-strip");
  await expect(strip).toBeVisible();
  await expect
    .poll(async () => Math.round((await strip.boundingBox())?.y ?? -1))
    .toBe(viewportTop);
}

async function expectStripBelowHeader(page: Page, viewportTop = 0) {
  const strip = page.getByTestId("match-resource-strip");
  const header = page.locator(".topbar");
  await expect(strip).toBeVisible();
  await expect
    .poll(async () => {
      const headerBox = await header.boundingBox();
      const stripBox = await strip.boundingBox();
      if (!headerBox || !stripBox) return null;
      return Math.round(stripBox.y - headerBox.y - headerBox.height);
    })
    .toBe(0);
  await expect
    .poll(async () => Math.round((await header.boundingBox())?.y ?? -1))
    .toBe(viewportTop);
}

async function expectTopbarItemsToFit(page: Page) {
  const bounds = await page.locator(".topbar").evaluate((header) => {
    const selectors = [
      ".mark",
      ".brandWordmark",
      ".topbarVersion",
      ".connection",
      ".activeWorkspaceNav",
      ".toolbar",
    ];
    return {
      width: header.clientWidth,
      items: selectors.map((selector) => {
        const bounds = header.querySelector(selector)?.getBoundingClientRect();
        if (!bounds) throw new Error(`Missing header item ${selector}`);
        return {
          selector,
          left: bounds.left,
          right: bounds.right,
          top: bounds.top,
          bottom: bounds.bottom,
        };
      }),
    };
  });
  for (const [index, item] of bounds.items.entries()) {
    expect(item.left, item.selector).toBeGreaterThanOrEqual(0);
    expect(item.right, item.selector).toBeLessThanOrEqual(bounds.width + 1);
    for (const other of bounds.items.slice(index + 1)) {
      const overlaps =
        Math.min(item.right, other.right) - Math.max(item.left, other.left) >
          1 &&
        Math.min(item.bottom, other.bottom) - Math.max(item.top, other.top) > 1;
      expect(overlaps, `${item.selector} overlaps ${other.selector}`).toBe(
        false,
      );
    }
  }
}

test("der Spielstandsstreifen bleibt unabhängig von der Kopfzeile fixiert", async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 760 });
  await createHumanVsAiGame(page, "e2e-resource-strip");
  await setResourceStrip(page, true, "Ein");

  await expectTopbarItemsToFit(page);
  await expect(page.getByTestId("credit-badge")).toHaveCount(0);
  await expect(page.getByTestId("agenda-points-stat")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 640 });
  await expectTopbarItemsToFit(page);

  const strip = page.getByTestId("match-resource-strip");
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.locator(".matchDetailsToggle").click();
  await expectStripBelowHeader(page);
  await scrollGame(page);
  await expectStripBelowHeader(page);
  await setEmulatedViewportTop(page, 96);
  await expectStripBelowHeader(page, 96);
  await setEmulatedViewportTop(page, null);
  await expectStripBelowHeader(page);

  await setResourceStrip(page, false, "Ein");
  await scrollGame(page);
  await expectStripAtTop(page);
  await expect
    .poll(async () => (await page.locator(".topbar").boundingBox())?.y ?? 0)
    .toBeLessThan(0);
  await setEmulatedViewportTop(page, 96);
  await expectStripAtTop(page, 96);
  await setEmulatedViewportTop(page, null);
  await expectStripAtTop(page);

  await page.setViewportSize({ width: 820, height: 760 });
  await setResourceStrip(page, false, "Auto");
  await page.evaluate(() => window.scrollTo(0, 0));
  const lastAgendaCounter = page.getByTestId("agenda-points-stat").last();
  await expect(lastAgendaCounter).toBeInViewport();
  await expect(strip).toBeHidden();
  await page
    .locator(".sideStatusPanel > .stats")
    .evaluateAll((rows) =>
      window.scrollBy(
        0,
        Math.max(...rows.map((row) => row.getBoundingClientRect().bottom)) - 72,
      ),
    );
  await setEmulatedViewportTop(page, 96);
  await expectStripAtTop(page, 96);
  await setEmulatedViewportTop(page, null);
  await expect(strip).toBeHidden();
  await lastAgendaCounter.evaluate((counter) =>
    window.scrollTo(
      0,
      window.scrollY + counter.getBoundingClientRect().bottom + 40,
    ),
  );
  await expectStripAtTop(page);
  await page.evaluate(() => window.scrollBy(0, 240));
  await expectStripAtTop(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(lastAgendaCounter).toBeInViewport();
  await expect(strip).toBeHidden();

  await page.evaluate(() => window.scrollTo(0, 0));
  await setResourceStrip(page, true, "Aus");
  await expect(strip).toBeHidden();
  await expect(page.getByTestId("credit-badge")).toHaveCount(2);
  await expect(page.getByTestId("agenda-points-stat")).toHaveCount(2);

  await page.setViewportSize({ width: 1360, height: 500 });
  await setResourceStrip(page, true, "Ein");
  await scrollGame(page);
  await expectStripBelowHeader(page);

  await page.getByRole("button", { name: "Aufgeben", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Spiel aufgeben?" })
    .getByRole("button", { name: "Aufgeben", exact: true })
    .click();
  await page.getByRole("button", { name: "Replay ansehen" }).click();
  await expect(page.getByTestId("replay-normal-game-surface")).toBeVisible();
  await expect(page.getByTestId("credit-badge")).toHaveCount(0);
  await expect(page.getByTestId("agenda-points-stat")).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 640 });
  await scrollGame(page);
  await expectStripBelowHeader(page);
  await setEmulatedViewportTop(page, 96);
  await expectStripBelowHeader(page, 96);

  await page.evaluate((key) => {
    const saved = localStorage.getItem(key);
    if (!saved) throw new Error("Gespeicherte Spieloptionen fehlen.");
    localStorage.setItem(
      key,
      JSON.stringify({ ...JSON.parse(saved), topbarStickyEnabled: false }),
    );
  }, GAMEPLAY_SETTINGS_STORAGE_KEY);
  await page.reload();
  await expect(page.getByTestId("replay-normal-game-surface")).toBeVisible();
  await scrollGame(page);
  await expectStripAtTop(page);
  await setEmulatedViewportTop(page, 96);
  await expectStripAtTop(page, 96);
});
