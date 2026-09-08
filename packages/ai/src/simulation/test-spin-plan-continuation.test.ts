import {
  applyAction,
  createGameAfterSetup,
  getPlayerView,
  hashState,
  replayEvents,
} from "@netgrid/engine";
import type { AiDecision, DeckDefinition, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import decks from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { CARD_DEFINITIONS_BY_ID } from "../card-definition-compatibility";
import { chooseAiAction } from "../index";
import { buildAiDecisionInput } from "../runtime/ai-decision-input";
import { buildPlanningStateIdentity } from "../plans/turn-planning-contracts";
import {
  rememberResidentPlanPortfolio,
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";

const TEST_SPIN = "onr_proteus_126_test-spin";
const CONFERENCE = "onr_v1_184_top-runners-conference";
const DEVELOPMENT_TARGET = "onr_proteus_085_disintegrator";
const COVERAGE_TARGET = "onr_v1_014_codecracker";

describe("Test Spin exact Engine continuation", () => {
  it.each([
    ["development", false],
    ["development", true],
    ["coverage", false],
    ["coverage", true],
  ] as const)(
    "preserves %s ownership through search, MU=%s and run-start order",
    (owner, memoryPressure) => {
      const fixture = testSpinFixture(owner, memoryPressure);
      let state = fixture.state;
      const initial = structuredClone(state);
      const sourceInput = fixture.input(state, true);
      const source = chooseAiAction(sourceInput);
      const planKind =
        owner === "coverage"
          ? "runner.rig_and_coverage"
          : "runner.develop_board_and_hand";
      expect(source.decisionDebug?.planKind).toBe(planKind);
      const ownership = ["plan_first_root:", "plan_first_executor:"].map(
        (prefix) => {
          const fact = source.evidence?.find((value) =>
            value.startsWith(prefix),
          );
          expect(fact).toBeDefined();
          return fact!;
        },
      );
      state = applyDecision(state, source);
      expect(state.pendingChoice?.source).toMatch(
        /^card_implementation\.pro018_stack_install_run_cleanup:/,
      );
      expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
      const searchInput = fixture.input(state);
      const search = chooseAiAction(searchInput);
      expect(search.selectedChoices).toMatchObject({
        choiceId: state.pendingChoice!.choiceId,
        selectedOptionIds: [
          state.pendingChoice!.options.find(
            (option) => option.value === fixture.targetId,
          )!.id,
        ],
      });
      const continuations = [search];
      state = applyDecision(state, search);
      if (memoryPressure) {
        expect(state.pendingChoice?.source).toContain(
          `runner.program_install_memory:nonsearch:${fixture.targetId}:`,
        );
        expect(getPlayerView(state, "corp").pendingChoice).toBeUndefined();
        const memory = chooseAiAction(fixture.input(state));
        continuations.push(memory);
        state = applyDecision(state, memory);
        expect(state.runner.heap).toContain(fixture.sacrificeId);
      }
      expect(state.runner.rig.programs).toContain(fixture.targetId);
      expect(state.runner.memoryUsed).toBeLessThanOrEqual(
        state.runner.memoryLimit,
      );
      // Two real mandatory triggers force the late ordering choice, including
      // the path through a nested MU choice. No simulation index is assumed.
      expect(state.pendingChoice?.source).toMatch(/^runner_run_start\.order:/);
      const orderInput = fixture.input(state);
      const order = chooseAiAction(orderInput);
      continuations.push(order);
      state = applyDecision(state, order);
      for (const decision of [source, ...continuations]) {
        expect(decision.fallbackUsed).toBe(false);
        expect(decision.evidence).toEqual(expect.arrayContaining(ownership));
      }
      expect(state.run?.attackedServerId).toBe("rd");
      expect(state.pendingChoice).toBeUndefined();
      expect(
        fixture.conferenceIds.every((id) => state.runner.heap.includes(id)),
      ).toBe(true);
      const replay = replayEvents(
        initial,
        state.eventLog.slice(initial.eventLog.length),
      );
      expect(replay.ok).toBe(true);
      expect(replay.errors).toEqual([]);
      expect(hashState(replay.state)).toBe(hashState(state));
    },
  );

  it("rejects a search choice after its selected source origin is lost", () => {
    const fixture = testSpinFixture("development", false);
    const source = chooseAiAction(fixture.input(fixture.state, true));
    const state = applyDecision(fixture.state, source);
    resetResidentPlanPortfolioMemory();
    expect(() => chooseAiAction(fixture.input(state))).toThrowError(
      PlanResolutionFailure,
    );
  });

  it.each(["development", "coverage"] as const)(
    "rejects a %s MU choice with a mismatched search chain",
    (owner) => {
      const fixture = testSpinFixture(owner, true);
      let state = applyDecision(
        fixture.state,
        chooseAiAction(fixture.input(fixture.state, true)),
      );
      const searchInput = fixture.input(state);
      const search = chooseAiAction(searchInput);
      const portfolio = residentPlanPortfolioSnapshot(searchInput)!;
      const executor = portfolio.instances.find(
        (instance) => instance.instanceId === portfolio.executorInstanceId,
      )!;
      const moduleState = executor.moduleState as {
        signal?: { delayedProgramSearchChoiceBinding?: { choiceId: string } };
        gap?: {
          directSearchChoiceBindings?: Array<{
            resolvedSearchChoice?: { choiceId: string };
          }>;
        };
      };
      if (owner === "development")
        moduleState.signal!.delayedProgramSearchChoiceBinding!.choiceId =
          "unrelated-choice";
      else {
        const binding = moduleState.gap!.directSearchChoiceBindings!.find(
          (candidate) => candidate.resolvedSearchChoice,
        )!;
        binding.resolvedSearchChoice!.choiceId = "unrelated-choice";
      }
      rememberResidentPlanPortfolio(searchInput, portfolio);
      state = applyDecision(state, search);
      expect(() => chooseAiAction(fixture.input(state))).toThrowError(
        PlanResolutionFailure,
      );
    },
  );
});

function testSpinFixture(
  owner: "development" | "coverage",
  memoryPressure: boolean,
) {
  resetResidentPlanPortfolioMemory();
  const runnerDeck = deck("proteus_runner_hq_virus_derez_2026_05_25");
  runnerDeck.cards = [
    ...runnerDeck.cards.filter((card) => card.id !== CONFERENCE),
    { id: CONFERENCE, quantity: 2 },
  ];
  const state = createGameAfterSetup({
    matchId: `test-spin-${owner}-${memoryPressure}`,
    seed: "test-spin-continuation",
    runnerDeck,
    corpDeck: deck("proteus_corp_region_fast_score_2026_05_25"),
  });
  const find = (definitionId: string) => {
    const card = Object.values(state.cardInstances).find(
      (candidate) =>
        candidate.owner === "runner" && candidate.definitionId === definitionId,
    );
    if (!card) throw new Error(`Missing fixture card ${definitionId}`);
    return card;
  };
  const event = find(TEST_SPIN);
  const target = find(
    owner === "development" ? DEVELOPMENT_TARGET : COVERAGE_TARGET,
  );
  const sacrifice = find("onr_proteus_090_highlighter");
  const programs = memoryPressure
    ? [
        sacrifice,
        find(owner === "development" ? COVERAGE_TARGET : DEVELOPMENT_TARGET),
        find("onr_v1_021_dwarf"),
      ]
    : [];
  const conferences = Object.values(state.cardInstances).filter(
    (card) => card.definitionId === CONFERENCE,
  );
  expect(conferences).toHaveLength(2); // Deliberate exact setup for a two-source Engine choice.
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  state.runner.clicks = 4;
  state.runner.credits = 10;
  state.runner.grip = [event.instanceId];
  state.runner.stack = [target.instanceId];
  state.runner.heap = [];
  state.runner.rig.programs = programs.map((card) => card.instanceId);
  state.runner.rig.resources = conferences.map((card) => card.instanceId);
  state.runner.memoryUsed = programs.reduce(
    (total, card) =>
      total + CARD_DEFINITIONS_BY_ID[card.definitionId]!.memoryCost!,
    0,
  );
  state.runner.memoryLimit = 4;
  for (const card of Object.values(state.cardInstances).filter(
    (candidate) =>
      candidate.owner === "runner" &&
      candidate.instanceId !== state.runner.identity,
  )) {
    const installed = programs.includes(card) || conferences.includes(card);
    const zone =
      card === event
        ? "grip"
        : card === target
          ? "stack"
          : installed
            ? "rig"
            : "heap";
    card.zone = { side: "runner", zone };
    card.faceup = installed;
    card.rezzed = false;
    if (zone === "heap") state.runner.heap.push(card.instanceId);
  }
  const input = (current: GameState, sourceOnly = false) => {
    const full = buildAiDecisionInput(current, "runner", {
      decisionId: `${state.matchId}:${current.stateVersion}`,
      profileId: "test-spin-continuation",
      ownDeckSnapshot: {
        deckSnapshotId: "test-spin-continuation",
        side: "runner",
        cards: runnerDeck.cards.map((card) => ({
          cardId: card.id,
          quantity: card.quantity,
        })),
      },
    });
    if (!sourceOnly) return full;
    // Isolate continuation ownership, not the global decision to play an event.
    const legalActions = full.legalActions.filter(
      (action) =>
        action.type === "play_event" &&
        action.payload?.cardId === event.instanceId &&
        action.payload.serverId === "rd",
    );
    expect(legalActions).toHaveLength(1);
    return {
      ...full,
      legalActions,
      planningStateIdentity: buildPlanningStateIdentity({
        ...full,
        legalActions,
      }),
    };
  };
  return {
    state,
    input,
    targetId: target.instanceId,
    sacrificeId: sacrifice.instanceId,
    conferenceIds: conferences.map((card) => card.instanceId),
  };
}

function applyDecision(state: GameState, decision: AiDecision): GameState {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: decision.actionId!,
    ...(decision.selectedChoices
      ? { selectedChoices: decision.selectedChoices }
      : {}),
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `${state.matchId}:${state.stateVersion}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}

function deck(id: string): DeckDefinition {
  const found = (decks as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === id,
  );
  if (!found) throw new Error(`Missing fixture deck ${id}`);
  return structuredClone(found);
}
