import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { beforeEach, describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildActionCardSemanticProfilesByDefinitionId } from "../actions/action-card-semantic-profiles";
import { chooseCorpAction } from "../index";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  attachOwnDeckSnapshot,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { visibleSourceDefinitionsByInstanceId } from "./visible-source-definitions";

const HOSTILE_TAKEOVER = "onr_v1_203_hostile-takeover";
const CORPORATE_DOWNSIZING = "onr_v1_194_corporate-downsizing";
const ANNUAL_REVIEWS = "onr_v1_282_annual-reviews";
const OVERTIME_INCENTIVES = "onr_v1_297_overtime-incentives";
const DATA_WALL = "onr_v1_237_data-wall";
const PRECISION_BRIBERY = "onr_proteus_146_precision-bribery";
const CORPORATE_GUARD_R_TEMPS = "onr_proteus_046_corporate-guard-r-temps";
const VIRAL_BREEDING_GROUND = "onr_proteus_009_viral-breeding-ground";

describe("plan-first Corp card variant contracts", () => {
  beforeEach(() => {
    resetResidentPlanPortfolioMemory();
    resetResidentPlanPortfolioMemory();
  });

  it("routes Hostile Takeover through the exact P3 Overtime first step of its prepared-remote parent", () => {
    const fixture = scoreConversionFixture({
      agendaDefinitionId: HOSTILE_TAKEOVER,
      agendaTitle: "Hostile Takeover",
      agendaPoints: 1,
      includeOvertime: true,
    });

    const decision = chooseCorpAction(fixture.input);
    const portfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(fixture.input),
    );

    expect(decision.actionId).toBe(fixture.overtime?.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P3",
        "plan_assessment_evidence:corp_same_turn_score_conversion:gain_action_capacity",
      ]),
    );
    expect(portfolio).toContain(
      "plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
    );
    expect(portfolio).toContain('"actionIds":["play-overtime"]');
    expect(portfolio).not.toContain(fixture.installPrepared.actionId);
    expect(portfolio).not.toContain(
      "plan:corp.score_agenda:agenda%3Aagenda-1%3Anew_remote",
    );
  });

  it("keeps the funded Hostile Takeover prepared-remote install executable as P4 without Overtime", () => {
    const fixture = scoreConversionFixture({
      agendaDefinitionId: HOSTILE_TAKEOVER,
      agendaTitle: "Hostile Takeover",
      agendaPoints: 1,
      includeOvertime: false,
    });

    const decision = chooseCorpAction(fixture.input);

    expect(decision.actionId).toBe(fixture.installPrepared.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P4",
        "plan_assessment_evidence:corp_engine_certified_mature_remote_score_install:remote_1",
      ]),
    );
  });

  it("routes Corporate Downsizing through the exact P3 Overtime first step of its prepared-remote parent", () => {
    const fixture = scoreConversionFixture({
      agendaDefinitionId: CORPORATE_DOWNSIZING,
      agendaTitle: "Corporate Downsizing",
      agendaPoints: 2,
      includeOvertime: true,
    });

    const decision = chooseCorpAction(fixture.input);
    const portfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(fixture.input),
    );

    expect(decision.actionId).toBe(fixture.overtime?.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P3",
        "plan_assessment_evidence:corp_same_turn_score_conversion:gain_action_capacity",
      ]),
    );
    expect(portfolio).toContain(
      "plan:corp.score_agenda:agenda%3Aagenda-1%3Aremote_1",
    );
    expect(portfolio).toContain('"actionIds":["play-overtime"]');
    expect(portfolio).not.toContain(fixture.installPrepared.actionId);
    expect(portfolio).not.toContain(
      "plan:corp.score_agenda:agenda%3Aagenda-1%3Anew_remote",
    );
  });

  it("keeps the funded Corporate Downsizing prepared-remote install executable as P4 without Overtime", () => {
    const fixture = scoreConversionFixture({
      agendaDefinitionId: CORPORATE_DOWNSIZING,
      agendaTitle: "Corporate Downsizing",
      agendaPoints: 2,
      includeOvertime: false,
    });

    const decision = chooseCorpAction(fixture.input);

    expect(decision.actionId).toBe(fixture.installPrepared.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P4",
        "plan_assessment_evidence:corp_engine_certified_mature_remote_score_install:remote_1",
      ]),
    );
  });

  it("dispositions an overflowing Annual Reviews exactly once and lets the regular score-protection Basic Draw decide", () => {
    const fixture = annualReviewsFixture({
      startingHandSize: 4,
      includeBlockedScoreParent: true,
    });

    const decision = chooseCorpAction(fixture.input);
    const debug = JSON.stringify(decision.decisionDebug);
    const portfolio = JSON.stringify(
      residentPlanPortfolioSnapshot(fixture.input),
    );

    expect(decision.actionId).toBe(fixture.basicDraw.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.defend_servers");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P4",
        expect.stringMatching(
          /^plan_assessment_evidence:score_plan_requires_effective_ice_draw:/,
        ),
      ]),
    );
    expect(decision.consideredActionIds).toContain(
      fixture.annualReviews.actionId,
    );
    expect(portfolio).toContain(`"actionId":"${fixture.basicDraw.actionId}"`);
    expect(portfolio).not.toContain(fixture.annualReviews.actionId);
    expect(debug).not.toContain("develop%3Aannual-reviews");
    expect(debug).not.toContain("corp_card_development");
  });

  it("uses safe Annual Reviews as the denser draw step of the exact score-material parent", () => {
    const fixture = annualReviewsFixture({
      startingHandSize: 3,
      includeBlockedScoreParent: false,
    });

    const decision = chooseCorpAction(fixture.input);

    expect(decision.actionId).toBe(fixture.annualReviews.actionId);
    expect(decision.decisionDebug?.planKind).toBe(
      "corp.hand_and_agenda_management",
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P4",
        "plan_assessment_evidence:corp_score_campaign_missing_agenda_material",
      ]),
    );
  });

  it("routes a visible HQ agenda through its exact P4 remote-lock removal step", () => {
    const agenda = corpCard("agenda-lock", VIRAL_BREEDING_GROUND, "agenda", {
      title: "Viral Breeding Ground",
      advancementRequirement: 4,
      agendaPoints: 2,
    });
    const unlock = precisionBriberyUnlock();
    const input = aiInput("corp", [unlock, endTurn()]);
    input.decisionId = "corp-card-variant:precision-bribery:score-parent";
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [agenda];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    bindCurrentStateVersion(input);

    const decision = chooseCorpAction(input);
    const portfolio = JSON.stringify(residentPlanPortfolioSnapshot(input));

    expect(decision.actionId).toBe(unlock.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.score_agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_priority_class:P4",
        "plan_step_capability:unlock_score_remote_creation",
        "plan_assessment_evidence:corp_score_remote_creation_lock_removal:agenda-lock:new_remote",
      ]),
    );
    expect(portfolio).toContain(
      "plan:corp.score_agenda:agenda%3Aagenda-lock%3Anew_remote",
    );
    expect(portfolio).toContain(`"actionIds":["${unlock.actionId}"]`);
  });

  it("marks remote-lock removal nonproductive without an exact score parent", () => {
    const unlock = precisionBriberyUnlock();
    const gain = legalAction(
      "corp.gain_credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [unlock, gain, endTurn()]);
    input.decisionId = "corp-card-variant:precision-bribery:no-parent";
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [
      corpCard("hq-ice", DATA_WALL, "ice", {
        title: "Data Wall",
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    bindCurrentStateVersion(input);

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.economy");
    expect(decision.consideredActionIds).toContain(unlock.actionId);
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_non_strategic_residual_capacity_use",
      ]),
    );
  });

  it("marks every unbound future recurring action-capacity variant nonproductive", () => {
    const source = corpCard(
      "guard-temps",
      CORPORATE_GUARD_R_TEMPS,
      "operation",
      {
        title: "Corporate Guard(R) Temps",
        cost: 0,
      },
    );
    const x1 = corporateGuardRTemps(source, 1);
    const x2 = corporateGuardRTemps(source, 2);
    const gain = legalAction(
      "corp.gain_credit",
      "corp",
      "gain_credit",
      "Gain 1 Credit",
      { credits: 0, clicks: 1 },
    );
    const input = aiInput("corp", [x1, x2, gain, endTurn()]);
    input.decisionId = "corp-card-variant:future-recurring:no-parent";
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 3;
    input.playerView.own.gripOrHq = [source];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    bindCurrentStateVersion(input);
    const guardCandidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: input.side,
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId:
        visibleSourceDefinitionsByInstanceId(input.playerView),
      cardSemanticProfilesByDefinitionId:
        buildActionCardSemanticProfilesByDefinitionId(),
    }).filter((candidate) =>
      [x1.actionId, x2.actionId].includes(candidate.actionId),
    );

    expect(
      guardCandidates.map((candidate) => ({
        actionId: candidate.actionId,
        projection: candidate.actionCapacityProjection,
      })),
    ).toEqual([
      expect.objectContaining({
        actionId: x1.actionId,
        projection: expect.objectContaining({
          kind: "future_recurring_gain",
          durationTurns: 1,
          reliability: "guaranteed",
          source: "legal_action_payload",
        }),
      }),
      expect.objectContaining({
        actionId: x2.actionId,
        projection: expect.objectContaining({
          kind: "future_recurring_gain",
          durationTurns: 2,
          reliability: "guaranteed",
          source: "legal_action_payload",
        }),
      }),
    ]);

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe(gain.actionId);
    expect(decision.decisionDebug?.planKind).toBe("corp.economy");
    expect(decision.consideredActionIds).toEqual(
      expect.arrayContaining([x1.actionId, x2.actionId]),
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_non_strategic_residual_capacity_use",
      ]),
    );
  });
});

