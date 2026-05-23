import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  DEMO_CARDS_BY_ID,
  getPlayerView,
  hashState,
  isHiddenInfoBarrierEvent,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  moveRunnerCardToGrip,
  mustAction,
  sourceDefinition,
  toRunnerTurn,
  V095_CORP_DECK,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import type { CardDefinition, CardInstanceId, GameState } from "@netgrid/shared";

describe("HiddenInfo special zone projection", () => {
  it("moves a card to side-private Set Aside atomically without public identity leaks and replays deterministically", () => {
    let state = toRunnerTurn(createGameAfterSetup({ seed: "v122-set-aside" }));
    const cardId = moveRunnerCardToGrip(state, "simple_economy_event");
    state.specialZoneHarness = {
      actor: "runner",
      cardInstanceId: cardId,
      setAside: {
        visibility: "side_private",
        visibilitySide: "runner",
        reason: "v122_side_private_set_aside",
        allowReturn: true,
      },
    };
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "move_to_set_aside" &&
        action.payload?.cardId === cardId,
    );

    expect(validateGameState(state).ok).toBe(true);
    expect(state.runner.grip).not.toContain(cardId);
    expect(state.specialZones?.setAside).toEqual([cardId]);
    expect(state.cardInstances[cardId]?.zone).toMatchObject({
      side: "special",
      zone: "set_aside",
      visibility: "side_private",
      visibilitySide: "runner",
    });
    expect(
      getPlayerView(state, "runner").specialZones?.setAside[0],
    ).toMatchObject({
      definitionId: "simple_economy_event",
      owner: "runner",
      controller: "runner",
    });
    expect(
      getPlayerView(state, "corp").specialZones?.setAside[0],
    ).toMatchObject({ known: false });
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Simple Economy Event",
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "move_to_set_aside",
      specialZone: "set_aside",
      redactedKind: "special_zone",
    });
    expect(JSON.stringify(state.eventLog.at(-1)?.publicPayload)).not.toContain(
      "Simple Economy Event",
    );
    expect(isHiddenInfoBarrierEvent(state.eventLog.at(-1)!)).toBe(true);

    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

});

