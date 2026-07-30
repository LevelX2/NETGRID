import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import type {
  CorpCorePlanDomain,
  CorpDefenseSignal,
} from "./corp-core-plan-modules";
import {
  assessBestFundedCorpScoreProtection,
  projectCorpFundedIceInstallRoute,
  type CorpFundedIceInstallRouteProjection,
  type CorpFundedRemoteAccessRiskNeed,
  type CorpScoreReserve,
  type KnownCorpFundedIceInstallRouteProjection,
} from "../runtime/corp-funded-score-protection";
import { corpHandDuplicateCount } from "../runtime/corp-hand-inventory-facts";
import { corpKnownAgendaInventory } from "../runtime/corp-known-agenda-inventory";
import { isCorpOpeningTurnSerial } from "../runtime/corp-opening-rush";
import { readKnownCorpCentralAgendaThreat } from "../runtime/corp-central-defense-facts-adapter";
import { compareExactProbabilities } from "../runtime/corp-score-protection-assessment";
import {
  visibleBreakerCardCanAddressIce,
  visibleBreakerRoles,
} from "../runtime/runner-visible-breaker-coverage";
import { visibleCorpIceDefenseProfile } from "../runtime/semantic-runtime-corp-effective-defense";

export type CorpDefenseDomainSignalFacts = Readonly<{
  hasExactNonNegativeCostProfile: (
    candidate: ActionSemanticCandidate,
  ) => boolean;
  archivesHasVisibleKnownAgenda: (input: AiDecisionInput) => boolean;
}>;

export function corpIceInstallHasCurrentCompleteRezQuote(
  input: AiDecisionInput,
  action: LegalAction,
  sourceCardInstanceId: string,
  targetServerId: string,
): boolean {
  const payload = action.payload;
  return (
    payload?.postInstallRezQuoteComplete === true &&
    payload.postInstallRezQuoteCardId === sourceCardInstanceId &&
    payload.postInstallRezQuoteTargetServerId === targetServerId &&
    payload.postInstallRezQuoteExpiresAtStateVersion ===
      input.playerView.stateVersion &&
    typeof payload.postInstallRezQuoteFinalCredits === "number" &&
    Number.isSafeInteger(payload.postInstallRezQuoteFinalCredits) &&
    payload.postInstallRezQuoteFinalCredits >= 0
  );
}

export function knownInstallRouteHasUsefulEffectBlockedByFunding(
  projection: CorpFundedIceInstallRouteProjection,
): boolean {
  if (
    projection.knowledge !== "known" ||
    projection.funded ||
    projection.before.knowledge !== "known"
  ) {
    return false;
  }
  const minimumSatisfyingRezCosts = projection.after.minimumSatisfyingRezCosts;
  const minimumSatisfyingProtection =
    projection.after.minimumSatisfyingProtection;
  const sourceContributesToMinimumSatisfyingSelection =
    minimumSatisfyingRezCosts?.some(
      (cost) => cost.iceInstanceId === projection.sourceCardInstanceId,
    ) === true;
  const riskComparison = compareExactProbabilities(
    minimumSatisfyingProtection?.runnerAccessSuccessProbability ??
      projection.after.protection.runnerAccessSuccessProbability,
    projection.before.protection.runnerAccessSuccessProbability,
  );
  const exactFundingGap = projection.after.minimumAdditionalCreditsToSatisfy;
  const exactSatisfyingRezCost = projection.after.minimumSatisfyingRezCost;
  return (
    sourceContributesToMinimumSatisfyingSelection &&
    (riskComparison === -1 ||
      (projection.before.protection.protectsScore === false &&
        minimumSatisfyingProtection?.protectsScore === true)) &&
    typeof exactFundingGap === "number" &&
    Number.isSafeInteger(exactFundingGap) &&
    exactFundingGap > 0 &&
    typeof exactSatisfyingRezCost === "number" &&
    Number.isSafeInteger(exactSatisfyingRezCost) &&
    exactSatisfyingRezCost >= 0
  );
}

