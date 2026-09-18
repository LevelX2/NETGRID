import type { AiDecisionInput, VisibleCorpRezCostQuote } from "@netgrid/shared";
import {
  CorpDefenseSignal,
  CorpGenericDefenseSignal,
  CorpScoreProtectionDrawSignal,
  CorpScoreProtectionInstallSignal,
  CorpScoreProtectionStagingInstallSignal,
  CorpTerminalProtectionInstallSignal,
} from "../../plans/corp-defense-contracts";
import { CorpScorePriorityClass } from "../../plans/corp-score-contracts";
import { PlanResolutionFailure } from "../../plans/plan-resolution-failure";
import type { PlanSchedulerContext } from "../../plans/plan-scheduler";
import { type KnownCorpFundedIceInstallRouteProjection } from "../../runtime/corp-funded-score-protection";
import { type ExactProbability } from "../../runtime/corp-score-protection-assessment";

export function selectedRezCostsAreUnique(
  costs: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
): boolean {
  return (
    costs.length > 0 &&
    new Set(costs.map((cost) => cost.iceInstanceId)).size === costs.length
  );
}

export function selectedRezCostSetsEqual(
  left: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
  right: KnownCorpFundedIceInstallRouteProjection["selectedRezCosts"],
): boolean {
  if (left.length !== right.length) return false;
  const rightByInstanceId = new Map(
    right.map((cost) => [cost.iceInstanceId, cost] as const),
  );
  return (
    rightByInstanceId.size === right.length &&
    left.every((cost) => {
      const matching = rightByInstanceId.get(cost.iceInstanceId);
      return (
        matching?.iceDefinitionId === cost.iceDefinitionId &&
        matching.credits === cost.credits &&
        matching.source === cost.source
      );
    })
  );
}

const POST_INSTALL_VARIABLE_REZ_FIELDS = [
  "postInstallRezQuoteVariableRezKind",
  "postInstallRezQuoteVariableAdditionalCreditsPerValue",
  "postInstallRezQuoteVariableMinValue",
  "postInstallRezQuoteVariableMaxValue",
  "postInstallRezQuoteVariableMinValueFinalCredits",
  "postInstallRezQuoteVariableMaxValueFinalCredits",
  "postInstallRezQuoteVariableEffectiveStrengthFromValue",
  "postInstallRezQuoteVariableTraceLimitFromValue",
  "postInstallRezQuoteVariableTraceLimitFromValue",
  "postInstallRezQuoteVariableAdditionalCreditsPerSubroutine",
  "postInstallRezQuoteVariableMinSubroutines",
  "postInstallRezQuoteVariableMinSubroutinesFinalCredits",
  "postInstallRezQuoteVariableFirstEndTheRunSubroutineCount",
  "postInstallRezQuoteVariableFirstEndTheRunFinalCredits",
  "postInstallRezQuoteVariableBaseSubtypes",
  "postInstallRezQuoteVariableBaseSubtypesFinalCredits",
  "postInstallRezQuoteVariableAlternateSubtypes",
  "postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits",
  "postInstallRezQuoteVariableAlternateSubtypesFinalCredits",
] as const;

export function selectedPostInstallRezCreditsFromCurrentQuote(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): number | undefined {
  const finalBaseCredits = payload.postInstallRezQuoteFinalCredits;
  if (!knownNonNegativeInteger(finalBaseCredits)) return undefined;
  if (payload.postInstallRezQuoteCostKind === "fixed") {
    return postInstallVariableRezFieldsAreAbsent(payload)
      ? finalBaseCredits
      : undefined;
  }
  if (payload.postInstallRezQuoteCostKind !== "variable") return undefined;
  const kind = payload.postInstallRezQuoteVariableRezKind;
  if (kind === "x_strength") return undefined;
  if (kind === "paid_end_the_run_subroutines") {
    if (
      !postInstallVariableRezFieldsMatchFamily(payload, [
        "postInstallRezQuoteVariableRezKind",
        "postInstallRezQuoteVariableAdditionalCreditsPerSubroutine",
        "postInstallRezQuoteVariableMinSubroutines",
        "postInstallRezQuoteVariableMinSubroutinesFinalCredits",
        "postInstallRezQuoteVariableFirstEndTheRunSubroutineCount",
        "postInstallRezQuoteVariableFirstEndTheRunFinalCredits",
      ])
    ) {
      return undefined;
    }
    return selectedVariableRezCredits(
      {
        kind,
        additionalCreditsPerSubroutine:
          payload.postInstallRezQuoteVariableAdditionalCreditsPerSubroutine,
        minSubroutines: payload.postInstallRezQuoteVariableMinSubroutines,
        minSubroutinesFinalCredits:
          payload.postInstallRezQuoteVariableMinSubroutinesFinalCredits,
        firstEndTheRunSubroutineCount:
          payload.postInstallRezQuoteVariableFirstEndTheRunSubroutineCount,
        firstEndTheRunFinalCredits:
          payload.postInstallRezQuoteVariableFirstEndTheRunFinalCredits,
      },
      finalBaseCredits,
    );
  }
  if (kind !== "alternate_subtype") return undefined;
  if (
    !postInstallVariableRezFieldsMatchFamily(payload, [
      "postInstallRezQuoteVariableRezKind",
      "postInstallRezQuoteVariableBaseSubtypes",
      "postInstallRezQuoteVariableBaseSubtypesFinalCredits",
      "postInstallRezQuoteVariableAlternateSubtypes",
      "postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits",
      "postInstallRezQuoteVariableAlternateSubtypesFinalCredits",
    ])
  ) {
    return undefined;
  }
  return selectedVariableRezCredits(
    {
      kind,
      baseSubtypes: canonicalSubtypeCsv(
        payload.postInstallRezQuoteVariableBaseSubtypes,
      ),
      baseSubtypesFinalCredits:
        payload.postInstallRezQuoteVariableBaseSubtypesFinalCredits,
      alternateSubtypes: canonicalSubtypeCsv(
        payload.postInstallRezQuoteVariableAlternateSubtypes,
      ),
      alternateSubtypesAdditionalCredits:
        payload.postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits,
      alternateSubtypesFinalCredits:
        payload.postInstallRezQuoteVariableAlternateSubtypesFinalCredits,
    },
    finalBaseCredits,
  );
}

