import { readFileSync } from "node:fs";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { canonicalCapabilityId, capabilityKey } from "@netgrid/cards";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";

const payoutCapability = canonicalCapabilityId(
  390,
  capabilityKey("abilities_activated_runner_main_take_hosted_credits"),
);

afterEach(resetResidentPlanPortfolioMemory);
function native(file: string) {
  const cp = JSON.parse(
    readFileSync(new URL(`./fixtures/${file}.json`, import.meta.url), "utf8"),
  ).checkpoint;
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  const input: AiDecisionInputWithDeckCapabilities = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
it("binds a stronger last finite bank payout to the current P6 liquidity need", () => {
  const input = native("deep662-d62-last-finite-payout");
  const action = input.legalActions.find(
    (a) => a.abilityRef?.sourceAbilityId === payoutCapability,
  )!;
  const before = JSON.stringify({
    view: input.playerView,
    legal: input.legalActions,
  });
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(action.actionId);
  const plan = decision.decisionDebug!.planFirstDecision!;
  expect(plan.rootPlanInstanceId).toBe("pd33orsvhdwaw0vbqxnupb5l5z");
  expect(plan.leafExecutorInstanceId).toBe("pdik19o9yaib81mgcygdsofecq");
  expect(plan.route).toMatchObject({
    actionId: action.actionId,
    stateVersion: 61,
  });
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(
    JSON.stringify({ view: input.playerView, legal: input.legalActions }),
  ).toBe(before);
});
it("keeps a real higher-priority run ahead of residual bank liquidation", () => {
  const input = native("deep662-d270-effective-access-priority");
  expect(
    input.legalActions.some(
      (a) => a.abilityRef?.sourceAbilityId === payoutCapability,
    ),
  ).toBe(true);
  const decision = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  );
  expect(action).toMatchObject({
    type: "play_event",
    payload: { serverId: "rd" },
  });
  expect(decision.decisionDebug!.planFirstDecision!.rootPlanInstanceId).toBe(
    planInstanceIdForProposal({
      moduleId: "runner.pressure_central",
      dedupeKey: "central:rd",
    }),
  );
  const targets = evaluateRunnerRunTargets({ input });
  const hqVariant = input.legalActions.find(
    (candidate) =>
      candidate.source === action?.source &&
      candidate.payload?.serverId === "hq",
  )!;
  expect(
    targets.find((target) => target.actionId === hqVariant.actionId),
  ).toMatchObject({
    creditsAfterRun: 14,
    fundingNeed: { reason: "none" },
  });
  expect(
    targets.find((target) => target.actionId === action?.actionId),
  ).toMatchObject({
    creditsAfterRun: 11,
    fundingNeed: { reason: "none" },
  });
  const planning = decision.decisionDebug!.planFirstDecision!.turnPlanning!;
  const hqLine = planning.consideredLines!.find(
    (line) => line.firstActionId === hqVariant.actionId,
  )!;
  const rdLine = planning.consideredLines!.find(
    (line) => line.firstActionId === action?.actionId,
  )!;
  for (const line of [hqLine, rdLine]) {
    expect(line).toMatchObject({
      priorityClass: "P4",
      scalarValue: 365,
      upperBoundValue: 730,
      violatedObligationCount: 0,
    });
  }
  expect(rdLine.projectedEndState).toEqual(hqLine.projectedEndState);
  expect(planning.selectedLine.lineId).toBe(rdLine.lineId);
  resetResidentPlanPortfolioMemory();
  expect(
    chooseAiAction(native("deep662-d270-effective-access-priority")).actionId,
  ).toBe(action?.actionId);
});
