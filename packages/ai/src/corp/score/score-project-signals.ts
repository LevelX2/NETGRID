import {
  CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { AI_HINTS_BY_CARD } from "../../ai-hints";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  corpSameTurnScoreConversionPaths,
  type CorpScoreConversionStep,
} from "../../plans/tactical-plan-corp-score-conversion";
import {
  corpCandidateProvidesScoreConversion,
  corpScoreConversionProfile,
} from "../../runtime/corp-canonical-card-facts";
import {
  corpCentralDefenseHqAgendaExposureIsDeadline,
  type CorpCentralDefenseAllocation,
} from "../defense/corp-central-defense-allocation";
import {
  corpMatureRemoteAffordableDefenseLayerCertification,
  corpRemoteHasBoundedStagedIce,
} from "../defense/corp-defense-layer-certification";
import { type CorpFundedRemoteAccessRiskNeed } from "../../runtime/corp-funded-score-protection";
import { compareExactProbabilities } from "../../runtime/corp-score-protection-assessment";
import {
  corpScorelineActionCanCloseThisTurn,
  type CorpScorelineFeasibility,
} from "../../runtime/corp-scoreline-feasibility";
import { CorpScoreAccelerationSetupBinding } from "../../runtime/corp-scoreline/score-hand-support";
import {
  hasExactNonNegativeCostProfile,
  isFiniteNonNegativeInteger,
} from "../../runtime/exact-action-cost-facts";
import { projectKnownCorpCardAccessEffect } from "../../runtime/known-corp-card-access-effect-projection";
import { visibleOwnCardByInstanceId } from "../../runtime/runner-action-source-facts";
import { technicalIdCompare } from "../../runtime/runtime-identifiers";
import {
  candidateIsVisibleCorpAgendaInstall,
  candidateTargetIds,
  isCorpInstallServerId,
  requireVisibleCandidateSource,
  serverForInstalledCard,
  visibleCardIsAgenda,
  visibleInstalledCard,
  visibleKnownCardType,
} from "../../runtime/visible-action-facts";
import {
  requireVisibleAgendaAdvancementRequirement,
  requireVisibleAgendaPoints,
  requireVisibleCardDefinition,
} from "../../runtime/visible-agenda-facts";
import { corpCandidateIsAmbushInstall } from "../ambush/corp-ambush-plan-signals";
import { corpExactCurrentBasicLiquidCreditCandidate } from "../economy/economy-domain-signals";
import { corpScorePriorityClass } from "./corp-score-priority";
import { corpInstalledScoreResourceCost } from "./score-reserve-restoration";
import {
  corpFundedScoreProtectionNeed,
  corpScoreProtectionNeedIsSatisfied,
  remainingAgendaAdvancementCreditsAfterAction,
} from "./score-protection-needs";
export function corpScoredAgendaRevealWithoutPurposeDispositionEvidence(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): string | undefined {
  if (candidate.semanticActionType !== "card_ability.trigger") {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.payload?.agendaAbility !== "v1919_scored_agenda_reveal_rd_top" ||
    !candidate.sourceCardInstanceId ||
    !input.playerView.own.scoreArea.some(
      (card) => card.instanceId === candidate.sourceCardInstanceId,
    )
  ) {
    return undefined;
  }
  return "corp_scored_agenda_reveal_rd_top_has_no_bound_downstream_plan";
}

export function corpCandidateIsScoreAccelerationSupport(
  candidate: ActionSemanticCandidate,
): boolean {
  if (
    ![
      "corp_window.rez",
      "card_ability.trigger",
      "play.corp_operation",
      "score_conversion.move_advancement",
      "score_conversion.place_advancement",
      "score_conversion.gain_action_capacity",
    ].includes(candidate.semanticActionType)
  ) {
    return false;
  }
  return corpCandidateProvidesScoreConversion(candidate);
}

