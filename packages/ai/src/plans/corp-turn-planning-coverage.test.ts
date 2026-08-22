import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { createCorpCorePlanModules } from "./corp-core-plan-modules";
import { createCorpTacticalPlanModules } from "./corp-tactical-plan-modules";
import {
  assertCompleteCorpTurnPlanningCoverage,
  assertCorpTurnPlanningModuleRegistry,
  buildCorpTurnPlanningCoverageReport,
  CORP_TURN_PLANNING_MODULE_COVERAGE,
} from "./corp-turn-planning-coverage";
import type { PlanModuleId } from "./plan-kernel-types";
import type { PlanActionDisposition } from "./plan-scheduler";
import { currentTurnPlanningInvocationVariants } from "./corp-turn-planner-shadow";
import { createTurnCompletionPlanModule } from "./turn-completion-plan-module";
import {
  buildCanonicalLegalActionInvocation,
  buildSemanticActionSetFingerprint,
  type PlanModuleHorizonCapability,
  type PlanningStateIdentity,
  type TurnPlanningHeadCandidate,
} from "./turn-planning-contracts";

describe("Corp turn planning coverage", () => {
  it("binds every registered Corp module to one explicit horizon contract", () => {
    const registered = [
      ...createCorpCorePlanModules(),
      ...createCorpTacticalPlanModules(),
      createTurnCompletionPlanModule("corp"),
    ].map((module) => module.moduleId);

    expect(() =>
      assertCorpTurnPlanningModuleRegistry(registered),
    ).not.toThrow();
    expect(CORP_TURN_PLANNING_MODULE_COVERAGE).toHaveLength(10);
    expect(
      CORP_TURN_PLANNING_MODULE_COVERAGE.map((entry) => entry.moduleId).sort(),
    ).toEqual([...registered].sort());
    expect(
      CORP_TURN_PLANNING_MODULE_COVERAGE.some((entry) =>
        entry.semanticActionPatterns.includes("*"),
      ),
    ).toBe(false);
    expect(
      CORP_TURN_PLANNING_MODULE_COVERAGE.find(
        (entry) => entry.moduleId === "corp.defend_servers",
      )?.semanticActionPatterns,
    ).toContain("play.corp_operation");
    expect(
      CORP_TURN_PLANNING_MODULE_COVERAGE.find(
        (entry) => entry.moduleId === "corp.defend_servers",
      )?.semanticActionPatterns,
    ).toContain("choice.resolve");
    expect(
      CORP_TURN_PLANNING_MODULE_COVERAGE.find(
        (entry) => entry.moduleId === "corp.economy",
      )?.semanticActionPatterns,
    ).toContain("score.advance_card");
    expect(
      CORP_TURN_PLANNING_MODULE_COVERAGE.find(
        (entry) => entry.moduleId === "corp.economy",
      )?.semanticActionPatterns,
    ).toContain("choice.resolve");
  });

  it("reports 100 percent classified current Corp LegalActions across every owner", () => {
    const setup = coverageSetup();
    const report = buildCorpTurnPlanningCoverageReport(setup);

    expect(() => assertCompleteCorpTurnPlanningCoverage(report)).not.toThrow();
    expect(report).toMatchObject({
      status: "pass",
      coveragePercent: 100,
      legalActionCount: 15,
      candidateCount: 15,
      classifiedActionCount: 15,
      productiveActionCount: 11,
      explicitlyNonproductiveActionCount: 2,
      assessmentUnknownActionCount: 1,
      engineWindowActionCount: 1,
      missingActionCount: 0,
      conflictingActionCount: 0,
      issues: [],
    });
    expect(
      report.modules.filter((entry) => entry.productiveActionCount > 0),
    ).toHaveLength(10);
    expect(report.actions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actionId: "action:score",
          ownerModuleId: "corp.score_agenda",
          instanceHorizon: "multi_turn",
          campaignQuoteStatus: "present",
        }),
        expect.objectContaining({
          actionId: "action:trace",
          ownerModuleId: "corp.punish_campaign",
          campaignQuoteStatus: "present",
        }),
        expect.objectContaining({
          actionId: "action:ability",
          ownerModuleId: "corp.execute_punish_sequence",
        }),
        expect.objectContaining({
          actionId: "action:choice",
          ownerModuleId: "corp.ambush_and_bluff",
        }),
        expect.objectContaining({
          actionId: "action:special",
          ownerModuleId: "corp.hand_and_agenda_management",
        }),
        expect.objectContaining({
          actionId: "action:stop-restricted",
          ownerModuleId: "corp.economy",
        }),
        expect.objectContaining({
          actionId: "action:trash",
          ownerModuleId: "corp.punish_campaign",
          classification: "explicitly_nonproductive",
        }),
        expect.objectContaining({
          actionId: "action:virus",
          classification: "explicitly_nonproductive",
        }),
        expect.objectContaining({
          actionId: "action:unknown",
          classification: "assessment_unknown",
        }),
        expect.objectContaining({
          actionId: "action:mandatory",
          classification: "engine_window",
        }),
      ]),
    );
  });

  it("binds the Engine choice payload shape into a canonical planning invocation", () => {
    const variants = currentTurnPlanningInvocationVariants({
      stateIdentity: identity(),
      action: {
        actionId: "action:defense-choice",
        side: "corp",
        type: "resolve_choice",
        label: "Resolve defense targets",
        source: "game_rule",
        timingPoint: "corp_action.main",
        visibility: "private_to_actor",
        expiresAtStateVersion: 40,
        targetRequirements: [],
        choiceRequirements: [
          {
            choiceId: "choice:defense-targets",
            minSelections: 2,
            maxSelections: 2,
            optionIds: ["target_hq", "target_rd"],
          },
        ],
        costs: [],
      },
      candidate: candidate(
        "action:defense-choice",
        "resolve_choice",
        "choice.resolve",
      ),
      selectedChoices: {
        choiceId: "choice:defense-targets",
        selectedOptionIds: ["target_hq", "target_rd"],
      },
    });

    expect(variants).toHaveLength(1);
    expect(variants[0]?.boundChoices).toEqual([
      {
        choiceId: "choice:defense-targets",
        role: "route_defining",
        value: {
          kind: "target_list",
          values: [
            { kind: "value", id: "target_hq" },
            { kind: "value", id: "target_rd" },
          ],
          ordering: "ordered",
        },
      },
    ]);
  });

  it("is deterministic under candidate, head and disposition enumeration order", () => {
    const setup = coverageSetup();
    const first = buildCorpTurnPlanningCoverageReport(setup);
    const second = buildCorpTurnPlanningCoverageReport({
      ...setup,
      candidates: [...setup.candidates].reverse(),
      heads: [...setup.heads].reverse(),
      dispositions: [...setup.dispositions].reverse(),
    });

    expect(second).toEqual(first);
  });

  it("fails closed when a productive action has no owner", () => {
    const setup = coverageSetup();
    const heads = setup.heads.filter(
      (head) => head.currentBinding.actionId !== "action:defense",
    );
    const report = buildCorpTurnPlanningCoverageReport({ ...setup, heads });

    expect(report.status).toBe("fail");
    expect(report.missingActionCount).toBe(1);
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: "productive_action_without_owner",
        actionId: "action:defense",
      }),
    );
    expect(() => assertCompleteCorpTurnPlanningCoverage(report)).toThrowError(
      /productive_action_without_owner/,
    );
  });

  it("defers a zero-click end turn while an exact productive score route remains", () => {
    const setup = coverageSetup();
    const report = buildCorpTurnPlanningCoverageReport({
      ...setup,
      input: {
        ...setup.input,
        playerView: {
          ...setup.input.playerView,
          own: { clicks: 0 },
        },
      } as typeof setup.input,
      heads: setup.heads.filter(
        (head) => head.currentBinding.actionId !== "action:end",
      ),
    });

    expect(report.actions).toContainEqual(
      expect.objectContaining({
        actionId: "action:end",
        classification: "explicitly_nonproductive",
        ownerModuleId: "corp.complete_turn",
        evidenceCodes: ["turn_completion_deferred_productive_route"],
      }),
    );
    expect(report.status).toBe("pass");
  });

  it("rejects missing campaign quotes, horizon drift and alien semantic families", () => {
    const setup = coverageSetup();
    const score = setup.heads.find(
      (head) => head.currentBinding.actionId === "action:score",
    )!;
    const defense = setup.heads.find(
      (head) => head.currentBinding.actionId === "action:defense",
    )!;
    const malformedHeads = setup.heads.map((head) => {
      if (head === score) {
        const { campaignQuote: _campaignQuote, ...withoutQuote } = head;
        return withoutQuote as TurnPlanningHeadCandidate;
      }
      if (head === defense) {
        return {
          ...head,
          horizonCapability: "current_turn_only" as const,
          invocation: buildCanonicalLegalActionInvocation({
            stateIdentity: setup.stateIdentity,
            semanticActionType: "special_zone.move_to_set_aside",
            sourceCardInstanceId: "source:defense",
          }),
        };
      }
      return head;
    });
    const malformedDefense = malformedHeads.find(
      (head) => head.currentBinding.actionId === "action:defense",
    )!;
    malformedDefense.currentBinding.invocationKey =
      malformedDefense.invocation.invocationKey;
    malformedDefense.executableWitness.invocationKey =
      malformedDefense.invocation.invocationKey;
    const report = buildCorpTurnPlanningCoverageReport({
      ...setup,
      heads: malformedHeads,
    });

    expect(report.status).toBe("fail");
    expect(report.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "multi_turn_campaign_quote_missing",
          actionId: "action:score",
        }),
        expect.objectContaining({
          code: "module_horizon_mismatch",
          actionId: "action:defense",
        }),
        expect.objectContaining({
          code: "module_semantic_family_mismatch",
          actionId: "action:defense",
        }),
      ]),
    );
  });

  it("rejects conflicts instead of allowing a disposition to mask a productive head", () => {
    const setup = coverageSetup();
    const report = buildCorpTurnPlanningCoverageReport({
      ...setup,
      dispositions: [
        ...setup.dispositions,
        disposition(
          "action:economy",
          "corp.economy",
          "explicitly_nonproductive",
        ),
      ],
    });

    expect(report.status).toBe("fail");
    expect(report.conflictingActionCount).toBe(1);
    expect(report.actions).toContainEqual(
      expect.objectContaining({
        actionId: "action:economy",
        classification: "conflicting",
      }),
    );
  });

  it("requires every current target and choice binding on a productive head", () => {
    const setup = coverageSetup();
    const choice = setup.heads.find(
      (head) => head.currentBinding.actionId === "action:choice",
    )!;
    const unboundInvocation = buildCanonicalLegalActionInvocation({
      stateIdentity: setup.stateIdentity,
      semanticActionType: choice.invocation.semanticActionType,
      ...(choice.invocation.sourceCardInstanceId
        ? { sourceCardInstanceId: choice.invocation.sourceCardInstanceId }
        : {}),
    });
    const heads = setup.heads.map((head) =>
      head === choice
        ? {
            ...head,
            invocation: unboundInvocation,
            currentBinding: {
              ...head.currentBinding,
              invocationKey: unboundInvocation.invocationKey,
            },
            executableWitness: {
              ...head.executableWitness,
              invocationKey: unboundInvocation.invocationKey,
            },
          }
        : head,
    );
    const report = buildCorpTurnPlanningCoverageReport({ ...setup, heads });

    expect(report.status).toBe("fail");
    expect(report.issues).toContainEqual(
      expect.objectContaining({
        code: "route_defining_binding_incomplete",
        actionId: "action:choice",
      }),
    );
  });
});

