import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import { rootRezCreditOutcomeProjectionStatus } from "../actions/action-economy-projection";
import {
  corpDefenseActionDispositions,
  corpDefenseMaterializedActionIds,
  corpDefensePortfolioHasExecutableRoute,
  corpEconomyActionIsOwned,
  type CorpDefenseSignal,
  type CorpScoreProjectSignal,
} from "./corp-core-plan-modules";
import {
  corpAmbushAdvanceDispositionEvidence,
  corpCandidateIsAmbushInstall,
} from "../runtime/corp-ambush-plan-signals";
import {
  corpPunishCampaignOwnsCandidate,
  type CorpPlanDomain,
} from "./corp-tactical-plan-modules";
import {
  corpExactCurrentBasicLiquidCreditCandidate,
  corpVisibleLiquidityDemandTarget,
} from "./corp-economy-domain-signals";
import {
  corpGlobalDefenseInstallRouteAssessment,
  corpIceInstallHasCurrentCompleteRezQuote,
  type CorpDefenseDomainSignalFacts,
} from "./corp-defense-domain-signals";
import { corpSameTurnScoreConversionPaths } from "./tactical-plan-corp-score-conversion";
import type { PlanActionDisposition } from "./plan-scheduler";
import { planInstanceIdForProposal } from "./plan-instance";
import { corpVoluntaryDrawLeavesUnsafeMandatoryHorizon } from "../runtime/corp-draw-admission";

type CorpRunDefenseAbilityAssessment = Readonly<{
  productive: boolean;
  serverId: string;
  value: number;
  evidenceCode: string;
}>;

type CorpDefensiveUpgradePlacement = Readonly<{
  signal?: CorpDefenseSignal;
  evidenceCode: string;
}>;

