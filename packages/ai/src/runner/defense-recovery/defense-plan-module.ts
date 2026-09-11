import { runnerEffectsProvideDamagePrevention } from "../../runner-canonical-hint-semantics";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  PlanMaterialization,
  PlanActionDisposition,
  PlanModule,
} from "../../plans/plan-scheduler";
import {
  runnerPlanProposal as proposal,
  runnerPlanAssessment as assessment,
  runnerPlanDomain,
} from "../../plans/runner-plan-module-support";
import type { RunnerDefenseSignals, DefenseState } from "./defense-types";
export function createRunnerDefenseModule(): PlanModule {
  return {
    moduleId: "runner.defense_and_recovery",
    side: "runner",
    discover: (context) => {
      const signals = runnerPlanDomain<{ defense: RunnerDefenseSignals }>(
        context,
      ).defense;
      const invalidTagClearFundingContract =
        signals.tagClearFundingNeed !== undefined &&
        !validRunnerTagClearFundingNeed(
          signals.tagClearFundingNeed,
          context.input.playerView.stateVersion,
        );
      const invalidReactionReserveContract =
        signals.reactionReserveNeed !== undefined &&
        !validRunnerDefenseFundingNeed(
          signals.reactionReserveNeed,
          context.input.playerView.stateVersion,
        );
      const phase = invalidTagClearFundingContract
        ? "fund_tag_clear"
        : invalidReactionReserveContract
          ? "build_reaction_reserve"
          : defensePhase(
              context.actionCandidates,
              context.input.playerView.stateVersion,
              signals,
              context.actionDispositions,
            );
      if (!phase) return [];
      const candidates =
        invalidTagClearFundingContract || invalidReactionReserveContract
          ? []
          : defenseCandidates(
              context.actionCandidates,
              phase,
              signals,
              context.actionDispositions,
            );
      return [
        proposal({
          moduleId: "runner.defense_and_recovery",
          dedupeKey: "runner",
          moduleState: {
            kind: "defense",
            phase,
            signals,
          } satisfies DefenseState,
          priorityClass: defensePriorityClass(signals),
          target: { kind: "player", id: "runner" },
          routeExists: candidates.length > 0,
          blockerCode: invalidTagClearFundingContract
            ? "invalid_tag_clear_funding_need"
            : invalidReactionReserveContract
              ? "invalid_reaction_reserve_need"
              : `no_${phase}_route`,
          evidenceCode: signals.evidenceCodes[0] ?? phase,
        }),
      ];
    },
    assess: (instance, context, portfolio) => {
      const current = instance.moduleState as DefenseState;
      const tagClearFundingContractValid =
        current.phase !== "fund_tag_clear" ||
        (current.signals.tagClearFundingNeed !== undefined &&
          validRunnerTagClearFundingNeed(
            current.signals.tagClearFundingNeed,
            context.input.playerView.stateVersion,
          ));
      const reactionReserveContractValid =
        current.phase !== "build_reaction_reserve" ||
        (current.signals.reactionReserveNeed !== undefined &&
          validRunnerDefenseFundingNeed(
            current.signals.reactionReserveNeed,
            context.input.playerView.stateVersion,
          ));
      const candidates =
        tagClearFundingContractValid && reactionReserveContractValid
          ? defenseCandidates(
              context.actionCandidates,
              current.phase,
              current.signals,
              context.actionDispositions,
            )
          : [];
      const priorityClass = defensePriorityClass(current.signals);
      return assessment(
        instance,
        priorityClass,
        candidates.length > 0,
        defensePhaseValue(current.phase, current.signals),
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = instance.moduleState as DefenseState;
      const candidates = defenseCandidates(
        context.actionCandidates,
        current.phase,
        current.signals,
        context.actionDispositions,
      );
      return {
        step: {
          stepId: `${instance.instanceId}:${current.phase}`,
          capability: defenseCapability(current.phase, candidates),
          purpose: `Resolve runner defense phase ${current.phase}.`,
        },
        candidates,
        ...(current.phase === "forgo_unsafe_run"
          ? {
              earlyEndTurnJustification: {
                kind: "forgo_restricted_capacity" as const,
                capacityKind: "zero_click_non_basic_run_only" as const,
                explicitlyNonproductiveActionIds: context.actionCandidates
                  .filter(
                    (candidate) => candidate.semanticActionType === "run.start",
                  )
                  .map((candidate) => candidate.actionId),
              },
            }
          : current.phase === "forgo_exhausted_options"
            ? {
                earlyEndTurnJustification: {
                  kind: "forgo_exhausted_runner_capacity" as const,
                  capacityKind:
                    "empty_stack_all_voluntary_routes_rejected" as const,
                  explicitlyNonproductiveActionIds: context.actionCandidates
                    .filter(
                      (candidate) =>
                        candidate.semanticActionType !== "turn_flow.end_turn",
                    )
                    .map((candidate) => candidate.actionId),
                },
              }
            : current.phase === "forgo_terminal_deck_pressure"
              ? {
                  earlyEndTurnJustification: {
                    kind: "forgo_terminal_deck_pressure_capacity" as const,
                    capacityKind:
                      "match_point_favorable_deck_race_all_voluntary_routes_rejected" as const,
                    explicitlyNonproductiveActionIds: context.actionCandidates
                      .filter(
                        (candidate) =>
                          candidate.semanticActionType !== "turn_flow.end_turn",
                      )
                      .map((candidate) => candidate.actionId),
                  },
                }
              : {}),
      };
    },
  };
}

function defensePhase(
  actionCandidates: readonly ActionSemanticCandidate[],
  stateVersion: number,
  signals: RunnerDefenseSignals,
  actionDispositions?: readonly PlanActionDisposition[],
): DefenseState["phase"] | undefined {
  const openPhases: DefenseState["phase"][] = [];
  if (signals.discardChoiceBinding) openPhases.push("discard_window");
  if (signals.pendingDamage > 0 && signals.damagePreventionNeeded)
    openPhases.push("prevent_damage");
  if ((signals.defenseSupportInstallActionIds?.length ?? 0) > 0)
    openPhases.push("install_defense_support");
  if (signals.activeTags > 0) openPhases.push("clear_tags");
  if (
    signals.tagClearFundingNeed &&
    validRunnerTagClearFundingNeed(signals.tagClearFundingNeed, stateVersion)
  )
    openPhases.push("fund_tag_clear");
  if (signals.persistentHazardCounterRemovalAvailable)
    openPhases.push("clear_persistent_hazard_counter");
  if (
    (signals.handBufferActionIds?.length ?? 0) > 0 &&
    signals.handSize < signals.minimumHandBuffer
  )
    openPhases.push("build_hand_buffer");
  if (
    signals.reactionReserveNeed &&
    validRunnerDefenseFundingNeed(signals.reactionReserveNeed, stateVersion)
  )
    openPhases.push("build_reaction_reserve");
  if (signals.forgoUnsafeRunCapacity) openPhases.push("forgo_unsafe_run");
  if (signals.forgoTerminalDeckPressureCapacity)
    openPhases.push("forgo_terminal_deck_pressure");
  if (signals.forgoExhaustedStandardCapacity)
    openPhases.push("forgo_exhausted_options");
  return (
    openPhases.find(
      (phase) =>
        defenseCandidates(actionCandidates, phase, signals, actionDispositions)
          .length > 0,
    ) ?? openPhases[0]
  );
}

function defenseCandidates(
  actionCandidates: readonly ActionSemanticCandidate[],
  phase: DefenseState["phase"],
  signals: RunnerDefenseSignals,
  actionDispositions?: readonly PlanActionDisposition[],
): PlanMaterialization["candidates"] {
  if (
    phase === "build_hand_buffer" &&
    (signals.handBufferActionIds?.length ?? 0) === 0
  ) {
    return [];
  }
  if (
    phase === "forgo_exhausted_options" ||
    phase === "forgo_terminal_deck_pressure"
  ) {
    const voluntaryCandidates = actionCandidates.filter(
      (candidate) => candidate.semanticActionType !== "turn_flow.end_turn",
    );
    if (
      voluntaryCandidates.length === 0 ||
      !voluntaryCandidates.every((candidate) =>
        (actionDispositions ?? []).some(
          (entry) =>
            entry.actionId === candidate.actionId &&
            entry.disposition === "explicitly_nonproductive",
        ),
      )
    ) {
      return [];
    }
  }
  const reactionReserveActionIds = new Set(
    signals.reactionReserveNeed?.actionIds ?? [],
  );
  const tagClearFundingActionIds = new Set(
    signals.tagClearFundingNeed?.actionIds ?? [],
  );
  const handBufferActionIds = new Set(signals.handBufferActionIds ?? []);
  const defenseSupportInstallActionIds = new Set(
    signals.defenseSupportInstallActionIds ?? [],
  );
  return actionCandidates
    .filter((candidate) => {
      if (
        (phase === "fund_tag_clear" || phase === "build_reaction_reserve") &&
        (actionDispositions ?? []).some(
          (entry) => entry.actionId === candidate.actionId,
        )
      ) {
        return false;
      }
      if (phase === "discard_window")
        return signals.discardChoiceBinding?.actionId === candidate.actionId;
      if (
        phase === "forgo_unsafe_run" ||
        phase === "forgo_exhausted_options" ||
        phase === "forgo_terminal_deck_pressure"
      )
        return (
          candidate.semanticActionType === "turn_flow.end_turn" &&
          candidate.sourceKind === "game_rule"
        );
      if (phase === "clear_tags")
        return candidate.semanticActionType === "tag.remove";
      if (phase === "fund_tag_clear")
        return tagClearFundingActionIds.has(candidate.actionId);
      if (phase === "clear_persistent_hazard_counter")
        return (
          candidate.semanticActionType === "counter.remove_trace_tag" ||
          candidate.semanticActionType === "counter.remove_runner_hazard"
        );
      if (phase === "prevent_damage")
        return (
          candidate.semanticActionType.startsWith("damage.prevent") ||
          runnerEffectsProvideDamagePrevention(candidate.functionalEffects)
        );
      if (phase === "install_defense_support")
        return defenseSupportInstallActionIds.has(candidate.actionId);
      if (phase === "build_reaction_reserve")
        return reactionReserveActionIds.has(candidate.actionId);
      return handBufferActionIds.has(candidate.actionId);
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        phase === "prevent_damage"
          ? 100
          : phase === "install_defense_support"
            ? (signals.defenseSupportInstallValues?.[candidate.actionId] ?? 50)
            : phase === "clear_tags"
              ? 80
              : phase === "fund_tag_clear"
                ? 85
                : phase === "clear_persistent_hazard_counter"
                  ? 90
                  : phase === "build_reaction_reserve"
                    ? 70
                    : 20 +
                      Math.max(
                        1,
                        candidate.actionTacticSignals.includes("draw.card") ||
                          candidate.actionTacticSignals.includes("setup.draw")
                          ? 2
                          : 1,
                        candidate.economyProjection?.netHandDelta ??
                          candidate.economyProjection?.cardsDrawn ??
                          1,
                      ),
    }));
}

