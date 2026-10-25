import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import { restoreAiRuntimeCheckpoint, type AiRuntimeCheckpointV1 } from "./runtime-checkpoint";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import * as development from "../../runner/hand-development/hand-development-evaluation";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";

it.each([
  [1, 76, "onr_classic_032_schematics-search-engine", "runner.develop_board_and_hand", "useful_now"],
  [4, 53, "onr_classic_037_finders-keepers", "runner.develop_board_and_hand", "none"],
  [7, 48, "onr_classic_029_ms-todon", "runner.rig_and_coverage", "useful_now"],
] as const)(
  "uses real information needs and preserves the selected native owner in G%i/D%i",
  (game, index, selectedDefinition, owner, informationNeed) => {
    const fixture = JSON.parse(readFileSync(new URL(
      `../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-544-r1-g${game}-d${index}-information-role.json`,
      import.meta.url,
    ), "utf8")) as {
      input: AiDecisionInputWithDeckCapabilities;
      runtime: AiRuntimeCheckpointV1;
      validation: Record<string, boolean>;
    };
    expect(Object.keys(fixture.validation)).toHaveLength(9);
    expect(Object.values(fixture.validation).every(Boolean)).toBe(true);
    expect(fixture.input.ownDeckCapabilities).toBeDefined();
    expect(fixture.input.ownRunnerStrategicIntent).toBeDefined();
    const observed = development.evaluateRunnerHandDevelopment({
      input: fixture.input,
      actionCandidates: buildActionSemanticCandidates({
        legalActions: fixture.input.legalActions,
        visibleSourceDefinitionsByInstanceId: Object.fromEntries(
          fixture.input.playerView.own.gripOrHq.map((card) => [card.instanceId, card.definitionId!]),
        ),
      }),
      deckCapabilities: fixture.input.ownDeckCapabilities!,
      strategicIntent: fixture.input.ownRunnerStrategicIntent!,
    });
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(fixture.input, fixture.input.ownDeckSnapshot!.deckSnapshotId, fixture.runtime);
    const view = structuredClone(fixture.input.playerView);
    const decision = chooseAiAction(fixture.input);
    expect(fixture.input.playerView).toEqual(view);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.timeoutUsed).toBe(false);
    const action = fixture.input.legalActions.find((a) => a.actionId === decision.actionId)!;
    expect(action).toBeDefined();
    expect(action.expiresAtStateVersion).toBe(view.stateVersion);
    expect(action.payload?.cardId).toContain(selectedDefinition);
    const plan = decision.decisionDebug?.planFirstDecision;
    expect(plan?.selectedPlan?.moduleId).toBe(owner);
    expect(plan?.route?.actionId).toBe(action.actionId);
    expect(plan?.route?.stateVersion).toBe(view.stateVersion);
    expect(plan?.route?.planInstanceId).toBe(plan?.leafExecutorInstanceId);
    expect(plan?.selectedStep?.planInstanceId).toBe(plan?.leafExecutorInstanceId);
    expect(observed.some((e) =>
      e.definitionId === "onr_classic_032_schematics-search-engine" &&
      e.developmentRole === "access_payoff" && e.currentNeed === informationNeed,
    )).toBe(true);
    if (game === 1) {
      expect(plan?.route?.purpose).toContain("access_payoff:useful_now");
      expect(observed.some((e) => e.definitionId === "onr_classic_033_superglue" &&
        e.developmentRole === "access_payoff" && e.currentNeed === "none")).toBe(true);
    }
    if (game === 7) {
      expect(view.servers.flatMap((s) => s.ice).some((c) => c.known === false)).toBe(false);
      expect(view.servers.flatMap((s) => s.root).some((c) => c.known === false)).toBe(true);
      expect(plan?.portfolio.some((entry) => entry.evidenceCodes.some((code) =>
        code.includes("card_specific_purpose:access_payoff:useful_now"),
      ))).toBe(true);
    }
  },
);
