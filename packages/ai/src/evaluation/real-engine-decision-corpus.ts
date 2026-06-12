import type { AiDecisionInput, LegalAction, Side } from "@netgrid/shared";
import {
  buildActionSemanticCandidates,
  type LegalTargetSummary,
} from "../action-semantic-candidate";
import type {
  BuildSemanticDecisionFrameParams,
  SemanticDecisionFrame,
  TacticalGoalLike,
} from "../decision/semantic-decision-frame";
import { buildSemanticDecisionFrame } from "../decision/semantic-decision-frame";
import type { SemanticDecisionTrace } from "../decision/semantic-decision-trace";
import { buildSemanticShadowDecision } from "../decision/semantic-shadow-decision";
import type { AiPlayStrengthPilotScope } from "../decision/pilot-scope-registry";
import type { DeckDoctrineV2Diagnostic } from "../deck-doctrine-strategy";
import { findForbiddenSemanticPath } from "../diagnostics/semantic-redaction";
import type { AiMistakeClass } from "./mistake-taxonomy";

export type RealEngineDecisionCorpusScenario = {
  scenarioId: string;
  input: AiDecisionInput;
  tacticalGoals?: readonly TacticalGoalLike[];
  runner?: BuildSemanticDecisionFrameParams["runner"];
  deckDoctrine?: DeckDoctrineV2Diagnostic;
  leagueExpectation?: RealEngineDecisionCorpusLeagueExpectation;
  evidence?: readonly string[];
};

export type RealEngineDecisionCorpusLeagueExpectation = {
  expectedTopActionTypes?: readonly string[];
  expectedTopActionIds?: readonly string[];
  pilotEligibleScopes?: readonly AiPlayStrengthPilotScope[];
  forbiddenMistakes?: readonly AiMistakeClass[];
  notes?: readonly string[];
  evidence?: readonly string[];
};

export type RealEngineDecisionCorpusSample = {
  scenarioId: string;
  side: Side;
  legalActionCount: number;
  candidateCount: number;
  frame: SemanticDecisionFrame;
  trace: SemanticDecisionTrace;
  deckDoctrine?: DeckDoctrineV2Diagnostic;
  leagueExpectation?: RealEngineDecisionCorpusLeagueExpectation;
  evidence: string[];
};

export function buildRealEngineDecisionCorpus(
  scenarios: readonly RealEngineDecisionCorpusScenario[],
): RealEngineDecisionCorpusSample[] {
  return scenarios.map(buildRealEngineDecisionCorpusSample);
}

export function buildRealEngineDecisionCorpusSample(
  scenario: RealEngineDecisionCorpusScenario,
): RealEngineDecisionCorpusSample {
  if (scenario.input.legalActions.length === 0) {
    throw new Error(
      `Real engine corpus scenario has no LegalActions: ${scenario.scenarioId}`,
    );
  }
  const availableTargetsByActionId = sideSafeServerTargetsByActionId(
    scenario.input.legalActions,
  );
  const actionCandidates = buildActionSemanticCandidates({
    legalActions: scenario.input.legalActions,
    observerSide: scenario.input.side,
    stateVersion: scenario.input.playerView.stateVersion,
    ...(availableTargetsByActionId ? { availableTargetsByActionId } : {}),
  });
  const frame = buildSemanticDecisionFrame({
    input: scenario.input,
    actionCandidates,
    ...(scenario.tacticalGoals
      ? { tacticalGoals: scenario.tacticalGoals }
      : {}),
    ...(scenario.runner ? { runner: scenario.runner } : {}),
    evidence: [
      `real_engine_decision_corpus:${scenario.scenarioId}`,
      ...(scenario.evidence ?? []),
    ],
  });
  const trace = buildSemanticShadowDecision(frame);
  assertRealEngineDecisionCorpusSampleSideSafe(
    scenario.scenarioId,
    frame,
    trace,
  );
  assertTraceUsesOnlyFrameLegalActions(scenario.scenarioId, frame, trace);
  return {
    scenarioId: scenario.scenarioId,
    side: scenario.input.side,
    legalActionCount: scenario.input.legalActions.length,
    candidateCount: frame.actionCandidates.length,
    frame,
    trace,
    ...(scenario.deckDoctrine ? { deckDoctrine: scenario.deckDoctrine } : {}),
    ...(scenario.leagueExpectation
      ? { leagueExpectation: scenario.leagueExpectation }
      : {}),
    evidence: [
      `scenario:${scenario.scenarioId}`,
      `side:${scenario.input.side}`,
      `legal_action_count:${scenario.input.legalActions.length}`,
      `candidate_count:${frame.actionCandidates.length}`,
      `ranked_action_count:${trace.rankedActions.length}`,
      `rejected_action_count:${trace.rejectedActions.length}`,
      ...(scenario.deckDoctrine
        ? [
            `deck_doctrine:${scenario.deckDoctrine.deckSnapshotId}`,
            `deck_doctrine_status:${scenario.deckDoctrine.status}`,
          ]
        : []),
    ],
  };
}

function sideSafeServerTargetsByActionId(
  legalActions: readonly LegalAction[],
): Record<string, readonly LegalTargetSummary[]> | undefined {
  const byActionId: Record<string, readonly LegalTargetSummary[]> = {};
  for (const action of legalActions) {
    const serverId = sideSafeServerIdFromAction(action);
    if (!serverId) continue;
    byActionId[action.actionId] = [
      {
        targetId: serverId,
        targetKind: "server",
        targetSide: "corp",
        targetZone: serverId,
        evidence: [`real_engine_legal_action_server:${serverId}`],
      },
    ];
  }
  return Object.keys(byActionId).length > 0 ? byActionId : undefined;
}

function sideSafeServerIdFromAction(action: LegalAction): string | undefined {
  const serverId = action.payload?.serverId;
  return typeof serverId === "string" ? serverId : undefined;
}

function assertTraceUsesOnlyFrameLegalActions(
  scenarioId: string,
  frame: SemanticDecisionFrame,
  trace: SemanticDecisionTrace,
): void {
  const legalActionIds = new Set(frame.legalActionIds);
  const illegalTraceAction = [
    ...trace.rankedActions.map((action) => action.actionId),
    ...trace.rejectedActions.map((action) => action.actionId),
    ...(trace.selectedActionId ? [trace.selectedActionId] : []),
  ].find((actionId) => !legalActionIds.has(actionId));
  if (!illegalTraceAction) return;
  throw new Error(
    `Real engine corpus trace ranked non-legal action in ${scenarioId}: ${illegalTraceAction}`,
  );
}

function assertRealEngineDecisionCorpusSampleSideSafe(
  scenarioId: string,
  frame: SemanticDecisionFrame,
  trace: SemanticDecisionTrace,
): void {
  const forbiddenPath = findForbiddenSemanticPath(
    { frame, trace },
    `real_engine_decision_corpus.${scenarioId}`,
  );
  if (!forbiddenPath) return;
  throw new Error(
    `Real engine corpus scenario contains forbidden hidden-info marker: ${forbiddenPath}`,
  );
}
