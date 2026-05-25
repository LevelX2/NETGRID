import { describe, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  DEMO_CARDS_BY_ID,
  getPlayerView,
  hashState,
  replayEvents,
} from "../../index";
import {
  apply,
  applyChoice,
  installRunnerProgramForTest,
  mustAction,
  moveCorpCardToHq,
  onrV1Game,
  sourceDefinition,
  V094_RUNNER_DECK,
  V111_CORP_DECK,
} from "../../test-fixtures/mechanic-smoke-fixtures";

const PROTEUS_ENTERPRISE_SHIELDS = "onr_proteus_086_enterprise-inc-shields";
const PROTEUS_SKULLCAP = "onr_proteus_096_skullcap";

function ensureProteusProtectionCardDefinitions(): void {
  DEMO_CARDS_BY_ID[PROTEUS_ENTERPRISE_SHIELDS] ??= {
    id: PROTEUS_ENTERPRISE_SHIELDS,
    title: "Enterprise, Inc., Shields",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText: "[1]: Prevent up to 2 Net damage. [1]: Prevent 1 brain damage.",
    mechanics: ["install_program", "memory", "damage_prevention"],
  };
  DEMO_CARDS_BY_ID[PROTEUS_SKULLCAP] ??= {
    id: PROTEUS_SKULLCAP,
    title: "Skullcap",
    side: "runner",
    type: "program",
    subtypes: [],
    implementationStatus: "playable_mvp",
    installCost: 0,
    memoryCost: 1,
    rulesText: "T: Prevent any amount of Net or brain damage.",
    mechanics: ["install_program", "memory", "damage_prevention"],
  };
}

function proteusProtectionRunnerDeck() {
  ensureProteusProtectionCardDefinitions();
  return {
    ...V094_RUNNER_DECK,
    id: "proteus_phase_5b_runner",
    name: "Proteus Phase 5b Runner Protection",
    cards: [
      ...V094_RUNNER_DECK.cards,
      { id: PROTEUS_ENTERPRISE_SHIELDS, quantity: 1 },
      { id: PROTEUS_SKULLCAP, quantity: 1 },
    ],
  };
}

describe("V1.2.0 Event Modification Foundation", () => {
  it("opens a side-private Damage Prevention window before damage randomness", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-window",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    expect(state.imminentEvent).toMatchObject({
      eventType: "damage",
      affectedSide: "runner",
    });
    expect(state.eventModificationWindow).toMatchObject({
      kind: "prevent",
      side: "runner",
    });
    expect(state.pendingChoice?.source).toBe("v120.event_modification.prevent");
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(state.runner.coreDamage).toBe(0);
    expect(
      getPlayerView(state, "runner").pendingChoice?.options.map(
        (option) => option.id,
      ),
    ).toContain("pass");
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(JSON.stringify(getPlayerView(state, "corp"))).not.toContain(
      "Test-only Damage Prevention",
    );
  });

  it("applies full Damage Prevention without creating RandomDrawRecords", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-full",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const preventOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    expect(preventOption).toBeDefined();
    state = applyChoice(state, "runner", String(preventOption));

    const finalEvent = state.eventLog.at(-1);
    expect(state.pendingChoice).toBeUndefined();
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.imminentEvent).toBeUndefined();
    expect(state.runner.coreDamage).toBe(0);
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(finalEvent?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      damageAmount: 0,
      preventedAmount: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("passes Damage Prevention and resolves the original damage path", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-pass",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    state = applyChoice(state, "runner", "pass");

    expect(state.runner.coreDamage).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "pass",
      eventModificationOutcome: "original_resolved",
      damageAmount: 1,
      coreDamageAfter: 1,
    });
  });

  it("supports partial Damage Prevention and stable StateHash divergence", () => {
    let prevented = onrV1Game("v120-partial-prevent");
    prevented.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 2 },
    };
    prevented = apply(
      prevented,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    prevented.runner.tags = 1;
    moveCorpCardToHq(prevented, "onr_v1_302_scorched-earth");
    prevented = apply(
      prevented,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(prevented, action) === "onr_v1_302_scorched-earth",
    );
    const preventOption = prevented.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    prevented = applyChoice(prevented, "runner", String(preventOption));

    let passed = onrV1Game("v120-partial-prevent");
    passed.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 2 },
    };
    passed = apply(
      passed,
      "corp",
      (action) => action.type === "mandatory_draw",
    );
    passed.runner.tags = 1;
    moveCorpCardToHq(passed, "onr_v1_302_scorched-earth");
    passed = apply(
      passed,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(passed, action) === "onr_v1_302_scorched-earth",
    );
    passed = applyChoice(passed, "runner", "pass");

    expect(prevented.eventLog.at(-1)?.publicPayload).toMatchObject({
      originalAmount: 4,
      preventedAmount: 2,
      finalAmount: 2,
      cardsTrashed: 2,
    });
    expect(passed.eventLog.at(-1)?.publicPayload).toMatchObject({
      damageAmount: 4,
      cardsTrashed: 4,
    });
    expect(hashState(prevented)).not.toBe(hashState(passed));
  });

  it("revalidates Event Modification choices through applyAction", () => {
    let state = createGameAfterSetup({
      seed: "v120-prevent-revalidate",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damagePrevention: { side: "runner", preventAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const legal = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["pass"],
      },
    });
    const badChoice = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: ["not-a-candidate"],
      },
    });

    expect(wrongSide.ok).toBe(false);
    expect(badChoice.ok).toBe(false);
    if (!badChoice.ok)
      expect(badChoice.error.message).not.toContain(
        "Test-only Damage Prevention",
      );
  });
});

