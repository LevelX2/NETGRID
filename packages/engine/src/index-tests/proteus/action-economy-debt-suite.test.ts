import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  ONR_V1_1_2K_CORP_DECK,
  ONR_V1_1_2K_RUNNER_DECK,
  apply,
  applyChoice,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type ServerId,
  type Side,
} from "@netgrid/shared";

const AI_BOARD_MEMBER = "onr_proteus_001_ai-board-member";
const PDCA = "onr_proteus_006_please-dont-choke-anyone";
const PROJECT_VENICE = "onr_proteus_007_project-venice";
const CORPORATE_HEADHUNTERS = "onr_proteus_003_corporate-headhunters";
const CORPORATE_GUARD_TEMPS = "onr_proteus_046_corporate-guard-r-temps";
const CREDIT_CONSOLIDATION = "onr_proteus_047_credit-consolidation";
const BARGAIN_WITH_VIACOX = "onr_proteus_131_bargain-with-viacox";
const LUCIDRINE_DRIP_FEED = "onr_proteus_144_lucidrinetm-drip-feed";
const INSTALLABLE_CORP_ASSET = "onr_v1_309_bbs-whispering-campaign";
const RUNNER_EVENT = "onr_v1_077_anonymous-tip";
const RUNNER_INSTALLABLE_HARDWARE = "onr_v1_144_tycho-mem-chip";
const CORP_OPERATION = "onr_v1_290_efficiency-experts";

function baseState(seed: string): GameState {
  const state = toRunnerTurn(
    createGameAfterSetup({
      seed,
      baseline: CURRENT_RULES_BASELINE,
      agendaPointsToWin: 7,
      runnerDeck: {
        ...ONR_V1_1_2K_RUNNER_DECK,
        id: `${seed}_runner`,
        cards: [...ONR_V1_1_2K_RUNNER_DECK.cards],
      },
      corpDeck: {
        ...ONR_V1_1_2K_CORP_DECK,
        id: `${seed}_corp`,
        cards: [...ONR_V1_1_2K_CORP_DECK.cards],
      },
    }),
  );
  state.runner.credits = 30;
  state.runner.clicks = 4;
  state.corp.credits = 30;
  state.corp.clicks = 3;
  return state;
}

