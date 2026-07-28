import type { DeckDefinition } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import proteusDecksJson from "../../../../data/decks/proteus-playtest-decks-2026-05-25.json";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../runtime/visible-source-definitions";
import { simulateAiGame } from "../simulation";
import type { AiSimulationDecisionCheckpointCapture } from "./ai-simulation-config";

describe("Proteus R&D Mole plan-first run-window coverage", () => {
  it("converts the exact deterministic multiaccess window before beginning access", () => {
    let capture: AiSimulationDecisionCheckpointCapture | undefined;
    const summary = simulateAiGame({
      seed: "proteus-pilot-qualifier-01",
      maxActions: 71,
      runnerDeck: deck("proteus_runner_rd_bad_publicity_2026_05_25"),
      corpDeck: deck("proteus_corp_region_fast_score_2026_05_25"),
      runnerControllerMode: "current_candidate",
      corpControllerMode: "current_candidate",
      testOnlyDecisionCheckpointCapture: {
        actionIndices: [68],
        capture: (snapshot) => {
          capture = snapshot;
        },
      },
    });

    expect(capture).toBeDefined();
    if (!capture) throw new Error("Missing deterministic R&D Mole capture");
    expect(capture.state.stateVersion).toBe(68);
    expect(capture.state.timingPoint).toBe("game.checkpoint");
    expect(capture.state.run).toMatchObject({
      attackedServerId: "rd",
      accessCount: 1,
      position: { kind: "server", serverId: "rd" },
    });
    expect(capture.input.playerView.own.credits).toBe(4);
    expect(
      capture.input.legalActions.map((action) => ({
        type: action.type,
        source: action.source,
        costs: action.costs,
        payload: action.payload,
      })),
    ).toEqual([
      {
        type: "activated_card_ability",
        source: "runner_onr_proteus_147_r-and-d-mole_2",
        costs: [{ credits: 4 }],
        payload: { cardId: "runner_onr_proteus_147_r-and-d-mole_2" },
      },
      {
        type: "continue_run",
        source: "game_rule",
        costs: [],
        payload: { serverId: "rd" },
      },
    ]);

    const candidates = buildActionSemanticCandidates({
      legalActions: capture.input.legalActions,
      observerSide: "runner",
      stateVersion: 68,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(capture.input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const moleCandidate = candidates.find(
      (candidate) =>
        candidate.sourceDefinitionId === "onr_proteus_147_r-and-d-mole",
    );
    expect(moleCandidate).toMatchObject({
      actionType: "activated_card_ability",
      semanticActionType: "card_ability.unknown",
      effectTargets: expect.arrayContaining(["access.rnd_hidden_multiaccess"]),
      runAccessDecisionModel: {
        coverageStatus: "covered",
        payoffs: expect.arrayContaining(["additional_access"]),
      },
    });

    expect(summary.errors).toEqual([]);
    expect(summary.runtimeFailures).toEqual([]);
    expect(summary.actionSequence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          stateVersionBefore: 68,
          actionType: "activated_card_ability",
          eventType: "activated_card_ability",
          planKind: "runner.convert_run_window",
          fallbackUsed: false,
          evidence: expect.arrayContaining([
            "plan_action_assessment_evidence:runner_additional_access_effect_server:rd",
            "plan_action_assessment_evidence:runner_additional_access_current_engine_legal_route_funded",
            "plan_action_assessment_evidence:runner_additional_access_parent_purpose:multiaccess",
            "plan_action_assessment_evidence:runner_visible_additional_access_effect_plan_admissible",
            "plan_action_assessment_evidence:runner_additional_access_positive_effect_preferred_over_continue",
            "plan_step_capability:convert_active_run_window",
          ]),
        }),
        expect.objectContaining({
          stateVersionBefore: 69,
          actionType: "continue_run",
          targetServerId: "rd",
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
