import { describe, expect, it } from "vitest";

import { simulateAiGame } from "../simulation";
import { isSelfplayTraceRedactionSafe } from "./selfplay-trace-mining";

describe("selfplay full-trace redaction", () => {
  it("keeps detailed action alternatives safe across the full exported summary", () => {
    const summary = simulateAiGame({
      seed: "selfplay-full-trace-redaction",
      maxActions: 24,
      includeActionAlternativesForFindings: true,
    });

    expect(summary.errors).toEqual([]);
    expect(summary.actionSequence.length).toBeGreaterThan(0);
    expect(
      summary.actionSequence.some(
        (decision) => (decision.actionAlternatives?.length ?? 0) > 0,
      ),
    ).toBe(true);
    expect(isSelfplayTraceRedactionSafe(summary)).toBe(true);
  });
});
