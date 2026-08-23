import type { ExactProbability } from "./corp-score-protection-assessment";
import type { RemoteProtectionTarget } from "../remote-doctrine-profile";
import type {
  KnownRezzedIcePathAssessment,
  RunnerRunPathCreditBudget,
} from "../run-analysis/visible-run-analysis-contracts";
import { normalizeRunnerRunPathCreditBudget } from "../run-analysis/visible-run-credit-budget";
import type { VisibleCard } from "@netgrid/shared";
import { assessEngineCertifiedPostRezIcePath } from "../visible-run-analysis";
import {
  selectCorpFundedAndStagedProtectionRoutes,
  type CorpProtectionObjective,
} from "./corp-funded-score-protection";

export const CORP_REMOTE_PROTECTION_POLICY_VERSION =
  "corp-remote-protection-v1" as const;

export type CorpRemotePathQuote = Readonly<{
  accessStatus: "blocked" | "reachable" | "conditional" | "unknown";
  exactAccessProbability?: ExactProbability;
  generalCreditsBefore: number;
  generalCreditsAfter: number;
  generalCreditTax: number;
  restrictedCreditsSpent: Readonly<{
    breaker: number;
    stealth: number;
    hosted: number;
    other: number;
  }>;
  futureClicksLost: number;
  hazards: Readonly<{
    unavoidableDamage: number;
    expectedTags: number;
    programTrashPressure: boolean;
    runLockOrActionTax: boolean;
    preventsFutureBreaking: boolean;
  }>;
  conditionalAccessReasons: readonly string[];
  conditionalRiskReasons: readonly string[];
}>;

export type CorpRemoteMaturityAssessment =
  | Readonly<{
      knowledge: "unknown";
      observedAtStateVersion: number;
      unknownReasons: readonly string[];
    }>
  | Readonly<{
      knowledge: "known";
      observedAtStateVersion: number;
      policyVersion: typeof CORP_REMOTE_PROTECTION_POLICY_VERSION;
      fundedPath: CorpRemotePathQuote;
      stagedPath: CorpRemotePathQuote;
      targetBand: RemoteProtectionTarget;
      fundedTargetReached: boolean;
      stagedTargetReached: boolean;
      selectedFundedRezIceIds: readonly string[];
      minimumSatisfyingStagedIceIds: readonly string[];
      minimumRezFundingGap?: number;
    }>;

export type CorpRemoteMaturityPathInput = Readonly<{
  assessment: KnownRezzedIcePathAssessment;
  expectedKnownIceCount: number;
  runnerCreditBudgetBefore: RunnerRunPathCreditBudget;
  exactAccessProbability?: ExactProbability;
}>;

export function assessCorpRemoteMaturity(
  params: Readonly<{
    observedAtStateVersion: number;
    targetBand: RemoteProtectionTarget;
    funded: CorpRemoteMaturityPathInput;
    staged: CorpRemoteMaturityPathInput;
    selectedFundedRezIceIds: readonly string[];
    minimumSatisfyingStagedIceIds: readonly string[];
    minimumRezFundingGap?: number;
  }>,
): CorpRemoteMaturityAssessment {
  if (
    !Number.isSafeInteger(params.observedAtStateVersion) ||
    params.observedAtStateVersion < 0
  ) {
    return unknown(params.observedAtStateVersion, ["invalid_state_version"]);
  }
  const fundedPath = quotePath(params.funded);
  const stagedPath = quotePath(params.staged);
  const unknownReasons = [
    ...(fundedPath.accessStatus === "unknown"
      ? ["funded_path_assessment_unknown"]
      : []),
    ...(stagedPath.accessStatus === "unknown"
      ? ["staged_path_assessment_unknown"]
      : []),
  ];
  if (unknownReasons.length > 0) {
    return unknown(params.observedAtStateVersion, unknownReasons);
  }
  return {
    knowledge: "known",
    observedAtStateVersion: params.observedAtStateVersion,
    policyVersion: CORP_REMOTE_PROTECTION_POLICY_VERSION,
    fundedPath,
    stagedPath,
    targetBand: params.targetBand,
    fundedTargetReached: remotePathMeetsProtectionTarget(
      fundedPath,
      params.targetBand,
    ),
    stagedTargetReached: remotePathMeetsProtectionTarget(
      stagedPath,
      params.targetBand,
    ),
    selectedFundedRezIceIds: uniqueIds(params.selectedFundedRezIceIds),
    minimumSatisfyingStagedIceIds: uniqueIds(
      params.minimumSatisfyingStagedIceIds,
    ),
    ...(params.minimumRezFundingGap !== undefined
      ? { minimumRezFundingGap: Math.max(0, params.minimumRezFundingGap) }
      : {}),
  };
}

