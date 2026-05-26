/**
 * Bridges declarative CardImplementation effects to existing engine primitives.
 *
 * The adapter layer may call mutating host functions supplied by index.ts, but
 * it must not introduce card-specific behavior or bypass existing draw,
 * hosted-credit, and source-trash rules.
 */
import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type {
  CardEffectDrawCardsResult,
  CardEffectHostedCreditsResult,
  CardEffectCounterResult,
  CardEffectTrashSourceResult,
} from "./effect-interpreter";
import type { CardImplementationRuntimeDependencies } from "./card-implementation-runtime";

type PublicEffectPayload = Record<string, string | number | boolean>;

type RunnerDrawSummaryForCardImplementation = {
  drawnCount: number;
  citySurveillanceSourceCount: number;
  citySurveillanceCreditsPaid: number;
  citySurveillanceTagsAdded: number;
};

export type CardImplementationEffectAdapterHost = {
  // These dependencies are the mutation boundary: index.ts owns the underlying
  // primitives, while this module shapes them for the CardImplementation runtime.
  drawCorpCards: (state: GameState, amount: number) => void;
  drawRunnerCards: (
    state: GameState,
    amount: number,
  ) => RunnerDrawSummaryForCardImplementation;
  runnerDrawSummaryPublicPayload: (
    state: GameState,
    summary: RunnerDrawSummaryForCardImplementation,
  ) => PublicEffectPayload;
  addCardCounter: (
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ) => void;
  cardCounter: (
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: CounterType,
  ) => number;
  spendCardCounter: (
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: CounterType,
    amount: number,
  ) => void;
  credits: (state: GameState, side: Side, amount: number) => void;
  mustInstance: (
    source: Record<CardInstanceId, CardInstance>,
    cardId: CardInstanceId,
  ) => CardInstance;
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
  hiddenRunnerResourceRevealPayload?: (
    state: GameState,
    sourceCardId: CardInstanceId,
  ) => PublicEffectPayload;
  trashCorpInstalledCardToArchives: (
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => void;
  trashRunnerInstalledCardToHeap: (
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ) => void;
};

export type CardImplementationEffectAdapters = Pick<
  CardImplementationRuntimeDependencies,
  | "drawCards"
  | "addHostedCredits"
  | "addCountersToSource"
  | "takeHostedCredits"
  | "trashSourceWhenEmpty"
  | "trashSource"
>;

/**
 * Creates runtime callbacks for effects that need host-owned mechanics.
 *
 * The returned functions preserve public payload and ResolvedEffect contracts
 * while delegating actual state mutation to injected host primitives. This keeps
 * the runtime independent from index.ts and avoids parallel draw/counter engines.
 */
export function createCardImplementationEffectAdapters(
  host: CardImplementationEffectAdapterHost,
): CardImplementationEffectAdapters {
  function drawCardsForCardImplementationEffect(
    state: GameState,
    side: Side,
    amount: number,
  ): CardEffectDrawCardsResult {
    if (side === "corp") {
      const rdBefore = state.corp.rd.length;
      host.drawCorpCards(state, amount);
      const drawnCount = rdBefore - state.corp.rd.length;
      return {
        drawnCount,
        publicPayload: drawnCount > 0 ? { drawnCards: drawnCount } : {},
      };
    }

    const summary = host.drawRunnerCards(state, amount);
    return {
      drawnCount: summary.drawnCount,
      publicPayload: {
        ...host.runnerDrawSummaryPublicPayload(state, summary),
        ...(summary.drawnCount > 0
          ? { runnerGripAfter: state.runner.grip.length }
          : {}),
      },
    };
  }

  function addHostedCreditsForCardImplementationEffect(
    state: GameState,
    sourceCardId: CardInstanceId,
    amount: number,
  ): CardEffectHostedCreditsResult {
    // Hosted credits are public bit counters on the source card; this adapter
    // does not generalize them into a named-counter engine.
    host.addCardCounter(state, sourceCardId, "bit", amount);
    const hostedCreditsAfter = host.cardCounter(state, sourceCardId, "bit");
    return {
      amount,
      hostedCreditsAfter,
      publicPayload: {
        counterType: "bit",
        hostedCreditsAdded: amount,
        hostedCreditsAfter,
        addedCounterAmount: amount,
        remainingCounters: hostedCreditsAfter,
      },
    };
  }

  function addCountersToSourceForCardImplementationEffect(
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: Extract<CounterType, "ablative" | "trauma" | "boon">,
    amount: number,
  ): CardEffectCounterResult {
    host.addCardCounter(state, sourceCardId, counterType, amount);
    const countersAfter = host.cardCounter(state, sourceCardId, counterType);
    return {
      amount,
      counterType,
      countersAfter,
      publicPayload: {
        counterType,
        addedCounterAmount: amount,
        remainingCounters: countersAfter,
      },
    };
  }

  function takeHostedCreditsForCardImplementationEffect(
    state: GameState,
    sourceCardId: CardInstanceId,
    side: Side,
    amount: number | "all",
  ): CardEffectHostedCreditsResult {
    const available = host.cardCounter(state, sourceCardId, "bit");
    if (available <= 0)
      throw new Error("Auf der Quelle liegen keine Credits.");
    const taken = amount === "all" ? available : Math.min(available, amount);
    host.spendCardCounter(state, sourceCardId, "bit", taken);
    host.credits(state, side, taken);
    const hostedCreditsAfter = host.cardCounter(state, sourceCardId, "bit");
    return {
      amount: taken,
      hostedCreditsAfter,
      publicPayload: {
        counterType: "bit",
        hostedCreditsTaken: taken,
        hostedCreditsAfter,
        removedCounterAmount: taken,
        remainingCounters: hostedCreditsAfter,
        gainedCredits: taken,
        [side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"]:
          side === "corp" ? state.corp.credits : state.runner.credits,
      },
    };
  }

  function trashSourceWhenEmptyForCardImplementationEffect(
    state: GameState,
    sourceCardId: CardInstanceId,
  ): CardEffectTrashSourceResult {
    if (host.cardCounter(state, sourceCardId, "bit") > 0)
      return { sourceTrashed: false };
    return trashSourceForCardImplementationEffect(state, sourceCardId);
  }

  function trashSourceForCardImplementationEffect(
    state: GameState,
    sourceCardId: CardInstanceId,
    legalAction?: LegalAction,
  ): CardEffectTrashSourceResult {
    const instance = host.mustInstance(state.cardInstances, sourceCardId);
    const definition = host.definitionFor(state, sourceCardId);
    const hiddenRevealPayload =
      host.hiddenRunnerResourceRevealPayload?.(state, sourceCardId) ?? {};
    if (
      instance.controller === "corp" &&
      (instance.zone.zone === "serverRoot" ||
        state.corp.servers.some((server) => server.root.includes(sourceCardId)))
    ) {
      host.trashCorpInstalledCardToArchives(state, sourceCardId, legalAction);
    } else if (
      instance.controller === "runner" &&
      host.runnerInstalledCardIds(state).includes(sourceCardId)
    ) {
      host.trashRunnerInstalledCardToHeap(state, sourceCardId, legalAction);
    } else {
      return { sourceTrashed: false };
    }
    return {
      sourceTrashed: true,
      publicPayload: {
        ...hiddenRevealPayload,
        sourceTrashed: true,
        trashedCardDefinitionId: definition.id,
      },
    };
  }

  return {
    drawCards: drawCardsForCardImplementationEffect,
    addHostedCredits: addHostedCreditsForCardImplementationEffect,
    addCountersToSource: addCountersToSourceForCardImplementationEffect,
    takeHostedCredits: takeHostedCreditsForCardImplementationEffect,
    trashSourceWhenEmpty: trashSourceWhenEmptyForCardImplementationEffect,
    trashSource: trashSourceForCardImplementationEffect,
  };
}
