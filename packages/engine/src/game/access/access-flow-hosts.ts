import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  DamageType,
  GameState,
  LegalAction,
  ServerId,
  Side,
  TraceSuccessEffect,
} from "@netgrid/shared";
import type {
  CardAccessEffectImplementation,
  CardHiddenReplacementLongtailImplementation,
  CardTraceSuccessEffectImplementation,
} from "../../ability-engine/definition-types";
import { buildLegalAction as action } from "../turn/action-builders";
import {
  handleAccessEffectsForCard,
  type AccessEffectHandlerHost,
} from "./access-effect-handlers";
import type { AccessFlowHost } from "./access-flow";
import type { BreachStateHost } from "./breach-state";
import type { RunnerAccessActionHost } from "./access-actions";

type ActiveRun = NonNullable<GameState["run"]>;

export type AccessFlowCompositionHost = {
  cards: {
    definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (state: GameState, cardId: CardInstanceId) => CardInstance;
    cardHasSubtype: (definition: CardDefinition, subtype: string) => boolean;
    accessEffectsForDefinition: (
      definitionId: CardDefinitionId,
    ) => readonly CardAccessEffectImplementation[];
    hiddenReplacementLongtailKindForDefinition: (
      definitionId: CardDefinitionId,
    ) => CardHiddenReplacementLongtailImplementation["kind"] | undefined;
  };
  servers: {
    mustServer: (
      state: GameState,
      serverId: Exclude<ServerId, "new_remote"> | string,
    ) => GameState["corp"]["servers"][number];
    randomHqAccess: (state: GameState) => CardInstanceId | undefined;
  };
  run: {
    finishRun: (
      state: GameState,
      successful: boolean,
      legalAction?: LegalAction,
    ) => void;
    successfulRunProgramActions: (
      state: GameState,
      run: ActiveRun,
    ) => LegalAction[];
    runnerDuringRunCardImplementationLegalActions: (
      state: GameState,
    ) => LegalAction[];
    hiddenStackInstallRunActions: (state: GameState, run: ActiveRun) => LegalAction[];
    startPostAccessInstalledProgramChoice: (
      state: GameState,
      run: ActiveRun,
      legalAction?: LegalAction,
    ) => boolean;
  };
  damage: {
    resolveDamageOperation: (
      state: GameState,
      legalAction: LegalAction,
      damageType: DamageType,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
    doDamage: (
      state: GameState,
      input: {
        damageId: string;
        damageType: DamageType;
        amount: number;
        source: CardDefinitionId;
      },
    ) => ReturnType<AccessEffectHandlerHost["damage"]["doDamage"]>;
    setDamagePayload: (
      legalAction: LegalAction,
      summary: ReturnType<AccessEffectHandlerHost["damage"]["doDamage"]>,
    ) => void;
  };
  tags: {
    addRunnerTagsWithPrevention: (
      state: GameState,
      legalAction: LegalAction,
      amount: number,
      sourceDefinitionId: CardDefinitionId,
    ) => void;
  };
  trace: {
    startTraceFromOperation: (
      state: GameState,
      sourceDefinitionId: CardDefinitionId,
      baseTraceStrength: number,
      legalAction: LegalAction,
      successEffect?: TraceSuccessEffect,
    ) => void;
    traceSuccessEffectForCardImplementation: (
      effects: readonly CardTraceSuccessEffectImplementation[],
    ) => unknown;
  };
  payment: {
    spendCredits: (state: GameState, side: Side, amount: number) => void;
    hostedPaymentCredits: (state: GameState, cardId: CardInstanceId) => number;
    restrictedHostedCreditSourceIds: (
      state: GameState,
      ...args: Parameters<
        RunnerAccessActionHost["payment"]["restrictedHostedCreditSourceIds"]
      >
    ) => CardInstanceId[];
    isRestrictedHostedCreditSource: (definition: CardDefinition) => boolean;
    spendRunnerAccessTrashCredits: (
      state: GameState,
      amount: number,
      accessedCardId: CardInstanceId,
    ) => { recurringSpent: number; runnerCreditsSpent: number };
  };
  counters: {
    cardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
    ) => number;
    addCardCounter: (
      state: GameState,
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addCounterToAllInstalledRunnerIcebreakers: (
      state: GameState,
      counterType: CounterType,
      amount: number,
    ) => ReturnType<
      AccessEffectHandlerHost["counters"]["addCounterToAllInstalledRunnerIcebreakers"]
    >;
  };
  zones: {
    removeFromAllZones: (state: GameState, cardId: CardInstanceId) => void;
    ensureSpecialZones: (state: GameState) => ReturnType<AccessFlowHost["zones"]["ensureSpecialZones"]>;
    trashCorpInstalledCardToArchives: (
      state: GameState,
      cardId: CardInstanceId,
      legalAction?: LegalAction,
    ) => void;
    trashRunnerInstalledCardToHeap: (
      state: GameState,
      cardId: CardInstanceId,
    ) => void;
    shuffleCorpCardIntoRd: (
      state: GameState,
      cardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
      reason: "access",
    ) => ReturnType<AccessEffectHandlerHost["corpCards"]["shuffleCorpCardIntoRd"]>;
    returnRunnerInstalledProgramsToGripForAccess: (
      state: GameState,
      cardIds: readonly CardInstanceId[],
    ) => ReturnType<AccessEffectHandlerHost["runnerCards"]["returnInstalledProgramsToGrip"]>;
  };
  choices: {
    openRunnerInstalledTrashPreventionWindow: (
      state: GameState,
      legalAction: LegalAction,
      targetIds: CardInstanceId[],
      sourceDefinitionId: CardDefinitionId,
    ) => boolean;
  };
  turn: {
    ensureRunnerTurnFlags: (
      state: GameState,
    ) => NonNullable<GameState["runnerTurnFlags"]>;
  };
  random: {
    nextRandom: (state: GameState, purpose: string) => number;
  };
  callbacks: {
    agendaPointsForScoredCard: (
      state: GameState,
      cardId: CardInstanceId,
    ) => number;
    snapshotPersistentStealCostModifiersForSource: (
      state: GameState,
      cardId: CardInstanceId,
      serverId: Exclude<ServerId, "new_remote">,
      legalAction?: LegalAction,
    ) => void;
    archivesAccessRequiresDecisionOrEffect: (
      state: GameState,
      cardId: CardInstanceId,
    ) => boolean;
    installedRevealHelperCount: (state: GameState) => number;
  };
  constants: AccessEffectHandlerHost["definitions"];
};

export type AccessFlowAdapters = {
  breachStateHost: (state: GameState) => BreachStateHost;
  runnerAccessActionHost: (state: GameState) => RunnerAccessActionHost;
  accessFlowHost: (state: GameState) => AccessFlowHost;
  accessEffectHandlerHost: (
    state: GameState,
    legalAction?: LegalAction,
  ) => AccessEffectHandlerHost;
};

export function createAccessFlowAdapters(
  host: AccessFlowCompositionHost,
): AccessFlowAdapters {
  assertRequiredHostGroups(host);

  function breachStateHost(state: GameState): BreachStateHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
      },
      rng: {
        nextRandom: (purpose) => host.random.nextRandom(state, purpose),
      },
    };
  }

  function runnerAccessActionHost(state: GameState): RunnerAccessActionHost {
    return {
      state,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        cardHasSubtype: host.cards.cardHasSubtype,
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
      },
      actions: {
        buildLegalAction: (side, type, label, source, costs, payload) =>
          action(state, side, type, label, source, costs, payload),
      },
      payment: {
        hostedPaymentCredits: (cardId) =>
          host.payment.hostedPaymentCredits(state, cardId),
        restrictedHostedCreditSourceIds: (...args) =>
          host.payment.restrictedHostedCreditSourceIds(state, ...args),
        isRestrictedHostedCreditSource:
          host.payment.isRestrictedHostedCreditSource,
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType as CounterType),
      },
      callbacks: {
        successfulRunProgramActions: (run) =>
          host.run.successfulRunProgramActions(state, run),
        runnerDuringRunCardImplementationLegalActions: () =>
          host.run.runnerDuringRunCardImplementationLegalActions(state),
        hiddenStackInstallRunActions: (run) => host.run.hiddenStackInstallRunActions(state, run),
      },
    };
  }

  function accessFlowHost(state: GameState): AccessFlowHost {
    return {
      state,
      accessActions: runnerAccessActionHost(state),
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        cardInstanceFor: (cardId) => host.cards.cardInstanceFor(state, cardId),
        cardHasSubtype: host.cards.cardHasSubtype,
      },
      servers: {
        mustServer: (serverId) => host.servers.mustServer(state, serverId),
        randomHqAccess: () => host.servers.randomHqAccess(state),
      },
      effects: {
        executeAccessEffects: (cardId, legalAction) =>
          handleAccessEffectsForCard(
            accessEffectHandlerHost(state, legalAction),
            cardId,
          ),
        archivesAccessRequiresDecisionOrEffect: (cardId) =>
          host.callbacks.archivesAccessRequiresDecisionOrEffect(state, cardId),
      },
      runner: {
        ensureTurnFlags: () => host.turn.ensureRunnerTurnFlags(state),
      },
      zones: {
        removeFromAllZones: (cardId) =>
          host.zones.removeFromAllZones(state, cardId),
        trashRunnerInstalledCardToHeap: (cardId) =>
          host.zones.trashRunnerInstalledCardToHeap(state, cardId),
        ensureSpecialZones: () => host.zones.ensureSpecialZones(state),
      },
      payment: {
        spendRunnerCredits: (amount) =>
          host.payment.spendCredits(state, "runner", amount),
        spendRunnerAccessTrashCredits: (amount, accessedCardId) =>
          host.payment.spendRunnerAccessTrashCredits(
            state,
            amount,
            accessedCardId,
          ),
      },
      steal: {
        agendaPointsForScoredCard: (cardId) =>
          host.callbacks.agendaPointsForScoredCard(state, cardId),
        snapshotPersistentStealCostModifiersForSource: (
          cardId,
          serverId,
          legalAction,
        ) =>
          host.callbacks.snapshotPersistentStealCostModifiersForSource(
            state,
            cardId,
            serverId,
            legalAction,
          ),
      },
      trash: {
        trashCorpInstalledCardToArchives: (cardId, legalAction) =>
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          ),
      },
      run: {
        finishRun: (successful, legalAction) =>
          host.run.finishRun(state, successful, legalAction),
        startPostAccessInstalledProgramChoice: (run, legalAction) =>
          host.run.startPostAccessInstalledProgramChoice(
            state,
            run,
            legalAction,
          ),
      },
      access: {
        installedRevealHelperCount: () =>
          host.callbacks.installedRevealHelperCount(state),
      },
    };
  }

  function accessEffectHandlerHost(
    state: GameState,
    legalAction?: LegalAction,
  ): AccessEffectHandlerHost {
    return {
      state,
      ...(legalAction ? { legalAction } : {}),
      definitions: host.constants,
      cards: {
        definitionFor: (cardId) => host.cards.definitionFor(state, cardId),
        mustInstance: (cardId) => host.cards.cardInstanceFor(state, cardId),
        cardHasSubtype: host.cards.cardHasSubtype,
        accessEffectsForDefinition: host.cards.accessEffectsForDefinition,
        hiddenReplacementLongtailKindForDefinition:
          host.cards.hiddenReplacementLongtailKindForDefinition,
      },
      damage: {
        resolveDamageOperation: (damageType, amount, sourceDefinitionId) => {
          if (!legalAction) throw new Error("Damage-Aktion fehlt.");
          host.damage.resolveDamageOperation(
            state,
            legalAction,
            damageType,
            amount,
            sourceDefinitionId,
          );
        },
        doDamage: (damageId, damageType, amount, sourceDefinitionId) =>
          host.damage.doDamage(state, {
            damageId,
            damageType,
            amount,
            source: sourceDefinitionId,
          }),
        setDamagePayload: (summary) => {
          if (!legalAction) throw new Error("Damage-Aktion fehlt.");
          host.damage.setDamagePayload(legalAction, summary);
        },
      },
      tags: {
        addRunnerTagsWithPrevention: (amount, sourceDefinitionId) => {
          if (!legalAction) throw new Error("Tag-Aktion fehlt.");
          host.tags.addRunnerTagsWithPrevention(
            state,
            legalAction,
            amount,
            sourceDefinitionId,
          );
        },
      },
      trace: {
        startTraceFromOperation: (
          sourceDefinitionId,
          baseTraceStrength,
          successEffect,
        ) => {
          if (!legalAction) throw new Error("Trace-Aktion fehlt.");
          host.trace.startTraceFromOperation(
            state,
            sourceDefinitionId,
            baseTraceStrength,
            legalAction,
            successEffect as TraceSuccessEffect | undefined,
          );
        },
        traceSuccessEffectForCardImplementation:
          host.trace.traceSuccessEffectForCardImplementation,
      },
      counters: {
        cardCounter: (cardId, counterType) =>
          host.counters.cardCounter(state, cardId, counterType as CounterType),
        addCardCounter: (cardId, counterType, amount) =>
          host.counters.addCardCounter(
            state,
            cardId,
            counterType as CounterType,
            amount,
          ),
        addCounterToAllInstalledRunnerIcebreakers: (counterType, amount) =>
          host.counters.addCounterToAllInstalledRunnerIcebreakers(
            state,
            counterType,
            amount,
          ),
      },
      corpCards: {
        shuffleCorpCardIntoRd: (cardId, sourceDefinitionId) =>
          host.zones.shuffleCorpCardIntoRd(
            state,
            cardId,
            sourceDefinitionId,
            "access",
          ),
      },
      runnerCards: {
        returnInstalledProgramsToGrip: (cardIds) =>
          host.zones.returnRunnerInstalledProgramsToGripForAccess(
            state,
            cardIds,
          ),
      },
      payment: {
        spendCorpCredits: (amount) =>
          host.payment.spendCredits(state, "corp", amount),
      },
      trash: {
        trashRunnerInstalledCardToHeap: (cardId) =>
          host.zones.trashRunnerInstalledCardToHeap(state, cardId),
        trashCorpInstalledCardToArchives: (cardId) => {
          if (!legalAction) throw new Error("Corp-Trash-Aktion fehlt.");
          host.zones.trashCorpInstalledCardToArchives(
            state,
            cardId,
            legalAction,
          );
        },
        openRunnerInstalledTrashPreventionWindow: (
          targetIds,
          sourceDefinitionId,
        ) => {
          if (!legalAction) throw new Error("Trash-Prevention-Aktion fehlt.");
          return host.choices.openRunnerInstalledTrashPreventionWindow(
            state,
            legalAction,
            targetIds,
            sourceDefinitionId,
          );
        },
      },
    };
  }

  return {
    breachStateHost,
    runnerAccessActionHost,
    accessFlowHost,
    accessEffectHandlerHost,
  };
}

function assertRequiredHostGroups(host: AccessFlowCompositionHost): void {
  for (const group of [
    "cards",
    "servers",
    "run",
    "damage",
    "tags",
    "trace",
    "payment",
    "counters",
    "zones",
    "choices",
    "turn",
    "random",
    "callbacks",
    "constants",
  ] as const) {
    if (!host[group])
      throw new Error(`AccessFlowCompositionHost missing group: ${group}`);
  }
}
