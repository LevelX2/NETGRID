import {
  runPurposeForEvaluation,
  runnerInformationProbeCanUseQuotedPath,
} from "../../plans/runner-run-purpose";
import {
  runnerCandidateSourceDefinitionId,
  runnerInstallSourceInstanceId,
} from "../../runtime/runner-action-source-facts";
import { type AiDecisionInput } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import type { DeckCapabilityProfile } from "../../deck-capabilities";
import type {
  RunnerEconomyPosture,
  RunnerRunTargetEvaluation,
} from "../../runner-run-target-evaluation";
import { type RunnerHandRotationAssessment } from "../../runtime/runner-hand-rotation-assessment";
import type { RunnerStrategicIntentProfile } from "../../runner-strategic-intent";
import { type PriorityClass } from "../../plans/plan-assessment";
import { type RunnerCoverageGapSignal } from "../../plans/runner-coverage-contracts";
import { runnerCardRunHasVisibleDifferentialPayoff } from "../../plans/runner-run-payoff";
import { planInstanceIdForProposal } from "../../plans/plan-instance";
import {
  missingBreakerCoverageKind,
  runnerHandBreakerForCoverage,
} from "../../plans/tactical-plan-breaker-coverage";
import { runnerTerminalContestThreat } from "../../runtime/runner-terminal-contest-threat";
import { mergedPublicHistory } from "../../runtime/public-event-history";
import { runnerBreakerCoverageUpgrade } from "./coverage-breaker-upgrades";
import { runnerBreakerUpgradeSupportActions } from "./coverage-breaker-upgrades";
import { runnerBreakerUpgradeSignalQuote } from "./coverage-breaker-upgrades";
import { runnerCostEffectiveCoverageRecovery } from "./coverage-recovery";
import { runnerCoverageInstallActionValues } from "./coverage-recovery";
import { runnerCoverageGapIsTerminalRemoteThreat } from "./coverage-support";
import { runnerUrgentRemoteCoverageConversionQuote } from "./coverage-support";
import { runnerCoverageFundingActionIds } from "./coverage-support";
import { coverageSupportActionIds } from "./coverage-support";
import { runnerDeckHasCoverageAnswer } from "./coverage-support";
import { planFirstCoverageRole } from "./coverage-card-facts";
import type { RunnerCoverageServices } from "./coverage-services";
export type RunnerCoverageDrawCadence = Readonly<{
  drawAvailable: boolean;
  evidenceCode: string;
}>;

export function runnerCoverageDrawCadence(
  input: AiDecisionInput,
): RunnerCoverageDrawCadence {
  const turnSerial = input.playerView.turnSerial;
  if (!Number.isSafeInteger(turnSerial) || (turnSerial ?? -1) < 0) {
    return {
      drawAvailable: false,
      evidenceCode: "runner_coverage_draw_cadence_turn_invalid",
    };
  }
  const currentTurnSerial = turnSerial as number;
  const drawObserved = mergedPublicHistory(input).some((event) => {
    if (
      event.turnSerial !== currentTurnSerial ||
      event.publicPayload.actor !== "runner"
    ) {
      return false;
    }
    const actionType =
      typeof event.publicPayload.actionType === "string"
        ? event.publicPayload.actionType
        : event.type;
    if (actionType === "draw_card") return true;
    const resolvedEffects = Array.isArray(event.publicPayload.resolvedEffects)
      ? event.publicPayload.resolvedEffects
      : [];
    return resolvedEffects.some(
      (effect) =>
        effect.kind === "draw_cards" &&
        typeof effect.amount === "number" &&
        effect.amount > 0,
    );
  });
  return drawObserved
    ? {
        drawAvailable: false,
        evidenceCode: `runner_coverage_draw_cadence_consumed:${currentTurnSerial}`,
      }
    : {
        drawAvailable: true,
        evidenceCode: `runner_coverage_draw_cadence_available:${currentTurnSerial}`,
      };
}

