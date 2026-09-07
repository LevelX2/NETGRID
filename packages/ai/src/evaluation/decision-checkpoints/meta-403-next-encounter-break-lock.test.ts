import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-next-encounter-break-lock.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { runnerVisibleLethalIceDamageAssessment } from "../../runner-damage-threat-assessment";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture() {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  // Historical D95 plus the new public field: the preceding resolved Bolter
  // subroutine sets this Engine marker. No hidden ICE/hand identity is added.
  const dto = buildAiDecisionInputDto({
    ...input,
    matchId: input.matchId!,
    actionNumber: 95,
  });
  input.playerView = dto.playerView;
  input.legalActions = dto.legalActions;
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}

it("SP-289 binds the legal jack-out when a public break lock makes known next damage lethal", () => {
  const input = fixture();
  expect(input.playerView.stateVersion).toBe(94);
  expect(input.playerView.own.gripOrHq).toHaveLength(0);
  expect(input.playerView.run?.nextEncounterNoBreakSubroutines).toBe(true);
  const jackout = input.legalActions.find((a) => a.type === "jack_out")!;
  expect(chooseAiAction(input)).toMatchObject({
    actionId: jackout.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_91",
        route: { actionId: jackout.actionId },
      },
    },
  });
});

it("does not invent a break lock and still honors exact damage prevention", () => {
  const input = fixture();
  const laser = input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!;
  expect(runnerVisibleLethalIceDamageAssessment(input, [laser])).toMatchObject({
    projectedDamage: 1,
  });
  delete input.playerView.run!.nextEncounterNoBreakSubroutines;
  expect(
    runnerVisibleLethalIceDamageAssessment(input, [laser]),
  ).toBeUndefined();
  input.playerView.run!.nextEncounterNoBreakSubroutines = true;
  input.playerView.own.freeNetOrCoreDamagePreventionRemaining = 1;
  expect(
    runnerVisibleLethalIceDamageAssessment(input, [laser]),
  ).toBeUndefined();
});

it("keeps queued and current restrictions bound to their own encounter", () => {
  const input = fixture();
  const laser = input.playerView.servers.find((s) => s.id === "hq")!.ice[0]!;
  input.playerView.run!.phase = "encounter_ice";
  input.playerView.run!.encounteredIce = laser;
  expect(
    runnerVisibleLethalIceDamageAssessment(input, [laser]),
  ).toBeUndefined();
  input.playerView.run!.noBreakSubroutinesActive = true;
  expect(runnerVisibleLethalIceDamageAssessment(input, [laser])).toMatchObject({
    projectedDamage: 1,
  });
});
