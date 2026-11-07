import { readFileSync } from "node:fs";
import type { LegalAction } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { actionEconomyProjectionFor } from "../actions/action-economy-projection";
import { exactImmediateHandDelta } from "../actions/action-candidate-facts";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./resident-plan-portfolio-memory";

const cp = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep629-runner-top-heap-hand-count-d147.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

afterEach(resetResidentPlanPortfolioMemory);

it("counts the actual public heap return before certifying the last-click cleanup", () => {
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input.playerView);
  const decision = chooseAiAction(input);
  const action = recoveryAction();
  expect(decision.actionId).toBe(action.actionId);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toContain(
    "plan:runner.develop_board_and_hand:recovery",
  );
  expect(plan.leafExecutorInstanceId).toBe(plan.rootPlanInstanceId);
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 146,
  });
  const line = plan.turnPlanning!.consideredLines!.find(
    (line) => line.firstActionId === action.actionId,
  )!;
  expect(line.stepCount).toBe(1);
  expect(line.projectedEndState).toMatchObject({
    creditMinimum: 15,
    creditMaximum: 15,
    unrestrictedActionMinimum: 0,
    unrestrictedActionMaximum: 0,
    handMinimum: cp.actualNextHandCount,
    handMaximum: cp.actualNextHandCount,
  });
  expect(line.evidenceCodes).toContain(
    `runner_cleanup_projection:required_discards:${cp.actualRequiredDiscards}`,
  );
  expect(JSON.stringify(input.playerView)).toBe(before);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
});

it("projects one returned card without inventing a draw or liquid income", () => {
  const action = recoveryAction(),
    candidate = candidateFor(action);
  expect(candidate.economyProjection).toMatchObject({
    kind: "non_economy",
    timing: "immediate",
    cardsDrawn: 0,
    cardsConsumed: 0,
    netHandDelta: 1,
    source: "legal_action_payload",
    reliability: "guaranteed",
    confidence: "high",
  });
  expect(exactImmediateHandDelta(candidate)).toBe(1);
  expect(candidate.economyProjection!.netLiquidCreditGain).toBeUndefined();
  expect(candidate.economyProjection!.drawPileCardsConsumed).toBeUndefined();
});

it.each(["targetCardId", "cardImplementationAbilityId", "cardId"])(
  "does not certify a return with a missing %s binding",
  (key) => {
    const action = recoveryAction(),
      candidate = candidateFor(action);
    delete action.payload![key];
    const projection = actionEconomyProjectionFor(candidate, action);
    expect(projection.reliability).toBe("unknown");
    expect(
      exactImmediateHandDelta({ ...candidate, economyProjection: projection }),
    ).toBeUndefined();
  },
);

it.each([
  "different_target",
  "different_source",
  "different_action",
  "stale_state",
  "other_side",
])("rejects an unrelated or stale transfer: %s", (variant) => {
  const action = recoveryAction(),
    candidate = candidateFor(action);
  if (variant === "different_target")
    action.payload!.cardImplementationTopTrashTargetId = "another-card";
  if (variant === "different_source") action.payload!.cardId = "another-source";
  if (variant === "different_action") action.actionId += ":other";
  if (variant === "stale_state") action.expiresAtStateVersion--;
  if (variant === "other_side") action.side = "corp";
  expect(actionEconomyProjectionFor(candidate, action).reliability).toBe(
    "unknown",
  );
});

it("does not turn an unresolved heap search into a completed card return", () => {
  const action = recoveryAction();
  action.payload!.cardImplementationEffectKind = "search_trash_to_grip";
  const projection = actionEconomyProjectionFor(
    candidateFor(recoveryAction()),
    action,
  );
  expect(projection.timing).toBe("unknown");
  expect(projection.netHandDelta).toBe(0);
});

function recoveryAction(): LegalAction {
  return structuredClone(
    cp.input.legalActions.find(
      (a: LegalAction) =>
        a.payload?.cardImplementationEffectKind === "move_top_trash_to_grip",
    ),
  );
}

function candidateFor(action: LegalAction) {
  return buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "runner",
    stateVersion: cp.stateVersion,
  })[0]!;
}
