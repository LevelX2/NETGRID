import { describe, expect, it } from "vitest";

import type {
  AiDecisionInput,
  LegalAction,
  PlayerView,
  Side,
  VisibleCard,
} from "@netgrid/shared";
import {
  evaluateRunnerHandDevelopment,
  redactedRunnerHandDevelopmentFacts,
} from "./runner-hand-development";
import {
  RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
  type RunnerStrategicIntentProfile,
} from "./runner-strategic-intent";
import { discardKeepScore } from "./runtime/discard-keep-score";
import { selectedSearchChoiceOptionIds } from "./runtime/search-choice-option";
import type { DeckCapabilityProfile } from "./deck-capabilities";

describe("RunnerHandDevelopmentEvaluation", () => {
  it("classifies central access payoff from own hand without leaking card identity in redacted facts", () => {
    const accessCard = visibleCard("rd-interface-1", {
      definitionId: "test-rd-interface",
      title: "R&D Interface",
      type: "hardware",
      installCost: 4,
      rulesText:
        "Whenever you make a successful run on R&D, access 1 additional card.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [accessCard],
      legalActions: [installAction("install-rd-interface", accessCard, 4)],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        pressureVectors: ["runner.central_probe_pressure"],
      }),
    });
    const evaluation = findByInstance(evaluations, "rd-interface-1");
    const redacted = redactedRunnerHandDevelopmentFacts([evaluation]);

    expect(evaluation).toMatchObject({
      developmentRole: "access_payoff",
      availability: "legal_now",
      strategicFit: "strong",
      currentNeed: "useful_now",
      deferReason: "none",
    });
    expect(evaluation.priority).toBeGreaterThanOrEqual(900);
    expect(redacted.join("\n")).not.toMatch(/R&D Interface|test-rd-interface|rd-interface-1/);
    expect(evaluation.evidence.join("\n")).not.toMatch(/R&D Interface|test-rd-interface|rd-interface-1/);
  });

  it("requires a same-turn access action after turn-limited preparation", () => {
    const preparation = visibleCard("prearranged-drop-1", {
      definitionId: "onr_proteus_118_prearranged-drop",
      title: "Prearranged Drop",
      type: "event",
      cost: 0,
      rulesText: "The next time you access an agenda this turn, gain [6].",
    });
    const playPreparation = playEventAction(
      "play-prearranged-drop",
      preparation,
      0,
    );
    const runRAndD = startRunAction("run-rd", "rd");
    const blocked = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 8,
          clicks: 1,
          hand: [preparation],
          legalActions: [playPreparation, runRAndD],
        }),
      }),
      preparation.instanceId,
    );
    const executable = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 8,
          clicks: 2,
          hand: [preparation],
          legalActions: [playPreparation, runRAndD],
        }),
      }),
      preparation.instanceId,
    );

    expect(blocked).toMatchObject({
      availability: "timing_blocked",
      deferReason: "timing",
    });
    expect(blocked.evidence).toContain("same_turn_access_required:true");
    expect(blocked.evidence).toContain(
      "same_turn_access_followup_available:false",
    );
    expect(executable).toMatchObject({
      availability: "legal_now",
      deferReason: "none",
    });
    expect(executable.evidence).toContain(
      "same_turn_access_followup_available:true",
    );
  });

  it("separates MU-blocked breaker setup from missing-credit setup", () => {
    const breaker = visibleCard("breaker-1", {
      definitionId: "test-code-breaker",
      title: "Test Decoder",
      type: "program",
      subtypes: ["icebreaker", "decoder"],
      installCost: 3,
      memoryCost: 1,
      rulesText: "Icebreaker: break code gate subroutines.",
    });
    const economy = visibleCard("expensive-economy-1", {
      definitionId: "test-expensive-economy",
      title: "Expensive Economy",
      type: "resource",
      installCost: 5,
      rulesText: "Gain credits over future turns.",
    });
    const input = runnerInput({
      credits: 2,
      hand: [breaker, economy],
      memoryUsed: 4,
      memoryLimit: 4,
      legalActions: [],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        setupEngine: [
          "runner.rig_first",
          "runner.economy_setup_before_pressure",
        ],
      }),
    });
    const breakerEvaluation = findByInstance(evaluations, "breaker-1");
    const economyEvaluation = findByInstance(evaluations, "expensive-economy-1");

    expect(breakerEvaluation).toMatchObject({
      developmentRole: "breaker_or_rig_piece",
      availability: "missing_mu",
      deferReason: "missing_mu",
    });
    expect(economyEvaluation).toMatchObject({
      developmentRole: "economy_engine",
      availability: "missing_credits",
      fundingNeed: {
        installOrPlayCost: 5,
        missingCredits: 3,
        reason: "cannot_pay",
      },
      deferReason: "missing_credits",
    });
  });

  it("marks bank and economy tools as acute setup when the Runner is credit-starved", () => {
    const broker = visibleCard("broker-1", {
      definitionId: "test-broker",
      title: "Broker",
      type: "resource",
      installCost: 0,
      rulesText: "Put credits on this bank. Take credits from this bank.",
    });
    const input = runnerInput({
      credits: 1,
      hand: [broker],
      legalActions: [installAction("install-broker", broker, 0)],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        setupEngine: ["runner.economy_setup_before_pressure"],
      }),
    });
    const evaluation = findByInstance(evaluations, "broker-1");

    expect(evaluation).toMatchObject({
      developmentRole: "bank_tool",
      availability: "legal_now",
      currentNeed: "acute",
      strategicFit: "strong",
    });
    expect(evaluation.priority).toBeGreaterThanOrEqual(900);
  });

  it("classifies renewable breaker credits on hybrid hardware as economy", () => {
    const cybermodem = visibleCard("cortical-cybermodem-1", {
      definitionId: "onr_proteus_134_cortical-cybermodem",
      title: "Cortical Cybermodem",
      type: "hardware",
      installCost: 11,
      rulesText:
        "Provides +2 MU and +2 hand size. Put 2 bits from the bank on this card when installed. Use these bits only to pay for using icebreakers during runs. If you use any of these bits, replace them from the bank at the start of your next turn.",
    });
    const input = runnerInput({
      credits: 14,
      hand: [cybermodem],
      legalActions: [installAction("install-cortical-cybermodem", cybermodem, 11)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent({
          setupEngine: ["runner.economy_setup_before_pressure"],
        }),
      }),
      "cortical-cybermodem-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "economy_engine",
      availability: "legal_now",
      currentNeed: "useful_now",
      strategicFit: "strong",
      deferReason: "none",
    });
    expect(evaluation.evidence.join("|")).toContain(
      "breaker_recurring_economy",
    );
  });

  it("uses source identifiers and ignores label-only hand card titles", () => {
    const console = visibleCard("console-1", {
      definitionId: "test-console",
      title: "Useful Console",
      type: "hardware",
      installCost: 0,
      rulesText: "Gain memory for your rig.",
    });
    const labelOnly = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 5,
          hand: [console],
          legalActions: [
            {
              ...installAction("label-only-install", console, 0),
              source: "missing-source",
              label: "Install Useful Console",
              payload: {},
            },
          ],
        }),
      }),
      "console-1",
    );
    const sourced = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 5,
          hand: [console],
          legalActions: [installAction("sourced-install", console, 0)],
        }),
      }),
      "console-1",
    );

    expect(labelOnly.availability).not.toBe("legal_now");
    expect(sourced.availability).toBe("legal_now");
  });

  it("keeps defense cards without visible threat low and deferred", () => {
    const shield = visibleCard("shield-1", {
      definitionId: "test-shield",
      title: "Shield",
      type: "program",
      installCost: 0,
      memoryCost: 1,
      rulesText: "Prevent 2 net damage.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [shield],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [installAction("install-shield", shield, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "shield-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      availability: "legal_now",
      currentNeed: "none",
      strategicFit: "weak",
      deferReason: "no_current_need",
    });
    expect(evaluation.evidence).toContain(
      "persistent_functional_coverage:damage_prevention",
    );
    expect(evaluation.priority).toBeLessThan(500);
  });

  it("treats visible net-damage ICE as a current defense-support need", () => {
    const prevention = visibleCard("green-knight-1", {
      definitionId: "onr_v1_128_green-knight-surge-buffers",
      title: '"Green Knight" Surge Buffers',
      type: "hardware",
      installCost: 0,
      rulesText: "Prevents 1 net damage each turn.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [prevention],
      legalActions: [installAction("install-green-knight", prevention, 0)],
      servers: [
        {
          id: "remote_1",
          label: "Remote 1",
          ice: [
            {
              instanceId: "shotgun-wire-1",
              owner: "corp",
              controller: "corp",
              known: true,
              rezzed: true,
              definitionId: "onr_v1_269_shotgun-wire",
              title: "Shotgun Wire",
              type: "ice",
              subtypes: ["wall"],
              rulesText: "Do 2 net damage. End the run.",
            },
          ],
          root: [],
        },
      ],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "green-knight-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      availability: "legal_now",
      currentNeed: "acute",
      strategicFit: "strong",
      deferReason: "none",
      persistentInstallEvaluation: {
        capabilityDelta: "cumulative_capacity",
        stackabilityClass: "cumulative_capacity",
      },
    });
    expect(evaluation.priority).toBeGreaterThanOrEqual(500);
  });

  it("does not treat an unrelated target action as hand-card development", () => {
    const memory = visibleCard("memory-hand", {
      definitionId: "test-memory-hardware",
      title: "Memory Hardware",
      type: "hardware",
      installCost: 1,
      rulesText: "+1 MU.",
    });
    const unrelatedTargetAction: LegalAction = {
      ...installAction("unrelated-target-action", memory, 0),
      type: "activated_card_ability",
      source: "other-installed-card",
      payload: { targetCardId: memory.instanceId },
    };
    const input = runnerInput({
      credits: 4,
      hand: [memory],
      legalActions: [unrelatedTargetAction],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      memory.instanceId,
    );

    expect(evaluation.availability).toBe("timing_blocked");
    expect(evaluation.legalActionId).toBeUndefined();
  });

  it("keeps expose tools relevant when the current route needs program displacement", () => {
    const mouse = visibleCard("mouse-1", {
      definitionId: "onr_v1_042_mouse",
      title: "Mouse",
      type: "program",
      installCost: 2,
      memoryCost: 1,
      rulesText:
        "Installed Hidden-Zone helper: expose one unrezzed installed Corp card in a chosen fort.",
    });
    const installMouse = {
      ...installAction("install-mouse-with-trash", mouse, 2),
      payload: {
        cardId: mouse.instanceId,
        cardDefinitionId: "onr_v1_042_mouse",
        runnerProgramTrashBeforeInstall: true,
      },
    };
    const input = runnerInput({
      credits: 15,
      hand: [mouse],
      legalActions: [installMouse],
      memoryUsed: 4,
      memoryLimit: 4,
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent({
          pressureVectors: ["runner.central_probe_pressure"],
        }),
      }),
      "mouse-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "access_payoff",
      availability: "legal_now",
      currentNeed: "useful_now",
      deferReason: "missing_mu",
      persistentInstallEvaluation: {
        displacementPenalty: -1200,
      },
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeLessThan(0);
    expect(evaluation.priority).toBeGreaterThanOrEqual(300);
  });

  it("bounds visible remote threat text to exact tokens", () => {
    const shield = visibleCard("shield-noise-1", {
      definitionId: "test-shield-noise",
      title: "Shield",
      type: "program",
      installCost: 0,
      memoryCost: 1,
      rulesText: "Prevent 2 net damage.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [shield],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [installAction("install-shield-noise", shield, 0)],
    });
    input.playerView.servers = [
      {
        id: "remote_1",
        label: "Remote 1",
        ice: [],
        root: [
          visibleCard("remote-noise", {
            definitionId: "test-threat-noise",
            title: "Damageish Tagish Traceish",
            type: "asset",
          }),
        ],
      },
    ];

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "shield-noise-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "none",
      deferReason: "no_current_need",
    });
  });

  it("bounds persistent utility text signals to exact tokens", () => {
    const noisy = visibleCard("utility-noise-1", {
      definitionId: "test-utility-noise",
      title: "Utility Noise",
      type: "resource",
      installCost: 0,
      rulesText:
        "Preventish damageish. Hand_sizeish support. Base_linkish gainish 2 linkish.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [noisy],
      legalActions: [installAction("install-utility-noise", noisy, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "utility-noise-1",
    );
    const evidence = evaluation.evidence.join("|");

    expect(evidence).not.toContain("damage_prevention");
    expect(evidence).not.toContain("hand_size");
    expect(evidence).not.toContain("absolute_link");
  });

  it("bounds hand-development role text signals to exact tokens", () => {
    const noisy = visibleCard("role-noise-1", {
      definitionId: "test-role-noise",
      title: "Role Noise",
      type: "resource",
      installCost: 0,
      rulesText:
        "Bankish drawish searchlight accessory installment triggerish actionish.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [noisy],
      legalActions: [installAction("install-role-noise", noisy, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "role-noise-1",
    );

    expect(evaluation.developmentRole).toBe("unknown");
  });

  it("keeps duplicate or low-value hand cards conservative", () => {
    const duplicate = visibleCard("spare-resource-1", {
      definitionId: "test-spare-resource",
      title: "Spare Resource",
      type: "resource",
      installCost: 1,
      rulesText: "A spare connection with no current setup role.",
    });
    const installed = visibleCard("spare-resource-installed", {
      definitionId: "test-spare-resource",
      title: "Spare Resource",
      type: "resource",
    });
    const input = runnerInput({
      credits: 5,
      hand: [duplicate],
      rig: [installed],
      legalActions: [installAction("install-spare-resource", duplicate, 1)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "spare-resource-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "duplicate_or_low_value",
      availability: "legal_now",
      strategicFit: "weak",
      deferReason: "duplicate",
    });
    expect(evaluation.priority).toBeLessThan(200);
  });

  it("keeps first risky universal breaker install valuable when coverage is missing", () => {
    const blink = visibleCard("blink-1", {
      definitionId: "test-risky-universal-breaker",
      title: "Blink",
      type: "program",
      subtypes: ["icebreaker"],
      installCost: 2,
      memoryCost: 1,
      rulesText:
        "Icebreaker. Break any ice subroutine. Whenever you use this breaker, suffer 2 net damage.",
    });
    const input = runnerInput({
      credits: 6,
      hand: [blink],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [installAction("install-blink", blink, 2)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "blink-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "breaker_or_rig_piece",
      availability: "legal_now",
      deferReason: "none",
      persistentInstallEvaluation: {
        capabilityDelta: "new_coverage",
        duplicateRole: "none",
        stackabilityClass: "replacement_upgrade",
      },
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeGreaterThan(0);

  });

  it("bounds persistent breaker coverage terms to exact tokens", () => {
    const fracter = visibleCard("fracter-1", {
      definitionId: "test-text-fracter",
      title: "Text Fracter",
      type: "program",
      installCost: 0,
      memoryCost: 1,
      rulesText: "Fracter. Break one ice subroutine.",
    });
    const noise = visibleCard("fracteroid-1", {
      definitionId: "test-fracteroid-noise",
      title: "Fracteroid",
      type: "program",
      installCost: 0,
      memoryCost: 1,
      rulesText: "Fracteroid barrierish traceish breakish subroutineish.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [fracter, noise],
      memoryUsed: 0,
      memoryLimit: 4,
      legalActions: [
        installAction("install-fracter", fracter, 0),
        installAction("install-fracteroid", noise, 0),
      ],
    });

    const evaluations = evaluateRunnerHandDevelopment({ input });
    const positiveEvidence = findByInstance(evaluations, "fracter-1")
      .evidence.join("|");
    const noiseEvidence = findByInstance(evaluations, "fracteroid-1")
      .evidence.join("|");

    expect(positiveEvidence).toContain("breaker:wall");
    expect(positiveEvidence).toContain("breaker:subtype_limited");
    expect(noiseEvidence).not.toContain("breaker:");
  });

  it("values breaker support programs without misclassifying them as duplicate breakers", () => {
    const krash = visibleCard("krash-installed", {
      definitionId: "test-krash",
      title: "Krash",
      type: "program",
      subtypes: ["icebreaker"],
      rulesText: "Break any ice subroutine. 2 credits: +1 strength.",
      memoryCost: 1,
    });
    const lockjaw = visibleCard("lockjaw-1", {
      definitionId: "test-lockjaw",
      title: "Lockjaw",
      type: "program",
      rulesText: "Choose an installed icebreaker. That icebreaker has +2 strength.",
      installCost: 0,
      memoryCost: 1,
    });
    const clown = visibleCard("clown-1", {
      definitionId: "test-clown",
      title: "Clown",
      type: "program",
      rulesText: "All ice is encountered with its strength reduced by 1.",
      installCost: 4,
      memoryCost: 1,
    });
    const vewy = visibleCard("vewy-1", {
      definitionId: "test-vewy",
      title: "Vewy Vewy Quiet",
      type: "program",
      rulesText:
        "2 recurring credits. Use these credits only for using an icebreaker during a run.",
      installCost: 4,
      memoryCost: 1,
    });
    const input = runnerInput({
      credits: 10,
      hand: [lockjaw, clown, vewy],
      rig: [krash],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [
        installAction("install-lockjaw", lockjaw, 0),
        installAction("install-clown", clown, 4),
        installAction("install-vewy", vewy, 4),
      ],
    });

    const evaluations = evaluateRunnerHandDevelopment({ input });
    for (const id of ["lockjaw-1", "clown-1", "vewy-1"]) {
      const evaluation = findByInstance(evaluations, id);
      expect(evaluation.evidence.join("|")).not.toContain(
        "persistent_functional_coverage:breaker:",
      );
      expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeGreaterThan(0);
      expect(evaluation.deferReason).toBe("none");
    }
  });

  it("carries a Krash support search through install evaluation and discard", () => {
    const krash = visibleCard("krash-installed", {
      definitionId: "krash",
      title: "Krash",
      type: "program",
      subtypes: ["icebreaker"],
      rulesText: "Break any ice subroutine. 2 credits: +1 strength.",
      memoryCost: 1,
    });
    const duplicateKrash = visibleCard("krash-copy", {
      definitionId: "krash",
      title: "Krash",
      type: "program",
      subtypes: ["icebreaker"],
      rulesText: "Break any ice subroutine. 2 credits: +1 strength.",
      memoryCost: 1,
    });
    const lockjaw = visibleCard("lockjaw", {
      definitionId: "lockjaw",
      title: "Lockjaw",
      type: "program",
      rulesText: "Choose an installed icebreaker. That icebreaker has +2 strength.",
      installCost: 0,
      memoryCost: 1,
    });
    const clown = visibleCard("clown", {
      definitionId: "clown",
      title: "Clown",
      type: "program",
      rulesText: "All ice is encountered with its strength reduced by 1.",
      installCost: 4,
      memoryCost: 1,
    });
    const rolesByCardId: Record<string, readonly string[]> = {
      krash: ["breaker_fracter", "breaker_decoder", "breaker_killer"],
      lockjaw: ["icebreaker_support", "run_support"],
      clown: ["ice_modifier", "icebreaker_support", "run_support"],
    };
    const searchChoice = {
      id: "short-circuit-search",
      source: "stack search",
      minSelections: 2,
      maxSelections: 2,
      options: [duplicateKrash, lockjaw, clown].map((card) => ({
        id: card.definitionId!,
        label: card.title!,
        card,
      })),
      cardSearchPresentation: { destination: "grip" as const },
    } as unknown as NonNullable<AiDecisionInput["playerView"]["pendingChoice"]>;

    expect(
      selectedSearchChoiceOptionIds(searchChoice, searchChoice.options, {
        features: {
          credits: 8,
          memoryRemaining: 3,
          rigRoles: new Set(rolesByCardId.krash),
          rigDefinitionIds: new Set(["krash"]),
          gripDefinitionCounts: new Map([["krash", 1]]),
        },
        rolesForCardId: (cardId) => rolesByCardId[cardId ?? ""] ?? [],
      }),
    ).toEqual(["lockjaw", "clown"]);

    const input = runnerInput({
      credits: 8,
      hand: [duplicateKrash, lockjaw, clown],
      rig: [krash],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [
        installAction("install-lockjaw", lockjaw, 0),
        installAction("install-clown", clown, 4),
      ],
    });
    const development = evaluateRunnerHandDevelopment({ input });
    expect(findByInstance(development, "lockjaw").persistentInstallEvaluation?.finalInstallFit)
      .toBeGreaterThan(0);
    expect(findByInstance(development, "clown").persistentInstallEvaluation?.finalInstallFit)
      .toBeGreaterThan(0);

    const dependencies = {
      rolesForCardId: (cardId: string | undefined) =>
        rolesByCardId[cardId ?? ""] ?? [],
      definitionTypeForCardId: () => "program",
      visibleCardPlayOrInstallCost: (card: VisibleCard) => card.installCost ?? 0,
      runnerCardAddressesVisibleBreakerNeed: () => false,
      runnerBadPublicityOrTraceTechCard: () => false,
      isRunnerEconomyRole: (role: string) => role === "economy",
      runnerCardLooksLikeCreditPayout: () => false,
    };
    const duplicateScore = discardKeepScore(input, duplicateKrash, dependencies);
    const lockjawScore = discardKeepScore(input, lockjaw, dependencies);
    const clownScore = discardKeepScore(input, clown, dependencies);

    expect(duplicateScore.baseValue).toBeLessThan(lockjawScore.baseValue);
    expect(duplicateScore.baseValue).toBeLessThan(clownScore.baseValue);
  });

  it("devalues a second risky universal breaker when it adds no capability and reduces buffer", () => {
    const secondBlink = visibleCard("blink-2", {
      definitionId: "test-risky-universal-breaker",
      title: "Blink",
      type: "program",
      subtypes: ["icebreaker"],
      installCost: 2,
      memoryCost: 1,
      rulesText:
        "Icebreaker. Break any ice subroutine. Whenever you use this breaker, suffer 2 net damage.",
    });
    const installedBlink = visibleCard("blink-installed", {
      definitionId: "test-risky-universal-breaker",
      title: "Blink",
      type: "program",
      subtypes: ["icebreaker"],
      memoryCost: 1,
      rulesText:
        "Icebreaker. Break any ice subroutine. Whenever you use this breaker, suffer 2 net damage.",
    });
    const input = runnerInput({
      credits: 6,
      hand: [secondBlink],
      rig: [installedBlink],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [installAction("install-second-blink", secondBlink, 2)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "blink-2",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "duplicate_or_low_value",
      strategicFit: "weak",
      deferReason: "duplicate",
      persistentInstallEvaluation: {
        capabilityDelta: "backup_only",
        duplicateRole: "redundant_duplicate",
        installedSameDefinitionCount: 1,
      },
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeLessThan(0);
    expect(evaluation.persistentInstallEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        "why_duplicate_install_deferred:low_marginal_utility",
        "duplicate_install_reduces_damage_buffer",
      ]),
    );
  });

  it("carries breaker marginal utility through a Shell Traders preparation route", () => {
    const dwarf = visibleCard("dwarf-hand", {
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      type: "program",
      subtypes: ["icebreaker"],
      installCost: 5,
      memoryCost: 1,
      rulesText: "Break wall subroutine. +1 strength.",
    });
    const pileDriver = visibleCard("pile-driver-installed", {
      definitionId: "onr_v1_047_pile-driver",
      title: "Pile Driver",
      type: "program",
      subtypes: ["icebreaker", "noisy"],
      memoryCost: 1,
      rulesText: "Break up to four wall subroutines on a single piece of ICE.",
    });
    const prepare: LegalAction = {
      actionId: "prepare-dwarf",
      side: "runner",
      type: "trigger_ability",
      source: "shell-traders-installed",
      label: "The Shell Traders: Dwarf vorbereiten",
      timingPoint: "runner_action.main",
      costs: [{ clicks: 1 }],
      targetRequirements: [],
      visibility: "private_to_actor",
      expiresAtStateVersion: 2,
      payload: {
        delayedInstallAbility: "set_aside_from_grip",
        targetCardId: dwarf.instanceId,
        ...(dwarf.definitionId
          ? { targetCardDefinitionId: dwarf.definitionId }
          : {}),
      },
    };
    const input = runnerInput({
      credits: 5,
      hand: [dwarf],
      rig: [pileDriver],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [prepare],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      dwarf.instanceId,
    );

    expect(evaluation.legalActionId).toBe(prepare.actionId);
    expect(evaluation.persistentInstallEvaluation).toMatchObject({
      capabilityDelta: "backup_only",
      duplicateRole: "redundant_duplicate",
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeLessThan(
      0,
    );
  });

  it("allows a deck-supported cheaper breaker variant after primary coverage is complete", () => {
    const dwarf = visibleCard("dwarf-variant", {
      definitionId: "onr_v1_021_dwarf",
      title: "Dwarf",
      type: "program",
      subtypes: ["icebreaker"],
      installCost: 0,
      memoryCost: 1,
      rulesText: "1 credit: Break wall subroutine. 1 credit: +1 strength.",
    });
    const pileDriver = visibleCard("pile-driver-installed", {
      definitionId: "onr_v1_047_pile-driver",
      title: "Pile Driver",
      type: "program",
      subtypes: ["icebreaker", "noisy"],
      memoryCost: 1,
      rulesText: "3 credits: Break up to four wall subroutines.",
    });
    const input = runnerInput({
      credits: 8,
      hand: [dwarf, visibleCard("buffer", { type: "event" })],
      rig: [pileDriver],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [installAction("install-dwarf-variant", dwarf, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input,
        deckCapabilities: breakerVariantDeckCapabilities(),
        strategicIntent: strategicIntent({
          setupEngine: ["runner.rig_first"],
        }),
      }),
      dwarf.instanceId,
    );

    expect(evaluation.persistentInstallEvaluation).toMatchObject({
      capabilityDelta: "cost_upgrade",
      duplicateRole: "useful_backup",
    });
    expect(evaluation.persistentInstallEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        "breaker_variant_supported:true",
        expect.stringContaining("lower_break_cost"),
      ]),
    );
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeGreaterThan(0);

    const incompleteRig = breakerVariantDeckCapabilities();
    incompleteRig.runner!.breakerCoverageMatrix.code_gate.installed = false;
    incompleteRig.runner!.breakerCoverageMatrix.code_gate.inHand = true;
    const blockedVariant = findByInstance(
      evaluateRunnerHandDevelopment({
        input,
        deckCapabilities: incompleteRig,
        strategicIntent: strategicIntent({
          setupEngine: ["runner.rig_first"],
        }),
      }),
      dwarf.instanceId,
    );
    expect(blockedVariant.persistentInstallEvaluation).toMatchObject({
      capabilityDelta: "backup_only",
      duplicateRole: "redundant_duplicate",
    });
    expect(blockedVariant.persistentInstallEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        expect.stringContaining("primary_coverage_not_installed:code_gate"),
      ]),
    );
  });

  it("devalues a second Junkyard BBS as non-additive recovery utility", () => {
    const secondJunkyard = visibleCard("junkyard-2", {
      definitionId: "onr_v1_165_junkyard-bbs",
      title: "Junkyard BBS",
      type: "resource",
      installCost: 0,
      rulesText: "A, [1]: Bring the top card from your trash into your hand.",
    });
    const installedJunkyard = visibleCard("junkyard-installed", {
      definitionId: "onr_v1_165_junkyard-bbs",
      title: "Junkyard BBS",
      type: "resource",
      rulesText: "A, [1]: Bring the top card from your trash into your hand.",
    });
    const input = runnerInput({
      credits: 6,
      hand: [
        secondJunkyard,
        visibleCard("buffer-1", { type: "event" }),
        visibleCard("buffer-2", { type: "event" }),
        visibleCard("buffer-3", { type: "event" }),
        visibleCard("buffer-4", { type: "event" }),
      ],
      rig: [installedJunkyard],
      legalActions: [installAction("install-second-junkyard", secondJunkyard, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "junkyard-2",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "duplicate_or_low_value",
      deferReason: "duplicate",
      persistentInstallEvaluation: {
        capabilityDelta: "backup_only",
        duplicateRole: "redundant_duplicate",
        stackabilityClass: "absolute_non_stackable",
        installedSameDefinitionCount: 1,
        installedSameFunctionalGroupCount: 1,
      },
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeLessThan(0);
    expect(evaluation.persistentInstallEvaluation?.handBufferPenalty).toBeLessThan(0);
    expect(evaluation.persistentInstallEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        "non_additive_utility_duplicate",
        "action_gated_utility_already_installed",
        "duplicate_install_reduces_damage_buffer",
        "why_duplicate_install_deferred:low_marginal_utility",
      ]),
    );
  });

  it("devalues a functionally similar second search resource", () => {
    const shortCircuit = visibleCard("short-circuit-2", {
      definitionId: "onr_v1_177_the-short-circuit",
      title: "The Short Circuit",
      type: "resource",
      installCost: 2,
      rulesText:
        "A, [1]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.",
    });
    const installedAujourdOui = visibleCard("aujourdoui-installed", {
      definitionId: "onr_v1_151_aujourdoui",
      title: "Aujourd'Oui",
      type: "resource",
      rulesText:
        "A: Look at the top five cards of your stack. You may bring any program cards among them into your hand. Pay [1] for each card taken in this way, and show those cards to the Corp. Shuffle your stack.",
    });
    const input = runnerInput({
      credits: 7,
      hand: [
        shortCircuit,
        visibleCard("buffer-1", { type: "event" }),
        visibleCard("buffer-2", { type: "event" }),
        visibleCard("buffer-3", { type: "event" }),
      ],
      rig: [installedAujourdOui],
      legalActions: [installAction("install-short-circuit", shortCircuit, 2)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent({
          setupEngine: ["runner.search_breaker_setup"],
        }),
      }),
      "short-circuit-2",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "draw_or_search_engine",
      deferReason: "duplicate",
      persistentInstallEvaluation: {
        capabilityDelta: "backup_only",
        duplicateRole: "redundant_duplicate",
        stackabilityClass: "absolute_non_stackable",
        installedSameDefinitionCount: 0,
        installedSameFunctionalGroupCount: 1,
      },
    });
    expect(evaluation.persistentInstallEvaluation?.newFunctionalCoverage).toEqual([]);
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeLessThan(0);
    expect(evaluation.persistentInstallEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        "non_additive_utility_duplicate",
        "action_gated_utility_already_installed",
      ]),
    );
  });

  it("bounds non-additive search utility signals to exact tokens", () => {
    const searchResource = visibleCard("search-resource-1", {
      definitionId: "test-search-resource",
      title: "Search Resource",
      type: "resource",
      installCost: 0,
      rulesText: "program_search hidden_zone_tool search",
    });
    const noisyResource = visibleCard("search-resource-noise", {
      definitionId: "test-search-resource-noise",
      title: "Search Resource Noise",
      type: "resource",
      installCost: 0,
      rulesText: "program_searchish hidden_zone_toolish searchlight",
    });
    const input = runnerInput({
      credits: 5,
      hand: [searchResource, noisyResource],
      legalActions: [
        installAction("install-search-resource", searchResource, 0),
        installAction("install-search-resource-noise", noisyResource, 0),
      ],
    });

    const evaluations = evaluateRunnerHandDevelopment({ input });
    const positive = findByInstance(evaluations, "search-resource-1");
    const noise = findByInstance(evaluations, "search-resource-noise");

    expect(positive.persistentInstallEvaluation?.newFunctionalCoverage).toEqual(
      expect.arrayContaining([
        "non_additive_utility:program_search",
        "non_additive_utility:hidden_zone_search",
      ]),
    );
    expect(noise.persistentInstallEvaluation?.newFunctionalCoverage).not.toEqual(
      expect.arrayContaining([
        "non_additive_utility:program_search",
        "non_additive_utility:hidden_zone_search",
      ]),
    );
  });

  it("allows recovery utility replacement when no copy remains installed", () => {
    const replacementJunkyard = visibleCard("junkyard-replacement", {
      definitionId: "onr_v1_165_junkyard-bbs",
      title: "Junkyard BBS",
      type: "resource",
      installCost: 0,
      rulesText: "A, [1]: Bring the top card from your trash into your hand.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [replacementJunkyard],
      rig: [],
      legalActions: [
        installAction("install-replacement-junkyard", replacementJunkyard, 0),
      ],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "junkyard-replacement",
    );

    expect(evaluation).toMatchObject({
      deferReason: "none",
      persistentInstallEvaluation: {
        capabilityDelta: "new_coverage",
        duplicateRole: "none",
        installedSameDefinitionCount: 0,
        installedSameFunctionalGroupCount: 0,
      },
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeGreaterThan(0);
    expect(evaluation.persistentInstallEvaluation?.evidence).not.toEqual(
      expect.arrayContaining(["non_additive_utility_duplicate"]),
    );
  });

  it("keeps cumulative damage prevention useful under risky breaker pressure", () => {
    const prevention = visibleCard("prevention-2", {
      definitionId: "test-damage-prevention",
      title: "Net Shield",
      type: "resource",
      installCost: 0,
      rulesText: "Prevent 2 net damage.",
    });
    const installedPrevention = visibleCard("prevention-installed", {
      definitionId: "test-damage-prevention",
      title: "Net Shield",
      type: "resource",
      rulesText: "Prevent 2 net damage.",
    });
    const installedBlink = visibleCard("blink-installed", {
      definitionId: "test-risky-universal-breaker",
      title: "Blink",
      type: "program",
      subtypes: ["icebreaker"],
      rulesText:
        "Icebreaker. Break any ice subroutine. Whenever you use this breaker, suffer 2 net damage.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [prevention],
      rig: [installedBlink, installedPrevention],
      legalActions: [installAction("install-prevention", prevention, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "prevention-2",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "useful_now",
      deferReason: "none",
      persistentInstallEvaluation: {
        capabilityDelta: "cumulative_capacity",
        duplicateRole: "useful_backup",
        stackabilityClass: "cumulative_capacity",
      },
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeGreaterThan(0);
    expect(evaluation.persistentInstallEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        "why_cumulative_copy_still_useful:bounded_diminishing_returns",
        "why_support_over_duplicate_breaker:damage_or_hand_buffer",
      ]),
    );
  });

  it("values a stable breaker alternative over already installed risky coverage", () => {
    const stableWallBreaker = visibleCard("stable-wall-breaker", {
      definitionId: "test-stable-wall-breaker",
      title: "Stable Wall Breaker",
      type: "program",
      subtypes: ["icebreaker", "fracter"],
      installCost: 1,
      memoryCost: 1,
      rulesText: "Icebreaker. Break wall subroutines.",
    });
    const installedBlink = visibleCard("blink-installed", {
      definitionId: "test-risky-universal-breaker",
      title: "Blink",
      type: "program",
      subtypes: ["icebreaker"],
      rulesText:
        "Icebreaker. Break any ice subroutine. Whenever you use this breaker, suffer 2 net damage.",
    });
    const input = runnerInput({
      credits: 6,
      hand: [
        stableWallBreaker,
        visibleCard("buffer-1", { type: "event" }),
        visibleCard("buffer-2", { type: "event" }),
      ],
      rig: [installedBlink],
      memoryUsed: 1,
      memoryLimit: 4,
      legalActions: [installAction("install-stable-wall", stableWallBreaker, 1)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "stable-wall-breaker",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "breaker_or_rig_piece",
      persistentInstallEvaluation: {
        capabilityDelta: "risk_reduction",
        duplicateRole: "useful_backup",
        stackabilityClass: "risk_mitigation",
      },
    });
    expect(evaluation.persistentInstallEvaluation?.finalInstallFit).toBeGreaterThan(0);
  });

  it("marks useful but currently unavailable run events as timing-blocked", () => {
    const runEvent = visibleCard("run-event-1", {
      definitionId: "test-run-event",
      title: "Run Event",
      type: "event",
      cost: 2,
      rulesText: "Make a run on HQ; if successful, access 1 additional card.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [runEvent],
      legalActions: [],
    });

    const evaluations = evaluateRunnerHandDevelopment({
      input,
      strategicIntent: strategicIntent({
        executionStyle: "runner.run_event_tempo",
        pressureVectors: ["runner.central_probe_pressure"],
      }),
    });
    const evaluation = findByInstance(evaluations, "run-event-1");

    expect(evaluation).toMatchObject({
      developmentRole: "access_payoff",
      availability: "timing_blocked",
      currentNeed: "useful_now",
      strategicFit: "strong",
      deferReason: "timing",
    });
  });
});

function runnerInput(params: {
  credits: number;
  clicks?: number;
  hand: VisibleCard[];
  legalActions: LegalAction[];
  rig?: VisibleCard[];
  memoryUsed?: number;
  memoryLimit?: number;
  servers?: PlayerView["servers"];
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
      clicks: params.clicks ?? 3,
      agendaPoints: 0,
      gripOrHq: params.hand,
      stackOrRdCount: 20,
      heapOrArchives: [],
      scoreArea: [],
      rig: params.rig ?? [],
      ...(params.memoryUsed !== undefined ? { memoryUsed: params.memoryUsed } : {}),
      ...(params.memoryLimit !== undefined ? { memoryLimit: params.memoryLimit } : {}),
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
    servers: params.servers ?? [],
    publicEvents: [],
    legalActions: params.legalActions,
    winner: null,
    agendaPointsToWin: 7,
  };
  return {
    side: "runner",
    playerView,
    eventTail: [],
    legalActions: params.legalActions,
    difficulty: "normal",
    seed: "runner-hand-development-test",
    decisionId: "runner-hand-development-test:1:runner",
    actionNumber: 1,
    profileId: "runner-ai-test",
  };
}

function breakerVariantDeckCapabilities(): DeckCapabilityProfile {
  const state = (
    coverage: string,
    installed: boolean,
  ) => ({
    coverage,
    inDeckKnown: true,
    inHand: false,
    installed,
    searchableNow: false,
    drawOnly: false,
    missing: false,
    bestKnownCards: [],
    blockers: [],
  });
  return {
    schemaVersion: "deck-capability-profile-v1",
    side: "runner",
    runner: {
      breakerInventory: [
        {
          cardId: "onr_v1_021_dwarf",
          title: "Dwarf",
          coverage: ["wall"],
          breakCost: 1,
          pumpCost: 1,
          risks: [],
          restrictions: [],
          quantityKnownInDeck: 2,
          locations: ["in_hand"],
          confidence: "high",
          evidence: ["test_deck_variant"],
        },
        {
          cardId: "onr_v1_047_pile-driver",
          title: "Pile Driver",
          coverage: ["wall"],
          breakCost: 3,
          pumpCost: 1,
          risks: ["stealth_loss"],
          restrictions: [],
          quantityKnownInDeck: 2,
          locations: ["installed"],
          confidence: "high",
          evidence: ["test_deck_variant"],
        },
      ],
      breakerCoverageMatrix: {
        wall: state("wall", true),
        code_gate: state("code_gate", true),
        sentry: state("sentry", true),
        ap: state("ap", false),
        trace: state("trace", false),
        universal: state("universal", false),
        subtype_limited: state("subtype_limited", false),
        special: state("special", false),
      },
      searchAccess: {
        tools: [],
        canSearchProgramsNow: false,
        canSearchBreakersNow: false,
        evidence: [],
      },
      economyBankTools: [],
      memoryProfile: {
        memoryUsed: 1,
        memoryLimit: 4,
        memoryAvailable: 3,
        memoryToolsKnown: 0,
        missingMemoryPressure: false,
        evidence: [],
      },
      attackPlanProfile: {
        centralPressureToolsKnown: 0,
        remoteContestToolsKnown: 0,
        setupToolsKnown: 2,
        evidence: [],
      },
    },
    missingCapabilities: [],
    confidence: "high",
    evidence: ["test_breaker_variant_profile"],
  } as DeckCapabilityProfile;
}

function strategicIntent(
  overrides: Partial<
    Pick<
      RunnerStrategicIntentProfile,
      "executionStyle" | "setupEngine" | "pressureVectors"
    >
  > = {},
): RunnerStrategicIntentProfile {
  return {
    schemaVersion: RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
    side: "runner",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "runner.steal_agendas_default",
    ...(overrides.executionStyle ? { executionStyle: overrides.executionStyle } : {}),
    setupEngine: overrides.setupEngine ?? [],
    pressureVectors: overrides.pressureVectors ?? [],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "medium",
    evidence: ["test_strategic_intent"],
  };
}

function installAction(
  actionId: string,
  card: VisibleCard,
  creditCost: number,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "install_card",
    label: `Install ${card.title ?? card.instanceId}`,
    source: card.instanceId,
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }, ...(creditCost > 0 ? [{ credits: creditCost }] : [])],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
    payload: {
      cardId: card.instanceId,
      ...(card.definitionId ? { cardDefinitionId: card.definitionId } : {}),
    },
  };
}

function playEventAction(
  actionId: string,
  card: VisibleCard,
  creditCost: number,
): LegalAction {
  return {
    actionId,
    side: "runner",
    type: "play_event",
    label: `Play ${card.title ?? card.instanceId}`,
    source: card.instanceId,
    timingPoint: "runner_action.main",
    costs: [{ clicks: 1 }, ...(creditCost > 0 ? [{ credits: creditCost }] : [])],
    targetRequirements: [],
    visibility: "private_to_actor",
    expiresAtStateVersion: 2,
    payload: {
      cardId: card.instanceId,
      ...(card.definitionId ? { cardDefinitionId: card.definitionId } : {}),
    },
  };
}

function startRunAction(actionId: string, serverId: string): LegalAction {
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
  overrides: Omit<Partial<VisibleCard>, "instanceId" | "known" | "owner" | "controller">,
): VisibleCard {
  return {
    instanceId,
    owner: "runner",
    controller: "runner",
    known: true,
    ...overrides,
  };
}

function findByInstance(
  evaluations: ReturnType<typeof evaluateRunnerHandDevelopment>,
  instanceId: string,
) {
  const evaluation = evaluations.find(
    (candidate) => candidate.cardInstanceId === instanceId,
  );
  expect(evaluation).toBeDefined();
  return evaluation!;
}
