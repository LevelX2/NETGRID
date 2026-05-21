/**
 * Bridges declarative CardImplementation effects to existing engine primitives.
 *
 * The adapter layer may call mutating host functions supplied by index.ts, but
 * it must not introduce card-specific behavior or bypass existing draw, damage,
 * hosted-credit, and source-trash rules.
 */
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  DamageType,
  GameState,
  ImminentEvent,
  LegalAction,
  Side,
} from "@netgrid/shared";
import type {
  CardEffectDamageResult,
  CardEffectDrawCardsResult,
  CardEffectHostedCreditsResult,
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

type DamageSummaryForCardImplementation = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

type DamageRequestForCardImplementation = {
  damageId: string;
  damageType: DamageType;
  amount: number;
  source: string;
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
  createDamageImminentEvent: (
    state: GameState,
    request: DamageRequestForCardImplementation,
  ) => ImminentEvent;
  openReplacementWindow: (
    state: GameState,
    event: ImminentEvent,
    legalAction: LegalAction,
  ) => boolean;
  openEventModificationWindow: (
    state: GameState,
    event: ImminentEvent,
    legalAction: LegalAction,
  ) => boolean;
  resolveDamageImminentEvent: (
    state: GameState,
    event: ImminentEvent,
  ) => DamageSummaryForCardImplementation;
  addCardCounter: (
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: "bit",
    amount: number,
  ) => void;
  cardCounter: (
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: "bit",
  ) => number;
  spendCardCounter: (
    state: GameState,
    sourceCardId: CardInstanceId,
    counterType: "bit",
    amount: number,
  ) => void;
  credits: (state: GameState, side: Side, amount: number) => void;
  mustInstance: (
    source: Record<CardInstanceId, CardInstance>,
    cardId: CardInstanceId,
  ) => CardInstance;
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
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
  | "damageRunner"
  | "addHostedCredits"
  | "takeHostedCredits"
  | "trashSourceWhenEmpty"
  | "trashSource"
>;

/**
 * Creates runtime callbacks for effects that need host-owned mechanics.
 *
 * The returned functions preserve public payload and ResolvedEffect contracts
 * while delegating actual state mutation to injected host primitives. This keeps
 * the runtime independent from index.ts and avoids a parallel damage/draw engine.
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

  function damageRunnerForCardImplementationEffect(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ): CardEffectDamageResult {
    // Damage uses the existing imminent-event, prevention, and modification
    // windows. CardImplementation effects do not resolve damage through a
    // separate shortcut path.
    const request = {
      damageId: `${state.matchId}.${state.stateVersion}.${sourceDefinitionId}`,
      damageType,
      amount,
      source: `operation:${sourceDefinitionId}`,
    };
    const event = host.createDamageImminentEvent(state, request);
    if (
      host.openReplacementWindow(state, event, legalAction) ||
      host.openEventModificationWindow(state, event, legalAction)
    ) {
      return {
        resolved: false,
        damageType,
        amount: 0,
        cardsTrashed: 0,
        flatline: false,
        publicPayload: legalAction.payload ?? {},
      };
    }

    const summary = host.resolveDamageImminentEvent(state, event);
    const publicPayload = damageSummaryPublicPayload(summary);
    if (typeof event.payload.baseDamageAmount === "number")
      publicPayload.baseDamageAmount = event.payload.baseDamageAmount;
    if (typeof event.payload.bioweaponsEngineeringModifier === "number")
      publicPayload.bioweaponsEngineeringModifier =
        event.payload.bioweaponsEngineeringModifier;
    return {
      resolved: true,
      damageType: summary.damageType,
      amount: summary.amount,
      cardsTrashed: summary.cardsTrashed,
      flatline: summary.flatline,
      publicPayload,
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
        sourceTrashed: true,
        trashedCardDefinitionId: definition.id,
      },
    };
  }

  return {
    drawCards: drawCardsForCardImplementationEffect,
    damageRunner: damageRunnerForCardImplementationEffect,
    addHostedCredits: addHostedCreditsForCardImplementationEffect,
    takeHostedCredits: takeHostedCreditsForCardImplementationEffect,
    trashSourceWhenEmpty: trashSourceWhenEmptyForCardImplementationEffect,
    trashSource: trashSourceForCardImplementationEffect,
  };
}

function damageSummaryPublicPayload(
  summary: DamageSummaryForCardImplementation,
): PublicEffectPayload {
  return {
    damageResolved: true,
    damageType: summary.damageType,
    damageAmount: summary.amount,
    cardsTrashed: summary.cardsTrashed,
    flatline: summary.flatline,
    ...(summary.coreDamageAfter !== undefined
      ? { coreDamageAfter: summary.coreDamageAfter }
      : {}),
    ...(summary.runnerMaxHandSizeAfter !== undefined
      ? { runnerMaxHandSizeAfter: summary.runnerMaxHandSizeAfter }
      : {}),
  };
}
