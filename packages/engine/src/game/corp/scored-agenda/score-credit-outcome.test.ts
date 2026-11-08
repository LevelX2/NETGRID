import { describe, expect, it } from "vitest";
import { applyAction, getLegalActions, getPlayerView } from "../../../index";
import { currentCorpScoreCreditFixture } from "../../../test-fixtures/score-credit-outcome-fixture";

describe("current score credit outcome", () => {
  it.each([
    [0, false, 0],
    [2, false, 0],
    [11, false, 0],
    [12, false, 24],
    [14, false, 26],
    [8, true, 0],
  ] as const)(
    "quotes and executes %i credits, terminal=%s as %i",
    (credits, terminal, expected) => {
      const { state, agendaId } = currentCorpScoreCreditFixture(
        credits,
        terminal,
      );
      const action = getLegalActions(state, "corp").find(
        (a) => a.type === "score_agenda" && a.source === agendaId,
      )!;
      expect(action.payload).toMatchObject({
        corpScoreCreditOutcomeQuoteSchemaVersion:
          "corp-score-credit-outcome-quote-v1",
        corpScoreCreditOutcomeQuoteStateVersion: state.stateVersion,
        corpScoreCreditOutcomeQuoteSourceCardId: agendaId,
        corpScoreCreditOutcomeQuoteCreditsBefore: credits,
        corpScoreCreditOutcomeQuoteCreditsAfter: expected,
        corpScoreCreditOutcomeQuoteNetCreditDelta: expected - credits,
      });
      const applied = applyAction(state, {
        matchId: state.matchId,
        side: "corp",
        actionId: action.actionId,
        clientKnownStateVersion: state.stateVersion,
        idempotencyKey: `score-credit-outcome-${credits}-${terminal}`,
      });
      expect(applied.ok).toBe(true);
      expect(applied.state.corp.credits).toBe(expected);
      expect(applied.state.winner).toBe(terminal ? "corp" : null);
    },
  );

  it("keeps the unscored Corp credit quote out of the opponent view", () => {
    const { state } = currentCorpScoreCreditFixture(2);
    expect(JSON.stringify(getPlayerView(state, "runner"))).not.toContain(
      "corpScoreCreditOutcomeQuote",
    );
  });

  it("quotes a direct liquid score payout through the same contract", () => {
    const { state, agendaId } = currentCorpScoreCreditFixture(
      2,
      false,
      "onr_v1_203_hostile-takeover",
    );
    const action = getLegalActions(state, "corp").find(
      (a) => a.type === "score_agenda" && a.source === agendaId,
    )!;
    expect(action.payload).toMatchObject({
      corpScoreCreditOutcomeQuoteCreditsBefore: 2,
      corpScoreCreditOutcomeQuoteCreditsAfter: 7,
      corpScoreCreditOutcomeQuoteNetCreditDelta: 5,
    });
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "direct-score-credit",
    });
    expect(applied.ok).toBe(true);
    expect(applied.state.corp.credits).toBe(7);
  });

  it("does not certify hosted score credits as liquid income", () => {
    const { state, agendaId } = currentCorpScoreCreditFixture(
      2,
      false,
      "onr_v1_193_corporate-coup",
    );
    const action = getLegalActions(state, "corp").find(
      (a) => a.type === "score_agenda" && a.source === agendaId,
    )!;
    expect(
      action.payload?.corpScoreCreditOutcomeQuoteSchemaVersion,
    ).toBeUndefined();
    const applied = applyAction(state, {
      matchId: state.matchId,
      side: "corp",
      actionId: action.actionId,
      clientKnownStateVersion: state.stateVersion,
      idempotencyKey: "hosted-score-credit",
    });
    expect(applied.ok).toBe(true);
    expect(applied.state.corp.credits).toBe(2);
    expect(applied.state.cardInstances[agendaId]!.counters?.bit).toBe(15);
  });
});
