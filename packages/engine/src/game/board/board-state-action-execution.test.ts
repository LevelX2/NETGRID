import type {
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  handleBoardStateActionExecution,
  type BoardStateActionExecutionHost,
} from "./board-state-action-execution";

const ADVANCED_CARD_ID = "advanced_1" as CardInstanceId;
const RESOURCE_ID = "resource_1" as CardInstanceId;
const HIDDEN_RESOURCE_SLOT_ID = "hidden_resource_slot_1" as CardInstanceId;
const ADVANCED_CARD_DEFINITION_ID = "onr_v1_308_acme-savings-and-loan";
const RESOURCE_DEFINITION_ID = "onr_v1_151_aujourdoui";

function baseState(): GameState {
  const remote: CorpServer = {
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: [],
    root: [ADVANCED_CARD_ID],
  };
  return {
    stateVersion: 7,
    activeSide: "corp",
    phase: "corp_action_phase",
    timingPoint: "corp_action.main",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      credits: 5,
      clicks: 3,
      tags: 1,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      identity: "runner_identity" as CardInstanceId,
      rig: { programs: [], hardware: [], resources: [RESOURCE_ID] },
    },
    corp: {
      credits: 5,
      clicks: 3,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [],
      identity: "corp_identity" as CardInstanceId,
      badPublicity: 0,
      servers: [remote],
    },
    cardInstances: {
      [ADVANCED_CARD_ID]: instance(ADVANCED_CARD_ID, ADVANCED_CARD_DEFINITION_ID, {
        owner: "corp",
        controller: "corp",
        zone: { side: "corp", zone: "serverRoot", serverId: "remote_1" },
      }),
      [RESOURCE_ID]: instance(RESOURCE_ID, RESOURCE_DEFINITION_ID, {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
      }),
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

function instance(
  id: CardInstanceId,
  definitionId: string,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    id,
    instanceId: id,
    definitionId,
    owner: options.owner ?? "runner",
    controller: options.controller ?? "runner",
    zone: options.zone ?? { side: "runner", zone: "rig" },
    faceup: options.faceup ?? true,
    rezzed: options.rezzed ?? true,
    advancementCounters: options.advancementCounters ?? 0,
    strengthModifier: 0,
    ...options,
  } as unknown as CardInstance;
}

function legalAction(
  type: LegalAction["type"],
  payload: NonNullable<LegalAction["payload"]> = {},
): LegalAction {
  return {
    actionId: `${type}.1`,
    type,
    label: type,
    side: type === "change_card_control" ? "runner" : "corp",
    source: "test",
    stateVersion: 7,
    timingPoint: "corp_action.main",
    costs: [],
    payload,
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 8,
  } as unknown as LegalAction;
}

function hostFor(
  targetState: GameState,
  calls: string[] = [],
): BoardStateActionExecutionHost {
  return {
    state: targetState,
    zones: {
      removeFromAllZones: (cardId) => {
        calls.push(`remove:${cardId}`);
        targetState.runner.rig.resources = targetState.runner.rig.resources.filter(
          (id) => id !== cardId,
        );
        for (const server of targetState.corp.servers)
          server.root = server.root.filter((id) => id !== cardId);
        targetState.specialZones = {
          setAside: (targetState.specialZones?.setAside ?? []).filter(
            (id) => id !== cardId,
          ),
          removedFromGame: (
            targetState.specialZones?.removedFromGame ?? []
          ).filter((id) => id !== cardId),
        };
      },
      serverById: (serverId) => {
        const server = targetState.corp.servers.find((item) => item.id === serverId);
        if (!server) throw new Error("missing server");
        return server;
      },
    },
    payment: {
      spendClick: (side) => {
        calls.push(`click:${side}`);
        if (side === "corp") targetState.corp.clicks -= 1;
        else targetState.runner.clicks -= 1;
      },
      spendCredits: (side, amount) => {
        calls.push(`credits:${side}:${amount}`);
        if (side === "corp") targetState.corp.credits -= amount;
        else targetState.runner.credits -= amount;
      },
    },
    runner: {
      resolveHiddenRunnerResourceSlot: (slotId) =>
        slotId === HIDDEN_RESOURCE_SLOT_ID ? RESOURCE_ID : undefined,
      isConcealedRunnerResource: (cardId) => cardId === RESOURCE_ID,
      hiddenRunnerResourceSlotId: () => HIDDEN_RESOURCE_SLOT_ID,
      trashInstalledCardToHeap: (cardId, action) => {
        calls.push(`trash:${cardId}:${action?.type ?? "none"}`);
        targetState.runner.rig.resources =
          targetState.runner.rig.resources.filter((id) => id !== cardId);
        targetState.runner.heap.push(cardId);
      },
    },
    fort: {
      markRovingSubmarineActivityForServer: (serverId, action) =>
        calls.push(`roving:${serverId}:${action.type}`),
    },
  };
}

describe("board-state-action-execution", () => {
  it("does not import from index or contain public event wiring", () => {
    const source = readFileSync(
      new URL("./board-state-action-execution.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("BuildEvent");
  });

  it("returns unhandled for unrelated actions", () => {
    const calls: string[] = [];
    const result = handleBoardStateActionExecution(
      hostFor(baseState(), calls),
      legalAction("gain_credit"),
    );

    expect(result).toEqual({ handled: false });
    expect(calls).toEqual([]);
  });

  it("advances an installed card and marks Roving Submarine activity", () => {
    const calls: string[] = [];
    const targetState = baseState();
    const result = handleBoardStateActionExecution(
      hostFor(targetState, calls),
      legalAction("advance_card", { cardId: ADVANCED_CARD_ID }),
    );

    expect(result.handled).toBe(true);
    expect(targetState.corp.clicks).toBe(2);
    expect(targetState.corp.credits).toBe(4);
    expect(targetState.cardInstances[ADVANCED_CARD_ID]?.advancementCounters).toBe(1);
    expect(calls).toEqual([
      "click:corp",
      "credits:corp:1",
      "roving:remote_1:advance_card",
    ]);
  });

  it("trashes a hidden runner resource through the stable payload contract", () => {
    const calls: string[] = [];
    const targetState = baseState();
    const action = legalAction("trash_resource", {
      cardId: HIDDEN_RESOURCE_SLOT_ID,
    });
    const result = handleBoardStateActionExecution(hostFor(targetState, calls), action);

    expect(result.handled).toBe(true);
    expect(targetState.corp.clicks).toBe(2);
    expect(targetState.corp.credits).toBe(3);
    expect(targetState.runner.rig.resources).not.toContain(RESOURCE_ID);
    expect(targetState.runner.heap).toContain(RESOURCE_ID);
    expect(action.payload).toMatchObject({
      cardId: HIDDEN_RESOURCE_SLOT_ID,
      hiddenResourceSlotId: HIDDEN_RESOURCE_SLOT_ID,
      hiddenRunnerResource: true,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: RESOURCE_DEFINITION_ID,
      redactedKind: "hidden_runner_resource",
    });
    expect(calls).toEqual([
      "click:corp",
      "credits:corp:2",
      `trash:${RESOURCE_ID}:trash_resource`,
    ]);
  });

  it("moves a card to set aside with stable special-zone payload", () => {
    const targetState = baseState();
    targetState.cardInstances[RESOURCE_ID] = {
      ...(targetState.cardInstances[RESOURCE_ID] as CardInstance),
      counters: { mark: 2 },
    } as CardInstance;
    targetState.specialZoneHarness = {
      actor: "corp",
      cardInstanceId: RESOURCE_ID,
      setAside: {
        visibility: "side_private",
        visibilitySide: "runner",
        reason: "test_reason",
      },
    } as unknown as NonNullable<GameState["specialZoneHarness"]>;
    const action = legalAction("move_to_set_aside", { cardId: RESOURCE_ID });

    const result = handleBoardStateActionExecution(hostFor(targetState), action);

    expect(result.handled).toBe(true);
    expect(targetState.specialZones?.setAside).toEqual([RESOURCE_ID]);
    expect(targetState.cardInstances[RESOURCE_ID]).toMatchObject({
      zone: {
        side: "special",
        zone: "set_aside",
        visibility: "side_private",
        visibilitySide: "runner",
      },
    });
    expect(targetState.cardInstances[RESOURCE_ID]?.counters).toBeUndefined();
    expect(action.payload).toMatchObject({
      cardId: RESOURCE_ID,
      specialZone: "set_aside",
      specialZoneVisibility: "side_private",
      specialZoneVisibilitySide: "runner",
      specialZoneReason: "test_reason",
      redactedKind: "special_zone",
    });
  });

  it("returns a set-aside card to its original zone", () => {
    const targetState = baseState();
    targetState.runner.rig.resources = [];
    targetState.specialZones = { setAside: [RESOURCE_ID], removedFromGame: [] };
    targetState.cardInstances[RESOURCE_ID] = instance(RESOURCE_ID, RESOURCE_DEFINITION_ID, {
      zone: {
        side: "special",
        zone: "set_aside",
        visibility: "public",
        returnZone: { side: "runner", zone: "rig" },
      },
    });
    targetState.specialZoneHarness = {
      actor: "corp",
      cardInstanceId: RESOURCE_ID,
      setAside: {
        visibility: "public",
        allowReturn: true,
        returnZone: { side: "runner", zone: "rig" },
        reason: "return_reason",
      },
    } as unknown as NonNullable<GameState["specialZoneHarness"]>;
    const action = legalAction("return_from_set_aside", { cardId: RESOURCE_ID });

    handleBoardStateActionExecution(hostFor(targetState), action);

    expect(targetState.specialZones.setAside).toEqual([]);
    expect(targetState.runner.rig.resources).toEqual([RESOURCE_ID]);
    expect(targetState.cardInstances[RESOURCE_ID]?.zone).toEqual({
      side: "runner",
      zone: "rig",
    });
    expect(action.payload).toMatchObject({
      cardId: RESOURCE_ID,
      specialZone: "set_aside",
      specialZoneReason: "return_reason",
      redactedKind: "special_zone",
    });
  });

  it("changes card control with stable payload fields", () => {
    const targetState = baseState();
    targetState.cardInstances[RESOURCE_ID] = instance(RESOURCE_ID, RESOURCE_DEFINITION_ID, {
      controller: "runner",
    });
    targetState.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: RESOURCE_ID,
      controlChange: {
        newController: "corp",
        visibility: "public",
        reason: "control_reason",
      },
    } as unknown as NonNullable<GameState["specialZoneHarness"]>;
    const action = legalAction("change_card_control", {
      cardId: RESOURCE_ID,
      newController: "corp",
    });

    handleBoardStateActionExecution(hostFor(targetState), action);

    expect(targetState.cardInstances[RESOURCE_ID]?.controller).toBe("corp");
    expect(action.payload).toMatchObject({
      cardId: RESOURCE_ID,
      oldController: "runner",
      newController: "corp",
      controlChangeVisibility: "public",
      controlChangeReason: "control_reason",
      ownershipChanged: false,
      redactedKind: "control_change",
    });
  });
});
