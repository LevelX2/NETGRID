import { describe, expect, it } from "vitest";
import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import {
  bestCorpSameTurnScoreConversionPath,
  corpSameTurnScoreConversionPaths,
} from "./tactical-plan-corp-score-conversion";

describe("Corp same-turn score conversion", () => {
  it("plans install, Vapor transfer and free score with two clicks", () => {
    const agenda = card("agenda", "agenda", {
      advancementRequirement: 3,
    });
    const vapor = card("vapor", "asset", {
      advancementCounters: 3,
      rezzed: true,
    });
    const input = corpInput({
      clicks: 2,
      credits: 0,
      hq: [agenda],
      root: [vapor],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        action(
          "transfer",
          "activated_card_ability",
          vapor.instanceId,
          {
            scoreConversionCapability: "move_advancement",
            scoreConversionAdvancementMaximum: "all",
            scoreConversionSourceMode: "source_card",
            scoreConversionTargetMode: "chosen_installed_advanceable_card",
            scoreConversionTiming: "immediate",
          },
        ),
      ],
    });

    const path = bestCorpSameTurnScoreConversionPath(input);

    expect(path).toMatchObject({
      agendaCardId: agenda.instanceId,
      clicksRequired: 2,
      clicksGenerated: 0,
      creditsRequired: 0,
      sameTurnGuaranteed: true,
      reservedAdvancementCounters: { [vapor.instanceId]: 3 },
    });
    expect(path?.steps.map((step) => step.kind)).toEqual([
      "install_score_target",
      "move_advancement",
      "score_ready",
    ]);
  });

  it("combines multiple placement bursts for a high-requirement agenda", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 10 });
    const input = corpInput({
      clicks: 4,
      credits: 10,
      hq: [agenda],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        placement("burst-4", 4),
        placement("burst-3a", 3),
        placement("burst-3b", 3),
      ],
    });

    const path = bestCorpSameTurnScoreConversionPath(input);

    expect(path?.steps.map((step) => step.kind)).toEqual([
      "install_score_target",
      "place_advancement",
      "place_advancement",
      "place_advancement",
      "score_ready",
    ]);
    expect(
      path?.steps.reduce((sum, step) => sum + step.advancementAmount, 0),
    ).toBe(10);
  });

  it("uses immediate action gain when the closeout otherwise lacks a click", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 4 });
    const input = corpInput({
      clicks: 2,
      credits: 4,
      hq: [agenda],
      actions: [
        action("overtime", "play_operation", "overtime", {
          scoreConversionCapability: "gain_action_capacity",
          scoreConversionActionGainAmount: 2,
          scoreConversionTiming: "immediate",
        }),
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        placement("burst-a", 2),
        placement("burst-b", 2),
      ],
    });

    const path = bestCorpSameTurnScoreConversionPath(input);

    expect(path?.clicksGenerated).toBe(2);
    expect(path?.steps.map((step) => step.kind)).toEqual([
      "gain_action_capacity",
      "install_score_target",
      "place_advancement",
      "place_advancement",
      "score_ready",
    ]);
  });

  it("does not spend an action-gain card when the closeout already fits", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 2 });
    const input = corpInput({
      clicks: 2,
      credits: 2,
      hq: [agenda],
      actions: [
        action("overtime", "play_operation", "overtime", {
          scoreConversionCapability: "gain_action_capacity",
          scoreConversionActionGainAmount: 2,
          scoreConversionTiming: "immediate",
        }),
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        placement("burst", 2),
      ],
    });

    expect(
      bestCorpSameTurnScoreConversionPath(input)?.steps.map(
        (step) => step.kind,
      ),
    ).toEqual([
      "install_score_target",
      "place_advancement",
      "score_ready",
    ]);
  });

  it("fills a mixed burst path with projected basic advances", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 5 });
    const input = corpInput({
      clicks: 4,
      credits: 5,
      hq: [agenda],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        placement("burst", 3),
      ],
    });

    expect(
      bestCorpSameTurnScoreConversionPath(input)?.steps.map(
        (step) => step.kind,
      ),
    ).toEqual([
      "install_score_target",
      "place_advancement",
      "basic_advance",
      "basic_advance",
      "score_ready",
    ]);
  });

  it("does not commit an unprotected install without a complete path", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 4 });
    const input = corpInput({
      clicks: 2,
      credits: 0,
      hq: [agenda],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        placement("burst", 2),
      ],
    });

    expect(corpSameTurnScoreConversionPaths(input)).toEqual([]);
  });

  it("counts distinct-target placement as one counter on the agenda", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 2 });
    const team = placement("team", 2);
    team.payload!.scoreConversionAdvancementMode =
      "up_to_distinct_targets_one_each";
    const input = corpInput({
      clicks: 2,
      credits: 0,
      hq: [agenda],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        team,
      ],
    });

    expect(corpSameTurnScoreConversionPaths(input)).toEqual([]);
  });
});

function corpInput(params: {
  clicks: number;
  credits: number;
  hq: VisibleCard[];
  root?: VisibleCard[];
  actions: LegalAction[];
}): AiDecisionInput {
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
        credits: params.credits,
        clicks: params.clicks,
        agendaPoints: 0,
        gripOrHq: params.hq,
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
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [],
          root: params.root ?? [],
        },
      ],
      publicEvents: [],
      legalActions: params.actions,
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail: [],
    legalActions: params.actions,
    difficulty: "normal",
    seed: "score-conversion-test",
    decisionId: "score-conversion-test",
    actionNumber: 1,
    profileId: "score-conversion-test",
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

function placement(actionId: string, amount: number): LegalAction {
  return action(actionId, "play_operation", actionId, {
    scoreConversionCapability: "place_advancement",
    scoreConversionAdvancementAmount: amount,
    scoreConversionAdvancementMode: "any_combination",
    scoreConversionTargetMode: "installed_advanceable_cards",
    scoreConversionTiming: "immediate",
  });
}

function action(
  actionId: string,
  type: LegalAction["type"],
  cardId: string,
  payload: Record<string, string | number | boolean>,
): LegalAction {
  return {
    actionId,
    side: "corp",
    type,
    source: cardId,
    label: actionId,
    costs: type === "score_agenda" ? [] : [{ clicks: 1, credits: 0 }],
    payload: { cardId, ...payload },
    stateVersion: 1,
    timingPoint: "corp_action.main",
  } as unknown as LegalAction;
}
