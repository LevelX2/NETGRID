import { describe, expect, it } from "vitest";
import { visibleCard } from "../semantic-ai-runtime-cutover.test-support";
import { corpVisibleCardPlayCost } from "./corp-visible-card-play-cost";

describe("corpVisibleCardPlayCost", () => {
  it("reads the fixed cost and the exact minimum of a supported variable-X cost", () => {
    const fixed = visibleCard("fixed", "corp", "operation", {
      playCost: { kind: "fixed", credits: 3 },
    });
    const variable = visibleCard("variable", "corp", "operation", {
      playCost: {
        kind: "variable_x",
        minimumX: 0,
        creditsPerX: 1,
        maximumX: { kind: "context" },
      },
    });
    expect(corpVisibleCardPlayCost(fixed)).toBe(3);
    expect(corpVisibleCardPlayCost(variable)).toBe(0);
  });

  it("rejects malformed and out-of-range costs", () => {
    const fixed = visibleCard("malformed", "corp", "operation", {
      playCost: { kind: "fixed", credits: -1 },
    });
    const variable = visibleCard("overflow", "corp", "operation", {
      playCost: {
        kind: "variable_x",
        minimumX: Number.MAX_SAFE_INTEGER,
        creditsPerX: 2,
        maximumX: { kind: "context" },
      },
    });
    expect(corpVisibleCardPlayCost(fixed)).toBeUndefined();
    expect(corpVisibleCardPlayCost(variable)).toBeUndefined();
  });
});