export function selectedInstalledRezCreditsFromCurrentQuote(
  quote: VisibleCorpRezCostQuote,
): number | undefined {
  if (quote.complete !== true || !knownNonNegativeInteger(quote.finalCredits)) {
    return undefined;
  }
  if (quote.costKind === "fixed") return quote.finalCredits;
  return selectedVariableRezCredits(
    quote.variableParameter,
    quote.finalCredits,
  );
}

function selectedVariableRezCredits(
  value: unknown,
  finalBaseCredits: number,
): number | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !knownNonNegativeInteger(finalBaseCredits)
  ) {
    return undefined;
  }
  const parameter = value as Record<string, unknown>;
  if (parameter.kind === "x_strength") return undefined;
  if (parameter.kind === "paid_end_the_run_subroutines") {
    const additionalCreditsPerSubroutine =
      parameter.additionalCreditsPerSubroutine;
    const minSubroutines = parameter.minSubroutines;
    const minSubroutinesFinalCredits = parameter.minSubroutinesFinalCredits;
    const firstEndTheRunSubroutineCount =
      parameter.firstEndTheRunSubroutineCount;
    const firstEndTheRunFinalCredits = parameter.firstEndTheRunFinalCredits;
    return knownPositiveInteger(additionalCreditsPerSubroutine) &&
      knownNonNegativeInteger(minSubroutines) &&
      knownNonNegativeInteger(minSubroutinesFinalCredits) &&
      minSubroutinesFinalCredits ===
        safeRezCreditTotal(
          finalBaseCredits,
          minSubroutines,
          additionalCreditsPerSubroutine,
        ) &&
      knownPositiveInteger(firstEndTheRunSubroutineCount) &&
      firstEndTheRunSubroutineCount === Math.max(1, minSubroutines) &&
      knownNonNegativeInteger(firstEndTheRunFinalCredits) &&
      firstEndTheRunFinalCredits ===
        safeRezCreditTotal(
          finalBaseCredits,
          firstEndTheRunSubroutineCount,
          additionalCreditsPerSubroutine,
        )
      ? firstEndTheRunFinalCredits
      : undefined;
  }
  if (parameter.kind !== "alternate_subtype") return undefined;
  const baseSubtypes = canonicalSubtypeArray(parameter.baseSubtypes);
  const alternateSubtypes = canonicalSubtypeArray(parameter.alternateSubtypes);
  const baseSubtypesFinalCredits = parameter.baseSubtypesFinalCredits;
  const alternateSubtypesAdditionalCredits =
    parameter.alternateSubtypesAdditionalCredits;
  const alternateSubtypesFinalCredits = parameter.alternateSubtypesFinalCredits;
  return baseSubtypes &&
    alternateSubtypes &&
    baseSubtypes.join(",") !== alternateSubtypes.join(",") &&
    knownNonNegativeInteger(baseSubtypesFinalCredits) &&
    baseSubtypesFinalCredits === finalBaseCredits &&
    knownPositiveInteger(alternateSubtypesAdditionalCredits) &&
    knownNonNegativeInteger(alternateSubtypesFinalCredits) &&
    alternateSubtypesFinalCredits ===
      safeRezCreditTotal(
        finalBaseCredits,
        1,
        alternateSubtypesAdditionalCredits,
      )
    ? alternateSubtypesFinalCredits
    : undefined;
}

function postInstallVariableRezFieldsAreAbsent(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): boolean {
  return POST_INSTALL_VARIABLE_REZ_FIELDS.every(
    (field) => payload[field] === undefined,
  );
}

function postInstallVariableRezFieldsMatchFamily(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
  allowedFields: readonly (typeof POST_INSTALL_VARIABLE_REZ_FIELDS)[number][],
): boolean {
  const allowed = new Set(allowedFields);
  return POST_INSTALL_VARIABLE_REZ_FIELDS.every(
    (field) => payload[field] === undefined || allowed.has(field),
  );
}

export function canonicalSubtypeCsv(value: unknown): string[] | undefined {
  return typeof value === "string"
    ? canonicalSubtypeArray(value.split(","))
    : undefined;
}

export function canonicalSubtypeArray(value: unknown): string[] | undefined {
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some(
      (subtype, index) =>
        typeof subtype !== "string" ||
        !/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(subtype) ||
        (index > 0 && value[index - 1]! >= subtype),
    )
  ) {
    return undefined;
  }
  return value as string[];
}

function safeRezCreditTotal(
  baseCredits: number,
  quantity: number,
  creditsPerUnit: number,
): number | undefined {
  const additionalCredits = quantity * creditsPerUnit;
  const totalCredits = baseCredits + additionalCredits;
  return knownNonNegativeInteger(additionalCredits) &&
    knownNonNegativeInteger(totalCredits)
    ? totalCredits
    : undefined;
}

