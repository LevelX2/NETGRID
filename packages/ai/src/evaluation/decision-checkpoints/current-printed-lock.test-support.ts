import { createGame, getPlayerView } from "@netgrid/engine";
import { ORIGINALSET_DEFAULT_DECKS } from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";

// A current-rule companion for historical checkpoints captured before SP-786.
// Resources, legal invocations and hidden cards stay historical. The printed
// effect comes from the current Engine producer, not a hand-written quote.
// This is deliberately test-only and does not repair persisted checkpoints.
const sourceId = "onr_v1_268_shock-r";
function currentPrintedEffect() {
  const state = createGame({
    seed: "current-printed-next-encounter-lock",
    setupMode: "completed",
    runnerDeck: ORIGINALSET_DEFAULT_DECKS.runner,
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) => c.id !== sourceId,
        ),
        { id: sourceId, quantity: 1 },
      ],
    },
  });
  const source = Object.values(state.cardInstances).find(
    (c) => c.definitionId === sourceId,
  );
  if (!source) throw new Error("Current lock source must exist");
  for (const zone of [state.corp.hq, state.corp.rd, state.corp.archives]) {
    const index = zone.indexOf(source.instanceId);
    if (index >= 0) zone.splice(index, 1);
  }
  state.corp.servers.find((s) => s.id === "rd")!.ice.push(source.instanceId);
  source.zone = { side: "corp", zone: "serverIce", serverId: "rd" };
  source.rezzed = true;
  const effect = getPlayerView(state, "runner")
    .servers.find((s) => s.id === "rd")!
    .ice[0]!.effectiveRunQuote?.subroutines.find(
      (s) => s.type === "set_next_encounter_lock",
    )?.unbrokenRunEffect;
  if (!effect) throw new Error("Current Engine lock projection must exist");
  return effect;
}
const printedEffect = currentPrintedEffect();

export function withCurrentPrintedLockCompanion(
  historical: AiDecisionInputWithDeckCapabilities,
): AiDecisionInputWithDeckCapabilities {
  const companion = structuredClone(historical);
  const cards = companion.playerView.servers.flatMap((server) => server.ice);
  if (companion.playerView.run?.encounteredIce)
    cards.push(companion.playerView.run.encounteredIce);
  for (const ice of cards) {
    for (const subroutine of ice.effectiveRunQuote?.subroutines ?? []) {
      if (subroutine.type !== "set_next_encounter_lock") continue;
      if (ice.definitionId !== sourceId)
        throw new Error("Printed lock companion needs its exact source");
      subroutine.unbrokenRunEffect = structuredClone(printedEffect);
    }
  }
  return companion;
}
