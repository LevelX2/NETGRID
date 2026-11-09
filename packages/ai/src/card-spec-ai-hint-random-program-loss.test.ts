import { cardSpecPlanningCardByDefinitionId } from "@netgrid/cards/planning";
import { expect, it } from "vitest";
import { AI_HINTS_BY_CARD } from "./ai-hints";
import { deriveCardSpecAiHint } from "./card-spec-ai-hint-compiler";

const risky = "onr_v1_005_bartmoss-memorial-icebreaker";
const stable = "onr_v1_039_krash";

it("projects typed post-encounter program loss into the breaker profile", () => {
  const hint = deriveCardSpecAiHint(cardSpecPlanningCardByDefinitionId(risky)!);
  expect(hint.breakerProfile?.sideEffects).toContain("program_trash_risk");
  expect(hint.functionSignals).toContain("breaker.self_trash_risk");
});

it("ships the same program-loss risk through the generated runtime hints", () => {
  expect(AI_HINTS_BY_CARD.get(risky)?.breakerProfile?.sideEffects).toContain(
    "program_trash_risk",
  );
});

it("derives the risk from the capability rather than the card identity", () => {
  const entry = structuredClone(cardSpecPlanningCardByDefinitionId(risky)!);
  const hint = deriveCardSpecAiHint({
    ...entry,
    definition: { ...entry.definition, id: stable },
  });
  expect(hint.breakerProfile?.sideEffects).toContain("program_trash_risk");
});

it("keeps a deterministic ordinary breaker free of program-loss risk", () => {
  const hint = deriveCardSpecAiHint(
    cardSpecPlanningCardByDefinitionId(stable)!,
  );
  expect(hint.breakerProfile?.sideEffects ?? []).not.toContain(
    "program_trash_risk",
  );
  expect(hint.functionSignals).not.toContain("breaker.self_trash_risk");
});
