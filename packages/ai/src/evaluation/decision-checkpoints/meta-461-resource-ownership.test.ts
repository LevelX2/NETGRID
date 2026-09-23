import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { assessKnownRezzedIcePath } from "../../visible-run-analysis";
function fixture(name: string) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r6-${name}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  return input;
}
afterEach(resetResidentPlanPortfolioMemory);
describe("meta461 round6 causal resource ownership", () => {
  it("requests the source breaker for a downstream no-break lock", () => {
    const input = fixture("g8-d193"),
      v = input.playerView,
      s = v.servers.find((s) => s.id === "remote_1")!;
    expect(
      assessKnownRezzedIcePath(
        s.ice,
        v.own.rig!,
        v.own.credits,
        s.root,
        v.opponent.credits,
      ),
    ).toMatchObject({
      missingCoverage: ["ap", "sentry"],
      unbreakableIceTitle: "Neural Blade",
    });
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId),
    ).toMatchObject({
      type: "install_card",
      source: "runner_onr_classic_028_matador_1",
    });
    expect(decision.fallbackUsed).toBe(false);
  });
  it("funds the agenda without cashing out a bank that Score is still building", () => {
    const input = fixture("g40-d98"),
      decision = chooseAiAction(input),
      a = input.legalActions.find((a) => a.actionId === decision.actionId)!;
    expect(a.type).toBe("gain_credit");
    expect(decision.fallbackUsed).toBe(false);
    expect(
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId,
    ).toContain("corp.score_agenda");
  });
  it("does not rebuild a publicly exposed non-threatening bluff after liquidation", () => {
    const input = fixture("g25-d251"),
      decision = chooseAiAction(input),
      a = input.legalActions.find((a) => a.actionId === decision.actionId)!;
    expect(a).not.toMatchObject({
      type: "advance_card",
      source: "corp_onr_v1_347_vapor-ops_1",
    });
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision?.route).toMatchObject({
      actionId: a.actionId,
      stateVersion: input.playerView.stateVersion,
    });
  });
});

describe("source-lock coverage contrasts", () => {
  it("keeps an independently uncovered inner ICE as the real barrier", () => {
    const v = fixture("g8-d193").playerView,
      s = v.servers.find((s) => s.id === "remote_1")!;
    const rig = v.own.rig!.filter(
      (c) => c.definitionId !== "onr_classic_030_psychic-friend",
    );
    expect(assessKnownRezzedIcePath(s.ice, rig, 24, s.root, 0)).toMatchObject({
      missingCoverage: ["code_gate"],
      unbreakableIceTitle: "Filter",
    });
  });
  it("does not invent a downstream lock without a future ICE", () => {
    const v = fixture("g8-d193").playerView,
      s = v.servers.find((s) => s.id === "remote_1")!;
    const result = assessKnownRezzedIcePath(
      s.ice.slice(1),
      v.own.rig!,
      24,
      s.root,
      0,
    );
    expect(result.knownPathBlockedByEtr).not.toBe(true);
  });
  it("opens the path with the source breaker and keeps lack of credits a funding need", () => {
    const v = fixture("g8-d193").playerView,
      s = v.servers.find((s) => s.id === "remote_1")!,
      matador = v.own.gripOrHq.find(
        (c) => c.definitionId === "onr_classic_028_matador",
      )!,
      rig = [...v.own.rig!, { ...matador, rezzed: true }];
    expect(assessKnownRezzedIcePath(s.ice, rig, 24, s.root, 0)).toMatchObject({
      canReachAccess: true,
      visibleBreakCost: 6,
    });
    const poor = assessKnownRezzedIcePath(s.ice, rig, 1, s.root, 0);
    expect(poor.knownPathBlockedByMissingCoverage).not.toBe(true);
    expect(poor.unpayableReason).toMatch(/unaffordable/);
  });
});
