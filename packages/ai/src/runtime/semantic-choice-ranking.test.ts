import { describe, expect, it } from "vitest";
import type { AiDecisionInput, LegalAction } from "@netgrid/shared";
import {
  bestSemanticRuntimeChoiceForTacticalPlanOverride,
  tacticalPlanMappedChoice,
} from "./semantic-choice-ranking";
import type { SemanticRuntimeChoice } from "./semantic-runtime-types";
import {
  createPlanStep,
  createTacticalPlan,
  type PlanStepMappingResult,
} from "../tactical-plans";

describe("tacticalPlanMappedChoice", () => {
  it("keeps the general override candidate score-based before a mapped run is known", () => {
    const draw = legalAction("draw", "draw_card");
    const gain = legalAction("gain", "gain_credit");
    const drawChoice = choice(draw, 1543, [], {
      key: "runner_hand_buffer_need",
      value: 600,
      reason: "hand:1|damage_pressure:false",
    });

    const override = bestSemanticRuntimeChoiceForTacticalPlanOverride(
      [choice(gain, 1679), drawChoice],
      { planAlternatives: [] } as never,
    );

    expect(override?.action.actionId).toBe("gain");
  });

  it("lets an acute one-card hand draw interrupt a speculative run plan", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const drawChoice = choice(draw, 1543, [], {
      key: "runner_hand_buffer_need",
      value: 600,
      reason: "hand:1|damage_pressure:false",
    });
    const runChoice = choice(run, 453);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drawChoice, runChoice],
      centralRunMapping([run]),
      drawChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overrideReason).toBe("acute_hand_buffer_mapping_yield");
  });

  it("keeps a visible immediate agenda run over the acute hand buffer", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const drawChoice = choice(draw, 1543, [], {
      key: "runner_hand_buffer_need",
      value: 600,
      reason: "hand:1|damage_pressure:false",
    });
    const runChoice = choice(
      run,
      453,
      scoreComponentEvidence("runner_hq_known_agenda"),
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drawChoice, runChoice],
      centralRunMapping([run]),
      drawChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-hq");
  });

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

  it("keeps runner plan mapping over a clear off-plan semantic run gap", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7645), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7645),
    );

    expect(result.overrideChoice).toBeUndefined();
    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.scoreGap).toBe(620);
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:semantic_choice_blocked",
        "tactical_plan_mapping_override_blocked:true",
        "tactical_plan_override_blocked_reason:runner_plan_controller",
      ]),
    );
  });

  it("ranks only plan-compatible mapped actions inside the selected plan", () => {
    const basicCredit = legalAction("basic-credit", "gain_credit");
    const economyEvent = legalAction("economy-event", "play_event");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(economyEvent, 1440), choice(basicCredit, 90)],
      creditBaseMapping([basicCredit, economyEvent]),
      choice(economyEvent, 1440),
    );

    expect(result.outcome).toBe("plan_mapping_selected");
    expect(result.choice?.action.actionId).toBe("economy-event");
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:plan_mapping_selected",
      ]),
    );
  });

  it("uses plan-step priority before generic score for mapped credit actions", () => {
    const basicCredit = legalAction("basic-credit", "gain_credit");
    const economyEvent = legalAction("economy-event", "play_event");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(basicCredit, 1679), choice(economyEvent, 87)],
      creditBaseMapping([economyEvent, basicCredit], {
        actionPriorities: [
          { actionId: "economy-event", priority: 300 },
          { actionId: "basic-credit", priority: 100 },
        ],
      }),
      choice(basicCredit, 1679),
    );

    expect(result.outcome).toBe("plan_mapping_selected");
    expect(result.choice?.action.actionId).toBe("economy-event");
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:plan_mapping_selected",
        "tactical_plan_step_priority_selected:true",
        "tactical_plan_step_priority:300",
      ]),
    );
  });

  it("lets meaningful runs override generic creditbase mapping", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 6800), choice(gain, 5400)],
      creditBaseMapping([gain]),
      choice(run, 6800),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("gain");
    expect(result.overrideReason).toBe("semantic_score_gap");
  });

  it("keeps best-hand-card plan mapping over off-plan basic credit", () => {
    const install = legalAction("install-economy", "install_card");
    const gain = legalAction("gain", "gain_credit");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(gain, 2500), choice(install, 80)],
      bestHandCardMapping([install]),
      choice(gain, 2500),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("install-economy");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("yields a negative just-funded development install to a clearly better action", () => {
    const install = legalAction("install-funded-card", "install_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(run, 1903),
        choice(install, -156, [], {
          key: "runner_persistent_install_fit",
          value: -180,
          reason:
            "delta:backup_only|duplicate:redundant_duplicate|fit:-180|stackability:unknown",
        }),
      ],
      fundedDevelopmentMapping([install]),
      choice(run, 1903),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overriddenMappedChoice?.action.actionId).toBe(
      "install-funded-card",
    );
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("keeps a funded nonduplicate development install despite a negative immediate fit", () => {
    const install = legalAction("install-funded-card", "install_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(run, 1903),
        choice(install, -156, [], {
          key: "runner_persistent_install_fit",
          value: -480,
          reason:
            "delta:cumulative_capacity|duplicate:none|fit:-480|stackability:cumulative_capacity",
        }),
      ],
      fundedDevelopmentMapping([install]),
      choice(run, 1903),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("install-funded-card");
    expect(result.overrideBlockedReason).toBe(
      "funded_development_plan_controller",
    );
  });

  it("lets an urgent run-now target interrupt negative development funding", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const urgentRun = choice(run, 1693, [], {
      key: "runner_goal_fit_tactical_goal_run_target",
      value: 1000,
      reason:
        "goal:runner.pressure_good_central_target|urgency:high|target:rd|recommendation:run_now",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [urgentRun, choice(gain, -1796)],
      planMapping("runner.develop_hand_card", [gain], {
        stepKind: "gain_credits",
        evidence: ["hand_development_fit:blocked"],
      }),
      urgentRun,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overrideReason).toBe("urgent_run_now_development_yield");
  });

  it("lets an urgent run-now target interrupt a negative funded install", () => {
    const install = legalAction("install-funded-card", "install_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const urgentRun = choice(run, 1693, [], {
      key: "runner_goal_fit_tactical_goal_run_target",
      value: 1000,
      reason:
        "goal:runner.pressure_good_central_target|urgency:high|target:rd|recommendation:run_now",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        urgentRun,
        choice(install, -461, [], {
          key: "runner_persistent_install_fit",
          value: -820,
          reason:
            "delta:cumulative_capacity|duplicate:none|fit:-820|stackability:cumulative_capacity",
        }),
      ],
      fundedDevelopmentMapping([install]),
      urgentRun,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overrideReason).toBe("urgent_run_now_development_yield");
  });

  it("keeps negative development funding against a nonurgent run", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const nonurgentRun = choice(run, 1693, [], {
      key: "runner_goal_fit_tactical_goal_run_target",
      value: 1000,
      reason:
        "goal:runner.pressure_good_central_target|urgency:medium|target:rd|recommendation:run_if_free",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [nonurgentRun, choice(gain, -1796)],
      planMapping("runner.develop_hand_card", [gain], {
        stepKind: "gain_credits",
        evidence: ["hand_development_fit:blocked"],
      }),
      nonurgentRun,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("keeps one-credit development funding on the final click", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const urgentRun = choice(run, 1903, [], {
      key: "runner_goal_fit_tactical_goal_run_target",
      value: 1000,
      reason:
        "goal:runner.pressure_good_central_target|urgency:high|target:rd|recommendation:run_now",
    });
    const input = aiInput();
    input.playerView.own.clicks = 1;
    const result = tacticalPlanMappedChoice(
      input,
      [urgentRun, choice(gain, -156)],
      planMapping("runner.develop_hand_card", [gain], {
        stepKind: "gain_credits",
        evidence: ["hand_development_fit:blocked"],
      }),
      urgentRun,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("lets an immediate agenda score interrupt funded hand development", () => {
    const install = legalAction("install-funded-card", "install_card");
    const score = legalAction("score-visible-agenda", "activated_card_ability");
    const scoreChoice = choice(
      score,
      9662,
      scoreComponentEvidence("runner_activated_agenda_score"),
      {
        key: "runner_activated_agenda_score",
        value: 9600,
        reason: "agenda_points:3|source_visible:true|engine_effect:true",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [scoreChoice, choice(install, 3252)],
      fundedDevelopmentMapping([install]),
      scoreChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("score-visible-agenda");
    expect(result.overriddenMappedChoice?.action.actionId).toBe(
      "install-funded-card",
    );
  });

  it("lets matchpoint run-lock release interrupt an ordinary hand-development plan", () => {
    const gain = legalAction("gain", "gain_credit");
    const release = legalAction("release-run-lock", "trigger_ability");
    const releaseChoice = choice(release, 4117, [], {
      key: "runner_matchpoint_run_lock_release",
      value: 4100,
      reason: "follow_up_server:hq",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [releaseChoice, choice(gain, 2604)],
      planMapping("runner.develop_hand_card", [gain]),
      releaseChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("release-run-lock");
    expect(result.overrideReason).toBe("runner_hard_interrupt");
  });

  it("lets a viable run event interrupt coverage search for its urgent remote", () => {
    const draw = legalAction("draw-for-answer", "play_event");
    const bypass = legalAction("bypass-remote", "play_event", {
      serverId: "remote_1",
      runnerEventRun: true,
    });
    const bypassChoice = choice(bypass, 2167, []);
    bypassChoice.scoreBreakdown.push({
      key: "runner_goal_fit_tactical_goal_run_target",
      label: "Urgent remote goal fit",
      value: 900,
      reason:
        "goal:runner.contest_remote_if_score_threat|urgency:high|target:remote_1|recommendation:run_now",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [bypassChoice, choice(draw, 1437)],
      remoteContestMapping([draw], {
        evidence: ["runner_run_target_payoff:score_threat"],
        priority: 960,
      }),
      bypassChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("bypass-remote");
    expect(result.overrideReason).toBe("runner_hard_interrupt");
  });

  it("keeps coverage search when the run event still leaves the remote blocked", () => {
    const draw = legalAction("draw-for-answer", "play_event");
    const bypass = legalAction("blocked-bypass-remote", "play_event", {
      serverId: "remote_1",
      runnerEventRun: true,
    });
    const bypassChoice = choice(bypass, 2167, [], {
      key: "runner_run_target_semantic_guidance",
      value: -52,
      reason:
        "target:remote_1|recommendation:find_breaker_first|payoff:score_threat|path:blocked_missing_coverage",
    });
    bypassChoice.scoreBreakdown.push({
      key: "runner_goal_fit_tactical_goal_run_target",
      label: "Urgent remote goal fit",
      value: 900,
      reason:
        "goal:runner.contest_remote_if_score_threat|urgency:high|target:remote_1|recommendation:find_breaker_first",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [bypassChoice, choice(draw, 1437)],
      remoteContestMapping([draw], {
        evidence: ["runner_run_target_payoff:score_threat"],
        priority: 960,
      }),
      bypassChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("draw-for-answer");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("yields a no-need tutor plan to a positive free check run", () => {
    const tutor = legalAction("play-tutor", "play_event");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const tutorChoice = choice(tutor, -1268, [], {
      key: "runner_goal_fit_coverage_search_no_need",
      value: -1400,
      reason: "required_coverage:none",
    });
    const runChoice = choice(run, 1064);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [runChoice, tutorChoice],
      planMapping("runner.play_best_hand_card", [tutor]),
      runChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-hq");
    expect(result.overrideReason).toBe("no_need_search_mapping_yield");
  });

  it("keeps a tutor plan when a concrete coverage need exists", () => {
    const tutor = legalAction("play-tutor", "play_event");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 1064), choice(tutor, 780)],
      planMapping("runner.play_best_hand_card", [tutor]),
      choice(run, 1064),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("play-tutor");
  });

  it("yields a deferred bank install plan to a positive semantic action", () => {
    const install = legalAction("install-broker-copy", "install_card");
    const draw = legalAction("draw", "draw_card");
    const deferredInstall = choice(install, -1096, [], {
      key: "runner_bank_install_commitment",
      value: -1600,
      reason: "why_bank_install_deferred:no_plausible_followup_load",
    });
    const positiveDraw = choice(draw, 78);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [positiveDraw, deferredInstall],
      bestHandCardMapping([install]),
      positiveDraw,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overriddenMappedChoice?.action.actionId).toBe(
      "install-broker-copy",
    );
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("keeps a positive stackable bank install inside its development plan", () => {
    const install = legalAction("install-stackable-bank", "install_card");
    const draw = legalAction("draw", "draw_card");
    const usefulInstall = choice(install, 854, [], {
      key: "runner_bank_install_commitment",
      value: 350,
      reason: "runner_bank_status:install_ready",
    });
    const positiveDraw = choice(draw, 1800);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [positiveDraw, usefulInstall],
      bestHandCardMapping([install]),
      positiveDraw,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("install-stackable-bank");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("draw");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("keeps tag-clear survival plan mapping over off-plan run pressure", () => {
    const removeTag = legalAction("remove-tag", "remove_tag");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 9000), choice(removeTag, 10)],
      tagClearMapping([removeTag]),
      choice(run, 9000),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("remove-tag");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.overrideThreshold).toBe(Number.POSITIVE_INFINITY);
  });

  it("keeps coverage-plan mapping for close semantic run gaps", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7600), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7600),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_outcome:semantic_choice_blocked",
      ]),
    );
  });

  it("keeps direct coverage answers even with a clear semantic run gap", () => {
    const prepare = legalAction("prepare-shell-traders", "trigger_ability");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 8200), choice(prepare, 6200)],
      coverageMapping([prepare]),
      choice(run, 8200),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("prepare-shell-traders");
    expect(result.overrideChoice).toBeUndefined();
  });

  it("lets a materially better safe information run precede direct breaker coverage", () => {
    const installBreaker = legalAction("install-decoder", "install_card");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const checkRun = choice(
      run,
      1064,
      scoreComponentEvidence("runner_free_server_path"),
      {
        key: "runner_run_target_semantic_guidance",
        value: -34,
        reason:
          "target:hq|recommendation:run_if_free|payoff:unknown|path:reachable|unavoidable_visible_ice_hazard_count:0",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [checkRun, choice(installBreaker, 780)],
      coverageMapping([installBreaker]),
      checkRun,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-hq");
    expect(result.overrideReason).toBe("coverage_probe_run_mapping_yield");
  });

  it("lets explicit runner economy commitments interrupt generic central pressure", () => {
    const broker = legalAction("broker-load", "trigger_ability");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const brokerChoice = choice(broker, 2400, [
      ...scoreComponentEvidence("runner_bank_investment_commitment"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [brokerChoice, choice(run, 950)],
      centralRunMapping([run]),
      brokerChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("broker-load");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBeUndefined();
  });

  it("lets a clearly better action override background bank building without funding need", () => {
    const broker = legalAction("broker-load", "activated_card_ability");
    const draw = legalAction("draw", "draw_card");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(draw, 1478), choice(broker, 782)],
      bankBuildMapping([broker]),
      choice(draw, 1478),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("broker-load");
    expect(result.overrideReason).toBe("background_bank_build_mapping_yield");
    expect(result.overrideThreshold).toBe(600);
  });

  it("keeps useful background bank building when alternatives are only marginally better", () => {
    const broker = legalAction("broker-load", "activated_card_ability");
    const draw = legalAction("draw", "draw_card");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(draw, 982), choice(broker, 782)],
      bankBuildMapping([broker]),
      choice(draw, 982),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("broker-load");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("lets a damage-pressure hand-buffer draw interrupt a slightly higher background bank score", () => {
    const broker = legalAction("broker-load", "activated_card_ability");
    const draw = legalAction("draw", "draw_card");
    const brokerChoice = choice(
      broker,
      1682,
      scoreComponentEvidence("runner_bank_investment_commitment"),
    );
    const drawChoice = choice(draw, 1478, [], {
      key: "runner_hand_buffer_need",
      value: 350,
      reason: "hand:3|damage_pressure:true|damage_threat:confirmed",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [brokerChoice, drawChoice],
      bankBuildMapping([broker]),
      brokerChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("broker-load");
    expect(result.overrideReason).toBe("background_bank_build_mapping_yield");
  });

  it("lets no-run economy setup hold interrupt generic central pressure", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const gainChoice = choice(gain, 1300, [
      ...scoreComponentEvidence("runner_no_run_economy_setup_hold"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [gainChoice, choice(run, -1000)],
      centralRunMapping([run]),
      gainChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBeUndefined();
  });

  it("does not let economy commitments bypass coverage-plan dominance", () => {
    const prepare = legalAction("prepare-shell-traders", "trigger_ability");
    const broker = legalAction("broker-load", "trigger_ability");
    const brokerChoice = choice(broker, 8200, [
      ...scoreComponentEvidence("runner_bank_investment_commitment"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [brokerChoice, choice(prepare, 0)],
      coverageMapping([prepare]),
      brokerChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("prepare-shell-traders");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("broker-load");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("lets known-agenda runs override mapped coverage setup events", () => {
    const bodyweight = legalAction("bodyweight", "play_event");
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const urgentRun = choice(run, 2703, [
      ...scoreComponentEvidence("runner_goal_fit_reachable_run"),
      ...scoreComponentEvidence("runner_hq_known_agenda"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [urgentRun, choice(bodyweight, 1328)],
      coverageMapping([bodyweight]),
      urgentRun,
    );

    expect(result.overrideChoice?.action.actionId).toBe("run-hq");
    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-hq");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("bodyweight");
  });

  it("lets fresh R&D agenda-pressure runs override mapped coverage setup events", () => {
    const draw = legalAction("draw", "draw_card");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const urgentRun = choice(run, 2603, [
      ...scoreComponentEvidence("runner_goal_fit_reachable_run"),
      ...scoreComponentEvidence("runner_rnd_fresh_memory"),
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [urgentRun, choice(draw, 1328)],
      coverageMapping([draw]),
      urgentRun,
    );

    expect(result.overrideChoice?.action.actionId).toBe("run-rd");
    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("draw");
  });

  it("keeps runner coverage plan mapping even when its mapped score is nonpositive", () => {
    const prepare = legalAction("prepare-stale", "trigger_ability");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7800), choice(prepare, 0)],
      coverageMapping([prepare]),
      choice(run, 7800),
    );

    expect(result.overrideChoice).toBeUndefined();
    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("prepare-stale");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.scoreGap).toBe(7800);
  });

  it("does not let strategic action fit bypass runner plan dominance", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7425, strategicEvidence("exact")), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7425, strategicEvidence("exact")),
    );

    expect(result.overrideChoice).toBeUndefined();
    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.overrideThreshold).toBe(Number.POSITIVE_INFINITY);
  });

  it("protects a strategic mapped action from a nonstrategic medium score gap", () => {
    const mappedRun = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7785), choice(mappedRun, 7025, strategicEvidence("exact"))],
      remoteContestMapping([mappedRun]),
      choice(run, 7785),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-remote");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
    expect(result.overrideThreshold).toBe(Number.POSITIVE_INFINITY);
    expect(result.choice?.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_mapping_override_blocked:true",
        "tactical_plan_override_blocked_reason:runner_plan_controller",
        "tactical_plan_mapping_score_gap_threshold:Infinity",
      ]),
    );
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

  it("uses a wider override gap for kind-level strategic fit", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 7485, strategicEvidence("kind")), choice(gain, 7025)],
      coverageMapping([gain]),
      choice(run, 7485, strategicEvidence("kind")),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideThreshold).toBe(480);
  });

  it("uses structured history server ids and ignores label-only repeat-run history", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-rd", "start_run", { serverId: "rd" });
    const labelOnly = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverLabel: "R&D" })]),
      [choice(gain, 7125), choice(run, 7025)],
      remoteContestMapping([run]),
      choice(gain, 7125),
    );
    const structured = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverId: "rd" })]),
      [choice(gain, 7125), choice(run, 7025)],
      remoteContestMapping([run]),
      choice(gain, 7125),
    );

    expect(labelOnly.outcome).toBe("semantic_choice_blocked");
    expect(labelOnly.choice?.action.actionId).toBe("run-rd");
    expect(structured.outcome).toBe("semantic_choice_selected");
    expect(structured.choice?.action.actionId).toBe("gain");
    expect(structured.overrideReason).toBe("repeated_run_mapping_yield");
  });

  it("yields a negative opportunistic repeat run to a positive run on another server", () => {
    const repeatedRd = legalAction("run-rd", "start_run", { serverId: "rd" });
    const freshRemote = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const result = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverId: "rd" })]),
      [choice(freshRemote, 1643), choice(repeatedRd, -1127)],
      centralRunMapping([repeatedRd]),
      choice(freshRemote, 1643),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-remote");
    expect(result.overriddenMappedChoice?.action.actionId).toBe("run-rd");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("keeps a repeated central run with a fresh visible payoff", () => {
    const repeatedRd = legalAction("run-rd", "start_run", { serverId: "rd" });
    const remote = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const mapped = choice(
      repeatedRd,
      -50,
      scoreComponentEvidence("runner_rnd_fresh_memory"),
      {
        key: "runner_rnd_fresh_memory",
        value: 900,
        reason: "fresh visible R&D memory",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverId: "rd" })]),
      [choice(remote, 1200), mapped],
      centralRunMapping([repeatedRd]),
      choice(remote, 1200),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("lets a stale plan run yield when generic goal fit is its only support", () => {
    const repeatedRd = legalAction("run-rd", "start_run", { serverId: "rd" });
    const remote = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const mapped = choice(
      repeatedRd,
      -50,
      scoreComponentEvidence("runner_goal_fit_tactical_goal_run_target"),
    );
    const result = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverId: "rd" })]),
      [choice(remote, 1200), mapped],
      centralRunMapping([repeatedRd]),
      choice(remote, 1200),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-remote");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("does not let a Corp install erase a same-window stale Runner run", () => {
    const repeatedHq = legalAction("run-hq", "start_run", { serverId: "hq" });
    const remote = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const corpInstall = {
      eventId: "corp-install",
      type: "install_card",
      stateVersionBefore: 19,
      stateVersionAfter: 20,
      stateHashAfter: "corp-install-hash",
      publicPayload: { actor: "corp", actionType: "install_card" },
    } as AiDecisionInput["eventTail"][number];
    const result = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverId: "hq" }), corpInstall]),
      [choice(remote, 1200), choice(repeatedHq, -50)],
      centralRunMapping([repeatedHq]),
      choice(remote, 1200),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-remote");
  });

  it("lets a no-funding recovery plan yield to positive pressure", () => {
    const gain = legalAction("gain", "gain_credit");
    const run = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const mapped = choice(
      gain,
      400,
      scoreComponentEvidence("runner_late_no_funding_credit_repeat"),
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 1200), mapped],
      creditBaseMapping([gain]),
      choice(run, 1200),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-remote");
    expect(result.overrideReason).toBe("low_value_recovery_mapping_yield");
  });

  it("keeps a repeated run when its plan carries an explicit score threat", () => {
    const repeatedRd = legalAction("run-rd", "start_run", { serverId: "rd" });
    const remote = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const result = tacticalPlanMappedChoice(
      aiInput([runEvent({ serverId: "rd" })]),
      [choice(remote, 1200), choice(repeatedRd, -50)],
      planMapping("runner.opportunistic_central_run", [repeatedRd], {
        evidence: ["runner_run_target_payoff:score_threat"],
      }),
      choice(remote, 1200),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-rd");
  });

  it("lets a nonpositive speculative central run yield to positive economy", () => {
    const rdRun = legalAction("run-rd", "start_run", { serverId: "rd" });
    const gain = legalAction("gain", "gain_credit");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(gain, 120), choice(rdRun, -40)],
      planMapping("runner.opportunistic_central_run", [rdRun]),
      choice(gain, 120),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("lets a substantially better central target override an opportunistic run plan", () => {
    const rdRun = legalAction("run-rd", "start_run", { serverId: "rd" });
    const archivesRun = legalAction("run-archives", "start_run", {
      serverId: "archives",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [
        choice(archivesRun, 1359),
        choice(rdRun, 453, [], {
          key: "runner_visible_ice_path_cost",
          value: -1360,
          reason: "server:rd;known_ice:2;break_cost:3;credits_after:0",
        }),
      ],
      centralRunMapping([rdRun]),
      choice(archivesRun, 1359),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("run-archives");
    expect(result.overrideReason).toBe("inferior_run_target_mapping_yield");
  });

  it("keeps an opportunistic R&D plan with fresh-card memory", () => {
    const rdRun = legalAction("run-rd", "start_run", { serverId: "rd" });
    const archivesRun = legalAction("run-archives", "start_run", {
      serverId: "archives",
    });
    const plannedRun = choice(
      rdRun,
      453,
      scoreComponentEvidence("runner_rnd_fresh_memory"),
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(archivesRun, 1359), plannedRun],
      centralRunMapping([rdRun]),
      choice(archivesRun, 1359),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-rd");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });

  it("lets an unpayable nonpositive run event yield to a positive action", () => {
    const rushHour = legalAction("rush-hour-rd", "play_event", {
      serverId: "rd",
      runnerEventRun: true,
    });
    const gain = legalAction("gain", "gain_credit");
    const mapped = choice(rushHour, -60, [
      "semantic_score_component:runner_run_target_semantic_guidance",
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(gain, 120), mapped],
      planMapping("runner.opportunistic_central_run", [rushHour]),
      choice(gain, 120),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("does not let a hand-development plan force a nonpositive run event", () => {
    const rushHour = legalAction("rush-hour-rd", "play_event", {
      serverId: "rd",
      runnerEventRun: true,
    });
    const gain = legalAction("gain", "gain_credit");
    const mapped = choice(rushHour, -60, [
      "semantic_score_component:runner_run_target_semantic_guidance",
    ]);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(gain, 120), mapped],
      planMapping("runner.play_best_hand_card", [rushHour], {
        stepKind: "install_development_card",
        priority: 920,
        evidence: ["economy_route:event_setup"],
      }),
      choice(gain, 120),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
  });

  it("does not let a best-hand plan force a positive but low-value run event", () => {
    const insideJob = legalAction("inside-job-hq", "play_event", {
      serverId: "hq",
      runnerEventRun: true,
    });
    const draw = legalAction("draw", "draw_card");
    const mapped = choice(insideJob, 150, [], {
      key: "runner_run_target_semantic_guidance",
      value: -42,
      reason:
        "target:hq|recommendation:gain_credits_first|payoff:unknown|path:reachable",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(draw, 898), mapped],
      planMapping("runner.play_best_hand_card", [insideJob], {
        stepKind: "install_development_card",
        evidence: ["previous_plan:runner.play_best_hand_card:inside-job"],
      }),
      choice(draw, 898),
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overrideReason).toBe("low_value_run_event_mapping_yield");
  });

  it("keeps score-threat remote contest funding over off-plan Archives runs", () => {
    const gain = legalAction("gain", "gain_credit");
    const archives = legalAction("run-archives", "start_run", {
      serverId: "archives",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(archives, 1359), choice(gain, 79)],
      remoteContestMapping([gain], {
        evidence: ["runner_run_target_payoff:score_threat"],
        priority: 960,
      }),
      choice(archives, 1359),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("run-archives");
    expect(result.overrideBlockedReason).toBe("remote_contest_plan_mapping");
    expect(result.overrideThreshold).toBe(3000);
  });

  it("keeps score-threat remote contest over off-plan coverage search", () => {
    const runRemote = legalAction("run-remote", "start_run", {
      serverId: "remote_1",
    });
    const shortCircuit = legalAction("short-circuit", "trigger_ability");
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(shortCircuit, 1427), choice(runRemote, -497)],
      remoteContestMapping([runRemote], {
        evidence: ["runner_run_target_payoff:score_threat"],
        priority: 960,
      }),
      choice(shortCircuit, 1427),
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-remote");
    expect(result.overrideChoice).toBeUndefined();
    expect(result.overrideBlockedChoice?.action.actionId).toBe("short-circuit");
    expect(result.overrideBlockedReason).toBe("runner_plan_controller");
  });
});

function scoreConversionMapping(
  actions: LegalAction[],
  overrides: {
    status?: "active" | "progressing" | "blocked";
    evidence?: string[];
  } = {},
): PlanStepMappingResult {
  const step = createPlanStep({
    stepId: "score_conversion:install_score_target:agenda",
    kind: "install_or_prepare_agenda",
    desiredActionSemantics: ["install.card", "scoreline"],
    actionCandidateIds: actions.map((action) => action.actionId),
  });
  return {
    plan: createTacticalPlan({
      planId: "corp.create_score_window:conversion:agenda",
      side: "corp",
      type: "corp.create_score_window",
      status: overrides.status ?? "active",
      priority: 970,
      horizonTurns: 1,
      target: { kind: "card", id: "agenda" },
      currentStep: step,
      evidence: overrides.evidence ?? [
        "corp_score_conversion_same_turn_guaranteed:true",
        "corp_score_sequence:same_turn_conversion",
      ],
      stateVersion: 1,
    }),
    step,
    status: "matched",
    actionCandidateIds: actions.map((action) => action.actionId),
    actionPriorities: [],
    legalActions: actions,
    rationale: [],
  };
}

function finiteEconomyMapping(actions: LegalAction[]): PlanStepMappingResult {
  const step = createPlanStep({
    stepId: "install_finite_economy:bbs",
    kind: "install_finite_economy",
    desiredActionSemantics: ["install.card", "economy.finite_pool"],
    actionCandidateIds: actions.map((action) => action.actionId),
  });
  return {
    plan: createTacticalPlan({
      planId: "corp.develop_finite_economy:bbs",
      side: "corp",
      type: "corp.develop_finite_economy",
      status: "active",
      priority: 760,
      horizonTurns: 3,
      target: { kind: "card", id: "bbs" },
      currentStep: step,
      stateVersion: 1,
    }),
    step,
    status: "matched",
    actionCandidateIds: actions.map((action) => action.actionId),
    actionPriorities: [],
    legalActions: actions,
    rationale: [],
  };
}

function scorelineSupportMapping(
  actions: LegalAction[],
  overrides: {
    stepKind?: "protect_remote" | "build_rez_reserve";
  } = {},
): PlanStepMappingResult {
  const stepKind = overrides.stepKind ?? "protect_remote";
  const step = createPlanStep({
    stepId: "protect_remote:agenda",
    kind: stepKind,
    desiredActionSemantics: ["install.card", "corp_window.rez"],
    actionCandidateIds: actions.map((action) => action.actionId),
  });
  return {
    plan: createTacticalPlan({
      planId: "corp.create_score_window:agenda",
      side: "corp",
      type: "corp.create_score_window",
      status: "progressing",
      priority: 940,
      horizonTurns: 3,
      target: { kind: "server", id: "remote_1" },
      currentStep: step,
      stateVersion: 1,
    }),
    step,
    status: "matched",
    actionCandidateIds: actions.map((action) => action.actionId),
    actionPriorities: [],
    legalActions: actions,
    rationale: [],
  };
}

function choice(
  action: LegalAction,
  score: number,
  evidence: string[] = [],
  component?: { key: string; value: number; reason: string },
): SemanticRuntimeChoice {
  return {
    action,
    scopeId:
      action.type === "start_run"
        ? "simple_hq_or_rnd_pressure"
        : "basic_economy_draw",
    score,
    scoreBreakdown: [
      {
        key: "test_score",
        label: "Test score",
        value: score,
        reason: "test",
      },
      ...(component
        ? [
            {
              key: component.key,
              label: "Focused component",
              value: component.value,
              reason: component.reason,
            },
          ]
        : []),
    ],
    reasonCode: `runner.semantic.${action.type}`,
    explanation: action.label,
    evidence,
  };
}

function strategicEvidence(targetMatch: "exact" | "kind"): string[] {
  return [
    "semantic_strategic_action_fit:true",
    `strategic_action_fit_target_match:${targetMatch}`,
  ];
}

function scoreComponentEvidence(key: string): string[] {
  return [`semantic_score_component:${key}`];
}

function coverageMapping(legalActions: LegalAction[]): PlanStepMappingResult {
  return planMapping("runner.obtain_breaker_coverage", legalActions);
}

function creditBaseMapping(
  legalActions: LegalAction[],
  overrides: {
    actionPriorities?: PlanStepMappingResult["actionPriorities"];
  } = {},
): PlanStepMappingResult {
  return planMapping("runner.build_credit_base", legalActions, overrides);
}

function centralRunMapping(legalActions: LegalAction[]): PlanStepMappingResult {
  return planMapping("runner.opportunistic_central_run", legalActions);
}

function bankBuildMapping(legalActions: LegalAction[]): PlanStepMappingResult {
  return planMapping("runner.build_credit_bank", legalActions, {
    stepKind: "build_bank_counter",
    evidence: ["runner_bank_concrete_funding_need:false"],
  });
}

function bestHandCardMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.play_best_hand_card", legalActions, {
    stepKind: "install_development_card",
  });
}

function fundedDevelopmentMapping(
  legalActions: LegalAction[],
): PlanStepMappingResult {
  return planMapping("runner.develop_hand_card", legalActions, {
    stepKind: "install_development_card",
    evidence: ["funded_hand_development_continuation:true"],
  });
}

function tagClearMapping(legalActions: LegalAction[]): PlanStepMappingResult {
  return planMapping("runner.clear_tags_or_survive", legalActions, {
    stepKind: "clear_tags",
  });
}

function remoteContestMapping(
  legalActions: LegalAction[],
  overrides: {
    evidence?: string[];
    priority?: number;
  } = {},
): PlanStepMappingResult {
  return planMapping("runner.contest_remote", legalActions, overrides);
}

function planMapping(
  type: string,
  legalActions: LegalAction[],
  overrides: {
    evidence?: string[];
    priority?: number;
    stepKind?: PlanStepMappingResult["step"]["kind"];
    actionPriorities?: PlanStepMappingResult["actionPriorities"];
  } = {},
): PlanStepMappingResult {
  const stepKind = overrides.stepKind ?? "gain_credits";
  return {
    status: "matched",
    plan: {
      planId: `${type}:remote_1`,
      side: "runner",
      type,
      status: "active",
      priority: overrides.priority ?? 100,
      horizonTurns: 1,
      target: { kind: "server", id: "remote_1" },
      requiredCapabilities: [],
      currentStep: {
        stepId: "gain_for_breaker",
        kind: stepKind,
        desiredActionSemantics: ["economy.gain_credit"],
        requiredCapabilities: [],
        rationale: [],
      },
      evidence: overrides.evidence ?? [],
      scoreBreakdown: [],
      stateVersion: 1,
    },
    step: {
      stepId: "gain_for_breaker",
      kind: stepKind,
      desiredActionSemantics: ["economy.gain_credit"],
      requiredCapabilities: [],
      rationale: [],
    },
    legalActions,
    actionCandidateIds: legalActions.map((action) => action.actionId),
    actionPriorities: overrides.actionPriorities ?? [],
    rationale: [],
  } as unknown as PlanStepMappingResult;
}

function legalAction(
  actionId: string,
  type: LegalAction["type"],
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type,
    label: actionId,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload,
  };
}

function aiInput(
  eventTail: AiDecisionInput["eventTail"] = [],
): AiDecisionInput {
  return {
    side: "runner",
    playerView: {
      stateVersion: 20,
      side: "runner",
      activeSide: "runner",
      phase: "runner_action_phase",
      timingPoint: "runner_action.main",
      own: {
        identity: {
          instanceId: "runner",
          definitionId: "runner",
          title: "Runner",
          owner: "runner",
          controller: "runner",
          type: "identity",
          known: true,
        },
        credits: 3,
        clicks: 2,
        agendaPoints: 0,
        gripOrHq: [],
        stackOrRdCount: 20,
        heapOrArchives: [],
        scoreArea: [],
        maxHandSize: 5,
        tags: 0,
      },
      opponent: {
        identity: {
          instanceId: "corp",
          definitionId: "corp",
          title: "Corp",
          owner: "corp",
          controller: "corp",
          type: "identity",
          known: true,
        },
        credits: 4,
        clicks: 3,
        agendaPoints: 0,
        tags: 0,
        handCount: 5,
        maxHandSize: 5,
        deckCount: 20,
        discardCount: 0,
        scoreArea: [],
      },
      servers: [],
      publicEvents: [],
      legalActions: [],
      winner: null,
      agendaPointsToWin: 7,
    },
    eventTail,
    legalActions: [],
    difficulty: "normal",
    seed: "semantic-choice-ranking-test",
    decisionId: "semantic-choice-ranking-test",
    actionNumber: 1,
    profileId: "semantic-choice-ranking-test",
  };
}

function runEvent(
  payload: Record<string, unknown>,
): AiDecisionInput["eventTail"][number] {
  return {
    eventId: `event-${JSON.stringify(payload)}`,
    type: "start_run",
    stateVersionBefore: 18,
    stateVersionAfter: 19,
    stateHashAfter: "test-hash",
    publicPayload: {
      actor: "runner",
      actionType: "start_run",
      ...payload,
    },
  } as AiDecisionInput["eventTail"][number];
}
