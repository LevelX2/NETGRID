import { afterEach, expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-486-resolved-break-lock.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildDeckCapabilityProfileFromInput } from "../../deck-capabilities";
import { currentRunPathContext } from "../../run-analysis/current-run-path-context";
import { currentRunRemainingIce } from "../../runtime/current-encounter";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function fixture() {
  const cp = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  input.ownDeckCapabilities = buildDeckCapabilityProfileFromInput(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
function path(input: AiDecisionInputWithDeckCapabilities) {
  return assessKnownRezzedIcePath(
    currentRunRemainingIce(input),
    input.playerView.own.rig!,
    50,
    [],
    0,
    currentRunPathContext(input),
  );
}

it("SP-458 preserves the installed breaker by the existing run-window jack-out route", () => {
  const input = fixture();
  expect(checkpoint.validation).toMatchObject({
    snapshotHashMatches: true,
    sideSafeInput: true,
    legalActionSetMatchesHistoricalAudit: true,
  });
  expect(input.playerView.run?.nextEncounterNoBreakSubroutines).toBe(true);
  expect(path(input)).toMatchObject({
    blocked: true,
    canReachAccess: false,
    unpayableReason: "ice_unbreakable",
  });
  const decision = chooseAiAction(input);
  expect(input.legalActions.find((a) => a.type === "jack_out")?.actionId).toBe(
    decision.actionId,
  );
  expect(decision).toMatchObject({
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        leafExecutorInstanceId: "plan:runner.convert_run_window:run%3Arun_265",
        route: { actionId: "runner.jack_out" },
      },
    },
  });
});

it("keeps the actual historical continuation without the resolved restriction", () => {
  const input = fixture();
  delete input.playerView.run!.nextEncounterNoBreakSubroutines;
  expect(path(input)).toMatchObject({ canReachAccess: true });
  expect(chooseAiAction(input)).toMatchObject({
    actionId: "runner.continue_run",
    fallbackUsed: false,
  });
});

it("does not transfer a consumed restriction from harmless ICE to the later ETR", () => {
  const input = fixture(),
    server = input.playerView.servers.find((s) => s.id === "hq")!;
  const etr = structuredClone(server.ice[2]!);
  etr.effectiveRunQuote!.subroutines =
    etr.effectiveRunQuote!.subroutines.filter((s) => s.type === "end_the_run");
  const harmless = structuredClone(etr);
  harmless.instanceId = "public_harmless_ice";
  harmless.effectiveRunQuote!.iceInstanceId = harmless.instanceId;
  harmless.effectiveRunQuote!.subroutines = [];
  server.ice = [etr, harmless];
  input.playerView.run!.position = { kind: "ice", serverId: "hq", iceIndex: 1 };
  expect(path(input)).toMatchObject({ canReachAccess: true });
  harmless.known = false;
  harmless.rezzed = false;
  delete harmless.definitionId;
  delete harmless.effectiveRunQuote;
  expect(currentRunPathContext(input).prohibitBreakingIceInstanceIds).toEqual([
    harmless.instanceId,
    etr.instanceId,
  ]);
  expect(path(input)).toMatchObject({
    canReachAccess: false,
    unpayableReason: "ice_unbreakable",
  });
});

it("keeps a resolved queued lock through a possible random auto-pass", () => {
  const input = fixture(),
    server = input.playerView.servers.find((s) => s.id === "hq")!;
  const etr = structuredClone(server.ice[2]!);
  etr.effectiveRunQuote!.subroutines =
    etr.effectiveRunQuote!.subroutines.filter((s) => s.type === "end_the_run");
  const uncertain = structuredClone(etr);
  uncertain.instanceId = "public_random_auto_pass_ice";
  uncertain.effectiveRunQuote!.iceInstanceId = uncertain.instanceId;
  uncertain.effectiveRunQuote!.subroutines = [];
  uncertain.effectiveRunQuote!.conditionalEncounterEffects = [{
    kind: "random_strength_or_derez_auto_pass",
    dieFaces: 6,
    autoPassResult: 6,
    maxStrengthBonus: 5,
  }];
  server.ice = [etr, uncertain];
  input.playerView.run!.position = { kind: "ice", serverId: "hq", iceIndex: 1 };
  expect(currentRunPathContext(input).prohibitBreakingIceInstanceIds).toEqual([
    uncertain.instanceId,
    etr.instanceId,
  ]);
  expect(path(input).canReachAccess).toBe(false);
});

it("binds a queued restriction after an Engine auto-pass, and expires only the current restriction", () => {
  const input = fixture(),
    run = input.playerView.run!,
    server = input.playerView.servers.find((s) => s.id === "hq")!;
  run.position = { kind: "ice", serverId: "hq", iceIndex: 3 };
  run.pendingAutoPassIceId = server.ice[3]!.instanceId;
  expect(currentRunPathContext(input).prohibitBreakingIceInstanceIds).toEqual([
    server.ice[2]!.instanceId,
  ]);
  expect(path(input).canReachAccess).toBe(false);
  delete run.pendingAutoPassIceId;
  run.phase = "encounter_ice";
  run.noBreakSubroutinesActive = true;
  expect(currentRunPathContext(input).prohibitBreakingIceInstanceIds).toEqual([
    server.ice[3]!.instanceId,
    server.ice[2]!.instanceId,
  ]);
  delete run.nextEncounterNoBreakSubroutines;
  expect(path(input).canReachAccess).toBe(true);
});

it.each([0, 2])(
  "rejects a public restriction with a missing ICE binding at index %i",
  (iceIndex) => {
    const input = fixture();
    input.playerView.run!.position = { kind: "ice", serverId: "hq", iceIndex };
    input.playerView.servers.find((s) => s.id === "hq")!.ice = [];
    expect(() => currentRunPathContext(input)).toThrowError(
      expect.objectContaining({
        code: "invalid_player_view_card_projection",
        context: expect.objectContaining({ owner: "rules_contract" }),
      }),
    );
  },
);
