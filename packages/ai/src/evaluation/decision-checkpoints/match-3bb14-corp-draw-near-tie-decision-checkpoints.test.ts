import { describe, expect, it } from "vitest";
import { hashGameState } from "@netgrid/engine";

import defensiveDrawD9Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-03-defensive-draw-d9.json";
import defensiveDrawD10Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-04-defensive-draw-d10.json";
import defensiveDrawD11Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-3bb14-05-defensive-draw-d11.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";

describe("match 3bb14 Corp draw near-tie decision checkpoints", () => {
  it.each([
    [
      "draws through the explicit hand-development plan at historical D9",
      defensiveDrawD9Json,
    ],
    [
      "draws through the explicit hand-development plan at D10",
      defensiveDrawD10Json,
    ],
    [
      "draws through the explicit hand-development plan at D11",
      defensiveDrawD11Json,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("uses exact basic liquidity instead of an optional draw when the current hand is full", () => {
    const checkpoint = fixture(defensiveDrawD9Json);
    checkpoint.engine.testOnlyGameState.corp.maxHandSize = 4;
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [{ type: "gain_credit" }],
      forbiddenActions: [{ type: "draw_card" }],
      planExecution: {
        acceptablePlanKinds: ["corp.economy"],
        acceptableCapabilities: ["develop_or_convert_corp_economy"],
        requiredAssessmentEvidence: [
          "corp_engine_certified_basic_liquidity_development",
        ],
      },
    };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not install uncertified expensive ICE and funds the exact score parent instead", () => {
    const checkpoint = fixture(defensiveDrawD9Json);
    const shock =
      checkpoint.engine.testOnlyGameState.cardInstances[
        "corp_onr_v1_268_shock-r_2"
      ];
    if (!shock) throw new Error("Missing captured Shock.r instance");
    shock.definitionId = "onr_v1_263_reinforced-wall";
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [{ type: "gain_credit" }],
      forbiddenActions: [{ type: "install_card" }],
      planExecution: {
        acceptablePlanIds: [EXACT_SCORE_FUNDING_PLAN_ID],
        acceptablePlanKinds: ["corp.economy"],
        acceptableCapabilities: ["develop_or_convert_corp_economy"],
        requiredAssessmentEvidence: [
          "corp_score_protection_funding_gap:new_remote:9",
        ],
      },
    };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toContain(
      `plan_portfolio_blocked:${EXACT_SCORE_PARENT_PLAN_ID}`,
    );
  });

  it("does not revive the old seeded action near-tie after every defense need is covered", () => {
    const checkpoint = runAiDecisionCheckpoint(fixture(defensiveDrawD9Json));
    expect(checkpoint.ok, `${checkpoint.code}: ${checkpoint.message}`).toBe(
      true,
    );
    const input = structuredClone(checkpoint.input);
    const hq = input.playerView.servers.find((server) => server.id === "hq");
    const rd = input.playerView.servers.find((server) => server.id === "rd");
    const existingCentralIce = hq?.ice[0];
    if (!rd || !existingCentralIce) {
      throw new Error("Missing captured central test context");
    }
    rd.ice = [
      {
        ...structuredClone(existingCentralIce),
        instanceId: "controlled-rd-ice",
      },
    ];
    const basicEconomyActions = input.legalActions.filter(
      (action) => action.type === "gain_credit" || action.type === "draw_card",
    );
    input.legalActions = basicEconomyActions;
    input.playerView.legalActions = basicEconomyActions;
    input.decisionId = "controlled-corp-basic-economy-near-tie";

    const decisions = Array.from({ length: 32 }, (_, index) =>
      chooseAiAction(
        { ...structuredClone(input), seed: `controlled-seed-${index}` },
        { persistTacticalPlanMemory: false },
      ),
    );
    const selected = new Set(decisions.map((decision) => decision.actionId));

    expect(selected.size).toBe(1);
    expect(
      [...selected].every(
        (actionId) =>
          actionId === "corp.gain_credit" || actionId === "corp.draw_card",
      ),
    ).toBe(true);
    expect(
      decisions.every(
        (decision) =>
          (decision.decisionDebug?.planKind === "corp.economy" ||
            decision.decisionDebug?.planKind ===
              "corp.hand_and_agenda_management") &&
          !decision.decisionDebug?.scoreBreakdown?.some(
            (component) => component.key === "corp_seeded_near_tie_variation",
          ),
      ),
    ).toBe(true);
  });
});

function fixture(value: unknown): AiDecisionCheckpointV1 {
  return structuredClone(value) as AiDecisionCheckpointV1;
}

const EXACT_SCORE_PARENT_PLAN_ID =
  "plan:corp.score_agenda:agenda%3Acorp_onr_v1_213_private-cybernet-police_1%3Anew_remote";
const EXACT_SCORE_FUNDING_PLAN_ID =
  "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_v1_213_private-cybernet-police_1%3Anew_remote";