function scoreConversionFixture(params: {
  agendaDefinitionId: string;
  agendaTitle: string;
  agendaPoints: number;
  includeOvertime: boolean;
}): {
  input: AiDecisionInput;
  installPrepared: LegalAction;
  overtime?: LegalAction;
} {
  const agenda = corpCard("agenda-1", params.agendaDefinitionId, "agenda", {
    title: params.agendaTitle,
    advancementRequirement: 3,
    agendaPoints: params.agendaPoints,
  });
  const overtime = corpCard("overtime-1", OVERTIME_INCENTIVES, "operation", {
    title: "Overtime Incentives",
    cost: 4,
  });
  const installPrepared = installAgenda(agenda, "remote_1");
  const installNew = installAgenda(agenda, "new_remote");
  const overtimeAction = params.includeOvertime
    ? playOvertime(overtime)
    : undefined;
  const actions = [
    installNew,
    installPrepared,
    ...(overtimeAction ? [overtimeAction] : []),
    endTurn(),
  ];
  const input = aiInput("corp", actions);
  for (const action of actions) {
    action.expiresAtStateVersion = input.playerView.stateVersion;
  }
  input.decisionId = `corp-card-variant:${params.agendaDefinitionId}:${params.includeOvertime ? "conversion" : "direct"}`;
  input.playerView.own.credits = 8;
  input.playerView.own.clicks = 3;
  input.playerView.own.stackOrRdCount = 10;
  input.playerView.own.gripOrHq = [
    agenda,
    ...(params.includeOvertime ? [overtime] : []),
  ];
  input.playerView.opponent.credits = 10;
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server("remote_1", [
      preparedDataWall("prepared-wall-1"),
      preparedDataWall("prepared-wall-2"),
    ]),
  ];
  return {
    input,
    installPrepared,
    ...(overtimeAction ? { overtime: overtimeAction } : {}),
  };
}

