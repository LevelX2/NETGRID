import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import {
  type LegalAction,
  type ServerId,
  type VisibleCard,
  type VisibleCorpRezCostQuote,
  type VisibleEffectiveIceRunQuote,
  type VisibleVariableCorpRezCostParameter,
} from "@netgrid/shared";
import { corpIcePlacementActionCostAgreementFact } from "./corp-ice-placement/corp-ice-placement";
import {
  assessCorpScoreProtection,
  compareExactProbabilities,
  type CorpScoreProtectionIceInput,
  type ExactProbability,
  type KnownCorpScoreProtectionAssessment,
} from "./corp-score-protection-assessment";
import type { RemoteProtectionTarget } from "../remote-doctrine-profile";

export type CorpProtectionObjective =
  | Readonly<{
      kind: "score_access_probability";
      maximumRunnerAccessSuccessProbability: ExactProbability;
    }>
  | Readonly<{
      kind: "remote_protection_band";
      targetBand: RemoteProtectionTarget;
      policyVersion: string;
    }>;

export type CorpFundedAndStagedRouteSelection<T> = Readonly<{
  funded?: T;
  staged?: T;
  minimumSatisfying?: T;
}>;

export function selectCorpFundedAndStagedProtectionRoutes<T>(
  params: Readonly<{
    routes: readonly T[];
    availableRezCredits: number;
    totalRezCost: (route: T) => number;
    satisfiesObjective: (route: T) => boolean;
    compareSatisfying: (left: T, right: T) => number;
    compareProgress: (left: T, right: T) => number;
    preferAffordableProgress?: (route: T) => boolean;
  }>,
): CorpFundedAndStagedRouteSelection<T> {
  const satisfying = params.routes
    .filter(params.satisfiesObjective)
    .slice()
    .sort(params.compareSatisfying);
  const affordable = params.routes.filter(
    (route) => params.totalRezCost(route) <= params.availableRezCredits,
  );
  const fundedSatisfying = affordable
    .filter(params.satisfiesObjective)
    .slice()
    .sort(params.compareSatisfying)[0];
  const affordableProgress = affordable
    .filter((route) => !params.satisfiesObjective(route))
    .slice()
    .sort(params.compareProgress);
  const preferredProgress = params.preferAffordableProgress
    ? affordableProgress.find(params.preferAffordableProgress)
    : undefined;
  const funded = fundedSatisfying ?? preferredProgress ?? affordableProgress[0];
  const minimumSatisfying = satisfying[0];
  const staged =
    minimumSatisfying ?? params.routes.slice().sort(params.compareProgress)[0];
  return {
    ...(funded ? { funded } : {}),
    ...(staged ? { staged } : {}),
    ...(minimumSatisfying ? { minimumSatisfying } : {}),
  };
}

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
  agendaPoints?: number;
  source: "engine_rez_cost_quote";
  variableRezChoice?:
    | Readonly<{
        kind: "paid_end_the_run_subroutines";
        subroutineCount: number;
      }>
    | Readonly<{
        kind: "alternate_subtype";
        selectedSubtypes: readonly string[];
      }>;
}>;

type CorpFundedScoreProtectionAssessmentBase = Readonly<{
  availableCorpCredits: number;
  availableCorpClicks: number;
  availableCorpAgendaPoints: number;
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
      totalSelectedAgendaPointCost: number;
      creditsAfterDefense: number;
      agendaPointsAfterDefense: number;
      clicksAfterDefense: number;
      preservesScoreCreditReserve: boolean;
      preservesHardClickReserve: boolean;
      minimumSatisfyingRezCost?: number;
      minimumSatisfyingRezCosts?: readonly CorpSelectedRezCost[];
      minimumSatisfyingProtection?: KnownCorpScoreProtectionAssessment;
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
        | "unsupported_variable_rez_effect"
        | "search_space_exceeded"
        | "subset_assessment_unknown";
    }>;

export type CorpFundedScoreProtectionAssessment =
  | KnownCorpFundedScoreProtectionAssessment
  | UnknownCorpFundedScoreProtectionAssessment;

export type CorpBestFundedScoreProtectionInput = Readonly<{
  serverIce: readonly CorpFundedScoreProtectionIceInput[];
  postInstallQuoteCardId?: string;
  preferPostInstallSourceProgress?: boolean;
  runnerRig: readonly VisibleCard[];
  runnerSetAside?: readonly VisibleCard[];
  runnerMemoryUsed?: number;
  runnerMemoryLimit?: number;
  runnerCredits: number;
  targetServerId: VisibleCorpRezCostQuote["targetServerId"];
  observedAtStateVersion: number;
  availableCorpCredits: number;
  availableCorpClicks: number;
  availableCorpAgendaPoints: number;
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
        | "post_install_effective_run_quote_drift"
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
  currentCorpAgendaPoints: number;
  visibleCorpHand: readonly VisibleCard[];
  currentServer?: Readonly<{
    id: string;
    ice: readonly CorpFundedScoreProtectionIceInput[];
  }>;
  runnerRig: readonly VisibleCard[];
  runnerSetAside?: readonly VisibleCard[];
  runnerMemoryUsed?: number;
  runnerMemoryLimit?: number;
  runnerCredits: number;
  projectedInstallCredits: number;
  projectedInstallClicks: number;
  preferPostInstallSourceProgress?: boolean;
}>;

