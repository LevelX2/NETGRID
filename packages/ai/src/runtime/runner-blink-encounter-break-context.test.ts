import type { LegalAction, VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import {
  BLINK_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE,
  blinkRiskShouldAvoidRun,
  buildBlinkRiskAssessment,
} from "../actions/risk-action-projection";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createRunnerBlinkEncounterBreakContext } from "./runner-blink-encounter-break-context";

describe("runner Blink encounter break context", () => {
  it("preserves a public advanced-remote score threat for a hidden root card", () => {
    const assessment = assessmentForRootCard({
      instanceId: "hidden-advanced-root",
      known: false,
      advancementCounters: 2,
    });

    expect(assessment?.payoffOverride).toBe("remote_score_threat");
    expect(assessment?.evidence).toContain(
      "blinkBreakPayoffOverride:remote_score_threat",
    );
    expect(blinkRiskShouldAvoidRun(assessment)).toBe(false);
  });

  it("does not invent a score threat for a hidden root card without counters", () => {
    const assessment = assessmentForRootCard({
      instanceId: "hidden-unadvanced-root",
      known: false,
      advancementCounters: 0,
    });

    expect(assessment?.payoffOverride).toBe("none");
    expect(blinkRiskShouldAvoidRun(assessment)).toBe(true);
  });

  it("keeps the stronger known-agenda payoff classification", () => {
    const assessment = assessmentForRootCard(
      visibleCard("known-agenda", "corp", "agenda", {
        advancementCounters: 2,
      }),
    );

    expect(assessment?.payoffOverride).toBe("known_agenda");
  });
});

function assessmentForRootCard(rootCard: VisibleCard) {
  const action = blinkBreakAction();
  const encounteredIce = visibleCard("filter", "corp", "ice", {
    rezzed: true,
  });
  const input = aiInput("runner", [action]);
  input.playerView.own.gripOrHq = [
    visibleCard("grip-1", "runner", "event"),
    visibleCard("grip-2", "runner", "event"),
  ];
  input.playerView.servers = [server("remote_1", [encounteredIce], [rootCard])];
  input.playerView.run = {
    attackedServerId: "remote_1",
    phase: "encounter_ice",
    position: { kind: "ice", serverId: "remote_1", iceIndex: 0 },
    encounteredIce,
    successful: false,
  };

  return createRunnerBlinkEncounterBreakContext({
    sourceDefinitionIdForAction: () => "onr_v1_007_blink",
    randomBreakOrDamageRiskProfileForDefinitionId: () =>
      BLINK_RANDOM_BREAK_OR_DAMAGE_RISK_PROFILE,
    breakSubroutineIndexesForAction: () => new Set([1]),
    encounteredSubroutines: () => [
      { id: "filter-sub-0", type: "do_damage", damageType: "net" },
      { id: "filter-sub-1", type: "end_the_run" },
    ],
    buildBlinkRiskAssessment,
    isImmediateSafetyThreatSubroutine: () => false,
    isRemoteServerTarget: (serverId) =>
      serverId?.startsWith("remote_") ?? false,
    visibleRootIsKnownAgenda: (card) => card.known && card.type === "agenda",
  }).blinkRiskAssessmentForEncounterBreak(input, action);
}

function blinkBreakAction(): LegalAction {
  const action = legalAction(
    "blink-break-filter-etr",
    "runner",
    "break_subroutine",
    "Blink: Break Filter ETR",
    { credits: 0 },
    {
      source: "blink-installed",
      visibility: "private_to_actor",
      payload: {
        iceId: "filter",
        subroutineIndex: 1,
      },
    },
  );
  action.timingPoint = "run.encounter_ice";
  return action;
}
