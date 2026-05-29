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
  removeEverywhere,
  toRunnerTurn,
} from "../../test-fixtures/mechanic-smoke-fixtures";
import {
  CURRENT_RULES_BASELINE,
  type CardDefinitionId,
  type CardInstanceId,
  type GameState,
  type LegalAction,
  type Side,
} from "@netgrid/shared";

const HIJACK = "onr_proteus_110_hijack";
const TEST_SPIN = "onr_proteus_126_test-spin";
const TYCHO_MEM_CHIP = "onr_v1_144_tycho-mem-chip";
const JACKHAMMER = "onr_v1_036_jackhammer";
const ANONYMOUS_TIP = "onr_v1_077_anonymous-tip";

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
  state.runner.credits = 20;
  state.runner.clicks = 4;
  state.corp.credits = 20;
  return state;
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

function addRunnerStack(
  state: GameState,
  definitionId: string,
  id: string,
): CardInstanceId {
  const cardId = id as CardInstanceId;
  removeEverywhere(state, cardId);
  state.runner.stack.unshift(cardId);
  state.cardInstances[cardId] = cardInstance(cardId, definitionId, "runner", {
    side: "runner",
    zone: "stack",
  });
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

function playEventAction(
  state: GameState,
  cardId: CardInstanceId,
  serverId?: string,
): LegalAction {
  const action = getLegalActions(state, "runner").find(
    (candidate) =>
      candidate.type === "play_event" &&
      candidate.payload?.cardId === cardId &&
      (serverId === undefined || candidate.payload?.serverId === serverId),
  );
  if (!action) throw new Error("Missing play_event action");
  return action;
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

function resolveChoiceResult(
  state: GameState,
  side: Side,
  selectedOptionIds: string[],
) {
  const action = getLegalActions(state, side).find(
    (candidate) => candidate.type === "resolve_choice",
  );
  if (!action) throw new Error("Missing resolve_choice action");
  return applyAction(state, {
    matchId: state.matchId,
    side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
    selectedChoices: {
      choiceId: state.pendingChoice?.choiceId,
      selectedOptionIds,
    },
    idempotencyKey: `${side}-${state.stateVersion}-${selectedOptionIds.join(".")}`,
  });
}

function expectReplayStable(before: GameState, after: GameState): void {
  const replay = replayEvents(before, after.eventLog.slice(before.eventLog.length));
  expect(replay.ok).toBe(true);
  expect(hashState(replay.state)).toBe(hashState(after));
}

function finishCurrentRun(state: GameState): GameState {
  let next = state;
  for (let attempt = 0; attempt < 12 && next.run; attempt += 1) {
    const actions = getLegalActions(next, "runner");
    if (actions.some((action) => action.type === "jack_out")) {
      next = apply(next, "runner", (action) => action.type === "jack_out");
    } else if (actions.some((action) => action.type === "access_card")) {
      next = apply(next, "runner", (action) => action.type === "access_card");
    } else if (actions.some((action) => action.type === "decline_trash")) {
      next = apply(next, "runner", (action) => action.type === "decline_trash");
    } else if (actions.some((action) => action.type === "continue_run")) {
      next = apply(next, "runner", (action) => action.type === "continue_run");
    } else {
      throw new Error(
        `Run kann nicht beendet werden. Runner actions: ${actions
          .map((action) => action.type)
          .join(",")}`,
      );
    }
  }
  if (next.run) throw new Error("Run wurde im Test nicht beendet.");
  return next;
}

function lastPublicPayload(state: GameState, hiddenZoneAction: string) {
  for (let index = state.eventLog.length - 1; index >= 0; index -= 1) {
    const payload = state.eventLog[index]?.publicPayload;
    if (payload?.hiddenZoneAction === hiddenZoneAction) return payload;
  }
  return undefined;
}

describe("Proteus PRO018 hidden-zone search/install tutor suite", () => {
  it("Hijack installs a legal grip hardware with three temporary install credits and redacts candidates", () => {
    let state = baseState("pro018-hijack-happy");
    const hijackId = addRunnerGrip(state, HIJACK, "pro018_hijack");
    const hardwareId = addRunnerGrip(state, TYCHO_MEM_CHIP, "pro018_tycho");
    const nonCandidateId = addRunnerGrip(
      state,
      ANONYMOUS_TIP,
      "pro018_anonymous_tip",
    );
    state.runner.credits = 3;
    const before = structuredClone(state);

    state = applyLegal(state, "runner", playEventAction(state, hijackId));

    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    const corpView = JSON.stringify(getPlayerView(state, "corp"));
    expect(corpView).not.toContain(hardwareId);
    expect(corpView).not.toContain("Tycho Mem Chip");
    expect(corpView).not.toContain(nonCandidateId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "pro018_grip_install_temporary_credits",
      choiceVisibility: "runner_private",
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "candidateCount",
    );

    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(runnerChoice?.options.find((option) => option.value === nonCandidateId))
      .toMatchObject({ selectable: false });
    const optionId = runnerChoice?.options.find(
      (option) => option.value === hardwareId,
    )?.id;
    expect(optionId).toBeDefined();

    state = applyChoice(state, "runner", String(optionId));

    expect(state.runner.rig.hardware).toContain(hardwareId);
    expect(state.runner.credits).toBe(0);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "pro018_grip_install_temporary_credits",
      installedCardDefinitionId: TYCHO_MEM_CHIP,
      temporaryCreditsProvided: 3,
      temporaryCreditsSpent: 3,
      temporaryCreditsReturned: 0,
      installCostPaid: 2,
    });
    expectReplayStable(before, state);
  });

  it("Hijack revalidates wrong side, stale action and illegal choices", () => {
    let state = baseState("pro018-hijack-revalidate");
    const hijackId = addRunnerGrip(state, HIJACK, "pro018_hijack_revalidate");
    addRunnerGrip(state, TYCHO_MEM_CHIP, "pro018_tycho_revalidate");
    state.runner.credits = 3;
    const playHijack = playEventAction(state, hijackId);

    const wrongSide = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: playHijack.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "wrong-side",
    });
    expect(wrongSide.ok).toBe(false);

    state = applyLegal(state, "runner", playHijack);
    const choiceAction = getLegalActions(state, "runner").find(
      (action) => action.type === "resolve_choice",
    );
    expect(choiceAction).toBeDefined();
    const stale = applyAction(state, {
      matchId: state.matchId,
      side: "runner",
      actionId: String(choiceAction?.actionId),
      clientKnownStateVersion: state.stateVersion - 1,
      selectedChoices: {
        choiceId: state.pendingChoice?.choiceId,
        selectedOptionIds: [String(state.pendingChoice?.options[0]?.id)],
      },
      idempotencyKey: "stale-choice",
    });
    expect(stale.ok).toBe(false);

    const illegal = resolveChoiceResult(state, "runner", ["card_not_in_choice"]);
    expect(illegal.ok).toBe(false);
  });

  it("Test Spin installs a stack program for free, shuffles, starts a run and returns it after the run", () => {
    let state = baseState("pro018-test-spin-return");
    const testSpinId = addRunnerGrip(state, TEST_SPIN, "pro018_test_spin");
    const displayOnlyEventId = addRunnerStack(
      state,
      ANONYMOUS_TIP,
      "pro018_stack_anonymous_tip",
    );
    const programId = addRunnerStack(state, JACKHAMMER, "pro018_jackhammer");
    state.runner.credits = 5;
    const before = structuredClone(state);
    const randomCounterBefore = state.randomCounter;

    state = applyLegal(state, "runner", playEventAction(state, testSpinId, "rd"));

    expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "pro018_stack_install_run_cleanup",
      choiceVisibility: "runner_private",
    });
    expect(state.eventLog.at(-1)?.publicPayload).not.toHaveProperty(
      "candidateCount",
    );
    const runnerChoice = getPlayerView(state, "runner").pendingChoice;
    expect(runnerChoice?.cardSearchPresentation).toMatchObject({
      sourceZone: "stack",
      selectableFilter: "program",
      destination: "install_program",
      shuffleAfter: true,
      showNonMatchingCards: true,
    });
    expect(runnerChoice?.options.find((option) => option.value === displayOnlyEventId))
      .toMatchObject({ selectable: false });
    const optionId = runnerChoice?.options.find(
      (option) => option.value === programId,
    )?.id;

    state = applyChoice(state, "runner", String(optionId));

    expect(state.runner.credits).toBe(4);
    expect(state.randomCounter).toBeGreaterThan(randomCounterBefore);
    expect(lastPublicPayload(state, "pro018_stack_install_run_cleanup"))
      .toMatchObject({
      hiddenZoneAction: "pro018_stack_install_run_cleanup",
      publicRevealDefinitionId: JACKHAMMER,
      installedProgramDefinitionId: JACKHAMMER,
      shufflePerformed: true,
      testSpinRunStarted: true,
      serverId: "rd",
    });
    if (state.run) {
      expect(state.run.attackedServerId).toBe("rd");
      expect(state.run.testSpinTemporaryInstall).toMatchObject({
        cardId: programId,
        sourceCardId: testSpinId,
        sourceDefinitionId: TEST_SPIN,
        installCostPenalty: 1,
      });
      expect(state.runner.rig.programs).toContain(programId);
    }

    state = finishCurrentRun(state);

    expect(state.run).toBeUndefined();
    expect(state.runner.rig.programs).not.toContain(programId);
    expect(state.runner.stack).toContain(programId);
    expect(state.cardInstances[programId]?.faceup).toBe(false);
    expect(lastPublicPayload(state, "pro018_test_spin_return_to_stack"))
      .toMatchObject({
      hiddenZoneAction: "pro018_test_spin_return_to_stack",
      returnedProgramDefinitionId: JACKHAMMER,
      returnedToStack: true,
      shufflePerformed: true,
    });
    expectReplayStable(before, state);
  });

  it("Test Spin applies the credit plus meat-damage penalty if the installed program cannot return", () => {
    let state = baseState("pro018-test-spin-penalty");
    const testSpinId = addRunnerGrip(state, TEST_SPIN, "pro018_test_spin_penalty");
    const programId = addRunnerStack(
      state,
      JACKHAMMER,
      "pro018_penalty_jackhammer",
    );
    state.runner.credits = 2;
    const before = structuredClone(state);

    state = applyLegal(state, "runner", playEventAction(state, testSpinId, "rd"));
    const optionId = getPlayerView(state, "runner").pendingChoice?.options.find(
      (option) => option.value === programId,
    )?.id;
    state = applyChoice(state, "runner", String(optionId));
    removeEverywhere(state, programId);
    state.runner.heap.push(programId);
    state.cardInstances[programId] = {
      ...cardInstance(programId, JACKHAMMER, "runner", {
        side: "runner",
        zone: "heap",
      }),
      faceup: true,
      rezzed: true,
    };

    state = finishCurrentRun(state);

    expect(state.runner.credits).toBe(0);
    expect(state.runner.heap).toContain(programId);
    expect(state.eventLog.at(-1)?.publicPayload).toMatchObject({
      hiddenZoneAction: "pro018_test_spin_penalty",
      returnedToStack: false,
      penaltyAmount: 5,
      penaltyCreditsPaid: 1,
      damageResolved: true,
      damageType: "meat",
      damageAmount: 4,
    });
    expect(before.runner.credits).toBe(2);
  });
});
