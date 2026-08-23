import { CARD_DEFINITIONS_BY_ID } from "../../card-definitions";
/**
 * ARCH-7 Payment-/CostQuote-Helfer.
 * Keine State-Mutation, keine LegalAction-Erzeugung, keine Action-Ausführung.
 * Revalidation bleibt an Quote gekoppelt; kein Import aus index.ts.
 */
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  ChoiceOption,
  ChoiceRequest,
  CorpOptionalRezChoiceQuote,
  CorpFortRunRezSupportQuote,
  CorpServer,
  GameState,
  LegalAction,
  ServerId,
  VisibleCorpRezCostQuote,
  VisibleVariableCorpRezCostParameter,
} from "@netgrid/shared";
import {
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
  CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
  CORP_FORT_RUN_REZ_SUPPORT_KIND,
  CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND,
  CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION,
} from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForRunnerInstalled,
  cardDefinitionForInstance,
  cardDefinitionMatchesModifierAppliesTo,
  corpServerIdForInstalledCard,
  isPublicRezzedCorpRootModifier,
  isPublicRunnerInstalledModifier,
  sameServerAsSourceApplies,
} from "../../ability-engine/card-implementation-modifiers";
import type {
  CardFortRunWindowImplementation,
  CardInstallCostModifierImplementation,
  CardRezCostModifierImplementation,
  CardSelfRezAdditionalCostImplementation,
  CardSelfRezCostModifierImplementation,
  CardVariableRezImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  corpRootRezCreditOutcomeQuotePayload,
  quoteCorpRootRezCreditOutcome,
  ROOT_REZ_CREDIT_OUTCOME_QUOTE_PAYLOAD_FIELDS,
} from "./root-rez-credit-outcome";
import { nextCanonicalRemoteServerId } from "../state/remote-server-id";
import type { CostModifierQuote, CostQuote } from "./cost-quote";

export { corpServerIdForInstalledCard } from "../../ability-engine/card-implementation-modifiers";

export type CorpRezCostOptions = {
  discountedRezSourceCardId?: CardInstanceId;
  projectedServerId?: Exclude<ServerId, "new_remote">;
};

type ActiveCorpRezCostModifier = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  modifier: CardRezCostModifierImplementation;
};

type ActiveCorpInstallCostModifier = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  modifier: CardInstallCostModifierImplementation;
};

type ActiveCorpSelfRezCostModifier = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  modifier: CardSelfRezCostModifierImplementation;
};

export type CorpInstallCostOptions = {
  additionalCredits?: number;
  legacyReduction?: number;
};

function incompleteCorpRezCostProjection(
  state: GameState,
  context: "installed" | "post_install",
  cardId: CardInstanceId,
  targetServerId: ServerId,
  projectedServerId?: Exclude<ServerId, "new_remote">,
): VisibleCorpRezCostQuote {
  if (context === "installed") {
    if (targetServerId === "new_remote" || !projectedServerId)
      throw new Error("Installed-Rez-Quote braucht einen bestehenden Server.");
    return {
      context,
      cardId,
      targetServerId,
      projectedServerId,
      expiresAtStateVersion: state.stateVersion,
      complete: false,
    };
  }
  return {
    context,
    cardId,
    targetServerId,
    expiresAtStateVersion: state.stateVersion,
    complete: false,
  };
}

function isExactNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function exactNonNegativeIntegerSum(
  left: number,
  right: number,
): number | undefined {
  const sum = left + right;
  return isExactNonNegativeInteger(sum) ? sum : undefined;
}

function exactNonNegativeIntegerProduct(
  left: number,
  right: number,
): number | undefined {
  const product = left * right;
  return isExactNonNegativeInteger(product) ? product : undefined;
}

function stableVisibleSubtypeList(
  subtypes: readonly string[],
): string[] | undefined {
  if (
    subtypes.length === 0 ||
    subtypes.some(
      (subtype) =>
        subtype.length === 0 ||
        subtype !==
          subtype
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, ""),
    ) ||
    new Set(subtypes).size !== subtypes.length
  )
    return undefined;
  return [...subtypes].sort();
}

function projectVariableCorpRezParameter(
  variableRez: CardVariableRezImplementation,
  finalBaseCredits: number,
): VisibleVariableCorpRezCostParameter | undefined {
  if (
    variableRez.visibility !== "public" ||
    !isExactNonNegativeInteger(finalBaseCredits)
  )
    return undefined;

  if (variableRez.kind === "x_strength") {
    if (
      !isExactNonNegativeInteger(variableRez.additionalCostPerValue) ||
      variableRez.additionalCostPerValue <= 0 ||
      !isExactNonNegativeInteger(variableRez.minValue) ||
      !isExactNonNegativeInteger(variableRez.maxValue) ||
      variableRez.maxValue < variableRez.minValue
    )
      return undefined;
    const minAdditionalCredits = exactNonNegativeIntegerProduct(
      variableRez.minValue,
      variableRez.additionalCostPerValue,
    );
    const maxAdditionalCredits = exactNonNegativeIntegerProduct(
      variableRez.maxValue,
      variableRez.additionalCostPerValue,
    );
    const minValueFinalCredits =
      minAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, minAdditionalCredits);
    const maxValueFinalCredits =
      maxAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, maxAdditionalCredits);
    if (
      minValueFinalCredits === undefined ||
      maxValueFinalCredits === undefined
    )
      return undefined;
    return {
      kind: variableRez.kind,
      additionalCreditsPerValue: variableRez.additionalCostPerValue,
      minValue: variableRez.minValue,
      maxValue: variableRez.maxValue,
      minValueFinalCredits,
      maxValueFinalCredits,
      effectiveStrengthFromValue: true,
      ...(variableRez.traceLimitFromValue
        ? { traceLimitFromValue: true as const }
        : {}),
    };
  }

  if (variableRez.kind === "paid_end_the_run_subroutines") {
    if (
      !isExactNonNegativeInteger(variableRez.additionalCostPerSubroutine) ||
      variableRez.additionalCostPerSubroutine <= 0 ||
      !isExactNonNegativeInteger(variableRez.minSubroutines)
    )
      return undefined;
    const firstEndTheRunSubroutineCount = Math.max(
      1,
      variableRez.minSubroutines,
    );
    const minAdditionalCredits = exactNonNegativeIntegerProduct(
      variableRez.minSubroutines,
      variableRez.additionalCostPerSubroutine,
    );
    const firstAdditionalCredits = exactNonNegativeIntegerProduct(
      firstEndTheRunSubroutineCount,
      variableRez.additionalCostPerSubroutine,
    );
    const minSubroutinesFinalCredits =
      minAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, minAdditionalCredits);
    const firstEndTheRunFinalCredits =
      firstAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, firstAdditionalCredits);
    if (
      minSubroutinesFinalCredits === undefined ||
      firstEndTheRunFinalCredits === undefined
    )
      return undefined;
    return {
      kind: variableRez.kind,
      additionalCreditsPerSubroutine: variableRez.additionalCostPerSubroutine,
      minSubroutines: variableRez.minSubroutines,
      minSubroutinesFinalCredits,
      firstEndTheRunSubroutineCount,
      firstEndTheRunFinalCredits,
    };
  }

  if (
    !isExactNonNegativeInteger(variableRez.additionalCost) ||
    variableRez.additionalCost <= 0
  )
    return undefined;
  const baseSubtypes = stableVisibleSubtypeList(variableRez.baseSubtypes);
  const alternateSubtypes = stableVisibleSubtypeList(
    variableRez.alternateSubtypes,
  );
  const alternateSubtypesFinalCredits = exactNonNegativeIntegerSum(
    finalBaseCredits,
    variableRez.additionalCost,
  );
  if (
    !baseSubtypes ||
    !alternateSubtypes ||
    baseSubtypes.join(",") === alternateSubtypes.join(",") ||
    alternateSubtypesFinalCredits === undefined
  )
    return undefined;
  return {
    kind: variableRez.kind,
    baseSubtypes,
    baseSubtypesFinalCredits: finalBaseCredits,
    alternateSubtypes,
    alternateSubtypesAdditionalCredits: variableRez.additionalCost,
    alternateSubtypesFinalCredits,
  };
}

/**
 * Converts the authoritative rez quote into a consumer-safe, explicitly
 * complete projection. Unsupported or non-integral costs fail closed.
 */
