import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { scoreModule } from "../../corp/score/score-plan-module";
import type { ScoreState } from "../../plans/corp-core-plan-contracts";
import type { PlanInstance } from "../../plans/plan-kernel-types";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const recorded = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta553-terminal-score-objective.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  stateVersion: number;
  validation: Record<string, boolean>;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};
const genetics = "corp_onr_v1_202_genetics-visionary-acquisition_2";
const actionId = "corp.install_card." + genetics + ".remote_1." + genetics;
beforeEach(resetResidentPlanPortfolioMemory);

function native() {
  const cp = structuredClone(recorded);
  expect(Object.values(cp.validation).every((v) => v === true)).toBe(true);
  return cp;
}
function value(instance: PlanInstance) {
  const cp = native();
  const portfolio = cp.runtime.residentPlanPortfolio;
  if (!portfolio) throw new Error("Missing native score portfolio");
  const actionCandidates = buildActionSemanticCandidates({
    legalActions: cp.input.legalActions,
    observerSide: cp.input.side,
    stateVersion: cp.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      cp.input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  return scoreModule().assess(
    instance,
    {
      input: cp.input,
      actionCandidates,
      turnKey: "native-score-objective",
      domain: {
        scoreProjects: [(instance.moduleState as ScoreState).signal],
        remoteProjects: [],
        defenseNeeds: [],
        economyNeeds: [],
      },
    },
    portfolio,
  ).withinClassValue;
}
function project() {
  const instance = native().runtime.residentPlanPortfolio?.instances.find(
    (i) =>
      i.moduleId === "corp.score_agenda" &&
      (i.moduleState as ScoreState).signal.agendaInstanceId === genetics,
  );
  if (!instance) throw new Error("Missing captured terminal score project");
  return instance;
}

describe("pairing 553 terminal score objective", () => {
  it("selects the shorter admitted win on initial planning of the unchanged native input", () => {
    const cp = native();
    expect(cp.input.playerView.own).toMatchObject({
      agendaPoints: 6,
      credits: 5,
      clicks: 3,
      stackOrRdCount: 1,
    });
    const action = cp.input.legalActions.find((a) => a.actionId === actionId);
    expect(action?.payload).toMatchObject({
      agendaInstallScoreHorizonQuoteComplete: true,
      agendaInstallScoreHorizonQuoteAdvancementRequirement: 3,
      agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn: 1,
    });
    const snapshotId = cp.input.ownDeckSnapshot?.deckSnapshotId;
    if (!snapshotId) throw new Error("Missing native deck snapshot");
    // This is an initial-planning probe, deliberately without the persisted
    // portfolio that already contains the old decision at this StateVersion.
    const before = JSON.stringify(cp.input);
    const result = chooseAiAction(cp.input);
    expect(JSON.stringify(cp.input)).toBe(before);
    expect(result.fallbackUsed).toBe(false);
    expect(result.actionId).toBe(actionId);
    const pf = result.decisionDebug?.planFirstDecision;
    expect(pf?.rootPlanInstanceId).toContain(
      encodeURIComponent("agenda:" + genetics + ":remote_1"),
    );
    expect(pf?.leafExecutorInstanceId).toBe(pf?.rootPlanInstanceId);
    expect(pf?.route).toMatchObject({
      actionId,
      stateVersion: cp.stateVersion,
    });
  });
  it("revalidates the persisted old selection without overriding its resident parent", () => {
    const cp = native();
    const snapshotId = cp.input.ownDeckSnapshot?.deckSnapshotId;
    if (!snapshotId) throw new Error("Missing native deck snapshot");
    restoreAiRuntimeCheckpoint(cp.input, snapshotId, cp.runtime);
    const result = chooseAiAction(cp.input);
    expect(result.fallbackUsed).toBe(false);
    expect(result.actionId).toContain("corporate-coup");
    expect(
      cp.input.legalActions.some((a) => a.actionId === result.actionId),
    ).toBe(true);
  });
  it("does not reward points beyond a terminal win at identical route cost and risk", () => {
    const short = project();
    const surplus = structuredClone(short);
    (surplus.moduleState as ScoreState).signal.agendaPoints = 3;
    expect(value(surplus)).toBe(value(short));
  });
  it("does not reward future strategy support after the terminal score", () => {
    const plain = project();
    const future = structuredClone(plain);
    (
      future.moduleState as ScoreState
    ).signal.conversion!.realizedStrategySupportCount = 4;
    expect(value(future)).toBe(value(plain));
  });
  it("keeps point and strategy value before the game is won", () => {
    const plain = project();
    (plain.moduleState as ScoreState).signal.terminalScore = false;
    delete (plain.moduleState as ScoreState).signal.fundingMilestone;
    const points = structuredClone(plain);
    (points.moduleState as ScoreState).signal.agendaPoints = 2;
    const support = structuredClone(plain);
    (
      support.moduleState as ScoreState
    ).signal.conversion!.realizedStrategySupportCount = 1;
    expect(value(points)).toBeGreaterThan(value(plain));
    expect(value(support)).toBeGreaterThan(value(plain));
  });
  it("keeps remaining action and credit costs within terminal projects", () => {
    const short = project();
    const longer = structuredClone(short);
    (
      longer.moduleState as ScoreState
    ).signal.conversion!.remainingAdvancementClicks += 2;
    (
      longer.moduleState as ScoreState
    ).signal.conversion!.remainingScoreCredits += 2;
    expect(value(longer)).toBeLessThan(value(short));
  });
  it("keeps exposure and terminal-steal penalties", () => {
    const ordinary = project();
    const lethalSteal = structuredClone(ordinary);
    (
      lethalSteal.moduleState as ScoreState
    ).signal.conversion!.runnerStealIsMatchpoint = true;
    expect(value(lethalSteal)).toBeLessThan(value(ordinary));
  });
});
