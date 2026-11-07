import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { evaluateRunnerHandDevelopment } from "../../runner/hand-development/hand-development-evaluation";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const checkpoint = JSON.parse(
  readFileSync(
    new URL(
      "../../../../../data/scenarios/ai-decision-checkpoints/cp-deep625-runner-install-tax-d19.json",
      import.meta.url,
    ),
    "utf8",
  ),
) as {
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: Record<string, boolean>;
};

describe("pure opponent ICE-install tax at the native Development consumer", () => {
  it.each([1, 2, 20])(
    "does not turn the opponent's future tax into our own income at %i credits",
    (credits) => {
      const input = structuredClone(checkpoint.input);
      input.playerView.own.credits = credits;
      const evaluations = evaluateRunnerHandDevelopment({ input });
      const tax = evaluations.find(
        (entry) => entry.definitionId === "onr_v1_173_restrictive-net-zoning",
      )!;
      expect(tax.developmentRole).toBe("access_payoff");
      expect(tax.currentNeed).not.toBe("acute");
      expect(tax.liquidityTiming).toBe("none");
      expect(tax.persistentInstallEvaluation?.newFunctionalCoverage).toContain(
        "corp_ice_install_tax",
      );
      expect(tax.persistentInstallEvaluation?.newFunctionalCoverage).not.toContain(
        "economy_engine",
      );
      const income = evaluations.find(
        (entry) => entry.definitionId === "onr_v1_097_livewires-contacts",
      )!;
      expect(income.developmentRole).toBe("economy_engine");
      expect(income.liquidityTiming).toBe("immediate");
    },
  );

  it("does not materialize a false own-economy purpose in the original D19", () => {
    expect(Object.keys(checkpoint.validation)).toHaveLength(9);
    expect(Object.values(checkpoint.validation).every(Boolean)).toBe(true);
    const { input, runtime } = structuredClone(checkpoint);
    const before = JSON.stringify(input.playerView);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    expect(JSON.stringify(input.playerView)).toBe(before);
    expect(input.legalActions.some((a) => a.actionId === decision.actionId)).toBe(
      true,
    );
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.rootPlanInstanceId).toMatch(/^plan:runner\./);
    expect(plan?.route?.actionId).toBe(decision.actionId);
    expect(plan?.route?.stateVersion).toBe(input.playerView.stateVersion);
    expect(plan?.route?.purpose).not.toContain("economy_engine");
  });
});
