import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  assessRunnerActionReserve,
  runnerActionReserveExclusion,
} from "./runner-action-reserve";

describe("runner action reserve", () => {
  it("excludes a paid installation that empties the liquid credit pool", () => {
    const action = installAction(4);
    const input = runnerInput(4, action);

    expect(assessRunnerActionReserve(input, action)).toMatchObject({
      actionCost: 4,
      immediateCreditGain: 0,
      creditsAfterAction: 0,
      minimumCreditFloor: 2,
      spendingWouldDropBelowReserve: true,
      survivalOverride: false,
    });
    expect(runnerActionReserveExclusion(input, action)).toMatchObject({
      key: "runner_install_breaks_credit_floor",
    });
  });

  it("allows the same installation when the protected reserve remains", () => {
    const action = installAction(4);

    expect(runnerActionReserveExclusion(runnerInput(10, action), action)).toBe(
      undefined,
    );
  });

  it("does not turn the install floor into a blanket ban on paid runs", () => {
    const action = {
      ...installAction(4),
      actionId: "runner.start_run.hq",
      type: "start_run",
      payload: { serverId: "hq" },
    } as LegalAction;

    expect(runnerActionReserveExclusion(runnerInput(4, action), action)).toBe(
      undefined,
    );
  });

  it("raises the install floor after a visible trace-tag deck signal", () => {
    const action = installAction(2);
    const input = runnerInput(4, action);
    input.playerView.own.gripOrHq = Array.from({ length: 4 }, (_, index) => ({
      instanceId: `buffer-${index}`,
      definitionId: `buffer-${index}`,
      title: `Buffer ${index}`,
      type: "event",
      known: true,
    }));
    input.playerView.publicEvents = [
      {
        eventId: "seen-chance-observation",
        type: "access_card",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "fnv1a:seen-chance-observation",
        publicPayload: {
          actionType: "access_card",
          cardDefinitionId: "onr_v1_284_chance-observation",
        },
      },
    ];

    expect(assessRunnerActionReserve(input, action)).toMatchObject({
      creditsAfterAction: 2,
      minimumCreditFloor: 3,
      spendingWouldDropBelowReserve: true,
    });
    expect(runnerActionReserveExclusion(input, action)).toMatchObject({
      key: "runner_install_breaks_credit_floor",
    });
  });
});

function installAction(cost: number): LegalAction {
  return {
    actionId: "runner.install_card.delayed-economy",
    side: "runner",
    type: "install_card",
    label: "Install delayed economy",
    source: "delayed-economy",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }, { credits: cost }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    payload: {},
  } as LegalAction;
}

function runnerInput(credits: number, action: LegalAction): AiDecisionInput {
  return {
    side: "runner",
    legalActions: [action],
    profileId: "test-runner",
    difficulty: "hard",
    eventTail: [],
    seed: "runner-action-reserve",
    decisionId: "runner-action-reserve.1",
    actionNumber: 1,
    playerView: {
      stateVersion: 1,
      own: { credits, clicks: 4, gripOrHq: [], rig: [] },
      opponent: { credits: 5, identity: { counterDisplays: [] } },
      servers: [],
    },
  } as unknown as AiDecisionInput;
}
