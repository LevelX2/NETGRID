import {
  CARD_DEFINITIONS_BY_ID,
  type CardDefinition,
  type CardInstanceId,
  type GameState,
  type VisibleRunnerTraceSupportQuote,
} from "@netgrid/shared";
import { HELLS_RUN_ID } from "../../compatibility/runtime-compatibility";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  installedTraceBaseLinkCardImplementation,
  traceBaseLinkCardImplementationQuotesForDefinition,
} from "../trace/base-link";
import {
  isRestrictedHostedCreditSource,
  restrictedHostedCreditSourceIds,
} from "../run/run-duration-payment";
import type { ActivatedCardAbilityImplementation } from "../../ability-engine/definition-types";

function definitionFor(
  state: GameState,
  cardId: CardInstanceId,
): CardDefinition {
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
      Math.floor(
        state.cardInstances[state.runner.identity]?.counters?.crying ?? 0,
      ),
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
  const baseLinkOptions: Array<
    VisibleRunnerTraceSupportQuote["baseLinkOptions"][number]
  > = [
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
  const traceCreditSources: Array<
    VisibleRunnerTraceSupportQuote["traceCreditSources"][number]
  > = [
    ...restrictedHostedCreditSourceIds(state, "increase_link"),
    ...installedCards.filter((cardId) => {
      const definition = definitionFor(state, cardId);
      return (
        !isRestrictedHostedCreditSource(definition) &&
        definition.id === HELLS_RUN_ID &&
        (state.cardInstances[cardId]?.counters?.recurring_credit ?? 0) > 0
      );
    }),
  ].map((cardId) => {
    const definition = definitionFor(state, cardId);
    return {
      sourceCardInstanceId: cardId,
      sourceDefinitionId: definition.id,
      amount: Math.max(
        0,
        Math.floor(
          state.cardInstances[cardId]?.counters?.[
            isRestrictedHostedCreditSource(definition)
              ? "bit"
              : "recurring_credit"
          ] ?? 0,
        ),
      ),
      isStealth: definition.subtypes.includes("stealth"),
    };
  });
  const traceCreditPool = traceCreditSources.reduce(
    (total, source) => total + source.amount,
    0,
  );
  const traceWindowOptions = visibleTraceWindowOptions(state, installedCards);
  return {
    traceCreditPool,
    traceCreditSources,
    baseLinkOptions,
    postBidLinkOptions: traceWindowOptions.postBidLinkOptions,
    traceSuccessCancelOptions: traceWindowOptions.traceSuccessCancelOptions,
  };
}

function visibleTraceWindowOptions(
  state: GameState,
  installedCards: CardInstanceId[],
): Pick<
  VisibleRunnerTraceSupportQuote,
  "postBidLinkOptions" | "traceSuccessCancelOptions"
> {
  const postBidLinkOptions: Array<
    VisibleRunnerTraceSupportQuote["postBidLinkOptions"][number]
  > = [];
  const traceSuccessCancelOptions: Array<
    VisibleRunnerTraceSupportQuote["traceSuccessCancelOptions"][number]
  > = [];
  for (const cardId of installedCards) {
    const instance = state.cardInstances[cardId];
    if (!instance || instance.controller !== "runner") continue;
    const definition = definitionFor(state, cardId);
    const implementation = cardImplementationForDefinitionId(definition.id);
    const safeForAccess =
      implementation?.runnerUtilityLongtail?.kind !==
      "trace_link_force_jack_out";
    for (const ability of implementation?.abilities ?? []) {
      if (ability.kind !== "activated") continue;
      const cost = traceWindowAbilityCost(ability);
      if (cost.tapSource && instance.tapped === true) continue;
      if (ability.timing === "trace_post_bid_link_window") {
        const effect = singlePublicTraceLinkEffect(ability);
        if (!effect) continue;
        postBidLinkOptions.push({
          sourceCardInstanceId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          linkDelta: effect.amount,
          activationCost: cost.creditCost,
          tapSource: cost.tapSource,
          trashSource: cost.trashSource,
          safeForAccess,
        });
      }
      if (
        ability.timing === "trace_success_cancel_window" &&
        (cost.tapSource || cost.trashSource)
      ) {
        traceSuccessCancelOptions.push({
          sourceCardInstanceId: cardId,
          sourceDefinitionId: definition.id,
          sourceTitle: definition.title,
          activationCost: cost.creditCost,
          tapSource: cost.tapSource,
          trashSource: cost.trashSource,
        });
      }
    }
  }
  return { postBidLinkOptions, traceSuccessCancelOptions };
}

function traceWindowAbilityCost(ability: ActivatedCardAbilityImplementation): {
  creditCost: number;
  tapSource: boolean;
  trashSource: boolean;
} {
  const creditCosts = ability.costs.filter((cost) => cost.kind === "credit");
  const tapCosts = ability.costs.filter((cost) => cost.kind === "tap_source");
  const trashCosts = ability.costs.filter(
    (cost) => cost.kind === "trash_source",
  );
  if (
    ability.costs.length !==
      creditCosts.length + tapCosts.length + trashCosts.length ||
    creditCosts.length > 1 ||
    tapCosts.length + trashCosts.length > 1 ||
    (creditCosts.length === 0 &&
      tapCosts.length === 0 &&
      trashCosts.length === 0) ||
    !Number.isInteger(creditCosts[0]?.amount ?? 0) ||
    (creditCosts[0]?.amount ?? 0) < 0 ||
    (tapCosts[0] && tapCosts[0].amount !== 1) ||
    (trashCosts[0] && trashCosts[0].amount !== 1)
  ) {
    throw new Error(
      "Trace CardImplementation ability supports nonnegative credit and optional source costs.",
    );
  }
  return {
    creditCost: creditCosts[0]?.amount ?? 0,
    tapSource: tapCosts.length === 1,
    trashSource: trashCosts.length === 1,
  };
}

function singlePublicTraceLinkEffect(
  ability: ActivatedCardAbilityImplementation,
): { amount: number } | undefined {
  const effects = ability.effects.filter(
    (effect) => effect.kind === "increase_trace_link",
  );
  if (effects.length > 1)
    throw new Error(
      "Trace link ability has multiple increase_trace_link effects.",
    );
  const effect = effects[0];
  if (!effect) return undefined;
  if (
    !Number.isInteger(effect.amount) ||
    effect.amount <= 0 ||
    effect.visibility !== "public"
  ) {
    throw new Error("Trace link effect is invalid.");
  }
  return { amount: effect.amount };
}
