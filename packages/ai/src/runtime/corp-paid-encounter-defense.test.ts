import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import { chooseAiAction } from "../index";
import { buildAiDecisionInputDto } from "../input-dto";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { selectAiDecisionSideForState } from "./ai-decision-input";

const RIDDLER = "onr_proteus_034_riddler";
const ICEBERG = "onr_proteus_027_iceberg";

function fixture(definitionId = RIDDLER, corpCredits = 6) {
  let state = createGameAfterSetup({
    seed: `paid-encounter-${definitionId}`,
    corpDeck: {
      id: "paid_encounter_defense_fixture",
      name: "Paid encounter defense",
      side: "corp",
      identity: "corp_identity_001",
      cards: [
        { id: RIDDLER, quantity: 3 },
        { id: ICEBERG, quantity: 3 },
        { id: "onr_classic_003_unlisted-research-lab", quantity: 3 },
        { id: "onr_classic_004_theorem-proof", quantity: 2 },
        { id: "onr_classic_018_reclamation-project", quantity: 10 },
      ],
    },
  });
  delete state.pendingChoice;
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  state.runner.clicks = 4;
  state.runner.credits = 2;
  state.corp.credits = corpCredits;
  const iceId = Object.values(state.cardInstances).find(
    (card) => card.definitionId === definitionId,
  )!.instanceId;
  state.corp.hq = state.corp.hq.filter((id) => id !== iceId);
  state.corp.rd = state.corp.rd.filter((id) => id !== iceId);
  state.corp.servers.find((server) => server.id === "hq")!.ice.push(iceId);
  Object.assign(state.cardInstances[iceId]!, {
    zone: { side: "corp", zone: "serverIce", serverId: "hq" },
    faceup: true,
    rezzed: true,
  });
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "hq",
    )!,
  );
  if (state.timingPoint === "run.approach_ice")
    state = apply(
      state,
      getLegalActions(state, "corp").find(
        (action) => action.type === "decline_rez",
      )!,
    );
  expect(state.timingPoint).toBe("run.encounter_ice");
  return state;
}

function apply(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `paid-${state.stateVersion}-${action.actionId}`,
  });
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.state;
}

function input(state: GameState) {
  return buildAiDecisionInputDto({
    side: "corp",
    playerView: getPlayerView(state, "corp"),
    legalActions: getLegalActions(state, "corp"),
    eventTail: [],
    difficulty: "normal",
    seed: state.seed,
    decisionId: `paid-${state.stateVersion}`,
    actionNumber: 1,
    profileId: "paid-encounter-test",
  });
}

function choose(state: GameState) {
  resetResidentPlanPortfolioMemory();
  return chooseAiAction(input(state), {
    persistTacticalPlanMemory: false,
    corpTurnPlannerMode: "legacy_compare",
  });
}

function installDecoder(
  state: GameState,
  strengthModifier: number,
  definitionId = "simple_decoder",
) {
  const instanceId = "paid_test_decoder";
  state.cardInstances[instanceId] = {
    instanceId,
    definitionId,
    owner: "runner",
    controller: "runner",
    zone: { side: "runner", zone: "rig" },
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier,
  };
  state.runner.rig.programs.push(instanceId);
  state.runner.credits = 10;
}

