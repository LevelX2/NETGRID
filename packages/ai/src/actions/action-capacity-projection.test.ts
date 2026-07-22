import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";

describe("action capacity projection", () => {
  it("projects an immediate unrestricted gain as gross, follow-up and net capacity", () => {
    const projection = project(
      legalAction("overtime", "play_operation", {
        costs: [{ clicks: 1 }],
        payload: {
          gainActionsAmount: 2,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "unrestricted",
          actionCapacityReliability: "guaranteed",
        },
      }),
    );

    expect(projection).toMatchObject({
      kind: "immediate_unrestricted_gain",
      timing: "immediate",
      restriction: "unrestricted",
      listedActionCost: 1,
      preExistingActionCost: 1,
      grossActionsGained: 2,
      generatedActionsConsumedByCurrentAction: 0,
      followupActionCapacity: 2,
      netCurrentTurnActionDelta: 1,
      selfFinancing: false,
      reliability: "guaranteed",
      source: "legal_action_payload",
    });
  });

  it("retains source-counter costs for a scored action bank", () => {
    const projection = project(
      legalAction("corporate-boon", "activated_card_ability", {
        costs: [],
        payload: {
          gainActionsAmount: 1,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "unrestricted",
          actionCapacityReliability: "guaranteed",
          cardImplementationSourceCounterType: "boon",
          cardImplementationSourceCounterCost: 1,
        },
      }),
    );

    expect(projection).toMatchObject({
      grossActionsGained: 1,
      followupActionCapacity: 1,
      netCurrentTurnActionDelta: 1,
      sourceCounterType: "boon",
      sourceCounterCost: 1,
    });
  });

  it("does not count Wilson's self-financed run as a free follow-up click", () => {
    const projection = project(
      legalAction("wilson-run", "start_run", {
        side: "runner",
        timingPoint: "runner_action.main",
        costs: [{ clicks: 1 }],
        payload: {
          gainActionsAmount: 1,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "run_only",
          actionCapacityAllowedActionType: "start_run",
          actionCapacityReliability: "guaranteed",
          actionCapacitySelfFinancing: true,
        },
      }),
    );

    expect(projection).toMatchObject({
      kind: "immediate_restricted_gain",
      restriction: "run_only",
      allowedActionTypes: ["start_run"],
      listedActionCost: 1,
      preExistingActionCost: 0,
      grossActionsGained: 1,
      generatedActionsConsumedByCurrentAction: 1,
      followupActionCapacity: 0,
      netCurrentTurnActionDelta: 0,
      selfFinancing: true,
    });
  });

  it.each([
    ["edgerunner", 3, "install_only", 2],
    ["valu-pak", 5, "program_install_only", 4],
  ] as const)(
    "projects %s as restricted follow-up capacity",
    (actionId, gain, restriction, netDelta) => {
      const projection = project(
        legalAction(
          actionId,
          actionId === "valu-pak" ? "play_event" : "play_operation",
          {
            costs: [{ clicks: 1 }],
            payload: {
              gainActionsAmount: gain,
              actionCapacityTiming: "immediate",
              actionCapacityRestriction: restriction,
              actionCapacityAllowedActionType: "install_card",
              actionCapacityReliability: "guaranteed",
            },
          },
        ),
      );

      expect(projection).toMatchObject({
        kind: "immediate_restricted_gain",
        restriction,
        allowedActionTypes: ["install_card"],
        grossActionsGained: gain,
        followupActionCapacity: gain,
        netCurrentTurnActionDelta: netDelta,
      });
    },
  );

  it("keeps future recurring actions out of current-turn net capacity", () => {
    const projection = project(
      legalAction("future-actions", "play_operation", {
        costs: [{ clicks: 1, credits: 8 }],
        payload: {
          actionCapacityTiming: "future_turn_start",
          actionCapacityRestriction: "unrestricted",
          actionCapacityReliability: "guaranteed",
          actionCapacityGainAmountPerTurn: 1,
          actionCapacityDurationTurns: 4,
        },
      }),
    );

    expect(projection).toMatchObject({
      kind: "future_recurring_gain",
      timing: "future_turn_start",
      listedActionCost: 1,
      grossActionsGained: 0,
      netCurrentTurnActionDelta: 0,
      gainAmountPerTurn: 1,
      durationTurns: 4,
      expiresAt: "duration_end",
    });
  });

  it("projects a forgo action as explicit action debt", () => {
    const projection = project(
      legalAction("forgo", "forgo_action", {
        costs: [],
        payload: { forgoActionsPending: 3 },
      }),
    );

    expect(projection).toMatchObject({
      kind: "action_debt",
      timing: "debt",
      actionDebt: 3,
      source: "action_debt_contract",
      reliability: "guaranteed",
    });
  });
});

function project(action: LegalAction) {
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: action.side,
  });
  if (!candidate?.actionCapacityProjection) {
    throw new Error("Expected action-capacity projection");
  }
  return candidate.actionCapacityProjection;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  overrides: Partial<LegalAction> = {},
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: actionId,
    source: "test",
    timingPoint: "corp_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    ...overrides,
  };
}