export type CorpActionDispositionContributorFacts = Readonly<{
  turnKey: (input: AiDecisionInput) => string;
  candidateTargetIds: (candidate: ActionSemanticCandidate) => string[];
  candidateIsVisibleCorpIceInstall: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => boolean;
  candidateIsVisibleCorpAgendaInstall: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => boolean;
  isCorpInstallServerId: (value: string) => boolean;
  corpCandidateIsImmediateRootRezEconomySource: (
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpCandidateIsScoreAccelerationSupport: (
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpCandidateProjectsCardDraw: (
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpConditionalRezSupportWithoutCurrentRouteEvidence: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
    sourceCard: VisibleCard,
    scoreProjects: readonly CorpScoreProjectSignal[],
  ) => string | undefined;
  corpDefenseSignalOwnsAction: (
    signal: CorpDefenseSignal,
    actionId: string,
  ) => boolean;
  corpDefensiveUpgradePlacement: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
    scoreProjects: readonly CorpScoreProjectSignal[],
  ) => CorpDefensiveUpgradePlacement | undefined;
  corpDefinitionSupportsPunishPlan: (
    definitionId: string | undefined,
  ) => boolean;
  corpConditionalPunishTagSourceHasNoVisiblePayoff: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpPunishQuoteRequestExists: (input: AiDecisionInput) => boolean;
  corpDrawCandidatePreservesHandCapacity: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpEmptyRdDrawOperationDispositionEvidence: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => string | undefined;
  corpExactExecutableNonEconomyPlanOwnsAction: (
    domain: CorpPlanDomain,
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpExactOverflowHandConversionPlanOwnsCandidate: (
    domain: CorpPlanDomain,
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpHandSignalMatchesCandidate: (
    signal: CorpPlanDomain["handManagement"][number],
    candidate: ActionSemanticCandidate,
  ) => boolean;
  corpOpenEconomyPlanOwnsAction: (
    domain: CorpPlanDomain,
    actionId: string,
  ) => boolean;
  corpRemoteCreationLockRemovalAction: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => LegalAction | undefined;
  corpRunDefenseAbilityAssessment: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => CorpRunDefenseAbilityAssessment | undefined;
  corpScoreProjectAssessmentIsUnknown: (
    project: CorpScoreProjectSignal,
  ) => boolean;
  corpScoreProjectId: (
    agendaInstanceOrDefinitionId: string,
    serverId: string | undefined,
  ) => string;
  corpScoredAgendaRevealWithoutPurposeDispositionEvidence: (
    input: AiDecisionInput,
    candidate: ActionSemanticCandidate,
  ) => string | undefined;
  visibleKnownCardType: (
    input: AiDecisionInput,
    card: VisibleCard,
  ) => string | undefined;
  defenseDomainSignalFacts: CorpDefenseDomainSignalFacts;
}>;

/**
 * Thin ordered aggregation over one owner-aware contribution pass per action.
 * The contributor preserves the historical first-match ordering exactly.
 */
export function collectCorpActionDispositions(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CorpPlanDomain,
  facts: CorpActionDispositionContributorFacts,
): PlanActionDisposition[] {
  const dispositions: PlanActionDisposition[] = [];
  const add = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    dispositions.push({
      actionId,
      disposition: "explicitly_nonproductive",
      ownerModuleId,
      evidenceCode,
    });
  };
  const addUnknown = (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => {
    dispositions.push({
      actionId,
      disposition: "assessment_unknown",
      ownerModuleId,
      evidenceCode,
    });
  };
  const defenseActionDispositions = new Map(
    corpDefenseActionDispositions(
      {
        input,
        actionCandidates: candidates,
        turnKey: facts.turnKey(input),
        domain,
      },
      domain.defenseNeeds,
      domain.centralDefenseAllocation,
    ).map((disposition) => [disposition.actionId, disposition.evidenceCode]),
  );
  const materializedDefenseActionIds = corpDefenseMaterializedActionIds(
    {
      input,
      actionCandidates: candidates,
      turnKey: facts.turnKey(input),
      domain,
    },
    domain.defenseNeeds,
    domain.centralDefenseAllocation,
  );
  const exactBasicCreditActionIds = candidates
    .filter((candidate) =>
      corpExactCurrentBasicLiquidCreditCandidate(input, candidate),
    )
    .map((candidate) => candidate.actionId);
  for (const candidate of candidates) {
    contributeCorpActionDispositionForCandidate(
      input,
      candidates,
      domain,
      candidate,
      defenseActionDispositions,
      materializedDefenseActionIds,
      exactBasicCreditActionIds,
      add,
      addUnknown,
      facts,
    );
  }
  return dispositions;
}

function contributeCorpActionDispositionForCandidate(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  domain: CorpPlanDomain,
  candidate: ActionSemanticCandidate,
  defenseActionDispositions: ReadonlyMap<string, string>,
  materializedDefenseActionIds: ReadonlySet<string>,
  exactBasicCreditActionIds: readonly string[],
  add: (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => void,
  addUnknown: (
    actionId: string,
    ownerModuleId: PlanActionDisposition["ownerModuleId"],
    evidenceCode: string,
  ) => void,
  facts: CorpActionDispositionContributorFacts,
): void {
  const deckoutHorizonDisposition =
    corpVoluntaryDrawDeckoutHorizonDisposition(input, candidate, domain);
  if (deckoutHorizonDisposition) {
    add(
      candidate.actionId,
      deckoutHorizonDisposition.ownerModuleId,
      deckoutHorizonDisposition.evidenceCode,
    );
    return;
  }
  if (candidate.planOwnerBinding?.owner === "corp.score_agenda") {
    add(
      candidate.actionId,
      "corp.score_agenda",
      `capability_plan_owner:${candidate.planOwnerBinding.capabilityKey}`,
    );
    return;
  }
  if (materializedDefenseActionIds.has(candidate.actionId)) {
    return;
  }
  const drawArbitrations = (domain.drawArbitrations ?? []).filter(
    (assessment) => assessment.actionId === candidate.actionId,
  );
  if (
    drawArbitrations.length > 0 &&
    drawArbitrations.every(
      (assessment) => assessment.disposition !== "admitted",
    ) &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    const assessment = drawArbitrations[0]!;
    const evidenceCode = `corp_draw_admission:${assessment.disposition}:${assessment.purpose}`;
    if (assessment.disposition === "blocked_unknown_projection") {
      addUnknown(candidate.actionId, assessment.ownerModuleId, evidenceCode);
    } else {
      add(candidate.actionId, assessment.ownerModuleId, evidenceCode);
    }
    return;
  }
  const emptyRdOperationEvidence =
    facts.corpEmptyRdDrawOperationDispositionEvidence(input, candidate);
  if (emptyRdOperationEvidence) {
    add(candidate.actionId, "corp.economy", emptyRdOperationEvidence);
    return;
  }
  if (
    facts.corpRemoteCreationLockRemovalAction(input, candidate) &&
    !domain.scoreProjects.some(
      (signal) =>
        signal.feasible &&
        signal.actionIds?.includes(candidate.actionId) === true,
    )
  ) {
    add(
      candidate.actionId,
      "corp.score_agenda",
      "corp_remote_creation_lock_removal_has_no_bound_score_parent",
    );
    return;
  }
  if (
    candidate.actionType === "play_operation" &&
    candidate.actionCapacityProjection?.kind === "future_recurring_gain"
  ) {
    add(
      candidate.actionId,
      "corp.economy",
      "corp_future_recurring_action_capacity_has_no_bound_parent_plan",
    );
    return;
  }
  if (
    candidate.sourceKind === "basic_action" &&
    candidate.semanticActionType === "economy.gain_credit" &&
    candidate.actionType === "gain_credit"
  ) {
    if (
      exactBasicCreditActionIds.length !== 1 ||
      exactBasicCreditActionIds[0] !== candidate.actionId
    ) {
      if (
        !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
        !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
      ) {
        addUnknown(
          candidate.actionId,
          "corp.economy",
          "corp_basic_credit_assessment_unknown:incomplete_exact_liquid_projection",
        );
      }
    } else if (
      !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId)
    ) {
      if (
        input.playerView.own.gripOrHq.length > input.playerView.own.maxHandSize
      ) {
        add(
          candidate.actionId,
          "corp.hand_and_agenda_management",
          "corp_basic_credit_rejected_hq_overflow_requires_cleanup",
        );
      } else if (
        input.playerView.own.credits >= corpVisibleLiquidityDemandTarget(input)
      ) {
        add(
          candidate.actionId,
          "corp.economy",
          "corp_basic_credit_rejected_visible_liquidity_demand_satisfied",
        );
      }
    }
    return;
  }
  if (
    corpEconomyActionIsOwned(candidate) &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.economy",
      "corp_immediate_liquid_route_has_no_open_need_or_exact_plan",
    );
    return;
  }
  if (
    candidate.semanticActionType === "corp_window.rez" &&
    facts.corpCandidateIsImmediateRootRezEconomySource(candidate) &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId)
  ) {
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    const outcome = action
      ? rootRezCreditOutcomeProjectionStatus(candidate, action)
      : {
          status: "missing" as const,
          evidenceCode: "corp_root_rez_credit_outcome_quote_missing",
        };
    if (outcome.status !== "guaranteed_positive") {
      add(
        candidate.actionId,
        "corp.economy",
        outcome.status === "not_applicable"
          ? "corp_root_rez_credit_outcome_quote_malformed_or_stale"
          : outcome.evidenceCode,
      );
      return;
    }
  }
  if (
    candidate.semanticActionType === "corp_window.rez" &&
    candidate.actionType === "rez_card" &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.economy",
      "corp_root_rez_has_no_exact_engine_certified_economy_or_defense_route",
    );
    return;
  }
  const exactScoreProjectOwnsAdvance =
    candidate.semanticActionType === "score.advance_card" &&
    domain.scoreProjects.some(
      (signal) =>
        signal.feasible &&
        signal.actionIds?.includes(candidate.actionId) === true,
    );
  const ambushAdvanceDisposition = exactScoreProjectOwnsAdvance
    ? undefined
    : corpAmbushAdvanceDispositionEvidence(candidate, domain.ambushes);
  if (ambushAdvanceDisposition) {
    add(candidate.actionId, "corp.ambush_and_bluff", ambushAdvanceDisposition);
    return;
  }
  if (
    (candidate.semanticActionType === "corp_window.decline_rez" ||
      candidate.actionType === "decline_rez") &&
    domain.defenseNeeds.some(
      (signal) =>
        signal.phase === "rez_response" &&
        signal.rezWindowVerdict === "productive" &&
        (signal.actionIds?.length ?? 0) > 0,
    )
  ) {
    add(
      candidate.actionId,
      "corp.defend_servers",
      "corp_decline_rez_rejected_for_exact_productive_rez_route",
    );
    return;
  }
  if (candidate.semanticActionType === "corp_window.rez") {
    const rejectedRezSignal = domain.defenseNeeds.find(
      (signal) =>
        signal.kind === "generic" &&
        signal.phase === "rez_response" &&
        signal.rezWindowVerdict === "nonproductive" &&
        facts.corpDefenseSignalOwnsAction(signal, candidate.actionId),
    );
    if (rejectedRezSignal) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        `corp_rez_rejected_by_exact_window_assessment:${rejectedRezSignal.evidenceCode}`,
      );
      return;
    }
  }
  if (candidate.semanticActionType === "card_ability.trigger") {
    const scoredAgendaRevealDisposition =
      facts.corpScoredAgendaRevealWithoutPurposeDispositionEvidence(
        input,
        candidate,
      );
    if (scoredAgendaRevealDisposition) {
      add(
        candidate.actionId,
        "corp.hand_and_agenda_management",
        scoredAgendaRevealDisposition,
      );
      return;
    }
    const runDefenseAbility = facts.corpRunDefenseAbilityAssessment(
      input,
      candidate,
    );
    if (
      runDefenseAbility &&
      !runDefenseAbility.productive &&
      !domain.defenseNeeds.some((signal) =>
        facts.corpDefenseSignalOwnsAction(signal, candidate.actionId),
      )
    ) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        runDefenseAbility.evidenceCode,
      );
      return;
    }
  }
  const defenseActionDisposition = defenseActionDispositions.get(
    candidate.actionId,
  );
  if (facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)) {
    return;
  }
  if (
    facts.candidateIsVisibleCorpIceInstall(input, candidate) &&
    defenseActionDisposition?.startsWith(
      "corp_defense_exact_route_requires_parent_funding:",
    )
  ) {
    add(candidate.actionId, "corp.defend_servers", defenseActionDisposition);
    return;
  }
  if (
    defenseActionDisposition &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId)
  ) {
    add(candidate.actionId, "corp.defend_servers", defenseActionDisposition);
    return;
  }
  if (
    facts.corpExactOverflowHandConversionPlanOwnsCandidate(domain, candidate)
  ) {
    return;
  }
  const globalDefenseServerId = facts.candidateIsVisibleCorpIceInstall(
    input,
    candidate,
  )
    ? facts.candidateTargetIds(candidate).find(facts.isCorpInstallServerId)
    : undefined;
  const globalDefenseInstallAssessment = globalDefenseServerId
    ? corpGlobalDefenseInstallRouteAssessment(
        input,
        candidate,
        globalDefenseServerId,
        domain.centralDefenseAllocation,
        facts.defenseDomainSignalFacts,
      )
    : undefined;
  if (globalDefenseInstallAssessment?.knowledge === "unknown") {
    const allCentralsAlreadyCovered =
      (globalDefenseServerId === "hq" || globalDefenseServerId === "rd") &&
      ["hq", "rd"].every(
        (serverId) =>
          (input.playerView.servers.find((server) => server.id === serverId)
            ?.ice.length ?? 0) > 0,
      );
    if (allCentralsAlreadyCovered) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        `corp_additional_central_ice_deferred_without_exact_route:${globalDefenseServerId}`,
      );
      return;
    }
    const targetRemote = globalDefenseServerId?.startsWith("remote_")
      ? input.playerView.servers.find(
          (server) => server.id === globalDefenseServerId,
        )
      : undefined;
    const quotedAdditionalRemoteLayer =
      targetRemote !== undefined &&
      targetRemote.ice.length > 0 &&
      (() => {
        const action = input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        return (
          action !== undefined &&
          action.source !== "basic_action" &&
          action.source !== "game_rule" &&
          corpIceInstallHasCurrentCompleteRezQuote(
            input,
            action,
            action.source,
            targetRemote.id,
          )
        );
      })();
    if (quotedAdditionalRemoteLayer) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        `corp_additional_remote_ice_deferred_without_exact_route:${globalDefenseServerId}`,
      );
      return;
    }
    const nonAgendaRemoteWithoutCapacityPressure =
      targetRemote !== undefined &&
      !targetRemote.root.some((card) => card.known && card.type === "agenda") &&
      input.playerView.own.gripOrHq.length <=
        input.playerView.own.maxHandSize &&
      (() => {
        const action = input.legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        return (
          action !== undefined &&
          action.source !== "basic_action" &&
          action.source !== "game_rule" &&
          corpIceInstallHasCurrentCompleteRezQuote(
            input,
            action,
            action.source,
            targetRemote.id,
          )
        );
      })();
    if (nonAgendaRemoteWithoutCapacityPressure) {
      add(
        candidate.actionId,
        "corp.defend_servers",
        `corp_nonagenda_remote_ice_deferred_without_exact_route:${globalDefenseServerId}`,
      );
      return;
    }
    addUnknown(
      candidate.actionId,
      "corp.defend_servers",
      globalDefenseInstallAssessment.evidenceCode,
    );
    return;
  }
  if (
    facts.candidateIsVisibleCorpIceInstall(input, candidate) &&
    !corpDefensePortfolioHasExecutableRoute(
      { input, actionCandidates: candidates, turnKey: facts.turnKey(input) },
      domain.defenseNeeds.filter((signal) =>
        facts.corpDefenseSignalOwnsAction(signal, candidate.actionId),
      ),
    )
  ) {
    add(
      candidate.actionId,
      "corp.defend_servers",
      "corp_ice_install_has_no_engine_certified_access_probability_reduction",
    );
    return;
  }
  if (
    (candidate.semanticActionType === "counter.purge_virus" ||
      candidate.semanticActionType === "counter.purge_runner_virus") &&
    !domain.virusPressure.some((signal) => signal.purgeUseful)
  ) {
    add(
      candidate.actionId,
      "corp.respond_to_virus_pressure",
      "corp_virus_purge_has_no_visible_strategic_pressure",
    );
    return;
  }
  if (
    facts.corpCandidateProjectsCardDraw(candidate) &&
    !facts.corpDrawCandidatePreservesHandCapacity(input, candidate) &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !facts.corpExactOverflowHandConversionPlanOwnsCandidate(
      domain,
      candidate,
    ) &&
    !domain.handManagement.some(
      (signal) =>
        signal.handPlanId === "draw-for-score-material" &&
        signal.drawAttemptState?.remainingAttempts === 1 &&
        signal.actionIds?.includes(candidate.actionId) === true,
    ) &&
    !domain.defenseNeeds.some(
      (signal) =>
        (signal.kind === "score_protection_draw" ||
          (signal.kind === "generic" && signal.phase === "draw_for_ice")) &&
        facts.corpDefenseSignalOwnsAction(signal, candidate.actionId),
    )
  ) {
    add(
      candidate.actionId,
      "corp.hand_and_agenda_management",
      "corp_exact_draw_projection_exceeds_hand_capacity",
    );
    return;
  }
  if (candidate.semanticActionType === "score.advance_card") {
    const exactScorePath = corpSameTurnScoreConversionPaths(input).find(
      (path) =>
        path.agendaCardId === candidate.sourceCardInstanceId &&
        path.sameTurnGuaranteed,
    );
    if (
      exactScorePath?.steps[0]?.kind === "score_ready" &&
      exactScorePath.desiredAdvancementCounters <=
        exactScorePath.advancementRequirement
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        "corp_ready_agenda_advance_rejected_for_exact_score_action",
      );
      return;
    }
    if (
      exactScorePath?.steps[0] &&
      exactScorePath.steps[0].kind !== "basic_advance"
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        `corp_same_turn_score_conversion_requires_committed_first_step:${exactScorePath.steps[0].kind}`,
      );
      return;
    }
  }
  if (
    facts.candidateIsVisibleCorpAgendaInstall(input, candidate) &&
    facts.candidateTargetIds(candidate).includes("new_remote") &&
    candidate.sourceCardInstanceId !== undefined &&
    preparedScoreParentSuppressesSiblingRoute(
      domain,
      candidate.sourceCardInstanceId,
    ) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.score_agenda",
      "corp_prepared_score_parent_dominates_sibling_route",
    );
    return;
  }
  const unknownScoreProject = domain.scoreProjects.find(
    (signal) =>
      !signal.feasible &&
      facts.corpScoreProjectAssessmentIsUnknown(signal) &&
      signal.actionIds?.includes(candidate.actionId) === true,
  );
  if (
    unknownScoreProject &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    if (
      facts.candidateIsVisibleCorpAgendaInstall(input, candidate) &&
      input.playerView.own.clicks <= 1
    ) {
      add(
        candidate.actionId,
        "corp.score_agenda",
        "corp_last_click_score_install_deferred_without_protection_horizon",
      );
    } else {
      addUnknown(
        candidate.actionId,
        "corp.score_agenda",
        unknownScoreProject.evidenceCode,
      );
    }
    return;
  }
  const blockedScoreProject = domain.scoreProjects.find(
    (signal) =>
      !signal.feasible &&
      signal.actionIds?.includes(candidate.actionId) === true,
  );
  if (
    blockedScoreProject &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.score_agenda",
      blockedScoreProject.evidenceCode,
    );
    return;
  }
  const sameTurnScoreProjectsForAgenda =
    facts.candidateIsVisibleCorpAgendaInstall(input, candidate)
      ? domain.scoreProjects.filter(
          (signal) =>
            signal.feasible &&
            signal.sameTurnCloseout &&
            signal.projectId ===
              facts.corpScoreProjectId(
                candidate.sourceCardInstanceId ??
                  candidate.sourceDefinitionId ??
                  "unbound",
                facts
                  .candidateTargetIds(candidate)
                  .find(facts.isCorpInstallServerId),
              ),
        )
      : [];
  const boundBySameTurnScoreProject = sameTurnScoreProjectsForAgenda.some(
    (signal) => signal.actionIds?.includes(candidate.actionId) === true,
  );
  if (
    sameTurnScoreProjectsForAgenda.length > 0 &&
    !boundBySameTurnScoreProject
  ) {
    add(
      candidate.actionId,
      "corp.score_agenda",
      "corp_same_turn_score_conversion_requires_committed_first_step",
    );
    return;
  }
  if (
    facts.candidateIsVisibleCorpAgendaInstall(input, candidate) &&
    !domain.scoreProjects.some(
      (signal) =>
        signal.feasible &&
        signal.actionIds?.includes(candidate.actionId) === true,
    ) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.score_agenda",
      "corp_agenda_install_has_no_admitted_score_parent",
    );
    return;
  }
  if (
    candidate.semanticActionType === "draw.card" &&
    input.playerView.own.gripOrHq.length >= input.playerView.own.maxHandSize &&
    !domain.handManagement.some(
      (signal) => signal.actionIds?.includes(candidate.actionId) === true,
    ) &&
    !domain.defenseNeeds.some(
      (signal) =>
        signal.phase === "draw_for_ice" &&
        facts.corpDefenseSignalOwnsAction(signal, candidate.actionId),
    )
  ) {
    add(
      candidate.actionId,
      "corp.hand_and_agenda_management",
      "corp_draw_exceeds_hand_capacity_without_concrete_search_plan",
    );
    return;
  }
  if (
    corpCandidateIsAmbushInstall(candidate) &&
    !domain.ambushes.some((signal) =>
      signal.actionIds.includes(candidate.actionId),
    )
  ) {
    add(
      candidate.actionId,
      "corp.ambush_and_bluff",
      "corp_ambush_install_has_no_bound_preplanning_commitment",
    );
    return;
  }
  const fundingBlockedAmbush = domain.ambushes.find(
    (signal) =>
      signal.phase === "install" &&
      signal.installRoute?.actionId === candidate.actionId &&
      signal.installRoute.fundingGap > 0,
  );
  if (fundingBlockedAmbush) {
    add(
      candidate.actionId,
      "corp.ambush_and_bluff",
      `corp_ambush_exact_install_requires_parent_funding:${fundingBlockedAmbush.sourceInstanceId}`,
    );
    return;
  }
  if (
    facts.corpCandidateIsScoreAccelerationSupport(candidate) &&
    !domain.scoreProjects.some(
      (signal) =>
        signal.feasible &&
        signal.actionIds?.includes(candidate.actionId) === true,
    ) &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId)
  ) {
    add(
      candidate.actionId,
      "corp.score_agenda",
      "corp_score_acceleration_support_has_no_bound_score_project",
    );
    return;
  }
  const visibleSource = candidate.sourceCardInstanceId
    ? [
        ...input.playerView.own.gripOrHq,
        ...(input.playerView.own.rig ?? []),
        ...input.playerView.servers.flatMap((server) => [
          ...server.root,
          ...server.ice,
        ]),
      ].find((card) => card.instanceId === candidate.sourceCardInstanceId)
    : undefined;
  const visibleSourceType =
    candidate.semanticActionType === "corp_window.rez" && visibleSource
      ? facts.visibleKnownCardType(input, visibleSource)
      : undefined;
  const unboundConditionalRezSupportEvidence =
    candidate.semanticActionType === "corp_window.rez" &&
    visibleSource !== undefined &&
    visibleSourceType !== "ice" &&
    !domain.defenseNeeds.some((signal) =>
      facts.corpDefenseSignalOwnsAction(signal, candidate.actionId),
    )
      ? facts.corpConditionalRezSupportWithoutCurrentRouteEvidence(
          input,
          candidate,
          visibleSource,
          domain.scoreProjects,
        )
      : undefined;
  if (unboundConditionalRezSupportEvidence) {
    add(
      candidate.actionId,
      "corp.defend_servers",
      unboundConditionalRezSupportEvidence,
    );
    return;
  }
  const defensiveUpgradePlacement = facts.corpDefensiveUpgradePlacement(
    input,
    candidate,
    domain.scoreProjects,
  );
  if (defensiveUpgradePlacement && !defensiveUpgradePlacement.signal) {
    add(
      candidate.actionId,
      "corp.defend_servers",
      defensiveUpgradePlacement.evidenceCode,
    );
    return;
  }
  if (
    candidate.actionType === "advance_card" &&
    visibleSource?.type === "asset" &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !domain.ambushes.some(
      (signal) => signal.sourceInstanceId === candidate.sourceCardInstanceId,
    )
  ) {
    add(
      candidate.actionId,
      "corp.hand_and_agenda_management",
      "corp_visible_asset_advance_has_no_assigned_project",
    );
    return;
  }
  const conditionalPunishAction =
    candidate.semanticActionType.startsWith("trace.") ||
    candidate.semanticActionType.startsWith("tag.") ||
    candidate.semanticActionType.startsWith("damage.") ||
    candidate.semanticActionType === "card_ability.trigger" ||
    candidate.semanticActionType === "play.corp_operation" ||
    (candidate.semanticActionType === "corp_window.rez" &&
      visibleSourceType !== "ice") ||
    candidate.actionType === "activated_card_ability" ||
    candidate.actionType === "trigger_ability" ||
    (candidate.semanticActionType === "install.card" &&
      !facts.candidateIsVisibleCorpIceInstall(input, candidate) &&
      !facts.candidateIsVisibleCorpAgendaInstall(input, candidate));
  if (
    conditionalPunishAction &&
    candidate.sourceDefinitionId &&
    facts.corpDefinitionSupportsPunishPlan(candidate.sourceDefinitionId) &&
    !domain.ambushes.some((signal) =>
      signal.actionIds.includes(candidate.actionId),
    ) &&
    !domain.punishCampaigns.some((signal) =>
      corpPunishCampaignOwnsCandidate(signal, candidate),
    )
  ) {
    if (candidate.semanticActionType === "install.card") {
      add(
        candidate.actionId,
        "corp.execute_punish_sequence",
        "corp_conditional_punish_setup_has_no_feasible_campaign",
      );
    } else if (
      facts.corpConditionalPunishTagSourceHasNoVisiblePayoff(input, candidate)
    ) {
      add(
        candidate.actionId,
        "corp.execute_punish_sequence",
        "corp_conditional_punish_tag_source_has_no_visible_payoff",
      );
    } else if (!facts.corpPunishQuoteRequestExists(input)) {
      add(
        candidate.actionId,
        "corp.execute_punish_sequence",
        "corp_conditional_punish_action_has_no_engine_quote_request",
      );
    } else if (input.playerView.corpPunishRouteQuoteSet?.complete !== true) {
      addUnknown(
        candidate.actionId,
        "corp.execute_punish_sequence",
        "corp_conditional_punish_action_quote_unknown",
      );
    } else {
      add(
        candidate.actionId,
        "corp.execute_punish_sequence",
        "corp_conditional_punish_action_has_no_feasible_campaign",
      );
    }
    return;
  }
  const blockedHandSignal = domain.handManagement.find(
    (signal) =>
      signal.routeAllowed === false &&
      facts.corpHandSignalMatchesCandidate(signal, candidate),
  );
  if (
    blockedHandSignal &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.hand_and_agenda_management",
      blockedHandSignal.evidenceCode,
    );
    return;
  }
  if (
    facts.corpCandidateProjectsCardDraw(candidate) &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.hand_and_agenda_management",
      "corp_draw_has_no_exact_parent_need",
    );
    return;
  }
  if (
    candidate.sourceKind === "card" &&
    [
      "install.card",
      "play.corp_operation",
      "card_ability.trigger",
      "economy.gain_credit",
    ].includes(candidate.semanticActionType) &&
    !facts.corpOpenEconomyPlanOwnsAction(domain, candidate.actionId) &&
    !facts.corpExactExecutableNonEconomyPlanOwnsAction(domain, candidate)
  ) {
    add(
      candidate.actionId,
      "corp.hand_and_agenda_management",
      "corp_card_action_has_no_exact_parent_need",
    );
  }
}

