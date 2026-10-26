import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { applyAction, hashGameState } from "@netgrid/engine";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { reconstructBeliefState } from "../../belief-state";
import { runnerTargetHasTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
import { evaluateRunnerHandDevelopment } from "../../runner/hand-development/hand-development-evaluation";
import { persistentFunctionalProfileForCard } from "../../runner/hand-development/runner-persistent-install-evaluation";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import { restoreAiRuntimeCheckpoint } from "./runtime-checkpoint";
function original(kind: "known-root-terminal" | "tag-prevention-profile") {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta559-" +
          kind +
          "-original.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  expect(hashGameState(f.state)).toBe(f.native.stateHash);
  expect(Object.values(f.native.validation).every((v) => v === true)).toBe(
    true,
  );
  return f;
}
beforeEach(resetResidentPlanPortfolioMemory);
describe("pairing559: valid known root type reaches terminal threat facts (SP-669)", () => {
  it("does not call the exact remembered TRAP a terminal agenda threat", () => {
    const f = original("known-root-terminal");
    expect(
      reconstructBeliefState(f.native.input).runnerOpponentModel!
        .knownPositionMemory,
    ).toContainEqual(
      expect.objectContaining({
        zone: "remote_1",
        positionKey: "root:0",
        definitionId: "onr_v1_345_trap",
        sourceEventId: "evt_235",
      }),
    );
    expect(
      runnerTargetHasTerminalContestThreat(f.native.input, "remote_1"),
    ).toBe(false);
  });
  it.each([false, true])(
    "does not promote known non-agenda cleanup to P2 through DTO=%s",
    (dto) => {
      const f = original("known-root-terminal");
      const input = dto
        ? { ...f.native.input, ...buildAiDecisionInputDto(f.native.input) }
        : f.native.input;
      input.planningStateIdentity = buildPlanningStateIdentity(input);
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        f.native.runtime,
      );
      const before = JSON.stringify(input),
        r = chooseAiAction(input);
      expect(JSON.stringify(input)).toBe(before);
      expect(r.fallbackUsed).toBe(false);
      expect(r.timeoutUsed).toBe(false);
      expect(
        input.legalActions.some((a: any) => a.actionId === r.actionId),
      ).toBe(true);
      expect(
        r.decisionDebug!.planFirstDecision!.priority!.effectiveClass,
      ).not.toBe("P2");
      expect(
        r.decisionDebug!.planFirstDecision!.selectedPlan?.evidenceCodes,
      ).not.toContain(
        "runner_terminal_remote_contest_mandatory:remote_1:runner.start_run.remote_1",
      );
      expect(runnerTargetHasTerminalContestThreat(input, "remote_1")).toBe(
        false,
      );
    },
  );
  it("retains a genuine unknown additional root beside the remembered trap", () => {
    const input = original("known-root-terminal").native.input;
    input.playerView.servers
      .find((s: any) => s.id === "remote_1")
      .root.push({
        instanceId: "new-unknown-root",
        known: false,
        rezzed: false,
        advancementCounters: 0,
      });
    expect(runnerTargetHasTerminalContestThreat(input, "remote_1")).toBe(true);
  });
  it("retains a canonically remembered agenda as a terminal target", () => {
    const input = original("known-root-terminal").native.input;
    for (const events of [input.eventTail, input.playerView.publicEvents ?? []])
      for (const e of events)
        if (e.eventId === "evt_235") {
          e.publicPayload.cardDefinitionId = "onr_proteus_004_fetal-ai";
          e.publicPayload.title = "Fetal AI";
          e.publicPayload.targets.cardDefinitionId = "onr_proteus_004_fetal-ai";
        }
    expect(runnerTargetHasTerminalContestThreat(input, "remote_1")).toBe(true);
  });
  it.each([4, 5, 6])(
    "does not turn an advanced remembered trap into an agenda at Corp %s",
    (points) => {
      const input = original("known-root-terminal").native.input;
      input.playerView.opponent.agendaPoints = points;
      input.playerView.servers.find(
        (s: any) => s.id === "remote_1",
      ).root[0].advancementCounters = 2;
      expect(runnerTargetHasTerminalContestThreat(input, "remote_1")).toBe(
        false,
      );
    },
  );
});
describe("pairing559: tag prevention survives the persistent functional profile (SP-670)", () => {
  it("preserves the actual generated defense function at the native consumer", () => {
    const f = original("tag-prevention-profile"),
      input = f.native.input;
    const card = input.playerView.own.gripOrHq.find(
      (c: any) => c.definitionId === "onr_v1_135_nasuko-cycle",
    );
    expect(
      persistentFunctionalProfileForCard(card, card.rulesText)
        .functionalCoverage,
    ).toContain("tag_prevention");
    const evaluation = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      deckCapabilities: input.ownDeckCapabilities,
    }).find((e) => e.definitionId === card.definitionId)!;
    expect(evaluation.developmentRole).toBe("defense_support");
    expect(evaluation.currentNeed).toBe("setup");
    expect(
      evaluation.persistentInstallEvaluation!.newFunctionalCoverage,
    ).toContain("tag_prevention");
    expect(evaluation.deferReason).toBe("none");
  });
  it("does not invent additional tag coverage beside an installed tag protector", () => {
    // Semantic coverage countercase; this modified board is not an original replay.
    const input = original("tag-prevention-profile").native.input;
    const fallGuy = input.playerView.own.heapOrArchives.find(
      (c: any) => c.definitionId === "onr_v1_161_fall-guy",
    );
    expect(fallGuy).toBeDefined();
    input.playerView.own.heapOrArchives =
      input.playerView.own.heapOrArchives.filter(
        (c: any) => c.instanceId !== fallGuy.instanceId,
      );
    input.playerView.own.rig.push(fallGuy);
    const evaluation = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: input.ownRunnerStrategicIntent,
      deckCapabilities: input.ownDeckCapabilities,
    }).find((e) => e.definitionId === "onr_v1_135_nasuko-cycle")!;
    expect(
      evaluation.persistentInstallEvaluation!.newFunctionalCoverage,
    ).not.toContain("tag_prevention");
    expect(evaluation.deferReason).not.toBe("none");
  });
  it.each([false, true])(
    "selects the real funded defensive installation through DTO=%s",
    (dto) => {
      const f = original("tag-prevention-profile");
      const input = dto
        ? { ...f.native.input, ...buildAiDecisionInputDto(f.native.input) }
        : f.native.input;
      input.planningStateIdentity = buildPlanningStateIdentity(input);
      restoreAiRuntimeCheckpoint(
        input,
        input.ownDeckSnapshot.deckSnapshotId,
        f.native.runtime,
      );
      const before = JSON.stringify(input),
        r = chooseAiAction(input),
        a = input.legalActions.find((a: any) => a.actionId === r.actionId)!;
      expect(JSON.stringify(input)).toBe(before);
      expect(r.fallbackUsed).toBe(false);
      expect(r.timeoutUsed).toBe(false);
      expect(a.type).toBe("install_card");
      expect(a.source).toBe("runner_onr_v1_135_nasuko-cycle_1");
      expect(r.decisionDebug!.planFirstDecision!.selectedPlan!.moduleId).toBe(
        "runner.defense_and_recovery",
      );
      expect(r.decisionDebug!.planFirstDecision!.route).toMatchObject({
        actionId: a.actionId,
        stateVersion: f.state.stateVersion,
      });
      const applied = applyAction(f.state, {
        matchId: f.state.matchId,
        side: "runner",
        actionId: a.actionId,
        clientKnownStateVersion: f.state.stateVersion,
      });
      if (!applied.ok) throw Error(JSON.stringify(applied.error));
      expect(applied.state.runner.credits).toBe(10);
      expect(applied.state.runner.rig.hardware).toContain(
        "runner_onr_v1_135_nasuko-cycle_1",
      );
    },
  );
});