describe("Proteus Phase 5b Runner Protection Programs", () => {
  it("uses Enterprise, Inc., Shields as paid Net/core damage prevention", () => {
    let state = createGameAfterSetup({
      seed: "proteus-phase-5b-enterprise",
      runnerDeck: proteusProtectionRunnerDeck(),
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.runner.credits = 2;
    installRunnerProgramForTest(state, PROTEUS_ENTERPRISE_SHIELDS);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const enterpriseOption = state.pendingChoice?.options.find((option) =>
      option.label.includes("Enterprise, Inc., Shields"),
    )?.id;
    expect(enterpriseOption).toBeDefined();
    const legal = mustAction(
      state,
      "runner",
      (action) => action.type === "resolve_choice",
    );
    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [String(enterpriseOption)],
      },
    });
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: legal.actionId,
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [String(enterpriseOption)],
      },
    });
    expect(wrongSide.ok).toBe(false);
    expect(stale.ok).toBe(false);

    state = applyChoice(state, "runner", String(enterpriseOption));

    expect(state.runner.coreDamage).toBe(0);
    expect(state.runner.credits).toBe(1);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      preventedAmount: 1,
      paidCredits: 1,
      runnerCreditsAfter: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("uses Skullcap as trash-source prevention for all Net/core damage", () => {
    let state = createGameAfterSetup({
      seed: "proteus-phase-5b-skullcap",
      runnerDeck: proteusProtectionRunnerDeck(),
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    const skullcapId = installRunnerProgramForTest(state, PROTEUS_SKULLCAP);
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const skullcapOption = state.pendingChoice?.options.find((option) =>
      option.label.includes("Skullcap"),
    )?.id;
    expect(skullcapOption).toBeDefined();
    state = applyChoice(state, "runner", String(skullcapOption));

    expect(state.runner.coreDamage).toBe(0);
    expect(state.runner.rig.programs).not.toContain(skullcapId);
    expect(state.runner.heap).toContain(skullcapId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      eventModificationDecision: "apply",
      eventModificationOutcome: "prevented",
      preventedAmount: 1,
      sourceTrashed: true,
      trashedCardDefinitionId: PROTEUS_SKULLCAP,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });
});

describe("V1.2.1 Replacement Effects", () => {
  it("opens a separate Damage Replacement window with original event context", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-window",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    expect(state.replacementWindow).toMatchObject({
      eventType: "damage",
      originalEventId: state.imminentEvent?.eventId,
    });
    expect(state.eventModificationWindow).toBeUndefined();
    expect(state.pendingChoice?.source).toBe("v121.replacement.damage");
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementWindowOpened: true,
      originalEventType: "damage",
    });
    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
  });

  it("replaces Damage with a test-only Tag event without applying the original damage", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-apply",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const initial = structuredClone(state);
    const replayStart = state.eventLog.length;
    const randomBefore = state.randomDrawRecords.length;

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    const replaceOption = state.pendingChoice?.options.find(
      (option) => option.id !== "pass",
    )?.id;
    state = applyChoice(state, "runner", String(replaceOption));

    expect(state.runner.coreDamage).toBe(0);
    expect(state.runner.tags).toBe(1);
    expect(state.randomDrawRecords).toHaveLength(randomBefore);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementDecision: "apply",
      replacementOutcome: "replaced",
      originalEventType: "damage",
      replacementEventType: "add_tag",
      tagsAdded: 1,
    });
    const replay = replayEvents(initial, state.eventLog.slice(replayStart));
    expect(replay.ok).toBe(true);
    expect(hashState(replay.state)).toBe(hashState(state));
  });

  it("passes optional Damage Replacement and resolves the original damage", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-pass",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");

    state = apply(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );
    state = applyChoice(state, "runner", "pass");

    expect(state.runner.coreDamage).toBe(1);
    expect(state.runner.tags).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      replacementDecision: "pass",
      replacementOutcome: "original_resolved",
      damageAmount: 1,
    });
  });

  it("blocks ambiguous Replacement conflicts visibly instead of choosing silently", () => {
    let state = createGameAfterSetup({
      seed: "v121-replacement-conflict",
      runnerDeck: V094_RUNNER_DECK,
      corpDeck: V111_CORP_DECK,
      agendaPointsToWin: 7,
    });
    state.eventModificationHarness = {
      damageReplacement: { side: "runner", tagAmount: 1 },
      damageReplacementConflict: true,
    };
    state = apply(state, "corp", (action) => action.type === "mandatory_draw");
    moveCorpCardToHq(state, "v111_core_damage_operation");
    const action = mustAction(
      state,
      "corp",
      (action) =>
        action.type === "play_operation" &&
        sourceDefinition(state, action) === "v111_core_damage_operation",
    );

    const result = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.message).toContain("Replacement-Konflikt");
      expect(result.error.message).not.toContain(
        "Test-only Damage Replacement",
      );
    }
  });
});
