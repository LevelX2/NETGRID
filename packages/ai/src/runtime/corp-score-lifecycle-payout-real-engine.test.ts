import { expect, it } from "vitest";
import catalog from "../../../../data/decks/standard-deck-catalog-1.0.0.json";
import {
  createGameAfterSetup,
  getLegalActions,
  applyAction,
  getPlayerView,
} from "@netgrid/engine";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { buildAiDecisionInput } from "./ai-decision-input";
import { corpUnconditionalScoreCreditGain } from "./corp-canonical-card-facts";
import { corpScoreRestoresRezReserveBeforeRunnerTurn } from "../corp/score/score-reserve-restoration";
import { createAiHintsByCard } from "../ai-hints";
import type { DeckDefinition } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../plans/corp-score-contracts";
import { chooseAiAction } from "../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";

const charity = "onr_proteus_002_charity-takeover";
function deck(side: "corp" | "runner"): DeckDefinition {
  const d = catalog.decks.find(
    (d) =>
      d.side === side &&
      (side === "runner" || d.cards.some((c) => c.cardId === charity)),
  )!;
  return {
    id: d.standardDeckId,
    name: d.name,
    side,
    identity: d.identityCardId,
    cards: d.cards.map((c) => ({ id: c.cardId, quantity: c.quantity })),
  };
}
it("projects the actual unconditional on-score payout into the existing reserve owner without prefinancing advances", () => {
  const corpDeck = deck("corp"),
    runnerDeck = deck("runner");
  let state = createGameAfterSetup({
    matchId: "lifecycle-payout",
    seed: "lifecycle-payout",
    agendaPointsToWin: 7,
    corpDeck,
    runnerDeck,
  });
  const draw = getLegalActions(state, "corp").find(
    (a) => a.type === "mandatory_draw",
  )!;
  const drawn = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "draw",
  });
  if (!drawn.ok) throw Error(JSON.stringify(drawn.error));
  state = drawn.state;
  RealEngineFixtureBuilder.forState(state)
    .withCorpRemoteRoot("remote_1", charity, 4)
    .withCorpCredits(1)
    .withCorpHqSize(0);
  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    decisionId: "charity",
    profileId: "payout",
    ownDeckSnapshot: {
      deckSnapshotId: "payout",
      side: "corp",
      cards: corpDeck.cards.map((c) => ({
        cardId: c.id,
        quantity: c.quantity,
      })),
    },
  });
  const score = input.legalActions.find((a) => a.type === "score_agenda")!;
  resetResidentPlanPortfolioMemory();
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(score.actionId);
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.score_agenda");
  const project = residentPlanPortfolioSnapshot(input)!
    .instances.filter((instance) => instance.moduleId === "corp.score_agenda")
    .map(
      (instance) =>
        (instance.moduleState as { signal: CorpScoreProjectSignal }).signal,
    )
    .find((signal) => signal.agendaDefinitionId === charity)!;
  expect(project).toMatchObject({
    sameTurnCloseout: true,
    sameTurnConversionProof: "engine_quoted_path",
    sameTurnConversionResourceCost: {
      stateVersion: state.stateVersion,
      credits: 0,
      clicks: 0,
    },
  });
  expect(corpUnconditionalScoreCreditGain(charity)).toBe(9);
  expect(createAiHintsByCard().get(charity)?.effects).toContainEqual(
    expect.objectContaining({
      timing: "when_scored",
      target: "score.credit_gain",
      amount: 9,
    }),
  );
  expect(createAiHintsByCard().get(charity)?.roles).not.toContain(
    "no_ability_agenda",
  );
  expect(corpScoreRestoresRezReserveBeforeRunnerTurn(input, [project], 4)).toBe(
    true,
  );
  expect(
    corpScoreRestoresRezReserveBeforeRunnerTurn(
      input,
      [
        {
          ...project,
          sameTurnConversionResourceCost: {
            stateVersion: state.stateVersion,
            credits: 4,
            clicks: 4,
          },
        },
      ],
      4,
    ),
  ).toBe(false);
  expect(
    corpScoreRestoresRezReserveBeforeRunnerTurn(
      input,
      [
        {
          ...project,
          sameTurnConversionResourceCost: {
            stateVersion: state.stateVersion - 1,
            credits: 0,
            clicks: 0,
          },
        },
      ],
      4,
    ),
  ).toBe(false);
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "corp",
    actionId: score.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: "score",
  });
  expect(result.ok).toBe(true);
  if (!result.ok) throw Error(JSON.stringify(result.error));
  expect(getPlayerView(result.state, "corp").own.credits).toBe(10);
  expect(result.state.corp.badPublicity).toBe(1);
  expect(
    corpUnconditionalScoreCreditGain("onr_v1_196_corporate-war"),
  ).toBeUndefined();
  expect(
    corpUnconditionalScoreCreditGain("onr_v1_209_political-coup"),
  ).toBeUndefined();
  expect(corpUnconditionalScoreCreditGain("onr_v1_203_hostile-takeover")).toBe(
    5,
  );
});
