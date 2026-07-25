import {
  CARD_DEFINITIONS_BY_ID,
  type LegalAction,
  type ServerId,
  type VisibleCard,
  type VisibleCorpRezCostQuote,
} from "@netgrid/shared";
import { corpIcePlacementActionCostAgreementFact } from "./corp-ice-placement/corp-ice-placement";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
  type CorpScoreProtectionIceInput,
  type ExactProbability,
  type KnownCorpScoreProtectionAssessment,
} from "./corp-score-protection-assessment";

export type CorpScoreReserveCredit = Readonly<{
  reserveId: string;
  credits: number;
}>;

export type CorpScoreReserve = Readonly<{
  creditBreakdown: readonly CorpScoreReserveCredit[];
  hardClickReserve: number;
}>;

export type CorpFundedScoreProtectionIceInput = CorpScoreProtectionIceInput &
  Readonly<{
    effectiveRezCostQuote?: VisibleCorpRezCostQuote;
  }>;

export type CorpSelectedRezCost = Readonly<{
  iceInstanceId: string;
  iceDefinitionId: string;
  credits: number;
  source: "engine_rez_cost_quote";
}>;

type CorpFundedScoreProtectionAssessmentBase = Readonly<{
  availableCorpCredits: number;
  availableCorpClicks: number;
  totalScoreReserveCredits: number;
  hardClickReserve: number;
  fundedProtection: boolean;
  evidence: readonly string[];
}>;

export type KnownCorpFundedScoreProtectionAssessment =
  CorpFundedScoreProtectionAssessmentBase &
    Readonly<{
      knowledge: "known";
      scoreReserveFingerprint: string;
      protection: KnownCorpScoreProtectionAssessment;
      selectedRezCosts: readonly CorpSelectedRezCost[];
      totalSelectedRezCost: number;
      creditsAfterDefense: number;
      clicksAfterDefense: number;
      preservesScoreCreditReserve: boolean;
      preservesHardClickReserve: boolean;
      minimumSatisfyingRezCost?: number;
      minimumAdditionalCreditsToSatisfy?: number;
      minimumAdditionalClicksToSatisfy?: number;
    }>;

export type UnknownCorpFundedScoreProtectionAssessment =
  CorpFundedScoreProtectionAssessmentBase &
    Readonly<{
      knowledge: "unknown";
      fundedProtection: false;
      unknownReason:
        | "invalid_resource_amount"
        | "invalid_score_reserve"
        | "duplicate_score_reserve_component"
        | "duplicate_ice_instance"
        | "missing_rez_cost_quote"
        | "incomplete_rez_cost_quote"
        | "rez_cost_quote_drift"
        | "unsupported_mandatory_rez_cost"
        | "search_space_exceeded"
        | "subset_assessment_unknown";
    }>;

export type CorpFundedScoreProtectionAssessment =
  | KnownCorpFundedScoreProtectionAssessment
  | UnknownCorpFundedScoreProtectionAssessment;

export type CorpBestFundedScoreProtectionInput = Readonly<{
  serverIce: readonly CorpFundedScoreProtectionIceInput[];
  postInstallQuoteCardId?: string;
  runnerRig: readonly VisibleCard[];
  runnerCredits: number;
  targetServerId: VisibleCorpRezCostQuote["targetServerId"];
  observedAtStateVersion: number;
  availableCorpCredits: number;
  availableCorpClicks: number;
  scoreReserve: CorpScoreReserve;
  maximumRunnerAccessSuccessProbability: ExactProbability;
}>;

export type CorpFundedRemoteAccessRiskNeed = Readonly<{
  needId: string;
  parentProjectId: string;
  targetServerId: VisibleCorpRezCostQuote["targetServerId"];
  observedAtStateVersion: number;
  objective: Readonly<{
    kind: "funded_remote_access_risk";
    maximumRunnerAccessSuccessProbability: ExactProbability;
    policySource: string;
  }>;
  scoreReserve: CorpScoreReserve;
  baseline: CorpFundedScoreProtectionAssessment;
}>;

export function corpFundedScoreProtectionCertifiesBinding(params: {
  need: CorpFundedRemoteAccessRiskNeed | undefined;
  expectedParentProjectId: string;
  expectedTargetServerId: string | undefined;
  observedAtStateVersion: number;
}): boolean {
  const {
    need,
    expectedParentProjectId,
    expectedTargetServerId,
    observedAtStateVersion,
  } = params;
  return (
    need !== undefined &&
    expectedTargetServerId !== undefined &&
    need.parentProjectId === expectedParentProjectId &&
    need.targetServerId === expectedTargetServerId &&
    need.observedAtStateVersion === observedAtStateVersion &&
    need.baseline.knowledge === "known" &&
    need.baseline.fundedProtection &&
    need.baseline.protection.protectsScore
  );
}

type CorpFundedIceInstallRouteBase = Readonly<{
  actionId: string;
  sourceCardInstanceId?: string;
  sourceDefinitionId?: string;
  targetServerId?: string;
  before: CorpFundedScoreProtectionAssessment;
  effect: "unknown" | "no_progress" | "progress" | "satisfied";
  evidence: readonly string[];
}>;

