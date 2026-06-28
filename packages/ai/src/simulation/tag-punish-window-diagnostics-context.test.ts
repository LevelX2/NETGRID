import { describe, expect, it } from "vitest";
import type {
  AiDecision,
  AiDecisionInput,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { createTagPunishWindowDiagnosticsContext } from "./tag-punish-window-diagnostics-context";

describe("tag punish window diagnostics", () => {
  it("matches runner trace tag reason codes by bounded terms", () => {
    expect(diagnosticsForReason("corp.trace.bid_visible_amount")).toMatchObject({
      runnerTaggedAfterTraceDuringRun: true,
    });
    expect(diagnosticsForReason("traceroute_noise")).not.toHaveProperty(
      "runnerTaggedAfterTraceDuringRun",
    );
  });
});

function diagnosticsForReason(reasonCode: string) {
  return createTagPunishWindowDiagnosticsContext({
    corpVisibleTagPunishOpportunities: () => [],
    runnerSurvivalCounterContextForInput: () => ({
      any: false,
      damage: false,
      flatline: false,
      link: false,
      trace: false,
    }),
    corpTagPunishOntologyAssessmentForAction: () => undefined,
    applyTagPunishOntologyDiagnostics: () => undefined,
    applyCorpVisibleTagPunishTakenWindowDiagnostics: () => undefined,
    applyCorpVisibleTagPunishUnknownSkipDiagnostics: () => undefined,
    strongestCorpTagSourceOpportunity: () => undefined,
    corpOntologyPayoffAvailableForTagSource: () => false,
    applyCorpTagSourceWindowDiagnostics: () => undefined,
    applyActualTagCreationDiagnostics: () => undefined,
  }).tagPunishWindowDiagnosticsForSimulationAction(
    input(),
    action(),
    { reasonCode } as AiDecision,
    state(0),
    state(1),
  );
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

function state(tags: number): GameState {
  return {
    runner: { tags },
  } as GameState;
}