function knownPositiveInteger(value: unknown): value is number {
  return knownNonNegativeInteger(value) && value > 0;
}

export function validMandatoryInstalledRezCosts(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const costs = value as Record<string, unknown>;
  return (
    Object.keys(costs).length === 1 &&
    knownNonNegativeInteger(costs.agendaPoints) &&
    costs.agendaPoints === 0
  );
}

export function validDefinitionIdArray(value: unknown): boolean {
  if (value === undefined) return true;
  return (
    Array.isArray(value) &&
    value.every(
      (id, index) =>
        typeof id === "string" &&
        id.length > 0 &&
        (index === 0 || value[index - 1]! < id),
    )
  );
}

export function definitionIdListsAreDisjoint(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const leftIds = new Set(left);
  return right.every((id) => !leftIds.has(id));
}

export function validPostInstallRezQuoteModifiers(
  payload: NonNullable<AiDecisionInput["legalActions"][number]["payload"]>,
): boolean {
  const reductionIds = commaSeparatedDefinitionIds(
    payload.postInstallRezQuoteReductionSourceDefinitionIds,
  );
  const increaseIds = commaSeparatedDefinitionIds(
    payload.postInstallRezQuoteIncreaseSourceDefinitionIds,
  );
  if (reductionIds === undefined || increaseIds === undefined) return false;
  return (
    definitionIdListsAreDisjoint(reductionIds, increaseIds) &&
    (payload.postInstallRezQuoteBaseCredits ===
      payload.postInstallRezQuoteFinalCredits ||
      reductionIds.length + increaseIds.length > 0)
  );
}

export function validPostInstallProjectedServerBinding(
  targetServerId: string,
  projectedServerId: unknown,
): boolean {
  return targetServerId === "new_remote"
    ? typeof projectedServerId === "string" &&
        /^remote_[1-9]\d*$/.test(projectedServerId)
    : projectedServerId === targetServerId;
}

function validCommaSeparatedDefinitionIds(value: unknown): boolean {
  if (value === undefined) return true;
  if (typeof value !== "string" || value.length === 0) return false;
  const ids = value.split(",");
  return ids.every(
    (id, index) => id.length > 0 && (index === 0 || ids[index - 1]! < id),
  );
}

function commaSeparatedDefinitionIds(value: unknown): string[] | undefined {
  if (value === undefined) return [];
  if (!validCommaSeparatedDefinitionIds(value)) return undefined;
  return (value as string).split(",");
}

export function knownExactInstallRouteCreditCost(
  projection: KnownCorpFundedIceInstallRouteProjection,
): number {
  return exactInstallRouteCreditCost(projection) ?? Number.MAX_SAFE_INTEGER;
}