export type KnownCorpFundedIceInstallRouteProjection =
  CorpFundedIceInstallRouteBase &
    Readonly<{
      knowledge: "known";
      effect: "no_progress" | "progress" | "satisfied";
      sourceCardInstanceId: string;
      sourceDefinitionId: string;
      targetServerId: string;
      after: KnownCorpFundedScoreProtectionAssessment;
      installCredits: number;
      installClicks: number;
      installCostSource: "legal_action_agreed_projection";
      selectedRezCosts: readonly CorpSelectedRezCost[];
      creditsAfterDefense: number;
      clicksAfterDefense: number;
      preservesScoreCreditReserve: boolean;
      preservesHardClickReserve: boolean;
      preservesReserves: boolean;
      funded: boolean;
    }>;

export type UnknownCorpFundedIceInstallRouteProjection =
  CorpFundedIceInstallRouteBase &
    Readonly<{
      knowledge: "unknown";
      effect: "unknown";
      unknownReason:
        | "baseline_unknown"
        | "baseline_drift"
        | "reserve_drift"
        | "objective_drift"
        | "state_version_drift"
        | "invalid_install_action"
        | "source_binding_drift"
        | "unknown_source_definition"
        | "post_install_rez_quote_unknown"
        | "post_install_rez_quote_drift"
        | "unsupported_mandatory_rez_cost"
        | "target_server_drift"
        | "install_cost_unknown"
        | "install_cost_drift"
        | "install_payload_cost_drift"
        | "insufficient_action_resources"
        | "after_assessment_unknown";
    }>;

export type CorpFundedIceInstallRouteProjection =
  | KnownCorpFundedIceInstallRouteProjection
  | UnknownCorpFundedIceInstallRouteProjection;

export type CorpFundedIceInstallRouteInput = Readonly<{
  need: CorpFundedRemoteAccessRiskNeed;
  action: LegalAction;
  currentStateVersion: number;
  currentCorpCredits: number;
  currentCorpClicks: number;
  visibleCorpHand: readonly VisibleCard[];
  currentServer?: Readonly<{
    id: string;
    ice: readonly CorpFundedScoreProtectionIceInput[];
  }>;
  runnerRig: readonly VisibleCard[];
  runnerCredits: number;
  projectedInstallCredits: number;
  projectedInstallClicks: number;
}>;

type RezCandidate = Readonly<{
  ice: CorpFundedScoreProtectionIceInput;
  selectedCost: CorpSelectedRezCost;
}>;

type EnumeratedAssessment = Readonly<{
  protection: KnownCorpScoreProtectionAssessment;
  selectedRezCosts: readonly CorpSelectedRezCost[];
  totalRezCost: number;
}>;

const MAX_EXACT_REZ_CANDIDATES = 12;

type CompleteRezQuoteRead =
  | Readonly<{
      status: "known";
      definitionId: string;
      finalCredits: number;
    }>
  | Readonly<{
      status: "unknown";
      reason:
        | "missing_rez_cost_quote"
        | "incomplete_rez_cost_quote"
        | "rez_cost_quote_drift"
        | "unsupported_mandatory_rez_cost";
    }>;

type PostInstallRezQuoteRead =
  | Readonly<{
      status: "known";
      quote: Extract<
        VisibleCorpRezCostQuote,
        { context: "post_install"; complete: true }
      >;
    }>
  | Readonly<{
      status: "unknown";
      reason:
        | "post_install_rez_quote_unknown"
        | "post_install_rez_quote_drift"
        | "unsupported_mandatory_rez_cost";
    }>;