export function corpRemoteCreationLockRemovalAction(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): LegalAction | undefined {
  if (
    candidate.semanticActionType !== "card_ability.trigger" ||
    candidate.costProfile.costKnownStatus !== "known"
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  return action?.targetRequirements.some(
    (requirement) =>
      requirement.id === "newDataFortCreationLockSource" &&
      requirement.kind === "card" &&
      requirement.side === "runner" &&
      requirement.visibility === "public",
  )
    ? action
    : undefined;
}

export function corpNextTurnScoreContinuationProjects(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): CorpScoreProjectSignal[] {
  return input.playerView.servers.flatMap((server) =>
    server.root.flatMap((agenda) => {
      const quote = agenda.scoreContinuationQuote;
      if (
        !agenda.known ||
        !visibleCardIsAgenda(input, agenda) ||
        quote?.context !== "installed_agenda" ||
        quote.complete !== true ||
        quote.agendaCardId !== agenda.instanceId ||
        quote.serverId !== server.id ||
        quote.expiresAtStateVersion !== input.playerView.stateVersion ||
        !Number.isSafeInteger(quote.remainingAdvancementCounters) ||
        quote.remainingAdvancementCounters < 0 ||
        !Number.isSafeInteger(quote.creditsRequiredBeforeNextCorpTurn) ||
        quote.creditsRequiredBeforeNextCorpTurn < 0 ||
        !Number.isSafeInteger(quote.nextCorpTurnGuaranteedFlexibleClicks) ||
        quote.nextCorpTurnGuaranteedFlexibleClicks <
          quote.remainingAdvancementCounters ||
        !Number.isSafeInteger(quote.certifiedCreditGainFromFreeClicks) ||
        quote.certifiedCreditGainFromFreeClicks < 0
      ) {
        return [];
      }
      const agendaPoints = requireVisibleAgendaPoints(input, agenda);
      const currentScoreCredits =
        quote.remainingAdvancementCounters *
          quote.advancementCreditCostPerCounter +
        quote.scoreActionCreditCost;
      const currentScoreClicks =
        quote.remainingAdvancementCounters *
          quote.advancementClickCostPerCounter +
        quote.scoreActionClickCost;
      const currentFundingGap = Math.max(
        0,
        currentScoreCredits - input.playerView.own.credits,
      );
      const exactBasicCreditAvailable = candidates.some((candidate) =>
        corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
      );
      const sameTurnCloseout =
        input.side === "corp" &&
        input.playerView.activeSide === "corp" &&
        input.playerView.timingPoint === "corp_action.main" &&
        [
          quote.advancementCreditCostPerCounter,
          quote.advancementClickCostPerCounter,
          quote.scoreActionCreditCost,
          quote.scoreActionClickCost,
          currentScoreCredits,
          currentScoreClicks,
        ].every(isFiniteNonNegativeInteger) &&
        (currentFundingGap === 0 || exactBasicCreditAvailable) &&
        currentScoreClicks + currentFundingGap <= input.playerView.own.clicks;
      return [
        {
          projectId: corpScoreProjectId(agenda.instanceId, server.id),
          agendaDefinitionId: agenda.definitionId ?? agenda.instanceId,
          agendaPoints,
          agendaInstanceId: agenda.instanceId,
          serverId: server.id,
          phase:
            quote.remainingAdvancementCounters === 0
              ? ("score_agenda" as const)
              : ("advance_agenda" as const),
          sameTurnCloseout,
          ...(sameTurnCloseout && currentFundingGap > 0
            ? { fundingGap: currentFundingGap }
            : {}),
          ...(quote.terminalScore ? { deadlinePressure: true } : {}),
          terminalScore: quote.terminalScore,
          conversion: corpScoreConversionFacts({
            input,
            agenda,
            serverId: server.id,
            remainingAdvancementClicks: quote.remainingAdvancementCounters,
            remainingScoreCredits: sameTurnCloseout
              ? currentScoreCredits
              : quote.creditsRequiredBeforeNextCorpTurn,
            residentParent: true,
            realizedStrategySupportCount: 0,
          }),
          feasible: true,
          continuationReserve: {
            agendaCardId: quote.agendaCardId,
            serverId: quote.serverId,
            requiredCreditsBeforeNextCorpTurn:
              quote.creditsRequiredBeforeNextCorpTurn,
            remainingAdvancementCounters: quote.remainingAdvancementCounters,
            nextCorpTurnGuaranteedFlexibleClicks:
              quote.nextCorpTurnGuaranteedFlexibleClicks,
            certifiedCreditGainFromFreeClicks:
              quote.certifiedCreditGainFromFreeClicks,
          },
          evidenceCode: `engine_certified_next_turn_score_continuation:${agenda.instanceId}:${server.id}`,
        },
      ];
    }),
  );
}

export function corpRemoteCreationUnlockScoreProjects(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
): CorpScoreProjectSignal[] {
  const action = corpRemoteCreationLockRemovalAction(input, candidate);
  if (
    !action ||
    input.playerView.servers.some((server) => server.id.startsWith("remote_"))
  ) {
    return [];
  }
  return input.playerView.own.gripOrHq.flatMap((card) => {
    if (visibleKnownCardType(input, card) !== "agenda") return [];
    const agendaPoints = requireVisibleAgendaPoints(input, card);
    const projectId = corpScoreProjectId(card.instanceId, "new_remote");
    return [
      {
        projectId,
        agendaDefinitionId: card.definitionId ?? card.instanceId,
        agendaPoints,
        agendaInstanceId: card.instanceId,
        serverId: "new_remote",
        actionIds: [candidate.actionId],
        phase: "unlock_remote_creation",
        sameTurnCloseout: false,
        terminalScore:
          input.playerView.own.agendaPoints + agendaPoints >=
          input.playerView.agendaPointsToWin,
        feasible: true,
        evidenceCode: `corp_score_remote_creation_lock_removal:${card.instanceId}:new_remote`,
      },
    ];
  });
}

export function scoreProjectForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  scorelineFeasibility: CorpScorelineFeasibility | undefined,
  centralDefenseAllocation: CorpCentralDefenseAllocation | undefined,
  preferredDeckoutAgendaRecycleRouteAvailable: boolean,
  preparedScoreContinuationAvailable: boolean,
  residentScoreDefenseBinding?: Readonly<{
    agendaInstanceId: string;
    serverId: string;
  }>,
  recentlyCompromisedRemoteIds: ReadonlySet<string> = new Set(),
): CorpScoreProjectSignal[] {
  const obligationRemovalAction = input.legalActions.find(
    (action) =>
      action.actionId === candidate.actionId &&
      action.side === "corp" &&
      action.type === "trigger_ability" &&
      action.source === "game_rule" &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.payload?.obligationDebtAbility === "remove_obligation" &&
      action.payload?.abilityId === "remove_obligation",
  );
  if (obligationRemovalAction) {
    const agendaPoints =
      obligationRemovalAction.payload?.obligationDebtScoreAgendaPoints;
    const obligationCount =
      obligationRemovalAction.payload?.obligationDebtCountBefore;
    const creditCost =
      obligationRemovalAction.payload?.obligationDebtCreditCost;
    const legalActionCostsAreExact = obligationRemovalAction.costs.every(
      (cost) =>
        (cost.credits === undefined ||
          isFiniteNonNegativeInteger(cost.credits)) &&
        (cost.clicks === undefined || isFiniteNonNegativeInteger(cost.clicks)),
    );
    const quotedCreditCost = obligationRemovalAction.costs.reduce(
      (sum, cost) => sum + (cost.credits ?? 0),
      0,
    );
    const quotedClickCost = obligationRemovalAction.costs.reduce(
      (sum, cost) => sum + (cost.clicks ?? 0),
      0,
    );
    if (
      typeof agendaPoints !== "number" ||
      !Number.isSafeInteger(agendaPoints) ||
      agendaPoints <= 0 ||
      typeof obligationCount !== "number" ||
      !Number.isSafeInteger(obligationCount) ||
      obligationCount <= 0 ||
      typeof creditCost !== "number" ||
      !Number.isSafeInteger(creditCost) ||
      creditCost < 0 ||
      !legalActionCostsAreExact ||
      quotedCreditCost !== creditCost ||
      quotedClickCost <= 0
    ) {
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        unresolvedActionIds: [candidate.actionId],
        owner: "rules_contract",
        removalCondition: [
          "A legal obligation-removal score conversion must quote its positive agenda gain, active obligation count, exact credit cost, and exact action costs.",
          `agendaPoints=${String(agendaPoints)}`,
          `obligationCount=${String(obligationCount)}`,
          `payloadCreditCost=${String(creditCost)}`,
          `legalCreditCost=${quotedCreditCost}`,
          `legalClickCost=${quotedClickCost}`,
          `legalCostsExact=${legalActionCostsAreExact}`,
        ].join(" "),
      });
    }
    return [
      {
        projectId: "obligation-debt-removal",
        agendaPoints,
        actionIds: [candidate.actionId],
        routeSemanticActionTypes: [candidate.semanticActionType],
        phase: "convert_agenda",
        sameTurnCloseout: true,
        deadlinePressure: true,
        terminalScore:
          input.playerView.own.agendaPoints + agendaPoints >=
          input.playerView.agendaPointsToWin,
        feasible: true,
        evidenceCode: `corp_obligation_debt_score_conversion:${obligationCount}:${creditCost}:${agendaPoints}`,
      },
    ];
  }
  if (candidateIsVisibleCorpAgendaInstall(input, candidate)) {
    const agenda = requireVisibleCandidateSource(input, candidate);
    const agendaDefinitionId =
      candidate.sourceDefinitionId ?? agenda.definitionId;
    if (!agendaDefinitionId) return [];
    const agendaPoints = requireVisibleAgendaPoints(input, agenda);
    const serverId = candidateTargetIds(candidate).find(isCorpInstallServerId);
    const projectId = corpScoreProjectId(
      candidate.sourceCardInstanceId ?? agendaDefinitionId,
      serverId,
    );
    const sameTurnCloseout = corpScorelineActionCanCloseThisTurn(
      scorelineFeasibility,
      candidate.actionId,
    );
    // A forced agenda discard creates a new, publicly accessible scoring
    // source in Archives. An empty remote keeps the same card concealed and
    // preserves a bounded score attempt. This is a risky Score
    // route, never a claim that the Runner cannot steal it.
    const forcedAgendaDiscardRelief =
      input.playerView.own.gripOrHq.length > input.playerView.own.maxHandSize &&
      input.playerView.own.gripOrHq.every((card) =>
        visibleCardIsAgenda(input, card),
      ) &&
      (serverId === "new_remote" ||
        input.playerView.servers.some(
          (server) => server.id === serverId && server.root.length === 0,
        )) &&
      (corpAgendaInstallHasCertifiedNearTermScoreHorizon(
        input,
        candidate,
        serverId,
      ) ||
        (serverId !== undefined &&
          corpAgendaInstallScoreHorizonShortfall(input, candidate, serverId) ===
            1)) &&
      hasExactNonNegativeCostProfile(candidate) &&
      remainingAgendaAdvancementCreditsAfterAction(input, candidate, agenda) +
        candidate.costProfile.creditCost! <=
        input.playerView.own.credits;
    const deadlinePressure =
      scorelineFeasibility?.deadline === "last_draw_window" ||
      scorelineFeasibility?.deadline === "current_turn_only" ||
      corpDeckoutAgendaFloodRequiresScoreDevelopment(input) ||
      corpCentralDefenseHqAgendaExposureIsDeadline(centralDefenseAllocation) ||
      forcedAgendaDiscardRelief;
    const matchpointTarget =
      input.playerView.own.agendaPoints + agendaPoints >=
      input.playerView.agendaPointsToWin;
    const scoreActionSemanticsKnown = hasExactNonNegativeCostProfile(candidate);
    const protectionNeed =
      serverId !== undefined && !sameTurnCloseout && scoreActionSemanticsKnown
        ? corpFundedScoreProtectionNeed(
            input,
            candidate,
            agenda,
            projectId,
            serverId,
            matchpointTarget,
            deadlinePressure,
          )
        : undefined;
    const residentBoundedStagedScoreWindow =
      serverId !== undefined &&
      serverId !== "new_remote" &&
      candidate.sourceCardInstanceId ===
        residentScoreDefenseBinding?.agendaInstanceId &&
      serverId === residentScoreDefenseBinding?.serverId &&
      corpRemoteHasBoundedStagedIce(
        input,
        serverId,
        agendaPoints,
        requireVisibleAgendaAdvancementRequirement(input, agenda),
      );
    const handPressureBoundedStagedScoreWindow =
      serverId !== undefined &&
      serverId !== "new_remote" &&
      input.playerView.own.gripOrHq.length >=
        input.playerView.own.maxHandSize &&
      !input.legalActions.some((action) => {
        if (
          action.side !== "corp" ||
          action.type !== "install_card" ||
          action.payload?.placement !== "ice" ||
          !action.source
        ) {
          return false;
        }
        const source = input.playerView.own.gripOrHq.find(
          (card) => card.instanceId === action.source,
        );
        return source?.known === true && source.type === "ice";
      }) &&
      corpRemoteHasBoundedStagedIce(
        input,
        serverId,
        agendaPoints,
        requireVisibleAgendaAdvancementRequirement(input, agenda),
      );
    const lastViableDeckoutMatchpointWindow =
      matchpointTarget && scorelineFeasibility?.deadline === "last_draw_window";
    const boundedStagedScoreWindow =
      residentBoundedStagedScoreWindow || handPressureBoundedStagedScoreWindow;
    const certifiedNearTermScoreHorizon =
      sameTurnCloseout ||
      corpAgendaInstallHasCertifiedNearTermScoreHorizon(
        input,
        candidate,
        serverId,
      );
    const lastDrawAgendaRecycleWindow =
      scorelineFeasibility?.deadline === "last_draw_window" &&
      certifiedNearTermScoreHorizon &&
      corpAgendaRecyclesHqAgendasIntoRd(agendaDefinitionId) &&
      input.playerView.own.gripOrHq.filter((card) =>
        visibleCardIsAgenda(input, card),
      ).length >= 2;
    const deckoutAgendaFloodScoreWindow =
      !sameTurnCloseout &&
      !preparedScoreContinuationAvailable &&
      scorelineFeasibility?.deadline !== "current_turn_only" &&
      corpDeckoutAgendaFloodRequiresScoreDevelopment(input) &&
      (!preferredDeckoutAgendaRecycleRouteAvailable ||
        corpAgendaRecyclesHqAgendasIntoRd(agendaDefinitionId));
    const accessPunishingScoreDeceptionWindow =
      !sameTurnCloseout &&
      serverId === "new_remote" &&
      certifiedNearTermScoreHorizon &&
      corpCandidateIsAmbushInstall(candidate) &&
      corpAgendaAccessPunishPreventsSteal(input, agenda) &&
      input.playerView.opponent.agendaPoints + agendaPoints <
        input.playerView.agendaPointsToWin &&
      protectionNeed?.baseline.knowledge === "known" &&
      protectionNeed.baseline.preservesScoreCreditReserve === true &&
      protectionNeed.baseline.preservesHardClickReserve === true &&
      compareExactProbabilities(
        protectionNeed.baseline.protection.runnerAccessSuccessProbability,
        { numerator: 1, denominator: 1 },
      ) === 0 &&
      corpAgendaInstallHasCurrentTurnDeceptionAdvance(
        input,
        candidate,
        serverId,
      );
    const fundedProtectionSupportsExtendedScoreHorizon =
      !sameTurnCloseout &&
      corpFundedProtectionSupportsExtendedScoreHorizon(
        input,
        candidate,
        protectionNeed,
        serverId,
      );
    const matureRemoteScoreHorizonCertification =
      !sameTurnCloseout &&
      !fundedProtectionSupportsExtendedScoreHorizon &&
      serverId !== undefined
        ? corpMatureRemoteAffordableDefenseLayerCertification(
            input,
            candidate,
            serverId,
          )
        : undefined;
    const certifiedMatureRemoteScoreHorizon =
      fundedProtectionSupportsExtendedScoreHorizon ||
      matureRemoteScoreHorizonCertification !== undefined;
    const boundedScoreHorizon =
      forcedAgendaDiscardRelief ||
      certifiedNearTermScoreHorizon ||
      certifiedMatureRemoteScoreHorizon ||
      boundedStagedScoreWindow ||
      lastViableDeckoutMatchpointWindow ||
      lastDrawAgendaRecycleWindow ||
      deckoutAgendaFloodScoreWindow;
    const remoteRequiresNearMatchpointMaturity =
      !forcedAgendaDiscardRelief &&
      !sameTurnCloseout &&
      !lastViableDeckoutMatchpointWindow &&
      !lastDrawAgendaRecycleWindow &&
      !deckoutAgendaFloodScoreWindow &&
      serverId !== undefined &&
      serverId !== "new_remote" &&
      input.playerView.opponent.agendaPoints + agendaPoints >=
        input.playerView.agendaPointsToWin - 1 &&
      (input.playerView.servers.find((server) => server.id === serverId)?.ice
        .length ?? 0) < 2;
    const developmentClickAvailable =
      input.playerView.own.clicks >= (boundedStagedScoreWindow ? 1 : 2) ||
      deadlinePressure;
    const protectedScoreWindow =
      forcedAgendaDiscardRelief ||
      sameTurnCloseout ||
      lastViableDeckoutMatchpointWindow ||
      lastDrawAgendaRecycleWindow ||
      deckoutAgendaFloodScoreWindow ||
      accessPunishingScoreDeceptionWindow ||
      corpScoreProtectionNeedIsSatisfied(
        input,
        protectionNeed,
        projectId,
        serverId,
      ) ||
      certifiedMatureRemoteScoreHorizon ||
      boundedStagedScoreWindow;
    const recentlyCompromisedTarget =
      serverId !== undefined &&
      serverId !== "new_remote" &&
      recentlyCompromisedRemoteIds.has(serverId) &&
      !sameTurnCloseout &&
      !deckoutAgendaFloodScoreWindow &&
      !corpScoreProtectionNeedIsSatisfied(
        input,
        protectionNeed,
        projectId,
        serverId,
      );
    const fundingGap =
      forcedAgendaDiscardRelief ||
      lastViableDeckoutMatchpointWindow ||
      lastDrawAgendaRecycleWindow ||
      deckoutAgendaFloodScoreWindow ||
      certifiedMatureRemoteScoreHorizon ||
      accessPunishingScoreDeceptionWindow
        ? 0
        : protectionNeed?.baseline.knowledge === "known"
          ? protectionNeed.baseline.minimumAdditionalCreditsToSatisfy
          : undefined;
    const feasible =
      sameTurnCloseout ||
      (scorelineFeasibility?.deadline !== "current_turn_only" &&
        scorelineFeasibility?.feasible !== false &&
        scoreActionSemanticsKnown &&
        boundedScoreHorizon &&
        !recentlyCompromisedTarget &&
        !remoteRequiresNearMatchpointMaturity &&
        developmentClickAvailable &&
        protectedScoreWindow &&
        (fundingGap ?? 0) === 0);
    const routeAssessment: NonNullable<
      CorpScoreProjectSignal["routeAssessment"]
    > =
      scorelineFeasibility?.deadline === "current_turn_only" &&
      !sameTurnCloseout
        ? "corp_current_turn_scoreline_unreachable"
        : forcedAgendaDiscardRelief
          ? "corp_forced_agenda_discard_score_attempt"
          : recentlyCompromisedTarget
            ? "corp_recently_compromised_score_remote_requires_reprotection"
            : lastDrawAgendaRecycleWindow
              ? "corp_last_draw_hq_agenda_recycle_install"
              : deckoutAgendaFloodScoreWindow
                ? "corp_deckout_agenda_flood_score_install"
                : accessPunishingScoreDeceptionWindow
                  ? "corp_access_punishing_agenda_deception_score_install"
                  : !scoreActionSemanticsKnown
                    ? "corp_score_protection_assessment_unknown"
                    : !developmentClickAvailable
                      ? "corp_last_click_score_install_deferred"
                      : protectionNeed?.baseline.knowledge === "unknown"
                        ? "corp_score_protection_assessment_unknown"
                        : fundingGap !== undefined && fundingGap > 0
                          ? "corp_score_protection_funding_gap"
                          : remoteRequiresNearMatchpointMaturity
                            ? "corp_near_matchpoint_remote_maturity_required"
                            : lastViableDeckoutMatchpointWindow
                              ? "corp_last_viable_deckout_matchpoint_install"
                              : certifiedMatureRemoteScoreHorizon
                                ? "corp_engine_certified_mature_remote_score_install"
                                : boundedStagedScoreWindow
                                  ? "corp_bounded_staged_score_install"
                                  : !protectedScoreWindow
                                    ? "corp_score_protection_required"
                                    : !boundedScoreHorizon
                                      ? "corp_score_horizon_unbounded"
                                      : protectedScoreWindow
                                        ? "corp_funded_protected_score_install"
                                        : "corp_score_protection_required";
    return [
      {
        projectId,
        agendaDefinitionId,
        agendaPoints,
        ...(candidate.sourceCardInstanceId
          ? { agendaInstanceId: candidate.sourceCardInstanceId }
          : {}),
        actionIds: [candidate.actionId],
        ...(serverId ? { serverId } : {}),
        phase: "install_agenda",
        sameTurnCloseout,
        deadlinePressure,
        ...(lastViableDeckoutMatchpointWindow &&
        certifiedNearTermScoreHorizon &&
        feasible
          ? { lastDrawScoreSurvival: true }
          : {}),
        ...(protectionNeed ? { protectionNeed } : {}),
        ...(matureRemoteScoreHorizonCertification
          ? {
              scoreHorizonCertification: matureRemoteScoreHorizonCertification,
            }
          : {}),
        terminalScore: matchpointTarget,
        conversion: corpScoreConversionFacts({
          input,
          agenda,
          serverId,
          remainingAdvancementClicks:
            requireVisibleAgendaAdvancementRequirement(input, agenda),
          remainingScoreCredits: remainingAgendaAdvancementCreditsAfterAction(
            input,
            candidate,
            agenda,
          ),
          residentParent:
            candidate.sourceCardInstanceId ===
              residentScoreDefenseBinding?.agendaInstanceId &&
            serverId === residentScoreDefenseBinding?.serverId,
          realizedStrategySupportCount: candidate.strategySupport.length,
        }),
        ...(fundingGap !== undefined && fundingGap > 0 ? { fundingGap } : {}),
        feasible,
        routeAssessment,
        evidenceCode: `${routeAssessment}:${serverId ?? "unbound"}${
          routeAssessment === "corp_score_protection_assessment_unknown"
            ? `:${!scoreActionSemanticsKnown ? "missing_action_semantics" : protectionNeed?.baseline.knowledge === "unknown" ? protectionNeed.baseline.unknownReason : ""}`
            : routeAssessment === "corp_score_protection_funding_gap"
              ? `:${fundingGap}`
              : ""
        }`,
      },
    ];
  }
  if (
    candidate.semanticActionType === "score.advance_card" ||
    candidate.semanticActionType === "score.agenda"
  ) {
    const target =
      candidate.sourceCardInstanceId ??
      candidateTargetIds(candidate).find(
        (targetId) => serverForInstalledCard(input, targetId) !== undefined,
      );
    if (!target) {
      if (candidate.semanticActionType !== "score.agenda") return [];
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        owner: "action_semantics",
        removalCondition:
          "Every legal agenda score action must identify its visible agenda target.",
      });
    }
    const installedCard = visibleInstalledCard(input, target);
    if (
      !installedCard ||
      visibleKnownCardType(input, installedCard) !== "agenda"
    ) {
      return [];
    }
    const serverId = serverForInstalledCard(input, target);
    const projectId = corpScoreProjectId(target, serverId);
    const completeScoreCost = corpInstalledScoreResourceCost(
      input,
      installedCard,
      serverId,
    );
    const sameTurnCloseout =
      candidate.semanticActionType === "score.agenda" ||
      corpScorelineActionCanCloseThisTurn(
        scorelineFeasibility,
        candidate.actionId,
      ) ||
      visibleAgendaAdvanceCanCloseThisTurn(input, candidate, installedCard);
    const agendaPoints = requireVisibleAgendaPoints(input, installedCard);
    const matchpointTarget =
      input.playerView.own.agendaPoints + agendaPoints >=
      input.playerView.agendaPointsToWin;
    const lastViableDeckoutMatchpointWindow =
      candidate.semanticActionType === "score.advance_card" &&
      matchpointTarget &&
      scorelineFeasibility?.deadline === "last_draw_window";
    const preventsTerminalSteal =
      sameTurnCloseout &&
      input.playerView.opponent.agendaPoints + agendaPoints >=
        input.playerView.agendaPointsToWin;
    const deckoutAgendaFloodScoreWindow =
      corpDeckoutAgendaFloodRequiresScoreDevelopment(input);
    const scorelineDeadlinePressure =
      scorelineFeasibility?.deadline === "last_draw_window" ||
      scorelineFeasibility?.deadline === "current_turn_only" ||
      deckoutAgendaFloodScoreWindow;
    const scoreActionSemanticsKnown =
      candidate.semanticActionType !== "score.advance_card" ||
      hasExactNonNegativeCostProfile(candidate);
    const protectionNeed =
      candidate.semanticActionType === "score.advance_card" &&
      serverId !== undefined &&
      !sameTurnCloseout &&
      scoreActionSemanticsKnown
        ? corpFundedScoreProtectionNeed(
            input,
            candidate,
            installedCard,
            projectId,
            serverId,
            matchpointTarget,
            scorelineDeadlinePressure,
          )
        : undefined;
    const fundedWindowProtected =
      sameTurnCloseout ||
      lastViableDeckoutMatchpointWindow ||
      deckoutAgendaFloodScoreWindow ||
      corpScoreProtectionNeedIsSatisfied(
        input,
        protectionNeed,
        projectId,
        serverId,
      );
    const matureRemoteScoreHorizonCertification =
      candidate.semanticActionType === "score.advance_card" &&
      !fundedWindowProtected &&
      serverId !== undefined
        ? corpMatureRemoteAffordableDefenseLayerCertification(
            input,
            candidate,
            serverId,
          )
        : undefined;
    const certifiedMatureRemoteScoreHorizon =
      matureRemoteScoreHorizonCertification !== undefined;
    const exposedInstalledAgenda =
      candidate.semanticActionType === "score.advance_card" &&
      protectionNeed !== undefined &&
      !fundedWindowProtected &&
      !certifiedMatureRemoteScoreHorizon;
    const deadlinePressure =
      scorelineDeadlinePressure || exposedInstalledAgenda;
    const fundingGap =
      lastViableDeckoutMatchpointWindow ||
      deckoutAgendaFloodScoreWindow ||
      certifiedMatureRemoteScoreHorizon
        ? 0
        : protectionNeed?.baseline.knowledge === "known"
          ? protectionNeed.baseline.minimumAdditionalCreditsToSatisfy
          : undefined;
    const exposedAgendaProgressRoute =
      exposedInstalledAgenda &&
      input.playerView.own.clicks >= 2 &&
      scorelineFeasibility?.deadline !== "current_turn_only" &&
      scorelineFeasibility?.feasible !== false &&
      scoreActionSemanticsKnown &&
      (fundingGap ?? 0) === 0;
    const feasible =
      sameTurnCloseout ||
      exposedAgendaProgressRoute ||
      (scorelineFeasibility?.deadline !== "current_turn_only" &&
        scorelineFeasibility?.feasible !== false &&
        scoreActionSemanticsKnown &&
        (fundedWindowProtected || certifiedMatureRemoteScoreHorizon) &&
        (fundingGap ?? 0) === 0);
    const routeAssessment: NonNullable<
      CorpScoreProjectSignal["routeAssessment"]
    > =
      scorelineFeasibility?.deadline === "current_turn_only" &&
      !sameTurnCloseout
        ? "corp_current_turn_scoreline_unreachable"
        : deckoutAgendaFloodScoreWindow
          ? "corp_deckout_agenda_flood_score_advance"
          : exposedAgendaProgressRoute
            ? "corp_exposed_agenda_progress_preserves_conversion_clock"
            : !scoreActionSemanticsKnown
              ? "corp_score_protection_assessment_unknown"
              : protectionNeed?.baseline.knowledge === "unknown"
                ? "corp_score_protection_assessment_unknown"
                : fundingGap !== undefined && fundingGap > 0
                  ? "corp_score_protection_funding_gap"
                  : certifiedMatureRemoteScoreHorizon
                    ? "corp_engine_certified_mature_remote_score_advance"
                    : lastViableDeckoutMatchpointWindow
                      ? "corp_last_viable_deckout_matchpoint_advance"
                      : fundedWindowProtected
                        ? "corp_funded_protected_score_advance"
                        : candidate.semanticActionType === "score.advance_card"
                          ? "corp_score_protection_required"
                          : "visible_legal_score_conversion";
    return [
      {
        projectId,
        agendaDefinitionId:
          installedCard.definitionId ?? candidate.sourceDefinitionId ?? target,
        agendaPoints,
        agendaInstanceId: target,
        actionIds: [candidate.actionId],
        ...(serverId ? { serverId } : {}),
        phase:
          candidate.semanticActionType === "score.agenda"
            ? "score_agenda"
            : "advance_agenda",
        sameTurnCloseout,
        ...(sameTurnCloseout && completeScoreCost
          ? {
              sameTurnConversionProof: "engine_quoted_path" as const,
              sameTurnConversionResourceCost: completeScoreCost,
            }
          : {}),
        deadlinePressure,
        ...(preventsTerminalSteal ? { preventsTerminalSteal: true } : {}),
        ...(lastViableDeckoutMatchpointWindow
          ? { lastDrawScoreSurvival: true }
          : {}),
        ...(protectionNeed ? { protectionNeed } : {}),
        ...(matureRemoteScoreHorizonCertification
          ? {
              scoreHorizonCertification: matureRemoteScoreHorizonCertification,
            }
          : {}),
        terminalScore: matchpointTarget,
        conversion: corpScoreConversionFacts({
          input,
          agenda: installedCard,
          serverId,
          remainingAdvancementClicks:
            candidate.semanticActionType === "score.agenda"
              ? 0
              : Math.max(
                  0,
                  requireVisibleAgendaAdvancementRequirement(
                    input,
                    installedCard,
                  ) -
                    Math.max(0, installedCard.advancementCounters ?? 0) -
                    1,
                ),
          remainingScoreCredits:
            candidate.semanticActionType === "score.agenda"
              ? 0
              : remainingAgendaAdvancementCreditsAfterAction(
                  input,
                  candidate,
                  installedCard,
                ),
          residentParent:
            target === residentScoreDefenseBinding?.agendaInstanceId &&
            serverId === residentScoreDefenseBinding?.serverId,
          realizedStrategySupportCount: candidate.strategySupport.length,
        }),
        ...(fundingGap !== undefined && fundingGap > 0 ? { fundingGap } : {}),
        feasible,
        routeAssessment,
        evidenceCode:
          routeAssessment === "visible_legal_score_conversion"
            ? routeAssessment
            : `${routeAssessment}:${serverId ?? "unbound"}${
                routeAssessment === "corp_score_protection_assessment_unknown"
                  ? `:${!scoreActionSemanticsKnown ? "missing_action_semantics" : protectionNeed?.baseline.knowledge === "unknown" ? protectionNeed.baseline.unknownReason : ""}`
                  : routeAssessment === "corp_score_protection_funding_gap"
                    ? `:${fundingGap}`
                    : ""
              }`,
      },
    ];
  }
  return [];
}

