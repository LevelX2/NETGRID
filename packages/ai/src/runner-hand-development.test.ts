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
      clicks: 3,
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
