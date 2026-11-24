import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { runnerDelayedInstallReplanningBoundary } from "./runner-delayed-install-replanning-boundary";

describe("runner delayed install replanning boundary", () => {
  it("only admits a matching delayed-install trigger in the current window", () => {
    const action: LegalAction = {
      actionId: "shell-trigger",
      side: "runner",
      type: "trigger_ability",
      source: "shell",
      label: "Shell Traders",
      timingPoint: "runner_action.main",
      expiresAtStateVersion: 17,
      costs: [],
      targetRequirements: [],
      visibility: "public",
      payload: {
        cardId: "shell",
        delayedInstallAbility: "remove_shell_counter",
      },
    };
    const input = {
      side: "runner",
      legalActions: [action],
      playerView: { stateVersion: 17, timingPoint: action.timingPoint },
    } as AiDecisionInput;
    const candidate = {
      actionId: action.actionId,
      actionType: action.type,
      actorSide: "runner",
      stateVersion: 17,
      sourceKind: "card",
      sourceCardInstanceId: action.source,
    } as ActionSemanticCandidate;
    const capacity = { minimum: 1, maximum: 1 };
    expect(
      runnerDelayedInstallReplanningBoundary(input, candidate, capacity),
    ).toBeDefined();
    const wrongTiming = {
      ...input,
      legalActions: [{ ...action, timingPoint: "corp_action.main" as const }],
    };
    expect(
      runnerDelayedInstallReplanningBoundary(wrongTiming, candidate, capacity),
    ).toBeUndefined();
    expect(
      runnerDelayedInstallReplanningBoundary(
        input,
        { ...candidate, actionType: "install_card" },
        capacity,
      ),
    ).toBeUndefined();
    expect(
      runnerDelayedInstallReplanningBoundary(
        input,
        { ...candidate, stateVersion: 16 },
        capacity,
      ),
    ).toBeUndefined();
  });
});
