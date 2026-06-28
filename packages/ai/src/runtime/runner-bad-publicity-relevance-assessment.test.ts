import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction, VisibleCard } from "@netgrid/shared";

import { runnerBadPublicityRelevanceAssessment } from "./runner-bad-publicity-relevance-assessment";

describe("runnerBadPublicityRelevanceAssessment", () => {
  it("uses structured bad-publicity support roles and effect targets", () => {
    expect(assessment({ roles: ["bad_publicity_support"] })).toEqual(
      expect.objectContaining({
        badPublicityGainFromAction: 1,
        badPublicitySupportCount: 1,
      }),
    );
    expect(
      assessment({
        effectTargets: ["runner.bad_publicity"],
      }),
    ).toEqual(
      expect.objectContaining({
        badPublicityGainFromAction: 1,
        badPublicitySupportCount: 1,
      }),
    );
  });

  it("uses bounded rules-text tokens for bad-publicity support", () => {
    expect(assessment({ rulesText: "Prevent bad publicity." })).toEqual(
      expect.objectContaining({
        badPublicityGainFromAction: 1,
        badPublicitySupportCount: 1,
      }),
    );
    expect(assessment({ rulesText: "Prevent bad_publicity." })).toEqual(
      expect.objectContaining({
        badPublicityGainFromAction: 1,
        badPublicitySupportCount: 1,
      }),
    );
  });

  it("ignores substring-only bad-publicity support noise", () => {
    expect(assessment({ roles: ["bad_publicityish_noise"] })).toBeUndefined();
    expect(
      assessment({ effectTargets: ["runner.bad_publicityish_noise"] }),
    ).toBeUndefined();
    expect(
      assessment({ rulesText: "Badly publicized bad_publicityish support." }),
    ).toBeUndefined();
  });
});

function assessment(params: {
  roles?: readonly string[];
  effectTargets?: readonly string[];
  rulesText?: string;
}) {
  const definitionId = "custom-bad-publicity-support";
  const card = visibleCard(definitionId);
  const action = runnerAction(definitionId);
  return runnerBadPublicityRelevanceAssessment(input(card), action, {
    sourceDefinitionIdForAction: () => definitionId,
    selfDamageSurvivalAssessment: () => undefined,
    actionCreditCost: () => 0,
    cardSupport: {
      rolesForCardId: () => [...(params.roles ?? [])],
      hintEffectsForCard: () =>
        (params.effectTargets ?? []).map((target) => ({ target })),
      rulesTextForCard: () => params.rulesText ?? "",
      effectTarget: (effect) =>
        typeof (effect as { target?: unknown }).target === "string"
          ? (effect as { target: string }).target
          : undefined,
    },
    fakedHitCardId: "faked-hit",
  });
}

function input(card: VisibleCard): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      own: {
        gripOrHq: [card],
        rig: [],
        scoreArea: [],
      },
      opponent: {
        identity: visibleCard("corp-identity"),
      },
    },
    legalActions: [],
  } as unknown as AiDecisionInput;
}

function visibleCard(definitionId: string): VisibleCard {
  return {
    instanceId: `${definitionId}-instance`,
    definitionId,
    title: definitionId,
    known: true,
  } as VisibleCard;
}

function runnerAction(sourceDefinitionId: string): LegalAction {
  return {
    actionId: "runner-action",
    side: "runner",
    type: "play_event",
    source: `${sourceDefinitionId}-instance`,
    label: "Play event",
    costs: [],
    payload: {},
  } as unknown as LegalAction;
}
