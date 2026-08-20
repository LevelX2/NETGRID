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
      "uses the available ICE to establish missing R&D coverage at historical D9",
      defensiveDrawD9Json,
    ],
    [
      "uses the available ICE to establish missing R&D coverage at D10",
      defensiveDrawD10Json,
    ],
    [
      "uses the last click for missing R&D coverage at D11",
      defensiveDrawD11Json,
    ],
  ])("%s", (_label, json) => {
    const result = runAiDecisionCheckpoint(fixture(json));
    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("uses the productive R&D install when HQ is already full", () => {
    const checkpoint = fixture(defensiveDrawD9Json);
    checkpoint.engine.testOnlyGameState.corp.maxHandSize = 4;
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [
        {
          type: "install_card",
          sourceDefinitionId: "onr_v1_268_shock-r",
          targetServerId: "rd",
        },
      ],
      forbiddenActions: [{ type: "gain_credit" }],
      planExecution: {
        acceptablePlanKinds: ["corp.defend_servers"],
        acceptableCapabilities: ["allocate_server_defense"],
        requiredAssessmentEvidence: [
          "corp_agenda_capacity_defense_conversion:rd:corp.install_card.corp_onr_v1_268_shock-r_2.rd.corp_onr_v1_268_shock-r_2.0",
        ],
      },
    };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("uses last-click liquidity instead of overflowing HQ", () => {
    const checkpoint = fixture(defensiveDrawD11Json);
    checkpoint.engine.testOnlyGameState.corp.maxHandSize = 4;
    checkpoint.engine.stateHash = hashGameState(
      checkpoint.engine.testOnlyGameState,
    );
    checkpoint.expectation = {
      acceptableActions: [
        {
          type: "gain_credit",
        },
      ],
      forbiddenActions: [{ type: "draw_card" }],
      planExecution: {
        acceptablePlanKinds: ["corp.economy"],
        acceptableCapabilities: ["develop_or_convert_corp_economy"],
        requiredAssessmentEvidence: [
          "corp_last_click_score_install_deferred:new_remote",
        ],
      },
    };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
  });

  it("does not install unfunded expensive ICE and funds the exact R&D defense route", () => {
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
        acceptablePlanKinds: ["corp.economy"],
        acceptableCapabilities: ["develop_or_convert_corp_economy"],
        requiredAssessmentEvidence: [
          "corp_defense_exact_route_funding_required:rd:corp.install_card.corp_onr_v1_268_shock-r_2.rd.corp_onr_v1_268_shock-r_2.0",
        ],
      },
    };

    const result = runAiDecisionCheckpoint(checkpoint);

    expect(result.ok, `${result.code}: ${result.message}`).toBe(true);
    expect(result.decision?.evidence).toContain(
      "plan_priority_delegated_from:plan:corp.defend_servers:server-defense-portfolio",
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
