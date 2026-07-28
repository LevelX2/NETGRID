import type { AiDecisionInput } from "@netgrid/shared";

import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";

export const CORP_HAND_INVENTORY_FACTS_SCHEMA_VERSION =
  "corp-hand-inventory-facts-v1" as const;

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
  authority: "diagnostic_only";
  selectionInfluence: "none";
  pressure: CorpHandPressureAssessment;
  records: CorpHandRouteCoverageRecord[];
};

export function buildCorpHandInventoryFacts(params: {
  input: AiDecisionInput;
  candidates: readonly ActionSemanticCandidate[];
  domainClaims: readonly CorpHandDomainRouteClaimInput[];
  actionDispositions: readonly CorpHandActionDispositionInput[];
}): CorpHandInventoryFacts | undefined {
  if (params.input.side !== "corp") return undefined;
  const knownHqCards = params.input.playerView.own.gripOrHq.filter(
    (card) => card.known && card.definitionId,
  );
  const records = knownHqCards.map((card) => {
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
      card.definitionId!,
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
    return {
      sourceInstanceId: card.instanceId,
      sourceDefinitionId: card.definitionId!,
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
    };
  });
  return {
    schemaVersion: CORP_HAND_INVENTORY_FACTS_SCHEMA_VERSION,
    side: "corp",
    stateVersion: params.input.playerView.stateVersion,
    authority: "diagnostic_only",
    selectionInfluence: "none",
    pressure: corpHandPressureAssessment(params.input, records),
    records: records.sort((left, right) =>
      left.sourceInstanceId.localeCompare(right.sourceInstanceId),
    ),
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
