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
import { withEffectiveRunQuote } from "./effective-run-quote.test-support";
import { buildDeckCapabilityProfileFromInput } from "./deck-capabilities";

const WILSON_DEFINITION_ID = "onr_v1_187_wilson-weeflerunner-apprentice";
const ALL_HANDS_DEFINITION_ID = "onr_proteus_101_all-hands";
const RUSH_HOUR_DEFINITION_ID = "onr_proteus_122_rush-hour";
const ALL_NIGHTER_DEFINITION_ID = "onr_v1_076_all-nighter";
const SHREDDER_UPLINK_PROTOCOL_DEFINITION_ID =
  "onr_v1_062_shredder-uplink-protocol";
const KRASH_DEFINITION_ID = "onr_v1_039_krash";

describe("Runner RunTargetEvaluation + EconomyPosture", () => {
  it("does not recommend an HQ run when the visible HQ count is zero", () => {
    const input = aiInput({
      credits: 3,
      opponentHandCount: 0,
      servers: [server("hq")],
      legalActions: [runAction("run-hq", "hq")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "hq_hand_count:0",
        "hq_empty_no_access_payoff:true",
        "recommendation:do_not_run_now",
      ]),
    );
  });

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

  it("uses Lucidrine's temporary credits only inside its run quote", () => {
    const lucidrine = {
      ...runAction("lucidrine-rd", "rd"),
      type: "play_event",
      source: "lucidrine-instance",
      costs: [{ clicks: 1 }],
      payload: {
        cardId: "lucidrine-instance",
        sourceDefinitionId: "onr_v1_098_lucidrine-booster-drug",
        serverId: "rd",
        runnerEventRun: true,
        runTemporaryCredits: 9,
        afterRunUnpreventableCoreDamage: 1,
      },
    } satisfies LegalAction;
    const input = aiInput({
      credits: 0,
      servers: [server("rd", { ice: [wallOfStaticIce("rd-wall")] })],
      legalActions: [lucidrine],
      rig: [
        visibleCard("runner-pile-driver", {
          definitionId: "onr_v1_047_pile-driver",
          title: "Pile Driver",
          type: "program",
          subtypes: ["icebreaker", "fracter", "noisy"],
          strength: 7,
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      actionId: "lucidrine-rd",
      pathPassability: "reachable",
      creditsAfterRun: 0,
      runActionProjection: {
        temporaryRunCredits: 9,
        postRunSelfDamage: 1,
      },
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_action_projection_temporary_run_credits:9",
        "run_action_projection_post_run_self_damage:1",
      ]),
    );
  });

  it("evaluates a reachable activated R&D private-look run before selection", () => {
    const protocolRun = activatedPrivateLookRun("protocol-run-rd");
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [protocolRun],
      rig: [
        visibleCard("protocol-installed", {
          definitionId: "onr_v1_050_r-and-d-protocol-files",
          title: "R&D-Protocol Files",
          type: "program",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      actionId: "protocol-run-rd",
      targetServerId: "rd",
      pathPassability: "reachable",
      accessPayoff: "access_bonus",
      knownAccessState: "known_payoff",
      recommendation: "run_now",
      runActionProjection: {
        sourceKind: "program_ability",
        accessReplacement: "private_look_top_rd",
        accessReplacementLookCount: 5,
      },
    });
  });

  it("keeps an activated private-look run conditional through one unknown ICE", () => {
    const protocolRun = activatedPrivateLookRun("protocol-probe-rd");
    const input = aiInput({
      credits: 6,
      servers: [
        server("rd", {
          ice: [
            visibleCard("unknown-rd-ice", {
              known: false,
              type: "ice",
              rezzed: false,
            }),
          ],
        }),
      ],
      legalActions: [protocolRun],
      rig: [
        visibleCard("protocol-installed", {
          definitionId: "onr_v1_050_r-and-d-protocol-files",
          type: "program",
        }),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      actionId: "protocol-probe-rd",
      pathPassability: "reachable",
      unknownUnrezzedIceCount: 1,
      routeQuote: { reachability: "conditional_access" },
      accessPayoff: "access_bonus",
    });
  });

  it("blocks a private-look run when the known path consumes the full budget before unknown ICE", () => {
    const protocolRun = activatedPrivateLookRun("protocol-underreserved-rd");
    const input = aiInput({
      credits: 10,
      opponentCredits: 12,
      servers: [
        server("rd", {
          ice: [
            visibleCard("unknown-outer-rd-ice", {
              known: false,
              type: "ice",
              rezzed: false,
            }),
            keeperIce("known-inner-keeper"),
          ],
        }),
      ],
      legalActions: [protocolRun, gainCreditAction("gain-credit")],
      rig: [
        visibleCard("protocol-installed", {
          definitionId: "onr_v1_050_r-and-d-protocol-files",
          type: "program",
        }),
        visibleCard("krash-installed", {
          definitionId: KRASH_DEFINITION_ID,
          title: "Krash",
          type: "program",
          subtypes: ["icebreaker"],
        }),
      ],
      grip: Array.from({ length: 3 }, (_, index) =>
        visibleCard(`reserve-grip-${index + 1}`, {
          definitionId: "simple_run_event",
        }),
      ),
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      deckCapabilities: buildDeckCapabilityProfileFromInput(input),
    });

    expect(evaluation).toMatchObject({
      actionId: protocolRun.actionId,
      pathCost: 10,
      creditsAfterRun: 0,
      recommendation: "gain_credits_first",
      prerunReserveQuote: {
        purpose: "information",
        status: "blocked",
        knownPathCost: 10,
        creditsAfterKnownPath: 0,
        unknownIceCount: 1,
        corpRezCredits: 12,
        creditGap: 3,
      },
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "prerun_reserve_status:blocked",
        "prerun_reserve_known_path_cost:10",
        "prerun_reserve_credits_after_known_path:0",
        "prerun_reserve_unknown_ice_count:1",
        "prerun_reserve_corp_rez_credits:12",
      ]),
    );
  });

  it("keeps the exactly affordable known Keeper path executable without unknown ICE", () => {
    const protocolRun = activatedPrivateLookRun("protocol-known-keeper-rd");
    const input = aiInput({
      credits: 10,
      opponentCredits: 12,
      servers: [server("rd", { ice: [keeperIce("known-keeper")] })],
      legalActions: [protocolRun],
      rig: [
        visibleCard("protocol-installed", {
          definitionId: "onr_v1_050_r-and-d-protocol-files",
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
      deckCapabilities: buildDeckCapabilityProfileFromInput(input),
    });

    expect(evaluation).toMatchObject({
      pathCost: 10,
      creditsAfterRun: 0,
      recommendation: "run_now",
      prerunReserveQuote: {
        status: "not_required",
        unknownIceCount: 0,
        requiredCredits: 0,
      },
    });
  });

  it("does not value a private-look replacement as another agenda access when all five positions are known", () => {
    const protocolRun = activatedPrivateLookRun("protocol-redundant-rd");
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [protocolRun],
    });

    const [evaluation] = evaluateRunnerRunTargets({
      input,
      beliefState: beliefWithRndTop({
        freshness: "stale_known_same_top",
        knownTopDefinitionId: "simple_agenda",
        knownTopIsAgenda: true,
        knownSequenceDefinitionIds: [
          "simple_agenda",
          "simple_economy_operation",
          "simple_economy_asset",
          "simple_upgrade",
          "simple_barrier_ice",
        ],
      }),
    });

    expect(evaluation).toMatchObject({
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
    });
    expect(evaluation?.evidence).toContain(
      "central_access_replacement_redundant:true",
    );
  });

  it("does not re-admit R&D Protocol after its private look already knows the exact requested depth", () => {
    const protocolRun = activatedPrivateLookRun("protocol-repeated-rd");
    const input = aiInput({
      credits: 6,
      servers: [server("rd")],
      legalActions: [protocolRun],
      eventTail: [
        {
          eventId: "protocol-private-look",
          type: "resolve_choice",
          stateVersionBefore: 7,
          stateVersionAfter: 8,
          stateHashAfter: "hash-protocol-private-look",
          visibilityClass: "hidden_info_barrier",
          publicPayload: {
            actor: "runner",
            actionType: "resolve_choice",
            hiddenZoneAction: "p3_33_private_look",
            privateLookZone: "rd",
            privateLookCount: 5,
            knownRndTopDefinitionId: "simple_agenda",
            knownRndDefinitionIds: ["simple_agenda"],
          },
        },
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      recommendation: "do_not_run_now",
    });
    expect(evaluation?.evidence).toContain(
      "central_access_replacement_redundant:true",
    );
  });

  it("quotes a run that bypasses the outermost ICE without pricing that ICE", () => {
    const insideJob = {
      ...runAction("inside-job-rd", "rd"),
      source: "card",
      costs: [{ clicks: 1, credits: 2 }],
      payload: {
        serverId: "rd",
        sourceDefinitionId: "onr_v1_094_inside-job",
        bypassFirstIce: true,
      },
    } satisfies LegalAction;
    const input = aiInput({
      credits: 2,
      servers: [server("rd", { ice: [expensiveBarrierIce("rd-outer")] })],
      legalActions: [insideJob],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "reachable",
      pathCost: 0,
      creditsAfterRun: 0,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_action_projection_bypass_first_ice:true",
        "run_action_projection_bypassed_first_ice:true",
        "path_passability:reachable",
      ]),
    );
  });

  it("does not start a visible R&D trace run that cannot reach access and adds a run lock", () => {
    const input = aiInput({
      credits: 4,
      servers: [
        server("rd", {
          ice: [aspTraceRunLockIce("rd-asp")],
        }),
      ],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "blocked_unbreakable",
      recommendation: "do_not_run_now",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "unproductive_visible_run_path:true",
        "visible_trace_end_run_lock_unavoidable:true",
      ]),
    );
  });

  it("keeps visible R&D trace pressure available when the runner can cover the base trace", () => {
    const input = aiInput({
      credits: 6,
      opponentCredits: 0,
      servers: [
        server("rd", {
          ice: [aspTraceRunLockIce("rd-asp")],
        }),
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "reachable",
      recommendation: "run_now",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "unproductive_visible_run_path:false",
        "visible_trace_end_run_lock_unavoidable:false",
        "visible_trace_base_covered:true",
        "visible_corp_bid_capacity:0",
        "visible_corp_max_trace_covered:true",
      ]),
    );
  });

  it("defers visible R&D trace pressure when visible Corp max is not covered", () => {
    const input = aiInput({
      credits: 6,
      opponentCredits: 5,
      servers: [
        server("rd", {
          ice: [hunterTraceTagIce("rd-hunter")],
        }),
      ],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "reachable",
      recommendation: "gain_credits_first",
      visibleTraceTagHazardUnavoidable: true,
    });
    expect(evaluation?.visibleIceRunHazards?.[0]).toMatchObject({
      baseTraceCovered: true,
      visibleCorpBidCapacity: 5,
      visibleCorpMaxTraceCovered: false,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "visible_trace_base_covered:true",
        "visible_corp_bid_capacity:5",
        "visible_corp_max_trace_covered:false",
      ]),
    );
  });

  it("defers visible R&D trace tag ICE until the tag can be avoided", () => {
    const input = aiInput({
      credits: 2,
      servers: [
        server("rd", {
          ice: [hunterTraceTagIce("rd-hunter")],
        }),
      ],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "reachable",
      recommendation: "gain_credits_first",
      visibleTraceTagHazardUnavoidable: true,
      expectedTagsFromVisibleIce: 1,
      unavoidableVisibleIceHazardCount: 1,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "visible_ice_hazard:trace_tag",
        "visible_ice_hazard_source:Hunter",
        "visible_trace_tag_hazard_unavoidable:true",
      ]),
    );
  });

  it("does not price unrezzed R&D Hunter as a known trace tag hazard", () => {
    const input = aiInput({
      credits: 2,
      servers: [
        server("rd", {
          ice: [{ ...hunterTraceTagIce("rd-hunter"), rezzed: false }],
        }),
      ],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "reachable",
      visibleTraceTagHazardUnavoidable: false,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "visible_ice_hazard_penalty:0",
        "visible_trace_tag_hazard_unavoidable:false",
      ]),
    );
  });

  it("funds an unknown R&D ICE risk before probing with zero credits", () => {
    const input = aiInput({
      credits: 0,
      opponentCredits: 4,
      servers: [
        server("rd", {
          ice: [
            visibleCard("unknown-rd-ice", {
              type: "ice",
              known: false,
              rezzed: false,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "reachable",
      recommendation: "gain_credits_first",
      unknownUnrezzedIceCount: 1,
      unrezzedIceRisk: 0.51,
      unrezzedIceRiskCreditBuffer: 3,
      unrezzedIceRiskUnderfunded: true,
      prerunReserveQuote: {
        purpose: "information",
        status: "blocked",
        unknownIcePositions: [0],
        requiredCredits: 3,
        creditGap: 3,
      },
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "unknown_unrezzed_ice_count:1",
        "unrezzed_ice_risk_credit_buffer:3",
        "unrezzed_ice_risk_underfunded:true",
      ]),
    );
  });

  it("keeps an affordable unknown R&D probe available", () => {
    const input = aiInput({
      credits: 3,
      opponentCredits: 4,
      servers: [
        server("rd", {
          ice: [
            visibleCard("unknown-rd-ice", {
              type: "ice",
              known: false,
              rezzed: false,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      recommendation: "run_now",
      unrezzedIceRiskCreditBuffer: 3,
      unrezzedIceRiskUnderfunded: false,
      prerunReserveQuote: {
        purpose: "information",
        status: "information_probe_only",
        requiredCredits: 3,
        creditGap: 0,
      },
    });
  });

  it("allows a zero-credit information probe when the Corp cannot rez", () => {
    const input = aiInput({
      credits: 0,
      opponentCredits: 0,
      servers: [
        server("rd", {
          ice: [
            visibleCard("unknown-rd-ice", {
              type: "ice",
              known: false,
              rezzed: false,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      recommendation: "run_now",
      unrezzedIceRiskCreditBuffer: 0,
      unrezzedIceRiskUnderfunded: false,
      prerunReserveQuote: {
        status: "not_required",
        corpRezCredits: 0,
      },
    });
  });

  it("allows the explicit matchpoint corridor only with stable universal unknown-ICE coverage", () => {
    const protocolRun = activatedPrivateLookRun("matchpoint-protocol-rd");
    const input = aiInput({
      credits: 2,
      opponentCredits: 4,
      servers: [
        server("rd", {
          ice: [
            visibleCard("unknown-matchpoint-ice", {
              type: "ice",
              known: false,
              rezzed: false,
            }),
          ],
        }),
      ],
      legalActions: [protocolRun],
      rig: [
        visibleCard("protocol-installed", {
          definitionId: "onr_v1_050_r-and-d-protocol-files",
          type: "program",
        }),
        visibleCard("krash-installed", {
          definitionId: KRASH_DEFINITION_ID,
          title: "Krash",
          type: "program",
          subtypes: ["icebreaker"],
        }),
      ],
      grip: [
        visibleCard("matchpoint-buffer-1", {
          definitionId: "simple_run_event",
        }),
        visibleCard("matchpoint-buffer-2", {
          definitionId: "simple_run_event",
        }),
      ],
    });
    input.playerView.own.agendaPoints = 5;
    const baseCapabilities = buildDeckCapabilityProfileFromInput(input);
    const krash = baseCapabilities.runner?.breakerInventory.find(
      (breaker) => breaker.cardId === KRASH_DEFINITION_ID,
    );
    if (!baseCapabilities.runner || !krash) {
      throw new Error("Expected Krash deck capability");
    }
    const stableUniversalCapabilities = {
      ...baseCapabilities,
      runner: {
        ...baseCapabilities.runner,
        breakerInventory: [
          {
            ...krash,
            coverage: ["universal" as const],
            risks: [],
            locations: ["installed" as const],
            confidence: "high" as const,
          },
        ],
      },
    };
    const typedOnlyCapabilities = {
      ...stableUniversalCapabilities,
      runner: {
        ...stableUniversalCapabilities.runner,
        breakerInventory: [
          {
            ...stableUniversalCapabilities.runner.breakerInventory[0]!,
            coverage: ["code_gate" as const],
          },
        ],
      },
    };

    const [stableUniversal] = evaluateRunnerRunTargets({
      input,
      deckCapabilities: stableUniversalCapabilities,
    });
    const [typedOnly] = evaluateRunnerRunTargets({
      input,
      deckCapabilities: typedOnlyCapabilities,
    });

    expect(stableUniversal).toMatchObject({
      recommendation: "run_now",
      prerunReserveQuote: {
        status: "satisfied",
        riskTolerance: "matchpoint_with_stable_universal_coverage",
        visibleCoverage: "stable_universal",
        requiredCredits: 2,
        creditGap: 0,
        requiredHandBuffer: 2,
      },
    });
    expect(typedOnly).toMatchObject({
      recommendation: "gain_credits_first",
      prerunReserveQuote: {
        status: "blocked",
        riskTolerance: "standard",
        visibleCoverage: "typed_only",
        requiredCredits: 3,
        creditGap: 1,
        requiredHandBuffer: 3,
        handBufferGap: 1,
      },
    });
  });

  it("keeps a visible remote agenda runnable through Hunter tag risk", () => {
    const input = aiInput({
      credits: 2,
      servers: [
        server("remote_1", {
          ice: [hunterTraceTagIce("remote-hunter")],
          root: [
            visibleCard("remote-agenda", {
              definitionId: "simple_agenda",
              title: "Simple Agenda",
              type: "agenda",
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
      accessPayoff: "agenda",
      recommendation: "run_now",
      visibleTraceTagHazardUnavoidable: true,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "visible_ice_hazard:trace_tag",
        "visible_trace_tag_hazard_unavoidable:true",
      ]),
    );
  });

  it("does not treat unrezzed trace ice as an unavoidable visible R&D run lock", () => {
    const input = aiInput({
      credits: 4,
      servers: [
        server("rd", {
          ice: [{ ...aspTraceRunLockIce("rd-asp"), rezzed: false }],
        }),
      ],
      legalActions: [runAction("run-rd", "rd")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathPassability: "reachable",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "unproductive_visible_run_path:false",
        "visible_trace_end_run_lock_unavoidable:false",
      ]),
    );
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
    expect(evaluation.evidence).toContain(
      "installed_run_payoff:hq:multiaccess",
    );
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
    expect(evaluation.installedRunPayoff.immediateAccessValue).toBeGreaterThan(
      0,
    );
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

  it("keeps installed R&D multiaccess live despite a stale low-value top card", () => {
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
      accessPayoff: "access_bonus",
      knownAccessState: "known_payoff",
      multiaccessAvailable: true,
      recommendation: "run_now",
    });
    expect(evaluation.evidence).toContain(
      "installed_run_payoff:rd:multiaccess",
    );
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
    const hq = evaluations.find(
      (evaluation) => evaluation.targetServerId === "hq",
    );
    const rd = evaluations.find(
      (evaluation) => evaluation.targetServerId === "rd",
    );

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

  it("keeps runnable central payoff ahead of a Remote threat that still needs funding", () => {
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

    expect(evaluations[0]).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "unknown",
      recommendation: "run_if_free",
    });
    expect(evaluations[0]?.evidence).toContain(
      "installed_run_payoff:hq:future_hq_info",
    );
    expect(evaluations[1]).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "score_threat",
      recommendation: "gain_credits_first",
    });
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
      pathPassability: "blocked_by_random_break_damage_hand_buffer",
      recommendation: "draw_for_damage_buffer",
    });
    expect(evaluation?.randomBreakOrDamageRiskAssessment).toMatchObject({
      blockedByHandBuffer: true,
      noProgressRunExpected: true,
      expectedEtrUnbroken: true,
      payoffOverride: "remote_score_threat",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "randomBreakDamagePreRunRiskApplied:true",
        "pathDependsOnRandomBreakDamage:true",
        "randomBreakDamageExcludedInEncounter:true",
        "blocked_by_random_break_damage_hand_buffer:true",
        "random_break_damage_no_progress_run:true",
        "expected_etr_unbroken:true",
        "recommendation:draw_for_damage_buffer",
        "why_random_break_damage_run_deferred_for_hand_buffer:self_damage_buffer_too_low",
      ]),
    );
  });

  it("lets installed Blink convert probabilistic coverage with a sufficient hand buffer", () => {
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
      grip: Array.from({ length: 4 }, (_, index) =>
        visibleCard(`grip-card-${index + 1}`, {
          definitionId: "simple_run_event",
        }),
      ),
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "score_threat",
      pathPassability: "reachable",
      recommendation: "run_now",
    });
    expect(evaluation?.randomBreakOrDamageRiskAssessment).toMatchObject({
      pathDependsOnRandomBreakOrDamage: true,
      blockedByHandBuffer: false,
      payoffOverride: "remote_score_threat",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "probabilistic_universal_path_reachable:true",
        "why_random_break_damage_run_allowed_despite_risk:remote_score_threat",
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
    expect(evaluation?.randomBreakOrDamageRiskAssessment).toBeUndefined();
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
        randomBreakOutcomeKind: "random_break_or_damage",
        randomBreakOutcomeSuccess: false,
        randomBreakOutcomeDamageAmount: 3,
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

    expect(evaluation?.randomBreakOrDamageRiskAssessment).toMatchObject({
      recentFailure: true,
      recentDamageAmount: 3,
      sameServerRepeatedRiskPenalty: -900,
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "recentRandomBreakDamageFailure:true",
        "recentRandomBreakDamageFailureTarget:remote_1",
        "recentRandomBreakDamageAmount:3",
        "sameServerRepeatedRandomBreakDamageRiskPenalty:-900",
        "repeated_no_progress_random_break_damage_run:true",
      ]),
    );
  });

  it("does not turn an unreachable payoff target into a legal run choice", () => {
    const input = aiInput({
      credits: 6,
      servers: [
        server("hq", {
          ice: [wallOfStaticIce("hq-wall")],
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
    expect(evaluation.evidence).toContain(
      "installed_run_payoff:hq:multiaccess",
    );
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
    expect(
      evidenceNumber(hq.evidence, "access_payoff_score_adjustment"),
    ).toBeLessThan(0);
    expect(evidenceNumber(rd.evidence, "access_payoff_score_adjustment")).toBe(
      260,
    );
    expect(rd.evidence).toEqual(
      expect.arrayContaining([
        "central_distribution_shift:hq_known_low_value_to_rd",
        "rd_run_boosted_by_hq_knownness_distribution:true",
      ]),
    );
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
    expect(
      evidenceNumber(evaluation.evidence, "access_payoff_score_adjustment"),
    ).toBe(0);
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
      evidenceNumber(
        withoutMultiaccess.evidence,
        "access_payoff_score_adjustment",
      ),
    );
    const multiPenalty = Math.abs(
      evidenceNumber(
        withMultiaccess.evidence,
        "access_payoff_score_adjustment",
      ),
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

  it("does not let HQ multiaccess upgrade a confirmed no-payoff HQ hand", () => {
    const [evaluation] = evaluateRunnerRunTargets({
      input: aiInput({
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
      }),
      beliefState: beliefWithKnownHq(["onr_v1_297_overtime-incentives"], {
        handCount: 1,
        unknownRestCount: 0,
      }),
    });
    if (!evaluation) throw new Error("Expected HQ evaluation");

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      accessPayoff: "known_low_value",
      knownAccessState: "known_no_current_payoff",
      multiaccessAvailable: true,
      recommendation: "do_not_run_now",
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "access_payoff:known_low_value",
        "known_access_state:known_no_current_payoff",
        "multiaccess_available:true",
        "installed_run_payoff:hq:multiaccess",
        "central_memory_payoff:known_low_value",
      ]),
    );
    expect(evaluation.evidence).not.toContain("access_payoff:access_bonus");
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
    expect(
      evidenceNumber(evaluation.evidence, "access_payoff_score_adjustment"),
    ).toBeLessThan(0);
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
          runEventAction("all-hands-hq", ALL_HANDS_DEFINITION_ID, "All-Hands", {
            serverId: "hq",
            runnerEventRun: true,
            noNoisyBreakers: true,
          }),
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

  it("quotes a paid run event against the known path after paying the event cost", () => {
    const rushHour = runEventAction(
      "rush-hour-rd-paid",
      RUSH_HOUR_DEFINITION_ID,
      "Rush Hour",
    );
    rushHour.costs = [{ clicks: 1, credits: 3 }];
    const input = aiInput({
      credits: 3,
      servers: [server("rd", { ice: [barrierIce("rd-barrier")] })],
      rig: [
        visibleCard("runner-efficient-fracter", {
          definitionId: "efficient_fracter",
          title: "Efficient Fracter",
          type: "program",
          subtypes: ["icebreaker", "fracter"],
          strength: 3,
        }),
      ],
      legalActions: [rushHour, gainCreditAction("gain-credit")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      actionId: "rush-hour-rd-paid",
      targetServerId: "rd",
      pathPassability: "blocked_unpayable",
      recommendation: "gain_credits_first",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_action_credit_cost:3",
        "credits_after_run_action:0",
      ]),
    );
  });

  it("keeps run-event projections conservative when no side-safe target options exist", () => {
    const input = aiInput({
      credits: 6,
      servers: [server("hq"), server("rd")],
      legalActions: [
        runEventAction(
          "all-nighter-no-target",
          ALL_NIGHTER_DEFINITION_ID,
          "All-Nighter",
        ),
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
          ice: [dataWallIce("hq-data-wall")],
        }),
      ],
      legalActions: [
        runEventAction(
          "blocked-all-hands",
          ALL_HANDS_DEFINITION_ID,
          "All-Hands",
          {
            serverId: "hq",
            runnerEventRun: true,
            noNoisyBreakers: true,
          },
        ),
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
          ice: [vacuumLinkIce("remote-vacuum-link")],
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

  it("does not run Pile Driver into a known rezzed Code Gate to reach a 4-credit trash root", () => {
    const input = aiInput({
      credits: 4,
      rig: [
        visibleCard("runner-pile-driver", {
          definitionId: "onr_v1_047_pile-driver",
          title: "Pile Driver",
          type: "program",
          subtypes: ["icebreaker", "fracter", "noisy"],
          known: true,
        }),
      ],
      servers: [
        server("remote_1", {
          ice: [simpleCodeGateIce("remote-code-gate")],
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
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
    expect(evaluation?.score).toBeLessThan(-900);
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "path_passability:blocked_missing_coverage",
        "trash_decline_reason:reserve_would_break",
        "known_remote_root_credits_after_trash:0",
        "access_payoff_score_adjustment:-720",
      ]),
    );
  });

  it("does not run Pile Driver into Caryatid when it was rezzed as a Code Gate", () => {
    const input = aiInput({
      credits: 4,
      opponentHandCount: 4,
      rig: [
        visibleCard("runner-pile-driver", {
          definitionId: "onr_v1_047_pile-driver",
          title: "Pile Driver",
          type: "program",
          subtypes: ["icebreaker", "fracter", "noisy"],
          known: true,
          strength: 7,
        }),
      ],
      servers: [
        server("hq", {
          ice: [caryatidAsCodeGateIce("hq-caryatid")],
        }),
      ],
      legalActions: [
        runAction("run-hq", "hq"),
        gainCreditAction("gain-credit"),
      ],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "hq",
      pathPassability: "blocked_missing_coverage",
      recommendation: "find_breaker_first",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "path_passability:blocked_missing_coverage",
        "missing_coverage:code_gate",
        "recommendation:find_breaker_first",
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

  it("lets a currently affordable remote trash payoff override stale access-only memory", () => {
    const noProgressRemoteEvents = [
      syntheticPublicEvent("evt_run_remote_1", 8, "start_run", {
        actor: "runner",
        actionType: "start_run",
        serverId: "remote_1",
      }),
      syntheticPublicEvent("evt_access_remote_1", 9, "access_card", {
        actor: "runner",
        actionType: "access_card",
        serverId: "remote_1",
        cardDefinitionId: "onr_v1_317_data-masons",
        accessedCardPositionKey: "root:0",
        accessedArea: "root",
        accessedIndex: 0,
      }),
    ];
    const input = aiInput({
      credits: 6,
      eventTail: noProgressRemoteEvents,
      servers: [
        server("rd"),
        server("remote_1", {
          root: [
            visibleCard("remote-trashable-root", {
              definitionId: "onr_v1_317_data-masons",
              title: "Data Masons",
              type: "asset",
              trashCost: 1,
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [
        runAction("run-remote-1", "remote_1"),
        runAction("run-rd", "rd"),
      ],
    });

    const evaluations = evaluateRunnerRunTargets({ input });

    const remoteEvaluation = evaluations.find(
      (evaluation) => evaluation.targetServerId === "remote_1",
    );

    expect(remoteEvaluation).toMatchObject({
      accessPayoff: "trash_affordable",
      knownAccessState: "known_payoff",
      recommendation: "run_now",
    });
    expect(remoteEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        "known_remote_no_current_payoff",
        "repeated_remote_no_progress_suppressed",
        "run_target_access_memory_overridden_by_current_payoff:true",
      ]),
    );
    expect(remoteEvaluation?.evidence.join("\n")).not.toMatch(
      /privatePayload|cardInstances|decklist/i,
    );
    expect(remoteEvaluation?.score).toBeGreaterThan(0);
  });

  it("does not override an explicit declined trash while the remote and economy are unchanged", () => {
    const input = aiInput({
      credits: 6,
      eventTail: [
        syntheticPublicEvent("evt_run_remote_1", 8, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        }),
        syntheticPublicEvent("evt_access_remote_1", 9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          cardDefinitionId: "onr_v1_317_data-masons",
        }),
        syntheticPublicEvent("evt_decline_remote_1", 10, "decline_trash", {
          actor: "runner",
          actionType: "decline_trash",
          serverId: "remote_1",
        }),
      ],
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-trashable-root", {
              definitionId: "onr_v1_317_data-masons",
              title: "Data Masons",
              type: "asset",
              trashCost: 1,
              known: true,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      accessPayoff: "trash_affordable",
      knownAccessState: "known_payoff",
      recommendation: "declined_trash_memory_active",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "remote_access_outcome_decision:decline",
        "run_target_access_memory_suppresses_plan_bonus:true",
        "recommendation:declined_trash_memory_active",
      ]),
    );
  });

  it("keeps a known remote agenda attractive despite prior access-only telemetry", () => {
    const input = aiInput({
      credits: 6,
      eventTail: [
        syntheticPublicEvent("evt-run-remote-1", 8, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        }),
        syntheticPublicEvent("evt-access-remote-1", 9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          cardDefinitionId: "simple_agenda",
        }),
      ],
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-agenda", {
              definitionId: "simple_agenda",
              title: "Simple Agenda",
              type: "agenda",
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
      accessPayoff: "agenda",
      recommendation: "run_now",
    });
    expect(evaluation?.evidence).not.toContain(
      "repeated_remote_no_progress_suppressed",
    );
  });

  it("funds an observed agenda steal cost before repeating the remote run", () => {
    const eventTail = [
      syntheticPublicEvent("evt-run-remote-1", 8, "start_run", {
        actor: "runner",
        actionType: "start_run",
        serverId: "remote_1",
      }),
      syntheticPublicEvent("evt-access-remote-1", 9, "access_card", {
        actor: "runner",
        actionType: "access_card",
        serverLabel: "Remote 1",
        cardDefinitionId: "onr_proteus_004_fetal-ai",
      }),
      syntheticPublicEvent("evt-decline-remote-1", 10, "decline_trash", {
        actor: "runner",
        actionType: "decline_trash",
        serverLabel: "Remote 1",
        stealCost: 2,
        stealBlockedByCost: true,
      }),
    ];
    const input = aiInput({
      credits: 1,
      stateVersion: 11,
      eventTail,
      servers: [
        server("remote_1", {
          root: [
            visibleCard("known-fetal-ai", {
              definitionId: "onr_proteus_004_fetal-ai",
              title: "Fetal AI",
              type: "agenda",
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    expect(evaluateRunnerRunTargets({ input })[0]).toMatchObject({
      accessPayoff: "agenda",
      accessPayoffContestable: false,
      stealOrTrashAffordable: false,
      recommendation: "gain_credits_first",
    });

    input.playerView.own.credits = 2;
    expect(evaluateRunnerRunTargets({ input })[0]).toMatchObject({
      accessPayoff: "agenda",
      accessPayoffContestable: true,
      stealOrTrashAffordable: true,
      recommendation: "run_now",
    });
  });

  it("reconsiders a no-progress remote after the remote visibly changes", () => {
    const input = aiInput({
      credits: 6,
      eventTail: [
        syntheticPublicEvent("evt-run-remote-1", 8, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        }),
        syntheticPublicEvent("evt-access-remote-1", 9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          cardDefinitionId: "onr_v1_317_data-masons",
        }),
        syntheticPublicEvent("evt-install-remote-1", 10, "install_card", {
          actor: "corp",
          actionType: "install_card",
          serverId: "remote_1",
        }),
      ],
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-root", {
              definitionId: "onr_v1_317_data-masons",
              title: "Data Masons",
              type: "asset",
              trashCost: 1,
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
      recommendation: "run_now",
    });
    expect(evaluation?.evidence).not.toContain(
      "repeated_remote_no_progress_suppressed",
    );
  });

  it("does not suppress remote runs when the current root is unknown", () => {
    const input = aiInput({
      credits: 6,
      eventTail: [
        syntheticPublicEvent("evt-run-remote-1", 8, "start_run", {
          actor: "runner",
          actionType: "start_run",
          serverId: "remote_1",
        }),
        syntheticPublicEvent("evt-access-remote-1", 9, "access_card", {
          actor: "runner",
          actionType: "access_card",
          serverId: "remote_1",
          cardDefinitionId: "onr_v1_317_data-masons",
        }),
      ],
      servers: [
        server("remote_1", {
          root: [
            visibleCard("remote-unknown-root", {
              known: false,
            }),
          ],
        }),
      ],
      legalActions: [runAction("run-remote-1", "remote_1")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "remote_1",
      accessPayoff: "unknown",
    });
    expect(evaluation?.evidence).not.toContain(
      "repeated_remote_no_progress_suppressed",
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
          ice: [wallOfStaticIce("remote-ice-1")],
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

  it("uses structured hosted-credit payloads and ignores label-only bank cashout text", () => {
    const labelOnlyInput = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [
        runAction("run-hq", "hq"),
        bankPayoutAction("label-cashout", "Credits aus Bank nehmen"),
      ],
    });

    const structuredInput = aiInput({
      credits: 0,
      servers: [server("hq")],
      legalActions: [
        runAction("run-hq", "hq"),
        bankPayoutAction("structured-cashout", "Use ability", {
          cardImplementationTakesHostedCredits: true,
        }),
      ],
    });

    expect(buildRunnerEconomyPosture({ input: labelOnlyInput })).toMatchObject({
      fundingNeed: true,
      recommendation: "build_economy",
    });
    expect(buildRunnerEconomyPosture({ input: structuredInput })).toMatchObject(
      {
        fundingNeed: true,
        recommendation: "cash_out_bank",
      },
    );
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
          targetCredits: 4,
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

  it("enters a binding economy transition instead of click-funding a long gap", () => {
    const input = aiInput({
      credits: 1,
      opponentCredits: 9,
      servers: [
        server("rd", {
          ice: [barrierIce("outer-tax"), barrierIce("inner-tax")],
        }),
      ],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
        drawCardAction("draw-card"),
      ],
    });
    const handDevelopmentEvaluations = [
      handDevelopmentEvaluation({
        cardInstanceId: "persistent-economy-in-hand",
        developmentRole: "economy_engine",
        priority: 920,
        fundingNeed: {
          installOrPlayCost: 11,
          targetCredits: 11,
          missingCredits: 10,
          reason: "cannot_pay",
        },
      }),
    ];

    const posture = buildRunnerEconomyPosture({
      input,
      handDevelopmentEvaluations,
    });

    expect(posture).toMatchObject({
      preferredEconomyRoute: "draw_for_economy",
      buildEconomyBeforePressure: true,
      creditBasePlan: {
        recommendation: "acquire_economy",
      },
      transition: {
        phase: "economy_transition",
        commitment: "acquire_economy",
        fundingHorizon: "long",
        targetCardInstanceId: "persistent-economy-in-hand",
        missingCredits: 10,
        sustainableEconomyInstalled: false,
        ordinaryPaidRunsDeferred: true,
      },
    });
  });

  it("returns to sustainable pressure after a general recurring source is installed", () => {
    const installedEconomy = visibleCard("installed-economy", {
      type: "resource",
      rulesText: "At the start of your turn, gain credits.",
    });
    const input = aiInput({
      credits: 6,
      opponentCredits: 9,
      servers: [
        server("rd", { ice: [barrierIce("tax-1"), barrierIce("tax-2")] }),
      ],
      rig: [installedEconomy],
      legalActions: [
        runAction("run-rd", "rd"),
        gainCreditAction("gain-credit"),
      ],
    });

    const posture = buildRunnerEconomyPosture({ input });

    expect(posture.transition).toMatchObject({
      phase: "sustainable_pressure",
      sustainableEconomyInstalled: true,
      ordinaryPaidRunsDeferred: false,
    });
  });

  it("keeps free unknown R&D pressure live despite useful hand-card funding need", () => {
    const input = aiInput({
      credits: 5,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd"), gainCreditAction("gain")],
    });
    const handDevelopmentEvaluations = [
      handDevelopmentEvaluation({
        cardInstanceId: "runner-useful-missing-credit",
        fundingNeed: {
          installOrPlayCost: 6,
          targetCredits: 6,
          missingCredits: 1,
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
      fundingNeed: true,
      usefulHandCardsBlockedByCredits: 1,
      recommendation: "fund_useful_hand_card",
      economyPriority: "high",
    });
    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      accessPayoff: "unknown",
      knownAccessState: "unknown",
      pathPassability: "reachable",
      pathCost: 0,
      recommendation: "run_now",
    });
  });

  it("keeps a free midgame R&D access live below the liquid reserve", () => {
    const input = aiInput({
      credits: 6,
      stateVersion: 20,
      servers: [server("rd")],
      legalActions: [runAction("run-rd", "rd"), gainCreditAction("gain")],
    });

    const posture = buildRunnerEconomyPosture({ input });
    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(posture.creditReservePolicy).toMatchObject({
      phase: "midgame",
      liquidCredits: 6,
      desiredCreditReserve: 10,
      belowReserveNow: true,
    });
    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathCost: 0,
      creditsAfterRun: 6,
      recommendation: "run_now",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_target_funding_need:none",
        "run_target_protected_liquid_reserve:2",
      ]),
    );
  });

  it("funds an ordinary paid midgame R&D run before spending the liquid reserve", () => {
    const fracter = visibleCard("runner-efficient-fracter", {
      definitionId: "efficient_fracter",
      title: "Efficient Fracter",
      type: "program",
      subtypes: ["icebreaker", "fracter"],
      strength: 3,
    });
    const input = aiInput({
      credits: 12,
      stateVersion: 20,
      rig: [fracter],
      servers: [server("rd", { ice: [expensiveBarrierIce("rd-tax")] })],
      legalActions: [runAction("run-rd", "rd"), gainCreditAction("gain")],
    });

    const [evaluation] = evaluateRunnerRunTargets({ input });

    expect(evaluation).toMatchObject({
      targetServerId: "rd",
      pathCost: 4,
      creditsAfterRun: 8,
      recommendation: "gain_credits_first",
    });
    expect(evaluation?.evidence).toEqual(
      expect.arrayContaining([
        "run_target_funding_need:post_run_floor_gap",
        "run_target_post_run_floor_gap:2",
        "run_target_protected_liquid_reserve:10",
      ]),
    );
  });

  it("treats bank credits as click-bounded assets, not as the liquid midgame reserve", () => {
    const bank = visibleCard("runner-bank-source", {
      definitionId: "onr_v1_154_broker",
      title: "Broker",
      type: "resource",
      counters: { bit: 12 },
    });
    const input = aiInput({
      credits: 6,
      stateVersion: 20,
      rig: [bank],
      servers: [server("hq")],
      legalActions: [
        runAction("run-hq", "hq"),
        bankPayoutAction("bank-payout", "Bank payout", {
          cardId: bank.instanceId,
          cardImplementationTakesHostedCredits: true,
          cardImplementationHostedCreditCashOutMaxUses: 6,
          hostedCreditTakeAmount: 2,
          gainCreditsAmount: 2,
        }),
      ],
    });

    const posture = buildRunnerEconomyPosture({ input });

    expect(posture.creditReservePolicy).toMatchObject({
      phase: "midgame",
      liquidCredits: 6,
      convertibleBankCredits: 6,
      economyTurnCreditCeiling: 12,
      desiredCreditReserve: 10,
      belowReserveNow: true,
    });
    expect(posture).toMatchObject({
      fundingNeed: true,
      recommendation: "cash_out_bank",
    });
  });

  it("does not invent repeatable bank liquidity without an engine use ceiling", () => {
    const bank = visibleCard("runner-bank-source", {
      definitionId: "onr_v1_178_short-term-contract",
      title: "Short-Term Contract",
      type: "resource",
      counters: { bit: 12 },
    });
    const input = aiInput({
      credits: 6,
      stateVersion: 20,
      rig: [bank],
      servers: [server("hq")],
      legalActions: [
        runAction("run-hq", "hq"),
        bankPayoutAction("bank-payout", "Bank payout", {
          cardId: bank.instanceId,
          cardImplementationTakesHostedCredits: true,
          hostedCreditTakeAmount: 2,
          gainCreditsAmount: 2,
        }),
      ],
    });

    const posture = buildRunnerEconomyPosture({ input });

    expect(posture.creditReservePolicy).toMatchObject({
      liquidCredits: 6,
      convertibleBankCredits: 2,
      economyTurnCreditCeiling: 8,
      desiredCreditReserve: 10,
      belowReserveNow: true,
    });
  });

  it("builds a remote-contest buffer before spending on central pressure", () => {
    const input = pressureReserveInput(12);
    input.playerView.servers.push(server("hq"));
    input.legalActions.push(runAction("run-hq", "hq"));

    const posture = buildRunnerEconomyPosture({ input });
    const evaluations = evaluateRunnerRunTargets({ input });
    const hq = evaluations.find(
      (evaluation) => evaluation.targetServerId === "hq",
    );
    const rd = evaluations.find(
      (evaluation) => evaluation.targetServerId === "rd",
    );

    expect(posture).toMatchObject({
      fundingNeed: true,
      recommendation: "build_economy",
      creditReservePolicy: {
        remotePressureReserveActive: true,
        remotePressureReserve: 17,
        pressureRunwayTarget: 21,
      },
    });
    expect(hq).toMatchObject({
      pathPassability: "reachable",
      pathCost: 0,
      recommendation: "run_if_free",
    });
    expect(hq?.evidence).toEqual(
      expect.arrayContaining([
        "run_target_funding_need:none",
        "run_target_route_funding_gap:0",
        "run_target_post_run_floor_gap:0",
        "global_economy_funding_need:true",
      ]),
    );
    expect(rd).toMatchObject({
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
      desiredCreditReserve: 12,
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
        "desired_credit_reserve:12",
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
            targetCredits: 6,
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
            targetCredits: 4,
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

  it("turns a reachable deep remote into an active contest reserve", () => {
    const input = pressureReserveInput(20);

    const posture = buildRunnerEconomyPosture({ input });
    const rd = evaluateRunnerRunTargets({ input }).find(
      (evaluation) => evaluation.targetServerId === "rd",
    );

    expect(posture.creditReservePolicy).toMatchObject({
      remoteScoreThreat: "possible",
      remotePressureReserveActive: true,
      remotePressureReserve: 17,
      rdPressureSpendTarget: 4,
      pressureRunwayTarget: 21,
      economyTurnCreditCeiling: 20,
      desiredCreditReserve: 17,
      belowReserveNow: false,
    });
    expect(rd).toMatchObject({
      pathCost: 4,
      creditsAfterRun: 16,
      recommendation: "gain_credits_first",
    });
    expect(rd?.evidence.join("\n")).toContain(
      "rd_preserves_remote_pressure_reserve:",
    );
  });

  it("does not build a remote-pressure reserve for a known empty remote", () => {
    const input = pressureReserveInput(10);
    const remote = input.playerView.servers.find(
      (server) => server.id === "remote_1",
    );
    if (!remote) throw new Error("Missing remote_1 test server");
    remote.root = [];

    const posture = buildRunnerEconomyPosture({ input });

    expect(posture.creditReservePolicy).toMatchObject({
      remotePressureReserveActive: false,
      remotePressureReserve: 0,
      pressureRunwayTarget: 0,
    });
    expect(posture.fundingNeed).toBe(false);
  });

  it("allows R&D spending after both central spend and remote reserve fit", () => {
    const input = pressureReserveInput(22);

    const posture = buildRunnerEconomyPosture({ input });
    const rd = evaluateRunnerRunTargets({ input }).find(
      (evaluation) => evaluation.targetServerId === "rd",
    );

    expect(posture.creditReservePolicy).toMatchObject({
      remotePressureReserve: 17,
      pressureRunwayTarget: 21,
      economyTurnCreditCeiling: 22,
      belowReserveNow: false,
    });
    expect(rd).toMatchObject({
      pathCost: 4,
      creditsAfterRun: 18,
      recommendation: "run_now",
    });
    expect(rd?.evidence).toEqual(
      expect.arrayContaining([
        "rd_pressure_runway_ready:true",
        "rd_preserves_remote_pressure_reserve:true",
      ]),
    );
  });

  it("counts a structured Broker payout as convertible threat-reserve liquidity", () => {
    const broker = visibleCard("runner-bank-source", {
      definitionId: "onr_v1_154_broker",
      title: "Broker",
      type: "resource",
      counters: { bit: 12 },
    });
    const input = pressureReserveInput(9, {
      additionalRig: [broker],
      additionalActions: [
        bankPayoutAction("broker-payout", "Broker payout", {
          cardId: broker.instanceId,
          cardImplementationTakesHostedCredits: true,
          cardImplementationHostedCreditCashOutMaxUses: 6,
          hostedCreditTakeAmount: 2,
          gainCreditsAmount: 2,
        }),
      ],
    });

    const posture = buildRunnerEconomyPosture({ input });
    const rd = evaluateRunnerRunTargets({ input }).find(
      (evaluation) => evaluation.targetServerId === "rd",
    );

    expect(posture.creditReservePolicy).toMatchObject({
      liquidCredits: 9,
      convertibleBankCredits: 6,
      economyTurnCreditCeiling: 15,
      remotePressureReserve: 17,
      pressureRunwayTarget: 21,
      belowReserveNow: true,
    });
    expect(rd).toMatchObject({
      creditsAfterRun: 5,
      recommendation: "gain_credits_first",
    });
  });

  it("uses the prepared reserve when the deep remote becomes an urgent score threat", () => {
    const input = pressureReserveInput(20, { advancedRemote: true });

    const posture = buildRunnerEconomyPosture({ input });
    const remote = evaluateRunnerRunTargets({ input }).find(
      (evaluation) => evaluation.targetServerId === "remote_1",
    );

    expect(posture.creditReservePolicy).toMatchObject({
      remoteScoreThreat: "urgent",
      contestReserve: 8,
      remotePressureReserve: 20,
      rdPressureSpendTarget: 0,
      pressureRunwayTarget: 20,
      economyTurnCreditCeiling: 20,
    });
    expect(remote).toMatchObject({
      scoreThreat: true,
      pathCost: 12,
      creditsAfterRun: 8,
      recommendation: "run_now",
    });
  });
});

function aiInput(params: {
  credits: number;
  stateVersion?: number;
  opponentCredits?: number;
  opponentHandCount?: number;
  servers: PlayerView["servers"];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  grip?: VisibleCard[];
  eventTail?: PublicGameEvent[];
}): AiDecisionInput {
  const playerView: PlayerView = {
    stateVersion: params.stateVersion ?? 1,
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
      credits: params.opponentCredits ?? 5,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: params.opponentHandCount ?? 5,
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

function pressureReserveInput(
  credits: number,
  options: {
    advancedRemote?: boolean;
    additionalRig?: VisibleCard[];
    additionalActions?: LegalAction[];
  } = {},
): AiDecisionInput {
  const fracter = visibleCard("runner-efficient-fracter", {
    definitionId: "efficient_fracter",
    title: "Efficient Fracter",
    type: "program",
    subtypes: ["icebreaker", "fracter"],
    strength: 3,
  });
  return aiInput({
    credits,
    stateVersion: 20,
    rig: [fracter, ...(options.additionalRig ?? [])],
    servers: [
      server("rd", { ice: [expensiveBarrierIce("rd-tax")] }),
      server("remote_1", {
        ice: [
          expensiveBarrierIce("remote-tax-1"),
          expensiveBarrierIce("remote-tax-2"),
          expensiveBarrierIce("remote-tax-3"),
        ],
        root: [
          visibleCard("remote-hidden-card", {
            known: false,
            advancementCounters: options.advancedRemote ? 2 : 0,
          }),
        ],
      }),
    ],
    legalActions: [
      runAction("run-rd", "rd"),
      runAction("run-remote-1", "remote_1"),
      gainCreditAction("gain-credit"),
      ...(options.additionalActions ?? []),
    ],
  });
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

function activatedPrivateLookRun(actionId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "activated_card_ability",
    label: "Use installed program",
    source: "protocol-installed",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    payload: {
      cardId: "protocol-installed",
      cardImplementationEffectKind: "make_run",
      runActionKind: "make_run",
      serverId: "rd",
      successfulRunAccessReplacement: "private_look_top_rd",
      successfulRunPrivateLookCount: 5,
    },
  };
}

function wilsonRunAbilityAction(
  actionId: string,
  serverId: string,
): LegalAction {
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
  payload: LegalAction["payload"] = {},
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
    payload: { sourceDefinitionId, ...payload },
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

function drawCardAction(actionId: string): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "draw_card",
    label: "Draw card",
    source: "basic_action",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
  };
}

function bankPayoutAction(
  actionId: string,
  label: string,
  payload: LegalAction["payload"] = {},
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "activated_card_ability",
    label,
    source: "runner-bank-source",
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }],
    targetRequirements: [],
    visibility: "public",
    expiresAtStateVersion: 2,
    ...(Object.keys(payload).length > 0 ? { payload } : {}),
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
  const ice = visibleCard(instanceId, {
    definitionId: "simple_barrier_ice",
    title: "Simple Barrier ICE",
    type: "ice",
    subtypes: ["barrier"],
    known: true,
    rezzed: true,
    strength: 3,
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 3,
    subroutines: [
      {
        id: "simple_barrier_ice_etr",
        type: "end_the_run",
        sourceDefinitionId: "simple_barrier_ice",
        sourceTitle: "Simple Barrier ICE",
      },
    ],
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
  const ice = visibleCard(instanceId, {
    definitionId: "onr_v1_279_wall-of-static",
    title: "Wall of Static",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 2,
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 2,
    subroutines: [
      {
        id: `${instanceId}_etr`,
        type: "end_the_run",
        sourceDefinitionId: "onr_v1_279_wall-of-static",
        sourceTitle: "Wall of Static",
      },
    ],
  });
}

function keeperIce(instanceId: string): VisibleCard {
  const ice = visibleCard(instanceId, {
    definitionId: "onr_v1_252_keeper",
    title: "Keeper",
    type: "ice",
    subtypes: ["code gate"],
    known: true,
    rezzed: true,
    strength: 4,
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 4,
    subroutines: [
      {
        id: `${instanceId}_etr`,
        type: "end_the_run",
        sourceDefinitionId: "onr_v1_252_keeper",
        sourceTitle: "Keeper",
      },
    ],
  });
}

function dataWallIce(instanceId: string): VisibleCard {
  const ice = visibleCard(instanceId, {
    definitionId: "onr_v1_237_data-wall",
    title: "Data Wall",
    type: "ice",
    subtypes: ["wall"],
    known: true,
    rezzed: true,
    strength: 0,
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 0,
    subroutines: [
      {
        id: `${instanceId}_etr`,
        type: "end_the_run",
        sourceDefinitionId: "onr_v1_237_data-wall",
        sourceTitle: "Data Wall",
      },
    ],
  });
}

function vacuumLinkIce(instanceId: string): VisibleCard {
  const ice = visibleCard(instanceId, {
    definitionId: "onr_v1_275_vacuum-link",
    title: "Vacuum Link",
    type: "ice",
    subtypes: ["sentry", "random"],
    known: true,
    rezzed: true,
    strength: 5,
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 5,
    subroutines: [
      {
        id: `${instanceId}_rewind`,
        type: "rewind_run_to_rezzed_ice_by_die",
        sourceDefinitionId: "onr_v1_275_vacuum-link",
        sourceTitle: "Vacuum Link",
      },
    ],
  });
}

function simpleCodeGateIce(instanceId: string): VisibleCard {
  return visibleCard(instanceId, {
    definitionId: "simple_code_gate_ice",
    title: "Simple Code Gate ICE",
    type: "ice",
    subtypes: ["code_gate"],
    known: true,
    rezzed: true,
    strength: 2,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "simple_code_gate_ice",
      effectiveStrength: 2,
      subroutines: [
        {
          id: `${instanceId}_corp_gain_credit`,
          type: "corp_gain_credit",
          amount: 1,
        },
        {
          id: `${instanceId}_etr`,
          type: "end_the_run",
        },
      ],
    },
  });
}

function caryatidAsCodeGateIce(instanceId: string): VisibleCard {
  return visibleCard(instanceId, {
    definitionId: "onr_proteus_013_caryatid",
    title: "Caryatid",
    type: "ice",
    subtypes: ["code_gate"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_proteus_013_caryatid",
      effectiveStrength: 5,
      subroutines: [
        {
          id: "onr_proteus_013_caryatid_etr",
          type: "end_the_run",
        },
      ],
    },
  });
}

function aspTraceRunLockIce(instanceId: string): VisibleCard {
  return visibleCard(instanceId, {
    definitionId: "onr_v1_221_asp",
    title: "Asp",
    type: "ice",
    subtypes: ["sentry", "trace"],
    known: true,
    rezzed: true,
    strength: 4,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_221_asp",
      effectiveStrength: 4,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_221_asp",
          sourceTitle: "Asp",
          traceLimit: 5,
          traceSuccessEffect: { type: "end_run_and_run_lock", amount: 1 },
          unbrokenRunEffect: { createsRunLockOrActionTax: 1 },
        },
      ],
    },
  });
}

function hunterTraceTagIce(instanceId: string): VisibleCard {
  return visibleCard(instanceId, {
    definitionId: "onr_v1_249_hunter",
    title: "Hunter",
    type: "ice",
    subtypes: ["sentry", "bloodhound"],
    known: true,
    rezzed: true,
    strength: 5,
    effectiveRunQuote: {
      iceInstanceId: instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: `${instanceId}_trace`,
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          traceLimit: 5,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
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
    activationPrerequisites: [],
    priority: 600,
    deferReason: "missing_credits",
    evidence: ["source:own_runner_hand"],
    ...overrides,
  };
}

function evidenceNumber(evidence: string[], key: string): number {
  const prefix = `${key}:`;
  const raw = evidence
    .find((entry) => entry.startsWith(prefix))
    ?.slice(prefix.length);
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
  knownSequenceDefinitionIds?: string[];
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
    ...(params.knownSequenceDefinitionIds
      ? { knownSequenceDefinitionIds: params.knownSequenceDefinitionIds }
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
  const unknownRestCount =
    options.unknownRestCount ??
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
