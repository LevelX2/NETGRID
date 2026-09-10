import { expect, test } from "@playwright/test";

// Browser selection belongs to the Playwright project, not this UI contract.
test.use({ locale: "de-DE" });

test("player access validates named profiles, confirms changes and exposes rejected changes", async ({
  page,
}) => {
  let mode = "invite_only";
  let failChange = true;
  const changes: unknown[] = [];
  const accounts = [
    {
      accountId: "first",
      loginName: "admin",
      displayName: "Lui",
      status: "active",
      role: "admin",
    },
    {
      accountId: "second",
      loginName: "__Sepp",
      displayName: "Seppel",
      status: "active",
      role: "user",
    },
    {
      accountId: "pending",
      loginName: "pending",
      displayName: "Einladung",
      status: "disabled",
      role: "user",
    },
  ];
  await page.route("**/health", (route) =>
    route.fulfill({ status: 503, json: {} }),
  );
  // Never read or modify the operator's runtime profiles or credentials.
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (
      path.endsWith("/auth/session") ||
      path.endsWith("/auth/reauthenticate")
    ) {
      return route.fulfill({ json: { csrfToken: "test-only" } });
    }
    if (path.endsWith("/accounts/access-policy")) {
      if (route.request().method() === "POST") {
        changes.push(route.request().postDataJSON());
        if (failChange)
          return route.fulfill({
            status: 400,
            json: {
              error: {
                code: "account_password_blocked",
                message: "Generic message",
              },
            },
          });
        mode = route.request().postDataJSON().mode;
        return route.fulfill({ json: { mode, sessionsRevoked: true } });
      }
      return route.fulfill({
        json: { policy: { mode, source: "persisted" }, accounts },
      });
    }
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto("/maintenance/accounts");
  await expect(
    page.getByText("Einladungsmodus: Anmeldung", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Einfachen Modus aktivieren" }),
  ).toBeVisible();
  await page.getByLabel("Passwort für Lui", { exact: false }).fill("kurz");
  await page
    .getByRole("button", { name: "Geschützten Modus aktivieren" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "Lui (Anmeldename: admin)",
  );
  expect(changes).toHaveLength(0);
  const firstPassword = "Erstes langes Testpasswort 2026";
  const secondPassword = "Zweites langes Testpasswort 2026";
  await page
    .getByLabel("Passwort für Lui", { exact: false })
    .fill(firstPassword);
  await page
    .getByLabel("Passwort für Seppel", { exact: false })
    .fill(secondPassword);
  const confirm = async () => {
    await page
      .getByRole("button", { name: "Geschützten Modus aktivieren" })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog
      .getByLabel("Maintenance-Passwort bestätigen")
      .fill("Maintenance Testpasswort 2026");
    await dialog
      .getByRole("button", { name: "Bestätigen", exact: true })
      .click();
    await expect(dialog).toHaveCount(0);
  };
  await confirm();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "zu leicht erratbar",
  );
  expect(changes[0]).toEqual({
    mode: "protected",
    credentials: [
      { accountId: "first", password: firstPassword },
      { accountId: "second", password: secondPassword },
    ],
  });
  failChange = false;
  await confirm();
  await expect(page.getByRole("status")).toContainText("Zugangsmodus geändert");
  await expect(
    page.getByText("Geschützter Modus: Spieler", { exact: false }),
  ).toBeVisible();
  await expect(page.locator("main").getByRole("alert")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Einfachen Modus aktivieren" })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Maintenance-Passwort bestätigen")
    .fill("Maintenance Testpasswort 2026");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Bestätigen", exact: true })
    .click();
  await expect(
    page.getByText("Einfacher Modus: Spieler", { exact: false }),
  ).toBeVisible();
});

test("an open game page refreshes mode and profile selection on return", async ({
  page,
}) => {
  let mode = "simple";
  let policyUnavailable = false;
  let signedIn = false;
  const session = {
    csrfToken: "test-only",
    account: {
      accountId: "first",
      loginName: "admin",
      displayName: "Lui",
      status: "active",
      role: "admin",
    },
    session: {
      sessionId: "test-session",
      accountId: "first",
      authStrength: "local_profile",
      expiresAt: "2099-01-01T00:00:00Z",
    },
  };
  await page.route("**/health", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/account/access-policy")
      return route.fulfill(
        policyUnavailable
          ? {
              status: 503,
              json: {
                error: {
                  code: "unavailable",
                  message: "Zugangsmodus nicht erreichbar",
                },
              },
            }
          : { json: { mode, source: "persisted", selfServiceEnabled: true } },
      );
    if (path === "/api/account/profiles/select") {
      signedIn = true;
      return route.fulfill({ json: session });
    }
    if (path === "/api/account/session" && signedIn)
      return route.fulfill({ json: session });
    if (path === "/api/account/session")
      return route.fulfill({
        status: 401,
        json: {
          error: { code: "account_auth_required", message: "Keine Sitzung" },
        },
      });
    if (path === "/api/account/profiles")
      return route.fulfill({
        json: { profiles: [{ accountId: "first", displayName: "Lui" }] },
      });
    return route.fulfill({ status: 404, json: {} });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Lui", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Lui", exact: true }).click();
  await expect(
    page
      .locator(".accountPanel")
      .getByRole("heading", { name: "Lui", exact: true }),
  ).toBeVisible();
  mode = "protected";
  signedIn = false; // A mode change revokes the old player session.
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(
    page.getByLabel("Anmeldename", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lui", exact: true }),
  ).toHaveCount(0);
  mode = "simple";
  await page.evaluate(() =>
    document.dispatchEvent(new Event("visibilitychange")),
  );
  await expect(
    page.getByRole("button", { name: "Lui", exact: true }),
  ).toBeVisible();
  policyUnavailable = true;
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await expect(page.locator(".accountPanel").getByRole("alert")).toHaveText(
    "Zugangsmodus nicht erreichbar",
  );
  await expect(
    page.getByRole("button", { name: "Lui", exact: true }),
  ).toHaveCount(0);
  policyUnavailable = false;
  await page
    .locator(".accountPanel")
    .getByRole("button", { name: "Erneut laden" })
    .click();
  await expect(
    page.getByRole("button", { name: "Lui", exact: true }),
  ).toBeVisible();
});
