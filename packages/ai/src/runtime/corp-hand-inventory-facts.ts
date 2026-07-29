import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export const CORP_HAND_INVENTORY_FACTS_SCHEMA_VERSION =
  "corp-hand-inventory-facts-v3" as const;

export type CorpHandPlanningDisposition =
  | "current_plan_route"
  | "support_for_need"
  | "blocked_but_developable"
  | "campaign_hold"
  | "redundant"
  | "currently_dead"
  | "discard_candidate"
  | "assessment_unknown";

export type CorpHandRouteDisposition =
  | "blocked_funding"
  | "strategic_hold"
  | "redundant"
  | "unsafe_current_route"
  | "unsupported_domain_contract";

export type CorpHandDomainClaimReadiness =
  | "executable_now"
  | "executable_with_support"
  | "blocked";

export type CorpHandDomainRouteClaimInput = {
  ownerModuleId: string;
  planInstanceId: string;
  parentNeedId?: string;
  readiness: CorpHandDomainClaimReadiness;
  actionIds: string[];
  sourceInstanceIds: string[];
  evidenceCode: string;
};

export type CorpHandActionDispositionInput = {
  actionId: string;
  disposition: "explicitly_nonproductive" | "assessment_unknown";
  ownerModuleId: string;
  evidenceCode: string;
};

export type CorpHandRouteCoverageRecord = {
  sourceInstanceId: string;
  sourceDefinitionId: string;
  duplicateCount: number;
  legalActionIds: string[];
  exactCurrentProjections: string[];
  actionHandDeltas: Array<{
    actionId: string;
    netHandDelta: number;
    cardsDrawn: number;
    cardsConsumed: number;
  }>;
  domainClaims: Array<{
    ownerModuleId: string;
    planInstanceId: string;
    parentNeedId?: string;
    readiness: CorpHandDomainClaimReadiness;
    evidenceCode: string;
  }>;
  dispositions: CorpHandRouteDisposition[];
  dispositionEvidence: string[];
  planningDisposition: CorpHandPlanningDisposition;
  relatedPlanInstanceIds: string[];
  relatedNeedIds: string[];
  retentionHorizon: "current_turn" | "next_own_turn" | "campaign";
  blockerIds: string[];
  redundancyGroupId?: string;
  retentionEvidenceCodes: string[];
};

export type CorpHandPressureAssessment = {
  handSize: number;
  maximumHandSize: number;
  availableSlots: number;
  overflowCount: number;
  status: "under_capacity" | "at_capacity" | "overflow";
  knownCardCount: number;
  agendaCount: number;
  actionableCardCount: number;
  exactCapacityReleaseActions: number;
};

export type CorpHandInventoryFacts = {
  schemaVersion: typeof CORP_HAND_INVENTORY_FACTS_SCHEMA_VERSION;
  side: "corp";
  stateVersion: number;
  authority: "plan_input";
  selectionInfluence: "draw_admission_and_cleanup_projection";
  pressure: CorpHandPressureAssessment;
  cleanupProjection: {
    handSizeIfTurnEndedNow: number;
    requiredDiscardsIfTurnEndedNow: number;
    availableSlotsBeforeCleanup: number;
    singleCardDrawWouldIncreaseDiscard: boolean;
    dispositionCoverageComplete: boolean;
    assessmentUnknownInstanceIds: string[];
    discardCandidateInstanceIds: string[];
  };
  records: CorpHandRouteCoverageRecord[];
};

