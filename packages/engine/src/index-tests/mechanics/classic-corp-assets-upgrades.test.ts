import { describe, expect, it } from "vitest";
import type { DeckDefinition, GameState } from "@netgrid/shared";
import { createGameAfterSetup, validateGameState } from "../../index";
import { cardImplementationCoverageForDefinitionId } from "../../card-implementations/coverage";
import { cardImplementationForDefinitionId } from "../../card-implementations/registry";
import {
  addInstalledRunnerProgramForTest,
  addRezzedCorpIceForTest,
  addRezzedCorpRootForTest,
  enterEncounterFromMovementWindow,
  passRootRezWindowBeforeAccessIfOpen,
} from "../../test-fixtures/index-test-helpers";
import {
  apply,
  emptyRunnerGripForTest,
  installRunnerHardwareForTest,
  installRunnerProgramForTest,
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
const STREET_ENFORCER = "onr_classic_026_street-enforcer";

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

function toRunnerClassic08Game(seed: string): GameState {
  const state = toRunnerTurnFromCorpMain(corpMainClassic08Game(seed));
  state.runner.credits = 40;
  state.runner.clicks = 4;
  state.runner.memoryLimit = 8;
  return state;
}

function latestPayload(state: GameState, predicate: (payload: Record<string, unknown>) => boolean): Record<string, unknown> | undefined {
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
  predicate: (effect: Record<string, unknown>) => boolean,
): Record<string, unknown> | undefined {
  for (const entry of state.eventLog.slice().reverse()) {
    const effects = entry.publicPayload?.resolvedEffects;
    if (!Array.isArray(effects)) continue;
    const match = effects
      .slice()
      .reverse()
      .find((effect): effect is Record<string, unknown> => {
        return Boolean(
          effect &&
            typeof effect === "object" &&
            predicate(effect as Record<string, unknown>),
        );
      });
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

    state = apply(state, "runner", (action) => action.actionId === legal.actionId);

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
    addRezzedCorpRootForTest(state, SATELLITE_MONITORS, "remote_1", "satellite");
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
    expect(payload?.tagsAdded).toBe(dieRolls.filter((roll) => roll === 1).length);
    expect(state.runner.tags).toBe(Number(payload?.tagsAdded ?? 0));
    expectValid(state);
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
    const remote = state.corp.servers.find((server) => server.id === "remote_1");
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
    state = apply(
      state,
      "runner",
      (action) => action.type === "access_card",
    );

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
    const secondProgramId = installRunnerProgramForTest(state, "simple_decoder");
    addRezzedCorpRootForTest(
      state,
      SHOCK_TREATMENT,
      "remote_1",
      "shock",
    );

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "start_run" && action.payload?.serverId === "remote_1",
    );
    state = passRootRezWindowBeforeAccessIfOpen(state);
    state = apply(
      state,
      "runner",
      (action) => action.type === "access_card",
    );

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

    state = apply(state, "corp", (action) => action.actionId === legal.actionId);

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
    expect(state.temporaryIceStrengthModifiersUntilEndOfTurn ?? []).toHaveLength(0);
    expectValid(state);
  });

  it("draws an extra Corp card with Strategic Planning Group and bottoms the extra draw", () => {
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

    state = apply(state, "corp", (action) => action.type === "draw_card");

    expect(state.corp.hq).toContain(extraDrawId);
    expect(state.corp.hq).not.toContain(baseDrawId);
    expect(state.corp.rd.at(-1)).toBe(baseDrawId);
    expect(state.corp.hq.length).toBe(hqBefore + 1);
    expect(state.corp.rd.length).toBe(rdBefore - 1);
    expectValid(state);
  });

  it("uses Indiscriminate Response Team after a successful run to redraw the Runner grip", () => {
    let state = toRunnerClassic08Game("classic-08-indiscriminate-response-team");
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
      (action) => action.type === "start_run" && action.payload?.serverId === "rd",
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
