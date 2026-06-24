import type {
  ActionType,
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CounterType,
  DamageType,
  GameState,
  LegalAction,
  ResolvedGameEffect,
  ServerId,
  Side,
} from "@netgrid/shared";
import type {
  CardEffectDamageResult,
  CardEffectDrawCardsResult,
  CardEffectMakeRunOptions,
  CardEffectMakeRunResult,
} from "./effect-execution-types";
import type { CardTraceSuccessEffectImplementation } from "./definition-types";

export type RuntimeEffectCollector = ResolvedGameEffect[];

export type CardImplementationRuntimeCoreDependencies = {
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  mustInstance: (
    source: Record<CardInstanceId, CardInstance>,
    cardId: CardInstanceId,
  ) => CardInstance;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
  ) => number;
  rezzedCorpRootCardIds: (state: GameState) => CardInstanceId[];
  runnerInstalledCardIds: (state: GameState) => CardInstanceId[];
  runnerRunAttemptsLastTurn: (state: GameState) => number;
  runnerRunAttemptsThisGame: (state: GameState) => number;
  runnerTrashedNodeLastTurn: (state: GameState) => boolean;
  runnerTrashedAdvertisementThisTurn: (state: GameState) => boolean;
  runnerTrashedTransactionsThisTurn: (state: GameState) => boolean;
  runnerInstalledResourceLastTurn: (state: GameState) => boolean;
  runnerWasDamagedDuringLastThreeActions: (state: GameState) => boolean;
  runnerMadeSuccessfulRunOnServerThisTurn: (
    state: GameState,
    server: Extract<ServerId, "hq" | "rd"> | "any_data_fort",
  ) => boolean;
  runnerLiberatedAgendaSubtypeThisTurn: (
    state: GameState,
    subtype: "research" | "gray_ops" | "black_ops",
  ) => boolean;
  corpScoredAgendaSubtypeLastTurn: (
    state: GameState,
    subtype: "black_ops",
  ) => boolean;
  spendClick: (state: GameState, side: Side) => void;
  spendCredits: (state: GameState, side: Side, amount: number) => void;
  createAction: (
    state: GameState,
    side: Side,
    type: ActionType,
    label: string,
    source: LegalAction["source"],
    costs?: LegalAction["costs"],
    payload?: LegalAction["payload"],
  ) => LegalAction;
  appendResolvedEffectsToPayload: (
    legalAction: LegalAction | undefined,
    effects: RuntimeEffectCollector,
  ) => void;
  drawCards: (
    state: GameState,
    side: Side,
    amount: number,
  ) => CardEffectDrawCardsResult;
  damageRunner: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinition["id"],
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  unpreventableDamageRunner: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinition["id"],
    damageType: Extract<DamageType, "meat" | "net" | "core">,
    amount: number,
  ) => CardEffectDamageResult;
  startTrace: (
    state: GameState,
    legalAction: LegalAction,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinition["id"],
    baseTraceStrength: number,
    successEffects: readonly CardTraceSuccessEffectImplementation[],
  ) => Record<string, string | number | boolean>;
  startRun: (
    state: GameState,
    legalAction: LegalAction,
    serverId: Exclude<ServerId, "new_remote">,
    options: CardEffectMakeRunOptions,
  ) => CardEffectMakeRunResult;
};
