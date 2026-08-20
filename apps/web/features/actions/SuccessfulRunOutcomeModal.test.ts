import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SuccessfulRunOutcomeModal", () => {
  it("shows source and result data behind an explicit local confirmation", () => {
    const source = readFileSync(
      new URL("./SuccessfulRunOutcomeModal.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("outcome.sourceTitle");
    expect(source).toContain("outcome.headline");
    expect(source).toContain("outcome.resultText");
    expect(source).toContain("<CardView");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('data-testid="successful-run-outcome-dismiss"');
    expect(source).toContain('t("continue")');
    expect(source).not.toContain('t("closeWindow")');
  });
});
