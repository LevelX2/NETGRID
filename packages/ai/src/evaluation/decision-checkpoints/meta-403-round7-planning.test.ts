import { describe, expect, it } from "vitest";
import coverage from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-terminal-coverage-overfull.json";
import protection from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-unverified-combined-protection.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function decide(
  json: unknown,
  change?: (input: AiDecisionInputWithDeckCapabilities) => void,
) {
  const { input, runtime } = structuredClone(json) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  change?.(input);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const result = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  expect(result.fallbackUsed).toBe(false);
  return { input, action, plan: result.decisionDebug?.planFirstDecision };
}

describe("meta 403 round 7 concrete plan feasibility", () => {
  it("allows the terminal remote's bound coverage search despite an overfull grip", () => {
    const { input, action, plan } = decide(coverage);
    expect(input.playerView.own.gripOrHq.length).toBeGreaterThan(
      input.playerView.own.maxHandSize,
    );
    expect(action.type).toBe("draw_card");
    expect(plan?.rootPlanInstanceId).toContain("runner.contest_remote");
    expect(plan?.leafExecutorInstanceId).toContain("runner.rig_and_coverage");
    expect(plan?.priority?.effectiveClass).toBe("P2");
  });

  it("keeps the ordinary overfull-hand draw boundary without a terminal threat", () => {
    const { action, plan } = decide(coverage, (input) => {
      input.playerView.opponent.agendaPoints = 0;
    });
    expect(action.type).not.toBe("draw_card");
    expect(plan?.rootPlanInstanceId).not.toContain("runner.contest_remote");
  });

  it("does not value an unfunded duplicated ICE suffix above the already protected score server", () => {
    const { action, plan } = decide(protection);
    expect(action.type).toBe("install_card");
    expect(action.payload?.serverId).toBe("remote_1");
    expect(plan?.selectedPlan?.moduleId).toBe("corp.score_agenda");
    expect(plan?.rootPlanInstanceId).toBe(plan?.leafExecutorInstanceId);
  });
});
