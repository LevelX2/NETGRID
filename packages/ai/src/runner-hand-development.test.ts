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
import { AI_HINTS_BY_CARD, type AiCardHint } from "./ai-hints";
import { buildActionSemanticCandidates } from "./action-semantic-candidate";
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
} from "./runner-hand-development.test-support";

describe("RunnerHandDevelopmentEvaluation", () => {
  it("prefers a legal hosted program route over an optional program-trash install", () => {
    const program = visibleCard("pattels-virus", {
      definitionId: "onr_v1_046_pattels-virus",
      title: "Pattel's Virus",
      type: "program",
      installCost: 1,
      memoryCost: 1,
      subtypes: ["virus"],
    });
    const trashInstall = installAction(
      "install-pattels.runner_program_trash_before_install",
      program,
      1,
    );
    trashInstall.payload = {
      ...trashInstall.payload,
      runnerProgramTrashBeforeInstall: true,
    };
    const hostedInstall = installAction(
      "install-pattels-on-succubus",
      program,
      1,
    );
    hostedInstall.payload = {
      ...hostedInstall.payload,
      hostOnCardId: "installed-succubus",
    };
    const input = runnerInput({
      credits: 7,
      hand: [program],
      legalActions: [trashInstall, hostedInstall],
    });
    input.playerView.own.memoryUsed = 4;
    input.playerView.own.memoryLimit = 4;

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      program.instanceId,
    );

    expect(evaluation).toMatchObject({
      legalActionId: hostedInstall.actionId,
      availability: "legal_now",
    });
  });

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
      credits: 6,
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
    expect(redacted.join("\n")).not.toMatch(
      /R&D Interface|test-rd-interface|rd-interface-1/,
    );
    expect(evaluation.evidence.join("\n")).not.toMatch(
      /R&D Interface|test-rd-interface|rd-interface-1/,
    );
  });

  it("binds canonical information cards to unknown ICE without inventing a text heuristic", () => {
    const guide = visibleCard("guide-1", {
      definitionId: "onr_v1_092_ice-and-datas-guide-to-the-net",
      title: "Ice and Data’s Guide to the Net",
      type: "event",
      cost: 0,
    });
    const smarteye = visibleCard("smarteye-1", {
      definitionId: "onr_v1_065_smarteye",
      title: "Smarteye",
      type: "program",
      installCost: 2,
      memoryCost: 1,
    });
    const unknownIce: VisibleCard = {
      instanceId: "unknown-hq-ice",
      owner: "corp",
      controller: "corp",
      known: false,
      rezzed: false,
    };
    const guideAction = playEventAction("play-guide", guide, 0);
    const smarteyeAction = installAction("install-smarteye", smarteye, 2);
    const evaluations = evaluateRunnerHandDevelopment({
      input: runnerInput({
        credits: 5,
        hand: [guide, smarteye],
        legalActions: [guideAction, smarteyeAction],
        servers: [
          {
            id: "hq",
            label: "HQ",
            ice: [unknownIce],
            root: [],
          },
        ],
      }),
      strategicIntent: strategicIntent({
        pressureVectors: ["runner.central_probe_pressure"],
      }),
    });

    expect(findByInstance(evaluations, guide.instanceId)).toMatchObject({
      developmentRole: "access_payoff",
      currentNeed: "useful_now",
      legalActionId: guideAction.actionId,
      deferReason: "none",
    });
    expect(findByInstance(evaluations, smarteye.instanceId)).toMatchObject({
      developmentRole: "access_payoff",
      currentNeed: "useful_now",
      legalActionId: smarteyeAction.actionId,
      deferReason: "none",
    });
  });

  it("does not assign a current information purpose after all visible ICE is known", () => {
    const smarteye = visibleCard("smarteye-known-path", {
      definitionId: "onr_v1_065_smarteye",
      title: "Smarteye",
      type: "program",
      installCost: 2,
      memoryCost: 1,
    });
    const knownIce: VisibleCard = {
      instanceId: "known-hq-ice",
      definitionId: "simple_barrier",
      title: "Known ICE",
      type: "ice",
      owner: "corp",
      controller: "corp",
      known: true,
      rezzed: true,
    };
    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 5,
          hand: [smarteye],
          legalActions: [installAction("install-smarteye", smarteye, 2)],
          servers: [
            {
              id: "hq",
              label: "HQ",
              ice: [knownIce],
              root: [],
            },
          ],
        }),
      }),
      smarteye.instanceId,
    );

    expect(evaluation).toMatchObject({
      developmentRole: "access_payoff",
      currentNeed: "none",
    });
    expect(evaluation.deferReason).not.toBe("none");
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

  it("defers hosted breaker economy until a hostable breaker is in hand", () => {
    const eurocorpse = visibleCard("eurocorpse-1", {
      definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
      title: "Eurocorpse (TM) Spin Chip",
      type: "hardware",
      installCost: 6,
    });
    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 20,
          clicks: 2,
          hand: [eurocorpse],
          legalActions: [installAction("install-eurocorpse", eurocorpse, 6)],
        }),
      }),
      eurocorpse.instanceId,
    );

    expect(evaluation).toMatchObject({
      developmentRole: "economy_engine",
      availability: "legal_now",
      currentNeed: "later",
    });
    expect(evaluation.evidence).toContain("hosted_icebreaker_required:true");
    expect(evaluation.evidence).toContain(
      "hostable_icebreaker_available:false",
    );
    expect(evaluation.activationPrerequisites).toEqual([
      { kind: "hosted_icebreaker", satisfied: false },
    ]);
  });

  it("keeps hosted breaker economy useful when a breaker is immediately hostable", () => {
    const eurocorpse = visibleCard("eurocorpse-1", {
      definitionId: "onr_proteus_139_eurocorpse-tm-spin-chip",
      title: "Eurocorpse (TM) Spin Chip",
      type: "hardware",
      installCost: 6,
    });
    const breaker = visibleCard("krash-1", {
      definitionId: "onr_v1_039_krash",
      title: "Krash",
      type: "program",
      subtypes: ["icebreaker"],
      installCost: 3,
      memoryCost: 1,
      rulesText: "Icebreaker: break ice subroutines.",
    });
    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 20,
          clicks: 2,
          hand: [eurocorpse, breaker],
          legalActions: [
            installAction("install-eurocorpse", eurocorpse, 6),
            installAction("install-krash", breaker, 3),
          ],
        }),
      }),
      eurocorpse.instanceId,
    );

    expect(evaluation.currentNeed).not.toBe("later");
    expect(evaluation.evidence).toContain("hostable_icebreaker_available:true");
    expect(evaluation.activationPrerequisites).toEqual([
      { kind: "hosted_icebreaker", satisfied: true },
    ]);
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
    const economyEvaluation = findByInstance(
      evaluations,
      "expensive-economy-1",
    );

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
        targetCredits: 5,
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
      legalActions: [
        installAction("install-cortical-cybermodem", cybermodem, 11),
      ],
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

  it("classifies subtype-restricted recurring breaker credits as economy", () => {
    const corolla = visibleCard("corolla-speed-chip-1", {
      definitionId: "onr_v1_124_corolla-speed-chip",
      title: "Corolla Speed Chip",
      type: "hardware",
      installCost: 1,
    });
    const input = runnerInput({
      credits: 5,
      hand: [corolla],
      legalActions: [installAction("install-corolla", corolla, 1)],
    });

    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({ input }),
      "corolla-speed-chip-1",
    );

    expect(evaluation).toMatchObject({
      developmentRole: "economy_engine",
      availability: "legal_now",
      deferReason: "none",
    });
    expect(evaluation.evidence).toEqual(
      expect.arrayContaining(["breaker_recurring_economy"]),
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
      definitionId: "onr_v1_028_force-shield",
      title: "Force Shield",
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

  it("treats an exact tag-removal action as acute only while tags exist", () => {
    const mileage = visibleCard("mileage-1", {
      definitionId: "onr_v1_102_open-ended-mileage-program",
      title: "Open-Ended Mileage Program",
      type: "event",
      cost: 0,
      rulesText: "Remove a tag, at no cost.",
    });
    const action = {
      ...playEventAction("play-mileage", mileage, 0),
      payload: {
        cardId: mileage.instanceId,
        cardImplementationEffectKind: "remove_tags",
        cardImplementationTagMode: "amount",
        cardImplementationTagAmount: 1,
      },
    } satisfies LegalAction;
    const taggedInput = runnerInput({
      credits: 4,
      tags: 2,
      hand: [mileage],
      legalActions: [action],
    });
    const untaggedInput = runnerInput({
      credits: 4,
      hand: [mileage],
      legalActions: [action],
    });
    const actionCandidates = buildActionSemanticCandidates({
      legalActions: [action],
      visibleSourceDefinitionsByInstanceId: {
        [mileage.instanceId]: mileage.definitionId!,
      },
    });

    expect(
      findByInstance(
        evaluateRunnerHandDevelopment({ input: taggedInput, actionCandidates }),
        mileage.instanceId,
      ),
    ).toMatchObject({
      developmentRole: "defense_support",
      availability: "legal_now",
      currentNeed: "acute",
      deferReason: "none",
    });
    expect(
      findByInstance(
        evaluateRunnerHandDevelopment({
          input: untaggedInput,
          actionCandidates,
        }),
        mileage.instanceId,
      ),
    ).toMatchObject({
      currentNeed: "none",
      deferReason: "no_current_need",
    });
  });

  it("treats visible net-damage ICE as a setup need without inventing an acute damage window", () => {
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
      currentNeed: "setup",
      strategicFit: "medium",
      deferReason: "none",
      persistentInstallEvaluation: {
        capabilityDelta: "cumulative_capacity",
        stackabilityClass: "cumulative_capacity",
      },
    });
    expect(evaluation.priority).toBeGreaterThanOrEqual(500);
  });

  it("does not install trace defense merely because an unrelated visible damage threat exists", () => {
    const signpost = visibleCard("signpost-1", {
      definitionId: "onr_v1_063_signpost",
      title: "Signpost",
      type: "program",
      installCost: 2,
      memoryCost: 1,
      rulesText:
        "[1]: +2 link. Use this ability only once during each trace attempt.",
    });
    const input = runnerInput({
      credits: 6,
      hand: [signpost],
      legalActions: [installAction("install-signpost", signpost, 2)],
      servers: [
        {
          id: "rd",
          label: "R&D",
          ice: [
            visibleCard("damage-ice", {
              definitionId: "onr_v1_269_shotgun-wire",
              title: "Shotgun Wire",
              type: "ice",
              subtypes: ["wall"],
              rulesText: "Do 2 net damage. End the run.",
              rezzed: true,
            }),
          ],
          root: [],
        },
      ],
    });

    expect(
      findByInstance(
        evaluateRunnerHandDevelopment({ input }),
        signpost.instanceId,
      ),
    ).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "none",
      deferReason: "no_current_need",
    });
  });

  it("opens trace-defense setup only for a visible rezzed trace threat", () => {
    const access = visibleCard("access-1", {
      definitionId: "onr_v1_149_access-to-arasaka",
      title: "Access to Arasaka",
      type: "resource",
      installCost: 2,
      subtypes: ["base_link"],
      rulesText:
        "[2]: Base link 4. [2]: +1 link. Use only one base link card for each trace attempt made against you.",
    });
    const traceIce = visibleCard("trace-ice", {
      definitionId: "onr_v1_249_hunter",
      title: "Hunter",
      type: "ice",
      subtypes: ["sentry", "bloodhound"],
      rezzed: true,
    });
    traceIce.effectiveRunQuote = {
      iceInstanceId: traceIce.instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: "hunter-trace",
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          traceLimit: 5,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
        },
      ],
    };
    const input = runnerInput({
      credits: 8,
      hand: [access],
      legalActions: [installAction("install-access", access, 2)],
      servers: [{ id: "rd", label: "R&D", ice: [traceIce], root: [] }],
    });

    expect(
      findByInstance(
        evaluateRunnerHandDevelopment({ input }),
        access.instanceId,
      ),
    ).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "setup",
      deferReason: "none",
    });
  });

  it("opens Fall Guy setup for a visible tag threat but not unrelated damage", () => {
    const fallGuy = visibleCard("fall-guy-1", {
      definitionId: "onr_v1_161_fall-guy",
      title: "Fall Guy",
      type: "resource",
      installCost: 0,
      rulesText: "Trash: Avoid receiving a tag.",
    });
    const hunter = visibleCard("fall-guy-hunter", {
      definitionId: "onr_v1_249_hunter",
      title: "Hunter",
      type: "ice",
      rezzed: true,
    });
    hunter.effectiveRunQuote = {
      iceInstanceId: hunter.instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: "hunter-tag-trace",
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          traceLimit: 5,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
        },
      ],
    };
    const damageIce = visibleCard("fall-guy-damage-ice", {
      definitionId: "onr_v1_269_shotgun-wire",
      title: "Shotgun Wire",
      type: "ice",
      rezzed: true,
      rulesText: "Do 2 net damage. End the run.",
    });
    const install = installAction("install-fall-guy", fallGuy, 0);
    const evaluationWith = (ice: VisibleCard) =>
      findByInstance(
        evaluateRunnerHandDevelopment({
          input: runnerInput({
            credits: 5,
            hand: [fallGuy],
            legalActions: [install],
            servers: [{ id: "rd", label: "R&D", ice: [ice], root: [] }],
          }),
        }),
        fallGuy.instanceId,
      );

    expect(evaluationWith(damageIce)).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "none",
      deferReason: "no_current_need",
    });
    expect(evaluationWith(hunter)).toMatchObject({
      developmentRole: "defense_support",
      currentNeed: "setup",
      deferReason: "none",
    });
  });

  it("classifies every dedicated installable Runner trace-defense card by actual trace need", () => {
    const dedicatedTraceDefenseDefinitionIds = [
      "onr_v1_003_baedekers-net-map",
      "onr_v1_004_bakdoor",
      "onr_v1_063_signpost",
      "onr_v1_148_access-through-alpha",
      "onr_v1_149_access-to-arasaka",
      "onr_v1_150_access-to-kiribati",
      "onr_v1_152_back-door-to-hilliard",
      "onr_v1_153_back-door-to-orbital-air",
      "onr_v1_164_hells-run",
      "onr_v1_181_the-springboard",
      "onr_v1_182_submarine-uplink",
    ] as const;
    const hunter = visibleCard("trace-owner-hunter", {
      definitionId: "onr_v1_249_hunter",
      title: "Hunter",
      type: "ice",
      subtypes: ["sentry", "bloodhound"],
      rezzed: true,
    });
    hunter.effectiveRunQuote = {
      iceInstanceId: hunter.instanceId,
      iceDefinitionId: "onr_v1_249_hunter",
      effectiveStrength: 5,
      subroutines: [
        {
          id: "trace-owner-hunter-subroutine",
          type: "initiate_trace",
          sourceDefinitionId: "onr_v1_249_hunter",
          sourceTitle: "Hunter",
          traceLimit: 5,
          traceSuccessEffect: { type: "add_tag", amount: 1 },
        },
      ],
    };

    for (const definitionId of dedicatedTraceDefenseDefinitionIds) {
      const hint = AI_HINTS_BY_CARD.get(definitionId)!;
      const card = visibleCard(`trace-defense-${definitionId}`, {
        definitionId,
        title: definitionId,
        type: hint.cardType as "program" | "resource",
        installCost: hint.costProfile?.credits ?? 0,
        memoryCost: hint.costProfile?.memory ?? 0,
      });
      const install = installAction(`install-${definitionId}`, card, 0);
      const withoutTrace = findByInstance(
        evaluateRunnerHandDevelopment({
          input: runnerInput({
            credits: 20,
            hand: [card],
            legalActions: [install],
          }),
        }),
        card.instanceId,
      );
      const withTrace = findByInstance(
        evaluateRunnerHandDevelopment({
          input: runnerInput({
            credits: 20,
            hand: [card],
            legalActions: [install],
            servers: [{ id: "rd", label: "R&D", ice: [hunter], root: [] }],
          }),
        }),
        card.instanceId,
      );

      expect(
        {
          definitionId,
          role: withoutTrace.developmentRole,
          currentNeed: withoutTrace.currentNeed,
        },
        definitionId,
      ).toEqual({
        definitionId,
        role: "defense_support",
        currentNeed: "none",
      });
      expect(withTrace.currentNeed, definitionId).toBe("setup");
    }
  });

  it("keeps multifunction trace hardware on its primary setup route", () => {
    const multifunctionHardwareDefinitionIds = [
      "onr_v1_136_pandoras-deck",
      "onr_v1_138_pk-6089a",
      "onr_v1_143_techtronica-utility-suit",
    ] as const;

    for (const definitionId of multifunctionHardwareDefinitionIds) {
      const hint = AI_HINTS_BY_CARD.get(definitionId)!;
      const card = visibleCard(`trace-hardware-${definitionId}`, {
        definitionId,
        title: definitionId,
        type: "hardware",
        installCost: hint.costProfile?.credits ?? 0,
      });
      const evaluation = findByInstance(
        evaluateRunnerHandDevelopment({
          input: runnerInput({
            credits: 20,
            hand: [card],
            legalActions: [installAction(`install-${definitionId}`, card, 0)],
          }),
        }),
        card.instanceId,
      );

      expect(evaluation.developmentRole, definitionId).not.toBe(
        "defense_support",
      );
    }
  });

  it("keeps trace-supporting run events on the run route", () => {
    const stumble = visibleCard("stumble-through-wilderspace", {
      definitionId: "onr_v1_112_stumble-through-wilderspace",
      title: "Stumble through Wilderspace",
      type: "event",
      cost: 2,
      rulesText:
        "Make a run. You have +9 link for every trace attempt made during that run.",
    });
    const evaluation = findByInstance(
      evaluateRunnerHandDevelopment({
        input: runnerInput({
          credits: 8,
          hand: [stumble],
          legalActions: [playEventAction("play-stumble", stumble, 2)],
        }),
      }),
      stumble.instanceId,
    );

    expect(evaluation.developmentRole).toBe("run_event");
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

  it("binds duplicate hand cards to their own instance-specific install actions", () => {
    const first = visibleCard("worm-1", {
      definitionId: "onr_v1_074_worm",
      title: "Worm",
      type: "program",
      installCost: 4,
      memoryCost: 1,
    });
    const second = visibleCard("worm-2", {
      definitionId: "onr_v1_074_worm",
      title: "Worm",
      type: "program",
      installCost: 4,
      memoryCost: 1,
    });
    const firstInstall = installAction("install-worm-1", first, 4);
    const secondInstall = installAction("install-worm-2", second, 4);
    const evaluations = evaluateRunnerHandDevelopment({
      input: runnerInput({
        credits: 8,
        hand: [first, second],
        legalActions: [firstInstall, secondInstall],
      }),
    });

    expect(findByInstance(evaluations, first.instanceId).legalActionId).toBe(
      firstInstall.actionId,
    );
    expect(findByInstance(evaluations, second.instanceId).legalActionId).toBe(
      secondInstall.actionId,
    );
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

    const evaluation = withAiHint(
      "onr_v1_042_mouse",
      structuredRunnerHint("onr_v1_042_mouse", "program", [
        {
          kind: "expose_info",
          timing: "action",
          scope: "installed_card",
          resource: "cards",
          target: "info.expose_installed_card",
          finite: true,
        },
      ]),
      () =>
        findByInstance(
          evaluateRunnerHandDevelopment({
            input,
            strategicIntent: strategicIntent({
              pressureVectors: ["runner.central_probe_pressure"],
            }),
          }),
          "mouse-1",
        ),
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
    expect(
      evaluation.persistentInstallEvaluation?.finalInstallFit,
    ).toBeLessThan(0);
    expect(evaluation.priority).toBeGreaterThanOrEqual(300);
  });

  it("does not assign expose ownership from rules text without the structured fact", () => {
    const textOnlyExpose = visibleCard("text-only-expose-1", {
      definitionId: "test-text-only-expose",
      title: "Text-only expose",
      type: "program",
      installCost: 0,
      memoryCost: 1,
      rulesText: "Expose one unrezzed installed Corp card.",
    });
    const input = runnerInput({
      credits: 4,
      hand: [textOnlyExpose],
      legalActions: [
        installAction("install-text-only-expose", textOnlyExpose, 0),
      ],
    });

    expect(
      findByInstance(
        evaluateRunnerHandDevelopment({ input }),
        textOnlyExpose.instanceId,
      ).developmentRole,
    ).toBe("unknown");
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
});

function structuredRunnerHint(
  cardId: string,
  cardType: string,
  effects: NonNullable<AiCardHint["effects"]>,
): AiCardHint {
  return {
    cardId,
    side: "runner",
    cardType,
    roles: [],
    planRoles: [],
    aiSupportStatus: "ai_supported",
    effects,
  };
}

function withAiHint<T>(cardId: string, hint: AiCardHint, run: () => T): T {
  const previous = AI_HINTS_BY_CARD.get(cardId);
  AI_HINTS_BY_CARD.set(cardId, hint);
  try {
    return run();
  } finally {
    if (previous) AI_HINTS_BY_CARD.set(cardId, previous);
    else AI_HINTS_BY_CARD.delete(cardId);
  }
}
