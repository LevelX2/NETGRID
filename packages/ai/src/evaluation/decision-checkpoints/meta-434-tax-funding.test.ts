import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { evaluateRunnerRunTargets } from "../../runner-run-target-evaluation";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { bindPublicBoardStealQuoteCompanion } from "../../public-board-steal-quotes.test-support";
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
      (candidate) => candidate.actionId === "rs.r1",
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
    bindPublicBoardStealQuoteCompanion(input);
    // Debt is warranted only when ordinary income cannot fund the same-turn
    // route. With three clicks, two basic credits avoid the loan entirely.
    if (loanAvailable && !bankAvailable) input.playerView.own.clicks = 2;
    if (!bankAvailable)
      input.legalActions = input.legalActions.filter(
        (candidate) => candidate.payload?.cardImplementationAbilityId !== 441,
      );
    if (!loanAvailable)
      input.legalActions = input.legalActions.filter(
        (candidate) =>
          !candidate.actionId.includes(
            "install_card.runner_380",
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
          "r1.c29d.c29d.activated.441"
        : loanAvailable
          ? candidate.actionId ===
            "rc.c2ch.c2ch"
          : candidate.actionId === "rb",
    )!;
    if (bankAvailable || loanAvailable) {
      const target = evaluateRunnerRunTargets({ input }).find(
        (candidate) => candidate.actionId === "rs.r1",
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
            parentInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
            planInstanceId: bankAvailable
              ? "pdeck54mcc1lshdzs9k74eyxih"
              : "p8dvcw6jj6cbaz1qxlt9ksvoh5",
            needId: "run-support:remote:r1",
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

it("preserves the native debt-free two-credit route when three clicks remain", () => {
  const { input, runtime } = structuredClone(checkpoint);
  bindPublicBoardStealQuoteCompanion(input);
  input.legalActions = input.legalActions.filter(
    (candidate) => candidate.payload?.cardImplementationAbilityId !== 441,
  );
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  expect(input.playerView.own.clicks).toBe(3);
  expect(chooseAiAction(input)).toMatchObject({
    actionId: "rb",
    fallbackUsed: false,
    decisionDebug: {
      planFirstDecision: {
        rootPlanInstanceId: "p1p4xezjcxov79rno40lq3f7rv",
      },
    },
  });
});