function projectExactCorpRezCost(
  originalState: GameState,
  context: "installed" | "post_install",
  cardId: CardInstanceId,
  targetServerId: ServerId,
  projectedServerId: Exclude<ServerId, "new_remote">,
): VisibleCorpRezCostQuote {
  const instance = originalState.cardInstances[cardId];
  const definitionId = instance?.definitionId;
  const definition = definitionId
    ? CARD_DEFINITIONS_BY_ID[definitionId]
    : undefined;
  if (
    !instance ||
    definition?.type !== "ice" ||
    !isExactNonNegativeInteger(definition.rezCost)
  )
    return incompleteCorpRezCostProjection(
      originalState,
      context,
      cardId,
      targetServerId,
      projectedServerId,
    );

  const additionalCosts = selfRezAdditionalCostsForIce(definition);
  if (
    additionalCosts.some(
      (cost) =>
        cost.kind !== "agenda_point" ||
        cost.visibility !== "public" ||
        !isExactNonNegativeInteger(cost.amount),
    )
  )
    return incompleteCorpRezCostProjection(
      originalState,
      context,
      cardId,
      targetServerId,
      projectedServerId,
    );

  const quote = quoteCorpRezCost(originalState, cardId, {
    projectedServerId,
  });
  if (
    !isExactNonNegativeInteger(quote.baseCredits) ||
    !isExactNonNegativeInteger(quote.finalCredits) ||
    quote.costs.some(
      (cost) =>
        (cost.clicks !== undefined &&
          !isExactNonNegativeInteger(cost.clicks)) ||
        (cost.credits !== undefined &&
          !isExactNonNegativeInteger(cost.credits)),
    ) ||
    quote.modifiers.some(
      (modifier) => !isExactNonNegativeInteger(modifier.amount),
    )
  )
    return incompleteCorpRezCostProjection(
      originalState,
      context,
      cardId,
      targetServerId,
      projectedServerId,
    );

  const agendaPointCost = selfRezAgendaPointCostForIce(definition);
  const variableRez = cardImplementationForDefinitionId(
    definition.id,
  )?.variableRez;
  const variableParameter = variableRez
    ? projectVariableCorpRezParameter(variableRez, quote.finalCredits)
    : undefined;
  if (variableRez && !variableParameter)
    return incompleteCorpRezCostProjection(
      originalState,
      context,
      cardId,
      targetServerId,
      projectedServerId,
    );
  const reductionSourceDefinitionIds = quote.modifiers
    .filter((modifier) => modifier.kind === "reduction")
    .map((modifier) => modifier.sourceDefinitionId);
  const increaseSourceDefinitionIds = quote.modifiers
    .filter((modifier) => modifier.kind === "increase")
    .map((modifier) => modifier.sourceDefinitionId);
  const commonCompleteFields = {
    cardId,
    projectedServerId,
    expiresAtStateVersion: originalState.stateVersion,
    complete: true as const,
    baseCredits: quote.baseCredits,
    finalCredits: quote.finalCredits,
    mandatoryAdditionalCosts: { agendaPoints: agendaPointCost },
    ...(reductionSourceDefinitionIds.length > 0
      ? { reductionSourceDefinitionIds }
      : {}),
    ...(increaseSourceDefinitionIds.length > 0
      ? { increaseSourceDefinitionIds }
      : {}),
  };
  const completeFields = variableParameter
    ? {
        ...commonCompleteFields,
        costKind: "variable" as const,
        variableParameter,
      }
    : {
        ...commonCompleteFields,
        costKind: "fixed" as const,
      };
  if (context === "installed") {
    if (targetServerId === "new_remote")
      throw new Error("Installed-Rez-Quote braucht einen bestehenden Server.");
    return { context, targetServerId, ...completeFields };
  }
  return { context, targetServerId, ...completeFields };
}

/**
 * Certifies the current rez cost for one already-installed Corp ICE.
 */
export function projectInstalledCorpIceRezCost(
  state: GameState,
  cardId: CardInstanceId,
): VisibleCorpRezCostQuote | undefined {
  const instance = state.cardInstances[cardId];
  if (
    !instance ||
    instance.owner !== "corp" ||
    instance.controller !== "corp" ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "serverIce" ||
    !instance.zone.serverId ||
    instance.rezzed
  )
    return undefined;
  const serverId = instance.zone.serverId;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId && candidate.ice.includes(cardId),
  );
  if (!server) return undefined;
  return projectExactCorpRezCost(
    state,
    "installed",
    cardId,
    serverId,
    serverId,
  );
}

export type CorpSequenceRezPaymentProjection =
  | { complete: false }
  | {
      complete: true;
      cardType: "ice" | "asset" | "upgrade";
      baseCredits: number;
      finalCredits: number;
      mandatoryAdditionalCosts: { agendaPoints: number };
      reductionSourceDefinitionIds?: CardDefinitionId[];
      increaseSourceDefinitionIds?: CardDefinitionId[];
      temporaryCreditsAvailable: number;
      temporaryCreditsApplied: number;
      regularCreditsAvailable: number;
      regularCreditsRequired: number;
      creditPayable: boolean;
      additionalCostsPayable: boolean;
      affordable: boolean;
    };

/**
 * Exact payment projection shared by optional and mandatory scored-agenda rez
 * steps. Missing printed costs, variable rez contracts and unsupported
 * mandatory costs stay explicitly incomplete.
 */
export function projectInstalledCorpSequenceRezPayment(
  state: GameState,
  cardId: CardInstanceId,
  temporaryCreditsAvailable: number,
): CorpSequenceRezPaymentProjection {
  const instance = state.cardInstances[cardId];
  const definition = instance
    ? CARD_DEFINITIONS_BY_ID[instance.definitionId]
    : undefined;
  const serverId =
    instance?.zone.side === "corp" &&
    (instance.zone.zone === "serverIce" || instance.zone.zone === "serverRoot")
      ? instance.zone.serverId
      : undefined;
  const server = serverId
    ? state.corp.servers.find((candidate) => candidate.id === serverId)
    : undefined;
  if (
    !instance ||
    instance.owner !== "corp" ||
    instance.controller !== "corp" ||
    instance.rezzed ||
    !definition ||
    !server ||
    server.kind !== "remote" ||
    !isExactNonNegativeInteger(temporaryCreditsAvailable) ||
    (instance.zone.zone === "serverIce"
      ? !server.ice.includes(cardId) || definition.type !== "ice"
      : instance.zone.zone === "serverRoot"
        ? !server.root.includes(cardId) ||
          (definition.type !== "asset" && definition.type !== "upgrade")
        : true)
  )
    return { complete: false };

  const unsupportedIceAdditionalCost =
    definition.type === "ice" &&
    selfRezAdditionalCostsForIce(definition).some(
      (cost) =>
        cost.kind !== "agenda_point" ||
        cost.visibility !== "public" ||
        !isExactNonNegativeInteger(cost.amount),
    );
  const rootAgendaPointCost =
    definition.type === "asset" || definition.type === "upgrade"
      ? rootRezAgendaPointCostForDefinition(definition)
      : 0;
  if (
    !isExactNonNegativeInteger(definition.rezCost) ||
    (definition.type === "ice" &&
      cardImplementationForDefinitionId(definition.id)?.variableRez !==
        undefined) ||
    unsupportedIceAdditionalCost ||
    !isExactNonNegativeInteger(rootAgendaPointCost)
  )
    return { complete: false };

  let quote: CostQuote;
  try {
    quote =
      definition.type === "ice"
        ? quoteCorpRezCost(state, cardId, { projectedServerId: server.id })
        : quoteCorpRootRezCost(state, cardId);
  } catch {
    return { complete: false };
  }
  if (
    !isExactNonNegativeInteger(quote.baseCredits) ||
    !isExactNonNegativeInteger(quote.finalCredits) ||
    quote.costs.some(
      (cost) =>
        (cost.clicks !== undefined &&
          !isExactNonNegativeInteger(cost.clicks)) ||
        (cost.credits !== undefined &&
          !isExactNonNegativeInteger(cost.credits)),
    ) ||
    quote.modifiers.some(
      (modifier) =>
        !isExactNonNegativeInteger(modifier.amount) ||
        modifier.sourceDefinitionId.trim().length === 0,
    )
  )
    return { complete: false };

  const mandatoryAgendaPoints =
    definition.type === "ice"
      ? selfRezAgendaPointCostForIce(definition)
      : rootAgendaPointCost;
  const exactAgendaPointsAvailable = exactCorpAgendaPointTotalForRezCost(state);
  if (
    !isExactNonNegativeInteger(mandatoryAgendaPoints) ||
    exactAgendaPointsAvailable === undefined ||
    !isExactNonNegativeInteger(state.corp.credits)
  )
    return { complete: false };

  const temporaryCreditsApplied = Math.min(
    temporaryCreditsAvailable,
    quote.finalCredits,
  );
  const regularCreditsRequired = quote.finalCredits - temporaryCreditsApplied;
  const regularCreditsAvailable = state.corp.credits;
  const creditPayable = regularCreditsAvailable >= regularCreditsRequired;
  const additionalCostsPayable =
    exactAgendaPointsAvailable >= mandatoryAgendaPoints;
  const reductionSourceDefinitionIds = [
    ...new Set(
      quote.modifiers
        .filter((modifier) => modifier.kind === "reduction")
        .map((modifier) => modifier.sourceDefinitionId),
    ),
  ].sort();
  const increaseSourceDefinitionIds = [
    ...new Set(
      quote.modifiers
        .filter((modifier) => modifier.kind === "increase")
        .map((modifier) => modifier.sourceDefinitionId),
    ),
  ].sort();
  return {
    complete: true,
    cardType: definition.type as "ice" | "asset" | "upgrade",
    baseCredits: quote.baseCredits,
    finalCredits: quote.finalCredits,
    mandatoryAdditionalCosts: { agendaPoints: mandatoryAgendaPoints },
    ...(reductionSourceDefinitionIds.length > 0
      ? { reductionSourceDefinitionIds }
      : {}),
    ...(increaseSourceDefinitionIds.length > 0
      ? { increaseSourceDefinitionIds }
      : {}),
    temporaryCreditsAvailable,
    temporaryCreditsApplied,
    regularCreditsAvailable,
    regularCreditsRequired,
    creditPayable,
    additionalCostsPayable,
    affordable: creditPayable && additionalCostsPayable,
  };
}

