import { describe, expect, it } from "vitest";
import { evaluateRunnerHandDevelopment } from "../../runner-hand-development";
import {
  findByInstance,
  installAction,
  runnerInput,
  visibleCard,
} from "../../runner-hand-development.test-support";

describe("Runner hint metadata consumers", () => {
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