export function assessCorpRemoteMaturityFromVisibleServer(
  params: Readonly<{
    observedAtStateVersion: number;
    targetServerId: string;
    targetBand: RemoteProtectionTarget;
    serverIce: readonly VisibleCard[];
    serverRoot?: readonly VisibleCard[];
    runnerRig: readonly VisibleCard[];
    runnerCreditBudget: RunnerRunPathCreditBudget;
    availableCorpRezCredits: number;
    visibleCorpBidCapacity?: number;
  }>,
): CorpRemoteMaturityAssessment {
  const objective: Extract<
    CorpProtectionObjective,
    { kind: "remote_protection_band" }
  > = {
    kind: "remote_protection_band",
    targetBand: params.targetBand,
    policyVersion: CORP_REMOTE_PROTECTION_POLICY_VERSION,
  };
  const missingRezzedRunQuote = params.serverIce.some((ice) => {
    if (ice.rezzed !== true || !ice.known) return false;
    const quote = ice.effectiveRunQuote;
    return (
      !quote ||
      quote.iceInstanceId !== ice.instanceId ||
      quote.iceDefinitionId !== ice.definitionId
    );
  });
  if (missingRezzedRunQuote) {
    return unknown(params.observedAtStateVersion, [
      "complete_rezzed_run_quote_required",
    ]);
  }
  const rezzedIds = params.serverIce
    .filter((ice) => ice.rezzed === true)
    .map((ice) => ice.instanceId);
  const candidates = params.serverIce.filter((ice) => ice.rezzed !== true);
  if (candidates.length > 12) {
    return unknown(params.observedAtStateVersion, [
      "rez_search_space_exceeded",
    ]);
  }
  const quotedCandidates = candidates.flatMap((ice) => {
    const quote = ice.effectiveRezCostQuote;
    const runQuote = ice.effectivePostRezRunQuote;
    const known =
      quote?.context === "installed" &&
      quote.complete === true &&
      quote.cardId === ice.instanceId &&
      quote.targetServerId === params.targetServerId &&
      quote.projectedServerId === params.targetServerId &&
      quote.expiresAtStateVersion === params.observedAtStateVersion &&
      quote.mandatoryAdditionalCosts.agendaPoints === 0 &&
      Number.isSafeInteger(quote.finalCredits) &&
      quote.finalCredits >= 0 &&
      runQuote?.context === "installed_post_rez" &&
      runQuote.complete === true &&
      runQuote.cardId === ice.instanceId &&
      runQuote.targetServerId === params.targetServerId &&
      runQuote.projectedServerId === params.targetServerId &&
      runQuote.expiresAtStateVersion === params.observedAtStateVersion;
    return known ? [{ ice, rezCredits: quote.finalCredits }] : [];
  });
  const routes: Array<{
    ids: string[];
    cost: number;
    quote: CorpRemotePathQuote;
    reachesTarget: boolean;
  }> = [];
  for (let mask = 0; mask < 2 ** quotedCandidates.length; mask += 1) {
    const selected = quotedCandidates.filter((_, index) =>
      Boolean(mask & (1 << index)),
    );
    const ids = [...rezzedIds, ...selected.map(({ ice }) => ice.instanceId)];
    const cost = selected.reduce((sum, entry) => sum + entry.rezCredits, 0);
    const assessment = assessEngineCertifiedPostRezIcePath(
      [...params.serverIce],
      params.targetServerId,
      params.observedAtStateVersion,
      new Set(ids),
      [...params.runnerRig],
      params.runnerCreditBudget,
      [...(params.serverRoot ?? [])],
      params.visibleCorpBidCapacity ?? 0,
    );
    const quote = quotePath({
      assessment,
      expectedKnownIceCount: ids.length,
      runnerCreditBudgetBefore: params.runnerCreditBudget,
    });
    if (quote.accessStatus === "unknown") continue;
    routes.push({
      ids: ids.sort(),
      cost,
      quote,
      reachesTarget: remotePathMeetsProtectionTarget(
        quote,
        objective.targetBand,
      ),
    });
  }
  if (routes.length === 0) {
    return unknown(params.observedAtStateVersion, [
      "all_rez_subset_path_assessments_unknown",
    ]);
  }
  const selectedRoutes = selectCorpFundedAndStagedProtectionRoutes({
    routes,
    availableRezCredits: Math.max(0, params.availableCorpRezCredits),
    totalRezCost: (route) => route.cost,
    satisfiesObjective: (route) => route.reachesTarget,
    compareSatisfying: compareMinimumRemoteRoutes,
    compareProgress: compareRemoteRoutes,
  });
  const funded = selectedRoutes.funded;
  const staged = selectedRoutes.staged;
  const minimumSatisfying = selectedRoutes.minimumSatisfying;
  if (!funded || !staged) {
    return unknown(params.observedAtStateVersion, [
      "funded_or_staged_route_selection_unknown",
    ]);
  }
  return {
    knowledge: "known",
    observedAtStateVersion: params.observedAtStateVersion,
    policyVersion: CORP_REMOTE_PROTECTION_POLICY_VERSION,
    fundedPath: funded.quote,
    stagedPath: staged.quote,
    targetBand: objective.targetBand,
    fundedTargetReached: funded.reachesTarget,
    stagedTargetReached: staged.reachesTarget,
    selectedFundedRezIceIds: funded.ids,
    minimumSatisfyingStagedIceIds: minimumSatisfying?.ids ?? [],
    ...(minimumSatisfying
      ? {
          minimumRezFundingGap: Math.max(
            0,
            minimumSatisfying.cost - params.availableCorpRezCredits,
          ),
        }
      : {}),
  };
}