/**
 * Actor-private, state-bound payment projection for the exact optional rez
 * option opened by Data Fort Reclamation. The quote is derived from typed
 * sequence state and never persisted in GameState or reconstructed from the
 * choice source string.
 */
export function projectHqInstallRezOptionQuote(
  state: GameState,
  choice: ChoiceRequest,
  option: ChoiceOption,
): CorpOptionalRezChoiceQuote | undefined {
  const sequence = state.hqInstallRezSequence;
  if (
    !sequence ||
    state.pendingChoice?.choiceId !== choice.choiceId ||
    choice.side !== "corp" ||
    choice.kind !== "select_cards" ||
    choice.minSelections !== 0 ||
    choice.maxSelections !== 1 ||
    choice.options.length !== 1 ||
    choice.options[0]?.id !== option.id ||
    choice.stateVersion !== state.stateVersion ||
    !Number.isSafeInteger(sequence.nextCardIndex) ||
    sequence.nextCardIndex <= 0 ||
    !Number.isSafeInteger(sequence.temporaryCreditsRemaining) ||
    sequence.temporaryCreditsRemaining < 0
  )
    return undefined;

  const cardId = sequence.selectedCardIds[sequence.nextCardIndex - 1];
  if (
    !cardId ||
    option.value !== cardId ||
    !state.corp.scoreArea.includes(sequence.sourceAgendaId)
  )
    return undefined;

  const agenda = state.cardInstances[sequence.sourceAgendaId];
  const agendaDefinitionId = agenda?.definitionId;
  if (
    !agenda ||
    agenda.owner !== "corp" ||
    agenda.controller !== "corp" ||
    agenda.zone.side !== "corp" ||
    agenda.zone.zone !== "scoreArea" ||
    agendaDefinitionId !== sequence.sourceDefinitionId ||
    cardImplementationForDefinitionId(agendaDefinitionId)?.scoredAgenda
      ?.kind !== "score_install_hq_cards_into_new_remote_then_rez"
  )
    return undefined;

  const instance = state.cardInstances[cardId];
  const definitionId = instance?.definitionId;
  const definition = definitionId
    ? CARD_DEFINITIONS_BY_ID[definitionId]
    : undefined;
  const server = state.corp.servers.find(
    (candidate) => candidate.id === sequence.serverId,
  );
  if (
    !instance ||
    instance.owner !== "corp" ||
    instance.controller !== "corp" ||
    instance.rezzed ||
    instance.zone.side !== "corp" ||
    (instance.zone.zone !== "serverIce" &&
      instance.zone.zone !== "serverRoot") ||
    instance.zone.serverId !== sequence.serverId ||
    !definition ||
    !server ||
    (instance.zone.zone === "serverIce"
      ? !server.ice.includes(cardId)
      : !server.root.includes(cardId)) ||
    (definition.type === "ice" && instance.zone.zone !== "serverIce") ||
    ((definition.type === "asset" || definition.type === "upgrade") &&
      instance.zone.zone !== "serverRoot") ||
    (definition.type !== "ice" &&
      definition.type !== "asset" &&
      definition.type !== "upgrade")
  )
    return undefined;

  const binding = {
    schemaVersion: CORP_OPTIONAL_REZ_CHOICE_QUOTE_SCHEMA_VERSION,
    kind: CORP_OPTIONAL_REZ_CHOICE_QUOTE_KIND,
    context: "hq_to_new_remote_optional_rez" as const,
    choiceId: choice.choiceId,
    optionId: option.id,
    sourceAgendaId: sequence.sourceAgendaId,
    cardId,
    cardDefinitionId: definition.id,
    targetServerId: sequence.serverId,
    installedZone: instance.zone.zone,
    sequencePosition: sequence.nextCardIndex,
    stateVersion: state.stateVersion,
  };

  const continuation = sequence.optionalRezContinuationProjection;
  if (
    !continuation ||
    continuation.cardId !== cardId ||
    continuation.sequencePosition !== sequence.nextCardIndex ||
    continuation.stateVersion !== choice.stateVersion ||
    continuation.stateVersion !== state.stateVersion ||
    (continuation.executable && !continuation.complete)
  )
    return undefined;

  const payment = projectInstalledCorpSequenceRezPayment(
    state,
    cardId,
    sequence.temporaryCreditsRemaining,
  );
  if (!payment.complete) return { ...binding, complete: false };

  return {
    ...binding,
    ...payment,
    mandatoryContinuationComplete: continuation.complete,
    rezAndMandatoryContinuationExecutable:
      payment.affordable && continuation.complete && continuation.executable,
  };
}

/**
 * Projects the authoritative rez quote in the exact board position produced by
 * a legal Corp ICE install. The input state is never mutated.
 */
export function projectCorpIceRezCostAfterInstall(
  state: GameState,
  cardId: CardInstanceId,
  targetServerId: ServerId,
): VisibleCorpRezCostQuote {
  const instance = state.cardInstances[cardId];
  const projectedServerId =
    targetServerId === "new_remote"
      ? nextCanonicalRemoteServerId(state.corp.servers)
      : targetServerId;
  if (!projectedServerId)
    return incompleteCorpRezCostProjection(
      state,
      "post_install",
      cardId,
      targetServerId,
    );
  if (
    !instance ||
    instance.owner !== "corp" ||
    instance.controller !== "corp" ||
    instance.zone.side !== "corp" ||
    instance.zone.zone !== "hq" ||
    !state.corp.hq.includes(cardId)
  )
    return incompleteCorpRezCostProjection(
      state,
      "post_install",
      cardId,
      targetServerId,
    );

  const server =
    targetServerId === "new_remote"
      ? { id: projectedServerId }
      : state.corp.servers.find(
          (candidate) => candidate.id === projectedServerId,
        );
  if (!server)
    return incompleteCorpRezCostProjection(
      state,
      "post_install",
      cardId,
      targetServerId,
    );

  return projectExactCorpRezCost(
    state,
    "post_install",
    cardId,
    targetServerId,
    projectedServerId,
  );
}

export function corpIcePostInstallRezProjectionPayload(
  projection: VisibleCorpRezCostQuote,
): NonNullable<LegalAction["payload"]> {
  const certifiedVariableParameter =
    projection.complete && projection.costKind === "variable"
      ? projectCertifiedVariableRezPayload(
          projection.variableParameter,
          projection.finalCredits,
        )
      : undefined;
  const certifiedComplete =
    projection.complete &&
    isExactNonNegativeInteger(projection.baseCredits) &&
    isExactNonNegativeInteger(projection.finalCredits) &&
    isExactNonNegativeInteger(
      projection.mandatoryAdditionalCosts.agendaPoints,
    ) &&
    (projection.costKind === "fixed" ||
      (projection.costKind === "variable" &&
        certifiedVariableParameter !== undefined));
  const agendaPointCost = projection.complete
    ? projection.mandatoryAdditionalCosts.agendaPoints
    : 0;
  return {
    postInstallRezQuoteCardId: projection.cardId,
    postInstallRezQuoteTargetServerId: projection.targetServerId,
    postInstallRezQuoteExpiresAtStateVersion: projection.expiresAtStateVersion,
    postInstallRezQuoteComplete: certifiedComplete,
    ...(projection.complete
      ? {
          postInstallRezQuoteProjectedServerId: projection.projectedServerId,
        }
      : {}),
    ...(certifiedComplete
      ? {
          postInstallRezQuoteCostKind:
            projection.costKind === "variable" ? "variable" : "fixed",
          postInstallRezQuoteBaseCredits: projection.baseCredits,
          postInstallRezQuoteFinalCredits: projection.finalCredits,
          postInstallRezQuoteMandatoryAgendaPointCost: agendaPointCost,
          ...(certifiedVariableParameter ?? {}),
          ...(agendaPointCost > 0
            ? {
                postInstallRezQuoteMandatoryAdditionalCostKind: "agenda_point",
              }
            : {}),
          ...(projection.reductionSourceDefinitionIds?.length
            ? {
                postInstallRezQuoteReductionSourceDefinitionIds:
                  projection.reductionSourceDefinitionIds.join(","),
              }
            : {}),
          ...(projection.increaseSourceDefinitionIds?.length
            ? {
                postInstallRezQuoteIncreaseSourceDefinitionIds:
                  projection.increaseSourceDefinitionIds.join(","),
              }
            : {}),
        }
      : {}),
  };
}

