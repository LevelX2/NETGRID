import type { CardInstanceId, GameState } from "@netgrid/shared";
import { hashGameState, validateGameState } from "@netgrid/engine";

export type PostSetupDeckOrder = {
  runnerGrip: CardInstanceId[];
  runnerStack: CardInstanceId[];
  corpHq: CardInstanceId[];
  corpRd: CardInstanceId[];
};

/** Declared scenario arrangement after the current Engine has completed setup. */
export function applyPostSetupDeckOrder(
  state: GameState,
  order: PostSetupDeckOrder,
): void {
  const populations: ReadonlyArray<readonly [CardInstanceId[], CardInstanceId[]]> = [
    [[...state.runner.grip, ...state.runner.stack], [...order.runnerGrip, ...order.runnerStack]],
    [[...state.corp.hq, ...state.corp.rd], [...order.corpHq, ...order.corpRd]],
  ];
  for (const [before, after] of populations) {
    if (JSON.stringify(before.sort()) !== JSON.stringify(after.sort()))
      throw new Error("Die Szenarioanordnung verändert den Kartenbestand.");
  }
  state.runner.grip = [...order.runnerGrip];
  state.runner.stack = [...order.runnerStack];
  state.corp.hq = [...order.corpHq];
  state.corp.rd = [...order.corpRd];
  for (const [zone, ids] of [
    [{ side: "runner", zone: "grip" }, state.runner.grip],
    [{ side: "runner", zone: "stack" }, state.runner.stack],
    [{ side: "corp", zone: "hq" }, state.corp.hq],
    [{ side: "corp", zone: "rd" }, state.corp.rd],
  ] as const) {
    for (const id of ids) state.cardInstances[id]!.zone = { ...zone };
  }
  const valid = validateGameState(state);
  if (!valid.ok) throw new Error(valid.errors.join("\n"));
  const event = state.eventLog.at(-1);
  if (!event) throw new Error("Die Szenarioanordnung benötigt den abgeschlossenen Setup-Übergang.");
  event.stateHashAfter = hashGameState(state);
}
