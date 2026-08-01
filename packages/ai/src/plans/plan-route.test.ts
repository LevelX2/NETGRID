import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { describe, expect, it } from "vitest";
import {
  assertCurrentPlanRoute,
  bindBestCurrentPlanRoute,
  matchPlanStepCandidate,
  type BindPlanRouteParams,
  type PlanRouteStep,
} from "./plan-route";

describe("plan route binding", () => {
  it("binds exactly one current compatible route head", () => {
    const route = bindBestCurrentPlanRoute({
      ...baseParams(),
      candidates: [
        routeCandidate(
          candidate("credit", "gain_credit", "economy.gain_credit"),
          4,
        ),
        routeCandidate(candidate("draw", "draw_card", "draw.card"), 20),
      ],
    });

    expect(route.head).toMatchObject({
      actionId: "credit",
      actionType: "gain_credit",
      semanticActionType: "economy.gain_credit",
      stateVersion: 12,
    });
  });

  it("rejects stale and future action ids rather than retaining a route", () => {
    const params = baseParams();
    const route = bindBestCurrentPlanRoute({
      ...params,
      candidates: [routeCandidate(candidate("credit"), 4)],
    });

    expect(() =>
      assertCurrentPlanRoute(route, {
        side: "runner",
        stateVersion: 13,
        timingPoint: "runner_action.main",
        candidates: [
          routeCandidate({ ...candidate("new-credit"), stateVersion: 13 }, 4),
        ],
      }),
    ).toThrow(
      expect.objectContaining({ code: "stale_or_future_action_reference" }),
    );
  });

  it("refuses to bind a candidate projected for another state version", () => {
    expect(() =>
      bindBestCurrentPlanRoute({
        ...baseParams(),
        candidates: [
          routeCandidate({ ...candidate("old-credit"), stateVersion: 11 }, 4),
        ],
      }),
    ).toThrow(
      expect.objectContaining({ code: "stale_or_future_action_reference" }),
    );
  });

  it("does not treat any install as exact breaker coverage", () => {
    const breakerStep: PlanRouteStep = {
      stepId: "install_missing_sentry_breaker",
      capability: {
        capabilityId: "install_breaker_sentry",
        semanticActionTypes: ["install.card"],
        legalActionTypes: ["install_card"],
        requiredSourceRoles: ["breaker_sentry"],
      },
      purpose: "Close the still-open sentry coverage gap.",
    };
    const psychicFriend = candidate(
      "install-psychic-friend",
      "install_card",
      "install.card",
      "onr_classic_030_psychic-friend",
    );

    expect(
      matchPlanStepCandidate(
        breakerStep,
        psychicFriend,
        ["breaker_code_gate"],
        12,
      ),
    ).toEqual({
      status: "incompatible",
      code: "step_capability_mismatch",
    });
    expect(() =>
      bindBestCurrentPlanRoute({
        ...baseParams(),
        step: breakerStep,
        candidates: [routeCandidate(psychicFriend, 999)],
      }),
    ).toThrow(expect.objectContaining({ code: "step_capability_mismatch" }));
  });

  it("allows Psychic Friend only for an explicitly open code-gate role", () => {
    const step: PlanRouteStep = {
      stepId: "install_missing_code_gate_breaker",
      capability: {
        capabilityId: "install_breaker_code_gate",
        semanticActionTypes: ["install.card"],
        requiredSourceRoles: ["breaker_code_gate"],
      },
      purpose: "Close the still-open code-gate coverage gap.",
    };

    expect(
      bindBestCurrentPlanRoute({
        ...baseParams(),
        step,
        candidates: [
          routeCandidate(
            candidate(
              "install-psychic-friend",
              "install_card",
              "install.card",
              "onr_classic_030_psychic-friend",
            ),
            5,
            ["breaker_code_gate"],
          ),
        ],
      }).head.actionId,
    ).toBe("install-psychic-friend");
  });

  it("fails a semantically correct action aimed at the wrong target", () => {
    expect(() =>
      bindBestCurrentPlanRoute({
        ...baseParams(),
        step: {
          ...baseParams().step,
          capability: {
            capabilityId: "run_server",
            semanticActionTypes: ["run.start"],
          },
          target: { kind: "server", id: "rd" },
        },
        candidates: [
          routeCandidate(
            {
              ...candidate("run-hq", "start_run", "run.start"),
              runProjectionSummary: {
                serverId: "hq",
                serverKind: "hq",
                source: "legal_action_payload",
                evidence: [],
              },
            },
            50,
          ),
        ],
      }),
    ).toThrow(expect.objectContaining({ code: "step_target_mismatch" }));
  });

  it("binds an install action to its exact Engine-selected server target", () => {
    const install = {
      ...candidate(
        "install-ice-remote-1",
        "install_card",
        "install.card",
        "corp-ice-definition",
      ),
      actorSide: "corp" as const,
      observerSide: "corp" as const,
      targetContext: {
        selectedTargets: [
          {
            targetId: "remote_1",
            targetKind: "server" as const,
            targetSide: "corp" as const,
            visibilityScope: "public" as const,
            evidence: [],
          },
        ],
        targetKind: "server" as const,
        targetZones: [],
        targetSide: "corp" as const,
        hiddenInfoPolicy: "side_safe" as const,
        availableTargetsStatus: "engine_provided" as const,
        targetProfileMatches: [],
        targetConstraintResults: [],
      },
    };

    expect(
      bindBestCurrentPlanRoute({
        ...baseParams(),
        side: "corp",
        step: {
          stepId: "install_exact_remote_ice",
          capability: {
            capabilityId: "install_ice",
            semanticActionTypes: ["install.card"],
          },
          target: { kind: "server", id: "remote_1" },
          purpose: "Install the exact ICE on the exact selected server.",
        },
        candidates: [routeCandidate(install, 20)],
      }).head.actionId,
    ).toBe("install-ice-remote-1");
  });

  it("binds an exact source instance when the action operates on that ICE", () => {
    const rez = {
      ...candidate(
        "rez-outer",
        "rez_ice",
        "corp_window.rez",
        "corp-ice-definition",
      ),
      actorSide: "corp" as const,
      observerSide: "corp" as const,
      sourceCardInstanceId: "outer-ice",
    };

    expect(
      bindBestCurrentPlanRoute({
        ...baseParams(),
        side: "corp",
        timingPoint: "corp_rez.window",
        step: {
          stepId: "rez_exact_outer_ice",
          capability: {
            capabilityId: "rez_response",
            semanticActionTypes: ["corp_window.rez"],
            requiredSourceDefinitionIds: ["corp-ice-definition"],
          },
          target: { kind: "ice", id: "outer-ice" },
          purpose: "Rez the exact ICE owned by this defense response.",
        },
        candidates: [routeCandidate(rez, 20)],
      }).head.actionId,
    ).toBe("rez-outer");
  });

  it("matches a plan step by the complete required functional effect", () => {
    const bypass = {
      ...candidate("generic-bypass", "play_event", "play.runner_event"),
      functionalEffects: [
        {
          kind: "future_encounter_effect" as const,
          timing: "during_run" as const,
          scope: "ice" as const,
          target: "bypass_chosen_ice",
          repeatable: false,
          finite: true,
        },
      ],
    };
    const step: PlanRouteStep = {
      stepId: "prepare_targeted_bypass",
      capability: {
        capabilityId: "targeted_bypass",
        semanticActionTypes: ["play.runner_event"],
        requiredFunctionalEffects: [
          {
            kind: "future_encounter_effect",
            timing: "during_run",
            scope: "ice",
            target: "bypass_chosen_ice",
            repeatable: false,
            finite: true,
          },
        ],
      },
      purpose: "Prepare an exact targeted bypass effect.",
    };

    expect(matchPlanStepCandidate(step, bypass, [], 12)).toEqual({
      status: "compatible",
    });
    expect(
      matchPlanStepCandidate(
        step,
        {
          ...bypass,
          functionalEffects: [
            {
              ...bypass.functionalEffects[0]!,
              target: "bypass_first_ice",
            },
          ],
        },
        [],
        12,
      ),
    ).toEqual({
      status: "incompatible",
      code: "step_capability_mismatch",
    });
  });

  it("does not satisfy a plan capability from card-context effects alone", () => {
    const step: PlanRouteStep = {
      stepId: "remove_tags_now",
      capability: {
        capabilityId: "remove_tags",
        semanticActionTypes: ["play.runner_event"],
        requiredFunctionalEffects: [
          { kind: "tag_prevention", timing: "action", scope: "runner" },
        ],
      },
      purpose: "Remove tags with the selected action.",
    };
    const contextualOnly = {
      ...candidate("context-only", "play_event", "play.runner_event"),
      cardContextFunctionalEffects: [
        {
          kind: "tag_prevention" as const,
          timing: "action" as const,
          scope: "runner" as const,
        },
      ],
    };

    expect(matchPlanStepCandidate(step, contextualOnly, [], 12)).toEqual({
      status: "incompatible",
      code: "step_capability_mismatch",
    });
  });

  it("rejects an unprojected candidate as missing action semantics", () => {
    expect(() =>
      bindBestCurrentPlanRoute({
        ...baseParams(),
        candidates: [
          routeCandidate(
            {
              ...candidate("opaque"),
              semanticActionType: "unknown",
              primaryProjectionStatus: "neutral_projected",
            },
            999,
          ),
        ],
      }),
    ).toThrow(expect.objectContaining({ code: "missing_action_semantics" }));
  });

  it("never permits a future action id inside a semantic continuation", () => {
    expect(() =>
      bindBestCurrentPlanRoute({
        ...baseParams(),
        candidates: [routeCandidate(candidate("credit"), 4)],
        continuation: {
          continuationId: "after-credit",
          trigger: "action_applied",
          nextCapability: {
            capabilityId: "draw",
            semanticActionTypes: ["draw.card"],
          },
          purpose: "Continue after the observed outcome.",
          actionId: "future-action",
        } as never,
      }),
    ).toThrow(
      expect.objectContaining({ code: "stale_or_future_action_reference" }),
    );
  });
});

function baseParams(): BindPlanRouteParams {
  return {
    side: "runner",
    stateVersion: 12,
    timingPoint: "runner_action.main",
    planInstanceId: "runner.economy:general",
    step: {
      stepId: "gain_required_credit",
      capability: {
        capabilityId: "gain_liquid_credit",
        semanticActionTypes: ["economy.gain_credit"],
      },
      purpose: "Fund the parent plan.",
    },
    candidates: [],
  };
}

function routeCandidate(
  semanticCandidate: ActionSemanticCandidate,
  stepValue: number,
  sourceRoles: readonly string[] = [],
) {
  return { candidate: semanticCandidate, stepValue, sourceRoles };
}

function candidate(
  actionId: string,
  actionType = "gain_credit",
  semanticActionType = "economy.gain_credit",
  sourceDefinitionId?: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType,
    actorSide: "runner",
    observerSide: "runner",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType,
      originalPayloadKeys: [],
    },
    stateVersion: 12,
    sourceKind: sourceDefinitionId ? "card" : "basic_action",
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    abilityBindingMethod: "unresolved",
    semanticActionType,
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      creditCost: 0,
      clickCost: 1,
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 12,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}