function corpAgendaRecyclesHqAgendasIntoRd(
  agendaDefinitionId: string,
): boolean {
  return (
    AI_HINTS_BY_CARD.get(agendaDefinitionId)?.strategySupportPairs?.some(
      (support) =>
        support.evidence.includes("hq.corp_agenda_flood_control") &&
        support.evidence.includes("rnd.corp_agenda_recycle"),
    ) === true
  );
}

function corpDeckoutAgendaFloodRequiresScoreDevelopment(
  input: AiDecisionInput,
): boolean {
  const remainingDeckCards = input.playerView.own.stackOrRdCount;
  if (
    typeof remainingDeckCards !== "number" ||
    !Number.isSafeInteger(remainingDeckCards) ||
    remainingDeckCards < 0 ||
    remainingDeckCards > 6
  ) {
    return false;
  }
  const agendas = input.playerView.own.gripOrHq.filter((card) =>
    visibleCardIsAgenda(input, card),
  );
  const visibleAgendaPoints = agendas.reduce(
    (sum, agenda) => sum + requireVisibleAgendaPoints(input, agenda),
    0,
  );
  return agendas.length >= 2 || visibleAgendaPoints >= 4;
}

export function corpPreferredDeckoutAgendaRecycleRouteAvailable(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): boolean {
  if (!corpDeckoutAgendaFloodRequiresScoreDevelopment(input)) return false;
  return candidates.some((candidate) => {
    if (
      candidate.semanticActionType !== "install.card" ||
      !candidate.sourceDefinitionId ||
      !corpAgendaRecyclesHqAgendasIntoRd(candidate.sourceDefinitionId)
    ) {
      return false;
    }
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    const serverId = action?.payload?.serverId;
    return (
      action?.type === "install_card" &&
      action.payload?.placement === "root" &&
      typeof serverId === "string" &&
      corpAgendaInstallHasCertifiedNearTermScoreHorizon(
        input,
        candidate,
        serverId,
      )
    );
  });
}

