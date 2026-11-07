import { expect, it } from "vitest";
import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-432-terminal-steal-d464.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("preserves the nonterminal score owner while funding equal-cost exposure alternatives", () => {
  // The persisted D464 capture contains the selected portfolio. Restore the
  // preceding D463 checkpoint's portfolio instead (last updated at D458),
  // while retaining D464's exact side-safe input and LegalActions.
  const capture = structuredClone(captureJson) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    capture.input,
    capture.input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(capture.input);
  const agenda = "corp_onr_v1_193_corporate-coup_1";
  const root = `plan:corp.score_agenda:agenda%3A${agenda}%3Aremote_1`;
  const funding = `plan:corp.economy:score-support%3Aagenda%3A${agenda}%3Aremote_1`;
  const fundingAction =
    "corp.play_operation.corp_onr_v1_290_efficiency-experts_3.corp_onr_v1_290_efficiency-experts_3.onr_v1_290_efficiency-experts:abilities_on_play_gain_credits";
  expect(decision).toMatchObject({
    actionId: fundingAction,
    fallbackUsed: false,
  });
  expect(
    capture.input.legalActions.some(
      (action) => action.actionId === decision.actionId,
    ),
  ).toBe(true);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: root,
    leafExecutorInstanceId: funding,
    selectedStep: {
      parentInstanceId: root,
      needId: `score-support:agenda:${agenda}:remote_1`,
    },
    turnPlanning: {
      stateVersion: capture.input.playerView.stateVersion,
      coverage: {
        status: "pass",
        missingActionCount: 0,
        conflictingActionCount: 0,
      },
    },
  });
  const lines =
    decision.decisionDebug?.planFirstDecision?.turnPlanning?.consideredLines ??
    [];
  const coup = lines.find((line) =>
    line.evidenceCodes.includes(`root_plan_instance:${root}`),
  );
  const terminal = lines.find((line) =>
    line.evidenceCodes.includes(
      "root_plan_instance:plan:corp.score_agenda:agenda%3Acorp_onr_v1_215_security-net-optimization_1%3Aremote_1",
    ),
  );
  expect(coup?.evidenceCodes).toContain("score_route_exposure:known");
  expect(terminal?.evidenceCodes).toContain("score_route_exposure:known");
  expect(terminal?.evidenceCodes).not.toContain(
    "shadow_single_step_projection",
  );
  expect([coup?.firstActionId, terminal?.firstActionId]).toEqual([
    fundingAction,
    fundingAction,
  ]);
  expect([
    coup?.evaluationValues.risk,
    terminal?.evaluationValues.risk,
  ]).toEqual([0, 0]);
  const portfolio = residentPlanPortfolioSnapshot(capture.input)!;
  expect(
    portfolio.instances.find((plan) => plan.instanceId === root)?.moduleState,
  ).toMatchObject({
    kind: "score",
    signal: {
      conversion: { runnerStealIsMatchpoint: false },
      fundingMilestone: {
        targetCredits: 5,
        observedCredits: 2,
        remainingGap: 3,
      },
    },
  });
  expect(
    portfolio.instances.find(
      (plan) =>
        plan.instanceId ===
        "plan:corp.score_agenda:agenda%3Acorp_onr_v1_215_security-net-optimization_1%3Aremote_1",
    )?.moduleState,
  ).toMatchObject({
    kind: "score",
    signal: {
      conversion: { runnerStealIsMatchpoint: true },
      fundingMilestone: { targetCredits: 5 },
    },
  });
});
