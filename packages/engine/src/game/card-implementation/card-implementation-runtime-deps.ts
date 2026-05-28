import type {
  ActionType,
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  RunState,
  ServerId,
  Side,
} from "@netgrid/shared";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import type { CardImplementationEffectAdapters } from "../../ability-engine/card-implementation-effect-adapters";
import type { CardEffectMakeRunOptions } from "../../ability-engine/effect-interpreter";
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
import {
  createTraceCardImplementationRuntimeDeps,
  type TraceRuntimeDepsHost,
} from "./trace-runtime-deps";

type RuntimeState = Parameters<
  CardImplementationRuntimeDependencies["definitionFor"]
>[0];
type RuntimeLegalAction = Parameters<
  CardImplementationRuntimeDependencies["startRun"]
>[1];
type RuntimePublicPayload = Record<string, string | number | boolean>;

type CardImplementationStartRunOptions = Pick<
  RunState,
  | "freeTrashAccessZones"
  | "grantAllNighterBonusRunOnFinish"
  | "accessServerOverride"
  | "successfulRunAccessReplacement"
  | "successfulRunCreditLoss"
  | "successfulRunRunnerTagGain"
  | "successfulRunCorpDraw"
  | "successfulRunRunnerCreditGain"
  | "successfulRunRequiresCorpCredits"
  | "successfulRunPrivateLookCount"
  | "successfulRunArchivesMoveCount"
  | "successfulRunSourceCardId"
  | "successfulRunSourceDefinitionId"
  | "successfulRunSourceTitle"
  | "bypassFirstIceRemaining"
  | "runTraceLinkBonus"
  | "runTraceLinkBonusSourceDefinitionId"
  | "runnerRunTemporaryCredits"
  | "unpreventableCoreDamageAtRunEnd"
  | "socialEngineeringAutoPassIceId"
  | "prohibitNoisyIcebreakers"
  | "eventApproachIceExposeBeforeRez"
  | "runnerCreditGainOnCorpRez"
  | "damagePreventionPool"
>;