export function buildCorpHandInventoryFacts(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  domainClaims: readonly CorpHandDomainRouteClaimInput[];
  actionDispositions: readonly CorpHandActionDispositionInput[];
}): CorpHandInventoryFacts | undefined {
  if (params.input.side !== "corp") return undefined;
  const ownHqCards = params.input.playerView.own.gripOrHq;
  const records = ownHqCards.map((card) => {
    const sourceCandidates = params.candidates.filter(
      (candidate) => candidate.sourceCardInstanceId === card.instanceId,
    );
    const legalActionIds = sortedUnique(
      sourceCandidates.map((candidate) => candidate.actionId),
    );
    const matchingClaims = params.domainClaims
      .filter(
        (claim) =>
          claim.sourceInstanceIds.includes(card.instanceId) ||
          claim.actionIds.some((actionId) => legalActionIds.includes(actionId)),
      )
      .map((claim) => ({
        ownerModuleId: claim.ownerModuleId,
        planInstanceId: claim.planInstanceId,
        ...(claim.parentNeedId ? { parentNeedId: claim.parentNeedId } : {}),
        readiness: claim.readiness,
        evidenceCode: claim.evidenceCode,
      }))
      .sort(compareDomainClaims);
    const actionDispositions = params.actionDispositions.filter((disposition) =>
      legalActionIds.includes(disposition.actionId),
    );
    const duplicateCount = corpHandDuplicateCount(
      params.input,
      card.definitionId ?? "unknown-own-card",
    );
    const actionHandDeltas = sourceCandidates.flatMap((candidate) => {
      const projection = candidate.economyProjection;
      return projection &&
        Number.isSafeInteger(projection.netHandDelta) &&
        Number.isSafeInteger(projection.cardsDrawn) &&
        Number.isSafeInteger(projection.cardsConsumed)
        ? [
            {
              actionId: candidate.actionId,
              netHandDelta: projection.netHandDelta,
              cardsDrawn: projection.cardsDrawn,
              cardsConsumed: projection.cardsConsumed,
            },
          ]
        : [];
    });
    const dispositionResult = handRouteDispositions({
      legalActionIds,
      duplicateCount,
      claims: matchingClaims,
      actionDispositions,
    });
    const planningResult = handPlanningDisposition({
      definitionKnown: Boolean(card.known && card.definitionId),
      legalActionIds,
      duplicateCount,
      claims: matchingClaims,
      routeDispositions: dispositionResult.dispositions,
    });
    return {
      sourceInstanceId: card.instanceId,
      sourceDefinitionId: card.definitionId ?? "unknown-own-card",
      duplicateCount,
      legalActionIds,
      exactCurrentProjections: sortedUnique(
        sourceCandidates.flatMap(exactCurrentProjectionEvidence),
      ),
      actionHandDeltas: actionHandDeltas.sort((left, right) =>
        left.actionId.localeCompare(right.actionId),
      ),
      domainClaims: matchingClaims,
      dispositions: dispositionResult.dispositions,
      dispositionEvidence: dispositionResult.evidence,
      planningDisposition: planningResult.disposition,
      relatedPlanInstanceIds: sortedUnique(
        matchingClaims.map((claim) => claim.planInstanceId),
      ),
      relatedNeedIds: sortedUnique(
        matchingClaims.flatMap((claim) =>
          claim.parentNeedId ? [claim.parentNeedId] : [],
        ),
      ),
      retentionHorizon: planningResult.retentionHorizon,
      blockerIds: planningResult.blockerIds,
      ...(duplicateCount > 1
        ? { redundancyGroupId: `definition:${card.definitionId ?? "unknown"}` }
        : {}),
      retentionEvidenceCodes: sortedUnique([
        ...dispositionResult.evidence,
        ...planningResult.evidenceCodes,
        ...matchingClaims.map((claim) => claim.evidenceCode),
      ]),
    };
  });
  const pressure = corpHandPressureAssessment(params.input, records);
  return {
    schemaVersion: CORP_HAND_INVENTORY_FACTS_SCHEMA_VERSION,
    side: "corp",
    stateVersion: params.input.playerView.stateVersion,
    authority: "plan_input",
    selectionInfluence: "draw_admission_and_cleanup_projection",
    pressure,
    cleanupProjection: {
      handSizeIfTurnEndedNow: pressure.handSize,
      requiredDiscardsIfTurnEndedNow: pressure.overflowCount,
      availableSlotsBeforeCleanup: pressure.availableSlots,
      singleCardDrawWouldIncreaseDiscard:
        pressure.handSize >= pressure.maximumHandSize,
      dispositionCoverageComplete: records.length === pressure.handSize,
      assessmentUnknownInstanceIds: records
        .filter((record) => record.planningDisposition === "assessment_unknown")
        .map((record) => record.sourceInstanceId)
        .sort(),
      discardCandidateInstanceIds: records
        .filter((record) =>
          ["redundant", "currently_dead", "discard_candidate"].includes(
            record.planningDisposition,
          ),
        )
        .map((record) => record.sourceInstanceId)
        .sort(),
    },
    records: records.sort((left, right) =>
      left.sourceInstanceId.localeCompare(right.sourceInstanceId),
    ),
  };
}

