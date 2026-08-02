import { describe, expect, it } from "vitest";
import type {
  CardInstanceId,
  DeckDefinition,
  GameState,
  ResolvedGameEffect,
} from "@netgrid/shared";
import {
  createGameAfterSetup,
  getPlayerView,
  hashState,
  replayEvents,
  validateGameState,
} from "../../index";
import { cardImplementationCoverageForDefinitionId } from "../../card-implementations/coverage";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import { executeEffectCommands } from "../../game/engine-runtime-internal/runtime-port-bindings";
import { drawCorpCards } from "../../game/state/draw-random";
import {
  addCorpCardToHqForTest,
  addInstalledRunnerProgramForTest,
  addRezzedCorpIceForTest,
  addRezzedCorpRootForTest,
  enterEncounterFromMovementWindow,
  passRootRezWindowBeforeAccessIfOpen,
} from "../../test-fixtures/index-test-helpers";
import {
  apply,
  applyChoice,
  emptyRunnerGripForTest,
  installRunnerHardwareForTest,
  installRunnerProgramForTest,
  installRunnerResourceForTest,
  moveRunnerCardCopyToGrip,
  mustAction,
  putCorpCardOnTopOfRd,
  toRunnerTurnFromCorpMain,
} from "../../test-fixtures/mechanic-smoke-fixtures";

const IRT = "onr_classic_019_indiscriminate-response-team";
const LONDON_CITY_GRID = "onr_classic_020_london-city-grid";
const SATELLITE_MONITORS = "onr_classic_021_satellite-monitors";
const SELF_DESTRUCT = "onr_classic_022_self-destruct";
const SHOCK_TREATMENT = "onr_classic_023_shock-treatment";
const STERDROID = "onr_classic_024_sterdroid";
const STRATEGIC_PLANNING_GROUP = "onr_classic_025_strategic-planning-group";
const CORPORATE_SHUFFLE = "onr_classic_017_corporate-shuffle";
const DAY_SHIFT = "onr_v1_288_day-shift";
const UNLISTED_RESEARCH_LAB = "onr_classic_003_unlisted-research-lab";
const EMPLOYEE_EMPOWERMENT = "onr_v1_199_employee-empowerment";
const SKIVVISS = "onr_v1_064_skivviss";
const STREET_ENFORCER = "onr_classic_026_street-enforcer";
const FALL_GUY = "onr_v1_161_fall-guy";

const CLASSIC_08_IDS = [
  IRT,
  LONDON_CITY_GRID,
  SATELLITE_MONITORS,
  SELF_DESTRUCT,
  SHOCK_TREATMENT,
  STERDROID,
  STRATEGIC_PLANNING_GROUP,
  STREET_ENFORCER,
] as const;

const CLASSIC_08_CORP_DECK: DeckDefinition = {
  id: "classic_08_corp_assets_upgrades_smoke_corp",
  name: "Classic 08 Corp Assets Upgrades Smoke Corp",
  side: "corp",
  identity: "corp_identity_001",
  cards: [
    { id: "simple_agenda", quantity: 8 },
    { id: "simple_barrier_ice", quantity: 2 },
    { id: "onr_v1_237_data-wall", quantity: 2 },
    { id: "onr_v1_232_crystal-wall", quantity: 2 },
    { id: "simple_upgrade", quantity: 2 },
    { id: "simple_economy_asset", quantity: 2 },
    { id: "simple_economy_operation", quantity: 12 },
  ],
};

const CLASSIC_08_RUNNER_DECK: DeckDefinition = {
  id: "classic_08_corp_assets_upgrades_smoke_runner",
  name: "Classic 08 Corp Assets Upgrades Smoke Runner",
  side: "runner",
  identity: "runner_identity_001",
  cards: [
    { id: "simple_setup_hardware", quantity: 3 },
    { id: "simple_fracter", quantity: 3 },
    { id: "simple_decoder", quantity: 2 },
    { id: "onr_v1_021_dwarf", quantity: 2 },
    { id: "onr_v1_031_hammer", quantity: 2 },
    { id: "simple_economy_event", quantity: 12 },
    { id: "simple_run_event", quantity: 8 },
  ],
};

function classic08Game(seed: string): GameState {
  return createGameAfterSetup({
    seed,
    corpDeck: CLASSIC_08_CORP_DECK,
    runnerDeck: CLASSIC_08_RUNNER_DECK,
    agendaPointsToWin: 99,
  });
}

