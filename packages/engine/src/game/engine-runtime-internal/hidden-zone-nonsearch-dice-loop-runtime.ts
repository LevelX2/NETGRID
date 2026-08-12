import type {
  CardDefinition,
  CardDefinitionId,
  CardInstanceId,
  CardRunnerEventLongtailImplementation,
  ChoiceRequest,
  GameState,
  LegalAction,
  PlayerAction,
  RuntimeDeps,
} from "./runtime-shared";
import { creditGainPublicPayload } from "../economy/credit-gain";

type HiddenZoneNonSearchDiceLoopRuntimeDeps = RuntimeDeps & {
  credits: typeof import("../state/economy-mutation").credits;
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  rollDeterministicDie: (state: GameState, purpose: string) => number;
  runnerEventLongtailForDefinition: (
    definition: CardDefinition,
  ) => CardRunnerEventLongtailImplementation | undefined;
  selectedChoiceIds: (
    selectedChoices: PlayerAction["selectedChoices"],
  ) => string[];
};

export function createHiddenZoneNonSearchDiceLoopRuntime(
  deps: RuntimeDeps,
): import("./hidden-zone-dice-loop-runtime-port").HiddenZoneDiceLoopRuntimePort {
  const typedDeps = deps as HiddenZoneNonSearchDiceLoopRuntimeDeps;

  type RandomDiceLoopImplementation = Extract<
    CardRunnerEventLongtailImplementation,
    { kind: "random_dice_loop" }
  >;

  function requireRandomDiceLoopImplementation(
    implementation: CardRunnerEventLongtailImplementation | undefined,
  ): RandomDiceLoopImplementation {
    if (
      implementation?.kind !== "random_dice_loop" ||
      implementation.dieFaces !== 6 ||
      implementation.visibility !== "public" ||
      implementation.choice.kind !==
        "split_roll_between_credits_and_set_aside_dice" ||
      implementation.choice.mode !== "any_nonnegative_integer_split" ||
      implementation.choice.creditRecipient !== "runner" ||
      implementation.setAsideDiceResolution.kind !== "roll_each" ||
      implementation.setAsideDiceResolution.recursive !== true
    )
      throw new Error("Playful-AI-Implementation ist ungueltig.");
    return implementation;
  }

  function randomDiceLoopImplementationForSource(
    state: GameState,
    sourceCardId: CardInstanceId,
  ): RandomDiceLoopImplementation {
    return requireRandomDiceLoopImplementation(
      typedDeps.runnerEventLongtailForDefinition(
        typedDeps.definitionFor(state, sourceCardId),
      ),
    );
  }

  function resolveRandomDiceLoopEvent(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    implementation: CardRunnerEventLongtailImplementation,
  ): void {
    const randomDiceLoop = requireRandomDiceLoopImplementation(implementation);
    const dieRoll = typedDeps.rollDeterministicDie(
      state,
      `v1921.die.${sourceDefinitionId}.dice_loop.initial`,
    );
    const choiceOpened = randomDiceLoop.choiceOn.includes(
      dieRoll as (typeof randomDiceLoop.choiceOn)[number],
    );
    if (choiceOpened) {
      startRandomDiceSplitChoice(
        state,
        String(legalAction.payload?.cardId ?? ""),
        dieRoll,
        0,
        1,
      );
    }
    legalAction.payload = {
      ...(legalAction.payload ?? {}),
      v1921RunnerEventAbility: "random_dice_loop",
      sourceDefinitionId,
      v1921DieRoll: dieRoll,
      randomDiceLoopRolls: String(dieRoll),
      randomDiceLoopRolledDice: 1,
      randomDiceLoopQueuedAfterRolls: 0,
      randomDiceLoopRemainingDice: 0,
      randomDiceSplitChoiceOpened: choiceOpened,
      randomDiceLoopComplete: !choiceOpened,
      randomCounterAfter: state.randomCounter,
    };
  }

  function startRandomDiceSplitChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    dieRoll: number,
    remainingDice: number,
    rollIndex: number,
    creditGainOrdinal = 0,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    if (!sourceCardId || !state.cardInstances[sourceCardId])
      throw new Error("Playful AI hat keine gültige Quelle.");
    const implementation = randomDiceLoopImplementationForSource(
      state,
      sourceCardId,
    );
    if (
      !Number.isInteger(dieRoll) ||
      !implementation.choiceOn.includes(
        dieRoll as (typeof implementation.choiceOn)[number],
      )
    )
      throw new Error(
        "Playful AI darf nur bei Wurf 1, 2 oder 3 eine Choice öffnen.",
      );
    if (!Number.isInteger(remainingDice) || remainingDice < 0)
      throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
    if (!Number.isInteger(rollIndex) || rollIndex < 1)
      throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
    const choiceStateVersion = state.stateVersion + 1;
    state.pendingChoice = {
      choiceId: `random_dice_split_${choiceStateVersion}`,
      side: "runner",
      source: [
        "card_implementation.random_dice_split",
        sourceCardId,
        String(dieRoll),
        String(remainingDice),
        String(rollIndex),
        String(creditGainOrdinal),
        String(choiceStateVersion),
      ].join(":"),
      prompt:
        `Playful AI: ${dieRoll} ${creditTextForPrompt(dieRoll)} nehmen ` +
        `und/oder ${dieRoll} ${diePromptText(dieRoll)} beiseitelegen.`,
      kind: "select_option",
      options: randomDiceSplitOptions(dieRoll),
      minSelections: 1,
      maxSelections: 1,
      stateVersion: choiceStateVersion,
      visibility: "public",
    };
  }

  function creditTextForPrompt(amount: number): string {
    return amount === 1 ? "Credit" : "Credits";
  }

  function diePromptText(amount: number): string {
    return amount === 1 ? "Würfel" : "Würfel";
  }

  function randomDiceSplitOptions(dieRoll: number): ChoiceRequest["options"] {
    return Array.from({ length: dieRoll + 1 }, (_, gainedCredits) => {
      const setAsideDice = dieRoll - gainedCredits;
      const creditText = creditTextForPrompt(gainedCredits);
      const diceText = diePromptText(setAsideDice);
      return {
        id: `gain_${gainedCredits}_set_aside_${setAsideDice}`,
        label: `${gainedCredits} ${creditText} nehmen, ${setAsideDice} ${diceText} beiseitelegen`,
        publicLabel: "Playful-AI-Aufteilung",
        value: gainedCredits,
      };
    });
  }

  function parseRandomDiceSplitChoiceSource(source: string): {
    sourceCardId: CardInstanceId;
    dieRoll: number;
    remainingDice: number;
    rollIndex: number;
    creditGainOrdinal: number;
  } {
    const parts = source.split(":");
    const [, sourceCardId = "", dieRollRaw = "", fourth = "", fifth = ""] =
      parts;
    const dieRoll = Number(dieRollRaw);
    if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 6)
      throw new Error("Playful-AI-Wurf ist ungültig.");
    const remainingDice = Number(fourth);
    const rollIndex = Number(fifth);
    if (
      Number.isInteger(remainingDice) &&
      remainingDice >= 0 &&
      Number.isInteger(rollIndex) &&
      rollIndex >= 1
    ) {
      const creditGainOrdinal =
        parts.length >= 7 ? Math.max(0, Math.floor(Number(parts[5]) || 0)) : 0;
      return {
        sourceCardId,
        dieRoll,
        remainingDice,
        rollIndex,
        creditGainOrdinal,
      };
    }
    const oldRolls = fourth
      .split(",")
      .filter(Boolean)
      .map((value) => Number(value));
    if (
      oldRolls.length === 0 ||
      oldRolls.some((roll) => !Number.isInteger(roll) || roll < 1 || roll > 6)
    )
      throw new Error("Playful-AI-Wurfserie ist ungültig.");
    return {
      sourceCardId,
      dieRoll,
      remainingDice: 0,
      rollIndex: oldRolls.length,
      creditGainOrdinal: 0,
    };
  }

  function parseRandomDiceSplit(
    choice: ChoiceRequest,
    selectedOptionId: string | undefined,
    dieRoll: number,
  ): { gainedCredits: number; setAsideDice: number } {
    const option = choice.options.find(
      (candidate) => candidate.id === selectedOptionId,
    );
    if (!option) throw new Error("Playful-AI-Auswahl ist ungültig.");
    if (option.id === "take_credits")
      return { gainedCredits: dieRoll, setAsideDice: 0 };
    if (option.id === "set_aside")
      return { gainedCredits: 0, setAsideDice: dieRoll };
    const match = /^gain_(\d+)_set_aside_(\d+)$/.exec(option.id);
    if (!match) throw new Error("Playful-AI-Auswahl ist ungültig.");
    const gainedCredits = Number(match[1]);
    const setAsideDice = Number(match[2]);
    if (
      !Number.isInteger(gainedCredits) ||
      !Number.isInteger(setAsideDice) ||
      gainedCredits < 0 ||
      setAsideDice < 0 ||
      gainedCredits + setAsideDice !== dieRoll
    )
      throw new Error("Playful-AI-Aufteilung ist ungültig.");
    return { gainedCredits, setAsideDice };
  }

  function continueRandomDiceLoop(
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    queuedDice: number,
    rollIndex: number,
    creditGainOrdinal = 0,
  ): {
    rolledDice: number[];
    remainingDice: number;
    rollIndex: number;
    choiceOpened: boolean;
    complete: boolean;
    creditGainOrdinal: number;
  } {
    if (!Number.isInteger(queuedDice) || queuedDice < 0)
      throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
    if (!Number.isInteger(rollIndex) || rollIndex < 1)
      throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
    const implementation = randomDiceLoopImplementationForSource(
      state,
      sourceCardId,
    );
    let remainingDice = queuedDice;
    let nextRollIndex = rollIndex;
    const rolledDice: number[] = [];
    while (remainingDice > 0) {
      remainingDice -= 1;
      const nextRoll = typedDeps.rollDeterministicDie(
        state,
        `v1921.die.${sourceDefinitionId}.dice_loop.followup.${state.stateVersion + 1}.${nextRollIndex}`,
      );
      nextRollIndex += 1;
      rolledDice.push(nextRoll);
      if (
        implementation.choiceOn.includes(
          nextRoll as (typeof implementation.choiceOn)[number],
        )
      ) {
        startRandomDiceSplitChoice(
          state,
          sourceCardId,
          nextRoll,
          remainingDice,
          nextRollIndex,
          creditGainOrdinal,
        );
        return {
          rolledDice,
          remainingDice,
          rollIndex: nextRollIndex,
          choiceOpened: true,
          complete: false,
          creditGainOrdinal,
        };
      }
    }
    return {
      rolledDice,
      remainingDice: 0,
      rollIndex: nextRollIndex,
      choiceOpened: false,
      complete: true,
      creditGainOrdinal,
    };
  }

  function resolveRandomDiceSplitChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (
      !choice ||
      !choice.source.startsWith("card_implementation.random_dice_split")
    )
      throw new Error("Es ist keine Playful-AI-Choice offen.");
    const choiceState = parseRandomDiceSplitChoiceSource(choice.source);
    const {
      sourceCardId,
      dieRoll,
      remainingDice,
      rollIndex,
      creditGainOrdinal,
    } = choiceState;
    if (
      !sourceCardId ||
      !state.runner.heap.includes(sourceCardId) ||
      typedDeps.runnerEventLongtailForDefinition(
        typedDeps.definitionFor(state, sourceCardId),
      )?.kind !== "random_dice_loop"
    )
      throw new Error(
        "Die Playful-AI-Choice gehoert nicht zur gespielten Karte.",
      );
    const implementation = randomDiceLoopImplementationForSource(
      state,
      sourceCardId,
    );
    const sourceDefinitionId = typedDeps.definitionFor(state, sourceCardId).id;
    const selectedOptionId = typedDeps.selectedChoiceIds(
      playerAction.selectedChoices,
    )[0];

    delete state.pendingChoice;
    let gainedCredits = 0;
    let setAsideDice = 0;
    let queuedDiceBeforeRolls = remainingDice;
    let progress: ReturnType<typeof continueRandomDiceLoop> = {
      rolledDice: [],
      remainingDice,
      rollIndex,
      choiceOpened: false,
      complete: true,
      creditGainOrdinal,
    };
    let gainPayload: Record<string, string | number | boolean> = {};
    let nextCreditGainOrdinal = creditGainOrdinal;
    if (dieRoll <= 3) {
      const split = parseRandomDiceSplit(choice, selectedOptionId, dieRoll);
      gainedCredits = split.gainedCredits;
      setAsideDice = split.setAsideDice;
      if (gainedCredits > 0) {
        nextCreditGainOrdinal += 1;
        const gain = typedDeps.credits(
          state,
          implementation.choice.creditRecipient,
          gainedCredits,
          {
            kind: "card_effect",
            sourceDefinitionId,
            sourceCardId,
            gainOrdinal: nextCreditGainOrdinal,
            reason: "random_dice_loop_split",
          },
        );
        gainPayload = creditGainPublicPayload(gain);
      }
      queuedDiceBeforeRolls = remainingDice + setAsideDice;
      progress = continueRandomDiceLoop(
        state,
        sourceCardId,
        sourceDefinitionId,
        queuedDiceBeforeRolls,
        rollIndex,
        nextCreditGainOrdinal,
      );
    }

    const payload: NonNullable<LegalAction["payload"]> = {
      ...(legalAction.payload ?? {}),
      ...gainPayload,
      v1921RunnerEventAbility: "random_dice_loop",
      sourceDefinitionId,
      randomDiceLoopRolls: progress.rolledDice.join(","),
      randomDiceSplitGainedCredits: gainedCredits,
      randomDiceSplitSetAsideDice: setAsideDice,
      randomDiceLoopRolledDice: progress.rolledDice.length,
      randomDiceLoopQueuedBeforeRolls: queuedDiceBeforeRolls,
      randomDiceLoopQueuedAfterRolls: progress.remainingDice,
      randomDiceLoopRemainingDice: progress.remainingDice,
      randomDiceSplitChoiceOpened: progress.choiceOpened,
      randomDiceLoopComplete: progress.complete,
      randomCounterAfter: state.randomCounter,
      runnerCreditsAfter: state.runner.credits,
    };
    const lastRoll = progress.rolledDice.at(-1);
    if (lastRoll !== undefined) payload.v1921DieRoll = lastRoll;
    legalAction.payload = payload;
  }

  return {
    continueRandomDiceLoop,
    creditTextForPrompt,
    diePromptText,
    parseRandomDiceSplitChoiceSource,
    parseRandomDiceSplit,
    randomDiceSplitOptions,
    resolveRandomDiceLoopEvent,
    resolveRandomDiceSplitChoice,
    startRandomDiceSplitChoice,
  };
}
