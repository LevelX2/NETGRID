import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { actionEconomyProjectionFor } from "../actions/action-economy-projection";
import { exactImmediateHandDelta } from "../actions/action-candidate-facts";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./resident-plan-portfolio-memory";
const cp = JSON.parse(
  readFileSync(
    new URL(
      "../../../../data/scenarios/ai-decision-checkpoints/cp-deep634-shell-hand-count-d226.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
afterEach(resetResidentPlanPortfolioMemory);
function source() {
  const input = {
    ...structuredClone(cp.input),
    ...buildAiDecisionInputDto(structuredClone(cp.input)),
  };
  const action = input.legalActions.find((a: { actionId: string }) =>
    a.actionId.includes(".set_aside_from_grip."),
  );
  const target = action.payload.targetCardId;
  const actual = input.legalActions.find(
    (a: { payload?: { targetCardId?: string } }) =>
      a.payload?.targetCardId?.includes("tycho-mem-chip"),
  );
  if (!target || !actual) throw Error("native_target_missing");
  return {
    input,
    action: actual,
    candidate: buildActionSemanticCandidates({
      legalActions: [actual],
      observerSide: "runner",
      stateVersion: 225,
    })[0]!,
  };
}
it("certifies the one-card public set-aside transfer without inventing income or draw", () => {
  const { candidate } = source();
  expect(candidate.economyProjection).toMatchObject({
    kind: "non_economy",
    timing: "immediate",
    cardsDrawn: 0,
    cardsConsumed: 1,
    netHandDelta: -1,
    source: "legal_action_payload",
    reliability: "guaranteed",
    confidence: "high",
  });
  expect(exactImmediateHandDelta(candidate)).toBe(-1);
  expect(candidate.economyProjection!.netLiquidCreditGain).toBeUndefined();
});
it("keeps the native transfer valid but does not choose unneeded memory preparation", () => {
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const { input, action } = source();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input.playerView),
    decision = chooseAiAction(input);
  expect(decision).toMatchObject({
    actionId: "runner.play_event.runner_onr_v1_108_score_1.runner_onr_v1_108_score_1.onr_v1_108_score:abilities_on_play_gain_credits",
    fallbackUsed: false,
    timeoutUsed: false,
  });
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.dispositions).toContainEqual(expect.objectContaining({
    actionId: action.actionId,
    ownerModuleId: "runner.shell_traders_pipeline",
    disposition: "explicitly_nonproductive",
    evidenceCode: "runner_shell_traders_rejected_no_current_target_need",
  }));
  expect(input.legalActions.some((a: { actionId: string }) => a.actionId === decision.actionId)).toBe(true);
  expect(plan.route?.actionId).toBe(decision.actionId);
  expect(JSON.stringify(input.playerView)).toBe(before);
});
it.each(["target", "source", "zone", "side", "state"])(
  "rejects a mismatched public transfer binding: %s",
  (variant) => {
    const { action, candidate } = source();
    if (variant === "target") delete action.payload.targetCardId;
    if (variant === "source") action.payload.cardId = "unrelated-source";
    if (variant === "zone") action.targetRequirements = [];
    if (variant === "side") action.side = "corp";
    if (variant === "state") action.expiresAtStateVersion++;
    const projection = actionEconomyProjectionFor(candidate, action);
    expect(projection.reliability).toBe("unknown");
    expect(
      exactImmediateHandDelta({ ...candidate, economyProjection: projection }),
    ).toBeUndefined();
  },
);
