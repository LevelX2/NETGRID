import { expect, test } from "@playwright/test";
import { stat } from "node:fs/promises";
import path from "node:path";
import {
  createHumanVsAiGame,
  createHumanVsHumanLobby,
  exerciseCardDisplayModes,
  expectActiveBoardBasics,
  expectNoCriticalLayoutOverflow,
  installFirstCorpCard,
  joinHumanVsHumanLobby,
  newContextPage,
  readyAndWaitForActive,
  saveFlowScreenshot
} from "./helpers/match-flow";
import { captureServerFrames, expectNoDomOrLocalStorageLeaks, expectNoServerPayloadLeaks, expectRecentSessionsAreSanitized } from "./helpers/leak-scan";
import { VIEWPORTS } from "./helpers/viewports";

test.describe("V1.0.7 Browser-E2E und Visual QA", () => {
  test("Human-vs-KI Desktop prüft aktives Board, KI-Takt, Cue, Aktionen, Credits und Artefakte", async ({ page }, testInfo) => {
    const frames = captureServerFrames(page);
    await page.setViewportSize(VIEWPORTS.desktop);
    await createHumanVsAiGame(page, "v1-0-7-ai-desktop");

    await expectActiveBoardBasics(page);
    await expect(page.getByTestId("server-run-action").first()).toBeVisible();
    await expect(page.getByTestId("server-run-action").first()).toHaveAttribute("aria-label", /Run auf .+ starten/);
    await page.getByRole("button", { name: "Optionen öffnen" }).click();
    await page.getByRole("button", { name: "Einzelschritt" }).click();
    await expect(page.getByRole("button", { name: "Einzelschritt" })).toHaveClass(/active/);
    await page.getByRole("button", { name: "Zurück zum aktiven Spiel" }).click();
    await page.locator('[data-testid="action-button"][data-action-type="gain_credit"]').first().click();
    await expect(page.getByTestId("action-availability")).toContainText("noch 3");
    await page.locator('[data-testid="action-button"][data-action-type="end_turn"]').first().click();
    await expect(page.getByRole("button", { name: "KI-Schritt" })).toBeEnabled();
    await page.getByRole("button", { name: "KI-Schritt" }).click();
    await expect(page.getByTestId("opponent-cue")).toBeVisible();

    await exerciseCardDisplayModes(page);
    await expectNoCriticalLayoutOverflow(page);
    await expectNoDomOrLocalStorageLeaks(page);
    expectNoServerPayloadLeaks(frames);
    await expectRecentSessionsAreSanitized(page);
    await saveFlowScreenshot(page, testInfo, "desktop-human-vs-ai-active");
  });

  test("Human-vs-Human Desktop nutzt zwei getrennte Kontexte für Host, Join, Ready, Countdown und aktives Spiel", async ({ browser }, testInfo) => {
    const host = await newContextPage(browser, "desktop");
    const joiner = await newContextPage(browser, "desktop");
    const hostFrames = captureServerFrames(host.page);
    const joinerFrames = captureServerFrames(joiner.page);
    try {
      const joinUrl = await createHumanVsHumanLobby(host.page, "v1-0-7-hvh-desktop", "runner");
      await joinHumanVsHumanLobby(joiner.page, joinUrl);
      await expect(host.page.getByText("Gegenüber: Joiner V107")).toBeVisible();
      await readyAndWaitForActive(host.page, joiner.page);

      await expectActiveBoardBasics(host.page);
      await expectActiveBoardBasics(joiner.page);
      await expectNoDomOrLocalStorageLeaks(host.page);
      await expectNoDomOrLocalStorageLeaks(joiner.page);
      expectNoServerPayloadLeaks(hostFrames);
      expectNoServerPayloadLeaks(joinerFrames);
      await expectRecentSessionsAreSanitized(host.page);
      await expectRecentSessionsAreSanitized(joiner.page);
      await saveFlowScreenshot(host.page, testInfo, "desktop-human-vs-human-host-active");
      await saveFlowScreenshot(joiner.page, testInfo, "desktop-human-vs-human-joiner-active");
    } finally {
      await host.context.close();
      await joiner.context.close();
    }
  });

  test("Lifecycle/Reconnect prüft Cancel, Recreate, Leave, Wieder verbinden, Forfeit und Verwerfen", async ({ browser, page }, testInfo) => {
    await page.setViewportSize(VIEWPORTS.desktop);
    const joiner = await newContextPage(browser, "desktop");
    try {
      const firstJoinUrl = await createHumanVsHumanLobby(page, "v1-0-7-lifecycle-cancel", "runner");
      await page.getByTestId("cancel-match").click();
      await expect(page.getByRole("heading", { name: "Match abgebrochen" })).toBeVisible();
      await page.getByTestId("recreate-match").click();
      await expect(page.getByTestId("join-link")).toBeVisible();
      const secondJoinUrl = await page.getByTestId("join-link").inputValue();
      expect(secondJoinUrl).not.toEqual(firstJoinUrl);

      await joinHumanVsHumanLobby(joiner.page, secondJoinUrl);
      await joiner.page.getByTestId("leave-lobby").click();
      await expect(joiner.page.getByRole("heading", { name: "Lobby verlassen" })).toBeVisible();
      await expect(page.getByText(/Match nicht mehr aktiv|Die Gegenseite hat die Lobby verlassen/)).toBeVisible();
      await saveFlowScreenshot(page, testInfo, "desktop-lifecycle-terminal");
    } finally {
      await joiner.context.close();
    }

    await createHumanVsAiGame(page, "v1-0-7-lifecycle-reconnect");
    await expect(page.getByTestId("active-game")).toBeVisible();
    await page.reload();
    await expect(page.getByTestId("active-game")).toBeVisible({ timeout: 20_000 });
    await page.getByRole("button", { name: "Aufgeben" }).click();
    await expect(page.getByRole("alertdialog", { name: "Spiel aufgeben?" })).toBeVisible();
    await page.getByRole("alertdialog", { name: "Spiel aufgeben?" }).getByRole("button", { name: "Aufgeben" }).click();
    await expect(page.getByText(/Spiel aufgegeben|gewinnt/i).first()).toBeVisible();
    await page.getByRole("button", { name: "Board ansehen" }).click();
    await page.getByRole("button", { name: "Startbildschirm" }).click();
    await expect(page.getByTestId("setup-screen")).toBeVisible();
  });

  test("Tablet-Viewport prüft Board, Run-Ziel, direkte Server-Run-Actions und Card Display", async ({ page }, testInfo) => {
    await page.setViewportSize(VIEWPORTS.tablet);
    await createHumanVsAiGame(page, "v1-0-7-tablet-board");
    await expectActiveBoardBasics(page);
    await expect(page.getByTestId("server-run-action").first()).toBeVisible();
    await page.getByTestId("server-run-action").first().click();
    await expect(page.getByTestId("run-timeline")).toContainText("Run auf");
    await expect(page.locator(".activeRunTarget")).toHaveCount(1);
    await exerciseCardDisplayModes(page);
    await expectNoCriticalLayoutOverflow(page);
    await expectNoDomOrLocalStorageLeaks(page);
    await saveFlowScreenshot(page, testInfo, "tablet-active-board-run");
  });

  test("Schmaler Viewport prüft Textfit, Actions, Cue-Bereich, RunTimeline und Vorschau", async ({ page }, testInfo) => {
    await page.setViewportSize(VIEWPORTS.narrow);
    await createHumanVsAiGame(page, "v1-0-7-narrow-board");
    await expectActiveBoardBasics(page);
    await expect(page.getByTestId("server-run-action").first()).toBeVisible();
    if (await page.getByTestId("opponent-cue").isVisible().catch(() => false)) {
      await page.getByRole("button", { name: /Ausblenden|Hinweis schließen/ }).click();
    }
    await page.getByTestId("server-run-action").first().click();
    await expect(page.getByTestId("run-timeline")).toContainText("Run auf");
    await exerciseCardDisplayModes(page);
    await expectNoCriticalLayoutOverflow(page);
    await expectNoDomOrLocalStorageLeaks(page);
    await saveFlowScreenshot(page, testInfo, "narrow-active-board-run");
  });

  test("Hidden-Info-Scan prüft verdeckte Corp-Installation ohne Titel-, DOM-, Bildpfad- oder Payload-Leak", async ({ browser }, testInfo) => {
    const corp = await newContextPage(browser, "desktop");
    const runner = await newContextPage(browser, "desktop");
    const runnerFrames = captureServerFrames(runner.page);
    try {
      const joinUrl = await createHumanVsHumanLobby(corp.page, "v1-0-7-hidden-install", "corp");
      await joinHumanVsHumanLobby(runner.page, joinUrl);
      await readyAndWaitForActive(corp.page, runner.page);

      const hiddenTitle = await installFirstCorpCard(corp.page);
      await expect(runner.page.getByTestId("hidden-card").first()).toBeVisible();
      await expect(runner.page.getByTestId("hidden-card").first()).toContainText("Verdeckte Karte");
      await expectNoDomOrLocalStorageLeaks(runner.page, [hiddenTitle]);
      expectNoServerPayloadLeaks(runnerFrames);
      await saveFlowScreenshot(corp.page, testInfo, "desktop-hidden-install-corp");
      await saveFlowScreenshot(runner.page, testInfo, "desktop-hidden-install-runner-redacted");
    } finally {
      await corp.context.close();
      await runner.context.close();
    }
  });

  test("Runtime-Isolation nutzt die temporäre SQLite-Datenbank statt normaler lokaler Runtime-Dateien", async ({ request }) => {
    const runtimePath = process.env.NETGRID_E2E_RUNTIME_PATH;
    expect(runtimePath).toBeTruthy();
    expect(path.basename(runtimePath!)).toBe("netgrid.sqlite");
    expect(runtimePath).not.toContain("data\\runtime\\multiplayer\\matches.json");
    expect(runtimePath).not.toContain("data/runtime/multiplayer/matches.json");
    expect(runtimePath).not.toContain("data\\runtime\\multiplayer\\netgrid.sqlite");
    expect(runtimePath).not.toContain("data/runtime/multiplayer/netgrid.sqlite");
    expect(runtimePath).not.toContain("data\\runtime\\multiplayer\\netgrid.sqlite");
    expect(runtimePath).not.toContain("data/runtime/multiplayer/netgrid.sqlite");
    await expect(async () => stat(runtimePath!)).toPass();
    const health = await request.get(`${process.env.NETGRID_E2E_SERVER_URL}/health`);
    const body = (await health.json()) as { profile?: string; realtime?: { ready?: boolean }; storage?: { kind?: string; database?: string; matchCount?: number } };
    expect(body.profile).toBe("local");
    expect(body.realtime?.ready).toBe(true);
    expect(body.storage?.kind).toBe("sqlite");
    expect(body.storage?.database).toBe("netgrid.sqlite");
    expect(body.storage?.matchCount).toBeUndefined();
    expect(JSON.stringify(body)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|privatePayload|decklist/i);
  });

  test("V1.3.0 Deckvalidierung prüft legalen und illegalen privaten Formatpfad ohne Decklist-Leak", async ({ request }) => {
    const legalDeck = {
      deckId: "e2e_v130_runner",
      deckVersion: "1.3.0-local",
      name: "E2E V1.3.0 Runner",
      side: "runner",
      identityCardId: "runner_identity_001",
      cardPoolSnapshotId: "card-snapshot-0.8",
      cardPoolVersion: "private-local-onr-v1",
      formatProfileId: "netgrid_private_local_v1",
      formatProfileVersion: "1.3.0",
      cards: [
        { cardId: "onr_v1_021_dwarf", quantity: 2 },
        { cardId: "onr_v1_039_krash", quantity: 2 },
        { cardId: "onr_v1_066_snowball", quantity: 2 },
        { cardId: "onr_v1_074_worm", quantity: 2 },
        { cardId: "onr_v1_081_custodial-position", quantity: 1 },
        { cardId: "onr_v1_085_executive-wiretaps", quantity: 1 },
        { cardId: "onr_v1_101_mit-west-tier", quantity: 2 }
      ],
      createdAt: "2026-05-08T12:00:00.000Z",
      updatedAt: "2026-05-08T12:00:00.000Z"
    };

    const valid = await request.post("/api/decks/validate", { data: { deck: legalDeck } });
    const validBody = await valid.json();
    expect(validBody.validation.ok).toBe(true);
    expect(validBody.snapshot.formatProfileVersion).toBe("1.3.0");
    expect(validBody.snapshot.publicMetadata).not.toHaveProperty("cards");

    const invalid = await request.post("/api/decks/validate", { data: { deck: { ...legalDeck, deckId: "e2e_v130_invalid", cards: [...legalDeck.cards, { cardId: "catalog_preview_resource_001", quantity: 1 }] } } });
    const invalidBody = await invalid.json();
    expect(invalidBody.validation.ok).toBe(false);
    expect(invalidBody.validation.errorCodes).toContain("card_missing_required_status");
    expect(invalidBody.validation.errorCodes).toContain("format_legal_requires_deck_legal");
    expect(JSON.stringify(invalidBody)).not.toMatch(/sessionToken|reconnectToken|joinToken|tokenHash|cardInstances|privateDeckSnapshots|privatePayload|decklist/i);
  });
});