function projectCertifiedVariableRezPayload(
  parameter: VisibleVariableCorpRezCostParameter,
  finalBaseCredits: number,
): NonNullable<LegalAction["payload"]> | undefined {
  if (!isExactNonNegativeInteger(finalBaseCredits)) return undefined;
  if (parameter.kind === "x_strength") {
    if (
      !isExactNonNegativeInteger(parameter.additionalCreditsPerValue) ||
      parameter.additionalCreditsPerValue <= 0 ||
      !isExactNonNegativeInteger(parameter.minValue) ||
      !isExactNonNegativeInteger(parameter.maxValue) ||
      parameter.maxValue < parameter.minValue ||
      !isExactNonNegativeInteger(parameter.minValueFinalCredits) ||
      !isExactNonNegativeInteger(parameter.maxValueFinalCredits)
    )
      return undefined;
    const minAdditionalCredits = exactNonNegativeIntegerProduct(
      parameter.minValue,
      parameter.additionalCreditsPerValue,
    );
    const maxAdditionalCredits = exactNonNegativeIntegerProduct(
      parameter.maxValue,
      parameter.additionalCreditsPerValue,
    );
    const expectedMinValueFinalCredits =
      minAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, minAdditionalCredits);
    const expectedMaxValueFinalCredits =
      maxAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, maxAdditionalCredits);
    if (
      parameter.minValueFinalCredits !== expectedMinValueFinalCredits ||
      parameter.maxValueFinalCredits !== expectedMaxValueFinalCredits
    )
      return undefined;
    return {
      postInstallRezQuoteVariableRezKind: parameter.kind,
      postInstallRezQuoteVariableAdditionalCreditsPerValue:
        parameter.additionalCreditsPerValue,
      postInstallRezQuoteVariableMinValue: parameter.minValue,
      postInstallRezQuoteVariableMaxValue: parameter.maxValue,
      postInstallRezQuoteVariableMinValueFinalCredits:
        parameter.minValueFinalCredits,
      postInstallRezQuoteVariableMaxValueFinalCredits:
        parameter.maxValueFinalCredits,
      postInstallRezQuoteVariableEffectiveStrengthFromValue:
        parameter.effectiveStrengthFromValue,
      ...(parameter.traceLimitFromValue
        ? { postInstallRezQuoteVariableTraceLimitFromValue: true }
        : {}),
    };
  }
  if (parameter.kind === "paid_end_the_run_subroutines") {
    if (
      !isExactNonNegativeInteger(parameter.additionalCreditsPerSubroutine) ||
      parameter.additionalCreditsPerSubroutine <= 0 ||
      !isExactNonNegativeInteger(parameter.minSubroutines) ||
      !isExactNonNegativeInteger(parameter.minSubroutinesFinalCredits) ||
      !isExactNonNegativeInteger(parameter.firstEndTheRunSubroutineCount) ||
      parameter.firstEndTheRunSubroutineCount < 1 ||
      !isExactNonNegativeInteger(parameter.firstEndTheRunFinalCredits)
    )
      return undefined;
    const expectedFirstEndTheRunSubroutineCount = Math.max(
      1,
      parameter.minSubroutines,
    );
    const minAdditionalCredits = exactNonNegativeIntegerProduct(
      parameter.minSubroutines,
      parameter.additionalCreditsPerSubroutine,
    );
    const firstAdditionalCredits = exactNonNegativeIntegerProduct(
      expectedFirstEndTheRunSubroutineCount,
      parameter.additionalCreditsPerSubroutine,
    );
    const expectedMinSubroutinesFinalCredits =
      minAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, minAdditionalCredits);
    const expectedFirstEndTheRunFinalCredits =
      firstAdditionalCredits === undefined
        ? undefined
        : exactNonNegativeIntegerSum(finalBaseCredits, firstAdditionalCredits);
    if (
      parameter.firstEndTheRunSubroutineCount !==
        expectedFirstEndTheRunSubroutineCount ||
      parameter.minSubroutinesFinalCredits !==
        expectedMinSubroutinesFinalCredits ||
      parameter.firstEndTheRunFinalCredits !==
        expectedFirstEndTheRunFinalCredits
    )
      return undefined;
    return {
      postInstallRezQuoteVariableRezKind: parameter.kind,
      postInstallRezQuoteVariableAdditionalCreditsPerSubroutine:
        parameter.additionalCreditsPerSubroutine,
      postInstallRezQuoteVariableMinSubroutines: parameter.minSubroutines,
      postInstallRezQuoteVariableMinSubroutinesFinalCredits:
        parameter.minSubroutinesFinalCredits,
      postInstallRezQuoteVariableFirstEndTheRunSubroutineCount:
        parameter.firstEndTheRunSubroutineCount,
      postInstallRezQuoteVariableFirstEndTheRunFinalCredits:
        parameter.firstEndTheRunFinalCredits,
    };
  }
  const certifiedBaseSubtypes = stableVisibleSubtypeList(
    parameter.baseSubtypes,
  );
  const certifiedAlternateSubtypes = stableVisibleSubtypeList(
    parameter.alternateSubtypes,
  );
  const expectedAlternateSubtypesFinalCredits = exactNonNegativeIntegerSum(
    finalBaseCredits,
    parameter.alternateSubtypesAdditionalCredits,
  );
  if (
    !certifiedBaseSubtypes ||
    !certifiedAlternateSubtypes ||
    certifiedBaseSubtypes.join(",") !== parameter.baseSubtypes.join(",") ||
    certifiedAlternateSubtypes.join(",") !==
      parameter.alternateSubtypes.join(",") ||
    certifiedBaseSubtypes.join(",") === certifiedAlternateSubtypes.join(",") ||
    !isExactNonNegativeInteger(parameter.baseSubtypesFinalCredits) ||
    parameter.baseSubtypesFinalCredits !== finalBaseCredits ||
    !isExactNonNegativeInteger(parameter.alternateSubtypesAdditionalCredits) ||
    parameter.alternateSubtypesAdditionalCredits <= 0 ||
    !isExactNonNegativeInteger(parameter.alternateSubtypesFinalCredits) ||
    parameter.alternateSubtypesFinalCredits !==
      expectedAlternateSubtypesFinalCredits
  )
    return undefined;
  return {
    postInstallRezQuoteVariableRezKind: parameter.kind,
    postInstallRezQuoteVariableBaseSubtypes: parameter.baseSubtypes.join(","),
    postInstallRezQuoteVariableBaseSubtypesFinalCredits:
      parameter.baseSubtypesFinalCredits,
    postInstallRezQuoteVariableAlternateSubtypes:
      parameter.alternateSubtypes.join(","),
    postInstallRezQuoteVariableAlternateSubtypesAdditionalCredits:
      parameter.alternateSubtypesAdditionalCredits,
    postInstallRezQuoteVariableAlternateSubtypesFinalCredits:
      parameter.alternateSubtypesFinalCredits,
  };
}

function mustRun(state: GameState): NonNullable<GameState["run"]> {
  if (!state.run) throw new Error("Kein aktiver Run.");
  return state.run;
}

function mustServer(
  state: GameState,
  id: string,
): GameState["corp"]["servers"][number] {
  const server = state.corp.servers.find((candidate) => candidate.id === id);
  if (!server) throw new Error(`Unknown server: ${id}`);
  return server;
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  return cardDefinitionForInstance(state, id);
}

function corpRezCostModifierAppliesToIce(
  state: GameState,
  modifier: CardRezCostModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
  projectedServerId?: Exclude<ServerId, "new_remote">,
): boolean {
  if (
    modifier.operation !== "reduce" ||
    !isPublicRezzedCorpRootModifier(modifier)
  )
    return false;
  if (
    !cardDefinitionMatchesModifierAppliesTo(iceDefinition, modifier.appliesTo)
  )
    return false;
  if (projectedServerId && modifier.appliesTo.sameServerAsSource)
    return (
      corpServerIdForInstalledCard(state, sourceCardInstanceId) ===
      projectedServerId
    );
  return sameServerAsSourceApplies(
    state,
    sourceCardInstanceId,
    iceId,
    modifier.appliesTo.sameServerAsSource,
  );
}

/**
 * Collects currently active rez-cost modifiers for one ICE.
 *
 * Same-server filtering uses either the current installed position or an
 * explicit projected post-install server. Stale action protection relies on
 * callers rebuilding and comparing the quote before pay.
 */
function activeCorpRezCostModifiersForIce(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
  projectedServerId?: Exclude<ServerId, "new_remote">,
): ActiveCorpRezCostModifier[] {
  const matches: ActiveCorpRezCostModifier[] = [];
  for (const match of activeCardImplementationModifiersForCorpRoot(
    state,
    "rez_cost",
  )) {
    if (
      !corpRezCostModifierAppliesToIce(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        iceId,
        iceDefinition,
        projectedServerId,
      )
    )
      continue;
    matches.push(match);
  }
  return matches;
}

