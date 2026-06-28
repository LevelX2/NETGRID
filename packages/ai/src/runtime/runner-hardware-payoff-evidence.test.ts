import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { corpVisibleRunnerHardwarePayoffEvidence } from "./runner-hardware-payoff-evidence";

describe("corpVisibleRunnerHardwarePayoffEvidence", () => {
  it("matches multiaccess payoff phrases by bounded text", () => {
    expect(evidenceForText("Access 1 additional card")).toContain(
      "runner_hardware_payoff:multiaccess",
    );
    expect(evidenceForText("Multiaccess")).toContain(
      "runner_hardware_payoff:multiaccess",
    );
    expect(evidenceForText("Multiaccessory noise")).not.toContain(
      "runner_hardware_payoff:multiaccess",
    );
  });
});

function evidenceForText(rulesText: string): string[] {
  return corpVisibleRunnerHardwarePayoffEvidence({
    instanceId: "hardware",
    definitionId: "hardware",
    known: true,
    rulesText,
    type: "hardware",
  } as VisibleCard);
}