export function runnerDefenseReactionReserveIsCurrentPhase(params: {
  actionCandidates: readonly ActionSemanticCandidate[];
  stateVersion: number;
  signals: RunnerDefenseSignals;
}): boolean {
  return (
    defensePhase(
      params.actionCandidates,
      params.stateVersion,
      params.signals,
    ) === "build_reaction_reserve"
  );
}

export function runnerDefenseTagClearFundingIsCurrentPhase(params: {
  actionCandidates: readonly ActionSemanticCandidate[];
  stateVersion: number;
  signals: RunnerDefenseSignals;
}): boolean {
  return (
    defensePhase(
      params.actionCandidates,
      params.stateVersion,
      params.signals,
    ) === "fund_tag_clear"
  );
}

function defenseCapability(
  phase: DefenseState["phase"],
  candidates: PlanMaterialization["candidates"],
): PlanRouteStepCapability {
  if (phase === "discard_window")
    return {
      capabilityId: "resolve_plan_bound_runner_discard",
      semanticActionTypes: ["choice.resolve"],
    };
  if (phase === "clear_tags")
    return {
      capabilityId: "remove_active_tags",
      semanticActionTypes: ["tag.remove"],
    };
  if (phase === "fund_tag_clear")
    return {
      capabilityId: "fund_active_tag_removal",
      semanticActionTypes: [
        ...new Set(
          candidates.map((entry) => entry.candidate.semanticActionType),
        ),
      ],
    };
  if (phase === "clear_persistent_hazard_counter")
    return {
      capabilityId: "remove_persistent_runner_hazard_counter",
      semanticActionTypes: [
        "counter.remove_trace_tag",
        "counter.remove_runner_hazard",
      ],
    };
  if (phase === "prevent_damage")
    return {
      capabilityId: "prevent_pending_damage",
      semanticActionTypes: [
        "damage.prevent",
        "damage.prevent_net",
        "damage.prevent_meat",
      ],
    };
  if (phase === "install_defense_support")
    return {
      capabilityId: "install_defense_support",
      semanticActionTypes: ["install.card"],
      legalActionTypes: ["install_card"],
    };
  if (phase === "forgo_unsafe_run")
    return {
      capabilityId: "forgo_unsafe_restricted_run_capacity",
      semanticActionTypes: ["turn_flow.end_turn"],
    };
  if (phase === "forgo_exhausted_options")
    return {
      capabilityId: "forgo_rejected_option_capacity",
      semanticActionTypes: ["turn_flow.end_turn"],
    };
  if (phase === "forgo_terminal_deck_pressure")
    return {
      capabilityId: "forgo_match_point_deck_pressure_capacity",
      semanticActionTypes: ["turn_flow.end_turn"],
    };
  if (phase === "build_reaction_reserve")
    return {
      capabilityId: "build_damage_reaction_reserve",
      semanticActionTypes: [
        ...new Set(
          candidates.map((entry) => entry.candidate.semanticActionType),
        ),
      ],
    };
  return {
    capabilityId: "build_required_hand_buffer",
    semanticActionTypes: [
      ...new Set(candidates.map((entry) => entry.candidate.semanticActionType)),
    ],
  };
}

