import { expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { corpBasicCreditsDominatedByCurrentScore } from "../../corp/score/score-conditional-credit-funding";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import g7 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-conversion-credit-order-g7.json";
import g29 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-pairing-422-conversion-credit-order-g29.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

it.each([
  { name: "installed agenda", json: g7, action: "play_operation" },
  { name: "agenda in HQ", json: g29, action: "install_card" },
])(
  "keeps the surplus credit click after the complete conversion of $name",
  ({ json, action }) => {
    const capture = structuredClone(json) as unknown as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
    };
    const { input, runtime } = capture;
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      runtime,
    );
    const decision = chooseAiAction(input);
    expect(
      input.legalActions.find((a) => a.actionId === decision.actionId)?.type,
    ).toBe(action);
    expect(decision.fallbackUsed).toBe(false);
    const portfolio = residentPlanPortfolioSnapshot(input)!;
    expect(portfolio.rootForegroundInstanceId).toMatch(
      /^plan:corp.score_agenda:/,
    );
    expect(portfolio.executorInstanceId).toBe(
      portfolio.rootForegroundInstanceId,
    );
  },
);

it.each([
  "exact",
  "stale",
  "underfunded",
  "extra_click",
  "reachable_bonus",
  "missing_cost",
  "terminal",
  "other_agenda",
  "latent_income",
])("bounds conversion credit ordering: %s", (variant) => {
  const capture = structuredClone(g7) as unknown as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
  };
  const input = capture.input;
  const instance = capture.runtime.residentPlanPortfolio!.instances.find(
    (i) =>
      i.moduleId === "corp.score_agenda" &&
      (i.moduleState as { signal?: { phase?: string } }).signal?.phase ===
        "convert_agenda",
  )!;
  const project = (instance.moduleState as { signal: CorpScoreProjectSignal })
    .signal;
  project.sameTurnConversionResourceCost = {
    stateVersion: input.playerView.stateVersion,
    credits: 12,
    clicks: 1,
  };
  if (variant === "stale")
    project.sameTurnConversionResourceCost.stateVersion--;
  if (variant === "underfunded")
    project.sameTurnConversionResourceCost.credits = 13;
  if (variant === "extra_click") input.playerView.own.clicks = 3;
  if (variant === "reachable_bonus") input.playerView.own.credits = 23;
  if (variant === "missing_cost") delete project.sameTurnConversionResourceCost;
  if (variant === "terminal") project.terminalScore = true;
  if (variant === "other_agenda" || variant === "latent_income") {
    const card = structuredClone(input.playerView.own.gripOrHq[0]!);
    card.instanceId = "ordering-boundary-card";
    card.type = variant === "other_agenda" ? "agenda" : "asset";
    card.definitionId =
      variant === "other_agenda"
        ? "onr_v1_203_hostile-takeover"
        : "onr_v1_309_bbs-whispering-campaign";
    input.playerView.servers.find((s) => s.id === "hq")!.root.push(card);
  }
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
  });
  expect([
    ...corpBasicCreditsDominatedByCurrentScore(input, candidates, [project]),
  ]).toEqual(variant === "exact" ? ["corp.gain_credit"] : []);
});
