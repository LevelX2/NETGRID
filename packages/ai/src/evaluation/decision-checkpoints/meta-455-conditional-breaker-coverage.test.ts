import { expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-455-r4-g16-d103.json";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import { cardProvidesBreakerCoverage } from "../../plans/tactical-plan-breaker-cards";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([
  ["onr_proteus_082_bulldozer", true, false, false],
  ["onr_proteus_080_black-widow", false, false, true],
  ["onr_proteus_087_forwards-legacy", false, false, true],
  ["onr_proteus_095_skeleton-passkeys", false, true, false],
  ["onr_proteus_088_fubar", true, true, true],
  ["onr_proteus_092_morphing-tool", true, true, true],
] as const)(
  "uses canonical acquisition coverage for %s",
  (id, wall, gate, sentry) => {
    const card = {
      ...CARD_DEFINITIONS_BY_ID[id],
      definitionId: id,
      known: true,
    } as VisibleCard;
    expect(cardProvidesBreakerCoverage(card, "breaker_wall")).toBe(wall);
    expect(cardProvidesBreakerCoverage(card, "breaker_code_gate")).toBe(gate);
    expect(cardProvidesBreakerCoverage(card, "breaker_sentry")).toBe(sentry);
  },
);

it("does not add a conditional Sentry rider to the canonical deck inventory", () => {
  const input = structuredClone(
    checkpoint.input,
  ) as AiDecisionInputWithDeckCapabilities;
  const profile = buildDeckCapabilityProfileFromInput(
    input,
    input.ownDeckSnapshot,
  );
  const bulldozer = profile.runner!.breakerInventory.find(
    (c) => c.cardId === "onr_proteus_082_bulldozer",
  )!;
  expect(bulldozer.coverage).toContain("wall");
  expect(bulldozer.coverage).not.toContain("sentry");
  expect(profile.runner!.breakerCoverageMatrix.sentry.inHand).toBe(false);
});

it("replans the historical turn without funding a false Sentry answer", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  input.ownDeckCapabilities = buildDeckCapabilityProfileFromInput(
    input,
    input.ownDeckSnapshot,
  );
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
    true,
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).not.toContain("breaker_sentry");
  expect(decision.actionId).toBe("runner.draw_card");
  expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: decision.actionId,
    stateVersion: 102,
  });
});
