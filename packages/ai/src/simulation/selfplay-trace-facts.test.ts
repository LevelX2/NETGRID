import type { AiDecision, AiDecisionDebug } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { selfplayTraceFactsForDecision } from "./selfplay-trace-facts";

describe("selfplayTraceFactsForDecision", () => {
  it("carries top-level why-not into redacted debug facts", () => {
    const facts = selfplayTraceFactsForDecision(decision(), {
      sanitizeAiDecisionDebug: (debug) => debug,
      safeSelfplayFacts: (items) =>
        items
          .filter((item): item is string => typeof item === "string")
          .filter((item) => !item.includes("privatePayload")),
    });

    expect(facts.debugFacts).toEqual(
      expect.arrayContaining([
        "planKind:semantic_runtime",
        "topLevelWhyNot:alternative:draw_card:semantic_score_below_selected",
      ]),
    );
    expect(JSON.stringify(facts)).not.toContain("privatePayload");
  });
});

function decision(): AiDecision {
  return {
    actionId: "gain",
    confidence: 0.9,
    reason: "semantic_runtime",
    reasonCode: "runner.semantic.test",
    explanation: "Semantic runtime test decision.",
    consideredActionIds: ["gain", "draw"],
    evidence: [],
    fallbackUsed: false,
    decisionDebug: {
      schemaVersion: "ai-decision-debug-v1",
      aiLevel: 2,
      planKind: "semantic_runtime",
      whyNot: [
        "alternative:draw_card:semantic_score_below_selected",
        "privatePayload:bad",
      ],
    } satisfies AiDecisionDebug,
  };
}
