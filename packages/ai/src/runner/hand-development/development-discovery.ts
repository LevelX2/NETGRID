import { type RunnerCorePlanDomain } from "../../plans/runner-core-plan-contracts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { rolesForDeckDoctrineCard } from "../../deck-doctrine-card-roles";
import { planInstanceIdForProposal } from "../../plans/plan-instance";

import { runnerRolesCoverCoverageGap } from "../../plans/runner-coverage-contracts";
import { runnerDevelopmentFundingMilestone } from "../../plans/runner-development-contracts";
import { type RunnerPlanDomain } from "../../plans/runner-tactical-plan-contracts";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import type { DiscardKeepScorer } from "../../runtime/discard-choice-selection";
import { runnerCandidateIsOneShotSearch } from "../../runtime/runner-development-action-facts";
import { runnerExactFundingRouteContract } from "../../runtime/runner-exact-funding-routes";
import {
  runnerStrategicExchangeHardExclusion,
  runnerStrategicExchangeRequiresBoundParent,
} from "../../runtime/runner-strategic-exchange";
import { assessRunnerSuccessfulRunCreditInvestment } from "../../runtime/runner-successful-run-credit-investment";
import {
  runnerDefinitionRequiresTargetedBypassPlan,
  runnerGenericDevelopmentMayOwnAction,
} from "../run-window/runner-targeted-bypass-plan";
import type { RunnerExposeInformationSignal } from "../expose-information/expose-information-types";
import { runnerMatchpointReserveBlocksOverlappingBreakerInstall } from "../rig-coverage/coverage-dispositions";
import { runnerCoverageRecoveryTarget } from "../rig-coverage/coverage-support";
import {
  restrictedActionCapacityHasProductiveFollowup,
  runnerRestrictedProgramInstallSequenceCommitment,
} from "./development-restricted-sequence";
import {
  runnerCandidateExecutesHeapRecovery,
  runnerCandidateExecutesTopHeapRecovery,
  runnerEventInstallChoiceCommitment,
  runnerRecoverySearchCommitment,
} from "./development-search-targets";
import type { RunnerDevelopmentInstallServices } from "./development-services";
import { runnerAccessPayoffDevelopmentLacksBoundAccessRoute } from "./development-signals";
import type { RunnerHandDevelopmentEvaluation } from "./hand-development-evaluation";