function activeCorpSelfRezCostModifiersForIce(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): ActiveCorpSelfRezCostModifier[] {
  if (iceDefinition.type !== "ice") return [];
  if (state.run?.usedNoisyIcebreakerThisRun !== true) return [];
  const implementation = cardImplementationForDefinitionId(iceDefinition.id);
  return (implementation?.selfRezCostModifiers ?? [])
    .filter(
      (modifier) =>
        modifier.kind ===
          "self_rez_cost_reduction_during_run_after_noisy_icebreaker" &&
        modifier.visibility === "public" &&
        modifier.amount > 0,
    )
    .map((modifier) => ({
      sourceCardInstanceId: iceId,
      sourceDefinitionId: iceDefinition.id,
      modifier,
    }));
}

function selfRezAdditionalCostsForIce(
  definition: CardDefinition,
): readonly CardSelfRezAdditionalCostImplementation[] {
  if (definition.type !== "ice") return [];
  return (
    cardImplementationForDefinitionId(definition.id)?.selfRezAdditionalCosts ??
    []
  );
}

function selfRezAgendaPointCostForIce(definition: CardDefinition): number {
  return selfRezAdditionalCostsForIce(definition)
    .filter(
      (cost) => cost.kind === "agenda_point" && cost.visibility === "public",
    )
    .reduce((sum, cost) => sum + Math.max(0, Math.floor(cost.amount)), 0);
}

function corpAgendaPointTotalForRezCost(state: GameState): number {
  const bonusPoints = Math.max(0, Math.floor(state.corpBonusAgendaPoints ?? 0));
  const scoredPoints = state.corp.scoreArea.reduce((sum, cardId) => {
    const instance = state.cardInstances[cardId];
    const definitionId = instance?.definitionId;
    if (!definitionId) return sum;
    const printedPoints =
      CARD_DEFINITIONS_BY_ID[definitionId]?.agendaPoints ?? 0;
    const counterPoints = Number(instance.counters?.agenda ?? 0);
    const spentPoints = Math.max(
      0,
      Math.floor(instance.agendaPointsSpent ?? 0),
    );
    return (
      sum + Math.max(0, Math.floor(printedPoints + counterPoints - spentPoints))
    );
  }, 0);
  return bonusPoints + scoredPoints;
}

function exactCorpAgendaPointTotalForRezCost(
  state: GameState,
): number | undefined {
  const bonusPoints = state.corpBonusAgendaPoints ?? 0;
  if (!isExactNonNegativeInteger(bonusPoints)) return undefined;
  let total = bonusPoints;
  for (const cardId of state.corp.scoreArea) {
    const instance = state.cardInstances[cardId];
    const definition = instance
      ? CARD_DEFINITIONS_BY_ID[instance.definitionId]
      : undefined;
    const printedPoints = definition?.agendaPoints;
    const counterPoints = instance?.counters?.agenda ?? 0;
    const spentPoints = instance?.agendaPointsSpent ?? 0;
    if (
      !instance ||
      definition?.type !== "agenda" ||
      !isExactNonNegativeInteger(printedPoints) ||
      !isExactNonNegativeInteger(counterPoints) ||
      !isExactNonNegativeInteger(spentPoints) ||
      spentPoints > printedPoints + counterPoints
    )
      return undefined;
    total += printedPoints + counterPoints - spentPoints;
  }
  return total;
}

function rootRezAgendaPointCostForDefinition(
  definition: CardDefinition,
): number {
  const longtail = cardImplementationForDefinitionId(
    definition.id,
  )?.remainingReplacementLongtail;
  if (longtail?.kind !== "obligation_debt") return 0;
  return Math.max(0, Math.floor(longtail.agendaPointRezCost));
}

function corpInstallCostModifierAppliesToCard(
  state: GameState,
  modifier: CardInstallCostModifierImplementation,
  sourceCardInstanceId: CardInstanceId,
  definition: CardDefinition,
  targetServerId: CorpServer["id"],
): boolean {
  if (
    !isPublicRezzedCorpRootModifier(modifier) &&
    !isPublicRunnerInstalledModifier(modifier)
  )
    return false;
  if (modifier.appliesTo.side !== "corp") return false;
  if (!cardDefinitionMatchesModifierAppliesTo(definition, modifier.appliesTo))
    return false;
  if (modifier.appliesTo.selectedServerAsSource) {
    const selectedServerId =
      state.cardInstances[sourceCardInstanceId]?.selectedServerId;
    return selectedServerId === targetServerId;
  }
  if (!modifier.appliesTo.sameServerAsSource) return true;
  return (
    corpServerIdForInstalledCard(state, sourceCardInstanceId) === targetServerId
  );
}

function activeCorpInstallCostModifiersForCard(
  state: GameState,
  definition: CardDefinition,
  server: CorpServer,
): ActiveCorpInstallCostModifier[] {
  const matches: ActiveCorpInstallCostModifier[] = [];
  for (const match of activeCardImplementationModifiersForCorpRoot(
    state,
    "install_cost",
  )) {
    if (
      !corpInstallCostModifierAppliesToCard(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        definition,
        server.id,
      )
    )
      continue;
    matches.push(match);
  }
  for (const match of activeCardImplementationModifiersForRunnerInstalled(
    state,
    "install_cost",
  )) {
    if (
      !corpInstallCostModifierAppliesToCard(
        state,
        match.modifier,
        match.sourceCardInstanceId,
        definition,
        server.id,
      )
    )
      continue;
    matches.push(match);
  }
  return matches;
}

function iceRezCostReductionFor(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): number {
  const activeRootReduction = activeCorpRezCostModifiersForIce(
    state,
    iceId,
    iceDefinition,
  ).reduce((sum, match) => sum + match.modifier.amount, 0);
  const activeSelfReduction = activeCorpSelfRezCostModifiersForIce(
    state,
    iceId,
    iceDefinition,
  ).reduce((sum, match) => sum + match.modifier.amount, 0);
  return activeRootReduction + activeSelfReduction;
}

export function rezCostReductionSourceDefinitionIdsFor(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): CardDefinitionId[] {
  return [
    ...activeCorpRezCostModifiersForIce(state, iceId, iceDefinition),
    ...activeCorpSelfRezCostModifiersForIce(state, iceId, iceDefinition),
  ].map((match) => match.sourceDefinitionId);
}

/**
 * Calculates current effective rez cost for a card without paying it.
 */
export function rezCostForCard(
  state: GameState,
  cardId: CardInstanceId,
): number {
  const definition = definitionFor(state, cardId);
  const baseCost = definition.rezCost ?? 0;
  if (definition.type !== "ice") return baseCost;
  const reduction = iceRezCostReductionFor(state, cardId, definition);
  return Math.max(0, baseCost - reduction);
}

function corpRezCostModifierQuoteForMatch(
  match: ActiveCorpRezCostModifier,
): CostModifierQuote {
  const { sourceCardInstanceId, sourceDefinitionId, modifier } = match;
  const sourceDefinition = CARD_DEFINITIONS_BY_ID[sourceDefinitionId];
  return {
    sourceCardInstanceId,
    sourceDefinitionId,
    label: sourceDefinition?.title ?? sourceDefinitionId,
    amount: modifier.amount,
    kind: "reduction",
  };
}

function corpSelfRezCostModifierQuoteForMatch(
  match: ActiveCorpSelfRezCostModifier,
): CostModifierQuote {
  const { sourceCardInstanceId, sourceDefinitionId, modifier } = match;
  const sourceDefinition = CARD_DEFINITIONS_BY_ID[sourceDefinitionId];
  return {
    sourceCardInstanceId,
    sourceDefinitionId,
    label: sourceDefinition?.title ?? sourceDefinitionId,
    amount: modifier.amount,
    kind: "reduction",
  };
}

function corpInstallCostModifierQuoteForMatch(
  match: ActiveCorpInstallCostModifier,
): CostModifierQuote {
  const { sourceCardInstanceId, sourceDefinitionId, modifier } = match;
  const sourceDefinition = CARD_DEFINITIONS_BY_ID[sourceDefinitionId];
  return {
    sourceCardInstanceId,
    sourceDefinitionId,
    label: sourceDefinition?.title ?? sourceDefinitionId,
    amount: modifier.amount,
    kind: "reduction",
  };
}

