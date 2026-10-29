import { readFileSync } from "node:fs";
import { afterEach, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { assessCorpExactIceRezAgainstScoreReserves } from "../../corp/defense/corp-defense-score-reserve";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "../../plans/turn-planning-contracts";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import { projectExactCorpIceRezRoute } from "../../runtime/corp-exact-ice-rez-route";
import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

function fixture() {
  return JSON.parse(
    readFileSync(
      new URL(
        "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta568-costless-rez-terminal-reserve.json",
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
function quote(input: AiDecisionInputWithDeckCapabilities) {
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
  const candidate = candidates.find((c) => c.actionType === "rez_ice")!;
  const sourceCard = input.playerView.servers
    .find((s) => s.id === "rd")!
    .ice.find((c) => c.instanceId === candidate.sourceCardInstanceId)!;
  return projectExactCorpIceRezRoute({
    input,
    candidate,
    sourceCard,
    targetServerId: "rd",
  });
}
afterEach(resetResidentPlanPortfolioMemory);

it("keeps the terminal Dog Pile reserve after the exact costless income even when that source was absent from the old package (SP594)", () => {
  const { input, validation } = fixture();
  expect(Object.values(validation)).toEqual(Array(9).fill(true));
  const before = JSON.stringify(input),
    route = quote(input)!;
  expect(route).toMatchObject({
    totalRezCredits: 0,
    immediateCorpCreditGain: 2,
  });
  expect(
    assessCorpExactIceRezAgainstScoreReserves({
      input,
      route,
      scoreProjects: [],
    }),
  ).toMatchObject({
    preservesReserve: true,
    availableCreditsAfterRez: 7,
    requiredCreditsAfterRez: 5,
    opportunity: { reason: "current_terminal_access", preservesReserve: true },
  });
  expect(JSON.stringify(input)).toBe(before);
});

it("executes that same native rez at the existing Defense owner", () => {
  const { input, runtime } = fixture();
  input.planningStateIdentity = buildPlanningStateIdentity(input);
  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    runtime,
  );
  const before = JSON.stringify(input),
    result = chooseAiAction(input);
  expect(JSON.stringify(input)).toBe(before);
  expect(result).toMatchObject({ fallbackUsed: false, timeoutUsed: false });
  expect(
    input.legalActions.find((a) => a.actionId === result.actionId),
  ).toMatchObject({
    type: "rez_ice",
    source: "corp_onr_proteus_014_chihuahua_1",
    costs: [{ credits: 0 }],
  });
  expect(result.decisionDebug?.planFirstDecision).toMatchObject({
    selectedPlan: { moduleId: "corp.defend_servers" },
    rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
    route: {
      actionId: result.actionId,
      stateVersion: input.playerView.stateVersion,
    },
  });
});

it.each(["missing", "wrong_bank", "stale"] as const)(
  "does not derive the new reserve certificate from a %s income quote",
  (kind) => {
    const { input } = fixture();
    const card = input.playerView.servers
      .find((s) => s.id === "rd")!
      .ice.find((c) => c.definitionId === "onr_proteus_014_chihuahua")!;
    const post = card.effectivePostRezRunQuote;
    if (post?.complete !== true)
      throw new Error("Missing native complete quote");
    if (kind === "missing") delete post.creditGainOnRez;
    if (kind === "wrong_bank") post.creditGainOnRez!.creditsBefore = 99;
    if (kind === "stale") post.expiresAtStateVersion--;
    const route = quote(input);
    expect(route?.immediateCorpCreditGain).toBeUndefined();
    if (route)
      expect(
        assessCorpExactIceRezAgainstScoreReserves({
          input,
          route,
          scoreProjects: [],
        }).preservesReserve,
      ).toBe(false);
  },
);
