import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "./ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "./input-dto";
import { buildDeckCapabilityProfileFromInput } from "./deck-capabilities";
import { evaluateRunnerRunTargets } from "./runner-run-target-evaluation";
import { restoreAiRuntimeCheckpoint } from "./evaluation/decision-checkpoints/runtime-checkpoint";
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "./runtime/ai-decision-input";

const checkpoint = () =>
  JSON.parse(
    readFileSync(
      new URL(
        "./runtime/test-fixtures/meta591-g33-d271-capped-run.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
function input() {
  const cp = checkpoint();
  return {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
}
function targets(value: AiDecisionInputWithDeckCapabilities) {
  return evaluateRunnerRunTargets({
    input: value,
    deckCapabilities: buildDeckCapabilityProfileFromInput(value),
  }).filter((x) => x.targetServerId === "rd");
}
function capped(value: AiDecisionInputWithDeckCapabilities) {
  return targets(value).find(
    (x) => x.runActionProjection?.spendLimit !== undefined,
  )!;
}
afterEach(resetResidentPlanPortfolioMemory);

it("does not promise ordinary cash beyond the exact run spending cap for unknown ICE", () => {
  const value = input(),
    before = JSON.stringify(value),
    result = capped(value);
  expect(result.prerunReserveQuote).toMatchObject({
    knownPathCost: 2,
    creditsAfterKnownPath: 1,
    requiredCredits: 8,
    creditGap: 7,
    status: "blocked",
  });
  expect(result.recommendation).toBe("gain_credits_first");
  expect(result.creditsAfterRun).toBe(12);
  expect(JSON.stringify(value)).toBe(before);
});
it("preserves the unrestricted ordinary run and its cash reserve", () => {
  expect(
    targets(input()).find((x) => x.actionId === "runner.start_run.rd"),
  ).toMatchObject({
    recommendation: "run_now",
    prerunReserveQuote: {
      status: "satisfied",
      creditsAfterKnownPath: 12,
      creditGap: 0,
    },
  });
});
it("does not repair a fixed spending cap merely by adding liquid cash", () => {
  const value = input();
  value.playerView.own.credits = 40;
  expect(capped(value).prerunReserveQuote).toMatchObject({
    creditsAfterKnownPath: 1,
    creditGap: 7,
    status: "blocked",
  });
});
it("allows a sufficient generic cap without naming the source card", () => {
  const value = input();
  const action = value.legalActions.find(
    (x) =>
      x.payload?.runSpendingCap !== undefined && x.payload?.serverId === "rd",
  )!;
  action.payload!.runSpendingCap = 12;
  expect(capped(value)).toMatchObject({
    recommendation: "run_now",
    prerunReserveQuote: { creditsAfterKnownPath: 10, status: "satisfied" },
  });
});
it("retains a capped known path when the unknown ICE risk is absent", () => {
  const value = input();
  value.playerView.servers.find((x) => x.id === "rd")!.ice =
    value.playerView.servers
      .find((x) => x.id === "rd")!
      .ice.filter((x) => x.known);
  expect(capped(value).prerunReserveQuote).toMatchObject({
    status: "not_required",
    unknownIceCount: 0,
  });
  expect(capped(value).recommendation).toBe("run_now");
});
it("rejects the native unsafe optional head through the existing plan owner", () => {
  const cp = checkpoint(),
    value = input();
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  restoreAiRuntimeCheckpoint(
    value,
    value.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(value);
  expect(decision.actionId).not.toContain(
    "wilson-weeflerunner-apprentice_1.rd.",
  );
  expect(value.legalActions.some((x) => x.actionId === decision.actionId)).toBe(
    true,
  );
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});
