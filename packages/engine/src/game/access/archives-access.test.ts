import { describe, expect, it } from "vitest";
import {
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  apply,
  installRunnerProgramForTest,
  keepOnlyCorpArchivesCards,
  MECHANIC_SMOKE_GAMES,
  moveCorpCardToArchives,
  toRunnerTurn,
  v097RunGame,
} from "../../test-fixtures/mechanic-smoke-fixtures";

describe("V1.1.2 Full Archives Access", () => {
  it("turns existing facedown Archives cards faceup at breach start and skips cards without decisions", () => {
    let state = toRunnerTurn(v097RunGame("v112-archives-queue"));
    const faceupOperation = moveCorpCardToArchives(
      state,
      "simple_economy_operation",
      true,
    );
    const facedownAsset = moveCorpCardToArchives(
      state,
      "simple_economy_asset",
      false,
    );
    const facedownAgenda = moveCorpCardToArchives(
      state,
      "simple_agenda",
      false,
    );
    keepOnlyCorpArchivesCards(state, [
      faceupOperation,
      facedownAsset,
      facedownAgenda,
    ]);

    const runnerBefore = getPlayerView(state, "runner");
    const corpBefore = getPlayerView(state, "corp");

    expect(runnerBefore.opponent.discardCount).toBe(3);
    expect(JSON.stringify(runnerBefore)).toContain("Simple Economy Operation");
    expect(JSON.stringify(runnerBefore)).not.toContain("Simple Economy Asset");
    expect(JSON.stringify(runnerBefore)).not.toContain("Simple Agenda");
    expect(JSON.stringify(corpBefore)).toContain("Simple Economy Asset");
    expect(JSON.stringify(corpBefore)).toContain("Simple Agenda");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );

    expect(
      state.run?.breach?.queue.map((entry) => entry.cardInstanceId),
    ).toEqual([faceupOperation, facedownAsset, facedownAgenda]);
    expect(state.run?.breach?.queue.map((entry) => entry.hiddenInfo)).toEqual([
      false,
      false,
      false,
    ]);
    expect(state.cardInstances[facedownAsset]?.faceup).toBe(true);
    expect(state.cardInstances[facedownAgenda]?.faceup).toBe(true);
    expect(state.run?.breach?.currentIndex).toBe(2);
    expect(state.run?.breach?.accessedSummaries).toEqual([
      {
        entryId: `${state.run?.runId}.breach.0`,
        status: "accessed",
        cardDefinitionId: "simple_economy_operation",
      },
      {
        entryId: `${state.run?.runId}.breach.1`,
        status: "accessed",
        cardDefinitionId: "simple_economy_asset",
      },
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      hiddenZoneBarrier: true,
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealCount: 2,
      archivesRevealDefinitionIds: "simple_economy_asset,simple_agenda",
      archivesRevealTitles: "Simple Economy Asset|Simple Agenda",
      archivesRevealAgendaDefinitionIds: "simple_agenda",
      publicRevealDefinitionIds: "simple_economy_asset,simple_agenda",
      publicRevealTitles: "Simple Economy Asset|Simple Agenda",
      archivesAutoAccessedCount: 2,
    });
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Simple Economy Asset",
    );
    expect(JSON.stringify(getPlayerView(state, "runner"))).toContain(
      "Simple Agenda",
    );
  });

  it("preserves Archives queue progress, forbids Archives trash, and replays deterministically", () => {
    let state = toRunnerTurn(v097RunGame("v112-archives-access"));
    state.runner.credits = 10;
    const faceupOperation = moveCorpCardToArchives(
      state,
      "simple_economy_operation",
      true,
    );
    const facedownAsset = moveCorpCardToArchives(
      state,
      "simple_economy_asset",
      false,
    );
    const facedownAgenda = moveCorpCardToArchives(
      state,
      "simple_agenda",
      false,
    );
    keepOnlyCorpArchivesCards(state, [
      faceupOperation,
      facedownAsset,
      facedownAgenda,
    ]);
    const initial = structuredClone(state);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );
    expect(
      getLegalActions(state, "runner").some(
        (action) => action.type === "trash_accessed_card",
      ),
    ).toBe(false);
    expect(state.run?.breach?.currentIndex).toBe(2);
    expect(state.run?.breach?.accessedSummaries).toEqual([
      {
        entryId: `${state.run?.runId}.breach.0`,
        status: "accessed",
        cardDefinitionId: "simple_economy_operation",
      },
      {
        entryId: `${state.run?.runId}.breach.1`,
        status: "accessed",
        cardDefinitionId: "simple_economy_asset",
      },
    ]);
    expect(
      state.corp.archives.filter((id) => id === facedownAsset),
    ).toHaveLength(1);
    expect(state.corp.archives).toEqual([
      faceupOperation,
      facedownAsset,
      facedownAgenda,
    ]);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.cardInstances[facedownAgenda]?.faceup).toBe(true);
    state = apply(state, "runner", (action) => action.type === "steal_agenda");

    expect(state.runner.scoreArea).toContain(facedownAgenda);
    expect(state.run).toBeUndefined();
    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("auto-accesses Archives assets whose access effects are ignored there", () => {
    let state = toRunnerTurn(MECHANIC_SMOKE_GAMES.assetNodeEffects("v112-archives-no-trash"));
    state.runner.credits = 10;
    const setupId = moveCorpCardToArchives(state, "onr_v1_340_setup", false);
    keepOnlyCorpArchivesCards(state, [setupId]);

    state = apply(state, "runner", (action) => action.type === "start_run" && action.payload?.serverId === "archives");

    const actions = getLegalActions(state, "runner");
    expect(actions.some((action) => action.type === "trash_accessed_card")).toBe(false);
    expect(actions.some((action) => action.type === "access_card")).toBe(false);
    expect(state.run).toBeUndefined();
    expect(state.corp.archives).toEqual([setupId]);
    expect(state.cardInstances[setupId]?.faceup).toBe(true);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      archivesRevealDefinitionIds: "onr_v1_340_setup",
      archivesAutoAccessedCount: 1,
    });
  });

  it("auto-accesses Experimental AI in Archives when no installed program can be trashed", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v112-archives-experimental-ai-no-target"),
    );
    const programTrashByAdvancementAssetId = moveCorpCardToArchives(
      state,
      "onr_v1_323_experimental-ai",
      false,
    );
    state.cardInstances[programTrashByAdvancementAssetId] = {
      ...state.cardInstances[programTrashByAdvancementAssetId]!,
      advancementCounters: 2,
    };
    keepOnlyCorpArchivesCards(state, [programTrashByAdvancementAssetId]);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );

    expect(state.run).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: "onr_v1_323_experimental-ai",
      archivesAutoAccessedCount: 1,
    });
  });

  it("auto-accesses Experimental AI in Archives even when an installed program exists", () => {
    let state = toRunnerTurn(
      MECHANIC_SMOKE_GAMES.agendaScoring("v112-archives-experimental-ai-target"),
    );
    const programId = installRunnerProgramForTest(state, "simple_decoder");
    const programTrashByAdvancementAssetId = moveCorpCardToArchives(
      state,
      "onr_v1_323_experimental-ai",
      false,
    );
    state.cardInstances[programTrashByAdvancementAssetId] = {
      ...state.cardInstances[programTrashByAdvancementAssetId]!,
      advancementCounters: 1,
    };
    keepOnlyCorpArchivesCards(state, [programTrashByAdvancementAssetId]);

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "archives",
    );

    expect(state.run).toBeUndefined();
    expect(state.runner.heap).not.toContain(programId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      hiddenZoneAction: "archives_breach_reveal",
      archivesRevealDefinitionIds: "onr_v1_323_experimental-ai",
      archivesAutoAccessedCount: 1,
    });
  });
});