function corpAgendaInstallHasCertifiedNearTermScoreHorizon(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string | undefined,
): boolean {
  if (!serverId || !candidate.sourceCardInstanceId) return false;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const payload = action?.payload;
  const requirement =
    payload?.agendaInstallScoreHorizonQuoteAdvancementRequirement;
  const maximumCurrentTurnAdvances =
    payload?.agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances;
  const remainingAdvancesAfterCurrentTurn =
    payload?.agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn;
  const nextCorpTurnGuaranteedFlexibleClicks =
    payload?.agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks;
  return (
    action?.side === "corp" &&
    action.type === "install_card" &&
    action.payload?.placement === "root" &&
    action.expiresAtStateVersion === input.playerView.stateVersion &&
    payload?.agendaInstallScoreHorizonQuoteSchemaVersion ===
      CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION &&
    payload.agendaInstallScoreHorizonQuoteComplete === true &&
    payload.agendaInstallScoreHorizonQuoteCardId ===
      candidate.sourceCardInstanceId &&
    payload.agendaInstallScoreHorizonQuoteTargetServerId === serverId &&
    payload.agendaInstallScoreHorizonQuoteExpiresAtStateVersion ===
      input.playerView.stateVersion &&
    isFiniteNonNegativeInteger(requirement) &&
    isFiniteNonNegativeInteger(maximumCurrentTurnAdvances) &&
    maximumCurrentTurnAdvances <= requirement &&
    isFiniteNonNegativeInteger(remainingAdvancesAfterCurrentTurn) &&
    remainingAdvancesAfterCurrentTurn ===
      requirement - maximumCurrentTurnAdvances &&
    isFiniteNonNegativeInteger(nextCorpTurnGuaranteedFlexibleClicks) &&
    remainingAdvancesAfterCurrentTurn <= nextCorpTurnGuaranteedFlexibleClicks
  );
}

