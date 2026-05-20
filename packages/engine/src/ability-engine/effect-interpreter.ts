/**
 * Interprets declarative CardImplementation effects against the current state.
 *
 * Simple public effects such as credits, tags, and actions mutate state here.
 * Effects that require existing engine primitives, such as draw, damage,
 * hosted-credit mutation, or source trashing, are supplied through the execution
 * context so this module does not import index.ts or duplicate host rules.
 */
import type {
  CardDefinitionId,
  CardInstanceId,
  DamageType,
  GameEndReason,
  GameState,
  ResolvedGameEffect,
  Side,
  Winner,
} from "@netgrid/shared";
import type { CardEffectImplementation } from "./definition-types";
import { traceSuccessEffectForCardImplementation } from "./trace-implementations";

export type CardEffectExecutionContext = {
  sourceCardId: CardInstanceId;
  sourceDefinitionId?: CardDefinitionId;
  sourceTitle?: string;
  controller: Side;
  reason?: string;
  drawCards?: (
    side: Side,
    amount: number,
  ) => CardEffectDrawCardsResult;
  damageRunner?: (
    damageType: Extract<DamageType, "meat">,
    amount: number,
  ) => CardEffectDamageResult;
  addHostedCredits?: (
    sourceCardId: CardInstanceId,
    amount: number,
  ) => CardEffectHostedCreditsResult;
  takeHostedCredits?: (
    sourceCardId: CardInstanceId,
    recipient: Side,
    amount: number | "all",
  ) => CardEffectHostedCreditsResult;
  trashSourceWhenEmpty?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectTrashSourceResult;
  trashSource?: (
    sourceCardId: CardInstanceId,
  ) => CardEffectTrashSourceResult;
  startTrace?: (
    sourceCardId: CardInstanceId,
    baseTraceStrength: number,
    successEffect: ReturnType<typeof traceSuccessEffectForCardImplementation>,
  ) => CardEffectTraceResult;
};

export type CardEffectExecutionResult = {
  publicPayload: Record<string, string | number | boolean>;
  resolvedEffects: ResolvedGameEffect[];
};

