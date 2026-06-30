import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import {
  createCounterLifecycleCardImplementationRuntimeDeps,
  type CounterLifecycleRuntimeDepsHost,
} from "./counter-lifecycle-runtime-deps";
import {
  createDamageCardImplementationRuntimeDeps,
  type DamageRuntimeDepsHost,
} from "./damage-runtime-deps";
import {
  createHiddenZoneCardImplementationRuntimeDeps,
  type HiddenZoneRuntimeDepsHost,
} from "./hidden-zone-runtime-deps";
import {
  createInstallRezCardImplementationRuntimeDeps,
  type InstallRezRuntimeDepsHost,
} from "./install-rez-runtime-deps";
import { startRunForCardImplementation } from "./card-implementation-run-deps";
import type {
  GameCardImplementationRuntimeDepsHost,
  RuntimeLegalAction,
  RuntimePublicPayload,
  RuntimeState,
} from "./card-implementation-runtime-deps-types";
import {
  createTraceCardImplementationRuntimeDeps,
  type TraceRuntimeDepsHost,
} from "./trace-runtime-deps";

export type {
  CardImplementationStartRunOptions,
  GameCardImplementationRuntimeDepsHost,
  RuntimeLegalAction,
  RuntimePublicPayload,
  RuntimeState,
} from "./card-implementation-runtime-deps-types";

export type {
  CounterLifecycleRuntimeDepsHost,
  DamageRuntimeDepsHost,
  HiddenZoneRuntimeDepsHost,
  InstallRezRuntimeDepsHost,
  TraceRuntimeDepsHost,
};

