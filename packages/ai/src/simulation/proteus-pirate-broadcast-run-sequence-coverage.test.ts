import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

describe("Proteus restricted multi-run plan-first coverage", () => {
  it("converts the exact stateVersion-72 R&D sequence leg through the generic run-window plan", () => {
    let capture: AiSimulationDecisionCheckpointCapture | undefined;
    const summary = simulateAiGame({
      seed: "proteus-pilot-qualifier-01",
      maxActions: 76,
      runnerDeck: deck("proteus_runner_rd_bad_publicity_2026_05_25"),
      corpDeck: deck("proteus_corp_region_fast_score_2026_05_25"),
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: [72],
        capture: (snapshot) => {
          capture = snapshot;
        },
      },
    });

    expect(capture).toBeDefined();
    if (!capture) throw new Error("Missing stateVersion-72 capture");
    expect(capture.state.stateVersion).toBe(72);
    expect(capture.state.timingPoint).toBe("runner_action.main");
    expect(capture.state.run).toBeUndefined();
    expect(capture.input.legalActions).toEqual([
      expect.objectContaining({
        actionId:
          "runner.start_run.rd.bonus_run.onr_proteus_116_pirate-broadcast",
        side: "runner",
        type: "start_run",
        source: "game_rule",
        costs: [],
        payload: {
          serverId: "rd",
          effectKind: "run",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        },
      }),
    ]);

    const candidates = buildActionSemanticCandidates({
      legalActions: capture.input.legalActions,
      observerSide: "runner",
      stateVersion: 72,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(capture.input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    expect(candidates).toEqual([
      expect.objectContaining({
        actionId:
          "runner.start_run.rd.bonus_run.onr_proteus_116_pirate-broadcast",
        actionType: "start_run",
        semanticActionType: "run.start",
        runProjectionSummary: expect.objectContaining({
          serverId: "rd",
          source: "legal_action_payload",
        }),
      }),
    ]);

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.actionSequence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stateVersionBefore: 72,
          actionType: "start_run",
          targetServerId: "rd",
          planKind: "runner.convert_run_window",
          reasonCode: "plan_first.runner.convert_run_window",
          fallbackUsed: false,
          evidence: expect.arrayContaining([
            "plan_action_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
            "plan_action_assessment_evidence:runner_restricted_run_sequence_action:runner.start_run.rd.bonus_run.onr_proteus_116_pirate-broadcast",
            "plan_action_assessment_evidence:runner_restricted_run_sequence_remaining:1",
            "plan_action_assessment_evidence:runner_restricted_run_sequence_target:rd",
            "plan_step_capability:continue_engine_restricted_run_sequence",
          ]),
        }),
        expect.objectContaining({
          stateVersionBefore: 75,
          actionType: "start_run",
          targetServerId: "archives",
          planKind: "runner.convert_run_window",
          reasonCode: "plan_first.runner.convert_run_window",
          fallbackUsed: false,
          evidence: expect.arrayContaining([
            "plan_action_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
            "plan_action_assessment_evidence:runner_restricted_run_sequence_target:archives",
          ]),
        }),
      ]),
    );
  });
});

function deck(deckId: string): DeckDefinition {
  const result = (proteusDecksJson as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === deckId,
  );
  if (!result) throw new Error(`Missing Proteus pilot deck ${deckId}`);
  return structuredClone(result);
}
