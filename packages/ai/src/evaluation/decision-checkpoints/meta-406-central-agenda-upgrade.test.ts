import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-406-central-agenda-upgrade-d101.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

it("SP-297 does not spend seven credits on a central agenda discount to clear HQ overflow", () => {
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
  const actionId =
    "corp.install_card.corp_onr_v1_374_washington-d-c-city-grid_1.hq.corp_onr_v1_374_washington-d-c-city-grid_1";
  expect(input.legalActions.some((a) => a.actionId === actionId)).toBe(true);
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe("corp.gain_credit");
  expect(decision.decisionDebug?.planFirstDecision).toMatchObject({
    rootPlanInstanceId:
      "plan:corp.economy:economy-residual-capacity%3Acorp%3A16",
    leafExecutorInstanceId:
      "plan:corp.economy:economy-residual-capacity%3Acorp%3A16",
    route: {
      actionId: decision.actionId,
      stateVersion: input.playerView.stateVersion,
    },
    dispositions: expect.arrayContaining([
      expect.objectContaining({
        actionId,
        disposition: "explicitly_nonproductive",
        ownerModuleId: "corp.defend_servers",
      }),
    ]),
  });
});
