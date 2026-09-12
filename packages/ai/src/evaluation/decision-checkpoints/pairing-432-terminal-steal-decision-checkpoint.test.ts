import { expect, it } from "vitest";
import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-432-terminal-steal-d464.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("preserves the exact score owner while preferring equal-cost nonterminal steal exposure", () => {
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
  expect(decision).toMatchObject({
    actionId: `corp.install_card.${agenda}.remote_1.${agenda}`,
    fallbackUsed: false,
  });
  expect(
    capture.input.legalActions.some(
      (action) => action.actionId === decision.actionId,
    ),
  ).toBe(true);
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId: root,
    leafExecutorInstanceId: root,
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
  const coup = lines.find((line) => line.firstActionId === decision.actionId);
  const terminal = lines.find((line) =>
    line.firstActionId?.includes("security-net-optimization"),
  );
  expect(coup?.evidenceCodes).toContain("score_route_exposure:known");
  expect(terminal?.evidenceCodes).toContain("score_route_exposure:known");
  expect(terminal?.evidenceCodes).not.toContain(
    "shadow_single_step_projection",
  );
  expect(terminal?.evaluationValues.risk).toBeGreaterThan(
    coup!.evaluationValues.risk!,
  );
});
