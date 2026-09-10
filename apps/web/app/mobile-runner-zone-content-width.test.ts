import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const globalsCss = readFileSync(
  new URL("./globals.css", import.meta.url),
  "utf8",
);

describe("mobile runner zone content width", () => {
  const mobileCss = globalsCss.slice(
    globalsCss.indexOf("@media (max-width: 720px)"),
  );

  it("keeps direct runner zones content-sized and viewport-bounded", () => {
    const rule = cssRule(mobileCss, ".runnerGripHeapLayout > .sideZoneFrame");

    expect(rule).toContain("flex: 0 1 auto;");
    expect(rule).toContain("width: fit-content;");
    expect(rule).toContain("max-width: 100%;");
    expect(
      rule
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("width:")),
    ).toEqual(["width: fit-content;"]);
  });

  it("lets runner card rows shrink-wrap while preserving their viewport cap", () => {
    const rule = cssRule(mobileCss, ".runnerGripHeapLayout .fixedZoneCards");

    expect(rule).toContain("width: fit-content;");
    expect(rule).toContain("max-width: 100%;");
  });

  it("retains the wrapping outer layout", () => {
    const rule = cssRule(globalsCss, ".runnerGripHeapLayout");

    expect(rule).toContain("display: flex;");
    expect(rule).toContain("flex-wrap: wrap;");
    expect(rule).toContain("max-width: 100%;");
  });
});

function cssRule(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`CSS-Regel ${selector} fehlt.`);
  const end = css.indexOf("}", start);
  if (end < 0) throw new Error(`CSS-Regel ${selector} ist unvollständig.`);
  return css.slice(start, end + 1);
}