export function quoteCorpIceInstallCost(
  state: GameState,
  cardId: CardInstanceId,
  server: CorpServer,
  options: CorpInstallCostOptions = {},
): CostQuote {
  const definition = definitionFor(state, cardId);
  const baseCredits = Math.max(0, server.ice.length);
  const additionalCredits = Math.max(
    0,
    Math.floor(options.additionalCredits ?? 0),
  );
  const legacyReduction = Math.max(0, Math.floor(options.legacyReduction ?? 0));
  const modifierMatches =
    definition.type === "ice"
      ? activeCorpInstallCostModifiersForCard(state, definition, server)
      : [];
  const modifierReduction = modifierMatches.reduce(
    (sum, match) =>
      match.modifier.operation === "reduce" ? sum + match.modifier.amount : sum,
    0,
  );
  const modifierIncrease = modifierMatches.reduce(
    (sum, match) =>
      match.modifier.operation === "increase"
        ? sum + match.modifier.amount
        : sum,
    0,
  );
  const totalReduction = legacyReduction + modifierReduction;
  const finalCredits = Math.max(
    0,
    baseCredits + additionalCredits + modifierIncrease - totalReduction,
  );
  const publicPayload: NonNullable<LegalAction["payload"]> = {
    cardId,
    serverId: server.id,
    placement: "ice",
    iceInstallBaseCost: baseCredits,
    iceInstallAdditionalCost: additionalCredits + modifierIncrease,
    iceInstallReduction: totalReduction,
    iceInstallTotalCost: finalCredits,
  };
  const reductionSourceDefinitionIds = modifierMatches
    .filter((match) => match.modifier.operation === "reduce")
    .map((match) => match.sourceDefinitionId);
  if (reductionSourceDefinitionIds.length > 0)
    publicPayload.iceInstallReductionSourceDefinitionIds =
      reductionSourceDefinitionIds.join(",");
  const increaseSourceDefinitionIds = modifierMatches
    .filter((match) => match.modifier.operation === "increase")
    .map((match) => match.sourceDefinitionId);
  if (increaseSourceDefinitionIds.length > 0)
    publicPayload.iceInstallIncreaseSourceDefinitionIds =
      increaseSourceDefinitionIds.join(",");

  return {
    purpose: "corp_install",
    side: "corp",
    targetCardId: cardId,
    baseCredits,
    finalCredits,
    costs: [{ credits: finalCredits }],
    modifiers: modifierMatches.map((match) =>
      corpInstallCostModifierQuoteForMatch(match),
    ),
    canPay: state.corp.credits >= finalCredits,
    publicPayload,
  };
}

export function quoteCorpRezCost(
  state: GameState,
  iceId: CardInstanceId,
  options: CorpRezCostOptions = {},
): CostQuote {
  const definition = definitionFor(state, iceId);
  const baseCredits = definition.rezCost ?? 0;
  const existingModifierMatches =
    definition.type === "ice"
      ? activeCorpRezCostModifiersForIce(
          state,
          iceId,
          definition,
          options.projectedServerId,
        )
      : [];
  const selfModifierMatches =
    definition.type === "ice"
      ? activeCorpSelfRezCostModifiersForIce(state, iceId, definition)
      : [];
  const regularFinalCredits = Math.max(
    0,
    baseCredits -
      existingModifierMatches.reduce(
        (sum, match) => sum + match.modifier.amount,
        0,
      ) -
      selfModifierMatches.reduce(
        (sum, match) => sum + match.modifier.amount,
        0,
      ),
  );
  const existingSourceDefinitionIds = [
    ...existingModifierMatches,
    ...selfModifierMatches,
  ].map((match) => match.sourceDefinitionId);
  const discountedRezSourceCardId = options.discountedRezSourceCardId;
  const discountedRezSourceDefinitionId = discountedRezSourceCardId
    ? definitionFor(state, discountedRezSourceCardId).id
    : undefined;
  let finalCredits = discountedRezSourceCardId
    ? Math.max(0, Math.floor(regularFinalCredits / 2))
    : regularFinalCredits;
  const agendaPointCost = selfRezAgendaPointCostForIce(definition);
  const publicPayload: NonNullable<LegalAction["payload"]> = {
    cardId: iceId,
  };
  const modifiers = existingModifierMatches.map((match) =>
    corpRezCostModifierQuoteForMatch(match),
  );
  modifiers.push(
    ...selfModifierMatches.map((match) =>
      corpSelfRezCostModifierQuoteForMatch(match),
    ),
  );

  if (discountedRezSourceCardId) {
    const sourceDefinitionId = discountedRezSourceDefinitionId!;
    publicPayload.serverId = corpServerIdForInstalledCard(state, iceId) ?? "";
    publicPayload.discountedRezSourceCardId = discountedRezSourceCardId;
    publicPayload.discountedRezSourceDefinitionId = sourceDefinitionId;
    publicPayload.discountedRezCostBase = regularFinalCredits;
    publicPayload.temporaryDerezAfterRun = true;
    publicPayload.rezCostReductionSourceDefinitionIds = [
      ...existingSourceDefinitionIds,
      sourceDefinitionId,
    ].join(",");
    publicPayload.rezCostReductionAmount = baseCredits - finalCredits;
    publicPayload.rezCostPaid = finalCredits;
    modifiers.push({
      sourceCardInstanceId: discountedRezSourceCardId,
      sourceDefinitionId,
      label:
        CARD_DEFINITIONS_BY_ID[sourceDefinitionId]?.title ?? sourceDefinitionId,
      amount: regularFinalCredits - finalCredits,
      kind: "reduction",
    });
  } else if (existingSourceDefinitionIds.length > 0) {
    publicPayload.rezCostReductionSourceDefinitionIds =
      existingSourceDefinitionIds.join(",");
    publicPayload.rezCostReductionAmount = baseCredits - finalCredits;
    publicPayload.rezCostPaid = finalCredits;
  }
  const runRezSurcharge = currentRunRezSurcharge(state, baseCredits);
  if (runRezSurcharge.amount > 0) {
    finalCredits += runRezSurcharge.amount;
    publicPayload.corpRezCostSurchargeAmount = runRezSurcharge.amount;
    publicPayload.corpRezCostSurchargeSourceDefinitionId =
      runRezSurcharge.sourceDefinitionId;
    publicPayload.rezCostPaid = finalCredits;
    modifiers.push({
      sourceDefinitionId: runRezSurcharge.sourceDefinitionId,
      label:
        CARD_DEFINITIONS_BY_ID[runRezSurcharge.sourceDefinitionId]?.title ??
        runRezSurcharge.sourceDefinitionId,
      amount: runRezSurcharge.amount,
      kind: "increase",
    });
  }
  if (agendaPointCost > 0) {
    publicPayload.agendaPointCost = agendaPointCost;
    publicPayload.selfRezAdditionalCostKind = "agenda_point";
  }

  return {
    purpose: "corp_rez",
    side: "corp",
    targetCardId: iceId,
    baseCredits,
    finalCredits,
    costs: [{ credits: finalCredits }],
    modifiers,
    canPay:
      state.corp.credits >= finalCredits &&
      corpAgendaPointTotalForRezCost(state) >= agendaPointCost,
    publicPayload,
  };
}

/**
 * Builds the complete public payment contract for an installed Corp root card.
 * The same quote is consumed by every root-rez action window and revalidated
 * immediately before payment.
 */
export function quoteCorpRootRezCost(
  state: GameState,
  cardId: CardInstanceId,
): CostQuote {
  const instance = state.cardInstances[cardId];
  if (!instance) throw new Error("Root-Rez-Ziel existiert nicht mehr.");
  const definition = definitionFor(state, cardId);
  if (definition.type !== "asset" && definition.type !== "upgrade")
    throw new Error(
      "Root-Rez-Kostenquote ist nur fuer Assets und Upgrades gueltig.",
    );
  const serverId = corpServerIdForInstalledCard(state, cardId);
  const server = serverId
    ? state.corp.servers.find((candidate) => candidate.id === serverId)
    : undefined;
  if (!serverId || !server?.root.includes(cardId))
    throw new Error(
      "Root-Rez-Ziel ist nicht mehr in einer Server-Root installiert.",
    );

  const baseQuote = quoteCorpRezCost(state, cardId);
  const agendaPointCost = rootRezAgendaPointCostForDefinition(definition);
  return {
    ...baseQuote,
    canPay:
      baseQuote.canPay &&
      corpAgendaPointTotalForRezCost(state) >= agendaPointCost,
    publicPayload: {
      ...baseQuote.publicPayload,
      rootRez: true,
      serverId,
      ...(agendaPointCost > 0
        ? {
            agendaPointCost,
            obligationDebtAbility: "rez_with_agenda_point_cost",
          }
        : {}),
    },
  };
}

