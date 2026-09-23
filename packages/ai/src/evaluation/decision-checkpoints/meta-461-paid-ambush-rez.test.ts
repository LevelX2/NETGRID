import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildCorpAmbushPlanSignals } from "../../corp/ambush/corp-ambush-plan-signals";
import { projectKnownCorpCardAccessEffect } from "../../runtime/known-corp-card-access-effect-projection";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
function fixture(name = "g31-d69") {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r8-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  const source = input.playerView.servers
    .flatMap((s) => s.root)
    .find((c) => c.definitionId === "onr_v1_323_experimental-ai")!;
  const rez = input.legalActions.find(
    (a) => a.type === "rez_card" && a.source === source.instanceId,
  )!;
  return { cp, input, source, rez };
}
function signals(f: ReturnType<typeof fixture>, reservedScoreCredits = 0) {
  return buildCorpAmbushPlanSignals({
    input: f.input,
    previous: f.cp.runtime.residentPlanPortfolio,
    candidates: buildActionSemanticCandidates({
      legalActions: f.input.legalActions,
      observerSide: "corp",
      stateVersion: f.input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [f.source.instanceId]: f.source.definitionId!,
      },
    }),
    reservedScoreCredits,
  });
}
afterEach(resetResidentPlanPortfolioMemory);
describe("meta461 paid access ambush rez", () => {
  it.each(["g21-d107", "g31-d69"])(
    "uses the prepared paid root rez in original %s",
    (name) => {
      const f = fixture(name);
      restoreAiRuntimeCheckpoint(
        f.input,
        f.input.ownDeckSnapshot!.deckSnapshotId,
        f.cp.runtime,
      );
      expect(
        projectKnownCorpCardAccessEffect({
          input: f.input,
          sourceDefinitionId: f.source.definitionId!,
          sourceCard: { ...f.source, rezzed: true },
        }),
      ).toMatchObject({
        status: "complete",
        installedProgramTrash: 1,
        relevantVisibleTargetCount: 2,
      });
      const decision = chooseAiAction(f.input);
      expect(decision.actionId).toBe(f.rez.actionId);
      expect(decision.fallbackUsed).toBe(false);
      expect(
        decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
      ).toContain("corp.ambush_and_bluff");
    },
  );
  it("admits exactly affordable rez and rejects an unfunded quoted cost", () => {
    const f = fixture();
    f.input.playerView.own.credits = 2;
    expect(signals(f)[0]?.actionIds).toEqual([f.rez.actionId]);
    f.input.playerView.own.credits = 1;
    expect(signals(f)[0]?.actionIds).toEqual([]);
  });
  it("does not pay for zero counters or no visible program payoff", () => {
    const f = fixture();
    f.source.advancementCounters = 0;
    expect(signals(f)[0]?.actionIds).toEqual([]);
    f.source.advancementCounters = 1;
    f.input.playerView.opponent.rig = [];
    expect(signals(f)[0]?.actionIds).toEqual([]);
  });
  it("preserves reserved score funding when adding a paid trigger", () => {
    const f = fixture();
    f.input.playerView.own.credits = 3;
    expect(signals(f, 2)[0]?.actionIds).toEqual([]);
    expect(signals(f, 1)[0]?.actionIds).toEqual([f.rez.actionId]);
  });
  it("requires the exact final server access window", () => {
    const f = fixture();
    f.input.playerView.run!.position = {
      kind: "ice",
      serverId: "remote_1",
      iceIndex: 0,
    };
    expect(signals(f)[0]?.actionIds).toEqual([]);
    f.input.playerView.run!.position = { kind: "server", serverId: "remote_1" };
    f.input.playerView.run!.attackedServerId = "rd";
    expect(signals(f)[0]?.actionIds).toEqual([]);
  });
  it("rejects unknown quoted credit cost", () => {
    const f = fixture();
    f.rez.costs = [{ credits: Number.NaN }];
    expect(signals(f)[0]?.actionIds).toEqual([]);
  });
});
