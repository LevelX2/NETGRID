import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { withCorpSameTurnScoreDefenseReserve } from "../../corp/score/score-reserve-restoration";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-493-r5-g32-d190.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
}
function decide(cp: ReturnType<typeof checkpoint>) {
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    cp.input,
    cp.input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify([cp.input.playerView, cp.input.legalActions]);
  const result = chooseAiAction(cp.input);
  expect(result.fallbackUsed).toBe(false);
  expect(cp.input.legalActions).toContainEqual(
    expect.objectContaining({
      actionId: result.actionId,
      expiresAtStateVersion: cp.input.playerView.stateVersion,
    }),
  );
  expect(JSON.stringify([cp.input.playerView, cp.input.legalActions])).toBe(
    before,
  );
  return result;
}
it("rejects the two-acceleration score route before it consumes a funded terminal central tax reserve", () => {
  const cp = checkpoint();
  expect(cp.input.playerView.own).toMatchObject({
    credits: 12,
    clicks: 2,
    agendaPoints: 0,
  });
  const result = decide(cp);
  expect(result.actionId).not.toContain("overtime-incentives");
  const scores = residentPlanPortfolioSnapshot(cp.input)!
    .instances.filter((p) => p.moduleId === "corp.score_agenda")
    .map(
      (p) =>
        p.moduleState as {
          signal: {
            agendaDefinitionId?: string;
            sameTurnConversionProof?: string;
            feasible: boolean;
            routeAssessment?: string;
          };
        },
    );
  expect(
    scores.some(
      (p) =>
        p.signal.agendaDefinitionId === "onr_v1_201_executive-extraction" &&
        p.signal.sameTurnConversionProof === "engine_quoted_path" &&
        !p.signal.feasible &&
        p.signal.routeAssessment ===
          "corp_same_turn_score_consumes_funded_defense_reserve",
    ),
  ).toBe(true);
});
it("retains the exact acceleration action when the complete score also leaves five credits", () => {
  const cp = checkpoint();
  cp.input.playerView.own.credits = 16;
  const result = decide(cp),
    plan = result.decisionDebug!.planFirstDecision!;
  expect(result.actionId).toContain("overtime-incentives");
  expect(plan.selectedPlan?.moduleId).toBe("corp.score_agenda");
  expect(plan.selectedStep?.planInstanceId).toBe(plan.leafExecutorInstanceId);
});
it("preserves terminal own-score precedence", () => {
  const cp = checkpoint();
  cp.input.playerView.own.agendaPoints = 6;
  const result = decide(cp);
  expect(result.actionId).toContain("overtime-incentives");
  expect(
    result.decisionDebug!.planFirstDecision!.priority?.effectiveClass,
  ).toBe("P1");
});
it("does not reserve breakable tax under ordinary nonterminal central pressure", () => {
  const cp = checkpoint();
  cp.input.playerView.opponent.agendaPoints = 0;
  expect(decide(cp).actionId).toContain("overtime-incentives");
});
it("does not reserve the already paid ICE again", () => {
  const cp = checkpoint();
  cp.input.playerView.servers
    .find((s) => s.id === "rd")!
    .ice.find((c) => c.definitionId === "onr_v1_259_in-the-face")!.rezzed =
    true;
  expect(decide(cp).actionId).toContain("overtime-incentives");
});
it("fails closed when the funded claim loses its complete current score horizon", () => {
  const cp = checkpoint();
  decide(cp);
  const signal = (
    residentPlanPortfolioSnapshot(cp.input)!.instances.find(
      (p) =>
        p.moduleId === "corp.score_agenda" &&
        (p.moduleState as { signal: CorpScoreProjectSignal }).signal
          .agendaDefinitionId === "onr_v1_201_executive-extraction",
    )!.moduleState as { signal: CorpScoreProjectSignal }
  ).signal;
  const withoutHorizon = { ...signal, feasible: true };
  delete withoutHorizon.sameTurnConversionCreditHorizon;
  delete withoutHorizon.sameTurnConversionResourceCost;
  expect(() =>
    withCorpSameTurnScoreDefenseReserve(cp.input, withoutHorizon),
  ).toThrow("resource_claim_conflict");
});