type RezCandidate = Readonly<{
  ice: CorpFundedScoreProtectionIceInput;
  selectedCost: CorpSelectedRezCost;
}>;

type EnumeratedAssessment = Readonly<{
  protection: KnownCorpScoreProtectionAssessment;
  selectedRezCosts: readonly CorpSelectedRezCost[];
  totalRezCost: number;
  totalAgendaPointCost: number;
}>;

const MAX_EXACT_REZ_CANDIDATES = 12;

type CompleteRezQuoteRead =
  | Readonly<{
      status: "known";
      definitionId: string;
      options: readonly CertifiedFundedRezOption[];
    }>
  | Readonly<{
      status: "unknown";
      reason:
        | "missing_rez_cost_quote"
        | "incomplete_rez_cost_quote"
        | "rez_cost_quote_drift"
        | "unsupported_mandatory_rez_cost"
        | "unsupported_variable_rez_effect";
    }>;

type CertifiedFundedRezOption = Readonly<{
  finalCredits: number;
  mandatoryAgendaPoints: number;
  projectedIce: CorpFundedScoreProtectionIceInput;
  variableRezChoice?: CorpSelectedRezCost["variableRezChoice"];
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

type PostInstallEffectiveRunQuoteRead =
  | Readonly<{
      status: "known";
      quote: VisibleEffectiveIceRunQuote;
    }>
  | Readonly<{
      status: "unknown";
      reason: "post_install_effective_run_quote_drift";
    }>;

export function assessBestFundedCorpScoreProtection(
  input: CorpBestFundedScoreProtectionInput,
): CorpFundedScoreProtectionAssessment {
  const objective: Extract<
    CorpProtectionObjective,
    { kind: "score_access_probability" }
  > = {
    kind: "score_access_probability",
    maximumRunnerAccessSuccessProbability:
      input.maximumRunnerAccessSuccessProbability,
  };
  const resourcesValid =
    nonNegativeSafeInteger(input.availableCorpCredits) &&
    nonNegativeSafeInteger(input.availableCorpClicks) &&
    nonNegativeSafeInteger(input.availableCorpAgendaPoints) &&
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
    for (const option of quote.options) {
      candidates.push({
        ice: option.projectedIce,
        selectedCost: {
          iceInstanceId: ice.instanceId,
          iceDefinitionId: quote.definitionId,
          credits: option.finalCredits,
          agendaPoints: option.mandatoryAgendaPoints,
          source: "engine_rez_cost_quote",
          ...(option.variableRezChoice
            ? { variableRezChoice: option.variableRezChoice }
            : {}),
        },
      });
    }
  }
  const candidateIceCount = new Set(
    candidates.map((candidate) => candidate.ice.instanceId),
  ).size;
  if (
    candidateIceCount > MAX_EXACT_REZ_CANDIDATES ||
    exactRezSelectionCount(candidates) > 2 ** MAX_EXACT_REZ_CANDIDATES
  ) {
    return unknownFundedAssessment(
      input,
      "search_space_exceeded",
      reserve.totalCredits,
      [
        "fundedScoreProtectionKnown:false",
        `rezCandidateCount:${candidateIceCount}`,
        `rezOptionCount:${candidates.length}`,
        `maximumExactRezCandidateCount:${MAX_EXACT_REZ_CANDIDATES}`,
      ],
    );
  }

  const selections = enumerateRezSelections(candidates);
  const availableRezCredits = Math.max(
    0,
    input.availableCorpCredits - reserve.totalCredits,
  );
  const knownAssessments: EnumeratedAssessment[] = [];
  const unknownSubsetReasons = new Set<string>();
  let unknownSubsetCount = 0;
  for (const selection of selections) {
    const selectedById = new Map(
      selection.map((candidate) => [candidate.ice.instanceId, candidate.ice]),
    );
    const selectedRezCosts = selection.map(
      (candidate) => candidate.selectedCost,
    );
    const totalRezCost = selectedRezCosts.reduce(
      (sum, cost) => sum + cost.credits,
      0,
    );
    const totalAgendaPointCost = selectedRezCosts.reduce(
      (sum, cost) => sum + (cost.agendaPoints ?? 0),
      0,
    );
    if (
      !Number.isSafeInteger(totalRezCost) ||
      !Number.isSafeInteger(totalAgendaPointCost)
    ) {
      return unknownFundedAssessment(
        input,
        "rez_cost_quote_drift",
        reserve.totalCredits,
        ["fundedScoreProtectionKnown:false", "rezCostOverflow:true"],
      );
    }
    if (totalAgendaPointCost > input.availableCorpAgendaPoints) continue;
    const protection = assessCorpScoreProtection({
      serverIce: input.serverIce.map((ice) => ({
        ...(selectedById.get(ice.instanceId) ?? ice),
        rezzed: ice.rezzed === true || selectedById.has(ice.instanceId),
      })),
      runnerRig: input.runnerRig,
      ...(input.runnerSetAside ? { runnerSetAside: input.runnerSetAside } : {}),
      ...(input.runnerMemoryUsed !== undefined
        ? { runnerMemoryUsed: input.runnerMemoryUsed }
        : {}),
      ...(input.runnerMemoryLimit !== undefined
        ? { runnerMemoryLimit: input.runnerMemoryLimit }
        : {}),
      runnerCredits: input.runnerCredits,
      maximumRunnerAccessSuccessProbability:
        objective.maximumRunnerAccessSuccessProbability,
    });
    if (protection.knowledge === "unknown") {
      // An unsupported optional sibling route must remain a visible blocker,
      // but it must not erase an independently certified known subset. The
      // selected route is allowed to use only known assessments; if every
      // subset is unknown we still fail closed below.
      unknownSubsetCount += 1;
      unknownSubsetReasons.add(protection.unknownReason);
      continue;
    }
    const assessment: EnumeratedAssessment = {
      protection,
      selectedRezCosts,
      totalRezCost,
      totalAgendaPointCost,
    };
    knownAssessments.push(assessment);
  }
  const selectedRoutes = selectCorpFundedAndStagedProtectionRoutes({
    routes: knownAssessments,
    availableRezCredits,
    totalRezCost: (assessment) => assessment.totalRezCost,
    satisfiesObjective: (assessment) => assessment.protection.protectsScore,
    compareSatisfying: compareSatisfyingAssessments,
    compareProgress: compareProgressAssessments,
    ...(input.preferPostInstallSourceProgress === true &&
    input.postInstallQuoteCardId !== undefined
      ? {
          preferAffordableProgress: (assessment: EnumeratedAssessment) =>
            assessment.selectedRezCosts.some(
              (cost) => cost.iceInstanceId === input.postInstallQuoteCardId,
            ),
        }
      : {}),
  });
  const best = selectedRoutes.funded;
  const minimumSatisfying = selectedRoutes.minimumSatisfying;
  if (!best) {
    return unknownFundedAssessment(
      input,
      "subset_assessment_unknown",
      reserve.totalCredits,
      [
        "fundedScoreProtectionKnown:false",
        "noKnownEnumeratedAssessment:true",
        `unknownSubsetCount:${unknownSubsetCount}`,
        ...[...unknownSubsetReasons]
          .sort()
          .map((reason) => `protectionUnknownReason:${reason}`),
      ],
    );
  }

  const creditsAfterDefense = input.availableCorpCredits - best.totalRezCost;
  const agendaPointsAfterDefense =
    input.availableCorpAgendaPoints - best.totalAgendaPointCost;
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
    minimumSatisfying === undefined
      ? undefined
      : Math.max(
          0,
          reserve.totalCredits +
            minimumSatisfying.totalRezCost -
            input.availableCorpCredits,
        );
  const minimumAdditionalClicksToSatisfy =
    minimumSatisfying === undefined
      ? undefined
      : Math.max(0, reserve.hardClickReserve - input.availableCorpClicks);

  return {
    knowledge: "known",
    availableCorpCredits: input.availableCorpCredits,
    availableCorpClicks: input.availableCorpClicks,
    availableCorpAgendaPoints: input.availableCorpAgendaPoints,
    totalScoreReserveCredits: reserve.totalCredits,
    hardClickReserve: reserve.hardClickReserve,
    scoreReserveFingerprint: reserve.fingerprint,
    protection: best.protection,
    selectedRezCosts: best.selectedRezCosts,
    totalSelectedRezCost: best.totalRezCost,
    totalSelectedAgendaPointCost: best.totalAgendaPointCost,
    creditsAfterDefense,
    agendaPointsAfterDefense,
    clicksAfterDefense,
    preservesScoreCreditReserve,
    preservesHardClickReserve,
    fundedProtection,
    ...(minimumSatisfying !== undefined
      ? {
          minimumSatisfyingRezCost: minimumSatisfying.totalRezCost,
          minimumSatisfyingRezCosts: minimumSatisfying.selectedRezCosts,
          minimumSatisfyingProtection: minimumSatisfying.protection,
          minimumAdditionalCreditsToSatisfy: minimumAdditionalCreditsToSatisfy!,
          minimumAdditionalClicksToSatisfy: minimumAdditionalClicksToSatisfy!,
        }
      : {}),
    evidence: [
      "fundedScoreProtectionKnown:true",
      `scoreReserveCredits:${reserve.totalCredits}`,
      `hardClickReserve:${reserve.hardClickReserve}`,
      `availableRezCredits:${availableRezCredits}`,
      `selectedRezCost:${best.totalRezCost}`,
      `selectedRezAgendaPointCost:${best.totalAgendaPointCost}`,
      `creditsAfterDefense:${creditsAfterDefense}`,
      `agendaPointsAfterDefense:${agendaPointsAfterDefense}`,
      `clicksAfterDefense:${clicksAfterDefense}`,
      `preservesScoreCreditReserve:${preservesScoreCreditReserve}`,
      `preservesHardClickReserve:${preservesHardClickReserve}`,
      `fundedProtection:${fundedProtection}`,
      ...(minimumSatisfying !== undefined
        ? [
            `minimumSatisfyingRezCost:${minimumSatisfying.totalRezCost}`,
            `minimumSatisfyingRezCostCount:${minimumSatisfying.selectedRezCosts.length}`,
            `minimumAdditionalCreditsToSatisfy:${minimumAdditionalCreditsToSatisfy}`,
            `minimumAdditionalClicksToSatisfy:${minimumAdditionalClicksToSatisfy}`,
          ]
        : []),
      `unknownSubsetCount:${unknownSubsetCount}`,
      ...[...unknownSubsetReasons]
        .sort()
        .map((reason) => `unknownSubsetReason:${reason}`),
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
      [
        "fundedIceInstallRouteKnown:false",
        "sourceOwnershipOrDefinitionDrift:true",
      ],
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
    ...(input.runnerSetAside ? { runnerSetAside: input.runnerSetAside } : {}),
    ...(input.runnerMemoryUsed !== undefined
      ? { runnerMemoryUsed: input.runnerMemoryUsed }
      : {}),
    ...(input.runnerMemoryLimit !== undefined
      ? { runnerMemoryLimit: input.runnerMemoryLimit }
      : {}),
    runnerCredits: input.runnerCredits,
    targetServerId: need.targetServerId,
    observedAtStateVersion: input.currentStateVersion,
    availableCorpCredits: input.currentCorpCredits,
    availableCorpClicks: input.currentCorpClicks,
    availableCorpAgendaPoints: input.currentCorpAgendaPoints,
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
          ? [
              `baselineRecomputeUnknownReason:${recomputedBaseline.unknownReason}`,
            ]
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
  const projectedEffectiveRunQuote =
    projectedRezQuote.quote.costKind === "fixed"
      ? readPostInstallEffectiveRunQuote(
          action,
          sourceCard.instanceId,
          sourceCard.definitionId,
          need.targetServerId,
          input.currentStateVersion,
        )
      : undefined;
  if (projectedEffectiveRunQuote?.status === "unknown") {
    return unknownRoute(
      {
        ...base,
        sourceCardInstanceId: sourceCard.instanceId,
        sourceDefinitionId: sourceCard.definitionId,
        targetServerId,
      },
      projectedEffectiveRunQuote.reason,
      [
        "fundedIceInstallRouteKnown:false",
        `postInstallEffectiveRunQuoteReason:${projectedEffectiveRunQuote.reason}`,
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
    ...(projectedEffectiveRunQuote?.status === "known"
      ? { effectiveRunQuote: projectedEffectiveRunQuote.quote }
      : sourceCard.effectiveRunQuote
        ? { effectiveRunQuote: sourceCard.effectiveRunQuote }
        : {}),
    effectiveRezCostQuote: projectedRezQuote.quote,
  };
  const after = assessBestFundedCorpScoreProtection({
    serverIce: [...currentIce, projectedSource],
    postInstallQuoteCardId: sourceCard.instanceId,
    ...(input.preferPostInstallSourceProgress === true
      ? { preferPostInstallSourceProgress: true }
      : {}),
    runnerRig: input.runnerRig,
    ...(input.runnerSetAside ? { runnerSetAside: input.runnerSetAside } : {}),
    ...(input.runnerMemoryUsed !== undefined
      ? { runnerMemoryUsed: input.runnerMemoryUsed }
      : {}),
    ...(input.runnerMemoryLimit !== undefined
      ? { runnerMemoryLimit: input.runnerMemoryLimit }
      : {}),
    runnerCredits: input.runnerCredits,
    targetServerId: need.targetServerId,
    observedAtStateVersion: input.currentStateVersion,
    availableCorpCredits: creditsAfterInstall,
    availableCorpClicks: clicksAfterInstall,
    availableCorpAgendaPoints: input.currentCorpAgendaPoints,
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
  const runnerCreditTaxProgress =
    after.protection.runnerCreditsRemainingOnBestAccessPath <
    need.baseline.protection.runnerCreditsRemainingOnBestAccessPath;
  const effect = !preservesReserves
    ? "no_progress"
    : after.fundedProtection && !need.baseline.fundedProtection
      ? "satisfied"
      : probabilityComparison < 0 || runnerCreditTaxProgress
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
      `runnerCreditsRemainingBefore:${need.baseline.protection.runnerCreditsRemainingOnBestAccessPath}`,
      `runnerCreditsRemainingAfter:${after.protection.runnerCreditsRemainingOnBestAccessPath}`,
      `runnerCreditTaxProgress:${runnerCreditTaxProgress}`,
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
  const options = fundedRezOptionsForQuote(ice, quote);
  if (!options) {
    return {
      status: "unknown",
      reason:
        quote.costKind === "variable"
          ? "unsupported_variable_rez_effect"
          : "rez_cost_quote_drift",
    };
  }
  return {
    status: "known",
    definitionId: ice.definitionId,
    options,
  };
}

function fundedRezOptionsForQuote(
  ice: CorpFundedScoreProtectionIceInput,
  quote: Extract<VisibleCorpRezCostQuote, { complete: true }>,
): readonly CertifiedFundedRezOption[] | undefined {
  if (quote.costKind === "fixed") {
    return [
      {
        finalCredits: quote.finalCredits,
        mandatoryAgendaPoints: quote.mandatoryAdditionalCosts.agendaPoints,
        projectedIce: ice,
      },
    ];
  }
  const definition = ice.definitionId
    ? CARD_DEFINITIONS_BY_ID[ice.definitionId]
    : undefined;
  const parameter = quote.variableParameter;
  if (
    !definition ||
    definition.type !== "ice" ||
    !sameCanonicalStrings(ice.subtypes, definition.subtypes)
  ) {
    return undefined;
  }
  if (parameter.kind === "x_strength") {
    if (
      definition.strengthModel.kind !== "paid_x" ||
      definition.strengthModel.minimumStrength !== parameter.minValue ||
      definition.strengthModel.maximumStrength !== parameter.maxValue ||
      !positiveSafeInteger(parameter.additionalCreditsPerValue) ||
      !nonNegativeSafeInteger(parameter.minValue) ||
      !nonNegativeSafeInteger(parameter.maxValue) ||
      parameter.minValue > parameter.maxValue ||
      parameter.minValueFinalCredits !==
        safeVariableCreditTotal(
          quote.finalCredits,
          parameter.minValue,
          parameter.additionalCreditsPerValue,
        ) ||
      parameter.maxValueFinalCredits !==
        safeVariableCreditTotal(
          quote.finalCredits,
          parameter.maxValue,
          parameter.additionalCreditsPerValue,
        ) ||
      parameter.effectiveStrengthFromValue !== true ||
      parameter.traceLimitFromValue !== true
    ) {
      return undefined;
    }
    // A variable trace can end the run, but this direct-access model cannot
    // yet prove the cheapest Runner response across breaking and bidding.
    // Excluding this optional unrezzed ICE is a conservative known lower
    // bound: it never credits the server with protection the model cannot
    // certify, while other exact ICE on the same server remain assessable.
    return [];
  }
  if (
    !nonNegativeSafeInteger(definition.strength) ||
    ice.strength !== definition.strength
  ) {
    return undefined;
  }
  if (parameter.kind === "paid_end_the_run_subroutines") {
    if (
      !positiveSafeInteger(parameter.additionalCreditsPerSubroutine) ||
      !nonNegativeSafeInteger(parameter.minSubroutines) ||
      parameter.minSubroutinesFinalCredits !==
        safeVariableCreditTotal(
          quote.finalCredits,
          parameter.minSubroutines,
          parameter.additionalCreditsPerSubroutine,
        ) ||
      parameter.firstEndTheRunSubroutineCount !==
        Math.max(1, parameter.minSubroutines) ||
      parameter.firstEndTheRunFinalCredits !==
        safeVariableCreditTotal(
          quote.finalCredits,
          parameter.firstEndTheRunSubroutineCount,
          parameter.additionalCreditsPerSubroutine,
        )
    ) {
      return undefined;
    }
    const effectiveRunQuote: VisibleEffectiveIceRunQuote = {
      iceInstanceId: ice.instanceId,
      iceDefinitionId: definition.id,
      effectiveStrength: definition.strength,
      subroutines: Array.from(
        { length: parameter.firstEndTheRunSubroutineCount },
        (_, index) => ({
          id: `${definition.id}_variable_etr_${index + 1}`,
          type: "end_the_run" as const,
        }),
      ),
    };
    return [
      {
        finalCredits: parameter.firstEndTheRunFinalCredits,
        mandatoryAgendaPoints: quote.mandatoryAdditionalCosts.agendaPoints,
        projectedIce: { ...ice, effectiveRunQuote },
        variableRezChoice: {
          kind: "paid_end_the_run_subroutines",
          subroutineCount: parameter.firstEndTheRunSubroutineCount,
        },
      },
    ];
  }
  if (
    !canonicalSubtypeArray(parameter.baseSubtypes) ||
    !canonicalSubtypeArray(parameter.alternateSubtypes) ||
    !sameCanonicalStrings(ice.subtypes, parameter.baseSubtypes) ||
    parameter.baseSubtypesFinalCredits !== quote.finalCredits ||
    parameter.alternateSubtypesFinalCredits !==
      safeVariableCreditTotal(
        quote.finalCredits,
        1,
        parameter.alternateSubtypesAdditionalCredits,
      )
  ) {
    return undefined;
  }
  const subroutines = (definition.subroutines ?? []).map((subroutine) => ({
    ...subroutine,
  }));
  return [
    {
      finalCredits: parameter.baseSubtypesFinalCredits,
      mandatoryAgendaPoints: quote.mandatoryAdditionalCosts.agendaPoints,
      projectedIce: ice,
      variableRezChoice: {
        kind: "alternate_subtype",
        selectedSubtypes: parameter.baseSubtypes.slice(),
      },
    },
    {
      finalCredits: parameter.alternateSubtypesFinalCredits,
      mandatoryAgendaPoints: quote.mandatoryAdditionalCosts.agendaPoints,
      projectedIce: {
        ...ice,
        subtypes: parameter.alternateSubtypes.slice(),
        effectiveRunQuote: {
          iceInstanceId: ice.instanceId,
          iceDefinitionId: definition.id,
          effectiveStrength: definition.strength,
          subroutines,
        },
      },
      variableRezChoice: {
        kind: "alternate_subtype",
        selectedSubtypes: parameter.alternateSubtypes.slice(),
      },
    },
  ];
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
  const costKind = payload.postInstallRezQuoteCostKind;
  const baseCredits = payload.postInstallRezQuoteBaseCredits;
  const finalCredits = payload.postInstallRezQuoteFinalCredits;
  const mandatoryAgendaPointCost =
    payload.postInstallRezQuoteMandatoryAgendaPointCost;
  const mandatoryKind = payload.postInstallRezQuoteMandatoryAdditionalCostKind;
  const reductionSourceDefinitionIds = commaSeparatedIds(
    payload.postInstallRezQuoteReductionSourceDefinitionIds,
  );
  const increaseSourceDefinitionIds = commaSeparatedIds(
    payload.postInstallRezQuoteIncreaseSourceDefinitionIds,
  );
  const variableParameter =
    costKind === "variable"
      ? postInstallVariableRezParameter(payload, finalCredits)
      : undefined;
  if (
    payload.postInstallRezQuoteCardId !== sourceCardInstanceId ||
    payload.postInstallRezQuoteTargetServerId !== targetServerId ||
    !validTargetProjectedServerBinding(targetServerId, projectedServerId) ||
    payload.postInstallRezQuoteExpiresAtStateVersion !==
      observedAtStateVersion ||
    !nonNegativeSafeInteger(baseCredits) ||
    !nonNegativeSafeInteger(finalCredits) ||
    (costKind !== "fixed" && costKind !== "variable") ||
    (costKind === "variable" && variableParameter === undefined) ||
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
  return {
    status: "known",
    quote: {
      context: "post_install",
      cardId: sourceCardInstanceId,
      targetServerId,
      projectedServerId,
      expiresAtStateVersion: observedAtStateVersion,
      complete: true,
      ...(costKind === "variable"
        ? {
            costKind: "variable" as const,
            variableParameter: variableParameter!,
          }
        : { costKind: "fixed" as const }),
      baseCredits,
      finalCredits,
      mandatoryAdditionalCosts: { agendaPoints: mandatoryAgendaPointCost },
      ...(reductionSourceDefinitionIds.length > 0
        ? { reductionSourceDefinitionIds }
        : {}),
      ...(increaseSourceDefinitionIds.length > 0
        ? { increaseSourceDefinitionIds }
        : {}),
    },
  };
}

function readPostInstallEffectiveRunQuote(
  action: LegalAction,
  sourceCardInstanceId: string,
  sourceDefinitionId: string,
  targetServerId: VisibleCorpRezCostQuote["targetServerId"],
  observedAtStateVersion: number,
): PostInstallEffectiveRunQuoteRead | undefined {
  const payload = action.payload ?? {};
  const json = payload.postInstallEffectiveRunQuoteJson;
  if (typeof json !== "string") {
    return undefined;
  }
  if (
    payload.postInstallRezQuoteCardId !== sourceCardInstanceId ||
    payload.postInstallRezQuoteTargetServerId !== targetServerId ||
    payload.postInstallRezQuoteExpiresAtStateVersion !== observedAtStateVersion
  ) {
    return {
      status: "unknown",
      reason: "post_install_effective_run_quote_drift",
    };
  }
  try {
    const quote = JSON.parse(json) as Partial<VisibleEffectiveIceRunQuote>;
    if (
      quote.iceInstanceId !== sourceCardInstanceId ||
      quote.iceDefinitionId !== sourceDefinitionId ||
      !Number.isFinite(quote.effectiveStrength) ||
      !Array.isArray(quote.subroutines) ||
      !quote.subroutines.every(
        (subroutine) =>
          subroutine !== null &&
          typeof subroutine === "object" &&
          typeof subroutine.id === "string" &&
          typeof subroutine.type === "string",
      )
    ) {
      return {
        status: "unknown",
        reason: "post_install_effective_run_quote_drift",
      };
    }
    return { status: "known", quote: quote as VisibleEffectiveIceRunQuote };
  } catch {
    return {
      status: "unknown",
      reason: "post_install_effective_run_quote_drift",
    };
  }
}

function postInstallVariableRezParameter(
  payload: NonNullable<LegalAction["payload"]>,
  finalBaseCredits: unknown,
): VisibleVariableCorpRezCostParameter | undefined {
  if (!nonNegativeSafeInteger(finalBaseCredits)) return undefined;
  const kind = payload.postInstallRezQuoteVariableRezKind;
  if (kind === "x_strength") {
    const additionalCreditsPerValue =
      payload.postInstallRezQuoteVariableAdditionalCreditsPerValue;
    const minValue = payload.postInstallRezQuoteVariableMinValue;
    const maxValue = payload.postInstallRezQuoteVariableMaxValue;
    const minValueFinalCredits =
      payload.postInstallRezQuoteVariableMinValueFinalCredits;
    const maxValueFinalCredits =
      payload.postInstallRezQuoteVariableMaxValueFinalCredits;
    if (
      !positiveSafeInteger(additionalCreditsPerValue) ||
      !nonNegativeSafeInteger(minValue) ||
      !nonNegativeSafeInteger(maxValue) ||
      maxValue < minValue ||
      !nonNegativeSafeInteger(minValueFinalCredits) ||
      !nonNegativeSafeInteger(maxValueFinalCredits) ||
      minValueFinalCredits !==
        safeVariableCreditTotal(
          finalBaseCredits,
          minValue,
          additionalCreditsPerValue,
        ) ||
      maxValueFinalCredits !==
        safeVariableCreditTotal(
          finalBaseCredits,
          maxValue,
          additionalCreditsPerValue,
        ) ||
      payload.postInstallRezQuoteVariableEffectiveStrengthFromValue !== true ||
      !optionalTrueValue(payload.postInstallRezQuoteVariableTraceLimitFromValue)
    ) {
      return undefined;
    }
    return {
      kind,
      additionalCreditsPerValue,
      minValue,
      maxValue,
      minValueFinalCredits,
      maxValueFinalCredits,
      effectiveStrengthFromValue: true,
      ...(payload.postInstallRezQuoteVariableTraceLimitFromValue === true
        ? { traceLimitFromValue: true }
        : {}),
    };
  }
  if (kind === "paid_end_the_run_subroutines") {
    const additionalCreditsPerSubroutine =
      payload.postInstallRezQuoteVariableAdditionalCreditsPerSubroutine;
    const minSubroutines = payload.postInstallRezQuoteVariableMinSubroutines;
    const minSubroutinesFinalCredits =
      payload.postInstallRezQuoteVariableMinSubroutinesFinalCredits;
    const firstEndTheRunSubroutineCount =
      payload.postInstallRezQuoteVariableFirstEndTheRunSubroutineCount;
    const firstEndTheRunFinalCredits =
      payload.postInstallRezQuoteVariableFirstEndTheRunFinalCredits;
    if (
      !positiveSafeInteger(additionalCreditsPerSubroutine) ||
      !nonNegativeSafeInteger(minSubroutines) ||
      !nonNegativeSafeInteger(minSubroutinesFinalCredits) ||
      !nonNegativeSafeInteger(firstEndTheRunSubroutineCount) ||
      !nonNegativeSafeInteger(firstEndTheRunFinalCredits) ||
      firstEndTheRunSubroutineCount !== Math.max(1, minSubroutines) ||
      minSubroutinesFinalCredits !==
        safeVariableCreditTotal(
          finalBaseCredits,
          minSubroutines,
          additionalCreditsPerSubroutine,
        ) ||
      firstEndTheRunFinalCredits !==
        safeVariableCreditTotal(
          finalBaseCredits,
          firstEndTheRunSubroutineCount,
          additionalCreditsPerSubroutine,
        )
    ) {
      return undefined;
    }
    return {
      kind,
      additionalCreditsPerSubroutine,
      minSubroutines,
      minSubroutinesFinalCredits,
      firstEndTheRunSubroutineCount,
      firstEndTheRunFinalCredits,
    };
  }
  if (kind !== "alternate_subtype") return undefined;
  const baseSubtypes = canonicalCommaSeparatedSubtypes(
    payload.postInstallRezQuoteVariableBaseSubtypes,
  );
  const alternateSubtypes = canonicalCommaSeparatedSubtypes(
    payload.postInstallRezQuoteVariableAlternateSubtypes,
  );
  const baseSubtypesFinalCredits =
    payload.postInstallRezQuoteVariableBaseSubtypesFinalCredits;
  const alternateSubtypesAdditionalCredits =
    payload.postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits;
  const alternateSubtypesFinalCredits =
    payload.postInstallRezQuoteVariableAlternateSubtypesFinalCredits;
  if (
    !baseSubtypes ||
    !alternateSubtypes ||
    baseSubtypes.join(",") === alternateSubtypes.join(",") ||
    baseSubtypesFinalCredits !== finalBaseCredits ||
    !positiveSafeInteger(alternateSubtypesAdditionalCredits) ||
    !nonNegativeSafeInteger(alternateSubtypesFinalCredits) ||
    alternateSubtypesFinalCredits !==
      safeVariableCreditTotal(
        finalBaseCredits,
        1,
        alternateSubtypesAdditionalCredits,
      )
  ) {
    return undefined;
  }
  return {
    kind,
    baseSubtypes,
    baseSubtypesFinalCredits,
    alternateSubtypes,
    alternateSubtypesAdditionalCredits,
    alternateSubtypesFinalCredits,
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

function canonicalCommaSeparatedSubtypes(value: unknown): string[] | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  const subtypes = value.split(",");
  return subtypes.every(
    (subtype, index) =>
      /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(subtype) &&
      (index === 0 || subtypes[index - 1]! < subtype),
  )
    ? subtypes
    : undefined;
}

function canonicalSubtypeArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (subtype, index) =>
        typeof subtype === "string" &&
        /^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(subtype) &&
        (index === 0 || value[index - 1]! < subtype),
    )
  );
}

function sameCanonicalStrings(
  left: readonly string[] | undefined,
  right: readonly string[] | undefined,
): boolean {
  if (!left || !right || left.length !== right.length) return false;
  const sortedLeft = [...left].sort(compareTechnicalStrings);
  const sortedRight = [...right].sort(compareTechnicalStrings);
  return sortedLeft.every((value, index) => value === sortedRight[index]);
}

function positiveSafeInteger(value: unknown): value is number {
  return nonNegativeSafeInteger(value) && value > 0;
}

function safeVariableCreditTotal(
  baseCredits: number,
  quantity: number,
  creditsPerUnit: number,
): number | undefined {
  const additionalCredits = quantity * creditsPerUnit;
  const totalCredits = baseCredits + additionalCredits;
  return nonNegativeSafeInteger(additionalCredits) &&
    nonNegativeSafeInteger(totalCredits)
    ? totalCredits
    : undefined;
}

function optionalTrueValue(value: unknown): boolean {
  return value === undefined || value === true;
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
  const groups = rezCandidateGroups(candidates);
  const selections: RezCandidate[][] = [];
  const visit = (index: number, selected: RezCandidate[]): void => {
    if (index >= groups.length) {
      selections.push(selected.slice());
      return;
    }
    visit(index + 1, selected);
    for (const option of groups[index]!) {
      selected.push(option);
      visit(index + 1, selected);
      selected.pop();
    }
  };
  visit(0, []);
  return selections;
}

function exactRezSelectionCount(candidates: readonly RezCandidate[]): number {
  let count = 1;
  for (const group of rezCandidateGroups(candidates)) {
    count *= group.length + 1;
    if (!Number.isSafeInteger(count)) return Number.POSITIVE_INFINITY;
  }
  return count;
}

function rezCandidateGroups(
  candidates: readonly RezCandidate[],
): RezCandidate[][] {
  const groups = new Map<string, RezCandidate[]>();
  for (const candidate of candidates) {
    const group = groups.get(candidate.ice.instanceId) ?? [];
    group.push(candidate);
    groups.set(candidate.ice.instanceId, group);
  }
  return [...groups.values()];
}

function compareSatisfyingAssessments(
  left: EnumeratedAssessment,
  right: EnumeratedAssessment,
): number {
  return satisfyingAssessmentIsBetter(left, right)
    ? -1
    : satisfyingAssessmentIsBetter(right, left)
      ? 1
      : 0;
}

function compareProgressAssessments(
  left: EnumeratedAssessment,
  right: EnumeratedAssessment,
): number {
  return progressAssessmentIsBetter(left, right)
    ? -1
    : progressAssessmentIsBetter(right, left)
      ? 1
      : 0;
}

function satisfyingAssessmentIsBetter(
  candidate: EnumeratedAssessment,
  current: EnumeratedAssessment,
): boolean {
  if (candidate.totalAgendaPointCost !== current.totalAgendaPointCost) {
    return candidate.totalAgendaPointCost < current.totalAgendaPointCost;
  }
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
  if (
    candidate.protection.runnerCreditsRemainingOnBestAccessPath !==
    current.protection.runnerCreditsRemainingOnBestAccessPath
  ) {
    return (
      candidate.protection.runnerCreditsRemainingOnBestAccessPath <
      current.protection.runnerCreditsRemainingOnBestAccessPath
    );
  }
  if (candidate.totalAgendaPointCost !== current.totalAgendaPointCost) {
    return candidate.totalAgendaPointCost < current.totalAgendaPointCost;
  }
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
      .map((cost) => ({
        iceInstanceId: cost.iceInstanceId,
        credits: cost.credits,
        agendaPoints: cost.agendaPoints ?? 0,
        variableRezChoice: cost.variableRezChoice,
      }))
      .map((cost) => JSON.stringify(cost))
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
    availableCorpAgendaPoints: input.availableCorpAgendaPoints,
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
