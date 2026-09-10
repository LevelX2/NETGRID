import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const panelSource = readFileSync(
  new URL("./PublicGamesPanel.tsx", import.meta.url),
  "utf8",
);
const globalStyles = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);

describe("public games match ID contract", () => {
  it("renders the complete match ID instead of shortening it", () => {
    expect(panelSource).toContain(
      "<code title={entry.matchId}>{entry.matchId}</code>",
    );
    expect(panelSource).not.toContain("shortMatchId");
    expect(panelSource).not.toContain("matchId.slice");
  });

  it("wraps long match IDs without hiding characters", () => {
    expect(globalStyles).toMatch(
      /\.publicGameMain code\s*\{[^}]*min-width: 0;[^}]*max-width: 100%;[^}]*overflow-wrap: anywhere;/s,
    );
  });
});
