import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import {
  CURRENT_RULES_BASELINE,
  type CardInstanceId,
  type DeckPublicMetadata,
  type PublicGameEvent,
  type Side,
} from "@netgrid/shared";
import {
  buildSidePayload,
  SIDE_PAYLOAD_EVENT_TAIL_LIMIT,
} from "./multiplayer-payload";
import type { EventRecord, StoredMatch } from "./multiplayer";

describe("multiplayer side payload projection", () => {
  it("limits normal playerView publicEvents to the side event tail", () => {
    const record = storedMatchWithEvents(SIDE_PAYLOAD_EVENT_TAIL_LIMIT + 7);
    const payload = buildSidePayload(record, "runner", {
      isAiSide: () => false,
      safeDisplayNameFor: () => "Gegenüber",
      aiTurnPresentationFor: () => undefined,
      resultSummaryFor: () => undefined,
      retentionProtectionPayload: { retentionProtected: false },
    });

    expect(payload.eventTail).toHaveLength(SIDE_PAYLOAD_EVENT_TAIL_LIMIT);
    expect(payload.playerView.publicEvents).toHaveLength(
      SIDE_PAYLOAD_EVENT_TAIL_LIMIT,
    );
    expect(payload.playerView.publicEvents).toEqual(payload.eventTail);
    expect(payload.eventTail[0]?.eventId).toBe("evt_7");
    expect(payload.eventTail.at(-1)?.eventId).toBe("evt_86");
    expect(
      payload.eventTail[0]?.publicPayload.chronicleTurnNumber,
    ).toBeGreaterThan(1);
    expect(payload.eventTail[0]?.publicPayload.chronicleTurnSide).toBe("corp");
  });

  it("projects only the explicitly supplied own deck guide reference", () => {
    const record = storedMatchWithEvents(0);
    const payload = buildSidePayload(record, "runner", {
      isAiSide: () => false,
      safeDisplayNameFor: () => "Gegenüber",
      aiTurnPresentationFor: () => undefined,
      resultSummaryFor: () => undefined,
      retentionProtectionPayload: { retentionProtected: false },
      ownDeckGuideRef: { standardDeckId: "standard_runner_fixture" },
    });

    expect(payload.playerView.ownDeckGuideRef).toEqual({
      standardDeckId: "standard_runner_fixture",
    });
    expect(JSON.stringify(payload.playerView)).not.toContain(
      "standard_corp_opponent_fixture",
    );
    expect(JSON.stringify(payload.playerView)).not.toContain("contentByLocale");
  });

  it("keeps a Data Fort optional-rez quote actor-private in side payloads", () => {
    const record = storedMatchWithEvents(0);
    const state = record.gameState;
    const corpCardIds = Object.entries(state.cardInstances)
      .filter(([, card]) => card.owner === "corp")
      .map(([cardId]) => cardId as CardInstanceId);
    const sourceAgendaId = corpCardIds[0] as CardInstanceId;
    const iceId = corpCardIds[1] as CardInstanceId;
    if (!sourceAgendaId || !iceId)
      throw new Error("Missing Corp cards for payload fixture");
    removeCorpCardFromZones(state, sourceAgendaId);
    removeCorpCardFromZones(state, iceId);
    state.stateVersion = 12;
    state.corp.credits = 5;
    state.corp.scoreArea = [sourceAgendaId];
    state.cardInstances[sourceAgendaId] = {
      ...state.cardInstances[sourceAgendaId]!,
      definitionId: "onr_v1_197_data-fort-reclamation",
      owner: "corp",
      controller: "corp",
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "scoreArea" },
    };
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [iceId],
      root: [],
    });
    state.cardInstances[iceId] = {
      ...state.cardInstances[iceId]!,
      definitionId: "simple_barrier_ice",
      owner: "corp",
      controller: "corp",
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
    };
    state.hqInstallRezSequence = {
      sourceAgendaId,
      sourceDefinitionId: "onr_v1_197_data-fort-reclamation",
      serverId: "remote_1",
      selectedCardIds: [iceId],
      nextCardIndex: 1,
      temporaryCreditsProvided: 10,
      temporaryCreditsRemaining: 10,
      optionalRezContinuationProjection: {
        cardId: iceId,
        sequencePosition: 1,
        stateVersion: 12,
        complete: true,
        executable: true,
      },
    };
    state.pendingChoice = {
      choiceId: "choice_data_fort_optional_rez_12",
      side: "corp",
      source:
        "card_implementation_primitive.score_install_hq_cards_into_new_remote_then_rez.rez:opaque",
      prompt: "Installierte Karte rezzen?",
      kind: "select_cards",
      options: [
        {
          id: `card_${iceId}`,
          label: "Simple Barrier ICE",
          value: iceId,
        },
      ],
      minSelections: 0,
      maxSelections: 1,
      stateVersion: 12,
      visibility: "hidden_info_barrier",
    };

    const deps = {
      isAiSide: () => false,
      safeDisplayNameFor: () => "Gegenüber",
      aiTurnPresentationFor: () => undefined,
      resultSummaryFor: () => undefined,
      retentionProtectionPayload: { retentionProtected: false },
    };
    const corpPayload = buildSidePayload(record, "corp", deps);
    const runnerPayload = buildSidePayload(record, "runner", deps);
    expect(
      corpPayload.pendingChoice?.options[0]?.hqInstallRezOptionQuote,
    ).toMatchObject({
      choiceId: "choice_data_fort_optional_rez_12",
      cardId: iceId,
      cardDefinitionId: "simple_barrier_ice",
      targetServerId: "remote_1",
      installedZone: "serverIce",
      stateVersion: 12,
      complete: true,
      temporaryCreditsApplied: 3,
      regularCreditsRequired: 0,
      affordable: true,
      mandatoryContinuationComplete: true,
      rezAndMandatoryContinuationExecutable: true,
    });
    expect(runnerPayload.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerPayload)).not.toContain(
      "corp-optional-rez-choice-quote-v2",
    );
    expect(JSON.stringify(runnerPayload)).not.toContain(iceId);
  });

  it("reconnects an open multi-card SPG choice only to the Corp", () => {
    const record = storedMatchWithEvents(0);
    let state = createGameAfterSetup({
      seed: "payload-spg-reconnect",
      agendaPointsToWin: 99,
    });
    state = applyFixtureAction(
      state,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    const spgId = "payload-spg" as CardInstanceId;
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [spgId],
    });
    state.cardInstances[spgId] = {
      instanceId: spgId,
      definitionId: "onr_classic_025_strategic-planning-group",
      owner: "corp",
      controller: "corp",
      zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      faceup: true,
      rezzed: true,
      advancementCounters: 0,
      strengthModifier: 0,
    };
    state.corp.clicks = 3;
    state = applyFixtureAction(
      state,
      "corp",
      (action) => action.type === "draw_card",
    );
    record.gameState = state;
    const deps = {
      isAiSide: () => false,
      safeDisplayNameFor: () => "Gegenüber",
      aiTurnPresentationFor: () => undefined,
      resultSummaryFor: () => undefined,
      retentionProtectionPayload: { retentionProtected: false },
    };

    const corpPayload = buildSidePayload(record, "corp", deps);
    const runnerPayload = buildSidePayload(record, "runner", deps);
    expect(corpPayload.pendingChoice?.options).toHaveLength(2);
    expect(
      corpPayload.pendingChoice?.options.every(
        (option) => option.card?.known === true,
      ),
    ).toBe(true);
    expect(runnerPayload.pendingChoice).toBeUndefined();
    expect(
      runnerPayload.playerView.specialZones?.setAside.every(
        (card) => card.known === false,
      ),
    ).toBe(true);
    for (const option of corpPayload.pendingChoice?.options ?? []) {
      if (option.card?.definitionId)
        expect(JSON.stringify(runnerPayload)).not.toContain(
          option.card.definitionId,
        );
    }
  });
});

