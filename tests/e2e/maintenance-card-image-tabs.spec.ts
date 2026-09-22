import { expect, test } from "@playwright/test";

test.use({ locale: "de-DE" });

test("image tasks preserve inputs and a running job across keyboard tab changes", async ({
  page,
}) => {
  let starts = 0;
  let polls = 0;
  let uploads = 0;
  let finishJob = false;
  let releaseUpload!: () => void;
  const uploadResponse = new Promise<void>((resolve) => {
    releaseUpload = resolve;
  });
  const job = {
    schemaVersion: "netgrid-card-image-maintenance-job-v1",
    jobId: "tabs-test-job",
    kind: "pack_preview",
    status: "running",
    createdAt: "2026-09-16T08:00:00Z",
    progress: { phase: "validating", completed: 1, total: 54 },
  };
  // Intercept all APIs, including authentication: no installed runtime is used.
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/auth/session"))
      return route.fulfill({ json: { csrfToken: "test-only" } });
    if (path.endsWith("/inventory"))
      return route.fulfill({
        json: {
          sets: [{ profileId: "classic", total: 54, bound: 0, missing: 54 }],
        },
      });
    if (path.endsWith("/inbox"))
      return route.fulfill({
        json: {
          entries: [
            { relativePath: "test.csv", kind: "file", usage: "mapping" },
            {
              relativePath: "classic.zip",
              kind: "file",
              usage: "pack-archive",
            },
          ],
        },
      });
    if (path.endsWith("/packs/preview")) {
      starts++;
      return route.fulfill({ json: { job } });
    }
    if (path.endsWith("/inbox/package-archives")) {
      uploads++;
      await uploadResponse;
      return route.fulfill({ json: { relativePath: "classic.zip" } });
    }
    if (path.endsWith("/jobs/tabs-test-job")) {
      polls++;
      return route.fulfill({
        json: { job: finishJob ? { ...job, status: "succeeded" } : job },
      });
    }
    return route.fulfill({ json: {} });
  });
  await page.route("**/health", (route) => route.fulfill({ json: {} }));
  await page.goto("/maintenance/card-images");
  const packages = page.getByRole("tab", {
    name: "Bildpakete importieren",
    exact: true,
  });
  const mapping = page.getByRole("tab", {
    name: "CSV importieren",
    exact: true,
  });
  const build = page.getByRole("tab", {
    name: "Pakete erstellen",
    exact: true,
  });
  await expect(packages).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await expect(
    page.getByText("ZIP-Paket auswählen …", { exact: true }),
  ).toBeVisible();
  await packages.focus();
  await page.keyboard.press("ArrowRight");
  await expect(mapping).toBeFocused();
  await page
    .getByRole("tabpanel")
    .getByRole("combobox")
    .nth(1)
    .selectOption("https");
  await page.getByRole("checkbox").check();
  await build.click();
  await page
    .getByRole("tabpanel")
    .getByRole("combobox")
    .first()
    .selectOption("proteus");
  await page
    .getByRole("tabpanel")
    .getByRole("combobox")
    .nth(2)
    .selectOption("zip");
  await mapping.click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await expect(
    page.getByRole("tabpanel").getByRole("combobox").nth(1),
  ).toHaveValue("https");
  await packages.click();
  await page
    .locator('input[type="file"][accept=".zip,application/zip"]')
    .setInputFiles({
      name: "classic.zip",
      mimeType: "application/zip",
      buffer: Buffer.from("mock archive; the API is intercepted"),
    });
  await expect.poll(() => uploads).toBe(1);
  await mapping.click();
  await expect(page.getByRole("status")).toBeVisible();
  releaseUpload();
  await expect(page.getByRole("status")).toBeHidden();
  expect(uploads).toBe(1);
  await packages.click();
  await page
    .getByRole("button", { name: "Vollständig prüfen", exact: true })
    .click();
  await build.click();
  await expect(
    page.getByRole("tabpanel").getByRole("combobox").first(),
  ).toHaveValue("proteus");
  await expect(
    page.getByRole("tabpanel").getByRole("combobox").nth(2),
  ).toHaveValue("zip");
  await expect.poll(() => polls).toBeGreaterThan(0);
  await expect(page.locator('section[aria-live="polite"]')).toBeVisible();
  expect(starts).toBe(1);
  finishJob = true;
  await expect(
    page.getByText("Kartenbildjob erfolgreich abgeschlossen.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('section[aria-live="polite"]')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await build.focus();
  await page.keyboard.press("Home");
  await expect(packages).toBeFocused();
  await expect(page.getByRole("tabpanel")).toHaveCount(1);
  await page.keyboard.press("End");
  await expect(build).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(packages).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: test.info().outputPath("card-tabs-mobile.png"),
    fullPage: true,
  });
});
