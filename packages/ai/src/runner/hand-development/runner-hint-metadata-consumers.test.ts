import { describe, expect, it } from "vitest";
import { evaluateRunnerHandDevelopment } from "./hand-development-evaluation";
import { readFileSync } from "node:fs";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  findByInstance,
  installAction,
  runnerInput,
  visibleCard,
} from "../../runner-hand-development.test-support";

describe("Runner hint metadata consumers", () => {
  it("does not materialize fictitious income from the native G1 D47 checkpoint", () => {
    const checkpoint = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r13-sp500-g1-d47-startup-income.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
    const input = {
      ...checkpoint.input,
      ...buildAiDecisionInputDto(checkpoint.input),
    };
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      checkpoint.runtime,
    );
    const decision = chooseAiAction(input);
    expect(decision.actionId).not.toContain("startup-immolator");
    expect(
      decision.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).not.toContain("startup-immolator");
    expect(decision.fallbackUsed).toBe(false);
  });
  it.each([0, 5, 20])(
    "keeps post-break ICE payment out of income setup at %i credits",
    (credits) => {
      const startup = visibleCard("startup", {
        definitionId: "onr_v1_068_startup-immolator",
        title: "Startup Immolator",
        type: "program",
        installCost: 0,
        memoryCost: 1,
      });
      const input = runnerInput({
        credits,
        hand: [startup],
        rig: [],
        legalActions: [installAction("install-startup", startup, 0)],
        memoryUsed: 0,
        memoryLimit: 4,
      });
      const evaluation = findByInstance(
        evaluateRunnerHandDevelopment({ input }),
        "startup",
      );
      expect(evaluation).toMatchObject({
        developmentRole: "access_payoff",
        currentNeed: "none",
        deferReason: "no_current_need",
      });
      expect(
        evaluation.persistentInstallEvaluation?.newFunctionalCoverage,
      ).toContain("access_support");
      expect(
        evaluation.persistentInstallEvaluation?.newFunctionalCoverage,
      ).not.toContain("economy_engine");
    },
  );
  it("recognizes Microtech Backup Drive as program-protection support", () => {
    const backupDrive = visibleCard("microtech-backup-drive", {
      definitionId: "onr_v1_131_microtech-backup-drive",
      title: "Microtech Backup Drive",
      type: "hardware",
      installCost: 0,
    });
    const input = runnerInput({
      credits: 5,
      hand: [backupDrive],
      rig: [],
      legalActions: [installAction("install-backup-drive", backupDrive, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "microtech-backup-drive",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      availability: "legal_now",
    });
  });
});