function handPlanningDisposition(params: {
  definitionKnown: boolean;
  legalActionIds: readonly string[];
  duplicateCount: number;
  claims: Readonly<CorpHandRouteCoverageRecord["domainClaims"]>;
  routeDispositions: readonly CorpHandRouteDisposition[];
}): {
  disposition: CorpHandPlanningDisposition;
  retentionHorizon: CorpHandRouteCoverageRecord["retentionHorizon"];
  blockerIds: string[];
  evidenceCodes: string[];
} {
  const executableClaims = params.claims.filter(
    (claim) => claim.readiness === "executable_now",
  );
  const supportClaims = params.claims.filter(
    (claim) => claim.parentNeedId !== undefined,
  );
  const developableClaims = params.claims.filter(
    (claim) => claim.readiness !== "executable_now",
  );
  if (
    !params.definitionKnown ||
    params.routeDispositions.includes("unsafe_current_route") ||
    params.routeDispositions.includes("unsupported_domain_contract")
  ) {
    return {
      disposition: "assessment_unknown",
      retentionHorizon: "campaign",
      blockerIds: ["hand_assessment_incomplete"],
      evidenceCodes: ["corp_hand_planning:assessment_unknown"],
    };
  }
  if (supportClaims.length > 0) {
    return {
      disposition: "support_for_need",
      retentionHorizon: "current_turn",
      blockerIds: [],
      evidenceCodes: ["corp_hand_planning:support_for_exact_need"],
    };
  }
  if (executableClaims.length > 0) {
    return {
      disposition: "current_plan_route",
      retentionHorizon: "current_turn",
      blockerIds: [],
      evidenceCodes: ["corp_hand_planning:current_plan_route"],
    };
  }
  if (developableClaims.length > 0) {
    return {
      disposition: "blocked_but_developable",
      retentionHorizon: "next_own_turn",
      blockerIds: ["current_plan_route_blocked"],
      evidenceCodes: ["corp_hand_planning:blocked_but_developable"],
    };
  }
  if (params.duplicateCount > 1 && params.legalActionIds.length === 0) {
    return {
      disposition: "redundant",
      retentionHorizon: "current_turn",
      blockerIds: [],
      evidenceCodes: ["corp_hand_planning:unclaimed_duplicate"],
    };
  }
  return {
    disposition: "campaign_hold",
    retentionHorizon: "campaign",
    blockerIds: [],
    evidenceCodes: ["corp_hand_planning:conservative_hold"],
  };
}

export function corpHandDuplicateCount(
  input: AiDecisionInput,
  definitionId: string,
): number {
  if (input.side !== "corp") return 0;
  return input.playerView.own.gripOrHq.filter(
    (card) => card.known && card.definitionId === definitionId,
  ).length;
}

export function corpHandPressureAssessment(
  input: AiDecisionInput,
  records: readonly Pick<
    CorpHandRouteCoverageRecord,
    "legalActionIds" | "actionHandDeltas"
  >[] = [],
): CorpHandPressureAssessment {
  const handSize = input.playerView.own.gripOrHq.length;
  const maximumHandSize = input.playerView.own.maxHandSize;
  const availableSlots = Math.max(0, maximumHandSize - handSize);
  const overflowCount = Math.max(0, handSize - maximumHandSize);
  return {
    handSize,
    maximumHandSize,
    availableSlots,
    overflowCount,
    status:
      overflowCount > 0
        ? "overflow"
        : availableSlots === 0
          ? "at_capacity"
          : "under_capacity",
    knownCardCount: input.playerView.own.gripOrHq.filter(
      (card) => card.known && card.definitionId,
    ).length,
    agendaCount: input.playerView.own.gripOrHq.filter(
      (card) => card.known && card.type === "agenda",
    ).length,
    actionableCardCount: records.filter(
      (record) => record.legalActionIds.length > 0,
    ).length,
    exactCapacityReleaseActions: records.reduce(
      (count, record) =>
        count +
        record.actionHandDeltas.filter((entry) => entry.netHandDelta < 0)
          .length,
      0,
    ),
  };
}