export function assessBestFundedCorpScoreProtection(
  input: CorpBestFundedScoreProtectionInput,
): CorpFundedScoreProtectionAssessment {
  const resourcesValid =
    nonNegativeSafeInteger(input.availableCorpCredits) &&
    nonNegativeSafeInteger(input.availableCorpClicks) &&
    nonNegativeSafeInteger(input.runnerCredits) &&
    nonNegativeSafeInteger(input.observedAtStateVersion) &&
    typeof input.targetServerId === "string" &&
    input.targetServerId.length > 0;
  if (!resourcesValid) {
    return unknownFundedAssessment(input, "invalid_resource_amount", 0, [
      "fundedScoreProtectionKnown:false",
      "invalidResourceAmount:true",
    ]);
  }
  const reserve = normalizeScoreReserve(input.scoreReserve);
  if (reserve.status === "unknown") {
    return unknownFundedAssessment(input, reserve.reason, 0, [
      "fundedScoreProtectionKnown:false",
      `scoreReserveInvalid:${reserve.reason}`,
    ]);
  }
  const instanceIds = input.serverIce.map((ice) => ice.instanceId);
  if (new Set(instanceIds).size !== instanceIds.length) {
    return unknownFundedAssessment(
      input,
      "duplicate_ice_instance",
      reserve.totalCredits,
      ["fundedScoreProtectionKnown:false", "duplicateIceInstance:true"],
    );
  }
  const postInstallQuoteCardIds = input.serverIce.flatMap((ice) =>
    ice.effectiveRezCostQuote?.context === "post_install"
      ? [ice.instanceId]
      : [],
  );
  if (
    (input.postInstallQuoteCardId === undefined &&
      postInstallQuoteCardIds.length > 0) ||
    (input.postInstallQuoteCardId !== undefined &&
      (postInstallQuoteCardIds.length !== 1 ||
        postInstallQuoteCardIds[0] !== input.postInstallQuoteCardId))
  ) {
    return unknownFundedAssessment(
      input,
      "rez_cost_quote_drift",
      reserve.totalCredits,
      [
        "fundedScoreProtectionKnown:false",
        "postInstallRezQuoteScopeDrift:true",
      ],
    );
  }

  const candidates: RezCandidate[] = [];
  for (const ice of input.serverIce) {
    if (ice.rezzed === true) continue;
    const quote = readCompleteFundedRezQuote(ice, input);
    if (quote.status === "unknown") {
      return unknownFundedAssessment(
        input,
        quote.reason,
        reserve.totalCredits,
        [
          "fundedScoreProtectionKnown:false",
          `rezCostQuoteKnown:false`,
          `rezCostQuoteReason:${quote.reason}`,
          `iceInstanceId:${ice.instanceId}`,
        ],
      );
    }
    candidates.push({
      ice,
      selectedCost: {
        iceInstanceId: ice.instanceId,
        iceDefinitionId: quote.definitionId,
        credits: quote.finalCredits,
        source: "engine_rez_cost_quote",
      },
    });
  }
  if (candidates.length > MAX_EXACT_REZ_CANDIDATES) {
    return unknownFundedAssessment(
      input,
      "search_space_exceeded",
      reserve.totalCredits,
      [
        "fundedScoreProtectionKnown:false",
        `rezCandidateCount:${candidates.length}`,
        `maximumExactRezCandidateCount:${MAX_EXACT_REZ_CANDIDATES}`,
      ],
    );
  }

  const selections = enumerateRezSelections(candidates);
  const availableRezCredits = Math.max(
    0,
    input.availableCorpCredits - reserve.totalCredits,
  );
  let bestSatisfying: EnumeratedAssessment | undefined;
  let bestProgress: EnumeratedAssessment | undefined;
  let minimumSatisfyingRezCost: number | undefined;
  for (const selection of selections) {
    const selectedIds = new Set(
      selection.map((candidate) => candidate.ice.instanceId),
    );
    const selectedRezCosts = selection.map(
      (candidate) => candidate.selectedCost,
    );
    const totalRezCost = selectedRezCosts.reduce(
      (sum, cost) => sum + cost.credits,
      0,
    );
    if (!Number.isSafeInteger(totalRezCost)) {
      return unknownFundedAssessment(
        input,
        "rez_cost_quote_drift",
        reserve.totalCredits,
        ["fundedScoreProtectionKnown:false", "rezCostOverflow:true"],
      );
    }
    const protection = assessCorpScoreProtection({
      serverIce: input.serverIce.map((ice) => ({
        ...ice,
        rezzed: ice.rezzed === true || selectedIds.has(ice.instanceId),
      })),
      runnerRig: input.runnerRig,
      runnerCredits: input.runnerCredits,
      maximumRunnerAccessSuccessProbability:
        input.maximumRunnerAccessSuccessProbability,
    });
    if (protection.knowledge === "unknown") {
      return unknownFundedAssessment(
        input,
        "subset_assessment_unknown",
        reserve.totalCredits,
        [
          "fundedScoreProtectionKnown:false",
          "subsetAssessmentUnknown:true",
          `protectionUnknownReason:${protection.unknownReason}`,
        ],
      );
    }
    const assessment: EnumeratedAssessment = {
      protection,
      selectedRezCosts,
      totalRezCost,
    };
    if (
      protection.protectsScore &&
      (minimumSatisfyingRezCost === undefined ||
        totalRezCost < minimumSatisfyingRezCost)
    ) {
      minimumSatisfyingRezCost = totalRezCost;
    }
    if (totalRezCost <= availableRezCredits) {
      if (protection.protectsScore) {
        if (
          !bestSatisfying ||
          satisfyingAssessmentIsBetter(assessment, bestSatisfying)
        ) {
          bestSatisfying = assessment;
        }
      } else if (
        !bestProgress ||
        progressAssessmentIsBetter(assessment, bestProgress)
      ) {
        bestProgress = assessment;
      }
    }
  }
  const best = bestSatisfying ?? bestProgress;
  if (!best) {
    return unknownFundedAssessment(
      input,
      "subset_assessment_unknown",
      reserve.totalCredits,
      ["fundedScoreProtectionKnown:false", "noEnumeratedAssessment:true"],
    );
  }

  const creditsAfterDefense = input.availableCorpCredits - best.totalRezCost;
  const clicksAfterDefense = input.availableCorpClicks;
  const preservesScoreCreditReserve =
    creditsAfterDefense >= reserve.totalCredits;
  const preservesHardClickReserve =
    clicksAfterDefense >= reserve.hardClickReserve;
  const fundedProtection =
    best.protection.protectsScore &&
    preservesScoreCreditReserve &&
    preservesHardClickReserve;
  const minimumAdditionalCreditsToSatisfy =
    minimumSatisfyingRezCost === undefined
      ? undefined
      : Math.max(
          0,
          reserve.totalCredits +
            minimumSatisfyingRezCost -
          input.availableCorpCredits,
        );
  const minimumAdditionalClicksToSatisfy =
    minimumSatisfyingRezCost === undefined
      ? undefined
      : Math.max(0, reserve.hardClickReserve - input.availableCorpClicks);

  return {
    knowledge: "known",
    availableCorpCredits: input.availableCorpCredits,
    availableCorpClicks: input.availableCorpClicks,
    totalScoreReserveCredits: reserve.totalCredits,
    hardClickReserve: reserve.hardClickReserve,
    scoreReserveFingerprint: reserve.fingerprint,
    protection: best.protection,
    selectedRezCosts: best.selectedRezCosts,
    totalSelectedRezCost: best.totalRezCost,
    creditsAfterDefense,
    clicksAfterDefense,
    preservesScoreCreditReserve,
    preservesHardClickReserve,
    fundedProtection,
    ...(minimumSatisfyingRezCost !== undefined
      ? {
          minimumSatisfyingRezCost,
          minimumAdditionalCreditsToSatisfy: minimumAdditionalCreditsToSatisfy!,
          minimumAdditionalClicksToSatisfy:
            minimumAdditionalClicksToSatisfy!,
        }
      : {}),
    evidence: [
      "fundedScoreProtectionKnown:true",
      `scoreReserveCredits:${reserve.totalCredits}`,
      `hardClickReserve:${reserve.hardClickReserve}`,
      `availableRezCredits:${availableRezCredits}`,
      `selectedRezCost:${best.totalRezCost}`,
      `creditsAfterDefense:${creditsAfterDefense}`,
      `clicksAfterDefense:${clicksAfterDefense}`,
      `preservesScoreCreditReserve:${preservesScoreCreditReserve}`,
      `preservesHardClickReserve:${preservesHardClickReserve}`,
      `fundedProtection:${fundedProtection}`,
      ...(minimumSatisfyingRezCost !== undefined
        ? [
            `minimumSatisfyingRezCost:${minimumSatisfyingRezCost}`,
            `minimumAdditionalCreditsToSatisfy:${minimumAdditionalCreditsToSatisfy}`,
            `minimumAdditionalClicksToSatisfy:${minimumAdditionalClicksToSatisfy}`,
          ]
        : []),
    ],
  };
}

