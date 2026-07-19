import { afterEach, describe, expect, it } from "vitest";
import { chooseRunnerAction } from "./index";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
} from "./decision/pilot-scope-registry";
import { resetTacticalPlanMemory } from "./tactical-plans";
import {
  aiInput,
  legalAction,
  publicEvent,
  rdAccessEvent,
  runnerWallCoverageInput,
  server,
  tacticalDebugItems,
  visibleCard,
} from "./semantic-ai-runtime-cutover.test-support";

describe("Semantic AI runtime cutover — Runner plan and memory contracts", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  const originalPilotMode = process.env[AI_PLAY_STRENGTH_PILOT_ENV];

  const originalLocalDefaultMode =
    process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];

  afterEach(() => {
    resetTacticalPlanMemory();
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

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("run-hq");
    expect(decision.decisionDebug?.planKind).toBe(
      "runner.opportunistic_central_run",
    );
  });

  it("uses Broker build and payout as explicit credit-bank plans", () => {
    const bankSource = visibleCard(
      "runner-credit-bank-source",
      "runner",
      "resource",
      {
        definitionId: "onr_v1_154_broker",
        title: "Credit Bank Source",
      },
    );
    const stableInput = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "trigger_ability",
        "Credits auf Bank legen",
        { credits: 0 },
        {
          source: bankSource.instanceId,
          payload: { cardImplementationAddsHostedCredits: true },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    stableInput.playerView.own.credits = 6;
    stableInput.playerView.own.rig = [bankSource];

    const stableDecision = chooseRunnerAction(stableInput);

    expect(stableDecision.actionId).toBe("broker-load");
    expect(stableDecision.decisionDebug?.planKind).toBe(
      "runner.build_credit_bank",
    );

    const payoutBankSource = visibleCard(
      "runner-credit-bank-source",
      "runner",
      "resource",
      {
        definitionId: "onr_v1_154_broker",
        title: "Credit Bank Source",
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
      },
    );
    const lowCreditInput = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "trigger_ability",
        "Credits aus Bank nehmen",
        { credits: 0 },
        {
          source: payoutBankSource.instanceId,
          payload: { cardImplementationTakesHostedCredits: true },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    lowCreditInput.playerView.own.credits = 2;
    lowCreditInput.playerView.own.rig = [payoutBankSource];

    const lowCreditDecision = chooseRunnerAction(lowCreditInput);

    expect(lowCreditDecision.actionId).toBe("broker-take");
    expect(lowCreditDecision.decisionDebug?.planKind).toBe(
      "runner.cash_out_credit_bank",
    );
  });

  it("does not cash out Broker immediately after a stable bank-build plan", () => {
    const bankSource = visibleCard(
      "runner-credit-bank-source",
      "runner",
      "resource",
      {
        definitionId: "onr_v1_154_broker",
        title: "Credit Bank Source",
        counters: { power: 3 },
      },
    );
    const stableInput = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "trigger_ability",
        "Credits auf Bank legen",
        { credits: 0 },
        {
          source: bankSource.instanceId,
          payload: { cardImplementationAddsHostedCredits: true },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    stableInput.playerView.own.credits = 6;
    stableInput.playerView.own.rig = [bankSource];

    const buildDecision = chooseRunnerAction(stableInput);
    expect(buildDecision.actionId).toBe("broker-load");

    const payoutInput = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "trigger_ability",
        "Credits aus Bank nehmen",
        { credits: 0 },
        {
          source: bankSource.instanceId,
          payload: { cardImplementationTakesHostedCredits: true },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    payoutInput.playerView.own.credits = 6;
    payoutInput.playerView.own.rig = [bankSource];

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
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationAddsHostedCredits: true },
        },
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
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationAddsHostedCredits: true },
        },
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

  it("installs Broker as a multi-turn bank plan before generic credit", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-broker",
        "runner",
        "install_card",
        "Install Broker",
        { credits: 3 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("install-broker");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_install_commitment",
          reason: expect.stringContaining("bankCommitmentStatus:install_ready"),
        }),
      ]),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("does not let a program-trash install variant bypass duplicate breaker utility", () => {
    const cyfermasterHand = visibleCard(
      "cyfermaster-hand",
      "runner",
      "program",
      {
        definitionId: "onr_v1_016_cyfermaster",
        title: "Cyfermaster",
        subtypes: ["icebreaker"],
        rulesText: "Break code gate subroutine. +1 strength.",
      },
    );
    const input = aiInput("runner", [
      legalAction(
        "install-second-cyfermaster-with-program-trash",
        "runner",
        "install_card",
        "Cyfermaster mit Programmtrash installieren",
        { credits: 4 },
        {
          source: cyfermasterHand.instanceId,
          payload: { runnerProgramTrashBeforeInstall: true },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [cyfermasterHand];
    input.playerView.own.rig = [
      visibleCard("cyfermaster-installed", "runner", "program", {
        definitionId: "onr_v1_016_cyfermaster",
        title: "Cyfermaster",
        subtypes: ["icebreaker"],
        rulesText: "Break code gate subroutine. +1 strength.",
      }),
    ];

    const decision = chooseRunnerAction(input);
    const installAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) =>
        entry.actionId === "install-second-cyfermaster-with-program-trash",
    );

    expect(decision.actionId).toBe("gain-credit");
    expect(installAlternative?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_persistent_install_fit",
          value: expect.any(Number),
        }),
      ]),
    );
    expect(
      installAlternative?.scoreBreakdown?.find(
        (component) => component.key === "runner_persistent_install_fit",
      )?.value,
    ).toBeLessThan(0);
  });

  it("does not prepare a redundant wall breaker through Shell Traders", () => {
    const dwarf = visibleCard("dwarf-hand", "runner", "program", {
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      subtypes: ["icebreaker"],
      rulesText: "Break wall subroutine. +1 strength.",
    });
    const input = aiInput("runner", [
      legalAction(
        "prepare-dwarf",
        "runner",
        "trigger_ability",
        "The Shell Traders: Dwarf vorbereiten",
        { credits: 0 },
        {
          source: "shell-traders-installed",
          payload: {
            delayedInstallAbility: "set_aside_from_grip",
            targetCardId: dwarf.instanceId,
            ...(dwarf.definitionId
              ? { targetCardDefinitionId: dwarf.definitionId }
              : {}),
          },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.gripOrHq = [dwarf];
    input.playerView.own.rig = [
      visibleCard("pile-driver-installed", "runner", "program", {
        definitionId: "onr_v1_047_pile-driver",
        title: "Pile Driver",
        subtypes: ["icebreaker", "noisy"],
        rulesText:
          "Break up to four wall subroutines on a single piece of ICE.",
      }),
    ];

    const decision = chooseRunnerAction(input);
    const prepareAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) => entry.actionId === "prepare-dwarf",
    );

    expect(decision.actionId).toBe("gain-credit");
    expect(
      prepareAlternative?.scoreBreakdown?.find(
        (component) => component.key === "runner_persistent_install_fit",
      )?.value,
    ).toBeLessThan(0);
  });

  it("keeps loading Broker below its multi-load value target", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "Broker: 3 Credits auf Broker legen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationAddsHostedCredits: true },
        },
      ),
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Broker: Credits von Broker nehmen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationTakesHostedCredits: true },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counters: { bit: 6 },
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 6,
            displayKind: "stored_credits",
            label: "6",
            ariaLabel: "6 stored credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("broker-load");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_investment_commitment",
          reason: expect.stringContaining(
            "bankCommitmentStatus:build_second_load",
          ),
        }),
      ]),
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "bankCashOutThreshold:false",
    );
  });

  it("cashes out Broker after reaching its multi-load value target", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Broker: Credits von Broker nehmen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationTakesHostedCredits: true },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counters: { bit: 12 },
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 12,
            displayKind: "stored_credits",
            label: "12",
            ariaLabel: "12 stored credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).toBe("broker-take");
    expect(decision.decisionDebug?.scoreBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "runner_bank_cashout_gate",
          reason: expect.stringContaining("why_cashout_now:bank_threshold"),
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
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationTakesHostedCredits: true },
        },
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

  it("stops loading Broker when stored credits and runner pool are comfortable", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "Broker: 3 Credits auf Broker legen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationAddsHostedCredits: true },
        },
      ),
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Broker: Credits von Broker nehmen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: { cardImplementationTakesHostedCredits: true },
        },
      ),
      legalAction(
        "install-short-circuit",
        "runner",
        "install_card",
        "The Short Circuit installieren",
        { credits: 1 },
        { source: "onr_v1_177_the-short-circuit" },
      ),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.rig = [
      visibleCard("onr_v1_154_broker", "runner", "resource", {
        counters: { bit: 21 },
        counterDisplays: [
          {
            id: "broker-bank",
            amount: 21,
            displayKind: "stored_credits",
            label: "21",
            ariaLabel: "21 stored credits",
            usageHint: "spendable",
          },
        ],
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_177_the-short-circuit", "runner", "resource"),
    ];

    const decision = chooseRunnerAction(input);

    expect(decision.actionId).not.toBe("broker-load");
    expect(decision.actionId).not.toBe("broker-take");
    const decisionDebug = JSON.stringify(decision.decisionDebug);
    expect(decisionDebug).toContain("bankStoredCredits:21");
    expect(decisionDebug).toContain("bankComfortableCreditPool:true");
    expect(decisionDebug).toContain("bankOverDesiredTarget:true");
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "broker-load",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_bank_investment_commitment",
            reason: expect.stringContaining(
              "bankCommitmentStatus:over_target_hold",
            ),
          }),
        ]),
      }),
    );
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

  it("uses legal Mantis search for missing wall coverage before basic draw", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "mantis",
        "runner",
        "play_event",
        "Mantis, Fixer-at-Large spielen",
        { credits: 3 },
        { source: "mantis-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("mantis-card", "runner", "event", {
        definitionId: "onr_v1_099_mantis-fixer-at-large",
        title: "Mantis, Fixer-at-Large",
        rulesText:
          "Search your stack for a program, reveal it and bring it into your grip. Shuffle your stack afterwards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("mantis");
    expect(decision.reasonCode).toBe("runner.semantic.coverage_search");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_scope:coverage_search",
        "tactical_plan_type:runner.contest_remote",
        "tactical_step:search_for_answer",
      ]),
    );
    expect(decision.evidence).not.toContain("semantic_scope:basic_install");
    expect(decision.decisionDebug?.planKind).toBe("runner.contest_remote");
    const mantisAlternative = decision.decisionDebug?.actionAlternatives?.find(
      (entry) => entry.actionId === "mantis",
    );
    const planSelectionRow = mantisAlternative?.scoreBreakdown?.find(
      (entry) => entry.key === "selected_by_plan_mapping",
    );
    expect(planSelectionRow?.value ?? 0).toBeGreaterThan(0);
    expect(mantisAlternative).toEqual(
      expect.objectContaining({
        sourceTitle: "Mantis, Fixer-at-Large",
        scoreBreakdown: expect.arrayContaining([
          expect.objectContaining({
            key: "runner_goal_fit_coverage_search",
            label: "Coverage-Suche",
            reason: expect.stringContaining("source_role:search"),
          }),
        ]),
      }),
    );
    const decisionDebug = JSON.stringify(decision.decisionDebug);
    expect(decisionDebug).toContain("coverageAnswerRole:program_search");
    expect(decisionDebug).toContain("activeRequiredCapability:breaker_wall");
    expect(decisionDebug).toContain("matchedCoverageSearchFit:mantis");
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.play_best_hand_card:mantis-card") &&
          item.includes("card_type=event"),
      ),
    ).toBe(true);
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.play_best_hand_card:mantis-card") &&
          item.includes("step=install_development_card"),
      ),
    ).toBe(true);
  });

  it("keeps Bodyweight event plan display data as play-not-install fallback", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "bodyweight",
        "runner",
        "play_event",
        "Bodyweight Synthetic Blood spielen",
        { credits: 2 },
        { source: "bodyweight-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("bodyweight-card", "runner", "event", {
        definitionId: "onr_v1_079_bodyweight-synthetic-blood",
        title: "Bodyweight Synthetic Blood",
        rulesText: "Draw five cards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("bodyweight");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["semantic_scope:basic_economy_draw"]),
    );
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.play_best_hand_card:bodyweight-card") &&
          item.includes("card_type=event"),
      ),
    ).toBe(true);
  });

  it("keeps The Short Circuit plan display data as a resource installation", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "install-short-circuit",
        "runner",
        "install_card",
        "The Short Circuit installieren",
        { credits: 1 },
        { source: "short-circuit-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("short-circuit-card", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        title: "The Short Circuit",
        rulesText:
          "[A], [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("install-short-circuit");
    expect(decision.evidence).toEqual(
      expect.arrayContaining(["semantic_scope:setup_card_search"]),
    );
    expect(
      tacticalDebugItems(decision).some(
        (item) =>
          item.includes("id=runner.play_best_hand_card:short-circuit-card") &&
          item.includes("card_type=resource"),
      ),
    ).toBe(true);
  });

  it("sets up The Short Circuit as a search engine before basic draw when no direct search is legal", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "install-short-circuit",
        "runner",
        "install_card",
        "The Short Circuit installieren",
        { credits: 1 },
        { source: "short-circuit-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("short-circuit-card", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        title: "The Short Circuit",
        rulesText:
          "[A], [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("install-short-circuit");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "selected_step_kind:setup_search_engine",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "coverageAnswerRole:search_engine_setup",
    );
  });

  it("does not repeat The Short Circuit search while a fetched program waits in grip", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "short-circuit-search",
        "runner",
        "activated_card_ability",
        "The Short Circuit: Stack nach Programm durchsuchen",
        { credits: 1 },
        { source: "short-circuit" },
      ),
      legalAction("gain", "runner", "gain_credit", "1 Credit nehmen", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 2;
    input.playerView.own.rig = [
      visibleCard("short-circuit", "runner", "resource", {
        definitionId: "onr_v1_177_the-short-circuit",
        title: "The Short Circuit",
        rulesText: "Search your stack for a program.",
      }),
    ];
    input.playerView.own.gripOrHq = [
      visibleCard("pile-driver", "runner", "program", {
        definitionId: "onr_v1_047_pile-driver",
        title: "Pile Driver",
      }),
    ];
    input.playerView.publicEvents = [
      publicEvent(
        "previous-short-circuit-search",
        "activated_card_ability",
        73,
        {
          actor: "runner",
          actionType: "activated_card_ability",
          hiddenZoneAction: "p3_37_search_stack_to_grip",
        },
      ),
    ];
    input.eventTail = input.playerView.publicEvents;

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("gain");
    expect(decision.actionId).not.toBe("short-circuit-search");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "coverage_search_wait_for_install_or_fund",
    );
  });

  it("uses Bodyweight draw-for-answer before basic draw when search is not legal", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "bodyweight",
        "runner",
        "play_event",
        "Bodyweight Synthetic Blood spielen",
        { credits: 2 },
        { source: "bodyweight-card" },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.own.gripOrHq = [
      visibleCard("bodyweight-card", "runner", "event", {
        definitionId: "onr_v1_079_bodyweight-synthetic-blood",
        title: "Bodyweight Synthetic Blood",
        rulesText: "Draw five cards.",
      }),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("bodyweight");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "selected_step_kind:draw_for_answer",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "coverageAnswerRole:draw_for_answer",
    );
  });

  it("uses basic draw as draw-for-answer when no search or draw card is legal", () => {
    const input = runnerWallCoverageInput([
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
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expect(decision.actionId).toBe("draw");
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "selected_step_kind:draw_for_answer",
    );
    expect(JSON.stringify(decision.decisionDebug)).toContain(
      "coverageAnswerRole:basic_draw_fallback",
    );
    expect(decision.decisionDebug?.actionAlternatives).toContainEqual(
      expect.objectContaining({
        actionId: "draw",
        whyChosen: expect.arrayContaining(["selected_by_plan_mapping"]),
      }),
    );
  });

  it("keeps Archives pressure below the active wall-coverage plan and explains the mismatch", () => {
    const input = runnerWallCoverageInput([
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
      legalAction(
        "run-archives",
        "runner",
        "start_run",
        "Run Archives",
        { credits: 0 },
        { payload: { serverId: "archives" } },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.opponent.discardCount = 1;

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const archivesAlternative =
      decision.decisionDebug?.actionAlternatives?.find(
        (entry) => entry.actionId === "run-archives",
      );
    const selectedAlternative =
      decision.decisionDebug?.actionAlternatives?.find(
        (entry) => entry.actionId === "draw",
      );

    expect(decision.actionId).toBe("draw");
    expect(archivesAlternative?.whyNot).toEqual(
      expect.arrayContaining(["plan_mismatch"]),
    );
    expect(archivesAlternative?.priority ?? 0).toBeLessThan(
      selectedAlternative?.priority ?? 0,
    );
    expect(JSON.stringify(archivesAlternative?.scoreBreakdown)).toContain(
      "rawSemanticScore:",
    );
  });

  it("devalues Broker install when a later bank load is not plausible", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-broker",
        "runner",
        "install_card",
        "Install Broker",
        { credits: 3 },
        { source: "onr_v1_154_broker" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 3;
    input.playerView.own.clicks = 1;
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
              "why_bank_install_deferred:no_plausible_followup_load",
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

    expect(decision.actionId).toBe("draw");
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
              effectId: "conference-start-credit",
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
      "runner.contest_remote",
    );
    expect(followupDecision.decisionDebug?.detailSections).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "tactical_plan",
          items: expect.arrayContaining([
            "previous_plan_type:runner.opportunistic_central_run",
            "plan_progression_reason:previous_central_probe_satisfied",
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
      rdAccessEvent("semantic-rd-rock-access", 1, "onr_v1_265_rock-is-strong"),
    ];

    const followupDecision = chooseRunnerAction(followupInput);
    const selected = followupInput.legalActions.find(
      (action) => action.actionId === followupDecision.actionId,
    );
    const tacticalDebug =
      followupDecision.decisionDebug?.detailSections
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
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
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
    expect(debugText).toContain(
      "rd_run_suppressed_by_known_low_value_top:true",
    );
  });
});
