import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const globalStyles = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);

describe("active match details strip", () => {
  it("renders the complete match ID instead of a shortened diagnostic value", () => {
    expect(pageSource).toMatch(
      /<dt>\{gameT\("match"\)\}<\/dt>\s*<dd>\{payload\.matchId\}<\/dd>/,
    );
  });

  it("wraps status fields as groups and lets long values break within a field", () => {
    expect(globalStyles).toMatch(
      /\.matchDetailsFields\s*\{[^}]*flex-wrap:\s*wrap;/s,
    );
    expect(globalStyles).toMatch(
      /\.matchDetailsFields > div\s*\{[^}]*flex:\s*0 0 auto;[^}]*max-width:\s*100%;[^}]*flex-wrap:\s*wrap;/s,
    );
    expect(globalStyles).toMatch(
      /\.matchDetailsFields dd\s*\{[^}]*overflow-wrap:\s*anywhere;/s,
    );
  });
});
