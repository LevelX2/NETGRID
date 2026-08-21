import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);

describe("runner rig action marker layout", () => {
  it("keeps card slots aligned to their cards when another rig group is taller", () => {
    const rule = cssRule(globalsCss, ".rigGroupCards");

    expect(rule).toContain("display: flex;");
    expect(rule).toContain("align-items: flex-start;");
  });
});

function cssRule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`CSS-Regel ${selector} fehlt.`);
  const end = css.indexOf("}", start);
  if (end < 0) throw new Error(`CSS-Regel ${selector} ist unvollständig.`);
  return css.slice(start, end + 1);
}
