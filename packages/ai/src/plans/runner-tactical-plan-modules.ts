import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  GuaranteeLevel,
  PlanAssessment,
  PriorityClass,
  PriorityClaim,
  ResourceGap,
} from "./plan-assessment";
import type { PlanInstance, PlanProposal } from "./plan-kernel-types";
import type { PlanOutcomeReceipt } from "./resident-plan-portfolio";
import {
  runnerDevelopmentCardAdmission,
  type RunnerCorePlanDomain,
  type RunnerDevelopmentFundingMilestone,
  type RunnerFundingRouteAssessment,
} from "./runner-core-plan-modules";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "./plan-scheduler";
import { PlanResolutionFailure } from "./plan-resolution-failure";
import type { RunnerTargetedBypassCommitment } from "../runtime/runner-targeted-bypass-plan";
import type { RunnerTargetedIceTrashCommitment } from "../runtime/runner-targeted-ice-trash-plan";
import type { RunnerPrerunReserveQuote } from "../run-analysis/runner-run-target-types";
import type { RunnerRunTargetEvaluation } from "../run-analysis/runner-run-target-types";
import { visibleRunnerTraceThreatOnServer } from "../runner/hand-development/runner-persistent-install-evaluation";

export type RunnerRunRiskContractSignal = {
  schemaVersion: "runner-run-risk-contract-v1";
  serverId: string;
  observedAtStateVersion: number;
  runCommitment: "probe_only" | "full_path";
  unrezzedIceRisk: number;
  runnerCreditsAtEntry: number;
  runnerHandCountAtEntry: number;
  visibleDuringRunRezSupport: boolean;
  reserveQuote: RunnerPrerunReserveQuote;
  evidenceCodes: string[];
};

export type RunnerRunRiskReassessmentSignal = {
  schemaVersion: "runner-run-risk-reassessment-v1";
  serverId: string;
  observedAtStateVersion: number;
  decision: "preserve_continuation" | "prefer_jack_out";
  currentUnrezzedIceRisk?: number;
  baselineReserveQuote: RunnerPrerunReserveQuote;
  currentReserveQuote?: RunnerPrerunReserveQuote;
  evidenceCodes: string[];
  failureCode?: "current_server_risk_model_missing";
};

export type RunnerRunActionRouteDiagnostic = {
  rawRouteScore: number;
  opportunityCost: number;
  effectiveRouteScore: number;
};

export type RunnerPressureSignal = {
  pressureId: string;
  serverId: "hq" | "rd" | "archives";
  purpose: "access" | "multiaccess" | "information";
  strategyLineIds: string[];
  priorityClass: "P2" | "P3" | "P4" | "P5" | "P6";
  reachable: boolean;
  marginalValue: number;
  evidenceCode: string;
  sourceDefinitionIds?: string[];
  runActionIds?: string[];
  runActionValues?: Record<string, number>;
  runActionEvidence?: Record<string, string[]>;
  runActionRouteDiagnostics?: Record<string, RunnerRunActionRouteDiagnostic>;
  runActionExclusions?: Record<string, string[]>;
  preparationActionIds?: string[];
  rejectedPreparationActionIds?: string[];
  supportNeedId?: string;
  routePreparation?:
    | "release_run_lock"
    | "develop_payoff"
    | "convert_accumulated_pressure"
    | "targeted_bypass"
    | "targeted_ice_trash";
  targetedBypassCommitment?: RunnerTargetedBypassCommitment;
  targetedIceTrashCommitment?: RunnerTargetedIceTrashCommitment;
  encounterCreditSpendLimit?: number;
  accessCommitment?: RunnerRunAccessCommitmentSignal;
  runRiskContract?: RunnerRunRiskContractSignal;
  informationBoundaryReassessment?: RunnerInformationBoundaryReassessmentSignal;
  accessPayoffCampaign?: {
    payoffCardInstanceId: string;
    payoffDefinitionId: string;
    desiredCopyCount: number;
    installedCopyCount: number;
    selectedCopyOrdinal: number;
    installCost: number;
    fundingTargetCredits: number;
    runFundingTargetCredits: number;
    totalFundingEnvelope: number;
    fundingGap: number;
    reserveFundingOptional: boolean;
    horizon: "same_turn" | "bounded_multi_turn";
    milestone: "fund_install" | "install_payoff";
    blocker?: string;
    evidenceCodes: string[];
  };
};

export type RunnerRemoteContestSignal = {
  contestId: string;
  serverId: string;
  purpose: "contest" | "information";
  knownAgendaThreat: boolean;
  terminalPatternThreat?: boolean;
  reachable: boolean;
  marginalValue: number;
  constrainedActionCapacity?: boolean;
  evidenceCode: string;
  runActionAssessments: Record<
    string,
    {
      verdict: "executable" | "explicitly_nonproductive";
      stepValue: number;
      evidenceCodes: string[];
      routeDiagnostic?: RunnerRunActionRouteDiagnostic;
    }
  >;
  preparationActionIds?: string[];
  supportNeedId?: string;
  routePreparation?:
    | "release_run_lock"
    | "expose_remote"
    | "prepare_access_payoff"
    | "targeted_bypass"
    | "targeted_ice_trash";
  targetedBypassCommitment?: RunnerTargetedBypassCommitment;
  targetedIceTrashCommitment?: RunnerTargetedIceTrashCommitment;
  encounterCreditSpendLimit?: number;
  accessCommitment?: RunnerRunAccessCommitmentSignal;
  runRiskContract?: RunnerRunRiskContractSignal;
  informationBoundaryReassessment?: RunnerInformationBoundaryReassessmentSignal;
};

export type RunnerInformationBoundaryReassessmentSignal = {
  startedAsInformation: true;
  previousPurpose: "access" | "multiaccess" | "information" | "contest";
  nextPurpose: "access" | "information" | "contest";
  decision: "convert_to_access" | "convert_to_contest" | "retain_information";
  boundaryKind: "visible_ice_path_changed";
  observedAtStateVersion: number;
  observedIceInstanceId: string;
  knownPathCost: number;
  knownPathReachable: boolean;
  unknownIceCount: number;
  runnerCreditsBeforeQuote: number;
  creditsAfterKnownPath: number;
  reservedCredits: number;
  fundingGap: number;
  unavoidableHazardCount: number;
  remainingClicks: number;
  encounterBudget: number;
  evidenceCodes: string[];
};

export type RunnerRunAccessCommitmentSignal = {
  payoff:
    | "agenda"
    | "score_threat"
    | "trash_affordable"
    | "trash_unaffordable"
    | "known_low_value"
    | "unknown"
    | "fresh"
    | "access_bonus";
  intendedAction: "steal" | "trash" | "decline" | "access";
  knownTargetDefinitionIds: string[];
  trashBudget: number;
  evidenceCode: string;
};

export type RunnerRestrictedProgramInstallSequenceStep = {
  order: number;
  cardInstanceId: string;
  definitionId: string;
  installCost: number;
  memoryCost: number;
  projectedRunnerCreditsAfter: number;
  projectedMemoryAvailableAfter: number;
  projectedGripCountAfter: number;
  purposeCode: string;
  evidenceCode: string;
};