export type CardEffectDrawCardsResult = {
  drawnCount: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectDamageResult = {
  resolved: boolean;
  damageType: DamageType;
  amount: number;
  cardsTrashed: number;
  flatline: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectHostedCreditsResult = {
  amount: number;
  hostedCreditsAfter: number;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectTrashSourceResult = {
  sourceTrashed: boolean;
  publicPayload?: Record<string, string | number | boolean>;
};

export type CardEffectTraceResult = {
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

function spendCreditsIfAvailable(
  state: GameState,
  side: Side,
  amount: number,
): boolean {
  if (creditsForSide(state, side) < amount) return false;
  if (side === "corp") state.corp.credits -= amount;
  else state.runner.credits -= amount;
  return true;
}

function loserToWinner(side: Side): Winner {
  return side === "runner" ? "corp" : "runner";
}

function loseGame(
  state: GameState,
  side: Side,
  reason: GameEndReason = "unknown",
): Winner {
  const winner = loserToWinner(side);
  state.winner = winner;
  state.gameEndReason = reason;
  state.phase = "game_over";
  state.timingPoint = "game.checkpoint";
  state.activeSide = winner === "draw" ? state.activeSide : winner;
  delete state.pendingChoice;
  delete state.run;
  return winner;
}

function addRunnerTags(state: GameState, amount: number): void {
  if (amount <= 0) return;
  state.runner.tags += amount;
}

function publicEffectId(
  context: CardEffectExecutionContext,
  index: number,
  kind: string,
): string {
  const source = context.sourceDefinitionId ?? "card_implementation";
  const instancePart =
    context.reason && context.reason !== "card_resolver"
      ? `.${context.sourceCardId}`
      : "";
  return `${source}${instancePart}.effect.${index}.${kind}`;
}

function effectReason(context: CardEffectExecutionContext): string {
  return context.reason ?? "card_resolver";
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
        key === "creditsLost" ||
        key === "gainedActions" ||
        key === "damageAmount" ||
        key === "cardsTrashed"
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

/**
 * Executes ordered CardImplementation effects and returns public payload plus
 * redacted ResolvedEffects for event/chronicle consumers.
 *
 * This function is a mutating interpreter. It validates the small declarative
 * vocabulary, preserves effect order, and relies on injected host callbacks for
 * mechanics with their own revalidation or hidden-info contracts.
 */
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
          reason: effectReason(context),
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
          reason: effectReason(context),
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
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "pay_credits_or_lose_game": {
        assertPositiveIntegerAmount(
          "pay_credits_or_lose_game",
          effect.amount,
        );
        assertPublicVisibility("pay_credits_or_lose_game", effect.visibility);
        if (effect.reason !== "source_left_play")
          throw new Error(
            "pay_credits_or_lose_game reason must be source_left_play.",
          );
        const payer = recipientSide(context, effect.payer);
        const loseSide = recipientSide(context, effect.loseSide);
        const paid = spendCreditsIfAvailable(state, payer, effect.amount);
        const winner = paid ? undefined : loseGame(state, loseSide);
        publicPayload.creditsPaid =
          Number(publicPayload.creditsPaid ?? 0) + (paid ? effect.amount : 0);
        publicPayload.payCreditsOrLoseGameAmount = effect.amount;
        publicPayload.payCreditsOrLoseGamePaid = paid;
        publicPayload[payer === "corp" ? "corpCreditsAfter" : "runnerCreditsAfter"] =
          creditsForSide(state, payer);
        if (!paid) {
          publicPayload.gameLost = true;
          publicPayload.winner = winner ?? "";
        }
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "pay_credits_or_lose_game"),
          kind: "pay_credits_or_lose_game",
          visibility: effect.visibility,
          side: payer,
          amount: effect.amount,
          paidCredits: paid ? effect.amount : 0,
          gameLost: !paid,
          ...(winner ? { winner } : {}),
          reason: effect.reason,
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "add_tags": {
        assertPositiveIntegerAmount("add_tags", effect.amount);
        assertPublicVisibility("add_tags", effect.visibility);
        if ((effect as { recipient?: string }).recipient !== "runner")
          throw new Error("add_tags effect recipient must be runner.");
        addRunnerTags(state, effect.amount);
        publicPayload.tagsAdded =
          Number(publicPayload.tagsAdded ?? 0) + effect.amount;
        publicPayload.runnerTagsAfter = state.runner.tags;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "add_tags"),
          kind: "add_tags",
          visibility: effect.visibility,
          side: "runner",
          amount: effect.amount,
          reason: effectReason(context),
          runnerTagsAfter: state.runner.tags,
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "damage": {
        assertPositiveIntegerAmount("damage", effect.amount);
        assertPublicVisibility("damage", effect.visibility);
        if ((effect as { recipient?: string }).recipient !== "runner")
          throw new Error("damage effect recipient must be runner.");
        if ((effect as { damageType?: string }).damageType !== "meat")
          throw new Error("damage effect damageType must be meat.");
        if ((effect as { preventable?: boolean }).preventable !== true)
          throw new Error("damage effect must be preventable.");
        if (!context.damageRunner)
          throw new Error(
            "damage effect requires a damageRunner execution context.",
          );
        const damageResult = context.damageRunner(
          effect.damageType,
          effect.amount,
        );
        mergePublicPayload(publicPayload, damageResult.publicPayload);
        if (!damageResult.resolved) return;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "damage"),
          kind: "damage",
          visibility: effect.visibility,
          side: "runner",
          amount: damageResult.amount,
          damageType: damageResult.damageType,
          cardsTrashed: damageResult.cardsTrashed,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "trace": {
        assertPositiveIntegerAmount("trace", effect.baseTraceStrength);
        assertPublicVisibility("trace", effect.visibility);
        if (effect.onFailure && effect.onFailure.length > 0)
          throw new Error("Trace onFailure effects are not supported yet.");
        if (!context.startTrace)
          throw new Error("trace effect requires a startTrace execution context.");
        const traceResult = context.startTrace(
          context.sourceCardId,
          effect.baseTraceStrength,
          traceSuccessEffectForCardImplementation(effect.onSuccess),
        );
        mergePublicPayload(publicPayload, traceResult.publicPayload);
        return;
      }
      case "add_hosted_credits": {
        assertPositiveIntegerAmount("add_hosted_credits", effect.amount);
        assertPublicVisibility("add_hosted_credits", effect.visibility);
        if ((effect as { target?: string }).target !== "source")
          throw new Error("add_hosted_credits effect target must be source.");
        if (!context.addHostedCredits)
          throw new Error(
            "add_hosted_credits effect requires an addHostedCredits execution context.",
          );
        const addResult = context.addHostedCredits(
          context.sourceCardId,
          effect.amount,
        );
        mergePublicPayload(publicPayload, addResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "add_hosted_credits"),
          kind: "add_hosted_credits",
          visibility: effect.visibility,
          side: context.controller,
          amount: addResult.amount,
          counterType: "bit",
          addedCounterAmount: addResult.amount,
          remainingCounters: addResult.hostedCreditsAfter,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "take_hosted_credits": {
        assertPublicVisibility("take_hosted_credits", effect.visibility);
        if ((effect as { source?: string }).source !== "source")
          throw new Error("take_hosted_credits effect source must be source.");
        if ((effect as { recipient?: string }).recipient !== "controller")
          throw new Error(
            "take_hosted_credits effect recipient must be controller.",
          );
        const mode = effect.mode ?? "up_to_amount_if_available";
        if (mode !== "up_to_amount_if_available" && mode !== "all")
          throw new Error(
            "take_hosted_credits effect mode must be up_to_amount_if_available or all.",
          );
        if (mode === "up_to_amount_if_available") {
          if (effect.amount === undefined)
            throw new Error(
              "take_hosted_credits amount mode requires an amount.",
            );
          assertPositiveIntegerAmount("take_hosted_credits", effect.amount);
        }
        if (!context.takeHostedCredits)
          throw new Error(
            "take_hosted_credits effect requires a takeHostedCredits execution context.",
          );
        const side = recipientSide(context, effect.recipient);
        const takeResult = context.takeHostedCredits(
          context.sourceCardId,
          side,
          mode === "all" ? "all" : effect.amount!,
        );
        mergePublicPayload(publicPayload, takeResult.publicPayload);
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "take_hosted_credits"),
          kind: "take_hosted_credits",
          visibility: effect.visibility,
          side,
          amount: takeResult.amount,
          counterType: "bit",
          removedCounterAmount: takeResult.amount,
          remainingCounters: takeResult.hostedCreditsAfter,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "trash_source_when_empty": {
        assertPublicVisibility("trash_source_when_empty", effect.visibility);
        if ((effect as { source?: string }).source !== "source")
          throw new Error(
            "trash_source_when_empty effect source must be source.",
          );
        if (!context.trashSourceWhenEmpty)
          throw new Error(
            "trash_source_when_empty effect requires a trashSourceWhenEmpty execution context.",
          );
        const trashResult = context.trashSourceWhenEmpty(context.sourceCardId);
        mergePublicPayload(publicPayload, trashResult.publicPayload);
        if (!trashResult.sourceTrashed) return;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "trash_source_when_empty"),
          kind: "trash_source_when_empty",
          visibility: effect.visibility,
          side: context.controller,
          amount: 1,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "gain_actions": {
        assertPositiveIntegerAmount("gain_actions", effect.amount);
        assertPublicVisibility("gain_actions", effect.visibility);
        const side = recipientSide(context, effect.recipient);
        if (side === "corp") state.corp.clicks += effect.amount;
        else state.runner.clicks += effect.amount;
        publicPayload.gainedActions =
          Number(publicPayload.gainedActions ?? 0) + effect.amount;
        publicPayload[
          side === "corp" ? "corpClicksAfter" : "runnerClicksAfter"
        ] = side === "corp" ? state.corp.clicks : state.runner.clicks;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "gain_actions"),
          kind: "gain_actions",
          visibility: effect.visibility,
          side,
          amount: effect.amount,
          reason: effectReason(context),
          ...(context.sourceDefinitionId
            ? { sourceDefinitionId: context.sourceDefinitionId }
            : {}),
          ...(context.sourceTitle ? { sourceTitle: context.sourceTitle } : {}),
        });
        return;
      }
      case "trash_source": {
        assertPublicVisibility("trash_source", effect.visibility);
        if (!context.trashSource)
          throw new Error(
            "trash_source effect requires a trashSource execution context.",
          );
        const trashResult = context.trashSource(context.sourceCardId);
        mergePublicPayload(publicPayload, trashResult.publicPayload);
        if (!trashResult.sourceTrashed) return;
        resolvedEffects.push({
          effectId: publicEffectId(context, index, "trash_source"),
          kind: "trash_source",
          visibility: effect.visibility,
          side: context.controller,
          amount: 1,
          reason: effectReason(context),
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
