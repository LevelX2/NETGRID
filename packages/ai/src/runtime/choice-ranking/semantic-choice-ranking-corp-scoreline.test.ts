import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "../semantic-choice-ranking";
import type { TacticalPlanRuntimeResult } from "../../tactical-plans";
import {
  aiInput,
  choice,
  finiteEconomyMapping,
  legalAction,
  scoreComponentEvidence,
  scoreConversionMapping,
  scorelineSupportMapping,
} from "./semantic-choice-ranking.test-support";

describe("tacticalPlanMappedChoice Corp scoreline overrides", () => {
  it.each(["active", "progressing"] as const)(
    "keeps a %s guaranteed Corp score-conversion sequence on its exact next action",
    (status) => {
      const nextScoreAction =
        status === "active"
          ? legalAction("install-agenda", "install_card")
          : legalAction("advance-agenda", "advance_card");
      const offPlanCredit = legalAction("gain", "gain_credit");
      const mapping = scoreConversionMapping([nextScoreAction], { status });

      const result = tacticalPlanMappedChoice(
        aiInput(),
        [choice(offPlanCredit, 5000), choice(nextScoreAction, 50)],
        mapping,
        choice(offPlanCredit, 5000),
      );

      expect(result.outcome).toBe("semantic_choice_blocked");
      expect(result.choice?.action.actionId).toBe(nextScoreAction.actionId);
      expect(result.overrideBlockedChoice?.action.actionId).toBe("gain");
      expect(result.overrideBlockedReason).toBe(
        "corp_score_conversion_plan_controller",
      );
    },
  );

  it("does not protect a blocked score-conversion path", () => {
    const installAgenda = legalAction("install-agenda", "install_card");
    const offPlanCredit = legalAction("gain", "gain_credit");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(offPlanCredit, 5000), choice(installAgenda, 50)],
      scoreConversionMapping([installAgenda], { status: "blocked" }),
      choice(offPlanCredit, 5000),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
  });

  it("keeps an active finite Corp economy plan on its mapped action", () => {
    const installBbs = legalAction("install-bbs", "install_card");
    const offPlanCredit = legalAction("gain", "gain_credit");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(offPlanCredit, 5000), choice(installBbs, -1200)],
      finiteEconomyMapping([installBbs]),
      choice(offPlanCredit, 5000),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("install-bbs");
    expect(result.overrideBlockedReason).toBe(
      "corp_finite_economy_plan_controller",
    );
  });

  it("yields a finite background economy plan to positive foreground work after its cadence", () => {
    const drainEconomy = legalAction("drain-bbs", "activated_card_ability");
    const installProtection = legalAction("install-protection", "install_card");
    const mapping = finiteEconomyMapping([drainEconomy]);
    const drainChoice = choice(drainEconomy, 2_700, [], {
      key: "economy_credit_base",
      value: 180,
      reason: "economy_net_liquid_gain:2",
    });
    const protectionChoice = choice(installProtection, 1_300);

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drainChoice, protectionChoice],
      mapping,
      drainChoice,
      finiteEconomyCadenceRuntime(mapping, "install-protection"),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("install-protection");
    expect(result.overrideReason).toBe(
      "corp_finite_economy_background_cadence_yield",
    );
    expect(result.choice?.evidence).toContain(
      "corp_finite_economy_background_cadence:soft_limit_reached",
    );
  });

  it("uses public same-turn payout evidence when the finite plan is outside the capped portfolio", () => {
    const drainEconomy = {
      ...legalAction("drain-bbs", "activated_card_ability"),
      side: "corp" as const,
      source: "bbs-instance",
      timingPoint: "corp_action.main" as const,
    };
    const installProtection = legalAction("install-protection", "install_card");
    const mapping = finiteEconomyMapping([drainEconomy]);
    const drainChoice = choice(drainEconomy, 2_700, [], {
      key: "economy_credit_base",
      value: 180,
      reason: "economy_net_liquid_gain:2",
    });
    const protectionChoice = choice(installProtection, 1_300);
    const input = corpInputAfterBbsPayout();

    const result = tacticalPlanMappedChoice(
      input,
      [drainChoice, protectionChoice],
      mapping,
      drainChoice,
      {
        planAlternatives: [mapping.plan],
        blockedPlans: [],
        selectedPlan: mapping.plan,
        selectedStep: mapping.step,
        selectedMapping: mapping,
        planPortfolio: {
          schemaVersion: "plan-portfolio-v1",
          side: "corp",
          profileId: input.profileId,
          stateVersion: 20,
          turnKey: "corp:turn:1",
          backgrounds: [],
          rejectedEntryIds: [mapping.plan.planId],
          evidence: [],
        },
      },
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("install-protection");
  });

  it("blocks a repeated off-plan finite payout for positive mapped work", () => {
    const drainEconomy = {
      ...legalAction("drain-bbs", "activated_card_ability"),
      side: "corp" as const,
      source: "bbs-instance",
      timingPoint: "corp_action.main" as const,
    };
    const installProtection = legalAction("install-protection", "install_card");
    const finiteMapping = finiteEconomyMapping([drainEconomy]);
    const foregroundMapping = scorelineSupportMapping([installProtection]);
    const drainChoice = choice(drainEconomy, 2_700, [], {
      key: "economy_credit_base",
      value: 180,
      reason: "economy_net_liquid_gain:2",
    });
    const protectionChoice = choice(installProtection, 1_300);
    const input = corpInputAfterBbsPayout();

    const result = tacticalPlanMappedChoice(
      input,
      [drainChoice, protectionChoice],
      foregroundMapping,
      drainChoice,
      {
        planAlternatives: [foregroundMapping.plan, finiteMapping.plan],
        blockedPlans: [],
        selectedPlan: foregroundMapping.plan,
        selectedStep: foregroundMapping.step,
        selectedMapping: foregroundMapping,
        planPortfolio: {
          schemaVersion: "plan-portfolio-v1",
          side: "corp",
          profileId: input.profileId,
          stateVersion: 20,
          turnKey: "corp:turn:1",
          backgrounds: [],
          rejectedEntryIds: [finiteMapping.plan.planId],
          evidence: [],
        },
      },
    );

    expect(result.outcome).toBe("plan_mapping_selected");
    expect(result.choice?.action.actionId).toBe("install-protection");
    expect(result.overrideBlockedReason).toBe(
      "corp_finite_economy_background_cadence_yield",
    );
  });

  it("keeps the finite +2 credit action ahead of basic +1 after its cadence", () => {
    const drainEconomy = legalAction("drain-bbs", "activated_card_ability");
    const basicCredit = legalAction("gain", "gain_credit");
    const mapping = finiteEconomyMapping([drainEconomy]);
    const drainChoice = choice(drainEconomy, 2_700, [], {
      key: "economy_credit_base",
      value: 180,
      reason: "economy_net_liquid_gain:2",
    });
    const basicCreditChoice = choice(basicCredit, 1_300, [], {
      key: "economy_credit_base",
      value: 90,
      reason: "economy_net_liquid_gain:1",
    });

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drainChoice, basicCreditChoice],
      mapping,
      drainChoice,
      finiteEconomyCadenceRuntime(mapping),
    );

    expect(result.outcome).toBe("plan_mapping_selected");
    expect(result.choice?.action.actionId).toBe("drain-bbs");
  });

  it("lets an immediate +3 credit action beat the finite +2 route after its cadence", () => {
    const drainEconomy = legalAction("drain-bbs", "activated_card_ability");
    const corporateCoup = legalAction(
      "corporate-coup",
      "activated_card_ability",
    );
    const mapping = finiteEconomyMapping([drainEconomy]);
    const drainChoice = choice(drainEconomy, 2_700, [], {
      key: "economy_credit_base",
      value: 180,
      reason: "economy_net_liquid_gain:2",
    });
    const coupChoice = choice(corporateCoup, 1_900, [], {
      key: "economy_credit_base",
      value: 270,
      reason: "economy_net_liquid_gain:3",
    });

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drainChoice, coupChoice],
      mapping,
      drainChoice,
      finiteEconomyCadenceRuntime(mapping),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("corporate-coup");
  });

  it("lets a strong strategic punish action interrupt finite economy", () => {
    const drainEconomy = legalAction("drain-bbs", "activated_card_ability");
    const genericInstall = legalAction("install-ice", "install_card");
    const applyTag = legalAction("apply-tag", "play_operation");
    const strategicTagChoice = choice(applyTag, 2607, [
      "semantic_strategic_action_fit:true",
      "strategic_action_fit_target_match:kind",
    ]);

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(genericInstall, 3104),
        strategicTagChoice,
        choice(drainEconomy, 1970),
      ],
      finiteEconomyMapping([drainEconomy]),
      choice(genericInstall, 3104),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("apply-tag");
    expect(result.overrideReason).toBe("strategic_kind_score_gap");
  });

  it("keeps zero-cost persistent economy activation ahead of an off-plan draw", () => {
    const rezEconomy = legalAction("rez-economy", "rez_ice");
    const offPlanDraw = legalAction("draw", "draw_card");
    const mapping = finiteEconomyMapping([rezEconomy]);
    mapping.plan.type = "corp.activate_persistent_economy";
    mapping.plan.currentStep.kind = "rez_persistent_economy";
    mapping.step.kind = "rez_persistent_economy";

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(offPlanDraw, 5000), choice(rezEconomy, 50)],
      mapping,
      choice(offPlanDraw, 5000),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("rez-economy");
    expect(result.overrideBlockedReason).toBe(
      "corp_persistent_economy_plan_controller",
    );
  });

  it("keeps a progressing Corp scoreline on its concrete support action", () => {
    const installProtection = legalAction("install-protection", "install_card");
    const offPlanSupport = legalAction("install-vapor", "install_card");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(offPlanSupport, 2000), choice(installProtection, -1500)],
      scorelineSupportMapping([installProtection]),
      choice(offPlanSupport, 2000),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("install-protection");
    expect(result.overrideBlockedReason).toBe(
      "corp_scoreline_support_plan_controller",
    );
  });

  it("lets a safe active agenda continue over a stale support mapping", () => {
    const protectRemote = legalAction("protect-remote", "install_card");
    const advanceAgenda = legalAction("advance-agenda", "advance_card");
    const advanceChoice = choice(
      advanceAgenda,
      -500,
      scoreComponentEvidence("corp_active_remote_agenda_advance_clock"),
      {
        key: "corp_active_remote_agenda_advance_clock",
        value: 2600,
        reason:
          "active_remote_agenda:true|runner_cannot_contest_before_score:true",
      },
    );
    const input = aiInput();
    input.side = "corp";
    input.playerView.own.credits = 2;
    const result = tacticalPlanMappedChoice(
      input,
      [choice(protectRemote, 3000), advanceChoice],
      scorelineSupportMapping([protectRemote]),
      choice(protectRemote, 3000),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("advance-agenda");
    expect(result.overrideReason).toBe(
      "corp_active_remote_agenda_advance_controller",
    );
  });

  it("does not force an unsafe active agenda over the raw-score winner", () => {
    const protectRemote = legalAction("protect-remote", "install_card");
    const advanceAgenda = legalAction("advance-agenda", "advance_card");
    const advanceChoice = choice(
      advanceAgenda,
      -500,
      scoreComponentEvidence("corp_active_remote_agenda_advance_clock"),
      {
        key: "corp_active_remote_agenda_advance_clock",
        value: 2600,
        reason:
          "active_remote_agenda:true|runner_cannot_contest_before_score:true",
      },
    );
    advanceChoice.scoreBreakdown.push({
      key: "corp_board_triage_alignment",
      label: "Corp-Board-Triage",
      value: 24,
      reason: "triage_alignment:match|window_kind:unsafe",
    });
    const input = aiInput();
    input.side = "corp";
    input.playerView.own.credits = 2;
    const result = tacticalPlanMappedChoice(
      input,
      [choice(protectRemote, 3000), advanceChoice],
      scorelineSupportMapping([protectRemote]),
      choice(protectRemote, 3000),
    );

    expect(result.choice?.action.actionId).toBe("protect-remote");
    expect(result.overrideReason).not.toBe(
      "corp_active_remote_agenda_advance_controller",
    );
  });

  it("keeps a blocked scoreline on its funding route instead of advancing", () => {
    const fundScoreline = legalAction("fund-scoreline", "gain_credit");
    const advanceAgenda = legalAction("advance-agenda", "advance_card");
    fundScoreline.side = "corp";
    advanceAgenda.side = "corp";
    const fundingChoice = choice(
      fundScoreline,
      1200,
      scoreComponentEvidence("economy_credit_base"),
      {
        key: "economy_credit_base",
        value: 150,
        reason: "economy_net_liquid_gain:2",
      },
    );
    const advanceChoice = choice(
      advanceAgenda,
      3000,
      scoreComponentEvidence("corp_active_remote_agenda_advance_clock"),
      {
        key: "corp_active_remote_agenda_advance_clock",
        value: 2600,
        reason:
          "active_remote_agenda:true|runner_cannot_contest_before_score:true",
      },
    );
    advanceChoice.scoreBreakdown.push({
      key: "corp_scoring_window_assessment",
      label: "Score window",
      value: 0,
      reason: "window_kind:unsafe|agenda_steal_severity:near_win",
    });
    const mapping = scorelineSupportMapping([fundScoreline], {
      stepKind: "build_rez_reserve",
    });
    mapping.plan.status = "blocked";
    const input = aiInput();
    input.side = "corp";

    const result = tacticalPlanMappedChoice(
      input,
      [advanceChoice, fundingChoice],
      mapping,
      advanceChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("fund-scoreline");
    expect(result.overrideBlockedReason).toBe(
      "corp_scoreline_support_plan_controller",
    );
  });

  it("allows a stronger normal-stakes advance over an optional reserve route", () => {
    const fundScoreline = legalAction("fund-scoreline", "gain_credit");
    const advanceAgenda = legalAction("advance-agenda", "advance_card");
    fundScoreline.side = "corp";
    advanceAgenda.side = "corp";
    const fundingChoice = choice(fundScoreline, 1_200, [], {
      key: "economy_credit_base",
      value: 150,
      reason: "economy_net_liquid_gain:2",
    });
    const advanceChoice = choice(advanceAgenda, 1_900, [], {
      key: "corp_scoring_window_assessment",
      value: 0,
      reason: "window_kind:unsafe|agenda_steal_severity:normal",
    });
    const mapping = scorelineSupportMapping([fundScoreline], {
      stepKind: "build_rez_reserve",
    });
    mapping.plan.status = "blocked";
    const input = aiInput();
    input.side = "corp";

    const result = tacticalPlanMappedChoice(
      input,
      [advanceChoice, fundingChoice],
      mapping,
      advanceChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("advance-agenda");
  });

  it("scores a legal agenda before overadvancing the active scoreline", () => {
    const advanceAgenda = legalAction("advance-agenda", "advance_card");
    const scoreAgenda = legalAction("score-agenda", "score_agenda");
    const advanceChoice = choice(
      advanceAgenda,
      -500,
      scoreComponentEvidence("corp_active_remote_agenda_advance_clock"),
      {
        key: "corp_active_remote_agenda_advance_clock",
        value: 2600,
        reason:
          "active_remote_agenda:true|runner_cannot_contest_before_score:true",
      },
    );
    const input = aiInput();
    input.side = "corp";
    const result = tacticalPlanMappedChoice(
      input,
      [advanceChoice, choice(scoreAgenda, 2200)],
      scorelineSupportMapping([advanceAgenda]),
      choice(scoreAgenda, 2200),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("score-agenda");
    expect(result.overrideReason).toBe("corp_scoreable_agenda_controller");
  });
});

function finiteEconomyCadenceRuntime(
  mapping: ReturnType<typeof finiteEconomyMapping>,
  foregroundActionId?: string,
): TacticalPlanRuntimeResult {
  return {
    planAlternatives: [mapping.plan],
    blockedPlans: [],
    selectedPlan: mapping.plan,
    selectedStep: mapping.step,
    selectedMapping: mapping,
    planPortfolio: {
      schemaVersion: "plan-portfolio-v1",
      side: "corp",
      profileId: "test-profile",
      stateVersion: 1,
      turnKey: "corp:turn:1",
      ...(foregroundActionId
        ? {
            foreground: {
              portfolioEntryId: "corp.create_score_window:test",
              sourcePlanId: "corp.create_score_window:test",
              planType: "corp.create_score_window" as const,
              side: "corp" as const,
              executionClass: "bounded_sequence" as const,
              role: "foreground" as const,
              lifecycle: "active" as const,
              priority: 900,
              supportsEntryIds: [],
              milestone: "protect_remote",
              progress: 0.5,
              selectedStepKind: "protect_remote" as const,
              actionCandidateIds: [foregroundActionId],
              cadence: {
                turnKey: "corp:turn:1",
                maxActionsPerTurn: 4,
                actionsUsedThisTurn: 0,
              },
              resourceReservation: { credits: 0, clicks: 0 },
              updatedAtStateVersion: 1,
              evidence: [],
            },
          }
        : {}),
      backgrounds: [
        {
          portfolioEntryId: mapping.plan.planId,
          sourcePlanId: mapping.plan.planId,
          planType: mapping.plan.type,
          side: mapping.plan.side,
          executionClass: "recurring_cycle",
          role: "background",
          lifecycle: "active",
          priority: mapping.plan.priority,
          supportsEntryIds: [],
          milestone: mapping.step.kind,
          progress: 0.5,
          selectedStepKind: mapping.step.kind,
          actionCandidateIds: mapping.actionCandidateIds,
          cadence: {
            turnKey: "corp:turn:1",
            maxActionsPerTurn: 1,
            actionsUsedThisTurn: 1,
          },
          resourceReservation: { credits: 0, clicks: 0 },
          updatedAtStateVersion: 1,
          evidence: [],
        },
      ],
      rejectedEntryIds: [],
      evidence: [],
    },
  };
}

function publicCorpActionEvent(
  stateVersionAfter: number,
  actionType: string,
  payload: Record<string, unknown> = {},
): ReturnType<typeof aiInput>["eventTail"][number] {
  return {
    eventId: `corp-event-${stateVersionAfter}`,
    type: actionType,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `hash-${stateVersionAfter}`,
    publicPayload: { actor: "corp", actionType, ...payload },
  } as ReturnType<typeof aiInput>["eventTail"][number];
}

function corpInputAfterBbsPayout(): ReturnType<typeof aiInput> {
  const input = aiInput([
    publicCorpActionEvent(18, "mandatory_draw"),
    publicCorpActionEvent(19, "activated_card_ability", {
      cardDefinitionId: "onr_v1_309_bbs-whispering-campaign",
    }),
  ]);
  input.side = "corp";
  input.playerView.side = "corp";
  input.playerView.activeSide = "corp";
  input.playerView.timingPoint = "corp_action.main";
  input.playerView.servers = [
    {
      id: "remote_1",
      label: "Remote 1",
      ice: [],
      root: [
        {
          instanceId: "bbs-instance",
          definitionId: "onr_v1_309_bbs-whispering-campaign",
          title: "BBS Whispering Campaign",
          owner: "corp",
          controller: "corp",
          type: "asset",
          known: true,
          rezzed: true,
        },
      ],
    },
  ];
  return input;
}