export type RunnerRestrictedProgramInstallSequenceCommitment = {
  kind: "restricted_program_install_sequence";
  sourceActionId: string;
  sourceCardInstanceId: string;
  sourceDefinitionId: string;
  plannedAtStateVersion: number;
  runnerCreditsBeforeOpening: number;
  grantedActionCount: number;
  temporaryInstallCredits: number;
  minimumCreditFloor: number;
  minimumHandBuffer: number;
  ordinaryClicksAfterOpening: number;
  targetSteps: RunnerRestrictedProgramInstallSequenceStep[];
  admissionReason:
    | "multiple_productive_programs"
    | "acute_temporary_credit_bridge";
  evidenceCodes: string[];
};

export type RunnerDevelopmentSignal = {
  developmentId: string;
  definitionId: string;
  targetKind?: "card" | "capability";
  phase:
    | "execute"
    | "fund"
    | "prepare_restricted_sequence"
    | "open_restricted_sequence"
    | "execute_restricted_sequence"
    | "complete_restricted_sequence"
    | "resolve_event_install_choice";
  purposeCode?: string;
  assignedDomainPlanIds: string[];
  duplicateAlreadyInstalled: boolean;
  affordableOrSupportable: boolean;
  semanticActionTypes: string[];
  actionIds: string[];
  fundingGap?: number;
  supportNeedId?: string;
  developmentFundingMilestone?: RunnerDevelopmentFundingMilestone;
  fundingRouteActionIds?: string[];
  fundingRouteAssessment?: RunnerFundingRouteAssessment;
  priorityClass: "P3" | "P4" | "P5" | "P6";
  value: number;
  evidenceCode: string;
  evidenceCodes?: string[];
  restrictedProgramInstallCommitment?: RunnerRestrictedProgramInstallSequenceCommitment;
  eventInstallChoiceCommitment?: {
    sourceActionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    sourceCapabilityKey: string;
    selectedAtStateVersion?: number;
    targetCardInstanceId: string;
    targetDefinitionId: string;
  };
  eventInstallChoiceBinding?: {
    choiceId: string;
    actionId: string;
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    sourceCapabilityKey: string;
    sourceStateVersion: number;
    originSelectedAtStateVersion: number;
    selectedOptionId: string;
    targetCardInstanceId: string;
    targetDefinitionId: string;
  };
  programSearchCommitment?: {
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    targetDefinitionId: string;
    targetPurpose:
      | "recurring_breaker_economy"
      | "memory_support"
      | "rd_pressure_support"
      | "hq_pressure_support";
    plannedAtStateVersion: number;
    selectedActionId?: string;
    selectedAtStateVersion?: number;
  };
  recoverySearchCommitment?: {
    sourceCardInstanceId: string;
    sourceDefinitionId: string;
    searchFilter: "program" | "any_card";
    targetCardInstanceId: string;
    targetDefinitionId: string;
    targetPurpose: "generic_heap_recovery";
    plannedAtStateVersion: number;
    selectedActionId?: string;
    selectedAtStateVersion?: number;
  };
};

export type RunnerRunWindowSignal = {
  windowId: string;
  serverId?: string;
  rootPlanInstanceId: string;
  leafPlanInstanceId: string;
  semanticActionTypes: string[];
  purposeCode: string;
  evidenceCode: string;
  accessCommitment?: RunnerRunAccessCommitmentSignal;
  runRiskReassessment?: RunnerRunRiskReassessmentSignal;
  safetyIntent?: "jack_out";
  safetyEvidenceCode?: string;
  encounterIntent?: "mitigate_threat";
  encounterEvidenceCode?: string;
  actionAssessments?: Record<string, RunnerRunWindowActionAssessment>;
};

export type RunnerRunWindowActionAssessment = {
  admissible: boolean;
  value?: number;
  evidenceCodes: string[];
};

export type RunnerExposeInformationSignal = {
  kind: "run_window" | "proactive";
  informationId: string;
  rootPlanInstanceId?: string;
  parentPlanInstanceId?: string;
  serverId?: string;
  runId?: string;
  sourceCardInstanceId: string;
  sourceDefinitionId?: string;
  targetIceInstanceId?: string;
  targetPositionKeys?: string[];
  phase:
    | "expose_unknown_ice"
    | "decline_known_ice"
    | "play_information_event"
    | "install_information_tool"
    | "defer_known_information";
  selectedActionId: string;
  actionIds?: string[];
  rejectedActionIds: string[];
  admissible: boolean;
  evidenceCodes: string[];
};

export type RunnerTerminalWinSignal = {
  terminalId: string;
  semanticActionTypes: string[];
  evidenceCode: string;
};

export type RunnerTacticalPlanDomain = {
  terminalWins: RunnerTerminalWinSignal[];
  centralPressure: RunnerPressureSignal[];
  remoteContests: RunnerRemoteContestSignal[];
  developments: RunnerDevelopmentSignal[];
  exposeInformation: RunnerExposeInformationSignal[];
  runWindows: RunnerRunWindowSignal[];
  runTargetEvaluations?: RunnerRunTargetEvaluation[];
};

export type RunnerPlanDomain = RunnerCorePlanDomain & RunnerTacticalPlanDomain;

type PressureState = {
  kind: "central_pressure";
  signal: RunnerPressureSignal;
};
type RemoteState = {
  kind: "remote_contest";
  signal: RunnerRemoteContestSignal;
};
type DevelopmentState = {
  kind: "development";
  signal: RunnerDevelopmentSignal;
};
type RunWindowState = {
  kind: "run_window";
  signal: RunnerRunWindowSignal;
};
type ExposeInformationState = {
  kind: "expose_information";
  signal: RunnerExposeInformationSignal;
};
type TerminalWinState = {
  kind: "terminal_win";
  signal: RunnerTerminalWinSignal;
};

export function createRunnerTacticalPlanModules(): PlanModule[] {
  return [
    terminalWinModule(),
    centralPressureModule(),
    remoteContestModule(),
    developmentModule(),
    exposeInformationModule(),
    runWindowModule(),
  ];
}

