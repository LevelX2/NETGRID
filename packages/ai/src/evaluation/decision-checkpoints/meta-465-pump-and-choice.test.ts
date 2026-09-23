import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function load(game: number, decision: number, credits?: number) {
  const { input, runtime } = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-465-r1-g${game}-d${decision}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  if (credits !== undefined) input.playerView.own.credits = credits;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}

it.each([
  [20, 336],
  [40, 262],
])(
  "funds the composite hard ETR in the bound remote contest (game %i)",
  (g, d) => {
    const input = load(g, d),
      result = chooseAiAction(input);
    const pump = input.legalActions.find((a) => a.type === "pump_breaker")!;
    expect(result.actionId).toBe(pump.actionId);
    expect(result.fallbackUsed).toBe(false);
    expect(result.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      route: {
        actionId: pump.actionId,
        stateVersion: input.playerView.stateVersion,
      },
    });
    expect(
      result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toContain("plan:runner.convert_run_window:");
  },
);

it("does not start four pumps without the full two-break budget", () => {
  const input = load(20, 336, 9),
    result = chooseAiAction(input);
  expect(result.actionId).toBe(
    input.legalActions.find((a) => a.type === "continue_run")!.actionId,
  );
  expect(result.fallbackUsed).toBe(false);
});

it("preserves the bound unknown-ICE reserve after the exact current payment", () => {
  const input = load(40, 262, 13),
    result = chooseAiAction(input);
  expect(result.actionId).toBe(
    input.legalActions.find((a) => a.type === "continue_run")!.actionId,
  );
  expect(result.fallbackUsed).toBe(false);
});

it("resolves the original mandatory placement without inventing a credit head", () => {
  const input = load(38, 353);
  expect(input.playerView.own.clicks).toBe(1);
  expect(input.legalActions.map((a) => a.type)).toEqual(["resolve_choice"]);
  const result = chooseAiAction(input);
  expect(result.actionId).toBe("corp.resolve_choice");
  expect(result.fallbackUsed).toBe(false);
  expect(result.decisionDebug?.planFirstDecision?.route).toMatchObject({
    actionId: "corp.resolve_choice",
    stateVersion: 352,
  });
  expect(
    result.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
  ).toContain("corp.defend_servers");
});

it("uses the exact printed X payment to fund the unaffordable central ICE", () => {
  const input = load(28, 164),
    result = chooseAiAction(input);
  const action = input.legalActions.find(
    (a) => a.actionId === result.actionId,
  )!;
  expect(action).toMatchObject({
    type: "play_operation",
    source: "corp_onr_proteus_049_emergency-rig_1",
    costs: [{ clicks: 1, credits: 3 }],
    payload: {
      xValue: 3,
      targetCardId: "corp_onr_proteus_015_colonel-failure_2",
    },
  });
  expect(result.fallbackUsed).toBe(false);
  const owner = "plan:corp.defend_servers:server-defense-portfolio";
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: owner,
    leafExecutorInstanceId: owner,
    route: {
      planInstanceId: owner,
      actionId: action.actionId,
      stateVersion: 163,
    },
  });
});
