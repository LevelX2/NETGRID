import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import deckoutAgendaRecycleJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-selfplay-185-01-deckout-agenda-recycle-score-start-d337.json";
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
    const capture = structuredClone(
      deckoutAgendaRecycleJson,
    ) as ReconstructedDecisionCapture;
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision).toMatchObject({
      actionId:
        "corp.install_card.corp_onr_v1_194_corporate-downsizing_2.remote_2.corp_onr_v1_194_corporate-downsizing_2",
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
      decisionDebug: {
        planFirstDecision: {
          rootPlanInstanceId:
            "plan:corp.score_agenda:agenda%3Acorp_onr_v1_194_corporate-downsizing_2%3Aremote_2",
          leafExecutorInstanceId:
            "plan:corp.score_agenda:agenda%3Acorp_onr_v1_194_corporate-downsizing_2%3Aremote_2",
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
          "corp_last_draw_hq_agenda_recycle_install:remote_2",
        ),
      ]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.dispositions.find((entry) =>
        entry.actionId.includes("corporate-war_1.remote_2"),
      ),
    ).toMatchObject({
      disposition: "explicitly_nonproductive",
      ownerModuleId: "corp.score_agenda",
      evidenceCode: "corp_score_protection_required:remote_2",
    });
  });
});
