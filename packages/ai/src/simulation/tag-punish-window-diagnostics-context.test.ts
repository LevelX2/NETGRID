import { describe, expect, it } from "vitest";
import type {
  AiDecision,
  AiDecisionInput,
  GameState,
  LegalAction,
} from "@netgrid/shared";
import { runnerSurvivalCounterContextForInput } from "./runner-survival-counter-context";
import {
  createTagPunishWindowDiagnosticsContext,
  type TagPunishWindowDiagnosticsContextDependencies,
} from "./tag-punish-window-diagnostics-context";

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
  it("samples Corp turn start once and records a chosen source after another offered source", () => {
    const first = { ...action(), actionId: "first" };
    const chosen = { ...action(), actionId: "chosen" };
    const diagnose = diagnosticsContext({
      corpTagSourceOpportunities: () => [
        { action: first, traceTag: false },
        { action: chosen, traceTag: true },
      ],
    });
    const basic = {
      ...state(1),
      activeSide: "corp",
      timingPoint: "corp_action.main",
    } as GameState;
    const decision = { reasonCode: "test" } as AiDecision;
    const corpInput = {
      side: "corp",
      playerView: { own: { credits: 5, clicks: 3 }, opponent: { credits: 2 } },
    } as AiDecisionInput;
    const actionRow = diagnose(corpInput, chosen, decision, basic, basic, {});
    expect(actionRow).toMatchObject({
      corpTagSourceTaken: true,
      corpTraceTagTaken: true,
    });
    expect(actionRow.runnerTaggedAtStartOfCorpTurn).toBeUndefined();

    const turnStart = {
      ...basic,
      timingPoint: "corp_draw.mandatory_draw",
    } as GameState;
    const draw = { ...chosen, type: "mandatory_draw" } as LegalAction;
    expect(
      diagnose(corpInput, draw, decision, turnStart, basic, {})
        .runnerTaggedAtStartOfCorpTurn,
    ).toBe(true);
  });
});

function diagnosticsContext(
  overrides: Partial<TagPunishWindowDiagnosticsContextDependencies> = {},
) {
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
    corpTagSourceOpportunities: () => [],
    corpOntologyPayoffAvailableForTagSource: () => false,
    applyActualTagCreationDiagnostics: () => undefined,
    ...overrides,
  }).tagPunishWindowDiagnosticsForSimulationAction;
}

function diagnosticsForTag(record: (...args: unknown[]) => void) {
  return diagnosticsContext({ applyActualTagCreationDiagnostics: record })(
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
