import { visibleSourceDefinitionsByInstanceId } from "../../runtime/visible-source-definitions";
import { referencesDefaultDeckCard } from "./compact-card-reference.test-support";
import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import deckoutAgendaRecycleJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-185-01-deckout-agenda-recycle-score-start-d337.json";
import hqOverflowRecoveryLoopJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-185-02-hq-overflow-recovery-loop-d326.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  provenance: "reconstructed_from_persisted_decision_sources";
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
};

describe("selfplay cycle 185 decision checkpoints", () => {
  it("starts the exact HQ-agenda recycle score plan before the final mandatory draw", () => {
    const capture = structuredClone<unknown>(
      deckoutAgendaRecycleJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId:
        "cc.c2ie.r2.c2ie",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "p9cjat7so2g0t24r7ujibgxn83",
          leafExecutorInstanceId:
            "p9cjat7so2g0t24r7ujibgxn83",
          route: {
            actionType: "install_card",
            capabilityId: "install_score_agenda",
          },
        },
      },
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "corp_last_draw_hq_agenda_recycle_install:r2",
        ),
      ]),
    );
    const definitions = visibleSourceDefinitionsByInstanceId(capture.input.playerView);
    const war = capture.input.legalActions.find((action) =>
      action.type === "install_card" && definitions[action.source] === 408 && action.payload?.serverId === "r2",
    );
    expect(war).toBeDefined();
    expect(
      decision.decisionDebug?.planFirstDecision?.dispositions.find((entry) =>
        entry.actionId === war?.actionId,
      ),
    ).toMatchObject({
      disposition: "explicitly_nonproductive",
      ownerModuleId: "corp.score_agenda",
      evidenceCode: "corp_score_protection_required:r2",
    });
  });

  it("does not treat archive recovery as an exact HQ-overflow reduction", () => {
    const capture = structuredClone<unknown>(
      hqOverflowRecoveryLoopJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).not.toSatisfy((reference: string | undefined) => referencesDefaultDeckCard(reference, 508));
    expect(
      decision.decisionDebug?.planFirstDecision?.dispositions.find((entry) =>
        referencesDefaultDeckCard(entry.actionId, 508),
      ),
    ).toMatchObject({
      disposition: "explicitly_nonproductive",
      ownerModuleId: "corp.hand_and_agenda_management",
    });
  });
});