function corpMainClassic08Game(seed: string): GameState {
  const state = apply(
    classic08Game(seed),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state.corp.credits = 80;
  state.corp.clicks = 30;
  state.corp.maxHandSize = 100;
  state.runner.credits = 40;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 8;
  return state;
}

function corpMainClassic08FallGuyGame(seed: string): GameState {
  const state = apply(
    createGameAfterSetup({
      seed,
      corpDeck: CLASSIC_08_CORP_DECK,
      runnerDeck: {
        ...CLASSIC_08_RUNNER_DECK,
        id: `${CLASSIC_08_RUNNER_DECK.id}_fall_guy`,
        cards: [...CLASSIC_08_RUNNER_DECK.cards, { id: FALL_GUY, quantity: 1 }],
      },
      agendaPointsToWin: 99,
    }),
    "corp",
    (action) => action.type === "mandatory_draw",
  );
  state.corp.credits = 80;
  state.corp.clicks = 30;
  state.corp.maxHandSize = 100;
  state.runner.credits = 40;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 8;
  return state;
}

function addScoredCorpAgendaForTest(
  state: GameState,
  definitionId: string,
  suffix: string,
): CardInstanceId {
  const cardId = addCorpCardToHqForTest(state, definitionId, suffix);
  state.corp.hq = state.corp.hq.filter((candidate) => candidate !== cardId);
  state.corp.scoreArea.push(cardId);
  state.cardInstances[cardId] = {
    ...state.cardInstances[cardId]!,
    zone: { side: "corp", zone: "scoreArea" },
    faceup: true,
    rezzed: true,
  };
  return cardId;
}

function toRunnerClassic08Game(seed: string): GameState {
  const state = toRunnerTurnFromCorpMain(corpMainClassic08Game(seed));
  state.runner.credits = 40;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 8;
  return state;
}

function latestPayload(
  state: GameState,
  predicate: (payload: Record<string, unknown>) => boolean,
): Record<string, unknown> | undefined {
  return state.eventLog
    .slice()
    .reverse()
    .map((entry) => entry.publicPayload)
    .find((payload): payload is Record<string, unknown> => {
      return Boolean(
        payload &&
        typeof payload === "object" &&
        predicate(payload as Record<string, unknown>),
      );
    });
}

function latestResolvedEffect(
  state: GameState,
  predicate: (effect: ResolvedGameEffect) => boolean,
): ResolvedGameEffect | undefined {
  for (const entry of state.eventLog.slice().reverse()) {
    const effects = entry.publicPayload?.resolvedEffects;
    if (!Array.isArray(effects)) continue;
    const match = effects
      .slice()
      .reverse()
      .find((effect) => predicate(effect));
    if (match) return match;
  }
  return undefined;
}

function expectValid(state: GameState): void {
  expect(validateGameState(state).ok).toBe(true);
}

describe("Classic Corp Asset and Upgrade Implementation Smokes", () => {
  it("registers CLASSIC-08 corp assets and upgrades with declarative implementations", () => {
    expect(
      cardImplementationForDefinitionId(IRT)?.successfulRunFollowups?.[0],
    ).toMatchObject({
      kind: "corp_optional_shuffle_runner_grip_into_stack_then_draw_same_count",
    });
    expect(
      cardImplementationForDefinitionId(LONDON_CITY_GRID)?.modifiers?.[0],
    ).toMatchObject({
      kind: "break_subroutine_cost",
      amount: 1,
      appliesToRunner: { cardType: "program", subtype: "noisy" },
      sameServerAsSource: true,
    });
    expect(
      cardImplementationForDefinitionId(SATELLITE_MONITORS)?.corpUtility,
    ).toMatchObject({
      kind: "corp_start_turn_tag_roll_per_runner_run_last_turn",
      dieFaces: 6,
      tagOn: 1,
    });
    expect(
      cardImplementationForDefinitionId(SELF_DESTRUCT)?.accessEffects?.[0]
        ?.effects[0],
    ).toMatchObject({
      kind: "trash_other_corp_installed_cards_in_source_server_and_damage_runner",
    });
    expect(
      cardImplementationForDefinitionId(SHOCK_TREATMENT)?.accessEffects?.[0],
    ).toMatchObject({
      condition: { kind: "runner_tags_at_least", amount: 4 },
    });
    expect(
      cardImplementationForDefinitionId(STERDROID)?.abilities?.[0]?.effects[0],
    ).toMatchObject({
      kind: "double_chosen_ice_strength_until_end_of_turn",
      maxStrength: 10,
    });
    expect(
      cardImplementationForDefinitionId(STRATEGIC_PLANNING_GROUP)?.corpUtility,
    ).toMatchObject({
      kind: "corp_draw_extra_then_bottom_one",
      extraDraw: 1,
    });
    expect(
      cardImplementationForDefinitionId(STREET_ENFORCER)?.corpUtility,
    ).toEqual({
      kind: "run_start_tax_runner_tags",
      visibility: "public",
    });

    for (const definitionId of CLASSIC_08_IDS) {
      expect(
        cardImplementationCoverageForDefinitionId(definitionId)?.status,
        definitionId,
      ).toBe("implemented");
    }
  });

  it("taxes runs on Street Enforcer forts by the Runner's current tags", () => {
    let state = toRunnerClassic08Game("classic-08-street-enforcer");
    state.runner.tags = 3;
    state.runner.credits = 5;
    addRezzedCorpRootForTest(state, STREET_ENFORCER, "remote_1", "street");

    const legal = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    expect(legal.costs[0]?.credits).toBe(3);
    expect(legal.payload).toMatchObject({
      runStartTaxCredits: 3,
      runStartTaxSourceDefinitionIds: STREET_ENFORCER,
    });

    state = apply(
      state,
      "runner",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.runner.credits).toBe(2);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "start_run",
      runStartTaxCredits: 3,
      runStartTaxSourceDefinitionIds: STREET_ENFORCER,
      runnerCreditsAfter: 2,
    });
    expectValid(state);
  });

  it("adds London City Grid's extra cost only to noisy breaker use on its fort", () => {
    let state = toRunnerClassic08Game("classic-08-london-city-grid");
    addRezzedCorpRootForTest(state, LONDON_CITY_GRID, "remote_1", "london");
    const dataWallId = addRezzedCorpIceForTest(
      state,
      "onr_v1_237_data-wall",
      "remote_1",
      "wall",
    );
    const hammerId = addInstalledRunnerProgramForTest(
      state,
      "onr_v1_031_hammer",
      "hammer",
    );
    state.cardInstances[hammerId] = {
      ...state.cardInstances[hammerId]!,
      strengthModifier: 10,
    };

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = enterEncounterFromMovementWindow(state);
    expect(state.run?.encounteredIceId).toBe(dataWallId);

    const breakAction = mustAction(
      state,
      "runner",
      (action) =>
        action.type === "break_subroutine" &&
        action.payload?.breakerId === hammerId &&
        action.payload?.subroutineIndex === 0,
    );

    expect(breakAction.costs[0]?.credits).toBe(2);
    expect(breakAction.payload).toMatchObject({
      breakSubroutineBaseCost: 1,
      breakSubroutineAdditionalCost: 1,
      breakSubroutineTotalCost: 2,
    });

    state = apply(
      state,
      "runner",
      (action) => action.actionId === breakAction.actionId,
    );

    expect(state.run?.brokenSubroutineIndexes).toContain(0);
    expect(state.runner.credits).toBe(38);
    expectValid(state);
  });

  it("rolls Satellite Monitors once per Runner run attempt at Corp turn start", () => {
    let state = corpMainClassic08Game("classic-08-satellite-monitors");
    addRezzedCorpRootForTest(
      state,
      SATELLITE_MONITORS,
      "remote_1",
      "satellite",
    );
    state = toRunnerTurnFromCorpMain(state);
    state.runnerTurnFlags = {
      ...state.runnerTurnFlags!,
      runAttemptsThisTurn: 4,
    };
    const randomBefore = state.randomDrawRecords.length;

    state = apply(state, "runner", (action) => action.type === "end_turn");

    const payload = latestResolvedEffect(
      state,
      (candidate) =>
        candidate.sourceDefinitionId === SATELLITE_MONITORS &&
        candidate.runAttemptsLastTurn === 4,
    );
    expect(payload).toMatchObject({
      sourceDefinitionId: SATELLITE_MONITORS,
      runAttemptsLastTurn: 4,
      dieSize: 6,
    });
    const dieRolls = String(payload?.dieRolls ?? "")
      .split(",")
      .filter(Boolean)
      .map(Number);
    expect(dieRolls).toHaveLength(4);
    expect(state.randomDrawRecords).toHaveLength(randomBefore + 4);
    expect(payload?.tagsAdded).toBe(
      dieRolls.filter((roll) => roll === 1).length,
    );
    expect(state.runner.tags).toBe(Number(payload?.tagsAdded ?? 0));
    expectValid(state);
  });

  it("suspends Satellite Monitors tags and preserves its single roll set after avoid or pass", () => {
    let opened:
      | {
          initial: GameState;
          replayStart: number;
          state: GameState;
          fallGuyId: string;
        }
      | undefined;
    for (let seedIndex = 0; seedIndex < 40 && !opened; seedIndex += 1) {
      let candidate = corpMainClassic08FallGuyGame(
        `classic-08-satellite-continuation-${seedIndex}`,
      );
      addRezzedCorpRootForTest(
        candidate,
        SATELLITE_MONITORS,
        "remote_1",
        "satellite",
      );
      candidate = toRunnerTurnFromCorpMain(candidate);
      const fallGuyId = installRunnerResourceForTest(candidate, FALL_GUY);
      candidate.runnerTurnFlags = {
        ...candidate.runnerTurnFlags!,
        runAttemptsThisTurn: 6,
      };
      const initial = structuredClone(candidate);
      const replayStart = candidate.eventLog.length;
      candidate = apply(
        candidate,
        "runner",
        (action) => action.type === "end_turn",
      );
      if (candidate.pendingAddTagContinuation?.kind === "corp_start_turn") {
        opened = { initial, replayStart, state: candidate, fallGuyId };
      }
    }
    if (!opened) throw new Error("Satellite Monitors produced no tag window");

    const { initial, replayStart, fallGuyId } = opened;
    const state = opened.state;
    const randomDrawCount = state.randomDrawRecords.length;
    expect(state.runner.tags).toBe(0);
    expect(state.pendingChoice).toMatchObject({
      side: "runner",
      source: expect.stringContaining("event_modification"),
    });
    expect(state.pendingAddTagContinuation).toMatchObject({
      kind: "corp_start_turn",
      sourceDefinitionId: SATELLITE_MONITORS,
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();

    const passState = applyChoice(structuredClone(state), "runner", "pass");
    expect(passState.runner.tags).toBeGreaterThan(0);
    expect(passState.runner.rig.resources).toContain(fallGuyId);
    expect(passState.randomDrawRecords).toHaveLength(randomDrawCount);
    expect(passState.pendingAddTagContinuation).toBeUndefined();

    const fallGuyOption = state.pendingChoice?.options.find((option) =>
      option.id.includes(fallGuyId),
    )?.id;
    const avoidState = applyChoice(state, "runner", String(fallGuyOption));
    expect(avoidState.runner.tags).toBe(Math.max(0, passState.runner.tags - 1));
    expect(avoidState.runner.heap).toContain(fallGuyId);
    expect(avoidState.randomDrawRecords).toHaveLength(randomDrawCount);
    expect(avoidState.pendingAddTagContinuation).toBeUndefined();

    for (const branch of [passState, avoidState]) {
      const replay = replayEvents(initial, branch.eventLog.slice(replayStart));
      expect(replay.ok).toBe(true);
      expect(hashState(replay.state)).toBe(hashState(branch));
    }
  });

  it("uses Self-Destruct on access to trash other installed root cards and deal net damage", () => {
    let state = toRunnerClassic08Game("classic-08-self-destruct");
    const selfId = addRezzedCorpRootForTest(
      state,
      SELF_DESTRUCT,
      "remote_1",
      "self",
    );
    const otherRootId = addRezzedCorpRootForTest(
      state,
      "simple_upgrade",
      "remote_1",
      "other",
    );
    const remote = state.corp.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remote) throw new Error("Missing remote_1");
    remote.root = [selfId, otherRootId];
    const gripBefore = state.runner.grip.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.corp.archives).toContain(otherRootId);
    expect(state.corp.archives).not.toContain(selfId);
    expect(state.cardInstances[selfId]?.tapped).toBe(true);
    expect(state.runner.grip.length).toBe(gripBefore - 1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "classic_self_destruct_access",
      selfDestructTrashedCount: 1,
      damageAmount: 1,
    });
    expectValid(state);
  });

  it("uses Shock Treatment on access only when the Runner has four or more tags", () => {
    let state = toRunnerClassic08Game("classic-08-shock-treatment");
    state.runner.tags = 4;
    const hardwareId = installRunnerHardwareForTest(
      state,
      "simple_setup_hardware",
    );
    const firstProgramId = installRunnerProgramForTest(state, "simple_fracter");
    const secondProgramId = installRunnerProgramForTest(
      state,
      "simple_decoder",
    );
    addRezzedCorpRootForTest(state, SHOCK_TREATMENT, "remote_1", "shock");

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(state, "runner", (action) => action.type === "access_card");

    expect(state.runner.rig.hardware).not.toContain(hardwareId);
    expect(state.runner.rig.programs).not.toContain(firstProgramId);
    expect(state.runner.rig.programs).not.toContain(secondProgramId);
    expect(state.runner.heap).toEqual(
      expect.arrayContaining([hardwareId, firstProgramId, secondProgramId]),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "classic_shock_treatment_access_trash",
      cardDefinitionId: SHOCK_TREATMENT,
      hardwareTrashCount: 1,
      programTrashCount: 2,
    });
    expectValid(state);
  });

  it("doubles chosen ICE strength with Sterdroid until the current turn ends", () => {
    let state = corpMainClassic08Game("classic-08-sterdroid");
    const sterdroidId = addRezzedCorpRootForTest(
      state,
      STERDROID,
      "remote_1",
      "sterdroid",
    );
    const iceId = addRezzedCorpIceForTest(
      state,
      "onr_v1_232_crystal-wall",
      "rd",
      "crystal",
    );
    const legal = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "activated_card_ability" &&
        action.payload?.cardId === sterdroidId &&
        action.payload?.targetCardId === iceId,
    );

    state = apply(
      state,
      "corp",
      (action) => action.actionId === legal.actionId,
    );

    expect(state.cardInstances[iceId]?.strengthModifier).toBeGreaterThan(0);
    expect(state.temporaryIceStrengthModifiersUntilEndOfTurn).toEqual([
      expect.objectContaining({
        sourceCardInstanceId: sterdroidId,
        sourceDefinitionId: STERDROID,
        targetIceId: iceId,
      }),
    ]);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: STERDROID,
      targetCardDefinitionId: "onr_v1_232_crystal-wall",
      iceStrengthBonusApplied: expect.any(Number),
    });

    state = apply(state, "corp", (action) => action.type === "end_turn");

    expect(state.cardInstances[iceId]?.strengthModifier ?? 0).toBe(0);
    expect(
      state.temporaryIceStrengthModifiersUntilEndOfTurn ?? [],
    ).toHaveLength(0);
    expectValid(state);
  });

  it("lets the Corp choose either card drawn with Strategic Planning Group", () => {
    let state = corpMainClassic08Game("classic-08-strategic-planning-group");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "strategic",
    );
    const baseDrawId = putCorpCardOnTopOfRd(state, "simple_agenda");
    const extraDrawId = putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const hqBefore = state.corp.hq.length;
    const rdBefore = state.corp.rd.length;
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(state, "corp", (action) => action.type === "draw_card");

    expect(state.pendingChoice).toMatchObject({
      side: "corp",
      kind: "select_cards",
      minSelections: 1,
      maxSelections: 1,
      visibility: "hidden_info_barrier",
      sourceCardDefinitionId: STRATEGIC_PLANNING_GROUP,
    });
    expect(
      state.pendingChoice?.options.map((option) => option.value).sort(),
    ).toEqual([baseDrawId, extraDrawId].sort());
    expect(
      getPlayerView(state, "corp").pendingChoice?.options.every(
        (option) => option.card?.known === true,
      ),
    ).toBe(true);
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    expect(state.corp.hq).not.toEqual(
      expect.arrayContaining([baseDrawId, extraDrawId]),
    );
    expect(state.corp.hq.length).toBe(hqBefore);
    expect(state.corp.rd.length).toBe(rdBefore - 2);
    expect(state.specialZones?.setAside).toEqual(
      expect.arrayContaining([baseDrawId, extraDrawId]),
    );
    expect(state.pendingCorpDraw).toMatchObject({
      baseDrawCount: 1,
      replacementDrawCount: 1,
      drawnCardIds: expect.arrayContaining([baseDrawId, extraDrawId]),
    });
    expect(
      getPlayerView(state, "corp").specialZones?.setAside.every(
        (card) => card.known === true,
      ),
    ).toBe(true);
    expect(
      getPlayerView(state, "runner").specialZones?.setAside.every(
        (card) => card.known === false,
      ),
    ).toBe(true);

    const baseOptionId = state.pendingChoice?.options.find(
      (option) => option.value === baseDrawId,
    )?.id;
    const extraOptionId = state.pendingChoice?.options.find(
      (option) => option.value === extraDrawId,
    )?.id;
    expect(baseOptionId).toBeDefined();
    expect(extraOptionId).toBeDefined();

    const bottomBase = applyChoice(
      structuredClone(state),
      "corp",
      String(baseOptionId),
    );
    expect(bottomBase.corp.hq).toContain(extraDrawId);
    expect(bottomBase.corp.hq).not.toContain(baseDrawId);
    expect(bottomBase.corp.rd.at(-1)).toBe(baseDrawId);
    expect(bottomBase.corp.hq.length).toBe(hqBefore + 1);
    expect(bottomBase.corp.rd.length).toBe(rdBefore - 1);
    expect(bottomBase.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      drawReplacementSourceTitle: "Strategic Planning Group",
      strategicPlanningGroupChoiceResolved: true,
      strategicPlanningGroupBaseDrawCount: 1,
      strategicPlanningGroupAdditionalDrawCount: 1,
      strategicPlanningGroupDrawnCardCount: 2,
      strategicPlanningGroupNetDrawCount: 1,
      bottomedCardCount: 1,
      destinationZone: "rd_bottom",
    });
    expect(
      JSON.stringify(bottomBase.eventLog.at(-1)?.publicPayload),
    ).not.toContain(baseDrawId);

    const bottomExtra = applyChoice(state, "corp", String(extraOptionId));
    expect(bottomExtra.corp.hq).toContain(baseDrawId);
    expect(bottomExtra.corp.hq).not.toContain(extraDrawId);
    expect(bottomExtra.corp.rd.at(-1)).toBe(extraDrawId);
    const replay = replayEvents(
      initial,
      bottomExtra.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(bottomExtra));
    expectValid(bottomBase);
    expectValid(bottomExtra);
  });

  it("opens the same private Strategic Planning Group choice for the Corp mandatory draw", () => {
    let state = corpMainClassic08Game("classic-08-strategic-mandatory-draw");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "strategic",
    );
    state = toRunnerTurnFromCorpMain(state);
    const firstDrawId = putCorpCardOnTopOfRd(state, "simple_agenda");
    const secondDrawId = putCorpCardOnTopOfRd(
      state,
      "simple_economy_operation",
    );
    state = apply(state, "runner", (action) => action.type === "end_turn");

    state = apply(state, "corp", (action) => action.type === "mandatory_draw");

    expect(state.timingPoint).toBe("corp_draw.mandatory_draw");
    expect(
      state.pendingChoice?.options.map((option) => option.value).sort(),
    ).toEqual([firstDrawId, secondDrawId].sort());
    expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();
    const selectedOptionId = state.pendingChoice?.options.find(
      (option) => option.value === firstDrawId,
    )?.id;
    state = applyChoice(state, "corp", String(selectedOptionId));
    expect(state.corp.rd.at(-1)).toBe(firstDrawId);
    expect(state.corp.hq).toContain(secondDrawId);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.timingPoint).toBe("corp_action.main");
    expectValid(state);
  });

  it("aggregates mandatory, scored-agenda, selected optional and Skivviss draws before SPG", () => {
    let state = corpMainClassic08Game("classic-08-strategic-aggregate-start");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "strategic_aggregate_start",
    );
    addScoredCorpAgendaForTest(
      state,
      UNLISTED_RESEARCH_LAB,
      "unlisted_aggregate_start",
    );
    addScoredCorpAgendaForTest(
      state,
      EMPLOYEE_EMPOWERMENT,
      "employee_aggregate_start",
    );
    const skivvissId = addInstalledRunnerProgramForTest(
      state,
      SKIVVISS,
      "skivviss_aggregate_start",
    );
    state.cardInstances[skivvissId]!.counters = { virus: 2 };
    state = toRunnerTurnFromCorpMain(state);
    for (const definitionId of [
      "simple_agenda",
      "simple_barrier_ice",
      "onr_v1_237_data-wall",
      "onr_v1_232_crystal-wall",
      "simple_upgrade",
      "simple_economy_asset",
    ])
      putCorpCardOnTopOfRd(state, definitionId);
    const hqBeforeMandatoryDraw = state.corp.hq.length;
    const startState = apply(
      state,
      "runner",
      (action) => action.type === "end_turn",
    );

    expect(startState.pendingChoice?.source).toContain(
      "scored_agenda.start_draw_choice",
    );
    expect(startState.corp.hq.length).toBe(hqBeforeMandatoryDraw);

    let selected = applyChoice(structuredClone(startState), "corp", "draw");
    expect(selected.corp.hq.length).toBe(hqBeforeMandatoryDraw);
    selected = apply(
      selected,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    expect(selected.pendingCorpDraw).toMatchObject({
      baseDrawCount: 5,
      replacementDrawCount: 1,
      continuation: {
        kind: "corp_mandatory_draw",
        mandatoryCardCount: 1,
        mandatoryAgendaCardCount: 1,
        optionalAgendaCardCount: 1,
        skivvissCardCount: 2,
        additionalCardCount: 4,
        totalBaseDrawCount: 5,
      },
    });
    expect(selected.pendingChoice?.options).toHaveLength(6);
    expect(selected.timingPoint).toBe("corp_draw.mandatory_draw");
    selected = applyChoice(
      selected,
      "corp",
      String(selected.pendingChoice?.options[0]?.id),
    );
    expect(selected.corp.hq.length).toBe(hqBeforeMandatoryDraw + 5);
    expect(selected.timingPoint).toBe("corp_action.main");
    expect(selected.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      corpMandatoryDrawCompleted: true,
      corpMandatoryCardCount: 1,
      corpMandatoryAdditionalCardCount: 4,
      corpMandatoryTotalBaseDrawCount: 5,
      corpMandatoryAgendaCardCount: 1,
      corpMandatoryOptionalAgendaCardCount: 1,
      corpMandatorySkivvissCardCount: 2,
      strategicPlanningGroupDrawnCardCount: 6,
      strategicPlanningGroupNetDrawCount: 5,
    });

    let skipped = applyChoice(structuredClone(startState), "corp", "skip");
    skipped = apply(
      skipped,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    expect(skipped.pendingCorpDraw).toMatchObject({
      baseDrawCount: 4,
      replacementDrawCount: 1,
      continuation: {
        kind: "corp_mandatory_draw",
        optionalAgendaCardCount: 0,
        totalBaseDrawCount: 4,
      },
    });
    expect(skipped.pendingChoice?.options).toHaveLength(5);
    skipped = applyChoice(
      skipped,
      "corp",
      String(skipped.pendingChoice?.options[0]?.id),
    );
    expect(skipped.corp.hq.length).toBe(hqBeforeMandatoryDraw + 4);
    expect(skipped.timingPoint).toBe("corp_action.main");

    let deckout = applyChoice(structuredClone(startState), "corp", "draw");
    const removedFromRd = deckout.corp.rd.slice(4);
    deckout.corp.rd = deckout.corp.rd.slice(0, 4);
    deckout.corp.archives.push(...removedFromRd);
    for (const cardId of removedFromRd)
      deckout.cardInstances[cardId] = {
        ...deckout.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
      };
    deckout = apply(
      deckout,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    expect(deckout.winner).toBe("runner");
    expect(deckout.gameEndReason).toBe("corp_deck_empty");
    expect(deckout.pendingCorpDraw).toBeUndefined();
    expect(deckout.pendingChoice).toBeUndefined();
    expectValid(selected);
    expectValid(skipped);
    expectValid(deckout);
  });

  it("treats a multi-card Corp draw as one Strategic Planning Group transaction", () => {
    let state = corpMainClassic08Game("classic-08-strategic-multi-draw");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "strategic",
    );
    const hqBefore = state.corp.hq.length;
    const drawnIds = [
      putCorpCardOnTopOfRd(state, "simple_agenda"),
      putCorpCardOnTopOfRd(state, "simple_economy_operation"),
      putCorpCardOnTopOfRd(state, "simple_barrier_ice"),
    ];

    drawCorpCards(state, 3);

    expect(state.pendingCorpDraw).toMatchObject({
      baseDrawCount: 3,
      replacementDrawCount: 1,
    });
    expect(state.pendingCorpDraw?.drawnCardIds).toHaveLength(4);
    expect(state.pendingChoice?.options).toHaveLength(4);
    expect(state.corp.hq).toHaveLength(hqBefore);
    expect(state.specialZones?.setAside).toEqual(
      expect.arrayContaining(drawnIds),
    );

    state.stateVersion = state.pendingChoice!.stateVersion;
    const selectedOptionId = state.pendingChoice?.options[0]?.id;
    state = applyChoice(state, "corp", String(selectedOptionId));

    expect(state.pendingCorpDraw).toBeUndefined();
    expect(state.specialZones?.setAside).toEqual([]);
    expect(state.corp.hq).toHaveLength(hqBefore + 3);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      strategicPlanningGroupBaseDrawCount: 3,
      strategicPlanningGroupAdditionalDrawCount: 1,
      strategicPlanningGroupDrawnCardCount: 4,
      strategicPlanningGroupNetDrawCount: 3,
      bottomedCardCount: 1,
    });
    expectValid(state);
  });

  it.each([
    {
      title: "Annual Reviews",
      definitionId: "onr_v1_282_annual-reviews",
      sourceZone: "hq",
      drawCount: 3,
    },
    {
      title: "Night Shift",
      definitionId: "onr_v1_295_night-shift",
      sourceZone: "hq",
      drawCount: 1,
    },
    {
      title: "Employee Empowerment",
      definitionId: EMPLOYEE_EMPOWERMENT,
      sourceZone: "scoreArea",
      drawCount: 2,
    },
    {
      title: "ESA Contract",
      definitionId: "onr_v1_321_esa-contract",
      sourceZone: "serverRoot",
      drawCount: 2,
    },
    {
      title: "Euromarket Consortium",
      definitionId: "onr_v1_322_euromarket-consortium",
      sourceZone: "serverRoot",
      drawCount: 2,
    },
  ] as const)(
    "batches $title into one complete Strategic Planning Group choice",
    ({ definitionId, sourceZone, drawCount }) => {
      let state = corpMainClassic08Game(
        `classic-08-strategic-card-matrix-${definitionId}`,
      );
      addRezzedCorpRootForTest(
        state,
        STRATEGIC_PLANNING_GROUP,
        "remote_1",
        `spg_matrix_${definitionId}`,
      );
      const sourceId =
        sourceZone === "hq"
          ? addCorpCardToHqForTest(
              state,
              definitionId,
              `matrix_${definitionId}`,
            )
          : sourceZone === "scoreArea"
            ? addScoredCorpAgendaForTest(
                state,
                definitionId,
                `matrix_${definitionId}`,
              )
            : addRezzedCorpRootForTest(
                state,
                definitionId,
                "remote_2",
                `matrix_${definitionId}`,
              );
      const hqBefore = state.corp.hq.length;

      state = apply(
        state,
        "corp",
        (action) =>
          (sourceZone === "hq"
            ? action.type === "play_operation"
            : action.type === "activated_card_ability") &&
          action.source === sourceId,
      );

      expect(state.pendingCorpDraw).toMatchObject({
        baseDrawCount: drawCount,
        replacementDrawCount: 1,
      });
      expect(state.pendingChoice?.options).toHaveLength(drawCount + 1);
      expect(getPlayerView(state, "corp").pendingChoice?.options).toHaveLength(
        drawCount + 1,
      );
      expect(getPlayerView(state, "runner").pendingChoice).toBeUndefined();

      state = applyChoice(
        state,
        "corp",
        String(state.pendingChoice?.options[0]?.id),
      );
      expect(state.corp.hq.length).toBe(
        hqBefore + drawCount - (sourceZone === "hq" ? 1 : 0),
      );
      expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
        strategicPlanningGroupBaseDrawCount: drawCount,
        strategicPlanningGroupAdditionalDrawCount: 1,
        strategicPlanningGroupDrawnCardCount: drawCount + 1,
        strategicPlanningGroupNetDrawCount: drawCount,
        bottomedCardCount: 1,
      });
      expectValid(state);
    },
  );

  it("continues Corporate Shuffle only after the Strategic Planning Group choice", () => {
    let state = corpMainClassic08Game("classic-08-strategic-corporate-shuffle");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "spg_corporate_shuffle",
    );
    const operationId = addCorpCardToHqForTest(
      state,
      CORPORATE_SHUFFLE,
      "corporate_shuffle",
    );
    for (const definitionId of [
      "simple_agenda",
      "simple_barrier_ice",
      "onr_v1_237_data-wall",
      "onr_v1_232_crystal-wall",
      "simple_upgrade",
      "simple_economy_asset",
    ])
      putCorpCardOnTopOfRd(state, definitionId);
    const hqBeforePlay = state.corp.hq.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" && action.source === operationId,
    );

    expect(state.pendingCorpDraw?.continuation).toMatchObject({
      kind: "corporate_shuffle_hq_to_rd",
      sourceCardId: operationId,
      sourceDefinitionId: CORPORATE_SHUFFLE,
    });
    expect(state.pendingChoice?.source).toContain(
      "card_implementation.strategic_planning_group_draw:",
    );
    expect(state.pendingChoice?.options).toHaveLength(6);
    expect(state.corp.hq.length).toBe(hqBeforePlay - 1);

    state = applyChoice(
      state,
      "corp",
      String(state.pendingChoice?.options[0]?.id),
    );

    expect(state.pendingCorpDraw).toBeUndefined();
    expect(state.corp.hq.length).toBe(hqBeforePlay - 1 + 5);
    expect(state.pendingChoice?.source).toContain(
      "classic.corporate_shuffle_hq_to_rd:",
    );
    expect(state.pendingChoice?.options).toHaveLength(state.corp.hq.length);
    expectValid(state);
  });

  it("batches EffectCommand draw amounts and resumes remaining commands after SPG", () => {
    let state = corpMainClassic08Game("classic-08-strategic-effect-commands");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "spg_effect_commands",
    );
    for (const definitionId of [
      "simple_agenda",
      "simple_barrier_ice",
      "simple_upgrade",
    ])
      putCorpCardOnTopOfRd(state, definitionId);
    const creditsBefore = state.corp.credits;

    executeEffectCommands(state, [
      { type: "draw_card", side: "corp", amount: 2 },
      { type: "gain_credits", side: "corp", amount: 3 },
    ]);

    expect(state.pendingCorpDraw).toMatchObject({
      baseDrawCount: 2,
      replacementDrawCount: 1,
      continuation: {
        kind: "effect_commands",
        remainingCommands: [{ type: "gain_credits", side: "corp", amount: 3 }],
      },
    });
    expect(state.pendingChoice?.options).toHaveLength(3);
    expect(state.corp.credits).toBe(creditsBefore);

    state.stateVersion = state.pendingChoice!.stateVersion;
    state = applyChoice(
      state,
      "corp",
      String(state.pendingChoice?.options[0]?.id),
    );

    expect(state.pendingChoice).toBeUndefined();
    expect(state.corp.credits).toBe(creditsBefore + 3);
    expectValid(state);
  });

  it("resumes Day Shift's credit gain after its complete Strategic Planning Group draw", () => {
    let state = corpMainClassic08Game("classic-08-strategic-day-shift");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "spg_day_shift",
    );
    const operationId = addCorpCardToHqForTest(state, DAY_SHIFT, "day_shift");
    for (const definitionId of [
      "simple_agenda",
      "simple_barrier_ice",
      "simple_upgrade",
    ])
      putCorpCardOnTopOfRd(state, definitionId);
    const hqBeforePlay = state.corp.hq.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" && action.source === operationId,
    );

    const creditsBeforeChoice = state.corp.credits;
    expect(state.pendingCorpDraw?.continuation).toMatchObject({
      kind: "card_effect_on_play",
      sourceCardId: operationId,
      sourceDefinitionId: DAY_SHIFT,
      drawEffectIndex: 0,
      nextEffectIndex: 1,
    });
    expect(state.corp.hq.length).toBe(hqBeforePlay - 1);

    state = applyChoice(
      state,
      "corp",
      String(state.pendingChoice?.options[0]?.id),
    );

    expect(state.corp.credits).toBe(creditsBeforeChoice + 1);
    expect(state.corp.hq.length).toBe(hqBeforePlay - 1 + 2);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      strategicPlanningGroupChoiceResolved: true,
      gainedCredits: 1,
    });
    expectValid(state);
  });

  it("ends the game without an orphaned draw transaction when the SPG extra draw decks out", () => {
    const state = corpMainClassic08Game("classic-08-strategic-extra-deckout");
    addRezzedCorpRootForTest(
      state,
      STRATEGIC_PLANNING_GROUP,
      "remote_1",
      "strategic",
    );
    const onlyCardId = putCorpCardOnTopOfRd(state, "simple_agenda");
    const movedToArchives = state.corp.rd.filter(
      (cardId) => cardId !== onlyCardId,
    );
    state.corp.rd = [onlyCardId];
    state.corp.archives.push(...movedToArchives);
    for (const cardId of movedToArchives) {
      state.cardInstances[cardId] = {
        ...state.cardInstances[cardId]!,
        zone: { side: "corp", zone: "archives" },
      };
    }

    drawCorpCards(state, 1);

    expect(state.winner).toBe("runner");
    expect(state.gameEndReason).toBe("corp_deck_empty");
    expect(state.pendingCorpDraw).toBeUndefined();
    expect(state.pendingChoice).toBeUndefined();
    expect(state.specialZones?.setAside).toEqual([]);
    expect(state.corp.hq).toContain(onlyCardId);
    expectValid(state);
  });

  it("uses Indiscriminate Response Team after a successful run to redraw the Runner grip", () => {
    let state = toRunnerClassic08Game(
      "classic-08-indiscriminate-response-team",
    );
    addRezzedCorpRootForTest(state, IRT, "remote_1", "irt");
    emptyRunnerGripForTest(state);
    moveRunnerCardCopyToGrip(state, "simple_economy_event");
    moveRunnerCardCopyToGrip(state, "simple_run_event");
    putCorpCardOnTopOfRd(state, "simple_economy_operation");
    const gripBefore = state.runner.grip.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "rd",
    );

    const payload = latestPayload(
      state,
      (candidate) => candidate.classicIndiscriminateResponseTeam === true,
    );
    expect(payload).toMatchObject({
      classicIndiscriminateResponseTeam: true,
      runnerGripShuffledIntoStackCount: gripBefore,
      runnerCardsDrawnAfterGripShuffle: gripBefore,
      runnerGripAfter: gripBefore,
      classicIndiscriminateResponseTeamSourceDefinitionIds: IRT,
    });
    expect(state.runner.grip.length).toBe(gripBefore);
    expect(state.randomDrawRecords.length).toBeGreaterThan(randomBefore);
    expectValid(state);
  });
});
