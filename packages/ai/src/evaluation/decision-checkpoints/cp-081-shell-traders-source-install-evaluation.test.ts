import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";

import shellTradersDecisionJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-081-g3-terminal-reserve-consumption-d336.json";
import { evaluateRunnerHandDevelopment } from "../../runner-hand-development";
import { createDeckCapabilitiesContext } from "../../runtime/deck-capabilities-context";
import { createRunnerStrategicIntentContext } from "../../runtime/runner-strategic-intent-context";

describe("CP-081 Shell Traders source-install evaluation", () => {
  it("converts the coherent delayed-install doctrine into the existing install action", () => {
    const input = structuredClone(
      (shellTradersDecisionJson as unknown as { input: AiDecisionInput }).input,
    );
    const deckCapabilities =
      createDeckCapabilitiesContext().deckCapabilitiesForInput(input);
    const strategicIntent =
      createRunnerStrategicIntentContext().runnerStrategicIntentForInput(
        input,
        deckCapabilities,
      );
    const shellTraders = evaluateRunnerHandDevelopment({
      input,
      deckCapabilities,
      strategicIntent,
    }).find(
      (evaluation) =>
        evaluation.definitionId === "onr_v1_176_the-shell-traders",
    );

    expect(strategicIntent.engineLineIds).toContain(
      "runner.engine.delayed_install",
    );
    expect(shellTraders).toMatchObject({
      developmentRole: "delayed_install_engine",
      strategicFit: "strong",
      currentNeed: "useful_now",
      availability: "legal_now",
      deferReason: "none",
      priority: 1000,
      legalActionId:
        "runner.install_card.runner_onr_v1_176_the-shell-traders_2.runner_onr_v1_176_the-shell-traders_2",
      persistentInstallEvaluation: {
        engineAssessment: {
          kind: "delayed_install_engine",
          readiness: "ready_now",
          outputCapabilities: ["install"],
          deckCompatible: true,
          alreadySatisfied: false,
        },
        stackabilityClass: "cumulative_capacity",
        capabilityDelta: "new_coverage",
        duplicateRole: "none",
        finalInstallFit: 950,
      },
    });
  });
});
