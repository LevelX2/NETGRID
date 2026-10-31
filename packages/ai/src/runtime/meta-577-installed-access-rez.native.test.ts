import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { applyAction, getLegalActions, hashGameState } from "@netgrid/engine";
import type { AiDecisionInput, GameState } from "@netgrid/shared";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildCorpAmbushPlanSignals } from "../corp/ambush/corp-ambush-plan-signals";
import { restoreAiRuntimeCheckpoint } from "../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
function fixture(name = "current-tagged-access") {
  const f = JSON.parse(
    readFileSync(
      new URL(
        "./test-fixtures/meta-577-drt-" + name + ".json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const cp = f.checkpoint;
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInput;
  const source = input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.definitionId === "onr_v1_356_dedicated-response-team")!;
  const rez = input.legalActions.find(
    (a) => a.type === "rez_card" && a.source === source.instanceId,
  )!;
  return { ...f, cp, input, source, rez };
}
function current(f: ReturnType<typeof fixture>, reservedScoreCredits = 0) {
  return buildCorpAmbushPlanSignals({
    input: f.input,
    previous: undefined,
    reservedScoreCredits,
    candidates: buildActionSemanticCandidates({
      legalActions: f.input.legalActions,
      observerSide: "corp",
      stateVersion: f.input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [f.source.instanceId]: f.source.definitionId!,
      },
    }),
  }).filter(
    (s) => s.phase === "trigger" && s.sourceInstanceId === f.source.instanceId,
  );
}
afterEach(resetResidentPlanPortfolioMemory);
describe("SP-724 installed access effect ownership handoff", () => {
  it("discovers the exact prepared source without a previous Ambush commitment or deck-intent installation", () => {
    const f = fixture();
    expect(
      f.cp.runtime.residentPlanPortfolio.instances.some(
        (p: { moduleId: string }) => p.moduleId === "corp.ambush_and_bluff",
      ),
    ).toBe(false);
    expect(current(f).map((s) => s.actionIds)).toEqual([[f.rez.actionId]]);
    expect(current(f)[0]?.assignedDomainPlanIds).toEqual(["corp.ambush_bluff"]);
  });
  it.each([false, true])(
    "chooses the native rez and retains the forced lethal follow-up after Runner trash=%s",
    (trash) => {
      const f = fixture();
      expect(Object.values(f.cp.validation).every((v) => v === true)).toBe(
        true,
      );
      expect(f.provenance.checkedStates).toBe(66);
      expect(f.provenance.eachPrefixHashMatches).toBe(true);
      expect(hashGameState(f.state)).toBe(f.cp.stateHash);
      f.input.planningStateIdentity = buildPlanningStateIdentity(f.input);
      // The D66 diagnostic already contains its selected same-state lease.
      // D62 is the preceding Corp decision; D63-D65 belong only to Runner.
      expect(f.provenance.preDecisionRuntime.sourceDecision).toBe(62);
      restoreAiRuntimeCheckpoint(
        f.input,
        f.input.ownDeckSnapshot!.deckSnapshotId,
        f.preDecisionRuntime,
      );
      restoreResidentPlanPortfolioMemorySnapshot(
        f.input,
        f.preDecisionRuntime.residentPlanPortfolio,
      );
      const chosen = chooseAiAction(f.input);
      expect(chosen.actionId).toBe(f.rez.actionId);
      expect(chosen.fallbackUsed).toBe(false);
      const plan = chosen.decisionDebug?.planFirstDecision;
      expect(plan?.selectedPlan?.moduleId).toBe("corp.ambush_and_bluff");
      expect(plan?.selectedPlan?.phase).toBe("trigger");
      expect(plan?.route?.actionId).toBe(f.rez.actionId);
      expect(plan?.route?.stateVersion).toBe(f.state.stateVersion);
      expect(plan?.selectedStep?.planInstanceId).toBe(
        plan?.leafExecutorInstanceId,
      );
      let state = f.state as GameState;
      const take = (
        side: "runner" | "corp",
        type: string,
        filter = (_a: { actionId: string }) => true,
      ) => {
        const action = getLegalActions(state, side).find(
          (a) => a.type === type && filter(a),
        )!;
        expect(action).toBeDefined();
        const result = applyAction(state, {
          matchId: state.matchId,
          side,
          actionId: action.actionId,
          clientKnownStateVersion: state.stateVersion,
        });
        if (!result.ok) throw Error(result.error.message);
        state = result.state;
      };
      take("corp", "rez_card", (a) => a.actionId === chosen.actionId);
      expect(state.corp.credits).toBe(3);
      expect(getLegalActions(state, "runner").map((a) => a.type)).toEqual([
        "access_card",
      ]);
      take("runner", "access_card");
      expect(state.runner.grip).toHaveLength(1);
      expect(state.runner.tags).toBe(1);
      take("runner", trash ? "trash_accessed_card" : "decline_trash");
      expect(state.runner.clicks).toBe(0);
      take("runner", "end_turn");
      take("corp", "mandatory_draw");
      take("corp", "play_operation", (a) =>
        a.actionId.includes("scorched-earth"),
      );
      expect(state.winner).toBe("corp");
    },
  );
  it("preserves the exact native different-server decline", () => {
    const f = fixture("different-server-countercase");
    expect(Object.values(f.cp.validation).every((v) => v === true)).toBe(true);
    expect(hashGameState(f.state)).toBe(f.cp.stateHash);
    expect(current(f)).toEqual([]);
  });
  it("does not activate the tagged access damage against an untagged Runner", () => {
    const f = fixture();
    f.input.playerView.opponent.tags = 0;
    expect(current(f)).toEqual([]);
  });
  it("requires the last current root window, the same source and current StateVersion", () => {
    const f = fixture();
    f.input.playerView.run!.position = {
      kind: "ice",
      serverId: "remote_1",
      iceIndex: 0,
    };
    expect(current(f)).toEqual([]);
    f.input.playerView.run!.position = { kind: "server", serverId: "remote_1" };
    f.rez.expiresAtStateVersion -= 1;
    expect(current(f)).toEqual([]);
  });
  it("reserves all existing score funding and rejects an unfunded paid rez", () => {
    const f = fixture();
    expect(current(f, 3).map((s) => s.actionIds)).toEqual([[f.rez.actionId]]);
    expect(current(f, 4)).toEqual([]);
    f.input.playerView.own.credits = 0;
    expect(current(f)).toEqual([]);
  });
  it("does not rediscover an already active source as additional access gain", () => {
    const f = fixture();
    f.source.rezzed = true;
    expect(current(f)).toEqual([]);
  });
});