export function quoteCorpRemotePath(
  input: CorpRemoteMaturityPathInput,
): CorpRemotePathQuote {
  return quotePath(input);
}

export function remotePathMeetsProtectionTarget(
  path: CorpRemotePathQuote,
  targetBand: RemoteProtectionTarget,
): boolean {
  if (targetBand === "none") return true;
  if (path.accessStatus === "unknown" || path.accessStatus === "conditional") {
    return false;
  }
  if (path.accessStatus === "blocked") return true;
  const threshold = protectionThreshold(targetBand, path.generalCreditsBefore);
  if (path.generalCreditTax >= threshold) return true;
  const hazard = path.hazards;
  switch (targetBand) {
    case "light":
      return (
        path.generalCreditTax > 0 ||
        restrictedSpend(path) >= 2 ||
        hazard.unavoidableDamage > 0 ||
        hazard.expectedTags > 0 ||
        hazard.programTrashPressure ||
        hazard.runLockOrActionTax ||
        hazard.preventsFutureBreaking
      );
    case "score_window":
      return (
        hazard.unavoidableDamage >= 2 ||
        hazard.expectedTags >= 2 ||
        hazard.programTrashPressure ||
        hazard.preventsFutureBreaking
      );
    case "taxing":
      return (
        hazard.unavoidableDamage >= 3 ||
        hazard.expectedTags >= 3 ||
        (hazard.programTrashPressure && hazard.runLockOrActionTax) ||
        (hazard.preventsFutureBreaking && restrictedSpend(path) >= 3)
      );
    case "glacier":
      return (
        hazard.unavoidableDamage >= 4 ||
        hazard.expectedTags >= 4 ||
        (hazard.programTrashPressure && hazard.preventsFutureBreaking) ||
        (hazard.runLockOrActionTax && restrictedSpend(path) >= 5)
      );
  }
}