describe("Proteus Hidden-Resource Foundation Harness", () => {
  const hiddenResourceDefinitionId = "test_hidden_runner_resource_harness";
  const hiddenResourceTitle = "Hidden Resource Harness";

  afterEach(() => {
    delete DEMO_CARDS_BY_ID[hiddenResourceDefinitionId];
  });

  function ensureHiddenResourceHarnessCard(): void {
    DEMO_CARDS_BY_ID[hiddenResourceDefinitionId] ??= {
      id: hiddenResourceDefinitionId,
      title: hiddenResourceTitle,
      side: "runner",
      type: "resource",
      subtypes: ["hidden"],
      implementationStatus: "playable_mvp",
      installCost: 1,
      rulesText:
        "Harness-only hidden Runner resource for side-safe install and trash tests.",
      mechanics: [
        "install_resource",
        "resource",
        "hidden_runner_resource_foundation",
        "test_fixture",
      ],
    } satisfies CardDefinition;
  }

  function hiddenResourceHarnessGame(seed: string): GameState {
    ensureHiddenResourceHarnessCard();
    return createGameAfterSetup({
      seed,
      runnerDeck: {
        id: `hidden_resource_harness_runner_${seed}`,
        name: "Hidden Resource Fixture Runner",
        side: "runner",
        identity: "runner_identity_001",
        cards: [
          { id: "simple_economy_event", quantity: 2 },
          { id: "simple_fracter", quantity: 1 },
          { id: hiddenResourceDefinitionId, quantity: 2 },
        ],
      },
      corpDeck: V095_CORP_DECK,
      agendaPointsToWin: 7,
    });
  }

  function installHiddenResource(seed: string): {
    initial: GameState;
    state: GameState;
    hiddenResourceId: CardInstanceId;
  } {
    let state = toRunnerTurn(hiddenResourceHarnessGame(seed));
    state.runner.credits = 6;
    const hiddenResourceId = moveRunnerCardToGrip(
      state,
      hiddenResourceDefinitionId,
    );
    const initial = structuredClone(state);
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === hiddenResourceDefinitionId,
    );
    return { initial, state, hiddenResourceId };
  }

  it("installs hidden Runner Resources without leaking identity to Corp view or PublicEvents", () => {
    const { initial, state, hiddenResourceId } = installHiddenResource(
      "hidden-resource-install",
    );
    const hiddenSlotId = getPlayerView(state, "corp").opponent.rig?.find(
      (card) => card.known === false,
    )?.instanceId;

    expect(state.cardInstances[hiddenResourceId]).toMatchObject({
      faceup: false,
      rezzed: false,
      zone: { side: "runner", zone: "rig" },
    });
    expect(getPlayerView(state, "runner").own.rig).toContainEqual(
      expect.objectContaining({
        instanceId: hiddenResourceId,
        known: true,
        definitionId: hiddenResourceDefinitionId,
        title: hiddenResourceTitle,
        type: "resource",
        subtypes: ["hidden"],
      }),
    );
    expect(getPlayerView(state, "corp").opponent.rig).toContainEqual(
      expect.objectContaining({
        instanceId: hiddenSlotId,
        known: false,
        type: "resource",
        subtypes: ["hidden_runner_resource"],
        owner: "runner",
        controller: "runner",
      }),
    );
    expect(hiddenSlotId).toBeDefined();
    expect(hiddenSlotId).not.toBe(hiddenResourceId);

    const corpViewJson = JSON.stringify(getPlayerView(state, "corp"));
    expect(corpViewJson).not.toContain(hiddenResourceDefinitionId);
    expect(corpViewJson).not.toContain(hiddenResourceTitle);
    expect(corpViewJson).not.toContain(hiddenResourceId);

    const installPayload = state.eventLog.at(-1)?.publicPayload ?? {};
    expect(installPayload).toMatchObject({
      actionType: "install_card",
      label: "Runner installiert eine verdeckte Resource.",
      redactedKind: "hidden_runner_resource",
      hiddenRunnerResourceInstall: true,
      hiddenResourceSlotId: hiddenSlotId,
      zoneLabel: "Resource",
    });
    expect(JSON.stringify(installPayload)).not.toContain(
      hiddenResourceDefinitionId,
    );
    expect(JSON.stringify(installPayload)).not.toContain(hiddenResourceTitle);
    expect(JSON.stringify(installPayload)).not.toContain(hiddenResourceId);

    const replay = replayEvents(
      initial,
      state.eventLog.slice(initial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("lets Corp tag-trash redacted hidden-resource slots and reveals only in the heap", () => {
    const { state: installed, hiddenResourceId } =
      installHiddenResource("hidden-resource-trash");
    let state = installed;
    state.activeSide = "corp";
    state.phase = "corp_action_phase";
    state.timingPoint = "corp_action.main";
    state.corp.clicks = 3;
    state.corp.credits = 5;
    state.runner.tags = 1;

    const hiddenSlotId = getPlayerView(state, "corp").opponent.rig?.find(
      (card) => card.known === false,
    )?.instanceId;
    const trashAction = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "trash_resource" &&
        action.payload?.hiddenResourceSlotId === hiddenSlotId,
    );

    expect(trashAction.label).toBe("Verdeckte Runner-Resource trashen");
    expect(trashAction.payload).toMatchObject({
      cardId: hiddenSlotId,
      resourceSlotId: hiddenSlotId,
      hiddenResourceSlotId: hiddenSlotId,
      redactedKind: "hidden_runner_resource",
    });
    expect(JSON.stringify(trashAction)).not.toContain(
      hiddenResourceDefinitionId,
    );
    expect(JSON.stringify(trashAction)).not.toContain(hiddenResourceTitle);
    expect(JSON.stringify(trashAction)).not.toContain(hiddenResourceId);

    const trashInitial = structuredClone(state);
    state = apply(
      state,
      "corp",
      (action) => action.actionId === trashAction.actionId,
    );

    expect(state.runner.rig.resources).not.toContain(hiddenResourceId);
    expect(state.runner.heap).toContain(hiddenResourceId);
    expect(state.cardInstances[hiddenResourceId]).toMatchObject({
      faceup: true,
      rezzed: true,
      zone: { side: "runner", zone: "heap" },
    });
    expect(getPlayerView(state, "corp").opponent.discardCards).toContainEqual(
      expect.objectContaining({
        instanceId: hiddenResourceId,
        known: true,
        definitionId: hiddenResourceDefinitionId,
        title: hiddenResourceTitle,
      }),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "trash_resource",
      cardDefinitionId: hiddenResourceDefinitionId,
      title: hiddenResourceTitle,
      hiddenResourceSlotId: hiddenSlotId,
      hiddenRunnerResourceRevealed: true,
      redactedKind: "hidden_runner_resource",
      zoneLabel: "Resource",
    });

    const replay = replayEvents(
      trashInitial,
      state.eventLog.slice(trashInitial.eventLog.length),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("keeps hidden-resource fixture support out of Proteus card promotion", () => {
    ensureHiddenResourceHarnessCard();
    expect(DEMO_CARDS_BY_ID[hiddenResourceDefinitionId]).toMatchObject({
      type: "resource",
      subtypes: ["hidden"],
      mechanics: expect.arrayContaining([
        "hidden_runner_resource_foundation",
        "test_fixture",
      ]),
    });
    expect(
      Object.values(DEMO_CARDS_BY_ID).filter((card) =>
        card.id.startsWith("onr_proteus_") &&
        card.mechanics.includes("hidden_runner_resource_foundation"),
      ),
    ).toHaveLength(0);
  });
});