function corpAgendaInstallHasCurrentTurnDeceptionAdvance(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): boolean {
  if (!candidate.sourceCardInstanceId) return false;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const payload = action?.payload;
  return (
    payload?.agendaInstallScoreHorizonQuoteSchemaVersion ===
      CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION &&
    payload.agendaInstallScoreHorizonQuoteComplete === true &&
    payload.agendaInstallScoreHorizonQuoteCardId ===
      candidate.sourceCardInstanceId &&
    payload.agendaInstallScoreHorizonQuoteTargetServerId === serverId &&
    payload.agendaInstallScoreHorizonQuoteExpiresAtStateVersion ===
      input.playerView.stateVersion &&
    isFiniteNonNegativeInteger(
      payload.agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances,
    ) &&
    payload.agendaInstallScoreHorizonQuoteMaximumCurrentTurnAdvances >= 1
  );
}

function corpFundedProtectionSupportsExtendedScoreHorizon(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  need: CorpFundedRemoteAccessRiskNeed | undefined,
  serverId: string | undefined,
): boolean {
  if (!need || !serverId || serverId === "new_remote") return false;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const baseline = need.baseline;
  if (!server || baseline.knowledge !== "known") {
    return false;
  }
  if (
    baseline.fundedProtection === true &&
    baseline.preservesScoreCreditReserve === true &&
    baseline.preservesHardClickReserve === true &&
    baseline.protection.protectsScore === true
  ) {
    const fundedRezIds = new Set(
      baseline.selectedRezCosts.map((entry) => entry.iceInstanceId),
    );
    const independentlyFundedProtectionLayers = server.ice.filter(
      (ice) => ice.rezzed === true || fundedRezIds.has(ice.instanceId),
    ).length;
    if (independentlyFundedProtectionLayers >= 2) return true;
    const horizonShortfall = corpAgendaInstallScoreHorizonShortfall(
      input,
      candidate,
      serverId,
    );
    return (
      horizonShortfall !== undefined &&
      horizonShortfall <= 1 &&
      compareExactProbabilities(
        baseline.protection.runnerAccessSuccessProbability,
        { numerator: 0, denominator: 1 },
      ) === 0
    );
  }
  return false;
}