export function quoteCorpFortRunRezSupport(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  actionId: string,
  rezCredits: number,
): CorpFortRunRezSupportQuote | undefined {
  const source = state.cardInstances[sourceCardInstanceId];
  const sourceDefinitionId = source?.definitionId;
  const serverId = corpServerIdForInstalledCard(state, sourceCardInstanceId);
  const server = serverId
    ? state.corp.servers.find((candidate) => candidate.id === serverId)
    : undefined;
  const run = state.run;
  const fortRunKind = definitionHasFortRunWindowKind(
    sourceDefinitionId ?? "card_implementation",
    CORP_FORT_RUN_REZ_SUPPORT_KIND,
  )
    ? CORP_FORT_RUN_REZ_SUPPORT_KIND
    : definitionHasFortRunWindowKind(
          sourceDefinitionId ?? "card_implementation",
          CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND,
        )
      ? CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND
      : undefined;
  if (
    !source ||
    source.owner !== "corp" ||
    source.controller !== "corp" ||
    source.rezzed ||
    source.zone.side !== "corp" ||
    source.zone.zone !== "serverRoot" ||
    !sourceDefinitionId ||
    !serverId ||
    !server ||
    !server.root.includes(sourceCardInstanceId) ||
    !fortRunKind ||
    !run ||
    run.attackedServerId !== serverId ||
    run.delayedSuccessfulRun !== undefined ||
    run.successfulRunInterventionWindowClosed === true ||
    (run.successfulRunInterventionUsedSourceIds ?? []).includes(
      sourceCardInstanceId,
    ) ||
    actionId.trim().length === 0 ||
    !isExactNonNegativeInteger(rezCredits)
  )
    return undefined;

  const finalIceWindow =
    run.position.kind === "ice" &&
    run.position.serverId === serverId &&
    run.position.iceIndex === 0 &&
    ((state.timingPoint === "run.approach_ice" &&
      run.phase === "approach_ice") ||
      (state.timingPoint === "run.movement_rez_window" &&
        run.phase === "movement"));
  const finalServerWindow =
    state.timingPoint === "run.movement_rez_window" &&
    run.phase === "movement" &&
    run.position.kind === "server" &&
    run.position.serverId === serverId;
  if (!finalIceWindow && !finalServerWindow) return undefined;

  const eligibleHqIceCosts = state.corp.hq.flatMap((cardId) => {
    const instance = state.cardInstances[cardId];
    const definition = instance
      ? CARD_DEFINITIONS_BY_ID[instance.definitionId]
      : undefined;
    if (
      instance?.owner !== "corp" ||
      instance.controller !== "corp" ||
      instance.zone.side !== "corp" ||
      instance.zone.zone !== "hq" ||
      definition?.type !== "ice"
    ) {
      return [];
    }
    const followupCost =
      fortRunKind === CORP_FORT_RUN_TEMPORARY_ENCOUNTER_REZ_SUPPORT_KIND
        ? Math.max(0, Math.floor(rezCostForCard(state, cardId) / 2))
        : server.ice.length;
    return isExactNonNegativeInteger(followupCost) ? [followupCost] : [];
  });
  const hasOwnHqIce = eligibleHqIceCosts.length > 0;
  const followupCredits = hasOwnHqIce ? Math.min(...eligibleHqIceCosts) : 0;
  const installCredits =
    fortRunKind === CORP_FORT_RUN_REZ_SUPPORT_KIND ? followupCredits : 0;
  if (
    !isExactNonNegativeInteger(followupCredits) ||
    !isExactNonNegativeInteger(installCredits)
  )
    return undefined;
  const totalCredits = rezCredits + followupCredits;
  if (!Number.isSafeInteger(totalCredits)) return undefined;
  return {
    schemaVersion: CORP_FORT_RUN_REZ_SUPPORT_QUOTE_SCHEMA_VERSION,
    fortRunKind,
    complete: true,
    sourceCardInstanceId,
    targetServerId: serverId,
    stateVersion: state.stateVersion,
    actionId,
    rezCredits,
    followupCredits,
    installCredits,
    totalCredits,
    totalCreditsPayable: state.corp.credits >= totalCredits,
    hasOwnHqIce,
  };
}

export function corpFortRunRezSupportQuotePayload(
  quote: CorpFortRunRezSupportQuote,
): NonNullable<LegalAction["payload"]> {
  return {
    cardImplementationFortRunRezSupportQuoteSchemaVersion: quote.schemaVersion,
    cardImplementationFortRunRezSupportQuoteKind: quote.fortRunKind,
    cardImplementationFortRunRezSupportQuoteComplete: quote.complete,
    cardImplementationFortRunRezSupportQuoteSourceCardInstanceId:
      quote.sourceCardInstanceId,
    cardImplementationFortRunRezSupportQuoteTargetServerId:
      quote.targetServerId,
    cardImplementationFortRunRezSupportQuoteStateVersion: quote.stateVersion,
    cardImplementationFortRunRezSupportQuoteActionId: quote.actionId,
    cardImplementationFortRunRezSupportQuoteRezCredits: quote.rezCredits,
    cardImplementationFortRunRezSupportQuoteFollowupCredits:
      quote.followupCredits,
    cardImplementationFortRunRezSupportQuoteInstallCredits:
      quote.installCredits,
    cardImplementationFortRunRezSupportQuoteTotalCredits: quote.totalCredits,
    cardImplementationFortRunRezSupportQuoteTotalCreditsPayable:
      quote.totalCreditsPayable,
    cardImplementationFortRunRezSupportQuoteHasOwnHqIce: quote.hasOwnHqIce,
  };
}

function currentRunRezSurcharge(
  state: GameState,
  printedRezCost: number,
): { amount: number; sourceDefinitionId: CardDefinitionId } {
  const surcharge = state.run?.corpRezCostSurcharge;
  if (surcharge?.kind !== "matching_printed_rez_cost")
    return { amount: 0, sourceDefinitionId: "card_implementation" };
  return {
    amount: Math.max(0, Math.floor(printedRezCost)),
    sourceDefinitionId: surcharge.sourceDefinitionId,
  };
}

function definitionHasFortRunWindowKind(
  definitionId: CardDefinitionId,
  kind: CardFortRunWindowImplementation["kind"],
): boolean {
  return (
    cardImplementationForDefinitionId(definitionId)?.fortRunWindows?.some(
      (window) => window.kind === kind,
    ) ?? false
  );
}

function isDiscountedRezSourceDefinition(
  definitionId: CardDefinitionId,
): boolean {
  return definitionHasFortRunWindowKind(
    definitionId,
    "discounted_rez_ice_on_this_fort",
  );
}

export function discountedRezSourceIdsForRunIce(
  state: GameState,
  iceId: CardInstanceId,
): CardInstanceId[] {
  const run = state.run;
  if (!run || run.phase !== "approach_ice" || run.approachedIceId !== iceId)
    return [];
  if (corpServerIdForInstalledCard(state, iceId) !== run.attackedServerId)
    return [];
  const used = new Set(run.discountedRezUsedSourceIdsThisRun ?? []);
  const server = mustServer(state, run.attackedServerId);
  return server.root
    .filter((sourceId) => {
      const instance = state.cardInstances[sourceId];
      return (
        instance?.rezzed === true &&
        isDiscountedRezSourceDefinition(definitionFor(state, sourceId).id) &&
        !used.has(sourceId)
      );
    })
    .sort();
}

export function assertCorpRezCostQuoteValid(
  state: GameState,
  iceId: CardInstanceId,
  legalAction: LegalAction,
): CostQuote {
  const instance = state.cardInstances[iceId];
  if (!instance) throw new Error("Rez-Ziel existiert nicht mehr.");
  if (instance.rezzed) throw new Error("ICE ist bereits gerezzt.");
  const definition = definitionFor(state, iceId);
  if (definition.type !== "ice")
    throw new Error("Corp-Rez-Kostenquote ist nur fuer ICE gueltig.");
  const forcedRezOrTrashEffect =
    legalAction.payload?.forcedRezOrTrashEffect === true;
  const run = forcedRezOrTrashEffect ? state.run : mustRun(state);
  const successfulRunForceRezQuote =
    legalAction.payload?.successfulRunForceRezQuote === true &&
    run?.successful === true &&
    run.phase === "access" &&
    legalAction.payload?.serverId === run.attackedServerId &&
    corpServerIdForInstalledCard(state, iceId) === run.attackedServerId;
  if (
    !forcedRezOrTrashEffect &&
    !successfulRunForceRezQuote &&
    (state.timingPoint !== "run.approach_ice" ||
      run?.phase !== "approach_ice" ||
      run.approachedIceId !== iceId)
  )
    throw new Error("ICE ist nicht mehr im passenden Rez-Fenster.");
  const discountedRezSourceCardId =
    typeof legalAction.payload?.discountedRezSourceCardId === "string"
      ? (legalAction.payload.discountedRezSourceCardId as CardInstanceId)
      : undefined;
  if (discountedRezSourceCardId) {
    if (!run)
      throw new Error("Discounted-Rez-Quelle braucht einen laufenden Run.");
    if (!state.cardInstances[discountedRezSourceCardId])
      throw new Error("Discounted-Rez-Quelle fehlt.");
    const availableSources = discountedRezSourceIdsForRunIce(state, iceId);
    if (!availableSources.includes(discountedRezSourceCardId))
      throw new Error(
        "Die Discounted-Rez-Quelle ist fuer dieses ICE nicht aktiv.",
      );
    if (
      corpServerIdForInstalledCard(state, discountedRezSourceCardId) !==
      run.attackedServerId
    )
      throw new Error(
        "Die Discounted-Rez-Quelle gehoert nicht zu diesem Fort.",
      );
  }
  const quote = quoteCorpRezCost(state, iceId, {
    ...(discountedRezSourceCardId ? { discountedRezSourceCardId } : {}),
  });
  if (!quote.canPay) throw new Error("Corp kann die Rez-Kosten nicht zahlen.");
  if ((legalAction.costs[0]?.credits ?? 0) !== quote.finalCredits)
    throw new Error("Corp-Rez-Kosten sind nicht mehr gueltig.");
  const quotedAgendaPointCost = Number(
    quote.publicPayload.agendaPointCost ?? 0,
  );
  const actionAgendaPointCost = Number(
    legalAction.payload?.agendaPointCost ?? 0,
  );
  if (
    !Number.isInteger(actionAgendaPointCost) ||
    actionAgendaPointCost !== quotedAgendaPointCost
  )
    throw new Error("Corp-Rez-Agenda-Punkt-Kosten sind nicht mehr gueltig.");
  return quote;
}