export function uniqueCoverageGaps(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  runTargets: readonly RunnerRunTargetEvaluation[],
  installedRoles: ReadonlySet<string>,
  deckCapabilities: DeckCapabilityProfile,
  strategicIntent: RunnerStrategicIntentProfile,
  economy: RunnerEconomyPosture,
  handRotation: RunnerHandRotationAssessment,
  services: RunnerCoverageServices,
): RunnerCoverageGapSignal[] {
  const result = new Map<string, RunnerCoverageGapSignal>();
  const coverageDrawCadence = runnerCoverageDrawCadence(input);
  const coverageSearchInterrupt = runTargets.some((evaluation) => {
    if (
      (evaluation.pathPassability !== "blocked_missing_coverage" &&
        evaluation.pathPassability !== "blocked_unbreakable") ||
      !evaluation.evidence.some((entry) =>
        entry.startsWith("missing_coverage:"),
      )
    ) {
      return false;
    }
    const preciseCoverage = missingBreakerCoverageKind(
      input.playerView,
      evaluation.targetServerId,
    );
    const role = planFirstCoverageRole(preciseCoverage, evaluation.evidence);
    return (
      runnerDeckHasCoverageAnswer(deckCapabilities, role) &&
      coverageSupportActionIds(input, candidates, deckCapabilities, role, {
        handRotation,
      }).searchEngineSetupActionIds.length > 0
    );
  });
  const terminalContestThreat = runnerTerminalContestThreat(input);
  for (const evaluation of runTargets) {
    if (
      !runnerCoverageRunTargetHasDifferentialPayoff(
        input,
        candidates,
        evaluation,
        runTargets,
      )
    ) {
      continue;
    }
    if (
      evaluation.targetKind === "remote" &&
      !services.runnerRemoteHasCurrentContestMaterial(
        input,
        evaluation.targetServerId,
      )
    ) {
      continue;
    }
    if (
      evaluation.targetKind === "remote" &&
      services.runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
        input,
        evaluation.targetServerId,
      )
    ) {
      continue;
    }
    const preparation = evaluation.routeQuote?.preRunPreparation;
    if (
      !preparation?.subtypeChanges?.length ||
      (evaluation.recommendation !== "run_now" &&
        evaluation.recommendation !== "run_if_free" &&
        !evaluation.scoreThreat)
    ) {
      continue;
    }
    // A coverage child may prepare only a route its parent would admit.
    // Reuse the parent's information-probe policy on the prepared path;
    // the setup cost is already paid at that future run-start boundary.
    const preparedEvaluation = {
      ...evaluation,
      pathCost: Math.max(0, evaluation.pathCost - preparation.credits),
    };
    if (
      runPurposeForEvaluation(evaluation) === "information" &&
      !runnerInformationProbeCanUseQuotedPath(
        preparedEvaluation,
        services.runnerRunTargetCanConvertNow(
          input,
          economy,
          evaluation,
          candidates,
        ),
        evaluation.targetKind !== "remote" &&
          input.playerView.own.agendaPoints >=
            input.playerView.agendaPointsToWin - 1,
      )
    ) {
      continue;
    }
    const requesterModuleId =
      evaluation.targetKind === "remote"
        ? ("runner.contest_remote" as const)
        : ("runner.pressure_central" as const);
    const requesterDedupeKey =
      evaluation.targetKind === "remote"
        ? `remote:${evaluation.targetServerId}`
        : `central:${evaluation.targetServerId}`;
    for (const change of preparation.subtypeChanges) {
      const requiredRole =
        change.selectedSubtype === "wall"
          ? ("breaker_wall" as const)
          : change.selectedSubtype === "code_gate"
            ? ("breaker_code_gate" as const)
            : change.selectedSubtype === "sentry"
              ? ("breaker_sentry" as const)
              : undefined;
      if (!requiredRole) continue;
      const preparationActionIds = candidates.flatMap((candidate) => {
        const action = input.legalActions.find(
          (entry) => entry.actionId === candidate.actionId,
        );
        return action?.side === "runner" &&
          action.type === "trigger_ability" &&
          action.source === change.sourceCardInstanceId &&
          runnerCandidateSourceDefinitionId(input, candidate) ===
            change.sourceDefinitionId &&
          action.payload?.runnerAbility === "change_icebreaker_subtype" &&
          action.payload.selectedSubtype === change.selectedSubtype
          ? [candidate.actionId]
          : [];
      });
      if (preparationActionIds.length === 0) continue;
      const gapId = `coverage:${requiredRole}:prepare-run:${encodeURIComponent(evaluation.actionId)}:${encodeURIComponent(change.sourceCardInstanceId)}`;
      result.set(`${requesterModuleId}:${requesterDedupeKey}:${gapId}`, {
        gapId,
        needKind: "missing_coverage",
        requiredRole,
        targetServerId: evaluation.targetServerId,
        targetRunActionId: evaluation.actionId,
        requesterModuleId,
        requesterPlanInstanceId: planInstanceIdForProposal({
          moduleId: requesterModuleId,
          dedupeKey: requesterDedupeKey,
        }),
        requesterNeedId: gapId,
        priorityClass: evaluation.scoreThreat ? "P2" : "P4",
        evidenceCode: `pre_run_coverage_preparation:${evaluation.targetServerId}:${change.selectedSubtype}`,
        deckHasAnswer: true,
        answerInHand: true,
        preparationActionIds,
        fundingActionIds: [],
        directSearchActionIds: [],
        searchEngineSetupActionIds: [],
        drawForAnswerActionIds: [],
      });
    }
  }
  for (const evaluation of [...runTargets].sort(
    (left, right) =>
      right.score - left.score || left.actionId.localeCompare(right.actionId),
  )) {
    if (
      !runnerCoverageRunTargetHasDifferentialPayoff(
        input,
        candidates,
        evaluation,
        runTargets,
      )
    ) {
      continue;
    }
    if (
      evaluation.targetKind === "remote" &&
      !services.runnerRemoteHasCurrentContestMaterial(
        input,
        evaluation.targetServerId,
      )
    ) {
      continue;
    }
    if (
      evaluation.targetKind === "remote" &&
      services.runnerRemoteHasKnownIceScheduledForRunnerTurnEndTrash(
        input,
        evaluation.targetServerId,
      )
    ) {
      continue;
    }
    const outsideMissingCoverageScope =
      evaluation.recommendation !== "find_breaker_first" &&
      evaluation.pathPassability !== "blocked_missing_coverage" &&
      evaluation.pathPassability !== "blocked_unbreakable";
    // A terminal contest needs the existing path funded before it needs a
    // cheaper future breaker. Check every exact same-server run, since an
    // expensive event can otherwise hide a feasible basic-run setup.
    if (
      outsideMissingCoverageScope &&
      runnerCoverageGapIsTerminalRemoteThreat(input, evaluation) &&
      runTargets.some(
        (target) =>
          target.targetServerId === evaluation.targetServerId &&
          target.routeQuote?.unknownIceCount === 0 &&
          target.routeQuote.conditionalReasons.length === 0 &&
          (target.unavoidableVisibleIceHazardCount ?? 0) === 0 &&
          !target.visibleTraceTagHazardUnavoidable &&
          (services.runnerRunTargetCanConvertNow(
            input,
            economy,
            target,
            candidates,
          ) ||
            (services.runnerRunFundingSupport(
              input,
              economy,
              target,
              runTargets,
              candidates,
            )?.routeActionIds.length ?? 0) > 0),
      )
    )
      continue;
    const preciseCoverage = missingBreakerCoverageKind(
      input.playerView,
      evaluation.targetServerId,
    );
    const role = planFirstCoverageRole(preciseCoverage, evaluation.evidence);
    const costRecovery = runnerCostEffectiveCoverageRecovery(
      input,
      candidates,
      evaluation,
      deckCapabilities,
    );
    const coverageUpgrade = costRecovery
      ? undefined
      : runnerBreakerCoverageUpgrade(
          input,
          candidates,
          evaluation,
          deckCapabilities,
          economy,
          services,
        );
    const coverageDevelopment = costRecovery ?? coverageUpgrade;
    if (outsideMissingCoverageScope && !coverageDevelopment) {
      continue;
    }
    const requiredRole = coverageDevelopment?.requiredRole ?? role;
    const terminalRemoteCoverageThreat =
      runnerCoverageGapIsTerminalRemoteThreat(input, evaluation);
    const terminalRemotePatternThreat =
      terminalContestThreat?.remoteServerIds.includes(
        evaluation.targetServerId,
      ) === true;
    if (installedRoles.has(requiredRole) && !coverageDevelopment) continue;
    const installActionValues = runnerCoverageInstallActionValues(
      input,
      candidates,
      evaluation.targetServerId,
      requiredRole,
    );
    const legalCoverageInstallActionIds = Object.keys(installActionValues).sort(
      (left, right) =>
        (installActionValues[right] ?? Number.NEGATIVE_INFINITY) -
          (installActionValues[left] ?? Number.NEGATIVE_INFINITY) ||
        left.localeCompare(right),
    );
    const bestLegalCoverageCandidate = candidates.find(
      (candidate) => candidate.actionId === legalCoverageInstallActionIds[0],
    );
    const bestLegalCoverageCard = bestLegalCoverageCandidate
      ? input.playerView.own.gripOrHq.find(
          (card) =>
            card.instanceId ===
            runnerInstallSourceInstanceId(
              bestLegalCoverageCandidate,
              input.legalActions.find(
                (action) =>
                  action.actionId === bestLegalCoverageCandidate.actionId,
              ),
            ),
        )
      : undefined;
    const visibleAnswer =
      coverageDevelopment?.visibleAnswer ??
      bestLegalCoverageCard ??
      runnerHandBreakerForCoverage(input.playerView, preciseCoverage);
    const answerInstallCost = coverageDevelopment
      ? visibleAnswer?.installCost
      : bestLegalCoverageCandidate?.costProfile.costKnownStatus === "known"
        ? (bestLegalCoverageCandidate.costProfile.creditCost ?? 0)
        : visibleAnswer?.installCost;
    const baseSupportActions = coverageSupportActionIds(
      input,
      candidates,
      deckCapabilities,
      requiredRole,
      {
        ...(coverageDevelopment?.deckHasAlternative !== undefined
          ? {
              deckHasStackAnswerOverride:
                coverageDevelopment.deckHasAlternative,
            }
          : {}),
        ...(coverageDevelopment?.targetDefinitionId
          ? {
              targetDefinitionIdOverride:
                coverageDevelopment.targetDefinitionId,
            }
          : {}),
        handRotation,
        terminalRemoteCoverageThreat,
      },
    );
    const supportActionsBeforeCadence = coverageUpgrade
      ? runnerBreakerUpgradeSupportActions(
          baseSupportActions,
          coverageUpgrade.searchActionId,
        )
      : baseSupportActions;
    const supportActions =
      terminalRemoteCoverageThreat || coverageDrawCadence.drawAvailable
        ? supportActionsBeforeCadence
        : {
            ...supportActionsBeforeCadence,
            drawForAnswerActionIds: [],
          };
    if (
      coverageUpgrade?.recoveryMode === "search_known_upgrade" &&
      supportActions.directSearchActionIds.length === 0
    ) {
      continue;
    }
    const deckHasAnswer =
      visibleAnswer !== undefined ||
      (coverageDevelopment
        ? coverageDevelopment.deckHasAlternative
        : runnerDeckHasCoverageAnswer(deckCapabilities, requiredRole)) ||
      supportActions.directSearchActionIds.length > 0;
    const installActionIds = visibleAnswer
      ? coverageDevelopment
        ? candidates
            .filter((candidate) => {
              const action = input.legalActions.find(
                (legalAction) => legalAction.actionId === candidate.actionId,
              );
              return (
                candidate.semanticActionType === "install.card" &&
                runnerInstallSourceInstanceId(candidate, action) ===
                  visibleAnswer.instanceId
              );
            })
            .map((candidate) => candidate.actionId)
        : legalCoverageInstallActionIds
      : undefined;
    const sameTurnRunConversion = runnerUrgentRemoteCoverageConversionQuote(
      input,
      candidates,
      evaluation,
      visibleAnswer,
      answerInstallCost,
      installActionIds,
      services,
    );
    const fundingTargetCredits =
      sameTurnRunConversion?.requiredCredits ?? answerInstallCost;
    const fundingGap =
      fundingTargetCredits === undefined
        ? undefined
        : Math.max(0, fundingTargetCredits - input.playerView.own.credits);
    const baseGapId = coverageUpgrade
      ? `coverage:${requiredRole}:upgrade:${evaluation.targetServerId}`
      : costRecovery
        ? `coverage:${requiredRole}:efficiency:${evaluation.targetServerId}`
        : `coverage:${requiredRole}`;
    const requesterModuleId =
      evaluation.targetKind === "remote"
        ? ("runner.contest_remote" as const)
        : ("runner.pressure_central" as const);
    const requesterDedupeKey =
      evaluation.targetKind === "remote"
        ? `remote:${evaluation.targetServerId}`
        : `central:${evaluation.targetServerId}`;
    const bindToRequester =
      coverageUpgrade !== undefined ||
      terminalRemotePatternThreat ||
      sameTurnRunConversion !== undefined ||
      (requesterModuleId === "runner.pressure_central" &&
        evaluation.score > 0 &&
        evaluation.knownAccessState !== "known_no_current_payoff" &&
        evaluation.accessPayoff !== "known_low_value");
    const needKind = coverageUpgrade
      ? ("coverage_upgrade" as const)
      : costRecovery
        ? ("cost_ineffective_coverage" as const)
        : ("missing_coverage" as const);
    const gapId =
      bindToRequester && !terminalRemotePatternThreat
        ? `${baseGapId}:run:${encodeURIComponent(evaluation.actionId)}`
        : baseGapId;
    if (result.has(gapId)) continue;
    result.set(gapId, {
      gapId,
      needKind,
      requiredRole,
      targetServerId: evaluation.targetServerId,
      targetRunActionId: evaluation.actionId,
      ...(bindToRequester
        ? {
            requesterModuleId,
            requesterPlanInstanceId: planInstanceIdForProposal({
              moduleId: requesterModuleId,
              dedupeKey: requesterDedupeKey,
            }),
            requesterNeedId: gapId,
          }
        : {}),
      priorityClass:
        sameTurnRunConversion !== undefined || terminalRemoteCoverageThreat
          ? "P2"
          : coverageUpgrade
            ? "P5"
            : visibleAnswer
              ? "P4"
              : "P5",
      evidenceCode: terminalRemoteCoverageThreat
        ? `terminal_remote_coverage:${evaluation.targetServerId}`
        : coverageUpgrade
          ? `coverage_upgrade:${evaluation.targetServerId}:${coverageUpgrade.targetDefinitionId}`
          : costRecovery
            ? `cost_ineffective_coverage:${evaluation.targetServerId}:${evaluation.pathCost}`
            : (evaluation.evidence[0] ?? `missing_${requiredRole}`),
      deckHasAnswer,
      answerInHand: visibleAnswer !== undefined,
      ...(answerInstallCost !== undefined ? { answerInstallCost } : {}),
      ...(installActionIds !== undefined ? { installActionIds } : {}),
      ...(fundingGap !== undefined ? { fundingGap } : {}),
      ...(sameTurnRunConversion ? { sameTurnRunConversion } : {}),
      ...(coverageDevelopment
        ? {
            currentKnownPathCost: evaluation.pathCost,
            currentPathFundingGap: Math.max(
              0,
              evaluation.routeQuote?.fundingGap ?? 0,
            ),
            recoveryMode: coverageDevelopment.recoveryMode,
            recoveryEvidenceCodes: [
              ...coverageDevelopment.evidenceCodes,
              ...(!terminalRemoteCoverageThreat &&
              !coverageDrawCadence.drawAvailable
                ? [coverageDrawCadence.evidenceCode]
                : []),
            ],
          }
        : !terminalRemoteCoverageThreat && !coverageDrawCadence.drawAvailable
          ? {
              recoveryEvidenceCodes: [coverageDrawCadence.evidenceCode],
            }
          : {}),
      ...(coverageUpgrade
        ? {
            upgradeQuote: runnerBreakerUpgradeSignalQuote(coverageUpgrade),
            ...(coverageUpgrade.memorySupportActionId
              ? {
                  memorySupportActionIds: [
                    coverageUpgrade.memorySupportActionId,
                  ],
                  preparationActionIds: [coverageUpgrade.memorySupportActionId],
                }
              : {}),
          }
        : {}),
      fundingActionIds: runnerCoverageFundingActionIds(
        input,
        candidates,
        gapId,
        fundingTargetCredits,
        fundingGap,
        false,
        sameTurnRunConversion?.requiredClicksAfterFunding ?? 1,
        services,
      ),
      installActionValues,
      ...supportActions,
    });
  }
  if (
    (strategicIntent.setupEngine ?? []).includes("runner.rig_first") ||
    (strategicIntent.setupEngine ?? []).includes(
      "runner.search_breaker_setup",
    ) ||
    strategicIntent.planContributions?.some(
      (contribution) =>
        contribution.ownerModuleId === "runner.rig_and_coverage" &&
        contribution.objective === "maintain_required_coverage",
    ) === true ||
    strategicIntent.executionStyle === "runner.setup_first" ||
    coverageSearchInterrupt
  ) {
    const matrix = deckCapabilities.runner?.breakerCoverageMatrix;
    for (const [coverage, role] of [
      ["wall", "breaker_wall"],
      ["code_gate", "breaker_code_gate"],
      ["sentry", "breaker_sentry"],
    ] as const) {
      const state = matrix?.[coverage];
      if (
        !state ||
        state.installed ||
        installedRoles.has(role) ||
        (!state.inDeckKnown && !state.inHand)
      ) {
        continue;
      }
      const existing = [...result.entries()].filter(
        ([, gap]) => gap.requiredRole === role,
      );
      if (existing.length > 0) {
        if (state.inHand) {
          for (const [key, gap] of existing) {
            if (gap.priorityClass === "P5") {
              result.set(key, { ...gap, priorityClass: "P4" });
            }
          }
        }
        continue;
      }
      const visibleAnswer = runnerHandBreakerForCoverage(
        input.playerView,
        role,
      );
      const answerInstallCost = visibleAnswer?.installCost;
      const fundingGap =
        answerInstallCost === undefined
          ? undefined
          : Math.max(0, answerInstallCost - input.playerView.own.credits);
      const supportActions = coverageSupportActionIds(
        input,
        candidates,
        deckCapabilities,
        role,
        { handRotation },
      );
      const cadenceBoundSupportActions = coverageDrawCadence.drawAvailable
        ? supportActions
        : {
            ...supportActions,
            drawForAnswerActionIds: [],
          };
      const deckHasAnswer =
        state.inDeckKnown ||
        state.inHand ||
        cadenceBoundSupportActions.directSearchActionIds.length > 0;
      const installActionValues = runnerCoverageInstallActionValues(
        input,
        candidates,
        undefined,
        role,
      );
      result.set(role, {
        gapId: `coverage:${role}`,
        requiredRole: role,
        priorityClass:
          state.inHand || (coverageSearchInterrupt && state.searchableNow)
            ? "P4"
            : "P5",
        evidenceCode:
          coverageSearchInterrupt && state.searchableNow
            ? `visible_${coverage}_coverage_search_interrupt`
            : `deck_strategy_open_${coverage}_coverage`,
        deckHasAnswer,
        answerInHand: visibleAnswer !== undefined,
        ...(answerInstallCost !== undefined ? { answerInstallCost } : {}),
        ...(fundingGap !== undefined ? { fundingGap } : {}),
        fundingActionIds: runnerCoverageFundingActionIds(
          input,
          candidates,
          `coverage:${role}`,
          answerInstallCost,
          fundingGap,
          true,
          undefined,
          services,
        ),
        installActionValues,
        installActionIds: Object.keys(installActionValues),
        ...(!coverageDrawCadence.drawAvailable
          ? {
              recoveryEvidenceCodes: [coverageDrawCadence.evidenceCode],
            }
          : {}),
        ...cadenceBoundSupportActions,
      });
    }
  }
  return dedupeCoverageGapsByGapId([...result.values()]);
}

