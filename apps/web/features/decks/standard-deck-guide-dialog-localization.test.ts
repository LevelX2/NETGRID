import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const dialogSource = readFileSync(
  new URL("./StandardDeckGuideDialog.tsx", import.meta.url),
  "utf8",
);

describe("standard deck guide dialog localization", () => {
  it("resolves guide content from the active UI locale", () => {
    expect(dialogSource).toContain("useLocale()");
    expect(dialogSource).toContain("resolveStandardDeckGuideContent");
    expect(dialogSource).toContain("const content = resolvedGuide.content");
  });

  it("marks fallback content with the language that is actually rendered", () => {
    expect(dialogSource).toContain("lang={resolvedGuide.locale}");
    expect(dialogSource).not.toContain("guide.content.");
  });
});
