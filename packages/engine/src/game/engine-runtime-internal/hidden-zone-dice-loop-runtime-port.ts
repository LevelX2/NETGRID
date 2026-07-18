/** Declarative typed port implemented by hidden-zone-nonsearch-dice-loop-runtime.ts. */
import type {
  CardDefinitionId,
  CardInstanceId,
  CardRunnerEventLongtailImplementation,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
} from "./runtime-shared";

export type HiddenZoneDiceLoopRuntimePort = {
  continueRandomDiceLoop: (
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    queuedDice: number,
    rollIndex: number,
  ) => {
    rolledDice: number[];
    remainingDice: number;
    rollIndex: number;
    choiceOpened: boolean;
    complete: boolean;
  };
  creditTextForPrompt: (amount: number) => string;
  diePromptText: (amount: number) => string;
  parseRandomDiceSplitChoiceSource: (source: string) => {
    sourceCardId: CardInstanceId;
    dieRoll: number;
    remainingDice: number;
    rollIndex: number;
  };
  parseRandomDiceSplit: (
    choice: ChoiceRequest,
    selectedOptionId: string | undefined,
    dieRoll: number,
  ) => {
    gainedCredits: number;
    setAsideDice: number;
  };
  randomDiceSplitOptions: (dieRoll: number) => ChoiceRequest["options"];
  resolveRandomDiceLoopEvent: (
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    implementation: CardRunnerEventLongtailImplementation,
  ) => void;
  resolveRandomDiceSplitChoice: (
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ) => void;
  startRandomDiceSplitChoice: (
    state: GameState,
    sourceCardId: CardInstanceId,
    dieRoll: number,
    remainingDice: number,
    rollIndex: number,
  ) => void;
};
