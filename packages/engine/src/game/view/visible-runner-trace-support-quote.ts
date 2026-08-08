import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardInstanceId,
  type GameState,
  type VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";
import { HELLS_RUN_ID } from "../../compatibility/runtime-compatibility";
import { installedTraceBaseLinkCardImplementation, traceBaseLinkCardImplementationQuotesForDefinition } from "../trace/base-link";
import {
  isRestrictedHostedCreditSource,
  restrictedHostedCreditSourceIds,
} from "../run/run-duration-payment";

function definitionFor(state: GameState, cardId: CardInstanceId): CardDefinition {
  const definitionId = state.cardInstances[cardId]?.definitionId;
  const definition = definitionId
    ? CARD_DEFINITIONS_BY_ID[definitionId]
    : undefined;
  if (!definition) throw new Error(`Unbekannte Karte: ${cardId}`);
  return definition;
}

function runnerInstalledCardIds(state: GameState): CardInstanceId[] {
  return [
    ...state.runner.rig.programs,
    ...state.runner.rig.hardware,
    ...state.runner.rig.resources,
  ];
}

function runnerCoreLink(state: GameState): number {
  const identity = definitionFor(state, state.runner.identity);
  const baseLink = identity.baseLink ?? 0;
  const staticModifier = (identity.modifiers ?? [])
    .filter(
      (modifier) =>
        modifier.side === "runner" &&
        modifier.kind === "base_link" &&
        modifier.duration === "static",
    )
    .reduce((total, modifier) => total + modifier.amount, 0);
  const cryingReduction =
    Math.max(
      0,
      Math.floor(state.cardInstances[state.runner.identity]?.counters?.crying ?? 0),
    ) * 2;
  return Math.max(0, baseLink + staticModifier - cryingReduction);
}

/**
 * Projects precisely the public Runner-side inputs needed to assess a trace
 * during a run. This intentionally shares the same implementation contracts
 * as the trace runtime instead of asking AI consumers to inspect cards.
 */
export function visibleRunnerTraceSupportQuote(
  state: GameState,
): VisibleRunnerTraceSupportQuote {
  const coreLink = runnerCoreLink(state);
  const installedCards = runnerInstalledCardIds(state);
  const installedStaticLink = installedCards.reduce((best, cardId) => {
    const definition = definitionFor(state, cardId);
    if (installedTraceBaseLinkCardImplementation(definition)) return best;
    return Math.max(best, definition.baseLink ?? 0);
  }, 0);
  const baseLinkOptions: VisibleRunnerTraceSupportQuote["baseLinkOptions"] = [
    {
      baseLink: coreLink + installedStaticLink,
      activationCost: 0,
      safeForAccess: true,
    },
  ];
  for (const cardId of installedCards) {
    const definition = definitionFor(state, cardId);
    for (const quote of traceBaseLinkCardImplementationQuotesForDefinition(
      definition.id,
    )) {
      baseLinkOptions.push({
        baseLink: coreLink + quote.baseLinkValue,
        activationCost: quote.creditCost,
        safeForAccess: !quote.forcesJackOutAfterEncounter,
        sourceDefinitionId: quote.sourceDefinitionId,
        sourceTitle: quote.label,
        ...(quote.forcesJackOutAfterEncounter
          ? { sideEffect: "forces_jack_out_after_encounter" as const }
          : {}),
      });
    }
  }
  const traceCreditPool = [
    ...restrictedHostedCreditSourceIds(state, "increase_link"),
    ...installedCards.filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        !isRestrictedHostedCreditSource(definition) &&
        definition.id === HELLS_RUN_ID &&
        (state.cardInstances[cardId]?.counters?.recurring_credit ?? 0) > 0
      );
    }),
  ].reduce(
    (total, cardId) =>
      total +
      Math.max(
        0,
        Math.floor(
          state.cardInstances[cardId]?.counters?.[
            isRestrictedHostedCreditSource(definitionFor(state, cardId))
              ? "bit"
              : "recurring_credit"
          ] ?? 0,
        ),
      ),
    0,
  );
  return { traceCreditPool, baseLinkOptions };
}
