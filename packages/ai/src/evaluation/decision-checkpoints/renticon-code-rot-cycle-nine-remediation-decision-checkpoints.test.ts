import { describe, expect, it } from "vitest";

import affordableHqIceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-renticon-code-rot-c9-01-affordable-hq-ice-seed002-d200.json";
import { residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("Rent-I-Con versus CODE ROT cycle-nine remediation checkpoint", () => {
  it("uses the last click for liquidity instead of over-layering HQ", () => {
    const result = runAiDecisionCheckpoint(
      structuredClone(affordableHqIceJson) as AiDecisionCheckpointV1,
    );

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.actionId).toBe("corp.gain_credit");
    expect(result.decision?.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:corp.economy",
        "plan_step_capability:develop_or_convert_corp_economy",
        "plan_assessment_evidence:corp_last_click_score_install_deferred:remote_1",
      ]),
    );

    const planning =
      result.decision?.decisionDebug?.planFirstDecision?.turnPlanning;
    expect(
      result.decision?.decisionDebug?.planFirstDecision?.selectionAuthority,
    ).toBe("turn_plan_commitment");
    expect(planning).toMatchObject({
      mode: "cutover",
      shadowComparison: {
        liveActionId: "corp.gain_credit",
        shadowActionId: "corp.gain_credit",
        agreement: true,
      },
      commitment: {
        status: "active",
        rematerialization: {
          status: "executable",
          actionId: "corp.gain_credit",
        },
      },
    });

    const portfolio = residentPlanPortfolioSnapshot(result.input);
    expect(portfolio?.executorInstanceId).toMatch(
      /^plan:corp\.economy:score-support%3Aagenda%3Acorp_onr_v1_197_data-fort-reclamation_2%3Aremote_1$/,
    );
    expect(portfolio).toMatchObject({
      turnPlanCommitment: { status: "active" },
      turnPlanExecutionLease: {
        currentBinding: { actionId: "corp.gain_credit" },
      },
    });
    expect(portfolio?.turnPlanExecutionLease?.sourcePlanId).toBe(
      portfolio?.turnPlanCommitment?.sourcePlanId,
    );
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
