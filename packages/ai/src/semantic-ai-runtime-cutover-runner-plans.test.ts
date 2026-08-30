import { afterEach, describe, expect, it } from "vitest";
import { chooseRunnerAction } from "./index";
import { evaluateRunnerRunTargets } from "./runner-run-target-evaluation";
import {
  AI_PLAY_STRENGTH_PILOT_ENV,
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
} from "./decision/pilot-scope-registry";
import { PlanResolutionFailure } from "./plans/plan-resolution-failure";
import { resetResidentPlanPortfolioMemory } from "./plans/resident-plan-portfolio-memory";
import { buildPlanningStateIdentity } from "./plans/turn-planning-contracts";
import {
  attachOwnDeckSnapshot,
  aiInput,
  legalAction,
  publicEvent,
  rdAccessEvent,
  runnerWallCoverageInput,
  server,
  visibleCard,
} from "./semantic-ai-runtime-cutover.test-support";
import { withEffectiveRunQuote } from "./effective-run-quote.test-support";

type RunnerDecision = ReturnType<typeof chooseRunnerAction>;

function wallOfStatic(instanceId: string) {
  const ice = visibleCard(instanceId, "corp", "ice", {
    definitionId: "onr_v1_279_wall-of-static",
    title: "Wall of Static",
    rezzed: true,
    strength: 2,
    subtypes: ["wall"],
  });
  return withEffectiveRunQuote(ice, {
    effectiveStrength: 2,
    subroutines: [
      {
        id: `${instanceId}-end-the-run`,
        type: "end_the_run",
        sourceDefinitionId: "onr_v1_279_wall-of-static",
        sourceTitle: "Wall of Static",
      },
    ],
  });
}

function brokerAbilityPayload(
  route: "build" | "cash_out",
  sourceCardInstanceId = "onr_v1_154_broker",
) {
  const capabilityKey =
    route === "build" ? "store_credits" : "withdraw_credits";
  return {
    cardId: sourceCardInstanceId,
    sourceDefinitionId: "onr_v1_154_broker",
    cardImplementationCapabilityBindingKind:
      "card_spec_capability_key" as const,
    cardImplementationAbilityId: `onr_v1_154_broker:${capabilityKey}`,
    cardImplementationAbilityKey: capabilityKey,
    ...(route === "build"
      ? { cardImplementationAddsHostedCredits: true }
      : { cardImplementationTakesHostedCredits: true }),
  };
}

function expectPlanDecision(
  decision: RunnerDecision,
  expected: {
    actionId: string;
    planKind: string;
    capability: string;
    priorityClass?: string;
    assessmentEvidence?: string;
  },
): void {
  expect(decision.actionId).toBe(expected.actionId);
  expect(decision.fallbackUsed).toBe(false);
  expect(decision.decisionDebug?.planKind).toBe(expected.planKind);
  expect(decision.evidence).toEqual(
    expect.arrayContaining([
      "plan_first_runtime:true",
      `plan_module:${expected.planKind}`,
      `plan_step_capability:${expected.capability}`,
      ...(expected.priorityClass
        ? [`plan_priority_class:${expected.priorityClass}`]
        : []),
      ...(expected.assessmentEvidence
        ? [`plan_assessment_evidence:${expected.assessmentEvidence}`]
        : []),
    ]),
  );
}

function actionAlternative(decision: RunnerDecision, actionId: string) {
  return decision.decisionDebug?.actionAlternatives?.find(
    (alternative) => alternative.actionId === actionId,
  );
}

function nonEmergencyRunnerHand() {
  return [
    visibleCard("fixture-hand-1", "runner", "resource"),
    visibleCard("fixture-hand-2", "runner", "resource"),
    visibleCard("fixture-hand-3", "runner", "resource"),
  ];
}

function planPortfolioItems(decision: RunnerDecision): string[] {
  return (
    decision.decisionDebug?.detailSections?.find(
      (section) => section.id === "plan_portfolio",
    )?.items ?? []
  );
}

function versionedRunnerTurnInput(
  stateVersion: number,
  actions: ReturnType<typeof legalAction>[],
) {
  const input = aiInput("runner", actions);
  input.playerView.stateVersion = stateVersion;
  input.playerView.turnSerial = 1;
  input.playerView.own.clicks = Math.max(1, 4 - stateVersion);
  for (const action of actions) action.expiresAtStateVersion = stateVersion;
  Object.assign(input, {
    planningStateIdentity: buildPlanningStateIdentity(input),
  });
  return input;
}

function rdExpressDeckSnapshot() {
  return {
    deckSnapshotId: "standard_runner_rd_express:1.1.0",
    side: "runner" as const,
    cards: [
      { cardId: "onr_v1_014_codecracker", quantity: 2 },
      { cardId: "onr_v1_040_loony-goon", quantity: 2 },
      { cardId: "onr_v1_071_vewy-vewy-quiet", quantity: 2 },
      { cardId: "onr_v1_089_gideons-pawnshop", quantity: 1 },
      { cardId: "onr_v1_094_inside-job", quantity: 3 },
      { cardId: "onr_v1_095_jack-n-joe", quantity: 3 },
      { cardId: "onr_v1_097_livewires-contacts", quantity: 3 },
      { cardId: "onr_v1_102_open-ended-mileage-program", quantity: 2 },
      { cardId: "onr_v1_108_score", quantity: 2 },
      { cardId: "onr_v1_114_temple-microcode-outlet", quantity: 3 },
      { cardId: "onr_v1_124_corolla-speed-chip", quantity: 1 },
      { cardId: "onr_v1_129_hq-interface", quantity: 2 },
      { cardId: "onr_v1_139_r-and-d-interface", quantity: 3 },
      { cardId: "onr_v1_146_zetatech-mem-chip", quantity: 1 },
      {
        cardId: "onr_v1_166_karl-de-veres-corporate-stooge",
        quantity: 1,
      },
      { cardId: "onr_v1_178_short-term-contract", quantity: 3 },
      { cardId: "onr_proteus_083_corrosion", quantity: 2 },
      { cardId: "onr_proteus_103_cruising-for-netwatch", quantity: 3 },
      { cardId: "onr_proteus_122_rush-hour", quantity: 3 },
      { cardId: "onr_proteus_124_stakeout", quantity: 3 },
    ],
  };
}

