import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

describe("Proteus restricted multi-run plan-first coverage", () => {
  it("converts Pirate Broadcast's exact R&D and Archives sequence legs through the generic run-window plan", () => {
    const captures: AiSimulationDecisionCheckpointCapture[] = [];
    const summary = simulateAiGame({
      seed: "proteus-pilot-qualifier-01",
      maxActions: 105,
      runnerDeck: deck("proteus_runner_rd_bad_publicity_2026_05_25"),
      corpDeck: pirateBroadcastCoverageCorpDeck(),
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      aiDecisionRuntimeOptions: { corpTurnPlannerMode: "legacy_compare" },
      testOnlyDecisionCheckpointCapture: {
        actionIndices: Array.from({ length: 105 }, (_, index) => index),
        capture: (snapshot) => {
          captures.push(snapshot);
        },
      },
    });

    const rdActionId =
      "runner.start_run.rd.bonus_run.onr_proteus_116_pirate-broadcast";
    const rdCapture = captures.find((snapshot) =>
      snapshot.input.legalActions.some(
        (action) => action.actionId === rdActionId,
      ),
    );

    expect(rdCapture).toBeDefined();
    if (!rdCapture) {
      throw new Error("Missing Pirate Broadcast R&D sequence-leg capture");
    }
    expect(rdCapture.state.timingPoint).toBe("runner_action.main");
    expect(rdCapture.state.run).toBeUndefined();
    expect(rdCapture.input.legalActions).toEqual([
      expect.objectContaining({
        actionId: rdActionId,
        side: "runner",
        type: "start_run",
        source: "game_rule",
        costs: [],
        payload: expect.objectContaining({
          serverId: "rd",
          effectKind: "run",
          restrictedActionGrantActionType: "start_run",
          restrictedActionGrantCostProfile: "no_click",
          restrictedActionGrantRemainingActions: 1,
        }),
      }),
    ]);

    const candidates = buildActionSemanticCandidates({
      legalActions: rdCapture.input.legalActions,
      observerSide: "runner",
      stateVersion: rdCapture.state.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(rdCapture.input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    expect(candidates).toEqual([
      expect.objectContaining({
        actionId: rdActionId,
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
    expect(
      summary.actionSequence.find((entry) =>
        entry.evidence.includes(
          `plan_action_assessment_evidence:runner_restricted_run_sequence_action:${rdActionId}`,
        ),
      ),
    ).toMatchObject({
      actionType: "start_run",
      targetServerId: "rd",
      planKind: "runner.convert_run_window",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      evidence: expect.arrayContaining([
        "plan_action_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
        "plan_action_assessment_evidence:runner_restricted_run_sequence_remaining:1",
        "plan_action_assessment_evidence:runner_restricted_run_sequence_target:rd",
        "plan_step_capability:continue_engine_restricted_run_sequence",
      ]),
    });

    const archivesActionId =
      "runner.start_run.archives.bonus_run.onr_proteus_116_pirate-broadcast";
    expect(
      summary.actionSequence.find((entry) =>
        entry.evidence.includes(
          `plan_action_assessment_evidence:runner_restricted_run_sequence_action:${archivesActionId}`,
        ),
      ),
    ).toMatchObject({
      actionType: "start_run",
      targetServerId: "archives",
      planKind: "runner.convert_run_window",
      reasonCode: "plan_first.runner.convert_run_window",
      fallbackUsed: false,
      evidence: expect.arrayContaining([
        "plan_action_assessment_evidence:runner_engine_restricted_run_sequence_continuation",
        "plan_action_assessment_evidence:runner_restricted_run_sequence_target:archives",
      ]),
    });
  }, 15_000);
});

function deck(deckId: string): DeckDefinition {
  const result = (proteusDecksJson as { decks: DeckDefinition[] }).decks.find(
    (candidate) => candidate.id === deckId,
  );
  if (!result) throw new Error(`Missing Proteus pilot deck ${deckId}`);
  return structuredClone(result);
}

function pirateBroadcastCoverageCorpDeck(): DeckDefinition {
  const result = deck("proteus_corp_region_fast_score_2026_05_25");
  const caryatid = result.cards.find(
    (card) => card.id === "onr_proteus_013_caryatid",
  );
  const scaffolding = result.cards.find(
    (card) => card.id === "onr_proteus_037_scaffolding",
  );
  if (!caryatid || !scaffolding) {
    throw new Error("Missing Pirate Broadcast coverage ICE");
  }
  // This test isolates the restricted multi-run contract. Caryatid is replaced
  // by the existing cheap scaffolding slot so improved variable-ICE defense
  // selection cannot turn the scenario into a central-access denial test.
  scaffolding.quantity += caryatid.quantity;
  result.cards.splice(result.cards.indexOf(caryatid), 1);
  return result;
}
