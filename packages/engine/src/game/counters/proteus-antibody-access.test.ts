import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import type {
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  Side,
} from "@netgrid/shared";

function apply(
  state: GameState,
  side: Side,
  predicate: (action: ReturnType<typeof getLegalActions>[number]) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  expect(action).toBeDefined();
  if (!action) throw new Error("Missing action");
  const selectedChoices =
    action.type === "resolve_choice"
      ? { choiceId: state.pendingChoice?.choiceId, selectedOptionIds: ["pay"] }
      : undefined;
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    ...(selectedChoices ? { selectedChoices } : {}),
  });
  if (!result.ok) throw new Error(result.error.message);
  expect(result.ok).toBe(true);
  return result.state;
}

function corpCard(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  rezzed = false,
): CardInstance {
  return {
    instanceId: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    faceup: rezzed,
    rezzed,
    advancementCounters: 0,
    strengthModifier: 0,
    zone,
  };
}

function runnerProgram(
  id: string,
  definitionId: string,
): CardInstance {
  return {
    instanceId: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "runner",
    controller: "runner",
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
    zone: { side: "runner", zone: "rig" },
  };
}

function accessFixture(definitionId: string, zone: "rd" | "archives"): GameState {
  const state = createGame({
    seed: `proteus-8b-${definitionId}-${zone}`,
    setupMode: "completed",
  });
  const cardId = `${definitionId}_test` as CardInstanceId;
  state.cardInstances[cardId] = corpCard(cardId, definitionId, {
    side: "corp",
    zone,
  });
  if (zone === "rd") state.corp.rd.unshift(cardId);
  else state.corp.archives.unshift(cardId);
  state.activeSide = "runner";
  state.phase = "run";
  state.timingPoint = "access.resolve_card";
  state.run = {
    runId: "run_1",
    attackedServerId: zone,
    phase: "access",
    position: { kind: "server", serverId: zone },
    brokenSubroutineIndexes: [],
    resolvedSubroutineIndexes: [],
    successful: true,
    accessCount: 1,
    breach: {
      breachId: "breach_1",
      serverId: zone,
      accessMode: "single",
      queue: [
        {
          entryId: "entry_1",
          cardInstanceId: cardId,
          serverId: zone,
          zone,
          status: "pending",
          hiddenInfo: zone === "rd",
        },
      ],
      currentIndex: 0,
      completed: false,
      accessedSummaries: [],
    },
  };
  return state;
}

describe("Proteus Phase 8b Corp Antibody access", () => {
  it("lets Doppelganger Antibody create removable public Runner status counters", () => {
    let state = accessFixture(
      "onr_proteus_057_doppelganger-antibody",
      "rd",
    );
    state.corp.credits = 2;
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_option",
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      ambushPaymentChoiceOpened: true,
      ambushPaymentAmount: 2,
    });

    state = apply(state, "corp", (action) => action.type === "resolve_choice");
    expect(
      state.cardInstances[state.runner.identity]?.counters?.link_reduction_counter,
    ).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      ambushDefinitionId: "onr_proteus_057_doppelganger-antibody",
      ambushPaidCost: 2,
      counterType: "link_reduction_counter",
      addedCounterAmount: 1,
      remainingCounters: 1,
    });
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(state));
    const trashAction = getLegalActions(state, "runner").find(
      (action) => action.type === "trash_accessed_card",
    );
    expect(trashAction).toBeDefined();
    expect(trashAction?.costs).toEqual([{ credits: 0 }]);

    state.runner.credits = 4;
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 1;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "trigger_ability" &&
        action.payload?.counterType === "link_reduction_counter",
    );
    expect(
      state.cardInstances[state.runner.identity]?.counters?.link_reduction_counter,
    ).toBeUndefined();
    expect(state.runner.credits).toBe(0);
  });

  it("puts Pattel counters only on installed icebreakers and reduces strength below zero", () => {
    let state = accessFixture("onr_proteus_068_pattel-antibody", "rd");
    const breakerId = "proteus_8b_dwarf" as CardInstanceId;
    state.cardInstances[breakerId] = runnerProgram(breakerId, "onr_v1_021_dwarf");
    state.runner.rig.programs.push(breakerId);
    state.corp.credits = 3;

    state = apply(state, "runner", (action) => action.type === "access_card");
    state = apply(state, "corp", (action) => action.type === "resolve_choice");

    expect(state.cardInstances[breakerId]?.counters?.breaker_strength_penalty).toBe(1);
    const runnerView = getPlayerView(state, "runner");
    const visibleBreaker = runnerView.own.rig?.find(
      (card) => card.instanceId === breakerId,
    );
    expect(visibleBreaker?.counterDisplays).toContainEqual(
      expect.objectContaining({
        id: "breaker_strength_penalty",
        counterType: "breaker_strength_penalty",
        amount: 1,
      }),
    );
    state.cardInstances[breakerId] = {
      ...state.cardInstances[breakerId]!,
      counters: { breaker_strength_penalty: 4 },
    };
    const reducedView = getPlayerView(state, "runner");
    const reducedBreaker = reducedView.own.rig?.find(
      (card) => card.instanceId === breakerId,
    );
    expect(reducedBreaker?.strength).toBe(-1);
  });

  it("shuffles Bel-Digmo on rez and Stereogram on Archives access without leaking R&D order", () => {
    let state = createGame({
      seed: "proteus-8b-shuffle-antibodies",
      setupMode: "completed",
    });
    const serverId = "remote_1";
    state.corp.servers.push({
      id: serverId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
    const server = state.corp.servers.find((candidate) => candidate.id === serverId);
    if (!server) throw new Error("Missing remote");
    const belId = "proteus_8b_bel" as CardInstanceId;
    state.cardInstances[belId] = corpCard(
      belId,
      "onr_proteus_054_bel-digmo-antibody",
      { side: "corp", zone: "serverRoot", serverId },
    );
    server.root.push(belId);
    state.activeSide = "corp";
    state.phase = "run";
    state.timingPoint = "run.jack_out_window";
    state.run = {
      runId: "run_1",
      attackedServerId: serverId,
      phase: "movement",
      position: { kind: "server", serverId },
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: true,
    };
    state = apply(
      state,
      "corp",
      (action) => action.type === "rez_ice" && action.source === belId,
    );
    expect(state.corp.rd).toContain(belId);
    expect(state.cardInstances[belId]?.zone).toEqual({ side: "corp", zone: "rd" });
    const belPayload = state.eventLog.at(-1)?.publicPayload;
    expect(belPayload).toMatchObject({
      hiddenZoneAction: "shuffle_source_into_corp_rd",
    });
    expect((belPayload?.amounts as { movedCardCount?: number } | undefined)?.movedCardCount).toBe(1);

    state = accessFixture("onr_proteus_075_stereogram-antibody", "archives");
    const stereogramId = state.run?.breach?.queue[0]?.cardInstanceId;
    expect(stereogramId).toBeDefined();
    state = apply(state, "runner", (action) => action.type === "access_card");
    expect(stereogramId ? state.corp.rd.includes(stereogramId) : false).toBe(true);
    const stereogramPayload = state.eventLog.at(-1)?.publicPayload;
    expect(stereogramPayload).toMatchObject({
      damageType: "net",
      damageAmount: 1,
      hiddenZoneAction: "shuffle_source_into_corp_rd",
    });
    expect(
      (stereogramPayload?.amounts as { movedCardCount?: number } | undefined)
        ?.movedCardCount,
    ).toBe(1);
  });
});
