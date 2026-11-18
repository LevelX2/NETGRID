import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-score-progress-provider.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("SP-194 delegates the current terminal-agenda protection provider to Defense", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const decision = chooseAiAction(input);
  const defense = "penw02zfrkklof54c2nuye5att";
  const actionId =
    "cc.c2q5.r1.c2q5.3";
  const score =
    "p9y017p48zk0rqe2j63iq7peem";
  expect(
    input.legalActions.some((action) => action.actionId === actionId),
  ).toBe(true);
  expect(decision).toMatchObject({
    actionId,
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: score,
        leafExecutorInstanceId: defense,
        selectedStep: {
          planInstanceId: defense,
          stepId: `${defense}:develop_score_protection`,
          parentInstanceId: score,
          needId:
            "score-protection:agenda:c2m5:r1",
        },
        route: {
          actionId,
          stateVersion: 309,
          planInstanceId: defense,
          capabilityId: "develop_score_protection",
        },
        turnPlanning: {
          coverage: {
            status: "pass",
            coveragePercent: 100,
            progressRoots: expect.arrayContaining([
              expect.objectContaining({
                planInstanceId:
                  "p9y017p48zk0rqe2j63iq7peem",
                blocked: true,
                blockerCode: "no_complete_line",
                witnessKind: "support_head",
                providerInstanceId: defense,
                providerActionId: actionId,
              }),
            ]),
          },
        },
      },
    },
  });
});
