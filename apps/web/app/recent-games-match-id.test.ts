import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const recentGamesSource = readFileSync(
  new URL("../features/recent/RecentGamesPanel.tsx", import.meta.url),
  "utf8",
);
const globalsCss = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);

describe("recent game match IDs", () => {
  it("renders the complete standalone and series-game match IDs", () => {
    expect(recentGamesSource).toContain("<MatchId matchId={result.matchId} />");
    expect(recentGamesSource).toContain(
      '<MatchId matchId={game.matchId} className="recentSeriesMatchId" />',
    );
    expect(recentGamesSource).toContain("<code>{matchId}</code>");
  });

  it("keeps long identifiers readable without horizontal overflow", () => {
    expect(globalsCss).toMatch(
      /\.recentMatchId\s*\{[^}]*min-width:\s*0[^}]*flex-wrap:\s*wrap/s,
    );
    expect(globalsCss).toMatch(
      /\.recentMatchId code\s*\{[^}]*max-width:\s*100%[^}]*overflow-wrap:\s*anywhere/s,
    );
    expect(globalsCss).toMatch(
      /\.recentSeriesMatchId\s*\{[^}]*grid-column:\s*1 \/ -1/s,
    );
  });

  it("surfaces missing result data instead of substituting another identifier", () => {
    expect(recentGamesSource).toContain('t("missingMatchId")');
    expect(recentGamesSource).toContain('role: "status" as const');
  });
});
