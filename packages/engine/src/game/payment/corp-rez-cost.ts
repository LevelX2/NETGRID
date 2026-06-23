/**
 * ARCH-7 Payment-/CostQuote-Helfer.
 * Keine State-Mutation, keine LegalAction-Erzeugung, keine Action-Ausführung.
 * Revalidation bleibt an Quote gekoppelt; kein Import aus index.ts.
 */
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import {
  activeCardImplementationModifiersForCorpRoot,
  activeCardImplementationModifiersForRunnerInstalled,
  cardDefinitionForInstance,
  cardMatchesModifierAppliesTo,
  corpServerIdForInstalledCard,
  isPublicRezzedCorpRootModifier,
  isPublicRunnerInstalledModifier,
  sameServerAsSourceApplies,
} from "../../ability-engine/card-implementation-modifiers";
import type {
  CardFortRunWindowImplementation,
  CardInstallCostModifierImplementation,
  CardRezCostModifierImplementation,
} from "../../ability-engine/definition-types";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID } from "../../mechanics/agenda-operation-effects";
import type { CostModifierQuote, CostQuote } from "./cost-quote";

export { corpServerIdForInstalledCard } from "../../ability-engine/card-implementation-modifiers";

export type CorpRezCostOptions = {
  discountedRezSourceCardId?: CardInstanceId;
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

export type CorpInstallCostOptions = {
  additionalCredits?: number;
  legacyReduction?: number;
};

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
): boolean {
  if (
    modifier.operation !== "reduce" ||
    !isPublicRezzedCorpRootModifier(modifier)
  )
    return false;
  if (!cardMatchesModifierAppliesTo(iceDefinition, modifier.appliesTo))
    return false;
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
 * Same-server filtering happens here from the current board state; stale action
 * protection relies on callers rebuilding and comparing the quote before pay.
 */
function activeCorpRezCostModifiersForIce(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
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
      )
    )
      continue;
    matches.push(match);
  }
  return matches;
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
  if (!cardMatchesModifierAppliesTo(definition, modifier.appliesTo))
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
  return activeCorpRezCostModifiersForIce(state, iceId, iceDefinition).reduce(
    (sum, match) => sum + match.modifier.amount,
    0,
  );
}

export function rezCostReductionSourceDefinitionIdsFor(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): CardDefinitionId[] {
  return activeCorpRezCostModifiersForIce(state, iceId, iceDefinition).map(
    (match) => match.sourceDefinitionId,
  );
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
  const sourceDefinition = DEMO_CARDS_BY_ID[sourceDefinitionId];
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
  const sourceDefinition = DEMO_CARDS_BY_ID[sourceDefinitionId];
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
  const regularFinalCredits = rezCostForCard(state, iceId);
  const existingModifierMatches =
    definition.type === "ice"
      ? activeCorpRezCostModifiersForIce(state, iceId, definition)
      : [];
  const existingSourceDefinitionIds = existingModifierMatches.map(
    (match) => match.sourceDefinitionId,
  );
  const discountedRezSourceCardId = options.discountedRezSourceCardId;
  const discountedRezSourceDefinitionId = discountedRezSourceCardId
    ? definitionFor(state, discountedRezSourceCardId).id
    : undefined;
  const finalCredits = discountedRezSourceCardId
    ? Math.max(0, Math.floor(regularFinalCredits / 2))
    : regularFinalCredits;
  const publicPayload: NonNullable<LegalAction["payload"]> = {
    cardId: iceId,
  };
  const modifiers = existingModifierMatches.map((match) =>
    corpRezCostModifierQuoteForMatch(match),
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
      label: DEMO_CARDS_BY_ID[sourceDefinitionId]?.title ?? sourceDefinitionId,
      amount: regularFinalCredits - finalCredits,
      kind: "reduction",
    });
  } else if (existingSourceDefinitionIds.length > 0) {
    publicPayload.rezCostReductionSourceDefinitionIds =
      existingSourceDefinitionIds.join(",");
    publicPayload.rezCostReductionAmount = baseCredits - finalCredits;
    publicPayload.rezCostPaid = finalCredits;
  }

  return {
    purpose: "corp_rez",
    side: "corp",
    targetCardId: iceId,
    baseCredits,
    finalCredits,
    costs: [{ credits: finalCredits }],
    modifiers,
    canPay: state.corp.credits >= finalCredits,
    publicPayload,
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
  if (
    definitionHasFortRunWindowKind(
      definitionId,
      "discounted_rez_ice_on_this_fort",
    )
  )
    return true;
  return (
    !cardImplementationForDefinitionId(definitionId) &&
    definitionId === OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID
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
  const run = mustRun(state);
  if (
    state.timingPoint !== "run.approach_ice" ||
    run.phase !== "approach_ice" ||
    run.approachedIceId !== iceId
  )
    throw new Error("ICE ist nicht mehr im passenden Rez-Fenster.");
  const discountedRezSourceCardId =
    typeof legalAction.payload?.discountedRezSourceCardId === "string"
      ? (legalAction.payload.discountedRezSourceCardId as CardInstanceId)
      : undefined;
  if (discountedRezSourceCardId) {
    if (!state.cardInstances[discountedRezSourceCardId])
      throw new Error("Discounted-Rez-Quelle fehlt.");
    const availableSources = discountedRezSourceIdsForRunIce(state, iceId);
    if (!availableSources.includes(discountedRezSourceCardId))
      throw new Error("Die Discounted-Rez-Quelle ist fuer dieses ICE nicht aktiv.");
    if (
      corpServerIdForInstalledCard(state, discountedRezSourceCardId) !==
      run.attackedServerId
    )
      throw new Error("Die Discounted-Rez-Quelle gehoert nicht zu diesem Fort.");
  }
  const quote = quoteCorpRezCost(state, iceId, {
    ...(discountedRezSourceCardId ? { discountedRezSourceCardId } : {}),
  });
  if (!quote.canPay) throw new Error("Corp kann die Rez-Kosten nicht zahlen.");
  if ((legalAction.costs[0]?.credits ?? 0) !== quote.finalCredits)
    throw new Error("Corp-Rez-Kosten sind nicht mehr gueltig.");
  return quote;
}
