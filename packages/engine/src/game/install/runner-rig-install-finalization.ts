import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CounterType,
  GameState,
} from "@netgrid/shared";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  BUTCHER_BOY_ID,
  SKIVVISS_ID,
} from "../../compatibility/runtime-compatibility";

export type RunnerProgramInstallInstancePatch = Partial<
  Pick<
    CardInstance,
    "hostedOn" | "selectedCardId" | "selectedServerId" | "selectedSubtype"
  >
>;

export type RunnerProgramRigInstallInput = {
  state: GameState;
  cardId: CardInstanceId;
  definition: CardDefinition;
  usesMemory: boolean;
  mustInstance: (cardId: CardInstanceId) => CardInstance;
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
  shouldLoadLegacyRecurringCredits: (definition: CardDefinition) => boolean;
  instancePatch?: RunnerProgramInstallInstancePatch;
};

export function shouldAddGenericInstallVirusCounter(
  definition: CardDefinition,
): boolean {
  return (
    definition.mechanics.includes("virus") &&
    !cardImplementationForDefinitionId(definition.id)?.virusCounter &&
    definition.id !== BUTCHER_BOY_ID &&
    definition.id !== SKIVVISS_ID
  );
}

export function completeRunnerProgramRigInstall(
  input: RunnerProgramRigInstallInput,
): void {
  const {
    state,
    cardId,
    definition,
    usesMemory,
    mustInstance,
    setCardCounter,
    addCardCounter,
    shouldLoadLegacyRecurringCredits,
    instancePatch,
  } = input;

  state.runner.rig.programs.push(cardId);
  if (usesMemory) state.runner.memoryUsed += definition.memoryCost ?? 0;
  state.cardInstances[cardId] = {
    ...mustInstance(cardId),
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "rig" },
    ...(instancePatch ?? {}),
  };
  if (shouldLoadLegacyRecurringCredits(definition))
    setCardCounter(
      cardId,
      "recurring_credit",
      definition.recurringCredits ?? 0,
    );
  if (shouldAddGenericInstallVirusCounter(definition))
    addCardCounter(cardId, "virus", 1);
}
