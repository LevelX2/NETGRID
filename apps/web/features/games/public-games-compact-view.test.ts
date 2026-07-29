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

describe("public games compact view contract", () => {
  it("keeps compact entries in a fixed single row", () => {
    expect(panelSource).toContain("className={`publicGamesList ${viewMode}`}");
    expect(globalStyles).toMatch(
      /\.publicGameCard\.compact\s*\{[^}]*height: 38px;[^}]*max-height: 38px;[^}]*overflow: hidden;/s,
    );
    expect(globalStyles).toMatch(
      /\.publicGameCard\.compact \.publicGameMain > div\s*\{[^}]*flex-wrap: nowrap;/s,
    );
  });

  it("uses icon-only compact actions with accessible tooltip text", () => {
    expect(panelSource).toContain('className="publicGameActionLabel"');
    expect(panelSource).toContain('aria-label="Zuschauen"');
    expect(panelSource).toContain('title="Spielprotokoll herunterladen"');
    expect(globalStyles).toMatch(
      /\.publicGameCard\.compact \.publicGameActionLabel[^}]*\{[^}]*display: none;/s,
    );
    expect(globalStyles).toMatch(
      /\.publicGameCard\.compact \.publicGameFooter \.button\s*\{[^}]*width: 28px;[^}]*height: 28px;/s,
    );
  });
});
