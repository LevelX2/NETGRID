import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CounterType,
  DamageType,
  GameState,
  LegalAction,
  PlayerAction,
  PurgeableRunnerVirusCounterBucket,
  PurgeableRunnerVirusCounterType,
  ResolvedGameEffect,
  ServerId,
} from "@netgrid/shared";
import type { CardVirusCounterImplementation } from "../../ability-engine/definition-types";
import type { SuccessfulRunFollowupExecutionResult } from "./successful-run-interventions";

export type ActiveRun = NonNullable<GameState["run"]>;

export type RunEndTagContinuation = Extract<
  NonNullable<GameState["pendingAddTagContinuation"]>,
  { kind: "run_end_cleanup" }
>;

export type RunnerTurnFlags = NonNullable<GameState["runnerTurnFlags"]>;

export const CORP_PURGEABLE_SUCCESSFUL_RUN_COUNTERS =
  new Set<PurgeableRunnerVirusCounterType>([
    "cascade",
    "crumble",
    "garbage",
    "highlighter",
    "scaldan",
    "tax",
    "vienna",
  ]);

export type RunEndDamageSummary = {
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  coreDamageAfter?: number;
  runnerMaxHandSizeAfter?: number;
};

export type RunEndCleanupResult = {
  handled: boolean;
  runWasSuccessful: boolean;
  serverId?: Exclude<ServerId, "new_remote">;
  returnedTemporaryCredits?: number;
  damageAmount?: number;
  damageType?: DamageType;
  unpreventableDamage?: boolean;
  followupRunChoiceStarted?: boolean;
  derezCardIds?: CardInstanceId[];
  placedCounters?: number;
  gainedCredits?: number;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
  stateChanged?: boolean;
};

export type RunTemporaryCreditCleanupResult = {
  handled: boolean;
  returnedTemporaryCredits?: number;
  damageAmount?: number;
  damageType?: DamageType;
  unpreventableDamage?: boolean;
  resolvedPayload?: NonNullable<LegalAction["payload"]>;
};

export type PostRunBridgeResult = {
  handled: boolean;
  followupRunChoiceStarted?: boolean;
};

export type RunDurationCleanupResult = {
  handled: boolean;
  derezCardIds?: CardInstanceId[];
  removedRunMarkers?: string[];
  placedCounters?: number;
};

export type RunEndAftermathResult = {
  handled: boolean;
  gainedCredits?: number;
  sourceCardId?: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
};

export type RunEndCleanupHost = {
  state: GameState;
  cards: {
    definitionFor: (cardId: CardInstanceId) => CardDefinition;
    cardInstanceFor: (cardId: CardInstanceId) => CardInstance;
    withoutVariableIceState: (instance: CardInstance) => CardInstance;
  };
  servers: {
    mustServer: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => GameState["corp"]["servers"][number];
    publicServerLabel: (
      serverId: Exclude<ServerId, "new_remote">,
    ) => string | undefined;
  };
  runner: {
    ensureTurnFlags: () => RunnerTurnFlags;
    consumeFutureActionDebt: () => void;
    awardEventAgendaPoint?: (
      sourceCardId: CardInstanceId,
      sourceDefinitionId: CardDefinitionId,
      legalAction?: LegalAction,
    ) => void;
    addFutureActionDebt?: (amount: number) => void;
  };
  choices: {
    selectedChoiceIds: (
      selectedChoices: PlayerAction["selectedChoices"],
    ) => string[];
  };
  credits: {
    gainRunner: (amount: number) => void;
    gainCorp: (amount: number) => void;
  };
  damage: {
    dealUnpreventableCoreDamage: (
      run: ActiveRun,
      sourceDefinitionId: CardDefinitionId,
      amount: number,
    ) => RunEndDamageSummary;
  };
  tags: {
    addRunnerTagsWithPrevention: (
      legalAction: LegalAction,
      amount: number,
      source: string,
    ) => boolean;
  };
  counters: {
    cardCounter: (cardId: CardInstanceId, counterType: CounterType) => number;
    setCardCounter: (
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addCardCounter: (
      cardId: CardInstanceId,
      counterType: CounterType,
      amount: number,
    ) => void;
    addVirusCounterWithCounterPrevention: (
      targetCardId: CardInstanceId,
      amount: number,
      legalAction?: LegalAction,
    ) => number;
    preventOneVirusCounterWithCounterPrevention: () => {
      prevented: boolean;
      creditsPaid: number;
      preventionChargesSpent: number;
    };
    poxCountersForServer: (serverId: Exclude<ServerId, "new_remote">) => number;
  };
  ice: {
    icebreakerHasSpecial: (
      breakerId: CardInstanceId,
      special:
        | "dupre_strength_counter_and_last_fort"
        | "run_end_trash_source_if_used",
    ) => boolean;
  };
  virus: {
    installedRunnerVirusSourceIds: (
      predicate?: (implementation: CardVirusCounterImplementation) => boolean,
    ) => CardInstanceId[];
    virusCounterImplementationForCard: (
      cardId: CardInstanceId,
    ) => CardVirusCounterImplementation | undefined;
  };
  aftermath: {
    tokyoUnsuccessfulRunAmountForCard: (
      cardId: CardInstanceId,
    ) => number | undefined;
    isTokyoUnsuccessfulRunSource: (cardId: CardInstanceId) => boolean;
  };
  followups: {
    applySuccessfulRunExtraRunFollowup: (
      legalAction?: LegalAction,
    ) => SuccessfulRunFollowupExecutionResult;
    cleanupDelayedSuccessfulRunTemporaryIce: (
      run: ActiveRun | undefined,
      legalAction?: LegalAction,
    ) => unknown;
    resolveTestSpinRunEnd: (
      run: ActiveRun,
      legalAction?: LegalAction,
    ) => { handled: boolean; stateChanged?: boolean };
  };
  cleanup: {
    cleanupEmptyRemotes: () => void;
    trashRunnerInstalledProgram?: (cardId: CardInstanceId) => void;
  };
};
