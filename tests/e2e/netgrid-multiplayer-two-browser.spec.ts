import { expect, test, type Page, type TestInfo } from "@playwright/test";

import {
  createHumanVsHumanLobby,
  createHumanVsHumanSeriesLobby,
  exerciseCardDisplayModes,
  installFirstCorpCard,
  joinHumanVsHumanLobby,
  readyAndWaitForActive,
  saveFlowScreenshot,
  waitForActiveAndResolveSetup,
} from "./helpers/match-flow";
import {
  captureServerFrames,
  expectNoDomOrLocalStorageLeaks,
  expectNoServerPayloadLeaks,
  expectRecentSessionsAreSanitized,
} from "./helpers/leak-scan";
import {
  launchMultiplayerBrowserPair,
  type MultiplayerBrowserPair,
} from "./helpers/multiplayer-browser-pair";

test.describe("Zwei-Browser-Multiplayer", () => {
  test("synchronisiert Lobbychat, Aktion, akzeptierte Zurücknahme, Hidden Info und Reconnect", async ({}, testInfo) => {
    const pair = await launchMultiplayerBrowserPair();
    const hostFrames = captureServerFrames(pair.host);
    const joinerFrames = captureServerFrames(pair.joiner);
    const browserErrors = captureBrowserErrors(pair);
    try {
      const joinUrl = await createHumanVsHumanLobby(
        pair.host,
        "two-browser-sync-undo-reconnect",
        "runner",
      );
      await joinHumanVsHumanLobby(pair.joiner, joinUrl);

      await sendLobbyChat(pair.host, "Host bereit");
      await expect(pair.joiner.locator(".lobbyChatMessages")).toContainText(
        "Host bereit",
      );
      await sendLobbyChat(pair.joiner, "Joiner bereit");
      await expect(pair.host.locator(".lobbyChatMessages")).toContainText(
        "Joiner bereit",
      );

      await readyAndWaitForActive(pair.host, pair.joiner);
      await clickAction(pair.joiner, "mandatory_draw");
      await clickAction(pair.joiner, "gain_credit");
      await expectCredits(pair.joiner, "corp", 6);
      await expectCredits(pair.host, "corp", 6);

      await pair.joiner
        .getByRole("button", { name: "Zurücknahme anfragen", exact: true })
        .first()
        .click();
      await pair.joiner
        .getByTestId("undo-panel")
        .getByRole("button", { name: "Zurücknahme anfragen", exact: true })
        .click();
      await expect(pair.host.getByTestId("undo-panel")).toContainText(
        /Zustimmen|Ablehnen/,
      );
      await pair.host
        .getByTestId("undo-panel")
        .getByRole("button", { name: "Zustimmen", exact: true })
        .click();
      await expectCredits(pair.joiner, "corp", 5);
      await expectCredits(pair.host, "corp", 5);

      const hiddenTitle = await installFirstCorpCard(pair.joiner);
      await expect(pair.host.getByTestId("hidden-card").first()).toBeVisible();
      await expectNoDomOrLocalStorageLeaks(pair.host, [hiddenTitle]);

      await pair.host.reload();
      await expect(pair.host.getByTestId("active-game")).toBeVisible({
        timeout: 20_000,
      });
      await expect(pair.host.getByTestId("hidden-card").first()).toBeVisible();
      await expectNoDomOrLocalStorageLeaks(pair.host, [hiddenTitle]);
      await exerciseCardDisplayModes(pair.host);
      await expectNoDomOrLocalStorageLeaks(pair.joiner);
      expectNoServerPayloadLeaks(hostFrames);
      expectNoServerPayloadLeaks(joinerFrames);
      await expectRecentSessionsAreSanitized(pair.host);
      await expectRecentSessionsAreSanitized(pair.joiner);
      expect(browserErrors).toEqual([]);

      await attachBrowserPair(testInfo, pair);
      await saveFlowScreenshot(
        pair.host,
        testInfo,
        "two-browser-host-reconnected-hidden-info",
      );
      await saveFlowScreenshot(
        pair.joiner,
        testInfo,
        "two-browser-joiner-after-undo",
      );
    } finally {
      await pair.close();
    }
  });

  test("führt eine Zwei-Spiele-Matchserie mit neuem Join-Link und Seitenwechsel zu Ende", async ({}, testInfo) => {
    const pair = await launchMultiplayerBrowserPair();
    const browserErrors = captureBrowserErrors(pair);
    try {
      const firstJoinUrl = await createHumanVsHumanSeriesLobby(
        pair.host,
        "two-browser-series-side-swap",
        "runner",
      );
      await joinHumanVsHumanLobby(pair.joiner, firstJoinUrl);
      await readyAndWaitForActive(pair.host, pair.joiner);
      await expectOwnSide(pair.host, "runner");
      await expectOwnSide(pair.joiner, "corp");

      await forfeit(pair.host);
      await expect(pair.host.getByRole("dialog")).toContainText(
        "Serienspiel 1/2",
      );
      await pair.host
        .getByRole("button", { name: "Nächstes Serienspiel", exact: true })
        .click();
      await expect(pair.host.getByTestId("start-lobby")).toBeVisible({
        timeout: 20_000,
      });
      const secondJoinUrl = await pair.host
        .getByTestId("join-link")
        .inputValue();
      expect(matchIdFrom(secondJoinUrl)).not.toBe(matchIdFrom(firstJoinUrl));

      await joinHumanVsHumanLobby(pair.joiner, secondJoinUrl, {
        expectedDestination: "active",
      });
      await waitForActiveAndResolveSetup(pair.host, pair.joiner);
      await expectOwnSide(pair.host, "corp");
      await expectOwnSide(pair.joiner, "runner");

      await forfeit(pair.joiner);
      const finalResult = pair.host.getByRole("dialog");
      await expect(finalResult).toContainText("Serienspiel 2/2");
      await expect(finalResult).toContainText(/Matchserie|Endergebnis/);
      await expect(
        pair.host.getByRole("button", {
          name: "Nächstes Serienspiel",
          exact: true,
        }),
      ).toHaveCount(0);
      expect(browserErrors).toEqual([]);

      await attachBrowserPair(testInfo, pair);
      await saveFlowScreenshot(
        pair.host,
        testInfo,
        "two-browser-series-finished",
      );
    } finally {
      await pair.close();
    }
  });

  test("überträgt den freigegebenen Classic-/Proteus-Deckpool an den Joiner", async () => {
    test.fail(
      true,
      "Bekannter Fehler: Der erste Joiner sieht trotz Host-Freigabe nur Originalset-Decks.",
    );
    const pair = await launchMultiplayerBrowserPair();
    try {
      const joinUrl = await createHumanVsHumanSeriesLobby(
        pair.host,
        "two-browser-joiner-card-pool",
        "runner",
        "originalset_classic_proteus",
      );
      await joinHumanVsHumanLobby(pair.joiner, joinUrl, {
        expectedRunnerDeckOption: /Proteus Runner/,
      });
    } finally {
      await pair.close();
    }
  });
});