function applyFixtureAction(
  state: StoredMatch["gameState"],
  side: Side,
  predicate: (action: ReturnType<typeof getLegalActions>[number]) => boolean,
): StoredMatch["gameState"] {
  const action = getLegalActions(state, side).find(predicate);
  if (!action) throw new Error(`Missing ${side} fixture action`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `payload:${side}:${state.stateVersion}:${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function removeCorpCardFromZones(
  state: StoredMatch["gameState"],
  cardId: CardInstanceId,
): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
}

function storedMatchWithEvents(count: number): StoredMatch {
  const now = "2026-05-22T00:00:00.000Z";
  const runnerMetadata = deckMetadata("runner");
  const corpMetadata = deckMetadata("corp");
  return {
    match: {
      matchId: "payload_tail_match",
      status: "active",
      mode: "human_vs_human",
      matchVersion: 1,
      isPublic: true,
      baseline: CURRENT_RULES_BASELINE,
      settings: { agendaPointsToWin: 7, matchFormat: "single_game" },
      deckSetup: {
        runnerSnapshotId: "runner_snapshot",
        corpSnapshotId: "corp_snapshot",
        runner: runnerMetadata,
        corp: corpMetadata,
      },
      createdAt: now,
      updatedAt: now,
    },
    sessions: [session("runner", true, now), session("corp", true, now)],
    tokens: [],
    gameState: createGame({ seed: "payload-tail" }),
    eventLog: Array.from({ length: count }, (_, index) => eventRecord(index)),
    actionReceipts: [],
    undoSnapshots: [],
    stateSnapshots: [],
  };
}

function deckMetadata(side: Side): DeckPublicMetadata {
  return {
    side,
    identityCardId:
      side === "runner" ? "runner_identity_001" : "corp_identity_001",
    deckName: `${side} deck`,
    cardPoolSnapshotId: "test",
    formatProfileId: "test",
    deckHash: `${side}_hash`,
  };
}

function session(
  side: Side,
  connected: boolean,
  now: string,
): StoredMatch["sessions"][number] {
  return {
    sessionId: `${side}_session`,
    matchId: "payload_tail_match",
    side,
    displayName: side,
    sessionTokenHash: `${side}_session_hash`,
    reconnectTokenHash: `${side}_reconnect_hash`,
    connected,
    createdAt: now,
    lastSeenAt: now,
  };
}

function eventRecord(index: number): EventRecord {
  const publicEvent: PublicGameEvent = {
    eventId: `evt_${index}`,
    type: "action",
    stateVersionBefore: index,
    stateVersionAfter: index + 1,
    stateHashAfter: `hash_${index}`,
    publicPayload: {
      actor: index % 2 === 0 ? "runner" : "corp",
      actionType: index % 2 === 0 ? "gain_credit" : "end_turn",
    },
  };
  return {
    eventId: publicEvent.eventId,
    matchId: "payload_tail_match",
    stateVersionBefore: publicEvent.stateVersionBefore,
    stateVersionAfter: publicEvent.stateVersionAfter,
    stateHashAfter: publicEvent.stateHashAfter,
    publicPayload: publicEvent,
    privatePayloadLocalOnly: false,
    hiddenInfoBarrier: false,
  };
}