export function projectCorpFundedIceInstallRoute(
  input: CorpFundedIceInstallRouteInput,
): CorpFundedIceInstallRouteProjection {
  const { need, action } = input;
  const base = {
    actionId: action.actionId,
    before: need.baseline,
  };
  if (need.baseline.knowledge === "unknown") {
    return unknownRoute(base, "baseline_unknown", [
      "fundedIceInstallRouteKnown:false",
      "baselineUnknown:true",
    ]);
  }
  const needReserve = normalizeScoreReserve(need.scoreReserve);
  if (
    needReserve.status === "unknown" ||
    need.baseline.scoreReserveFingerprint !== needReserve.fingerprint
  ) {
    return unknownRoute(base, "reserve_drift", [
      "fundedIceInstallRouteKnown:false",
      "scoreReserveDrift:true",
    ]);
  }
  const objectiveComparison = compareExactProbabilities(
    need.baseline.protection.maximumRunnerAccessSuccessProbability,
    need.objective.maximumRunnerAccessSuccessProbability,
  );
  if (objectiveComparison !== 0) {
    return unknownRoute(base, "objective_drift", [
      "fundedIceInstallRouteKnown:false",
      "objectiveDrift:true",
    ]);
  }
  if (
    !nonNegativeSafeInteger(need.observedAtStateVersion) ||
    input.currentStateVersion !== need.observedAtStateVersion ||
    action.expiresAtStateVersion !== need.observedAtStateVersion
  ) {
    return unknownRoute(base, "state_version_drift", [
      "fundedIceInstallRouteKnown:false",
      "stateVersionDrift:true",
    ]);
  }
  if (
    action.side !== "corp" ||
    action.type !== "install_card" ||
    action.payload?.placement !== "ice"
  ) {
    return unknownRoute(base, "invalid_install_action", [
      "fundedIceInstallRouteKnown:false",
      "invalidInstallAction:true",
    ]);
  }
  const payloadCardId = action.payload.cardId;
  if (
    typeof payloadCardId !== "string" ||
    action.source === "basic_action" ||
    action.source === "game_rule" ||
    action.source !== payloadCardId
  ) {
    return unknownRoute(base, "source_binding_drift", [
      "fundedIceInstallRouteKnown:false",
      "sourceBindingDrift:true",
    ]);
  }
  const sourceMatches = input.visibleCorpHand.filter(
    (card) => card.instanceId === payloadCardId,
  );
  if (sourceMatches.length !== 1 || sourceMatches[0]!.known !== true) {
    return unknownRoute(base, "source_binding_drift", [
      "fundedIceInstallRouteKnown:false",
      "visibleSourceBindingDrift:true",
    ]);
  }
  const sourceCard = sourceMatches[0]!;
  const sourceDefinition = sourceCard.definitionId
    ? CARD_DEFINITIONS_BY_ID[sourceCard.definitionId]
    : undefined;
  if (
    !sourceCard.definitionId ||
    !sourceDefinition ||
    sourceDefinition.type !== "ice" ||
    sourceCard.type !== "ice"
  ) {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
      },
      "unknown_source_definition",
      ["fundedIceInstallRouteKnown:false", "unknownSourceDefinition:true"],
    );
  }
  if (
    sourceCard.owner !== "corp" ||
    (action.payload.sourceDefinitionId !== undefined &&
      action.payload.sourceDefinitionId !== sourceCard.definitionId)
  ) {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
      },
      "source_binding_drift",
      ["fundedIceInstallRouteKnown:false", "sourceOwnershipOrDefinitionDrift:true"],
    );
  }
  const targetServerId = action.payload.serverId;
  if (
    typeof targetServerId !== "string" ||
    targetServerId !== need.targetServerId ||
    (targetServerId === "new_remote"
      ? input.currentServer !== undefined
      : input.currentServer?.id !== targetServerId)
  ) {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        ...(typeof targetServerId === "string" ? { targetServerId } : {}),
      },
      "target_server_drift",
      ["fundedIceInstallRouteKnown:false", "targetServerDrift:true"],
    );
  }
  const currentIce =
    targetServerId === "new_remote" ? [] : input.currentServer!.ice;
  const recomputedBaseline = assessBestFundedCorpScoreProtection({
    serverIce: currentIce,
    runnerRig: input.runnerRig,
    runnerCredits: input.runnerCredits,
    targetServerId: need.targetServerId,
    observedAtStateVersion: input.currentStateVersion,
    availableCorpCredits: input.currentCorpCredits,
    availableCorpClicks: input.currentCorpClicks,
    scoreReserve: need.scoreReserve,
    maximumRunnerAccessSuccessProbability:
      need.objective.maximumRunnerAccessSuccessProbability,
  });
  if (
    recomputedBaseline.knowledge === "unknown" ||
    !sameKnownFundedAssessment(recomputedBaseline, need.baseline)
  ) {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      "baseline_drift",
      [
        "fundedIceInstallRouteKnown:false",
        "baselineRecomputeDrift:true",
        ...(recomputedBaseline.knowledge === "unknown"
          ? [`baselineRecomputeUnknownReason:${recomputedBaseline.unknownReason}`]
          : []),
      ],
    );
  }
  const projectedRezQuote = readPostInstallRezQuote(
    action,
    sourceCard.instanceId,
    need.targetServerId,
    input.currentStateVersion,
  );
  if (projectedRezQuote.status === "unknown") {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      projectedRezQuote.reason,
      [
        "fundedIceInstallRouteKnown:false",
        `postInstallRezQuoteReason:${projectedRezQuote.reason}`,
      ],
    );
  }

  const creditCost = corpIcePlacementActionCostAgreementFact(
    action,
    input.projectedInstallCredits,
  );
  const clickCost = exactActionCostAgreement(
    action,
    "clicks",
    input.projectedInstallClicks,
  );
  if (creditCost.status === "unknown" || clickCost.status === "unknown") {
    const drift =
      (creditCost.status === "unknown" &&
        creditCost.reason === "projection_drift") ||
      (clickCost.status === "unknown" &&
        clickCost.reason === "projection_drift");
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      drift ? "install_cost_drift" : "install_cost_unknown",
      [
        "fundedIceInstallRouteKnown:false",
        `installCreditCostStatus:${creditCost.status}`,
        `installClickCostStatus:${clickCost.status}`,
      ],
    );
  }
  if (
    !installPayloadCostsAgree(
      action,
      creditCost.amount,
      targetServerId,
      currentIce.length,
    )
  ) {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      "install_payload_cost_drift",
      ["fundedIceInstallRouteKnown:false", "installPayloadCostDrift:true"],
    );
  }

  const creditsAfterInstall =
    need.baseline.availableCorpCredits - creditCost.amount;
  const clicksAfterInstall =
    need.baseline.availableCorpClicks - clickCost.amount;
  if (creditsAfterInstall < 0 || clicksAfterInstall < 0) {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      "insufficient_action_resources",
      ["fundedIceInstallRouteKnown:false", "insufficientActionResources:true"],
    );
  }

  const projectedSource: CorpFundedScoreProtectionIceInput = {
    instanceId: sourceCard.instanceId,
    known: true,
    definitionId: sourceCard.definitionId,
    rezzed: false,
    ...(sourceCard.strength !== undefined
      ? { strength: sourceCard.strength }
      : {}),
    ...(sourceCard.subtypes ? { subtypes: sourceCard.subtypes.slice() } : {}),
    ...(sourceCard.effectiveRunQuote
      ? { effectiveRunQuote: sourceCard.effectiveRunQuote }
      : {}),
    effectiveRezCostQuote: projectedRezQuote.quote,
  };
  const after = assessBestFundedCorpScoreProtection({
    serverIce: [...currentIce, projectedSource],
    postInstallQuoteCardId: sourceCard.instanceId,
    runnerRig: input.runnerRig,
    runnerCredits: input.runnerCredits,
    targetServerId: need.targetServerId,
    observedAtStateVersion: input.currentStateVersion,
    availableCorpCredits: creditsAfterInstall,
    availableCorpClicks: clicksAfterInstall,
    scoreReserve: need.scoreReserve,
    maximumRunnerAccessSuccessProbability:
      need.objective.maximumRunnerAccessSuccessProbability,
  });
  if (after.knowledge === "unknown") {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      "after_assessment_unknown",
      [
        "fundedIceInstallRouteKnown:false",
        "afterAssessmentUnknown:true",
        `afterUnknownReason:${after.unknownReason}`,
      ],
    );
  }

  const probabilityComparison = compareExactProbabilities(
    after.protection.runnerAccessSuccessProbability,
    need.baseline.protection.runnerAccessSuccessProbability,
  );
  if (probabilityComparison === undefined) {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      "after_assessment_unknown",
      ["fundedIceInstallRouteKnown:false", "probabilityComparisonUnknown:true"],
    );
  }
  const preservesReserves =
    after.preservesScoreCreditReserve && after.preservesHardClickReserve;
  const effect = !preservesReserves
    ? "no_progress"
    : after.fundedProtection && !need.baseline.fundedProtection
      ? "satisfied"
      : probabilityComparison < 0
        ? "progress"
        : "no_progress";

  return {
    knowledge: "known",
    actionId: action.actionId,
    sourceCardInstanceId: sourceCard.instanceId,
    sourceDefinitionId: sourceCard.definitionId,
    targetServerId,
    before: need.baseline,
    after,
    effect,
    installCredits: creditCost.amount,
    installClicks: clickCost.amount,
    installCostSource: "legal_action_agreed_projection",
    selectedRezCosts: after.selectedRezCosts,
    creditsAfterDefense: after.creditsAfterDefense,
    clicksAfterDefense: after.clicksAfterDefense,
    preservesScoreCreditReserve: after.preservesScoreCreditReserve,
    preservesHardClickReserve: after.preservesHardClickReserve,
    preservesReserves,
    funded: after.fundedProtection,
    evidence: [
      "fundedIceInstallRouteKnown:true",
      `routeEffect:${effect}`,
      `installCredits:${creditCost.amount}`,
      `installClicks:${clickCost.amount}`,
      "installCostSource:legal_action_agreed_projection",
      `sourceRezCost:${projectedRezQuote.quote.finalCredits}`,
      "sourceRezCostSource:engine_post_install_rez_quote",
      `creditsAfterDefense:${after.creditsAfterDefense}`,
      `clicksAfterDefense:${after.clicksAfterDefense}`,
      `preservesReserves:${preservesReserves}`,
      `funded:${after.fundedProtection}`,
    ],
  };
}