describe("paid encounter defense through normal Engine and plan ownership", () => {
  it.each([RIDDLER, ICEBERG])(
    "offers Corp activation and pass before Runner continuation for %s",
    (definitionId) => {
      let state = fixture(definitionId);
      const initial = structuredClone(state),
        eventStart = state.eventLog.length;
      expect(getLegalActions(state, "runner")).toEqual([]);
      expect(selectAiDecisionSideForState(state).side).toBe("corp");
      const activation = getLegalActions(state, "corp").find(
        (action) => action.type === "activated_card_ability",
      )!;
      const decision = choose(state);
      expect(decision).toMatchObject({
        actionId: activation.actionId,
        reasonCode: "plan_first.corp.defend_servers",
        fallbackUsed: false,
        decisionDebug: {
          planFirstDecision: {
            rootPlanInstanceId:
              "plan:corp.defend_servers:server-defense-portfolio",
            leafExecutorInstanceId:
              "plan:corp.defend_servers:server-defense-portfolio",
            route: { actionId: activation.actionId },
          },
        },
      });
      state = apply(state, activation);
      expect(state.corp.credits).toBe(4);
      const pass = getLegalActions(state, "corp").find(
        (action) => action.type === "continue_run",
      )!;
      expect(choose(state).actionId).toBe(pass.actionId);
      state = apply(state, pass);
      expect(getLegalActions(state, "corp")).toEqual([]);
      expect(selectAiDecisionSideForState(state).side).toBe("runner");
      state = apply(
        state,
        getLegalActions(state, "runner").find(
          (action) => action.type === "continue_run",
        )!,
      );
      expect(state.run).toBeUndefined();
      const replay = replayEvents(initial, state.eventLog.slice(eventStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it("does not invent a Corp window without an affordable ability", () => {
    const state = fixture(RIDDLER, 1);
    expect(getLegalActions(state, "corp")).toEqual([]);
    expect(selectAiDecisionSideForState(state).side).toBe("runner");
  });

  it("passes against an already strong one-credit decoder instead of paying two", () => {
    const state = fixture();
    installDecoder(state, 2);
    const pass = getLegalActions(state, "corp").find(
      (action) => action.type === "continue_run",
    )!;
    expect(
      input(state).playerView.servers.find((server) => server.id === "hq")!
        .ice[0]!.currentEncounterDefenseQuotes![0]!.exchange,
    ).toMatchObject({
      complete: true,
      runnerBreak: { requiredCredits: 1, normalCreditsRequired: 1 },
    });
    expect(choose(state).actionId).toBe(pass.actionId);
  });

  it("reopens the response after a Runner pump without buying a redundant ETR", () => {
    let state = fixture();
    installDecoder(state, 0);
    const activation = getLegalActions(state, "corp").find(
      (action) => action.type === "activated_card_ability",
    )!;
    expect(choose(state).actionId).toBe(activation.actionId);
    state = apply(state, activation);
    state = apply(
      state,
      getLegalActions(state, "corp").find(
        (action) => action.type === "continue_run",
      )!,
    );
    const pump = getLegalActions(state, "runner").find(
      (action) => action.type === "pump_breaker",
    )!;
    state = apply(state, pump);
    expect(selectAiDecisionSideForState(state).side).toBe("corp");
    expect(choose(state).actionId).toBe(
      getLegalActions(state, "corp").find(
        (action) => action.type === "continue_run",
      )!.actionId,
    );
    expect(state.corp.credits).toBe(4);
  });

  it("fails closed when the exact activation quote is missing", () => {
    const state = fixture(),
      current = input(state);
    delete current.playerView.servers.find((server) => server.id === "hq")!
      .ice[0]!.currentEncounterDefenseQuotes;
    expect(() =>
      chooseAiAction(current, {
        persistTacticalPlanMemory: false,
        corpTurnPlannerMode: "legacy_compare",
      }),
    ).toThrow(/missing_plan_module_coverage/);
  });

  it("does not price a prohibited break as an available one-credit answer", () => {
    const state = fixture();
    installDecoder(state, 2);
    state.run!.noBreakSubroutinesActive = true;
    expect(choose(state).actionId).toBe(
      getLegalActions(state, "corp").find(
        (action) => action.type === "activated_card_ability",
      )!.actionId,
    );
  });

  it("keeps a choice-dependent breaker unresolved instead of claiming no eligible breaker", () => {
    const state = fixture();
    installDecoder(state, 2, "onr_proteus_088_fubar");
    const exchange = input(state).playerView.servers.find(
      (server) => server.id === "hq",
    )!.ice[0]!.currentEncounterDefenseQuotes![0]!.exchange;
    expect(exchange).toMatchObject({
      complete: false,
      reason: "visible_runner_break_projection_unknown",
    });
    expect(choose(state).actionId).toBe(
      getLegalActions(state, "corp").find(
        (action) => action.type === "continue_run",
      )!.actionId,
    );
  });

  it("keeps the response quote Corp-only and rejects stale or wrong-side activation", () => {
    const state = fixture();
    const activation = getLegalActions(state, "corp").find(
      (action) => action.type === "activated_card_ability",
    )!;
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "currentEncounterDefenseQuotes",
    );
    const dto = input(state);
    expect(
      dto.playerView.servers.find((server) => server.id === "hq")!.ice[0]!
        .currentEncounterDefenseQuotes![0]!.actionId,
    ).toBe(activation.actionId);
    for (const [side, version] of [
      ["runner", state.stateVersion],
      ["corp", state.stateVersion - 1],
    ] as const) {
      expect(
        applyAction(state, {
          matchId: state.matchId,
          side,
          actionId: activation.actionId,
          clientKnownStateVersion: version,
          idempotencyKey: `invalid-${side}`,
        }).ok,
      ).toBe(false);
    }
  });
});