function corpVoluntaryDrawDeckoutHorizonDisposition(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  domain: CorpPlanDomain,
):
  | {
      ownerModuleId: PlanActionDisposition["ownerModuleId"];
      evidenceCode: string;
    }
  | undefined {
  const cardsDrawn =
    candidate.semanticActionType === "draw.card"
      ? 1
      : candidate.economyProjection?.cardsDrawn;
  if (!Number.isSafeInteger(cardsDrawn) || (cardsDrawn ?? 0) <= 0) {
    return undefined;
  }
  const admittedTerminalDraw = (domain.drawArbitrations ?? []).some(
    (assessment) =>
      assessment.actionId === candidate.actionId &&
      assessment.disposition === "admitted" &&
      assessment.terminalNeedBeforeMandatoryDraw,
  );
  const exactTerminalScoreSupport = domain.scoreProjects.some((project) => {
    if (
      !project.feasible ||
      (!project.sameTurnCloseout && !project.terminalScore)
    ) {
      return false;
    }
    const parentPlanInstanceId = planInstanceIdForProposal({
      moduleId: "corp.score_agenda",
      dedupeKey: project.projectId,
    });
    return domain.economyNeeds.some(
      (signal) =>
        signal.kind === "parent_funding" &&
        signal.parentPlanInstanceId === parentPlanInstanceId &&
        signal.actionIds.includes(candidate.actionId),
    );
  });
  if (
    !corpVoluntaryDrawLeavesUnsafeMandatoryHorizon({
      remainingDeckCardsBeforeDraw: input.playerView.own.stackOrRdCount,
      cardsDrawn: cardsDrawn!,
      terminalNeedBeforeMandatoryDraw:
        admittedTerminalDraw || exactTerminalScoreSupport,
    })
  ) {
    return undefined;
  }
  const remainingAfterDraw =
    input.playerView.own.stackOrRdCount - cardsDrawn!;
  const economyOwnsAction =
    candidate.semanticActionType === "economy.gain_credit" ||
    domain.economyNeeds.some((signal) =>
      signal.actionIds.includes(candidate.actionId),
    );
  const arbitrationOwner = (domain.drawArbitrations ?? []).find(
    (assessment) => assessment.actionId === candidate.actionId,
  )?.ownerModuleId;
  return {
    ownerModuleId: economyOwnsAction
      ? "corp.economy"
      : (arbitrationOwner ?? "corp.hand_and_agenda_management"),
    evidenceCode: `corp_voluntary_draw_blocked_deckout_horizon:remaining_after:${remainingAfterDraw}`,
  };
}

function preparedScoreParentSuppressesSiblingRoute(
  domain: CorpPlanDomain,
  agendaInstanceId: string,
): boolean {
  const preparedProjects = domain.scoreProjects.filter(
    (project) =>
      project.agendaInstanceId === agendaInstanceId &&
      project.serverId !== undefined &&
      project.serverId !== "new_remote" &&
      project.feasible,
  );
  if (preparedProjects.length === 0) return false;
  const siblingWasAdmitted = domain.scoreProjects.some(
    (project) =>
      project.agendaInstanceId === agendaInstanceId &&
      project.phase === "install_agenda" &&
      project.serverId === "new_remote",
  );
  return !siblingWasAdmitted;
}
