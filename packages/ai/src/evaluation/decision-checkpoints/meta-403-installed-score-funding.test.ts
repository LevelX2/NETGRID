import { expect, it } from "vitest";
import terminal from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-installed-score-funding-terminal.json";
import nonterminal from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-403-installed-score-funding-nonterminal.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const root =
  "plan:corp.score_agenda:agenda%3Acorp_onr_v1_209_political-coup_1%3Aremote_1";
const leaf =
  "plan:corp.economy:score-support%3Aagenda%3Acorp_onr_v1_209_political-coup_1%3Aremote_1";
function restore(checkpoint: unknown) {
  const { input, runtime } = structuredClone(checkpoint) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  return input;
}
it.each([
  { name: "terminal", checkpoint: terminal as unknown },
  { name: "nonterminal", checkpoint: nonterminal as unknown },
])(
  "funds the installed $name score with two remaining clicks",
  ({ checkpoint }) => {
    const input = restore(checkpoint);
    expect(input.playerView.own.credits).toBe(0);
    expect(input.legalActions.some((a) => a.type === "advance_card")).toBe(
      false,
    );
    const result = chooseAiAction(input);
    const action = input.legalActions.find(
      (a) => a.actionId === result.actionId,
    )!;
    expect(["gain_credit", "play_operation"]).toContain(action.type);
    expect(result).toMatchObject({
      fallbackUsed: false,
      timeoutUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: root,
          leafExecutorInstanceId: leaf,
          selectedStep: { planInstanceId: leaf, stepId: `${leaf}:fund` },
          route: {
            actionId: action.actionId,
            stateVersion: input.playerView.stateVersion,
            planInstanceId: leaf,
            capabilityId: "develop_or_convert_corp_economy",
          },
        },
      },
    });
  },
);
it("does not claim a terminal current-turn line when funding consumes the last click", () => {
  const input = restore(terminal);
  input.playerView.own.clicks = 1;
  const result = chooseAiAction(input);
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).not.toBe(
    root,
  );
});
it("does not fund an installed score from an expired Engine continuation quote", () => {
  const input = restore(terminal);
  const agenda = input.playerView.servers
    .find((s) => s.id === "remote_1")!
    .root.find((a) => a.scoreContinuationQuote)!;
  agenda.scoreContinuationQuote!.expiresAtStateVersion--;
  const result = chooseAiAction(input);
  expect(result.decisionDebug?.planFirstDecision?.rootPlanInstanceId).not.toBe(
    root,
  );
});
