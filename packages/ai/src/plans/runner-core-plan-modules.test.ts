import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { instantiatePlanProposal } from "./plan-instance";
import {
  createRunnerCorePlanModules,
  runnerDevelopmentCardAdmission,
  type RunnerCorePlanDomain,
} from "./runner-core-plan-modules";
import type { PlanSchedulerContext } from "./plan-scheduler";

describe("Runner core plan modules", () => {
  it("contains no free play-best-card owner", () => {
    expect(createRunnerCorePlanModules().map((module) => module.moduleId)).toEqual([
      "runner.economy",
      "runner.rig_and_coverage",
      "runner.defense_and_recovery",
      "runner.basic_credit",
    ]);
  });

  it("never lets a non-breaker satisfy exact coverage", () => {
    const installPsychic = candidate(
      "install-psychic",
      "install_card",
      "install.card",
      "onr_classic_030_psychic-friend",
    );
    const installResource = candidate(
      "install-resource",
      "install_card",
      "install.card",
      "runner_resource",
    );
    const module = coreModule("runner.rig_and_coverage", (definitionId) =>
      definitionId.includes("psychic")
        ? ["breaker_code_gate"]
        : ["runner_resource"],
    );
    const runnerContext = context([installPsychic, installResource], {
      coverageGaps: [
        {
          gapId: "code-gate",
          requiredRole: "breaker_code_gate",
          priorityClass: "P5",
          evidenceCode: "visible_code_gate",
          deckHasAnswer: true,
        },
      ],
    });
    const proposal = module.discover(runnerContext)[0]!;
    const instance = instantiatePlanProposal(proposal, 10);
    const materialized = module.materialize(
      instance,
      {} as never,
      runnerContext,
    );

    expect(materialized.candidates.map((entry) => entry.candidate.actionId)).toEqual([
      "install-psychic",
    ]);
    expect(materialized.candidates[0]?.sourceRoles).toEqual([
      "breaker_code_gate",
    ]);
  });

  it("does not create a second Psychic Friend route after the gap is gone", () => {
    const module = coreModule("runner.rig_and_coverage", () => [
      "breaker_code_gate",
    ]);
    const proposals = module.discover(
      context(
        [
          candidate(
            "install-second-psychic",
            "install_card",
            "install.card",
            "onr_classic_030_psychic-friend",
          ),
        ],
        { coverageGaps: [] },
      ),
    );

    expect(proposals).toEqual([]);
  });

  it("ends the bound economy plan when its concrete gap is satisfied", () => {
    const economy = coreModule("runner.economy");
    const open = economy.discover(
      context([candidate("credit")], {
        fundingNeeds: [
          {
            needId: "fund-run",
            gap: 3,
            priorityClass: "P5",
            evidenceCode: "run_needs_credits",
          },
        ],
      }),
    );
    const satisfied = economy.discover(
      context([candidate("credit")], {
        fundingNeeds: [
          {
            needId: "fund-run",
            gap: 0,
            priorityClass: "P5",
            evidenceCode: "run_funded",
          },
        ],
      }),
    );

    expect(open).toHaveLength(1);
    expect(open[0]?.retentionPolicy.abandonWhenTargetMissing).toBe(true);
    expect(satisfied).toEqual([]);
  });

  it("blocks coverage rather than drawing when draw is not a valid route", () => {
    const coverage = coreModule("runner.rig_and_coverage");
    const [proposal] = coverage.discover(
      context([candidate("draw", "draw_card", "draw.card")], {
        coverageGaps: [
          {
            gapId: "sentry",
            requiredRole: "breaker_sentry",
            priorityClass: "P5",
            evidenceCode: "missing_sentry",
            deckHasAnswer: true,
          },
        ],
        defense: { drawAllowed: false },
      }),
    );

    expect(proposal).toMatchObject({
      initialViability: "blocked",
      blockers: [{ code: "no_exact_coverage_route" }],
    });
  });

  it("prioritizes pending damage, then tags, then hand buffer internally", () => {
    const defense = coreModule("runner.defense_and_recovery");
    const prevention = candidate(
      "prevent",
      "activated_card_ability",
      "damage.prevent_net",
    );
    const clearTag = candidate("clear", "remove_tag", "tag.remove");
    const draw = candidate("draw", "draw_card", "draw.card");
    const [damage] = defense.discover(
      context([prevention, clearTag, draw], {
        defense: {
          pendingDamage: 2,
          damagePreventionNeeded: true,
          activeTags: 1,
          visibleTagPunish: true,
          handSize: 1,
          minimumHandBuffer: 3,
          drawAllowed: true,
        },
      }),
    );
    const [tags] = defense.discover(
      context([clearTag, draw], {
        defense: {
          activeTags: 1,
          visibleTagPunish: true,
          handSize: 1,
          minimumHandBuffer: 3,
          drawAllowed: true,
        },
      }),
    );
    const [buffer] = defense.discover(
      context([draw], {
        defense: {
          handSize: 1,
          minimumHandBuffer: 3,
          drawAllowed: true,
        },
      }),
    );

    expect(damage?.phase).toBe("prevent_damage");
    expect(tags?.phase).toBe("clear_tags");
    expect(buffer?.phase).toBe("build_hand_buffer");
  });

  it("admits card-specific development only with a concrete feasible purpose", () => {
    expect(
      runnerDevelopmentCardAdmission({
        definitionId: "special-card",
        assignedDomainPlanIds: [],
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
      }),
    ).toEqual({ admitted: false, reasonCode: "no_concrete_plan_purpose" });
    expect(
      runnerDevelopmentCardAdmission({
        definitionId: "special-card",
        assignedDomainPlanIds: [],
        concretePurposeCode: "unlock_recurring_draw",
        duplicateAlreadyInstalled: false,
        affordableOrSupportable: true,
      }),
    ).toMatchObject({ admitted: true });
  });
});

