import { afterEach, expect, it } from "vitest";
import game12 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-733-g12-defense-buffer.json";
import game13 from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-733-g13-defense-buffer.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

afterEach(resetResidentPlanPortfolioMemory);

it.each([game12, game13])(
  "keeps the survival draw bound and classifies its deferred support install in game $provenance.game",
  (fixture) => {
    expect(Object.values(fixture.validation)).toEqual(Array(9).fill(true));
    const input = structuredClone(fixture.input) as unknown as AiDecisionInputWithDeckCapabilities;
    const deckSnapshotId = input.ownDeckSnapshot?.deckSnapshotId;
    if (!deckSnapshotId) throw Error("Missing immutable deck snapshot");
    restoreAiRuntimeCheckpoint(input, deckSnapshotId, fixture.runtime as unknown as AiRuntimeCheckpointV1);

    const install = input.legalActions.find(
      (action) => action.type === "install_card" && action.actionId.includes("phone-freak"),
    );
    expect(install).toBeDefined();
    const decision = chooseAiAction(input);
    expect(decision).toMatchObject({
      actionId: "runner.draw_card",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId: "plan:runner.defense_and_recovery:runner",
          leafExecutorInstanceId: "plan:runner.defense_and_recovery:runner",
          route: {
            actionId: "runner.draw_card",
            capabilityId: "build_required_hand_buffer",
            stateVersion: input.playerView.stateVersion,
          },
          dispositions: expect.arrayContaining([
            expect.objectContaining({
              actionId: install!.actionId,
              ownerModuleId: "runner.defense_and_recovery",
              disposition: "explicitly_nonproductive",
              evidenceCode: "runner_defense_support_install_deferred_until_survival_buffer",
            }),
          ]),
        },
      },
    });
  },
);