function terminalWinModule(): PlanModule {
  return {
    moduleId: "runner.secure_terminal_win",
    side: "runner",
    discover: (context) =>
      domain(context).terminalWins.map((signal) => {
        const candidates = terminalWinCandidates(context, signal);
        return proposal(
          "runner.secure_terminal_win",
          signal.terminalId,
          { kind: "terminal_win", signal } satisfies TerminalWinState,
          "P1",
          [],
          { kind: "player", id: "corp" },
          candidates.length > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<TerminalWinState>(instance);
      return assessment(
        instance,
        "P1",
        terminalWinCandidates(context, current.signal).length > 0,
        1,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<TerminalWinState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:force_terminal`,
          capability: {
            capabilityId: "force_corp_mandatory_draw_deckout",
            semanticActionTypes: current.signal.semanticActionTypes,
          },
          purpose:
            "End the Runner turn to force the rules-proven empty-R&D mandatory draw.",
        },
        candidates: terminalWinCandidates(context, current.signal),
        earlyEndTurnJustification: {
          kind: "rules_proven_terminal_win",
          terminalCondition: "corp_empty_rd_mandatory_draw",
        },
      };
    },
  };
}

export function runnerPressureProgressReceipt(params: {
  planInstanceId: string;
  stateVersionBefore: number;
  stateVersionAfter: number;
  previousCounter: number;
  currentCounter: number;
  accessConverted: boolean;
  corpPurged: boolean;
}): PlanOutcomeReceipt {
  if (params.corpPurged) {
    return {
      planInstanceId: params.planInstanceId,
      stateVersionBefore: params.stateVersionBefore,
      stateVersionAfter: params.stateVersionAfter,
      progress: "regression",
      progressValue: 0,
      milestoneAfter: "counter_reset_by_corp_purge",
      reasonCode: "corp_purge_observed",
    };
  }
  const realProgress =
    params.accessConverted && params.currentCounter > params.previousCounter;
  return {
    planInstanceId: params.planInstanceId,
    stateVersionBefore: params.stateVersionBefore,
    stateVersionAfter: params.stateVersionAfter,
    progress: realProgress ? "progress" : "no_progress",
    progressValue: realProgress
      ? params.currentCounter
      : params.previousCounter,
    milestoneAfter: realProgress
      ? "access_conversion_observed"
      : "no_real_conversion",
    reasonCode: realProgress
      ? "highlighter_counter_increased_after_access"
      : "counter_did_not_increase",
  };
}

export function runnerVoluntaryActionFamilyOwner(
  candidate: ActionSemanticCandidate,
  planDomain: RunnerPlanDomain,
): PlanModule["moduleId"] | undefined {
  if (candidate.semanticActionType === "turn_flow.end_turn") {
    return planDomain.terminalWins.length > 0
      ? "runner.secure_terminal_win"
      : undefined;
  }
  if (candidate.semanticActionType === "economy.gain_credit") {
    if (
      planDomain.defense.reactionReserveNeed?.actionIds.includes(
        candidate.actionId,
      ) === true
    ) {
      return "runner.defense_and_recovery";
    }
    if (
      planDomain.coverageGaps.some(
        (gap) => gap.answerInHand && (gap.fundingGap ?? 0) > 0,
      )
    ) {
      return "runner.rig_and_coverage";
    }
    return planDomain.fundingNeeds.some((need) => need.gap > 0)
      ? "runner.economy"
      : undefined;
  }
  if (
    planDomain.coverageGaps.some((gap) =>
      [
        ...gap.directSearchActionIds,
        ...(gap.rejectedSearchActionIds ?? []),
        ...gap.searchEngineSetupActionIds,
        ...gap.drawForAnswerActionIds,
      ].includes(candidate.actionId),
    )
  ) {
    return "runner.rig_and_coverage";
  }
  if (
    candidate.semanticActionType === "tag.remove" ||
    candidate.semanticActionType === "counter.remove_trace_tag" ||
    candidate.semanticActionType === "counter.remove_runner_hazard" ||
    planDomain.defense.handBufferActionIds?.includes(candidate.actionId) ===
      true ||
    candidate.semanticActionType.startsWith("damage.prevent")
  )
    return "runner.defense_and_recovery";
  if (
    planDomain.exposeInformation.some(
      (signal) =>
        (signal.actionIds ?? [signal.selectedActionId]).includes(
          candidate.actionId,
        ) || signal.rejectedActionIds.includes(candidate.actionId),
    )
  ) {
    return "runner.expose_information";
  }
  if (
    planDomain.runWindows.some(
      (window) => window.actionAssessments?.[candidate.actionId] !== undefined,
    )
  ) {
    return "runner.convert_run_window";
  }
  if (
    candidate.semanticActionType === "run.start" ||
    candidate.runProjectionSummary?.serverId !== undefined
  ) {
    if (planDomain.defense.forgoUnsafeRunCapacity) {
      return "runner.defense_and_recovery";
    }
    const server = candidate.runProjectionSummary?.serverId;
    if (
      server &&
      planDomain.remoteContests.some((signal) => signal.serverId === server)
    )
      return "runner.contest_remote";
    if (
      server &&
      planDomain.centralPressure.some((signal) => signal.serverId === server)
    )
      return "runner.pressure_central";
    return undefined;
  }
  if (
    candidate.semanticActionType.startsWith("access.") ||
    candidate.semanticActionType === "run.continue" ||
    candidate.semanticActionType === "run.jack_out"
  ) {
    return planDomain.runWindows.length > 0
      ? "runner.convert_run_window"
      : undefined;
  }
  if (
    candidate.semanticActionType === "install.card" ||
    candidate.semanticActionType === "play.runner_event" ||
    candidate.semanticActionType === "card_ability.trigger"
  ) {
    if (
      planDomain.centralPressure.some((signal) =>
        signal.preparationActionIds?.includes(candidate.actionId),
      )
    ) {
      return "runner.pressure_central";
    }
    if (
      planDomain.developments.some((signal) =>
        signal.actionIds.includes(candidate.actionId),
      )
    )
      return "runner.develop_board_and_hand";
  }
  if (candidate.semanticActionType === "draw.card") {
    if (
      planDomain.developments.some((signal) =>
        signal.actionIds.includes(candidate.actionId),
      )
    ) {
      return "runner.develop_board_and_hand";
    }
    const concreteDrawPurpose =
      planDomain.coverageGaps.some((gap) => gap.deckHasAnswer) ||
      planDomain.defense.handSize < planDomain.defense.minimumHandBuffer;
    return concreteDrawPurpose ? "runner.defense_and_recovery" : undefined;
  }
  return undefined;
}

function exposeInformationModule(): PlanModule {
  return {
    moduleId: "runner.expose_information",
    side: "runner",
    discover: (context) =>
      domain(context).exposeInformation.map((signal) =>
        proposal(
          "runner.expose_information",
          signal.informationId,
          {
            kind: "expose_information",
            signal,
          } satisfies ExposeInformationState,
          "P3",
          [],
          {
            kind: "card",
            id: signal.targetIceInstanceId ?? signal.sourceCardInstanceId,
          },
          exposeInformationCandidates(context, signal).length > 0,
          signal.evidenceCodes[0] ?? "runner_expose_information_exact_window",
          signal.parentPlanInstanceId,
          {
            phase: signal.phase,
            evidenceCodes: signal.evidenceCodes,
          },
        ),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<ExposeInformationState>(instance);
      return assessment(
        instance,
        "P3",
        exposeInformationCandidates(context, current.signal).length > 0,
        current.signal.phase === "expose_unknown_ice"
          ? 300
          : current.signal.phase === "decline_known_ice"
            ? 200
            : 240,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<ExposeInformationState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: current.signal.phase,
            semanticActionTypes:
              current.signal.kind === "run_window"
                ? ["card_ability.trigger"]
                : current.signal.phase === "install_information_tool"
                  ? ["install.card"]
                  : ["play.runner_event"],
          },
          purpose:
            current.signal.phase === "expose_unknown_ice"
              ? "Expose the exact approached unknown ICE once before rez."
              : current.signal.phase === "decline_known_ice"
                ? "Decline a repeated expose because the exact approached ICE is already known."
                : current.signal.phase === "install_information_tool"
                  ? "Install an information tool while unknown ICE remains."
                  : "Expose currently unknown installed Corp cards.",
        },
        candidates: exposeInformationCandidates(context, current.signal),
      };
    },
  };
}

function centralPressureModule(): PlanModule {
  return {
    moduleId: "runner.pressure_central",
    side: "runner",
    discover: (context) =>
      domain(context).centralPressure.map((signal) => {
        const candidates = pressureCandidates(context, signal);
        return proposal(
          "runner.pressure_central",
          signal.pressureId,
          { kind: "central_pressure", signal } satisfies PressureState,
          signal.priorityClass,
          signal.strategyLineIds,
          { kind: "server", id: signal.serverId },
          (signal.supportNeedId !== undefined ||
            (signal.reachable && candidates.length > 0)) &&
            signal.marginalValue > 0,
          signal.evidenceCode,
          undefined,
          signal.routePreparation === "develop_payoff" ||
            signal.routePreparation === "convert_accumulated_pressure" ||
            signal.routePreparation === "targeted_bypass" ||
            signal.routePreparation === "targeted_ice_trash"
            ? {
                phase: "develop_payoff",
                blockerCode: "central_pressure_payoff_route_unavailable",
                evidenceCodes: [
                  `central_pressure_preparation_actions:${signal.preparationActionIds?.length ?? 0}`,
                ],
              }
            : undefined,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<PressureState>(instance);
      const candidates = pressureCandidates(context, current.signal);
      const routeExists =
        current.signal.reachable &&
        current.signal.marginalValue > 0 &&
        candidates.length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        current.signal.priorityClass,
        routeExists,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
        undefined,
        current.signal.routePreparation === "targeted_bypass"
          ? "belief_supported"
          : "visible_state_forced",
        resourceGaps,
      );
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<PressureState>(instance);
      const candidates = pressureCandidates(context, current.signal);
      return {
        step: {
          stepId: `${instance.instanceId}:pressure:${current.signal.serverId}`,
          capability: {
            capabilityId:
              (current.signal.routePreparation === "develop_payoff" ||
                current.signal.routePreparation ===
                  "convert_accumulated_pressure" ||
                current.signal.routePreparation === "targeted_bypass" ||
                current.signal.routePreparation === "targeted_ice_trash") &&
              current.signal.sourceDefinitionIds?.[0]
                ? current.signal.routePreparation ===
                  "convert_accumulated_pressure"
                  ? "central_pressure_convert_accumulated_pressure"
                  : `develop_${current.signal.sourceDefinitionIds[0]}`
                : `pressure_${current.signal.serverId}_${current.signal.purpose}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map(
                  (candidate) => candidate.candidate.semanticActionType,
                ),
              ),
            ],
            ...(current.signal.routePreparation === "targeted_bypass"
              ? {
                  requiredFunctionalEffects: [
                    {
                      kind: "future_run_effect" as const,
                      timing: "action" as const,
                      scope: "server" as const,
                      target: "make_run",
                    },
                    {
                      kind: "future_encounter_effect" as const,
                      timing: "during_run" as const,
                      scope: "ice" as const,
                      target: "bypass_chosen_ice",
                    },
                  ],
                }
              : current.signal.routePreparation === "develop_payoff" &&
                  current.signal.sourceDefinitionIds
                ? {
                    requiredSourceDefinitionIds:
                      current.signal.sourceDefinitionIds,
                  }
                : current.signal.routePreparation === "targeted_ice_trash" &&
                    current.signal.sourceDefinitionIds
                  ? {
                      requiredSourceDefinitionIds:
                        current.signal.sourceDefinitionIds,
                    }
                  : {}),
          },
          ...(current.signal.routePreparation ||
          (current.signal.runActionIds?.length ?? 0) > 0
            ? {}
            : {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }),
          purpose:
            current.signal.routePreparation === "targeted_bypass"
              ? `Execute the preflighted targeted bypass route on ${current.signal.serverId}.`
              : current.signal.routePreparation === "targeted_ice_trash"
                ? `Remove the preflighted rezzed ICE target from ${current.signal.serverId}.`
                : current.signal.routePreparation ===
                    "convert_accumulated_pressure"
                  ? "Convert the accumulated multi-central pressure into its current action-denial payoff."
                  : current.signal.routePreparation === "develop_payoff"
                    ? `Develop ${current.signal.purpose} payoff for ${current.signal.serverId}.`
                    : `Execute ${current.signal.purpose} pressure on ${current.signal.serverId}.`,
        },
        candidates,
        ...(current.signal.routePreparation === "develop_payoff"
          ? {
              continuation: {
                continuationId: `${instance.instanceId}:access-payoff:${current.signal.serverId}`,
                trigger: "action_applied" as const,
                nextCapability: {
                  capabilityId: `pressure_${current.signal.serverId}_access`,
                  semanticActionTypes: ["run.start"],
                },
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
                purpose: `Convert the installed access payoff into pressure on ${current.signal.serverId}.`,
              },
            }
          : {}),
      };
    },
  };
}

