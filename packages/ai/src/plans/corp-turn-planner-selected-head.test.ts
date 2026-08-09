import { hashGameState } from "@netgrid/engine";
import { describe, expect, it } from "vitest";

import fundedRdLayerJson from "../../../../data/scenarios/ai-decision-checkpoints/cp-e6aca-08-avoid-unfunded-rd-overstack-d110.json";
import type { AiDecisionCheckpointV1 } from "../evaluation/decision-checkpoints/checkpoint-types";
import { runAiDecisionCheckpoint } from "../evaluation/decision-checkpoints/checkpoint-runner";
import { residentPlanPortfolioSnapshot } from "./resident-plan-portfolio-memory";

describe("Corp TurnPlanner selected-head binding", () => {
  it("keeps the defense module's selected current head bound through commitment and lease", () => {
    const checkpoint = structuredClone(
      fundedRdLayerJson,
    ) as AiDecisionCheckpointV1;
    checkpoint.source.kind = "synthetic_companion";
    checkpoint.engine.testOnlyGameState.corp.credits = 20;
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [
        {
          actionId:
            "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["allocate_server_defense"],
      },
    };
    const result = runAiDecisionCheckpoint(checkpoint);
    const planning =
      result.decision?.decisionDebug?.planFirstDecision?.turnPlanning;
    const portfolio = residentPlanPortfolioSnapshot(result.input);

    expect(result.ok, result.message).toBe(true);
    expect(result.decision?.actionId).toBe(
      "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
    );
    expect(planning).toMatchObject({
      mode: "cutover",
      shadowComparison: {
        liveActionId:
          "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        shadowActionId:
          "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        shadowRootPlanInstanceId:
          "plan:corp.defend_servers:server-defense-portfolio",
        agreement: true,
      },
      commitment: {
        status: "active",
        rematerialization: {
          status: "executable",
          actionId:
            "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        },
      },
    });
    expect(portfolio).toMatchObject({
      executorInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      turnPlanCommitment: {
        status: "active",
      },
      turnPlanExecutionLease: {
        currentBinding: {
          actionId:
            "corp.install_card.corp_onr_proteus_013_caryatid_1.rd.corp_onr_proteus_013_caryatid_1.4",
        },
      },
    });
    expect(portfolio?.turnPlanExecutionLease?.commitmentId).toBe(
      portfolio?.turnPlanCommitment?.commitmentId,
    );
    const cursor = portfolio?.turnPlanCommitment?.cursor;
    const committedNode = cursor
      ? portfolio?.turnPlanCommitment?.phases[cursor.phaseIndex]?.nodes[
          cursor.nodeIndex
        ]
      : undefined;
    expect(portfolio?.turnPlanExecutionLease?.routeKey).toBe(
      committedNode?.invocation.routeKey,
    );
  });
});