function applyLegal(state: GameState, side: Side, action: LegalAction): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-${action.actionId}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function applyOptionalDiscard(state: GameState, side: Side): GameState {
  if (state.pendingChoice?.source !== "discard_phase") return state;
  if (state.pendingChoice.side !== side) return state;
  const selectedOptionIds = state.pendingChoice.options
    .slice(0, state.pendingChoice.maxSelections)
    .map((option) => String(option.id));
  const actionToResolve = getLegalActions(state, side).find(
    (action) => action.type === "resolve_choice",
  );
  if (!actionToResolve) throw new Error("Discard-Choice ist nicht legal.");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: actionToResolve.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${side}-${state.stateVersion}-discard-all`,
    selectedChoices: {
      choiceId: state.pendingChoice.choiceId,
      selectedOptionIds,
    },
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function nextCorpActionPhase(state: GameState): GameState {
  let next = apply(state, "runner", (action) => action.type === "end_turn");
  next = applyOptionalDiscard(next, "runner");
  next = apply(next, "corp", (action) => action.type === "mandatory_draw");
  return next;
}

function nextRunnerActionPhase(state: GameState): GameState {
  let next = apply(state, "runner", (action) => action.type === "end_turn");
  next = applyOptionalDiscard(next, "runner");
  next = apply(next, "corp", (action) => action.type === "mandatory_draw");
  next = apply(next, "corp", (action) => action.type === "end_turn");
  next = applyOptionalDiscard(next, "corp");
  return next;
}

function addRemote(state: GameState, id: Exclude<ServerId, "new_remote">): void {
  if (state.corp.servers.some((server) => server.id === id)) return;
  state.corp.servers.push({ id, kind: "remote", label: "Remote 1", ice: [], root: [] });
}

function addCorpHq(state: GameState, definitionId: string, id: string): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.corp.hq.unshift(cardId);
  state.cardInstances[cardId] = cardInstance(cardId, definitionId, "corp", {
    side: "corp",
    zone: "hq",
  });
  return cardId;
}

function addRunnerGrip(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.runner.grip.unshift(cardId);
  state.cardInstances[cardId] = cardInstance(cardId, definitionId, "runner", {
    side: "runner",
    zone: "grip",
  });
  return cardId;
}

function installRunnerCard(
  state: GameState,
  definitionId: string,
  id: string,
  zone: "resources" | "hardware",
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.runner.rig[zone].push(cardId);
  state.cardInstances[cardId] = cardInstance(cardId, definitionId, "runner", {
    side: "runner",
    zone: "rig",
  });
  state.cardInstances[cardId]!.faceup = true;
  state.cardInstances[cardId]!.rezzed = true;
  return cardId;
}

function scoreCorpAgenda(
  state: GameState,
  definitionId: string,
  id: string,
  counters = 0,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...cardInstance(cardId, definitionId, "corp", {
      side: "corp",
      zone: "scoreArea",
    }),
    faceup: true,
    rezzed: true,
    advancementCounters: counters,
  };
  return cardId;
}

function installCorpAgendaInRemote(
  state: GameState,
  definitionId: string,
  id: string,
  counters: number,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  addRemote(state, "remote_1");
  const server = state.corp.servers.find((candidate) => candidate.id === "remote_1")!;
  server.root.push(cardId);
  state.cardInstances[cardId] = {
    ...cardInstance(cardId, definitionId, "corp", {
      side: "corp",
      zone: "serverRoot",
      serverId: "remote_1",
    }),
    advancementCounters: counters,
  };
  return cardId;
}

function cardInstance(
  cardId: CardInstanceId,
  definitionId: string,
  owner: Side,
  zone: GameState["cardInstances"][CardInstanceId]["zone"],
): GameState["cardInstances"][CardInstanceId] {
  return {
    instanceId: cardId,
    definitionId: definitionId as CardDefinitionId,
    owner,
    controller: owner,
    zone,
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
}

function removeEverywhere(state: GameState, cardId: CardInstanceId): void {
  state.corp.hq = state.corp.hq.filter((id) => id !== cardId);
  state.corp.rd = state.corp.rd.filter((id) => id !== cardId);
  state.corp.archives = state.corp.archives.filter((id) => id !== cardId);
  state.corp.scoreArea = state.corp.scoreArea.filter((id) => id !== cardId);
  state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
  state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
  state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
  state.runner.rig.resources = state.runner.rig.resources.filter((id) => id !== cardId);
  state.runner.rig.hardware = state.runner.rig.hardware.filter((id) => id !== cardId);
  for (const server of state.corp.servers) {
    server.root = server.root.filter((id) => id !== cardId);
    server.ice = server.ice.filter((id) => id !== cardId);
  }
  delete state.cardInstances[cardId];
}

function clearRunnerGrip(state: GameState): void {
  for (const cardId of state.runner.grip) delete state.cardInstances[cardId];
  state.runner.grip = [];
}

function expectReplayStable(before: GameState, after: GameState): void {
  const replay = replayEvents(before, after.eventLog.slice(before.eventLog.length));
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(after));
}

function aiBoardStateForRoll(roll: number): GameState {
  for (let index = 0; index < 300; index += 1) {
    const state = baseState(`pro017-ai-${roll}-${index}`);
    scoreCorpAgenda(state, AI_BOARD_MEMBER, `ai_${index}`);
    addCorpHq(state, INSTALLABLE_CORP_ASSET, `corp_asset_${index}`);
    const next = nextCorpActionPhase(state);
    if (next.actionEconomy?.pendingOffer?.dieRoll === roll) return next;
  }
  throw new Error(`No AI Board Member seed for roll ${roll}`);
}

function viacoxStateForRoll(
  roll: number,
  gripDefinitionId = RUNNER_INSTALLABLE_HARDWARE,
): GameState {
  for (let index = 0; index < 500; index += 1) {
    const state = baseState(`pro017-viacox-${roll}-${index}`);
    clearRunnerGrip(state);
    installRunnerCard(state, BARGAIN_WITH_VIACOX, `viacox_${index}`, "resources");
    addRunnerGrip(state, gripDefinitionId, `runner_grip_${index}`);
    addRemote(state, "remote_1");
    const next = nextRunnerActionPhase(state);
    if (next.actionEconomy?.grants?.[0]?.dieRoll === roll) return next;
  }
  throw new Error(`No Bargain with Viacox seed for roll ${roll}`);
}

describe("Proteus PRO017 action economy and debt suite", () => {
  it("AI Board Member offers optional restricted action families and filters the bound extra click", () => {
    const cases = [
      { roll: 1, expected: ["install_card"] },
      { roll: 2, expected: ["gain_credit"] },
      { roll: 3, expected: ["gain_credit"] },
      { roll: 4, expected: ["draw_card"] },
      { roll: 5, expected: ["draw_card"] },
      { roll: 6, expected: ["draw_card"] },
    ];
    for (const testCase of cases) {
      let state = aiBoardStateForRoll(testCase.roll);
      const offerActions = getLegalActions(state, "corp");
      expect(offerActions.map((action) => action.payload?.actionEconomyAbility).sort())
        .toEqual(["accept_extra_action_offer", "decline_extra_action_offer"]);

      const declined = apply(
        state,
        "corp",
        (action) =>
          action.payload?.actionEconomyAbility === "decline_extra_action_offer",
      );
      expect(declined.actionEconomy?.grants ?? []).toHaveLength(0);

      state = aiBoardStateForRoll(testCase.roll);
      state = apply(
        state,
        "corp",
        (action) => action.payload?.actionEconomyAbility === "accept_extra_action_offer",
      );
      state.corp.clicks = 1;
      const filteredTypes = new Set(
        getLegalActions(state, "corp").map((action) => action.type),
      );
      expect([...filteredTypes].filter((type) => type !== "end_turn").sort())
        .toEqual(testCase.expected);
    }
  });

  it("Please Don't Choke Anyone opens a Corp choice instead of auto-replacing damage", () => {
    let state = nextCorpActionPhase(baseState("pro017-pdca"));
    const pdcaId = scoreCorpAgenda(state, PDCA, "pdca");
    scoreCorpAgenda(state, CORPORATE_HEADHUNTERS, "headhunter");
    state.runner.tags = 1;
    clearRunnerGrip(state);
    addRunnerGrip(state, RUNNER_EVENT, "runner_event_pdca");

    state = apply(
      state,
      "corp",
      (action) => action.payload?.agendaAbility === "proteus_corporate_headhunters",
    );
    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      source: expect.stringContaining(`proteus.pdca_damage_replacement:${pdcaId}`),
    });
    expect(state.cardInstances[pdcaId]?.counters?.pdca).toBeUndefined();
    expect(state.runner.grip).toHaveLength(1);
  });

  it("Please Don't Choke Anyone can pass the damage through, including flatline", () => {
    let state = nextCorpActionPhase(baseState("pro017-pdca-pass"));
    scoreCorpAgenda(state, PDCA, "pdca_pass");
    scoreCorpAgenda(state, CORPORATE_HEADHUNTERS, "headhunter_pass");
    state.runner.tags = 1;
    clearRunnerGrip(state);

    state = apply(
      state,
      "corp",
      (action) => action.payload?.agendaAbility === "proteus_corporate_headhunters",
    );
    state = applyChoice(state, "corp", "pass");
    expect(state.runner.grip).toHaveLength(0);
    expect(state.winner).toBe("corp");
    expect(state.gameEndReason).toBe("flatline");
  });

  it("Please Don't Choke Anyone can replace the full damage slice with PDCA counters", () => {
    let state = nextCorpActionPhase(baseState("pro017-pdca-replace"));
    const pdcaId = scoreCorpAgenda(state, PDCA, "pdca_replace");
    scoreCorpAgenda(state, CORPORATE_HEADHUNTERS, "headhunter_replace");
    state.runner.tags = 1;
    clearRunnerGrip(state);
    addRunnerGrip(state, RUNNER_EVENT, "runner_event_pdca_replace");

    state = apply(
      state,
      "corp",
      (action) => action.payload?.agendaAbility === "proteus_corporate_headhunters",
    );
    const replaceOption = state.pendingChoice?.options.find((option) =>
      String(option.id).startsWith("replace_"),
    )?.id;
    expect(replaceOption).toBeDefined();
    state = applyChoice(state, "corp", String(replaceOption));
    expect(state.cardInstances[pdcaId]?.counters?.pdca).toBe(1);
    expect(state.runner.grip).toHaveLength(1);

    const beforeClicks = state.corp.clicks;
    state = apply(
      state,
      "corp",
      (action) => action.payload?.actionEconomyAbility === "pdca_counter_gain_action",
    );
    expect(state.corp.clicks).toBe(beforeClicks + 1);
    expect(state.cardInstances[pdcaId]?.counters?.pdca ?? 0).toBe(0);
    expect(
      getLegalActions(state, "corp").some(
        (action) => action.payload?.actionEconomyAbility === "pdca_counter_gain_action",
      ),
    ).toBe(false);
  });

  it("Please Don't Choke Anyone rejects stale or invalid choices", () => {
    let state = nextCorpActionPhase(baseState("pro017-pdca-invalid"));
    scoreCorpAgenda(state, PDCA, "pdca_invalid");
    scoreCorpAgenda(state, CORPORATE_HEADHUNTERS, "headhunter_invalid");
    state.runner.tags = 1;
    clearRunnerGrip(state);
    addRunnerGrip(state, RUNNER_EVENT, "runner_event_pdca_invalid");

    state = apply(
      state,
      "corp",
      (action) => action.payload?.agendaAbility === "proteus_corporate_headhunters",
    );
    const choiceAction = getLegalActions(state, "corp").find(
      (action) => action.type === "resolve_choice",
    )!;
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      idempotencyKey: "stale-pdca-choice",
      selectedChoices: { selectedOptionIds: ["pass"] },
    });
    expect(stale.ok).toBe(false);
    const invalid = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: choiceAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "invalid-pdca-choice",
      selectedChoices: { selectedOptionIds: ["replace_missing_pdca"] },
    });
    expect(invalid.ok).toBe(false);
  });

  it("Project Venice records overadvance at score and grants recurring Corp actions", () => {
    let state = nextCorpActionPhase(baseState("pro017-venice"));
    const veniceId = installCorpAgendaInRemote(state, PROJECT_VENICE, "venice", 10);
    state = apply(
      state,
      "corp",
      (action) => action.type === "score_agenda" && action.payload?.cardId === veniceId,
    );
    expect(state.cardInstances[veniceId]?.counters?.mark).toBe(2);

    state = nextCorpActionPhase(toRunnerTurnFromCorpAction(state));
    expect(state.corp.clicks).toBe(5);
  });

  it("Corporate Guard(R) Temps pays X, grants future actions, and forfeits multi-credit gains proportionally", () => {
    let state = nextCorpActionPhase(baseState("pro017-temps"));
    const tempsId = addCorpHq(state, CORPORATE_GUARD_TEMPS, "temps");
    state.corp.credits = 20;
    state = apply(
      state,
      "corp",
      (action) => action.type === "play_operation" && action.payload?.cardId === tempsId && action.payload?.xValue === 2,
    );
    expect(state.corp.credits).toBe(16);
    expect(state.actionEconomy?.corpCreditForfeitDebt?.remaining).toBe(2);

    const creditId = addCorpHq(state, CREDIT_CONSOLIDATION, "credit_consolidation");
    state = apply(
      state,
      "corp",
      (action) => action.type === "play_operation" && action.payload?.cardId === creditId,
    );
    expect(state.corp.credits).toBe(19);
    expect(state.actionEconomy?.corpCreditForfeitDebt).toBeUndefined();

    state = nextCorpActionPhase(toRunnerTurnFromCorpAction(state));
    expect(state.corp.clicks).toBe(4);
  });

  it("Bargain with Viacox starts next turn, forces all six deterministic outcomes, and replays stably", () => {
    const expectedByRoll: Record<number, LegalAction["type"][]> = {
      1: ["draw_card"],
      2: ["gain_credit"],
      3: ["start_run"],
      4: ["start_run"],
      5: ["start_run"],
      6: ["install_card"],
    };
    for (let roll = 1; roll <= 6; roll += 1) {
      const state = viacoxStateForRoll(roll);
      const actions = getLegalActions(state, "runner");
      expect(new Set(actions.map((action) => action.type))).toEqual(
        new Set(expectedByRoll[roll]),
      );
      expect(state.randomDrawRecords.some((record) => record.purpose.includes("viacox")))
        .toBe(true);

      const before = structuredClone(state) as GameState;
      const after = applyLegal(state, "runner", actions[0]!);
      expectReplayStable(before, after);
    }
  });

  it("Bargain with Viacox resolves an impossible roll-6 target without leaking hidden grip identity", () => {
    let state = viacoxStateForRoll(6, CORP_OPERATION);
    const grant = state.actionEconomy?.grants?.[0];
    expect(grant?.targetCardInstanceId).toBeDefined();
    const targetCardId = grant!.targetCardInstanceId!;
    const actions = getLegalActions(state, "runner");
    expect(actions).toHaveLength(1);
    expect(actions[0]?.payload?.actionEconomyAbility).toBe(
      "forced_action_not_possible",
    );
    expect(JSON.stringify(actions[0])).not.toContain(targetCardId);

    const before = structuredClone(state) as GameState;
    state = applyLegal(state, "runner", actions[0]!);
    expect(state.actionEconomy?.grants ?? []).toHaveLength(0);
    expectReplayStable(before, state);
    const publicViews = [
      JSON.stringify(getPlayerView(state, "corp").publicEvents),
      JSON.stringify(getPlayerView(state, "runner").publicEvents),
    ];
    for (const view of publicViews) {
      expect(view).not.toContain(targetCardId);
      expect(view).not.toContain(CORP_OPERATION);
    }
  });

  it("turn-bound extra-action grants expire if unused and consumed grants still compact", () => {
    let state = aiBoardStateForRoll(1);
    state = apply(
      state,
      "corp",
      (action) => action.payload?.actionEconomyAbility === "accept_extra_action_offer",
    );
    expect(state.actionEconomy?.grants).toHaveLength(1);
    state = apply(state, "corp", (action) => action.type === "end_turn");
    state = applyOptionalDiscard(state, "corp");
    expect(state.actionEconomy?.grants ?? []).toHaveLength(0);
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = applyOptionalDiscard(state, "runner");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    expect(state.actionEconomy?.grants ?? []).toHaveLength(0);

    state = aiBoardStateForRoll(2);
    state = apply(
      state,
      "corp",
      (action) => action.payload?.actionEconomyAbility === "accept_extra_action_offer",
    );
    state.corp.clicks = 1;
    state = apply(state, "corp", (action) => action.type === "gain_credit");
    expect(state.actionEconomy?.grants ?? []).toHaveLength(0);
  });

  it("Lucidrine Drip Feed builds Drip counters, grants actions, then resets for unpreventable core damage", () => {
    let state = baseState("pro017-drip");
    const dripId = installRunnerCard(state, LUCIDRINE_DRIP_FEED, "drip", "hardware");
    clearRunnerGrip(state);
    addRunnerGrip(state, RUNNER_EVENT, "drip_damage_card");

    state = nextRunnerActionPhase(state);
    expect(state.cardInstances[dripId]?.counters?.drip).toBe(1);
    expect(state.runner.clicks).toBe(5);

    state = nextRunnerActionPhase(state);
    expect(state.cardInstances[dripId]?.counters?.drip).toBe(2);
    expect(state.runner.clicks).toBe(5);

    const coreBefore = state.runner.coreDamage;
    state = nextRunnerActionPhase(state);
    expect(state.cardInstances[dripId]?.counters?.drip ?? 0).toBe(0);
    expect(state.runner.coreDamage).toBe(coreBefore + 1);
  });
});

function toRunnerTurnFromCorpAction(state: GameState): GameState {
  let next = apply(state, "corp", (action) => action.type === "end_turn");
  next = applyOptionalDiscard(next, "corp");
  return next;
}
