import { syntheticCardDefinitionId } from "../../test-fixtures/synthetic-card-definition-id";
import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  ChoiceRequest,
  CorpServer,
  LegalAction,
  PlayerAction,
  ServerId,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  handleHiddenZoneArrangeChoice,
  moveTopTrashToGripForCardImplementation,
  resolveConcealAndReorderInstalledIce,
  startCorpRdTopReorderChoice,
  startSuccessfulRunFortIceReorderChoice,
  type HiddenZoneArrangeChoiceHandlerHost,
} from "./arrange-choice-handlers";

const planningId = 504115485 as CardDefinitionId;
const roninId = 19491241 as CardDefinitionId;
const corpRdTopArrangeSourceId = 1661377163 as CardDefinitionId;
const sourceCardId = "source" as CardInstanceId;

function definition(
  id: number,
  type: CardDefinition["type"] = "program",
  title = String(id),
): CardDefinition {
  return {
    id: id as CardDefinitionId,
    type,
    title: String(title),
  } as CardDefinition;
}

function instance(cardId: CardInstanceId): CardInstance {
  return {
    instanceId: cardId,
    definitionId: syntheticCardDefinitionId(cardId),
    owner: "corp",
    controller: "corp",
    faceup: true,
    rezzed: false,
    zone: { side: "corp", zone: "rd" },
  } as unknown as CardInstance;
}

function action(): LegalAction {
  return {
    side: "runner",
    payload: { cardId: sourceCardId },
  } as unknown as LegalAction;
}

function playerAction(optionIds: string[]): PlayerAction {
  return {
    selectedChoices: { selectedOptionIds: optionIds },
  } as unknown as PlayerAction;
}

function makeHost(
  input: {
    runnerStack?: CardInstanceId[];
    runnerHeap?: CardInstanceId[];
    runnerGrip?: CardInstanceId[];
    corpRd?: CardInstanceId[];
    servers?: CorpServer[];
    pendingChoice?: ChoiceRequest;
    playerAction?: PlayerAction;
    definitions?: Record<string, CardDefinition>;
    instances?: Record<string, CardInstance>;
    legalAction?: LegalAction;
    run?: HiddenZoneArrangeChoiceHandlerHost["state"]["run"];
    hiddenKinds?: Record<string, string>;
    utilitySources?: CardInstanceId[];
  } = {},
): HiddenZoneArrangeChoiceHandlerHost {
  const definitions = input.definitions ?? {};
  const instances: Record<string, CardInstance> = {
    ...Object.fromEntries(
      [
        ...(input.runnerStack ?? []),
        ...(input.runnerHeap ?? []),
        ...(input.runnerGrip ?? []),
        ...(input.corpRd ?? []),
        ...(input.servers ?? []).flatMap((server) => server.ice),
        sourceCardId,
      ].map((cardId) => [cardId, instance(cardId)]),
    ),
    ...(input.instances ?? {}),
  };
  const state = {
    stateVersion: 7,
    activeSide: "runner",
    pendingChoice: input.pendingChoice,
    run: input.run,
    cardInstances: instances,
    runner: {
      stack: input.runnerStack ?? [],
      heap: input.runnerHeap ?? [],
      grip: input.runnerGrip ?? [],
      credits: 4,
      rig: { resources: [sourceCardId], programs: [], hardware: [] },
    },
    corp: {
      rd: input.corpRd ?? [],
      servers: input.servers ?? [],
    },
  } as unknown as HiddenZoneArrangeChoiceHandlerHost["state"];
  return {
    state,
    legalAction: input.legalAction ?? action(),
    ...(input.playerAction ? { playerAction: input.playerAction } : {}),
    cards: {
      definitionFor: (cardId) =>
        definitions[cardId] ?? definition(syntheticCardDefinitionId(cardId)),
      hiddenReplacementLongtailKind: (definitionId) =>
        input.hiddenKinds?.[definitionId],
      hasCorpUtilityKind: (cardId, kind) =>
        kind === "corp_rd_top_reorder" &&
        (input.utilitySources ?? []).includes(cardId),
      mustInstance: (cardId) => {
        const found = instances[cardId];
        if (!found) throw new Error(`missing instance ${cardId}`);
        return found;
      },
    },
    zones: {
      removeFromAllZones: (cardId) => {
        state.runner.heap = state.runner.heap.filter((id) => id !== cardId);
        state.runner.stack = state.runner.stack.filter((id) => id !== cardId);
        state.runner.grip = state.runner.grip.filter((id) => id !== cardId);
      },
    },
    servers: {
      mustServer: (serverId) => {
        const server = state.corp.servers.find(
          (candidate) => candidate.id === serverId,
        );
        if (!server) throw new Error(`missing server ${serverId}`);
        return server;
      },
      publicServerLabel: (serverId) => `Server ${serverId}`,
    },
    choices: {
      iceChoiceLabelForSide: (_cardId, _visibleTo, fallback) => ({
        label: fallback,
        publicLabel: fallback,
      }),
    },
    callbacks: {
      runnerTurnFlags: () => ({
        successfulRunThisTurn: true,
        lastSuccessfulRunServerId: "r1",
      }),
    },
  };
}

