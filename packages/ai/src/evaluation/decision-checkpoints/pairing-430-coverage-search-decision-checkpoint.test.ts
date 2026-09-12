import { describe, expect, it } from "vitest";
import searchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d80.json";
import choiceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d81.json";
import sentrySearchJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d91.json";
import sentryChoiceJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-430-search-d92.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory, residentPlanPortfolioSnapshot } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";

type Capture = { input: AiDecisionInputWithDeckCapabilities; runtime: AiRuntimeCheckpointV1 };

describe("pairing 430 coverage search answers the actual ICE category", () => {
  it.each([
    { searchJson, choiceJson, role: "code_gate", stateVersion: 80, answer: "card_runner_onr_v1_014_codecracker_1" },
    { searchJson: sentrySearchJson, choiceJson: sentryChoiceJson, role: "sentry", stateVersion: 91, answer: "card_runner_onr_v1_040_loony-goon_1" },
  ])("binds the actual $role need and unchanged Engine choice to its answer", ({ searchJson, choiceJson, role, stateVersion, answer }) => {
    const search = structuredClone(searchJson) as Capture;
    const choice = structuredClone(choiceJson) as Capture;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(search.input, search.input.ownDeckSnapshot!.deckSnapshotId, search.runtime);
    const decision = chooseAiAction(search.input);
    expect(decision.actionId).toBe("runner.activated_card_ability.runner_onr_v1_177_the-short-circuit_2.runner_onr_v1_177_the-short-circuit_2.activated.onr_v1_177_the-short-circuit:abilities_activated_runner_main_search_stack_to_grip");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision?.route?.capabilityId).toBe(`search_answer_breaker_${role}`);
    expect(residentPlanPortfolioSnapshot(search.input)?.executorInstanceId).toBe(`plan:runner.rig_and_coverage:coverage%3Abreaker_${role}`);
    // The selected search action is unchanged, so its historical Engine choice is exact.
    const resolved = chooseAiAction(choice.input);
    expect(resolved.actionId).toBe("runner.resolve_choice");
    expect(resolved.fallbackUsed).toBe(false);
    expect(resolved.selectedChoices).toMatchObject({
      choiceId: `p3_37_search_stack_to_grip_${stateVersion}`,
      selectedOptionIds: [answer],
    });
  });
});
