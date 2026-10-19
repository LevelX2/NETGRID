import { describe, expect, it } from "vitest";

import emergencyCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-01-emergency-cashout.json";
import holdThreeJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-02-hold-three-with-liquid-five.json";
import scoreWindowCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-03-score-window-cashout.json";
import pressureCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-04-pressure-cashout.json";
import reactionFloorCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-05-reaction-floor-cashout.json";
import lastClickLoadJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-06-last-click-load.json";
import secondInstallJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-07-build-phase-second-install.json";
import twoSourceFirstLoadJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-08-two-source-first-load.json";
import maturePoolCashoutJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-09-mature-pool-cashout.json";
import twoSourceBalancedLoadJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-ecfe3ce-broker-10-two-source-balanced-load.json";
import { bindHistoricalRunEventCadence } from "./checkpoint-cadence-fixture.test-support";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";
import { runAiDecisionCheckpoint } from "./checkpoint-runner";
import { applyAction, getPlayerView } from "@netgrid/engine";

describe("match ECFE3CE Broker portfolio checkpoints", () => {
  it.each([
    [
      "converts Broker credits into efficient liquid value",
      emergencyCashoutJson,
    ],
    [
      "uses Broker liquidity before an unsafe score-window contest",
      scoreWindowCashoutJson,
    ],
    [
      "uses Broker liquidity when central pressure is not executable",
      pressureCashoutJson,
    ],
    [
      "uses a mature Broker bank for efficient liquidity",
      reactionFloorCashoutJson,
    ],
    [
      "allows a second Broker or continued loading during a funded build window",
      secondInstallJson,
    ],
    [
      "allows either unused Broker to start a two-source turn",
      twoSourceFirstLoadJson,
    ],
    [
      "moves a mature bank into a non-comfortable liquid pool",
      maturePoolCashoutJson,
    ],
  ])("%s", (_label, json) => {
    expectCheckpointToPass(fixture(json));
  });

  it("keeps Broker savings while taking already funded free HQ pressure", () => {
    const checkpoint = fixture(holdThreeJson);
    // The native captured state is unchanged. Reserve-only cashout is no
    // longer a correctness requirement when this pressure route is funded.
    checkpoint.expectation = {
      contractKind: "correctness",
      acceptableActions: [{ actionId: "runner.start_run.hq" }],
      forbiddenActions: [
        {
          type: "activated_card_ability",
          sourceDefinitionId: "onr_v1_154_broker",
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["runner.pressure_central"],
        acceptableCapabilities: ["pressure_hq_information"],
      },
    };
    expectSavingsPreservedBySelectedAction(checkpoint);
  });

  it("keeps Broker savings while rebuilding the required hand buffer after declining an optional run", () => {
    const checkpoint = fixture(twoSourceBalancedLoadJson);
    checkpoint.expectation = {
      contractKind: "correctness",
      acceptableActions: [{ actionId: "runner.draw_card" }],
      forbiddenActions: [
        {
          type: "activated_card_ability",
          sourceDefinitionId: "onr_v1_154_broker",
        },
      ],
      planExecution: {
        acceptablePlanKinds: ["runner.defense_and_recovery"],
        acceptableCapabilities: ["build_required_hand_buffer"],
      },
    };
    expectSavingsPreservedBySelectedAction(checkpoint);
  });

  it("uses the last click to store three credits instead of taking one liquid credit", () => {
    const result = expectCheckpointToPass(fixture(lastClickLoadJson));
    const portfolio =
      result.decision?.decisionDebug?.detailSections?.find(
        (section) => section.id === "plan_portfolio",
      )?.items ?? [];

    expect(result.decision?.decisionDebug?.planKind).toBe("runner.credit_bank");
    expect(portfolio).toEqual(
      expect.arrayContaining([
        expect.stringMatching(
          /runner\.credit_bank:.*phase:build.*viability:ready/,
        ),
      ]),
    );
  });
});

function expectSavingsPreservedBySelectedAction(
  checkpoint: AiDecisionCheckpointV1,
) {
  const decision = expectCheckpointToPass(checkpoint);
  const state = structuredClone(checkpoint.engine.testOnlyGameState);
  state.eventLog = checkpoint.engine.eventPrefix.map((event) => ({ ...event }));
  const balances = (game: typeof state) => {
    const rig = getPlayerView(game, "runner").own.rig;
    expect(rig).toBeDefined();
    return rig!
      .filter((card) => card.definitionId === "onr_v1_154_broker")
      .map((card) => card.counters?.bit ?? 0);
  };
  const before = balances(state);
  expect(before.reduce((sum, value) => sum + value, 0)).toBeGreaterThan(0);
  const applied = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.selectedAction!.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${checkpoint.checkpointId}:preserve-bank`,
  });
  expect(applied.ok).toBe(true);
  if (!applied.ok)
    throw new Error(`Native preservation action failed: ${applied.error.code}`);
  expect(balances(applied.state)).toEqual(before);
}

function fixture(value: unknown): AiDecisionCheckpointV1 {
  const checkpoint = bindHistoricalRunEventCadence(
    structuredClone(value) as AiDecisionCheckpointV1,
    ["cp-ecfe3ce-broker-02-hold-three-with-liquid-five"],
  );
  return checkpoint.checkpointId ===
    "cp-ecfe3ce-broker-10-two-source-balanced-load"
    ? afterDeclinedOptionalBonusRun(checkpoint)
    : checkpoint;
}

function afterDeclinedOptionalBonusRun(
  checkpoint: AiDecisionCheckpointV1,
): AiDecisionCheckpointV1 {
  const state = structuredClone(checkpoint.engine.testOnlyGameState);
  state.eventLog = checkpoint.engine.eventPrefix.map((event) => ({ ...event }));
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: "runner.trigger_ability.decline_optional_bonus_run",
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${checkpoint.checkpointId}:decline-optional-bonus-run`,
  });
  if (!result.ok) {
    throw new Error(
      `Optional bonus-run continuation fixture failed: ${result.error.code}: ${result.error.message}`,
    );
  }
  checkpoint.engine.testOnlyGameState = result.state;
  checkpoint.engine.eventPrefix = result.publicEvents.map((event) => ({
    ...event,
  }));
  checkpoint.engine.stateVersion = result.state.stateVersion;
  checkpoint.engine.stateHash = result.stateHash;
  checkpoint.source.stateVersion = result.state.stateVersion;
  if (checkpoint.source.decisionIndex !== undefined) {
    checkpoint.source.decisionIndex += 1;
  }
  return checkpoint;
}

function expectCheckpointToPass(
  checkpoint: AiDecisionCheckpointV1,
): ReturnType<typeof runAiDecisionCheckpoint> {
  const result = runAiDecisionCheckpoint(checkpoint);
  expect(
    result.ok,
    `${result.code ?? "ok"}: ${result.message}\n${JSON.stringify(
      {
        selectedAction: result.selectedAction,
        scoreBreakdown: result.decision?.decisionDebug?.scoreBreakdown,
        planArbitration:
          result.decision?.decisionDebug?.decisionChain?.planArbitration,
      },
      null,
      2,
    )}`,
  ).toBe(true);
  return result;
}
