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

describe("public games winner display contract", () => {
  it("renders finished participants separately and names the winner accessibly", () => {
    expect(panelSource).toContain('className="publicGameParticipants"');
    expect(panelSource).toContain('className="publicGameWinnerCrown"');
    expect(panelSource).toContain('participant.isWinner ? ", Gewinner" : ""');
    expect(panelSource).toContain('participant.isWinner ? "Gewinner: " : ""');
    expect(panelSource).toContain("publicMatchParticipants(entry)");
  });

  it("keeps a static winner signal while respecting reduced motion", () => {
    expect(globalStyles).toMatch(
      /\.publicGameParticipant\.winner\s*\{[^}]*border-color:[^}]*background:[^}]*box-shadow:/s,
    );
    expect(globalStyles).toMatch(/\.publicGameWinnerCrown\s*\{[^}]*color:/s);
    expect(globalStyles).toContain("@keyframes publicGameWinnerShine");
    expect(globalStyles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.publicGameParticipant\.winner::after\s*\{[^}]*display: none;[^}]*animation: none;/s,
    );
  });

  it("keeps compact rows height-stable without the winner animation", () => {
    expect(globalStyles).toMatch(
      /\.publicGameCard\.compact\s*\{[^}]*height: 38px;[^}]*max-height: 38px;[^}]*overflow: hidden;/s,
    );
    expect(globalStyles).toMatch(
      /\.publicGameCard\.compact \.publicGameParticipant\.winner::after\s*\{[^}]*display: none;[^}]*animation: none;/s,
    );
  });
});