function remoteContestModule(): PlanModule {
  return {
    moduleId: "runner.contest_remote",
    side: "runner",
    discover: (context) =>
      domain(context).remoteContests.map((signal) => {
        const candidates = remoteCandidates(context, signal);
        return proposal(
          "runner.contest_remote",
          signal.contestId,
          { kind: "remote_contest", signal } satisfies RemoteState,
          remotePriority(signal),
          [],
          { kind: "server", id: signal.serverId },
          (signal.supportNeedId !== undefined ||
            (signal.reachable && candidates.length > 0)) &&
            signal.marginalValue > 0,
          signal.evidenceCode,
        );
      }),
    assess: (instance, context, portfolio) => {
      const current = state<RemoteState>(instance);
      const priorityClass = remotePriority(current.signal);
      const routeExists =
        current.signal.reachable &&
        current.signal.marginalValue > 0 &&
        remoteCandidates(context, current.signal).length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        priorityClass,
        routeExists,
        current.signal.marginalValue,
        portfolio.executorInstanceId,
        current.signal.knownAgendaThreat || current.signal.terminalPatternThreat
          ? "score_threat"
          : undefined,
        current.signal.routePreparation === "targeted_bypass"
          ? "belief_supported"
          : current.signal.terminalPatternThreat
            ? "robust_but_reactive"
            : "visible_state_forced",
        resourceGaps,
      );
      if (priorityClass === "P4") {
        result.intentFit = "tactical_override";
      }
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RemoteState>(instance);
      const candidates = remoteCandidates(context, current.signal);
      return {
        step: {
          stepId: `${instance.instanceId}:contest`,
          capability: {
            capabilityId: "contest_remote",
            semanticActionTypes: [
              ...new Set(
                candidates.map(
                  (candidate) => candidate.candidate.semanticActionType,
                ),
              ),
            ],
          },
          ...(current.signal.routePreparation
            ? {}
            : {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }),
          purpose: `Contest visible remote ${current.signal.serverId}.`,
        },
        candidates,
      };
    },
  };
}

function remotePriority(signal: RunnerRemoteContestSignal): "P2" | "P4" | "P6" {
  if (
    (signal.knownAgendaThreat || signal.terminalPatternThreat) &&
    signal.routePreparation !== "targeted_bypass"
  )
    return "P2";
  return signal.constrainedActionCapacity ? "P6" : "P4";
}

