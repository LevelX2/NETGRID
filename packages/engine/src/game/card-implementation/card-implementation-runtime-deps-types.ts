import type {
  ActionType,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  GameState,
  LegalAction,
  RunState,
  ServerId,
  Side,
} from "@netgrid/shared";
import type { CardImplementationEffectAdapters } from "../../ability-engine/card-implementation-effect-adapters";
import type { CardImplementationRuntimeDependencies } from "../../ability-engine/card-implementation-runtime";
import type { CounterLifecycleRuntimeDepsHost } from "./counter-lifecycle-runtime-deps";
import type { DamageRuntimeDepsHost } from "./damage-runtime-deps";
import type { HiddenZoneRuntimeDepsHost } from "./hidden-zone-runtime-deps";
import type { InstallRezRuntimeDepsHost } from "./install-rez-runtime-deps";
import type { TraceRuntimeDepsHost } from "./trace-runtime-deps";

export type RuntimeState = Parameters<
  CardImplementationRuntimeDependencies["definitionFor"]
>[0];
export type RuntimeLegalAction = Parameters<
  CardImplementationRuntimeDependencies["startRun"]
>[1];
export type RuntimePublicPayload = Record<string, string | number | boolean>;

export type CardImplementationStartRunOptions = Pick<
  RunState,
  | "freeTrashAccessZones"
  | "grantBonusRunOnFinish"
  | "accessServerOverride"
  | "successfulRunAccessReplacement"
  | "conditionalAccessBonus"
  | "corpRezCostSurcharge"
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
  | "secretSpendGuessRunAutoPassIceId"
  | "prohibitNoisyIcebreakers"
  | "eventApproachIceExposeBeforeRez"
  | "runnerCreditGainOnCorpRez"
  | "damagePreventionPool"
  | "activeSequence"
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
      state: GameState,
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
      state: GameState,
      serverId: Exclude<ServerId, "new_remote">,
      accessCount: number,
      options: CardImplementationStartRunOptions,
      legalAction: RuntimeLegalAction,
    ) => void;
    finishRun: (
      state: GameState,
      legalAction: RuntimeLegalAction,
      successful: boolean,
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
    scoreSourceAsAgenda: CardImplementationRuntimeDependencies["scoreSourceAsAgenda"];
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
    rezInstalledIceWithLifecycleCounters: CardImplementationRuntimeDependencies["rezInstalledIceWithLifecycleCounters"];
    replaceFortCardsFromHq: CardImplementationRuntimeDependencies["replaceFortCardsFromHq"];
    doubleChosenIceStrengthUntilEndOfTurn: CardImplementationRuntimeDependencies["doubleChosenIceStrengthUntilEndOfTurn"];
    trashTopCorpRdCards: CardImplementationRuntimeDependencies["trashTopCorpRdCards"];
    rezCostForCard: CardImplementationRuntimeDependencies["rezCostForCard"];
    startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice: CardImplementationRuntimeDependencies["startCorpChoiceDerezLastRezzedBlackIceOrBadPublicityChoice"];
    startPaidSourceReturnToGripChoice: (
      state: RuntimeState,
      sourceCardId: CardInstanceId,
    ) => void;
  };
};
