import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";
import deMaintenanceMessages from "../../messages/maintenance/de.json";

const maintenancePageSource = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);

describe("maintenance match-ID copy control", () => {
  it("copies the complete detail match ID through the shared clipboard helper", () => {
    expect(maintenancePageSource).toContain(
      'import { copyTextToClipboard } from "../../lib/clipboard";',
    );
    expect(maintenancePageSource).toContain(
      "const copied = await copyTextToClipboard(detail.matchId);",
    );
    expect(maintenancePageSource).toContain('title={t("m076")}');
    expect(deMaintenanceMessages.storage.m076).toBe(
      "Vollständige Match-ID kopieren",
    );
    expect(deMaintenanceMessages.storage.m077).toBe("ID kopieren");
  });
});
