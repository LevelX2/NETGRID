import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "../semantic-choice-ranking";
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
