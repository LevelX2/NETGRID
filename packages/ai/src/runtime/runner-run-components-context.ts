import type {
  AiDecisionInput,
  AiDecisionScoreComponent,
  LegalAction,
} from "@netgrid/shared";
import type { KnownRezzedIcePathAssessment } from "../visible-run-analysis";
import { runnerAccessTrashScoreComponents } from "./runner-access-trash-score";
import { runnerArchivesScoreComponents } from "./runner-archives-score";
import {
  runnerKnownIcePathReason,
  runnerKnownIcePathScoreComponents,
} from "./runner-known-ice-path-score";
import { runnerRemoteScoreComponents } from "./runner-remote-score";
import { runnerRepeatedRunTargetScoreComponents } from "./runner-repeated-run-target-score";

type RunnerRunServer = AiDecisionInput["playerView"]["servers"][number];
type RunnerAccessTrashContext = {
  trashable: boolean;
  affordableRelevant: boolean;
  highImpact: boolean;
  trashCost: number;
  generalCreditCost: number;
  creditsAfterGeneralTrash: number;
  reserveTarget: number;
  deferredByBudget: boolean;
  centralAccess: boolean;
  accessServerId?: string;
  targetType?: string;
  role?: string;
};
type RunnerRemoteCandidateMemory = {
  exhaustive: boolean;
  agendaCandidateCount: number;
  relevantTrashCandidateCount: number;
  candidateCount: number;
};

export type RunnerRunComponentsContextDependencies = {
  trashAccessContext: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => RunnerAccessTrashContext;
  evaluationForAction: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => { accessServerId: string } | undefined;
  definitionType: (definitionId: string) => string | undefined;
  knownIcePathAssessment: (
    input: AiDecisionInput,
    server: RunnerRunServer,
  ) => KnownRezzedIcePathAssessment;
  rootTrashCost: (
    card: RunnerRunServer["root"][number],
  ) => number | undefined;
  candidateMemory: (
    input: AiDecisionInput,
    server: RunnerRunServer | undefined,
  ) => RunnerRemoteCandidateMemory | undefined;
  recentStartRunsOnServer: (
    input: AiDecisionInput,
    serverId: string,
  ) => number;
  isRemoteServerTarget: (serverId: string | undefined) => boolean;
};

export type RunnerRunComponentsContext = {
  semanticRuntimeRunnerAccessTrashComponents: (
    input: AiDecisionInput,
    action: LegalAction,
  ) => AiDecisionScoreComponent[];
  semanticRuntimeRunnerArchivesComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    server: RunnerRunServer | undefined,
  ) => AiDecisionScoreComponent[];
  semanticRuntimeRunnerKnownIcePathComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    server: RunnerRunServer | undefined,
  ) => AiDecisionScoreComponent[];
  semanticRuntimeRunnerRemoteComponents: (
    input: AiDecisionInput,
    action: LegalAction,
    server: RunnerRunServer | undefined,
  ) => AiDecisionScoreComponent[];
  semanticRuntimeRepeatedRunTargetComponents: (
    input: AiDecisionInput,
    serverId: string | undefined,
  ) => AiDecisionScoreComponent[];
};

export function createRunnerRunComponentsContext(
  dependencies: RunnerRunComponentsContextDependencies,
): RunnerRunComponentsContext {
  return {
    semanticRuntimeRunnerAccessTrashComponents: (input, action) =>
      runnerAccessTrashScoreComponents(input, action, {
        trashAccessContext: dependencies.trashAccessContext,
      }),
    semanticRuntimeRunnerArchivesComponents: (input, action, server) =>
      runnerArchivesScoreComponents(input, action, server, {
        evaluationForAction: dependencies.evaluationForAction,
        definitionType: dependencies.definitionType,
      }),
    semanticRuntimeRunnerKnownIcePathComponents: (input, action, server) =>
      runnerKnownIcePathScoreComponents(input, action, server, {
        assessment: dependencies.knownIcePathAssessment,
        reason: runnerKnownIcePathReason,
      }),
    semanticRuntimeRunnerRemoteComponents: (input, action, server) => {
      void action;
      return runnerRemoteScoreComponents(input, server, {
        definitionType: dependencies.definitionType,
        rootTrashCost: dependencies.rootTrashCost,
        candidateMemory: dependencies.candidateMemory,
      });
    },
    semanticRuntimeRepeatedRunTargetComponents: (input, serverId) =>
      runnerRepeatedRunTargetScoreComponents(input, serverId, {
        recentStartRunsOnServer: dependencies.recentStartRunsOnServer,
        isRemoteServerTarget: dependencies.isRemoteServerTarget,
      }),
  };
}