function coverageSetup() {
  const stateIdentity = identity();
  const specs: Array<{
    actionId: string;
    actionType: string;
    semanticActionType: string;
    owner?:
      | PlanModuleId
      | "engine_window"
      | "explicitly_nonproductive"
      | "assessment_unknown";
    horizonCapability?: PlanModuleHorizonCapability;
    instanceHorizon?: "current_turn" | "multi_turn";
  }> = [
    {
      actionId: "action:score",
      actionType: "advance_card",
      semanticActionType: "score.advance_card",
      owner: "corp.score_agenda",
      horizonCapability: "campaign_capable",
      instanceHorizon: "multi_turn",
    },
    {
      actionId: "action:remote",
      actionType: "install_card",
      semanticActionType: "install.card",
      owner: "corp.establish_scoring_remote",
      horizonCapability: "campaign_capable",
    },
    {
      actionId: "action:defense",
      actionType: "rez_ice",
      semanticActionType: "corp_window.rez",
      owner: "corp.defend_servers",
      horizonCapability: "context_dependent",
    },
    {
      actionId: "action:economy",
      actionType: "gain_credit",
      semanticActionType: "economy.gain_credit",
      owner: "corp.economy",
      horizonCapability: "context_dependent",
    },
    {
      actionId: "action:virus-head",
      actionType: "purge_virus_counters",
      semanticActionType: "counter.purge_virus",
      owner: "corp.respond_to_virus_pressure",
      horizonCapability: "context_dependent",
    },
    {
      actionId: "action:trace",
      actionType: "play_operation",
      semanticActionType: "trace.initiate",
      owner: "corp.punish_campaign",
      horizonCapability: "campaign_capable",
      instanceHorizon: "multi_turn",
    },
    {
      actionId: "action:ability",
      actionType: "trigger_ability",
      semanticActionType: "card_ability.trigger",
      owner: "corp.execute_punish_sequence",
      horizonCapability: "context_dependent",
    },
    {
      actionId: "action:choice",
      actionType: "resolve_choice",
      semanticActionType: "choice.resolve",
      owner: "corp.ambush_and_bluff",
      horizonCapability: "campaign_capable",
    },
    {
      actionId: "action:special",
      actionType: "move_to_set_aside",
      semanticActionType: "special_zone.move_to_set_aside",
      owner: "corp.hand_and_agenda_management",
      horizonCapability: "context_dependent",
    },
    {
      actionId: "action:end",
      actionType: "end_turn",
      semanticActionType: "turn_flow.end_turn",
      owner: "corp.complete_turn",
      horizonCapability: "current_turn_only",
    },
    {
      actionId: "action:stop-restricted",
      actionType: "stop_restricted_action_sequence",
      semanticActionType: "turn_flow.stop_restricted_action_sequence",
      owner: "corp.economy",
      horizonCapability: "context_dependent",
    },
    {
      actionId: "action:trash",
      actionType: "trash_resource",
      semanticActionType: "trash.resources",
      owner: "explicitly_nonproductive",
    },
    {
      actionId: "action:virus",
      actionType: "purge_runner_virus_counters",
      semanticActionType: "counter.purge_runner_virus",
      owner: "explicitly_nonproductive",
    },
    {
      actionId: "action:unknown",
      actionType: "activated_card_ability",
      semanticActionType: "card_ability.unknown",
      owner: "assessment_unknown",
    },
    {
      actionId: "action:mandatory",
      actionType: "mandatory_draw",
      semanticActionType: "draw.mandatory",
      owner: "engine_window",
    },
  ];
  const legalActions = specs.map((spec) =>
    legalAction(spec.actionId, spec.actionType),
  );
  const candidates = specs.map((spec) =>
    candidate(spec.actionId, spec.actionType, spec.semanticActionType),
  );
  const semanticActionSetFingerprint =
    buildSemanticActionSetFingerprint(legalActions);
  const heads = specs.flatMap((spec) =>
    spec.owner?.startsWith("corp.")
      ? [
          head({
            spec: {
              ...spec,
              owner: spec.owner as PlanModuleId,
              horizonCapability: spec.horizonCapability!,
              instanceHorizon: spec.instanceHorizon ?? "current_turn",
            },
            stateIdentity,
            semanticActionSetFingerprint,
          }),
        ]
      : [],
  );
  const dispositions = [
    disposition(
      "action:virus",
      "corp.respond_to_virus_pressure",
      "explicitly_nonproductive",
    ),
    disposition("action:unknown", "corp.economy", "assessment_unknown"),
    disposition(
      "action:trash",
      "corp.punish_campaign",
      "explicitly_nonproductive",
    ),
  ];
  const input = {
    side: "corp",
    playerView: { stateVersion: 40 },
    legalActions,
  } as Pick<AiDecisionInput, "side" | "playerView" | "legalActions">;
  return {
    input,
    stateIdentity,
    candidates,
    heads,
    dispositions,
    engineWindowActionIds: ["action:mandatory"],
  };
}