function annualReviewsFixture(params: {
  startingHandSize: 3 | 4;
  includeBlockedScoreParent: boolean;
}): {
  input: AiDecisionInput;
  annualReviews: LegalAction;
  basicDraw: LegalAction;
} {
  const annual = corpCard("annual-reviews", ANNUAL_REVIEWS, "operation", {
    title: "Annual Reviews",
    cost: 0,
  });
  const agenda = corpCard("agenda-score", HOSTILE_TAKEOVER, "agenda", {
    title: "Hostile Takeover",
    advancementRequirement: 3,
    agendaPoints: 1,
  });
  const fillerOne = corpCard(
    "filler-operation-1",
    "onr_v1_283_audit-of-call-records",
    "operation",
  );
  const fillerTwo = corpCard(
    "filler-operation-2",
    "onr_v1_298_planning-consultants",
    "operation",
  );
  const annualReviews = playAnnualReviews(annual);
  const basicDraw = legalAction(
    "corp.draw_card",
    "corp",
    "draw_card",
    "Draw one card",
    { credits: 0, clicks: 1 },
    { payload: { drawCardsAmount: 1 } },
  );
  const agendaInstall = installAgenda(agenda, "remote_1");
  const actions = [
    annualReviews,
    basicDraw,
    ...(params.includeBlockedScoreParent ? [agendaInstall] : []),
    endTurn(),
  ];
  const input = aiInput("corp", actions);
  for (const action of actions) {
    action.expiresAtStateVersion = input.playerView.stateVersion;
  }
  input.decisionId = `corp-card-variant:annual-reviews:${params.startingHandSize}`;
  input.playerView.own.credits = 8;
  input.playerView.own.clicks = 3;
  input.playerView.own.stackOrRdCount = 10;
  input.playerView.own.gripOrHq =
    params.startingHandSize === 4
      ? [annual, agenda, fillerOne, fillerTwo]
      : [annual, fillerOne, fillerTwo];
  input.playerView.opponent.credits = 10;
  input.playerView.opponent.rig = [];
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server("remote_1"),
  ];
  attachOwnDeckSnapshot(input, {
    deckSnapshotId: "corp-card-variant-annual-reviews",
    side: "corp",
    cards: [
      { cardId: DATA_WALL, quantity: 3 },
      { cardId: HOSTILE_TAKEOVER, quantity: 3 },
      { cardId: ANNUAL_REVIEWS, quantity: 3 },
      {
        cardId: "onr_v1_283_audit-of-call-records",
        quantity: 3,
      },
      {
        cardId: "onr_v1_298_planning-consultants",
        quantity: 3,
      },
    ],
  });
  return { input, annualReviews, basicDraw };
}

