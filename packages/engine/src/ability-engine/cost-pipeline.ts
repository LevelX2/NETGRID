import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  Cost,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID } from "../mechanics/agenda-operation-effects";
import { DATA_MASONS_HOSTING_ASSET_CARD_ID } from "../mechanics/asset-node-effects";
import {
  FORTRESS_ARCHITECTS_REZ_COST_ASSET_ID,
  JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID,
} from "../mechanics/global-modifiers";

export type CostPurpose = "corp_rez";

export type CorpRezCostOptions = {
  oliviaSalazarSourceCardId?: CardInstanceId;
};

export type CostModifierQuote = {
  sourceCardInstanceId?: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  label: string;
  amount: number;
  kind: "reduction" | "increase" | "alternate_payment" | "restricted_credit";
};

export type CostQuote = {
  purpose: CostPurpose;
  side: "corp";
  targetCardId: CardInstanceId;
  baseCredits: number;
  finalCredits: number;
  costs: Cost[];
  modifiers: CostModifierQuote[];
  canPay: boolean;
  publicPayload: NonNullable<LegalAction["payload"]>;
};

export function costQuoteToLegalActionCosts(quote: CostQuote): Cost[] {
  return quote.costs.map((cost) => ({ ...cost }));
}

export function costQuotePublicPayload(
  quote: CostQuote,
): NonNullable<LegalAction["payload"]> {
  return { ...quote.publicPayload };
}

function mustInstance<T>(
  collection: Record<CardInstanceId, T>,
  id: CardInstanceId,
): T {
  const value = collection[id];
  if (!value) throw new Error(`Unknown card instance: ${id}`);
  return value;
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

function definitionFor(
  state: GameState,
  id: CardInstanceId,
): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition) throw new Error(`Unknown card definition: ${instance.definitionId}`);
  return definition;
}

function normalizeSubtypeLabel(subtype: string): string {
  return subtype
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function cardHasSubtype(definition: CardDefinition, subtype: string): boolean {
  const target = normalizeSubtypeLabel(subtype);
  return definition.subtypes.some(
    (candidate) => normalizeSubtypeLabel(candidate) === target,
  );
}

export function corpServerIdForInstalledCard(
  state: GameState,
  cardId: CardInstanceId,
): Exclude<ServerId, "new_remote"> | undefined {
  const zone = mustInstance(state.cardInstances, cardId).zone;
  if (
    zone.side === "corp" &&
    (zone.zone === "serverIce" || zone.zone === "serverRoot")
  )
    return zone.serverId;
  return undefined;
}

function rezzedCorpRootCardIds(state: GameState): CardInstanceId[] {
  const ids: CardInstanceId[] = [];
  for (const server of state.corp.servers) {
    for (const cardId of server.root) {
      if (mustInstance(state.cardInstances, cardId).rezzed) ids.push(cardId);
    }
  }
  return ids;
}

function iceRezCostReductionFor(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): number {
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  let reduction = 0;
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (
      sourceDefinition.id === DATA_MASONS_HOSTING_ASSET_CARD_ID &&
      cardHasSubtype(iceDefinition, "wall")
    )
      reduction += 2;
    if (
      sourceDefinition.id === "onr_v1_320_encoder-inc" &&
      cardHasSubtype(iceDefinition, "code_gate")
    )
      reduction += 2;
    if (
      sourceDefinition.id === "onr_v1_341_skalderviken-sa-beta-test-site" &&
      cardHasSubtype(iceDefinition, "black_ice")
    )
      reduction += 2;
    if (sourceDefinition.id === FORTRESS_ARCHITECTS_REZ_COST_ASSET_ID)
      reduction += 1;
    if (
      sourceDefinition.id === JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID &&
      iceServerId &&
      corpServerIdForInstalledCard(state, sourceId) === iceServerId &&
      cardHasSubtype(iceDefinition, "wall")
    )
      reduction += 9;
  }
  return reduction;
}

export function rezCostReductionSourceDefinitionIdsFor(
  state: GameState,
  iceId: CardInstanceId,
  iceDefinition: CardDefinition,
): CardDefinitionId[] {
  const iceServerId = corpServerIdForInstalledCard(state, iceId);
  const sourceIds: CardDefinitionId[] = [];
  for (const sourceId of rezzedCorpRootCardIds(state)) {
    const sourceDefinition = definitionFor(state, sourceId);
    if (
      sourceDefinition.id === DATA_MASONS_HOSTING_ASSET_CARD_ID &&
      cardHasSubtype(iceDefinition, "wall")
    )
      sourceIds.push(sourceDefinition.id);
    if (
      sourceDefinition.id === "onr_v1_320_encoder-inc" &&
      cardHasSubtype(iceDefinition, "code_gate")
    )
      sourceIds.push(sourceDefinition.id);
    if (
      sourceDefinition.id === "onr_v1_341_skalderviken-sa-beta-test-site" &&
      cardHasSubtype(iceDefinition, "black_ice")
    )
      sourceIds.push(sourceDefinition.id);
    if (sourceDefinition.id === FORTRESS_ARCHITECTS_REZ_COST_ASSET_ID)
      sourceIds.push(sourceDefinition.id);
    if (
      sourceDefinition.id === JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID &&
      iceServerId &&
      corpServerIdForInstalledCard(state, sourceId) === iceServerId &&
      cardHasSubtype(iceDefinition, "wall")
    )
      sourceIds.push(sourceDefinition.id);
  }
  return sourceIds;
}

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

