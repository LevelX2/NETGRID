import { planningCardWithFactsByDefinitionId } from "@netgrid/cards/planning";
import { expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const risky = 217;
const stable = 251;

it("projects typed post-encounter program loss into the breaker profile", () => {
  const hint = deriveCardSpecAiHint(planningCardWithFactsByDefinitionId(risky)!);
  expect(hint.breakerProfile?.sideEffects).toContain("program_trash_risk");
  expect(hint.functionSignals).toContain("breaker.self_trash_risk");
});

it("ships the same program-loss risk through the generated runtime hints", () => {
  expect(AI_HINTS_BY_CARD.get(risky)?.breakerProfile?.sideEffects).toContain(
    "program_trash_risk",
  );
});

it("derives the risk from the capability rather than the card identity", () => {
  const entry = structuredClone(planningCardWithFactsByDefinitionId(risky)!);
  const hint = deriveCardSpecAiHint({
    ...entry,
    facts: { ...entry.facts, id: stable },
  });
  expect(hint.breakerProfile?.sideEffects).toContain("program_trash_risk");
});

it("keeps a deterministic ordinary breaker free of program-loss risk", () => {
  const hint = deriveCardSpecAiHint(
    planningCardWithFactsByDefinitionId(stable)!,
  );
  expect(hint.breakerProfile?.sideEffects ?? []).not.toContain(
    "program_trash_risk",
  );
  expect(hint.functionSignals).not.toContain("breaker.self_trash_risk");
});
