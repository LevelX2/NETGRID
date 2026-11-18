import { expect, it } from "vitest";
import captureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-425-funded-score-disposition-d196.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([false, true])(
  "retains the funded score owner and exact first step with a two-click counter conversion=%s",
  (counterConversion) => {
    const capture = structuredClone<unknown>(captureJson) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    if (counterConversion) {
      // Current resource contrast: three basic advances no longer fit, while
      // Systematic Layoffs plus one advance can pay six and retain the two-credit reserve.
      capture.input.playerView.own.credits = 8;
      capture.input.playerView.own.clicks = 2;
    }
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      capture.input,
      capture.input.ownDeckSnapshot!.deckSnapshotId,
      capture.runtime,
    );
    const decision = chooseAiAction(capture.input);
    const advance =
      "c2.c2l1.c2l1";
    const counter = capture.input.legalActions.find(
      (action) => action.source === "c36u",
    )!.actionId;
    expect(decision).toMatchObject({
      actionId: counterConversion ? counter : advance,
      fallbackUsed: false,
    });
    expect(
      capture.input.legalActions.some(
        (action) => action.actionId === decision.actionId,
      ),
    ).toBe(true);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan).toMatchObject({
      rootPlanInstanceId:
        "pdvpqdj4cqkxou94gx0fkps709",
      leafExecutorInstanceId:
        "pdvpqdj4cqkxou94gx0fkps709",
      turnPlanning: {
        coverage: {
          status: "pass",
          coveragePercent: 100,
          missingActionCount: 0,
          conflictingActionCount: 0,
        },
      },
    });
    if (counterConversion)
      expect(plan?.dispositions).toContainEqual(
        expect.objectContaining({
          actionId:
            "c2.c2l1.c2l1",
          ownerModuleId: "corp.score_agenda",
          disposition: "explicitly_nonproductive",
          evidenceCode:
            "corp_same_turn_score_conversion_requires_committed_first_step:place_advancement",
        }),
      );
    else
      expect(
        plan?.dispositions?.find(
          (disposition) => disposition.actionId === advance,
        )?.disposition,
      ).not.toBe("explicitly_nonproductive");
  },
);
