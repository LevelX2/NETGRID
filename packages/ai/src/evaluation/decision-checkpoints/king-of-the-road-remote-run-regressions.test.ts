import { describe, expect, it } from "vitest";

import remoteBypassReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-734d6341-d34-remote-bypass-replay.json";
import rezzedBypassReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-7097801c-d33-rezzed-bypass-replay.json";
import consumedDamageReplay from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ad373209-d114-future-encounter-replay.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { visibleCard } from "../../semantic-ai-runtime-cutover.test-support";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function replayDecision(fixture: unknown) {
  const { input, runtime, stateVersion } = structuredClone(fixture) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    stateVersion: number;
  };
  const deckSnapshotId = input.ownDeckSnapshot?.deckSnapshotId;
  if (!deckSnapshotId) throw new Error("Expected the captured Runner deck.");
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(input, deckSnapshotId, runtime);

  // The encounter pass positions in the damage replay come from the same
  // hash-bound public events. Exercise the live DTO before evaluating them.
  const projected = buildAiDecisionInputDto(input);
  input.playerView.publicEvents = projected.playerView.publicEvents;
  input.eventTail = projected.eventTail;
  const decision = chooseAiAction(input);
  const selectedAction = input.legalActions.find(
    (action) => action.actionId === decision.actionId,
  );
  expect(input.playerView.stateVersion).toBe(stateVersion);
  expect(selectedAction?.expiresAtStateVersion).toBe(stateVersion);
  expect(decision.fallbackUsed).toBe(false);

  return { input, decision, selectedAction };
}

describe("King of the Road remote run regressions", () => {
  it("uses the bypass route to the new remote root in match 734d6341 D34", () => {
    const { input, decision, selectedAction } =
      replayDecision(remoteBypassReplay);
    const bypass = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.bypassFirstIce === true &&
        action.payload?.serverId === "remote_1",
    );

    expect(bypass).toBeDefined();
    expect(selectedAction).toBe(bypass);
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      route: { actionType: "play_event" },
    });
  });

  it("runs through the rezzed wall in match 7097801c D33", () => {
    const { input, decision, selectedAction } =
      replayDecision(rezzedBypassReplay);
    const fort = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    expect(input.playerView.own).toMatchObject({ credits: 3, clicks: 1 });
    expect(fort?.ice).toEqual([
      expect.objectContaining({ known: true, rezzed: true }),
    ]);
    expect(fort?.root).toEqual([expect.objectContaining({ known: false })]);

    const bypass = input.legalActions.find(
      (action) =>
        action.type === "play_event" &&
        action.payload?.bypassFirstIce === true &&
        action.payload?.serverId === fort?.id,
    );
    expect(bypass).toBeDefined();
    const evaluation = evaluateRunnerRunTargets({ input }).find(
      (target) => target.actionId === bypass?.actionId,
    );
    expect(
      selectedAction?.actionId,
      JSON.stringify({
        path: evaluation?.pathPassability,
        route: evaluation?.routeQuote,
        funding: evaluation?.fundingNeed,
        recommendation: evaluation?.recommendation,
        score: evaluation?.score,
      }),
    ).toBe(bypass?.actionId);
    expect(evaluation).toMatchObject({
      knownAccessState: "unknown",
      routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
      fundingNeed: { reason: "none" },
      creditsAfterRun: 1,
    });
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      leafExecutorInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
      route: { actionId: bypass?.actionId, actionType: "play_event" },
    });
  });

  it("saves the bypass event when a cheaper basic run has the same access", () => {
    const { input } = replayDecision(rezzedBypassReplay);
    input.playerView.own.rig?.push(
      visibleCard("dwarf-in-rig", "runner", "program", {
        definitionId: "onr_v1_021_dwarf",
        subtypes: ["icebreaker"],
        strength: 3,
      }),
    );
    const targets = evaluateRunnerRunTargets({ input });
    const direct = targets.find(
      (target) => target.actionId === "runner.start_run.remote_1",
    );
    const bypass = targets.find(
      (target) =>
        target.targetServerId === "remote_1" &&
        target.runActionProjection.bypassFirstIce,
    );
    expect(direct).toMatchObject({
      routeQuote: { reachability: "guaranteed_access", fundingGap: 0 },
      creditsAfterRun: 2,
    });
    expect(bypass).toMatchObject({ creditsAfterRun: 1 });
    resetResidentPlanPortfolioMemory();
    expect(chooseAiAction(input).actionId).not.toBe(bypass?.actionId);
  });

  it("still requires payment of the visible steal cost after a rezzed-ICE bypass", () => {
    const { input } = replayDecision(rezzedBypassReplay);
    const fort = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!fort?.runnerAgendaStealCostQuote)
      throw new Error("Expected the captured Engine steal quote.");
    fort.runnerAgendaStealCostQuote.minimumCreditCost = 5;

    const bypass = evaluateRunnerRunTargets({ input }).find(
      (target) =>
        target.targetServerId === fort.id &&
        target.runActionProjection.bypassFirstIce,
    );
    expect(bypass).toMatchObject({
      accessPayoffContestable: false,
      routeQuote: { fundingGap: 4 },
      fundingNeed: { reason: "route_funding_gap", routeFundingGap: 4 },
      recommendation: "gain_credits_first",
    });
  });

  it("keeps the normal reserve if rezzed ICE hides a second, unknown encounter", () => {
    const { input } = replayDecision(rezzedBypassReplay);
    const fort = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!fort) throw new Error("Expected the captured remote.");
    fort.ice.unshift({
      instanceId: "hidden_inner_ice",
      known: false,
      rezzed: false,
      owner: "corp",
      controller: "corp",
    });

    const bypass = evaluateRunnerRunTargets({ input }).find(
      (target) =>
        target.targetServerId === fort.id &&
        target.runActionProjection.bypassFirstIce,
    );
    expect(bypass).toMatchObject({
      routeQuote: { reachability: "conditional_access", unknownIceCount: 1 },
      fundingNeed: { reason: "post_run_floor_gap", protectedLiquidReserve: 10 },
      recommendation: "gain_credits_first",
    });
  });

  it("keeps the normal reserve if a second unknown ICE remains after the bypass", () => {
    const { input } = replayDecision(remoteBypassReplay);
    const fort = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    const outerIce = fort?.ice.at(-1);
    if (!fort || outerIce?.known !== false)
      throw new Error("Expected the captured unrevealed ICE.");
    fort.ice.push({ ...outerIce, instanceId: "hidden_companion_ice" });

    const bypass = evaluateRunnerRunTargets({ input }).find(
      (target) =>
        target.targetServerId === fort.id &&
        target.runActionProjection.bypassFirstIce,
    );
    expect(bypass).toMatchObject({
      routeQuote: { reachability: "conditional_access", unknownIceCount: 1 },
      fundingNeed: { reason: "post_run_floor_gap", protectedLiquidReserve: 10 },
      recommendation: "gain_credits_first",
    });
  });

  it("continues after the next encounter consumed the damage in match ad373209 D114", () => {
    const { decision, selectedAction } = replayDecision(consumedDamageReplay);

    expect(selectedAction?.type).toBe("continue_run");
    expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
      rootPlanInstanceId: "plan:runner.contest_remote:remote%3Aremote_2",
      leafExecutorInstanceId: expect.stringContaining(
        "runner.convert_run_window",
      ),
      route: { actionType: "continue_run" },
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.assessmentEvidenceCodes.some(
        (code) =>
          code.startsWith("runner_future_encounter_damage_requires_jack_out|"),
      ),
    ).toBe(false);
  });
});
