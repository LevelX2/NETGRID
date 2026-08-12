/** Declarative typed port for the turnRuntimeResolvers composition group. */
import type {
  CardDefinitionId,
  CardInstanceId,
  CorpDrawContinuation,
  CounterType,
  GameState,
  LegalAction,
  PlayerAction,
  ResolvedGameEffect,
  ServerId,
  Side,
} from "@netgrid/shared";
import type {
  AutomaticEffectCollector,
  RestrictedActionFamily,
} from "./runtime-shared";
import type {
  acceptExtraActionOffer,
  addFutureExtraActionGrant,
  addRunnerFutureActionDebt,
  applyRunnerForgoNextAction,
  compactActionEconomy,
  consumeRestrictedExtraActionForAction,
  consumeRunnerFutureActionDebt,
  currentTurnSerial,
  declineExtraActionOffer,
  ensureActionEconomy,
  expireTurnBoundExtraActionGrants,
  filterActionsForRestrictedExtraActions,
  resolveForcedActionNotPossible,
} from "./turn-action-economy-runtime";

export type TurnRuntimePort = {
  resolveEndTurnTagIfRunnerReceivedTag: (
    state: GameState,
    legalAction: LegalAction,
  ) => boolean;
  resumeEndTurnAfterTagPrevention: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resolveFieldReporterEndOfRunnerTurn: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resolveDelayedEndTurnDamageEffects: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  endTurn: (state: GameState, side: Side, legalAction: LegalAction) => void;
  resolveTemporaryProgramInstallReturns: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resolveCorpObligationEndOfTurn: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  startDiscardPhase: (
    state: GameState,
    side: Side,
    legalAction?: LegalAction,
  ) => void;
  processDiscardStep: (
    state: GameState,
    side: Side,
    legalAction?: LegalAction,
  ) => void;
  completeDiscardPhase: (
    state: GameState,
    side: Side,
    legalAction?: LegalAction,
  ) => void;
  appendResolvedEffectsToPayload: (
    legalAction: LegalAction | undefined,
    effects: AutomaticEffectCollector,
  ) => void;
  automaticGainCreditsEffect: (
    effectId: string,
    side: Side,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ) => ResolvedGameEffect;
  automaticLoseCreditsEffect: (
    effectId: string,
    side: Side,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ) => ResolvedGameEffect;
  automaticDrawCardsEffect: (
    effectId: string,
    side: Side,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ) => ResolvedGameEffect;
  automaticTagEffect: (
    effectId: string,
    amount: number,
    sourceDefinitionId: CardDefinitionId,
  ) => ResolvedGameEffect;
  automaticTrashCardEffect: (
    effectId: string,
    side: Side,
    cardDefinitionId: CardDefinitionId,
    sourceDefinitionId: CardDefinitionId,
  ) => ResolvedGameEffect;
  automaticCounterChangeEffect: (
    effectId: string,
    side: Side,
    sourceDefinitionId: CardDefinitionId,
    counterType: CounterType,
    remainingCounters: number,
    addedCounterAmount: number,
  ) => ResolvedGameEffect;
  automaticStealAgendaEffect: (
    effectId: string,
    cardDefinitionId: CardDefinitionId,
    sourceDefinitionId: CardDefinitionId,
    amount: number,
  ) => ResolvedGameEffect;
  publicCardTitle: (definitionId: CardDefinitionId) => string;
  applyRunnerForgoNextAction: typeof applyRunnerForgoNextAction;
  addRunnerFutureActionDebt: typeof addRunnerFutureActionDebt;
  consumeRunnerFutureActionDebt: typeof consumeRunnerFutureActionDebt;
  ensureActionEconomy: typeof ensureActionEconomy;
  compactActionEconomy: typeof compactActionEconomy;
  currentTurnSerial: typeof currentTurnSerial;
  expireTurnBoundExtraActionGrants: typeof expireTurnBoundExtraActionGrants;
  filterActionsForRestrictedExtraActions: typeof filterActionsForRestrictedExtraActions;
  consumeRestrictedExtraActionForAction: typeof consumeRestrictedExtraActionForAction;
  addFutureExtraActionGrant: typeof addFutureExtraActionGrant;
  acceptExtraActionOffer: typeof acceptExtraActionOffer;
  declineExtraActionOffer: typeof declineExtraActionOffer;
  resolvePdcaCounterAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resolveCorpMandatoryDraw: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
  resumeCorpMandatoryDrawAfterChoice: (
    state: GameState,
    legalAction: LegalAction,
    continuation: Extract<
      CorpDrawContinuation,
      { kind: "corp_mandatory_draw" }
    >,
  ) => void;
  resolveForcedActionNotPossible: typeof resolveForcedActionNotPossible;
  startCorpTurn: (
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
  ) => void;
  startRunnerTurn: (
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
  ) => void;
  returnCorpTemporaryInstallRezCredits: (
    state: GameState,
    effects?: AutomaticEffectCollector,
  ) => void;
  applyInstalledIceCounterLifecycle: (state: GameState) => void;
  untapRunnerCardsAtTurnStart: (state: GameState) => void;
  resolveDelayedAccessEffects: (
    state: GameState,
    effects?: AutomaticEffectCollector,
  ) => void;
  applyCorpStartOfTurnEffects: (
    state: GameState,
    effects?: AutomaticEffectCollector,
    legalAction?: LegalAction,
    rootCardStartIndex?: number,
    skipPreamble?: boolean,
  ) => boolean;
  applyPurgeableRunnerVirusCorpStartEffects: (
    state: GameState,
    effects?: AutomaticEffectCollector,
  ) => void;
  openCorpStartTurnRestrictedActionOffers: (
    state: GameState,
    effects?: AutomaticEffectCollector,
  ) => void;
  virusCounterDrawsAtCorpStart: (state: GameState) => number;
  skivvissCounterTotal: (state: GameState) => number;
  virusCounterCascadeTrashAtCorpStart: (state: GameState) => {
    amount: number;
    sourceDefinitionId?: CardDefinitionId;
  };
  trashTopRdCardsFaceupForCascade: (
    state: GameState,
    maxCount: number,
  ) => CardInstanceId[];
  applyRunnerStartOfTurnEffects: (
    state: GameState,
    effects?: AutomaticEffectCollector,
    resumePoint?: "begin" | "after_delayed_install_choice",
    legalAction?: LegalAction,
    counterEffectStartIndex?: number,
  ) => void;
  applyStartTurnRandomEffectTables: (
    state: GameState,
    effects?: AutomaticEffectCollector,
    onlySourceCardId?: CardInstanceId,
  ) => void;
  applyRunnerStartTurnActionEconomyEffects: (
    state: GameState,
    effects?: AutomaticEffectCollector,
    onlySourceCardId?: CardInstanceId,
  ) => void;
  resolveRunnerStartOfTurnOrderChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  resumeRunnerStartOfTurnOrdering: (
    state: GameState,
    effects?: AutomaticEffectCollector,
  ) => void;
  runnerForcedActionGrantForRoll: (
    state: GameState,
    sourceId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    dieRoll: number,
  ) =>
    | {
        restriction: RestrictedActionFamily;
        targetServerId?: Exclude<ServerId, "new_remote">;
        targetCardInstanceId?: CardInstanceId;
        revealToCorpOnly?: boolean;
      }
    | undefined;
  randomRunnerGripCardId: (
    state: GameState,
    purpose: string,
  ) => CardInstanceId | undefined;
  virusCounterCreditsAtRunnerStart: (state: GameState) => {
    amount: number;
    sourceDefinitionId?: CardDefinitionId;
  };
  startVirusCounterRunnerPrivateLookAtStart: (state: GameState) => boolean;
  randomCorpHqCardsWithoutReplacement: (
    state: GameState,
    count: number,
    purpose: string,
  ) => CardInstanceId[];
  startRunnerPrivateLookAtSpecificCorpCards: (
    state: GameState,
    sourceDefinitionId: CardDefinitionId,
    zone: Extract<ServerId, "rd" | "hq">,
    cardIds: CardInstanceId[],
    prompt: string,
  ) => boolean;
  queueIncubatorStartOfTurnTransforms: (state: GameState) => boolean;
  startIncubatorTransformChoice: (state: GameState) => boolean;
  resumeStartOfTurnAfterTagPrevention: (
    state: GameState,
    legalAction: LegalAction,
  ) => void;
};