function defensePhaseValue(
  phase: DefenseState["phase"],
  signals: RunnerDefenseSignals,
): number {
  if (phase === "discard_window") return 1_000;
  if (phase === "prevent_damage") return 100;
  if (phase === "install_defense_support") return 60;
  if (phase === "clear_tags") return 80;
  if (phase === "fund_tag_clear") return 85;
  if (phase === "clear_persistent_hazard_counter") return 90;
  if (phase === "forgo_unsafe_run") return 60;
  if (phase === "forgo_exhausted_options") return 10;
  if (phase === "forgo_terminal_deck_pressure") return 10;
  if (phase === "build_reaction_reserve") return 70;
  return 20 + Math.max(0, signals.minimumHandBuffer - signals.handSize) * 120;
}

function defensePriorityClass(
  signals: RunnerDefenseSignals,
): "P2" | "P3" | "P4" | "P5" {
  if (signals.discardChoiceBinding) return "P2";
  if (
    signals.pendingDamage > 0 ||
    (signals.activeTags > 0 && signals.visibleTagPunish) ||
    signals.persistentHazardCounterRemovalAvailable
  ) {
    return "P2";
  }
  if (signals.reactionReserveNeed) return "P3";
  if ((signals.defenseSupportInstallActionIds?.length ?? 0) > 0) return "P4";
  return signals.handBufferPriorityClass;
}

