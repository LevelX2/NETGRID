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
  Side,
} from "./runtime-shared";

type HiddenZoneNonSearchDiceLoopRuntimeDeps = RuntimeDeps & {
  credits: (state: GameState, side: Side, amount: number) => void;
  definitionFor: (state: GameState, cardId: CardInstanceId) => CardDefinition;
  rollDeterministicDie: (state: GameState, purpose: string) => number;
  runnerEventLongtailKindForDefinition: (
    definition: CardDefinition,
  ) => CardRunnerEventLongtailImplementation["kind"] | undefined;
  selectedChoiceIds: (
    selectedChoices: PlayerAction["selectedChoices"],
  ) => string[];
};

export function createHiddenZoneNonSearchPlayfulAiRuntime(deps: RuntimeDeps) {
  const typedDeps = deps as HiddenZoneNonSearchDiceLoopRuntimeDeps;
  const {
    credits,
    definitionFor,
    rollDeterministicDie,
    runnerEventLongtailKindForDefinition,
    selectedChoiceIds,
  } = typedDeps;

  function resolvePlayfulAiDiceLoopEvent(
    state: GameState,
    legalAction: LegalAction,
    sourceDefinitionId: CardDefinitionId,
    implementation: CardRunnerEventLongtailImplementation,
  ): void {
    if (
      implementation.kind !== "random_dice_loop" ||
      implementation.dieFaces !== 6 ||
      implementation.visibility !== "public"
    )
      throw new Error("Playful-AI-Implementation ist ungueltig.");
    const dieRoll = rollDeterministicDie(
      state,
      `v1921.die.${sourceDefinitionId}.dice_loop.initial`,
    );
    const choiceOpened = implementation.choiceOn.includes(
      dieRoll as (typeof implementation.choiceOn)[number],
    );
    if (choiceOpened) {
      startV1921PlayfulAiChoice(
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
      playfulAiDieRolls: String(dieRoll),
      playfulAiRolledDice: 1,
      playfulAiDiceQueuedAfterRolls: 0,
      playfulAiRemainingDice: 0,
      playfulAiChoiceOpened: choiceOpened,
      playfulAiComplete: !choiceOpened,
      randomCounterAfter: state.randomCounter,
    };
  }

  function startV1921PlayfulAiChoice(
    state: GameState,
    sourceCardId: CardInstanceId,
    dieRoll: number,
    remainingDice: number,
    rollIndex: number,
  ): void {
    if (state.pendingChoice)
      throw new Error("Es ist bereits eine Choice offen.");
    if (!sourceCardId || !state.cardInstances[sourceCardId])
      throw new Error("Playful AI hat keine gültige Quelle.");
    if (!Number.isInteger(dieRoll) || dieRoll < 1 || dieRoll > 3)
      throw new Error(
        "Playful AI darf nur bei Wurf 1, 2 oder 3 eine Choice öffnen.",
      );
    if (!Number.isInteger(remainingDice) || remainingDice < 0)
      throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
    if (!Number.isInteger(rollIndex) || rollIndex < 1)
      throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
    const choiceStateVersion = state.stateVersion + 1;
    state.pendingChoice = {
      choiceId: `v1921_playful_ai_${choiceStateVersion}`,
      side: "runner",
      source: [
        "v1921.playful_ai",
        sourceCardId,
        String(dieRoll),
        String(remainingDice),
        String(rollIndex),
        String(choiceStateVersion),
      ].join(":"),
      prompt:
        `Playful AI: ${dieRoll} ${creditTextForPrompt(dieRoll)} nehmen ` +
        `und/oder ${dieRoll} ${diePromptText(dieRoll)} beiseitelegen.`,
      kind: "select_option",
      options: playfulAiSplitOptions(dieRoll),
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

  function playfulAiSplitOptions(dieRoll: number): ChoiceRequest["options"] {
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

  function parsePlayfulAiChoiceSource(source: string): {
    sourceCardId: CardInstanceId;
    dieRoll: number;
    remainingDice: number;
    rollIndex: number;
  } {
    const [, sourceCardId = "", dieRollRaw = "", fourth = "", fifth = ""] =
      source.split(":");
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
      return { sourceCardId, dieRoll, remainingDice, rollIndex };
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
    };
  }

  function parsePlayfulAiSplit(
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

  function continueV1921PlayfulAiLoop(
    state: GameState,
    sourceCardId: CardInstanceId,
    sourceDefinitionId: CardDefinitionId,
    queuedDice: number,
    rollIndex: number,
  ): {
    rolledDice: number[];
    remainingDice: number;
    rollIndex: number;
    choiceOpened: boolean;
    complete: boolean;
  } {
    if (!Number.isInteger(queuedDice) || queuedDice < 0)
      throw new Error("Die offenen Playful-AI-Würfel sind ungültig.");
    if (!Number.isInteger(rollIndex) || rollIndex < 1)
      throw new Error("Der Playful-AI-Wurfindex ist ungültig.");
    let remainingDice = queuedDice;
    let nextRollIndex = rollIndex;
    const rolledDice: number[] = [];
    while (remainingDice > 0) {
      remainingDice -= 1;
      const nextRoll = rollDeterministicDie(
        state,
        `v1921.die.${sourceDefinitionId}.dice_loop.followup.${state.stateVersion + 1}.${nextRollIndex}`,
      );
      nextRollIndex += 1;
      rolledDice.push(nextRoll);
      if (nextRoll <= 3) {
        startV1921PlayfulAiChoice(
          state,
          sourceCardId,
          nextRoll,
          remainingDice,
          nextRollIndex,
        );
        return {
          rolledDice,
          remainingDice,
          rollIndex: nextRollIndex,
          choiceOpened: true,
          complete: false,
        };
      }
    }
    return {
      rolledDice,
      remainingDice: 0,
      rollIndex: nextRollIndex,
      choiceOpened: false,
      complete: true,
    };
  }

  function resolveV1921PlayfulAiChoice(
    state: GameState,
    legalAction: LegalAction,
    playerAction: PlayerAction,
  ): void {
    const choice = state.pendingChoice;
    if (!choice || !choice.source.startsWith("v1921.playful_ai"))
      throw new Error("Es ist keine Playful-AI-Choice offen.");
    const choiceState = parsePlayfulAiChoiceSource(choice.source);
    const { sourceCardId, dieRoll, remainingDice, rollIndex } = choiceState;
    if (
      !sourceCardId ||
      !state.runner.heap.includes(sourceCardId) ||
      runnerEventLongtailKindForDefinition(
        definitionFor(state, sourceCardId),
      ) !== "random_dice_loop"
    )
      throw new Error(
        "Die Playful-AI-Choice gehoert nicht zur gespielten Karte.",
      );
    const sourceDefinitionId = definitionFor(state, sourceCardId).id;
    const selectedOptionId = selectedChoiceIds(playerAction.selectedChoices)[0];

    delete state.pendingChoice;
    let gainedCredits = 0;
    let setAsideDice = 0;
    let queuedDiceBeforeRolls = remainingDice;
    let progress: ReturnType<typeof continueV1921PlayfulAiLoop> = {
      rolledDice: [],
      remainingDice,
      rollIndex,
      choiceOpened: false,
      complete: true,
    };
    if (dieRoll <= 3) {
      const split = parsePlayfulAiSplit(choice, selectedOptionId, dieRoll);
      gainedCredits = split.gainedCredits;
      setAsideDice = split.setAsideDice;
      if (gainedCredits > 0) credits(state, "runner", gainedCredits);
      queuedDiceBeforeRolls = remainingDice + setAsideDice;
      progress = continueV1921PlayfulAiLoop(
        state,
        sourceCardId,
        sourceDefinitionId,
        queuedDiceBeforeRolls,
        rollIndex,
      );
    }

    const payload: NonNullable<LegalAction["payload"]> = {
      ...(legalAction.payload ?? {}),
      v1921RunnerEventAbility: "random_dice_loop",
      sourceDefinitionId,
      playfulAiDieRolls: progress.rolledDice.join(","),
      playfulAiGainedCredits: gainedCredits,
      playfulAiSetAsideDice: setAsideDice,
      playfulAiRolledDice: progress.rolledDice.length,
      playfulAiDiceQueuedBeforeRolls: queuedDiceBeforeRolls,
      playfulAiDiceQueuedAfterRolls: progress.remainingDice,
      playfulAiRemainingDice: progress.remainingDice,
      playfulAiChoiceOpened: progress.choiceOpened,
      playfulAiComplete: progress.complete,
      randomCounterAfter: state.randomCounter,
      runnerCreditsAfter: state.runner.credits,
    };
    const lastRoll = progress.rolledDice.at(-1);
    if (lastRoll !== undefined) payload.v1921DieRoll = lastRoll;
    legalAction.payload = payload;
  }

  return {
    continueV1921PlayfulAiLoop,
    creditTextForPrompt,
    diePromptText,
    parsePlayfulAiChoiceSource,
    parsePlayfulAiSplit,
    playfulAiSplitOptions,
    resolvePlayfulAiDiceLoopEvent,
    resolveV1921PlayfulAiChoice,
    startV1921PlayfulAiChoice,
  };
}
