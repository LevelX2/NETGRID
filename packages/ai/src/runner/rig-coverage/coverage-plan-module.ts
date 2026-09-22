import {
  runnerRolesCoverCoverageGap,
  type RunnerCoverageGapSignal,
} from "../../plans/runner-coverage-contracts";
import type { AiDecisionInput, VisibleCard } from "@netgrid/shared";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import type { AiDeckStrategyProfile } from "../../deck-doctrine-strategy";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type {
  PlanMaterialization,
  PlanModule,
  PlanSchedulerContext,
} from "../../plans/plan-scheduler";
import type { ProjectedHandDisposition } from "../../plans/turn-projection";
import {
  runnerPlanProposal as proposal,
  runnerPlanAssessment as assessment,
  runnerPlanDomain,
} from "../../plans/runner-plan-module-support";
import type { CoverageState } from "./coverage-types";
import { runnerAffordableCoverageSearchActionIds } from "./coverage-search-alternatives";
export function runnerCoveragePlanHandDisposition(
  input: AiDecisionInput,
  card: VisibleCard,
): ProjectedHandDisposition | undefined {
  if (input.side !== "runner" || !card.definitionId) return undefined;
  const strategyProfile = (
    input as AiDecisionInput & {
      ownDeckStrategyProfile?: AiDeckStrategyProfile;
    }
  ).ownDeckStrategyProfile;
  const doctrine = strategyProfile?.runnerEngineDoctrine;
  const dependency = doctrine?.dependencies.find(
    (entry) =>
      entry.dependencyId === "runner.dependency.breaker_coverage" &&
      entry.criticality === "single_definition",
  );
  const provider = doctrine?.providers.find(
    (entry) =>
      entry.cardId === card.definitionId &&
      entry.capabilities.includes("runner.coverage.breaker") &&
      dependency?.providerIds.includes(entry.providerId),
  );
  if (!dependency || !provider) return undefined;
  const providerDefinitionIds = new Set(
    doctrine!.providers
      .filter((entry) => dependency.providerIds.includes(entry.providerId))
      .map((entry) => entry.cardId),
  );
  const installedProviderExists = (input.playerView.own.rig ?? []).some(
    (entry) =>
      entry.definitionId !== undefined &&
      providerDefinitionIds.has(entry.definitionId),
  );
  if (installedProviderExists) return undefined;
  const reachableProviderCount = [
    ...input.playerView.own.gripOrHq,
    ...(input.playerView.specialZones?.setAside ?? []),
  ].filter(
    (entry) =>
      entry.definitionId !== undefined &&
      providerDefinitionIds.has(entry.definitionId),
  ).length;
  return reachableProviderCount === 1 ? "support_for_need" : undefined;
}

