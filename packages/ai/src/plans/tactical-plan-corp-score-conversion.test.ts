import { describe, expect, it } from "vitest";
import {
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type LegalAction,
  type VisibleCard,
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
        action("transfer", "activated_card_ability", vapor.instanceId, {
          scoreConversionCapability: "move_advancement",
          scoreConversionAdvancementMaximum: "all",
          scoreConversionSourceMode: "source_card",
          scoreConversionTargetMode: "chosen_installed_advanceable_card",
          scoreConversionTiming: "immediate",
        }),
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

  it("rejects a same-root install that destroys its reserved counter source", () => {
    const agenda = card("agenda", "agenda", {
      advancementRequirement: 3,
    });
    const vapor = counterBank("vapor", 2);
    const input = corpInput({
      clicks: 3,
      credits: 3,
      hq: [agenda],
      root: [vapor],
      actions: [
        action("install-new-remote", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        action("replace-vapor", "install_card", agenda.instanceId, {
          serverId: "remote_1",
          placement: "root",
          rootReplacement: "asset_to_agenda",
        }),
        action("transfer", "activated_card_ability", vapor.instanceId, {
          scoreConversionCapability: "move_advancement",
          scoreConversionAdvancementMaximum: "all",
          scoreConversionSourceMode: "source_card",
          scoreConversionTargetMode: "chosen_installed_advanceable_card",
          scoreConversionTiming: "immediate",
        }),
        action("advance", "advance_card", agenda.instanceId, {
          serverId: "new_remote",
        }),
      ],
    });

    expect(
      corpSameTurnScoreConversionPaths(input).map((path) => ({
        targetServerId: path.targetServerId,
        installActionId: path.steps.find(
          (step) => step.kind === "install_score_target",
        )?.actionId,
        reservedAdvancementCounters: path.reservedAdvancementCounters,
      })),
    ).toEqual([
      {
        targetServerId: "new_remote",
        installActionId: "install-new-remote",
        reservedAdvancementCounters: { vapor: 2 },
      },
    ]);
  });

  it("protects a positive counter bank from a non-terminal basic-advance route", () => {
    const agenda = card("agenda", "agenda", {
      advancementRequirement: 1,
    });
    const input = corpInput({
      clicks: 2,
      credits: 1,
      hq: [agenda],
      root: [counterBank("bank", 2)],
      actions: [
        action("replace-bank", "install_card", agenda.instanceId, {
          serverId: "remote_1",
          placement: "root",
          rootReplacement: "asset_to_agenda",
        }),
        action("advance", "advance_card", agenda.instanceId, {
          serverId: "remote_1",
        }),
      ],
    });

    expect(corpSameTurnScoreConversionPaths(input)).toEqual([]);
  });

  it("allows replacement of a quoted counter bank with no counters", () => {
    const agenda = card("agenda", "agenda", {
      advancementRequirement: 1,
    });
    const input = corpInput({
      clicks: 2,
      credits: 1,
      hq: [agenda],
      root: [counterBank("empty-bank", 0)],
      actions: [
        action("replace-empty-bank", "install_card", agenda.instanceId, {
          serverId: "remote_1",
          placement: "root",
          rootReplacement: "asset_to_agenda",
        }),
        action("advance", "advance_card", agenda.instanceId, {
          serverId: "remote_1",
        }),
      ],
    });

    expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
      targetServerId: "remote_1",
      steps: [
        expect.objectContaining({
          kind: "install_score_target",
          actionId: "replace-empty-bank",
        }),
        expect.objectContaining({ kind: "basic_advance" }),
        expect.objectContaining({ kind: "score_ready" }),
      ],
    });
  });

  it("allows replacement of an ordinary advanced asset", () => {
    const agenda = card("agenda", "agenda", {
      advancementRequirement: 1,
    });
    const input = corpInput({
      clicks: 2,
      credits: 1,
      hq: [agenda],
      root: [card("ordinary-asset", "asset", { advancementCounters: 2 })],
      actions: [
        action("replace-ordinary-asset", "install_card", agenda.instanceId, {
          serverId: "remote_1",
          placement: "root",
          rootReplacement: "asset_to_agenda",
        }),
        action("advance", "advance_card", agenda.instanceId, {
          serverId: "remote_1",
        }),
      ],
    });

    expect(bestCorpSameTurnScoreConversionPath(input)?.steps[0]).toMatchObject({
      kind: "install_score_target",
      actionId: "replace-ordinary-asset",
    });
  });

  it("allows the narrow terminal match-winning replacement", () => {
    const agenda = card("match-winning-agenda", "agenda", {
      advancementRequirement: 1,
    });
    const input = corpInput({
      clicks: 2,
      credits: 1,
      agendaPoints: 5,
      hq: [agenda],
      root: [counterBank("terminal-bank", 2)],
      actions: [
        action("terminal-replacement", "install_card", agenda.instanceId, {
          serverId: "remote_1",
          placement: "root",
          rootReplacement: "asset_to_agenda",
        }),
        action("terminal-advance", "advance_card", agenda.instanceId, {
          serverId: "remote_1",
        }),
      ],
    });

    expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
      targetServerId: "remote_1",
      steps: [
        expect.objectContaining({
          kind: "install_score_target",
          actionId: "terminal-replacement",
        }),
        expect.objectContaining({ kind: "basic_advance" }),
        expect.objectContaining({ kind: "score_ready" }),
      ],
    });
  });

  it("prefers a visible transfer into an installed agenda over paid basic advances", () => {
    const agenda = card("installed-agenda", "agenda", {
      advancementRequirement: 3,
      advancementCounters: 0,
    });
    const source = card("counter-source", "asset", {
      advancementCounters: 3,
      rezzed: true,
    });
    const input = corpInput({
      clicks: 3,
      credits: 3,
      hq: [],
      root: [agenda, source],
      actions: [
        action("advance-agenda", "advance_card", agenda.instanceId, {
          serverId: "remote_1",
        }),
        action("transfer", "activated_card_ability", source.instanceId, {
          scoreConversionCapability: "move_advancement",
          scoreConversionAdvancementMaximum: "all",
          scoreConversionSourceMode: "source_card",
          scoreConversionTargetMode: "chosen_installed_advanceable_card",
          scoreConversionTiming: "immediate",
        }),
      ],
    });

    const path = bestCorpSameTurnScoreConversionPath(input);

    expect(path).toMatchObject({
      agendaCardId: agenda.instanceId,
      clicksRequired: 1,
      creditsRequired: 0,
      reservedAdvancementCounters: { [source.instanceId]: 3 },
    });
    expect(path?.steps.map((step) => step.kind)).toEqual([
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
          gainActionsAmount: 2,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "unrestricted",
          actionCapacityReliability: "guaranteed",
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

  it("uses Overtime before installing and advancing a three-point agenda three times", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 3 });
    const input = corpInput({
      clicks: 3,
      credits: 3,
      hq: [agenda],
      actions: [
        action("overtime", "play_operation", "overtime", {
          gainActionsAmount: 2,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "unrestricted",
          actionCapacityReliability: "guaranteed",
        }),
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        action("advance", "advance_card", agenda.instanceId, {
          serverId: "new_remote",
        }),
      ],
    });

    expect(
      bestCorpSameTurnScoreConversionPath(input)?.steps.map(
        (step) => step.kind,
      ),
    ).toEqual([
      "gain_action_capacity",
      "install_score_target",
      "basic_advance",
      "basic_advance",
      "basic_advance",
      "score_ready",
    ]);
  });

  it("uses a legal Corporate Boon counter action through the shared projection", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 1 });
    const boonAction = action(
      "corporate-boon",
      "activated_card_ability",
      "boon-agenda",
      {
        gainActionsAmount: 1,
        actionCapacityTiming: "immediate",
        actionCapacityRestriction: "unrestricted",
        actionCapacityReliability: "guaranteed",
        cardImplementationSourceCounterType: "boon",
        cardImplementationSourceCounterCost: 1,
      },
    );
    boonAction.costs = [];
    const input = corpInput({
      clicks: 1,
      credits: 1,
      hq: [agenda],
      actions: [
        boonAction,
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        action("advance", "advance_card", agenda.instanceId, {
          serverId: "new_remote",
        }),
      ],
    });

    expect(
      bestCorpSameTurnScoreConversionPath(input)?.steps.map(
        (step) => step.kind,
      ),
    ).toEqual([
      "gain_action_capacity",
      "install_score_target",
      "basic_advance",
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
          gainActionsAmount: 2,
          actionCapacityTiming: "immediate",
          actionCapacityRestriction: "unrestricted",
          actionCapacityReliability: "guaranteed",
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
    ).toEqual(["install_score_target", "place_advancement", "score_ready"]);
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

  it("binds Falsified Transactions to the chosen funded source", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 3 });
    const funded = card("funded", "asset", { advancementCounters: 3 });
    const decoy = card("decoy", "asset", { advancementCounters: 1 });
    const input = corpInput({
      clicks: 2,
      credits: 0,
      hq: [agenda],
      root: [funded, decoy],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        action("falsified", "play_operation", "falsified", {
          scoreConversionCapability: "move_advancement",
          scoreConversionAdvancementMaximum: 3,
          scoreConversionSourceMode: "chosen_card",
          scoreConversionTargetMode: "chosen_installed_advanceable_card",
          scoreConversionTiming: "immediate",
        }),
      ],
    });

    const path = bestCorpSameTurnScoreConversionPath(input);

    expect(path?.reservedAdvancementCounters).toEqual({ funded: 3 });
    expect(
      path?.steps.find((step) => step.kind === "move_advancement"),
    ).toMatchObject({ actionId: "falsified", sourceCardId: "funded" });
  });

  it("does not double-spend Pacifica counters for actions and transfer", () => {
    const agenda = card("agenda", "agenda", { advancementRequirement: 3 });
    const pacifica = card("pacifica", "asset", { advancementCounters: 3 });
    const input = corpInput({
      clicks: 1,
      credits: 0,
      hq: [agenda],
      root: [pacifica],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        action(
          "pacifica-action",
          "activated_card_ability",
          pacifica.instanceId,
          {
            gainActionsAmount: 1,
            actionCapacityTiming: "immediate",
            actionCapacityRestriction: "unrestricted",
            actionCapacityReliability: "guaranteed",
            cardImplementationAdvancementCounterCost: 1,
          },
        ),
        action("move", "activated_card_ability", pacifica.instanceId, {
          scoreConversionCapability: "move_advancement",
          scoreConversionAdvancementMaximum: "all",
          scoreConversionSourceMode: "source_card",
          scoreConversionTargetMode: "chosen_installed_advanceable_card",
          scoreConversionTiming: "immediate",
        }),
      ],
    });

    expect(corpSameTurnScoreConversionPaths(input)).toEqual([]);
  });

  it("supports exact two-, three-, and four-counter placement families", () => {
    for (const amount of [2, 3, 4]) {
      const agenda = card(`agenda-${amount}`, "agenda", {
        advancementRequirement: amount,
      });
      const input = corpInput({
        clicks: 2,
        credits: 0,
        hq: [agenda],
        actions: [
          action(`install-${amount}`, "install_card", agenda.instanceId, {
            serverId: "new_remote",
            placement: "root",
          }),
          placement(`burst-${amount}`, amount),
        ],
      });

      expect(bestCorpSameTurnScoreConversionPath(input)?.steps).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            kind: "place_advancement",
            advancementAmount: amount,
          }),
        ]),
      );
    }
  });

  it("takes a visible overadvance threshold only when it costs no extra step", () => {
    const agenda = card("agenda", "agenda", {
      advancementRequirement: 3,
      overadvanceThreshold: 2,
      overadvanceReward: "agenda_points",
    });
    const vapor = card("vapor", "asset", { advancementCounters: 5 });
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
        action("transfer", "activated_card_ability", vapor.instanceId, {
          scoreConversionCapability: "move_advancement",
          scoreConversionAdvancementMaximum: "all",
          scoreConversionSourceMode: "source_card",
          scoreConversionTargetMode: "chosen_installed_advanceable_card",
          scoreConversionTiming: "immediate",
        }),
      ],
    });

    expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
      desiredAdvancementCounters: 5,
      overadvanceReason: "visible_agenda_points_threshold:2",
      reservedAdvancementCounters: { vapor: 5 },
    });
  });

  it("keeps exact-fit when an overadvance threshold needs another action", () => {
    const agenda = card("agenda", "agenda", {
      advancementRequirement: 3,
      overadvanceThreshold: 2,
      overadvanceReward: "agenda_points",
    });
    const input = corpInput({
      clicks: 3,
      credits: 2,
      hq: [agenda],
      actions: [
        action("install", "install_card", agenda.instanceId, {
          serverId: "new_remote",
          placement: "root",
        }),
        placement("burst", 3),
      ],
    });

    const path = bestCorpSameTurnScoreConversionPath(input);
    expect(path).toMatchObject({ desiredAdvancementCounters: 3 });
    expect(path).not.toHaveProperty("overadvanceReason");
  });

  it("uses an exact visible zero requirement instead of the printed agenda requirement", () => {
    const agenda = card("corporate-downsizing", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      advancementRequirement: 0,
      advancementCounters: 0,
    });
    const input = corpInput({
      clicks: 2,
      credits: 26,
      hq: [],
      root: [agenda],
      actions: [
        action(
          "score-corporate-downsizing",
          "score_agenda",
          agenda.instanceId,
          {
            cardId: agenda.instanceId,
          },
        ),
        {
          ...action(
            "advance-corporate-downsizing",
            "advance_card",
            agenda.instanceId,
            { cardId: agenda.instanceId },
          ),
          costs: [{ clicks: 1, credits: 1 }],
        },
      ],
    });

    expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
      agendaCardId: agenda.instanceId,
      advancementRequirement: 0,
      desiredAdvancementCounters: 0,
      clicksRequired: 0,
      creditsRequired: 0,
      steps: [
        expect.objectContaining({
          kind: "score_ready",
          actionId: "score-corporate-downsizing",
        }),
      ],
    });
  });

  it("uses the printed agenda requirement when the visible runtime value is absent", () => {
    const agenda = card("printed-requirement-fallback", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      advancementCounters: 3,
    });
    const input = corpInput({
      clicks: 2,
      credits: 26,
      hq: [],
      root: [agenda],
      actions: [
        action(
          "score-printed-requirement-fallback",
          "score_agenda",
          agenda.instanceId,
          {
            cardId: agenda.instanceId,
          },
        ),
      ],
    });

    expect(bestCorpSameTurnScoreConversionPath(input)).toMatchObject({
      agendaCardId: agenda.instanceId,
      advancementRequirement: 3,
      initialAdvancementCounters: 3,
      desiredAdvancementCounters: 3,
      clicksRequired: 0,
      creditsRequired: 0,
      steps: [
        expect.objectContaining({
          kind: "score_ready",
          actionId: "score-printed-requirement-fallback",
        }),
      ],
    });
  });

  it("does not replace an invalid visible requirement with the printed value", () => {
    const agenda = card("invalid-current-requirement", "agenda", {
      definitionId: "onr_v1_194_corporate-downsizing",
      advancementRequirement: Number.NaN,
      advancementCounters: 0,
    });
    const input = corpInput({
      clicks: 3,
      credits: 3,
      hq: [],
      root: [agenda],
      actions: [
        action(
          "advance-invalid-requirement",
          "advance_card",
          agenda.instanceId,
          {
            cardId: agenda.instanceId,
          },
        ),
      ],
    });

    expect(bestCorpSameTurnScoreConversionPath(input)).toBeUndefined();
  });
});

function corpInput(params: {
  clicks: number;
  credits: number;
  agendaPoints?: number;
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
        agendaPoints: params.agendaPoints ?? 0,
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
    ...(type === "agenda" ? { agendaPoints: 2 } : {}),
    owner: "corp",
    controller: "corp",
    ...overrides,
  };
}

function counterBank(instanceId: string, advancementCounters: number) {
  return card(instanceId, "asset", {
    definitionId: "synthetic-counter-bank",
    advancementCounters,
    rezzed: true,
    counterBankPreparationQuote: {
      schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
      context: "corp_counter_bank_preparation",
      sourceCardId: instanceId,
      expiresAtStateVersion: 1,
      location: { kind: "installed_root", serverId: "remote_1" },
      advancementCounters,
      advanceableBeforeRez: true,
      activatedAbilitiesRequireRez: true,
      cashout: {
        advancementCounterCost: 1,
        creditGain: 1,
        actionCost: 0,
      },
      transfer: {
        actionCost: 1,
        minimumSourceCounters: 1,
        source: "source_card",
        target: "chosen_installed_advanceable_card",
        maximum: "all",
      },
    },
  });
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