function readCompleteFundedRezQuote(
  ice: CorpFundedScoreProtectionIceInput,
  input: Pick<
    CorpBestFundedScoreProtectionInput,
    "targetServerId" | "observedAtStateVersion"
  >,
): CompleteRezQuoteRead {
  const quote = ice.effectiveRezCostQuote;
  if (!quote) return { status: "unknown", reason: "missing_rez_cost_quote" };
  if (!quote.complete) {
    return { status: "unknown", reason: "incomplete_rez_cost_quote" };
  }
  if (
    !ice.definitionId ||
    quote.cardId !== ice.instanceId ||
    quote.targetServerId !== input.targetServerId ||
    quote.expiresAtStateVersion !== input.observedAtStateVersion ||
    !validProjectedServerBinding(quote) ||
    !nonNegativeSafeInteger(quote.baseCredits) ||
    !nonNegativeSafeInteger(quote.finalCredits) ||
    !validMandatoryRezCosts(quote.mandatoryAdditionalCosts) ||
    !validDefinitionIdList(quote.reductionSourceDefinitionIds) ||
    !validDefinitionIdList(quote.increaseSourceDefinitionIds)
  ) {
    return { status: "unknown", reason: "rez_cost_quote_drift" };
  }
  if (
    quote.mandatoryAdditionalCosts.agendaPoints > 0
  ) {
    return {
      status: "unknown",
      reason: "unsupported_mandatory_rez_cost",
    };
  }
  return {
    status: "known",
    definitionId: ice.definitionId,
    finalCredits: quote.finalCredits,
  };
}

