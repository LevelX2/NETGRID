import { afterEach, describe, expect, it } from "vitest";

import { chooseCorpAction, chooseRunnerAction } from "./index";
import { getTacticalPlanMemorySnapshot, resetTacticalPlanMemory } from "./tactical-plans";
import type {
  AiDecisionInput,
  AiDifficulty,
  LegalAction,
  PlayerView,
  PublicGameEvent,
  Side,
  VisibleCard,
} from "@netgrid/shared";

describe("Semantic AI runtime cutover", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  afterEach(() => {
    resetTacticalPlanMemory();
    if (originalRuntimeMode === undefined) {
      delete process.env.NETGRID_SEMANTIC_AI_RUNTIME;
    } else {
      process.env.NETGRID_SEMANTIC_AI_RUNTIME = originalRuntimeMode;
    }
  });

  it("uses semantic runtime as the live runner decision by default", () => {
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("remove-tag", "runner", "remove_tag", "Remove tag", {
        credits: 2,
      }),
    ]);
    input.playerView.own.tags = 1;

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("remove-tag");
    expect(decision.reasonCode).toBe("runner.semantic.tag_removal");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_runtime_default:true",
        "semantic_runtime_scope:tag_removal",
      ]),
    );
    expect(decision.fallbackUsed).toBe(false);
  });

  it("uses semantic runtime as the live corp decision by default", () => {
    const input = aiInput("corp", [
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("score", "corp", "score_agenda", "Score agenda", {
        credits: 0,
      }),
    ]);

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("score");
    expect(decision.reasonCode).toBe("corp.semantic.simple_score_advance");
    expect(decision.evidence).toContain("semantic_runtime_default:true");
    expect(decision.fallbackUsed).toBe(false);
  });

  it("prefers central ICE protection over another empty remote shell", () => {
    const input = aiInput("corp", [
      legalAction(
        "build-empty-new-remote",
        "corp",
        "install_card",
        "Install ICE protecting a new remote",
        { credits: 0 },
        {
          source: "ice-for-new-remote",
          payload: { placement: "ice", serverId: "new_remote" },
        },
      ),
      legalAction(
        "protect-rd",
        "corp",
        "install_card",
        "Install ICE protecting R&D",
        { credits: 0 },
        { source: "ice-for-rd", payload: { placement: "ice", serverId: "rd" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("ice-for-new-remote", "corp", "ice"),
      visibleCard("ice-for-rd", "corp", "ice"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [visibleCard("remote-ice-1", "corp", "ice")]),
      server("remote_2", [visibleCard("remote-ice-2", "corp", "ice")]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("protect-rd");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_empty_remote_count:2",
        "corp_remote_risk:present",
        "corp_protection:central_ice",
      ]),
    );
  });

  it("defers a new naked remote agenda install when safe alternatives are legal", () => {
    const input = aiInput("corp", [
      legalAction(
        "install-new-remote-agenda",
        "corp",
        "install_card",
        "Install agenda in a new remote",
        { credits: 0 },
        {
          source: "agenda-in-hq",
          payload: { placement: "root", serverId: "new_remote" },
        },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.gripOrHq = [
      visibleCard("agenda-in-hq", "corp", "agenda", {
        advancementRequirement: 3,
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_risk:unsafe_score_action_available",
        "corp_safe_alternative:economy",
      ]),
    );
  });

  it("does not advance a naked remote score line when safe alternatives are legal", () => {
    const remoteAgenda = visibleCard("remote-agenda", "corp", "agenda", {
      advancementCounters: 1,
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "advance-naked-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "corp", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [remoteAgenda]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "corp_remote_risk:naked_score_line_present",
        "corp_safe_alternative:economy",
      ]),
    );
  });

  it("keeps a protected remote score line selectable", () => {
    const remoteAgenda = visibleCard("protected-remote-agenda", "corp", "agenda", {
      advancementCounters: 1,
      advancementRequirement: 3,
    });
    const input = aiInput("corp", [
      legalAction(
        "advance-protected-agenda",
        "corp",
        "advance_card",
        "Advance installed agenda",
        { credits: 1 },
        { source: remoteAgenda.instanceId, payload: { serverId: "remote_1" } },
      ),
      legalAction("gain-credit", "corp", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [visibleCard("remote-protection-ice", "corp", "ice")],
        [remoteAgenda],
      ),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("advance-protected-agenda");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["corp_remote_protection:protected"]),
    );
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
      server("remote_1", [
        visibleCard("onr_v1_279_wall-of-static", "corp", "ice", { rezzed: true }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("draw");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_type:runner.obtain_breaker_coverage",
        "tactical_step:draw_for_answer",
      ]),
    );
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.obtain_breaker_coverage",
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining([
            "blocked_plan_count:1",
            "selected_step_kind:draw_for_answer",
            "selected_step_mapping:matched",
          ]),
        }),
      ]),
    );
  });

  it("builds credits when a matching blocked-server breaker is already in hand", () => {
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
        installCost: 6,
        subtypes: ["Fracter"],
        rulesText: "1 credit: Break 1 barrier subroutine.",
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("onr_v1_279_wall-of-static", "corp", "ice", {
          rezzed: true,
        }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "tactical_plan_type:runner.obtain_breaker_coverage",
        "tactical_step:gain_credits",
      ]),
    );
    expect(decision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining(["selected_step_kind:gain_credits"]),
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
    expect(decision.reasonCode).toBe("runner.semantic.simple_run_choice");
    expect(debugText).toContain(
      "semantic_excluded:pump_cannot_lead_to_useful_break",
    );
    expect(debugText).toContain("pump_required_count:1");
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
    expect(decision.reasonCode).toBe("runner.semantic.simple_run_choice");
    expect(debugText).toContain(
      "semantic_excluded:break_cannot_preserve_access_path",
    );
    expect(debugText).toContain("break_future_path_blocked_after_cost:true");
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
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_hand_funding_target",
        }),
      ]),
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
      server("remote_1", [
        visibleCard("onr_v1_279_wall-of-static", "corp", "ice", { rezzed: true }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const previewDecision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(previewDecision.actionId).toBe("draw");
    expect(previewDecision.evidence).toContain(
      "tactical_plan_memory_preview_only:true",
    );
    expect(getTacticalPlanMemorySnapshot(input)).toBeUndefined();

    const liveDecision = chooseRunnerAction(input);

    expect(liveDecision.actionId).toBe(previewDecision.actionId);
    expect(getTacticalPlanMemorySnapshot(input)).toMatchObject({
      type: "runner.obtain_breaker_coverage",
    });
  });

  it("keeps an opportunistic central run available while a remote plan is blocked", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
    ]);
    input.playerView.own.rig = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("onr_v1_279_wall-of-static", "corp", "ice", { rezzed: true }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-hq");
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.opportunistic_central_run",
    );
  });

  it("uses Broker build and payout as explicit credit-bank plans", () => {
    const stableInput = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "trigger_ability",
        "Credits auf Broker legen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    stableInput.playerView.own.credits = 6;

    const stableDecision = chooseRunnerAction(stableInput);

    expect(stableDecision.actionId).toBe("broker-load");
    expect(stableDecision.decisionDebug?.planKind).toBe(
      "runner.build_credit_bank",
    );

    const lowCreditInput = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "trigger_ability",
        "Credits von Broker nehmen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    lowCreditInput.playerView.own.credits = 2;

    const lowCreditDecision = chooseRunnerAction(lowCreditInput);

    expect(lowCreditDecision.actionId).toBe("broker-take");
    expect(lowCreditDecision.decisionDebug?.planKind).toBe(
      "runner.cash_out_credit_bank",
    );
  });

  it("does not cash out Broker immediately after a stable bank-build plan", () => {
    const stableInput = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "trigger_ability",
        "Credits auf Broker legen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    stableInput.playerView.own.credits = 6;

    const buildDecision = chooseRunnerAction(stableInput);
    expect(buildDecision.actionId).toBe("broker-load");

    const payoutInput = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "trigger_ability",
        "Credits von Broker nehmen",
        { credits: 0 },
        { source: "broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    payoutInput.playerView.own.credits = 6;

    const payoutDecision = chooseRunnerAction(payoutInput);

    expect(payoutDecision.actionId).toBe("gain-credit");
    expect(payoutDecision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining([
            "previous_plan_type:runner.build_credit_bank",
          ]),
        }),
      ]),
    );
  });

  it("prefers the first empty Broker build over low-value runs and generic setup", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "3 Credits auf Broker legen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("broker-load");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_investment_commitment",
          reason: expect.stringContaining(
            "bankCommitmentStatus:build_first_load",
          ),
        }),
      ]),
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "run-rd",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_commitment_build_over_low_run",
            reason: expect.stringContaining(
              "why_bank_build_over_run:low_value_run",
            ),
          }),
        ]),
      }),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("lets known agenda remotes override an active Broker build commitment", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "3 Credits auf Broker legen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-remote");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_commitment_run_override",
          reason: expect.stringContaining(
            "why_run_over_bank_build:known_agenda",
          ),
        }),
      ]),
    );
  });

  it("defers Broker cashout when no funding need or bank threshold is visible", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Credits von Broker nehmen",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counters: { bit: 3 },
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 3,
            displayKind: "stored_credits",
            label: "3",
            ariaLabel: "3 stored credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "broker-take",
        excluded: true,
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_cashout_gate",
            reason: expect.stringContaining("why_cashout_now:no_funding_need"),
          }),
        ]),
      }),
    );
  });

  it("devalues Broker install when a later bank load is not plausible", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-broker",
        "runner",
        "install_card",
        "Install Broker",
        { credits: 0 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 1;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "install-broker",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_install_commitment",
            reason: expect.stringContaining(
              "why_broker_install_deferred:no_plausible_followup_load",
            ),
          }),
        ]),
      }),
    );
  });

  it("defers low-value runs while Top Runners' Conference value is unrealized", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("gain-credit");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "run-rd",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_no_run_economy_run_penalty",
            reason: expect.stringContaining(
              "why_run_deferred_for_conference:low_value_run",
            ),
          }),
        ]),
      }),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("devalues Top Runners' Conference install without a setup window", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-conference",
        "runner",
        "install_card",
        "Install Top Runners' Conference",
        { credits: 0 },
        { source: "onr_v1_184_top-runners-conference" },
      ),
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-rd");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "install-conference",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_no_run_economy_install_commitment",
            reason: expect.stringContaining(
              "why_conference_install_deferred:no_setup_window",
            ),
          }),
        ]),
      }),
    );
  });

  it("allows known agenda runs to break Top Runners' Conference commitment", () => {
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
    input.playerView.own.credits = 4;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-remote");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_no_run_economy_run_override",
          reason: expect.stringContaining(
            "why_run_allowed_despite_conference:known_agenda",
          ),
        }),
      ]),
    );
  });

  it("reduces Top Runners' Conference run penalty after start-of-turn value is realized", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    input.eventTail = [
      {
        eventId: "conference-start-credit",
        type: "automatic_effects_resolved",
        stateVersionBefore: 1,
        stateVersionAfter: 2,
        stateHashAfter: "fnv1a:conference",
        visibilityClass: "public",
        publicPayload: {
          resolvedEffects: [
            {
              kind: "gain_credits",
              side: "runner",
              amount: 2,
              reason: "start_of_turn",
              sourceDefinitionId: "onr_v1_184_top-runners-conference",
              sourceTitle: "Top Runners' Conference",
              visibility: "public",
            },
          ],
        },
      },
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-rd");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_no_run_economy_run_penalty",
          value: -850,
          reason: expect.stringContaining("realizedValueEstimate:2"),
        }),
      ]),
    );
  });

  it("does not treat turn-start economy without run drawback as no-run commitment", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_295_night-shift", "runner", "resource"),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];

    const decision = chooseRunnerAction(input);

    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "noRunEconomyCommitmentActive:true",
    );
  });

  it("returns from an opportunistic central run to the blocked remote coverage plan", () => {
    const centralInput = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
    ]);
    centralInput.playerView.own.rig = [];
    centralInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("onr_v1_279_wall-of-static", "corp", "ice", { rezzed: true }),
      ], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];

    const centralDecision = chooseRunnerAction(centralInput);
    expect(centralDecision.actionId).toBe("run-hq");

    const followupInput = aiInput("runner", [
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    followupInput.playerView.stateVersion = 2;
    followupInput.playerView.own.rig = [];
    followupInput.playerView.servers = centralInput.playerView.servers;

    const followupDecision = chooseRunnerAction(followupInput);

    expect(followupDecision.actionId).toBe("draw");
    expect(followupDecision.decisionDebug?.planKind).toBe(
      "runner.obtain_breaker_coverage",
    );
    expect(followupDecision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining([
            "previous_plan_type:runner.opportunistic_central_run",
            "plan_progression_reason:previous_central_probe_ttl_expired",
          ]),
        }),
      ]),
    );
  });

  it("does not continue a satisfied R&D probe into the same known low-value top card", () => {
    const initialInput = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    initialInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];

    const initialDecision = chooseRunnerAction(initialInput);
    expect(initialDecision.actionId).toBe("run-rd");

    const followupInput = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction(
        "run-hq",
        "runner",
        "start_run",
        "Run HQ",
        { credits: 0 },
        { payload: { serverId: "hq" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    followupInput.playerView.stateVersion = 3;
    followupInput.playerView.servers = initialInput.playerView.servers;
    followupInput.eventTail = [
      rdAccessEvent(
        "semantic-rd-rock-access",
        1,
        "onr_v1_265_rock-is-strong",
      ),
    ];

    const followupDecision = chooseRunnerAction(followupInput);
    const selected = followupInput.legalActions.find(
      (action) => action.actionId === followupDecision.actionId,
    );
    const tacticalDebug = followupDecision.decisionDebug?.detailSections
      ?.find((section) => section.id === "tactical_plan")
      ?.items.join("\n") ?? "";

    expect(
      selected?.type === "start_run" && selected.payload?.serverId === "rd",
    ).toBe(false);
    expect(tacticalDebug).toContain("runner.opportunistic_central_run:rd");
    expect(tacticalDebug).toContain("status=abandoned");
    expect(tacticalDebug).toContain("blockers=target_unreachable");
    expect(tacticalDebug).toContain(
      "plan_progression_reason:previous_central_probe_satisfied",
    );
    expect(JSON.stringify(followupDecision.decisionDebug)).toContain(
      "semantic_excluded:known_central_no_current_payoff",
    );
  });

  it("excludes a stale known low-value R&D top card from semantic fallback choices", () => {
    const input = aiInput("runner", [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.stateVersion = 3;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    input.eventTail = [
      rdAccessEvent(
        "semantic-rd-rock-fallback-access",
        1,
        "onr_v1_265_rock-is-strong",
      ),
    ];

    const decision = chooseRunnerAction(input);
    const debugText = JSON.stringify(decision.decisionDebug);

    expect(decision.actionId).toBe("gain-credit");
    expect(debugText).toContain(
      "semantic_excluded:known_central_no_current_payoff",
    );
    expect(debugText).toContain("payoff:known_low_value");
    expect(debugText).toContain("rd_run_suppressed_by_known_low_value_top:true");
  });

  it("represents a corp rez window as a rez defense plan", () => {
    const input = aiInput("corp", [
      legalAction(
        "rez-outer",
        "corp",
        "rez_ice",
        "Rez outer ICE",
        { credits: 3 },
        { source: "outer-ice", payload: { serverId: "remote_1" } },
      ),
      legalAction("decline-rez", "corp", "decline_rez", "Decline rez", {
        credits: 0,
      }),
    ]);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [visibleCard("outer-ice", "corp", "ice")]),
    ];

    const decision = chooseCorpAction(input);

    expect(decision.actionId).toBe("rez-outer");
    expect(decision.decisionDebug?.planKind).toBe("corp.rez_defense");
    expect(decision.evidence).toContain("tactical_step:rez_outer_ice");
  });

  it("keeps legacy available only through the explicit runtime kill switch", () => {
    process.env.NETGRID_SEMANTIC_AI_RUNTIME = "legacy";
    const input = aiInput("runner", [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("remove-tag", "runner", "remove_tag", "Remove tag", {
        credits: 2,
      }),
    ]);
    input.playerView.own.tags = 1;

    const decision = chooseRunnerAction(input);

    expect(decision.reasonCode).not.toContain(".semantic.");
    expect(decision.evidence).toContain("semantic_runtime_force_legacy");
  });
});

