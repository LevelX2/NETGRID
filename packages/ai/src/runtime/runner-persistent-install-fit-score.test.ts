import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { runnerPersistentInstallEvaluationForAction } from "./runner-persistent-install-fit-score";

describe("runnerPersistentInstallEvaluationForAction", () => {
  it("reuses the target card evaluation for a program-trash install variant", () => {
    const action = {
      actionId: "install-cyfermaster-with-program-trash",
      side: "runner",
      type: "install_card",
      label: "Cyfermaster installieren und Programm trashen",
      source: "cyfermaster-hand",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: 2,
      payload: { runnerProgramTrashBeforeInstall: true },
    } as LegalAction;
    const persistentInstallEvaluation = {
      stackabilityClass: "absolute_non_stackable",
      capabilityDelta: "backup_only",
      duplicateRole: "redundant_duplicate",
      finalInstallFit: -920,
      evidence: ["why_duplicate_install_deferred:low_marginal_utility"],
    };

    expect(
      runnerPersistentInstallEvaluationForAction(
        {
          side: "runner",
          legalActions: [action],
          playerView: { own: { gripOrHq: [], rig: [] } },
        } as unknown as AiDecisionInput,
        action,
        {
          deckCapabilities: () => ({}),
          strategicIntent: () => ({}),
          handDevelopmentEvaluations: () => [
            {
              cardInstanceId: "cyfermaster-hand",
              legalActionId: "install-cyfermaster-direct",
              persistentInstallEvaluation,
            },
          ],
        },
      ),
    ).toEqual(persistentInstallEvaluation);
  });

  it("binds a delayed install route to its target instead of its host", () => {
    const action = {
      actionId: "prepare-dwarf",
      side: "runner",
      type: "trigger_ability",
      label: "The Shell Traders: Dwarf vorbereiten",
      source: "shell-traders-installed",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: 2,
      payload: {
        shellTradersAbility: "set_aside_from_grip",
        targetCardId: "dwarf-hand",
      },
    } as LegalAction;
    const persistentInstallEvaluation = {
      stackabilityClass: "backup_redundancy",
      capabilityDelta: "backup_only",
      duplicateRole: "redundant_duplicate",
      finalInstallFit: -780,
      evidence: ["functional_breaker_coverage_already_installed"],
    };

    expect(
      runnerPersistentInstallEvaluationForAction(
        {
          side: "runner",
          legalActions: [action],
          playerView: { own: { gripOrHq: [], rig: [] } },
        } as unknown as AiDecisionInput,
        action,
        {
          deckCapabilities: () => ({}),
          strategicIntent: () => ({}),
          handDevelopmentEvaluations: () => [
            {
              cardInstanceId: "dwarf-hand",
              persistentInstallEvaluation,
            },
          ],
        },
      ),
    ).toEqual(persistentInstallEvaluation);
  });
});
