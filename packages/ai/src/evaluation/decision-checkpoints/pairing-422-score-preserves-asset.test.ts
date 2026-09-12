import { expect, it } from "vitest";
import checkpointJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-score-preserves-asset-d50.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  corpAssetPreservingSameTurnScoreRoutes,
  equivalentSameTurnScoreResources,
} from "../../corp/score/score-asset-preservation";
import { sameTurnScoreConversionProjectForCandidate } from "../../corp/score/score-project-signals";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { corpSameTurnScoreConversionPaths } from "../../plans/tactical-plan-corp-score-conversion";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it("preserves the installed economy asset when the same agenda closes this turn in a new remote", () => {
  const capture = structuredClone(checkpointJson) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = capture.input;
  const paths = corpSameTurnScoreConversionPaths(input);
  const newRemote = paths.find((path) => path.targetServerId === "new_remote")!;
  const occupiedRemote = paths.find(
    (path) => path.targetServerId === "remote_1",
  )!;
  expect(newRemote).toMatchObject({
    agendaCardId: occupiedRemote.agendaCardId,
    agendaPoints: occupiedRemote.agendaPoints,
    clicksRequired: occupiedRemote.clicksRequired,
    creditsRequired: occupiedRemote.creditsRequired,
    sameTurnGuaranteed: true,
  });
  expect(newRemote.steps.map((step) => step.kind)).toEqual([
    "install_score_target",
    "place_advancement",
    "score_ready",
  ]);
  resetResidentPlanPortfolioMemory();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    capture.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(newRemote.steps[0]!.actionId);
  expect(decision.fallbackUsed).toBe(false);
  const portfolio = residentPlanPortfolioSnapshot(input)!;
  const root = portfolio.instances.find(
    (instance) => instance.instanceId === portfolio.rootForegroundInstanceId,
  )!;
  expect(root.moduleId).toBe("corp.score_agenda");
  expect(decision.decisionDebug?.planFirstDecision?.selectedStep?.stepId).toBe(
    `${root.instanceId}:install_agenda`,
  );
  expect(root.moduleState).toMatchObject({
    kind: "score",
    signal: {
      agendaInstanceId: newRemote.agendaCardId,
      serverId: "new_remote",
      sameTurnCloseout: true,
      sameTurnConversionProof: "engine_quoted_path",
    },
  });
});

it.each([
  "current productive pool",
  "no payout action",
  "unrezzed asset",
  "multi-turn route",
  "terminal score",
  "more expensive new remote",
])(
  "only dominates the replacement with full current evidence: %s",
  (scenario) => {
    const input = structuredClone(
      checkpointJson.input,
    ) as unknown as AiDecisionInputWithDeckCapabilities;
    const source = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    )!.root[0]!;
    if (scenario === "no payout action")
      input.legalActions = input.legalActions.filter(
        (action) => action.source !== source.instanceId,
      );
    if (scenario === "unrezzed asset") source.rezzed = false;
    if (scenario === "more expensive new remote") {
      const install = input.legalActions.find(
        (action) =>
          action.type === "install_card" &&
          action.source?.includes("corporate-downsizing") &&
          action.payload?.serverId === "new_remote",
      )!;
      install.costs = [{ clicks: 1, credits: 1 }];
    }
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const projects = candidates.flatMap((candidate) => {
      const project = sameTurnScoreConversionProjectForCandidate(
        input,
        candidate,
        [],
        candidates,
      );
      return project ? [project] : [];
    });
    if (scenario === "multi-turn route")
      projects.forEach((project) => {
        project.sameTurnCloseout = false;
        delete project.sameTurnConversionProof;
      });
    if (scenario === "terminal score")
      projects.forEach((project) => {
        project.terminalScore = true;
      });
    const result = corpAssetPreservingSameTurnScoreRoutes(
      input,
      candidates,
      projects,
    );
    expect(result.dominatedProjectIds.size).toBe(
      scenario === "current productive pool" ? 1 : 0,
    );
    expect(result.preservingProjectIds.size).toBe(
      scenario === "current productive pool" ? 1 : 0,
    );
  },
);

it.each([
  "conversion source",
  "reserved counters",
  "credit cost",
  "advancement obligation",
])("does not equate routes with different %s", (difference) => {
  const input = structuredClone(
    checkpointJson.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  const paths = corpSameTurnScoreConversionPaths(input);
  const left = paths.find((path) => path.targetServerId === "remote_1")!;
  const right = paths.find((path) => path.targetServerId === "new_remote")!;
  expect(equivalentSameTurnScoreResources(left, right)).toBe(true);
  if (difference === "conversion source")
    right.steps[1]!.sourceCardId = "another-visible-source";
  if (difference === "reserved counters")
    right.reservedAdvancementCounters = { "another-visible-source": 1 };
  if (difference === "credit cost") right.creditsRequired += 1;
  if (difference === "advancement obligation")
    right.steps[1]!.offTargetAdvancementAmount = 1;
  expect(equivalentSameTurnScoreResources(left, right)).toBe(false);
});
