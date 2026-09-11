import { type AiDecisionInput, type LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../../action-semantic-candidate-types";
import { CARD_DEFINITIONS_BY_ID } from "../../card-definition-compatibility";
import {
  corpEconomyActionIsOwned,
  corpEconomyCandidateHasExecutablePayload,
  immediateCorpLiquidCreditGain,
} from "../economy/economy-routes";
import {
  corpImmediateOperationEconomyConversions,
  corpVisibleCardEconomyWithdrawals,
} from "../economy/economy-signals";
import { corpHandDuplicateCount } from "../hand-management/hand-inventory-facts";
import { corpScorePriorityClass } from "../score/corp-score-priority";
import { corpScoreHorizonCertificationIsCurrent } from "../score/score-project-signals";
import {
  corpScoreProjectNeedsProtectionMaturity,
  corpScoreProtectionIsSatisfied,
  corpScoreRemainingAdvancementClicks,
} from "../score/score-protection-needs";
import { type CorpDefenseSignal } from "../../plans/corp-defense-contracts";
import {
  corpIceInstallHasCurrentCompleteRezQuote,
  knownInstallRouteHasUsefulEffectBlockedByFunding,
} from "./corp-defense-domain-signals";
import { type CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import {
  projectCorpFundedIceInstallRoute,
  type CorpFundedIceInstallRouteProjection,
  type CorpFundedRemoteAccessRiskNeed,
  type KnownCorpFundedIceInstallRouteProjection,
} from "../../runtime/corp-funded-score-protection";
import { assessCorpScoreRushRisk } from "../../runtime/corp-score-rush-risk";
import { finiteNonNegativeIntegerOrResolutionFailure } from "../../runtime/exact-action-cost-facts";
import { visibleOwnCardByInstanceId } from "../../runtime/runner-action-source-facts";
import { visibleCorpIceDefenseProfile } from "../../runtime/semantic-runtime-corp-effective-defense";
import { candidateIsVisibleCorpIceInstall } from "../../runtime/visible-action-facts";
type CorpProductiveScoreProtectionInstallRoute = Readonly<{
  project: CorpScoreProjectSignal;
  candidate: ActionSemanticCandidate;
  projection: KnownCorpFundedIceInstallRouteProjection & {
    effect: "progress" | "satisfied";
  };
}>;

function isProductiveKnownScoreProtectionInstallProjection(
  projection: CorpFundedIceInstallRouteProjection,
): projection is KnownCorpFundedIceInstallRouteProjection & {
  effect: "progress" | "satisfied";
} {
  return (
    projection.knowledge === "known" &&
    (projection.effect === "progress" || projection.effect === "satisfied")
  );
}

type CorpScoreProtectionInstallRouteScan = Readonly<{
  productiveRoutes: readonly CorpProductiveScoreProtectionInstallRoute[];
  fundingGap?: number;
  directInstallRouteState:
    | Readonly<{
        knowledge: "known";
        disposition: "productive" | "effect_missing" | "funding_only";
      }>
    | Readonly<{ knowledge: "unknown" }>;
}>;

export function corpScoreProtectionInstallRouteScan(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): CorpScoreProtectionInstallRouteScan {
  const need = project.protectionNeed;
  if (
    !need ||
    corpScoreHorizonCertificationIsCurrent(input, project) ||
    (corpScoreProtectionIsSatisfied(input, project) &&
      !corpScoreProjectNeedsProtectionMaturity(project))
  ) {
    return {
      productiveRoutes: [],
      directInstallRouteState: {
        knowledge: "known",
        disposition: "effect_missing",
      },
    };
  }
  if (need.baseline.knowledge === "unknown") {
    return {
      productiveRoutes: [],
      directInstallRouteState: { knowledge: "unknown" },
    };
  }
  const currentServer =
    need.targetServerId === "new_remote"
      ? undefined
      : input.playerView.servers.find(
          (server) => server.id === need.targetServerId,
        );
  if (need.targetServerId !== "new_remote" && !currentServer) {
    throw new PlanResolutionFailure("step_target_mismatch", {
      side: input.side,
      stateVersion: input.playerView.stateVersion,
      timingPoint: input.playerView.timingPoint,
      legalActionTypes: input.legalActions.map((action) => action.type),
      owner: "plan_module",
      removalCondition: `Bind score protection route ${need.needId} to its visible target server.`,
    });
  }
  const evaluatedRoutes = candidates.flatMap((candidate) => {
    if (!candidateIsVisibleCorpIceInstall(input, candidate)) return [];
    const action = input.legalActions.find(
      (legalAction) => legalAction.actionId === candidate.actionId,
    );
    if (!action || action.payload?.serverId !== need.targetServerId) return [];
    const projectedInstallCredits = finiteNonNegativeIntegerOrResolutionFailure(
      input,
      candidate.costProfile.creditCost,
      `Provide exact ICE-install credits for ${candidate.actionId}.`,
    );
    const projectedInstallClicks = finiteNonNegativeIntegerOrResolutionFailure(
      input,
      candidate.costProfile.clickCost,
      `Provide exact ICE-install clicks for ${candidate.actionId}.`,
    );
    const projection = projectCorpFundedIceInstallRoute({
      need,
      action,
      currentStateVersion: input.playerView.stateVersion,
      currentCorpCredits: input.playerView.own.credits,
      currentCorpClicks: input.playerView.own.clicks,
      currentCorpAgendaPoints: input.playerView.own.agendaPoints,
      visibleCorpHand: input.playerView.own.gripOrHq,
      ...(currentServer
        ? {
            currentServer: {
              id: currentServer.id,
              ice: currentServer.ice.map((ice) => ({
                instanceId: ice.instanceId,
                known: ice.known,
                ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
                ...(ice.rezzed !== undefined ? { rezzed: ice.rezzed } : {}),
                ...(ice.strength !== undefined
                  ? { strength: ice.strength }
                  : {}),
                ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
                ...(ice.effectiveRunQuote
                  ? { effectiveRunQuote: ice.effectiveRunQuote }
                  : {}),
                ...(ice.effectiveRezCostQuote
                  ? { effectiveRezCostQuote: ice.effectiveRezCostQuote }
                  : {}),
              })),
            },
          }
        : {}),
      runnerRig: input.playerView.opponent.rig ?? [],
      runnerSetAside: input.playerView.specialZones?.setAside ?? [],
      ...(input.playerView.opponent.memoryUsed !== undefined
        ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
        : {}),
      ...(input.playerView.opponent.memoryLimit !== undefined
        ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
        : {}),
      runnerCredits: input.playerView.opponent.credits,
      projectedInstallCredits,
      projectedInstallClicks,
    });
    return [
      {
        candidate,
        action,
        projection,
        projectedInstallCredits,
      },
    ];
  });
  const anyUnknown = evaluatedRoutes.some(
    ({ projection }) => projection.knowledge === "unknown",
  );
  const exactFundingGaps = evaluatedRoutes.flatMap(({ projection }) => {
    if (
      projection.knowledge !== "known" ||
      !knownInstallRouteHasUsefulEffectBlockedByFunding(projection)
    ) {
      return [];
    }
    const gap = projection.after.minimumAdditionalCreditsToSatisfy;
    return typeof gap === "number" && Number.isSafeInteger(gap) && gap > 0
      ? [gap]
      : [];
  });
  const productiveRoutes: CorpProductiveScoreProtectionInstallRoute[] =
    evaluatedRoutes.flatMap(({ candidate, projection }) => {
      if (!isProductiveKnownScoreProtectionInstallProjection(projection)) {
        return [];
      }
      return [
        {
          project,
          candidate,
          projection,
        },
      ];
    });
  return {
    productiveRoutes,
    ...(exactFundingGaps.length > 0
      ? { fundingGap: Math.min(...exactFundingGaps) }
      : {}),
    directInstallRouteState: anyUnknown
      ? { knowledge: "unknown" }
      : {
          knowledge: "known",
          disposition:
            productiveRoutes.length > 0
              ? "productive"
              : need.baseline.protection.protectsScore ||
                  evaluatedRoutes.some(({ projection }) =>
                    knownInstallRouteHasUsefulEffectBlockedByFunding(
                      projection,
                    ),
                  )
                ? "funding_only"
                : "effect_missing",
        },
  };
}

export function corpScoreProtectionStagingInstallSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  project: CorpScoreProjectSignal,
  scan: CorpScoreProtectionInstallRouteScan,
  allCandidates: readonly ActionSemanticCandidate[],
):
  | Extract<CorpDefenseSignal, { kind: "score_protection_staging_install" }>
  | undefined {
  const need = project.protectionNeed;
  const serverId = project.serverId;
  const existingRemote =
    serverId?.startsWith("remote_") === true
      ? input.playerView.servers.find((server) => server.id === serverId)
      : undefined;
  const boundedStagingLayerLimitReached =
    (existingRemote !== undefined && existingRemote.ice.length >= 2) ||
    (serverId === "new_remote" &&
      input.playerView.servers.some(
        (server) =>
          server.id.startsWith("remote_") &&
          server.root.length === 0 &&
          server.ice.length >= 2,
      ));
  if (
    !need ||
    !serverId ||
    (serverId !== "new_remote" && !serverId.startsWith("remote_")) ||
    (serverId !== "new_remote" && existingRemote === undefined) ||
    // Productive routes were already admitted by the exact route scan. This
    // backstop may stage the first two layers, but it must not manufacture an
    // unbounded third-or-later protection lifecycle from an unknown quote.
    boundedStagingLayerLimitReached ||
    need.targetServerId !== serverId ||
    !scoreProtectionStagingMayBackstopDirectRoute(project, need, scan) ||
    !candidateIsVisibleCorpIceInstall(input, candidate) ||
    !candidate.sourceCardInstanceId ||
    !candidate.sourceDefinitionId
  ) {
    return undefined;
  }
  const source = visibleOwnCardByInstanceId(
    input,
    candidate.sourceCardInstanceId,
  );
  const definition = CARD_DEFINITIONS_BY_ID[candidate.sourceDefinitionId];
  const sourceDefense = visibleCorpIceDefenseProfile(source);
  const startsFirstScoreProtectionLayer =
    serverId === "new_remote" || existingRemote?.ice.length === 0;
  const reinforcesExistingIceRole =
    corpHandDuplicateCount(input, candidate.sourceDefinitionId) > 1 ||
    existingRemote?.ice.some(
      (ice) => ice.definitionId === candidate.sourceDefinitionId,
    ) === true;
  const boundedConditionalDeterrence =
    source !== undefined &&
    (sourceDefense.hasDirectEncounterCostOrDamage ||
      sourceDefense.hasEncounterDisruption ||
      ((startsFirstScoreProtectionLayer || reinforcesExistingIceRole) &&
        sourceDefense.hasMeaningfulTaxOrDamage));
  if (
    source?.definitionId !== candidate.sourceDefinitionId ||
    definition?.type !== "ice" ||
    (!sourceDefense.hasImmediateStop && !boundedConditionalDeterrence)
  ) {
    return undefined;
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  if (
    action?.side !== "corp" ||
    action.type !== "install_card" ||
    action.source !== candidate.sourceCardInstanceId ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.timingPoint !== input.playerView.timingPoint ||
    action.payload?.placement !== "ice" ||
    action.payload.serverId !== serverId ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0 ||
    !corpIceInstallHasCurrentCompleteRezQuote(
      input,
      action,
      candidate.sourceCardInstanceId,
      serverId,
    )
  ) {
    return undefined;
  }
  const totalClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const totalCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  if (
    totalClicks !== 1 ||
    !Number.isSafeInteger(totalCredits) ||
    totalCredits < 0 ||
    totalCredits > input.playerView.own.credits ||
    candidate.costProfile.clickCost !== totalClicks ||
    candidate.costProfile.creditCost !== totalCredits ||
    candidate.costProfile.additionalCosts.length > 0
  ) {
    return undefined;
  }
  if (!corpScoreProtectionStagingPairFitsCurrentTurn(input, project, action)) {
    return undefined;
  }
  const completesBoundedScoreProtectionMaturity =
    existingRemote?.ice.length === 1 &&
    corpScoreProjectNeedsProtectionMaturity(project);
  const boundedStagingLayerWithoutCurrentFunding =
    (startsFirstScoreProtectionLayer ||
      completesBoundedScoreProtectionMaturity) &&
    corpBoundedScoreProtectionLayerCanPrecedeFunding(
      input,
      project,
      action,
      allCandidates,
    );
  if (
    startsFirstScoreProtectionLayer &&
    !boundedStagingLayerWithoutCurrentFunding &&
    corpScoreProtectionHasMaterialImmediateLiquidityAlternative(
      input,
      allCandidates,
    )
  ) {
    return undefined;
  }
  if (
    !boundedStagingLayerWithoutCurrentFunding &&
    !corpScoreProtectionStagingRezPortfolioIsNearTermFundable(
      input,
      project,
      action,
    )
  ) {
    return undefined;
  }
  const remainingAdvancementClicks = corpScoreRemainingAdvancementClicks(
    input,
    project,
  );
  if (remainingAdvancementClicks === undefined || !source) return undefined;
  const projectedServer = {
    id: serverId,
    ice: [...(existingRemote?.ice ?? []), source],
    root: existingRemote?.root ?? [],
  };
  const rushRisk = assessCorpScoreRushRisk({
    input,
    server: projectedServer,
    agendaPoints: project.agendaPoints,
    remainingAdvancementClicks,
  });
  return {
    kind: "score_protection_staging_install",
    defenseId: `score-protection-staging-install:${project.projectId}:${candidate.actionId}`,
    serverId,
    phase: "install_ice",
    parentProjectId: project.projectId,
    parentNeedId: need.needId,
    delegatedPriorityClass: corpScorePriorityClass(project),
    actionId: candidate.actionId,
    sourceCardInstanceId: candidate.sourceCardInstanceId,
    sourceDefinitionId: candidate.sourceDefinitionId,
    evidenceCode: `score_protection_staging_install:${project.projectId}:${serverId}:development_risk_${rushRisk.reason}`,
  };
}

export function corpPreparedScoreProjectHasExecutableCurrentStep(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): boolean {
  if (
    project.feasible &&
    project.actionIds?.some((actionId) =>
      candidates.some((candidate) => candidate.actionId === actionId),
    ) === true
  ) {
    return true;
  }
  if (!project.protectionNeed) return false;
  const scan = corpScoreProtectionInstallRouteScan(input, candidates, project);
  return (
    scan.productiveRoutes.length > 0 ||
    candidates.some(
      (candidate) =>
        corpScoreProtectionStagingInstallSignal(
          input,
          candidate,
          project,
          scan,
          candidates,
        ) !== undefined,
    )
  );
}

export function corpPreparedScoreProjectHasImmediateFundingSupport(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
  project: CorpScoreProjectSignal,
): boolean {
  if (
    project.serverId === undefined ||
    project.serverId === "new_remote" ||
    project.phase !== "install_agenda"
  ) {
    return false;
  }
  const preparedRemote = input.playerView.servers.find(
    (server) => server.id === project.serverId,
  );
  if (
    !preparedRemote ||
    preparedRemote.root.length > 0 ||
    preparedRemote.ice.length === 0
  ) {
    return false;
  }
  const scan = corpScoreProtectionInstallRouteScan(input, candidates, project);
  return (
    scan.directInstallRouteState.knowledge === "known" &&
    scan.directInstallRouteState.disposition === "funding_only" &&
    typeof scan.fundingGap === "number" &&
    scan.fundingGap > 0 &&
    candidates.some(
      (candidate) =>
        corpEconomyActionIsOwned(candidate) &&
        immediateCorpLiquidCreditGain(candidate) > 0 &&
        corpEconomyCandidateHasExecutablePayload(input, candidate),
    )
  );
}

function corpBoundedScoreProtectionLayerCanPrecedeFunding(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
  action: LegalAction,
  candidates: readonly ActionSemanticCandidate[],
): boolean {
  const agendaDefinition = project.agendaDefinitionId
    ? CARD_DEFINITIONS_BY_ID[project.agendaDefinitionId]
    : undefined;
  const advancementRequirement = agendaDefinition?.advancementRequirement;
  const centralsHaveInitialCoverage = ["hq", "rd"].every(
    (serverId) =>
      (input.playerView.servers.find((server) => server.id === serverId)?.ice
        .length ?? 0) > 0,
  );
  const immediateLiquidAlternativeExists =
    corpScoreProtectionHasMaterialImmediateLiquidityAlternative(
      input,
      candidates,
    );
  const installCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  const rezCredits = action.payload?.postInstallRezQuoteFinalCredits;
  const stagingLayerCanBeRezzedFromCurrentLiquidity =
    project.terminalScore &&
    Number.isSafeInteger(installCredits) &&
    installCredits >= 0 &&
    typeof rezCredits === "number" &&
    Number.isSafeInteger(rezCredits) &&
    rezCredits >= 0 &&
    installCredits + rezCredits <= input.playerView.own.credits;
  return (
    stagingLayerCanBeRezzedFromCurrentLiquidity ||
    (typeof advancementRequirement === "number" &&
      advancementRequirement >= 4 &&
      input.playerView.own.credits >= 5 &&
      input.playerView.own.stackOrRdCount > 1 &&
      input.playerView.opponent.credits <= input.playerView.own.credits + 2 &&
      centralsHaveInitialCoverage &&
      !immediateLiquidAlternativeExists)
  );
}

export function corpScoreProtectionHasMaterialImmediateLiquidityAlternative(
  input: AiDecisionInput,
  candidates: readonly ActionSemanticCandidate[],
): boolean {
  return (
    corpImmediateOperationEconomyConversions(input, candidates).length > 0 ||
    corpVisibleCardEconomyWithdrawals(input, candidates).length > 0 ||
    candidates.some((candidate) => {
      const projection = candidate.economyProjection;
      return (
        candidate.semanticActionType === "economy.gain_credit" &&
        projection?.kind === "immediate_liquid" &&
        projection.timing === "immediate" &&
        projection.creditRestriction === "general" &&
        projection.reliability === "guaranteed" &&
        (projection.netLiquidCreditGain ?? 0) >= 2 &&
        candidate.costProfile.additionalCosts.length === 0 &&
        !candidate.hardGates.some((gate) => gate.status === "block")
      );
    })
  );
}

function corpScoreProtectionStagingRezPortfolioIsNearTermFundable(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
  action: LegalAction,
): boolean {
  const need = project.protectionNeed;
  if (!need) return false;
  const reserveIds = need.scoreReserve.creditBreakdown.map(
    (entry) => entry.reserveId,
  );
  if (new Set(reserveIds).size !== reserveIds.length) return false;
  const scoreReserveCredits = need.scoreReserve.creditBreakdown.reduce(
    (sum, entry) =>
      Number.isSafeInteger(entry.credits) && entry.credits >= 0
        ? sum + entry.credits
        : Number.NaN,
    0,
  );
  const installCredits = action.costs.reduce(
    (sum, cost) => sum + (cost.credits ?? 0),
    0,
  );
  const installClicks = action.costs.reduce(
    (sum, cost) => sum + (cost.clicks ?? 0),
    0,
  );
  const sourceRezCredits = action.payload?.postInstallRezQuoteFinalCredits;
  if (
    !Number.isSafeInteger(scoreReserveCredits) ||
    !Number.isSafeInteger(installCredits) ||
    installCredits < 0 ||
    !Number.isSafeInteger(installClicks) ||
    installClicks < 0 ||
    typeof sourceRezCredits !== "number" ||
    !Number.isSafeInteger(sourceRezCredits) ||
    sourceRezCredits < 0 ||
    !Number.isSafeInteger(need.scoreReserve.hardClickReserve) ||
    need.scoreReserve.hardClickReserve < 0
  ) {
    return false;
  }
  // The current-turn pair contract already proves that installing this ICE
  // and its agenda fits now. Advancement and scoring clicks are a multi-turn
  // reserve; requiring all of them in the current turn would erase the exact
  // staging route that this near-term portfolio represents.
  // Existing unrezzed ICE are alternative encounter responses, not a debt
  // that must be funded together with every later layer. The staging route
  // binds and funds its newly installed source; the exact protection quote
  // can still select additional existing ICE when that is actually needed.
  const pendingRezCredits = sourceRezCredits;
  const nearTermFundingGap = Math.max(
    0,
    installCredits +
      scoreReserveCredits +
      pendingRezCredits -
      input.playerView.own.credits,
  );
  const standardNextCorpTurnBasicCreditCapacity = 3;
  return nearTermFundingGap <= standardNextCorpTurnBasicCreditCapacity;
}

function scoreProtectionStagingMayBackstopDirectRoute(
  project: CorpScoreProjectSignal,
  need: CorpFundedRemoteAccessRiskNeed,
  scan: CorpScoreProtectionInstallRouteScan,
): boolean {
  if (scan.productiveRoutes.length > 0) return false;
  return (
    need.baseline.knowledge === "known" &&
    (need.baseline.protection.protectsScore === false ||
      corpScoreProjectNeedsProtectionMaturity(project)) &&
    scan.directInstallRouteState.knowledge === "known" &&
    (scan.directInstallRouteState.disposition === "effect_missing" ||
      scan.directInstallRouteState.disposition === "funding_only")
  );
}

function corpScoreProtectionStagingPairFitsCurrentTurn(
  input: AiDecisionInput,
  project: CorpScoreProjectSignal,
  iceAction: LegalAction,
): boolean {
  const agendaAction = input.legalActions.find(
    (action) =>
      project.actionIds?.includes(action.actionId) === true &&
      action.side === "corp" &&
      action.type === "install_card" &&
      action.payload?.placement === "root" &&
      action.payload.serverId === project.serverId &&
      action.expiresAtStateVersion === input.playerView.stateVersion &&
      action.timingPoint === input.playerView.timingPoint,
  );
  if (!agendaAction) return false;
  const total = (action: LegalAction, resource: "clicks" | "credits") =>
    action.costs.reduce((sum, cost) => sum + (cost[resource] ?? 0), 0);
  return (
    total(agendaAction, "clicks") + total(iceAction, "clicks") <=
      input.playerView.own.clicks &&
    total(agendaAction, "credits") + total(iceAction, "credits") <=
      input.playerView.own.credits
  );
}
