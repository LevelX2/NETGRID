import type {
  CardDefinitionId,
  CardInstanceId,
  GameState,
  ResolvedGameEffect,
  Side,
} from "@netgrid/shared";
import type { CardEffectImplementation } from "./definition-types";

export type CardEffectExecutionContext = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  controller: Side;
};

export type CardEffectExecutionResult = {
  publicPayload: Record<string, string | number | boolean>;
  resolvedEffects: ResolvedGameEffect[];
};

function recipientSide(
  context: CardEffectExecutionContext,
  recipient: "controller" | "runner" | "corp",
): Side {
  return recipient === "controller" ? context.controller : recipient;
}

function gainCredits(state: GameState, side: Side, amount: number): void {
  if (side === "corp") state.corp.credits += amount;
  else state.runner.credits += amount;
}

export function executeCardImplementationEffects(
  state: GameState,
  context: CardEffectExecutionContext,
  effects: readonly CardEffectImplementation[],
): CardEffectExecutionResult {
  const publicPayload: Record<string, string | number | boolean> = {};
  const resolvedEffects: ResolvedGameEffect[] = [];

  effects.forEach((effect, index) => {
    switch (effect.kind) {
      case "gain_credits": {
        if (!Number.isInteger(effect.amount) || effect.amount <= 0)
          throw new Error("gain_credits effect amount must be a positive integer.");
        const side = recipientSide(context, effect.recipient);
        gainCredits(state, side, effect.amount);
        publicPayload.gainedCredits =
          Number(publicPayload.gainedCredits ?? 0) + effect.amount;
        publicPayload[
          side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
        ] = side === "corp" ? state.corp.credits : state.runner.credits;
        resolvedEffects.push({
          effectId: `${context.sourceCardId}.effect.${index}.gain_credits`,
          kind: "gain_credits",
          visibility: effect.visibility,
          side,
          amount: effect.amount,
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
        });
        return;
      }
      default: {
        const unknownEffect = effect as { kind?: string };
        throw new Error(
          `Unsupported card implementation effect: ${
            unknownEffect.kind ?? "unknown"
          }`,
        );
      }
    }
  });

  return { publicPayload, resolvedEffects };
}