function head(params: {
  spec: {
    actionId: string;
    actionType: string;
    semanticActionType: string;
    owner: PlanModuleId;
    horizonCapability: PlanModuleHorizonCapability;
    instanceHorizon: "current_turn" | "multi_turn";
  };
  stateIdentity: PlanningStateIdentity;
  semanticActionSetFingerprint: string;
}): TurnPlanningHeadCandidate {
  const invocation = buildCanonicalLegalActionInvocation({
    stateIdentity: params.stateIdentity,
    semanticActionType: params.spec.semanticActionType,
    sourceCardInstanceId: `source:${params.spec.actionId}`,
    ...(params.spec.actionId === "action:defense"
      ? {
          boundTargets: [
            {
              slotId: "server",
              ordering: "single" as const,
              values: [{ kind: "server" as const, id: "rd" }],
            },
          ],
        }
      : {}),
    ...(params.spec.actionId === "action:choice"
      ? {
          boundChoices: [
            {
              choiceId: "route",
              role: "route_defining" as const,
              value: { kind: "string" as const, value: "option:a" },
            },
          ],
        }
      : {}),
  });
  const campaignQuote =
    params.spec.instanceHorizon === "multi_turn"
      ? {
          quoteId: `quote:${params.spec.actionId}`,
          campaignId: `campaign:${params.spec.actionId}`,
          quoteVersion: "test:v1",
          basis: {
            kind: "actual_state" as const,
            stateVersion: params.stateIdentity.stateVersion,
            sideSafePlanningFingerprint:
              params.stateIdentity.sideSafePlanningFingerprint,
          },
          currentMilestoneId: "current",
          nextMilestoneId: "next",
          commitment: "hard" as const,
          remainingValue: 10,
          expiresAt: "next_own_turn" as const,
          revalidationCodes: ["visible_objective_still_valid"],
        }
      : undefined;
  return {
    candidateId: `head:${params.spec.actionId}`,
    side: "corp",
    moduleId: params.spec.owner,
    rootPlanInstanceId: `root:${params.spec.owner}`,
    nextMilestoneId: "next",
    stepFingerprint: `step:${params.spec.actionId}`,
    horizonCapability: params.spec.horizonCapability,
    instanceHorizon: params.spec.instanceHorizon,
    priorityClass: "P4",
    invocation,
    currentBinding: {
      actionId: params.spec.actionId,
      stateVersion: params.stateIdentity.stateVersion,
      semanticActionSetFingerprint: params.semanticActionSetFingerprint,
      invocationKey: invocation.invocationKey,
    },
    executableWitness: {
      stateVersion: params.stateIdentity.stateVersion,
      sideSafePlanningFingerprint:
        params.stateIdentity.sideSafePlanningFingerprint,
      semanticActionSetFingerprint: params.semanticActionSetFingerprint,
      stepFingerprint: `step:${params.spec.actionId}`,
      invocationKey: invocation.invocationKey,
      quoteIds: campaignQuote ? [campaignQuote.quoteId] : [],
      safetyPolicyVersion: "coverage-test:v1",
      allRouteDefiningChoicesBound: true,
    },
    ...(campaignQuote ? { campaignQuote } : {}),
    evaluationValues: {},
    valueClaims: [],
    evidenceCodes: [`coverage:${params.spec.owner}`],
  };
}

