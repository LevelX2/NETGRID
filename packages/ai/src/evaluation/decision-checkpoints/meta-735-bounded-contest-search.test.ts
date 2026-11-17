import { afterEach, expect, it } from "vitest";
import { createGameAfterSetup } from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import catalog from "../../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

const remoteRoot = "plan:runner.contest_remote:remote%3Ar1";
const wallExecutor = "plan:runner.rig_and_coverage:coverage%3Abreaker_wall";
const aujourdOui = 363;
afterEach(resetResidentPlanPortfolioMemory);

function deck(id: string, side: DeckDefinition["side"]): DeckDefinition {
  const entry = catalog.decks.find(
    (candidate) => candidate.standardDeckId === id,
  );
  if (!entry || entry.side !== side) throw new Error(`Missing deck ${id}`);
  return {
    id,
    side,
    name: entry.name,
    identity: entry.identityCardId,
    cards: entry.cards.map(({ cardId, quantity }) => ({
      id: cardId,
      quantity,
    })),
  };
}

function searchInput(): AiDecisionInputWithDeckCapabilities {
  const runnerDeck = deck("standard_runner_mp48400s", "runner");
  const corpDeck = deck("standard_corp_lucidrine_lockdown", "corp");
  const state = createGameAfterSetup({
    seed: "bounded-terminal-contest",
    agendaPointsToWin: 7,
    runnerDeck,
    corpDeck,
  });
  RealEngineFixtureBuilder.forState(state)
    .withRunnerCredits(12)
    .withRunnerClicks(4)
    .withCorpCredits(2)
    .withRunnerProgramInstalled(278) // Snowball
    .withRunnerProgramInstalled(228) // Cyfermaster
    .withRunnerResourceInstalled(aujourdOui)
    .withRunnerResourceInstalled(366)
    .withRunnerGripSize(0)
    .withRunnerCardInGrip(373)
    .withRunnerCardInGrip(333)
    .withRunnerCardInGrip(358)
    .withRunnerCardInGrip(224)
    .withCorpRemoteRoot("r1", 408, 4)
    .withRezzedCorpIceOnServer("r1", 457)
    .withRezzedCorpIceOnServer("r1", 90);

  for (const id of [...state.corp.hq, ...state.corp.rd]
    .filter((id) => state.cardInstances[id]?.definitionId === 62)
    .slice(0, 2)) {
    state.corp.hq = state.corp.hq.filter((candidate) => candidate !== id);
    state.corp.rd = state.corp.rd.filter((candidate) => candidate !== id);
    state.corp.scoreArea.push(id);
    Object.assign(state.cardInstances[id]!, {
      faceup: true,
      rezzed: true,
      zone: { side: "corp", zone: "scoreArea" },
    });
  }
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  return buildAiDecisionInput(state, "runner", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: runnerDeck.id,
      side: "runner",
      cards: runnerDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
}

function decide(adjust?: (input: AiDecisionInputWithDeckCapabilities) => void) {
  const input = searchInput();
  adjust?.(input);
  const search = input.legalActions.find(
    (action) =>
      action.payload?.cardImplementationAbilityKey ===
      "abilities_activated_runner_main_look_top_stack_take_matching",
  )!;
  const targetRun = input.legalActions.find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "r1",
  )!;
  const decision = chooseAiAction(input);
  return {
    decision,
    search,
    targetRun,
    portfolio: residentPlanPortfolioSnapshot(input),
  };
}

it("keeps the legal bounded lookup with the terminal Wall contest while its result stays unknown", () => {
  const { decision, search, targetRun, portfolio } = decide();
  const executorId = `${wallExecutor}%3Arun%3A${encodeURIComponent(targetRun.actionId)}`;
  expect(decision).toMatchObject({
    actionId: search.actionId,
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: remoteRoot,
        leafExecutorInstanceId: executorId,
      },
    },
  });
  const coverage = portfolio?.instances.find(
    (instance) => instance.instanceId === executorId,
  );
  expect(coverage?.moduleState).toMatchObject({
    phase: "search_answer",
    gap: {
      answerInHand: false,
      directSearchActionIds: [search.actionId],
      recoveryEvidenceCodes: [
        expect.stringContaining("bounded_search_conditional_reveal"),
      ],
    },
  });
});

it.each([
  [
    "one credit short with no spare click",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.own.credits = 11;
      input.playerView.own.clicks = 3;
    },
  ],
] as const)("does not promote the same source with %s", (_name, adjust) => {
  const { decision, search } = decide(adjust);
  expect(
    decision.actionId === search.actionId &&
      decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId ===
        remoteRoot,
  ).toBe(false);
});

it("leaves the normal nonterminal search outside the bounded terminal quote", () => {
  const { portfolio } = decide((input) => {
    input.playerView.opponent.agendaPoints = 0;
  });
  expect(
    portfolio?.instances.some((instance) =>
      JSON.stringify(instance.moduleState).includes(
        "bounded_search_conditional_reveal",
      ),
    ),
  ).toBe(false);
});
