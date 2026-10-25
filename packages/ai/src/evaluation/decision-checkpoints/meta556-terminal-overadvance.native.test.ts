import { buildAiDecisionInputDto } from "../../input-dto";
import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  bestCorpSameTurnScoreConversionPath,
  corpSameTurnScoreConversionPaths,
} from "../../plans/tactical-plan-corp-score-conversion";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
const recorded = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta556-terminal-overadvance.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};
const agendaId = "corp_onr_v1_214_project-babylon_2";
beforeEach(resetResidentPlanPortfolioMemory);
function native() {
  const cp = structuredClone(recorded);
  expect(Object.keys(cp.validation)).toHaveLength(9);
  expect(Object.values(cp.validation).every(Boolean)).toBe(true);
  return cp;
}
describe("pairing 556 terminal overadvance", () => {
  it("retains the funded two-advance terminal payoff instead of the immediate one-point score", () => {
    const { input } = native();
    expect(input.playerView.own).toMatchObject({
      agendaPoints: 5,
      credits: 2,
      clicks: 2,
    });
    expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
      agendaCardId: agendaId,
      agendaPoints: 2,
      desiredAdvancementCounters: 5,
      creditsRequired: 2,
      clicksRequired: 2,
      steps: [
        { kind: "basic_advance" },
        { kind: "basic_advance" },
        { kind: "score_ready" },
      ],
    });
  });
  it.each([6, 4])(
    "does not spend two more clicks for an unnecessary bonus at %i current points",
    (points) => {
      const { input } = native();
      input.playerView.own.agendaPoints = points;
      expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
        agendaPoints: 1,
        desiredAdvancementCounters: 3,
        creditsRequired: 0,
        clicksRequired: 0,
      });
    },
  );
  it("does not project an unaffordable bonus win", () => {
    const { input } = native();
    input.playerView.own.credits = 1;
    expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
      agendaPoints: 1,
      desiredAdvancementCounters: 3,
    });
  });
  it("can bind the minimum terminal goal across multiple bonus groups", () => {
    const { input } = native();
    Object.assign(input.playerView.own, {
      agendaPoints: 3,
      credits: 6,
      clicks: 6,
    });
    expect(
      corpSameTurnScoreConversionPaths(input).find(
        (p) => p.agendaCardId === agendaId,
      ),
    ).toMatchObject({
      agendaPoints: 4,
      desiredAdvancementCounters: 9,
      creditsRequired: 6,
      clicksRequired: 6,
    });
  });
  it("copies bonus facts only for an identified visible card", () => {
    const { input } = native();
    const own = buildAiDecisionInputDto(input).playerView.servers.find(
      (s) => s.id === "remote_1",
    )!.root[0]!;
    expect(own).toMatchObject({
      overadvanceThreshold: 2,
      overadvanceReward: "agenda_points",
    });
    input.playerView.servers.find((s) => s.id === "remote_1")!.root[0]!.known =
      false;
    const unknown = buildAiDecisionInputDto(input).playerView.servers.find(
      (s) => s.id === "remote_1",
    )!.root[0]!;
    expect(unknown).not.toHaveProperty("overadvanceThreshold");
    expect(unknown).not.toHaveProperty("overadvanceReward");
  });
  it.each([false, true])(
    "selects the first legal advance under the existing resident Score parent (DTO=%s)",
    (throughDto) => {
      const cp = native();
      if (throughDto)
        cp.input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
      const before = JSON.stringify(cp.input);
      restoreAiRuntimeCheckpoint(
        cp.input,
        cp.input.ownDeckSnapshot!.deckSnapshotId,
        cp.runtime,
      );
      const result = chooseAiAction(cp.input),
        action = cp.input.legalActions.find(
          (a) => a.actionId === result.actionId,
        );
      expect(result.fallbackUsed).toBe(false);
      expect(result.timeoutUsed).toBe(false);
      expect(action).toMatchObject({ type: "advance_card", source: agendaId });
      const pf = result.decisionDebug?.planFirstDecision;
      expect(pf?.selectedPlan?.moduleId).toBe("corp.score_agenda");
      expect(pf?.priority?.effectiveClass).toBe("P1");
      expect(pf?.turnPlanning?.coverage).toMatchObject({
        status: "pass",
        coveragePercent: 100,
        missingActionCount: 0,
        conflictingActionCount: 0,
      });
      expect(pf?.rootPlanInstanceId).toContain(
        encodeURIComponent("agenda:" + agendaId + ":remote_1"),
      );
      expect(pf?.rootPlanInstanceId).toBe(pf?.leafExecutorInstanceId);
      expect(pf?.route).toMatchObject({
        actionId: result.actionId,
        stateVersion: cp.input.playerView.stateVersion,
        planInstanceId: pf?.leafExecutorInstanceId,
      });
      expect(JSON.stringify(cp.input)).toBe(before);
    },
  );
});