function exactCurrentProjectionEvidence(
  candidate: ActionSemanticCandidate,
): string[] {
  const evidence: string[] = [];
  if (
    candidate.costProfile.costKnownStatus === "known" &&
    candidate.costProfile.additionalCosts.length === 0
  ) {
    evidence.push(
      `cost:${candidate.actionId}:clicks=${candidate.costProfile.clickCost ?? 0}:credits=${candidate.costProfile.creditCost ?? 0}`,
    );
  }
  const economy = candidate.economyProjection;
  if (
    economy?.source === "legal_action_payload" &&
    economy.confidence === "high" &&
    economy.reliability === "guaranteed"
  ) {
    evidence.push(
      `economy:${candidate.actionId}:${economy.kind}:net_credits=${economy.netLiquidCreditGain ?? 0}:net_hand=${economy.netHandDelta}`,
    );
  }
  const capacity = candidate.actionCapacityProjection;
  if (
    capacity?.source === "legal_action_payload" &&
    capacity.confidence === "high" &&
    capacity.reliability === "guaranteed"
  ) {
    evidence.push(
      `capacity:${candidate.actionId}:${capacity.kind}:net_actions=${capacity.netCurrentTurnActionDelta}`,
    );
  }
  if (
    candidate.targetContext?.availableTargetsStatus === "engine_provided" &&
    candidate.targetContext.hiddenInfoPolicy === "side_safe"
  ) {
    evidence.push(
      `targets:${candidate.actionId}:${candidate.targetContext.selectedTargets
        .map((target) => target.targetId)
        .sort()
        .join(",")}`,
    );
  }
  return evidence;
}

function handRouteDispositions(params: {
  legalActionIds: readonly string[];
  duplicateCount: number;
  claims: Readonly<CorpHandRouteCoverageRecord["domainClaims"]>;
  actionDispositions: readonly CorpHandActionDispositionInput[];
}): { dispositions: CorpHandRouteDisposition[]; evidence: string[] } {
  const dispositions = new Set<CorpHandRouteDisposition>();
  const evidence: string[] = [];
  const executableClaim = params.claims.some(
    (claim) => claim.readiness === "executable_now",
  );
  const supportClaim = params.claims.some(
    (claim) => claim.readiness === "executable_with_support",
  );
  const unsafeClaim = params.claims.some(
    (claim) =>
      claim.readiness === "blocked" &&
      /(unknown|unsafe|incomplete|malformed|missing)/i.test(claim.evidenceCode),
  );
  const unsafeDisposition = params.actionDispositions.some(
    (disposition) =>
      disposition.disposition === "assessment_unknown" ||
      /(unknown|unsafe|incomplete|malformed|missing)/i.test(
        disposition.evidenceCode,
      ),
  );
  if (supportClaim) {
    dispositions.add("blocked_funding");
    evidence.push("corp_hand_route:funding_support_required");
  }
  if (unsafeClaim || unsafeDisposition) {
    dispositions.add("unsafe_current_route");
    evidence.push("corp_hand_route:current_assessment_not_safe");
  }
  if (
    params.duplicateCount > 1 &&
    !executableClaim &&
    params.legalActionIds.length === 0
  ) {
    dispositions.add("redundant");
    evidence.push("corp_hand_route:unclaimed_duplicate");
  }
  if (params.legalActionIds.length > 0 && params.claims.length === 0) {
    dispositions.add("unsupported_domain_contract");
    evidence.push("corp_hand_route:legal_action_without_domain_claim");
  }
  if (
    params.legalActionIds.length === 0 &&
    params.claims.length === 0 &&
    dispositions.size === 0
  ) {
    dispositions.add("strategic_hold");
    evidence.push("corp_hand_route:no_current_legal_action_or_domain_claim");
  }
  if (
    params.claims.length > 0 &&
    !executableClaim &&
    !supportClaim &&
    dispositions.size === 0
  ) {
    dispositions.add("strategic_hold");
    evidence.push("corp_hand_route:blocked_domain_claim_held");
  }
  return {
    dispositions: [...dispositions].sort(),
    evidence: sortedUnique(evidence),
  };
}

function compareDomainClaims(
  left: CorpHandRouteCoverageRecord["domainClaims"][number],
  right: CorpHandRouteCoverageRecord["domainClaims"][number],
): number {
  return (
    left.ownerModuleId.localeCompare(right.ownerModuleId) ||
    left.planInstanceId.localeCompare(right.planInstanceId) ||
    left.evidenceCode.localeCompare(right.evidenceCode)
  );
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}
