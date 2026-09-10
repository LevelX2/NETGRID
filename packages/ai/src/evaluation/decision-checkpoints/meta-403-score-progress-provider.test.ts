import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-score-progress-provider.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("SP-194 replans a feasible agenda's unavailable protection line while retaining global Defense authority", () => {
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
  const defense = "plan:corp.defend_servers:server-defense-portfolio";
  const actionId =
    "corp.install_card.corp_onr_v1_229_code-corpse_1.rd.corp_onr_v1_229_code-corpse_1.1";
  expect(
    input.legalActions.some((action) => action.actionId === actionId),
  ).toBe(true);
  expect(decision).toMatchObject({
    actionId,
    fallbackUsed: false,
    timeoutUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: defense,
        leafExecutorInstanceId: defense,
        selectedStep: {
          planInstanceId: defense,
          stepId: `${defense}:allocate`,
        },
        route: {
          actionId,
          stateVersion: 309,
          planInstanceId: defense,
          capabilityId: "allocate_server_defense",
        },
        turnPlanning: {
          coverage: {
            status: "pass",
            coveragePercent: 100,
            progressRoots: expect.arrayContaining([
              expect.objectContaining({
                planInstanceId:
                  "plan:corp.score_agenda:agenda%3Acorp_onr_v1_211_polymer-breakthrough_1%3Aremote_1",
                blocked: true,
                blockerCode: "selected_line_without_executable_provider",
                witnessKind: "replan",
                reasonCode: "score_campaign_has_no_complete_current_line",
              }),
            ]),
          },
        },
      },
    },
  });
});
