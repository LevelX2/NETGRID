import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { scoreProjectForCandidate } from "../../corp/score/score-project-signals";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { corpScorelineFeasibilityForDecisionInput } from "../../runtime/corp-scoreline-feasibility";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);
function checkpoint(previous = false) {
  const cp = JSON.parse(
    readFileSync(
      new URL(
        `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta579-g39-terminal-flood${previous ? "-previous" : ""}.json`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as {
    input: AiDecisionInputWithDeckCapabilities;
    runtime: AiRuntimeCheckpointV1;
    validation: Record<string, boolean>;
  };
  expect(Object.values(cp.validation)).toEqual(Array(9).fill(true));
  return cp;
}
function projects(input: AiDecisionInputWithDeckCapabilities) {
  return buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: input.side,
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: visibleSourceDefinitionsByInstanceId(
      input.playerView,
    ),
    cardSemanticProfilesByDefinitionId:
      buildActionCardSemanticProfilesByDefinitionId(),
  })
    .filter(
      (c) =>
        c.actionType === "install_card" &&
        c.sourceDefinitionId === "onr_v1_196_corporate-war",
    )
    .flatMap((c) =>
      scoreProjectForCandidate(
        input,
        c,
        corpScorelineFeasibilityForDecisionInput(input),
        undefined,
        false,
        false,
      ),
    );
}

it("does not let ordinary deckout-flood urgency certify a terminal unprotected steal", () => {
  const { input } = checkpoint();
  expect(input.playerView.own.gripOrHq.length).toBe(4);
  expect(input.playerView.opponent.agendaPoints).toBe(6);
  const naked = projects(input).filter((p) => p.serverId === "new_remote");
  expect(naked.length).toBeGreaterThan(0);
  expect(naked.every((p) => p.feasible === false)).toBe(true);
  expect(
    naked.every(
      (p) => p.routeAssessment !== "corp_deckout_agenda_flood_score_install",
    ),
  ).toBe(true);
});

it("retains the existing risky development route when this agenda cannot end the game", () => {
  const { input } = checkpoint();
  input.playerView.opponent.agendaPoints = 3;
  expect(
    projects(input).some(
      (p) =>
        p.serverId === "new_remote" &&
        p.feasible &&
        p.routeAssessment === "corp_deckout_agenda_flood_score_install",
    ),
  ).toBe(true);
});

it("keeps the native scheduler and current LegalAction binding while avoiding the naked matchpoint", () => {
  const { input } = checkpoint();
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint(true).runtime,
  );
  const unchanged = JSON.stringify(input),
    decision = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(unchanged);
  expect(decision).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  const action = input.legalActions.find(
    (a) => a.actionId === decision.actionId,
  )!;
  expect(action).toBeDefined();
  expect(action.expiresAtStateVersion).toBe(input.playerView.stateVersion);
  expect(
    action.type === "install_card" && action.payload?.serverId === "new_remote",
  ).toBe(false);
  expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toMatch(
    /^plan:corp\./,
  );
});
