/**
 * ARCH-11 Base-Link Choice Boundary.
 * Bestimmt und validiert Base-Link-Choices.
 * Orchestriert keinen ganzen Trace.
 * Keine Runner-Bid-/Corp-Bid-/Post-Bid-Link-Logik.
 * Keine Payment-Neuinterpretation.
 * Kein Import aus index.ts.
 */
import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import type {
  ActivatedCardAbilityImplementation,
  UseBaseLinkEffectImplementation,
} from "../../ability-engine/definition-types";
import {
  assertTraceBaseLinkUnused,
  currentTrace,
  requireTracePhase,
} from "./trace-state";

export type TraceBaseLinkChoiceQuote = {
  sourceCardInstanceId: CardInstanceId;
  sourceDefinitionId: CardDefinitionId;
  label: string;
  baseLinkValue: number;
  creditCost: number;
  canUse: boolean;
  rewardCreditsOnAvoidTrace?: number;
  publicPayload: NonNullable<LegalAction["payload"]>;
};

function mustInstance(
  source: Record<CardInstanceId, CardInstance>,
  id: CardInstanceId,
): CardInstance {
  const instance = source[id];
  if (!instance) throw new Error(`CardInstance fehlt: ${id}`);
  return instance;
}

function definitionFor(state: GameState, id: CardInstanceId): CardDefinition {
  const instance = mustInstance(state.cardInstances, id);
  const definition = DEMO_CARDS_BY_ID[instance.definitionId];
  if (!definition)
    throw new Error(`Unbekannte Karte: ${instance.definitionId}`);
  return definition;
}

function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
}

function creditCostForTraceBaseLinkAbility(
  ability: ActivatedCardAbilityImplementation,
): number {
  const creditCosts = ability.costs.filter((cost) => cost.kind === "credit");
  if (
    ability.costs.length !== 1 ||
    creditCosts.length !== 1 ||
    !Number.isInteger(creditCosts[0]?.amount) ||
    (creditCosts[0]?.amount ?? 0) < 0
  ) {
    throw new Error(
      "Trace CardImplementation ability supports exactly one nonnegative credit cost.",
    );
  }
  return creditCosts[0]!.amount;
}

function activatedCardImplementationTraceBaseLinkAbilities(
  definition: CardDefinition,
): Array<{ ability: ActivatedCardAbilityImplementation; index: number }> {
  return (
    cardImplementationForDefinitionId(definition.id)?.abilities
      ?.map((ability, index) => ({ ability, index }))
      .filter(
        (
          entry,
        ): entry is {
          ability: ActivatedCardAbilityImplementation;
          index: number;
        } =>
          entry.ability.kind === "activated" &&
          entry.ability.timing === "trace_base_link_window",
      ) ?? []
  );
}

function useBaseLinkEffect(
  ability: ActivatedCardAbilityImplementation,
): UseBaseLinkEffectImplementation | undefined {
  const effects = ability.effects.filter(
    (effect): effect is UseBaseLinkEffectImplementation =>
      effect.kind === "use_base_link",
  );
  if (effects.length > 1)
    throw new Error("Trace base-link ability has multiple use_base_link effects.");
  return effects[0];
}

function isSubmarineUplinkSource(
  state: GameState,
  cardId: CardInstanceId,
): boolean {
  return (
    cardImplementationForDefinitionId(definitionFor(state, cardId).id)
      ?.runnerUtilityLongtail?.kind ===
    "submarine_uplink_trace_link_force_jack_out"
  );
}

export function installedTraceBaseLinkCardImplementation(
  definition: CardDefinition,
): boolean {
  return activatedCardImplementationTraceBaseLinkAbilities(definition).some(
    ({ ability }) => useBaseLinkEffect(ability),
  );
}

export function traceBaseLinkChoicePublicPayload(
  quote: TraceBaseLinkChoiceQuote,
): NonNullable<LegalAction["payload"]> {
  return { ...quote.publicPayload };
}

function quoteForAbility(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
  definition: CardDefinition,
  ability: ActivatedCardAbilityImplementation,
): TraceBaseLinkChoiceQuote | undefined {
  const effect = useBaseLinkEffect(ability);
  if (!effect) return undefined;
  if (isSubmarineUplinkSource(state, sourceCardInstanceId) && !state.run)
    return undefined;
  const creditCost = creditCostForTraceBaseLinkAbility(ability);
  if (state.runner.credits < creditCost) return undefined;
  if (
    ability.limit?.kind !== "one_base_link_card_per_trace_attempt" ||
    ability.limit.scope !== "trace_attempt"
  )
    throw new Error("Base-link abilities require the trace-attempt limit.");
  if (
    !Number.isInteger(effect.baseLink) ||
    effect.baseLink < 0 ||
    effect.visibility !== "public"
  )
    throw new Error("Base-link effect is invalid.");
  return {
    sourceCardInstanceId,
    sourceDefinitionId: definition.id,
    label: definition.title,
    baseLinkValue: effect.baseLink,
    creditCost,
    canUse: true,
    ...(effect.rewardCreditsOnAvoidTrace
      ? { rewardCreditsOnAvoidTrace: effect.rewardCreditsOnAvoidTrace }
      : {}),
    publicPayload: {
      baseLinkUsed: true,
      traceBaseLinkSourceDefinitionId: definition.id,
      traceBaseLinkCostPaid: creditCost,
      baseLinkValue: effect.baseLink,
      ...(effect.rewardCreditsOnAvoidTrace
        ? { traceAvoidRewardCredits: effect.rewardCreditsOnAvoidTrace }
        : {}),
    },
  };
}

export function quoteTraceBaseLinkChoices(
  state: GameState,
  trace = state.trace,
): TraceBaseLinkChoiceQuote[] {
  const activeTrace = trace ?? currentTrace(state);
  if (!activeTrace || activeTrace.status !== "base_link") return [];
  if (activeTrace.baseLinkSourceId) return [];
  const quotes: TraceBaseLinkChoiceQuote[] = [];
  for (const cardId of runnerInstalledCardIds(state).sort()) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = definitionFor(state, cardId);
    for (const { ability } of activatedCardImplementationTraceBaseLinkAbilities(
      definition,
    )) {
      const quote = quoteForAbility(state, cardId, definition, ability);
      if (quote) quotes.push(quote);
    }
  }
  return quotes;
}

export function quoteTraceBaseLinkChoice(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
): TraceBaseLinkChoiceQuote {
  const quote = quoteTraceBaseLinkChoices(state).find(
    (candidate) => candidate.sourceCardInstanceId === sourceCardInstanceId,
  );
  if (!quote)
    throw new Error("Diese Base-Link-Quelle ist nicht legal.");
  return quote;
}

export function assertTraceBaseLinkChoiceValid(
  state: GameState,
  sourceCardInstanceId: CardInstanceId,
): TraceBaseLinkChoiceQuote {
  const trace = requireTracePhase(state, "base_link");
  assertTraceBaseLinkUnused(trace);
  const quote = quoteTraceBaseLinkChoice(state, sourceCardInstanceId);
  if (!quote.canUse)
    throw new Error("Diese Base-Link-Quelle ist nicht legal.");
  return quote;
}