export function createRunnerCoverageModule(
  rolesForDefinitionId: (definitionId: string) => readonly string[],
): PlanModule {
  return {
    moduleId: "runner.rig_and_coverage",
    side: "runner",
    discover: (context) =>
      runnerPlanDomain<{ coverageGaps: RunnerCoverageGapSignal[] }>(
        context,
      ).coverageGaps.map((gap) => {
        const preparations = coveragePreparationCandidates(context, gap);
        const installs = coverageInstallCandidates(
          context,
          gap,
          rolesForDefinitionId,
        );
        const funding = coverageFundingCandidates(context, gap);
        const phase = coveragePhase(
          context,
          gap,
          rolesForDefinitionId,
          preparations,
          installs,
        );
        const draws = coverageAcquisitionCandidates(context, gap, phase);
        const routeExists =
          preparations.length > 0 ||
          installs.length > 0 ||
          (phase === "fund_answer" && funding.length > 0) ||
          draws.length > 0;
        return proposal({
          moduleId: "runner.rig_and_coverage",
          dedupeKey: gap.gapId,
          moduleState: {
            kind: "coverage",
            gap,
            phase,
          } satisfies CoverageState,
          priorityClass: gap.priorityClass,
          target: { kind: "capability", id: gap.requiredRole },
          routeExists,
          blockerCode: "no_exact_coverage_route",
          evidenceCode: gap.evidenceCode,
          evidenceCodes: [
            gap.evidenceCode,
            ...(gap.recoveryEvidenceCodes ?? []),
          ],
          ...(gap.requesterPlanInstanceId && gap.requesterNeedId
            ? {
                parentInstanceId: gap.requesterPlanInstanceId,
                parentNeedId: gap.requesterNeedId,
              }
            : {}),
        });
      }),
    assess: (instance, context, portfolio) => {
      const current = instance.moduleState as CoverageState;
      const candidates =
        current.phase === "prepare_coverage"
          ? coveragePreparationCandidates(context, current.gap)
          : current.phase === "install_answer"
            ? coverageInstallCandidates(
                context,
                current.gap,
                rolesForDefinitionId,
              )
            : current.phase === "fund_answer"
              ? coverageFundingCandidates(context, current.gap)
              : coverageAcquisitionCandidates(
                  context,
                  current.gap,
                  current.phase,
                );
      return assessment(
        instance,
        current.gap.priorityClass,
        candidates.length > 0,
        current.phase === "prepare_coverage"
          ? 130
          : current.phase === "install_answer"
            ? current.gap.targetServerId
              ? 120
              : 80
            : current.phase === "fund_answer"
              ? 60 + Math.max(0, current.gap.fundingGap ?? 0)
              : 30,
        portfolio.executorInstanceId,
      );
    },
    materialize: (instance, _assessment, context) => {
      const current = instance.moduleState as CoverageState;
      if (current.phase === "prepare_coverage") {
        const candidates = coveragePreparationCandidates(context, current.gap);
        return {
          step: {
            stepId: `${instance.instanceId}:prepare:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `prepare_${current.gap.requiredRole}`,
              semanticActionTypes: [
                ...new Set(
                  candidates.map((entry) => entry.candidate.semanticActionType),
                ),
              ],
              legalActionTypes: [
                ...new Set(
                  candidates.map((entry) => entry.candidate.actionType),
                ),
              ],
            },
            purpose: `Prepare the exact installed answer for ${current.gap.requiredRole}.`,
          },
          candidates,
        };
      }
      if (current.phase === "install_answer") {
        return {
          step: {
            stepId: `${instance.instanceId}:install:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `install_${current.gap.requiredRole}`,
              semanticActionTypes: ["install.card"],
              legalActionTypes: ["install_card"],
              requiredSourceRoles: [current.gap.requiredRole],
            },
            purpose: `Install an exact answer for ${current.gap.requiredRole}.`,
          },
          candidates: coverageInstallCandidates(
            context,
            current.gap,
            rolesForDefinitionId,
          ),
        };
      }
      if (current.phase === "fund_answer") {
        const candidates = coverageFundingCandidates(context, current.gap);
        return {
          step: {
            stepId: `${instance.instanceId}:fund:${current.gap.requiredRole}`,
            capability: {
              capabilityId: `fund_install_${current.gap.requiredRole}`,
              semanticActionTypes: [
                ...new Set(
                  candidates.map((entry) => entry.candidate.semanticActionType),
                ),
              ],
            },
            purpose: `Fund the visible in-hand answer for ${current.gap.requiredRole}.`,
          },
          candidates,
        };
      }
      const candidates = coverageAcquisitionCandidates(
        context,
        current.gap,
        current.phase,
      );
      return {
        step: {
          stepId: `${instance.instanceId}:find:${current.gap.requiredRole}`,
          capability: {
            capabilityId: `${current.phase}_${current.gap.requiredRole}`,
            semanticActionTypes: [
              ...new Set(
                candidates.map((entry) => entry.candidate.semanticActionType),
              ),
            ],
          },
          purpose: `Find an answer known to exist for ${current.gap.requiredRole}.`,
        },
        candidates,
      };
    },
  };
}

function coveragePhase(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
  rolesForDefinitionId: (definitionId: string) => readonly string[],
  preparations = coveragePreparationCandidates(context, gap),
  installs = coverageInstallCandidates(context, gap, rolesForDefinitionId),
): CoverageState["phase"] {
  const sameTurnConversionNeedsFunding =
    gap.sameTurnRunConversion !== undefined && (gap.fundingGap ?? 0) > 0;
  return sameTurnConversionNeedsFunding
    ? "fund_answer"
    : preparations.length > 0
      ? "prepare_coverage"
      : installs.length > 0
        ? "install_answer"
        : runnerAffordableCoverageSearchActionIds(
              context.input,
              context.actionCandidates,
              gap,
            ).length > 0
          ? "search_answer"
          : gap.answerInHand && (gap.fundingGap ?? 0) > 0
            ? "fund_answer"
            : runnerCoverageAcquisitionPhase(gap);
}

export function runnerCoverageAcquisitionPhase(
  gap: RunnerCoverageGapSignal,
): CoverageState["phase"] {
  return gap.directSearchActionIds.length > 0
    ? "search_answer"
    : gap.searchEngineSetupActionIds.length > 0
      ? "setup_search_engine"
      : "draw_for_answer";
}

