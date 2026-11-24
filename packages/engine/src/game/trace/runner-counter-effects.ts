import type { CardDefinitionId } from "@netgrid/shared";
import type { RunnerTraceCounterEffectImplementation } from "../../ability-engine/definition-types";
import { CARD_IMPLEMENTATIONS } from "../../card-implementations/registry";

export type RunnerTraceCounterEffect = Readonly<
  RunnerTraceCounterEffectImplementation & {
    sourceDefinitionId: CardDefinitionId;
  }
>;

const effects: readonly RunnerTraceCounterEffect[] = Object.freeze(
  CARD_IMPLEMENTATIONS.flatMap((implementation) =>
    (implementation.runnerCounterEffects ?? []).map((effect) =>
      Object.freeze({
        ...effect,
        sourceDefinitionId: implementation.cardDefinitionId,
      }),
    ),
  ),
);

export function runnerTraceCounterEffectDefinitions(): readonly RunnerTraceCounterEffect[] {
  return effects;
}

export function traceCounterEffectDefinitionFor(
  counterType: unknown,
): RunnerTraceCounterEffect | undefined {
  return effects.find((effect) => effect.counterType === counterType);
}
