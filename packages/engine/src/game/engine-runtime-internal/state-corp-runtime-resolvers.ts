import { type CardInstanceId, type GameState } from "@netgrid/shared";
import { mustInstance } from "../state/card-server-lookup";
import { cardCounter, spendCardCounter } from "../state/turn-flags-counters";
import type { RuntimeDeps } from "./runtime-shared";

export function createStateCorpRuntimeResolvers(
  deps: RuntimeDeps,
): import("./state-corp-runtime-port").StateCorpRuntimePort {
  function serverDifficultyIncreaseFromRunCounters(
    state: GameState,
    agendaId: CardInstanceId,
  ): number {
    const zone = mustInstance(state.cardInstances, agendaId).zone;
    if (zone.side !== "corp" || zone.zone !== "serverRoot" || !zone.serverId)
      return 0;
    return Math.max(
      0,
      Math.floor(
        Math.max(
          0,
          Math.floor(
            state.serverAgendaCostCountersByServer?.[zone.serverId] ?? 0,
          ),
        ) / 2,
      ),
    );
  }

  function swapCorpHqAndRdTop(state: GameState): void {
    const hqCardId = state.corp.hq[0];
    const rdCardId = state.corp.rd[0];
    if (!hqCardId || !rdCardId)
      throw new Error("HQ und R&D brauchen je eine Karte fuer Swap.");
    state.corp.hq[0] = rdCardId;
    state.corp.rd[0] = hqCardId;
    state.cardInstances[hqCardId] = {
      ...mustInstance(state.cardInstances, hqCardId),
      zone: { side: "corp", zone: "rd" },
    };
    state.cardInstances[rdCardId] = {
      ...mustInstance(state.cardInstances, rdCardId),
      zone: { side: "corp", zone: "hq" },
    };
  }

  function spendRecurringTraceCreditPool(
    state: GameState,
    amount: number,
  ): number {
    if (!Number.isInteger(amount) || amount < 0)
      throw new Error("Recurring-Trace-Credit-Ausgabe ist ungueltig.");
    let remaining = amount;
    let spent = 0;
    for (const cardId of deps.recurringTraceCreditPoolSourceIds(state)) {
      if (remaining <= 0) break;
      const current = cardCounter(state, cardId, "bit");
      const spend = Math.min(current, remaining);
      spendCardCounter(state, cardId, "bit", spend);
      remaining -= spend;
      spent += spend;
    }
    if (remaining > 0)
      throw new Error("Der Recurring-Trace-Credit-Pool reicht nicht aus.");
    return spent;
  }

  return {
    serverDifficultyIncreaseFromRunCounters,
    swapCorpHqAndRdTop,
    spendRecurringTraceCreditPool,
  };
}
