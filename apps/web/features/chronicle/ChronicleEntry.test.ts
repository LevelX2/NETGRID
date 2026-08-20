import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  new URL("./ChronicleEntry.tsx", import.meta.url),
  "utf8",
);

describe("ChronicleEntry", () => {
  it("renders the discard glyph instead of the hidden-information eye", () => {
    for (const icon of ["Activity", "Award", "CopyX", "Eye"]) {
      expect(source).toMatch(new RegExp(`\\b${icon}\\b`));
    }
    expect(source).toContain('if (icon === "discard") return <CopyX size={15} />;');
    expect(source).toMatch(
      /case "hidden":\r?\n\s+return <Eye size=\{15\} \/>;/,
    );
  });
});
