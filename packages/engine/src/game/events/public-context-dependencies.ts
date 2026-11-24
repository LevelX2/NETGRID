import type {
  CardDefinition,
  CardInstanceId,
  CounterType,
  GameState,
  LegalAction,
  ServerId,
} from "@netgrid/shared";

export type PublicContextForActionDependencies = {
  agendaPointsForScoredCard: (
    state: GameState,
    cardId: CardInstanceId,
  ) => number;
  cardCounter: (
    state: GameState,
    cardId: CardInstanceId,
    counterType: CounterType,
  ) => number;
  cardStrengthModifier: (state: GameState, cardId: CardInstanceId) => number;
  creditCostForAction: (legalAction: LegalAction) => number;
  definitionFor: (state: GameState, id: CardInstanceId) => CardDefinition;
  pumpAmountForLegalAction: (
    state: GameState,
    legalAction: LegalAction,
  ) => number;
  runnerHqAccessBonus: (state: GameState) => number;
  v1915InstalledAccessBonus: (
    state: GameState,
    serverId: Exclude<ServerId, "new_remote">,
  ) => number;
};