export function remoteProtectionPathImproves(
  before: CorpRemotePathQuote,
  after: CorpRemotePathQuote,
): boolean {
  if (before.accessStatus === "unknown" || after.accessStatus === "unknown") {
    return false;
  }
  const accessRank = (quote: CorpRemotePathQuote): number =>
    quote.accessStatus === "blocked"
      ? 3
      : quote.accessStatus === "conditional"
        ? 2
        : quote.accessStatus === "reachable"
          ? 1
          : 0;
  return (
    accessRank(after) > accessRank(before) ||
    after.generalCreditTax > before.generalCreditTax ||
    restrictedSpend(after) > restrictedSpend(before) ||
    remoteHazardWeight(after) > remoteHazardWeight(before)
  );
}

export function requiredGeneralCreditTax(
  targetBand: RemoteProtectionTarget,
  visibleGeneralRunnerCredits: number,
): number {
  return protectionThreshold(targetBand, visibleGeneralRunnerCredits);
}

function quotePath(input: CorpRemoteMaturityPathInput): CorpRemotePathQuote {
  const before = normalizeRunnerRunPathCreditBudget(
    input.runnerCreditBudgetBefore,
  );
  const after = input.assessment.creditBudgetAfterPath;
  const incomplete =
    input.assessment.assessedKnownIceCount !== input.expectedKnownIceCount ||
    (!input.assessment.blocked && after === undefined);
  const conditionalAccessReasons = [
    ...(input.assessment.conditionalAccessReasons ?? []),
  ].sort();
  const conditionalRiskReasons = [
    ...(input.assessment.conditionalRiskReasons ?? []),
  ].sort();
  const accessStatus = incomplete
    ? "unknown"
    : input.assessment.blocked || !input.assessment.canReachAccess
      ? "blocked"
      : conditionalAccessReasons.length > 0 || conditionalRiskReasons.length > 0
        ? "conditional"
        : "reachable";
  const normalizedAfter = after
    ? normalizeRunnerRunPathCreditBudget(after)
    : before;
  const visibleHazards = input.assessment.visibleIceRunHazards ?? [];
  const hardEffects = input.assessment.hardUnbrokenRunEffects ?? [];
  return {
    accessStatus,
    ...(input.exactAccessProbability && accessStatus !== "unknown"
      ? { exactAccessProbability: input.exactAccessProbability }
      : {}),
    generalCreditsBefore: before.credits,
    generalCreditsAfter: normalizedAfter.credits,
    generalCreditTax: Math.max(0, before.credits - normalizedAfter.credits),
    restrictedCreditsSpent: {
      breaker: spent(
        before.icebreakerCredits,
        normalizedAfter.icebreakerCredits,
      ),
      stealth: spent(
        before.stealthNonNoisyIcebreakerCredits,
        normalizedAfter.stealthNonNoisyIcebreakerCredits,
      ),
      hosted: spentRecord(
        before.hostedIcebreakerCreditsByBreakerInstanceId,
        normalizedAfter.hostedIcebreakerCreditsByBreakerInstanceId,
      ),
      other:
        spent(before.killerCredits, normalizedAfter.killerCredits) +
        spent(
          before.nonStealthNonNoisyIcebreakerCredits,
          normalizedAfter.nonStealthNonNoisyIcebreakerCredits,
        ),
    },
    futureClicksLost: input.assessment.futureClicksLost ?? 0,
    hazards: {
      unavoidableDamage: visibleHazards.reduce(
        (sum, hazard) =>
          sum + (hazard.unavoidable ? (hazard.expectedDamage ?? 0) : 0),
        0,
      ),
      expectedTags: visibleHazards.reduce(
        (sum, hazard) =>
          sum + (hazard.unavoidable ? (hazard.expectedTags ?? 0) : 0),
        0,
      ),
      programTrashPressure: visibleHazards.some(
        (hazard) => hazard.unavoidable && hazard.kind === "trace_trash",
      ),
      runLockOrActionTax:
        (input.assessment.futureClicksLost ?? 0) > 0 ||
        visibleHazards.some(
          (hazard) =>
            hazard.unavoidable &&
            (hazard.kind === "trace_run_lock" || (hazard.actionTax ?? 0) > 0),
        ),
      preventsFutureBreaking: input.assessment.preventsFutureBreaking === true,
    },
    conditionalAccessReasons,
    conditionalRiskReasons,
  };
}