export function knownNonNegativeInteger(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

export function validDefenseSignals(
  signals: readonly CorpDefenseSignal[],
  context: PlanSchedulerContext,
): CorpDefenseSignal[] {
  const invalid = signals.find((signal) => !isValidDefenseSignal(signal));
  if (!invalid) return [...signals];
  throw new PlanResolutionFailure("missing_plan_module_coverage", {
    side: context.input.side,
    stateVersion: context.input.playerView.stateVersion,
    timingPoint: context.input.playerView.timingPoint,
    legalActionTypes: context.input.legalActions.map((action) => action.type),
    unresolvedActionIds: defenseSignalActionIds(invalid),
    owner: "plan_module",
    removalCondition: `Replace incomplete or legacy Corp defense signal ${String(
      (invalid as { defenseId?: unknown }).defenseId ?? "unknown",
    )} with a complete discriminated defense contract.`,
  });
}

export function validAgendaPurgeDefenseChoiceResolution(
  resolutionValue: unknown,
  signalValue: Record<string, unknown>,
): boolean {
  if (!resolutionValue || typeof resolutionValue !== "object") return false;
  const resolution = resolutionValue as Record<string, unknown>;
  const revealedCardIds = resolution.revealedCardIds;
  const targets = resolution.targets;
  const actionIds = signalValue.actionIds;
  if (
    !hasOnlyKeys(
      resolution,
      new Set([
        "kind",
        "choiceId",
        "sourceAgendaId",
        "sourceStateVersion",
        "revealedCardIds",
        "targets",
      ]),
    ) ||
    resolution.kind !== "agenda_purge_install_targets" ||
    !nonEmptyString(resolution.choiceId) ||
    !nonEmptyString(resolution.sourceAgendaId) ||
    !knownNonNegativeInteger(resolution.sourceStateVersion) ||
    !Array.isArray(revealedCardIds) ||
    revealedCardIds.length === 0 ||
    !revealedCardIds.every(nonEmptyString) ||
    new Set(revealedCardIds).size !== revealedCardIds.length ||
    !Array.isArray(targets) ||
    targets.length === 0 ||
    !Array.isArray(actionIds) ||
    actionIds.length !== 1 ||
    !nonEmptyString(actionIds[0])
  ) {
    return false;
  }
  const targetRecords = targets as Array<Record<string, unknown>>;
  return (
    targetRecords.every(
      (target) =>
        target !== null &&
        typeof target === "object" &&
        hasOnlyKeys(target, new Set(["cardId", "serverId", "optionId"])) &&
        nonEmptyString(target.cardId) &&
        revealedCardIds.includes(target.cardId) &&
        nonEmptyString(target.serverId) &&
        nonEmptyString(target.optionId),
    ) &&
    new Set(targetRecords.map((target) => target.cardId)).size ===
      targetRecords.length &&
    new Set(targetRecords.map((target) => target.optionId)).size ===
      targetRecords.length &&
    signalValue.serverId === targetRecords[0]?.serverId
  );
}

export function validClassicDeflectorDefenseChoiceResolution(
  resolutionValue: unknown,
  signalValue: Record<string, unknown>,
): boolean {
  if (!resolutionValue || typeof resolutionValue !== "object") return false;
  const resolution = resolutionValue as Record<string, unknown>;
  const actionIds = signalValue.actionIds;
  const disposition = resolution.disposition;
  const selectedServerId = resolution.selectedServerId;
  return (
    hasOnlyKeys(
      resolution,
      new Set([
        "kind",
        "choiceId",
        "sourceStateVersion",
        "runId",
        "sourceIceInstanceId",
        "sourceDefinitionId",
        "subroutineIndex",
        "subroutineId",
        "targetProfile",
        "creditCost",
        "autoBreakIfNoTarget",
        "selectedOptionId",
        "disposition",
        "selectedServerId",
      ]),
    ) &&
    resolution.kind === "classic_deflector_redirect" &&
    nonEmptyString(resolution.choiceId) &&
    knownNonNegativeInteger(resolution.sourceStateVersion) &&
    nonEmptyString(resolution.runId) &&
    nonEmptyString(resolution.sourceIceInstanceId) &&
    nonEmptyString(resolution.sourceDefinitionId) &&
    knownNonNegativeInteger(resolution.subroutineIndex) &&
    nonEmptyString(resolution.subroutineId) &&
    (resolution.targetProfile === "archives" ||
      resolution.targetProfile === "any_data_fort" ||
      resolution.targetProfile === "subsidiary_data_fort") &&
    knownNonNegativeInteger(resolution.creditCost) &&
    typeof resolution.autoBreakIfNoTarget === "boolean" &&
    nonEmptyString(resolution.selectedOptionId) &&
    (disposition === "redirect" || disposition === "decline") &&
    (disposition === "redirect"
      ? nonEmptyString(selectedServerId) &&
        resolution.selectedOptionId === `server_${selectedServerId}` &&
        signalValue.serverId === selectedServerId
      : selectedServerId === undefined &&
        resolution.selectedOptionId === "decline") &&
    Array.isArray(actionIds) &&
    actionIds.length === 1 &&
    nonEmptyString(actionIds[0])
  );
}

export function isGenericDefenseSignal(
  signal: CorpDefenseSignal,
): signal is CorpGenericDefenseSignal {
  return signal.kind === "generic";
}

export function isScoreProtectionInstallSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionInstallSignal {
  return signal.kind === "score_protection_install";
}

export function isScoreProtectionStagingInstallSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionStagingInstallSignal {
  return signal.kind === "score_protection_staging_install";
}

export function isTerminalProtectionInstallSignal(
  signal: CorpDefenseSignal,
): signal is CorpTerminalProtectionInstallSignal {
  return signal.kind === "score_protection_terminal_install";
}

export function isScoreProtectionDrawSignal(
  signal: CorpDefenseSignal,
): signal is CorpScoreProtectionDrawSignal {
  return signal.kind === "score_protection_draw";
}

export function genericDefensePhase(
  value: unknown,
): value is CorpGenericDefenseSignal["phase"] {
  return (
    value === "install_ice" ||
    value === "install_defense_support" ||
    value === "resolve_install_targets" ||
    value === "resolve_run_redirect" ||
    value === "resolve_program_trash" ||
    value === "resolve_post_pass_ice_lifecycle" ||
    value === "draw_for_ice" ||
    value === "fund_rez_reserve" ||
    value === "rez_response" ||
    value === "activate_run_defense" ||
    value === "pass_encounter" ||
    value === "decline_rez"
  );
}

export function validCorpRezReserveNeed(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const reserve = value as Record<string, unknown>;
  return (
    hasOnlyKeys(
      reserve,
      new Set([
        "observedAtStateVersion",
        "currentCredits",
        "requiredCredits",
        "fundingGap",
        "storedRestrictedCredits",
      ]),
    ) &&
    knownNonNegativeInteger(reserve.observedAtStateVersion) &&
    knownNonNegativeInteger(reserve.currentCredits) &&
    knownNonNegativeInteger(reserve.requiredCredits) &&
    knownNonNegativeInteger(reserve.fundingGap) &&
    (reserve.storedRestrictedCredits === undefined ||
      knownNonNegativeInteger(reserve.storedRestrictedCredits)) &&
    (reserve.fundingGap as number) > 0 &&
    (reserve.requiredCredits as number) -
      (reserve.currentCredits as number) -
      ((reserve.storedRestrictedCredits as number | undefined) ?? 0) ===
      reserve.fundingGap
  );
}

export function scorePriorityClass(
  value: unknown,
): value is CorpScorePriorityClass {
  return value === "P1" || value === "P2" || value === "P3" || value === "P4";
}

export function validExactProbability(
  value: unknown,
): value is ExactProbability {
  if (!value || typeof value !== "object") return false;
  const probability = value as Record<string, unknown>;
  return (
    knownNonNegativeInteger(probability.numerator) &&
    knownNonNegativeInteger(probability.denominator) &&
    probability.denominator > 0 &&
    probability.numerator <= probability.denominator
  );
}

export function validKnownInstallProjection(
  value: unknown,
): value is KnownCorpFundedIceInstallRouteProjection {
  if (!value || typeof value !== "object") return false;
  const projection = value as Record<string, unknown>;
  const before = projection.before as Record<string, unknown> | undefined;
  const after = projection.after as Record<string, unknown> | undefined;
  const afterProtection = after?.protection as
    | Record<string, unknown>
    | undefined;
  return (
    projection.knowledge === "known" &&
    (projection.effect === "no_progress" ||
      projection.effect === "progress" ||
      projection.effect === "satisfied") &&
    nonEmptyString(projection.actionId) &&
    nonEmptyString(projection.sourceCardInstanceId) &&
    nonEmptyString(projection.sourceDefinitionId) &&
    nonEmptyString(projection.targetServerId) &&
    before?.knowledge === "known" &&
    after?.knowledge === "known" &&
    afterProtection?.knowledge === "known" &&
    validExactProbability(afterProtection.runnerAccessSuccessProbability) &&
    knownNonNegativeInteger(projection.installCredits) &&
    knownNonNegativeInteger(projection.installClicks) &&
    projection.installCostSource === "legal_action_agreed_projection" &&
    Array.isArray(projection.selectedRezCosts) &&
    projection.selectedRezCosts.every((selected) => {
      if (!selected || typeof selected !== "object") return false;
      const rezCost = selected as Record<string, unknown>;
      return (
        nonEmptyString(rezCost.iceInstanceId) &&
        nonEmptyString(rezCost.iceDefinitionId) &&
        knownNonNegativeInteger(rezCost.credits) &&
        rezCost.source === "engine_rez_cost_quote"
      );
    }) &&
    knownNonNegativeInteger(projection.creditsAfterDefense) &&
    knownNonNegativeInteger(projection.clicksAfterDefense) &&
    typeof projection.preservesScoreCreditReserve === "boolean" &&
    typeof projection.preservesHardClickReserve === "boolean" &&
    typeof projection.preservesReserves === "boolean" &&
    typeof projection.funded === "boolean" &&
    exactInstallRouteCreditCost(
      value as KnownCorpFundedIceInstallRouteProjection,
    ) !== undefined
  );
}

export function validExactIceRezRoute(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const route = value as Record<string, unknown>;
  const quote = route.quote as Record<string, unknown> | undefined;
  const before = route.before as Record<string, unknown> | undefined;
  const after = route.after as Record<string, unknown> | undefined;
  const resourceExchange = route.resourceExchange as
    | Record<string, unknown>
    | undefined;
  const hasKnownHolisticAssessment =
    before?.knowledge === "known" &&
    after?.knowledge === "known" &&
    validExactProbability(before.runnerAccessSuccessProbability) &&
    validExactProbability(after.runnerAccessSuccessProbability);
  const hasExactResourceExchange =
    route.routeKind === "exact_resource_exchange" &&
    resourceExchange !== undefined &&
    knownNonNegativeInteger(resourceExchange.runnerRequiredCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerPumpCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerBreakCredits) &&
    knownNonNegativeInteger(resourceExchange.runnerBreakUses) &&
    nonEmptyString(resourceExchange.runnerBreakerInstanceId) &&
    nonEmptyString(resourceExchange.runnerBreakerDefinitionId) &&
    Array.isArray(resourceExchange.runnerConsumedCardInstanceIds) &&
    resourceExchange.runnerConsumedCardInstanceIds.every(nonEmptyString) &&
    (resourceExchange.layeredCentralPathTax === undefined ||
      (resourceExchange.layeredCentralPathTax === true &&
        knownNonNegativeInteger(resourceExchange.otherRezzedIceCount) &&
        (resourceExchange.otherRezzedIceCount as number) > 0)) &&
    (resourceExchange.runnerRandomConsequences === undefined ||
      (Array.isArray(resourceExchange.runnerRandomConsequences) &&
        resourceExchange.runnerRandomConsequences.every((entry) => {
          if (!entry || typeof entry !== "object") return false;
          const consequence = entry as Record<string, unknown>;
          return (
            consequence.kind === "post_encounter_self_trash_check" &&
            nonEmptyString(consequence.cardId) &&
            nonEmptyString(consequence.definitionId) &&
            knownNonNegativeInteger(consequence.numerator) &&
            (consequence.numerator as number) > 0 &&
            knownNonNegativeInteger(consequence.denominator) &&
            (consequence.denominator as number) >=
              (consequence.numerator as number)
          );
        })));
  const accessBlock = route.accessBlock as Record<string, unknown> | undefined;
  const hasExactAccessBlock =
    route.routeKind === "access_reduction" &&
    accessBlock !== undefined &&
    knownNonNegativeInteger(accessBlock.hardEndTheRunSubroutineCount) &&
    (accessBlock.hardEndTheRunSubroutineCount as number) > 0 &&
    (accessBlock.reason === "no_visible_eligible_breaker" ||
      accessBlock.reason === "visible_break_route_unaffordable");
  const trace = route.traceAccessBlock as Record<string, unknown> | undefined;
  const hasExactTraceBlock =
    route.routeKind === "trace_access_block" &&
    trace !== undefined &&
    trace.actionId === route.actionId &&
    trace.sourceCardInstanceId === route.sourceCardInstanceId &&
    trace.targetServerId === route.targetServerId &&
    trace.stateVersion === quote?.expiresAtStateVersion &&
    nonEmptyString(trace.runId) &&
    trace.rezCredits === quote?.finalCredits &&
    (quote?.costKind === "variable"
      ? knownNonNegativeInteger(trace.variableValue)
      : quote?.costKind === "fixed" && trace.variableValue === undefined) &&
    trace.corpBid === 0 &&
    knownNonNegativeInteger(trace.corpTraceStrength) &&
    knownNonNegativeInteger(trace.maximumRunnerTraceStrength) &&
    trace.corpTraceStrength > trace.maximumRunnerTraceStrength &&
    trace.runnerCanBreak === false &&
    trace.guaranteedRunEnd === true;
  const hasExactMarginalDefenseThreat =
    route.routeKind === "qualitative_encounter_defense" &&
    (route.marginalDefenseThreat === "visible_agenda_remote" ||
      route.marginalDefenseThreat === "terminal_central_access");
  const bluff = route.bluffDefenseNeed as Record<string, unknown> | undefined;
  const hasBoundBluffDefense =
    bluff !== undefined &&
    bluff.serverId === route.targetServerId &&
    bluff.iceInstanceId === route.sourceCardInstanceId &&
    bluff.observedAtStateVersion === quote?.expiresAtStateVersion &&
    nonEmptyString(bluff.sourceInstanceId) &&
    knownNonNegativeInteger(bluff.requiredCredits) &&
    knownNonNegativeInteger(bluff.encounterCredits) &&
    bluff.fundingGap === 0 &&
    (bluff.outcome === "access_cost" ||
      bluff.outcome === "visible_stop" ||
      bluff.outcome === "paid_encounter_opportunity");
  const freeCurrentEncounterDefense = route.freeCurrentEncounterDefense as
    | Record<string, unknown>
    | undefined;
  const hasExactFreeCurrentEncounterDefense =
    route.routeKind === "qualitative_encounter_defense" &&
    freeCurrentEncounterDefense?.effect ===
      "meaningful_tax_or_damage_or_disruption" &&
    freeCurrentEncounterDefense.evidenceSource ===
      "visible_corp_ice_defense_profile" &&
    quote?.finalCredits === 0;
  return (
    nonEmptyString(route.actionId) &&
    nonEmptyString(route.sourceCardInstanceId) &&
    nonEmptyString(route.sourceDefinitionId) &&
    nonEmptyString(route.targetServerId) &&
    quote?.context === "installed" &&
    quote.complete === true &&
    quote.cardId === route.sourceCardInstanceId &&
    quote.targetServerId === route.targetServerId &&
    knownNonNegativeInteger(quote.expiresAtStateVersion) &&
    knownNonNegativeInteger(quote.finalCredits) &&
    (hasKnownHolisticAssessment ||
      hasExactResourceExchange ||
      hasExactAccessBlock ||
      hasExactTraceBlock ||
      hasBoundBluffDefense ||
      hasExactMarginalDefenseThreat ||
      hasExactFreeCurrentEncounterDefense) &&
    (route.effect === "progress" || route.effect === "satisfied") &&
    knownNonNegativeInteger(route.totalRezCredits) &&
    quote.finalCredits === route.totalRezCredits
  );
}

export function exactProbabilityValuesEqual(
  left: unknown,
  right: ExactProbability,
): boolean {
  if (!left || typeof left !== "object") return false;
  const probability = left as Record<string, unknown>;
  return (
    probability.numerator === right.numerator &&
    probability.denominator === right.denominator
  );
}

export function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function validRezReserveAssessment(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const reserve = value as Record<string, unknown>;
  const opportunity = reserve.opportunity as
    | Record<string, unknown>
    | undefined;
  const strings = (value: unknown) =>
    Array.isArray(value) && value.every(nonEmptyString);
  return (
    typeof reserve.preservesReserve === "boolean" &&
    knownNonNegativeInteger(reserve.requiredCreditsAfterRez) &&
    Number.isSafeInteger(reserve.availableCreditsAfterRez) &&
    strings(reserve.scoreProjectIds) &&
    strings(reserve.immediateRezIceIds) &&
    Boolean(
      opportunity &&
      typeof opportunity.preservesReserve === "boolean" &&
      knownNonNegativeInteger(opportunity.requiredCredits) &&
      [
        "no_followup_click_run",
        "current_terminal_access",
        "current_access_preferred",
        "no_certified_alternative",
        "all_alternatives_funded",
        "funded_alternative_protection",
        "assessment_unknown",
      ].includes(String(opportunity.reason)) &&
      strings(opportunity.unknownServerIds) &&
      Array.isArray(opportunity.claims) &&
      opportunity.claims.every(
        (claim: Record<string, unknown>) =>
          claim &&
          nonEmptyString(claim.serverId) &&
          knownNonNegativeInteger(claim.observedAtStateVersion) &&
          typeof claim.expectedPoints === "number" &&
          Number.isFinite(claim.expectedPoints) &&
          claim.expectedPoints >= 0 &&
          typeof claim.terminal === "boolean" &&
          knownNonNegativeInteger(claim.credits) &&
          strings(claim.iceIds),
      ),
    )
  );
}

export const GENERIC_DEFENSE_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "sourceDefinitionIds",
  "parentKind",
  "parentProjectId",
  "parentNeedId",
  "sourceCardInstanceId",
  "actionIds",
  "targetIceInstanceId",
  "followupIceInstanceId",
  "urgent",
  "centralPressure",
  "immediateInstallSupport",
  "iceInstallCostSupportActionId",
  "rezWindowVerdict",
  "installRoute",
  "rezReserveNeed",
  "rezRoute",
  "rezReserveAssessment",
  "restrictedRezFunding",
  "value",
  "evidenceCode",
  "choiceResolution",
  "drawAttemptState",
]);

