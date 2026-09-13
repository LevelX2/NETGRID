import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-434-r13-tax-funding-g6.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

it.each([8, 9, 10, 11])(
  "quotes a two-credit encounter tax instead of an unnecessary ten-credit break with %i credits",
  (credits) => {
    const input = structuredClone(checkpoint.input);
    input.playerView.own.credits = credits;
    const target = evaluateRunnerRunTargets({ input }).find(
      (candidate) => candidate.actionId === "runner.start_run.remote_1",
    );
    // Wall of Static: six; Ball and Chain's tax: two; inner Data Wall: two.
    expect(target).toMatchObject({
      pathCost: 10,
      creditsAfterRun: credits - 10,
    });
    expect(target?.routeQuote?.fundingGap).toBe(Math.max(0, 10 - credits));
  },
);

it.each([
  { loanAvailable: true, bankAvailable: true },
  { loanAvailable: false, bankAvailable: true },
  { loanAvailable: true, bankAvailable: false },
  { loanAvailable: false, bankAvailable: false },
])(
  "funds the exact taxed path with bank=$bankAvailable and safe loan=$loanAvailable",
  ({ loanAvailable, bankAvailable }) => {
    const { input, runtime } = structuredClone(checkpoint);
    if (!bankAvailable)
      input.legalActions = input.legalActions.filter(
        (candidate) => !candidate.actionId.includes("withdraw_credits"),
      );
    if (!loanAvailable)
      input.legalActions = input.legalActions.filter(
        (candidate) =>
          !candidate.actionId.includes(
            "install_card.runner_onr_v1_168_loan-from-chiba",
          ),
      );
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const action = input.legalActions.find((candidate) =>
      bankAvailable
        ? candidate.actionId ===
          "runner.activated_card_ability.runner_onr_v1_154_broker_1.runner_onr_v1_154_broker_1.activated.onr_v1_154_broker:withdraw_credits"
        : loanAvailable
        ? candidate.actionId ===
          "runner.install_card.runner_onr_v1_168_loan-from-chiba_1.runner_onr_v1_168_loan-from-chiba_1"
        : candidate.actionId === "runner.gain_credit",
    )!;
    if (bankAvailable || loanAvailable) {
      const target = evaluateRunnerRunTargets({ input }).find(
        (candidate) => candidate.actionId === "runner.start_run.remote_1",
      )!;
      expect(target.pathCost).toBe(10);
      expect(
        target.creditsAfterRun + Number(action.payload?.gainCreditsAmount),
      ).toBe(bankAvailable ? 1 : 10);
    }
    expect(chooseAiAction(input)).toMatchObject({
      actionId: action.actionId,
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          selectedStep: {
            parentInstanceId: "plan:runner.contest_remote:remote%3Aremote_1",
            planInstanceId: bankAvailable
              ? "plan:runner.credit_bank:runner_onr_v1_154_broker_1"
              : "plan:runner.economy:run-support%3Aremote%3Aremote_1",
            needId: "run-support:remote:remote_1",
          },
          route: {
            actionId: action.actionId,
            stateVersion: input.playerView.stateVersion,
          },
        },
      },
    });
  },
);
