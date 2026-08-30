import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);

describe("active match details strip", () => {
  it("renders the complete match ID instead of a shortened diagnostic value", () => {
    expect(pageSource).toContain('className="matchStripMatchId"');
    expect(pageSource).toContain(
      '<strong>{gameT("match")}</strong> {payload.matchId}',
    );
    expect(pageSource).not.toContain(
      '<strong>{gameT("match")}</strong> {shortDiagnosticsHash(payload.matchId)}',
    );
  });

  it("allows the complete match ID to wrap instead of ellipsizing it", () => {
    expect(globalStyles).toMatch(
      /\.matchStrip \.matchStripMatchId\s*\{[^}]*overflow:\s*visible;[^}]*text-overflow:\s*clip;[^}]*white-space:\s*normal;[^}]*overflow-wrap:\s*anywhere;/s,
    );
  });
});