export const SCORE_PROTECTION_INSTALL_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "sourceCardInstanceId",
  "sourceDefinitionId",
  "effect",
  "runnerAccessSuccessProbability",
  "totalInstallAndRezCredits",
  "projection",
  "evidenceCode",
]);

export const SCORE_PROTECTION_STAGING_INSTALL_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "sourceCardInstanceId",
  "sourceDefinitionId",
  "evidenceCode",
]);

export const SCORE_PROTECTION_DRAW_SIGNAL_KEYS = new Set([
  "kind",
  "defenseId",
  "serverId",
  "phase",
  "parentProjectId",
  "parentNeedId",
  "delegatedPriorityClass",
  "actionId",
  "cleanupReplacementDraw",
  "drawAttemptState",
  "evidenceCode",
]);

export const SCORE_PROTECTION_DRAW_ATTEMPT_KEYS = new Set([
  "turnKey",
  "remainingAttempts",
  "selectedAtStateVersion",
]);

export function validGenericDrawAttemptState(value: unknown): boolean {
  if (value === undefined) return true;
  if (!value || typeof value !== "object") return false;
  const attempt = value as Record<string, unknown>;
  return (
    hasOnlyKeys(attempt, SCORE_PROTECTION_DRAW_ATTEMPT_KEYS) &&
    nonEmptyString(attempt.turnKey) &&
    (attempt.remainingAttempts === 0 || attempt.remainingAttempts === 1) &&
    (attempt.selectedAtStateVersion === undefined ||
      knownNonNegativeInteger(attempt.selectedAtStateVersion))
  );
}

