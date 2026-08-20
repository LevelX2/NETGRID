import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

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
    expect(pageSource).toContain(
      "Bildpakete als Ordner oder ZIP kannst du unten",
    );
    expect(pageSource).toContain("Katalog und Spiel verwenden danach");
    expect(pageSource).toContain(
      "ausschließlich die lokal gespeicherten Bilder",
    );
    expect(pageSource).toContain(
      "Ich darf die in der Zuordnung enthaltenen HTTPS-Quellen verwenden.",
    );
    expect(pageSource).not.toContain("C:\\");
  });

  it("offers directory and ZIP transport for imports and builds", () => {
    expect(pageSource).toContain("ZIP-Paket auswählen …");
    expect(pageSource).toContain("packTransport: selectedPackTransport");
    expect(pageSource).toContain("outputFormat: buildFormat");
    expect(pageSource).toContain(
      '<option value="directory">Verzeichnis</option>',
    );
    expect(pageSource).toContain('<option value="zip">ZIP-Datei</option>');
  });
});
