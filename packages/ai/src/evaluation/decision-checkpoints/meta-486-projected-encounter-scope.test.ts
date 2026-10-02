import { afterEach, expect, it } from "vitest";
import setupCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-486-projected-encounter-effect-scope.json";
import windowCheckpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-486-projected-encounter-effect-window.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { encounterRunRemainderEffectAssessment } from "../../runtime/runner-run-remainder-effect-assessment";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function fixture(source: unknown = setupCheckpoint) {
  const cp = structuredClone(source) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.ownDeckCapabilities = buildDeckCapabilityProfileFromInput(input);
  restoreAiRuntimeCheckpoint(input, input.ownDeckSnapshot!.deckSnapshotId, cp.runtime);
  return input;
}
function hq(input: AiDecisionInputWithDeckCapabilities) {
  return input.playerView.servers.find((s) => s.id === "hq")!;
}
function path(input: AiDecisionInputWithDeckCapabilities, credits = 50) {
  return assessKnownRezzedIcePath(hq(input).ice, input.playerView.own.rig!, credits);
}
const lockId = "printed_subroutines_prohibit_break_next_ice";

it("SP-459 consumes the real next-encounter lock at Canis before the deeper Keeper", () => {
  const input = fixture();
  expect(setupCheckpoint.validation).toMatchObject({
    snapshotHashMatches: true, sideSafeInput: true, legalActionSetMatchesHistoricalAudit: true,
  });
  expect(path(input)).toMatchObject({ canReachAccess: true, visibleBreakCost: 8 });
  expect(path(input).paidSubroutineBreaks).toEqual([
    { iceInstanceId: "corp_onr_v1_258_neural-blade_3", subroutineId: "printed_subroutines_damage_net" },
  ]);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: "runner.start_run.hq", fallbackUsed: false,
    decisionDebug: { planFirstDecision: {
      rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
      leafExecutorInstanceId: "plan:runner.pressure_central:central%3Ahq",
      route: { actionId: "runner.start_run.hq", stateVersion: 256 },
    } },
  });
});

it("prices the complete corrected path at exactly eight, and rejects seven", () => {
  const input = fixture();
  expect(path(input, 8).canReachAccess).toBe(true);
  expect(path(input, 7).canReachAccess).toBe(false);
});

it("retains the source break when the next actual encounter itself has ETR", () => {
  const input = fixture(), server = hq(input);
  server.ice = [server.ice[1]!, server.ice[3]!];
  expect(path(input).canReachAccess).toBe(true);
  expect(path(input).paidSubroutineBreaks?.some((s) => s.subroutineId === lockId)).toBe(true);
});

it("does not certify lock consumption at unknown ICE or a random auto-pass", () => {
  const input = fixture(), server = hq(input), middle = server.ice[2]!;
  middle.known = false; middle.rezzed = false;
  delete middle.definitionId; delete middle.effectiveRunQuote;
  expect(path(input).paidSubroutineBreaks?.some((s) => s.subroutineId === lockId)).toBe(true);
  const conditional = fixture(), conditionalMiddle = hq(conditional).ice[2]!;
  conditionalMiddle.effectiveRunQuote!.conditionalEncounterEffects = [{
    kind: "random_strength_or_derez_auto_pass", dieFaces: 6, autoPassResult: 6, maxStrengthBonus: 5,
  }];
  expect(path(conditional).paidSubroutineBreaks?.some((s) => s.subroutineId === lockId)).toBe(true);
});

it("keeps a run-duration strength modifier after the scoped lock has expired", () => {
  const input = fixture(), server = hq(input), keeper = server.ice[1]!;
  keeper.effectiveRunQuote!.effectiveStrength = 3;
  keeper.effectiveRunQuote!.encounterStrength = 3;
  const deeper = structuredClone(keeper);
  deeper.instanceId = "public_deeper_keeper";
  deeper.effectiveRunQuote!.iceInstanceId = deeper.instanceId;
  server.ice = [deeper, keeper, server.ice[2]!, server.ice[3]!];
  const withStrength = path(input);
  server.ice[2]!.effectiveRunQuote!.subroutines = [];
  expect(withStrength.canReachAccess).toBe(true);
  expect(withStrength.visibleBreakCost).toBeGreaterThan(path(input).visibleBreakCost!);
  expect(withStrength.paidSubroutineBreaks?.some((s) => s.subroutineId === lockId)).toBe(false);
});

it("SP-460 binds remainder demand to the actual still-open Engine subroutine IDs", () => {
  const input = fixture(windowCheckpoint);
  expect(windowCheckpoint.validation).toMatchObject({
    snapshotHashMatches: true, sideSafeInput: true, legalActionSetMatchesHistoricalAudit: true,
  });
  const effect = encounterRunRemainderEffectAssessment(input);
  expect(effect).toMatchObject({ mustBreak: false, futurePathBlocked: false, futureCostDelta: 0 });
  expect(effect.evidence).toContain("run_remainder_effect_subroutines:1");
  const continueAction = input.legalActions.find((a) => a.type === "continue_run")!;
  expect(encounterRunRemainderEffectAssessment(input, continueAction)).toEqual(effect);
  const decision = chooseAiAction(input);
  expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(true);
  expect(decision).toMatchObject({ fallbackUsed: false, decisionDebug: { planFirstDecision: {
    rootPlanInstanceId: "plan:runner.pressure_central:central%3Ahq",
    leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_257",
  } } });
});

it("does not require remainder bindings when the quoted ICE has no remainder effect", () => {
  const input = fixture(windowCheckpoint);
  input.playerView.run!.encounteredIce!.effectiveRunQuote!.subroutines = [];
  expect(encounterRunRemainderEffectAssessment(input)).toMatchObject({
    hasRunRemainderEffect: false, mustBreak: false, evidence: [],
  });
});

it("retains a still-open damage effect rather than treating it as already paid", () => {
  const input = fixture(windowCheckpoint), action = input.legalActions.find((a) => a.type === "continue_run")!;
  action.payload!.encounterSubroutineIds = "printed_subroutines_damage_net," + lockId;
  action.payload!.unbrokenSubroutineCount = 2;
  expect(encounterRunRemainderEffectAssessment(input).evidence).toContain("run_remainder_effect_subroutines:0,1");
});

it("rejects a missing Engine remaining-subroutine binding with the existing structured failure", () => {
  const input = fixture(windowCheckpoint), action = input.legalActions.find((a) => a.type === "continue_run")!;
  delete action.payload!.encounterSubroutineIds;
  expect(() => encounterRunRemainderEffectAssessment(input)).toThrowError(
    expect.objectContaining({ code: "missing_action_semantics", context: expect.objectContaining({ owner: "rules_contract" }) }),
  );
});
