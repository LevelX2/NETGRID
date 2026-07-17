import { describe, expect, it } from "vitest";
import { tacticalPlanMappedChoice } from "../semantic-choice-ranking";
import {
  aiInput,
  choice,
  finiteEconomyMapping,
  legalAction,
  remoteContestMapping,
  scoreComponentEvidence,
  scoreConversionMapping,
  scorelineSupportMapping,
  strategicEvidence,
} from "./semantic-choice-ranking.test-support";

describe("tacticalPlanMappedChoice Corp overrides", () => {
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

  it("lets a better burst-economy operation build the progressing rez reserve", () => {
    const gain = legalAction("gain", "gain_credit");
    const burstEconomy = legalAction("burst-economy", "play_operation");
    const alternative = choice(
      burstEconomy,
      -423,
      scoreComponentEvidence("corp_operation_burst_economy"),
      {
        key: "corp_operation_burst_economy",
        value: 1890,
        reason: "operation_gain:2|operation_draw:1",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [alternative, choice(gain, -1681)],
      scorelineSupportMapping([gain], { stepKind: "build_rez_reserve" }),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("burst-economy");
  });

  it("keeps the basic rez-reserve action when burst economy cannot draw", () => {
    const gain = legalAction("gain", "gain_credit");
    const burstEconomy = legalAction("burst-economy", "play_operation");
    const input = aiInput();
    input.playerView.own.stackOrRdCount = 0;
    const alternative = choice(
      burstEconomy,
      -423,
      scoreComponentEvidence("corp_operation_burst_economy"),
      {
        key: "corp_operation_burst_economy",
        value: 1890,
        reason: "operation_gain:2|operation_draw:1",
      },
    );
    const result = tacticalPlanMappedChoice(
      input,
      [alternative, choice(gain, -1681)],
      scorelineSupportMapping([gain], { stepKind: "build_rez_reserve" }),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedReason).toBe(
      "corp_scoreline_support_plan_controller",
    );
  });

  it("lets board triage reject an overbuilt remote protection target", () => {
    const remoteIce = legalAction("install-remote-ice", "install_card", {
      serverId: "remote_1",
      placement: "ice",
    });
    const rdIce = legalAction("install-rd-ice", "install_card", {
      serverId: "rd",
      placement: "ice",
    });
    const mapped = choice(
      remoteIce,
      -636,
      scoreComponentEvidence("corp_board_triage_mismatch"),
    );
    const alternative = choice(
      rdIce,
      4193,
      scoreComponentEvidence("corp_board_triage_context"),
    );

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [alternative, mapped],
      scorelineSupportMapping([remoteIce]),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("install-rd-ice");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("lets board triage stop score-window funding after its need is stale", () => {
    const gain = legalAction("gain", "gain_credit");
    const rdIce = legalAction("install-rd-ice", "install_card", {
      serverId: "rd",
      placement: "ice",
    });
    const mapped = choice(
      gain,
      119,
      scoreComponentEvidence("corp_board_triage_mismatch"),
    );
    const alternative = choice(
      rdIce,
      3943,
      scoreComponentEvidence("corp_board_triage_context"),
    );

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [alternative, mapped],
      scorelineSupportMapping([gain], { stepKind: "build_rez_reserve" }),
      alternative,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("install-rd-ice");
    expect(result.overrideReason).toBe("corp_board_triage_mismatch_yield");
  });

  it("does not protect a progressing score window without conversion guarantee", () => {
    const installAgenda = legalAction("install-agenda", "install_card");
    const offPlanCredit = legalAction("gain", "gain_credit");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(offPlanCredit, 5000), choice(installAgenda, 50)],
      scoreConversionMapping([installAgenda], {
        status: "progressing",
        evidence: [],
      }),
      choice(offPlanCredit, 5000),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
  });
  it("lets semantic ranking override a mapped Corp action that conflicts with board triage", () => {
    const mappedInstall = legalAction("install-remote-ice", "install_card", {
      serverId: "remote_1",
      placement: "ice",
    });
    const economy = legalAction("burst-economy", "play_operation");
    const mappedChoice = choice(mappedInstall, 1169, [
      ...strategicEvidence("exact"),
      ...scoreComponentEvidence("corp_board_triage_mismatch"),
    ]);
    const economyChoice = choice(economy, 1839, [
      ...scoreComponentEvidence("corp_board_triage_context"),
    ]);

    const result = tacticalPlanMappedChoice(
      aiInput(),
      [economyChoice, mappedChoice],
      remoteContestMapping([mappedInstall]),
      economyChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("burst-economy");
    expect(result.overriddenMappedChoice?.action.actionId).toBe(
      "install-remote-ice",
    );
    expect(result.overrideReason).toBe("corp_board_triage_mismatch_yield");
    expect(result.scoreGap).toBe(670);
    expect(result.overrideThreshold).toBe(900);
  });
});