export type CorpGlobalDefenseInstallRouteAssessment =
  | Readonly<{
      knowledge: "known";
      disposition: "productive" | "funding_only";
      progressKind:
        | "engine_certified_access"
        | "funded_structured_central_defense"
        | "scoreline_central_tax_allocation"
        | "staged_central_defense"
        | "score_material_capacity_release"
        | "agenda_capacity_defense_conversion"
        | "funding_required";
      rezFundingGap: number;
      projection: KnownCorpFundedIceInstallRouteProjection;
    }>
  | Readonly<{
      knowledge: "known";
      disposition: "effect_missing";
      evidenceCode: string;
    }>
  | Readonly<{
      knowledge: "unknown";
      evidenceCode: string;
    }>;

/**
 * Admits a non-score ICE install when the Engine-quoted route improves the
 * exact visible access path. First-layer central coverage and structured,
 * visible ICE defense semantics may also establish qualitative progress when
 * the exact run quote cannot yet express the hidden ICE's encounter effect.
 */
export function corpGlobalDefenseInstallRoute(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"],
  facts: CorpDefenseDomainSignalFacts,
):
  | Readonly<{
      disposition: "productive" | "funding_only";
      progressKind:
        | "engine_certified_access"
        | "funded_structured_central_defense"
        | "scoreline_central_tax_allocation"
        | "staged_central_defense"
        | "score_material_capacity_release"
        | "agenda_capacity_defense_conversion"
        | "funding_required";
      rezFundingGap: number;
      projection: KnownCorpFundedIceInstallRouteProjection;
    }>
  | undefined {
  const assessment = corpGlobalDefenseInstallRouteAssessment(
    input,
    candidate,
    serverId,
    centralAllocation,
    facts,
  );
  return assessment.knowledge === "known" &&
    assessment.disposition !== "effect_missing"
    ? {
        disposition: assessment.disposition,
        progressKind: assessment.progressKind,
        rezFundingGap: assessment.rezFundingGap,
        projection: assessment.projection,
      }
    : undefined;
}

