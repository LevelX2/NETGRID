import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

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
    expect(maintenancePageSource).toContain("Vollständige Match-ID kopieren");
    expect(maintenancePageSource).toContain("ID kopieren");
  });
});
