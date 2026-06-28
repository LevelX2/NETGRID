import { describe, expect, it } from "vitest";
import type {
  AiDecision,
  AiDecisionInput,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { createCorpTagCreationDiagnosticsContext } from "./corp-tag-creation-diagnostics";

describe("corp tag creation diagnostics", () => {
  it("matches trace reason codes by bounded terms", () => {
    expect(diagnosticsForReason("corp.trace.bid_visible_amount")).toMatchObject({
      corpTagCreatedDuringEncounter: true,
      corpTagCreatedByTraceSuccess: true,
    });
    expect(diagnosticsForReason("traceroute_noise")).not.toHaveProperty(
      "corpTagCreatedByTraceSuccess",
    );
  });
});

function diagnosticsForReason(reasonCode: string) {
  const diagnostics: Record<string, unknown> = {};
  createCorpTagCreationDiagnosticsContext({
    sourceDefinitionIdForAction: () => "source",
  }).applyActualTagCreationDiagnostics(
    diagnostics,
    input(),
    action(),
    { reasonCode } as AiDecision,
    {} as GameState,
  );
  return diagnostics;
}

function input(): AiDecisionInput {
  return { side: "runner" } as AiDecisionInput;
}

function action(): LegalAction {
  return {
    actionId: "tag",
    side: "corp",
    type: "trigger_ability",
    label: "Tag runner",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 1,
  };
}