function validRunnerDefenseFundingNeed(
  need: NonNullable<RunnerDefenseSignals["reactionReserveNeed"]>,
  stateVersion: number,
): boolean {
  return (
    need.needId === "runner-defense-reaction-reserve" &&
    need.parentPlanInstanceId === "plan:runner.defense_and_recovery:runner" &&
    Number.isFinite(need.targetCredits) &&
    Number.isFinite(need.currentCreditsAtRevalidation) &&
    Number.isFinite(need.gap) &&
    need.targetCredits >= 0 &&
    need.currentCreditsAtRevalidation >= 0 &&
    need.gap > 0 &&
    need.gap ===
      Math.max(0, need.targetCredits - need.currentCreditsAtRevalidation) &&
    need.actionIds.length > 0 &&
    need.revalidation.stateVersion === stateVersion &&
    need.revalidation.status === "defense_parent_open"
  );
}

function validRunnerTagClearFundingNeed(
  need: NonNullable<RunnerDefenseSignals["tagClearFundingNeed"]>,
  stateVersion: number,
): boolean {
  return (
    need.needId === "runner-defense-tag-clear-funding" &&
    need.parentPlanInstanceId === "plan:runner.defense_and_recovery:runner" &&
    Number.isFinite(need.targetCredits) &&
    Number.isFinite(need.currentCreditsAtRevalidation) &&
    Number.isFinite(need.gap) &&
    need.targetCredits >= 0 &&
    need.currentCreditsAtRevalidation >= 0 &&
    need.gap > 0 &&
    need.gap ===
      Math.max(0, need.targetCredits - need.currentCreditsAtRevalidation) &&
    need.actionIds.length > 0 &&
    need.revalidation.stateVersion === stateVersion &&
    need.revalidation.status === "defense_parent_open"
  );
}

type PlanRouteStepCapability = PlanMaterialization["step"]["capability"];
