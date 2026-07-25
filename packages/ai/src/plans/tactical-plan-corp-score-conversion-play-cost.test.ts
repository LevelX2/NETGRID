import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { bestCorpSameTurnScoreConversionPath } from "./tactical-plan-corp-score-conversion";

describe("Corp score-conversion play-cost projection", () => {
  it("uses an explicit operation play cost for a projected advancement burst", () => {
    const path = bestCorpSameTurnScoreConversionPath(
      inputWithProjectedConsultants({
        kind: "fixed",
        credits: 12,
      }),
    );

    expect(path).toMatchObject({
      clicksRequired: 2,
      creditsRequired: 12,
      sameTurnGuaranteed: true,
    });
    expect(path?.steps.map((step) => step.kind)).toEqual([
      "install_score_target",
      "place_advancement",
      "score_ready",
    ]);
  });

  it("fails closed when the projected operation has no play-cost model", () => {
    expect(
      bestCorpSameTurnScoreConversionPath(inputWithProjectedConsultants()),
    ).toBeUndefined();
  });
});

function inputWithProjectedConsultants(
  playCost?: VisibleCard["playCost"],
): AiDecisionInput {
  const agenda = card("agenda", "agenda", {
    advancementRequirement: 4,
    agendaPoints: 2,
  });
  const consultants = card("consultants", "operation", {
    definitionId: "onr_v1_300_project-consultants",
    ...(playCost ? { playCost } : {}),
  });
  const install: LegalAction = {
    actionId: "install-agenda",
    side: "corp",
    type: "install_card",
    source: agenda.instanceId,
    label: "Install agenda",
    costs: [{ clicks: 1, credits: 0 }],
    payload: {
      cardId: agenda.instanceId,
      serverId: "new_remote",
      placement: "root",
    },
    timingPoint: "corp_action.main",
  } as unknown as LegalAction;
  return {
    side: "corp",
    playerView: {
      side: "corp",
      stateVersion: 1,
      timingPoint: "corp_action.main",
      activeSide: "corp",
      phase: "corp_action_phase",
      own: {
        identity: card("corp-id", "identity"),
        credits: 12,
        clicks: 2,
        agendaPoints: 0,
        gripOrHq: [agenda, consultants],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: card("runner-id", "identity"),
        credits: 5,
        clicks: 4,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [
        { id: "hq", label: "HQ", ice: [], root: [] },
        { id: "rd", label: "R&D", ice: [], root: [] },
        { id: "archives", label: "Archives", ice: [], root: [] },
      ],
      publicEvents: [],
      legalActions: [install],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: [install],
    difficulty: "normal",
    seed: "score-conversion-play-cost",
    decisionId: "score-conversion-play-cost",
    actionNumber: 1,
    profileId: "score-conversion-play-cost",
  } as AiDecisionInput;
}

function card(
  instanceId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    title: instanceId,
    type,
    known: true,
    owner: "corp",
    controller: "corp",
    ...overrides,
  };
}