function readPostInstallRezQuote(
  action: LegalAction,
  sourceCardInstanceId: string,
  targetServerId: VisibleCorpRezCostQuote["targetServerId"],
  observedAtStateVersion: number,
): PostInstallRezQuoteRead {
  const payload = action.payload ?? {};
  if (payload.postInstallRezQuoteComplete !== true) {
    return {
      status: "unknown",
      reason:
        payload.postInstallRezQuoteComplete === false
          ? "post_install_rez_quote_unknown"
          : "post_install_rez_quote_drift",
    };
  }
  const projectedServerId = payload.postInstallRezQuoteProjectedServerId;
  const baseCredits = payload.postInstallRezQuoteBaseCredits;
  const finalCredits = payload.postInstallRezQuoteFinalCredits;
  const mandatoryAgendaPointCost =
    payload.postInstallRezQuoteMandatoryAgendaPointCost;
  const mandatoryKind =
    payload.postInstallRezQuoteMandatoryAdditionalCostKind;
  const reductionSourceDefinitionIds = commaSeparatedIds(
    payload.postInstallRezQuoteReductionSourceDefinitionIds,
  );
  const increaseSourceDefinitionIds = commaSeparatedIds(
    payload.postInstallRezQuoteIncreaseSourceDefinitionIds,
  );
  if (
    payload.postInstallRezQuoteCardId !== sourceCardInstanceId ||
    payload.postInstallRezQuoteTargetServerId !== targetServerId ||
    !validTargetProjectedServerBinding(
      targetServerId,
      projectedServerId,
    ) ||
    payload.postInstallRezQuoteExpiresAtStateVersion !==
      observedAtStateVersion ||
    !nonNegativeSafeInteger(baseCredits) ||
    !nonNegativeSafeInteger(finalCredits) ||
    !nonNegativeSafeInteger(mandatoryAgendaPointCost) ||
    (mandatoryAgendaPointCost > 0
      ? mandatoryKind !== "agenda_point"
      : mandatoryKind !== undefined) ||
    reductionSourceDefinitionIds === undefined ||
    increaseSourceDefinitionIds === undefined
  ) {
    return {
      status: "unknown",
      reason: "post_install_rez_quote_drift",
    };
  }
  if (mandatoryAgendaPointCost > 0) {
    return {
      status: "unknown",
      reason: "unsupported_mandatory_rez_cost",
    };
  }
  return {
    status: "known",
    quote: {
      context: "post_install",
      cardId: sourceCardInstanceId,
      targetServerId,
      projectedServerId,
      expiresAtStateVersion: observedAtStateVersion,
      complete: true,
      baseCredits,
      finalCredits,
      mandatoryAdditionalCosts: { agendaPoints: 0 },
      ...(reductionSourceDefinitionIds.length > 0
        ? { reductionSourceDefinitionIds }
        : {}),
      ...(increaseSourceDefinitionIds.length > 0
        ? { increaseSourceDefinitionIds }
        : {}),
    },
  };
}

