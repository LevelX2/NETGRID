import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import type { CardInstanceId, GameState, Side } from "@netgrid/shared";

function apply(
  state: GameState,
  side: Side,
  predicate: (action: ReturnType<typeof getLegalActions>[number]) => boolean,
): GameState {
  const action = getLegalActions(state, side).find(predicate);
  expect(action).toBeDefined();
  if (!action) throw new Error("Missing action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function proteusPurgeFixture(): GameState {
  const state = createGame({
    seed: "proteus-8a-purge-foundation",
    setupMode: "completed",
  });
  state.activeSide = "corp";
  state.phase = "run";
  state.timingPoint = "run.jack_out_window";
  state.corp.clicks = 0;
  state.runnerVirusPurgeWindow = {
    windowId: "run_1.special_effect.1",
    timingFamily: "run_special_effect",
  };
  state.purgeableRunnerVirusCounters = {
    corp: { tax: 2 },
    servers: { rd: { socket_rd: 1 } },
    effects: {
      public_doom_roll: {
        counterType: "doom",
        amount: 1,
        publicLabel: "Doom-Counter",
      },
    },
  };
  state.cardInstances[state.corp.identity] = {
    ...state.cardInstances[state.corp.identity]!,
    counters: {
      virus: 4,
      link_reduction_counter: 2,
      breaker_strength_penalty: 1,
    },
  };
  return state;
}

describe("Proteus Phase 8a purgeable Runner-virus foundation", () => {
  it("projects a non-main purge LegalAction and purges only registered Runner-virus counters", () => {
    const state = proteusPurgeFixture();
    const initial = structuredClone(state);
    const legalActions = getLegalActions(state, "corp");
    const purge = legalActions.find(
      (action) => action.type === "purge_runner_virus_counters",
    );

    expect(purge).toMatchObject({
      side: "corp",
      source: "game_rule",
      costs: [],
      payload: {
        purgeModel: "future_action_debt",
        actionDebtAdded: 3,
        timingWindowId: "run_1.special_effect.1",
      },
    });
    expect(legalActions.map((action) => action.type)).not.toContain(
      "purge_virus_counters",
    );
    expect(getLegalActions(state, "runner")).toEqual([]);

    if (!purge) throw new Error("Missing Proteus purge action");
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: purge.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.error.message);
    const next = result.state;

    expect(next.purgeableRunnerVirusCounters).toBeUndefined();
    expect(next.cardInstances[next.corp.identity]?.counters).toMatchObject({
      virus: 4,
      link_reduction_counter: 2,
      breaker_strength_penalty: 1,
    });
    expect(next.corp.clicks).toBe(0);
    expect(next.corpActionDebt).toMatchObject({
      forgoActionsPending: 3,
      entries: [
        {
          reason: "proteus_virus_purge",
          remaining: 3,
          createdAtStateVersion: state.stateVersion,
          source: "proteus_purge",
        },
      ],
    });
    expect(next.eventLog.at(-1)?.visibilityClass).toBe("public");
    expect(next.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "purge_runner_virus_counters",
      purgeModel: "future_action_debt",
      purgedCounterType: "runner_virus",
      purgedRunnerVirusCounters: 4,
      actionDebtAdded: 3,
      corpActionDebtTotalAfter: 3,
      timingWindowId: "run_1.special_effect.1",
      timingFamily: "run_special_effect",
    });
    expect(String(next.eventLog.at(-1)?.publicPayload.purgedCounterSummary))
      .toContain("corp:tax=2");
    expect(next.randomDrawRecords).toEqual(initial.randomDrawRecords);
    expect(
      replayEvents(initial, next.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(next));
  });

  it("projects public-safe counter displays for corp and server scoped counters", () => {
    const state = proteusPurgeFixture();
    const runnerView = getPlayerView(state, "runner");
    const corpTaxDisplay = runnerView.opponent.identity.counterDisplays?.find(
      (display) => display.id === "runner_virus_corp_tax",
    );
    const rdSocketDisplay = runnerView.servers
      .find((server) => server.id === "rd")
      ?.counterDisplays?.find(
        (display) => display.id === "runner_virus_server_rd_socket_rd",
      );

    expect(corpTaxDisplay).toMatchObject({
      amount: 2,
      displayKind: "virus",
      counterType: "tax",
      usageHint: "status_marker",
    });
    expect(rdSocketDisplay).toMatchObject({
      amount: 1,
      displayKind: "virus",
      counterType: "socket_rd",
      usageHint: "status_marker",
    });
  });

  it("uses LegalActions to deterministically pay down Corp action debt after mandatory draw", () => {
    let state = proteusPurgeFixture();
    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_runner_virus_counters",
    );
    state.phase = "corp_draw_phase";
    state.timingPoint = "corp_draw.mandatory_draw";
    state.activeSide = "corp";
    state.corp.clicks = 3;

    expect(getLegalActions(state, "corp").map((action) => action.type)).toEqual([
      "mandatory_draw",
    ]);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.corpActionDebt?.forgoActionsPending).toBe(3);

    for (const expectedDebtBefore of [3, 2, 1]) {
      const actionTypes = getLegalActions(state, "corp").map(
        (action) => action.type,
      );
      expect(actionTypes).toEqual(["forgo_action"]);
      const before = state.stateVersion;
      state = apply(state, "corp", (action) => action.type === "forgo_action");
      expect(state.stateVersion).toBe(before + 1);
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        actionType: "forgo_action",
        actionDebtPaid: 1,
        corpActionDebtTotalBefore: expectedDebtBefore,
        corpActionDebtTotalAfter: expectedDebtBefore - 1,
      });
    }

    expect(state.corpActionDebt).toBeUndefined();
    expect(state.corp.clicks).toBe(0);
    expect(getLegalActions(state, "corp").map((action) => action.type)).toEqual([
      "end_turn",
    ]);
  });

  it("offers Runner-virus purge in the normal Corp action phase and creates future action debt", () => {
    let state = createGame({
      seed: "proteus-8a-main-phase-runner-virus-purge",
      setupMode: "completed",
    });
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.purgeableRunnerVirusCounters = {
      corp: { vienna: 2 },
    };

    const purge = getLegalActions(state, "corp").find(
      (action) => action.type === "purge_runner_virus_counters",
    );
    expect(purge).toMatchObject({
      label: "Runner-Virus-Counter purgen (3 Aktionen aussetzen)",
      costs: [],
      payload: {
        purgeModel: "future_action_debt",
        actionDebtAdded: 3,
        timingFamily: "corp_main_action",
      },
    });

    state = apply(
      state,
      "corp",
      (action) => action.type === "purge_runner_virus_counters",
    );

    expect(state.purgeableRunnerVirusCounters).toBeUndefined();
    expect(state.corp.clicks).toBe(3);
    expect(state.corpActionDebt).toMatchObject({
      forgoActionsPending: 3,
    });
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "purge_runner_virus_counters",
      purgedRunnerVirusCounters: 2,
      actionDebtAdded: 3,
      timingFamily: "corp_main_action",
    });
    expect(getLegalActions(state, "corp").map((action) => action.type)).toEqual([
      "forgo_action",
    ]);
  });

  it("applies Tax and Pipe counters at Corp start of turn", () => {
    let state = createGame({
      seed: "proteus-8d-tax-pipe-start",
      setupMode: "completed",
    });
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 0;
    state.corp.credits = 5;
    state.purgeableRunnerVirusCounters = {
      corp: { tax: 5, pipe: 2 },
    };

    state = apply(state, "runner", (action) => action.type === "end_turn");

    expect(state.activeSide).toBe("corp");
    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(state.corp.credits).toBe(3);
    expect(state.corpActionDebt).toMatchObject({
      forgoActionsPending: 2,
      entries: [
        {
          reason: "pipe_counter",
          remaining: 2,
          source: "start_of_turn_effect",
        },
      ],
    });
    expect(state.eventLog.at(-1)?.publicPayload.resolvedEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "lose_credits",
          side: "corp",
          amount: 2,
          sourceDefinitionId: "onr_proteus_097_taxman",
        }),
        expect.objectContaining({
          kind: "counter_change",
          counterType: "pipe",
          amount: 2,
          sourceDefinitionId: "onr_proteus_099_viral-pipeline",
        }),
      ]),
    );
  });

  it("resolves Scaldan start-of-turn dice through RandomDrawRecords and the Bad-Publicity gate", () => {
    let state = createGame({
      seed: "proteus-8f-scaldan-start",
      setupMode: "completed",
    });
    state.activeSide = "runner";
    state.phase = "runner_action_phase";
    state.timingPoint = "runner_action.main";
    state.runner.clicks = 0;
    state.corp.badPublicity = 6;
    state.purgeableRunnerVirusCounters = {
      corp: { scaldan: 12 },
    };
    const initial = structuredClone(state);

    state = apply(state, "runner", (action) => action.type === "end_turn");

    const resolvedEffects = state.eventLog.at(-1)?.publicPayload
      .resolvedEffects as Array<{ counterType?: unknown; dieRoll?: unknown }> | undefined;
    const scaldanEffects =
      resolvedEffects?.filter((effect) => effect.counterType === "scaldan") ?? [];
    const hitCount = scaldanEffects.filter(
      (effect: { dieRoll?: unknown }) => Number(effect.dieRoll) >= 5,
    ).length;

    expect(scaldanEffects).toHaveLength(12);
    expect(state.randomDrawRecords.slice(initial.randomDrawRecords.length)).toHaveLength(
      12,
    );
    expect(scaldanEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          counterType: "scaldan",
          dieSize: 6,
          sourceDefinitionId: "onr_proteus_094_scaldan",
        }),
      ]),
    );
    expect(hitCount).toBeGreaterThan(0);
    expect(state.corp.badPublicity).toBe(6 + hitCount);
    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("bad_publicity_7");
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(state));
  });

  it("resolves Armageddon Doom install rolls through corp install LegalActions", () => {
    let state = createGame({
      seed: "proteus-8f-armageddon-install",
      setupMode: "completed",
    });
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 20;
    state.purgeableRunnerVirusCounters = {
      corp: { doom: 30 },
    };
    const initial = structuredClone(state);
    const installAction = getLegalActions(state, "corp").find(
      (action) =>
        action.type === "install_card" &&
        typeof action.payload?.cardId === "string",
    );
    expect(installAction).toBeDefined();
    if (!installAction) throw new Error("Missing corp install action");
    const installedCardId = installAction.payload?.cardId as CardInstanceId;

    state = apply(
      state,
      "corp",
      (action) => action.actionId === installAction.actionId,
    );

    const publicPayload = state.eventLog.at(-1)?.publicPayload;
    const randomRecords = state.randomDrawRecords.slice(
      initial.randomDrawRecords.length,
    );
    const rolls = randomRecords
      .filter((record) =>
        String(record.purpose).includes("proteus.armageddon.install"),
      )
      .map((record) => Math.floor(record.value * 6) + 1);
    const hitCount = rolls.filter((roll) => roll === 6).length;

    expect(rolls).toHaveLength(30);
    expect(randomRecords).toHaveLength(30);
    expect(publicPayload).toMatchObject({
      actionType: "install_card",
    });
    expect(publicPayload).not.toHaveProperty("proteusDoomInstallRolls");
    expect(publicPayload).not.toHaveProperty("proteusDoomRandomPurposes");
    expect(hitCount).toBeGreaterThan(0);
    expect(state.purgeableRunnerVirusCounters?.corp?.doom).toBe(30 - hitCount);
    expect(state.cardInstances[installedCardId]?.zone).toMatchObject({
      side: "corp",
      zone: "archives",
    });
    expect(publicPayload).not.toHaveProperty("trashedInstalledCardDefinitionId");
    expect(
      replayEvents(initial, state.eventLog.slice(initial.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(state));
  });
});
