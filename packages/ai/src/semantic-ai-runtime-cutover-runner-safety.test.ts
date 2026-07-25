import { afterEach, describe, expect, it } from "vitest";
import { chooseRunnerAction } from "./index";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
} from "./decision/pilot-scope-registry";
import {
  getTacticalPlanMemorySnapshot,
  resetTacticalPlanMemory,
} from "./tactical-plans";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "./plans/resident-plan-portfolio-memory";
import { missingBreakerCoverageKind } from "./plans/tactical-plan-breaker-coverage";
import type { VisibleCard } from "@netgrid/shared";
import {
  attachOwnDeckSnapshot,
  aiInput,
  legalAction,
  publicEvent,
  server,
  visibleCard,
} from "./semantic-ai-runtime-cutover.test-support";

describe("Semantic AI runtime cutover — Runner safety contracts", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  const originalPilotMode = process.env[AI_PLAY_STRENGTH_PILOT_ENV];

  const originalLocalDefaultMode =
    process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];

  afterEach(() => {
    resetTacticalPlanMemory();
    resetResidentPlanPortfolioMemory();
    if (originalRuntimeMode === undefined) {
      delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    } else {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalRuntimeMode;
    }
    if (originalPilotMode === undefined) {
      delete process.env[AI_PLAY_STRENGTH_PILOT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_PILOT_ENV] = originalPilotMode;
    }
    if (originalLocalDefaultMode === undefined) {
      delete process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];
    } else {
      process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV] =
        originalLocalDefaultMode;
    }
  });

  it("uses a breaker coverage plan step before a blocked remote contest", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("onr_v1_279_wall-of-static", "corp", "ice", {
            rezzed: true,
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "runner-wall-coverage-safety",
      side: "runner",
      cards: [{ cardId: "onr_v1_053_ramming-piston", quantity: 1 }],
    });

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.rig_and_coverage",
        "plan_step_capability:draw_for_answer_breaker_wall",
      ]),
    );
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.rig_and_coverage",
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "plan_execution",
          items: expect.arrayContaining([
            "module:runner.rig_and_coverage",
            "capability:draw_for_answer_breaker_wall",
          ]),
        }),
      ]),
    );
  });

  it("draws for a barrier breaker when the hand card only breaks trace subroutines", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 1;
    input.playerView.own.rig = [];
    input.playerView.own.gripOrHq = [
      visibleCard("expensive-fracter", "runner", "program", {
        definitionId: "onr_v1_056_replicator",
        title: "Replicator",
        installCost: 6,
        subtypes: ["Icebreaker"],
        rulesText: "Break a Trace subroutine.",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("onr_v1_279_wall-of-static", "corp", "ice", {
            rezzed: true,
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    expect(
      missingBreakerCoverageKind(input.playerView, "remote_1"),
    ).toBe("breaker_wall");
    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.defense_and_recovery",
        "plan_step_capability:build_required_hand_buffer",
      ]),
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "plan_execution",
          items: expect.arrayContaining([
            "module:runner.defense_and_recovery",
            "capability:build_required_hand_buffer",
          ]),
        }),
      ]),
    );
  });

  it("does not spend the Runner's last credit on a pump that still cannot break the encountered ICE", () => {
    const dwarf: VisibleCard = {
      instanceId: "runner-dwarf",
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      owner: "runner",
      controller: "runner",
      type: "program",
      subtypes: ["icebreaker", "fracter"],
      known: true,
      strength: 3,
    };
    const crystalWall: VisibleCard = {
      instanceId: "corp-crystal-wall",
      definitionId: "onr_v1_232_crystal-wall",
      title: "Crystal Wall",
      owner: "corp",
      controller: "corp",
      type: "ice",
      subtypes: ["wall"],
      known: true,
      rezzed: true,
      strength: 4,
      strengthModifier: 1,
    };
    const pump = legalAction(
      "pump-dwarf",
      "runner",
      "pump_breaker",
      "Dwarf: Stärke +1",
      { credits: 1 },
      { source: dwarf.instanceId, visibility: "private_to_actor" },
    );
    const continueIntoEtr = legalAction(
      "continue-etr",
      "runner",
      "continue_run",
      "Subroutinen auslösen (Run endet)",
      { credits: 0 },
      {
        visibility: "private_to_actor",
        payload: {
          encounterContinue: true,
          unbrokenSubroutineCount: 1,
          encounterWillEndRun: true,
          sourceDefinitionId: "onr_v1_232_crystal-wall",
        },
      },
    );
    pump.timingPoint = "run.encounter_ice";
    continueIntoEtr.timingPoint = "run.encounter_ice";
    const input = aiInput("runner", [pump, continueIntoEtr]);
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 2;
    input.playerView.own.rig = [dwarf];
    input.playerView.servers = [
      server("hq"),
      server("rd", [crystalWall]),
      server("archives"),
    ];
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: crystalWall,
      successful: false,
    };

    const decision = chooseRunnerAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(continueIntoEtr.actionId);
    expect(decision.reasonCode).toBe(
      "plan_first.runner.convert_run_window",
    );
    expect(debugText).toContain(
      "encounter_action_excluded:pump_cannot_lead_to_useful_break",
    );
    expect(debugText).toContain("pump_required_count:1");
  });

  it("uses visible non-noisy run credits when deciding whether pumps can reach a break", () => {
    const codecracker: VisibleCard = {
      instanceId: "runner-codecracker",
      definitionId: "onr_v1_014_codecracker",
      title: "Codecracker",
      owner: "runner",
      controller: "runner",
      type: "program",
      subtypes: ["icebreaker"],
      known: true,
      strength: 0,
    };
    const quiet: VisibleCard = {
      instanceId: "runner-quiet",
      definitionId: "onr_v1_071_vewy-vewy-quiet",
      title: "Vewy Vewy Quiet",
      owner: "runner",
      controller: "runner",
      type: "resource",
      subtypes: ["stealth"],
      known: true,
      counters: { bit: 2 },
      counterDisplays: [
        {
          id: "restricted_pool",
          amount: 2,
          displayKind: "restricted_pool",
          label: "Run-Bits",
          ariaLabel: "2 Run-Bits",
          counterType: "bit",
          usageHint: "spendable",
          creditPool: {
            kind: "restricted_credit",
            capacity: 2,
            uses: ["using_icebreaker_during_run_non_noisy"],
            refresh: {
              timing: "start_of_runner_turn",
              behavior: "refill_to_capacity_if_used",
            },
          },
        },
      ],
    };
    const keeper: VisibleCard = {
      instanceId: "corp-keeper",
      definitionId: "onr_v1_252_keeper",
      title: "Keeper",
      owner: "corp",
      controller: "corp",
      type: "ice",
      subtypes: ["code_gate"],
      known: true,
      rezzed: true,
      strength: 4,
      effectiveRunQuote: {
        iceInstanceId: "corp-keeper",
        iceDefinitionId: "onr_v1_252_keeper",
        effectiveStrength: 4,
        subroutines: [{ id: "keeper-etr", type: "end_the_run" }],
      },
    };
    const pump = legalAction(
      "pump-codecracker",
      "runner",
      "pump_breaker",
      "Codecracker: Stärke +1",
      { credits: 1 },
      {
        source: codecracker.instanceId,
        visibility: "private_to_actor",
        payload: {
          breakerId: codecracker.instanceId,
          iceId: keeper.instanceId,
        },
      },
    );
    const continueIntoEtr = legalAction(
      "continue-keeper-etr",
      "runner",
      "continue_run",
      "Subroutinen auslösen (Run endet)",
      { credits: 0 },
      {
        visibility: "private_to_actor",
        payload: {
          encounterContinue: true,
          unbrokenSubroutineCount: 1,
          encounterWillEndRun: true,
          sourceDefinitionId: "onr_v1_252_keeper",
        },
      },
    );
    pump.timingPoint = "run.encounter_ice";
    continueIntoEtr.timingPoint = "run.encounter_ice";
    const input = aiInput("runner", [pump, continueIntoEtr]);
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 2;
    input.playerView.own.clicks = 0;
    input.playerView.own.rig = [codecracker, quiet];
    input.playerView.servers = [
      server("hq"),
      server("rd", [keeper]),
      server("archives"),
    ];
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 0 },
      encounteredIce: keeper,
      successful: false,
    };

    const decision = chooseRunnerAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(pump.actionId);
    expect(decision.reasonCode).toBe(
      "plan_first.runner.convert_run_window",
    );
    expect(debugText).not.toContain("pump_cannot_reach_break_strength:true");

    input.playerView.own.rig = [codecracker];
    const unaffordableDecision = chooseRunnerAction(input);
    const unaffordableDebugText = JSON.stringify(
      unaffordableDecision.decisionDebug,
    );

    expect(unaffordableDecision.actionId).toBe(continueIntoEtr.actionId);
    expect(unaffordableDebugText).toContain(
      "pump_cannot_reach_break_strength:true",
    );
    expect(unaffordableDebugText).toContain("pump_required_count:4");
  });

  it("does not spend the Runner's last credit on a break when the remaining ICE path is still unaffordable", () => {
    const dwarf: VisibleCard = {
      instanceId: "runner-dwarf",
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      owner: "runner",
      controller: "runner",
      type: "program",
      subtypes: ["icebreaker", "fracter"],
      known: true,
      strength: 4,
    };
    const outerCrystalWall: VisibleCard = {
      instanceId: "corp-outer-crystal-wall",
      definitionId: "onr_v1_232_crystal-wall",
      title: "Crystal Wall",
      owner: "corp",
      controller: "corp",
      type: "ice",
      subtypes: ["wall"],
      known: true,
      rezzed: true,
      strength: 4,
    };
    const currentCrystalWall: VisibleCard = {
      instanceId: "corp-current-crystal-wall",
      definitionId: "onr_v1_232_crystal-wall",
      title: "Crystal Wall",
      owner: "corp",
      controller: "corp",
      type: "ice",
      subtypes: ["wall"],
      known: true,
      rezzed: true,
      strength: 4,
      effectiveRunQuote: {
        iceInstanceId: "corp-current-crystal-wall",
        iceDefinitionId: "onr_v1_232_crystal-wall",
        effectiveStrength: 4,
        subroutines: [{ id: "current-etr", type: "end_the_run" }],
      },
    };
    const breakCurrent = legalAction(
      "break-current-wall",
      "runner",
      "break_subroutine",
      "Dwarf: Subroutine brechen",
      { credits: 1 },
      {
        source: dwarf.instanceId,
        visibility: "private_to_actor",
        payload: {
          breakerId: dwarf.instanceId,
          iceId: currentCrystalWall.instanceId,
          subroutineIndex: 0,
        },
      },
    );
    const continueIntoEtr = legalAction(
      "continue-etr",
      "runner",
      "continue_run",
      "Subroutinen auslösen (Run endet)",
      { credits: 0 },
      {
        visibility: "private_to_actor",
        payload: {
          encounterContinue: true,
          unbrokenSubroutineCount: 1,
          encounterWillEndRun: true,
          sourceDefinitionId: "onr_v1_232_crystal-wall",
        },
      },
    );
    breakCurrent.timingPoint = "run.encounter_ice";
    continueIntoEtr.timingPoint = "run.encounter_ice";
    const input = aiInput("runner", [breakCurrent, continueIntoEtr]);
    input.playerView.timingPoint = "run.encounter_ice";
    input.playerView.own.credits = 1;
    input.playerView.own.clicks = 2;
    input.playerView.own.rig = [dwarf];
    input.playerView.servers = [
      server("hq"),
      server("rd", [outerCrystalWall, currentCrystalWall]),
      server("archives"),
    ];
    input.playerView.run = {
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex: 1 },
      encounteredIce: currentCrystalWall,
      successful: false,
    };

    const decision = chooseRunnerAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe(continueIntoEtr.actionId);
    expect(decision.reasonCode).toBe(
      "plan_first.runner.convert_run_window",
    );
    expect(debugText).toContain(
      "encounter_action_excluded:break_cannot_preserve_access_path",
    );
    expect(debugText).toContain("break_future_path_blocked_after_cost:true");
  });

  it("trashes an affordable Crybaby installed in a repeatedly pressured central root", () => {
    const crybaby = visibleCard("crybaby-root", "corp", "upgrade", {
      definitionId: "onr_v1_354_crybaby",
      title: "Crybaby",
      trashCost: 2,
      rezzed: false,
    });
    const trash = legalAction(
      "trash-crybaby",
      "runner",
      "trash_accessed_card",
      "Crybaby trashen",
      { credits: 2 },
      { source: crybaby.instanceId },
    );
    const decline = legalAction(
      "decline-crybaby",
      "runner",
      "decline_trash",
      "Nicht trashen",
      { credits: 0 },
      { source: "game_rule" },
    );
    trash.timingPoint = "access.resolve_card";
    decline.timingPoint = "access.resolve_card";
    const input = aiInput("runner", [trash, decline]);
    input.playerView.timingPoint = "access.resolve_card";
    input.playerView.own.credits = 18;
    input.playerView.own.clicks = 0;
    input.playerView.servers = [
      server("hq", [], [crybaby]),
      server("rd"),
      server("archives"),
    ];
    input.playerView.run = {
      attackedServerId: "hq",
      phase: "access",
      position: { kind: "server", serverId: "hq" },
      accessedCard: crybaby,
      successful: true,
    };

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe(trash.actionId);
    expect(decision.reasonCode).toBe(
      "plan_first.runner.convert_run_window",
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "runner_central_access_trash_low_corp_investment",
    );
  });

  it("builds toward an unaffordable economy payout card in hand", () => {
    const input = aiInput("runner", [
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_108_score", "runner", "event"),
      visibleCard("filler-1", "runner", "event"),
      visibleCard("filler-2", "runner", "event"),
      visibleCard("filler-3", "runner", "event"),
      visibleCard("filler-4", "runner", "event"),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_module:runner.develop_board_and_hand",
        "plan_step_capability:fund_onr_v1_108_score",
      ]),
    );
  });

  it("uses survival defense before a generic R&D probe after visible damage", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.playerView.publicEvents = [
      publicEvent("corp-damage-card-seen", "net_damage", 12, {
        actor: "corp",
        actionType: "net_damage",
        damageType: "net",
        sourceTitle: "Dedicated Response Team",
        sourceDefinitionId: "onr_v1_076_dedicated-response-team",
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.reasonCode).toBe(
      "plan_first.runner.defense_and_recovery",
    );
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.defense_and_recovery",
    );
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_step_capability:build_required_hand_buffer",
        "plan_priority_class:P3",
      ]),
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "run-rd",
        whyNot: expect.arrayContaining([
          expect.stringContaining("not_selected_by_plan:"),
        ]),
      }),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /privatePayload|cardInstances|fullGameState|decklist/i,
    );
  });

  it("does not let non-basic setup actions suppress survival draw before risky R&D runs", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction(
        "use-seeya",
        "runner",
        "activated_card_ability",
        "SeeYa: setup ability",
        { credits: 0 },
        { source: "seeya-instance" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.gripOrHq = [];
    input.playerView.own.rig = [
      visibleCard("seeya-instance", "runner", "hardware", {
        definitionId: "onr_v1_151_seeya",
        title: "SeeYa",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        visibleCard("rd-ice", "corp", "ice", {
          rezzed: false,
        }),
      ]),
      server("archives"),
    ];
    input.playerView.publicEvents = [
      publicEvent("setup-net-damage", "net_damage", 31, {
        actor: "corp",
        actionType: "net_damage",
        damageType: "net",
        damageAmount: 2,
        sourceTitle: "Setup!",
        sourceDefinitionId: "onr_v1_340_setup",
      }),
    ];
    input.playerView.stateVersion = 39;

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.defense_and_recovery",
    );
    expect(decision.evidence).toContain(
      "plan_step_capability:build_required_hand_buffer",
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "run-rd",
        whyNot: expect.arrayContaining([
          expect.stringContaining("not_selected_by_plan:"),
        ]),
      }),
    );
  });

  it("keeps high-payoff remote access above empty-hand draw", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.credits = 3;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [
        visibleCard("agenda", "corp", "agenda", {
          definitionId: "simple_agenda",
        }),
      ]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-remote");
    expect(decision.reasonCode).toBe(
      "plan_first.runner.contest_remote",
    );
    expect(decision.decisionDebug?.planKind).toBe("runner.contest_remote");
    expect(decision.evidence).toContain(
      "plan_step_capability:contest_remote",
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "draw",
        whyNot: expect.arrayContaining([
          expect.stringContaining("not_selected_by_plan:"),
        ]),
      }),
    );
  });

  it("uses a terminal remote-contest plan when Blink recovery is impossible", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    const hiddenIce = visibleCard("hidden-ice", "corp", "ice", {
      rezzed: false,
    });
    hiddenIce.known = false;
    delete hiddenIce.definitionId;
    const hiddenAdvancedRoot = visibleCard(
      "hidden-advanced-root",
      "corp",
      "agenda",
      { advancementCounters: 1 },
    );
    hiddenAdvancedRoot.known = false;
    delete hiddenAdvancedRoot.definitionId;
    input.playerView.own.credits = 17;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [];
    input.playerView.own.stackOrRdCount = 0;
    input.playerView.own.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        subtypes: ["icebreaker", "random"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-data-wall", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            rezzed: true,
          }),
          hiddenIce,
        ],
        [hiddenAdvancedRoot],
      ),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-remote");
    expect(decision.reasonCode).toBe("plan_first.runner.contest_remote");
    expect(decision.evidence).toContain(
      "plan_assessment_evidence:runner_irrecoverable_blink_score_threat_contest:remote_1",
    );
    expect(decision.evidence).not.toContain(
      "fallback_reason:missing_module_coverage",
    );
  });

  it("keeps Blink recovery ahead of a lethal remote contest when draw exists", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    const hiddenIce = visibleCard("hidden-ice", "corp", "ice", {
      rezzed: false,
    });
    hiddenIce.known = false;
    delete hiddenIce.definitionId;
    const hiddenAdvancedRoot = visibleCard(
      "hidden-advanced-root",
      "corp",
      "agenda",
      { advancementCounters: 1 },
    );
    hiddenAdvancedRoot.known = false;
    delete hiddenAdvancedRoot.definitionId;
    input.playerView.own.credits = 17;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [];
    input.playerView.own.stackOrRdCount = 1;
    input.playerView.own.rig = [
      visibleCard("runner-blink", "runner", "program", {
        definitionId: "onr_v1_007_blink",
        subtypes: ["icebreaker", "random"],
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-data-wall", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            rezzed: true,
          }),
          hiddenIce,
        ],
        [hiddenAdvancedRoot],
      ),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.reasonCode).toBe(
      "plan_first.runner.defense_and_recovery",
    );
    expect(decision.evidence).toContain(
      "plan_step_capability:build_required_hand_buffer",
    );
  });

  it("keeps preview decisions from advancing tactical plan memory", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("onr_v1_279_wall-of-static", "corp", "ice", {
            rezzed: true,
          }),
        ],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    attachOwnDeckSnapshot(input, {
      deckSnapshotId: "runner-wall-coverage-preview",
      side: "runner",
      cards: [{ cardId: "onr_v1_053_ramming-piston", quantity: 1 }],
    });

    const previewDecision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(previewDecision.actionId).toBe("draw");
    expect(previewDecision.evidence).toContain(
      "resident_plan_portfolio_preview_only:true",
    );
    expect(residentPlanPortfolioSnapshot(input)).toBeUndefined();
    expect(getTacticalPlanMemorySnapshot(input)).toBeUndefined();

    const liveDecision = chooseRunnerAction(input);

    expect(liveDecision.actionId).toBe(previewDecision.actionId);
    expect(residentPlanPortfolioSnapshot(input)).toMatchObject({
      executorInstanceId: expect.stringContaining(
        "plan:runner.rig_and_coverage:",
      ),
    });
    expect(getTacticalPlanMemorySnapshot(input)).toBeUndefined();
  });
});
