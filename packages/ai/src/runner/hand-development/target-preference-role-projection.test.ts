import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { VisibleCard } from "@netgrid/shared";
import { AI_HINTS_BY_CARD, RUNTIME_CARDS } from "../../ai-hints";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../../actions/action-card-semantic-profiles";
import { buildAiDecisionInputDto } from "../../input-dto";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { restoreAiRuntimeCheckpoint } from "../../evaluation/decision-checkpoints/runtime-checkpoint";
import { runnerInput } from "../../runner-hand-development.test-support";
import { evaluateRunnerHandDevelopment } from "./hand-development-evaluation";

function canonicalCard(definitionId: string): VisibleCard {
  const definition = RUNTIME_CARDS[definitionId];
  if (!definition) throw new Error(`missing_card:${definitionId}`);
  return {
    instanceId: `role-projection:${definitionId}`,
    known: true,
    definitionId,
    title: definition.title,
    type: definition.type as NonNullable<VisibleCard["type"]>,
    subtypes: definition.subtypes,
    rulesText: definition.text,
  };
}

describe("target preferences cannot manufacture hand-development capabilities", () => {
  it("keeps the native SP-601 HQ-trash investment out of own-income coverage", () => {
    const checkpoint = JSON.parse(
      readFileSync(
        new URL(
          "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-531-r1-g5-d27-crumble-role.json",
          import.meta.url,
        ),
        "utf8",
      ),
    );
    expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
    const input = {
      ...checkpoint.input,
      ...buildAiDecisionInputDto(checkpoint.input),
    };
    const visible = [
      ...input.playerView.own.gripOrHq,
      ...input.playerView.own.rig,
      ...input.playerView.servers.flatMap(
        (server: { ice: VisibleCard[]; root: VisibleCard[] }) => [
          ...server.ice,
          ...server.root,
        ],
      ),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: Object.fromEntries(
        visible
          .filter(
            (card: VisibleCard) => card.known !== false && card.definitionId,
          )
          .map((card: VisibleCard) => [card.instanceId, card.definitionId!]),
      ),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    });
    const card = input.playerView.own.gripOrHq.find(
      (card: VisibleCard) => card.definitionId === "onr_proteus_084_crumble",
    );
    const evaluation = evaluateRunnerHandDevelopment({
      input,
      actionCandidates: candidates,
    }).find((entry) => entry.cardInstanceId === card.instanceId)!;

    expect(
      AI_HINTS_BY_CARD.get(card.definitionId)?.targetProfiles?.flatMap(
        (profile) =>
          "preferences" in profile ? (profile.preferences ?? []) : [],
      ),
    ).toContain("denies_corp_economy_or_combo_piece");
    expect(evaluation.developmentRole).toBe("access_payoff");
    expect(evaluation.liquidityTiming).toBe("none");
    expect(
      evaluation.persistentInstallEvaluation?.newFunctionalCoverage,
    ).not.toContain("economy_engine");
    expect(evaluation.evidence).toContain("source:own_runner_hand");
    expect(
      input.legalActions.some(
        (action: { actionId: string }) =>
          action.actionId === evaluation.legalActionId,
      ),
    ).toBe(true);

    restoreAiRuntimeCheckpoint(
      input,
      input.ownDeckSnapshot.deckSnapshotId,
      checkpoint.runtime,
    );
    const decision = chooseAiAction(input);
    const plan = decision.decisionDebug?.planFirstDecision;
    const root = "plan:runner.pressure_central:central%3Ahq";
    const executor =
      "plan:runner.rig_and_coverage:coverage%3Abreaker_code_gate%3Arun%3Arunner.start_run.hq";
    expect(decision.actionId).toBe("runner.draw_card");
    expect(decision.fallbackUsed).toBe(false);
    expect(plan?.rootPlanInstanceId).toBe(root);
    expect(plan?.leafExecutorInstanceId).toBe(executor);
    expect(plan?.selectedStep?.parentInstanceId).toBe(root);
    expect(plan?.route).toMatchObject({
      planInstanceId: executor,
      actionId: "runner.draw_card",
      stateVersion: checkpoint.stateVersion,
    });
    expect(plan?.executionOrigin).toMatchObject({
      rootPlanInstanceId: root,
      leafPlanInstanceId: executor,
      side: "runner",
      stateVersion: checkpoint.stateVersion,
    });
  });

  it.each([
    ["onr_v1_100_misc-for-sale", "economy_engine"],
    ["onr_v1_103_organ-donor", "economy_engine"],
    ["onr_v1_166_karl-de-veres-corporate-stooge", "economy_engine"],
    ["onr_v1_154_broker", "bank_tool"],
    ["onr_v1_091_hunt-club-bbs", "access_payoff"],
    ["onr_v1_155_code-viral-cache", "access_payoff"],
  ])("preserves the real capability of %s", (definitionId, developmentRole) => {
    const card = canonicalCard(definitionId);
    const input = runnerInput({ credits: 15, hand: [card], legalActions: [] });
    const evaluation = evaluateRunnerHandDevelopment({ input })[0]!;
    expect(evaluation.developmentRole).toBe(developmentRole);
  });

  it("keeps an unaffordable HQ-trash program unavailable", () => {
    const card = canonicalCard("onr_proteus_084_crumble");
    const input = runnerInput({
      credits: 2,
      hand: [card],
      legalActions: [],
      memoryUsed: 0,
      memoryLimit: 4,
    });
    const evaluation = evaluateRunnerHandDevelopment({ input })[0]!;
    expect(evaluation.developmentRole).toBe("access_payoff");
    expect(evaluation.availability).toBe("missing_credits");
    expect(evaluation.legalActionId).toBeUndefined();
  });
});