function developmentModule(): PlanModule {
  return {
    moduleId: "runner.develop_board_and_hand",
    side: "runner",
    discover: (context) =>
      domain(context).developments.flatMap((signal) => {
        const admission = runnerDevelopmentCardAdmission({
          definitionId: signal.definitionId,
          assignedDomainPlanIds: signal.assignedDomainPlanIds,
          ...(signal.purposeCode
            ? { concretePurposeCode: signal.purposeCode }
            : {}),
          duplicateAlreadyInstalled: signal.duplicateAlreadyInstalled,
          affordableOrSupportable: signal.affordableOrSupportable,
        });
        if (!admission.admitted) return [];
        const candidates = developmentCandidates(context, signal);
        return [
          proposal(
            "runner.develop_board_and_hand",
            signal.developmentId,
            { kind: "development", signal } satisfies DevelopmentState,
            signal.priorityClass,
            signal.assignedDomainPlanIds,
            {
              kind: signal.targetKind ?? "card",
              id: signal.definitionId,
            },
            signal.supportNeedId !== undefined || candidates.length > 0,
            `${signal.evidenceCode}:${admission.reasonCode}`,
            undefined,
            {
              phase: signal.phase,
              blockerCode:
                signal.phase === "fund"
                  ? "development_funding_route_unavailable_this_turn"
                  : signal.phase === "prepare_restricted_sequence"
                    ? "productive_program_bundle_not_ready"
                    : "development_action_route_unavailable",
              ...(signal.evidenceCodes
                ? { evidenceCodes: signal.evidenceCodes }
                : {}),
            },
          ),
        ];
      }),
    assess: (instance, context, portfolio) => {
      const current = state<DevelopmentState>(instance);
      const routeExists =
        developmentCandidates(context, current.signal).length > 0;
      const resourceGaps = exactRunnerParentSupportResourceGaps(
        context,
        instance,
        current.signal.supportNeedId,
        routeExists,
      );
      const result = assessment(
        instance,
        current.signal.priorityClass,
        routeExists,
        current.signal.value,
        portfolio.executorInstanceId,
        undefined,
        "visible_state_forced",
        resourceGaps,
      );
      if (!routeExists && current.signal.supportNeedId) {
        result.blockers = [
          {
            code: "waiting_for_bound_funding_support",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: current.signal.supportNeedId },
          },
        ];
      }
      return result;
    },
    materialize: (instance, _assessment, context) => {
      const current = state<DevelopmentState>(instance);
      const funding = current.signal.phase === "fund";
      const preparingRestrictedSequence =
        current.signal.phase === "prepare_restricted_sequence";
      const openingRestrictedSequence =
        current.signal.phase === "open_restricted_sequence";
      const executingRestrictedSequence =
        current.signal.phase === "execute_restricted_sequence";
      const completingRestrictedSequence =
        current.signal.phase === "complete_restricted_sequence";
      const resolvingEventInstallChoice =
        current.signal.phase === "resolve_event_install_choice";
      return {
        step: {
          stepId: `${instance.instanceId}:${current.signal.phase}`,
          capability: {
            capabilityId: preparingRestrictedSequence
              ? "prepare_productive_program_install_sequence"
              : openingRestrictedSequence
                ? "open_committed_program_install_sequence"
                : executingRestrictedSequence
                  ? "execute_next_committed_program_install"
                  : completingRestrictedSequence
                    ? "complete_committed_program_install_sequence"
                    : resolvingEventInstallChoice
                      ? "resolve_bound_event_install_choice"
                      : funding
                        ? `fund_${current.signal.definitionId}`
                        : `develop_${current.signal.definitionId}`,
            semanticActionTypes: current.signal.semanticActionTypes,
            ...(funding ||
            openingRestrictedSequence ||
            executingRestrictedSequence ||
            completingRestrictedSequence ||
            resolvingEventInstallChoice ||
            current.signal.targetKind === "capability"
              ? {}
              : {
                  requiredSourceDefinitionIds: [current.signal.definitionId],
                }),
          },
          ...(funding ||
          openingRestrictedSequence ||
          executingRestrictedSequence ||
          completingRestrictedSequence ||
          resolvingEventInstallChoice ||
          current.signal.targetKind === "capability"
            ? {}
            : {
                target: {
                  kind: "card" as const,
                  id: current.signal.definitionId,
                },
              }),
          purpose: openingRestrictedSequence
            ? "Open a Valu-Pak sequence only for a concrete, resource-feasible ordered program-install commitment."
            : preparingRestrictedSequence
              ? "Keep Valu-Pak resident while waiting for a concrete bundle of currently meaningful, jointly feasible programs."
              : executingRestrictedSequence
                ? "Execute the next program in the committed Valu-Pak installation order."
                : completingRestrictedSequence
                  ? "Close the completed Valu-Pak installation sequence without ending the Runner turn."
                  : resolvingEventInstallChoice
                    ? "Resolve the Engine-opened event install choice from the exact resident development-plan target binding."
                    : funding
                      ? `Fund the resident ${current.signal.definitionId} development plan.`
                      : `Develop ${current.signal.definitionId} for ${current.signal.purposeCode ?? "assigned domain plan"}.`,
        },
        candidates: developmentCandidates(context, current.signal),
      };
    },
  };
}

