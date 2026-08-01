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
} from "../../runner-hand-development";
import {
  RUNNER_STRATEGIC_INTENT_SCHEMA_VERSION,
  type RunnerStrategicIntentProfile,
} from "../../runner-strategic-intent";
import { discardKeepScore } from "../../runtime/discard-keep-score";
import { selectedSearchChoiceOptionIds } from "../../runtime/search-choice-option";
import type { DeckCapabilityProfile } from "../../deck-capabilities";
import {
  breakerVariantDeckCapabilities,
  findByInstance,
  installAction,
  playEventAction,
  runnerInput,
  startRunAction,
  strategicIntent,
  visibleCard,
  visibleIdentity,
} from "../../runner-hand-development.test-support";

describe("RunnerHandDevelopmentEvaluation persistent installs", () => {
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeGreaterThan(0);
  });

  it("values a second structured random breaker by its independent success gain", () => {
    const installedBlink = visibleCard("blink-installed", {
      definitionId: "onr_v1_007_blink",
      title: "Blink",
      type: "program",
      subtypes: ["icebreaker"],
      memoryCost: 1,
    });
    const secondBlink = visibleCard("blink-2", {
      definitionId: "onr_v1_007_blink",
      title: "Blink",
      type: "program",
      subtypes: ["icebreaker"],
      installCost: 2,
      memoryCost: 1,
    });
    const handBuffer = Array.from({ length: 4 }, (_, index) =>
      visibleCard(`buffer-${index}`, {
        definitionId: `buffer-${index}`,
        title: "Buffer",
        type: "event",
      }),
    );
    const input = runnerInput({
      credits: 8,
      hand: [secondBlink, ...handBuffer],
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
      developmentRole: "breaker_or_rig_piece",
      availability: "legal_now",
      deferReason: "none",
      persistentInstallEvaluation: {
        capabilityDelta: "risk_reduction",
        duplicateRole: "useful_backup",
        stackabilityClass: "risk_mitigation",
      },
    });
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeGreaterThan(0);
    expect(evaluation.persistentInstallEvaluation?.evidence).toEqual(
      expect.arrayContaining([
        "random_break_or_damage_profile:random_break_or_damage:net:0.5:3",
        "random_break_attempts_before:1",
        "random_break_success_probability_before:0.5",
        "random_break_success_probability_after:0.75",
        "random_break_success_probability_delta:0.25",
      ]),
    );
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
    const positiveEvidence = findByInstance(
      evaluations,
      "fracter-1",
    ).evidence.join("|");
    const noiseEvidence = findByInstance(
      evaluations,
      "fracteroid-1",
    ).evidence.join("|");

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
      rulesText:
        "Choose an installed icebreaker. That icebreaker has +2 strength.",
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
      expect(
        evaluation.persistentInstallEvaluation?.finalInstallFit,
      ).toBeGreaterThan(0);
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
      rulesText:
        "Choose an installed icebreaker. That icebreaker has +2 strength.",
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
    expect(
      findByInstance(development, "lockjaw").persistentInstallEvaluation
        ?.finalInstallFit,
    ).toBeGreaterThan(0);
    expect(
      findByInstance(development, "clown").persistentInstallEvaluation
        ?.finalInstallFit,
    ).toBeGreaterThan(0);

    const dependencies = {
      rolesForCardId: (cardId: string | undefined) =>
        rolesByCardId[cardId ?? ""] ?? [],
      definitionTypeForCardId: () => "program",
      visibleCardPlayOrInstallCost: (card: VisibleCard) =>
        card.installCost ?? 0,
      runnerCardAddressesVisibleBreakerNeed: () => false,
      runnerBadPublicityOrTraceTechCard: () => false,
      isRunnerEconomyRole: (role: string) => role === "economy",
      runnerCardLooksLikeCreditPayout: () => false,
    };
    const duplicateScore = discardKeepScore(
      input,
      duplicateKrash,
      dependencies,
    );
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeLessThan(0);
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeLessThan(0);
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeGreaterThan(0);

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
      legalActions: [
        installAction("install-second-junkyard", secondJunkyard, 0),
      ],
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeLessThan(0);
    expect(
      evaluation.persistentInstallEvaluation?.handBufferPenalty,
    ).toBeLessThan(0);
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
    expect(
      evaluation.persistentInstallEvaluation?.newFunctionalCoverage,
    ).toEqual([]);
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeLessThan(0);
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
    expect(
      noise.persistentInstallEvaluation?.newFunctionalCoverage,
    ).not.toEqual(
      expect.arrayContaining([
        "non_additive_utility:program_search",
        "non_additive_utility:hidden_zone_search",
      ]),
    );
  });

  it("defers recovery-only setup while the visible heap is empty", () => {
    const junkyard = visibleCard("junkyard-empty-heap", {
      definitionId: "onr_v1_165_junkyard-bbs",
      title: "Junkyard BBS",
      type: "resource",
      installCost: 0,
      rulesText: "A, [1]: Bring the top card from your trash into your hand.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [junkyard],
      rig: [],
      legalActions: [installAction("install-empty-junkyard", junkyard, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "junkyard-empty-heap",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "draw_or_search_engine",
      currentNeed: "none",
      deferReason: "no_current_need",
    });
  });

  it("prepares the first recovery provider for a coherent consumable-coverage engine", () => {
    const junkyard = visibleCard("junkyard-doctrine", {
      definitionId: "onr_v1_165_junkyard-bbs",
      title: "Junkyard BBS",
      type: "resource",
      installCost: 0,
      rulesText: "A, [1]: Bring the top card from your trash into your hand.",
    });
    const input = runnerInput({
      credits: 5,
      hand: [junkyard],
      rig: [],
      legalActions: [installAction("install-doctrine-junkyard", junkyard, 0)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent({
          engineLineIds: ["runner.engine.consumption_recovery"],
          engineProviders: [
            {
              providerId: "runner.provider:recovery",
              cardId: "onr_v1_165_junkyard-bbs",
              copies: 2,
              capabilities: ["runner.recovery.program_or_hardware"],
              supportCapabilities: [],
              persistence: "persistent",
              additivity: "redundant_by_default",
              compatibleDemandIds: [],
              evidence: [],
            },
          ],
        }),
      }),
      "junkyard-doctrine",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "draw_or_search_engine",
      currentNeed: "setup",
      deferReason: "none",
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining([
        "runner_engine_doctrine:prospective_recovery_infrastructure",
        "runner_engine_owner:runner.develop_board_and_hand",
      ]),
    );
  });

  it("keeps recovery as new coverage when another action-gated search family is installed", () => {
    const junkyard = visibleCard("junkyard-after-search", {
      definitionId: "onr_v1_165_junkyard-bbs",
      title: "Junkyard BBS",
      type: "resource",
      installCost: 1,
      rulesText: "A, [1]: Bring the top card from your trash into your hand.",
    });
    const installedProgramSearch = visibleCard("installed-program-search", {
      definitionId: "test-installed-program-search",
      title: "Program Search",
      type: "resource",
      rulesText: "A: Search your stack for a program.",
    });
    const input = runnerInput({
      credits: 1,
      hand: [junkyard],
      rig: [installedProgramSearch],
      legalActions: [
        installAction("install-junkyard-after-search", junkyard, 1),
      ],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input,
        strategicIntent: strategicIntent({
          engineLineIds: ["runner.engine.consumption_recovery"],
          engineProviders: [
            {
              providerId: "runner.provider:recovery",
              cardId: "onr_v1_165_junkyard-bbs",
              copies: 1,
              capabilities: ["runner.recovery.program_or_hardware"],
              supportCapabilities: [],
              persistence: "persistent",
              additivity: "redundant_by_default",
              compatibleDemandIds: [],
              evidence: [],
            },
          ],
        }),
      }),
      "junkyard-after-search",
    );

    expect(evaluation.persistentInstallEvaluation).toMatchObject({
      capabilityDelta: "new_coverage",
      duplicateRole: "none",
      newFunctionalCoverage: expect.arrayContaining([
        "non_additive_utility:recovery",
      ]),
    });
    expect(evaluation.persistentInstallEvaluation?.evidence).not.toEqual(
      expect.arrayContaining(["non_additive_utility_duplicate"]),
    );
  });

  it("allows recovery utility setup when the visible heap has a target", () => {
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
      heap: [visibleCard("visible-recovery-target", { type: "event" })],
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeGreaterThan(0);
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeGreaterThan(0);
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
      legalActions: [
        installAction("install-stable-wall", stableWallBreaker, 1),
      ],
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeGreaterThan(0);
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
      developmentRole: "run_event",
      availability: "timing_blocked",
      currentNeed: "useful_now",
      strategicFit: "strong",
      deferReason: "timing",
    });
  });
});