function corpRezCostModifierQuoteForDefinition(
  sourceDefinitionId: CardDefinitionId,
): CostModifierQuote {
  const sourceDefinition = DEMO_CARDS_BY_ID[sourceDefinitionId];
  return {
    sourceDefinitionId,
    label: sourceDefinition?.title ?? sourceDefinitionId,
    amount:
      sourceDefinitionId === FORTRESS_ARCHITECTS_REZ_COST_ASSET_ID
        ? 1
        : sourceDefinitionId === JERUSALEM_CITY_GRID_REZ_COST_UPGRADE_ID
          ? 9
          : 2,
    kind: "reduction",
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
  const existingSourceDefinitionIds =
    definition.type === "ice"
      ? rezCostReductionSourceDefinitionIdsFor(state, iceId, definition)
      : [];
  const oliviaSalazarSourceCardId = options.oliviaSalazarSourceCardId;
  const finalCredits = oliviaSalazarSourceCardId
    ? Math.max(0, Math.floor(regularFinalCredits / 2))
    : regularFinalCredits;
  const publicPayload: NonNullable<LegalAction["payload"]> = {
    cardId: iceId,
  };
  const modifiers = existingSourceDefinitionIds.map((sourceDefinitionId) =>
    corpRezCostModifierQuoteForDefinition(sourceDefinitionId),
  );

  if (oliviaSalazarSourceCardId) {
    publicPayload.serverId = corpServerIdForInstalledCard(state, iceId) ?? "";
    publicPayload.oliviaSalazarRezSourceCardId = oliviaSalazarSourceCardId;
    publicPayload.oliviaSalazarRezSourceDefinitionId =
      OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID;
    publicPayload.oliviaSalazarRezCostBase = regularFinalCredits;
    publicPayload.oliviaSalazarTemporaryDerez = true;
    publicPayload.rezCostReductionSourceDefinitionIds = [
      ...existingSourceDefinitionIds,
      OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID,
    ].join(",");
    publicPayload.rezCostReductionAmount = baseCredits - finalCredits;
    publicPayload.rezCostPaid = finalCredits;
    modifiers.push({
      sourceCardInstanceId: oliviaSalazarSourceCardId,
      sourceDefinitionId: OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID,
      label:
        DEMO_CARDS_BY_ID[OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID]?.title ??
        OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID,
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

export function oliviaSalazarRezSourcesForRunIce(
  state: GameState,
  iceId: CardInstanceId,
): CardInstanceId[] {
  const run = state.run;
  if (!run || run.phase !== "approach_ice" || run.approachedIceId !== iceId)
    return [];
  if (corpServerIdForInstalledCard(state, iceId) !== run.attackedServerId)
    return [];
  const used = new Set(run.oliviaSalazarUsedSourceIdsThisRun ?? []);
  const server = mustServer(state, run.attackedServerId);
  return server.root
    .filter((sourceId) => {
      const instance = state.cardInstances[sourceId];
      return (
        instance?.rezzed === true &&
        definitionFor(state, sourceId).id ===
          OLIVIA_SALAZAR_REZ_COST_UPGRADE_ID &&
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
  const oliviaSalazarSourceCardId =
    typeof legalAction.payload?.oliviaSalazarRezSourceCardId === "string"
      ? (legalAction.payload.oliviaSalazarRezSourceCardId as CardInstanceId)
      : undefined;
  if (oliviaSalazarSourceCardId) {
    const sourceInstance = state.cardInstances[oliviaSalazarSourceCardId];
    if (!sourceInstance) throw new Error("Olivia-Salazar-Quelle fehlt.");
    const availableSources = oliviaSalazarRezSourcesForRunIce(state, iceId);
    if (!availableSources.includes(oliviaSalazarSourceCardId))
      throw new Error("Olivia Salazar ist fuer dieses ICE nicht aktiv.");
    if (
      corpServerIdForInstalledCard(state, oliviaSalazarSourceCardId) !==
      run.attackedServerId
    )
      throw new Error("Olivia Salazar gehoert nicht zu diesem Fort.");
  }
  const quote = quoteCorpRezCost(state, iceId, {
    ...(oliviaSalazarSourceCardId ? { oliviaSalazarSourceCardId } : {}),
  });
  if (!quote.canPay) throw new Error("Corp kann die Rez-Kosten nicht zahlen.");
  if ((legalAction.costs[0]?.credits ?? 0) !== quote.finalCredits)
    throw new Error("Corp-Rez-Kosten sind nicht mehr gueltig.");
  return quote;
}
