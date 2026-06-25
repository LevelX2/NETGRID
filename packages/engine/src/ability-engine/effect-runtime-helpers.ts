import type {
  GameEndReason,
  GameState,
  ServerId,
  Side,
  Winner,
} from "@netgrid/shared";
import type { CardEffectExecutionContext } from "./effect-execution-types";

export function dataFortServerIds(
  state: GameState,
): Exclude<ServerId, "new_remote">[] {
  return state.corp.servers
    .map((server) => server.id)
    .sort((a, b) => dataFortOrder(a).localeCompare(dataFortOrder(b)));
}

function dataFortOrder(serverId: Exclude<ServerId, "new_remote">): string {
  if (serverId === "hq") return "0:hq";
  if (serverId === "rd") return "1:rd";
  if (serverId === "archives") return "2:archives";
  return `3:${serverId}`;
}

export function recipientSide(
  context: CardEffectExecutionContext,
  recipient: "controller" | "runner" | "corp",
): Side {
  return recipient === "controller" ? context.controller : recipient;
}

export function gainCredits(
  state: GameState,
  side: Side,
  amount: number,
): void {
  if (side === "corp") {
    const debt = state.actionEconomy?.corpCreditForfeitDebt;
    const forfeited = Math.min(
      amount,
      Math.max(0, Math.floor(debt?.remaining ?? 0)),
    );
    if (debt) {
      debt.remaining = Math.max(0, Math.floor(debt.remaining) - forfeited);
      if (debt.remaining <= 0 && state.actionEconomy)
        delete state.actionEconomy.corpCreditForfeitDebt;
    }
    state.corp.credits += amount - forfeited;
  } else state.runner.credits += amount;
}

export function creditsForSide(state: GameState, side: Side): number {
  return side === "corp" ? state.corp.credits : state.runner.credits;
}

export function loseCredits(
  state: GameState,
  side: Side,
  amount: number,
): void {
  if (amount <= 0) return;
  if (side === "corp")
    state.corp.credits = Math.max(0, state.corp.credits - amount);
  else state.runner.credits = Math.max(0, state.runner.credits - amount);
}

export function spendCreditsIfAvailable(
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

export function loseGame(
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

export function addRunnerTags(state: GameState, amount: number): void {
  if (amount <= 0) return;
  state.runner.tags += amount;
}

export function publicEffectId(
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

export function effectReason(context: CardEffectExecutionContext): string {
  return context.reason ?? "card_resolver";
}

export function assertPositiveIntegerAmount(
  kind: string,
  amount: number,
): void {
  if (!Number.isInteger(amount) || amount <= 0)
    throw new Error(`${kind} effect amount must be a positive integer.`);
}

export function assertPublicVisibility(kind: string, visibility: string): void {
  if (visibility !== "public")
    throw new Error(`${kind} effect visibility must be public.`);
}

export function assertHiddenInfoBarrierVisibility(
  kind: string,
  visibility: string,
): void {
  if (visibility !== "hidden_info_barrier")
    throw new Error(`${kind} effect visibility must be hidden_info_barrier.`);
}

export function mergePublicPayload(
  target: Record<string, string | number | boolean>,
  next: Record<string, string | number | boolean> | undefined,
): void {
  if (!next) return;
  for (const [key, value] of Object.entries(next)) {
    if (
      (key === "drawnCards" ||
        key === "drawnCount" ||
        key === "gainedCredits" ||
        key === "creditsLost" ||
        key === "gainedActions" ||
        key === "damageAmount" ||
        key === "cardsTrashed") &&
      typeof value === "number" &&
      typeof target[key] === "number"
    ) {
      target[key] = Number(target[key]) + value;
    } else {
      target[key] = value;
    }
  }
}