function corpAgendaAccessPunishPreventsSteal(
  input: AiDecisionInput,
  agenda: VisibleCard,
): boolean {
  if (!agenda.definitionId) return false;
  const projection = projectKnownCorpCardAccessEffect({
    input,
    sourceDefinitionId: agenda.definitionId,
    sourceCard: agenda,
  });
  return (
    projection.status === "complete" &&
    projection.corpCanPayActivation !== false &&
    projection.damage?.runnerSurvivable === false
  );
}

function corpAgendaInstallScoreHorizonShortfall(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
): number | undefined {
  if (!candidate.sourceCardInstanceId) return undefined;
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const payload = action?.payload;
  const remaining =
    payload?.agendaInstallScoreHorizonQuoteRemainingAdvancesAfterCurrentTurn;
  const nextClicks =
    payload?.agendaInstallScoreHorizonQuoteNextCorpTurnGuaranteedFlexibleClicks;
  if (
    payload?.agendaInstallScoreHorizonQuoteSchemaVersion !==
      CORP_AGENDA_INSTALL_SCORE_HORIZON_QUOTE_SCHEMA_VERSION ||
    payload.agendaInstallScoreHorizonQuoteCardId !==
      candidate.sourceCardInstanceId ||
    payload.agendaInstallScoreHorizonQuoteTargetServerId !== serverId ||
    payload.agendaInstallScoreHorizonQuoteExpiresAtStateVersion !==
      input.playerView.stateVersion ||
    !isFiniteNonNegativeInteger(remaining) ||
    !isFiniteNonNegativeInteger(nextClicks)
  ) {
    return undefined;
  }
  return Math.max(0, remaining - nextClicks);
}

export function sameTurnScoreConversionProjectForCandidate(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  directScoreProjects: readonly CorpScoreProjectSignal[],
  fundingCandidates: readonly ActionSemanticCandidate[],
): CorpScoreProjectSignal | undefined {
  const matchingProjects: CorpScoreProjectSignal[] = [];
  for (const path of corpSameTurnScoreConversionPaths(
    input,
    fundingCandidates,
  )) {
    const step = path.steps[0];
    if (!step || !candidateMatchesScoreConversionStep(input, candidate, step))
      continue;
    const agenda = visibleOwnCardByInstanceId(input, path.agendaCardId);
    if (!agenda)
      throw new PlanResolutionFailure("missing_action_semantics", {
        side: input.side,
        stateVersion: input.playerView.stateVersion,
        timingPoint: input.playerView.timingPoint,
        legalActionTypes: input.legalActions.map((action) => action.type),
        owner: "action_semantics",
        removalCondition:
          "Every same-turn score conversion path must bind its visible agenda card.",
      });
    const agendaDefinition = requireVisibleCardDefinition(
      input,
      agenda,
      "agenda",
    );
    const visibleHqAgendas = input.playerView.own.gripOrHq.filter((card) =>
      visibleCardIsAgenda(input, card),
    );
    const preventsTerminalSteal = sameTurnScoreConversionPreventsTerminalSteal({
      targetServerId: path.targetServerId,
      opponentAgendaPoints: input.playerView.opponent.agendaPoints,
      agendaPointsToWin: input.playerView.agendaPointsToWin,
      visibleHqAgendaIds: visibleHqAgendas.map((card) => card.instanceId),
      agendaCardId: path.agendaCardId,
      installedAgendaId: input.playerView.servers
        .find((server) => server.id === path.targetServerId)
        ?.root.find((card) => card.instanceId === path.agendaCardId)
        ?.instanceId,
      hasOtherInstalledAgenda: input.playerView.servers.some((server) =>
        server.root.some(
          (card) =>
            card.instanceId !== path.agendaCardId &&
            visibleCardIsAgenda(input, card),
        ),
      ),
    });
    matchingProjects.push({
      projectId: `agenda:${path.agendaCardId}:${path.targetServerId}`,
      agendaDefinitionId: agendaDefinition.id,
      agendaPoints: path.agendaPoints,
      agendaInstanceId: path.agendaCardId,
      serverId: path.targetServerId,
      actionIds: [candidate.actionId],
      routeSemanticActionTypes: [candidate.semanticActionType],
      phase: scorePhaseForConversionStep(step),
      sameTurnCloseout: true,
      sameTurnConversionProof: "engine_quoted_path",
      ...(!path.fundingPrefix &&
      path.clicksGenerated === 0 &&
      path.steps.every(
        (routeStep) =>
          [
            "install_score_target",
            "place_advancement",
            "basic_advance",
            "score_ready",
          ].includes(routeStep.kind) &&
          (routeStep.offTargetAdvancementAmount ?? 0) === 0,
      )
        ? {
            sameTurnConversionResourceCost: {
              stateVersion: input.playerView.stateVersion,
              credits: path.creditsRequired,
              clicks: path.clicksRequired,
            },
          }
        : {}),
      ...(step.kind === "recover_score_support" &&
      step.sourceCardId &&
      step.recoveredCardId
        ? {
            recoveryChoiceBinding: {
              sourceCardId: step.sourceCardId,
              recoveredCardId: step.recoveredCardId,
              stateVersion: input.playerView.stateVersion,
            },
          }
        : {}),
      ...(path.fundingPrefix
        ? {
            fundingGap: Math.max(
              0,
              path.creditsRequired -
                path.fundingPrefix.creditCost -
                input.playerView.own.credits,
            ),
            sameTurnFundingActionIds: [path.fundingPrefix.actionId],
          }
        : {}),
      terminalScore:
        input.playerView.own.agendaPoints + path.agendaPoints >=
        input.playerView.agendaPointsToWin,
      conversion: corpScoreConversionFacts({
        input,
        agenda,
        serverId: path.targetServerId,
        remainingAdvancementClicks: path.steps
          .slice(1)
          .filter((routeStep) => routeStep.kind === "basic_advance")
          .reduce((total, routeStep) => total + routeStep.clickCost, 0),
        remainingScoreCredits: path.fundingPrefix
          ? path.creditsRequired - path.fundingPrefix.creditCost
          : path.steps
              .slice(1)
              .reduce((total, routeStep) => total + routeStep.creditCost, 0),
        residentParent: false,
        realizedStrategySupportCount: candidate.strategySupport.length,
      }),
      ...(step.kind === "move_advancement" &&
      step.sourceCardId !== undefined &&
      step.advancementAmount > 0
        ? {
            advancementCounterChoiceBinding: {
              kind: "move_advancement" as const,
              sourceCardId: step.sourceCardId,
              targetCardId: step.targetCardId,
              amount: step.advancementAmount,
            },
          }
        : {}),
      ...(step.kind === "place_advancement" &&
      step.offTargetCardId !== undefined &&
      step.offTargetAdvancementAmount !== undefined &&
      step.offTargetAdvancementAmount > 0
        ? {
            advancementCounterChoiceBinding: {
              kind: "place_advancement" as const,
              placements: [
                {
                  targetCardId: step.targetCardId,
                  amount: step.advancementAmount,
                },
                {
                  targetCardId: step.offTargetCardId,
                  amount: step.offTargetAdvancementAmount,
                },
              ],
            },
          }
        : {}),
      ...(preventsTerminalSteal ? { preventsTerminalSteal: true } : {}),
      feasible: true,
      evidenceCode: preventsTerminalSteal
        ? `corp_same_turn_score_conversion_prevents_terminal_steal:${step.kind}`
        : `corp_same_turn_score_conversion:${step.kind}`,
    });
  }
  return matchingProjects.sort((left, right) =>
    compareSameTurnScoreConversionParents(left, right, directScoreProjects),
  )[0];
}