export function dedupeCoverageGapsByGapId(
  gaps: readonly RunnerCoverageGapSignal[],
): RunnerCoverageGapSignal[] {
  const byGapId = new Map<string, RunnerCoverageGapSignal>();
  for (const gap of gaps) {
    const current = byGapId.get(gap.gapId);
    if (!current || coverageGapPrecedes(gap, current)) {
      byGapId.set(gap.gapId, gap);
    }
  }
  return [...byGapId.values()];
}

export function coverageGapPrecedes(
  candidate: RunnerCoverageGapSignal,
  current: RunnerCoverageGapSignal,
): boolean {
  const priorityRank = (priority: PriorityClass) =>
    ({ P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6 })[priority];
  const candidateRank = priorityRank(candidate.priorityClass);
  const currentRank = priorityRank(current.priorityClass);
  if (candidateRank !== currentRank) return candidateRank < currentRank;

  const requesterRank = (gap: RunnerCoverageGapSignal) =>
    gap.requesterModuleId === "runner.contest_remote" ? 0 : 1;
  const candidateRequesterRank = requesterRank(candidate);
  const currentRequesterRank = requesterRank(current);
  if (candidateRequesterRank !== currentRequesterRank)
    return candidateRequesterRank < currentRequesterRank;

  return (
    [candidate.targetServerId ?? "", candidate.targetRunActionId ?? ""].join(
      ":",
    ) <
    [current.targetServerId ?? "", current.targetRunActionId ?? ""].join(":")
  );
}

export function runnerCoverageRunTargetHasDifferentialPayoff(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  evaluation: RunnerRunTargetEvaluation,
  runTargets: readonly RunnerRunTargetEvaluation[],
): boolean {
  const candidate = candidates.find(
    (entry) => entry.actionId === evaluation.actionId,
  );
  if (candidate?.semanticActionType !== "play.runner_event") return true;
  const directRunAvailable = candidates.some(
    (entry) =>
      entry.semanticActionType === "run.start" &&
      entry.runProjectionSummary?.serverId === evaluation.targetServerId,
  );
  return (
    !directRunAvailable ||
    runnerCardRunHasVisibleDifferentialPayoff(
      input,
      candidate,
      evaluation.targetServerId,
      runTargets,
    )
  );
}
