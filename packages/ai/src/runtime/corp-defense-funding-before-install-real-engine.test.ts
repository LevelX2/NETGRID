import { beforeEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { GameState, LegalAction } from "@netgrid/shared";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../plans/resident-plan-portfolio-memory";
import { buildAiDecisionInput } from "./ai-decision-input";

const ACCOUNT = "onr_v1_281_accounts-receivable",
  ICE = "onr_v1_233_d-arc-knight";
const decks = Object.fromEntries(
  (["corp", "runner"] as const).map((side) => {
    const id =
      side === "corp"
        ? "standard_corp_cheap_bag_tricks"
        : "standard_runner_last_call_at_rd";
    const entry = catalog.decks.find((d) => d.standardDeckId === id)!;
    return [
      side,
      {
        id,
        name: entry.name,
        side,
        identity: entry.identityCardId,
        cards: entry.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
      },
    ];
  }),
);
beforeEach(() => resetResidentPlanPortfolioMemory());
function apply(state: GameState, action: LegalAction) {
  const result = applyAction(state, {
    matchId: state.matchId,
    side: action.side,
    actionId: action.actionId,
    clientKnownStateVersion: state.stateVersion,
  });
  if (!result.ok) throw Error(result.error.message);
  return result.state;
}
function fixture(
  credits = 5,
  clicks = 2,
  account = true,
  fundingCard = ACCOUNT,
  agendaPointsToWin = 7,
) {
  let state = createGameAfterSetup({
    seed: "staged-defense-funding-order",
    corpDeck: decks.corp!,
    runnerDeck: decks.runner!,
    agendaPointsToWin,
  });
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "mandatory_draw")!,
  );
  while (state.corp.clicks > clicks)
    state = apply(
      state,
      getLegalActions(state, "corp").find((a) => a.type === "gain_credit")!,
    );
  const f = RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCredits(credits)
    .withRunnerCredits(6)
    .withRunnerProgramInstalled("onr_v1_045_newsgroup-filter")
    .withRunnerProgramInstalled("onr_v1_054_raptor")
    .withRunnerProgramInstalled("onr_v1_074_worm")
    .withCorpIceOnServer("hq", "onr_v1_237_data-wall")
    .withCorpIceOnServer("rd", "onr_v1_271_tko-2-0")
    .withCorpIceOnServer("rd", "onr_v1_270_sleeper")
    .withRezzedCorpIceOnServer("remote_1", "onr_v1_249_hunter");
  for (const id of [
    "onr_v1_199_employee-empowerment",
    "onr_v1_306_trojan-horse",
    "onr_v1_207_netwatch-operations-office",
    ICE,
    "onr_v1_363_olivia-salazar",
    ...(account ? [fundingCard] : []),
  ])
    f.withCorpCardInHq(id);
  state.turnSerial = 10;
  state.runner.memoryUsed = 4;
  return state;
}
function input(state: GameState) {
  return buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: decks.corp!.id,
      side: "corp",
      cards: decks.corp!.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
}
it("funds the admitted defense installation before spending its operation threshold", () => {
  let state = fixture();
  const before = input(state),
    account = before.legalActions.find(
      (a) => a.type === "play_operation" && a.source.includes(ACCOUNT),
    )!;
  const decision = chooseAiAction(before),
    plan = decision.decisionDebug!.planFirstDecision!;
  expect(decision.actionId).toBe(account.actionId);
  expect(plan.rootPlanInstanceId).toBe(
    "plan:corp.defend_servers:server-defense-portfolio",
  );
  expect(plan.selectedPlan?.moduleId).toBe("corp.economy");
  expect(decision.fallbackUsed).toBe(false);
  state = apply(state, account);
  expect(state.corp.credits).toBe(9);
  expect(state.corp.clicks).toBe(1);
  const next = chooseAiAction(input(state)),
    install = getLegalActions(state, "corp").find(
      (a) => a.actionId === next.actionId,
    )!;
  expect(install.type).toBe("install_card");
  expect(install.source).toContain(ICE);
  expect(install.payload?.serverId).toBe("hq");
  expect(next.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    plan.rootPlanInstanceId,
  );
  state = apply(state, install);
  expect(state.corp.credits).toBe(8);
  expect(state.corp.clicks).toBe(0);
  state = apply(
    state,
    getLegalActions(state, "corp").find((a) => a.type === "end_turn")!,
  );
  state = apply(
    state,
    getLegalActions(state, "runner").find(
      (a) => a.type === "start_run" && a.payload?.serverId === "hq",
    )!,
  );
  const rez = getLegalActions(state, "corp").find(
    (a) => a.type === "rez_ice" && a.source.includes(ICE),
  )!;
  expect(rez).toBeDefined();
  state = apply(state, rez);
  expect(state.corp.credits).toBe(2);
});
it("keeps an already funded installation immediate", () => {
  const decision = chooseAiAction(input(fixture(8)));
  expect(decision.actionId).toContain(ICE);
  expect(decision.actionId).toContain(".hq.");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
});
it("uses a different canonical liquid-credit operation for the same admitted installation", () => {
  const efficiency = "onr_v1_290_efficiency-experts",
    initial = fixture(5, 2, true, efficiency),
    i = input(initial),
    decision = chooseAiAction(i);
  expect(decision.actionId).toContain(efficiency);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "plan:corp.defend_servers:server-defense-portfolio",
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.economy");
  const state = apply(
    initial,
    i.legalActions.find((a) => a.actionId === decision.actionId)!,
  );
  expect(state.corp.credits).toBe(8);
  expect(state.corp.clicks).toBe(1);
});
it("keeps a native terminal score ahead of the defense funding prefix", () => {
  const state = fixture(5, 2, true, ACCOUNT, 4);
  RealEngineFixtureBuilder.forState(state).withCorpRemoteRoot(
    "remote_2",
    "onr_v1_220_tycho-extension",
    4,
  );
  const i = input(state),
    decision = chooseAiAction(i),
    score = i.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(score.type).toBe("score_agenda");
  expect(
    decision.decisionDebug?.planFirstDecision?.priority?.effectiveClass,
  ).toBe("P1");
  expect(apply(state, score).winner).toBe("corp");
});
it.each([
  [5, 1, true],
  [4, 2, true],
  [5, 2, false],
] as const)(
  "does not invent a complete funding prefix at %i credits / %i clicks / operation %s",
  (credits, clicks, account) => {
    const i = input(fixture(credits, clicks, account)),
      decision = chooseAiAction(i),
      plan = decision.decisionDebug?.planFirstDecision;
    expect(
      plan?.rootPlanInstanceId ===
        "plan:corp.defend_servers:server-defense-portfolio" &&
        plan.selectedPlan?.moduleId === "corp.economy",
    ).toBe(false);
    expect(i.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
      true,
    );
    expect(decision.fallbackUsed).toBe(false);
  },
);
