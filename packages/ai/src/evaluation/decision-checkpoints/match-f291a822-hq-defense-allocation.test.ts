import { createGameAfterSetup, getLegalActions } from "@netgrid/engine";
import type { AiDecisionInput } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import d43CaptureJson from "../../../../../data/scenarios/ai-decision-checkpoints/cp-match-f291a822-d43-hq-defense.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import type { AiDecisionInputWithDeckCapabilities } from "../../runtime/ai-decision-input";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

type ReconstructedDecisionCapture = {
  schemaVersion: "netgrid-ai-decision-checkpoint-replay-v1";
  provenance: "reconstructed_from_persisted_decision_sources";
  actor: "corp";
  stateVersion: number;
  stateHash: string;
  input: AiDecisionInputWithDeckCapabilities;
  runtime: AiRuntimeCheckpointV1;
  validation: {
    snapshotHashMatches: true;
    sideSafeInput: true;
    inputMatchesActor: true;
    inputMatchesStateVersion: true;
    legalActionSetMatchesHistoricalAudit: true;
    actorStateMatchesHistoricalSnapshot: true;
    publicEventPrefixComplete: true;
    deckConsumersMatchPersistedProjection: true;
    humanPrivateHandExcluded: true;
  };
};

const INSTALL_MISLEADING_ACCESS_MENUS_ON_HQ =
  "corp.install_card.corp_onr_proteus_032_misleading-access-menus_1.hq.corp_onr_proteus_032_misleading-access-menus_1.0";

describe("match f291a822 HQ defense allocation", () => {
  it("protects the exposed HQ with a current quoted encounter before an unsupported score-remote staging route", () => {
    const capture = currentEncounterQuoteCompanion();
    const deckSnapshotId = capture.input.ownDeckSnapshot?.deckSnapshotId;
    expect(deckSnapshotId).toBeDefined();
    expect(capture.validation.humanPrivateHandExcluded).toBe(true);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(capture.input, deckSnapshotId!, capture.runtime);

    const decision = chooseAiAction(capture.input as AiDecisionInput);

    expect(decision.actionId).toBe(INSTALL_MISLEADING_ACCESS_MENUS_ON_HQ);
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["plan_step_capability:allocate_server_defense"]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan,
    ).toMatchObject({
      moduleId: "corp.defend_servers",
      instanceId: "plan:corp.defend_servers:server-defense-portfolio",
    });
    expect(decision.decisionDebug?.planFirstDecision?.selectionAuthority).toBe(
      "turn_plan_commitment",
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning?.selectedLine?.phases.at(
        0,
      ),
    ).toMatchObject({
      rootPlanInstanceId: "plan:corp.defend_servers:server-defense-portfolio",
      rootModuleId: "corp.defend_servers",
      nodes: [{ semanticActionType: "install.card" }],
    });
  });

  it("rejects the historical install offer without inventing its missing current encounter quote", () => {
    const capture = structuredClone(
      d43CaptureJson,
    ) as ReconstructedDecisionCapture;
    const offer = capture.input.legalActions.find(
      (action) => action.actionId === INSTALL_MISLEADING_ACCESS_MENUS_ON_HQ,
    )!;
    expect(offer.payload?.postInstallEffectiveRunQuoteJson).toBeUndefined();
    expect(capture.validation.humanPrivateHandExcluded).toBe(true);
    resetResidentPlanPortfolioMemory();
    restoreAiRuntimeCheckpoint(
      capture.input,
      capture.input.ownDeckSnapshot!.deckSnapshotId,
      capture.runtime,
    );
    const decision = chooseAiAction(capture.input);
    expect(decision.actionId).toBe("corp.draw_card");
    expect(decision.fallbackUsed).toBe(false);
    expect(decision.decisionDebug?.planFirstDecision?.rootPlanInstanceId).toBe(
      "plan:corp.score_agenda:agenda%3Acorp_onr_proteus_008_project-zurich_1%3Aremote_1",
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: INSTALL_MISLEADING_ACCESS_MENUS_ON_HQ,
        excluded: true,
        whyNot: expect.arrayContaining([
          "assessment_unknown:corp.defend_servers:corp_ice_install_position_effect_quote_unknown",
        ]),
      }),
    );
  });
});

/** Explicit component companion, not a historical state reconstruction.
 * Quote this unconditional ICE on a fresh empty HQ through the current Engine.
 * The original capture remains unchanged and separately fails closed above. */
function currentEncounterQuoteCompanion(): ReconstructedDecisionCapture {
  const capture = structuredClone(
    d43CaptureJson,
  ) as ReconstructedDecisionCapture;
  const offer = capture.input.legalActions.find(
    (action) => action.actionId === INSTALL_MISLEADING_ACCESS_MENUS_ON_HQ,
  )!;
  const source = capture.input.playerView.own.gripOrHq.find(
    (card) => card.instanceId === offer.source,
  )!;
  expect(
    capture.input.playerView.servers.find((server) => server.id === "hq")!.ice,
  ).toHaveLength(0);
  const state = createGameAfterSetup({
    seed: "f291-current-encounter-quote-component",
  });
  state.stateVersion = capture.stateVersion;
  state.activeSide = "corp";
  state.phase = "corp_action_phase";
  state.timingPoint = "corp_action.main";
  state.corp.hq = [source.instanceId];
  state.cardInstances[source.instanceId] = {
    instanceId: source.instanceId,
    definitionId: source.definitionId!,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "hq" },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
  const current = getLegalActions(state, "corp").find(
    (action) =>
      action.source === source.instanceId && action.payload?.serverId === "hq",
  )!;
  expect(current.actionId).toBe(offer.actionId);
  const encounterQuote = current.payload?.postInstallEffectiveRunQuoteJson;
  if (typeof encounterQuote !== "string")
    throw new Error("Current Engine encounter quote missing");
  offer.payload!.postInstallEffectiveRunQuoteJson = encounterQuote;
  return capture;
}