async function sendLobbyChat(page: Page, message: string): Promise<void> {
  const input = page.locator(".lobbyChatInput input");
  await input.fill(message);
  await input.press("Enter");
  await expect(input).toHaveValue("");
}

async function clickAction(page: Page, actionType: string): Promise<void> {
  const action = page
    .locator(`[data-testid="action-button"][data-action-type="${actionType}"]`)
    .first();
  await expect(action).toBeVisible();
  await action.click();
}

async function expectCredits(
  page: Page,
  side: "runner" | "corp",
  credits: number,
): Promise<void> {
  await expect(
    page
      .locator(`.sideStatusPanel.side-${side}`)
      .getByTestId("credit-badge")
      .locator(".statValue"),
  ).toHaveText(String(credits));
}

async function expectOwnSide(
  page: Page,
  side: "runner" | "corp",
): Promise<void> {
  await expect(
    page.locator(`.sideStatusPanel.side-${side}`).getByRole("heading"),
  ).toContainText(`Du · ${side === "corp" ? "Korp" : "Runner"}`);
}

async function forfeit(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Aufgeben", exact: true }).click();
  await page
    .getByRole("alertdialog", { name: "Spiel aufgeben?" })
    .getByRole("button", { name: "Aufgeben", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Das Spiel wurde durch Aufgabe beendet.",
  );
}

function matchIdFrom(joinUrl: string): string | null {
  return new URL(joinUrl).searchParams.get("matchId");
}

function captureBrowserErrors(pair: MultiplayerBrowserPair): string[] {
  const errors: string[] = [];
  for (const [label, page] of [
    ["host", pair.host],
    ["joiner", pair.joiner],
  ] as const) {
    page.on("pageerror", (error) => errors.push(`${label}: ${error.message}`));
    page.on("response", (response) => {
      if (response.status() >= 500) {
        errors.push(`${label}: HTTP ${response.status()} ${response.url()}`);
      }
    });
    page.on("console", (message) => {
      if (
        message.type() === "error" &&
        !message.text().startsWith("Failed to load resource:")
      ) {
        errors.push(`${label}: ${message.text()}`);
      }
    });
  }
  return errors;
}

async function attachBrowserPair(
  testInfo: TestInfo,
  pair: MultiplayerBrowserPair,
): Promise<void> {
  await testInfo.attach("browser-pair", {
    body: Buffer.from(
      JSON.stringify({
        host: pair.hostChannel,
        joiner: pair.joinerChannel,
      }),
    ),
    contentType: "application/json",
  });
}