export function corpQualitativeIceStagingSignal(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"],
  facts: CorpDefenseDomainSignalFacts,
): CorpDefenseSignal | undefined {
  const isCentral = serverId === "hq" || serverId === "rd";
  const isExistingRemote = serverId.startsWith("remote_");
  if (!isCentral && !isExistingRemote) return undefined;
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  if (!server) return undefined;
  const unknownAllocationTerminalSecondLayer =
    isCentral &&
    centralAllocation?.status !== "known" &&
    server.ice.length === 1 &&
    readKnownCorpCentralAgendaThreat({
      input,
      serverId: serverId as "hq" | "rd",
    })?.threat === "terminal";
  if (server.ice.length > 0 && !unknownAllocationTerminalSecondLayer) {
    return undefined;
  }
  const bothCentralsEmpty = ["hq", "rd"].every(
    (centralServerId) =>
      input.playerView.servers.find(
        (candidateServer) => candidateServer.id === centralServerId,
      )?.ice.length === 0,
  );
  if (isCentral) {
    if (
      !unknownAllocationTerminalSecondLayer &&
      (centralAllocation?.status === "known"
        ? centralAllocation.selectedServerId !== serverId
        : !bothCentralsEmpty)
    ) {
      return undefined;
    }
  } else {
    const handOverflow =
      input.playerView.own.gripOrHq.length > input.playerView.own.maxHandSize;
    const bothCentralsCovered = ["hq", "rd"].every(
      (centralServerId) =>
        (input.playerView.servers.find(
          (candidateServer) => candidateServer.id === centralServerId,
        )?.ice.length ?? 0) > 0,
    );
    if (!handOverflow || server.root.length === 0 || !bothCentralsCovered) {
      return undefined;
    }
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const sourceCard = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === action?.source,
  );
  const sourceDefense = visibleCorpIceDefenseProfile(sourceCard);
  if (
    !action ||
    action.side !== "corp" ||
    action.type !== "install_card" ||
    action.expiresAtStateVersion !== input.playerView.stateVersion ||
    action.payload?.placement !== "ice" ||
    action.payload.serverId !== serverId ||
    action.targetRequirements.length > 0 ||
    (action.choiceRequirements?.length ?? 0) > 0 ||
    !candidate.sourceDefinitionId ||
    !sourceDefense.isVisibleIce ||
    (!sourceDefense.hasImmediateStop &&
      !sourceDefense.hasMeaningfulTaxOrDamage &&
      !sourceDefense.hasEncounterDisruption) ||
    !facts.hasExactNonNegativeCostProfile(candidate) ||
    candidate.costProfile.clickCost !== 1 ||
    candidate.costProfile.creditCost === undefined ||
    candidate.costProfile.creditCost > input.playerView.own.credits ||
    !corpIceInstallHasCurrentCompleteRezQuote(
      input,
      action,
      action.source,
      serverId,
    ) ||
    typeof action.payload.postInstallRezQuoteFinalCredits !== "number"
  ) {
    return undefined;
  }
  const rezCredits = action.payload.postInstallRezQuoteFinalCredits;
  const creditsAfterInstall =
    input.playerView.own.credits - candidate.costProfile.creditCost;
  const rezFundingGap = Math.max(0, rezCredits - creditsAfterInstall);
  if (rezFundingGap > 3) return undefined;
  const centralPressure = unknownAllocationTerminalSecondLayer
    ? "terminal"
    : isCentral && centralAllocation?.status === "known"
      ? centralAllocation.evidence[serverId].threat
      : undefined;
  return {
    kind: "generic",
    defenseId: `qualitative-ice-staging:${serverId}:${candidate.actionId}`,
    serverId,
    phase: "install_defense_support",
    sourceDefinitionIds: [candidate.sourceDefinitionId],
    actionIds: [candidate.actionId],
    urgent: centralPressure === "terminal",
    ...(centralPressure && centralPressure !== "none"
      ? { centralPressure }
      : {}),
    immediateInstallSupport: true,
    value: unknownAllocationTerminalSecondLayer
      ? 18
      : sourceDefense.hasImmediateStop
        ? 11
        : 9,
    evidenceCode: unknownAllocationTerminalSecondLayer
      ? `corp_terminal_central_second_layer_staging:${serverId}:${candidate.actionId}:rez_gap_${rezFundingGap}`
      : `corp_qualitative_ice_staging:${serverId}:${candidate.actionId}:rez_gap_${rezFundingGap}`,
  };
}

