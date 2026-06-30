import type {
  CardDefinition,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
  PlayerAction,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import {
  buildCorpFortPassWindowActions,
  buildHqIceSwapRunActions,
  buildStartRunIceRepositionActions,
  resolveFortPassAdvancementWindow,
  resolveHqIceSwapChoice,
  resolveStartRunIceRepositionWindow,
  startHqIceSwapChoice,
  type FortPassWindowHost,
} from "./fort-pass-window";

function instance(
  id: string,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverRoot", serverId: "rd" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    strengthModifier: options.strengthModifier ?? 0,
    advancementCounters: options.advancementCounters ?? 0,
    ...options,
  } as CardInstance;
}

function definition(
  id: string,
  options: Partial<CardDefinition> = {},
): CardDefinition {
  return {
    id,
    title: options.title ?? id,
    side: options.side ?? "corp",
    type: options.type ?? "upgrade",
    subtypes: options.subtypes ?? [],
    rezCost: options.rezCost ?? 0,
    ...options,
  } as CardDefinition;
}

function makeState(
  options: {
    timingPoint?: GameState["timingPoint"];
    phase?: NonNullable<GameState["run"]>["phase"];
    positionKind?: "ice" | "server";
    positionIceIndex?: number;
    serverIce?: CardInstanceId[];
  } = {},
): GameState {
  const iceInner = "ice_inner" as CardInstanceId;
  const iceOuter = "ice_outer" as CardInstanceId;
  const sourceRoot = "source_root" as CardInstanceId;
  const targetRoot = "target_root" as CardInstanceId;
  const hqIce = "hq_ice" as CardInstanceId;
  const serverIce = options.serverIce ?? [iceInner, iceOuter];
  return {
    stateVersion: 21,
    activeSide: "corp",
    phase: "run",
    timingPoint: options.timingPoint ?? "run.jack_out_window",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 0,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      credits: 8,
      hq: [hqIce],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      servers: [
        {
          id: "rd",
          kind: "rd",
          label: "R&D",
          ice: serverIce,
          root: [sourceRoot, targetRoot],
        },
      ],
    },
    cardInstances: {
      [iceInner]: instance(iceInner, "simple_ice", {
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        faceup: false,
        rezzed: false,
      }),
      [iceOuter]: instance(iceOuter, "onr_proteus_033_mobile-barricade", {
        zone: { side: "corp", zone: "serverIce", serverId: "rd" },
        faceup: false,
        rezzed: false,
      }),
      [sourceRoot]: instance(sourceRoot, "onr_proteus_062_lesley-major"),
      [targetRoot]: instance(targetRoot, "agenda_target", {
        advancementCounters: 0,
      }),
      [hqIce]: instance(hqIce, "hq_ice_def", {
        zone: { side: "corp", zone: "hq" },
        faceup: false,
        rezzed: false,
      }),
    },
    run: {
      runId: "run_1",
      attackedServerId: "rd",
      phase: options.phase ?? "movement",
      position:
        options.positionKind === "ice"
          ? {
              kind: "ice",
              serverId: "rd",
              iceIndex: options.positionIceIndex ?? serverIce.length - 1,
            }
          : { kind: "server", serverId: "rd" },
      approachedIceId: iceOuter,
      lastPassedIceId: iceOuter,
      brokenSubroutineIndexes: [],
      resolvedSubroutineIndexes: [],
      successful: false,
      accessCount: 1,
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function definitionsFor(state: GameState): Record<string, CardDefinition> {
  const definitions: Record<string, CardDefinition> = {
    simple_ice: definition("simple_ice", { type: "ice", title: "Simple ICE" }),
    hq_ice_def: definition("hq_ice_def", { type: "ice", title: "HQ ICE" }),
    agenda_target: definition("agenda_target", {
      type: "agenda",
      title: "Agenda Target",
    }),
    "onr_proteus_062_lesley-major": definition(
      "onr_proteus_062_lesley-major",
      { title: "Lesley Major" },
    ),
    "onr_v1_369_singapore-city-grid": definition(
      "onr_v1_369_singapore-city-grid",
      { title: "HQ Ice Swap" },
    ),
    "onr_v1_364_omni-kismet-ph-d": definition(
      "onr_v1_364_omni-kismet-ph-d",
      { title: "Omni Kismet, Ph.D." },
    ),
    "onr_proteus_033_mobile-barricade": definition(
      "onr_proteus_033_mobile-barricade",
      { type: "ice", title: "Mobile Barricade" },
    ),
    "onr_classic_011_glacier": definition("onr_classic_011_glacier", {
      type: "ice",
      title: "Glacier",
    }),
  };
  for (const card of Object.values(state.cardInstances)) {
    definitions[card.definitionId] ??= definition(card.definitionId);
  }
  return definitions;
}

function hostFor(state: GameState): FortPassWindowHost {
  const definitions = definitionsFor(state);
  return {
    state,
    cards: {
      definitionFor: (cardId) =>
        definitions[state.cardInstances[cardId]!.definitionId]!,
      cardInstanceFor: (cardId) => state.cardInstances[cardId]!,
      publicInstalledCorpCardIdentityKnown: (cardId) =>
        Boolean(
          state.cardInstances[cardId]?.faceup ||
            state.cardInstances[cardId]?.rezzed,
        ),
    },
    servers: {
      mustServer: (serverId) => {
        const server = state.corp.servers.find(
          (candidate) => candidate.id === serverId,
        );
        if (!server) throw new Error(`Server fehlt: ${serverId}`);
        return server as CorpServer;
      },
    },
    payment: {
      spendCorpCredits: (amount) => {
        state.corp.credits -= amount;
      },
    },
  };
}

function action(
  state: GameState,
  payload?: LegalAction["payload"],
  costs: LegalAction["costs"] = [],
): LegalAction {
  return buildLegalAction(
    state,
    "corp",
    "trigger_ability",
    "trigger_ability",
    "source_root",
    costs,
    payload,
  );
}

function choiceAction(selectedOptionId: string): PlayerAction {
  return {
    matchId: "match_1",
    side: "corp",
    actionId: "choice",
    clientKnownStateVersion: 21,
    selectedChoices: {
      choiceId: "choice",
      selectedOptionIds: [selectedOptionId],
    },
  };
}

describe("fort pass window", () => {
  it("returns no fort pass actions without an active server-position run", () => {
    const state = makeState({ positionKind: "ice", timingPoint: "run.approach_ice" });
    const host = hostFor(state);

    expect(buildCorpFortPassWindowActions(host)).toEqual([]);
  });

  it("builds and resolves fort pass advancement actions with stable payload", () => {
    const state = makeState();
    const host = hostFor(state);

    const actions = buildCorpFortPassWindowActions(host);

    expect(actions).toHaveLength(1);
    expect(actions[0]?.payload).toMatchObject({
      cardId: "source_root",
      sourceDefinitionId: "onr_proteus_062_lesley-major",
      targetCardId: "target_root",
      targetCardDefinitionId: "agenda_target",
      serverId: "rd",
      serverLabel: "R&D",
      passedIceId: "ice_outer",
      fortRunWindowAbility:
        "add_advancement_counters_after_passing_last_ice_on_this_fort",
      advancementCountersAdded: 2,
      addedCounterAmount: 2,
      creditCost: 5,
    });

    const result = resolveFortPassAdvancementWindow(host, actions[0]!);

    expect(result).toMatchObject({
      handled: true,
      windowPassed: true,
      sourceDefinitionId: "onr_proteus_062_lesley-major",
      serverLabel: "R&D",
    });
    expect(state.corp.credits).toBe(3);
    expect(state.cardInstances.target_root?.advancementCounters).toBe(2);
    expect(state.run?.fortPassWindowUsedSourceIdsThisRun).toEqual([
      "source_root",
    ]);
    expect(state.run?.rootRezWindowPassedKeys).toEqual(["run_1:server:rd"]);
  });

  it("starts and resolves HQ Ice Swap as a hidden-info-safe HQ ICE swap", () => {
    const state = makeState();
    state.cardInstances.source_root = {
      ...state.cardInstances.source_root!,
      definitionId: "onr_v1_369_singapore-city-grid",
    };
    const host = hostFor(state);
    const server = host.servers.mustServer("rd");
    const run = state.run!;

    const actions = buildHqIceSwapRunActions(host, run, server);

    expect(actions.map((candidate) => candidate.payload)).toEqual([
      expect.objectContaining({
        cardId: "source_root",
        targetIceId: "ice_inner",
        serverId: "rd",
        iceIndex: 0,
        v1918UpgradeAbility: "hq_ice_swap",
        hiddenZoneBarrier: true,
        hiddenZoneAction: "hq_ice_swap_choice",
      }),
      expect.objectContaining({
        targetIceId: "ice_outer",
        iceIndex: 1,
      }),
    ]);

    startHqIceSwapChoice(host, actions[0]!);

    expect(state.pendingChoice).toMatchObject({
      source: "card_implementation.hq_ice_swap:source_root:rd:ice_inner:0:run_1",
      kind: "select_cards",
      visibility: "hidden_info_barrier",
      options: [
        expect.objectContaining({
          value: "hq_ice",
          publicLabel: "HQ-ICE",
        }),
      ],
    });
    expect(JSON.stringify(actions[0]!.payload)).not.toMatch(/"cardInstances"/);

    const resolveAction = action(state);
    const result = resolveHqIceSwapChoice(
      host,
      resolveAction,
      choiceAction("card_hq_ice"),
    );

    expect(result).toMatchObject({
      handled: true,
      choiceResolved: true,
      selectedIceId: "ice_inner",
      selectedHqIceId: "hq_ice",
      iceOrderChanged: true,
    });
    expect(server.ice[0]).toBe("hq_ice");
    expect(state.corp.hq).toEqual(["ice_inner"]);
    expect(state.cardInstances.hq_ice?.zone).toEqual({
      side: "corp",
      zone: "serverIce",
      serverId: "rd",
    });
    expect(state.cardInstances.ice_inner?.zone).toEqual({
      side: "corp",
      zone: "hq",
    });
    expect(resolveAction.payload).toMatchObject({
      hiddenZoneBarrier: true,
      hiddenZoneAction: "hq_ice_swap_swap",
      sourceDefinitionId: "onr_v1_369_singapore-city-grid",
      swappedIceCount: 1,
      oncePerRunConsumed: true,
    });
  });

  it("builds and resolves start-run ICE reposition actions without leaking concealed ICE", () => {
    const state = makeState({
      timingPoint: "run.approach_ice",
      phase: "approach_ice",
      positionKind: "ice",
      positionIceIndex: 1,
    });
    const host = hostFor(state);
    const server = host.servers.mustServer("rd");
    const run = state.run!;

    const actions = buildStartRunIceRepositionActions(host, run, server);

    expect(actions).toHaveLength(1);
    expect(actions[0]?.payload).toMatchObject({
      cardId: "ice_outer",
      sourceDefinitionId: "onr_proteus_033_mobile-barricade",
      serverId: "rd",
      serverLabel: "R&D",
      sourceIceIndex: 1,
      targetIceIndex: 0,
      fortRunWindowAbility: "move_self_to_different_position_on_same_fort",
      creditCost: 1,
    });

    const result = resolveStartRunIceRepositionWindow(host, actions[0]!);

    expect(result).toMatchObject({
      handled: true,
      iceOrderChanged: true,
      sourceDefinitionId: "onr_proteus_033_mobile-barricade",
      selectedIceId: "ice_inner",
    });
    expect(server.ice).toEqual(["ice_outer", "ice_inner"]);
    expect(state.cardInstances.ice_outer?.faceup).toBe(true);
    expect(state.corp.credits).toBe(7);
    expect(actions[0]?.payload).toMatchObject({
      publicRevealDefinitionId: "onr_proteus_033_mobile-barricade",
      revealedSource: true,
      newApproachIceRevealed: false,
      corpCreditsAfter: 7,
    });
  });

  it("moves unrezzed Glacier to the outermost position of another fort at run start", () => {
    const state = makeState({
      timingPoint: "run.approach_ice",
      phase: "approach_ice",
      positionKind: "ice",
      positionIceIndex: 1,
    });
    state.corp.servers.push({
      id: "remote_1",
      kind: "remote",
      label: "Remote 1",
      ice: ["glacier" as CardInstanceId],
      root: [],
    });
    state.cardInstances.glacier = instance("glacier", "onr_classic_011_glacier", {
      zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
      faceup: false,
      rezzed: false,
    });
    const host = hostFor(state);
    const server = host.servers.mustServer("rd");
    const run = state.run!;

    const glacierAction = buildStartRunIceRepositionActions(host, run, server)
      .find(
        (candidate) =>
          candidate.payload?.fortRunWindowAbility ===
            "move_self_to_outermost_position_on_other_fort" &&
          candidate.payload?.targetServerId === "rd",
      );

    expect(glacierAction?.payload).toMatchObject({
      cardId: "glacier",
      sourceDefinitionId: "onr_classic_011_glacier",
      sourceServerId: "remote_1",
      targetServerId: "rd",
      sourceIceIndex: 0,
      targetIceIndex: 2,
      creditCost: 1,
    });

    const result = resolveStartRunIceRepositionWindow(host, glacierAction!);

    expect(result).toMatchObject({
      handled: true,
      iceOrderChanged: true,
      selectedIceId: "glacier",
      sourceDefinitionId: "onr_classic_011_glacier",
      serverId: "rd",
    });
    expect(host.servers.mustServer("remote_1").ice).toEqual([]);
    expect(host.servers.mustServer("rd").ice).toEqual([
      "ice_inner",
      "ice_outer",
      "glacier",
    ]);
    expect(state.cardInstances.glacier?.zone).toEqual({
      side: "corp",
      zone: "serverIce",
      serverId: "rd",
    });
    expect(state.cardInstances.glacier?.faceup).toBe(true);
    expect(state.run?.position).toEqual({
      kind: "ice",
      serverId: "rd",
      iceIndex: 2,
    });
    expect(state.run?.approachedIceId).toBe("glacier");
    expect(state.corp.credits).toBe(7);
    expect(glacierAction?.payload).toMatchObject({
      publicRevealDefinitionId: "onr_classic_011_glacier",
      revealedSource: true,
      corpCreditsAfter: 7,
    });
  });
});