export function createGameCardImplementationRuntimeDeps(
  host: GameCardImplementationRuntimeDepsHost,
): CardImplementationRuntimeDependencies {
  assertRequiredHostGroups(host);

  return {
    definitionFor: host.cards.definitionFor,
    mustInstance: host.cards.mustInstance,
    rezzedCorpRootCardIds: host.cards.rezzedCorpRootCardIds,
    runnerInstalledCardIds: host.cards.runnerInstalledCardIds,
    spendClick: host.credits.spendClick,
    spendCredits: host.credits.spendCredits,
    createAction: host.actions.createAction,
    appendResolvedEffectsToPayload: host.actions.appendResolvedEffectsToPayload,
    ...host.callbacks.effectAdapters,
    ...createTraceCardImplementationRuntimeDeps(host.trace),
    ...createDamageCardImplementationRuntimeDeps(host.damage),
    ...createCounterLifecycleCardImplementationRuntimeDeps(host.counters),
    startRun: (state, legalAction, serverId, options) =>
      startRunForCardImplementation(
        host,
        state,
        legalAction,
        serverId,
        options,
      ),
    finishRun: (state, legalAction, successful) => {
      host.run.finishRun(state, legalAction, successful);
      return {
        publicPayload: {
          runEnded: true,
          runSuccessful: successful,
        },
      };
    },
    ...createHiddenZoneCardImplementationRuntimeDeps(
      host.hiddenZone.runtimeDepsHost,
    ),
    ...createInstallRezCardImplementationRuntimeDeps(
      host.install.runtimeDepsHost,
    ),
    corpHqCardCount: (state) => state.corp.hq.length,
    runnerRunAttemptsLastTurn: (state) =>
      Math.max(0, Math.floor(state.runnerTurnFlags?.runAttemptsLastTurn ?? 0)),
    runnerRunAttemptsThisGame: (state) =>
      Math.max(0, Math.floor(state.runnerTurnFlags?.runAttemptsThisGame ?? 0)),
    runnerTrashedNodeLastTurn: (state) =>
      state.runnerTurnFlags?.trashedNodeLastTurn === true,
    runnerTrashedAdvertisementThisTurn: (state) =>
      state.runnerTurnFlags?.trashedAdvertisementThisTurn === true,
    runnerTrashedTransactionsThisTurn: (state) =>
      state.runnerTurnFlags?.trashedTransactionsThisTurn === true,
    runnerInstalledResourceLastTurn: (state) =>
      (state.runnerTurnFlags?.installedResourceIdsLastTurn ?? []).some(
        (cardId) => state.runner.rig.resources.includes(cardId),
      ),
    runnerWasDamagedDuringLastThreeActions: (state) => {
      const current = Math.max(
        0,
        Math.floor(state.runnerTurnFlags?.runnerActionsTakenThisTurn ?? 0),
      );
      const lastDamage = Math.max(
        0,
        Math.floor(state.runnerTurnFlags?.lastDamageRunnerActionOrdinal ?? 0),
      );
      return lastDamage > 0 && current - lastDamage <= 3;
    },
    runnerMadeSuccessfulRunOnServerThisTurn: (state, server) => {
      if (server === "hq")
        return state.runnerTurnFlags?.successfulHqRunThisTurn === true;
      if (server === "rd")
        return state.runnerTurnFlags?.successfulRdRunThisTurn === true;
      return state.runnerTurnFlags?.successfulRunThisTurn === true;
    },
    runnerLiberatedAgendaSubtypeThisTurn: (state, subtype) => {
      if (subtype === "research")
        return state.runnerTurnFlags?.stoleResearchAgendaThisTurn === true;
      if (subtype === "gray_ops")
        return state.runnerTurnFlags?.stoleGrayOpsAgendaThisTurn === true;
      return state.runnerTurnFlags?.stoleBlackOpsAgendaThisTurn === true;
    },
    corpScoredAgendaSubtypeLastTurn: (state, subtype) =>
      subtype === "black_ops" &&
      state.corpTurnFlags?.scoredBlackOpsAgendaLastTurn === true,
    startCorpDiscardHqWithRetainPayment:
      host.hiddenZone.startCorpDiscardHqWithRetainPayment,
    shuffleSourceIntoCorpRd: host.callbacks.shuffleSourceIntoCorpRd,
    trashCorpInstalledCardsInSourceServer:
      host.callbacks.trashCorpInstalledCardsInSourceServer,
    gainRunnerEventAgendaPoint: (
      state,
      legalAction,
      sourceDefinitionId,
      amount,
    ) => {
      if (amount !== 1)
        throw new Error("Runner event agenda point amount must be 1.");
      host.callbacks.awardRunnerEventAgendaPoint(
        state,
        legalAction,
        sourceDefinitionId,
      );
      return { publicPayload: legalAction.payload ?? {} };
    },
    scoreSourceAsAgenda: host.callbacks.scoreSourceAsAgenda,
    corpRandomDiscardFromHq: (state, sourceDefinitionId, count) => {
      const discardedCardIds = host.callbacks.discardRandomCorpHqCards(
        state,
        sourceDefinitionId,
        count,
      );
      return {
        publicPayload: {
          hiddenZoneBarrier: true,
          hiddenZoneAction: "hq_random_discard",
          discardedCardsCount: discardedCardIds.length,
        },
      };
    },
    startDistributeAdvancementCounters:
      host.callbacks.startDistributeAdvancementCounters,
    startMoveAdvancementCounters: host.callbacks.startMoveAdvancementCounters,
    revealHiddenRunnerResource: (state, sourceCardId) =>
      host.callbacks.revealHiddenRunnerResource?.(state, sourceCardId) ?? {},
    addCurrentRunAccessCount: (state, server, amount) => {
      if (!host.callbacks.addCurrentRunAccessCount)
        throw new Error("Current-run access count callback is not configured.");
      return host.callbacks.addCurrentRunAccessCount(state, server, amount);
    },
    passCurrentEncounteredIce: (state, legalAction, subtypeRequired) => {
      if (!host.callbacks.passCurrentEncounteredIce)
        throw new Error("Encounter pass callback is not configured.");
      return host.callbacks.passCurrentEncounteredIce(
        state,
        legalAction,
        subtypeRequired,
      );
    },
    rezInstalledIceWithLifecycleCounters:
      host.callbacks.rezInstalledIceWithLifecycleCounters,
    replaceFortCardsFromHq: host.callbacks.replaceFortCardsFromHq,
    trashTopCorpRdCards: host.callbacks.trashTopCorpRdCards,
    rezCostForCard: host.callbacks.rezCostForCard,
    startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice:
      host.callbacks.startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice,
    addCurrentEncounterAdditionalSubroutine: (
      state,
      legalAction,
      sourceCardId,
      sourceDefinitionId,
      sourceTitle,
      input,
    ) =>
      addCurrentEncounterAdditionalSubroutineForCardImplementation(
        host,
        state,
        legalAction,
        sourceCardId,
        sourceDefinitionId,
        sourceTitle,
        input,
      ),
    returnSourceToGripIfPaid: (state, legalAction, sourceCardId, amount) =>
      startReturnSourceToGripIfPaidChoice(
        host,
        state,
        legalAction,
        sourceCardId,
        amount,
      ),
  };
}