function disposition(
  actionId: string,
  ownerModuleId: PlanModuleId,
  classification: PlanActionDisposition["disposition"],
): PlanActionDisposition {
  return {
    actionId,
    ownerModuleId,
    disposition: classification,
    evidenceCode: `coverage:${classification}:${ownerModuleId}`,
  };
}

function legalAction(actionId: string, type: string): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    label: type,
    source: actionId === "action:end" ? "game_rule" : `source:${actionId}`,
    timingPoint: "corp_action.main",
    costs: [],
    targetRequirements:
      actionId === "action:defense"
        ? [{ id: "server", kind: "server", allowedServers: ["rd"] }]
        : [],
    ...(actionId === "action:choice"
      ? {
          choiceRequirements: [
            {
              choiceId: "route",
              minSelections: 1,
              maxSelections: 1,
              optionIds: ["option:a", "option:b"],
            },
          ],
        }
      : {}),
    visibility: "private_to_actor",
    expiresAtStateVersion: 40,
  } as LegalAction;
}

function candidate(
  actionId: string,
  actionType: string,
  semanticActionType: string,
): ActionSemanticCandidate {
  return {
    actionId,
    actionType,
    actorSide: "corp",
    visibilityScope: "actor_private",
    legalActionRef: {
      actionId,
      actionType,
      originalPayloadKeys: [],
    },
    stateVersion: 40,
    sourceKind: actionId === "action:end" ? "game_rule" : "card",
    ...(actionId === "action:end"
      ? {}
      : { sourceCardInstanceId: `source:${actionId}` }),
    abilityBindingMethod: "unresolved",
    semanticActionType,
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 40,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

function identity(): PlanningStateIdentity {
  return {
    stateVersion: 40,
    sideSafePlanningFingerprint: "planning-state:corp-coverage",
  };
}
