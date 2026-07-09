import type { LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate";
import { projectRunAccessDecisionModel } from "./run-access-decision-model";

describe("run/access decision model", () => {
  it("separates visible run modifiers, access risks and payoffs", () => {
    const model = projectRunAccessDecisionModel(
      candidate({
        cardContextSignals: [
          "run.corp_redirect",
          "run.additional_subroutine",
          "access.corp_net_damage_ambush",
          "access.additional_access",
        ],
        serverId: "remote_1",
      }),
      action("start_run", { serverId: "remote_1", bypassFirstIce: true }),
    );

    expect(model).toMatchObject({
      coverageStatus: "covered",
      serverId: "remote_1",
      modifiers: expect.arrayContaining([
        "bypass_ice",
        "additional_subroutines",
        "redirect_run",
      ]),
      accessRisks: expect.arrayContaining(["ambush", "damage"]),
      payoffs: expect.arrayContaining(["additional_access"]),
      unknownRemoteIdentityPreserved: true,
      hiddenInfoPolicy: "side_safe_visible_only",
    });
  });

  it("blocks hidden target context without inferring a remote identity", () => {
    const input = candidate({
      cardContextSignals: ["access.corp_tag_ambush"],
    });
    input.targetContext = {
      selectedTargets: [],
      targetKind: "unknown",
      targetZones: [],
      targetSide: "unknown",
      hiddenInfoPolicy: "hidden_info_blocked",
      availableTargetsStatus: "target_context_unavailable",
      targetProfileMatches: [],
      targetConstraintResults: [],
    };

    const model = projectRunAccessDecisionModel(input, action("access_card"));
    expect(model).toMatchObject({
      coverageStatus: "blocked",
      whyNot: ["hidden_info_blocked"],
      unknownRemoteIdentityPreserved: true,
    });
    expect(model).not.toHaveProperty("serverId");
  });

  it("does not match bounded semantic near-misses", () => {
    const model = projectRunAccessDecisionModel(
      candidate({
        cardContextSignals: ["run.redirector", "access.ambusher_noise"],
      }),
      action("gain_credit"),
    );

    expect(model).toBeUndefined();
  });
});

function action(
  type: LegalAction["type"],
  payload?: LegalAction["payload"],
): LegalAction {
  return {
    actionId: `run-access-${type}`,
    side: "runner",
    type,
    label: type,
    source: "game_rule",
    timingPoint:
      type === "access_card" ? "access.resolve_card" : "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
    ...(payload ? { payload } : {}),
  };
}

function candidate(options: {
  cardContextSignals?: string[];
  serverId?: string;
}): ActionSemanticCandidate {
  return {
    actionId: "run-access-candidate",
    actionType: "start_run",
    actorSide: "runner",
    observerSide: "runner",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId: "run-access-candidate",
      actionType: "start_run",
      originalPayloadKeys: [],
    },
    sourceKind: "card",
    abilityBindingMethod: "explicit_ability_id",
    semanticActionType: "run.start",
    cardContextSignals: options.cardContextSignals ?? [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { costKnownStatus: "known", additionalCosts: [] },
    timingProfile: {},
    ...(options.serverId
      ? {
          runProjectionSummary: {
            serverId: options.serverId,
            serverKind: "remote",
            source: "run_action_projection",
            evidence: ["test_server"],
          },
        }
      : {}),
    boardContext: { source: "not_projected", sideSafe: true, notes: [] },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}