function runWindowModule(): PlanModule {
  return {
    moduleId: "runner.convert_run_window",
    side: "runner",
    discover: (context) =>
      domain(context).runWindows.map((signal) =>
        proposal(
          "runner.convert_run_window",
          signal.windowId,
          { kind: "run_window", signal } satisfies RunWindowState,
          "P3",
          [],
          { kind: "window", id: signal.windowId },
          runWindowCandidates(context, signal).length > 0,
          signal.evidenceCode,
          signal.rootPlanInstanceId,
        ),
      ),
    assess: (instance, context, portfolio) => {
      const current = state<RunWindowState>(instance);
      return assessment(
        instance,
        "P3",
        runWindowCandidates(context, current.signal).length > 0,
        100,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = state<RunWindowState>(instance);
      return {
        step: {
          stepId: `${instance.instanceId}:convert`,
          capability: {
            capabilityId: current.signal.purposeCode,
            semanticActionTypes: current.signal.semanticActionTypes,
          },
          ...(current.signal.serverId
            ? {
                target: {
                  kind: "server" as const,
                  id: current.signal.serverId,
                },
              }
            : {}),
          purpose: `Convert run window ${current.signal.windowId}.`,
        },
        candidates: runWindowCandidates(context, current.signal),
      };
    },
  };
}

function proposal(
  moduleId: PlanProposal["moduleId"],
  dedupeKey: string,
  moduleState: unknown,
  priorityClass: PriorityClass,
  strategyLineIds: string[],
  target: NonNullable<PlanProposal["target"]>,
  routeExists: boolean,
  evidenceCode: string,
  parentInstanceId?: string,
  options?: {
    phase?: string;
    blockerCode?: string;
    evidenceCodes?: string[];
  },
): PlanProposal {
  return {
    moduleId,
    moduleVersion: "1",
    dedupeKey,
    side: "runner",
    strategyLineIds,
    executionClass:
      priorityClass === "P1" || priorityClass === "P2"
        ? "urgent_response"
        : priorityClass === "P3"
          ? "bounded_sequence"
          : "strategic_campaign",
    initialViability: routeExists ? "ready" : "blocked",
    persistencePolicy:
      priorityClass === "P1" || priorityClass === "P3"
        ? "locked_sequence"
        : "sticky_goal",
    retentionPolicy: {
      blockedStateVersionTtl: 2,
      dormantStateVersionTtl: 2,
      completedHistoryStateVersionTtl: 4,
      abandonWhenTargetMissing: true,
      protectedWhileNeedOpen: true,
      protectedWhileCommitted: true,
    },
    target,
    ...(parentInstanceId ? { parentInstanceId } : {}),
    phase: options?.phase ?? "execute",
    milestone: "admitted",
    moduleState: structuredClone(moduleState),
    blockers: routeExists
      ? []
      : [
          {
            code: options?.blockerCode ?? "no_current_tactical_route",
            owner: "plan_module",
            removable: true,
            resumeCondition: { code: "route_becomes_available" },
          },
        ],
    resumeConditions: [{ code: "route_becomes_available" }],
    completionConditions: [{ code: "purpose_converted" }],
    abandonmentConditions: [
      { code: "target_invalidated" },
      { code: "marginal_value_exhausted" },
    ],
    evidenceRefs: [
      { code: evidenceCode, source: "visible_state" },
      ...(options?.evidenceCodes ?? []).map((code) => ({
        code,
        source: "visible_state" as const,
      })),
    ],
  };
}

function assessment(
  instance: PlanInstance,
  priorityClass: "P1" | "P2" | "P3" | "P4" | "P5" | "P6",
  routeExists: boolean,
  value: number,
  executorId: string | undefined,
  p2Reason: "score_threat" | undefined = undefined,
  guarantee: GuaranteeLevel = "visible_state_forced",
  resourceGaps: readonly ResourceGap[] = [],
): PlanAssessment {
  const claim: PriorityClaim =
    priorityClass === "P1"
      ? {
          requestedClass: "P1",
          reasonCode: "terminal_win",
          horizon: "current_turn",
          witness: {
            kind: "terminal_path",
            evidenceCode:
              instance.evidenceRefs[0]?.code ?? "rules_proven_terminal_path",
            guarantee: "rules_proven",
            ...(instance.target ? { target: instance.target } : {}),
          },
        }
      : priorityClass === "P2"
        ? {
            requestedClass: "P2",
            reasonCode: p2Reason ?? "irreversible_threat",
            horizon: "current_turn",
            witness: {
              kind:
                p2Reason === "score_threat"
                  ? "score_threat"
                  : "irreversible_threat",
              evidenceCode: instance.evidenceRefs[0]?.code ?? "visible_threat",
              guarantee,
              ...(instance.target ? { target: instance.target } : {}),
            },
          }
        : priorityClass === "P3"
          ? {
              requestedClass: "P3",
              reasonCode: "expiring_conversion",
              horizon: "current_window",
            }
          : priorityClass === "P4"
            ? {
                requestedClass: "P4",
                reasonCode: "strategic_campaign",
                horizon: "multi_turn",
              }
            : priorityClass === "P5"
              ? {
                  requestedClass: "P5",
                  reasonCode: "development_need",
                  horizon: "multi_turn",
                }
              : {
                  requestedClass: "P6",
                  reasonCode: "neutral_progress",
                  horizon: "current_turn",
                };
  return {
    instanceId: instance.instanceId,
    side: "runner",
    priorityClaim: claim,
    intentFit:
      priorityClass === "P4" || priorityClass === "P5" ? "aligned" : "none",
    readiness: routeExists
      ? "executable_now"
      : resourceGaps.length > 0
        ? "executable_with_support"
        : "blocked",
    ...(routeExists
      ? {
          nextStepPreview: {
            stepId: `${instance.instanceId}:execute`,
            capability: instance.moduleId,
            purpose: "Execute admitted tactical purpose.",
          },
        }
      : {}),
    feasibility: {
      currentRouteHeadPossible: routeExists,
      projectedActionCount: routeExists
        ? 1
        : resourceGaps.length > 0
          ? resourceGaps.length + 1
          : 0,
      opponentCanReact: priorityClass !== "P3",
      confidence: guarantee,
    },
    resourceGaps: resourceGaps.map((gap) => ({ ...gap })),
    expectedOutcome: {
      outcomeKind: "tactical_progress",
      minimumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      expectedValue: routeExists || resourceGaps.length > 0 ? value : 0,
      maximumValue: routeExists || resourceGaps.length > 0 ? value : 0,
      terminal: false,
      guarantee,
    },
    continuity: {
      isCurrentForeground: executorId === instance.instanceId,
      sameObjectiveAsForeground: executorId === instance.instanceId,
      switchingCost: executorId === instance.instanceId ? 2 : 0,
      progressAtRisk: executorId === instance.instanceId ? 2 : 0,
    },
    blockers:
      routeExists || resourceGaps.length > 0
        ? []
        : structuredClone(instance.blockers),
    withinClassValue: value,
    evidenceCodes: instance.evidenceRefs.map((entry) => entry.code),
  };
}

function exactRunnerParentSupportResourceGaps(
  context: PlanSchedulerContext,
  parent: PlanInstance,
  supportNeedId: string | undefined,
  currentRouteExists: boolean,
): ResourceGap[] {
  // A bound support need describes why the parent had no route. Once the
  // parent owns an executable route again, that historical need must not also
  // classify the same assessment as support-dependent.
  if (currentRouteExists) return [];
  if (supportNeedId === undefined) return [];
  const exactNeeds = domain(context).fundingNeeds.filter(
    (
      need,
    ): need is Extract<
      RunnerCorePlanDomain["fundingNeeds"][number],
      { kind: "parent_plan_support" }
    > =>
      need.kind === "parent_plan_support" &&
      need.needId === supportNeedId &&
      need.parentPlanInstanceId === parent.instanceId &&
      need.gap > 0,
  );
  if (exactNeeds.length === 1) {
    const [need] = exactNeeds;
    if (!need) return [];
    return [
      {
        needId: need.needId,
        capability: "credits",
        minimum: need.gap,
        available: 0,
        deadline:
          need.driver.kind === "development" ? "multi_turn" : "current_turn",
      },
    ];
  }
  const coverageGaps = domain(context).coverageGaps.filter(
    (gap) =>
      gap.gapId === supportNeedId &&
      gap.requesterPlanInstanceId === parent.instanceId &&
      gap.requesterNeedId === supportNeedId,
  );
  if (coverageGaps.length !== 1) return [];
  return [
    {
      needId: supportNeedId,
      capability: coverageGaps[0]!.requiredRole,
      minimum: 1,
      available: 0,
      deadline: "current_turn",
    },
  ];
}

function pressureCandidates(
  context: PlanSchedulerContext,
  signal: RunnerPressureSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.routePreparation === "develop_payoff" ||
    signal.routePreparation === "convert_accumulated_pressure" ||
    signal.routePreparation === "targeted_bypass" ||
    signal.routePreparation === "targeted_ice_trash"
  ) {
    const preparationActionIds = new Set(signal.preparationActionIds ?? []);
    return context.actionCandidates
      .filter((candidate) => preparationActionIds.has(candidate.actionId))
      .map((candidate) => ({
        candidate,
        stepValue: signal.marginalValue,
      }));
  }
  const runCandidates = context.actionCandidates.filter(
    (candidate) =>
      (signal.runActionIds?.length
        ? signal.runActionIds.includes(candidate.actionId)
        : (candidate.semanticActionType === "run.start" &&
            candidate.runProjectionSummary?.serverId === signal.serverId) ||
          (candidate.semanticActionType === "play.runner_event" &&
            candidate.sourceDefinitionId !== undefined &&
            candidate.runProjectionSummary?.serverId === signal.serverId &&
            (signal.sourceDefinitionIds ?? []).includes(
              candidate.sourceDefinitionId,
            ))) &&
      (signal.runActionExclusions?.[candidate.actionId]?.length ?? 0) === 0 &&
      signal.reachable &&
      signal.marginalValue > 0,
  );
  const directRunAvailable = runCandidates.some(
    (candidate) => candidate.semanticActionType === "run.start",
  );
  return runCandidates
    .filter(
      (candidate) =>
        candidate.semanticActionType !== "play.runner_event" ||
        !directRunAvailable ||
        runnerCardRunHasVisibleDifferentialPayoff(
          context.input,
          candidate,
          signal.serverId,
          domain(context).runTargetEvaluations,
        ),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.marginalValue +
        runnerCardRunRoutePreference(
          context,
          candidate,
          signal.serverId,
          directRunAvailable,
          domain(context).runTargetEvaluations,
        ) +
        (signal.runActionValues?.[candidate.actionId] ?? 0),
    }));
}