function addCurrentEncounterAdditionalSubroutineForCardImplementation(
  host: GameCardImplementationRuntimeDepsHost,
  state: RuntimeState,
  legalAction: RuntimeLegalAction,
  sourceCardId: CardInstanceId,
  sourceDefinitionId: CardDefinitionId,
  sourceTitle: string,
  input: {
    subroutineKind: "end_the_run" | "end_the_run_unless_runner_pays";
    amount?: number;
  },
): { publicPayload: RuntimePublicPayload } {
  void legalAction;
  const run = state.run;
  if (
    state.timingPoint !== "run.encounter_ice" ||
    run?.phase !== "encounter_ice" ||
    run.encounteredIceId !== sourceCardId
  )
    throw new Error(
      "Encounter-Subroutine kann nur auf das encountered ICE gelegt werden.",
    );
  const instance = state.cardInstances[sourceCardId];
  if (!instance?.rezzed)
    throw new Error("Encounter-Subroutine braucht gerezzte ICE.");
  const subroutineKind = input.subroutineKind;
  if (
    subroutineKind !== "end_the_run" &&
    subroutineKind !== "end_the_run_unless_runner_pays"
  )
    throw new Error("Encounter-Subroutine-Typ ist nicht unterstuetzt.");
  let amount: number | undefined;
  if (subroutineKind === "end_the_run_unless_runner_pays") {
    amount = Math.max(0, Math.floor(input.amount ?? 0));
    if (amount <= 0)
      throw new Error("Pay-or-End-Subroutine braucht einen positiven Betrag.");
  }
  host.cards.mustInstance(state.cardInstances, sourceCardId);
  run.encounterAdditionalSubroutines = [
    ...(run.encounterAdditionalSubroutines ?? []),
    {
      sourceCardInstanceId: sourceCardId,
      sourceDefinitionId,
      sourceTitle,
      subroutineKind,
      ...(amount !== undefined ? { amount } : {}),
    },
  ];
  const count = run.encounterAdditionalSubroutines.filter(
    (record) => record.sourceCardInstanceId === sourceCardId,
  ).length;
  return {
    publicPayload: {
      currentEncounterAdditionalSubroutines: count,
      currentEncounterAdditionalSubroutineKind: subroutineKind,
      currentEncounterAdditionalSubroutineSourceDefinitionId:
        sourceDefinitionId,
    },
  };
}

function startReturnSourceToGripIfPaidChoice(
  host: GameCardImplementationRuntimeDepsHost,
  state: RuntimeState,
  legalAction: RuntimeLegalAction,
  sourceCardId: CardInstanceId,
  amount: number,
): { choiceOpened: boolean; publicPayload: RuntimePublicPayload } {
  if (state.runner.credits < amount) {
    return {
      choiceOpened: false,
      publicPayload: {
        returnToGripCost: amount,
        returnToGripChoiceOpened: false,
      },
    };
  }
  host.callbacks.startPaidSourceReturnToGripChoice(state, sourceCardId);
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    v1922RunnerEventAbility: "remove_tag_optional_return",
    returnToGripCost: amount,
    returnToGripChoiceOpened: true,
  };
  return {
    choiceOpened: true,
    publicPayload: {
      v1922RunnerEventAbility: "remove_tag_optional_return",
      returnToGripCost: amount,
      returnToGripChoiceOpened: true,
    },
  };
}

function assertRequiredHostGroups(
  host: Partial<GameCardImplementationRuntimeDepsHost>,
): asserts host is GameCardImplementationRuntimeDepsHost {
  const requiredGroups: Array<keyof GameCardImplementationRuntimeDepsHost> = [
    "cards",
    "credits",
    "actions",
    "run",
    "hiddenZone",
    "install",
    "trace",
    "counters",
    "callbacks",
  ];
  for (const group of requiredGroups) {
    if (!host[group])
      throw new Error(`GameCardImplementationRuntimeDepsHost fehlt: ${group}.`);
  }
}
