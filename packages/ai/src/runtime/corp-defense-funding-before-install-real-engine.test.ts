import { referencesDefaultDeckCard } from "../evaluation/decision-checkpoints/compact-card-reference.test-support";
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

const ACCOUNT = 493,
  ICE = 445;
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
  knownUnfundedCentralReserve = false,
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
    .withRunnerProgramInstalled(257)
    .withRunnerProgramInstalled(266)
    .withRunnerProgramInstalled(286)
    .withCorpIceOnServer("hq", 449);
  // An independently known unfunded R&D reserve now suspends this install
  // before its own funding demand exists. The positive fixture needs an
  // admitted staging route; retain the suspended route as a separate case.
  if (knownUnfundedCentralReserve)
    f.withCorpIceOnServer("rd", 483);
  else f.withRezzedCorpIceOnServer("rd", 483);
  f.withCorpIceOnServer("rd", 482).withRezzedCorpIceOnServer(
    "r1",
    461,
  );
  for (const id of [
    411,
    518,
    419,
    ICE,
    575,
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
      (a) => a.type === "play_operation" && state.cardInstances[a.source]?.definitionId === ACCOUNT,
    )!;
  const decision = chooseAiAction(before),
    plan = decision.decisionDebug!.planFirstDecision!;
  expect(decision.actionId).toBe(account.actionId);
  expect(plan.rootPlanInstanceId).toBe(
    "penw02zfrkklof54c2nuye5att",
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
  expect(state.cardInstances[install.source]?.definitionId).toBe(ICE);
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
    (a) => a.type === "rez_ice" && state.cardInstances[a.source]?.definitionId === ICE,
  )!;
  expect(rez).toBeDefined();
  state = apply(state, rez);
  expect(state.corp.credits).toBe(2);
});
it("keeps an already funded installation immediate", () => {
  const decision = chooseAiAction(input(fixture(8)));
  expect(referencesDefaultDeckCard(decision.actionId, ICE)).toBe(true);
  expect(decision.actionId).toContain(".hq.");
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
});
it("keeps funding separate while an independently known central reserve suspends installation", () => {
  const state = fixture(5, 2, true, ACCOUNT, 7, true);
  const i = input(state),
    decision = chooseAiAction(i);
  const plan = decision.decisionDebug!.planFirstDecision!;
  const account = i.legalActions.find((a) => a.actionId === decision.actionId)!;
  expect(account.type).toBe("play_operation");
  expect(referencesDefaultDeckCard(account.source, 493)).toBe(true);
  expect(plan.rootPlanInstanceId).toBe(
    "pdcamubibo7tjbarb3t4ixoxpi",
  );
  expect(
    plan.dispositions.some(
      (d) =>
        referencesDefaultDeckCard(d.actionId, 445) &&
        d.actionId.includes(".hq.") &&
        d.disposition === "explicitly_nonproductive" &&
        d.ownerModuleId === "corp.defend_servers",
    ),
  ).toBe(true);
  const funded = apply(state, account),
    installDecision = chooseAiAction(input(funded));
  expect(funded.corp.credits).toBe(9);
  expect(referencesDefaultDeckCard(installDecision.actionId, 445)).toBe(true);
  expect(installDecision.actionId).toContain(".hq.");
  expect(
    installDecision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.defend_servers");
});
it("uses a different canonical liquid-credit operation for the same admitted installation", () => {
  const efficiency = 502,
    initial = fixture(5, 2, true, efficiency),
    i = input(initial),
    decision = chooseAiAction(i);
  expect(referencesDefaultDeckCard(decision.actionId, efficiency)).toBe(true);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
    "penw02zfrkklof54c2nuye5att",
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
    "r2",
    432,
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
        "penw02zfrkklof54c2nuye5att" &&
        plan.selectedPlan?.moduleId === "corp.economy",
    ).toBe(false);
    expect(i.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
      true,
    );
    expect(decision.fallbackUsed).toBe(false);
  },
);