export function buildRunnerCardDevelopmentSignals({
  handDevelopment,
  effectiveAccessPayoffCampaignSignals,
  recurringEconomy,
  candidates,
  confirmedDamageTaxedDrawActionIdSet,
  input,
  coverageOwnedActionIds,
  coverageGaps,
  centralPressure,
  runTargets,
  creditBanks,
  resourceLifecycle,
  installedAgendaScores,
  immediateAgendaPointTerminalWins,
  immediateAgendaPointDevelopments,
  shellTradersPipelines,
  defenseSupportAllInstallActionIds,
  exposeInformation,
  delegatedFundingActionIds,
  economy,
  assessProgramInstallTarget,
  discardKeepScore,
  remainingClicks,
  rejectedCreditBankActionIds,
  coverageSearchActionIds,
}: {
  handDevelopment: readonly RunnerHandDevelopmentEvaluation[];
  effectiveAccessPayoffCampaignSignals: RunnerPlanDomain["centralPressure"];
  recurringEconomy: NonNullable<RunnerPlanDomain["recurringEconomy"]>;
  candidates: readonly ActionSemanticCandidate[];
  confirmedDamageTaxedDrawActionIdSet: ReadonlySet<string>;
  input: AiDecisionInput;
  coverageOwnedActionIds: ReadonlySet<string>;
  coverageGaps: RunnerPlanDomain["coverageGaps"];
  centralPressure: RunnerPlanDomain["centralPressure"];
  runTargets: readonly RunnerRunTargetEvaluation[];
  creditBanks: RunnerPlanDomain["creditBanks"];
  resourceLifecycle: NonNullable<RunnerPlanDomain["resourceLifecycle"]>;
  installedAgendaScores: NonNullable<RunnerPlanDomain["installedAgendaScores"]>;
  immediateAgendaPointTerminalWins: RunnerPlanDomain["terminalWins"];
  immediateAgendaPointDevelopments: RunnerPlanDomain["developments"];
  shellTradersPipelines: NonNullable<RunnerPlanDomain["shellTradersPipelines"]>;
  defenseSupportAllInstallActionIds: readonly string[];
  exposeInformation: readonly RunnerExposeInformationSignal[];
  delegatedFundingActionIds: ReadonlySet<string>;
  economy: RunnerEconomyPosture;
  assessProgramInstallTarget: RunnerDevelopmentInstallServices["assessCard"];
  discardKeepScore: DiscardKeepScorer | undefined;
  remainingClicks: number;
  rejectedCreditBankActionIds: ReadonlySet<string>;
  coverageSearchActionIds: ReadonlySet<string>;
}): {
  cardDevelopments: RunnerPlanDomain["developments"];
  developmentFundingNeeds: RunnerCorePlanDomain["fundingNeeds"];
} {
  const handCardDevelopments: RunnerPlanDomain["developments"] =
    handDevelopment.flatMap((evaluation): RunnerPlanDomain["developments"] => {
      const executableNow =
        evaluation.availability === "legal_now" &&
        evaluation.deferReason === "none";
      const waitingForCredits =
        evaluation.availability === "missing_credits" &&
        evaluation.deferReason === "missing_credits" &&
        evaluation.fundingNeed !== undefined;
      const waitingForReserve =
        evaluation.availability === "legal_now" &&
        evaluation.deferReason === "preserve_credit_floor" &&
        evaluation.fundingNeed !== undefined &&
        evaluation.fundingNeed.reason !== "cannot_pay";
      if (
        (!executableNow && !waitingForCredits && !waitingForReserve) ||
        !evaluation.definitionId
      ) {
        return [];
      }
      if (runnerDefinitionRequiresTargetedBypassPlan(evaluation.definitionId)) {
        return [];
      }
      if (
        effectiveAccessPayoffCampaignSignals.some(
          (signal) =>
            signal.accessPayoffCampaign?.payoffCardInstanceId ===
            evaluation.cardInstanceId,
        )
      ) {
        return [];
      }
      if (
        recurringEconomy.some(
          (signal) => signal.definitionId === evaluation.definitionId,
        )
      ) {
        return [];
      }
      if (
        evaluation.activationPrerequisites.some(
          (prerequisite) => prerequisite.kind === "same_turn_access",
        )
      ) {
        return [];
      }
      const candidate = executableNow
        ? candidates.find(
            (entry) =>
              entry.sourceDefinitionId === evaluation.definitionId &&
              entry.sourceCardInstanceId === evaluation.cardInstanceId &&
              entry.actionId === evaluation.legalActionId,
          )
        : undefined;
      if (executableNow && !candidate) return [];
      if (
        candidate !== undefined &&
        confirmedDamageTaxedDrawActionIdSet.has(candidate.actionId)
      ) {
        return [];
      }
      if (
        candidate !== undefined &&
        runnerMatchpointReserveBlocksOverlappingBreakerInstall(
          input,
          candidate,
          coverageOwnedActionIds,
          coverageGaps,
        )
      ) {
        return [];
      }
      if (
        candidate !== undefined &&
        runnerStrategicExchangeRequiresBoundParent(candidate)
      ) {
        // Irreversible financing is support for an already selected parent
        // plan, never a standalone board-development objective.
        return [];
      }
      if (
        candidate !== undefined &&
        runnerStrategicExchangeHardExclusion(input, candidate) !== undefined
      ) {
        // The development owner remains authoritative for the card, but a
        // terminal or unquoted exchange must not materialize an executable
        // plan route that conflicts with its own fail-closed disposition.
        return [];
      }
      if (
        candidate !== undefined &&
        centralPressure.some((signal) =>
          signal.preparationActionIds?.includes(candidate.actionId),
        )
      ) {
        return [];
      }
      if (
        runnerAccessPayoffDevelopmentLacksBoundAccessRoute(
          evaluation,
          candidate,
          runTargets,
          coverageGaps,
        )
      ) {
        return [];
      }
      if (
        candidate !== undefined &&
        !runnerGenericDevelopmentMayOwnAction(candidate)
      ) {
        return [];
      }
      const executableCardActionCandidates =
        executableNow && candidate
          ? candidates.filter((entry) => {
              if (
                entry.sourceCardInstanceId !== evaluation.cardInstanceId ||
                entry.actionType !== candidate.actionType ||
                entry.semanticActionType !== candidate.semanticActionType
              ) {
                return false;
              }
              const canonicalAction = input.legalActions.find(
                (action) => action.actionId === candidate.actionId,
              );
              const alternativeAction = input.legalActions.find(
                (action) => action.actionId === entry.actionId,
              );
              return !(
                canonicalAction?.payload?.runnerProgramTrashBeforeInstall !==
                  true &&
                !candidate.actionId.endsWith(
                  ".runner_program_trash_before_install",
                ) &&
                (alternativeAction?.payload?.runnerProgramTrashBeforeInstall ===
                  true ||
                  entry.actionId.endsWith(
                    ".runner_program_trash_before_install",
                  ))
              );
            })
          : [];
      const specialistOwnedActionIds = new Set([
        ...creditBanks.flatMap((signal) => [
          ...signal.actionIds,
          ...(signal.rejectedActionIds ?? []),
        ]),
        ...(recurringEconomy ?? []).flatMap((signal) => signal.actionIds),
        ...(resourceLifecycle ?? []).flatMap((signal) => [
          ...signal.actionIds,
          ...(signal.rejectedActionIds ?? []),
        ]),
        ...(installedAgendaScores ?? []).flatMap((signal) => signal.actionIds),
        ...immediateAgendaPointTerminalWins.flatMap(
          (signal) => signal.actionIds ?? [],
        ),
        ...immediateAgendaPointDevelopments.flatMap(
          (signal) => signal.actionIds,
        ),
        ...shellTradersPipelines.flatMap((signal) => [
          ...signal.actionIds,
          ...(signal.rejectedActionIds ?? []),
        ]),
        ...defenseSupportAllInstallActionIds,
        ...exposeInformation.flatMap(
          (signal) => signal.actionIds ?? [signal.selectedActionId],
        ),
      ]);
      if (
        (candidate !== undefined &&
          specialistOwnedActionIds.has(candidate.actionId)) ||
        (evaluation.legalActionId !== undefined &&
          specialistOwnedActionIds.has(evaluation.legalActionId))
      ) {
        return [];
      }
      if (
        candidate !== undefined &&
        coverageOwnedActionIds.has(candidate.actionId)
      ) {
        return [];
      }
      const unboundOneShotSearch =
        executableNow &&
        evaluation.developmentRole === "draw_or_search_engine" &&
        candidate?.actionType === "play_event" &&
        runnerCandidateIsOneShotSearch(candidate) &&
        !coverageOwnedActionIds.has(candidate.actionId);
      if (unboundOneShotSearch) {
        return [];
      }
      const ownedByActiveEconomyPlan =
        candidate !== undefined &&
        delegatedFundingActionIds.has(candidate.actionId);
      if (ownedByActiveEconomyPlan) return [];
      const evaluationDefinitionId = evaluation.definitionId;
      const assignedCoveragePlanIds = evaluationDefinitionId
        ? coverageGaps
            .filter((gap) =>
              runnerRolesCoverCoverageGap(
                rolesForDeckDoctrineCard(evaluationDefinitionId),
                gap.requiredRole,
              ),
            )
            .map((gap) => `runner.rig_and_coverage:${gap.gapId}`)
        : [];
      if (
        candidate &&
        runTargets.some(
          (runEvaluation) => runEvaluation.actionId === candidate.actionId,
        )
      ) {
        return [];
      }
      const restrictedCapacitySetup =
        candidate?.actionCapacityProjection?.kind ===
          "immediate_restricted_gain" &&
        candidate.actionCapacityProjection.followupActionCapacity > 0;
      const restrictedProgramInstallCommitment =
        executableNow &&
        candidate?.actionCapacityProjection?.restriction ===
          "program_install_only"
          ? runnerRestrictedProgramInstallSequenceCommitment(
              input,
              candidate,
              candidates,
              handDevelopment,
              economy,
            )
          : undefined;
      const eventInstallChoiceCommitment = candidate
        ? runnerEventInstallChoiceCommitment(
            input,
            candidate,
            handDevelopment,
            assessProgramInstallTarget,
          )
        : undefined;
      const recoverySearchAction =
        candidate !== undefined &&
        runnerCandidateExecutesHeapRecovery(input, candidate);
      const recoverySearchCommitment =
        recoverySearchAction && discardKeepScore
          ? runnerRecoverySearchCommitment(input, candidate, discardKeepScore)
          : undefined;
      if (recoverySearchAction && !recoverySearchCommitment) {
        return [];
      }
      if (
        executableNow &&
        candidate &&
        restrictedCapacitySetup &&
        candidate.actionCapacityProjection?.restriction ===
          "program_install_only" &&
        restrictedProgramInstallCommitment === undefined
      ) {
        return [
          {
            developmentId: `card:${evaluation.cardInstanceId}`,
            definitionId: evaluation.definitionId,
            targetKind: "capability" as const,
            phase: "prepare_restricted_sequence" as const,
            purposeCode: "prepare_productive_program_install_sequence",
            assignedDomainPlanIds: assignedCoveragePlanIds,
            duplicateAlreadyInstalled: false,
            affordableOrSupportable: false,
            semanticActionTypes: [candidate.semanticActionType],
            actionIds: [],
            priorityClass: "P6" as const,
            value: 0,
            evidenceCode:
              "runner_restricted_program_sequence_waiting_for_productive_bundle",
            evidenceCodes: [
              "runner_restricted_program_sequence_source_held",
              "runner_restricted_program_sequence_requires_visible_targets",
            ],
          },
        ];
      }
      if (
        executableNow &&
        candidate &&
        restrictedCapacitySetup &&
        candidate.actionCapacityProjection?.restriction !==
          "program_install_only" &&
        !restrictedActionCapacityHasProductiveFollowup(
          candidate,
          candidates,
          handDevelopment,
          runTargets,
        )
      ) {
        return [];
      }
      const duplicate =
        evaluation.persistentInstallEvaluation?.duplicateRole ===
        "redundant_duplicate";
      const productiveRunNowAvailable = runTargets.some(
        (run) =>
          run.pathPassability === "reachable" &&
          run.recommendation === "run_now" &&
          run.score > 0,
      );
      const breakerSetupYieldsToProductiveRun =
        evaluation.developmentRole === "breaker_or_rig_piece" &&
        productiveRunNowAvailable;
      const unassignedWeakCardPlan =
        evaluation.developmentRole === "unknown" &&
        evaluation.strategicFit === "weak";
      const developmentPriorityClass =
        evaluation.currentNeed === "acute" && !breakerSetupYieldsToProductiveRun
          ? ("P4" as const)
          : unassignedWeakCardPlan
            ? ("P6" as const)
            : evaluation.currentNeed === "useful_now" ||
                evaluation.currentNeed === "setup" ||
                restrictedCapacitySetup
              ? ("P5" as const)
              : ("P6" as const);
      const runCreditInvestment = assessRunnerSuccessfulRunCreditInvestment(
        input,
        evaluation,
        runTargets,
        economy,
      );
      // The mechanic-specific investment quote owns admission as well as value.
      // A deferred investment cannot return through the generic useful-card plan.
      if (runCreditInvestment && !runCreditInvestment.admitted) return [];
      const normalizedDevelopmentValue = runCreditInvestment?.admitted
        ? runCreditInvestment.value
        : unassignedWeakCardPlan
          ? Math.min(20, evaluation.priority)
          : restrictedCapacitySetup
            ? Math.min(
                120,
                60 +
                  candidate.actionCapacityProjection!.followupActionCapacity *
                    10,
              )
            : evaluation.currentNeed === "acute"
              ? Math.min(300, evaluation.priority)
              : evaluation.currentNeed === "useful_now" ||
                  evaluation.currentNeed === "setup"
                ? Math.min(80, evaluation.priority)
                : Math.min(20, evaluation.priority);
      const reserveProtectedTargetCredits = waitingForReserve
        ? evaluation.fundingNeed!.targetCredits
        : undefined;
      const fundingTargetCredits =
        reserveProtectedTargetCredits ?? evaluation.fundingNeed?.targetCredits;
      const executableCurrentActionConsumesRemainingTurn =
        executableNow &&
        candidate !== undefined &&
        ((candidate.costProfile.clickCost ?? 0) >= remainingClicks ||
          (candidate.semanticActionType === "install.card" &&
            remainingClicks <= 1));
      const developmentFundingMilestone =
        !executableCurrentActionConsumesRemainingTurn &&
        (waitingForCredits || waitingForReserve) &&
        fundingTargetCredits !== undefined
          ? runnerDevelopmentFundingMilestone({
              targetCredits: fundingTargetCredits,
              currentCredits: input.playerView.own.credits,
              normalizedDevelopmentValue,
              strategicFit: evaluation.strategicFit,
              currentNeed: evaluation.currentNeed,
              developmentRole: evaluation.developmentRole,
              duplicateAlreadyInstalled: duplicate,
              assignedDomainPlanIds: assignedCoveragePlanIds,
            })
          : undefined;
      if (
        (waitingForCredits || waitingForReserve) &&
        developmentFundingMilestone === undefined &&
        !executableCurrentActionConsumesRemainingTurn
      ) {
        return [];
      }
      const supportNeedId = developmentFundingMilestone
        ? `development-support:${evaluation.cardInstanceId}`
        : undefined;
      const parentPlanInstanceId = planInstanceIdForProposal({
        moduleId: "runner.develop_board_and_hand",
        dedupeKey: `card:${evaluation.cardInstanceId}`,
      });
      const fundingRoute =
        developmentFundingMilestone && supportNeedId
          ? runnerExactFundingRouteContract(
              input,
              candidates.filter(
                (entry) => !rejectedCreditBankActionIds.has(entry.actionId),
              ),
              {
                demandId: supportNeedId,
                sourcePlanId: parentPlanInstanceId,
                purpose: "foreground_plan",
                priority: "current_foreground_plan",
                hardness: developmentFundingMilestone.hardness,
                deadline: developmentFundingMilestone.deadline,
                targetCredits: developmentFundingMilestone.targetCredits,
                remainingClicks,
                allowIncrementalProgress: true,
                allowStrategicExchange: false,
                evidence: [
                  `development_card:${evaluation.definitionId}`,
                  `development_milestone_gap:${developmentFundingMilestone.remainingGap}`,
                ],
              },
            )
          : undefined;
      const actionIds = candidate
        ? executableCardActionCandidates.map((entry) => entry.actionId)
        : [];
      const semanticActionTypes = candidate
        ? [candidate.semanticActionType]
        : [];
      return [
        {
          developmentId: `card:${evaluation.cardInstanceId}`,
          definitionId: evaluation.definitionId,
          ...(restrictedProgramInstallCommitment || recoverySearchCommitment
            ? { targetKind: "capability" as const }
            : {}),
          phase: restrictedProgramInstallCommitment
            ? ("open_restricted_sequence" as const)
            : developmentFundingMilestone !== undefined
              ? ("fund" as const)
              : ("execute" as const),
          ...(restrictedProgramInstallCommitment
            ? {
                purposeCode: "open_committed_program_install_sequence",
              }
            : recoverySearchCommitment
              ? { purposeCode: recoverySearchCommitment.targetPurpose }
              : evaluation.currentNeed !== "none" &&
                  evaluation.currentNeed !== undefined
                ? {
                    purposeCode: `${evaluation.developmentRole}:${evaluation.currentNeed}`,
                  }
                : {}),
          assignedDomainPlanIds: assignedCoveragePlanIds,
          duplicateAlreadyInstalled: duplicate,
          affordableOrSupportable:
            executableNow || developmentFundingMilestone !== undefined,
          semanticActionTypes:
            semanticActionTypes.length > 0
              ? semanticActionTypes
              : ["economy.gain_credit"],
          actionIds,
          ...(developmentFundingMilestone
            ? {
                fundingGap: developmentFundingMilestone.remainingGap,
                supportNeedId: supportNeedId!,
                developmentFundingMilestone,
                fundingRouteActionIds: fundingRoute!.routeActionIds,
                fundingRouteAssessment: fundingRoute!.routeAssessment,
              }
            : {}),
          priorityClass: runCreditInvestment?.admitted
            ? ("P4" as const)
            : developmentPriorityClass,
          value: normalizedDevelopmentValue,
          evidenceCode: evaluation.evidence[0] ?? "runner_hand_development",
          ...(runCreditInvestment
            ? { evidenceCodes: runCreditInvestment.evidenceCodes }
            : {}),
          ...(restrictedProgramInstallCommitment
            ? {
                evidenceCodes: restrictedProgramInstallCommitment.evidenceCodes,
                restrictedProgramInstallCommitment,
              }
            : eventInstallChoiceCommitment
              ? { eventInstallChoiceCommitment }
              : recoverySearchCommitment
                ? {
                    evidenceCodes: [
                      `runner_recovery_search_target:${recoverySearchCommitment.targetCardInstanceId}`,
                    ],
                    recoverySearchCommitment,
                  }
                : fundingRoute
                  ? {
                      evidenceCodes: fundingRoute.routeAssessment.evidenceCodes,
                    }
                  : {}),
        },
      ];
    });
  const installedRecoveryDevelopments: RunnerPlanDomain["developments"] =
    discardKeepScore
      ? candidates.flatMap((candidate): RunnerPlanDomain["developments"] => {
          if (
            coverageOwnedActionIds.has(candidate.actionId) ||
            coverageSearchActionIds.has(candidate.actionId) ||
            coverageGaps.some(
              (gap) =>
                runnerCoverageRecoveryTarget(
                  input,
                  candidate,
                  gap.requiredRole,
                ) !== undefined,
            ) ||
            (!runnerCandidateExecutesHeapRecovery(input, candidate) &&
              !runnerCandidateExecutesTopHeapRecovery(input, candidate))
          ) {
            return [];
          }
          const recoverySearchCommitment = runnerRecoverySearchCommitment(
            input,
            candidate,
            discardKeepScore,
          );
          if (!recoverySearchCommitment) return [];
          return [
            {
              developmentId: `recovery:${recoverySearchCommitment.sourceCardInstanceId}:${recoverySearchCommitment.targetCardInstanceId}`,
              definitionId: recoverySearchCommitment.sourceDefinitionId,
              targetKind: "capability" as const,
              phase: "execute" as const,
              purposeCode: recoverySearchCommitment.targetPurpose,
              assignedDomainPlanIds: [],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              semanticActionTypes: [candidate.semanticActionType],
              actionIds: [candidate.actionId],
              priorityClass: "P6" as const,
              value: 0,
              evidenceCode: `runner_recovery_search_target:${recoverySearchCommitment.targetCardInstanceId}`,
              evidenceCodes: [
                `runner_recovery_search_source:${recoverySearchCommitment.sourceCardInstanceId}`,
                `runner_recovery_search_target:${recoverySearchCommitment.targetCardInstanceId}`,
              ],
              recoverySearchCommitment,
            },
          ];
        })
      : [];
  const cardDevelopments: RunnerPlanDomain["developments"] = [
    ...handCardDevelopments,
    ...installedRecoveryDevelopments,
  ];
  const developmentFundingNeeds: RunnerCorePlanDomain["fundingNeeds"] =
    cardDevelopments.flatMap((signal) => {
      const milestone = signal.developmentFundingMilestone;
      if (
        !milestone ||
        !signal.supportNeedId ||
        !signal.fundingRouteActionIds ||
        !signal.fundingRouteAssessment
      ) {
        return [];
      }
      return [
        {
          kind: "parent_plan_support" as const,
          needId: signal.supportNeedId,
          parentPlanInstanceId: planInstanceIdForProposal({
            moduleId: "runner.develop_board_and_hand",
            dedupeKey: signal.developmentId,
          }),
          driver: {
            kind: "development" as const,
            targetId: signal.developmentId,
            reasonCode: "fund_bounded_strategic_install",
          },
          targetCredits: milestone.targetCredits,
          currentCreditsAtRevalidation: milestone.observedCredits,
          gap: milestone.remainingGap,
          priorityClass: milestone.priorityClass,
          developmentFundingMilestone: milestone,
          revalidation: {
            stateVersion: input.playerView.stateVersion,
            status: "material_parent_open" as const,
          },
          routeActionIds: signal.fundingRouteActionIds,
          routeAssessment: signal.fundingRouteAssessment,
          evidenceCode: `runner_development_funding:${signal.developmentId}`,
        },
      ];
    });
  return { cardDevelopments, developmentFundingNeeds };
}