function validProjectedServerBinding(quote: VisibleCorpRezCostQuote): boolean {
  if (!quote.complete) return false;
  return validTargetProjectedServerBinding(
    quote.targetServerId,
    quote.projectedServerId,
  );
}

function validTargetProjectedServerBinding(
  targetServerId: VisibleCorpRezCostQuote["targetServerId"],
  projectedServerId: unknown,
): projectedServerId is Exclude<ServerId, "new_remote"> {
  if (targetServerId === "new_remote") {
    return (
      typeof projectedServerId === "string" &&
      /^remote_[1-9]\d*$/.test(projectedServerId)
    );
  }
  return projectedServerId === targetServerId;
}

function validMandatoryRezCosts(
  costs: Extract<
    VisibleCorpRezCostQuote,
    { complete: true }
  >["mandatoryAdditionalCosts"],
): boolean {
  return (
    typeof costs === "object" &&
    costs !== null &&
    nonNegativeSafeInteger(costs.agendaPoints)
  );
}

function validDefinitionIdList(ids: readonly string[] | undefined): boolean {
  return (
    ids === undefined ||
    (Array.isArray(ids) &&
      ids.every((id) => typeof id === "string" && id.length > 0))
  );
}

function commaSeparatedIds(value: unknown): string[] | undefined {
  if (value === undefined) return [];
  if (typeof value !== "string" || value.length === 0) return undefined;
  const ids = value.split(",");
  return validDefinitionIdList(ids) ? ids : undefined;
}

function normalizeScoreReserve(reserve: CorpScoreReserve):
  | Readonly<{
      status: "known";
      totalCredits: number;
      hardClickReserve: number;
      fingerprint: string;
    }>
  | Readonly<{
      status: "unknown";
      reason: "invalid_score_reserve" | "duplicate_score_reserve_component";
    }> {
  if (!nonNegativeSafeInteger(reserve.hardClickReserve)) {
    return { status: "unknown", reason: "invalid_score_reserve" };
  }
  const reserveIds = new Set<string>();
  let totalCredits = 0;
  for (const component of reserve.creditBreakdown) {
    if (!component.reserveId || reserveIds.has(component.reserveId)) {
      return {
        status: "unknown",
        reason: "duplicate_score_reserve_component",
      };
    }
    reserveIds.add(component.reserveId);
    if (!nonNegativeSafeInteger(component.credits)) {
      return { status: "unknown", reason: "invalid_score_reserve" };
    }
    totalCredits += component.credits;
    if (!Number.isSafeInteger(totalCredits)) {
      return { status: "unknown", reason: "invalid_score_reserve" };
    }
  }
  return {
    status: "known",
    totalCredits,
    hardClickReserve: reserve.hardClickReserve,
    fingerprint: [
      `clicks:${reserve.hardClickReserve}`,
      ...reserve.creditBreakdown
        .map(
          (component) =>
            `${component.reserveId.length}:${component.reserveId}=${component.credits}`,
        )
        .sort(compareTechnicalStrings),
    ].join("|"),
  };
}

function enumerateRezSelections(
  candidates: readonly RezCandidate[],
): RezCandidate[][] {
  const selections: RezCandidate[][] = [];
  const visit = (index: number, selected: RezCandidate[]): void => {
    if (index >= candidates.length) {
      selections.push(selected.slice());
      return;
    }
    visit(index + 1, selected);
    selected.push(candidates[index]!);
    visit(index + 1, selected);
    selected.pop();
  };
  visit(0, []);
  return selections;
}

