import type { CardInstanceId, GameState } from "@netgrid/shared";

export type TemporaryBreakerStrengthModifier = NonNullable<
  GameState["temporaryBreakerStrengthModifiersUntilEndOfTurn"]
>[number];

function currentTurnSerial(state: GameState): number {
  return Math.max(0, Math.floor(state.turnSerial ?? 0));
}

export function currentTemporaryBreakerStrengthModifiers(
  state: GameState,
): TemporaryBreakerStrengthModifier[] {
  const turnSerial = currentTurnSerial(state);
  return (state.temporaryBreakerStrengthModifiersUntilEndOfTurn ?? []).filter(
    (modifier) => modifier.turnSerial === turnSerial,
  );
}

export function temporaryBreakerStrengthBonusUntilEndOfTurn(
  state: GameState,
  breakerId: CardInstanceId,
): number {
  return currentTemporaryBreakerStrengthModifiers(state)
    .filter((modifier) => modifier.targetBreakerId === breakerId)
    .reduce((sum, modifier) => sum + modifier.amount, 0);
}

export function addTemporaryBreakerStrengthModifierUntilEndOfTurn(
  state: GameState,
  input: {
    sourceCardInstanceId: CardInstanceId;
    targetBreakerId: CardInstanceId;
    amount: number;
  },
): number {
  if (!Number.isInteger(input.amount) || input.amount <= 0)
    throw new Error(
      "Turn-Icebreaker-Stärkebonus muss eine positive Ganzzahl sein.",
    );
  const source = state.cardInstances[input.sourceCardInstanceId];
  if (!source) throw new Error("Turn-Icebreaker-Stärkequelle fehlt.");
  if (!state.cardInstances[input.targetBreakerId])
    throw new Error("Turn-Icebreaker-Stärkeziel fehlt.");

  const turnSerial = currentTurnSerial(state);
  const modifiers = [
    ...(state.temporaryBreakerStrengthModifiersUntilEndOfTurn ?? []),
  ];
  const existingIndex = modifiers.findIndex(
    (modifier) =>
      modifier.sourceCardInstanceId === input.sourceCardInstanceId &&
      modifier.targetBreakerId === input.targetBreakerId &&
      modifier.turnSerial === turnSerial,
  );
  const nextModifier: TemporaryBreakerStrengthModifier = {
    sourceCardInstanceId: input.sourceCardInstanceId,
    sourceDefinitionId: source.definitionId,
    targetBreakerId: input.targetBreakerId,
    amount:
      (existingIndex >= 0 ? modifiers[existingIndex]!.amount : 0) +
      input.amount,
    turnSerial,
    expires: "turn_end",
  };
  if (existingIndex >= 0) modifiers[existingIndex] = nextModifier;
  else modifiers.push(nextModifier);
  state.temporaryBreakerStrengthModifiersUntilEndOfTurn = modifiers;
  return temporaryBreakerStrengthBonusUntilEndOfTurn(
    state,
    input.targetBreakerId,
  );
}
