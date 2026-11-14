import jettison from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p745-g18-d72.json";
import bypass from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p745-g31-d61.json";
import search from "../../../../../data/scenarios/ai-decision-checkpoints/cp-p745-g39-d69.json";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function decide(
  checkpoint: typeof jettison | typeof bypass | typeof search,
  event: string,
  extraClick = false,
) {
  const input = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
  expect(input.playerView.opponent).not.toHaveProperty("gripOrHq");
  expect(input.playerView.own.clicks).toBe(1);
  if (extraClick) input.playerView.own.clicks += 1;
  const eventAction = input.legalActions.find(
    (action) => action.type === "play_event" && action.actionId.includes(event),
  );
  expect(eventAction).toBeDefined();
  const actionId = eventAction!.actionId;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint.runtime as unknown as AiRuntimeCheckpointV1,
  );
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.timeoutUsed).toBe(false);
  expect(input.legalActions.some((action) => action.actionId === decision.actionId)).toBe(true);
  const plan = decision.decisionDebug!.planFirstDecision!;
  return {
    actionId,
    selectedActionId: decision.actionId,
    plan,
    dispositions: plan.dispositions.filter((entry) => entry.actionId === actionId),
  };
}

const protection = {
  ownerModuleId: "runner.defense_and_recovery",
  disposition: "explicitly_nonproductive",
  evidenceCode: "runner_last_action_would_lose_next_corp_turn_hand_buffer",
};

it.each([
  ["ICE removal", jettison, "core-command-jettison-ice", "fnv1a:85b73d8a"],
  ["bypass", bypass, "social-engineering", "fnv1a:1998f9b1"],
] as const)("keeps Grip over optional last-click %s", (_label, cp, event, hash) => {
  expect(cp.stateHash).toBe(hash);
  const guarded = decide(cp, event);
  expect(guarded.dispositions).toEqual([{ ...protection, actionId: guarded.actionId }]);
  expect(guarded.selectedActionId).toBe("runner.gain_credit");
  expect(
    guarded.plan.turnPlanning!.consideredLines!.some(
      (line) => line.firstActionId === guarded.actionId,
    ),
  ).toBe(false);

  resetResidentPlanPortfolioMemory();
  const canRefill = decide(cp, event, true);
  expect(canRefill.dispositions).toEqual([]);
  expect(canRefill.selectedActionId).toBe(canRefill.actionId);
  expect(canRefill.plan.rootPlanInstanceId).toBe("plan:runner.pressure_central:central%3Ard");
  expect(canRefill.plan.route).toMatchObject({
    actionId: canRefill.actionId,
    stateVersion: cp.input.playerView.stateVersion,
  });
});

it("assigns a rejected search to Defense once while Grip is protected", () => {
  expect(search.stateHash).toBe("fnv1a:5f7140ae");
  const guarded = decide(search, "mantis-fixer-at-large");
  expect(guarded.dispositions).toEqual([{ ...protection, actionId: guarded.actionId }]);
  expect(guarded.selectedActionId).toBe("runner.gain_credit");

  resetResidentPlanPortfolioMemory();
  const canRefill = decide(search, "mantis-fixer-at-large", true);
  expect(canRefill.dispositions).toEqual([
    {
      actionId: canRefill.actionId,
      ownerModuleId: "runner.rig_and_coverage",
      disposition: "explicitly_nonproductive",
      evidenceCode: "runner_coverage_search_rejected_without_deck_answer:breaker_sentry@no_server+breaker_wall@no_server",
    },
  ]);
});
