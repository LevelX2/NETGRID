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

  it("retains strategic Corp intent facts beyond the generic detail item cap", () => {
    const facts = selfplayTraceFactsForDecision(strategyDecision(), {
      sanitizeAiDecisionDebug: (debug) => debug,
      safeSelfplayFacts: (items) =>
        items
          .filter((item): item is string => typeof item === "string")
          .filter((item) => !item.includes("privatePayload")),
    });

    expect(facts.debugFacts).toEqual(
      expect.arrayContaining([
        "tactical_plan:corp_strategic_intent_used:corp_strategic_intent:corp.score_agendas",
        "tactical_plan:corp_strategic_intent_used:corp_score_plan:corp.remote_scoreline",
        "strategic_runtime:deck_strategy_primary:corp.remote_scoring:final=42:confidence=medium:runtime=productive",
        "strategic_runtime:strategy_portfolio_active:corp.remote_scoring",
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

function strategyDecision(): AiDecision {
  return {
    actionId: "install-agenda",
    confidence: 0.9,
    reason: "semantic_runtime",
    reasonCode: "corp.semantic.test",
    explanation: "Semantic runtime strategy trace decision.",
    consideredActionIds: ["install-agenda", "gain-credit"],
    evidence: [],
    fallbackUsed: false,
    decisionDebug: {
      schemaVersion: "ai-decision-debug-v1",
      aiLevel: 2,
      planKind: "semantic_runtime",
      detailSections: [
        {
          id: "tactical_plan",
          title: "Tactical Plan",
          items: [
            "previous_plan:none",
            "plan_progression_reason:new_plan",
            "selected_plan:scoreline",
            "selected_plan_type:corp.scoreline",
            "corp_strategic_intent_used:corp_strategic_intent:corp.score_agendas",
            "corp_strategic_intent_used:corp_score_plan:corp.remote_scoreline",
            "privatePayload:bad",
          ],
        },
        {
          id: "strategic_runtime",
          title: "Strategic Runtime",
          items: [
            "deck_strategy_profile:ai_internal_strategy_profile",
            "deck_strategy_primary:corp.remote_scoring:final=42:confidence=medium:runtime=productive",
            "strategy_portfolio_active:corp.remote_scoring",
          ],
        },
      ],
    } satisfies AiDecisionDebug,
  };
}
