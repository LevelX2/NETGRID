import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  GameState,
  LegalAction,
  PublicGameEvent,
} from "@netgrid/shared";
import { createCorpTagCreationDiagnosticsContext } from "./corp-tag-creation-diagnostics";

const action: LegalAction = {
  actionId: "tag",
  side: "runner",
  type: "resolve_choice",
  label: "Trace beantworten",
  source: "game_rule",
  timingPoint: "corp_action.main",
  costs: [],
  targetRequirements: [],
  visibility: "public",
  expiresAtStateVersion: 1,
};

function diagnosticsForTag(
  state: Partial<GameState>,
  result: PublicGameEvent["publicPayload"],
) {
  const diagnostics: Record<string, unknown> = {};
  createCorpTagCreationDiagnosticsContext({
    sourceDefinitionIdForAction: () => "source",
  }).applyActualTagCreationDiagnostics(
    diagnostics,
    { side: "runner" } as AiDecisionInput,
    action,
    state as GameState,
    result,
  );
  return diagnostics;
}

describe("corp tag creation diagnostics", () => {
  it("retains the Corp turn when the Runner answers an operation trace", () => {
    const diagnostics = diagnosticsForTag(
      {
        activeSide: "runner",
        phase: "run",
        trace: { returnPhase: "corp_action_phase" } as NonNullable<
          GameState["trace"]
        >,
      },
      {
        traceSuccessful: true,
        sourceDefinitionId: "onr_v1_257_viral-pipeline",
      },
    );
    expect(diagnostics).toMatchObject({
      corpTagCreatedDuringCorpTurn: true,
      corpTagCreatedByTraceSuccess: true,
    });
    expect(diagnostics).not.toHaveProperty("corpTagCreatedDuringEncounter");
    expect(diagnostics).not.toHaveProperty("runnerTaggedAfterTraceDuringRun");
  });

  it("distinguishes untraced encounter and access tags", () => {
    const diagnostics = diagnosticsForTag(
      {
        activeSide: "corp",
        phase: "run",
        run: { encounteredIceId: "ice" } as NonNullable<GameState["run"]>,
      },
      {},
    );
    expect(diagnostics).toMatchObject({
      corpTagCreatedDuringRunnerTurn: true,
      corpTagCreatedDuringEncounter: true,
    });
    expect(diagnostics).not.toHaveProperty("corpTagCreatedByTraceSuccess");
  });
});
