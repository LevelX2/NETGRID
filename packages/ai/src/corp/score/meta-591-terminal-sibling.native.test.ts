import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../../plans/resident-plan-portfolio-memory";
import { corpWinningScoreSiblingDominates } from "./score-terminal-route-dominance";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
function state() {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        "../../runtime/test-fixtures/meta591-g40-d274-terminal-sibling.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const input = {
    ...cp.input,
    ...buildAiDecisionInputDto(cp.input),
  } as AiDecisionInputWithDeckCapabilities;
  return { cp, input };
}
afterEach(resetResidentPlanPortfolioMemory);
it("admits a funded protected winning HQ agenda before preserving a nonwinning prepared sibling", () => {
  const { cp, input } = state();
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const before = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(decision.actionId).toBe(
    "corp.install_card.corp_onr_classic_004_theorem-proof_2.remote_1.corp_onr_classic_004_theorem-proof_2",
  );
  expect(
    decision.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId,
  ).toBe("corp.score_agenda");
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
  expect(JSON.stringify(input)).toBe(before);
  const projects = residentPlanPortfolioSnapshot(input)!
    .instances.filter((x) => x.moduleId === "corp.score_agenda")
    .map((x) => (x.moduleState as any).signal);
  expect(
    projects.find(
      (x) =>
        x.agendaInstanceId === "corp_onr_classic_004_theorem-proof_2" &&
        x.serverId === "remote_1",
    ),
  ).toMatchObject({ terminalScore: true, feasible: true });
  expect(
    projects.find(
      (x) =>
        x.agendaInstanceId === "corp_onr_classic_004_theorem-proof_2" &&
        x.serverId === "remote_2",
    )?.feasible,
  ).toBe(false);
});
it("retains the current prepared agenda when that agenda already wins", () => {
  const { cp, input } = state();
  input.playerView.own.agendaPoints = 5;
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  const decision = chooseAiAction(input);
  expect(decision.actionId).toBe(
    "corp.install_card.corp_onr_classic_002_superserum_1.remote_1.corp_onr_classic_002_superserum_1",
  );
  expect(decision.fallbackUsed || decision.timeoutUsed).toBe(false);
});

it.each([
  "blocked_route",
  "stale_protection",
  "unfunded_protection",
  "defense_point_cost",
  "unknown_protection",
  "stale_horizon",
  "different_target",
  "empty_deck",
  "winning_preparation",
] as const)("keeps winning-sibling dominance fail-closed for %s", (kind) => {
  const { cp, input } = state();
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    cp.runtime,
  );
  chooseAiAction(input);
  const signals = residentPlanPortfolioSnapshot(input)!
    .instances.filter((x) => x.moduleId === "corp.score_agenda")
    .map((x) => (x.moduleState as any).signal);
  const winning = structuredClone(
    signals.find(
      (x) =>
        x.agendaInstanceId === "corp_onr_classic_004_theorem-proof_2" &&
        x.serverId === "remote_1",
    ),
  );
  const previous = structuredClone(
    signals.find(
      (x) =>
        x.agendaInstanceId === "corp_onr_classic_002_superserum_1" &&
        x.serverId === "remote_1",
    ),
  );
  previous.feasible = true;
  const candidates = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    visibleSourceDefinitionsByInstanceId: Object.fromEntries(
      input.playerView.own.gripOrHq.map((x) => [x.instanceId, x.definitionId!]),
    ),
  });
  expect(
    corpWinningScoreSiblingDominates(input, candidates, winning, previous),
  ).toBe(true);
  if (kind === "blocked_route") winning.feasible = false;
  if (kind === "stale_protection")
    winning.protectionNeed.observedAtStateVersion--;
  if (kind === "unfunded_protection")
    winning.protectionNeed.baseline.fundedProtection = false;
  if (kind === "defense_point_cost")
    winning.protectionNeed.baseline.agendaPointsAfterDefense = 3;
  if (kind === "unknown_protection")
    winning.protectionNeed.baseline.knowledge = "unknown";
  if (kind === "stale_horizon")
    input.legalActions.find(
      (x) => x.actionId === winning.actionIds[0],
    )!.payload!.agendaInstallScoreHorizonQuoteExpiresAtStateVersion = 0;
  if (kind === "different_target") previous.serverId = "remote_2";
  if (kind === "empty_deck") input.playerView.own.stackOrRdCount = 0;
  if (kind === "winning_preparation") previous.terminalScore = true;
  expect(
    corpWinningScoreSiblingDominates(input, candidates, winning, previous),
  ).toBe(false);
});