export function sameTurnScoreConversionPreventsTerminalSteal(params: {
  targetServerId: string;
  opponentAgendaPoints: number;
  agendaPointsToWin: number;
  visibleHqAgendaIds: readonly string[];
  agendaCardId: string;
  installedAgendaId?: string | undefined;
  hasOtherInstalledAgenda: boolean;
}): boolean {
  return (
    // This caller certifies a complete same-turn score, not an isolated install.
    // With no installed sibling it removes the only exposed agenda even in a
    // new remote. An installed sibling may consume the shared continuation;
    // do not preempt that score with another unprotected agenda.
    (params.targetServerId !== "new_remote" ||
      !params.hasOtherInstalledAgenda) &&
    params.opponentAgendaPoints >= params.agendaPointsToWin - 1 &&
    ((params.visibleHqAgendaIds.length === 1 &&
      params.visibleHqAgendaIds[0] === params.agendaCardId) ||
      (params.visibleHqAgendaIds.length === 0 &&
        params.installedAgendaId === params.agendaCardId &&
        !params.hasOtherInstalledAgenda))
  );
}

function compareSameTurnScoreConversionParents(
  left: CorpScoreProjectSignal,
  right: CorpScoreProjectSignal,
  directScoreProjects: readonly CorpScoreProjectSignal[],
): number {
  const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 } as const;
  const priorityComparison =
    priorityRank[corpScorePriorityClass(left)] -
    priorityRank[corpScorePriorityClass(right)];
  if (priorityComparison !== 0) return priorityComparison;
  const leftDirect = directScoreProjects.find(
    (project) => project.projectId === left.projectId,
  );
  const rightDirect = directScoreProjects.find(
    (project) => project.projectId === right.projectId,
  );
  if (leftDirect?.feasible !== rightDirect?.feasible) {
    return leftDirect?.feasible ? -1 : 1;
  }
  if ((left.serverId === "new_remote") !== (right.serverId === "new_remote")) {
    return left.serverId === "new_remote" ? 1 : -1;
  }
  if (leftDirect && rightDirect) {
    const protectionComparison = compareCorpScoreProtectionProjects(
      leftDirect,
      rightDirect,
    );
    if (protectionComparison !== 0) return protectionComparison;
  }
  return technicalIdCompare(left.projectId, right.projectId);
}

function scorePhaseForConversionStep(
  step: CorpScoreConversionStep,
): CorpScoreProjectSignal["phase"] {
  if (step.kind === "recover_score_support") return "recover_score_support";
  if (step.kind === "install_score_target") return "install_agenda";
  if (step.kind === "basic_advance") return "advance_agenda";
  if (step.kind === "score_ready") return "score_agenda";
  return "convert_agenda";
}

function candidateMatchesScoreConversionStep(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  step: CorpScoreConversionStep,
): boolean {
  if (step.actionId === candidate.actionId) return true;
  if (
    !step.sourceCardId ||
    step.sourceCardId !== candidate.sourceCardInstanceId
  ) {
    return false;
  }
  const action = input.legalActions.find(
    (candidateAction) => candidateAction.actionId === candidate.actionId,
  );
  const capability = action?.payload?.scoreConversionCapability;
  if (step.kind === "place_advancement")
    return capability === "place_advancement";
  if (step.kind === "move_advancement")
    return capability === "move_advancement";
  return false;
}

function corpScoreConversionFacts(params: {
  input: AiDecisionInput;
  agenda: VisibleCard;
  serverId: string | undefined;
  remainingAdvancementClicks: number;
  remainingScoreCredits: number;
  residentParent: boolean;
  realizedStrategySupportCount: number;
}): NonNullable<CorpScoreProjectSignal["conversion"]> {
  const {
    input,
    agenda,
    serverId,
    remainingAdvancementClicks,
    remainingScoreCredits,
    residentParent,
    realizedStrategySupportCount,
  } = params;
  const server = input.playerView.servers.find(
    (candidate) => candidate.id === serverId,
  );
  const agendaPoints = requireVisibleAgendaPoints(input, agenda);
  return {
    remainingAdvancementClicks: Math.max(0, remainingAdvancementClicks),
    remainingScoreCredits: Math.max(0, remainingScoreCredits),
    existingRemoteIceCount: server?.ice.length ?? 0,
    existingRemoteRezzedIceCount:
      server?.ice.filter((ice) => ice.rezzed === true).length ?? 0,
    residentParent,
    runnerStealPoints: agendaPoints,
    runnerStealIsMatchpoint:
      input.playerView.opponent.agendaPoints + agendaPoints >=
      input.playerView.agendaPointsToWin,
    realizedStrategySupportCount: Math.max(0, realizedStrategySupportCount),
  };
}

function visibleAgendaAdvanceCanCloseThisTurn(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  agenda: VisibleCard,
): boolean {
  if (candidate.semanticActionType !== "score.advance_card") return false;
  const requirement = requireVisibleAgendaAdvancementRequirement(input, agenda);
  const current = agenda.advancementCounters ?? 0;
  const remainingAdvancesAfterAction = Math.max(0, requirement - current - 1);
  const actionCost = candidate.costProfile.creditCost;
  if (!isFiniteNonNegativeInteger(actionCost)) return false;
  return (
    input.playerView.own.clicks >= 1 + remainingAdvancesAfterAction &&
    input.playerView.own.credits >= actionCost + remainingAdvancesAfterAction
  );
}

export function corpScoreProjectAssessmentIsUnknown(
  project: CorpScoreProjectSignal,
): boolean {
  return (
    project.routeAssessment === "corp_score_protection_assessment_unknown" ||
    project.protectionNeed?.baseline.knowledge === "unknown"
  );
}

export function compareCorpScoreProtectionProjects(
  left: CorpScoreProjectSignal,
  right: CorpScoreProjectSignal,
): number {
  if (left.terminalScore !== right.terminalScore) {
    return left.terminalScore ? -1 : 1;
  }
  const leftInstalled = left.phase !== "install_agenda";
  const rightInstalled = right.phase !== "install_agenda";
  if (leftInstalled !== rightInstalled) return leftInstalled ? -1 : 1;
  const leftConversion = left.conversion;
  const rightConversion = right.conversion;
  if (
    !leftInstalled &&
    !rightInstalled &&
    leftConversion?.runnerStealIsMatchpoint !==
      rightConversion?.runnerStealIsMatchpoint
  ) {
    return leftConversion?.runnerStealIsMatchpoint ? 1 : -1;
  }
  if (leftConversion?.residentParent !== rightConversion?.residentParent) {
    return leftConversion?.residentParent ? -1 : 1;
  }
  const leftProbability =
    left.protectionNeed?.objective.maximumRunnerAccessSuccessProbability;
  const rightProbability =
    right.protectionNeed?.objective.maximumRunnerAccessSuccessProbability;
  if (leftProbability && rightProbability) {
    const comparison = compareExactProbabilities(
      leftProbability,
      rightProbability,
    );
    if (comparison !== undefined && comparison !== 0) return comparison;
  }
  const leftStartsNewRemote = left.serverId === "new_remote";
  const rightStartsNewRemote = right.serverId === "new_remote";
  if (leftStartsNewRemote !== rightStartsNewRemote) {
    return leftStartsNewRemote ? 1 : -1;
  }
  const leftBaseline = left.protectionNeed?.baseline;
  const rightBaseline = right.protectionNeed?.baseline;
  if (leftBaseline?.knowledge !== rightBaseline?.knowledge) {
    return leftBaseline?.knowledge === "known" ? -1 : 1;
  }
  if (
    leftBaseline?.knowledge === "known" &&
    rightBaseline?.knowledge === "known"
  ) {
    const currentRiskComparison = compareExactProbabilities(
      leftBaseline.protection.runnerAccessSuccessProbability,
      rightBaseline.protection.runnerAccessSuccessProbability,
    );
    if (currentRiskComparison !== undefined && currentRiskComparison !== 0) {
      return currentRiskComparison;
    }
  }
  if (leftConversion && rightConversion) {
    const remainingClicksComparison =
      leftConversion.remainingAdvancementClicks -
      rightConversion.remainingAdvancementClicks;
    if (remainingClicksComparison !== 0) return remainingClicksComparison;
    const remainingCreditsComparison =
      leftConversion.remainingScoreCredits -
      rightConversion.remainingScoreCredits;
    if (remainingCreditsComparison !== 0) return remainingCreditsComparison;
    const rezzedInvestmentComparison =
      rightConversion.existingRemoteRezzedIceCount -
      leftConversion.existingRemoteRezzedIceCount;
    if (rezzedInvestmentComparison !== 0) return rezzedInvestmentComparison;
    const remoteInvestmentComparison =
      rightConversion.existingRemoteIceCount -
      leftConversion.existingRemoteIceCount;
    if (remoteInvestmentComparison !== 0) return remoteInvestmentComparison;
    const strategySupportComparison =
      rightConversion.realizedStrategySupportCount -
      leftConversion.realizedStrategySupportCount;
    if (strategySupportComparison !== 0) return strategySupportComparison;
    const agendaPointComparison = right.agendaPoints - left.agendaPoints;
    if (agendaPointComparison !== 0) return agendaPointComparison;
  }
  return technicalIdCompare(left.projectId, right.projectId);
}