function runnerCardRunRoutePreference(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  serverId: RunnerPressureSignal["serverId"],
  directRunAvailable: boolean,
  runTargetEvaluations?: readonly RunnerRunTargetEvaluation[],
): number {
  if (candidate.semanticActionType !== "play.runner_event") return 0;
  if (
    !directRunAvailable ||
    runnerCardRunHasVisibleDifferentialPayoff(
      context.input,
      candidate,
      serverId,
      runTargetEvaluations,
    )
  ) {
    return 5;
  }
  const knownCreditCost =
    candidate.costProfile.costKnownStatus === "known" &&
    Number.isSafeInteger(candidate.costProfile.creditCost) &&
    candidate.costProfile.creditCost! >= 0
      ? candidate.costProfile.creditCost!
      : 0;
  return -1 - knownCreditCost;
}

export function runnerCardRunHasVisibleDifferentialPayoff(
  input: PlanSchedulerContext["input"],
  candidate: ActionSemanticCandidate,
  serverId: string,
  runTargetEvaluations?: readonly RunnerRunTargetEvaluation[],
): boolean {
  const server = input.playerView.servers.find(
    (entry) => entry.id === serverId,
  );
  if (!server) return false;
  if (candidate.conditions.some((condition) => condition.status === "absent")) {
    return false;
  }
  if (
    candidate.conditions.some(
      (condition) => condition.kind === "requires_encounter",
    ) &&
    server.ice.length === 0
  ) {
    return false;
  }
  if (
    candidate.conditions.some(
      (condition) => condition.kind === "requires_rezzed_ice",
    ) &&
    !server.ice.some((ice) => ice.rezzed === true)
  ) {
    return false;
  }
  return (candidate.effectTargets ?? []).some((target) => {
    if (
      target === "make_run" ||
      target === "make_chosen_server_run" ||
      (target.startsWith("make_") && target.endsWith("_run")) ||
      target === "ends_run_after_effect" ||
      target === "run.successful_run_self_tag"
    ) {
      return false;
    }
    if (target === "derez" || target.includes("trash_rezzed_ice_on_fort")) {
      return server.ice.some((ice) => ice.rezzed === true);
    }
    if (target === "bypass_first_ice") {
      if (server.ice.length === 0) return false;
      const bypassEvaluation = runTargetEvaluations?.find(
        (evaluation) => evaluation.actionId === candidate.actionId,
      );
      if (!bypassEvaluation) return true;
      const directRunDominates = runTargetEvaluations?.some(
        (evaluation) =>
          evaluation.actionId !== bypassEvaluation.actionId &&
          evaluation.runActionProjection.sourceKind === "basic_action" &&
          evaluation.targetServerId === bypassEvaluation.targetServerId &&
          evaluation.accessServerId === bypassEvaluation.accessServerId &&
          runnerBasicRunDominatesBypassRoute(evaluation, bypassEvaluation),
      );
      return directRunDominates !== true;
    }
    if (target === "run.trace_link_bonus") {
      return visibleRunnerTraceThreatOnServer(input, serverId);
    }
    return true;
  });
}

function runnerBasicRunDominatesBypassRoute(
  directRun: RunnerRunTargetEvaluation,
  bypassRun: RunnerRunTargetEvaluation,
): boolean {
  if (
    directRun.pathPassability !== "reachable" ||
    bypassRun.pathPassability !== "reachable" ||
    directRun.recommendation !== bypassRun.recommendation ||
    directRun.accessPayoff !== bypassRun.accessPayoff ||
    directRun.knownAccessState !== bypassRun.knownAccessState ||
    directRun.multiaccessAvailable !== bypassRun.multiaccessAvailable ||
    directRun.runCommitment !== bypassRun.runCommitment ||
    directRun.creditsAfterRun < bypassRun.creditsAfterRun ||
    (directRun.unknownUnrezzedIceCount ?? 0) >
      (bypassRun.unknownUnrezzedIceCount ?? 0) ||
    (directRun.visibleIceHazardPenalty ?? 0) >
      (bypassRun.visibleIceHazardPenalty ?? 0) ||
    (directRun.futureClicksLost ?? 0) > (bypassRun.futureClicksLost ?? 0) ||
    (directRun.expectedTagsFromVisibleIce ?? 0) >
      (bypassRun.expectedTagsFromVisibleIce ?? 0) ||
    (directRun.unavoidableVisibleIceHazardCount ?? 0) >
      (bypassRun.unavoidableVisibleIceHazardCount ?? 0) ||
    directRun.visibleTraceTagHazardUnavoidable === true ||
    directRun.randomBreakOrDamageRiskAssessment !== undefined ||
    bypassRun.randomBreakOrDamageRiskAssessment !== undefined
  ) {
    return false;
  }
  return true;
}

function remoteCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRemoteContestSignal,
): PlanMaterialization["candidates"] {
  if (
    signal.routePreparation === "expose_remote" ||
    signal.routePreparation === "prepare_access_payoff" ||
    signal.routePreparation === "targeted_bypass" ||
    signal.routePreparation === "targeted_ice_trash"
  ) {
    const preparationActionIds = new Set(signal.preparationActionIds ?? []);
    return context.actionCandidates
      .filter((candidate) => preparationActionIds.has(candidate.actionId))
      .map((candidate) => ({
        candidate,
        stepValue: signal.marginalValue,
      }));
  }
  return context.actionCandidates.flatMap((candidate) => {
    const assessment = signal.runActionAssessments[candidate.actionId];
    if (
      assessment?.verdict !== "executable" ||
      !signal.reachable ||
      signal.marginalValue <= 0
    ) {
      return [];
    }
    return [{ candidate, stepValue: assessment.stepValue }];
  });
}

function developmentCandidates(
  context: PlanSchedulerContext,
  signal: RunnerDevelopmentSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.actionIds.includes(candidate.actionId) &&
        !context.actionDispositions?.some(
          (disposition) => disposition.actionId === candidate.actionId,
        ) &&
        (signal.phase === "fund" ||
          signal.phase === "open_restricted_sequence" ||
          signal.phase === "execute_restricted_sequence" ||
          signal.phase === "complete_restricted_sequence" ||
          signal.phase === "resolve_event_install_choice" ||
          signal.targetKind === "capability" ||
          candidate.sourceDefinitionId === signal.definitionId) &&
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        !runnerOptionalProgramTrashInstallHasDirectSibling(context, candidate),
    )
    .map((candidate) => ({
      candidate,
      stepValue:
        signal.phase === "fund"
          ? signal.value +
            Math.min(
              signal.fundingGap ?? 0,
              Math.max(
                0,
                candidate.economyProjection?.netLiquidCreditGain ?? 0,
              ),
            ) *
              20
          : signal.value,
    }));
}

