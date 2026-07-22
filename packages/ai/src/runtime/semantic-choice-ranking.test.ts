import { describe, expect, it } from "vitest";
import type { AiDecisionInput } from "@netgrid/shared";
import { tacticalPlanMappedChoice } from "./semantic-choice-ranking";
import {
  aiInput,
  bankBuildMapping,
  bestHandCardMapping,
  centralRunMapping,
  choice,
  coverageMapping,
  creditBaseMapping,
  fundedDevelopmentMapping,
  legalAction,
  planMapping,
  remoteContestMapping,
  runEvent,
  scoreComponentEvidence,
  strategicEvidence,
  tagClearMapping,
} from "./choice-ranking/semantic-choice-ranking.test-support";

describe("tacticalPlanMappedChoice Runner overrides", () => {
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
    const fundedInstall = choice(install, -1056, [], {
      key: "runner_persistent_install_fit",
      value: -480,
      reason:
        "delta:cumulative_capacity|duplicate:none|fit:-480|stackability:cumulative_capacity",
    });
    fundedInstall.scoreBreakdown.push({
      key: "runner_rich_delayed_economy_without_demand",
      label: "Verzögerte Economy ohne Bedarf",
      value: -900,
      reason:
        "credits:11|delayed_economy_demand:false|conversion_alternative:true",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [choice(run, 1903), fundedInstall],
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

  it("lets persistent trace-counter removal interrupt a credit-base plan", () => {
    const gain = legalAction("gain", "gain_credit");
    const removeCounter = legalAction(
      "remove-trace-counter",
      "trigger_ability",
    );
    const removeCounterChoice = choice(removeCounter, 1077, [], {
      key: "runner_goal_fit_persistent_trace_counter",
      value: 1050,
      reason:
        "runner_clicks:1|action_click_cost:1|counter_type:trace_tag_counter",
    });
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [removeCounterChoice, choice(gain, 779)],
      creditBaseMapping([gain]),
      removeCounterChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("remove-trace-counter");
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

  it("yields a marginal positive memory install to a much stronger draw", () => {
    const install = legalAction("install-memory", "install_card");
    const draw = legalAction("draw", "draw_card");
    const marginalInstall = choice(install, 2, [], {
      key: "runner_persistent_install_fit",
      value: 43,
      reason: "delta:cumulative_capacity|duplicate:none|fit:170",
    });
    const drawChoice = choice(draw, 1248);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drawChoice, marginalInstall],
      bestHandCardMapping([install]),
      drawChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
  });

  it("yields a weak cumulative install when a basic draw is clearly better", () => {
    const install = legalAction("install-memory-support", "install_card");
    const draw = legalAction("draw", "draw_card");
    const mappedInstall = choice(install, 88, [], {
      key: "runner_persistent_install_fit",
      value: 94,
      reason: "delta:cumulative_capacity|duplicate:useful_backup|fit:376",
    });
    const drawChoice = choice(draw, 348);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [drawChoice, mappedInstall],
      bestHandCardMapping([install]),
      drawChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("draw");
    expect(result.overrideReason).toBe("deferred_development_mapping_yield");
  });

  it("yields a rich delayed-economy install without demand to a positive hand action", () => {
    const install = legalAction("install-delayed-bank", "install_card");
    const event = legalAction("play-useful-event", "play_event");
    const mappedInstall = choice(install, -319, [], {
      key: "runner_rich_delayed_economy_without_demand",
      value: -900,
      reason:
        "credits:20|delayed_economy_demand:false|conversion_alternative:true",
    });
    const eventChoice = choice(event, 82);
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [eventChoice, mappedInstall],
      bestHandCardMapping([install]),
      eventChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("play-useful-event");
    expect(result.overrideReason).toBe("mapped_nonpositive_against_positive");
  });

  it("yields a low-delta development install to a materially stronger bank commitment", () => {
    const install = legalAction("install-pressure-hardware", "install_card");
    const bank = legalAction("load-bank", "activated_card_ability");
    const mappedInstall = choice(install, 707, [], {
      key: "runner_persistent_install_fit",
      value: 133,
      reason: "delta:new_coverage|duplicate:none|fit:530",
    });
    const bankChoice = choice(
      bank,
      1612,
      scoreComponentEvidence("runner_bank_investment_commitment"),
      {
        key: "runner_bank_investment_commitment",
        value: 1550,
        reason: "bankCommitmentStatus:build_second_load",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [bankChoice, mappedInstall],
      bestHandCardMapping([install]),
      bankChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("load-bank");
    expect(result.overriddenMappedChoice?.action.actionId).toBe(
      "install-pressure-hardware",
    );
  });

  it("lets confirmed-damage reaction reserve interrupt an opportunistic run", () => {
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const gain = legalAction("gain", "gain_credit");
    const gainChoice = choice(
      gain,
      1509,
      scoreComponentEvidence("runner_damage_locked_hand_reaction_reserve"),
      {
        key: "runner_damage_locked_hand_reaction_reserve",
        value: 650,
        reason: "level:confirmed|hand:3|effective_max:3|credits:6|clicks:1",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [gainChoice, choice(run, 844)],
      centralRunMapping([run]),
      gainChoice,
    );

    expect(result.outcome).toBe("semantic_choice_selected");
    expect(result.choice?.action.actionId).toBe("gain");
    expect(result.overrideReason).toBe("damage_reaction_reserve_mapping_yield");
  });

  it("keeps an immediate visible agenda run over reaction reserve", () => {
    const run = legalAction("run-hq", "start_run", { serverId: "hq" });
    const gain = legalAction("gain", "gain_credit");
    const runChoice = choice(
      run,
      844,
      scoreComponentEvidence("runner_hq_known_agenda"),
    );
    const gainChoice = choice(
      gain,
      1509,
      scoreComponentEvidence("runner_damage_locked_hand_reaction_reserve"),
      {
        key: "runner_damage_locked_hand_reaction_reserve",
        value: 650,
        reason: "level:confirmed|hand:3|effective_max:3|credits:6|clicks:1",
      },
    );
    const result = tacticalPlanMappedChoice(
      aiInput(),
      [gainChoice, runChoice],
      centralRunMapping([run]),
      gainChoice,
    );

    expect(result.outcome).toBe("semantic_choice_blocked");
    expect(result.choice?.action.actionId).toBe("run-hq");
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
