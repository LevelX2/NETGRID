import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "../evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";

function fixture(d: number, credits?: number) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r4-g25-d${d}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  if (credits !== undefined) input.playerView.own.credits = credits;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
afterEach(resetResidentPlanPortfolioMemory);
describe("meta 461 current-turn pump survives the future path projection", () => {
  it.each([318, 320])(
    "funds the complete nine-credit route from original decision %i",
    (d) => {
      const input = fixture(d);
      const pump = input.legalActions.find((a) => a.type === "pump_breaker")!;
      const result = chooseAiAction(input);
      expect(result).toMatchObject({
        actionId: pump.actionId,
        fallbackUsed: false,
        decisionDebug: {
          planFirstDecision: {
            rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
            leafExecutorInstanceId: `plan:runner.convert_run_window:run%3A${input.playerView.run!.runId}`,
            route: {
              actionId: pump.actionId,
              stateVersion: input.playerView.stateVersion,
            },
          },
        },
      });
    },
  );
  it("still rejects eight credits for the nine-credit route", () => {
    const input = fixture(320, 8);
    const result = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === result.actionId)?.type,
    ).toBe("continue_run");
    expect(result.fallbackUsed).toBe(false);
  });
});
import { runnerRigAfterPumpAndEncounter } from "./runner-rig-after-encounter";
import { assessKnownRezzedIcePath } from "../visible-run-analysis";

it("preserves the paid turn strength without charging inner Code Gates again", () => {
  const input = fixture(320);
  const breaker = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_classic_030_psychic-friend",
  )!;
  const ice = input.playerView.run!.encounteredIce!;
  const rig = runnerRigAfterPumpAndEncounter(
    input.playerView.own.rig!,
    breaker,
    ice,
    1,
    3,
  );
  const inner = input.playerView.servers
    .find((s) => s.id === "remote_1")!
    .ice.slice(0, 2);
  const path = assessKnownRezzedIcePath(inner, rig, 2);
  expect(path.canReachAccess).toBe(true);
  expect(path.visibleBreakCost).toBe(2);
  expect(path.creditsAfterPath).toBe(0);
  expect(breaker.strength).toBe(1);
});

it("retains the boundary strength and adds only the new persistent pump", () => {
  const input = fixture(320);
  const breaker = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_classic_030_psychic-friend",
  )!;
  breaker.strength = 5;
  breaker.strengthAfterEncounter = 2;
  const result = runnerRigAfterPumpAndEncounter(
    input.playerView.own.rig!,
    breaker,
    input.playerView.run!.encounteredIce!,
    1,
    3,
  );
  expect(result.find((c) => c.instanceId === breaker.instanceId)).toMatchObject(
    { strength: 5, strengthAfterEncounter: 5 },
  );
});

it("does not retain either an old or a projected encounter-only pump", () => {
  const input = fixture(320);
  const breaker = input.playerView.own.rig!.find(
    (c) => c.definitionId === "onr_classic_028_matador",
  )!;
  breaker.strength = 5;
  breaker.strengthAfterEncounter = 0;
  const result = runnerRigAfterPumpAndEncounter(
    input.playerView.own.rig!,
    breaker,
    input.playerView.run!.encounteredIce!,
    5,
    1,
  );
  expect(result.find((c) => c.instanceId === breaker.instanceId)).toMatchObject(
    { strength: 0, strengthAfterEncounter: 0 },
  );
});
