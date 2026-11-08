import { describe, expect, it } from "vitest";
import { getLegalActions, getPlayerView } from "@netgrid/engine";
import { CURRENT_RULES_BASELINE, type LegalAction } from "@netgrid/shared";
import { currentCorpScoreCreditFixture } from "../../../engine/src/test-fixtures/score-credit-outcome-fixture";
import { buildAiDecisionInputDto } from "../input-dto";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  buildPlanningRulesContext,
  buildPlanningStateIdentity,
} from "../plans/turn-planning-contracts";
import {
  applyCertifiedTurnProjectionDelta,
  buildProjectedDecisionFrame,
  certifiedTurnProjectionDeltaFromCandidate,
} from "../plans/turn-projection";

describe("current score credit facts through the strict AI input", () => {
  it.each([
    [2, false, 0, "onr_v1_196_corporate-war"],
    [12, false, 24, "onr_v1_196_corporate-war"],
    [8, true, 0, "onr_v1_196_corporate-war"],
    [2, false, 7, "onr_v1_203_hostile-takeover"],
  ] as const)(
    "projects the exact score balance from %i, terminal=%s to %i",
    (credits, terminal, expected, definitionId) => {
      const { state, agendaId, input, action } = strictScenario(
        credits,
        terminal,
        definitionId,
      );
      const [candidate] = buildActionSemanticCandidates({
        legalActions: [action],
        observerSide: "corp",
        stateVersion: state.stateVersion,
        visibleSourceDefinitionsByInstanceId: { [agendaId]: definitionId },
      });
      expect(candidate!.economyProjection).toMatchObject({
        kind: "immediate_liquid",
        timing: "immediate",
        reliability: "guaranteed",
        source: "legal_action_payload",
        netLiquidCreditGain: expected - credits,
      });
      const frame = buildProjectedDecisionFrame({
        input,
        rulesContext: buildPlanningRulesContext({
          rulesBaseline: CURRENT_RULES_BASELINE,
          formatProfileId: "test-format",
          cardPoolSnapshotId: "test-pool",
        }),
        stateIdentity: buildPlanningStateIdentity(input),
        turnKey: "corp:score-credit-outcome",
      });
      const delta = certifiedTurnProjectionDeltaFromCandidate({
        frame,
        candidate: candidate!,
      });
      expect(
        applyCertifiedTurnProjectionDelta(frame, delta).ownCredits,
      ).toEqual({ minimum: expected, maximum: expected });
    },
  );

  it("keeps a hosted score pool out of general liquidity", () => {
    const { state, agendaId, action } = strictScenario(
      2,
      false,
      "onr_v1_193_corporate-coup",
    );
    const [candidate] = buildActionSemanticCandidates({
      legalActions: [action],
      observerSide: "corp",
      stateVersion: state.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [agendaId]: "onr_v1_193_corporate-coup",
      },
    });
    expect(candidate!.economyProjection?.netLiquidCreditGain).toBeUndefined();
  });

  it.each([
    [
      "missing before",
      (a: LegalAction) => {
        delete a.payload!.corpScoreCreditOutcomeQuoteCreditsBefore;
      },
    ],
    [
      "missing after",
      (a: LegalAction) => {
        delete a.payload!.corpScoreCreditOutcomeQuoteCreditsAfter;
      },
    ],
    [
      "missing delta",
      (a: LegalAction) => {
        delete a.payload!.corpScoreCreditOutcomeQuoteNetCreditDelta;
      },
    ],
    [
      "missing source",
      (a: LegalAction) => {
        delete a.payload!.corpScoreCreditOutcomeQuoteSourceCardId;
      },
    ],
    [
      "stale quote",
      (a: LegalAction) => {
        a.payload!.corpScoreCreditOutcomeQuoteStateVersion =
          a.expiresAtStateVersion - 1;
      },
    ],
    [
      "wrong source",
      (a: LegalAction) => {
        a.payload!.corpScoreCreditOutcomeQuoteSourceCardId = "other-agenda";
      },
    ],
    [
      "wrong schema",
      (a: LegalAction) => {
        a.payload!.corpScoreCreditOutcomeQuoteSchemaVersion = "other-schema";
      },
    ],
    [
      "inconsistent delta",
      (a: LegalAction) => {
        a.payload!.corpScoreCreditOutcomeQuoteNetCreditDelta = 0;
      },
    ],
    [
      "wrong action",
      (a: LegalAction) => {
        a.type = "gain_credit";
      },
    ],
    [
      "unquoted credit cost",
      (a: LegalAction) => {
        a.costs = [{ credits: 1 }];
      },
    ],
  ] as const)(
    "rejects a malformed current score quote: %s",
    (_label, mutate) => {
      const { state, agendaId, action } = strictScenario(2, false);
      mutate(action);
      expect(() =>
        buildActionSemanticCandidates({
          legalActions: [action],
          observerSide: "corp",
          stateVersion: state.stateVersion,
          visibleSourceDefinitionsByInstanceId: {
            [agendaId]: "onr_v1_196_corporate-war",
          },
        }),
      ).toThrow("corp_score_credit_outcome_quote_invalid");
    },
  );
});

function strictScenario(
  credits: number,
  terminal: boolean,
  definitionId = "onr_v1_196_corporate-war",
) {
  const { state, agendaId } = currentCorpScoreCreditFixture(
    credits,
    terminal,
    definitionId,
  );
  const input = buildAiDecisionInputDto({
    matchId: state.matchId,
    side: "corp",
    playerView: getPlayerView(state, "corp"),
    legalActions: getLegalActions(state, "corp"),
    eventTail: [],
    difficulty: "hard",
    seed: state.seed,
    decisionId: "score-credit-outcome",
    actionNumber: state.stateVersion,
    profileId: "corp-ai-v0.9-hard",
  });
  const action = input.legalActions.find(
    (a) => a.type === "score_agenda" && a.source === agendaId,
  )!;
  return { state, agendaId, input, action };
}
