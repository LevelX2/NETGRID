import type {
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  GameState,
  ServerId,
  Side,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGame,
  DEMO_CARDS_BY_ID,
  getLegalActions,
  hashState,
  replayEvents,
} from "../../index";

const PRECISION_BRIBERY = "onr_proteus_146_precision-bribery";
const WALL_OF_STATIC = "onr_v1_279_wall-of-static";
const VACANT_SOULKILLER = "onr_v1_346_vacant-soulkiller";

function ensurePrecisionBriberyDefinition(): void {
  DEMO_CARDS_BY_ID[PRECISION_BRIBERY] ??= {
    id: PRECISION_BRIBERY,
    title: "Precision Bribery",
    side: "runner",
    type: "resource",
    subtypes: ["unique"],
    implementationStatus: "playable_mvp",
    installCost: 0,
    rulesText:
      "The Corp cannot create any new data forts. The Corp may trash Precision Bribery by taking an action to pay [4].",
    mechanics: ["runner_resource_install", "data_fort_creation_lock"],
  };
}

function instance(
  id: string,
  definitionId: string,
  owner: Side,
  zone: CardInstance["zone"],
  rezzed = true,
): CardInstance {
  return {
    instanceId: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner,
    controller: owner,
    faceup: rezzed,
    rezzed,
    advancementCounters: 0,
    strengthModifier: 0,
    zone,
  };
}

function apply(
  state: GameState,
  side: Side,
  predicate: (action: ReturnType<typeof getLegalActions>[number]) => boolean,
): GameState {
  const legalAction = getLegalActions(state, side).find(predicate);
  expect(legalAction).toBeDefined();
  if (!legalAction) throw new Error("Missing action");
  const result = applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: legalAction.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function installPrecisionBribery(state: GameState): CardInstanceId {
  const cardId = "proteus_9d_precision_bribery" as CardInstanceId;
  state.cardInstances[cardId] = instance(
    cardId,
    PRECISION_BRIBERY,
    "runner",
    { side: "runner", zone: "rig" },
  );
  state.runner.rig.resources.push(cardId);
  return cardId;
}

function proteus9dFixture(withLock = true): GameState {
  ensurePrecisionBriberyDefinition();
  const state = createGame({
    seed: withLock ? "proteus-9d-locked" : "proteus-9d-unlocked",
    setupMode: "completed",
  });
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.clicks = 3;
  state.corp.credits = 10;

  const remoteId = "remote_1" as Exclude<ServerId, "new_remote">;
  if (!state.corp.servers.some((server) => server.id === remoteId)) {
    state.corp.servers.push({
      id: remoteId,
      kind: "remote",
      label: "Remote 1",
      ice: [],
      root: [],
    });
  }

  const iceId = "proteus_9d_wall" as CardInstanceId;
  const assetId = "proteus_9d_asset" as CardInstanceId;
  state.cardInstances[iceId] = instance(iceId, WALL_OF_STATIC, "corp", {
    side: "corp",
    zone: "hq",
  });
  state.cardInstances[assetId] = instance(assetId, VACANT_SOULKILLER, "corp", {
    side: "corp",
    zone: "hq",
  });
  state.corp.hq.push(iceId, assetId);

  if (withLock) installPrecisionBribery(state);
  return state;
}

describe("Proteus Phase 9d data-fort creation lock", () => {
  it("blocks new-remote Corp installs while keeping existing-fort installs legal", () => {
    const state = proteus9dFixture();
    const actions = getLegalActions(state, "corp");

    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          action.payload?.serverId === "new_remote",
      ),
    ).toBe(false);
    expect(
      actions.some(
        (action) =>
          action.type === "install_card" &&
          action.payload?.serverId === "remote_1",
      ),
    ).toBe(true);
    expect(
      actions.find(
        (action) =>
          action.type === "trigger_ability" &&
          action.payload?.corpAbility ===
            "trash_new_data_fort_creation_lock_source",
      ),
    ).toMatchObject({
      costs: [{ clicks: 1, credits: 4 }],
      payload: {
        sourceDefinitionId: PRECISION_BRIBERY,
        newDataFortCreationLock: true,
      },
    });
  });

  it("revalidates side, stale action, cost, and stale new-remote install actions", () => {
    const unlocked = proteus9dFixture(false);
    const staleNewRemote = getLegalActions(unlocked, "corp").find(
      (action) =>
        action.type === "install_card" &&
        action.payload?.cardId === "proteus_9d_wall" &&
        action.payload?.serverId === "new_remote",
    );
    expect(staleNewRemote).toBeDefined();

    const state = structuredClone(unlocked);
    installPrecisionBribery(state);
    const trashAction = getLegalActions(state, "corp").find(
      (action) =>
        action.payload?.corpAbility ===
        "trash_new_data_fort_creation_lock_source",
    );
    expect(trashAction).toBeDefined();
    if (!trashAction || !staleNewRemote) throw new Error("Missing action");

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: trashAction.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(wrongSide.ok).toBe(false);
    if (!wrongSide.ok) expect(wrongSide.error.code).toBe("ERR_WRONG_SIDE");

    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: trashAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("ERR_STALE_STATE");

    const rejectedNewRemote = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: staleNewRemote.actionId,
      clientKnownStateVersion: state.stateVersion,
    });
    expect(rejectedNewRemote.ok).toBe(false);
    if (!rejectedNewRemote.ok)
      expect(rejectedNewRemote.error.code).toBe("ERR_UNKNOWN_ACTION");

    const broke = structuredClone(state);
    broke.corp.credits = 3;
    expect(
      getLegalActions(broke, "corp").some(
        (action) =>
          action.payload?.corpAbility ===
          "trash_new_data_fort_creation_lock_source",
      ),
    ).toBe(false);
  });

  it("lets the Corp trash the lock source and restores deterministic new-remote installs", () => {
    const initial = proteus9dFixture();
    const before = structuredClone(initial);
    const next = apply(
      initial,
      "corp",
      (action) =>
        action.payload?.corpAbility ===
        "trash_new_data_fort_creation_lock_source",
    );

    expect(next.runner.rig.resources).not.toContain(
      "proteus_9d_precision_bribery",
    );
    expect(next.runner.heap).toContain("proteus_9d_precision_bribery");
    expect(next.corp.credits).toBe(6);
    expect(next.corp.clicks).toBe(2);
    expect(
      getLegalActions(next, "corp").some(
        (action) =>
          action.type === "install_card" &&
          action.payload?.serverId === "new_remote",
      ),
    ).toBe(true);
    expect(next.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trigger_ability",
      sourceDefinitionId: PRECISION_BRIBERY,
      trashedCardDefinitionId: PRECISION_BRIBERY,
      newDataFortCreationLockRemoved: true,
      trashCostPaid: 4,
    });
    expect(
      replayEvents(before, next.eventLog.slice(before.eventLog.length))
        .actualFinalStateHash,
    ).toBe(hashState(next));
  });
});