function aiInput(side: Side, legalActions: LegalAction[]): AiDecisionInput {
  return {
    side,
    playerView: playerView(side, legalActions),
    eventTail: [],
    legalActions,
    difficulty: "normal" satisfies AiDifficulty,
    seed: "semantic-runtime-cutover-test",
    decisionId: `semantic-runtime-cutover:${side}`,
    actionNumber: 1,
    profileId: `${side}-semantic-runtime-cutover-test`,
  };
}

function playerView(side: Side, legalActions: LegalAction[]): PlayerView {
  const ownSide = side;
  const opponentSide = side === "runner" ? "corp" : "runner";
  return {
    stateVersion: 1,
    side,
    activeSide: side,
    phase: side === "runner" ? "runner_action_phase" : "corp_action_phase",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    own: {
      identity: identityCard(ownSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      gripOrHq: [],
      stackOrRdCount: 0,
      heapOrArchives: [],
      scoreArea: [],
      maxHandSize: 5,
      tags: 0,
    },
    opponent: {
      identity: identityCard(opponentSide),
      credits: 4,
      clicks: 3,
      agendaPoints: 0,
      tags: 0,
      handCount: 5,
      maxHandSize: 5,
      deckCount: 0,
      discardCount: 0,
      scoreArea: [],
    },
    servers: [],
    publicEvents: [],
    legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
}

function identityCard(side: Side): VisibleCard {
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
  side: Side,
  type: NonNullable<VisibleCard["type"]>,
  overrides: Omit<
    Partial<VisibleCard>,
    | "instanceId"
    | "definitionId"
    | "title"
    | "owner"
    | "controller"
    | "type"
    | "known"
  > = {},
): VisibleCard {
  return {
    instanceId,
    definitionId: instanceId,
    title: instanceId,
    owner: side,
    controller: side,
    type,
    known: true,
    ...overrides,
  };
}

function server(
  id: PlayerView["servers"][number]["id"],
  ice: VisibleCard[] = [],
  root: VisibleCard[] = [],
): PlayerView["servers"][number] {
  return {
    id,
    label: id,
    ice,
    root,
  };
}

function legalAction(
  actionId: string,
  side: Side,
  type: LegalAction["type"],
  label: string,
  cost: { credits: number },
  options: {
    source?: LegalAction["source"];
    payload?: LegalAction["payload"];
    visibility?: LegalAction["visibility"];
  } = {},
): LegalAction {
  const action: LegalAction = {
    actionId,
    side,
    type,
    label,
    source: options.source ?? "basic_action",
    timingPoint: side === "runner" ? "runner_action.main" : "corp_action.main",
    costs: [cost],
    targetRequirements: [],
    visibility: options.visibility ?? "public",
    expiresAtStateVersion: 2,
  };
  if (options.payload) action.payload = options.payload;
  return action;
}

function rdAccessEvent(
  eventId: string,
  stateVersionBefore: number,
  cardDefinitionId: string,
): PublicGameEvent {
  return {
    eventId,
    type: "access_card",
    stateVersionBefore,
    stateVersionAfter: stateVersionBefore + 1,
    stateHashAfter: `fnv1a:${eventId}`,
    visibilityClass: "public",
    publicPayload: {
      actor: "runner",
      actionType: "access_card",
      serverId: "rd",
      cardDefinitionId,
    },
  };
}
