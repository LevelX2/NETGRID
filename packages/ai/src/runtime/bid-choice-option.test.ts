import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import {
  ORIGINALSET_DEFAULT_DECKS,
  type AiDecisionInput,
  type LegalAction,
} from "@netgrid/shared";
import { RealEngineFixtureBuilder } from "../evaluation/real-engine-fixture-builder";
import { describe, expect, it } from "vitest";

import { selectedBidChoiceOptionId } from "./bid-choice-option";

type PendingChoice = NonNullable<
  AiDecisionInput["playerView"]["pendingChoice"]
>;

describe("selectedBidChoiceOptionId", () => {
  it("does not spend on a Corp trace without public trace context", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard"),
        bidChoice("trace:corp", [0, 1, 2, 3, 4]),
        {},
      ),
    ).toBe("bid_0");
  });

  it("does not select a disabled bid option", () => {
    const choice = bidChoice("trace:corp", [0, 1, 2, 3]);
    choice.options[0]!.selectable = false;
    expect(selectedBidChoiceOptionId(input("corp", "hard"), choice, {})).toBe(
      "bid_1",
    );
  });

  it("uses the minimum guaranteed bid for the historical visible punish window", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 18,
          ownClicks: 1,
          runnerCredits: 6,
          hq: [
            card("closed", 497, 1),
            card("scorched", 514, 3),
          ],
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_2");
  });

  it("bids zero without a visible tag-punish followup", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 18,
          ownClicks: 2,
          runnerCredits: 11,
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("uses the minimum winning bid for a source-visible native Rex trace payoff", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 0,
          runnerCredits: 0,
          encounteredIceDefinitionId: 476,
        }),
        bidChoice("trace:run_1.rex.0.trace", range(0, 5)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("does not go all-in for Rex when guaranteeing the native payoff is too expensive", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 0,
          runnerCredits: 11,
          encounteredIceDefinitionId: 476,
        }),
        bidChoice("trace:run_1.rex.0.trace", range(0, 8)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("does not treat an operation trace as a native ICE trace payoff", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 0,
          runnerCredits: 5,
          encounteredIceDefinitionId: 496,
        }),
        bidChoice("trace:chance-observation", range(0, 5)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("bids zero when guarantee plus payoff is unaffordable", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 7,
          ownClicks: 1,
          runnerCredits: 11,
          hq: [card("closed", 497, 1)],
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("uses the smallest winning bid instead of the difficulty cap", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 8,
          ownClicks: 1,
          runnerCredits: 0,
          hq: [card("closed", 497, 1)],
        }),
        bidChoice("trace:corp", range(0, 5)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("bids zero when no followup click remains", () => {
    expect(
      selectedBidChoiceOptionId(
        input("corp", "hard", {
          ownCredits: 18,
          ownClicks: 0,
          runnerCredits: 11,
          hq: [card("closed", 497, 1)],
        }),
        bidChoice("trace:corp", range(0, 11)),
        { traceLimit: 5, runnerLink: 0 },
      ),
    ).toBe("bid_0");
  });

  it("requires atomic Engine selection for nontrivial hard secret guesses", () => {
    expect(() =>
      selectedBidChoiceOptionId(
        input("corp", "hard"),
        bidChoice(
          "hidden_zone.secret_spend_guess_then_targeted_bypass_run.guess:source:42",
          [2, 3, 4, 5, 6, 7, 8],
          "guess",
        ),
        {},
      ),
    ).toThrow("invalid_support_graph");
  });

  it.each(["corp", "runner"] as const)(
    "spends zero as %s in the secret comparison instead of applying trace policy",
    (side) => {
      expect(
        selectedBidChoiceOptionId(
          input(side, "normal"),
          bidChoice(
            "card_implementation.secret_spend_compare:run:ice:0",
            range(0, 2),
          ),
          {},
        ),
      ).toBe("bid_0");
    },
  );

  it.each([0, 1, 2])(
    "keeps the Engine run continuing after a hidden Corp bid of %i",
    (corpBid) => {
      const definitionId = 484;
      const corp = ORIGINALSET_DEFAULT_DECKS.corp;
      let state = createGameAfterSetup({
        seed: "secret-compare-runtime-choice",
        corpDeck: {
          ...corp,
          cards: [...corp.cards, { id: definitionId, quantity: 1 }],
        },
      });
      state.activeSide = "runner";
      state.phase = "runner_action_phase";
      state.timingPoint = "runner_action.main";
      RealEngineFixtureBuilder.forState(state)
        .withCorpCredits(5)
        .withRunnerCredits(5)
        .withRunnerClicks(4)
        .withRezzedCorpIceOnServer("rd", definitionId);
      function apply(action: LegalAction, selectedOptionIds?: string[]) {
        const result = applyAction(state, {
          matchId: state.matchId,
          side: action.side,
          actionId: action.actionId,
          clientKnownStateVersion: state.stateVersion,
          ...(selectedOptionIds
            ? {
                selectedChoices: {
                  choiceId: state.pendingChoice!.choiceId,
                  selectedOptionIds,
                },
              }
            : {}),
        });
        if (!result.ok) throw Error(result.error.message);
        state = result.state;
      }
      const start = getLegalActions(state, "runner").find(
        (action) =>
          action.type === "start_run" && action.payload?.serverId === "rd",
      );
      expect(start).toBeDefined();
      apply(start!);
      for (let i = 0; i < 5 && !state.pendingChoice; i += 1) {
        const advance = getLegalActions(state, state.activeSide).find(
          (action) =>
            action.type === "continue_run" || action.type === "decline_rez",
        );
        expect(advance).toBeDefined();
        apply(advance!);
      }
      expect(
        state.pendingChoice?.source.startsWith(
          "card_implementation.secret_spend_compare:",
        ),
      ).toBe(true);
      const corpChoice = getLegalActions(state, "corp").find(
        (action) => action.type === "resolve_choice",
      )!;
      apply(corpChoice, ["bid_" + corpBid]);
      const publicInput = {
        ...input("runner", "hard"),
        playerView: getPlayerView(state, "runner"),
        legalActions: getLegalActions(state, "runner"),
      };
      const runnerChoice = publicInput.legalActions.find(
        (action) => action.type === "resolve_choice",
      )!;
      const selected = selectedBidChoiceOptionId(
        publicInput,
        publicInput.playerView.pendingChoice!,
        {},
      );
      expect(selected).toBe("bid_0");
      apply(runnerChoice, [selected!]);
      expect(state.run).toBeDefined();
      expect(state.runner.credits).toBe(5);
    },
  );

  it("pays the exact visible Seed-7 trace guarantee when the Corp cannot bid", () => {
    expect(
      selectedBidChoiceOptionId(
        input("runner", "normal", {
          ownCredits: 6,
          runnerCredits: 0,
          encounteredIceDefinitionId: 458,
        }),
        bidChoice("trace:seed7.fragmentation-storm", range(0, 6)),
        {
          traceValue: 4,
          traceLimit: 4,
          runnerLink: 0,
          traceRulesProfile: "modern_open",
          sourceDefinitionId: 458,
        },
      ),
    ).toBe("bid_4");
  });
});

