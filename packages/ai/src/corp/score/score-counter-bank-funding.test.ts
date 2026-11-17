import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import { scoreFundingPreservesCounterBanks } from "./score-counter-bank-funding";
function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-461-r6-g40-d98.json",
        import.meta.url,
      ),
      "utf8",
    ),
  ).input as AiDecisionInput;
}
function parent(): CorpScoreProjectSignal {
  return {
    projectId: "agenda-parent",
    agendaPoints: 2,
    phase: "install_agenda",
    sameTurnCloseout: false,
    terminalScore: false,
    feasible: false,
    evidenceCode: "test_score_parent",
  };
}
function withdrawal(input: AiDecisionInput) {
  return input.legalActions.find(
    (a) =>
      a.type === "activated_card_ability" &&
      a.payload?.cardImplementationAdvancementCounterCost === 1,
  )!;
}
describe("Score counter-bank funding resources", () => {
  it("retains a safe bank even when no current advance action is published", () => {
    const input = fixture(),
      a = withdrawal(input);
    expect(
      scoreFundingPreservesCounterBanks(input, parent(), [], [a.actionId]),
    ).toEqual([]);
  });
  it("retains basic liquid credits", () => {
    const input = fixture(),
      a = input.legalActions.find((a) => a.type === "gain_credit")!;
    expect(
      scoreFundingPreservesCounterBanks(input, parent(), [], [a.actionId]),
    ).toEqual([a.actionId]);
  });
  it.each([NaN, -1, 0.5, "1"])(
    "rejects counter funding with malformed cost %s",
    (cost) => {
      const input = fixture();
      const action = withdrawal(input);
      action.payload!.cardImplementationAdvancementCounterCost = cost;
      expect(() =>
        scoreFundingPreservesCounterBanks(
          input,
          parent(),
          [],
          [action.actionId],
        ),
      ).toThrow(
        expect.objectContaining({
          code: "missing_action_semantics",
          context: expect.objectContaining({
            unresolvedActionIds: [expect.stringContaining(action.source)],
          }),
        }),
      );
    },
  );

  it("rejects a withdrawal without its current source binding", () => {
    const input = fixture();
    const action = withdrawal(input);
    const source = action.source;
    Reflect.deleteProperty(action, "source");
    expect(() =>
      scoreFundingPreservesCounterBanks(
        input,
        parent(),
        [parent()],
        [action.actionId],
      ),
    ).toThrow("missing_action_semantics");
    action.source = source;
    action.expiresAtStateVersion -= 1;
    expect(() =>
      scoreFundingPreservesCounterBanks(input, parent(), [], [action.actionId]),
    ).toThrow("missing_action_semantics");
  });

  it("releases an unsafe bank for funding", () => {
    const input = fixture(),
      a = withdrawal(input);
    input.playerView.servers.find((s) => s.id === "remote_1")!.ice = [];
    expect(
      scoreFundingPreservesCounterBanks(input, parent(), [], [a.actionId]),
    ).toEqual([a.actionId]);
  });
  it("permits a concrete current win to consume a separate investment", () => {
    const input = fixture(),
      a = withdrawal(input),
      p = {
        ...parent(),
        feasible: true,
        terminalScore: true,
        sameTurnCloseout: true,
      };
    expect(
      scoreFundingPreservesCounterBanks(input, p, [], [a.actionId]),
    ).toEqual([a.actionId]);
  });
  it("does not spend the same counters twice in the current win", () => {
    const input = fixture(),
      a = withdrawal(input),
      p = {
        ...parent(),
        feasible: true,
        terminalScore: true,
        sameTurnCloseout: true,
        counterBank: {
          sourceCardInstanceId: a.source!,
          sourceDefinitionId: 559,
          serverId: "remote_1",
          advancementCounters: 1,
          counterTarget: 1,
          quoteStateVersion: input.playerView.stateVersion,
        },
      };
    expect(
      scoreFundingPreservesCounterBanks(input, p, [p], [a.actionId]),
    ).toEqual([]);
  });
});