function protectionThreshold(
  targetBand: RemoteProtectionTarget,
  visibleGeneralRunnerCredits: number,
): number {
  const credits = Math.max(0, Math.floor(visibleGeneralRunnerCredits));
  const policy =
    targetBand === "score_window"
      ? { share: 0.35, floor: 3 }
      : targetBand === "taxing"
        ? { share: 0.5, floor: 5 }
        : targetBand === "glacier"
          ? { share: 0.65, floor: 7 }
          : targetBand === "light"
            ? { share: 0, floor: 1 }
            : { share: 0, floor: 0 };
  return Math.min(
    credits,
    Math.max(policy.floor, Math.ceil(policy.share * credits)),
  );
}

function restrictedSpend(path: CorpRemotePathQuote): number {
  return Object.values(path.restrictedCreditsSpent).reduce(
    (sum, value) => sum + value,
    0,
  );
}

function compareRemoteRoutes(
  left: Readonly<{
    ids: readonly string[];
    cost: number;
    quote: CorpRemotePathQuote;
    reachesTarget: boolean;
  }>,
  right: Readonly<{
    ids: readonly string[];
    cost: number;
    quote: CorpRemotePathQuote;
    reachesTarget: boolean;
  }>,
): number {
  if (left.reachesTarget !== right.reachesTarget) {
    return left.reachesTarget ? -1 : 1;
  }
  const accessRank = (quote: CorpRemotePathQuote): number =>
    quote.accessStatus === "blocked"
      ? 3
      : quote.accessStatus === "conditional"
        ? 2
        : quote.accessStatus === "reachable"
          ? 1
          : 0;
  const accessComparison = accessRank(right.quote) - accessRank(left.quote);
  if (accessComparison !== 0) return accessComparison;
  const generalTaxComparison =
    right.quote.generalCreditTax - left.quote.generalCreditTax;
  if (generalTaxComparison !== 0) return generalTaxComparison;
  const hazardComparison =
    remoteHazardWeight(right.quote) - remoteHazardWeight(left.quote);
  if (hazardComparison !== 0) return hazardComparison;
  return (
    left.cost - right.cost ||
    left.ids.length - right.ids.length ||
    left.ids.join("|").localeCompare(right.ids.join("|"))
  );
}

function compareMinimumRemoteRoutes(
  left: Readonly<{ ids: readonly string[]; cost: number }>,
  right: Readonly<{ ids: readonly string[]; cost: number }>,
): number {
  return (
    left.cost - right.cost ||
    left.ids.length - right.ids.length ||
    left.ids.join("|").localeCompare(right.ids.join("|"))
  );
}

function remoteHazardWeight(path: CorpRemotePathQuote): number {
  return (
    path.hazards.unavoidableDamage * 4 +
    path.hazards.expectedTags * 3 +
    (path.hazards.programTrashPressure ? 8 : 0) +
    (path.hazards.runLockOrActionTax ? 6 : 0) +
    (path.hazards.preventsFutureBreaking ? 8 : 0) +
    path.futureClicksLost * 2 +
    restrictedSpend(path)
  );
}

function spent(before: number | undefined, after: number | undefined): number {
  return Math.max(0, (before ?? 0) - (after ?? 0));
}

function spentRecord(
  before: Readonly<Record<string, number>> | undefined,
  after: Readonly<Record<string, number>> | undefined,
): number {
  return Object.entries(before ?? {}).reduce(
    (sum, [key, amount]) => sum + spent(amount, after?.[key]),
    0,
  );
}

function uniqueIds(ids: readonly string[]): string[] {
  return [...new Set(ids.filter((id) => id.length > 0))].sort();
}

function unknown(
  observedAtStateVersion: number,
  unknownReasons: readonly string[],
): CorpRemoteMaturityAssessment {
  return {
    knowledge: "unknown",
    observedAtStateVersion,
    unknownReasons: [...new Set(unknownReasons)].sort(),
  };
}
