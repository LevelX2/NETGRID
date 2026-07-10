import { afterEach, describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  CARD_DEFINITIONS_BY_ID,
  getPlayerView,
  hashState,
  isHiddenInfoBarrierEvent,
  replayEvents,
  validateGameState,
} from "../../index";
import {
  apply,
  applyChoice,
  keepOnlyCorpHqCard,
  moveRunnerCardToGrip,
  moveCorpCardToHq,
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
  const hiddenActivationDefinitionId = "onr_v1_161_fall-guy";
  const hiddenActivationTitle = "Fall Guy";
  const hiddenActivatedAbilityDefinitionId = "onr_v1_158_danshis-second-id";
  const hiddenActivatedAbilityTitle = "Danshi's Second ID";
  const hiddenOriginalSubtypesByDefinitionId = new Map<string, string[]>();

  afterEach(() => {
    delete CARD_DEFINITIONS_BY_ID[hiddenResourceDefinitionId];
    for (const [definitionId, subtypes] of hiddenOriginalSubtypesByDefinitionId) {
      CARD_DEFINITIONS_BY_ID[definitionId] = {
        ...CARD_DEFINITIONS_BY_ID[definitionId],
        subtypes,
      } as CardDefinition;
    }
    hiddenOriginalSubtypesByDefinitionId.clear();
  });

  function ensureHiddenResourceHarnessCard(): void {
    CARD_DEFINITIONS_BY_ID[hiddenResourceDefinitionId] ??= {
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

  function makeExistingCardImplementationResourceHiddenForHarness(
    definitionId = hiddenActivationDefinitionId,
  ): void {
    const definition = CARD_DEFINITIONS_BY_ID[definitionId];
    if (!definition)
      throw new Error("Missing hidden activation fixture definition.");
    if (!hiddenOriginalSubtypesByDefinitionId.has(definitionId)) {
      hiddenOriginalSubtypesByDefinitionId.set(
        definitionId,
        [...(definition.subtypes ?? [])],
      );
    }
    CARD_DEFINITIONS_BY_ID[definitionId] = {
      ...definition,
      subtypes: [...new Set([...(definition.subtypes ?? []), "hidden"])],
    };
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
        concealed: true,
        hiddenRunnerResource: true,
      }),
    );
    expect(getPlayerView(state, "corp").opponent.rig).toContainEqual(
      expect.objectContaining({
        instanceId: hiddenSlotId,
        known: false,
        concealed: true,
        hiddenRunnerResource: true,
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

  it("reveals and trashes hidden Runner Resources atomically when CardImplementation event modifications pay trash-source costs", () => {
    makeExistingCardImplementationResourceHiddenForHarness();
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "hidden-resource-activation",
        runnerDeck: {
          id: "hidden_resource_activation_runner",
          name: "Hidden Resource Activation Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_economy_event", quantity: 2 },
            { id: hiddenActivationDefinitionId, quantity: 1 },
          ],
        },
        corpDeck: {
          ...V095_CORP_DECK,
          id: "hidden_resource_activation_corp",
          cards: [
            { id: "onr_v1_306_trojan-horse", quantity: 1 },
            ...V095_CORP_DECK.cards,
          ],
        },
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 6;
    state.runner.clicks = 4;
    const hiddenResourceId = moveRunnerCardToGrip(
      state,
      hiddenActivationDefinitionId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === hiddenActivationDefinitionId,
    );
    const hiddenSlotId = getPlayerView(state, "corp").opponent.rig?.find(
      (card) => card.known === false,
    )?.instanceId;
    expect(hiddenSlotId).toBeDefined();
    expect(hiddenSlotId).not.toBe(hiddenResourceId);

    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn: state.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    state = apply(state, "runner", (action) => action.type === "end_turn");
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    state.runnerTurnFlags = {
      ...(state.runnerTurnFlags ?? {}),
      stoleAgendaThisTurn: state.runnerTurnFlags?.stoleAgendaThisTurn ?? false,
      stoleAgendaLastTurn: true,
    };
    const trojanId = moveCorpCardToHq(state, "onr_v1_306_trojan-horse");
    keepOnlyCorpHqCard(state, trojanId);
    state.corp.credits = 8;
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "onr_v1_306_trojan-horse",
    );

    const openedPayload = state.eventLog.at(-1)?.publicPayload ?? {};
    expect(openedPayload).toMatchObject({
      actionType: "play_operation",
      eventModificationWindowOpened: true,
      redactedKind: "event_modification",
    });
    expect(JSON.stringify(openedPayload)).not.toContain(
      hiddenActivationDefinitionId,
    );
    expect(JSON.stringify(openedPayload)).not.toContain(hiddenActivationTitle);
    expect(JSON.stringify(openedPayload)).not.toContain(hiddenResourceId);
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      hiddenActivationDefinitionId,
    );
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      hiddenActivationTitle,
    );
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      hiddenResourceId,
    );

    const optionId = state.pendingChoice?.options.find((option) =>
      option.id.includes("avoid_tag"),
    )?.id;
    expect(optionId).toBeDefined();
    if (!optionId) throw new Error("Missing hidden resource activation option.");
    const resolveAction = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const staleResult = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [optionId],
      },
    });
    expect(staleResult.ok).toBe(false);
    const wrongSideResult = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: resolveAction.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [optionId],
      },
    });
    expect(wrongSideResult.ok).toBe(false);

    const choiceInitial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = applyChoice(state, "runner", optionId);

    expect(state.runner.tags).toBe(0);
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
        definitionId: hiddenActivationDefinitionId,
        title: hiddenActivationTitle,
      }),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "resolve_choice",
      eventModificationDecision: "apply",
      eventModificationOutcome: "avoided",
      sourceDefinitionId: hiddenActivationDefinitionId,
      cardDefinitionId: hiddenActivationDefinitionId,
      title: hiddenActivationTitle,
      sourceTrashed: true,
      hiddenResourceSlotId: hiddenSlotId,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: hiddenActivationDefinitionId,
    });

    const replay = replayEvents(
      choiceInitial,
      state.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("applies hidden reveal-and-trash metadata for activated CardImplementation trash-source costs", () => {
    makeExistingCardImplementationResourceHiddenForHarness(
      hiddenActivatedAbilityDefinitionId,
    );
    let state = toRunnerTurn(
      createGameAfterSetup({
        seed: "hidden-resource-activated-trash-source",
        runnerDeck: {
          id: "hidden_resource_activated_runner",
          name: "Hidden Resource Activated Runner",
          side: "runner",
          identity: "runner_identity_001",
          cards: [
            { id: "simple_economy_event", quantity: 2 },
            { id: hiddenActivatedAbilityDefinitionId, quantity: 1 },
          ],
        },
        corpDeck: V095_CORP_DECK,
        agendaPointsToWin: 7,
      }),
    );
    state.runner.credits = 6;
    state.runner.clicks = 4;
    state.runner.tags = 2;
    const sourceCardId = moveRunnerCardToGrip(
      state,
      hiddenActivatedAbilityDefinitionId,
    );
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "install_card" &&
        sourceDefinition(state, action) === hiddenActivatedAbilityDefinitionId,
    );
    const hiddenSlotId = getPlayerView(state, "corp").opponent.rig?.find(
      (card) => card.known === false,
    )?.instanceId;
    expect(hiddenSlotId).toBeDefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      hiddenActivatedAbilityDefinitionId,
    );
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      hiddenActivatedAbilityTitle,
    );

    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    state = apply(
      state,
      "runner",
      (action) =>
        action.type === "activated_card_ability" &&
        sourceDefinition(state, action) === hiddenActivatedAbilityDefinitionId,
    );

    expect(state.runner.tags).toBe(0);
    expect(state.runner.rig.resources).not.toContain(sourceCardId);
    expect(state.runner.heap).toContain(sourceCardId);
    expect(getPlayerView(state, "corp").opponent.discardCards).toContainEqual(
      expect.objectContaining({
        instanceId: sourceCardId,
        known: true,
        definitionId: hiddenActivatedAbilityDefinitionId,
        title: hiddenActivatedAbilityTitle,
      }),
    );
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      actionType: "activated_card_ability",
      cardDefinitionId: hiddenActivatedAbilityDefinitionId,
      title: hiddenActivatedAbilityTitle,
      sourceTrashed: true,
      hiddenResourceSlotId: hiddenSlotId,
      hiddenRunnerResourceRevealed: true,
      publicRevealDefinitionId: hiddenActivatedAbilityDefinitionId,
    });

    const replay = replayEvents(
      initial,
      state.eventLog.slice(replayStart),
    );
    expect(replay.ok).toBe(true);
    expect(replay.actualFinalStateHash).toBe(hashState(state));
  });

  it("keeps hidden-resource fixture support out of Proteus card promotion", () => {
    ensureHiddenResourceHarnessCard();
    expect(CARD_DEFINITIONS_BY_ID[hiddenResourceDefinitionId]).toMatchObject({
      type: "resource",
      subtypes: ["hidden"],
      mechanics: expect.arrayContaining([
        "hidden_runner_resource_foundation",
        "test_fixture",
      ]),
    });
    expect(
      Object.values(CARD_DEFINITIONS_BY_ID).filter((card) =>
        card.id.startsWith("onr_proteus_") &&
        card.mechanics.includes("hidden_runner_resource_foundation"),
      ),
    ).toHaveLength(0);
  });
});