export function corpGlobalDefenseInstallRouteAssessment(
  input: AiDecisionInput,
  candidate: ActionSemanticCandidate,
  serverId: string,
  centralAllocation: CorpCorePlanDomain["centralDefenseAllocation"],
  facts: CorpDefenseDomainSignalFacts,
): CorpGlobalDefenseInstallRouteAssessment {
  if (serverId === "new_remote") {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_global_defense_cannot_invent_an_unbound_new_remote_objective",
    };
  }
  if (
    serverId === "archives" &&
    !input.playerView.own.heapOrArchives.some(
      (card) => card.known && card.type === "agenda",
    )
  ) {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode: "corp_archives_ice_install_has_no_visible_agenda_pressure",
    };
  }
  if (!facts.hasExactNonNegativeCostProfile(candidate)) {
    return {
      knowledge: "unknown",
      evidenceCode:
        "corp_ice_install_assessment_unknown:install_cost_semantics_unknown",
    };
  }
  const projectedInstallCredits = candidate.costProfile.creditCost;
  const projectedInstallClicks = candidate.costProfile.clickCost;
  if (
    projectedInstallCredits === undefined ||
    projectedInstallClicks === undefined
  ) {
    return {
      knowledge: "unknown",
      evidenceCode:
        "corp_ice_install_assessment_unknown:install_cost_semantics_unknown",
    };
  }
  const action = input.legalActions.find(
    (legalAction) => legalAction.actionId === candidate.actionId,
  );
  const server = input.playerView.servers.find(
    (candidateServer) => candidateServer.id === serverId,
  );
  if (!action || (serverId !== "new_remote" && !server)) {
    return {
      knowledge: "unknown",
      evidenceCode:
        "corp_ice_install_assessment_unknown:action_or_server_binding_unknown",
    };
  }
  const sourceCard = input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === action.source,
  );
  const sourceDefense = visibleCorpIceDefenseProfile(sourceCard);
  const centralIceCounts = ["hq", "rd"].map(
    (centralServerId) =>
      input.playerView.servers.find(
        (candidateServer) => candidateServer.id === centralServerId,
      )?.ice.length ?? Number.MAX_SAFE_INTEGER,
  );
  const structurallyLeastProtectedCentral =
    (serverId === "hq" || serverId === "rd") &&
    (server?.ice.length ?? Number.MAX_SAFE_INTEGER) ===
      Math.min(...centralIceCounts);
  const boundedUnknownCentralCoverage =
    (serverId === "hq" || serverId === "rd") &&
    centralAllocation?.status !== "known" &&
    server?.ice.length === 0 &&
    input.playerView.own.clicks >= 1 &&
    sourceDefense.isVisibleIce &&
    (sourceDefense.hasImmediateStop ||
      sourceDefense.hasMeaningfulTaxOrDamage ||
      sourceDefense.hasEncounterDisruption) &&
    action.source !== "basic_action" &&
    action.source !== "game_rule" &&
    corpIceInstallHasCurrentCompleteRezQuote(
      input,
      action,
      action.source,
      serverId,
    );
  const scoreMaterialCapacityRelease =
    input.playerView.own.gripOrHq.length > input.playerView.own.maxHandSize &&
    !input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "agenda",
    ) &&
    input.playerView.own.clicks >= 2 &&
    (() => {
      const inventory = corpKnownAgendaInventory(input);
      return (
        inventory !== undefined &&
        inventory.remainingStealableAgendaPoints !== 0
      );
    })() &&
    input.legalActions.some(
      (legalAction) =>
        legalAction.side === "corp" &&
        legalAction.type === "draw_card" &&
        legalAction.source === "basic_action" &&
        legalAction.expiresAtStateVersion === input.playerView.stateVersion,
    ) &&
    sourceDefense.isVisibleIce &&
    (sourceDefense.hasImmediateStop ||
      sourceDefense.hasMeaningfulTaxOrDamage ||
      sourceDefense.hasEncounterDisruption) &&
    (facts.archivesHasVisibleKnownAgenda(input)
      ? serverId === "archives"
      : (centralAllocation?.status === "known" &&
          centralAllocation.selectedServerId === serverId) ||
        (centralAllocation?.status !== "known" &&
          structurallyLeastProtectedCentral)) &&
    action.source !== "basic_action" &&
    action.source !== "game_rule" &&
    corpIceInstallHasCurrentCompleteRezQuote(
      input,
      action,
      action.source,
      serverId,
    );
  const agendaCapacityDefenseConversion =
    (serverId === "hq" || serverId === "rd") &&
    input.playerView.own.gripOrHq.length >= input.playerView.own.maxHandSize &&
    input.playerView.own.gripOrHq.some(
      (card) => card.known && card.type === "agenda",
    ) &&
    input.playerView.own.clicks >= 1 &&
    sourceDefense.isVisibleIce &&
    (sourceDefense.hasImmediateStop ||
      sourceDefense.hasMeaningfulTaxOrDamage ||
      sourceDefense.hasEncounterDisruption) &&
    (centralAllocation?.status === "known"
      ? centralAllocation.selectedServerId === serverId &&
        centralDefenseAllocationHasMaterialPressure(centralAllocation, serverId)
      : boundedUnknownCentralCoverage) &&
    action.source !== "basic_action" &&
    action.source !== "game_rule" &&
    corpIceInstallHasCurrentCompleteRezQuote(
      input,
      action,
      action.source,
      serverId,
    );
  if (
    (serverId === "hq" || serverId === "rd") &&
    centralAllocation?.status !== "known" &&
    !scoreMaterialCapacityRelease &&
    !agendaCapacityDefenseConversion &&
    !boundedUnknownCentralCoverage
  ) {
    return {
      knowledge: "unknown",
      evidenceCode:
        "corp_ice_install_assessment_unknown:central_defense_allocation_unknown",
    };
  }
  if (
    serverId.startsWith("remote_") &&
    server?.root.length === 0 &&
    server.ice.length >= 2
  ) {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_global_defense_cannot_overlayer_an_unbound_empty_remote",
    };
  }
  const scoreReserve: CorpScoreReserve = {
    creditBreakdown: [],
    hardClickReserve: 0,
  };
  const serverIce = (server?.ice ?? []).map((ice) => ({
    instanceId: ice.instanceId,
    known: ice.known,
    ...(ice.definitionId ? { definitionId: ice.definitionId } : {}),
    ...(ice.rezzed !== undefined ? { rezzed: ice.rezzed } : {}),
    ...(ice.strength !== undefined ? { strength: ice.strength } : {}),
    ...(ice.subtypes ? { subtypes: ice.subtypes } : {}),
    ...(ice.effectiveRunQuote
      ? { effectiveRunQuote: ice.effectiveRunQuote }
      : {}),
    ...(ice.effectiveRezCostQuote
      ? { effectiveRezCostQuote: ice.effectiveRezCostQuote }
      : {}),
  }));
  const maximumRunnerAccessSuccessProbability = {
    numerator: 1,
    denominator: 2,
  };
  const hasResidentRemoteAgenda = input.playerView.servers.some(
    (candidateServer) =>
      candidateServer.id.startsWith("remote_") &&
      candidateServer.root.some((card) => card.known && card.type === "agenda"),
  );
  const sourceHasNoVisibleBreakerAnswer =
    sourceCard !== undefined &&
    !(input.playerView.opponent.rig ?? []).some((breaker) =>
      visibleBreakerCardCanAddressIce(breaker, sourceCard, {
        visibleBreakerRoles,
        visibleCardText: (card) =>
          [
            card.title,
            card.definitionId,
            ...(card.subtypes ?? []),
            card.rulesText,
          ]
            .filter(Boolean)
            .join(" "),
      }),
    );
  const scorelineCentralTaxAllocation =
    (serverId === "hq" || serverId === "rd") &&
    centralAllocation?.status === "known" &&
    centralAllocation.selectedServerId === serverId &&
    serverIce.length > 0 &&
    hasResidentRemoteAgenda &&
    projectedInstallClicks === input.playerView.own.clicks &&
    candidate.sourceDefinitionId !== undefined &&
    corpHandDuplicateCount(input, candidate.sourceDefinitionId) > 1 &&
    sourceDefense.isVisibleIce &&
    !sourceDefense.hasImmediateStop &&
    (sourceDefense.hasMeaningfulTaxOrDamage ||
      sourceDefense.hasEncounterDisruption) &&
    sourceHasNoVisibleBreakerAnswer &&
    action.source !== "basic_action" &&
    action.source !== "game_rule" &&
    corpIceInstallHasCurrentCompleteRezQuote(
      input,
      action,
      action.source,
      serverId,
    );
  const baseline = assessBestFundedCorpScoreProtection({
    serverIce,
    runnerRig: input.playerView.opponent.rig ?? [],
    runnerSetAside: input.playerView.specialZones?.setAside ?? [],
    ...(input.playerView.opponent.memoryUsed !== undefined
      ? { runnerMemoryUsed: input.playerView.opponent.memoryUsed }
      : {}),
    ...(input.playerView.opponent.memoryLimit !== undefined
      ? { runnerMemoryLimit: input.playerView.opponent.memoryLimit }
      : {}),
    runnerCredits: input.playerView.opponent.credits,
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    availableCorpCredits: input.playerView.own.credits,
    availableCorpClicks: input.playerView.own.clicks,
    scoreReserve,
    maximumRunnerAccessSuccessProbability,
  });
  if (baseline.knowledge === "unknown") {
    return {
      knowledge: "unknown",
      evidenceCode: `corp_ice_install_assessment_unknown:${baseline.unknownReason}`,
    };
  }
  if (
    compareExactProbabilities(
      baseline.protection.runnerAccessSuccessProbability,
      { numerator: 0, denominator: 1 },
    ) === 0 &&
    !scorelineCentralTaxAllocation &&
    !scoreMaterialCapacityRelease &&
    !agendaCapacityDefenseConversion
  ) {
    return {
      knowledge: "known",
      disposition: "effect_missing",
      evidenceCode:
        "corp_ice_install_cannot_reduce_engine_certified_zero_access_probability",
    };
  }
  const need: CorpFundedRemoteAccessRiskNeed = {
    needId: `global-defense-access:${serverId}`,
    parentProjectId: `defend_servers:${serverId}`,
    targetServerId:
      serverId as CorpFundedRemoteAccessRiskNeed["targetServerId"],
    observedAtStateVersion: input.playerView.stateVersion,
    objective: {
      kind: "funded_remote_access_risk",
      maximumRunnerAccessSuccessProbability,
      policySource: "corp_global_defense_visible_access_risk",
    },
    scoreReserve,
    baseline,
  };
  const isEmptyCentral =
    (serverId === "hq" || serverId === "rd") && serverIce.length === 0;
  const targetCentralEvidence =
    centralAllocation?.status === "known" &&
    (serverId === "hq" || serverId === "rd")
      ? centralAllocation.evidence[serverId]
      : undefined;
  const selectedCentralEvidence =
    centralAllocation?.status === "known" &&
    centralAllocation.selectedServerId === serverId
      ? targetCentralEvidence
      : undefined;
  const otherCentralAlreadyProtected =
    serverId === "hq" || serverId === "rd"
      ? (input.playerView.servers.find(
          (candidateServer) =>
            candidateServer.id === (serverId === "hq" ? "rd" : "hq"),
        )?.ice.length ?? 0) > 0
      : false;
  const hasSelectedCentralPressure =
    targetCentralEvidence !== undefined &&
    (targetCentralEvidence.recentRunOrAccessEvents > 0 ||
      targetCentralEvidence.recentSuccessfulAccessRunnerTurns > 0 ||
      targetCentralEvidence.serverBoundEffectIds.length > 0) &&
    (selectedCentralEvidence !== undefined || otherCentralAlreadyProtected);
  const hasStructuredDefenseValue =
    sourceDefense.hasImmediateStop ||
    sourceDefense.hasMeaningfulTaxOrDamage ||
    sourceDefense.hasEncounterDisruption;
  const establishesMissingCentralCoverage =
    isEmptyCentral &&
    otherCentralAlreadyProtected &&
    sourceDefense.isVisibleIce &&
    (isCorpOpeningTurnSerial(input.playerView.turnSerial) ||
      hasStructuredDefenseValue);
  const preferQualitativeSourceProgress =
    scorelineCentralTaxAllocation ||
    scoreMaterialCapacityRelease ||
    agendaCapacityDefenseConversion ||
    boundedUnknownCentralCoverage ||
    (isEmptyCentral &&
      !hasResidentRemoteAgenda &&
      (establishesMissingCentralCoverage ||
        (hasSelectedCentralPressure && hasStructuredDefenseValue)));
  const projection = projectCorpFundedIceInstallRoute({
    need,
    action,
    currentStateVersion: input.playerView.stateVersion,
    currentCorpCredits: input.playerView.own.credits,
    currentCorpClicks: input.playerView.own.clicks,
    visibleCorpHand: input.playerView.own.gripOrHq,
    ...(server ? { currentServer: { id: server.id, ice: serverIce } } : {}),
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
    ...(preferQualitativeSourceProgress
      ? { preferPostInstallSourceProgress: true }
      : {}),
  });
  if (projection.knowledge !== "known") {
    return {
      knowledge: "unknown",
      evidenceCode: `corp_ice_install_assessment_unknown:${projection.unknownReason}`,
    };
  }
  if (
    projection.preservesReserves &&
    (projection.effect === "progress" || projection.effect === "satisfied")
  ) {
    return {
      knowledge: "known",
      disposition: "productive",
      progressKind: "engine_certified_access",
      rezFundingGap: 0,
      projection,
    };
  }
  const minimumSatisfyingRezCredits = projection.after.minimumSatisfyingRezCost;
  const postInstallRezCredits =
    typeof minimumSatisfyingRezCredits === "number" &&
    Number.isSafeInteger(minimumSatisfyingRezCredits) &&
    minimumSatisfyingRezCredits >= 0
      ? minimumSatisfyingRezCredits
      : undefined;
  const creditsAfterInstall =
    input.playerView.own.credits - projectedInstallCredits;
  const rezFundingGap =
    postInstallRezCredits === undefined
      ? undefined
      : Math.max(0, postInstallRezCredits - creditsAfterInstall);
  const selectedCentralThreat = targetCentralEvidence?.threat ?? "none";
  const qualitativeProgressHasNoKnownFundingGap =
    (projection.after.minimumAdditionalCreditsToSatisfy ?? 0) === 0 &&
    (projection.after.minimumAdditionalClicksToSatisfy ?? 0) === 0;
  const fundedStructuredCentralProgress =
    preferQualitativeSourceProgress &&
    projection.preservesReserves &&
    qualitativeProgressHasNoKnownFundingGap;
  const stagedCentralProgress =
    preferQualitativeSourceProgress &&
    projection.preservesReserves &&
    (selectedCentralThreat === "acute" ||
      selectedCentralThreat === "terminal") &&
    projectedInstallClicks === input.playerView.own.clicks &&
    typeof rezFundingGap === "number" &&
    rezFundingGap > 0 &&
    rezFundingGap <= 3;
  const sourceRezCredits =
    action.payload?.postInstallRezQuoteComplete === true &&
    typeof action.payload.postInstallRezQuoteFinalCredits === "number"
      ? action.payload.postInstallRezQuoteFinalCredits
      : undefined;
  const scorelineCentralTaxProgress =
    scorelineCentralTaxAllocation &&
    projection.preservesReserves &&
    sourceRezCredits !== undefined &&
    Math.max(0, sourceRezCredits - creditsAfterInstall) <= 3;
  const scoreMaterialCapacityProgress =
    scoreMaterialCapacityRelease &&
    projection.preservesReserves &&
    sourceRezCredits !== undefined &&
    Math.max(0, sourceRezCredits - creditsAfterInstall) <= 3;
  const agendaCapacityDefenseProgress =
    agendaCapacityDefenseConversion &&
    projection.preservesReserves &&
    sourceRezCredits !== undefined;
  if (
    fundedStructuredCentralProgress ||
    scorelineCentralTaxProgress ||
    scoreMaterialCapacityProgress ||
    agendaCapacityDefenseProgress ||
    stagedCentralProgress
  ) {
    return {
      knowledge: "known",
      disposition: "productive",
      progressKind: scorelineCentralTaxProgress
        ? "scoreline_central_tax_allocation"
        : scoreMaterialCapacityProgress
          ? "score_material_capacity_release"
          : agendaCapacityDefenseProgress
            ? "agenda_capacity_defense_conversion"
            : fundedStructuredCentralProgress
              ? "funded_structured_central_defense"
              : "staged_central_defense",
      rezFundingGap: rezFundingGap!,
      projection,
    };
  }
  return knownInstallRouteHasUsefulEffectBlockedByFunding(projection)
    ? {
        knowledge: "known",
        disposition: "funding_only",
        progressKind: "funding_required",
        rezFundingGap: projection.after.minimumAdditionalCreditsToSatisfy ?? 0,
        projection,
      }
    : {
        knowledge: "known",
        disposition: "effect_missing",
        evidenceCode:
          "corp_ice_install_has_no_engine_certified_access_probability_reduction",
      };
}

function centralDefenseAllocationHasMaterialPressure(
  allocation: Extract<
    NonNullable<CorpCorePlanDomain["centralDefenseAllocation"]>,
    { status: "known" }
  >,
  serverId: "hq" | "rd",
): boolean {
  const evidence = allocation.evidence[serverId];
  return (
    evidence.threat !== "none" ||
    evidence.expectedAgendaLoss.numerator > 0 ||
    evidence.expectedTrashableLoss.numerator > 0 ||
    evidence.isMultiaccess ||
    evidence.recentRunOrAccessEvents > 0 ||
    evidence.recentSuccessfulAccessRunnerTurns > 0 ||
    evidence.serverBoundEffectIds.length > 0
  );
}
