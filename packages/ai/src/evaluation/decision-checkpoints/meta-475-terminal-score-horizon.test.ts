import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { corpShorterTerminalScoreRouteDominates } from "../../corp/score/score-terminal-route-dominance";
import { buildAiDecisionInputDto } from "../../input-dto";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import type { CorpScoreProjectSignal } from "../../plans/corp-score-contracts";
import {
  resetResidentPlanPortfolioMemory,
  restoreResidentPlanPortfolioMemorySnapshot,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

function scoreSignals(
  input: AiDecisionInputWithDeckCapabilities,
): CorpScoreProjectSignal[] {
  return residentPlanPortfolioSnapshot(input)!
    .instances.filter((instance) => instance.moduleId === "corp.score_agenda")
    .map((instance) => {
      const state = instance.moduleState as {
        kind: string;
        signal: CorpScoreProjectSignal;
      };
      expect(state.kind).toBe("score");
      return structuredClone(state.signal);
    });
}

function checkpoint(game: 11 | 12 | 28) {
  return JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-475-r9-g${game}-d${game === 11 ? 213 : game === 12 ? 238 : 278}-terminal-score-horizon.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
}

it.each([
  { game: 12 as const, warm: false },
  { game: 28 as const, warm: false },
  { game: 12 as const, warm: true },
  { game: 28 as const, warm: true },
])(
  "chooses the funded shorter native terminal agenda: $game warm=$warm",
  ({ game, warm }) => {
    const cp = checkpoint(game);
    expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    if (warm) {
      expect(cp.runtime.residentPlanPortfolio!.turnPlanCommitment!.status).toBe(
        "active",
      );
      restoreResidentPlanPortfolioMemorySnapshot(
        input,
        cp.runtime.residentPlanPortfolio,
      );
    }
    const result = chooseAiAction(input);
    const lab = game === 12 ? 2 : 3;
    expect(result.actionId).toBe(
      `corp.install_card.corp_onr_classic_003_unlisted-research-lab_${lab}.remote_1.corp_onr_classic_003_unlisted-research-lab_${lab}`,
    );
    expect(result.fallbackUsed).toBe(false);
    expect(result.timeoutUsed).toBe(false);
    const pf = result.decisionDebug!.planFirstDecision!;
    expect(pf.selectedPlan!.moduleId).toBe("corp.score_agenda");
    expect(pf.leafExecutorInstanceId).toBe(pf.rootPlanInstanceId);
    expect(pf.route).toMatchObject({
      actionId: result.actionId,
      stateVersion: game === 12 ? 237 : 277,
      planInstanceId: pf.leafExecutorInstanceId,
      stepId: pf.selectedStep!.stepId,
    });
  },
);

it.each([
  { game: 12 as const, credits: 2, dominated: false },
  { game: 12 as const, credits: 3, dominated: true },
  { game: 28 as const, credits: 4, dominated: false },
  { game: 28 as const, credits: 5, dominated: true },
])(
  "requires the complete current score and defense reserve: $game credits=$credits",
  ({ game, credits, dominated }) => {
    const cp = checkpoint(game);
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    input.playerView.own.credits = credits;
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    const result = chooseAiAction(input);
    const theorem = scoreSignals(input).find(
      (signal) =>
        signal.serverId === "remote_1" &&
        signal.agendaInstanceId === "corp_onr_classic_004_theorem-proof_1",
    )!;
    expect(
      theorem.routeAssessment === "corp_shorter_terminal_score_route_dominates",
    ).toBe(dominated);
    if (dominated) expect(result.actionId).toContain("unlisted-research-lab");
    expect(result.fallbackUsed).toBe(false);
  },
);

it.each([
  "current admitted routes",
  "missing current head",
  "stale install quote",
  "wrong install target",
  "different remote",
  "installed agenda",
  "blocked shorter route",
  "nonterminal shorter route",
  "more expensive shorter route",
  "insufficient defense reserve",
  "defense spends winning agenda point",
  "higher access risk",
])(
  "bounds terminal route comparison using native current facts: %s",
  (scenario) => {
    const cp = checkpoint(28);
    const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot!.deckSnapshotId,
      cp.runtime,
    );
    chooseAiAction(input);
    const signals = scoreSignals(input);
    const shorter = signals.find(
      (signal) =>
        signal.serverId === "remote_1" &&
        signal.agendaInstanceId ===
          "corp_onr_classic_003_unlisted-research-lab_3",
    )!;
    const longer = signals.find(
      (signal) =>
        signal.serverId === "remote_1" &&
        signal.agendaInstanceId === "corp_onr_classic_004_theorem-proof_1",
    )!;
    // Re-enter the comparison before it marks the dominated route blocked.
    longer.feasible = true;
    const head = input.legalActions.find(
      (action) => action.actionId === shorter.actionIds![0],
    )!;
    const baseline = shorter.protectionNeed!.baseline;
    if (baseline.knowledge !== "known")
      throw new Error("expected native known protection");
    if (scenario === "missing current head")
      input.legalActions = input.legalActions.filter(
        (action) => action !== head,
      );
    if (scenario === "stale install quote")
      head.payload!.agendaInstallScoreHorizonQuoteExpiresAtStateVersion =
        input.playerView.stateVersion - 1;
    if (scenario === "wrong install target")
      head.payload!.agendaInstallScoreHorizonQuoteTargetServerId = "remote_2";
    if (scenario === "different remote") longer.serverId = "remote_2";
    if (scenario === "installed agenda") longer.phase = "advance_agenda";
    if (scenario === "blocked shorter route") shorter.feasible = false;
    if (scenario === "nonterminal shorter route") shorter.terminalScore = false;
    if (scenario === "more expensive shorter route")
      head.costs = [{ clicks: 1, credits: 1 }];
    if (scenario === "insufficient defense reserve")
      shorter.protectionNeed = {
        ...shorter.protectionNeed!,
        baseline: { ...baseline, minimumAdditionalCreditsToSatisfy: 1 },
      };
    if (scenario === "defense spends winning agenda point")
      shorter.protectionNeed = {
        ...shorter.protectionNeed!,
        baseline: { ...baseline, agendaPointsAfterDefense: 4 },
      };
    if (scenario === "higher access risk") {
      shorter.protectionNeed = {
        ...shorter.protectionNeed!,
        baseline: {
          ...baseline,
          protection: {
            ...baseline.protection,
            runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
          },
        },
      };
      const previous = longer.protectionNeed!.baseline;
      if (previous.knowledge !== "known")
        throw new Error("expected known competitor protection");
      longer.protectionNeed = {
        ...longer.protectionNeed!,
        baseline: {
          ...previous,
          protection: {
            ...previous.protection,
            runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
          },
        },
      };
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
    expect(
      corpShorterTerminalScoreRouteDominates(
        input,
        candidates,
        shorter,
        longer,
      ),
    ).toBe(scenario === "current admitted routes");
  },
);

it.each([
  "already admitted rezzed topology",
  "unrezzed layer",
  "missing score credits",
  "terminal steal",
  "blocked route",
])("does not turn unknown protection into a new admission: %s", (scenario) => {
  const cp = checkpoint(11);
  const input = { ...cp.input, ...buildAiDecisionInputDto(cp.input) };
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const result = chooseAiAction(input);
  const signals = scoreSignals(input);
  const shorter = signals.find(
    (s) =>
      s.serverId === "remote_1" &&
      s.agendaInstanceId === "corp_onr_classic_003_unlisted-research-lab_1",
  )!;
  const longer = signals.find(
    (s) =>
      s.serverId === "remote_1" &&
      s.agendaInstanceId === "corp_onr_classic_004_theorem-proof_2",
  )!;
  expect(shorter.protectionNeed!.baseline.knowledge).toBe("unknown");
  expect(longer.routeAssessment).toBe(
    "corp_shorter_terminal_score_route_dominates",
  );
  expect(result.actionId).toContain("superserum");
  longer.feasible = true;
  if (scenario === "unrezzed layer")
    input.playerView.servers.find((s) => s.id === "remote_1")!.ice[0]!.rezzed =
      false;
  if (scenario === "missing score credits") input.playerView.own.credits = 2;
  if (scenario === "terminal steal")
    shorter.conversion!.runnerStealIsMatchpoint = true;
  if (scenario === "blocked route") shorter.feasible = false;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  });
  expect(
    corpShorterTerminalScoreRouteDominates(input, candidates, shorter, longer),
  ).toBe(scenario === "already admitted rezzed topology");
});