export type GameCardImplementationRuntimeDepsHost = {
  cards: {
    definitionFor: CardImplementationRuntimeDependencies["definitionFor"];
    mustInstance: CardImplementationRuntimeDependencies["mustInstance"];
    rezzedCorpRootCardIds: CardImplementationRuntimeDependencies["rezzedCorpRootCardIds"];
    runnerInstalledCardIds: CardImplementationRuntimeDependencies["runnerInstalledCardIds"];
  };
  credits: {
    spendClick: CardImplementationRuntimeDependencies["spendClick"];
    spendCredits: CardImplementationRuntimeDependencies["spendCredits"];
  };
  actions: {
    createAction: (
      state: RuntimeState,
      side: Side,
      type: ActionType,
      label: string,
      source: LegalAction["source"],
      costs?: LegalAction["costs"],
      payload?: LegalAction["payload"],
    ) => LegalAction;
    appendResolvedEffectsToPayload: CardImplementationRuntimeDependencies["appendResolvedEffectsToPayload"];
  };
  run: {
    startRun: (
      state: RuntimeState,
      serverId: Exclude<ServerId, "new_remote">,
      accessCount: number,
      options: CardImplementationStartRunOptions,
      legalAction: RuntimeLegalAction,
    ) => void;
  };
  hiddenZone: {
    runtimeDepsHost: HiddenZoneRuntimeDepsHost;
    startCorpDiscardHqWithRetainPayment: CardImplementationRuntimeDependencies["startCorpDiscardHqWithRetainPayment"];
  };
  install: {
    runtimeDepsHost: InstallRezRuntimeDepsHost;
  };
  trace: TraceRuntimeDepsHost;
  damage?: DamageRuntimeDepsHost;
  counters: CounterLifecycleRuntimeDepsHost;
  callbacks: {
    effectAdapters: CardImplementationEffectAdapters;
    shuffleSourceIntoCorpRd: CardImplementationRuntimeDependencies["shuffleSourceIntoCorpRd"];
    trashCorpInstalledCardsInSourceServer: CardImplementationRuntimeDependencies["trashCorpInstalledCardsInSourceServer"];
    awardRunnerEventAgendaPoint: (
      state: RuntimeState,
      legalAction: RuntimeLegalAction,
      sourceDefinitionId: CardDefinition["id"],
    ) => void;
    discardRandomCorpHqCards: (
      state: RuntimeState,
      sourceDefinitionId: CardDefinition["id"],
      count: number,
    ) => CardInstanceId[];
    startDistributeAdvancementCounters: CardImplementationRuntimeDependencies["startDistributeAdvancementCounters"];
    startMoveAdvancementCounters: CardImplementationRuntimeDependencies["startMoveAdvancementCounters"];
    revealHiddenRunnerResource?: CardImplementationRuntimeDependencies["revealHiddenRunnerResource"];
    addCurrentRunAccessCount?: CardImplementationRuntimeDependencies["addCurrentRunAccessCount"];
    passCurrentEncounteredIce?: CardImplementationRuntimeDependencies["passCurrentEncounteredIce"];
    startOpenEndedMileageProgramReturnChoice: (
      state: RuntimeState,
      sourceCardId: CardInstanceId,
    ) => void;
  };
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
      startRunForCardImplementation(host, state, legalAction, serverId, options),
    ...createHiddenZoneCardImplementationRuntimeDeps(
      host.hiddenZone.runtimeDepsHost,
    ),
    ...createInstallRezCardImplementationRuntimeDeps(
      host.install.runtimeDepsHost,
    ),
    corpHqCardCount: (state) => state.corp.hq.length,
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

function startRunForCardImplementation(
  host: GameCardImplementationRuntimeDepsHost,
  state: RuntimeState,
  legalAction: RuntimeLegalAction,
  serverId: Exclude<ServerId, "new_remote">,
  options: CardEffectMakeRunOptions,
): { publicPayload: RuntimePublicPayload } {
  const sourceCardId =
    typeof legalAction.source === "string" &&
    state.cardInstances[legalAction.source]
      ? legalAction.source
      : typeof legalAction.payload?.cardId === "string" &&
          state.cardInstances[legalAction.payload.cardId]
        ? legalAction.payload.cardId
        : undefined;
  const sourceDefinitionId = sourceCardId
    ? host.cards.definitionFor(state, sourceCardId).id
    : undefined;
  host.run.startRun(
    state,
    serverId,
    options.accessCount ?? 1,
    {
      ...(options.freeTrashAccessZones
        ? { freeTrashAccessZones: options.freeTrashAccessZones.slice() }
        : {}),
      ...(options.accessServerOverride
        ? { accessServerOverride: options.accessServerOverride }
        : {}),
      ...(options.successfulRunAccessReplacement
        ? {
            successfulRunAccessReplacement:
              options.successfulRunAccessReplacement,
          }
        : {}),
      ...(options.successfulRunCreditLoss !== undefined
        ? { successfulRunCreditLoss: options.successfulRunCreditLoss }
        : {}),
      ...(options.successfulRunRunnerTagGain !== undefined
        ? { successfulRunRunnerTagGain: options.successfulRunRunnerTagGain }
        : {}),
      ...(options.successfulRunRunnerCreditGain !== undefined
        ? {
            successfulRunRunnerCreditGain:
              options.successfulRunRunnerCreditGain,
          }
        : {}),
      ...(options.successfulRunRequiresCorpCredits !== undefined
        ? {
            successfulRunRequiresCorpCredits:
              options.successfulRunRequiresCorpCredits,
          }
        : {}),
      ...(options.successfulRunPrivateLookCount !== undefined
        ? { successfulRunPrivateLookCount: options.successfulRunPrivateLookCount }
        : {}),
      ...(options.successfulRunArchivesMoveCount !== undefined
        ? {
            successfulRunArchivesMoveCount:
              options.successfulRunArchivesMoveCount,
          }
        : {}),
      ...(options.followupRunOnEnd === "optional"
        ? { grantAllNighterBonusRunOnFinish: true }
        : {}),
      ...(options.bypassFirstIce ? { bypassFirstIceRemaining: true } : {}),
      ...(options.runTraceLinkBonus !== undefined
        ? { runTraceLinkBonus: options.runTraceLinkBonus }
        : {}),
      ...(options.runTemporaryCredits !== undefined
        ? {
            runnerRunTemporaryCredits: {
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
              remaining: options.runTemporaryCredits.amount,
              returnUnusedAtRunEnd: true,
            },
          }
        : {}),
      ...(options.afterRunCompletedUnpreventableCoreDamage !== undefined
        ? {
            unpreventableCoreDamageAtRunEnd: {
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
              amount: options.afterRunCompletedUnpreventableCoreDamage,
            },
          }
        : {}),
      ...(options.prohibitNoisyIcebreakers
        ? { prohibitNoisyIcebreakers: true }
        : {}),
      ...(options.eventApproachIceExposeBeforeRez
        ? { eventApproachIceExposeBeforeRez: true }
        : {}),
      ...(options.runnerCreditGainOnCorpRez !== undefined
        ? { runnerCreditGainOnCorpRez: options.runnerCreditGainOnCorpRez }
        : {}),
      ...(options.damagePreventionPool !== undefined
        ? {
            damagePreventionPool: {
              sourceDefinitionId: sourceDefinitionId ?? "card_implementation",
              remaining: options.damagePreventionPool,
            },
          }
        : {}),
      ...(options.pirateBroadcast
        ? { pirateBroadcast: options.pirateBroadcast }
        : {}),
      ...(options.runTraceLinkBonus !== undefined && sourceDefinitionId
        ? {
            runTraceLinkBonusSourceDefinitionId: sourceDefinitionId,
          }
        : {}),
      ...(sourceCardId && sourceDefinitionId
        ? {
            successfulRunSourceCardId: sourceCardId,
            successfulRunSourceDefinitionId: sourceDefinitionId,
            successfulRunSourceTitle: host.cards.definitionFor(
              state,
              sourceCardId,
            ).title,
          }
        : {}),
    },
    legalAction,
  );
  legalAction.payload = {
    ...(legalAction.payload ?? {}),
    ...(options.followupRunOnEnd === "optional"
      ? { allNighterBonusRunOnFinish: true }
      : {}),
    ...(options.bypassFirstIce ? { bypassFirstIce: true } : {}),
    ...(options.runTraceLinkBonus !== undefined
      ? {
          runTraceLinkBonus: options.runTraceLinkBonus,
          ...(typeof legalAction.source === "string" &&
          sourceCardId &&
          sourceDefinitionId
            ? {
                runTraceLinkBonusSourceDefinitionId: sourceDefinitionId,
              }
            : {}),
        }
      : {}),
    ...(options.runTemporaryCredits !== undefined
      ? {
          v1922RunnerEventAbility: "lucidrine_booster_drug_run_temporary_credits",
          temporaryRunCredits: options.runTemporaryCredits.amount,
          temporaryRunCreditsRemaining:
            state.run?.runnerRunTemporaryCredits?.remaining ?? 0,
        }
      : {}),
    ...(options.afterRunCompletedUnpreventableCoreDamage !== undefined
      ? {
          afterRunUnpreventableCoreDamage:
            options.afterRunCompletedUnpreventableCoreDamage,
        }
      : {}),
    ...(options.prohibitNoisyIcebreakers
      ? { prohibitNoisyIcebreakers: true }
      : {}),
    ...(options.eventApproachIceExposeBeforeRez
      ? { eventApproachIceExposeBeforeRez: true }
      : {}),
    ...(options.runnerCreditGainOnCorpRez !== undefined
      ? { runnerCreditGainOnCorpRez: options.runnerCreditGainOnCorpRez }
      : {}),
    ...(options.damagePreventionPool !== undefined
      ? { damagePreventionPool: options.damagePreventionPool }
      : {}),
    ...(options.pirateBroadcast
      ? {
          pirateBroadcastSequenceActive: true,
          pirateBroadcastPendingServerCount:
            options.pirateBroadcast.pendingServerIds.length,
        }
      : {}),
  };
  return { publicPayload: legalAction.payload ?? {} };
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
      currentEncounterAdditionalSubroutineSourceDefinitionId: sourceDefinitionId,
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
  host.callbacks.startOpenEndedMileageProgramReturnChoice(state, sourceCardId);
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