export function runnerCoverageAcquisitionActionIds(
  gap: RunnerCoverageGapSignal,
  phase: CoverageState["phase"],
): readonly string[] {
  return phase === "search_answer"
    ? gap.directSearchActionIds
    : phase === "setup_search_engine"
      ? gap.searchEngineSetupActionIds
      : phase === "draw_for_answer"
        ? gap.drawForAnswerActionIds
        : [];
}

export function runnerCoverageCurrentPhase(params: {
  context: PlanSchedulerContext;
  gap: RunnerCoverageGapSignal;
  rolesForDefinitionId: (definitionId: string) => readonly string[];
}): CoverageState["phase"] {
  return coveragePhase(params.context, params.gap, params.rolesForDefinitionId);
}

function coverageInstallCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
  rolesForDefinitionId: (definitionId: string) => readonly string[],
): PlanMaterialization["candidates"] {
  return context.actionCandidates.flatMap((candidate) => {
    if (candidate.semanticActionType !== "install.card") return [];
    if (
      gap.installActionIds !== undefined &&
      !gap.installActionIds.includes(candidate.actionId)
    ) {
      return [];
    }
    if (
      context.actionDispositions?.some(
        (disposition) =>
          disposition.actionId === candidate.actionId &&
          disposition.disposition === "explicitly_nonproductive",
      )
    ) {
      return [];
    }
    const action = context.input.legalActions.find(
      (entry) => entry.actionId === candidate.actionId,
    );
    const optionalProgramTrashInstall =
      action?.payload?.runnerProgramTrashBeforeInstall === true ||
      candidate.actionId.endsWith(".runner_program_trash_before_install");
    const sourceCardInstanceId = runnerInstallSourceCardInstanceId(
      context,
      candidate,
    );
    if (
      optionalProgramTrashInstall &&
      context.actionCandidates.some((alternative) => {
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
          alternativeAction?.payload?.runnerProgramTrashBeforeInstall !==
            true &&
          !alternative.actionId.endsWith(".runner_program_trash_before_install")
        );
      })
    ) {
      return [];
    }
    const sourceDefinitionId = runnerInstallSourceDefinitionId(
      context,
      candidate,
    );
    if (!sourceDefinitionId) return [];
    const roles = rolesForDefinitionId(sourceDefinitionId);
    if (
      !runnerInstallDefinitionCoversCoverageGap(
        sourceDefinitionId,
        roles,
        gap.requiredRole,
        action?.payload?.selectedSubtype,
      )
    )
      return [];
    return [
      {
        candidate,
        sourceRoles: [...new Set([...roles, gap.requiredRole])],
        stepValue: gap.installActionValues?.[candidate.actionId] ?? 100,
      },
    ];
  });
}

function coveragePreparationCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
): PlanMaterialization["candidates"] {
  const actionIds = new Set(gap.preparationActionIds ?? []);
  const memorySupportActionIds = new Set(gap.memorySupportActionIds ?? []);
  return context.actionCandidates
    .filter((candidate) => {
      if (!actionIds.has(candidate.actionId)) return false;
      const action = context.input.legalActions.find(
        (entry) => entry.actionId === candidate.actionId,
      );
      const exactMemorySupportInstall =
        memorySupportActionIds.has(candidate.actionId) &&
        action?.side === "runner" &&
        action.type === "install_card" &&
        action.timingPoint === context.input.playerView.timingPoint &&
        action.expiresAtStateVersion === context.input.playerView.stateVersion;
      return (
        exactMemorySupportInstall ||
        (gap.heapRecoveryPreparation?.actionId === candidate.actionId &&
          gap.heapRecoveryPreparation.stateVersion ===
            context.input.playerView.stateVersion &&
          action?.type === "activated_card_ability" &&
          action.source === gap.heapRecoveryPreparation.sourceCardInstanceId &&
          action.payload?.cardImplementationEffectKind ===
            "move_top_trash_to_grip" &&
          action.payload.targetCardId ===
            gap.heapRecoveryPreparation.currentTopCardInstanceId &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion) ||
        (action?.side === "runner" &&
          action.type === "trigger_ability" &&
          action.timingPoint === context.input.playerView.timingPoint &&
          action.expiresAtStateVersion ===
            context.input.playerView.stateVersion &&
          action.payload?.runnerAbility === "change_icebreaker_subtype" &&
          typeof action.payload.selectedSubtype === "string")
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue: memorySupportActionIds.has(candidate.actionId) ? 120 : 130,
    }));
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

function runnerInstallSourceDefinitionId(
  context: PlanSchedulerContext,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.sourceDefinitionId) return candidate.sourceDefinitionId;
  const sourceCardInstanceId = runnerInstallSourceCardInstanceId(
    context,
    candidate,
  );
  if (!sourceCardInstanceId) return undefined;
  return [
    ...context.input.playerView.own.gripOrHq,
    ...(context.input.playerView.specialZones?.setAside ?? []),
  ].find((card) => card.instanceId === sourceCardInstanceId)?.definitionId;
}