function runnerOptionalProgramTrashInstallHasDirectSibling(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): boolean {
  if (candidate.semanticActionType !== "install.card") return false;
  const action = context.input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const optionalProgramTrashInstall =
    action?.payload?.runnerProgramTrashBeforeInstall === true ||
    candidate.actionId.endsWith(".runner_program_trash_before_install");
  if (!optionalProgramTrashInstall) return false;
  const sourceCardInstanceId = runnerInstallSourceCardInstanceId(
    context,
    candidate,
  );
  if (!sourceCardInstanceId) return false;
  return context.actionCandidates.some((alternative) => {
    if (
      alternative.actionId === candidate.actionId ||
      alternative.semanticActionType !== "install.card" ||
      runnerInstallSourceCardInstanceId(context, alternative) !==
        sourceCardInstanceId
    ) {
      return false;
    }
    const alternativeAction = context.input.legalActions.find(
      (entry) => entry.actionId === alternative.actionId,
    );
    return (
      alternativeAction?.payload?.runnerProgramTrashBeforeInstall !== true &&
      !alternative.actionId.endsWith(".runner_program_trash_before_install")
    );
  });
}

function runnerInstallSourceCardInstanceId(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.sourceCardInstanceId) return candidate.sourceCardInstanceId;
  const action = context.input.legalActions.find(
    (entry) => entry.actionId === candidate.actionId,
  );
  const cardId = action?.payload?.cardId;
  if (typeof cardId === "string" && cardId.length > 0) return cardId;
  return typeof action?.source === "string" &&
    action.source.length > 0 &&
    action.source !== "basic_action"
    ? action.source
    : undefined;
}

function runWindowCandidates(
  context: PlanSchedulerContext,
  signal: RunnerRunWindowSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        signal.actionAssessments?.[candidate.actionId]?.admissible === true &&
        (!signal.serverId ||
          candidate.runProjectionSummary?.serverId === signal.serverId ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_engine_restricted_run_sequence_continuation",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_post_pass_derez_and_end_run_plan_admissible",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_encounter_action_plan_admissible",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes(
            "runner_run_window_action_plan_admissible",
          ) === true ||
          signal.actionAssessments?.[
            candidate.actionId
          ]?.evidenceCodes.includes("runner_optional_bonus_run_decline") ===
            true ||
          candidate.semanticActionType.startsWith("access.")),
    )
    .map((candidate) => ({
      candidate,
      stepValue: runWindowCandidateValue(
        context,
        candidate,
        signal.accessCommitment,
        signal.safetyIntent,
        signal.encounterIntent,
        signal.actionAssessments?.[candidate.actionId]?.value,
      ),
    }));
}

function exposeInformationCandidates(
  context: PlanSchedulerContext,
  signal: RunnerExposeInformationSignal,
): PlanMaterialization["candidates"] {
  if (!signal.admissible) return [];
  if (signal.kind === "proactive") {
    return context.actionCandidates
      .filter(
        (candidate) =>
          (signal.actionIds ?? [signal.selectedActionId]).includes(
            candidate.actionId,
          ) &&
          candidate.sourceCardInstanceId === signal.sourceCardInstanceId &&
          (signal.phase === "install_information_tool"
            ? candidate.semanticActionType === "install.card"
            : candidate.semanticActionType === "play.runner_event"),
      )
      .map((candidate) => ({ candidate, stepValue: 240 }));
  }
  return context.actionCandidates
    .filter((candidate) => {
      if (
        candidate.actionId !== signal.selectedActionId ||
        candidate.sourceCardInstanceId !== signal.sourceCardInstanceId ||
        candidate.semanticActionType !== "card_ability.trigger"
      ) {
        return false;
      }
      const action = context.input.legalActions.find(
        (entry) => entry.actionId === candidate.actionId,
      );
      return (
        action?.type === "trigger_ability" &&
        action.source === signal.sourceCardInstanceId &&
        action.expiresAtStateVersion ===
          context.input.playerView.stateVersion &&
        action.payload?.cardId === signal.sourceCardInstanceId &&
        action.payload?.iceId === signal.targetIceInstanceId &&
        action.payload?.approachIceExposeDecision ===
          (signal.phase === "expose_unknown_ice" ? "expose" : "decline")
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue: signal.phase === "expose_unknown_ice" ? 300 : 200,
    }));
}

function runWindowCandidateValue(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
  commitment: RunnerRunAccessCommitmentSignal | undefined,
  safetyIntent?: RunnerRunWindowSignal["safetyIntent"],
  encounterIntent?: RunnerRunWindowSignal["encounterIntent"],
  assessedValue?: number,
): number {
  if (safetyIntent === "jack_out") {
    if (candidate.actionType === "jack_out")
      return (assessedValue ?? 0) + 5_000;
    if (candidate.actionType === "continue_run")
      return (assessedValue ?? 0) - 5_000;
  }
  if (encounterIntent === "mitigate_threat" && assessedValue === undefined) {
    if (candidate.semanticActionType === "breaker.break_subroutine") return 450;
    if (candidate.semanticActionType === "breaker.boost_strength") return 350;
    if (candidate.actionType === "continue_run") return 0;
  }
  if (candidate.actionType === "steal_agenda") return 400;
  if (!commitment) return assessedValue ?? 100;
  if (commitment.intendedAction === "decline") {
    if (candidate.actionType === "decline_trash")
      return (assessedValue ?? 0) + 200;
    return candidate.actionType === "trash_accessed_card"
      ? (assessedValue ?? 0) - 200
      : (assessedValue ?? 100);
  }
  if (commitment.intendedAction !== "trash") return 100;
  const committedTrashCandidates = context.actionCandidates.filter(
    (entry) =>
      entry.actionType === "trash_accessed_card" &&
      entry.sourceDefinitionId !== undefined &&
      commitment.knownTargetDefinitionIds.includes(entry.sourceDefinitionId) &&
      actionCreditCost(entry) <= commitment.trashBudget,
  );
  if (candidate.actionType === "decline_trash") {
    return committedTrashCandidates.length > 0
      ? (assessedValue ?? 0) - 200
      : (assessedValue ?? 100);
  }
  return committedTrashCandidates.some(
    (entry) => entry.actionId === candidate.actionId,
  )
    ? (assessedValue ?? 0) + 200
    : (assessedValue ?? 100);
}

function actionCreditCost(candidate: ActionSemanticCandidate): number {
  return Math.max(0, candidate.costProfile.creditCost ?? 0);
}

function terminalWinCandidates(
  context: PlanSchedulerContext,
  signal: RunnerTerminalWinSignal,
): PlanMaterialization["candidates"] {
  return context.actionCandidates
    .filter(
      (candidate) =>
        signal.semanticActionTypes.includes(candidate.semanticActionType) &&
        candidate.actionType === "end_turn" &&
        candidate.sourceKind === "game_rule",
    )
    .map((candidate) => ({ candidate, stepValue: 1 }));
}

function domain(context: PlanSchedulerContext): RunnerPlanDomain {
  const value = context.domain as RunnerPlanDomain | undefined;
  if (
    value?.terminalWins &&
    value.centralPressure &&
    value.remoteContests &&
    value.developments &&
    value.runWindows
  )
    return value;
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    owner: "plan_module",
    removalCondition:
      "Build the Runner tactical domain before discovering tactical plans.",
  });
}

function state<T>(instance: PlanInstance): T {
  return instance.moduleState as T;
}
