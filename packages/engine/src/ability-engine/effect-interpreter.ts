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
  sourceTitle?: string;
  controller: Side;
  drawCards?: (
    side: Side,
    amount: number,
  ) => CardEffectDrawCardsResult;
};

export type CardEffectExecutionResult = {
  publicPayload: Record<string, string | number | boolean>;
  resolvedEffects: ResolvedGameEffect[];
};

export type CardEffectDrawCardsResult = {
  drawnCount: number;
  publicPayload?: Record<string, string | number | boolean>;
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

function creditsForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.credits : state.runner.credits;
}

function loseCredits(state: GameState, side: Side, amount: number): void {
  if (amount <= 0) return;
  if (side === "corp")
    state.corp.credits = Math.max(0, state.corp.credits - amount);
  else state.runner.credits = Math.max(0, state.runner.credits - amount);
}

function publicEffectId(
  context: CardEffectExecutionContext,
  index: number,
  kind: string,
): string {
  const source = context.sourceDefinitionId ?? "card_implementation";
  return `${source}.effect.${index}.${kind}`;
}

function assertPositiveIntegerAmount(kind: string, amount: number): void {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error(`${kind} effect amount must be a positive integer.`);
}

function assertPublicVisibility(kind: string, visibility: string): void {
  if (visibility !== "public")
    throw new Error(`${kind} effect visibility must be public.`);
}

function mergePublicPayload(
  target: Record<string, string | number | boolean>,
  next: Record<string, string | number | boolean> | undefined,
): void {
  if (!next) return;
  for (const [key, value] of Object.entries(next)) {
    if (
      (
        key === "drawnCards" ||
        key === "drawnCount" ||
        key === "gainedCredits" ||
        key === "creditsLost"
      ) &&
      typeof value === "number" &&
      typeof target[key] === "number"
    ) {
      target[key] = Number(target[key]) + value;
    } else {
      target[key] = value;
    }
  }
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
        assertPositiveIntegerAmount("gain_credits", effect.amount);
        const side = recipientSide(context, effect.recipient);
        gainCredits(state, side, effect.amount);
        publicPayload.gainedCredits =
          Number(publicPayload.gainedCredits ?? 0) + effect.amount;
        publicPayload[
          side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
        ] = side === "corp" ? state.corp.credits : state.runner.credits;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "gain_credits"),
          kind: "gain_credits",
          visibility: effect.visibility,
          side,
          amount: effect.amount,
          reason: "card_resolver",
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "draw_cards": {
        assertPositiveIntegerAmount("draw_cards", effect.amount);
        assertPublicVisibility("draw_cards", effect.visibility);
        if (!context.drawCards)
          throw new Error(
            "draw_cards effect requires a drawCards execution context.",
          );
        const side = recipientSide(context, effect.recipient);
        const drawResult = context.drawCards(side, effect.amount);
        mergePublicPayload(publicPayload, drawResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "draw_cards"),
          kind: "draw_cards",
          visibility: effect.visibility,
          side,
          amount: drawResult.drawnCount,
          reason: "card_resolver",
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "lose_credits": {
        assertPublicVisibility("lose_credits", effect.visibility);
        const mode = effect.mode ?? "amount";
        if (mode !== "amount" && mode !== "all")
          throw new Error("lose_credits effect mode must be amount or all.");
        if (mode === "amount") {
          if (effect.amount === undefined)
            throw new Error("lose_credits amount mode requires an amount.");
          assertPositiveIntegerAmount("lose_credits", effect.amount);
        }
        const side = recipientSide(context, effect.recipient);
        const amountToLose =
          mode === "all"
            ? creditsForSide(state, side)
            : Math.min(creditsForSide(state, side), effect.amount ?? 0);
        loseCredits(state, side, amountToLose);
        publicPayload.creditsLost =
          Number(publicPayload.creditsLost ?? 0) + amountToLose;
        publicPayload[
          side === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"
        ] = creditsForSide(state, side);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "lose_credits"),
          kind: "lose_credits",
          visibility: effect.visibility,
          side,
          amount: amountToLose,
          reason: "card_resolver",
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
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
