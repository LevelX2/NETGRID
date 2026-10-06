import { load, decide } from "./match-28287.test-support";
import { currentEncounterMitigationForAction } from "../../runtime/runner-encounter-mitigation";
import { afterEach, expect, it } from "vitest";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  hashGameState,
  replayEvents,
} from "@netgrid/engine";
import {
  installRunnerProgramForTest,
  putCorpIceOnServer,
  putCorpIceCopyOnServer,
} from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import { buildAiDecisionInput } from "../../runtime/ai-decision-input";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { readFileSync } from "node:fs";

const capture = () =>
  JSON.parse(
    readFileSync(
      new URL("./fixtures/match-28287/d161.json", import.meta.url),
      "utf8",
    ),
  );
afterEach(resetResidentPlanPortfolioMemory);
it.each([
  [24, 4, 2, 2],
  [11, 4, 1, 3],
  [9, 0, 0, 4],
])(
  "pays only affordable current mitigation from %s credits and ends at the remaining ETR",
  (credits, expectedPumps, expectedBreaks, expectedCore) => {
    let state = encounter(credits);
    const initial = structuredClone(state),
      start = state.eventLog.length;
    let pumps = 0,
      breaks = 0;
    for (let step = 0; state.run && step < 15; step++) {
      expect(state.activeSide).toBe("runner");
      const input = buildAiDecisionInput(state, "runner", {
        difficulty: capture().input.difficulty,
        eventTail: state.eventLog,
        ownDeckSnapshot: capture().input.ownDeckSnapshot,
        decisionId: `${state.matchId}:${state.stateVersion}`,
        actionNumber: state.stateVersion,
      });
      const decision = chooseAiAction(input),
        action = input.legalActions.find(
          (a) => a.actionId === decision.actionId,
        )!;
      expect(decision.fallbackUsed).toBe(false);
      expect(decision.timeoutUsed).toBe(false);
      expect(action.expiresAtStateVersion).toBe(state.stateVersion);
      const plan = decision.decisionDebug!.planFirstDecision!;
      if (plan.lane === "engine_window") {
        expect(input.legalActions).toHaveLength(1);
        expect(action.type).toBe("continue_run");
        expect(plan.engineWindowAction).toMatchObject({
          actionId: action.actionId,
          reasonCode: "engine_window_single_legal_resolution",
        });
      } else {
        expect(plan.selectedPlan?.moduleId).toBe("runner.convert_run_window");
        expect(plan.route?.actionId).toBe(action.actionId);
        expect(plan.route?.stateVersion).toBe(state.stateVersion);
      }
      if (action.type === "pump_breaker") pumps++;
      if (action.type === "break_subroutine") {
        breaks++;
        expect(action.payload?.subroutineIndex).not.toBe(2);
      }
      state = applyMatching(state, (a) => a.actionId === action.actionId);
    }
    expect(state.run).toBeUndefined();
    expect({ pumps, breaks }).toEqual({
      pumps: expectedPumps,
      breaks: expectedBreaks,
    });
    expect(state.runner.coreDamage).toBe(expectedCore);
    expect(state.runner.credits).toBe(credits - pumps * 2 - breaks * 2);
    const replay = replayEvents(initial, state.eventLog.slice(start));
    expect(replay.ok).toBe(true);
    expect(hashGameState(replay.state)).toBe(hashGameState(state));
  },
);

function applyMatching(
  state: GameState,
  predicate: (action: LegalAction) => boolean,
) {
  const action = getLegalActions(state, state.activeSide).find(predicate);
  if (!action)
    throw new Error(`Missing fixture action at ${state.timingPoint}`);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: state.activeSide,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  return result.state;
}
function encounter(credits: number) {
  let state = createGameAfterSetup({
    seed: "match-28287-current-mitigation",
    runnerDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.runner,
      cards: capture().input.ownDeckSnapshot.cards.map(
        (c: { cardId: string; quantity: number }) => ({
          id: c.cardId,
          quantity: c.quantity,
        }),
      ),
    },
    corpDeck: {
      ...ORIGINALSET_DEFAULT_DECKS.corp,
      cards: [
        { id: "onr_v1_280_zombie", quantity: 3 },
        { id: "onr_proteus_029_marionette", quantity: 1 },
        ...ORIGINALSET_DEFAULT_DECKS.corp.cards.filter(
          (c) =>
            !["onr_v1_280_zombie", "onr_proteus_029_marionette"].includes(c.id),
        ),
      ],
    },
  });
  installRunnerProgramForTest(state, "onr_v1_039_krash");
  const inner = putCorpIceOnServer(state, "rd", "onr_v1_280_zombie");
  const middle = putCorpIceOnServer(state, "rd", "onr_proteus_029_marionette");
  const outer = putCorpIceCopyOnServer(state, "rd", "onr_v1_280_zombie");
  for (const id of [inner, middle, outer]) {
    state.cardInstances[id]!.rezzed = true;
    state.cardInstances[id]!.faceup = true;
  }
  for (const id of state.corp.hq.splice(4)) {
    state.corp.archives.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "corp", zone: "archives" },
      faceup: true,
    };
  }
  state = applyMatching(state, (a) => a.type === "mandatory_draw");
  state = applyMatching(state, (a) => a.type === "end_turn");
  state.runner.credits = credits;
  state.runner.coreDamage = 2;
  for (const id of state.runner.grip.splice(2)) {
    state.runner.heap.push(id);
    state.cardInstances[id] = {
      ...state.cardInstances[id]!,
      zone: { side: "runner", zone: "heap" },
      faceup: true,
      rezzed: true,
    };
  }
  state = applyMatching(
    state,
    (a) => a.type === "start_run" && a.payload?.serverId === "rd",
  );
  for (let step = 0; state.run?.phase !== "encounter_ice" && step < 10; step++)
    state = applyMatching(
      state,
      (a) => a.type === "continue_run" || a.type === "decline_rez",
    );
  expect(state.run?.phase).toBe("encounter_ice");
  return state;
}

it("preserves permanent damage protection when the remaining run cannot be funded", () => {
  const { action, plan } = decide(load(161));
  expect(action.type).toBe("pump_breaker");
  expect(plan.selectedPlan?.moduleId).toBe("runner.convert_run_window");
});

it("does not pay for ineffective core prevention or optional nonlethal net damage", () => {
  for (const [type, amount] of [
    ["core", 0],
    ["net", 1],
  ] as const) {
    const input = load(161).input;
    for (const ice of [
      ...input.playerView.servers.flatMap((s) => s.ice),
      input.playerView.run!.encounteredIce!,
    ]) {
      for (const subroutine of ice.effectiveRunQuote?.subroutines ?? []) {
        if (subroutine.type === "do_damage") {
          subroutine.damageType = type;
          subroutine.amount = amount;
        }
      }
    }
    expect(
      currentEncounterMitigationForAction(
        input,
        input.legalActions.find((a) => a.type === "pump_breaker")!,
        0,
      ),
    ).toBeUndefined();
  }
});
it("does not turn acceptable core damage into compulsory mitigation on a funded access route", () => {
  const input = load(161).input;
  input.playerView.own.credits = 80;
  expect(
    currentEncounterMitigationForAction(
      input,
      input.legalActions.find((a) => a.type === "pump_breaker")!,
      0,
    ),
  ).toBeUndefined();
});
