import {
  createGameAfterSetup,
  getLegalActions,
  validateGameState,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type CardInstanceId,
  type VisibleCard,
  type ZoneRef,
} from "@netgrid/shared";
import type { AiDecisionInputWithDeckCapabilities } from "../runtime/ai-decision-input";

/** Explicit current-rule board companion for old actor-view captures. Only the
 * named free-rez operation is rematerialized, through the real Engine. The
 * recorded input/runtime remain available for separate historical rejection
 * checks. Hidden Runner cards are not reconstructed; this fixture models the
 * known public rig and the Corp's known board, rather than claiming a native
 * replay of the old match. */
export function corpFreeRezBoardCompanion(
  input: AiDecisionInputWithDeckCapabilities,
  operationDefinitionId: string,
) {
  const sources = new Set(
    input.playerView.own.gripOrHq
      .filter((card) => card.definitionId === operationDefinitionId)
      .map((card) => card.instanceId),
  );
  const operations = input.legalActions.filter(
    (action) =>
      action.type === "play_operation" &&
      sources.has(action.source as CardInstanceId),
  );
  if (operations.length === 0)
    throw new Error("Free-rez fixture requires an offered operation.");
  const { playerView: view, ownDeckSnapshot: deck } = input;
  if (
    input.side !== "corp" ||
    !deck ||
    !view.own.identity.definitionId ||
    !input.matchId ||
    view.turnSerial === undefined ||
    view.traceRulesProfile === undefined
  )
    throw new Error(
      "Free-rez fixture requires the Corp's own deck and complete current rules context.",
    );
  const state = createGameAfterSetup({
    matchId: input.matchId,
    seed: "current-free-rez-board-companion",
    agendaPointsToWin: view.agendaPointsToWin,
    traceRulesProfile: view.traceRulesProfile,
    corpDeck: {
      id: deck.deckSnapshotId,
      name: "Current free-rez board fixture",
      side: "corp",
      identity: view.own.identity.definitionId,
      cards: deck.cards.map((card) => ({
        id: card.cardId,
        quantity: card.quantity,
      })),
    },
    runnerDeck: DEMO_DECKS.demo_runner_001,
  });
  state.stateVersion = view.stateVersion;
  state.turnSerial = view.turnSerial;
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = view.timingPoint;
  state.corp.credits = view.own.credits;
  state.corp.clicks = view.own.clicks;
  state.runner.credits = view.opponent.credits;

  function place(card: VisibleCard, zone: ZoneRef): CardInstanceId {
    if (!card.known || !card.definitionId || !card.owner || !card.controller)
      throw new Error(`Incomplete known board card: ${card.instanceId}`);
    const counters = { ...card.counters };
    for (const display of card.counterDisplays ?? [])
      if (display.counterType) counters[display.counterType] = display.amount;
    state.cardInstances[card.instanceId] = {
      instanceId: card.instanceId,
      definitionId: card.definitionId,
      owner: card.owner,
      controller: card.controller,
      zone,
      faceup: zone.zone !== "hq",
      rezzed: card.rezzed === true,
      advancementCounters: card.advancementCounters ?? 0,
      strengthModifier: card.strengthModifier ?? 0,
      counters,
      ...(card.selectedServerId
        ? { selectedServerId: card.selectedServerId }
        : {}),
      ...(card.selectedSubtype
        ? { selectedSubtype: card.selectedSubtype }
        : {}),
    };
    return card.instanceId;
  }
  state.corp.identity = place(view.own.identity, { side: "corp", zone: "hq" });
  state.corp.hq = view.own.gripOrHq.map((card) =>
    place(card, { side: "corp", zone: "hq" }),
  );
  state.corp.archives = view.own.heapOrArchives.map((card) =>
    place(card, { side: "corp", zone: "archives" }),
  );
  state.corp.scoreArea = view.own.scoreArea.map((card) =>
    place(card, { side: "corp", zone: "scoreArea" }),
  );
  const archives = new Set(state.corp.archives);
  state.corp.servers = view.servers.map((server) => ({
    id: server.id,
    kind:
      server.id === "hq" || server.id === "rd" || server.id === "archives"
        ? server.id
        : "remote",
    label: server.id,
    ice: server.ice.map((card) =>
      place(card, { side: "corp", zone: "serverIce", serverId: server.id }),
    ),
    // The view also presents the Archives pile in this server's access root.
    root: server.root
      .filter((card) => !archives.has(card.instanceId))
      .map((card) =>
        place(card, { side: "corp", zone: "serverRoot", serverId: server.id }),
      ),
  }));
  const placed = new Set([
    state.corp.identity,
    ...state.corp.hq,
    ...state.corp.archives,
    ...state.corp.scoreArea,
    ...state.corp.servers.flatMap((server) => [...server.ice, ...server.root]),
  ]);
  state.corp.rd = Object.values(state.cardInstances)
    .filter((card) => card.owner === "corp" && !placed.has(card.instanceId))
    .map((card) => {
      card.zone = { side: "corp", zone: "rd" };
      card.faceup = false;
      card.rezzed = false;
      return card.instanceId;
    });
  for (const card of view.opponent.rig ?? []) {
    if (!card.known) continue;
    if (
      card.controller !== "runner" ||
      !["program", "hardware", "resource"].includes(card.type!)
    )
      throw new Error(
        "Unexpected public Runner installation in free-rez fixture.",
      );
    const id = place(card, { side: "runner", zone: "rig" });
    const zone =
      card.type === "program"
        ? "programs"
        : card.type === "hardware"
          ? "hardware"
          : "resources";
    state.runner.rig[zone].push(id);
    for (const hiddenZone of ["grip", "stack", "heap", "scoreArea"] as const)
      state.runner[hiddenZone] = state.runner[hiddenZone].filter(
        (existing) => existing !== id,
      );
  }
  const validation = validateGameState(state);
  if (!validation.ok) throw new Error(JSON.stringify(validation.errors));
  const current = getLegalActions(state, "corp");
  const replacements = new Map(
    operations.map((action) => {
      const matching = current.filter(
        (candidate) =>
          candidate.type === action.type &&
          candidate.source === action.source &&
          candidate.payload?.targetCardId === action.payload?.targetCardId &&
          candidate.payload?.xValue === action.payload?.xValue &&
          JSON.stringify(candidate.costs) === JSON.stringify(action.costs),
      );
      if (
        matching.length !== 1 ||
        !matching[0]!.payload?.operationFreeRezRunQuoteJson
      )
        throw new Error(
          `No exact Engine free-rez action for ${action.actionId}`,
        );
      return [action.actionId, matching[0]!] as const;
    }),
  );
  return {
    state,
    input: {
      ...input,
      legalActions: input.legalActions.map((action) =>
        replacements.has(action.actionId)
          ? replacements.get(action.actionId)!
          : action,
      ),
    },
  };
}