function corpCard(
  instanceId: string,
  definitionId: string,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    "instanceId" | "definitionId" | "owner" | "controller" | "type" | "known"
  > = {},
): VisibleCard {
  return visibleCard(instanceId, "corp", type, {
    definitionId,
    ...overrides,
  });
}

function preparedDataWall(instanceId: string): VisibleCard {
  return corpCard(instanceId, DATA_WALL, "ice", {
    title: "Data Wall",
    rezzed: true,
    strength: 0,
    subtypes: ["wall"],
  });
}

function installAgenda(
  agenda: VisibleCard,
  serverId: "remote_1" | "new_remote",
): LegalAction {
  return legalAction(
    `install-${agenda.instanceId}-${serverId}`,
    "corp",
    "install_card",
    `Install ${agenda.title ?? agenda.instanceId} in ${serverId}`,
    { credits: 0, clicks: 1 },
    {
      source: agenda.instanceId,
      payload: {
        cardId: agenda.instanceId,
        sourceDefinitionId: agenda.definitionId!,
        serverId,
        placement: "root",
      },
    },
  );
}

function playOvertime(overtime: VisibleCard): LegalAction {
  return legalAction(
    "play-overtime",
    "corp",
    "play_operation",
    "Play Overtime Incentives",
    { credits: 4, clicks: 1 },
    {
      source: overtime.instanceId,
      visibility: "private_to_actor",
      payload: {
        cardId: overtime.instanceId,
        sourceDefinitionId: overtime.definitionId!,
        gainActionsAmount: 2,
        actionCapacityTiming: "immediate",
        actionCapacityRestriction: "unrestricted",
        actionCapacityReliability: "guaranteed",
        actionCapacityExpiresAt: "side_turn_end",
        scoreConversionCapability: "gain_action_capacity",
        scoreConversionTiming: "immediate",
      },
    },
  );
}

function playAnnualReviews(annual: VisibleCard): LegalAction {
  return legalAction(
    "play-annual-reviews",
    "corp",
    "play_operation",
    "Play Annual Reviews",
    { credits: 0, clicks: 1 },
    {
      source: annual.instanceId,
      visibility: "private_to_actor",
      payload: {
        cardId: annual.instanceId,
        sourceDefinitionId: annual.definitionId!,
        drawCardsAmount: 3,
      },
    },
  );
}

function precisionBriberyUnlock(): LegalAction {
  const action = legalAction(
    "trash-remote-creation-lock",
    "corp",
    "trigger_ability",
    "Precision Bribery trashen",
    { credits: 4, clicks: 1 },
    {
      source: "runner-precision-bribery",
      payload: {
        cardId: "runner-precision-bribery",
        sourceDefinitionId: PRECISION_BRIBERY,
      },
    },
  );
  action.targetRequirements = [
    {
      id: "newDataFortCreationLockSource",
      kind: "card",
      zoneScope: ["runner.rig.resources"],
      side: "runner",
      visibility: "public",
    },
  ];
  return action;
}

function corporateGuardRTemps(source: VisibleCard, xValue: 1 | 2): LegalAction {
  return legalAction(
    `play-guard-temps-${xValue}`,
    "corp",
    "play_operation",
    `Corporate Guard(R) Temps: X=${xValue}`,
    { credits: xValue * 2, clicks: 1 },
    {
      source: source.instanceId,
      visibility: "private_to_actor",
      payload: {
        cardId: source.instanceId,
        xValue,
        actionCapacityTiming: "future_turn_start",
        actionCapacityRestriction: "unrestricted",
        actionCapacityReliability: "guaranteed",
        actionCapacityExpiresAt: "duration_end",
        actionCapacityGainAmountPerTurn: 1,
        actionCapacityDurationTurns: xValue,
      },
    },
  );
}

function bindCurrentStateVersion(input: AiDecisionInput): void {
  for (const action of input.legalActions) {
    action.expiresAtStateVersion = input.playerView.stateVersion;
  }
}

function endTurn(): LegalAction {
  return legalAction(
    "end-turn",
    "corp",
    "end_turn",
    "End turn",
    { credits: 0, clicks: 0 },
    { source: "game_rule" },
  );
}