function expectMissingPlanModuleCoverage(
  decide: () => RunnerDecision,
  expectedLegalActionTypes: readonly string[],
): PlanResolutionFailure {
  let failure: unknown;
  try {
    decide();
  } catch (error) {
    failure = error;
  }

  expect(failure).toBeInstanceOf(PlanResolutionFailure);
  const planFailure = failure as PlanResolutionFailure;
  expect(planFailure.code).toBe("missing_plan_module_coverage");
  expect(planFailure.context.owner).toBe("scheduler");
  expect(planFailure.context.side).toBe("runner");
  expect(planFailure.context.legalActionTypes).toEqual(
    [...expectedLegalActionTypes].sort(),
  );
  return planFailure;
}

function expectLastProductiveRunnerLiquidity(decision: RunnerDecision): void {
  expectPlanDecision(decision, {
    actionId: "gain-credit",
    planKind: "runner.economy",
    capability: "gain_general_liquid_credits",
    priorityClass: "P6",
    assessmentEvidence:
      "runner_engine_certified_immediate_liquidity_development",
  });
}

describe("Semantic AI runtime cutover — Runner plan and memory contracts", () => {
  const originalRuntimeMode = process.env.NETGRID_SEMANTIC_AI_RUNTIME;

  const originalPilotMode = process.env[AI_PLAY_STRENGTH_PILOT_ENV];

  const originalLocalDefaultMode =
    process.env[AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV];

  afterEach(() => {
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

  it("keeps a material central run available while a remote plan is blocked", () => {
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
    input.playerView.own.agendaPoints = 5;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [wallOfStatic("onr_v1_279_wall-of-static")],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];

    const decision = chooseRunnerAction(input);
    expectPlanDecision(decision, {
      actionId: "run-hq",
      planKind: "runner.pressure_central",
      capability: "pressure_hq_access",
      priorityClass: "P4",
      assessmentEvidence: "target:hq",
    });
  });

  it("uses Broker build as an explicit credit-bank plan but does not cash out for low credits alone", () => {
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
        "activated_card_ability",
        "Credits auf Bank legen",
        { credits: 0 },
        {
          source: bankSource.instanceId,
          payload: brokerAbilityPayload("build", bankSource.instanceId),
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    stableInput.playerView.own.credits = 6;
    stableInput.playerView.own.rig = [bankSource];

    const stableDecision = chooseRunnerAction(stableInput);

    expectPlanDecision(stableDecision, {
      actionId: "broker-load",
      planKind: "runner.credit_bank",
      capability: "credit_bank_build",
      priorityClass: "P4",
      assessmentEvidence: "runner_credit_bank_first_load",
    });

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
        "activated_card_ability",
        "Credits aus Bank nehmen",
        { credits: 0 },
        {
          source: payoutBankSource.instanceId,
          payload: brokerAbilityPayload(
            "cash_out",
            payoutBankSource.instanceId,
          ),
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    lowCreditInput.playerView.own.credits = 2;
    lowCreditInput.playerView.own.rig = [payoutBankSource];

    const lowCreditDecision = chooseRunnerAction(lowCreditInput);

    expectPlanDecision(lowCreditDecision, {
      actionId: "gain-credit",
      planKind: "runner.economy",
      capability: "gain_general_liquid_credits",
      priorityClass: "P6",
      assessmentEvidence: "runner_finite_portfolio_credit_reserve",
    });
    expect(actionAlternative(lowCreditDecision, "broker-take")?.selected).toBe(
      false,
    );
  });

  it("starts a new Broker cycle after cashout instead of replacing three stored credits with one liquid credit", () => {
    const bankSource = visibleCard(
      "runner-credit-bank-source",
      "runner",
      "resource",
      {
        definitionId: "onr_v1_154_broker",
        title: "Credit Bank Source",
      },
    );
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "Credits auf Bank legen",
        { credits: 0 },
        {
          source: bankSource.instanceId,
          payload: brokerAbilityPayload("build", bankSource.instanceId),
        },
      ),
      legalAction("draw", "runner", "draw_card", "Draw 1", { credits: 0 }),
    ]);
    input.playerView.own.credits = 9;
    input.playerView.own.rig = [bankSource];
    input.playerView.own.gripOrHq = [
      visibleCard("runner-hand-1", "runner", "resource"),
      visibleCard("runner-hand-2", "runner", "resource"),
      visibleCard("runner-hand-3", "runner", "resource"),
      visibleCard("runner-hand-4", "runner", "resource"),
    ];
    input.playerView.own.stackOrRdCount = 10;
    input.eventTail = [
      publicEvent("bank-load", "activated_card_ability", 1, {
        actor: "runner",
        actionType: "activated_card_ability",
        sourceDefinitionId: bankSource.definitionId,
        hostedCreditsAdded: 3,
        hostedCreditsAfter: 3,
      }),
      publicEvent("bank-cash-out", "activated_card_ability", 2, {
        actor: "runner",
        actionType: "activated_card_ability",
        sourceDefinitionId: bankSource.definitionId,
        hostedCreditsTaken: 3,
        hostedCreditsAfter: 0,
      }),
    ];

    const decision = chooseRunnerAction(input);

    expectPlanDecision(decision, {
      actionId: "broker-load",
      planKind: "runner.credit_bank",
      capability: "credit_bank_build",
      priorityClass: "P4",
      assessmentEvidence: "runner_credit_bank_first_load",
    });
    expect(actionAlternative(decision, "draw")?.selected).toBe(false);
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "runner_credit_bank_hold_completed_cycle_for_development",
    );
  });

  it("keeps Broker held and uses last productive liquidity above the finite reserve", () => {
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
        "activated_card_ability",
        "Credits auf Bank legen",
        { credits: 0 },
        {
          source: bankSource.instanceId,
          payload: brokerAbilityPayload("build", bankSource.instanceId),
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
        "activated_card_ability",
        "Credits aus Bank nehmen",
        { credits: 0 },
        {
          source: bankSource.instanceId,
          payload: brokerAbilityPayload("cash_out", bankSource.instanceId),
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        {
          credits: 0,
        },
        {
          source: "game_rule",
        },
      ),
    ]);
    payoutInput.playerView.own.credits = 6;
    payoutInput.playerView.opponent.deckCount = 10;
    payoutInput.playerView.own.rig = [bankSource];

    expectLastProductiveRunnerLiquidity(chooseRunnerAction(payoutInput));
  });

  it("prefers a productive central run over the first empty Broker build", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-load",
        "runner",
        "activated_card_ability",
        "3 Credits auf Broker legen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: brokerAbilityPayload("build"),
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
    expectPlanDecision(decision, {
      actionId: "run-rd",
      planKind: "runner.pressure_central",
      capability: "pressure_rd_access",
      priorityClass: "P4",
      assessmentEvidence: "target:rd",
    });
    expect(actionAlternative(decision, "broker-load")?.whyNot).toEqual(
      expect.arrayContaining([
        expect.stringContaining("not_selected_by_plan:"),
        expect.stringContaining("candidate_plan:plan:runner.credit_bank:"),
      ]),
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
          payload: brokerAbilityPayload("build"),
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

    expectPlanDecision(decision, {
      actionId: "run-remote",
      planKind: "runner.contest_remote",
      capability: "contest_remote",
      priorityClass: "P2",
      assessmentEvidence: "visible_known_agenda_remote",
    });
    expect(planPortfolioItems(decision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("module:runner.credit_bank"),
        expect.stringContaining("module:runner.contest_remote"),
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
        { credits: 3, clicks: 1 },
        {
          source: "onr_v1_154_broker",
          payload: {
            cardId: "onr_v1_154_broker",
            sourceDefinitionId: "onr_v1_154_broker",
          },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        {
          credits: 0,
        },
        {
          source: "game_rule",
        },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("onr_v1_154_broker", "runner", "resource"),
    ];

    const decision = chooseRunnerAction(input);

    expectPlanDecision(decision, {
      actionId: "install-broker",
      planKind: "runner.credit_bank",
      capability: "credit_bank_install",
      priorityClass: "P5",
      assessmentEvidence: "runner_credit_bank_install_ready",
    });
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("uses last productive liquidity instead of installing a redundant breaker at the finite reserve", () => {
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
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [cyfermasterHand];
    input.playerView.own.rig = [
      visibleCard("cyfermaster-installed", "runner", "program", {
        definitionId: "onr_v1_016_cyfermaster",
        title: "Cyfermaster",
        subtypes: ["icebreaker"],
        rulesText: "Break code gate subroutine. +1 strength.",
      }),
    ];

    expectLastProductiveRunnerLiquidity(chooseRunnerAction(input));
  });

  it("uses last productive liquidity instead of preparing a redundant wall breaker at the finite reserve", () => {
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
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        {
          credits: 0,
        },
        {
          source: "game_rule",
        },
      ),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = [dwarf];
    input.playerView.own.rig = [
      visibleCard("shell-traders-installed", "runner", "resource", {
        definitionId: "onr_v1_176_the-shell-traders",
        title: "The Shell Traders",
      }),
      visibleCard("pile-driver-installed", "runner", "program", {
        definitionId: "onr_v1_047_pile-driver",
        title: "Pile Driver",
        subtypes: ["icebreaker", "noisy"],
        rulesText:
          "Break up to four wall subroutines on a single piece of ICE.",
      }),
    ];

    expectLastProductiveRunnerLiquidity(chooseRunnerAction(input));
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
          payload: brokerAbilityPayload("build"),
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
          payload: brokerAbilityPayload("cash_out"),
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        {
          credits: 0,
        },
        {
          source: "game_rule",
        },
      ),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.opponent.deckCount = 10;
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

    expectPlanDecision(decision, {
      actionId: "broker-load",
      planKind: "runner.credit_bank",
      capability: "credit_bank_build",
      priorityClass: "P5",
      assessmentEvidence: "runner_credit_bank_continue_to_value_target",
    });
    expect(actionAlternative(decision, "broker-take")?.selected).toBe(false);
  });

  it("uses last productive liquidity instead of cashing out Broker above the finite reserve", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Broker: Credits von Broker nehmen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: brokerAbilityPayload("cash_out"),
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.opponent.deckCount = 10;
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

    expectLastProductiveRunnerLiquidity(chooseRunnerAction(input));
  });

  it("defers Broker cashout to last productive liquidity without a parent plan", () => {
    const input = aiInput("runner", [
      legalAction(
        "broker-take",
        "runner",
        "activated_card_ability",
        "Credits von Broker nehmen",
        { credits: 0 },
        {
          source: "onr_v1_154_broker",
          payload: brokerAbilityPayload("cash_out"),
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.own.credits = 6;
    input.playerView.opponent.deckCount = 10;
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

    expectLastProductiveRunnerLiquidity(chooseRunnerAction(input));
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
          payload: brokerAbilityPayload("build"),
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
          payload: brokerAbilityPayload("cash_out"),
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
    input.playerView.opponent.deckCount = 10;
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
    expect(planPortfolioItems(decision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "module:runner.credit_bank|phase:hold|viability:blocked",
        ),
      ]),
    );
    for (const actionId of ["broker-load", "broker-take"]) {
      expect(actionAlternative(decision, actionId)?.whyNot).toEqual(
        expect.arrayContaining([
          "candidate_plan_evidence:runner_credit_bank_hold_comfortable_value",
          "candidate_plan_blocker:no_credit_bank_hold_route",
        ]),
      );
    }
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
      ...nonEmergencyRunnerHand(),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(decision, {
      actionId: "mantis",
      planKind: "runner.rig_and_coverage",
      capability: "search_answer_breaker_wall",
      priorityClass: "P5",
      assessmentEvidence: "target:remote_1",
    });
    expect(actionAlternative(decision, "mantis")?.whyChosen).toEqual(
      expect.arrayContaining([
        expect.stringContaining("selected_by_plan:"),
        "selected_for_step:search_answer_breaker_wall",
      ]),
    );
  });

  it("lets the Shell Traders pipeline prepare the exact missing wall breaker", () => {
    const dwarf = visibleCard("dwarf-card", "runner", "program", {
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      memoryCost: 1,
      installCost: 5,
      subtypes: ["icebreaker"],
      rulesText: "Break wall subroutine. +1 strength.",
    });
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
        "prepare-dwarf",
        "runner",
        "trigger_ability",
        "The Shell Traders: Dwarf vorbereiten",
        { credits: 0, clicks: 1 },
        {
          source: "shell-traders-installed",
          payload: {
            cardId: "shell-traders-installed",
            sourceDefinitionId: "onr_v1_176_the-shell-traders",
            delayedInstallAbility: "set_aside_from_grip",
            targetCardId: dwarf.instanceId,
            targetCardDefinitionId: dwarf.definitionId!,
            shellCounterAmount: 5,
          },
        },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.gripOrHq = [dwarf];
    input.playerView.own.rig = [
      visibleCard("shell-traders-installed", "runner", "resource", {
        definitionId: "onr_v1_176_the-shell-traders",
        title: "The Shell Traders",
      }),
    ];
    input.playerView.own.memoryUsed = 0;
    input.playerView.own.memoryLimit = 4;

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(decision, {
      actionId: "prepare-dwarf",
      planKind: "runner.shell_traders_pipeline",
      capability: "shell_traders_prepare",
      priorityClass: "P4",
      assessmentEvidence: "runner_shell_traders_source:shell-traders-installed",
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.selectedPlan?.evidenceCodes,
    ).toEqual(
      expect.arrayContaining([
        "runner_shell_traders_target:dwarf-card",
        expect.stringContaining("runner_shell_traders_counters:"),
        expect.stringContaining("runner_shell_traders_memory:"),
        expect.stringContaining("runner_shell_traders_coverage:"),
      ]),
    );
    expect(
      decision.decisionDebug?.planFirstDecision?.turnPlanning,
    ).toMatchObject({
      boundary: {
        kind: "projected_plan_discovery_required",
        residualTurnValueBasis: "public_outcome_distribution",
      },
      commitment: {
        observationClass: "scheduled_information_boundary",
        replanReason: "scheduled_information_boundary",
      },
    });

    const mismatchedInput = structuredClone(input);
    const mismatchedAction = mismatchedInput.legalActions.find(
      (action) => action.actionId === "prepare-dwarf",
    );
    if (!mismatchedAction?.payload) {
      throw new Error("expected delayed-install action payload");
    }
    mismatchedAction.payload.cardId = "different-source";

    const mismatchedDecision = chooseRunnerAction(mismatchedInput, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(mismatchedDecision, {
      actionId: "prepare-dwarf",
      planKind: "runner.shell_traders_pipeline",
      capability: "shell_traders_prepare",
      priorityClass: "P4",
      assessmentEvidence: "runner_shell_traders_source:shell-traders-installed",
    });
    expect(
      mismatchedDecision.decisionDebug?.planFirstDecision?.turnPlanning
        ?.boundary?.kind,
    ).not.toBe("projected_plan_discovery_required");
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
        {
          source: "bodyweight-card",
          payload: {
            cardId: "bodyweight-card",
            sourceDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
            drawCardsAmount: 5,
          },
        },
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
      ...nonEmergencyRunnerHand(),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(decision, {
      actionId: "bodyweight",
      planKind: "runner.rig_and_coverage",
      capability: "draw_for_answer_breaker_wall",
      priorityClass: "P5",
      assessmentEvidence: "target:remote_1",
    });
    expect(decision.decisionDebug?.selectedActionType).toBe("play_event");
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
      ...nonEmergencyRunnerHand(),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(decision, {
      actionId: "install-short-circuit",
      planKind: "runner.rig_and_coverage",
      capability: "setup_search_engine_breaker_wall",
      priorityClass: "P5",
      assessmentEvidence: "target:remote_1",
    });
    expect(decision.decisionDebug?.selectedActionType).toBe("install_card");
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
      ...nonEmergencyRunnerHand(),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(decision, {
      actionId: "install-short-circuit",
      planKind: "runner.rig_and_coverage",
      capability: "setup_search_engine_breaker_wall",
      priorityClass: "P5",
      assessmentEvidence: "target:remote_1",
    });
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
        {
          source: "short-circuit",
          payload: {
            cardId: "short-circuit",
            sourceDefinitionId: "onr_v1_177_the-short-circuit",
            cardImplementationAbility: "activated",
            cardImplementationCapabilityBindingKind: "card_spec_capability_key",
            cardImplementationAbilityKey:
              "abilities_activated_runner_main_search_stack_to_grip",
            cardImplementationAbilityId:
              "onr_v1_177_the-short-circuit:abilities_activated_runner_main_search_stack_to_grip",
            cardImplementationEffectKind: "search_stack_to_grip",
            cardImplementationSearchFilter: "program",
          },
        },
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
        subtypes: ["icebreaker", "fracter", "noisy"],
        installCost: 1,
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

    expectPlanDecision(decision, {
      actionId: "gain",
      planKind: "runner.economy",
      capability: "gain_general_liquid_credits",
      priorityClass: "P6",
      assessmentEvidence: "runner_finite_portfolio_credit_reserve",
    });
    expect(actionAlternative(decision, "short-circuit-search")?.selected).toBe(
      false,
    );
    expect(actionAlternative(decision, "short-circuit-search")?.whyNot).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "explicitly_nonproductive:runner.rig_and_coverage:runner_coverage_search_rejected_without_deck_answer:",
        ),
      ]),
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
        {
          source: "bodyweight-card",
          payload: {
            cardId: "bodyweight-card",
            sourceDefinitionId: "onr_v1_079_bodyweight-synthetic-blood",
            drawCardsAmount: 5,
          },
        },
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
      ...nonEmergencyRunnerHand(),
    ];

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(decision, {
      actionId: "bodyweight",
      planKind: "runner.rig_and_coverage",
      capability: "draw_for_answer_breaker_wall",
      priorityClass: "P5",
      assessmentEvidence: "target:remote_1",
    });
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
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        {
          credits: 0,
        },
        {
          source: "game_rule",
        },
      ),
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    input.playerView.own.credits = 13;
    input.playerView.opponent.deckCount = 10;
    input.playerView.own.gripOrHq = nonEmergencyRunnerHand();

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });

    expectPlanDecision(decision, {
      actionId: "draw",
      planKind: "runner.rig_and_coverage",
      capability: "draw_for_answer_breaker_wall",
      priorityClass: "P5",
      assessmentEvidence: "target:remote_1",
    });
    expect(actionAlternative(decision, "draw")?.whyChosen).toEqual(
      expect.arrayContaining([
        expect.stringContaining("selected_by_plan:"),
        "selected_for_step:draw_for_answer_breaker_wall",
      ]),
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
    input.playerView.own.gripOrHq = nonEmergencyRunnerHand();

    const decision = chooseRunnerAction(input, {
      persistTacticalPlanMemory: false,
    });
    const archivesAlternative =
      decision.decisionDebug?.actionAlternatives?.find(
        (entry) => entry.actionId === "run-archives",
      );
    expectPlanDecision(decision, {
      actionId: "draw",
      planKind: "runner.rig_and_coverage",
      capability: "draw_for_answer_breaker_wall",
      priorityClass: "P5",
      assessmentEvidence: "target:remote_1",
    });
    expect(archivesAlternative?.whyNot).toEqual(
      expect.arrayContaining([
        expect.stringContaining("not_selected_by_plan:"),
        expect.stringContaining(
          "candidate_plan:plan:runner.pressure_central:central%3Aarchives:ready",
        ),
      ]),
    );
  });

  it("keeps a last-action Broker install resident without inventing the future build action", () => {
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

    expectPlanDecision(decision, {
      actionId: "install-broker",
      planKind: "runner.credit_bank",
      capability: "credit_bank_install",
      priorityClass: "P5",
      assessmentEvidence:
        "runner_credit_bank_install_resident_without_same_turn_build",
    });
    expect(decision.actionId).not.toContain("store_credits");
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      '"actionId":"onr_v1_154_broker:store_credits"',
    );
  });

  it("binds Rigged Investments to the resident credit-bank install route without a second authority", () => {
    const input = aiInput("runner", [
      legalAction(
        "install-rigged",
        "runner",
        "install_card",
        "Install Rigged Investments",
        { credits: 4 },
        { source: "rigged-1" },
      ),
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 4;
    input.playerView.own.gripOrHq = [
      visibleCard("rigged-1", "runner", "resource", {
        definitionId: "onr_v1_174_rigged-investments",
        title: "Rigged Investments",
      }),
    ];

    const decision = chooseRunnerAction(input);

    expectPlanDecision(decision, {
      actionId: "install-rigged",
      planKind: "runner.credit_bank",
      capability: "credit_bank_install",
      priorityClass: "P5",
      assessmentEvidence: "runner_credit_bank_install_ready",
    });
    expect(
      decision.decisionDebug?.planFirstDecision?.executionOrigin,
    ).toMatchObject({
      rootPlanInstanceId: "plan:runner.credit_bank:rigged-1",
      leafPlanInstanceId: "plan:runner.credit_bank:rigged-1",
    });
    expect(actionAlternative(decision, "install-rigged")?.selected).toBe(true);
    expect(JSON.stringify(decision.decisionDebug)).not.toContain(
      "cash_out_credit_bank",
    );
  });

  it("keeps a weak run waiting behind the resident recurring-economy horizon", () => {
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
    expectPlanDecision(decision, {
      actionId: "draw",
      planKind: "runner.develop_board_and_hand",
      capability: "develop_runner_option_development",
      priorityClass: "P6",
    });
    expect(actionAlternative(decision, "draw")?.selected).toBe(true);
    expect(actionAlternative(decision, "gain-credit")?.selected).toBe(false);
    expect(planPortfolioItems(decision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "module:runner.recurring_economy|phase:hold|viability:blocked",
        ),
      ]),
    );
    expect(JSON.stringify(decision.decisionDebug)).not.toMatch(
      /cardInstances|privatePayload|fullGameState/i,
    );
  });

  it("does not follow a just-installed no-run recurring investment with a pre-known run", () => {
    const conference = visibleCard("conference-card", "runner", "resource", {
      definitionId: "onr_v1_184_top-runners-conference",
      title: "Top Runners' Conference",
    });
    const firstInput = versionedRunnerTurnInput(1, [
      legalAction(
        "install-conference",
        "runner",
        "install_card",
        "Install Conference",
        { credits: 0 },
        { source: conference.instanceId },
      ),
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
    firstInput.playerView.own.gripOrHq = [conference];
    firstInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];

    const first = chooseRunnerAction(firstInput);
    const firstPlanning = first.decisionDebug?.planFirstDecision?.turnPlanning;
    expectPlanDecision(first, {
      actionId: "install-conference",
      planKind: "runner.recurring_economy",
      capability: "recurring_economy_install",
      priorityClass: "P4",
    });

    const secondInput = versionedRunnerTurnInput(2, [
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
    secondInput.playerView.own.rig = [conference];
    secondInput.playerView.servers = firstInput.playerView.servers;
    const secondTurnSerial = secondInput.playerView.turnSerial;
    if (secondTurnSerial === undefined) {
      throw new Error("Expected a concrete Runner turn serial.");
    }
    secondInput.eventTail = [
      {
        ...publicEvent("conference-installed", "install_card", 0, {
          actor: "runner",
          actionType: "install_card",
          cardDefinitionId: conference.definitionId,
        }),
        turnSerial: secondTurnSerial,
      },
    ];

    const second = chooseRunnerAction(secondInput);
    const secondPlanning =
      second.decisionDebug?.planFirstDecision?.turnPlanning;
    expectPlanDecision(second, {
      actionId: "gain-credit",
      planKind: "runner.economy",
      capability: "gain_general_liquid_credits",
    });
    expect(secondPlanning?.selectedLine.phases[0]?.rootPlanInstanceId).not.toBe(
      firstPlanning?.selectedLine.phases[0]?.rootPlanInstanceId,
    );
    expect(planPortfolioItems(second)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "module:runner.recurring_economy|phase:hold|viability:blocked",
        ),
      ]),
    );
  });

  it("retains a Runner root across an internal continuation instead of silently handing it to a pre-known alternative", () => {
    const firstInput = versionedRunnerTurnInput(1, [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    firstInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    const first = chooseRunnerAction(firstInput);
    const firstLeaf =
      first.decisionDebug?.planFirstDecision?.leafExecutorInstanceId;
    const firstCommitment =
      first.decisionDebug?.planFirstDecision?.turnPlanning?.commitment;

    const secondInput = versionedRunnerTurnInput(2, [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
    ]);
    secondInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    const second = chooseRunnerAction(secondInput);
    const planning = second.decisionDebug?.planFirstDecision?.turnPlanning;

    expect(first.actionId).toBe("gain-credit");
    expect(second.actionId).toBe("gain-credit");
    expect(second.decisionDebug?.planKind).toBe("runner.economy");
    expect(
      second.decisionDebug?.planFirstDecision?.leafExecutorInstanceId,
    ).toBe(firstLeaf);
    expect(planning?.commitment?.continuation).toMatchObject({
      status: "retained",
      previousCommitmentId: firstCommitment?.commitmentId,
      boundaryKind: "plan_internal_continuation",
      evidenceCodes: expect.arrayContaining([
        "continuation_action_id:gain-credit",
        "same_root_continuation_line_rematerialized",
      ]),
    });
    expect(planning?.selectedLine.phases[0]?.rootPlanInstanceId).toBe(
      planning?.commitment?.continuation?.previousOwnerRootPlanInstanceId,
    );
    expect(planning?.commitment?.rematerialization.actionId).toBe(
      "gain-credit",
    );
  });

  it("keeps a card-parent funding sequence on the same root when its install milestone becomes legal", () => {
    const interfaceCard = () =>
      visibleCard("rnd-interface-card", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
        title: "R&D Interface",
      });
    const firstInput = versionedRunnerTurnInput(1, [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    firstInput.playerView.turnSerial = 34;
    firstInput.playerView.own.credits = 3;
    firstInput.playerView.own.gripOrHq = [interfaceCard()];
    firstInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    Object.assign(firstInput, {
      planningStateIdentity: buildPlanningStateIdentity(firstInput),
    });
    const first = chooseRunnerAction(firstInput);
    const firstRoot =
      first.decisionDebug?.planFirstDecision?.rootPlanInstanceId;
    const firstLeaf =
      first.decisionDebug?.planFirstDecision?.leafExecutorInstanceId;

    const secondInput = versionedRunnerTurnInput(2, [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "install-interface",
        "runner",
        "install_card",
        "Install R&D Interface",
        { credits: 4 },
        { source: "rnd-interface-card" },
      ),
    ]);
    secondInput.playerView.turnSerial = 34;
    secondInput.playerView.own.credits = 6;
    secondInput.playerView.own.gripOrHq = [interfaceCard()];
    secondInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    Object.assign(secondInput, {
      planningStateIdentity: buildPlanningStateIdentity(secondInput),
    });
    const second = chooseRunnerAction(secondInput);
    const planFirst = second.decisionDebug?.planFirstDecision;

    expect(first.actionId).toBe("gain-credit");
    expect(first.decisionDebug?.planKind).toBe("runner.economy");
    expect(second.actionId).toBe("install-interface");
    expect(second.decisionDebug?.planKind).toBe(
      "runner.develop_board_and_hand",
    );
    expect(planFirst?.rootPlanInstanceId).toBe(firstRoot);
    expect(firstLeaf).toMatch(/^plan:runner\.economy:development-support%3A/);
    expect(planFirst?.leafExecutorInstanceId).toBe(firstRoot);
    expect(planFirst?.route).toMatchObject({
      actionId: "install-interface",
      capabilityId: "develop_onr_v1_139_r-and-d-interface",
    });
    expect(planFirst?.turnPlanning?.commitment?.continuation).toMatchObject({
      status: "retained",
      previousOwnerRootPlanInstanceId: firstRoot,
      intendedNextMilestoneId: "develop_onr_v1_139_r-and-d-interface",
      boundaryKind: "plan_internal_continuation",
      evidenceCodes: expect.arrayContaining([
        "continuation_action_id:install-interface",
      ]),
    });
  });

  it("installs a ready R&D Interface before making the same-turn open R&D run", () => {
    const input = versionedRunnerTurnInput(0, [
      legalAction(
        "install-interface",
        "runner",
        "install_card",
        "Install R&D Interface",
        { credits: 4, clicks: 1 },
        {
          source: "rnd-interface-card",
          payload: {
            cardId: "rnd-interface-card",
            sourceDefinitionId: "onr_v1_139_r-and-d-interface",
          },
        },
      ),
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0, clicks: 1 },
        { payload: { serverId: "rd" } },
      ),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 4;
    input.playerView.opponent.deckCount = 40;
    input.playerView.own.gripOrHq = [
      visibleCard("rnd-interface-card", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
        title: "R&D Interface",
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    attachOwnDeckSnapshot(input, rdExpressDeckSnapshot());
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });

    const decision = chooseRunnerAction(input);
    const planning = decision.decisionDebug?.planFirstDecision?.turnPlanning;
    const selectedLine = planning?.consideredLines?.find(
      (line) => line.lineId === planning.selectedLine.lineId,
    );
    expect(decision.actionId).toBe("install-interface");
    expect(decision.decisionDebug?.planKind).toBe("runner.pressure_central");
    expect(selectedLine?.firstActionId).toBe("install-interface");
    expect(selectedLine?.steps.map((step) => step.semanticActionType)).toEqual([
      "install.card",
      "run.start",
    ]);
    expect(selectedLine?.stopReason).toBe("observation_boundary");
  });

  it("plans the known Score, R&D Interface and open R&D pressure prefix before the access boundary", () => {
    const input = versionedRunnerTurnInput(0, [
      legalAction(
        "play-score",
        "runner",
        "play_event",
        "Play Score!",
        { credits: 5, clicks: 1 },
        {
          source: "score-card",
          payload: {
            cardId: "score-card",
            sourceDefinitionId: "onr_v1_108_score",
            gainCreditsAmount: 9,
            cardImplementationCapabilityBindingKind: "card_spec_capability_key",
            cardImplementationAbilityId:
              "onr_v1_108_score:abilities_on_play_gain_credits",
            cardImplementationAbilityKey: "abilities_on_play_gain_credits",
          },
        },
      ),
      legalAction(
        "install-interface",
        "runner",
        "install_card",
        "Install R&D Interface",
        { credits: 4, clicks: 1 },
        {
          source: "rnd-interface-card",
          payload: {
            cardId: "rnd-interface-card",
            sourceDefinitionId: "onr_v1_139_r-and-d-interface",
          },
        },
      ),
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0, clicks: 1 },
        { payload: { serverId: "rd" } },
      ),
      legalAction(
        "play-jack",
        "runner",
        "play_event",
        "Play Jack 'n' Joe",
        { credits: 0, clicks: 1 },
        {
          source: "jack-card",
          payload: {
            cardId: "jack-card",
            sourceDefinitionId: "onr_v1_095_jack-n-joe",
            drawCardsAmount: 3,
            cardImplementationCapabilityBindingKind: "card_spec_capability_key",
            cardImplementationAbilityId:
              "onr_v1_095_jack-n-joe:abilities_on_play_draw_cards",
            cardImplementationAbilityKey: "abilities_on_play_draw_cards",
          },
        },
      ),
    ]);
    input.playerView.own.credits = 5;
    input.playerView.own.clicks = 4;
    input.playerView.opponent.deckCount = 40;
    input.playerView.own.gripOrHq = [
      visibleCard("score-card", "runner", "event", {
        definitionId: "onr_v1_108_score",
        title: "Score!",
      }),
      visibleCard("rnd-interface-card", "runner", "hardware", {
        definitionId: "onr_v1_139_r-and-d-interface",
        title: "R&D Interface",
      }),
      visibleCard("jack-card", "runner", "event", {
        definitionId: "onr_v1_095_jack-n-joe",
        title: "Jack 'n' Joe",
      }),
      visibleCard("short-term-card", "runner", "resource", {
        definitionId: "onr_v1_178_short-term-contract",
        title: "Short-Term Contract",
      }),
      visibleCard("cruising-card", "runner", "event", {
        definitionId: "onr_proteus_103_cruising-for-netwatch",
        title: "Cruising for Netwatch",
      }),
    ];
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    attachOwnDeckSnapshot(input, rdExpressDeckSnapshot());
    Object.assign(input, {
      planningStateIdentity: buildPlanningStateIdentity(input),
    });

    const decision = chooseRunnerAction(input);
    const planning = decision.decisionDebug?.planFirstDecision?.turnPlanning;
    const selectedLine = planning?.consideredLines?.find(
      (line) => line.lineId === planning.selectedLine.lineId,
    );
    expect(decision.actionId).toBe("play-score");
    expect(selectedLine?.firstActionId).toBe("play-score");
    expect(selectedLine?.steps.map((step) => step.semanticActionType)).toEqual([
      "economy.gain_credit",
      "install.card",
      "run.start",
    ]);
    expect(selectedLine?.stopReason).toBe("observation_boundary");
    expect(planning?.boundary).toMatchObject({
      optionalityMinimum: 1,
      optionalityMaximum: 1,
    });
    expect(selectedLine?.evidenceCodes).toEqual(
      expect.arrayContaining([
        "runner_access_payoff_campaign:rd:rnd-interface-card",
        "post_boundary_optional_action_capacity:1",
      ]),
    );
    expect(planning?.candidateAudit).toEqual({
      schemaVersion: "ai-turn-planning-candidate-audit-v1",
      provenance: "persisted_at_decision",
    });
    const scoreHead = planning?.heads.find(
      (head) => head.actionId === "play-score",
    );
    expect(
      planning?.heads.find((head) => head.actionId === "install-interface"),
    ).toMatchObject({
      executorPlanInstanceId: "plan:runner.pressure_central:central%3Ard",
      selectedInLine: true,
      rootEligible: false,
      dependencyCandidateIds: [scoreHead?.candidateId],
      assessment: {
        effectivePriorityClass: "P4",
        readiness: "executable_with_support",
        withinClassValue: expect.any(Number),
        stepValue: expect.any(Number),
      },
    });
    expect(selectedLine?.steps.map((step) => step.actionId)).toEqual([
      "play-score",
      "install-interface",
      "run-rd",
    ]);
    expect(selectedLine?.projectedEndState).toMatchObject({
      creditMinimum: 5,
      creditMaximum: 5,
      unrestrictedActionMinimum: 1,
      unrestrictedActionMaximum: 1,
      pendingBoundaryKind: "opponent_response_window",
    });
  });

  it("allows a newly material P2 interrupt to preempt a retained Runner root with typed evidence", () => {
    const firstInput = versionedRunnerTurnInput(1, [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
    ]);
    firstInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    chooseRunnerAction(firstInput);

    const secondInput = versionedRunnerTurnInput(2, [
      legalAction("gain-credit", "runner", "gain_credit", "Gain 1", {
        credits: 0,
      }),
      legalAction(
        "run-remote",
        "runner",
        "start_run",
        "Run remote",
        { credits: 0 },
        { payload: { serverId: "remote_1" } },
      ),
    ]);
    secondInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [visibleCard("simple_agenda", "corp", "agenda")]),
    ];
    const second = chooseRunnerAction(secondInput);
    const planning = second.decisionDebug?.planFirstDecision?.turnPlanning;

    expect(second.actionId).toBe("run-remote");
    expect(second.decisionDebug?.planKind).toBe("runner.contest_remote");
    expect(planning?.commitment?.replanReason).toBe("urgent_interrupt");
    expect(planning?.commitment?.continuation).toMatchObject({
      status: "preempted",
      boundaryKind: "urgent_interrupt",
      evidenceCodes: expect.arrayContaining(["urgent_priority_class:P2"]),
    });
  });

  it("replans normally after a Runner draw observation boundary", () => {
    const firstInput = versionedRunnerTurnInput(1, [
      legalAction("draw", "runner", "draw_card", "Draw", { credits: 0 }),
    ]);
    firstInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    expect(chooseRunnerAction(firstInput).actionId).toBe("draw");

    const secondInput = versionedRunnerTurnInput(2, [
      legalAction(
        "run-rd",
        "runner",
        "start_run",
        "Run R&D",
        { credits: 0 },
        { payload: { serverId: "rd" } },
      ),
    ]);
    secondInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
    ];
    const second = chooseRunnerAction(secondInput);
    const commitment =
      second.decisionDebug?.planFirstDecision?.turnPlanning?.commitment;

    expect(second.actionId).toBe("run-rd");
    expect(commitment?.replanReason).toBe("scheduled_information_boundary");
    expect(commitment?.continuation).toBeUndefined();
  });

  it("does not elevate a matchpoint central run above a negative exact quote", () => {
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
    input.playerView.own.agendaPoints = input.playerView.agendaPointsToWin - 1;
    input.playerView.own.credits = 100;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
      visibleCard("onr_v1_007_blink", "runner", "program"),
    ];
    input.playerView.own.gripOrHq = Array.from({ length: 5 }, (_, index) =>
      visibleCard(`runner-buffer-${index}`, "runner", "event"),
    );
    input.playerView.servers = [
      server("hq"),
      server("rd", [
        withEffectiveRunQuote(
          visibleCard("onr_v1_264_rex", "corp", "ice", {
            rezzed: true,
            strength: 3,
          }),
          {
            effectiveStrength: 3,
            subroutines: [
              {
                id: "onr_v1_264_rex_trace",
                type: "initiate_trace",
                traceLimit: 3,
                traceSuccessEffect: {
                  type: "end_run_and_run_lock",
                  amount: 2,
                },
                sourceDefinitionId: "onr_v1_264_rex",
                sourceTitle: "Rex",
              },
            ],
          },
        ),
      ]),
      server("archives"),
    ];

    const rdMatchpointTarget = evaluateRunnerRunTargets({ input }).find(
      (target) => target.targetServerId === "rd",
    );
    expect(rdMatchpointTarget).toMatchObject({
      pathPassability: "reachable",
      recommendation: "run_now",
    });
    expect(rdMatchpointTarget?.score).toBeLessThanOrEqual(0);

    const decision = chooseRunnerAction(input);
    expectPlanDecision(decision, {
      actionId: "draw",
      planKind: "runner.develop_board_and_hand",
      capability: "develop_runner_option_development",
      priorityClass: "P6",
    });
    expect(planPortfolioItems(decision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "module:runner.recurring_economy|phase:hold|viability:blocked",
        ),
      ]),
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

    expectPlanDecision(decision, {
      actionId: "run-rd",
      planKind: "runner.pressure_central",
      capability: "pressure_rd_access",
      priorityClass: "P4",
      assessmentEvidence: "target:rd",
    });
    expect(actionAlternative(decision, "install-conference")?.whyNot).toEqual(
      expect.arrayContaining([
        "candidate_plan_evidence:runner_recurring_economy_install_deferred_no_setup_window",
        "candidate_plan_blocker:recurring_economy_waiting_for_value",
      ]),
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

    expectPlanDecision(decision, {
      actionId: "run-remote",
      planKind: "runner.contest_remote",
      capability: "contest_remote",
      priorityClass: "P2",
      assessmentEvidence: "visible_known_agenda_remote",
    });
    expect(planPortfolioItems(decision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "module:runner.recurring_economy|phase:hold|viability:blocked",
        ),
        expect.stringContaining("module:runner.contest_remote"),
      ]),
    );
  });

  it("lets opponent matchpoint pressure break a recurring-economy hold", () => {
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
    input.playerView.own.credits = 20;
    input.playerView.opponent.agendaPoints = 5;
    input.playerView.own.rig = [
      visibleCard("onr_v1_184_top-runners-conference", "runner", "resource"),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [{ instanceId: "hidden-remote", known: false }]),
    ];
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

    expectPlanDecision(decision, {
      actionId: "run-remote",
      planKind: "runner.contest_remote",
      capability: "contest_remote",
      priorityClass: "P4",
    });
    expect(planPortfolioItems(decision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "module:runner.recurring_economy|phase:hold|viability:blocked",
        ),
        expect.stringContaining("module:runner.contest_remote"),
      ]),
    );
  });

  it("keeps the investment resident and waits on a weak run after the first payout", () => {
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

    expectPlanDecision(decision, {
      actionId: "gain-credit",
      planKind: "runner.economy",
      capability: "gain_general_liquid_credits",
    });
    expect(planPortfolioItems(decision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("runner.recurring_economy"),
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

    expectPlanDecision(decision, {
      actionId: "run-rd",
      planKind: "runner.pressure_central",
      capability: "pressure_rd_access",
      priorityClass: "P4",
      assessmentEvidence: "target:rd",
    });
    expect(
      planPortfolioItems(decision).some((item) =>
        item.includes("runner.recurring_economy"),
      ),
    ).toBe(false);
  });

  it("keeps blocked remote coverage available behind a material central run", () => {
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
    centralInput.playerView.own.agendaPoints = 5;
    centralInput.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [wallOfStatic("onr_v1_279.wall-of-static.fixture")],
        [visibleCard("simple_agenda", "corp", "agenda")],
      ),
    ];
    attachOwnDeckSnapshot(centralInput, {
      deckSnapshotId: "runner-wall-coverage-fixture",
      side: "runner",
      cards: [{ cardId: "onr_v1_053_ramming-piston", quantity: 1 }],
    });

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
    for (const action of followupInput.legalActions)
      action.expiresAtStateVersion = 2;
    followupInput.playerView.own.rig = [];
    followupInput.playerView.own.agendaPoints = 5;
    followupInput.playerView.servers = centralInput.playerView.servers;
    attachOwnDeckSnapshot(followupInput, {
      deckSnapshotId: "runner-wall-coverage-fixture",
      side: "runner",
      cards: [{ cardId: "onr_v1_053_ramming-piston", quantity: 1 }],
    });

    const followupDecision = chooseRunnerAction(followupInput, {
      runnerTurnPlannerMode: "legacy_compare",
    });

    expectPlanDecision(followupDecision, {
      actionId: "run-hq",
      planKind: "runner.pressure_central",
      capability: "pressure_hq_access",
      priorityClass: "P4",
      assessmentEvidence: "target:hq",
    });
    expect(planPortfolioItems(followupDecision)).toEqual(
      expect.arrayContaining([
        expect.stringContaining("module:runner.rig_and_coverage"),
        expect.stringContaining("module:runner.pressure_central"),
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
    const followupTurnSerial = followupInput.playerView.turnSerial;
    if (followupTurnSerial === undefined) {
      throw new Error("Expected a concrete Runner turn serial.");
    }
    followupInput.eventTail = [
      {
        ...publicEvent("semantic-rd-rock-run", "start_run", 0, {
          actor: "runner",
          actionType: "start_run",
          serverId: "rd",
        }),
        turnSerial: followupTurnSerial,
      },
      {
        ...rdAccessEvent(
          "semantic-rd-rock-access",
          1,
          "onr_v1_265_rock-is-strong",
        ),
        turnSerial: followupTurnSerial,
      },
    ];

    const followupDecision = chooseRunnerAction(followupInput, {
      runnerTurnPlannerMode: "legacy_compare",
    });
    const selected = followupInput.legalActions.find(
      (action) => action.actionId === followupDecision.actionId,
    );
    expect(
      selected?.type === "start_run" && selected.payload?.serverId === "rd",
    ).toBe(false);
    expectPlanDecision(followupDecision, {
      actionId: "run-hq",
      planKind: "runner.pressure_central",
      capability: "pressure_hq_information",
      priorityClass: "P4",
      assessmentEvidence: "target:hq",
    });
    expect(actionAlternative(followupDecision, "run-rd")?.whyNot).toEqual(
      expect.arrayContaining([
        "candidate_plan_evidence:runner_central_pressure_known_no_current_payoff:rd",
        "candidate_plan_blocker:no_current_tactical_route",
      ]),
    );
  });

  it("uses last productive liquidity instead of repeating stale R&D at the finite reserve", () => {
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
      legalAction(
        "end-turn",
        "runner",
        "end_turn",
        "End turn",
        { credits: 0 },
        { source: "game_rule" },
      ),
    ]);
    input.playerView.stateVersion = 3;
    input.playerView.opponent.deckCount = 10;
    input.playerView.servers = [server("hq"), server("rd"), server("archives")];
    const currentTurnSerial = input.playerView.turnSerial;
    if (currentTurnSerial === undefined) {
      throw new Error("Expected a concrete Runner turn serial.");
    }
    input.eventTail = [
      {
        ...publicEvent("semantic-rd-rock-fallback-run", "start_run", 0, {
          actor: "runner",
          actionType: "start_run",
          serverId: "rd",
        }),
        turnSerial: currentTurnSerial,
      },
      {
        ...rdAccessEvent(
          "semantic-rd-rock-fallback-access",
          1,
          "onr_v1_265_rock-is-strong",
        ),
        turnSerial: currentTurnSerial,
      },
    ];

    expectLastProductiveRunnerLiquidity(
      chooseRunnerAction(input, {
        runnerTurnPlannerMode: "legacy_compare",
      }),
    );
  });
});
