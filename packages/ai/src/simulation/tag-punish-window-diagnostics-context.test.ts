import { describe, expect, it } from "vitest";
import type {
  AiDecision,
  AiDecisionInput,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { runnerSurvivalCounterContextForInput } from "./runner-survival-counter-context";
import { createTagPunishWindowDiagnosticsContext } from "./tag-punish-window-diagnostics-context";

describe("tag punish window diagnostics", () => {
  it("distinguishes trace limit reduction from a link ability", () => {
    const context = (definitionId: string) =>
      runnerSurvivalCounterContextForInput({
        playerView: { opponent: { rig: [{ known: true, definitionId }] } },
      } as unknown as AiDecisionInput);
    expect(context("onr_v1_051_rabbit")).toMatchObject({
      trace: true,
      link: false,
    });
    expect(context("onr_v1_063_signpost")).toMatchObject({
      trace: true,
      link: true,
    });
  });

  it("passes resolved Engine trace evidence to the tag creation classifier", () => {
    const received: unknown[] = [];
    const diagnostics = diagnosticsForTag((...args) =>
      received.push(args.at(-1)),
    );
    expect(diagnostics.runnerTagAddedByAction).toBe(true);
    expect(received).toEqual([{ traceSuccessful: true }]);
  });
});

function diagnosticsForTag(record: (...args: unknown[]) => void) {
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
    applyActualTagCreationDiagnostics: record,
  }).tagPunishWindowDiagnosticsForSimulationAction(
    input(),
    action(),
    { reasonCode: "any" } as AiDecision,
    state(0),
    state(1),
    { traceSuccessful: true },
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