export function corpScoreHorizonCertificationIsCurrent(
  input: AiDecisionInput,
  project: Pick<
    CorpScoreProjectSignal,
    "serverId" | "scoreHorizonCertification"
  >,
): boolean {
  const certification = project.scoreHorizonCertification;
  return (
    certification?.kind === "affordable_engine_quoted_defense_layers" &&
    certification.observedAtStateVersion === input.playerView.stateVersion &&
    certification.serverId === project.serverId &&
    certification.layerInstanceIds.length === 2
  );
}

export function corpScoreProjectId(
  agendaInstanceOrDefinitionId: string,
  serverId: string | undefined,
): string {
  return `agenda:${agendaInstanceOrDefinitionId}:${serverId ?? "unbound"}`;
}

function sameScoreProjectMergeFacts(
  left: CorpScoreProjectSignal,
  right: CorpScoreProjectSignal,
): boolean {
  const facts = (project: CorpScoreProjectSignal) => [
    project.agendaDefinitionId,
    project.agendaInstanceId,
    project.agendaPoints,
    project.serverId,
    project.routeAssessment,
    project.sameTurnConversionProof,
    project.terminalScore,
    project.preventsTerminalSteal,
    project.deadlinePressure,
    project.fundingGap,
    project.sameTurnFundingActionIds,
    project.conversion,
    project.advancementCounterChoiceBinding,
    project.recoveryChoiceBinding,
    project.continuationReserve,
    project.protectionNeed?.needId,
    project.protectionNeed?.observedAtStateVersion,
    project.protectionNeed?.objective,
    project.protectionNeed?.scoreReserve,
    project.protectionNeed?.baseline.knowledge,
    project.protectionNeed?.baseline.knowledge === "unknown"
      ? project.protectionNeed.baseline.unknownReason
      : undefined,
    project.scoreHorizonCertification,
    project.uncertainty,
    project.fundingMilestone,
    project.openingRush?.status,
    project.openingRush?.status === "qualified"
      ? project.openingRush.quote
      : project.openingRush?.reason,
    project.setupNeed,
    project.counterBank,
    project.lastDrawScoreSurvival,
  ];
  return JSON.stringify(facts(left)) === JSON.stringify(facts(right));
}

export function uniqueScoreProjects(
  values: readonly CorpScoreProjectSignal[],
): CorpScoreProjectSignal[] {
  const phaseRank: Record<CorpScoreProjectSignal["phase"], number> = {
    select_agenda: -1,
    unlock_remote_creation: 0,
    recover_score_support: 1,
    install_counter_bank: 1,
    advance_counter_bank: 2,
    install_agenda_from_counter_bank: 3,
    rez_counter_bank_for_handoff: 4,
    rez_counter_bank_for_liquidation: 4,
    liquidate_counter_bank: 5,
    install_agenda: 1,
    advance_agenda: 2,
    convert_agenda: 3,
    score_agenda: 4,
  };
  const byProject = new Map<string, CorpScoreProjectSignal>();
  for (const value of values) {
    const previous = byProject.get(value.projectId);
    if (!previous || phaseRank[value.phase] > phaseRank[previous.phase]) {
      byProject.set(value.projectId, value);
      continue;
    }
    if (phaseRank[value.phase] < phaseRank[previous.phase]) continue;
    if (value.sameTurnCloseout && !previous.sameTurnCloseout) {
      byProject.set(value.projectId, value);
      continue;
    }
    if (previous.sameTurnCloseout && !value.sameTurnCloseout) continue;
    if (value.feasible && !previous.feasible) {
      byProject.set(value.projectId, value);
      continue;
    }
    if (previous.feasible && !value.feasible) continue;
    const valueHasExactSameTurnConversionProof =
      value.sameTurnCloseout &&
      value.sameTurnConversionProof === "engine_quoted_path";
    const previousHasExactSameTurnConversionProof =
      previous.sameTurnCloseout &&
      previous.sameTurnConversionProof === "engine_quoted_path";
    if (
      valueHasExactSameTurnConversionProof !==
      previousHasExactSameTurnConversionProof
    ) {
      if (valueHasExactSameTurnConversionProof) {
        byProject.set(value.projectId, value);
      }
      continue;
    }
    if (
      value.sameTurnCloseout === previous.sameTurnCloseout &&
      value.feasible === previous.feasible &&
      sameScoreProjectMergeFacts(value, previous)
    ) {
      byProject.set(value.projectId, {
        ...previous,
        actionIds: [
          ...new Set([
            ...(previous.actionIds ?? []),
            ...(value.actionIds ?? []),
          ]),
        ],
        routeSemanticActionTypes: [
          ...new Set([
            ...(previous.routeSemanticActionTypes ?? []),
            ...(value.routeSemanticActionTypes ?? []),
          ]),
        ],
      });
    }
  }
  return [...byProject.values()];
}

function corpDeferredLastClickScoreProject(
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpScoreProjectSignal | undefined {
  const priorityRank = { P1: 1, P2: 2, P3: 3, P4: 4 } as const;
  return scoreProjects
    .filter(
      (project) =>
        project.phase !== "select_agenda" &&
        !project.feasible &&
        !project.sameTurnCloseout &&
        (project.fundingGap ?? 0) === 0 &&
        project.routeAssessment === "corp_last_click_score_install_deferred",
    )
    .sort(
      (left, right) =>
        priorityRank[corpScorePriorityClass(left)] -
          priorityRank[corpScorePriorityClass(right)] ||
        technicalIdCompare(left.projectId, right.projectId),
    )[0];
}

export function corpKnownDeferredLastClickScoreProject(
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpScoreProjectSignal | undefined {
  return corpDeferredLastClickScoreProject(
    scoreProjects.filter(
      (project) => project.protectionNeed?.baseline.knowledge === "known",
    ),
  );
}

export function corpScoreAccelerationSetupBinding(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  scoreProjects: readonly CorpScoreProjectSignal[],
): CorpScoreAccelerationSetupBinding | undefined {
  const parent = corpDeferredLastClickScoreProject(scoreProjects);
  if (!parent) return undefined;
  const setupCandidate = candidates
    .filter((candidate) => {
      if (
        candidate.semanticActionType !== "install.card" ||
        candidateIsVisibleCorpAgendaInstall(input, candidate) ||
        !candidate.sourceCardInstanceId ||
        !candidate.sourceDefinitionId
      ) {
        return false;
      }
      const source = input.playerView.own.gripOrHq.find(
        (card) => card.instanceId === candidate.sourceCardInstanceId,
      );
      const scoreConversion = corpScoreConversionProfile(
        candidate.sourceDefinitionId,
      );
      return (
        source?.definitionId === candidate.sourceDefinitionId &&
        (scoreConversion?.movesAdvancementCounters === true ||
          scoreConversion?.placesAdvancementCounters === true)
      );
    })
    .sort((left, right) =>
      technicalIdCompare(left.actionId, right.actionId),
    )[0];
  if (
    !setupCandidate?.sourceCardInstanceId ||
    !setupCandidate.sourceDefinitionId
  ) {
    return undefined;
  }
  return {
    parent,
    setupNeed: {
      needId: `score-setup:${parent.projectId}:${setupCandidate.sourceCardInstanceId}`,
      actionId: setupCandidate.actionId,
      sourceCardInstanceId: setupCandidate.sourceCardInstanceId,
      sourceDefinitionId: setupCandidate.sourceDefinitionId,
    },
  };
}