function input(
  side: AiDecisionInput["side"],
  difficulty: AiDecisionInput["difficulty"],
  overrides: {
    ownCredits?: number;
    ownClicks?: number;
    runnerCredits?: number;
    hq?: Array<Record<string, unknown>>;
    encounteredIceDefinitionId?: number;
  } = {},
): AiDecisionInput {
  return {
    matchId: "match",
    side,
    difficulty,
    profileId: "test",
    playerView: {
      stateVersion: 1,
      side,
      phase: "runner_action_phase",
      activeSide: side,
      timingPoint: "choice.pending",
      own: {
        identity: { instanceId: "identity", title: "Identity", known: true },
        credits: overrides.ownCredits ?? 0,
        clicks: overrides.ownClicks ?? 0,
        tags: 0,
        agendaPoints: 0,
        gripOrHq: overrides.hq ?? [],
        heapOrArchives: [],
        scoreArea: [],
      },
      opponent: {
        credits: overrides.runnerCredits ?? 0,
        clicks: 0,
        tags: 0,
        agendaPoints: 0,
        gripOrHqCount: 0,
        heapOrArchivesCount: 0,
        scoreArea: [],
      },
      servers: [],
      ...(overrides.encounteredIceDefinitionId
        ? {
            run: {
              encounteredIce: {
                instanceId: "encountered-ice",
                definitionId: overrides.encounteredIceDefinitionId,
                title: "Encountered ICE",
                type: "ice",
                known: true,
                rezzed: true,
              },
            },
          }
        : {}),
    },
    legalActions: [],
    eventTail: [],
  } as unknown as AiDecisionInput;
}

function card(instanceId: string, definitionId: number, cost: number) {
  return {
    instanceId,
    definitionId,
    title: instanceId,
    type: "operation",
    playCost: { kind: "fixed", credits: cost },
    known: true,
    owner: "corp",
    controller: "corp",
  };
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function bidChoice(
  source: string,
  amounts: readonly number[],
  prefix = "bid",
): PendingChoice {
  return {
    choiceId: "choice_1",
    side: "corp",
    source,
    prompt: "Bid",
    kind: "bid_amount",
    options: amounts.map((amount) => ({
      id: `${prefix}_${amount}`,
      label: `${amount}`,
      value: amount,
    })),
    minSelections: 1,
    maxSelections: 1,
    stateVersion: 1,
    visibility: "hidden_info_barrier",
  } as PendingChoice;
}
