import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import type { DecisionSnapshot } from "./decision-snapshot";
import {
  classifyDecisionTraceMistakes,
  evaluateDecisionSnapshot,
} from "./decision-snapshot-suite";

describe("DecisionSnapshotSuite", () => {
  it("passes a low-credit runner snapshot when economy is top goal", () => {
    const input = inputFor("runner", [
      legalAction("gain-1", "gain_credit", "runner"),
      legalAction("run-1", "start_run", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.build_economy_base",
          family: "economy",
          priority: 940,
          urgency: "high",
          source: "economy_posture",
          evidence: ["funding_need:true"],
        },
      ],
    });
    const snapshot = snapshotFor("runner-low-credits", "runner", [
      "economy_starvation",
      "unsafe_run",
      "illegal_action",
      "hidden_info_dependency",
    ], ["economy"]);

    const evaluation = evaluateDecisionSnapshot({
      snapshot,
      frame,
      trace: buildSemanticShadowDecision(frame),
    });

    expect(evaluation.passed).toBe(true);
    expect(evaluation.preferredGoalFamilyMatched).toBe(true);
  });

  it("detects illegal ranked actions", () => {
    const input = inputFor("runner", [legalAction("gain-1", "gain_credit", "runner")]);
    const frame = buildSemanticDecisionFrame({ input });
    const trace: SemanticDecisionTrace = {
      schemaVersion: "semantic-decision-trace-v1",
      frameSummary: {
        side: "runner",
        stateVersion: 1,
        legalActionCount: 1,
        actionCandidateCount: 0,
        tacticalGoalCount: 0,
        hiddenInfoPolicy: "player_view_only",
      },
      rankedActions: [
        {
          actionId: "not-legal",
          rank: 1,
          score: 100,
          components: [],
          blockers: [],
          explanation: "bad_fixture",
        },
      ],
      rejectedActions: [],
      noRuntimeEffect: true,
    };

    expect(
      classifyDecisionTraceMistakes(frame, trace).map(
        (mistake) => mistake.mistakeClass,
      ),
    ).toContain("illegal_action");
  });

  it("detects target choice unavailability from rejected actions", () => {
    const input = inputFor("runner", [
      legalAction("choice-1", "resolve_choice", "runner"),
    ]);
    const frame = buildSemanticDecisionFrame({
      input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: input.legalActions,
        observerSide: "runner",
        stateVersion: input.playerView.stateVersion,
      }),
      tacticalGoals: [
        {
          goalId: "runner.resolve_target",
          family: "target_resolution",
          priority: 80,
          urgency: "high",
        },
      ],
    });

    const mistakes = classifyDecisionTraceMistakes(
      frame,
      buildSemanticShadowDecision(frame),
    );

    expect(mistakes.map((mistake) => mistake.mistakeClass)).toContain(
      "target_choice_unavailable",
    );
  });
});

function snapshotFor(
  snapshotId: string,
  side: "runner" | "corp",
  forbiddenMistakes: DecisionSnapshot["expectedProperties"]["forbiddenMistakes"],
  preferredGoalFamilies?: DecisionSnapshot["expectedProperties"]["preferredGoalFamilies"],
): DecisionSnapshot {
  return {
    snapshotId,
    side,
    description: snapshotId,
    inputBuilder: () => inputFor(side, []),
    expectedProperties: {
      mustChooseFromLegalActions: true,
      forbiddenMistakes,
      ...(preferredGoalFamilies ? { preferredGoalFamilies } : {}),
    },
  };
}

function inputFor(
  side: "runner" | "corp",
  legalActions: LegalAction[],
): AiDecisionInput {
  return {
    side,
    playerView: {
      side,
      stateVersion: 1,
      timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
      activeSide: side,
      phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
      own: {
        identity: visibleCard(`${side}-identity`),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: visibleCard(`${side}-opponent-identity`),
        credits: 5,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions,
    difficulty: "normal",
    seed: "seed",
    decisionId: `${side}:decision`,
    actionNumber: 1,
    profileId: `${side}:profile`,
  } as unknown as AiDecisionInput;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  side: "runner" | "corp",
): LegalAction {
  return {
    actionId,
    side,
    type,
    label: type,
    source: "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 1,
  };
}

function visibleCard(cardId: string) {
  return {
    instanceId: `${cardId}-instance`,
    definitionId: cardId,
    title: cardId,
    side: "runner",
    type: "identity",
    zone: "identity",
    visibility: "public",
    known: true,
  };
}