function satisfyingAssessmentIsBetter(
  candidate: EnumeratedAssessment,
  current: EnumeratedAssessment,
): boolean {
  if (candidate.totalRezCost !== current.totalRezCost) {
    return candidate.totalRezCost < current.totalRezCost;
  }
  if (candidate.selectedRezCosts.length !== current.selectedRezCosts.length) {
    return candidate.selectedRezCosts.length < current.selectedRezCosts.length;
  }
  const comparison = compareExactProbabilities(
    candidate.protection.runnerAccessSuccessProbability,
    current.protection.runnerAccessSuccessProbability,
  );
  if (comparison === undefined) return false;
  if (comparison !== 0) return comparison < 0;
  return (
    compareTechnicalStrings(
      selectedRezKey(candidate.selectedRezCosts),
      selectedRezKey(current.selectedRezCosts),
    ) < 0
  );
}

function progressAssessmentIsBetter(
  candidate: EnumeratedAssessment,
  current: EnumeratedAssessment,
): boolean {
  const comparison = compareExactProbabilities(
    candidate.protection.runnerAccessSuccessProbability,
    current.protection.runnerAccessSuccessProbability,
  );
  if (comparison === undefined) return false;
  if (comparison !== 0) return comparison < 0;
  if (candidate.totalRezCost !== current.totalRezCost) {
    return candidate.totalRezCost < current.totalRezCost;
  }
  if (candidate.selectedRezCosts.length !== current.selectedRezCosts.length) {
    return candidate.selectedRezCosts.length < current.selectedRezCosts.length;
  }
  return (
    compareTechnicalStrings(
      selectedRezKey(candidate.selectedRezCosts),
      selectedRezKey(current.selectedRezCosts),
    ) < 0
  );
}

function selectedRezKey(costs: readonly CorpSelectedRezCost[]): string {
  return JSON.stringify(
    costs
      .map((cost) => cost.iceInstanceId)
      .sort(compareTechnicalStrings),
  );
}

function compareTechnicalStrings(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function exactActionCostAgreement(
  action: LegalAction,
  kind: "clicks" | "credits",
  projectedAmount: number,
):
  | Readonly<{ status: "known"; amount: number }>
  | Readonly<{
      status: "unknown";
      reason: "invalid" | "projection_drift";
    }> {
  if (!nonNegativeSafeInteger(projectedAmount)) {
    return { status: "unknown", reason: "invalid" };
  }
  let amount = 0;
  for (const cost of action.costs) {
    const value = cost[kind];
    if (value === undefined) continue;
    if (!nonNegativeSafeInteger(value)) {
      return { status: "unknown", reason: "invalid" };
    }
    amount += value;
    if (!Number.isSafeInteger(amount)) {
      return { status: "unknown", reason: "invalid" };
    }
  }
  if (amount !== projectedAmount) {
    return { status: "unknown", reason: "projection_drift" };
  }
  return { status: "known", amount };
}

function installPayloadCostsAgree(
  action: LegalAction,
  legalActionCredits: number,
  targetServerId: string,
  currentServerIceCount: number,
): boolean {
  const payload = action.payload ?? {};
  const fields = [
    payload.iceInstallBaseCost,
    payload.iceInstallAdditionalCost,
    payload.iceInstallReduction,
    payload.iceInstallTotalCost,
  ];
  if (targetServerId === "new_remote") {
    return (
      legalActionCredits === 0 && fields.every((value) => value === undefined)
    );
  }
  if (!fields.every(nonNegativeSafeInteger)) return false;
  const [baseCost, additionalCost, reduction, totalCost] = fields as [
    number,
    number,
    number,
    number,
  ];
  return (
    baseCost === currentServerIceCount &&
    totalCost === legalActionCredits &&
    totalCost === Math.max(0, baseCost + additionalCost - reduction)
  );
}

function sameKnownFundedAssessment(
  left: KnownCorpFundedScoreProtectionAssessment,
  right: KnownCorpFundedScoreProtectionAssessment,
): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function nonNegativeSafeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function unknownFundedAssessment(
  input: CorpBestFundedScoreProtectionInput,
  unknownReason: UnknownCorpFundedScoreProtectionAssessment["unknownReason"],
  totalScoreReserveCredits: number,
  evidence: readonly string[],
): UnknownCorpFundedScoreProtectionAssessment {
  return {
    knowledge: "unknown",
    availableCorpCredits: input.availableCorpCredits,
    availableCorpClicks: input.availableCorpClicks,
    totalScoreReserveCredits,
    hardClickReserve: input.scoreReserve.hardClickReserve,
    fundedProtection: false,
    unknownReason,
    evidence,
  };
}

function unknownRoute(
  base: Omit<CorpFundedIceInstallRouteBase, "effect" | "evidence">,
  unknownReason: UnknownCorpFundedIceInstallRouteProjection["unknownReason"],
  evidence: readonly string[],
): UnknownCorpFundedIceInstallRouteProjection {
  return {
    ...base,
    knowledge: "unknown",
    effect: "unknown",
    unknownReason,
    evidence,
  };
}
