import { expect, it } from "vitest";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-404-corp-inventory-ownership.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { readKnownCorpCentralAgendaThreat } from "../../runtime/corp-central-defense-facts-adapter";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("SP-293 keeps a Runner bonus-point card outside Corp inventory and rezzes the terminal HQ defense", () => {
  const { input, runtime } = structuredClone(checkpoint) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  expect(input.playerView.opponent.scoreArea).toContainEqual(
    expect.objectContaining({
      definitionId: "onr_v1_083_desperate-competitor",
      owner: "runner",
    }),
  );
  expect(
    readKnownCorpCentralAgendaThreat({ input, serverId: "hq" }),
  ).toMatchObject({
    threat: "terminal",
    matchpoint: 1,
    maximumAccessibleAgendaPointValue: 2,
  });
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const rez = input.legalActions.find((action) => action.type === "rez_ice")!;
  expect(rez.expiresAtStateVersion).toBe(320);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: rez.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
        leafExecutorInstanceId:
          "plan:corp.defend_servers:server-defense-portfolio",
        route: { actionId: rez.actionId, stateVersion: 320 },
      },
    },
  });
});
