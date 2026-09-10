import { expect, test } from "@playwright/test";

// Browser selection belongs to the Playwright project, not this UI contract.
test.use({ locale: "de-DE" });

test("maintenance loads on demand and reports status timeout without losing usable sections", async ({
  page,
}, testInfo) => {
  const requests: string[] = [];
  const fullMatchId = "match_0123456789abcdef0123456789abcdef";
  const pageErrors: string[] = [];
  let summaryMode: "timeout" | "success" | "error" | "unauthorized" = "timeout";
  await page.addInitScript(() =>
    localStorage.setItem("netgrid-color-scheme", "white"),
  );
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.route("**/health", (route) =>
    route.fulfill({
      json: {
        build: {
          productVersion: "1.0",
          buildNumber: "8090",
          commit: "123abcdef",
          sourceDate: "2026-09-05T12:00:00Z",
          dirty: true,
          source: "git",
          startedAt: "2026-09-05T13:00:00Z",
        },
      },
    }),
  );
  // All API calls are intercepted: this UI regression never reads or mutates
  // the operator's maintenance session or local runtime data.
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    const prefix = "/api/storage/maintenance";
    if (path === `${prefix}/auth/session`) {
      await route.fulfill({ json: { csrfToken: "ui-test-only" } });
    } else if (path === `${prefix}/accounts/access-policy`) {
      await route.fulfill({
        json: { policy: { mode: "simple", source: "persisted" }, accounts: [] },
      });
    } else if (path === `${prefix}/card-images/collection`) {
      await route.fulfill({
        json: {
          schemaVersion: "netgrid-card-image-collection-inventory-v1",
          collectionId: "test",
          revision: 1,
          totalBindings: 0,
          unknownBindings: 0,
          sets: [],
        },
      });
    } else if (path === `${prefix}/card-images/inbox`) {
      await route.fulfill({
        json: { schemaVersion: "netgrid-card-image-inbox-v1", entries: [] },
      });
    } else if (
      path === `${prefix}/matches` ||
      path === `${prefix}/ai-decision-traces/matches`
    ) {
      await route.fulfill({
        json: {
          matches:
            path === `${prefix}/matches`
              ? [
                  {
                    matchId: fullMatchId,
                    status: "finished",
                    terminal: true,
                    mode: "human_vs_human",
                    retentionProtected: false,
                    matchVersion: 1,
                    createdAt: "2026-09-05T12:00:00Z",
                    updatedAt: "2026-09-05T12:00:00Z",
                    ageSeconds: 0,
                    participants: [],
                    eventCount: 0,
                    snapshotCount: 0,
                    sizes: {
                      matchRecordBytes: 0,
                      gameStateBytes: 0,
                      eventPayloadBytes: 0,
                      engineEventBytes: 0,
                      stateSnapshotBytes: 0,
                      deckSnapshotBytes: 0,
                      aiDecisionTraceBytes: 0,
                      pendingUndoBytes: 0,
                      startLobbyBytes: 0,
                      approximateTotalBytes: 0,
                    },
                  },
                ]
              : [],
        },
      });
    } else if (path === `${prefix}/cleanup/policy`) {
      await route.fulfill({
        json: {
          enabled: false,
          statuses: ["finished"],
          olderThanDays: 3,
          limit: 500,
        },
      });
    } else if (path === `${prefix}/summary`) {
      if (summaryMode === "timeout") return;
      if (summaryMode === "unauthorized") {
        await route.fulfill({
          status: 401,
          json: { error: { code: "maintenance_auth_required" } },
        });
        return;
      }
      if (summaryMode === "error") {
        await route.fulfill({
          status: 503,
          json: {
            error: {
              code: "storage_read_failed",
              message: "Statusdiagnose: storage_read_failed",
            },
          },
        });
        return;
      }
      await route.fulfill({
        json: {
          backendOpsVersion: "Backend 0.5",
          generatedAt: "2026-09-05T12:00:00Z",
          database: {
            fileName: "ui-test.sqlite",
            fileSizeBytes: 4096,
            pageSize: 4096,
            pageCount: 1,
            freelistCount: 0,
          },
          schemaVersion: 3,
          storageFormat: "netgrid_multiplayer_sqlite",
          matchCount: 0,
          terminalCount: 0,
          nonTerminalCount: 0,
          matchCountsByStatus: {},
          matchCountsByMode: {},
          tableSizes: [],
          largestMatches: [],
        },
      });
    } else {
      await route.abort();
    }
  });
  await page.goto("/maintenance");
  await expect(page.getByText(/Wähle oben Status/)).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Versionsstände" }),
  ).toContainText("Build 8090");
  await expect(
    page.getByRole("complementary", { name: "Versionsstände" }),
  ).toContainText("gestartet");
  await expect(
    page.getByRole("button", { name: "Aktualisieren", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Spielerzugänge", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Kartenbilder", exact: true }),
  ).toBeVisible();
  await page.locator("summary").filter({ hasText: "Passwort ändern" }).click();
  await expect(
    page.getByPlaceholder("Aktuelles Passwort", { exact: true }),
  ).toBeVisible();
  expect(requests.every((path) => path.endsWith("/auth/session"))).toBe(true);
  await page.locator("summary").filter({ hasText: "Passwort ändern" }).click();

  const sessionChecks = requests.filter((path) =>
    path.endsWith("/auth/session"),
  ).length;
  const topbar = await page.locator(".maintenanceTopbar").elementHandle();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "white");
  await page.getByRole("link", { name: "Spielerzugänge", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Spielerzugänge", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".maintenanceLocaleSelect")).toHaveCount(1);
  await page.locator(".maintenanceLocaleSelect select").selectOption("en");
  await expect(
    page.getByRole("link", { name: "Player access", exact: true }),
  ).toBeVisible();
  await page.locator(".maintenanceLocaleSelect select").selectOption("de");
  await expect(
    page.getByRole("link", { name: "Spielerzugänge", exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Wähle oben Status/)).toHaveCount(0);
  await expect(
    page.getByText("Maintenance Control Plane", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("main").locator("section").first()).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await page.screenshot({ path: testInfo.outputPath("accounts-day.png") });
  await page.evaluate(() => {
    localStorage.setItem("netgrid-color-scheme", "black");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "netgrid-color-scheme",
        newValue: "black",
      }),
    );
  });
  await expect(page.getByRole("main").locator("section").first()).toHaveCSS(
    "background-color",
    "rgb(16, 24, 32)",
  );
  await page.screenshot({ path: testInfo.outputPath("accounts-night.png") });
  await page.getByRole("link", { name: "Kartenbilder", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "Kartenbilder", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(page.locator(".maintenanceLocaleSelect")).toHaveCount(1);
  await page.getByRole("link", { name: "Maintenance", exact: true }).click();
  await expect(page.getByText(/Wähle oben Status/)).toBeVisible();
  expect(requests.some((path) => path.endsWith("/summary"))).toBe(false);
  expect(requests.filter((path) => path.endsWith("/auth/session")).length).toBe(
    sessionChecks,
  );
  expect(await topbar!.evaluate((element) => element.isConnected)).toBe(true);
  await page.getByRole("link", { name: "Status", exact: true }).click();
  await expect(page.getByText("75%", { exact: true })).toBeVisible();
  await expect(page.getByText("Unvollständig", { exact: true })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "nach 10 Sekunden",
  );
  await expect(page.getByText("fertig", { exact: true })).toHaveCount(0);

  await page
    .locator("summary")
    .filter({ hasText: /^Matchliste$/ })
    .click();
  const beforeFilter = requests.length;
  await expect(
    page.locator("td code").filter({ hasText: fullMatchId }),
  ).toHaveText(fullMatchId);
  await page.getByRole("button", { name: "Anwenden", exact: true }).click();
  await expect(
    page.getByText("Filter angewendet. Matchliste ist geladen.", {
      exact: true,
    }),
  ).toBeVisible();
  expect(requests.slice(beforeFilter)).toEqual([
    "/api/storage/maintenance/matches",
  ]);
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "nach 10 Sekunden",
  );

  summaryMode = "success";
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(
    page.getByText("Wartungsdaten sind geladen.", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("fertig", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toHaveCount(0);

  summaryMode = "error";
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(page.getByText("Unvollständig", { exact: true })).toBeVisible();
  await expect(page.getByRole("main").getByRole("alert")).toContainText(
    "Statusdiagnose: storage_read_failed",
  );
  summaryMode = "unauthorized";
  await page
    .getByRole("button", { name: "Aktualisieren", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Anmelden", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Wartungsbereiche" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Statusdiagnose: storage_read_failed"),
  ).toHaveCount(0);
  expect(pageErrors).toEqual([]);
});
