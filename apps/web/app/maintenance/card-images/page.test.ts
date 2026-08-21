import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import deMaintenanceMessages from "../../../messages/maintenance/de.json";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const maintenanceSource = readFileSync(
  new URL("../page.tsx", import.meta.url),
  "utf8",
);

describe("IMG08 card image maintenance page contract", () => {
  it("is linked from maintenance and uses the protected card image endpoints", () => {
    expect(maintenanceSource).toContain('href="/maintenance/card-images"');
    expect(pageSource).toContain(
      "/api/storage/maintenance/card-images/imports/preview",
    );
    expect(pageSource).toContain(
      "/api/storage/maintenance/card-images/imports/apply",
    );
    expect(pageSource).toContain(
      "/api/storage/maintenance/card-images/packs/import",
    );
    expect(pageSource).toContain(
      "/api/storage/maintenance/card-images/packs/build",
    );
    expect(pageSource).toContain(
      "/api/storage/maintenance/card-images/inbox/package-archives",
    );
    expect(pageSource).not.toContain("MaintenanceReauthenticationDialog");
    expect(pageSource).not.toContain("auth.reauthenticate");
  });

  it("explains local uploads, one-time HTTPS import and rights confirmation", () => {
    expect(pageSource).toContain('useTranslations("Maintenance.cardImages")');
    expect(deMaintenanceMessages.cardImages.m014).toContain(
      "Bildpakete als Ordner oder ZIP",
    );
    expect(deMaintenanceMessages.cardImages.m014).toContain(
      "ausschließlich die lokal gespeicherten Bilder",
    );
    expect(deMaintenanceMessages.cardImages.m029).toBe(
      "Ich darf die in der Zuordnung enthaltenen HTTPS-Quellen verwenden.",
    );
    expect(pageSource).not.toContain("C:\\");
  });

  it("offers directory and ZIP transport for imports and builds", () => {
    expect(deMaintenanceMessages.cardImages.m038).toBe("ZIP-Paket auswählen …");
    expect(pageSource).toContain("packTransport: selectedPackTransport");
    expect(pageSource).toContain("outputFormat: buildFormat");
    expect(pageSource).toContain(
      '<option value="directory">{t("m057")}</option>',
    );
    expect(pageSource).toContain('<option value="zip">{t("m058")}</option>');
  });
});