export function runnerInstallDefinitionCoversCoverageGap(
  definitionId: string,
  roles: readonly string[],
  requiredRole: RunnerCoverageGapSignal["requiredRole"],
  selectedSubtype?: unknown,
): boolean {
  if (
    selectedSubtype !== undefined &&
    (typeof selectedSubtype !== "string" ||
      `breaker_${selectedSubtype}` !== requiredRole)
  ) {
    return false;
  }
  if (runnerRolesCoverCoverageGap(roles, requiredRole)) return true;
  const profile = AI_HINTS_BY_CARD.get(definitionId)?.breakerProfile;
  return (
    profile?.configurableCoverage === true &&
    (profile.coverageCandidates ?? []).some(
      (coverage) => `breaker_${coverage}` === requiredRole,
    )
  );
}

function coverageAcquisitionCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
  phase: CoverageState["phase"],
): PlanMaterialization["candidates"] {
  const affordableAlternatives = new Set(
    runnerAffordableCoverageSearchActionIds(
      context.input,
      context.actionCandidates,
      gap,
    ),
  );
  if (gap.answerInHand && affordableAlternatives.size === 0) return [];
  const directSearchIds = new Set(gap.directSearchActionIds);
  const searchSetupIds = new Set(gap.searchEngineSetupActionIds);
  const drawForAnswerIds = new Set(gap.drawForAnswerActionIds);
  // The phase admits an exact acquisition contract. A draw or setup action
  // cannot execute as a search: its continuation has no bound search target.
  const phaseActionIds = new Set(
    runnerCoverageAcquisitionActionIds(gap, phase),
  );
  return context.actionCandidates
    .filter((candidate) => {
      if (gap.answerInHand && !affordableAlternatives.has(candidate.actionId))
        return false;
      const isCoverageRoute = phaseActionIds.has(candidate.actionId);
      const isDrawRoute = drawForAnswerIds.has(candidate.actionId);
      const displacedByGeneralHandDevelopment =
        context.actionDispositions?.some(
          (disposition) =>
            disposition.actionId === candidate.actionId &&
            disposition.disposition === "explicitly_nonproductive",
        ) ?? false;
      return (
        isCoverageRoute &&
        (directSearchIds.has(candidate.actionId) || gap.deckHasAnswer) &&
        (!displacedByGeneralHandDevelopment ||
          directSearchIds.has(candidate.actionId) ||
          (gap.deckHasAnswer && isDrawRoute))
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue: directSearchIds.has(candidate.actionId)
        ? 100
        : searchSetupIds.has(candidate.actionId)
          ? 80
          : drawForAnswerIds.has(candidate.actionId)
            ? 60 +
              Math.min(
                4,
                Math.max(
                  0,
                  (candidate.semanticActionType === "draw.card"
                    ? 1
                    : (candidate.economyProjection?.cardsDrawn ?? 1)) - 1,
                ),
              ) *
                5
            : 5,
    }));
}

function coverageFundingCandidates(
  context: PlanSchedulerContext,
  gap: RunnerCoverageGapSignal,
): PlanMaterialization["candidates"] {
  if (!gap.answerInHand || (gap.fundingGap ?? 0) <= 0) return [];
  const actionIds = new Set(gap.fundingActionIds);
  return context.actionCandidates
    .filter((candidate) => {
      const projection = candidate.economyProjection;
      return (
        !context.actionDispositions?.some(
          (disposition) =>
            disposition.actionId === candidate.actionId &&
            disposition.disposition === "explicitly_nonproductive",
        ) &&
        actionIds.has(candidate.actionId) &&
        projection?.kind === "immediate_liquid" &&
        projection.timing === "immediate" &&
        projection.creditRestriction === "general" &&
        typeof projection.netLiquidCreditGain === "number" &&
        Number.isFinite(projection.netLiquidCreditGain) &&
        projection.netLiquidCreditGain > 0
      );
    })
    .map((candidate) => ({
      candidate,
      stepValue:
        40 +
        Math.min(
          gap.fundingGap ?? 0,
          candidate.economyProjection!.netLiquidCreditGain!,
        ),
    }));
}
