import { planInstanceIdForProposal } from "../../plans/plan-instance";
import { describe, expect, it } from "vitest";
import searchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d80.json";
import choiceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d81.json";
import sentrySearchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d91.json";
import sentryChoiceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d92.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { bindPublicBoardStealQuoteCompanion } from "../../public-board-steal-quotes.test-support";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type Capture = {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("pairing 430 coverage search answers the actual ICE category", () => {
  it.each([
    {
      searchJson,
      choiceJson,
      role: "code_gate",
      stateVersion: 80,
      answer: "card_c1e9",
    },
    {
      searchJson: sentrySearchJson,
      choiceJson: sentryChoiceJson,
      role: "sentry",
      stateVersion: 91,
      answer: "card_c1k1",
    },
  ])(
    "binds the actual $role need and unchanged Engine choice to its answer",
    ({ searchJson, choiceJson, role, stateVersion, answer }) => {
      const search = structuredClone<unknown>(searchJson) as Capture;
      bindPublicBoardStealQuoteCompanion(search.input);
      // The native sentry state now has a ready P4 R&D run. Isolate the P5
      // search route here; the native precedence is checked separately below.
      if (role === "sentry") {
        search.input.legalActions = search.input.legalActions.filter(
          (action) => action.actionId !== "rs.rd",
        );
        search.input.playerView.legalActions = search.input.legalActions;
      }
      const choice = structuredClone<unknown>(choiceJson) as Capture;
      resetResidentPlanPortfolioMemory();
      restoreAiRuntimeCheckpoint(
        search.input,
        search.input.ownDeckSnapshot!.deckSnapshotId,
        search.runtime,
      );
      const decision = chooseAiAction(search.input);
      expect(decision.actionId).toBe(
        "r1.c2ei.c2ei.activated.464",
      );
      expect(decision.fallbackUsed).toBe(false);
      expect(
        decision.decisionDebug?.planFirstDecision?.route?.capabilityId,
      ).toBe(`search_answer_breaker_${role}`);
      expect(
        residentPlanPortfolioSnapshot(search.input)?.executorInstanceId,
      ).toBe(planInstanceIdForProposal({ moduleId: "runner.rig_and_coverage", dedupeKey: `coverage:breaker_${role}` }));
      // The selected search action is unchanged, so its historical Engine choice is exact.
      const resolved = chooseAiAction(choice.input);
      expect(resolved.actionId).toBe("rn");
      expect(resolved.fallbackUsed).toBe(false);
      expect(resolved.selectedChoices).toMatchObject({
        choiceId: `p3_37_search_stack_to_grip_${stateVersion}`,
        selectedOptionIds: [answer],
      });
    },
  );
});

it("preserves the native ready R&D run ahead of optional sentry coverage search", () => {
  const search = structuredClone<unknown>(sentrySearchJson) as Capture;
  bindPublicBoardStealQuoteCompanion(search.input);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    search.input,
    search.input.ownDeckSnapshot!.deckSnapshotId,
    search.runtime,
  );
  const decision = chooseAiAction(search.input);
  expect(decision.actionId).toBe("rs.rd");
  expect(decision.fallbackUsed).toBe(false);
  expect(
    decision.decisionDebug?.planFirstDecision?.priority?.effectiveClass,
  ).toBe("P4");
});
