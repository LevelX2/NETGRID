import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const pageSource = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);
const topbarSource = readFileSync(
  new URL("../app-shell/ActiveMatchTopbar.tsx", import.meta.url),
  "utf8",
);

describe("active match deck guide UI", () => {
  it("shows a localized book action only when the own guide resolves", () => {
    expect(topbarSource).toContain("BookOpen");
    expect(topbarSource).toContain("{canOpenDeckGuide ? (");
    expect(topbarSource).toContain('t("openDeckGuide")');
    expect(pageSource).toContain("activeView?.ownDeckGuideRef");
    expect(pageSource).toContain(
      'activeStandardDeck?.guideStatus === "available"',
    );
    expect(pageSource).toContain(
      "canOpenDeckGuide={Boolean(activeStandardDeckGuide)}",
    );
  });

  it("reuses the existing dialog without changing match or timer state", () => {
    expect(pageSource).toContain("<StandardDeckGuideDialog");
    expect(pageSource).toContain(
      "onOpenDeckGuide={() => setMatchDeckGuideOpen(true)}",
    );
    expect(pageSource).toContain(
      "onDismiss={() => setMatchDeckGuideOpen(false)}",
    );
    expect(pageSource).not.toContain("pauseMatchForDeckGuide");
  });
});
