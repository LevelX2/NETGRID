import { describe, expect, it } from "vitest";
import { WebSocket } from "ws";
import snapshotsData from "../../../data/decks/deck-snapshots-0.6.json";
import { applyAction, createGame, getLegalActions, hashState } from "@netrunner/engine";
import { createNetrunnerHttpServer } from "./http-server";
import { InMemoryMatchStorage, MultiplayerService, type EventRecord, type JoinMatchResult, type MatchSettings, type SidePayload, type StateSnapshot } from "./multiplayer";
import type { DeckSnapshot } from "@netrunner/decks";
import type { CardInstanceId, ChoiceRequest, DeckDefinition, GameEvent, GameState, LegalAction, PublicGameEvent, Side } from "@netrunner/shared";

describe("MVP 0.2 multiplayer service", () => {
  it("starts V0.6 matches from validated immutable deck snapshots without exposing opponent decklists", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "deck-v06-service" });
    const created = await service.createMatch({
      hostSide: "runner",
      seed: "deck-v06-match",
      runnerDeckSnapshotId: "demo_runner_004_snapshot_v0_6",
      corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6"
    });
    const stored = await service.loadForTest(created.matchId);

    expect(created.baseline.engineSchemaVersion).toBe("0.4.0");
    expect(created.playerView.deckMetadata?.own.deckHash).toBe("fnv1a:b6bc479a");
    expect(created.playerView.deckMetadata?.opponent.deckHash).toBe("fnv1a:d77d0873");
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_004_snapshot_v0_6");
    expect(stored?.match.settings.agendaPointsToWin).toBe(7);
    expect(stored?.match.settings.matchFormat).toBe("rules_match");
    expect(JSON.stringify(stored?.match.deckSetup)).not.toContain("cards");
    expect(JSON.stringify(created)).not.toContain("simple_priority_agenda");
    expect(JSON.stringify(created)).not.toContain("cardInstances");

    const invalidSnapshot = structuredClone(snapshotsData.snapshots.find((snapshot) => snapshot.deckSnapshotId === "demo_runner_004_snapshot_v0_6")) as DeckSnapshot | undefined;
    if (!invalidSnapshot) throw new Error("Missing runner snapshot");
    invalidSnapshot.cards.push({ cardId: "catalog_preview_resource_001", quantity: 1 });
    await expect(
      service.createMatch({
        hostSide: "runner",
        seed: "deck-v06-invalid",
        runnerDeckSnapshot: invalidSnapshot,
        corpDeckSnapshotId: "demo_corp_004_snapshot_v0_6"
      })
    ).rejects.toThrow("deck_snapshot_invalid");
  });

  it("creates private matches with hashed tokens and side-filtered bootstrap payloads", async () => {
    const { service, created, runner, matchId, joinToken } = await joinedMatch();
    const stored = await service.loadForTest(matchId);

    expect(stored?.match.status).toBe("active");
    expect(stored?.match.baseline.multiplayerSchemaVersion).toBe("0.8.0");
    expect(stored?.match.deckSetup.runnerSnapshotId).toBe("demo_runner_008_snapshot_v0_8");
    expect(stored?.match.deckSetup.corpSnapshotId).toBe("demo_corp_008_snapshot_v0_8");
    expect(stored?.tokens.every((token) => token.tokenHash.startsWith("sha256:"))).toBe(true);
    expect(created.hostSessionToken.length).toBeGreaterThanOrEqual(32);
    expect(created.hostReconnectToken.length).toBeGreaterThanOrEqual(32);
    expect(joinToken.length).toBeGreaterThanOrEqual(32);
    const serializedStorage = JSON.stringify(stored);
    expect(serializedStorage).not.toContain(created.hostSessionToken);
    expect(serializedStorage).not.toContain(created.hostReconnectToken);
    expect(serializedStorage).not.toContain(joinToken);

    const bootstrap = await service.bootstrap(matchId, runner.side, runner.sessionToken);
    expect("error" in bootstrap).toBe(false);
    const payload = bootstrap as SidePayload;
    expect(payload.side).toBe("runner");
    expect(JSON.stringify(payload)).not.toContain("Simple Agenda");
    expect(JSON.stringify(created.playerView)).not.toContain("Simple Economy Event");

    const runnerHosted = await service.createMatch({ hostSide: "runner", seed: "runner-host" });
    expect(runnerHosted.hostSide).toBe("runner");
    const randomHosted = await service.createMatch({ hostSide: "random", seed: "random-host" });
    expect(["runner", "corp"]).toContain(randomHosted.hostSide);
    const invalidJoin = await service.joinMatch(runnerHosted.matchId, { token: "definitely-wrong" });
    expect("error" in invalidJoin).toBe(true);
    if (!("error" in invalidJoin)) throw new Error("Expected invalid token rejection");
    expect(invalidJoin.error.message).not.toContain("runner");
    expect(invalidJoin.error.message).not.toContain("corp");
  });

  it("runs actions only through the server pipeline with idempotency and stale-state rejection", async () => {
    const { service, corp, matchId } = await joinedMatch();
    const before = await bootstrap(service, matchId, corp);
    const mandatory = mustAction(before, (action) => action.type === "mandatory_draw");

    const first = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-1"
    });
    expect(first.ok).toBe(true);
    if (!first.ok) throw new Error(first.error.message);

    const duplicate = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-1"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(first.receipt.stateVersionAfter);

    const stale = await service.submitAction({
      matchId,
      side: "corp",
      sessionToken: corp.sessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-mandatory-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale rejection");
    expect(stale.error.code).toBe("stale_state");
    expect(stale.error.playerView?.side).toBe("corp");

    const stored = await service.loadForTest(matchId);
    expect(stored?.actionReceipts.length).toBeGreaterThanOrEqual(2);
    expect(stored?.stateSnapshots.length).toBeGreaterThanOrEqual(2);
    expect(stored?.eventLog.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(stored)).not.toContain(corp.sessionToken);

    const concurrent = await joinedMatch("concurrent");
    const concurrentBoot = await bootstrap(concurrent.service, concurrent.matchId, concurrent.corp);
    const concurrentMandatory = mustAction(concurrentBoot, (action) => action.type === "mandatory_draw");
    const [firstConcurrent, secondConcurrent] = await Promise.all([
      concurrent.service.submitAction({
        matchId: concurrent.matchId,
        side: "corp",
        sessionToken: concurrent.corp.sessionToken,
        actionId: concurrentMandatory.actionId,
        clientKnownStateVersion: 0,
        idempotencyKey: "concurrent-a"
      }),
      concurrent.service.submitAction({
        matchId: concurrent.matchId,
        side: "corp",
        sessionToken: concurrent.corp.sessionToken,
        actionId: concurrentMandatory.actionId,
        clientKnownStateVersion: 0,
        idempotencyKey: "concurrent-b"
      })
    ]);
    expect([firstConcurrent.ok, secondConcurrent.ok].filter(Boolean)).toHaveLength(1);
  });

  it("reconnects a side and restores view, legal actions and event tail", async () => {
    const { service, runner, matchId } = await joinedMatch();
    const reconnected = await service.reconnectMatch(matchId, {
      side: runner.side,
      reconnectToken: runner.reconnectToken,
      displayName: "Runner Reloaded"
    });

    expect("error" in reconnected).toBe(false);
    const result = reconnected as JoinMatchResult & { eventTail: unknown[] };
    expect(result.side).toBe("runner");
    expect(result.sessionToken).not.toBe(runner.sessionToken);
    expect(result.playerView.side).toBe("runner");
    expect(result.legalActions).toEqual(result.playerView.legalActions);
    expect(result.eventTail.length).toBeGreaterThan(0);

    const accessMatch = await joinedMatch("mp-win-1");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.corp, (action) => action.type === "end_turn", "end-turn");
    await submit(accessMatch.service, accessMatch.matchId, accessMatch.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    const accessReconnect = await accessMatch.service.reconnectMatch(accessMatch.matchId, {
      side: "runner",
      reconnectToken: accessMatch.runner.reconnectToken
    });
    expect("error" in accessReconnect).toBe(false);
    if ("error" in accessReconnect) throw new Error(accessReconnect.error.message);
    expect(accessReconnect.playerView.run?.phase).toBe("access");

    const encounterMatch = await joinedMatch("mp-enc-1");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "install_card" && action.payload?.serverId === "rd" && String(action.source).includes("ice"), "install-ice");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "end_turn", "end-turn");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(encounterMatch.service, encounterMatch.matchId, encounterMatch.corp, (action) => action.type === "rez_ice", "rez");
    const encounterReconnect = await encounterMatch.service.reconnectMatch(encounterMatch.matchId, {
      side: "runner",
      reconnectToken: encounterMatch.runner.reconnectToken
    });
    expect("error" in encounterReconnect).toBe(false);
    if ("error" in encounterReconnect) throw new Error(encounterReconnect.error.message);
    expect(encounterReconnect.playerView.run?.phase).toBe("encounter_ice");
  });

  it("allows undo before hidden information and blocks undo after access", async () => {
    const first = await joinedMatch("undo-safe");
    const firstAction = await submit(first.service, first.matchId, first.corp, (action) => action.type === "mandatory_draw", "mandatory");
    const undo = await first.service.requestUndo({
      matchId: first.matchId,
      side: "corp",
      sessionToken: first.corp.sessionToken,
      targetEventId: firstAction.receipt.stateVersionAfter === 1 ? "evt_1" : "",
      reason: "Misclick"
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok || !undo.undoRequest) throw new Error("Expected undo request");
    const accepted = await first.service.acceptUndo({
      matchId: first.matchId,
      side: "runner",
      sessionToken: first.runner.sessionToken,
      undoRequestId: undo.undoRequest.undoRequestId
    });
    expect(accepted.ok).toBe(true);
    const restored = await bootstrap(first.service, first.matchId, first.corp);
    expect(restored.playerView.stateVersion).toBe(0);

    const declineMatch = await joinedMatch("undo-decline");
    const declineAction = await submit(declineMatch.service, declineMatch.matchId, declineMatch.corp, (action) => action.type === "mandatory_draw", "mandatory");
    const declineRequest = await declineMatch.service.requestUndo({
      matchId: declineMatch.matchId,
      side: "corp",
      sessionToken: declineMatch.corp.sessionToken,
      targetEventId: `evt_${declineAction.receipt.stateVersionAfter}`
    });
    expect(declineRequest.ok).toBe(true);
    if (!declineRequest.ok || !declineRequest.undoRequest) throw new Error("Expected undo request");
    const declined = await declineMatch.service.declineUndo({
      matchId: declineMatch.matchId,
      side: "runner",
      sessionToken: declineMatch.runner.sessionToken,
      undoRequestId: declineRequest.undoRequest.undoRequestId
    });
    expect(declined.ok).toBe(true);

    const second = await joinedMatch("undo-blocked");
    await submit(second.service, second.matchId, second.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(second.service, second.matchId, second.corp, (action) => action.type === "end_turn", "end-turn");
    const run = await submit(second.service, second.matchId, second.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(second.service, second.matchId, second.runner, (action) => action.type === "access_card", "access");

    const blocked = await second.service.requestUndo({
      matchId: second.matchId,
      side: "runner",
      sessionToken: second.runner.sessionToken,
      targetEventId: `evt_${run.receipt.stateVersionAfter}`,
      reason: "Undo after access"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
    expect(JSON.stringify(blocked.error)).not.toContain("Simple Agenda");
  });

  it("handles V0.94 Damage through submit, idempotency, reconnect and undo barriers", async () => {
    const match = await joinedV094DamageMatch("mp-v094-damage");

    const run = await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v094-run");
    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: run.receipt.idempotencyKey,
      clientKnownStateVersion: run.receipt.stateVersionBefore,
      idempotencyKey: "v094-run"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(run.receipt.stateVersionAfter);

    await submit(match.service, match.matchId, match.corp, (action) => action.type === "rez_ice" && action.label.includes("Neural Sentry"), "v094-rez");
    const beforeDamage = await bootstrap(match.service, match.matchId, match.runner);
    const continueAction = mustAction(beforeDamage, (action) => action.type === "continue_run");
    const damage = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: continueAction.actionId,
      clientKnownStateVersion: beforeDamage.playerView.stateVersion,
      idempotencyKey: "v094-damage"
    });

    expect(damage.ok).toBe(true);
    if (!damage.ok) throw new Error(damage.error.message);
    expect(damage.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(damage.publicEvent?.publicPayload).toMatchObject({ damageResolved: true, damageType: "net", cardsTrashed: 1 });
    expect(damage.actorPayload.playerView.own.heapOrArchives).toHaveLength(1);
    expect(damage.opponentPayload.playerView.opponent.discardCount).toBe(1);
    expect(JSON.stringify(damage.opponentPayload)).not.toContain("Simple Fracter");
    expect(JSON.stringify(damage.opponentPayload)).not.toContain("Simple Decoder");
    expect(JSON.stringify(damage.opponentPayload)).not.toContain("Simple Killer");

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: continueAction.actionId,
      clientKnownStateVersion: beforeDamage.playerView.stateVersion,
      idempotencyKey: "v094-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "corp",
      reconnectToken: match.corp.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Decoder");
    expect(reconnected.playerView.opponent.discardCount).toBe(1);

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: match.runner.sessionToken,
      targetEventId: `evt_${damage.receipt.stateVersionAfter}`,
      reason: "Damage undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected Damage hidden-info barrier");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("handles V0.95 Resource trash through submit, idempotency, reconnect and undo", async () => {
    const match = await joinedV095ResourceMatch("mp-v095-resource");
    const beforeTrash = await bootstrap(match.service, match.matchId, match.corp);
    const trashAction = mustAction(beforeTrash, (action) => action.type === "trash_resource");

    const trashed = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: trashAction.actionId,
      clientKnownStateVersion: beforeTrash.playerView.stateVersion,
      idempotencyKey: "v095-trash"
    });

    expect(trashed.ok).toBe(true);
    if (!trashed.ok) throw new Error(trashed.error.message);
    expect(trashed.publicEvent?.visibilityClass).toBe("public");
    expect(trashed.publicEvent?.publicPayload).toMatchObject({
      actionType: "trash_resource",
      cardDefinitionId: "v095_safehouse_resource",
      title: "Safehouse Resource"
    });
    expect(trashed.actorPayload.playerView.opponent.discardCount).toBe(1);
    expect(trashed.opponentPayload.playerView.own.heapOrArchives.some((card) => card.definitionId === "v095_safehouse_resource")).toBe(true);
    expect(JSON.stringify(trashed.actorPayload)).not.toContain("Simple Fracter");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: trashAction.actionId,
      clientKnownStateVersion: beforeTrash.playerView.stateVersion,
      idempotencyKey: "v095-trash"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(trashed.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: trashAction.actionId,
      clientKnownStateVersion: beforeTrash.playerView.stateVersion,
      idempotencyKey: "v095-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerView.own.heapOrArchives.some((card) => card.definitionId === "v095_safehouse_resource")).toBe(true);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Decoder");

    const undo = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${trashed.receipt.stateVersionAfter}`,
      reason: "Resource trash undo"
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok) throw new Error(undo.error.message);
    expect(undo.undoRequest?.targetEventId).toBe(`evt_${trashed.receipt.stateVersionAfter}`);
  });

  it("handles V0.96 Trace bids through submit, idempotency, reconnect and undo", async () => {
    const match = await joinedV096TraceMatch("mp-v096-trace");
    const corpChoice = await bootstrap(match.service, match.matchId, match.corp);
    const runnerBefore = await bootstrap(match.service, match.matchId, match.runner);
    const corpAction = mustAction(corpChoice, (action) => action.type === "resolve_choice");

    expect(corpChoice.pendingChoice?.kind).toBe("bid_amount");
    expect(runnerBefore.pendingChoice).toBeUndefined();
    expect(JSON.stringify(runnerBefore)).not.toContain("Trace Probe ICE_");

    const corpBid = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: corpAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: { choiceId: corpChoice.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] },
      idempotencyKey: "v096-corp-bid"
    });

    expect(corpBid.ok).toBe(true);
    if (!corpBid.ok) throw new Error(corpBid.error.message);
    expect(corpBid.publicEvent?.visibilityClass).toBe("public");
    expect(corpBid.publicEvent?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      traceStep: "corp_bid",
      corpBid: 1,
      traceStrength: 3
    });
    expect(corpBid.opponentPayload.pendingChoice?.kind).toBe("bid_amount");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: corpAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: { choiceId: corpChoice.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] },
      idempotencyKey: "v096-corp-bid"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(corpBid.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.corp.side,
      sessionToken: match.corp.sessionToken,
      actionId: corpAction.actionId,
      clientKnownStateVersion: corpChoice.playerView.stateVersion,
      selectedChoices: { choiceId: corpChoice.pendingChoice?.choiceId, selectedOptionIds: ["bid_1"] },
      idempotencyKey: "v096-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnectedRunner = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnectedRunner).toBe(false);
    if ("error" in reconnectedRunner) throw new Error(reconnectedRunner.error.message);
    expect(reconnectedRunner.pendingChoice?.kind).toBe("bid_amount");
    expect(JSON.stringify(reconnectedRunner)).not.toContain("Simple Agenda");

    const runnerAction = reconnectedRunner.legalActions.find((action) => action.type === "resolve_choice");
    expect(runnerAction).toBeDefined();
    if (!runnerAction) throw new Error("Missing Runner trace bid action");
    const runnerBid = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnectedRunner.sessionToken,
      actionId: runnerAction.actionId,
      clientKnownStateVersion: reconnectedRunner.playerView.stateVersion,
      selectedChoices: { choiceId: reconnectedRunner.pendingChoice?.choiceId, selectedOptionIds: ["bid_0"] },
      idempotencyKey: "v096-runner-bid"
    });

    expect(runnerBid.ok).toBe(true);
    if (!runnerBid.ok) throw new Error(runnerBid.error.message);
    expect(runnerBid.publicEvent?.publicPayload).toMatchObject({
      traceStep: "runner_bid",
      traceSuccessful: true,
      tagsAdded: 1
    });
    expect(runnerBid.actorPayload.playerView.own.tags).toBe(1);

    const undo = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnectedRunner.sessionToken,
      targetEventId: `evt_${runnerBid.receipt.stateVersionAfter}`,
      reason: "Trace bid undo"
    });
    expect(undo.ok).toBe(true);
    if (!undo.ok) throw new Error(undo.error.message);
  });

  it("handles V0.97 Breach multiaccess through submit, idempotency, reconnect and undo barrier", async () => {
    const match = await joinedV097BreachMatch("mp-v097-breach");
    const before = await bootstrap(match.service, match.matchId, match.runner);
    const deepDive = mustAction(before, (action) => action.type === "play_event" && action.payload?.serverId === "rd");

    expect(JSON.stringify(before)).not.toContain("Simple Agenda");
    expect(JSON.stringify(before)).not.toContain("Simple Economy Operation");

    const started = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: deepDive.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v097-deep-dive"
    });

    expect(started.ok).toBe(true);
    if (!started.ok) throw new Error(started.error.message);
    expect(started.publicEvent?.visibilityClass).toBe("public");
    expect(started.actorPayload.playerView.run?.breach).toMatchObject({ serverId: "rd", remainingCount: 2 });
    expect(JSON.stringify(started.actorPayload)).not.toContain("Simple Agenda");
    expect(JSON.stringify(started.actorPayload)).not.toContain("Simple Economy Operation");

    const duplicate = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: deepDive.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v097-deep-dive"
    });
    expect(duplicate.ok).toBe(true);
    if (!duplicate.ok) throw new Error(duplicate.error.message);
    expect(duplicate.receipt.stateVersionAfter).toBe(started.receipt.stateVersionAfter);

    const stale = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      actionId: deepDive.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "v097-stale"
    });
    expect(stale.ok).toBe(false);
    if (stale.ok) throw new Error("Expected stale-state rejection");
    expect(stale.error.code).toBe("stale_state");

    const reconnected = await match.service.reconnectMatch(match.matchId, {
      side: "runner",
      reconnectToken: match.runner.reconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.playerView.run?.breach?.remainingCount).toBe(2);
    expect(JSON.stringify(reconnected)).not.toContain("Simple Agenda");
    expect(JSON.stringify(reconnected)).not.toContain("Simple Economy Operation");

    const accessAction = reconnected.legalActions.find((action) => action.type === "access_card");
    expect(accessAction).toBeDefined();
    if (!accessAction) throw new Error("Missing access action");
    const access = await match.service.submitAction({
      matchId: match.matchId,
      side: match.runner.side,
      sessionToken: reconnected.sessionToken,
      actionId: accessAction.actionId,
      clientKnownStateVersion: reconnected.playerView.stateVersion,
      idempotencyKey: "v097-access-first"
    });

    expect(access.ok).toBe(true);
    if (!access.ok) throw new Error(access.error.message);
    expect(access.publicEvent?.visibilityClass).toBe("hidden_info_barrier");
    expect(access.publicEvent?.publicPayload).toMatchObject({
      actionType: "access_card",
      cardDefinitionId: "simple_economy_operation",
      title: "Simple Economy Operation"
    });
    expect(JSON.stringify(access.publicEvent?.publicPayload)).not.toContain("Simple Agenda");
    expect(access.actorPayload.playerView.run?.breach?.remainingCount).toBe(1);

    const blocked = await match.service.requestUndo({
      matchId: match.matchId,
      side: "runner",
      sessionToken: reconnected.sessionToken,
      targetEventId: `evt_${access.receipt.stateVersionAfter}`,
      reason: "Breach access undo"
    });
    expect(blocked.ok).toBe(false);
    if (blocked.ok) throw new Error("Expected undo_blocked");
    expect(blocked.error.code).toBe("undo_blocked");
  });

  it("reports V0.94 Flatline as a side-safe result reason", async () => {
    const match = await joinedV094DamageMatch("mp-v094-flatline", { emptyRunnerGrip: true });

    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "v094-flatline-run");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "rez_ice" && action.label.includes("Neural Sentry"), "v094-flatline-rez");
    const flatline = await submit(match.service, match.matchId, match.runner, (action) => action.type === "continue_run", "v094-flatline-damage");

    expect(flatline.actorPayload.winner).toBe("corp");
    expect(flatline.actorPayload.matchStatus).toBe("finished");
    expect(flatline.actorPayload.resultSummary).toMatchObject({ winner: "corp", reason: "flatline" });
    expect(JSON.stringify(flatline.actorPayload)).not.toContain("Simple Killer");
  });

  it("replays a multiplayer match to the stored final state hash", async () => {
    const match = await joinedMatch("replay-multiplayer");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "gain_credit", "credit");

    const replay = await match.service.replayMatch(match.matchId);
    expect(replay.ok).toBe(true);
    expect(replay.finalStateHash).toMatch(/^fnv1a:/);
  });

  it("plays a private two-player match through to a Runner win", async () => {
    const match = await joinedMatch("mp-win-1", { agendaPointsToWin: 2, matchFormat: "single_game" });
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "end-turn");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "access_card", "access-rd");
    const steal = await submit(match.service, match.matchId, match.runner, (action) => action.type === "steal_agenda", "steal");

    expect(steal.actorPayload.winner).toBe("runner");
    expect(steal.actorPayload.matchStatus).toBe("finished");
    expect(steal.actorPayload.finalStateHash).toMatch(/^fnv1a:/);
    expect(steal.actorPayload.resultSummary).toMatchObject({
      winner: "runner",
      viewerOutcome: "won",
      reason: "agenda_points",
      matchFormat: "single_game",
      agendaPointsToWin: 2,
      runnerAgendaPoints: 3,
      corpAgendaPoints: 0,
      runCount: 1,
      successfulRunCount: 1,
      stolenAgendaCount: 1,
      scoredAgendaCount: 0
    });
    expect(steal.actorPayload.resultSummary?.actionCount).toBeGreaterThanOrEqual(5);
    expect(JSON.stringify(steal.actorPayload.resultSummary)).not.toContain("Simple Agenda");
    expect(JSON.stringify(steal.actorPayload.resultSummary)).not.toContain("cardInstances");

    const corpPayload = await bootstrap(match.service, match.matchId, match.corp);
    expect(corpPayload.resultSummary?.viewerOutcome).toBe("lost");
    expect(corpPayload.legalActions).toEqual([]);
  });

  it("creates the next private series game with a side swap and side-safe standings", async () => {
    const match = await joinedMatch("series-side-swap", { agendaPointsToWin: 2, matchFormat: "two_game_side_swap" });
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "mandatory_draw", "mandatory");
    await submit(match.service, match.matchId, match.corp, (action) => action.type === "end_turn", "end-turn");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "start_run" && action.payload?.serverId === "rd", "run-rd");
    await submit(match.service, match.matchId, match.runner, (action) => action.type === "access_card", "access-rd");
    const steal = await submit(match.service, match.matchId, match.runner, (action) => action.type === "steal_agenda", "steal");

    expect(steal.actorPayload.resultSummary?.series).toMatchObject({
      mode: "two_game_side_swap",
      status: "between_games",
      gameNumber: 1,
      gamesPlanned: 2,
      viewerWins: 1,
      opponentWins: 0,
      draws: 0,
      nextAvailable: true
    });

    const next = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken,
      displayName: "Runner im Seitenwechsel"
    });
    expect("error" in next).toBe(false);
    if ("error" in next) throw new Error(next.error.message);
    expect(next.matchId).not.toBe(match.matchId);
    expect(next.hostSide).toBe("corp");
    expect(next.joinUrl).toBeTruthy();
    expect(JSON.stringify(next)).not.toContain("cardInstances");

    const oldRecord = await match.service.loadForTest(match.matchId);
    const nextRecord = await match.service.loadForTest(next.matchId);
    expect(oldRecord?.match.series?.nextMatchId).toBe(next.matchId);
    expect(nextRecord?.match.settings.matchFormat).toBe("two_game_side_swap");
    expect(nextRecord?.match.settings.agendaPointsToWin).toBe(2);
    expect(nextRecord?.match.series).toMatchObject({
      seriesId: oldRecord?.match.series?.seriesId,
      status: "active",
      gameNumber: 2,
      gamesPlanned: 2,
      runnerPlayer: "player_a",
      corpPlayer: "player_b",
      previousMatchId: match.matchId
    });
    expect(nextRecord?.match.series?.results).toHaveLength(1);

    const duplicate = await match.service.startNextSeriesGame(match.matchId, {
      side: match.runner.side,
      sessionToken: match.runner.sessionToken
    });
    expect("error" in duplicate).toBe(true);
    if (!("error" in duplicate)) throw new Error("Expected duplicate series-next rejection");
    expect(duplicate.error.code).toBe("series_next_exists");
  });

  it("sends side-filtered bootstrap messages over WebSocket", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-test",
      publicWebBaseUrl: "http://127.0.0.1:3000",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "runner", seed: "ws-bootstrap" });
    const handle = createNetrunnerHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide }
        })
      );
      const update = await waitForMessage(socket, "state_update");
      expect(JSON.stringify(update)).not.toContain("hostSessionToken");
      expect(JSON.stringify(update)).not.toContain("Simple Agenda");

      const replacement = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
      await waitForOpen(replacement);
      const oldClosed = waitForMessage(socket, "error");
      replacement.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: created.hostSide }
        })
      );
      await waitForMessage(replacement, "state_update");
      const oldMessage = await oldClosed;
      expect(JSON.stringify(oldMessage)).toContain("reconnected_elsewhere");
      socket.close();
      await new Promise((resolve) => setTimeout(resolve, 50));
      const stored = await service.loadForTest(created.matchId);
      expect(stored?.sessions.find((session) => session.side === created.hostSide)?.connected).toBe(true);
      replacement.close();
    } finally {
      socket.close();
      await handle.close();
    }
  });

  it("sends V0.93 pending choices only to the owning side over bootstrap, reconnect and WebSocket", async () => {
    const storage = new InMemoryMatchStorage();
    const service = new MultiplayerService(storage, {
      tokenSalt: "ws-choice-test",
      publicWebBaseUrl: "http://127.0.0.1:3000",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "runner", seed: "ws-choice" });
    expect(created.joinUrl).toBeTruthy();
    if (!created.joinUrl) throw new Error("Missing join URL");
    const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
    if (!joinToken) throw new Error("Missing join token");
    const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Corp" });
    expect("error" in joined).toBe(false);
    if ("error" in joined) throw new Error(joined.error.message);

    const stored = await storage.load(created.matchId);
    expect(stored).toBeDefined();
    if (!stored) throw new Error("Missing stored match");
    stored.gameState.pendingChoice = choiceRequest(stored.gameState, "runner");
    await storage.save(stored);

    const runnerBootstrap = await service.bootstrap(created.matchId, "runner", created.hostSessionToken);
    const corpBootstrap = await service.bootstrap(created.matchId, "corp", joined.sessionToken);
    expect("error" in runnerBootstrap).toBe(false);
    expect("error" in corpBootstrap).toBe(false);
    if ("error" in runnerBootstrap || "error" in corpBootstrap) throw new Error("Bootstrap failed");
    expect(runnerBootstrap.pendingChoice?.choiceId).toBe("choice_v093_runner");
    expect(corpBootstrap.pendingChoice).toBeUndefined();
    expect(JSON.stringify(corpBootstrap)).not.toContain("Runner private option");

    const reconnected = await service.reconnectMatch(created.matchId, {
      side: "runner",
      reconnectToken: created.hostReconnectToken
    });
    expect("error" in reconnected).toBe(false);
    if ("error" in reconnected) throw new Error(reconnected.error.message);
    expect(reconnected.pendingChoice?.choiceId).toBe("choice_v093_runner");

    const handle = createNetrunnerHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const socket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);

    try {
      await waitForOpen(socket);
      socket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: reconnected.sessionToken, side: "runner" }
        })
      );
      const choiceMessage = await waitForMessage(socket, "choice_request");
      const choice = (choiceMessage as { payload?: { choice?: { choiceId?: string; options?: Array<{ label?: string }> } | null } }).payload?.choice;
      expect(choice?.choiceId).toBe("choice_v093_runner");
      expect(choice?.options?.[0]?.label).toBe("Runner private option");
      expect(JSON.stringify(choiceMessage)).not.toContain("hostSessionToken");
    } finally {
      socket.close();
      await handle.close();
    }
  });

  it("broadcasts active match status to the host when the second player joins by WebSocket", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), {
      tokenSalt: "ws-status-test",
      publicWebBaseUrl: "http://127.0.0.1:3000",
      publicServerBaseUrl: "http://127.0.0.1:0"
    });
    const created = await service.createMatch({ hostSide: "corp", seed: "ws-status" });
    const handle = createNetrunnerHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");
    const hostSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
    let runnerSocket: WebSocket | undefined;

    try {
      await waitForOpen(hostSocket);
      hostSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: created.hostSessionToken, side: "corp" }
        })
      );
      const waitingUpdate = await waitForMessage(hostSocket, "state_update");
      expect(messagePayload(waitingUpdate).matchStatus).toBe("waiting_for_runner");

      expect(created.joinUrl).toBeTruthy();
      if (!created.joinUrl) throw new Error("Missing join URL");
      const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
      if (!joinToken) throw new Error("Missing join token");
      const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
      if ("error" in joined) throw new Error(joined.error.message);

      runnerSocket = new WebSocket(`ws://127.0.0.1:${address.port}/ws`);
      await waitForOpen(runnerSocket);
      runnerSocket.send(
        JSON.stringify({
          type: "join_match",
          payload: { matchId: created.matchId, sessionToken: joined.sessionToken, side: "runner" }
        })
      );
      const activeUpdate = await waitForMessage(hostSocket, "state_update");
      expect(messagePayload(activeUpdate).matchStatus).toBe("active");
    } finally {
      hostSocket.close();
      runnerSocket?.close();
      await handle.close();
    }
  });

  it("runs Human Runner vs Corp AI matches without a second player", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-runner-service" });
    const created = await service.createMatch({
      mode: "human_runner_vs_corp_ai",
      hostSide: "runner",
      seed: "server-corp-ai",
      corpDifficulty: "normal"
    });

    expect(created.mode).toBe("human_runner_vs_corp_ai");
    expect(created.joinUrl).toBeUndefined();
    expect(created.playerView.side).toBe("runner");
    expect(created.playerView.activeSide).toBe("runner");
    expect(created.matchVersion).toBeGreaterThan(1);
    expect(created.legalActions.length).toBeGreaterThan(0);

    const stored = await service.loadForTest(created.matchId);
    expect(stored?.match.aiControllers?.corp?.type).toBe("ai");
    expect(JSON.stringify(created)).not.toContain("cardInstances");
    expect(JSON.stringify(created)).not.toContain("Simple Agenda");
  });

  it("runs Human Corp vs Runner AI through the same action pipeline", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-corp-service" });
    const created = await service.createMatch({
      mode: "human_corp_vs_runner_ai",
      hostSide: "corp",
      seed: "server-runner-ai",
      runnerDifficulty: "normal"
    });

    const before = await service.bootstrap(created.matchId, "corp", created.hostSessionToken);
    expect("error" in before).toBe(false);
    if ("error" in before) throw new Error(before.error.message);
    const mandatory = mustAction(before, (action) => action.type === "mandatory_draw");
    const mandatoryResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: mandatory.actionId,
      clientKnownStateVersion: before.playerView.stateVersion,
      idempotencyKey: "corp-ai-mode-mandatory"
    });
    expect(mandatoryResult.ok).toBe(true);
    if (!mandatoryResult.ok) throw new Error(mandatoryResult.error.message);

    const afterMandatory = mandatoryResult.actorPayload;
    const endTurn = mustAction(afterMandatory, (action) => action.type === "end_turn");
    const endTurnResult = await service.submitAction({
      matchId: created.matchId,
      side: "corp",
      sessionToken: created.hostSessionToken,
      actionId: endTurn.actionId,
      clientKnownStateVersion: afterMandatory.playerView.stateVersion,
      idempotencyKey: "corp-ai-mode-end"
    });
    expect(endTurnResult.ok).toBe(true);
    if (!endTurnResult.ok) throw new Error(endTurnResult.error.message);

    expect(endTurnResult.actorPayload.playerView.stateVersion).toBeGreaterThan(afterMandatory.playerView.stateVersion + 1);
    expect(endTurnResult.actorPayload.opponentStatus.connected).toBe(true);
    expect(JSON.stringify(endTurnResult.actorPayload)).not.toContain("Simple Fracter");
  });

  it("exposes a side-safe AI-vs-AI simulation API", async () => {
    const service = new MultiplayerService(new InMemoryMatchStorage(), { tokenSalt: "ai-api-service" });
    const handle = createNetrunnerHttpServer(service);
    await new Promise<void>((resolve) => handle.server.listen(0, "127.0.0.1", resolve));
    const address = handle.server.address();
    if (!address || typeof address === "string") throw new Error("Missing server address");

    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/simulations/ai-vs-ai`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ seed: "server-ai-sim", maxActions: 60 })
      });
      const payload = (await response.json()) as { summary?: { finalStateHash?: string; replayOk?: boolean; errors?: string[] } };
      expect(response.status).toBe(200);
      expect(payload.summary?.finalStateHash).toMatch(/^fnv1a:/);
      expect(payload.summary?.replayOk).toBe(true);
      expect(payload.summary?.errors).toEqual([]);
      expect(JSON.stringify(payload)).not.toContain("cardInstances");
      expect(JSON.stringify(payload)).not.toContain("sessionToken");
    } finally {
      await handle.close();
    }
  });
});

type PlayerSession = {
  side: Side;
  sessionToken: string;
  reconnectToken: string;
};

const V094_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_094",
  name: "Runner Demo Deck 0.94 - Multiplayer Damage Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 3 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 }
  ]
};

const V094_CORP_DECK: DeckDefinition = {
  id: "demo_corp_094",
  name: "Corp Demo Deck 0.94 - Multiplayer Damage Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "v094_neural_sentry_ice", quantity: 3 },
    { id: "simple_barrier_ice", quantity: 2 }
  ]
};

const V095_RUNNER_DECK: DeckDefinition = {
  id: "demo_runner_095",
  name: "Runner Demo Deck 0.95 - Multiplayer Resource Harness",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_economy_event", quantity: 3 },
    { id: "simple_run_event", quantity: 2 },
    { id: "simple_fracter", quantity: 2 },
    { id: "simple_decoder", quantity: 2 },
    { id: "simple_killer", quantity: 2 },
    { id: "v095_safehouse_resource", quantity: 2 }
  ]
};

const V095_CORP_DECK: DeckDefinition = {
  id: "demo_corp_095",
  name: "Corp Demo Deck 0.95 - Multiplayer Resource Trash Harness",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 2 },
    { id: "simple_priority_agenda", quantity: 1 },
    { id: "simple_economy_operation", quantity: 3 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_tag_ice", quantity: 2 },
    { id: "simple_barrier_ice", quantity: 2 }
  ]
};

async function joinedMatch(seed = "service-test", settings?: Partial<MatchSettings>) {
  const service = new MultiplayerService(new InMemoryMatchStorage(), {
    tokenSalt: "test-salt",
    publicWebBaseUrl: "http://127.0.0.1:3000",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed, ...(settings ? { settings } : {}) });
  expect(created.joinUrl).toBeTruthy();
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  expect(joinToken).toBeTruthy();
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);
  return {
    service,
    created,
    joinToken,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV094DamageMatch(seed: string, options: { emptyRunnerGrip?: boolean } = {}) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3000",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let gameState = toRunnerTurnEngine(createGame({ matchId: created.matchId, seed, runnerDeck: V094_RUNNER_DECK, corpDeck: V094_CORP_DECK, agendaPointsToWin: 7 }));
  if (options.emptyRunnerGrip) emptyRunnerGripForTest(gameState);
  putCorpIceOnServerForTest(gameState, "rd", "v094_neural_sentry_ice");
  gameState.corp.credits = 10;
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v094_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV095ResourceMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3000",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let gameState = toRunnerTurnEngine(createGame({ matchId: created.matchId, seed, runnerDeck: V095_RUNNER_DECK, corpDeck: V095_CORP_DECK, agendaPointsToWin: 7 }));
  gameState.runner.credits = 6;
  moveRunnerCardToGripForTest(gameState, "v095_safehouse_resource");
  gameState = applyEngineAction(gameState, "runner", (action) => action.type === "install_card" && action.label.includes("Safehouse Resource"));
  gameState.activeSide = "corp";
  gameState.phase = "corp_action_phase";
  gameState.timingPoint = "corp_action.main";
  gameState.corp.clicks = 3;
  gameState.corp.credits = 5;
  gameState.runner.tags = 1;
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v095_resource_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV096TraceMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3000",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  let gameState = toRunnerTurnEngine(
    createGame({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_096",
      corpDeckId: "demo_corp_096",
      agendaPointsToWin: 7
    })
  );
  putCorpIceOnServerForTest(gameState, "rd", "v096_trace_probe_ice");
  gameState.corp.credits = 8;
  gameState.runner.credits = 5;
  gameState = applyEngineAction(gameState, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "rd");
  gameState = applyEngineAction(gameState, "corp", (action) => action.type === "rez_ice" && action.label.includes("Trace Probe"));
  gameState = applyEngineAction(gameState, "runner", (action) => action.type === "continue_run");
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v096_trace_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function joinedV097BreachMatch(seed: string) {
  const storage = new InMemoryMatchStorage();
  const service = new MultiplayerService(storage, {
    tokenSalt: `test-salt-${seed}`,
    publicWebBaseUrl: "http://127.0.0.1:3000",
    publicServerBaseUrl: "http://127.0.0.1:8787"
  });
  const created = await service.createMatch({ hostSide: "corp", seed });
  if (!created.joinUrl) throw new Error("Missing join URL");
  const joinToken = new URL(created.joinUrl).searchParams.get("joinToken");
  if (!joinToken) throw new Error("Missing join token");
  const joined = await service.joinMatch(created.matchId, { token: joinToken, displayName: "Runner" });
  expect("error" in joined).toBe(false);
  if ("error" in joined) throw new Error(joined.error.message);

  const record = await storage.load(created.matchId);
  if (!record) throw new Error("Missing stored match");
  const gameState = toRunnerTurnEngine(
    createGame({
      matchId: created.matchId,
      seed,
      runnerDeckId: "demo_runner_097",
      corpDeckId: "demo_corp_097",
      agendaPointsToWin: 7
    })
  );
  gameState.runner.credits = 5;
  moveRunnerCardToGripForTest(gameState, "v097_deep_dive_event");
  putCorpCardOnTopOfRdForTest(gameState, "simple_agenda");
  putCorpCardOnTopOfRdForTest(gameState, "simple_economy_operation");
  record.gameState = gameState;
  record.match.baseline = gameState.baseline;
  record.match.settings.agendaPointsToWin = 7;
  record.eventLog = gameState.eventLog.map((event) => toEventRecordForTest(created.matchId, event));
  record.stateSnapshots = [stateSnapshotForTest(created.matchId, gameState, record.match.matchVersion, "snap_v097_breach_ready")];
  record.actionReceipts = [];
  record.undoSnapshots = [];
  delete record.pendingUndo;
  await storage.save(record);

  return {
    service,
    matchId: created.matchId,
    corp: { side: "corp" as const, sessionToken: created.hostSessionToken, reconnectToken: created.hostReconnectToken },
    runner: { side: "runner" as const, sessionToken: joined.sessionToken, reconnectToken: joined.reconnectToken }
  };
}

async function bootstrap(service: MultiplayerService, matchId: string, session: PlayerSession): Promise<SidePayload> {
  const payload = await service.bootstrap(matchId, session.side, session.sessionToken);
  expect("error" in payload).toBe(false);
  if ("error" in payload) throw new Error(payload.error.message);
  return payload;
}

function toRunnerTurnEngine(state: GameState): GameState {
  let next = applyEngineAction(state, "corp", (action) => action.type === "mandatory_draw");
  next = applyEngineAction(next, "corp", (action) => action.type === "end_turn");
  return next;
}

function applyEngineAction(state: GameState, side: Side, predicate: (action: LegalAction) => boolean): GameState {
  const selected = getLegalActions(state, side).find(predicate);
  if (!selected) throw new Error(`Missing engine action for ${side}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: selected.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${selected.actionId}`
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function putCorpIceOnServerForTest(state: GameState, serverId: "hq" | "rd" | "archives" | `remote_${number}`, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  const server = state.corp.servers.find((candidate) => candidate.id === serverId);
  if (!server) throw new Error("Missing server");
  removeEverywhereForTest(state, id);
  server.ice.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "serverIce", serverId }, faceup: false, rezzed: false };
  return id;
}

function putCorpCardOnTopOfRdForTest(state: GameState, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.corp.rd.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "corp", zone: "rd" }, faceup: false, rezzed: false };
  return id;
}

function moveRunnerCardToGripForTest(state: GameState, definitionId: string): CardInstanceId {
  const id = findCardForTest(state, definitionId);
  removeEverywhereForTest(state, id);
  state.runner.grip.unshift(id);
  state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "grip" }, faceup: true, rezzed: true };
  return id;
}

function emptyRunnerGripForTest(state: GameState): void {
  for (const id of state.runner.grip.slice()) {
    removeEverywhereForTest(state, id);
    state.runner.heap.push(id);
    state.cardInstances[id] = { ...state.cardInstances[id]!, zone: { side: "runner", zone: "heap" }, faceup: true, rezzed: true };
  }
}

function findCardForTest(state: GameState, definitionId: string): CardInstanceId {
  const entry = Object.entries(state.cardInstances).find(([, card]) => card.definitionId === definitionId);
  if (!entry) throw new Error(`Missing ${definitionId}`);
  return entry[0];
}

function removeEverywhereForTest(state: GameState, cardId: string): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.ice = server.ice.filter((id) => id !== cardId);
    server.root = server.root.filter((id) => id !== cardId);
  }
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.scoreArea = state.runner.scoreArea.filter((id) => id !== cardId);
  state.runner.rig.programs = state.runner.rig.programs.filter((id) => id !== cardId);
  state.runner.rig.hardware = state.runner.rig.hardware.filter((id) => id !== cardId);
  state.runner.rig.resources = state.runner.rig.resources.filter((id) => id !== cardId);
}

function toEventRecordForTest(matchId: string, event: GameEvent): EventRecord {
  return {
    eventId: event.eventId,
    matchId,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    publicPayload: toPublicEventForTest(event),
    privatePayloadLocalOnly: true,
    hiddenInfoBarrier: false
  };
}

function stateSnapshotForTest(matchId: string, state: GameState, matchVersion: number, snapshotId: string): StateSnapshot {
  return {
    snapshotId,
    matchId,
    stateVersion: state.stateVersion,
    matchVersion,
    stateHash: hashState(state),
    gameState: structuredClone(state),
    createdAt: "2026-05-04T00:00:00.000Z",
    hiddenInfoBarrier: false
  };
}

function toPublicEventForTest(event: GameEvent): PublicGameEvent {
  return {
    eventId: event.eventId,
    type: event.type,
    stateVersionBefore: event.stateVersionBefore,
    stateVersionAfter: event.stateVersionAfter,
    stateHashAfter: event.stateHashAfter,
    ...(event.visibilityClass ? { visibilityClass: event.visibilityClass } : {}),
    publicPayload: event.publicPayload
  };
}

function choiceRequest(state: GameState, side: Side): ChoiceRequest {
  return {
    choiceId: `choice_v093_${side}`,
    side,
    source: "server_v093_choice",
    prompt: "Runner private prompt",
    kind: "select_option",
    options: [{ id: "keep", label: "Runner private option" }],
    minSelections: 1,
    maxSelections: 1,
    stateVersion: state.stateVersion,
    visibility: "private_to_side"
  };
}

async function submit(
  service: MultiplayerService,
  matchId: string,
  session: PlayerSession,
  predicate: (action: LegalAction) => boolean,
  idempotencyKey: string
) {
  const payload = await bootstrap(service, matchId, session);
  const action = mustAction(payload, predicate);
  const result = await service.submitAction({
    matchId,
    side: session.side,
    sessionToken: session.sessionToken,
    actionId: action.actionId,
    clientKnownStateVersion: payload.playerView.stateVersion,
    idempotencyKey
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result;
}

function mustAction(payload: SidePayload, predicate: (action: LegalAction) => boolean): LegalAction {
  const selected = payload.legalActions.find(predicate);
  expect(selected, payload.legalActions.map((action) => `${action.type}:${action.label}`).join(", ")).toBeDefined();
  if (!selected) throw new Error("Missing action");
  return selected;
}

function waitForOpen(socket: WebSocket): Promise<void> {
  return new Promise((resolve, reject) => {
    socket.once("open", () => resolve());
    socket.once("error", reject);
  });
}

function waitForMessage(socket: WebSocket, type: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${type}`)), 5000);
    socket.on("message", (raw) => {
      const parsed = JSON.parse(raw.toString()) as { type?: string };
      if (parsed.type === type) {
        clearTimeout(timeout);
        resolve(parsed);
      }
    });
    socket.once("error", reject);
  });
}

function messagePayload(message: unknown): { matchStatus?: string } {
  return (message as { payload?: { matchStatus?: string } }).payload ?? {};
}
