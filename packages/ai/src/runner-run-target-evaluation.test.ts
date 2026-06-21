import { describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import type { BeliefState, RunnerOpponentModel } from "./belief-state";
import {
  buildRunnerEconomyPosture,
  evaluateRunnerRunTargets,
  projectRunnerRunActions,
} from "./runner-run-target-evaluation";
import { rankKnownRemoteAccessTargets } from "./access/access-target-ranking";
import {
  RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
  type RunnerHandDevelopmentEvaluation,
} from "./runner-hand-development";

const WILSON_DEFINITION_ID = "onr_v1_187_wilson-weeflerunner-apprentice";
const ALL_HANDS_DEFINITION_ID = "onr_proteus_101_all-hands";
const RUSH_HOUR_DEFINITION_ID = "onr_proteus_122_rush-hour";
const ALL_NIGHTER_DEFINITION_ID = "onr_v1_076_all-nighter";
const SHREDDER_UPLINK_PROTOCOL_DEFINITION_ID =
  "onr_v1_062_shredder-uplink-protocol";
const KRASH_DEFINITION_ID = "onr_v1_039_krash";

describe("Runner RunTargetEvaluation + EconomyPosture", () => {
  it("recommends an unknown reachable R&D run", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      pathPassability: "reachable",
      recommendation: "run_now",
    });
  });

  it("suppresses R&D when the top card is stale known low value and no multiaccess is present", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "onr_v1_281_accounts-receivable",
      }),
    });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      multiaccessAvailable: false,
      recommendation: "do_not_run_now",
    });
  });

  it("uses installed HQ multiaccess hints to upgrade HQ pressure", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected R&D evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      multiaccessAvailable: true,
      recommendation: "run_now",
    });
    expect(evaluation.installedRunPayoff).toMatchObject({
      immediateAccessValue: 90,
      multiaccessAvailable: true,
    });
    expect(evaluation.evidence).toContain("installed_run_payoff:hq:multiaccess");
  });

  it("recognizes R&D multiaccess from structured hints beyond the legacy fallback list", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
      rig: [
        visibleCard("highlighter", {
          definitionId: "onr_proteus_090_highlighter",
          title: "Highlighter",
          type: "program",
          subtypes: ["virus"],
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "access_bonus",
      multiaccessAvailable: true,
      recommendation: "run_now",
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "installed_run_payoff:rd:multiaccess",
        "installed_run_payoff:rd:successful_run_counter",
      ]),
    );
  });

  it("uses installed HQ access-trash hints without exposing hidden cards", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
      rig: [
        visibleCard("crumble", {
          definitionId: "onr_proteus_084_crumble",
          title: "Crumble",
          type: "program",
          subtypes: ["virus"],
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      recommendation: "run_now",
    });
    expect(evaluation.installedRunPayoff.immediateAccessValue).toBeGreaterThan(0);
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "installed_run_payoff:hq:access_trash",
        "installed_run_payoff:hq:purge_tax",
      ]),
    );
    expect(evaluation.evidence.join("\n")).not.toMatch(
      /hidden|privatePayload|fullState|cardInstances/i,
    );
  });

  it("keeps known-low R&D damped even when installed R&D payoff exists", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd")],
      rig: [
        visibleCard("rd-interface", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
          type: "hardware",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "onr_v1_281_accounts-receivable",
      }),
    });
    if (!evaluation) throw new Error("Expected R&D evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      multiaccessAvailable: true,
      recommendation: "do_not_run_now",
    });
    expect(evaluation.evidence).toContain("installed_run_payoff:rd:multiaccess");
  });

  it("ranks HQ payoff above neutral R&D when only HQ Interface is installed", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });

    expect(evaluations[0]?.targetServerId).toBe("hq");
    expect(evaluations[0]?.evidence).toContain(
      "installed_run_payoff:hq:multiaccess",
    );
    expect(evaluations[1]?.targetServerId).toBe("rd");
  });

  it("ranks R&D payoff above neutral HQ when only R&D Interface is installed", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("rd-interface", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });

    expect(evaluations[0]?.targetServerId).toBe("rd");
    expect(evaluations[0]?.evidence).toContain(
      "installed_run_payoff:rd:multiaccess",
    );
    expect(evaluations[1]?.targetServerId).toBe("hq");
  });

  it("keeps HQ and R&D installed payoffs visible when both are present", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
        visibleCard("rd-interface", {
          definitionId: "onr_v1_139_r-and-d-interface",
          title: "R&D Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });
    const hq = evaluations.find((evaluation) => evaluation.targetServerId === "hq");
    const rd = evaluations.find((evaluation) => evaluation.targetServerId === "rd");

    expect(hq?.accessPayoff).toBe("access_bonus");
    expect(rd?.accessPayoff).toBe("access_bonus");
    expect(hq?.evidence).toContain("installed_run_payoff:hq:multiaccess");
    expect(rd?.evidence).toContain("installed_run_payoff:rd:multiaccess");
  });

  it("lets a known R&D agenda beat installed HQ multiaccess pressure", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "onr_v1_203_hostile-takeover",
        knownTopIsAgenda: true,
      }),
    });

    expect(evaluations[0]?.targetServerId).toBe("rd");
    expect(evaluations[0]?.accessPayoff).toBe("agenda");
    expect(evaluations[1]?.targetServerId).toBe("hq");
  });

  it("lets a remote score threat oversteer central future payoff", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("hq"),
        server("remote_1", {
          root: [
            visibleCard("remote-root-1", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        runAction("run-remote-1", "remote_1"),
      ],
      rig: [
        visibleCard("boardwalk", {
          definitionId: "onr_v1_008_boardwalk",
          title: "Boardwalk",
          type: "program",
          subtypes: ["virus"],
        }),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });

    expect(evaluations[0]?.targetServerId).toBe("remote_1");
    expect(evaluations[0]?.accessPayoff).toBe("score_threat");
    expect(evaluations[1]?.targetServerId).toBe("hq");
    expect(evaluations[1]?.evidence).toContain(
      "installed_run_payoff:hq:future_hq_info",
    );
  });

  it("treats a Blink-only remote score threat with one hand card as no-progress setup first", () => {
    const input = aiInput({
      credits: 8,
      servers: [
        server("remote_1", {
          ice: [barrierIce("remote-wall")],
          root: [
            visibleCard("remote-root", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
      rig: [
        visibleCard("runner-blink", {
          definitionId: "onr_v1_007_blink",
          title: "Blink",
          type: "program",
          subtypes: ["icebreaker"],
        }),
      ],
      grip: [visibleCard("grip-card-1", { definitionId: "simple_run_event" })],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "score_threat",
      scoreThreat: true,
      pathPassability: "blocked_by_blink_hand_buffer",
      recommendation: "draw_for_damage_buffer",
    });
    expect(evaluation?.blinkRiskAssessment).toMatchObject({
      blockedByHandBuffer: true,
      noProgressRunExpected: true,
      expectedEtrUnbroken: true,
      payoffOverride: "remote_score_threat",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "blinkPreRunRiskApplied:true",
        "blinkPathDependsOnBlink:true",
        "blinkBreakWouldBeExcludedInEncounter:true",
        "blocked_by_blink_hand_buffer:true",
        "blink_no_progress_run:true",
        "expected_etr_unbroken:true",
        "recommendation:draw_for_damage_buffer",
        "why_blink_run_deferred_for_hand_buffer:self_net_damage_buffer_too_low",
      ]),
    );
  });

  it("keeps remote contest reachable when stable wall coverage is installed", () => {
    const input = aiInput({
      credits: 10,
      servers: [
        server("remote_1", {
          ice: [barrierIce("remote-wall")],
          root: [
            visibleCard("remote-root", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
      rig: [
        visibleCard("runner-blink", {
          definitionId: "onr_v1_007_blink",
          title: "Blink",
          type: "program",
          subtypes: ["icebreaker"],
        }),
        visibleCard("runner-efficient-fracter", {
          definitionId: "efficient_fracter",
          title: "Efficient Fracter",
          type: "program",
          subtypes: ["icebreaker", "fracter"],
          strength: 2,
        }),
      ],
      grip: [visibleCard("grip-card-1", { definitionId: "simple_run_event" })],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "score_threat",
      pathPassability: "reachable",
      recommendation: "run_now",
    });
    expect(evaluation?.blinkRiskAssessment).toBeUndefined();
  });

  it("adds repeated-risk evidence after recent Blink failure on the same server", () => {
    const eventTail: PublicGameEvent[] = [
      syntheticPublicEvent("blink-run-started", 2, "run_started", {
        actionType: "start_run",
        actor: "runner",
        serverId: "remote_1",
      }),
      syntheticPublicEvent("blink-failed", 3, "break_subroutine", {
        actionType: "break_subroutine",
        actor: "runner",
        blinkBreakSuccess: false,
        blinkDamageAmount: 3,
      }),
    ];
    const input = aiInput({
      credits: 8,
      servers: [
        server("remote_1", {
          ice: [barrierIce("remote-wall")],
          root: [
            visibleCard("remote-root", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
      rig: [
        visibleCard("runner-blink", {
          definitionId: "onr_v1_007_blink",
          title: "Blink",
          type: "program",
          subtypes: ["icebreaker"],
        }),
      ],
      grip: [visibleCard("grip-card-1", { definitionId: "simple_run_event" })],
      eventTail,
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation?.blinkRiskAssessment).toMatchObject({
      recentFailure: true,
      recentDamageAmount: 3,
      sameServerRepeatedRiskPenalty: -900,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "recentBlinkFailure:true",
        "recentBlinkDamageAmount:3",
        "sameServerRepeatedBlinkRiskPenalty:-900",
        "repeated_no_progress_blink_run:true",
      ]),
    );
  });

  it("does not turn an unreachable payoff target into a legal run choice", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("hq", {
          ice: [
            visibleCard("hq-wall", {
              definitionId: "onr_v1_279_wall-of-static",
              title: "Wall of Static",
              type: "ice",
              subtypes: ["wall"],
              known: true,
              rezzed: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-hq", "hq")],
      rig: [
        visibleCard("hq-interface", {
          definitionId: "onr_v1_129_hq-interface",
          title: "HQ Interface",
          type: "hardware",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
    expect(evaluation.evidence).toContain("installed_run_payoff:hq:multiaccess");
  });

  it("evaluates Shredder as an Archives path with HQ access payoff", () => {
    const input = aiInput({
      credits: 4,
      servers: [
        server("archives", { ice: [wallOfStaticIce("archives-wall")] }),
        server("hq"),
      ],
      legalActions: [shredderAbilityAction()],
      rig: [
        visibleCard("shredder-installed", {
          definitionId: SHREDDER_UPLINK_PROTOCOL_DEFINITION_ID,
          title: "Shredder Uplink Protocol",
          type: "program",
        }),
        visibleCard("krash-installed", {
          definitionId: KRASH_DEFINITION_ID,
          title: "Krash",
          type: "program",
          subtypes: ["icebreaker"],
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq(["simple_agenda"], {
        handCount: 1,
        unknownRestCount: 0,
      }),
    });
    if (!evaluation) throw new Error("Expected Shredder evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "archives",
      targetKind: "archives",
      accessServerId: "hq",
      accessTargetKind: "hq",
      accessPayoff: "agenda",
      knownAccessState: "known_payoff",
      pathPassability: "blocked_unpayable",
      pathCost: 6,
      recommendation: "gain_credits_first",
      runActionProjection: {
        sourceKind: "program_ability",
        sourceCardId: SHREDDER_UPLINK_PROTOCOL_DEFINITION_ID,
        targetServerId: "archives",
        accessServerId: "hq",
      },
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "access_server:hq",
        "access_target_kind:hq",
        "central_memory_payoff:agenda",
      ]),
    );
    expect(evaluation.runActionProjection.evidence).toEqual(
      expect.arrayContaining(["run_action_projection_access_server:hq"]),
    );
  });

  it("suppresses HQ when every HQ card is known and has no current access payoff", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
    });
    input.playerView.opponent.handCount = 2;

    const evaluations = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq([
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
      ]),
    });
    const hqEvaluation = evaluations.find(
      (evaluation) => evaluation.targetServerId === "hq",
    );

    expect(hqEvaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
    });
    expect(hqEvaluation?.evidence).toContain("central_memory_payoff:known");
    expect(hqEvaluation?.evidence).toContain("hq_all_cards_known:true");
  });

  it("downranks HQ when four of five cards are known low value and no multiaccess is present", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [runAction("run-hq", "hq"), runAction("run-rd", "rd")],
    });

    const evaluations = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq(
        [
          "onr_v1_230_cortical-scanner",
          "onr_v1_237_data-wall",
          "onr_v1_281_accounts-receivable",
          "simple_economy_operation",
        ],
        { handCount: 5, unknownRestCount: 1 },
      ),
    });
    const hq = evaluations.find(
      (evaluation) => evaluation.targetServerId === "hq",
    );
    const rd = evaluations.find(
      (evaluation) => evaluation.targetServerId === "rd",
    );
    if (!hq || !rd) throw new Error("Expected central evaluations");

    expect(hq).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      recommendation: "run_if_free",
    });
    expect(hq.score).toBeLessThan(rd.score);
    expect(evidenceNumber(hq.evidence, "access_payoff_score_adjustment")).toBeLessThan(0);
    expect(hq.evidence).toEqual(
      expect.arrayContaining([
        "hq_hand_known_count:4",
        "hq_hand_count:5",
        "hq_known_fraction:0.8",
        "hq_unknown_fraction:0.2",
        "hq_known_low_value_count:4",
        "hq_knownness_payoff:mostly_known_low_value",
      ]),
    );
  });

  it("keeps HQ attractive as unknown when only one of five cards is known", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq(["onr_v1_237_data-wall"], {
        handCount: 5,
        unknownRestCount: 4,
      }),
    });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      recommendation: "run_if_free",
    });
    expect(evidenceNumber(evaluation.evidence, "access_payoff_score_adjustment")).toBe(0);
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "hq_known_fraction:0.2",
        "hq_unknown_fraction:0.8",
        "hq_knownness_payoff:meaningful_unknown_rest",
      ]),
    );
  });

  it("reduces but keeps the high-known HQ low-value penalty when HQ multiaccess is installed", () => {
    const baseParams = {
      credits: 6,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    };
    const beliefState = beliefWithKnownHq(
      [
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
        "onr_v1_281_accounts-receivable",
        "simple_economy_operation",
      ],
      { handCount: 5, unknownRestCount: 1 },
    );
    const [withoutMultiaccess] = evaluateRunnerRunTargets({
      input: aiInput(baseParams),
      beliefState,
    });
    const [withMultiaccess] = evaluateRunnerRunTargets({
      input: aiInput({
        ...baseParams,
        rig: [
          visibleCard("hq-interface", {
            definitionId: "onr_v1_129_hq-interface",
            title: "HQ Interface",
            type: "hardware",
          }),
        ],
      }),
      beliefState,
    });
    if (!withoutMultiaccess || !withMultiaccess) {
      throw new Error("Expected HQ evaluations");
    }

    const noMultiPenalty = Math.abs(
      evidenceNumber(withoutMultiaccess.evidence, "access_payoff_score_adjustment"),
    );
    const multiPenalty = Math.abs(
      evidenceNumber(withMultiaccess.evidence, "access_payoff_score_adjustment"),
    );

    expect(withoutMultiaccess).toMatchObject({
      accessPayoff: "unknown",
      multiaccessAvailable: false,
    });
    expect(withMultiaccess).toMatchObject({
      accessPayoff: "access_bonus",
      knownAccessState: "unknown",
      multiaccessAvailable: true,
      recommendation: "run_now",
    });
    expect(multiPenalty).toBeGreaterThan(0);
    expect(multiPenalty).toBeLessThan(noMultiPenalty);
    expect(withMultiaccess.evidence).toEqual(
      expect.arrayContaining([
        "hq_access_depth_estimate:2",
        "hq_unknown_access_chance_estimate:0.4",
        "hq_knownness_payoff:mostly_known_low_value",
        "installed_run_payoff:hq:multiaccess",
      ]),
    );
  });

  it("projects Wilson's constrained run ability into HQ knownness evaluation", () => {
    const wilson = wilsonRunAbilityAction("wilson-hq-run", "hq");
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [wilson],
      rig: [
        visibleCard("wilson-installed", {
          definitionId: WILSON_DEFINITION_ID,
          title: "Wilson, Weeflerunner Apprentice",
          type: "resource",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq(
        [
          "onr_v1_230_cortical-scanner",
          "onr_v1_237_data-wall",
          "onr_v1_281_accounts-receivable",
          "simple_economy_operation",
        ],
        { handCount: 5, unknownRestCount: 1 },
      ),
    });
    if (!evaluation) throw new Error("Expected Wilson HQ evaluation");

    expect(evaluation).toMatchObject({
      actionId: "wilson-hq-run",
      targetServerId: "hq",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      recommendation: "run_if_free",
      runActionProjection: {
        sourceKind: "resource_ability",
        sourceCardId: WILSON_DEFINITION_ID,
        spendLimit: 3,
        structure: "direct_start_run",
      },
    });
    expect(evidenceNumber(evaluation.evidence, "access_payoff_score_adjustment")).toBeLessThan(0);
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "run_action_projection_status:concrete_target",
        "run_action_projection_spend_limit:3",
        "hq_knownness_payoff:mostly_known_low_value",
      ]),
    );
  });

  it("marks Wilson's direct run blocked when the visible path exceeds its spend cap", () => {
    const wilson = wilsonRunAbilityAction("wilson-expensive-hq-run", "hq");
    const input = aiInput({
      credits: 10,
      servers: [
        server("hq", {
          ice: [expensiveBarrierIce("hq-expensive-wall")],
        }),
      ],
      legalActions: [wilson],
      rig: [
        visibleCard("wilson-installed", {
          definitionId: WILSON_DEFINITION_ID,
          title: "Wilson, Weeflerunner Apprentice",
          type: "resource",
        }),
        visibleCard("runner-efficient-fracter", {
          definitionId: "efficient_fracter",
          title: "Efficient Fracter",
          type: "program",
          subtypes: ["icebreaker", "fracter"],
          strength: 3,
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected Wilson expensive HQ evaluation");

    expect(evaluation).toMatchObject({
      actionId: "wilson-expensive-hq-run",
      targetServerId: "hq",
      pathPassability: "blocked_unpayable",
      pathCost: 4,
      runActionProjection: {
        sourceKind: "resource_ability",
        spendLimit: 3,
      },
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "path_cost:4",
        "run_action_projection_spend_limit:3",
        "run_action_projection_spend_limit_blocks_path:true",
      ]),
    );
  });

  it("projects Wilson's constrained run ability as high value when HQ contains a known agenda", () => {
    const wilson = wilsonRunAbilityAction("wilson-known-agenda-hq", "hq");
    const input = aiInput({
      credits: 6,
      servers: [server("hq")],
      legalActions: [wilson],
      rig: [
        visibleCard("wilson-installed", {
          definitionId: WILSON_DEFINITION_ID,
          title: "Wilson, Weeflerunner Apprentice",
          type: "resource",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithKnownHq(["simple_agenda"], {
        handCount: 1,
        unknownRestCount: 0,
      }),
    });
    if (!evaluation) throw new Error("Expected Wilson known-agenda evaluation");

    expect(evaluation).toMatchObject({
      actionId: "wilson-known-agenda-hq",
      targetServerId: "hq",
      accessPayoff: "agenda",
      knownAccessState: "known_payoff",
      recommendation: "run_now",
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "run_action_projection_source_card:onr_v1_187_wilson-weeflerunner-apprentice",
        "central_memory_payoff:agenda",
      ]),
    );
  });

  it("projects All-Hands as HQ multiaccess and offsets a high-known low-value HQ penalty", () => {
    const beliefState = beliefWithKnownHq(
      [
        "onr_v1_230_cortical-scanner",
        "onr_v1_237_data-wall",
        "onr_v1_281_accounts-receivable",
        "simple_economy_operation",
      ],
      { handCount: 5, unknownRestCount: 1 },
    );
    const [wilsonBaseline] = evaluateRunnerRunTargets({
      input: aiInput({
        credits: 6,
        servers: [server("hq")],
        legalActions: [wilsonRunAbilityAction("wilson-hq-run", "hq")],
      }),
      beliefState,
    });
    const [allHands] = evaluateRunnerRunTargets({
      input: aiInput({
        credits: 6,
        servers: [server("hq")],
        legalActions: [
          runEventAction("all-hands-hq", ALL_HANDS_DEFINITION_ID, "All-Hands"),
        ],
      }),
      beliefState,
    });
    if (!wilsonBaseline || !allHands) {
      throw new Error("Expected Wilson and All-Hands HQ evaluations");
    }

    expect(allHands).toMatchObject({
      actionId: "all-hands-hq",
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      knownAccessState: "unknown",
      multiaccessAvailable: true,
      runActionProjection: {
        sourceKind: "event",
        sourceCardId: ALL_HANDS_DEFINITION_ID,
        noNoisyBreakers: true,
      },
    });
    expect(allHands.score).toBeGreaterThan(wilsonBaseline.score);
    expect(allHands.evidence).toEqual(
      expect.arrayContaining([
        "hq_knownness_payoff:mostly_known_low_value",
        "run_action_payoff:hq:multiaccess",
        "run_action_projection_no_noisy_breakers:true",
      ]),
    );
  });

  it("projects Rush Hour as R&D multiaccess using the same target evaluation path", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [
        runEventAction("rush-hour-rd", RUSH_HOUR_DEFINITION_ID, "Rush Hour"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected Rush Hour R&D evaluation");

    expect(evaluation).toMatchObject({
      actionId: "rush-hour-rd",
      targetServerId: "rd",
      accessPayoff: "access_bonus",
      multiaccessAvailable: true,
      recommendation: "run_now",
      runActionProjection: {
        sourceKind: "event",
        sourceCardId: RUSH_HOUR_DEFINITION_ID,
        targetKind: "rd",
      },
    });
    expect(evaluation.evidence).toContain("run_action_payoff:rd:multiaccess");
  });

  it("keeps run-event projections conservative when no side-safe target options exist", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [
        runEventAction("all-nighter-no-target", ALL_NIGHTER_DEFINITION_ID, "All-Nighter"),
      ],
    });

    const projections = projectRunnerRunActions({ input });
    const evaluations = evaluateRunnerRunTargets({ input });

    expect(projections).toHaveLength(1);
    expect(projections[0]).toMatchObject({
      actionId: "all-nighter-no-target",
      projectionStatus: "missing_target_options",
    });
    expect(projections[0]?.evidence).toContain(
      "run_action_projection_missing_target_options:true",
    );
    expect(evaluations).toEqual([]);
  });

  it("does not turn a blocked path into a reachable run just because the action has multiaccess", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("hq", {
          ice: [
            visibleCard("hq-data-wall", {
              definitionId: "onr_v1_237_data-wall",
              title: "Data Wall",
              type: "ice",
              known: true,
              rezzed: true,
              subtypes: ["wall"],
            }),
          ],
        }),
      ],
      legalActions: [
        runEventAction("blocked-all-hands", ALL_HANDS_DEFINITION_ID, "All-Hands"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });
    if (!evaluation) throw new Error("Expected blocked All-Hands evaluation");

    expect(evaluation).toMatchObject({
      actionId: "blocked-all-hands",
      targetServerId: "hq",
      accessPayoff: "access_bonus",
      multiaccessAvailable: true,
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
  });

  it("suppresses a known remote root with no current access payoff", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-root-1", {
              definitionId: "onr_v1_281_accounts-receivable",
              type: "operation",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "known_no_current_payoff",
    });
  });

  it("defers a known remote trash target when trash would break reserve", () => {
    const input = aiInput({
      credits: 4,
      servers: [
        server("remote_1", {
          ice: [
            visibleCard("remote-vacuum-link", {
              definitionId: "onr_v1_275_vacuum-link",
              title: "Vacuum Link",
              type: "ice",
              subtypes: ["sentry", "random"],
              known: true,
              rezzed: true,
            }),
          ],
          root: [
            visibleCard("remote-euromarket", {
              definitionId: "onr_v1_322_euromarket-consortium",
              title: "Euromarket Consortium",
              type: "asset",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-remote-1", "remote_1"),
        gainCreditAction("gain-credit"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "trash_unaffordable",
      knownAccessState: "known_no_current_payoff",
      recommendation: "gain_credits_first",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "pre_run_access_decision:defer_until_funded",
        "trash_decline_reason:reserve_would_break",
        "known_remote_access_commitment_intended_action:decline",
        "known_remote_access_commitment_reason:reserve_would_break",
        "known_remote_root_credits_after_trash:0",
        "known_remote_root_trash_preserves_reserve:false",
        "known_remote_run_no_progress_context:visible_random_ice",
      ]),
    );
  });

  it("keeps a known remote trash target valuable when trash preserves reserve", () => {
    const input = aiInput({
      credits: 8,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-euromarket", {
              definitionId: "onr_v1_322_euromarket-consortium",
              title: "Euromarket Consortium",
              type: "asset",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "trash_affordable",
      knownAccessState: "known_payoff",
      recommendation: "run_now",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "pre_run_access_decision:trash",
        "known_remote_root_credits_after_trash:4",
        "known_remote_root_trash_preserves_reserve:true",
      ]),
    );
  });

  it("uses own installed trash credits for known remote trash commitment", () => {
    const input = aiInput({
      credits: 6,
      rig: [
        visibleCard("runner-poltergeist", {
          definitionId: "onr_v1_048_poltergeist",
          title: "Poltergeist",
          type: "program",
          known: true,
        }),
      ],
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-euromarket", {
              definitionId: "onr_v1_322_euromarket-consortium",
              title: "Euromarket Consortium",
              type: "asset",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "trash_affordable",
      knownAccessState: "known_payoff",
      recommendation: "run_now",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "known_remote_root_trash_dedicated_credits:2",
        "known_remote_root_general_trash_cost:2",
        "known_remote_root_credits_after_trash:4",
        "known_remote_root_trash_support_source:onr_v1_048_poltergeist",
      ]),
    );
  });

  it("keeps active declined-trash memory visible as its own remote recommendation", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("spent-event", {
              definitionId: "spent-event",
              title: "Spent event",
              type: "event",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      accessOutcomeMemory: {
        applies: true,
        suppressesPlanBonus: true,
        evidence: ["test_declined_memory"],
      },
    });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      knownAccessState: "known_no_current_payoff",
      recommendation: "declined_trash_memory_active",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_target_access_memory_applies:true",
        "run_target_access_memory_suppresses_plan_bonus:true",
        "recommendation:declined_trash_memory_active",
      ]),
    );
  });

  it("reassesses a remote when access memory was invalidated by fingerprint change", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("spent-event", {
              definitionId: "spent-event",
              title: "Spent event",
              type: "event",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      accessOutcomeMemory: {
        applies: false,
        invalidationReason: "remote_fingerprint_changed",
        suppressesPlanBonus: false,
        evidence: ["test_remote_changed"],
      },
    });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      recommendation: "remote_changed_reassess",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_target_access_memory_invalidation:remote_fingerprint_changed",
        "recommendation:remote_changed_reassess",
      ]),
    );
  });

  it("adds ranked access target evidence to remote run evaluations", () => {
    const input = aiInput({
      credits: 8,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-euromarket", {
              definitionId: "onr_v1_322_euromarket-consortium",
              title: "Euromarket Consortium",
              type: "asset",
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });
    const rankedAccessTargets = rankKnownRemoteAccessTargets([
      {
        positionKey: "root:0",
        instanceId: "remote-euromarket",
        definitionId: "onr_v1_322_euromarket-consortium",
        targetKind: "asset",
        valueScore: 3,
        commitment: {
          serverId: "remote_1",
          knownAccessState: "known_payoff",
          intendedAccessAction: "trash",
          reason: "trash_affordable",
          evidence: [],
        },
        projection: {
          source: "pre_run",
          serverId: "remote_1",
          knownRootDefinitionId: "onr_v1_322_euromarket-consortium",
          target: "asset",
          intendedAccessAction: "trash",
          projections: ["asset_trash"],
          evidence: [],
        },
      },
    ]);

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      rankedAccessTargets,
    });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      recommendation: "run_now",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_target_ranked_access_position:root:0",
        "run_target_ranked_access_intent:trash",
        "run_target_ranked_access_reason:trash_affordable",
      ]),
    );
  });

  it("turns a remote score threat behind visible unbreakable ICE into find-breaker setup", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_2", {
          ice: [
            visibleCard("remote-ice-1", {
              definitionId: "onr_v1_279_wall-of-static",
              title: "Wall of Static",
              type: "ice",
              subtypes: ["wall"],
              known: true,
              rezzed: true,
            }),
          ],
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-2", "remote_2")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_2",
      scoreThreat: true,
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
  });

  it("prefers economy when credits are below the run floor and no high payoff exists", () => {
    const input = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({ input });
    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(posture).toMatchObject({
      minimumCreditFloor: 2,
      fundingNeed: true,
      recommendation: "build_economy",
    });
    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      recommendation: "gain_credits_first",
    });
  });

  it("builds a creditbase funding need for useful hand cards blocked by credits", () => {
    const input = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });
    const handDevelopmentEvaluations = [
      handDevelopmentEvaluation({
        developmentRole: "access_payoff",
        availability: "missing_credits",
        currentNeed: "useful_now",
        priority: 650,
        fundingNeed: {
          installOrPlayCost: 4,
          missingCredits: 4,
          reason: "cannot_pay",
        },
      }),
    ];

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations,
    });
    const [evaluation] = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations,
    });

    expect(posture.creditBasePlan).toMatchObject({
      currentCredits: 0,
      desiredCreditReserve: 4,
      fundingNeed: true,
      usefulHandCardsBlockedByCredits: 1,
      recommendation: "fund_useful_hand_card",
      economyPriority: "high",
    });
    expect(posture.creditBasePlan.topBlockedHandCandidate).toMatchObject({
      developmentRole: "access_payoff",
      currentNeed: "useful_now",
      installOrPlayCost: 4,
      missingCredits: 4,
    });
    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      recommendation: "gain_credits_first",
    });
  });

  it("allows setup spending at five credits when a useful hand card is legal", () => {
    const input = aiInput({
      credits: 5,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "memory_support",
          availability: "legal_now",
          currentNeed: "setup",
          priority: 620,
        }),
      ],
    });

    expect(posture.creditBasePlan).toMatchObject({
      currentCredits: 5,
      fundingNeed: false,
      usefulHandCardsAffordableNow: 1,
      recommendation: "allow_setup_spend",
      economyPriority: "low",
    });
    expect(posture.recommendation).toBe("stable");
  });

  it("raises contest reserve when a visible remote score threat exists", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("remote_2", {
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-remote-2", "remote_2"),
        gainCreditAction("gain-credit"),
      ],
    });

    const posture = buildRunnerEconomyPosture({ input });
    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(posture.creditReservePolicy).toMatchObject({
      phase: "late_contest",
      remoteScoreThreat: "urgent",
      contestReserve: 8,
      desiredCreditReserve: 8,
      belowReserveNow: true,
      canContestIfFunded: true,
    });
    expect(posture.creditBasePlan).toMatchObject({
      recommendation: "build_credit_base",
      economyPriority: "high",
      fundingNeed: true,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "remote_score_threat:urgent",
        "contest_reserve:8",
        "desired_credit_reserve:8",
      ]),
    );
  });

  it("keeps creditbase conservative when hand development only finds unknown or low-value cards", () => {
    const input = aiInput({
      credits: 4,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "unknown",
          availability: "missing_credits",
          currentNeed: "none",
          strategicFit: "weak",
          priority: 800,
          fundingNeed: {
            installOrPlayCost: 6,
            missingCredits: 2,
            reason: "cannot_pay",
          },
        }),
      ],
    });

    expect(posture.creditBasePlan).toMatchObject({
      fundingNeed: false,
      usefulHandCardsBlockedByCredits: 0,
      recommendation: "preserve_reserve",
    });
    expect(posture.creditBasePlan.topBlockedHandCandidate).toBeUndefined();
  });

  it("funds unknown remote score-threat pressure when below contest reserve", () => {
    const input = aiInput({
      credits: 2,
      servers: [
        server("remote_2", {
          root: [
            visibleCard("remote-root-2", {
              known: false,
              advancementCounters: 2,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-2", "remote_2")],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      handDevelopmentEvaluations: [
        handDevelopmentEvaluation({
          developmentRole: "access_payoff",
          availability: "missing_credits",
          currentNeed: "useful_now",
          priority: 650,
          fundingNeed: {
            installOrPlayCost: 4,
            missingCredits: 2,
            reason: "cannot_pay",
          },
        }),
      ],
    });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_2",
      scoreThreat: true,
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
    });
  });
});

function aiInput(params: {
  credits: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  grip?: VisibleCard[];
  eventTail?: PublicGameEvent[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: 1,
    side: "runner",
    activeSide: "runner",
    phase: "runner_action_phase",
    timingPoint: "runner_action.main",
    own: {
      identity: visibleIdentity("runner"),
      credits: params.credits,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: params.grip ?? [],
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: params.rig ?? [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: visibleIdentity("corp"),
      credits: 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 20,
      discardCount: 0,
      scoreArea: [],
    },
    servers: params.servers,
    publicEvents: params.eventTail ?? [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: params.eventTail ?? [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-run-target-test",
    decisionId: "runner-run-target-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function syntheticPublicEvent(
  eventId: string,
  stateVersionAfter: number,
  type: string,
  publicPayload: Record<string, unknown>,
): PublicGameEvent {
  return {
    eventId,
    type,
    stateVersionBefore: stateVersionAfter - 1,
    stateVersionAfter,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  overrides: Partial<PlayerView["servers"][number]> = {},
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice: [],
    root: [],
    ...overrides,
  };
}

function runAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Run ${serverId}`,
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { serverId },
  };
}

function wilsonRunAbilityAction(actionId: string, serverId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "start_run",
    label: `Wilson run ${serverId}`,
    source: "wilson-installed",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: {
      cardId: "wilson-installed",
      sourceDefinitionId: WILSON_DEFINITION_ID,
      runnerAbility: "gain_run_only_action",
      serverId,
      runOnlyAction: true,
      runOnlyActionSourceCardId: "wilson-installed",
      runSpendingCap: 3,
    },
  };
}

function runEventAction(
  actionId: string,
  sourceDefinitionId: string,
  label: string,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "play_event",
    label,
    source: "card",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { sourceDefinitionId },
  };
}

function shredderAbilityAction(actionId = "shredder-archives-hq"): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "activated_card_ability",
    label: "Shredder Uplink Protocol: Run auf Archive",
    source: "shredder-installed",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: { cardId: "shredder-installed" },
  };
}

function gainCreditAction(actionId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "gain_credit",
    label: "Gain credit",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
}

function visibleIdentity(side: Side): VisibleCard {
  return {
    instanceId: `${side}-identity`,
    definitionId: `${side}-identity`,
    title: `${side} identity`,
    owner: side,
    controller: side,
    type: "identity",
    known: true,
  };
}

function visibleCard(
  instanceId: string,
  overrides: Omit<Partial<VisibleCard>, "instanceId"> = {},
): VisibleCard {
  return {
    instanceId,
    known: true,
    ...overrides,
  };
}

function barrierIce(instanceId: string): VisibleCard {
  return visibleCard(instanceId, {
    definitionId: "simple_barrier_ice",
    title: "Simple Barrier ICE",
    type: "ice",
    subtypes: ["barrier"],
    known: true,
    rezzed: true,
    strength: 3,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "simple_barrier_ice",
      effectiveStrength: 3,
      subroutines: [{ id: "simple_barrier_ice_etr", type: "end_the_run" }],
    },
  });
}

function expensiveBarrierIce(instanceId: string): VisibleCard {
  return visibleCard(instanceId, {
    definitionId: "simple_barrier_ice",
    title: "Expensive Barrier ICE",
    type: "ice",
    subtypes: ["barrier"],
    known: true,
    rezzed: true,
    strength: 6,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "simple_barrier_ice",
      effectiveStrength: 6,
      subroutines: [{ id: "expensive_barrier_ice_etr", type: "end_the_run" }],
    },
  });
}

function wallOfStaticIce(instanceId: string): VisibleCard {
  return visibleCard(instanceId, {
    definitionId: "onr_v1_279_wall-of-static",
    title: "Wall of Static",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 2,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_279_wall-of-static",
      effectiveStrength: 2,
      subroutines: [
        {
          id: `${instanceId}_etr`,
          type: "end_the_run",
        },
      ],
    },
  });
}

function handDevelopmentEvaluation(
  overrides: Partial<RunnerHandDevelopmentEvaluation>,
): RunnerHandDevelopmentEvaluation {
  return {
    schemaVersion: RUNNER_HAND_DEVELOPMENT_EVALUATION_SCHEMA_VERSION,
    cardInstanceId: "runner-hand-card",
    availability: "missing_credits",
    developmentRole: "access_payoff",
    strategicFit: "strong",
    currentNeed: "useful_now",
    priority: 600,
    deferReason: "missing_credits",
    evidence: ["source:own_runner_hand"],
    ...overrides,
  };
}

function evidenceNumber(evidence: string[], key: string): number {
  const prefix = `${key}:`;
  const raw = evidence.find((entry) => entry.startsWith(prefix))?.slice(
    prefix.length,
  );
  const value = raw !== undefined ? Number(raw) : Number.NaN;
  if (!Number.isFinite(value)) {
    throw new Error(`Missing numeric evidence for ${key}`);
  }
  return value;
}

function beliefWithRndTop(params: {
  freshness: RunnerOpponentModel["rndTopFreshness"]["freshness"];
  knownTopDefinitionId?: string;
  knownTopIsAgenda?: boolean;
}): BeliefState {
  const rndTopFreshness: RunnerOpponentModel["rndTopFreshness"] = {
    lastKnownAccessEventId: "test-access-rd",
    knownToRunner: true,
    freshness: params.freshness,
    ...(params.knownTopDefinitionId
      ? { knownTopDefinitionId: params.knownTopDefinitionId }
      : {}),
    ...(params.knownTopIsAgenda !== undefined
      ? { knownTopIsAgenda: params.knownTopIsAgenda }
      : {}),
    invalidationReasons: [],
  };
  return {
    side: "runner",
    version: "belief-test",
    entries: [],
    assumptions: [],
    uncertainty: [],
    invalidationLog: [],
    eventClassifications: [],
    runnerOpponentModel: {
      corpPlanEstimate: {
        scoring: 0,
        economy: 0,
        protection: 0,
      },
      remoteCardBelief: [],
      unrezzedIceRiskModel: [],
      hqAgendaDensityEstimate: 0,
      rndValueEstimate: 0,
      corpCreditReserveInterpretation: "medium",
      rndTopFreshness,
      knownPositionMemory: [],
      hqHandMemory: {
        handCount: 5,
        knownDefinitions: [],
        knownCount: 0,
        allCardsKnown: false,
        sourceEventIds: [],
        invalidationReasons: [],
        ledger: {
          safeDefinitions: [],
          unknownRestCount: 5,
          candidateGroups: [],
          sourceEventIds: [],
          invalidationReasons: [],
        },
      },
      hiddenRemoteCandidateMemory: [],
    },
    rndTopFreshness,
    knownPositionMemory: [],
  };
}

function beliefWithKnownHq(
  knownDefinitions: string[],
  options: {
    handCount?: number;
    unknownRestCount?: number;
  } = {},
): BeliefState {
  const rndTopFreshness: RunnerOpponentModel["rndTopFreshness"] = {
    lastKnownAccessEventId: "test-invalidated-rd",
    knownToRunner: false,
    freshness: "invalidated",
    invalidationReasons: [],
  };
  const safeDefinitions = knownDefinitions.map((definitionId) => ({
    definitionId,
    count: 1,
    sourceEventIds: ["test-hq-look"],
  }));
  const handCount = options.handCount ?? knownDefinitions.length;
  const unknownRestCount = options.unknownRestCount ??
    Math.max(0, handCount - knownDefinitions.length);
  return {
    side: "runner",
    version: "belief-test",
    entries: [],
    assumptions: [],
    uncertainty: [],
    invalidationLog: [],
    eventClassifications: [],
    runnerOpponentModel: {
      corpPlanEstimate: {
        scoring: 0,
        economy: 0,
        protection: 0,
      },
      remoteCardBelief: [],
      unrezzedIceRiskModel: [],
      hqAgendaDensityEstimate: 0,
      rndValueEstimate: 0,
      corpCreditReserveInterpretation: "medium",
      rndTopFreshness,
      knownPositionMemory: [],
      hqHandMemory: {
        handCount,
        knownDefinitions,
        knownCount: knownDefinitions.length,
        allCardsKnown:
          handCount > 0 &&
          knownDefinitions.length === handCount &&
          unknownRestCount === 0,
        sourceEventIds: ["test-hq-look"],
        invalidationReasons: [],
        ledger: {
          safeDefinitions,
          unknownRestCount,
          candidateGroups: [],
          sourceEventIds: ["test-hq-look"],
          invalidationReasons: [],
        },
      },
      hiddenRemoteCandidateMemory: [],
    },
    rndTopFreshness,
    knownPositionMemory: [],
  };
}