export function hasOnlyKeys(
  value: Readonly<Record<string, unknown>>,
  allowedKeys: ReadonlySet<string>,
): boolean {
  return Object.keys(value).every((key) => allowedKeys.has(key));
}

export function technicalCompare(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function exactInstallRouteCreditCost(
  projection: KnownCorpFundedIceInstallRouteProjection,
): number | undefined {
  let total = projection.installCredits;
  if (!knownNonNegativeInteger(total)) return undefined;
  for (const selected of projection.selectedRezCosts) {
    if (!knownNonNegativeInteger(selected.credits)) return undefined;
    total += selected.credits;
    if (!Number.isSafeInteger(total)) return undefined;
  }
  return total;
}

export function defenseSignalActionIds(signal: CorpDefenseSignal): string[] {
  const value = signal as unknown as Record<string, unknown>;
  if (
    (value.kind === "score_protection_terminal_install" ||
      value.kind === "score_protection_install" ||
      value.kind === "score_protection_staging_install" ||
      value.kind === "score_protection_draw") &&
    nonEmptyString(value.actionId)
  ) {
    return [value.actionId];
  }
  return Array.isArray(value.actionIds)
    ? value.actionIds.filter(nonEmptyString)
    : [];
}

export function isValidDefenseSignal(
  signal: CorpDefenseSignal,
): signal is CorpDefenseSignal {
  const value = signal as unknown as Record<string, unknown>;
  if (
    !nonEmptyString(value.defenseId) ||
    !nonEmptyString(value.serverId) ||
    !nonEmptyString(value.evidenceCode)
  ) {
    return false;
  }
  if (value.kind === "generic") {
    const installRoute = value.installRoute as
      | Record<string, unknown>
      | undefined;
    const validatesInstallRoute =
      value.phase === "install_ice" ||
      (value.phase === "install_defense_support" && installRoute !== undefined);
    return (
      hasOnlyKeys(value, GENERIC_DEFENSE_SIGNAL_KEYS) &&
      genericDefensePhase(value.phase) &&
      (value.iceInstallCostSupportActionId === undefined ||
        (value.phase === "rez_response" &&
          value.immediateInstallSupport === true &&
          nonEmptyString(value.iceInstallCostSupportActionId) &&
          nonEmptyString(value.followupIceInstanceId))) &&
      (value.restrictedRezFunding === undefined ||
        (value.phase === "rez_response" &&
          value.rezWindowVerdict === "productive" &&
          signal.kind === "generic" &&
          signal.restrictedRezFunding !== undefined &&
          knownNonNegativeInteger(signal.restrictedRezFunding.gap) &&
          signal.restrictedRezFunding.gap > 0 &&
          Array.isArray(signal.restrictedRezFunding.quotes) &&
          signal.restrictedRezFunding.quotes.length > 0 &&
          signal.restrictedRezFunding.quotes.every(
            (quote) =>
              quote.consumer?.actionType === "rez_ice" &&
              quote.consumer.currentRunAccessBlock !== undefined &&
              quote.consumer.availableBeforePayout === false &&
              quote.consumer.sourceCardInstanceId ===
                signal.targetIceInstanceId &&
              quote.consumer.serverId === signal.serverId,
          ) &&
          signal.actionIds?.length === 0)) &&
      Array.isArray(value.sourceDefinitionIds) &&
      value.sourceDefinitionIds.every(nonEmptyString) &&
      (value.actionIds === undefined ||
        (Array.isArray(value.actionIds) &&
          value.actionIds.every(nonEmptyString))) &&
      typeof value.urgent === "boolean" &&
      (value.centralPressure === undefined ||
        value.centralPressure === "material" ||
        value.centralPressure === "acute" ||
        value.centralPressure === "terminal") &&
      typeof value.value === "number" &&
      Number.isFinite(value.value) &&
      (validatesInstallRoute
        ? installRoute !== undefined &&
          hasOnlyKeys(
            installRoute,
            new Set([
              "disposition",
              "progressKind",
              "rezFundingGap",
              "projection",
            ]),
          ) &&
          (installRoute.disposition === "productive" ||
            installRoute.disposition === "funding_only") &&
          (installRoute.progressKind === undefined ||
            installRoute.progressKind === "engine_certified_access" ||
            installRoute.progressKind === "funded_structured_central_defense" ||
            installRoute.progressKind === "scoreline_central_tax_allocation" ||
            installRoute.progressKind === "staged_central_defense" ||
            installRoute.progressKind === "score_material_capacity_release" ||
            installRoute.progressKind ===
              "agenda_capacity_defense_conversion" ||
            installRoute.progressKind === "funding_required") &&
          (installRoute.rezFundingGap === undefined ||
            knownNonNegativeInteger(installRoute.rezFundingGap)) &&
          validKnownInstallProjection(installRoute.projection)
        : installRoute === undefined) &&
      (value.phase === "fund_rez_reserve"
        ? validCorpRezReserveNeed(value.rezReserveNeed) &&
          nonEmptyString(value.targetIceInstanceId) &&
          value.centralPressure === "terminal" &&
          value.urgent === true
        : value.rezReserveNeed === undefined) &&
      (value.choiceResolution === undefined ||
        (value.phase === "resolve_program_trash" &&
          validProgramTrashResolution(value.choiceResolution)) ||
        (value.phase === "resolve_install_targets" &&
          validAgendaPurgeDefenseChoiceResolution(
            value.choiceResolution,
            value,
          )) ||
        (value.phase === "resolve_run_redirect" &&
          validClassicDeflectorDefenseChoiceResolution(
            value.choiceResolution,
            value,
          ))) &&
      (value.phase !== "resolve_post_pass_ice_lifecycle" ||
        (value.sourceDefinitionIds.length === 1 &&
          Array.isArray(value.actionIds) &&
          value.actionIds.length > 0 &&
          nonEmptyString(value.targetIceInstanceId))) &&
      (value.rezRoute === undefined ||
        (value.phase === "rez_response" &&
          validExactIceRezRoute(value.rezRoute))) &&
      (value.rezReserveAssessment === undefined ||
        (value.phase === "rez_response" &&
          validRezReserveAssessment(value.rezReserveAssessment))) &&
      (value.parentKind === undefined
        ? value.parentProjectId === undefined &&
          value.parentNeedId === undefined &&
          value.sourceCardInstanceId === undefined
        : value.parentKind === "remote" &&
          value.phase === "install_defense_support" &&
          nonEmptyString(value.parentProjectId) &&
          nonEmptyString(value.parentNeedId) &&
          nonEmptyString(value.sourceCardInstanceId)) &&
      validGenericDrawAttemptState(value.drawAttemptState)
    );
  }
  if (value.kind === "score_protection_install") {
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_INSTALL_SIGNAL_KEYS) &&
      value.phase === "install_ice" &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      nonEmptyString(value.sourceCardInstanceId) &&
      nonEmptyString(value.sourceDefinitionId) &&
      (value.effect === "progress" || value.effect === "satisfied") &&
      validExactProbability(value.runnerAccessSuccessProbability) &&
      knownNonNegativeInteger(value.totalInstallAndRezCredits) &&
      validKnownInstallProjection(value.projection) &&
      exactInstallRouteCreditCost(
        value.projection as KnownCorpFundedIceInstallRouteProjection,
      ) === value.totalInstallAndRezCredits &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .actionId === value.actionId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .sourceCardInstanceId === value.sourceCardInstanceId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .sourceDefinitionId === value.sourceDefinitionId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection)
        .targetServerId === value.serverId &&
      (value.projection as KnownCorpFundedIceInstallRouteProjection).effect ===
        value.effect &&
      exactProbabilityValuesEqual(
        value.runnerAccessSuccessProbability,
        (value.projection as KnownCorpFundedIceInstallRouteProjection).after
          .protection.runnerAccessSuccessProbability,
      )
    );
  }
  if (
    value.kind === "score_protection_staging_install" ||
    value.kind === "score_protection_terminal_install"
  ) {
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_STAGING_INSTALL_SIGNAL_KEYS) &&
      (value.phase === "install_ice" ||
        (value.kind === "score_protection_terminal_install" &&
          value.phase === "install_defense_support")) &&
      nonEmptyString(value.serverId) &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      nonEmptyString(value.sourceCardInstanceId) &&
      nonEmptyString(value.sourceDefinitionId)
    );
  }
  if (value.kind === "score_protection_draw") {
    const attempt = value.drawAttemptState as
      | Record<string, unknown>
      | undefined;
    return (
      hasOnlyKeys(value, SCORE_PROTECTION_DRAW_SIGNAL_KEYS) &&
      value.phase === "draw_for_ice" &&
      nonEmptyString(value.parentProjectId) &&
      nonEmptyString(value.parentNeedId) &&
      scorePriorityClass(value.delegatedPriorityClass) &&
      nonEmptyString(value.actionId) &&
      (value.cleanupReplacementDraw === undefined ||
        typeof value.cleanupReplacementDraw === "boolean") &&
      attempt !== undefined &&
      hasOnlyKeys(attempt, SCORE_PROTECTION_DRAW_ATTEMPT_KEYS) &&
      nonEmptyString(attempt.turnKey) &&
      attempt.remainingAttempts === 1 &&
      (attempt.selectedAtStateVersion === undefined ||
        knownNonNegativeInteger(attempt.selectedAtStateVersion))
    );
  }
  return false;
}

function validProgramTrashResolution(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const r = value as Record<string, unknown>;
  return (
    r.kind === "program_trash" &&
    knownNonNegativeInteger(r.sourceStateVersion) &&
    [
      r.choiceId,
      r.choiceSource,
      r.runId,
      r.sourceIceInstanceId,
      r.selectedOptionId,
      r.targetCardInstanceId,
    ].every(nonEmptyString) &&
    r.selectedOptionId === `card_${r.targetCardInstanceId}`
  );
}