function choice(source: string, ids: CardInstanceId[]): ChoiceRequest {
  return {
    choiceId: "choice_1",
    side: "runner",
    source,
    prompt: "Arrange",
    kind: "select_cards",
    options: ids.map((cardId) => ({
      id: `card_${cardId}`,
      label: cardId,
      value: cardId,
    })),
    minSelections: ids.length,
    maxSelections: ids.length,
    stateVersion: 8,
    visibility: "hidden_info_barrier",
  };
}

describe("hidden-zone arrange choice handlers", () => {
  it("moves the top runner heap card to grip without changing heap order semantics", () => {
    const first = "heap_1" as CardInstanceId;
    const top = "heap_2" as CardInstanceId;
    const host = makeHost({
      runnerHeap: [first, top],
      definitions: {
        [first]: definition(3256675163, "program", "Top Heap"),
        [top]: definition(1872895866, "resource", "Second Heap"),
      },
    });

    const result = moveTopTrashToGripForCardImplementation(host, {
      sourceDefinitionId: 2523707740 as CardDefinitionId,
    });

    expect(host.state.runner.heap).toEqual([first]);
    expect(host.state.runner.grip).toEqual([top]);
    expect(result.publicPayload).toMatchObject({
      hiddenZoneAction: "p3_38_move_top_trash_to_grip",
      returnedCardDefinitionId: 1872895866,
      destinationZone: "grip",
    });
  });

  it("handles runner top-five choose-one and arrange-rest choices", () => {
    const a = "a" as CardInstanceId;
    const b = "b" as CardInstanceId;
    const c = "c" as CardInstanceId;
    const host = makeHost({
      runnerStack: [a, b, c],
      pendingChoice: choice(
        "v1922.runner_stack_top5_choose_one_arrange_rest:source:8",
        [a, b, c],
      ),
      playerAction: playerAction([`card_${c}`, `card_${b}`, `card_${a}`]),
    });

    const result = handleHiddenZoneArrangeChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.runner.grip).toEqual([c]);
    expect(host.state.runner.stack).toEqual([b, a]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_runner_stack_top5_choose_one_arrange_rest",
      selectedCount: 1,
      arrangedCount: 2,
    });
    expect(host.state.pendingChoice).toBeUndefined();
  });

  it("starts and resolves Planning Consultants R&D top-five reorder privately", () => {
    const cards = ["rd_1", "rd_2", "rd_3"].map((id) => id as CardInstanceId);
    const source = "planning_source" as CardInstanceId;
    const host = makeHost({
      corpRd: cards,
      definitions: {
        [source]: definition(planningId, "operation", "Planning Consultants"),
      },
      utilitySources: [source],
    });

    startCorpRdTopReorderChoice(host, source);
    expect(host.state.pendingChoice?.choiceId).toBe(
      "v1922_corp_rd_arrange_top5_8",
    );
    expect(host.state.pendingChoice?.visibility).toBe("hidden_info_barrier");
    host.playerAction = playerAction([
      `card_${cards[2]}`,
      `card_${cards[1]}`,
      `card_${cards[0]}`,
    ]);

    const result = handleHiddenZoneArrangeChoice(host);

    expect(result.handled).toBe(true);
    expect(host.state.corp.rd).toEqual([cards[2], cards[1], cards[0]]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "v1922_corp_rd_reorder_top5",
      arrangedCount: 3,
    });
  });

  it.each([0, 1])(
    "resolves Planning Consultants with %i R&D card as a private no-op",
    (cardCount) => {
      const cards = ["rd_1"]
        .slice(0, cardCount)
        .map((id) => id as CardInstanceId);
      const source = "planning_source" as CardInstanceId;
      const host = makeHost({
        corpRd: cards,
        definitions: {
          [source]: definition(planningId, "operation", "Planning Consultants"),
        },
        utilitySources: [source],
      });

      startCorpRdTopReorderChoice(host, source);

      expect(host.state.pendingChoice).toBeUndefined();
      expect(host.legalAction.payload).toMatchObject({
        hiddenZoneBarrier: true,
        hiddenZoneAction: "v1922_corp_rd_reorder_top5",
        arrangedCount: cardCount,
        reorderNoOp: true,
      });
    },
  );

  it("starts and resolves Fortress Respecification without exposing concealed ICE", () => {
    const ice1 = "ice_1" as CardInstanceId;
    const ice2 = "ice_2" as CardInstanceId;
    const source = "fortress_source" as CardInstanceId;
    const server: CorpServer = {
      id: "r1" as Exclude<ServerId, "new_remote">,
      kind: "remote",
      label: "Remote 1",
      ice: [ice1, ice2],
      root: [],
    };
    const host = makeHost({
      servers: [server],
      definitions: {
        [source]: definition(1503590003, "event", "Fortress"),
      },
      hiddenKinds: { 1503590003: "successful_run_fort_ice_reorder" },
      instances: {
        [ice1]: { ...instance(ice1), faceup: false, rezzed: false },
        [ice2]: { ...instance(ice2), faceup: true, rezzed: true },
      },
    });

    startSuccessfulRunFortIceReorderChoice(host, source);
    expect(host.state.pendingChoice?.options[0]).toMatchObject({
      label: "ICE Position 1",
      publicLabel: "ICE Position 1",
    });
    host.playerAction = playerAction([`card_${ice2}`, `card_${ice1}`]);
    const result = handleHiddenZoneArrangeChoice(host);

    expect(result.handled).toBe(true);
    expect(server.ice).toEqual([ice2, ice1]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "successful_run_fort_ice_reorder",
      hiddenOrderChoice: true,
      concealedIceCount: 1,
    });
  });

  it("conceals revealed unrezzed ICE and resolves New Blood reorder", () => {
    const ice1 = "ice_1" as CardInstanceId;
    const ice2 = "ice_2" as CardInstanceId;
    const source = "new_blood_source" as CardInstanceId;
    const server: CorpServer = {
      id: "r1" as Exclude<ServerId, "new_remote">,
      kind: "remote",
      label: "Remote 1",
      ice: [ice1, ice2],
      root: [],
    };
    const host = makeHost({
      servers: [server],
      definitions: {
        [source]: definition(3977091494, "operation", "New Blood"),
      },
      hiddenKinds: { 3977091494: "conceal_and_reorder_installed_ice" },
      legalAction: {
        side: "corp",
        payload: { cardId: source },
      } as unknown as LegalAction,
      instances: {
        [ice1]: { ...instance(ice1), faceup: true, rezzed: false },
        [ice2]: { ...instance(ice2), faceup: true, rezzed: true },
      },
    });

    resolveConcealAndReorderInstalledIce(host);
    expect(host.state.cardInstances[ice1]?.faceup).toBe(false);
    expect(host.state.pendingChoice?.choiceId).toBe(
      "conceal_and_reorder_installed_ice_8",
    );
    host.playerAction = playerAction([`card_${ice2}`, `card_${ice1}`]);
    const result = handleHiddenZoneArrangeChoice(host);

    expect(result.handled).toBe(true);
    expect(server.ice).toEqual([ice2, ice1]);
    expect(host.legalAction.payload).toMatchObject({
      hiddenZoneAction: "conceal_and_reorder_installed_ice",
      hiddenOrderChoice: true,
      concealedIceCount: 1,
    });
  });
});