const ROOT_REZ_QUOTE_PAYLOAD_FIELDS = [
  "cardId",
  "rootRez",
  "serverId",
  "agendaPointCost",
  "obligationDebtAbility",
  "rezCostReductionSourceDefinitionIds",
  "rezCostReductionAmount",
  "rezCostPaid",
  "corpRezCostSurchargeAmount",
  "corpRezCostSurchargeSourceDefinitionId",
] as const;

const FORT_RUN_REZ_SUPPORT_QUOTE_PAYLOAD_FIELDS = [
  "cardImplementationFortRunRezSupportQuoteSchemaVersion",
  "cardImplementationFortRunRezSupportQuoteKind",
  "cardImplementationFortRunRezSupportQuoteComplete",
  "cardImplementationFortRunRezSupportQuoteSourceCardInstanceId",
  "cardImplementationFortRunRezSupportQuoteTargetServerId",
  "cardImplementationFortRunRezSupportQuoteStateVersion",
  "cardImplementationFortRunRezSupportQuoteActionId",
  "cardImplementationFortRunRezSupportQuoteRezCredits",
  "cardImplementationFortRunRezSupportQuoteFollowupCredits",
  "cardImplementationFortRunRezSupportQuoteInstallCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCredits",
  "cardImplementationFortRunRezSupportQuoteTotalCreditsPayable",
  "cardImplementationFortRunRezSupportQuoteHasOwnHqIce",
] as const;

export function assertCorpRootRezCostQuoteValid(
  state: GameState,
  cardId: CardInstanceId,
  legalAction: LegalAction,
): CostQuote {
  const instance = state.cardInstances[cardId];
  if (!instance) throw new Error("Root-Rez-Ziel existiert nicht mehr.");
  if (instance.rezzed) throw new Error("Root-Rez-Ziel ist bereits gerezzt.");
  if (
    legalAction.type !== "rez_card" ||
    legalAction.side !== "corp" ||
    legalAction.source !== cardId ||
    legalAction.payload?.cardId !== cardId ||
    legalAction.payload?.rootRez !== true
  )
    throw new Error("Root-Rez-Aktion passt nicht mehr zum Ziel.");
  if (legalAction.timingPoint !== state.timingPoint)
    throw new Error("Root-Rez-Aktion stammt aus einem veralteten Timingpunkt.");

  const runWindow = legalAction.payload.rezInterruptJackOutEligible === true;
  const runnerPaidWindow =
    legalAction.payload.runnerActionPaidWindowRez === true;
  const traceWindow = legalAction.payload.traceWindowSelfRez === true;
  const exposeWindow = legalAction.payload.exposeAttemptSelfRez === true;
  const aardvarkWindow = legalAction.payload.aardvarkReactionSelfRez === true;
  const traceWindowIsValid =
    traceWindow &&
    state.trace !== undefined &&
    state.pendingChoice?.side === "corp" &&
    state.pendingChoice.source.startsWith(`trace:${state.trace.traceId}`) &&
    cardImplementationForDefinitionId(
      instance.definitionId,
    )?.selfRezWindows?.some((window) => window.kind === "trace_attempt") ===
      true;
  const exposeUtility = cardImplementationForDefinitionId(
    instance.definitionId,
  )?.corpUtility;
  const exposeWindowIsValid =
    exposeWindow &&
    state.pendingChoice?.side === "corp" &&
    state.pendingChoice.source.startsWith("corp.expose_prevention:") &&
    state.pendingChoice.options.some((option) => option.value === cardId) &&
    exposeUtility?.kind === "expose_prevention" &&
    exposeUtility.mayRezAtWindow === true;
  const aardvarkWindowIsValid =
    aardvarkWindow &&
    state.pendingChoice?.side === "corp" &&
    state.pendingChoice.source.startsWith("v199.aardvark:") &&
    state.pendingAardvarkBreakerContinuation?.aardvarkId === cardId &&
    cardImplementationForDefinitionId(
      instance.definitionId,
    )?.fortRunWindows?.some(
      (window) => window.kind === "aardvark_worm_lock_and_reaction",
    ) === true;
  const timingIsValid = aardvarkWindow
    ? !runWindow &&
      !runnerPaidWindow &&
      !traceWindow &&
      !exposeWindow &&
      aardvarkWindowIsValid
    : exposeWindow
      ? !runWindow &&
        !runnerPaidWindow &&
        !traceWindow &&
        !aardvarkWindow &&
        exposeWindowIsValid
      : traceWindow
        ? !runWindow &&
          !runnerPaidWindow &&
          !exposeWindow &&
          !aardvarkWindow &&
          traceWindowIsValid
        : runnerPaidWindow
          ? !runWindow &&
            !exposeWindow &&
            !aardvarkWindow &&
            state.timingPoint === "runner_action.main"
          : runWindow
            ? !exposeWindow &&
              !aardvarkWindow &&
              Boolean(state.run) &&
              (state.timingPoint === "run.approach_ice" ||
                state.timingPoint === "run.movement_rez_window")
            : state.timingPoint === "corp_action.main";
  if (!timingIsValid)
    throw new Error(
      "Root-Rez-Aktion ist in diesem Fenster nicht mehr gueltig.",
    );

  const quote = quoteCorpRootRezCost(state, cardId);
  if (!quote.canPay)
    throw new Error("Corp kann die Root-Rez-Kosten nicht zahlen.");
  if (JSON.stringify(legalAction.costs) !== JSON.stringify(quote.costs))
    throw new Error("Root-Rez-Kosten sind nicht mehr gueltig.");

  const actionPayload = legalAction.payload as Record<string, unknown>;
  const quotePayload = quote.publicPayload as Record<string, unknown>;
  for (const field of ROOT_REZ_QUOTE_PAYLOAD_FIELDS) {
    if (actionPayload[field] !== quotePayload[field])
      throw new Error("Root-Rez-Kostenpayload ist nicht mehr gueltig.");
  }
  const creditOutcomeQuote = quoteCorpRootRezCreditOutcome(
    state,
    cardId,
    legalAction.actionId,
    quote.finalCredits,
  );
  if (!creditOutcomeQuote) {
    if (
      ROOT_REZ_CREDIT_OUTCOME_QUOTE_PAYLOAD_FIELDS.some(
        (field) => actionPayload[field] !== undefined,
      )
    ) {
      throw new Error(
        "Root-Rez-Credit-Outcome-Quote ist in diesem Kontext nicht gueltig.",
      );
    }
  } else {
    const creditOutcomePayload = corpRootRezCreditOutcomeQuotePayload(
      creditOutcomeQuote,
    ) as Record<string, unknown>;
    for (const field of ROOT_REZ_CREDIT_OUTCOME_QUOTE_PAYLOAD_FIELDS) {
      if (actionPayload[field] !== creditOutcomePayload[field]) {
        throw new Error(
          "Root-Rez-Credit-Outcome-Quote ist nicht mehr gueltig.",
        );
      }
    }
  }
  const fortRunRezSupportQuote = quoteCorpFortRunRezSupport(
    state,
    cardId,
    legalAction.actionId,
    quote.finalCredits,
  );
  if (!fortRunRezSupportQuote) {
    if (
      FORT_RUN_REZ_SUPPORT_QUOTE_PAYLOAD_FIELDS.some(
        (field) => actionPayload[field] !== undefined,
      )
    )
      throw new Error(
        "Fort-Run-Rez-Support-Quote ist in diesem Kontext nicht gueltig.",
      );
    return quote;
  }
  const fortRunRezSupportPayload = corpFortRunRezSupportQuotePayload(
    fortRunRezSupportQuote,
  ) as Record<string, unknown>;
  for (const field of FORT_RUN_REZ_SUPPORT_QUOTE_PAYLOAD_FIELDS) {
    if (actionPayload[field] !== fortRunRezSupportPayload[field])
      throw new Error("Fort-Run-Rez-Support-Quote ist nicht mehr gueltig.");
  }
  return quote;
}