function coreModule(
  moduleId: string,
  rolesForDefinitionId?: (definitionId: string) => readonly string[],
) {
  return createRunnerCorePlanModules(
    rolesForDefinitionId ? { rolesForDefinitionId } : {},
  ).find(
    (module) => module.moduleId === moduleId,
  )!;
}

function context(
  actionCandidates: ActionSemanticCandidate[],
  overrides: {
    fundingNeeds?: RunnerCorePlanDomain["fundingNeeds"];
    coverageGaps?: RunnerCorePlanDomain["coverageGaps"];
    defense?: Partial<RunnerCorePlanDomain["defense"]>;
  },
): PlanSchedulerContext {
  const domain: RunnerCorePlanDomain = {
    fundingNeeds: overrides.fundingNeeds ?? [],
    coverageGaps: overrides.coverageGaps ?? [],
    defense: {
      activeTags: 0,
      visibleTagPunish: false,
      pendingDamage: 0,
      damagePreventionNeeded: false,
      handSize: 5,
      minimumHandBuffer: 3,
      drawAllowed: true,
      evidenceCodes: [],
      ...overrides.defense,
    },
  };
  return {
    input: {
      side: "runner",
      legalActions: actionCandidates.map((value) => ({
        actionId: value.actionId,
        type: value.actionType,
      })),
      playerView: { stateVersion: 10, timingPoint: "runner_action.main" },
    } as unknown as AiDecisionInput,
    actionCandidates,
    turnKey: "runner:1",
    domain,
  };
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
    legalActionRef: {
      actionId,
      actionType,
      originalPayloadKeys: [],
    },
    stateVersion: 10,
    sourceKind: sourceDefinitionId ? "card" : "basic_action",
    ...(sourceDefinitionId ? { sourceDefinitionId } : {}),
    abilityBindingMethod: "unresolved",
    semanticActionType,
    visibilityScope: "actor_private",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: { costKnownStatus: "known", additionalCosts: [] },
    timingProfile: {},
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 10,
      notes: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}
