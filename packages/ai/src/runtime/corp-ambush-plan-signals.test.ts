import {
  CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
  type AiDecisionInput,
  type PublicGameEvent,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import type { ActionSemanticCandidate } from "../action-semantic-candidate-types";
import {
  beliefStateInvariantSignature,
  reconstructBeliefState,
} from "../belief-state";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import type { ResidentPlanPortfolio } from "../plans/resident-plan-portfolio";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  buildCorpAmbushPlanSignals,
  corpAmbushAdvanceDispositionEvidence,
  CORP_AMBUSH_COMMITMENT_VERSION,
} from "./corp-ambush-plan-signals";

describe("Corp ambush plan signal duplicate scope", () => {
  it("counts only same-definition copies in active remote roots as installed duplicates", () => {
    const definitionId = "onr_v1_345_trap";
    const handCopy = visibleCard("trap-in-hq", "corp", "asset", {
      definitionId,
      title: "TRAP!",
    });
    const install = legalAction(
      "install-trap-remote-1",
      "corp",
      "install_card",
      "Install TRAP! in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: handCopy.instanceId,
        payload: {
          cardId: handCopy.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.credits = 8;
    input.playerView.own.gripOrHq = [handCopy];
    input.playerView.servers = [
      server("hq", [], [sameDefinitionCopy("trap-in-hq-root")]),
      server("rd", [], [sameDefinitionCopy("trap-in-rd")]),
      server("archives", [], [sameDefinitionCopy("trap-in-archives")]),
      server("remote_1"),
    ];
    setAmbushIntent(input);
    const candidate = ambushInstallCandidate(
      install.actionId,
      handCopy.instanceId,
      definitionId,
      "remote_1",
    );

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [candidate],
        previous: undefined,
      }),
    ).toEqual([
      expect.objectContaining({
        sourceInstanceId: handCopy.instanceId,
        sourceDefinitionId: definitionId,
        actionIds: [install.actionId],
        serverId: "remote_1",
        phase: "install",
        duplicateAlreadyInstalled: false,
      }),
    ]);

    input.playerView.servers.push(
      server("remote_2", [], [sameDefinitionCopy("trap-in-remote-2")]),
    );

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [candidate],
        previous: undefined,
      }),
    ).toEqual([]);

    function sameDefinitionCopy(instanceId: string) {
      return visibleCard(instanceId, "corp", "asset", {
        definitionId,
        title: "TRAP!",
      });
    }
  });

  it("qualifies an Engine-quoted contestable counter bank as a generic score decoy", () => {
    const counterBank = visibleCard(
      "synthetic-counter-bank-1",
      "corp",
      "asset",
      {
        definitionId: "synthetic_counter_bank",
        advancementCounters: 0,
        counterBankPreparationQuote: {
          schemaVersion: CORP_COUNTER_BANK_PREPARATION_QUOTE_SCHEMA_VERSION,
          context: "corp_counter_bank_preparation",
          sourceCardId: "synthetic-counter-bank-1",
          expiresAtStateVersion: 1,
          location: { kind: "corp_hq" },
          advancementCounters: 0,
          advanceableBeforeRez: true,
          activatedAbilitiesRequireRez: true,
          cashout: {
            advancementCounterCost: 1,
            creditGain: 1,
            actionCost: 0,
          },
          transfer: {
            actionCost: 1,
            minimumSourceCounters: 1,
            source: "source_card",
            target: "chosen_installed_advanceable_card",
            maximum: "all",
          },
        },
      },
    );
    const agenda = visibleCard("followup-agenda-1", "corp", "agenda", {
      definitionId: "simple_agenda",
      advancementRequirement: 3,
      agendaPoints: 2,
    });
    const install = legalAction(
      "install-synthetic-counter-bank-remote-1",
      "corp",
      "install_card",
      "Install the quoted counter bank",
      { credits: 0, clicks: 1 },
      {
        source: counterBank.instanceId,
        payload: {
          cardId: counterBank.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const input = aiInput("corp", [install]);
    input.playerView.own.gripOrHq = [counterBank, agenda];
    input.playerView.opponent.credits = 4;
    input.playerView.opponent.rig = [
      visibleCard("generic-breaker-1", "runner", "program", {
        definitionId: "onr_classic_031_rent-i-con",
        subtypes: ["icebreaker"],
        strength: 2,
      }),
    ];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [
        visibleCard("remote-code-gate-1", "corp", "ice", {
          definitionId: "onr_v1_261_quandary",
          rezzed: true,
          subtypes: ["code_gate"],
          strength: 2,
        }),
      ]),
    ];
    setAmbushIntent(input);

    expect(
      buildCorpAmbushPlanSignals({
        input,
        candidates: [
          ambushInstallCandidate(
            install.actionId,
            counterBank.instanceId,
            counterBank.definitionId!,
            "remote_1",
          ),
        ],
        previous: undefined,
      }),
    ).toContainEqual(
      expect.objectContaining({
        patternKind: "score_decoy",
        sourceInstanceId: counterBank.instanceId,
        followupAgendaInstanceId: agenda.instanceId,
        serverId: "remote_1",
        actionIds: [install.actionId],
        plannedAdvancementTarget: 1,
      }),
    );
  });

  it("retires a score decoy after rez instead of re-advancing a liquidated counter bank", () => {
    const source = visibleCard("synthetic-counter-bank-1", "corp", "asset", {
      definitionId: "synthetic_counter_bank",
      advancementCounters: 0,
      rezzed: true,
    });
    const input = aiInput("corp", []);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [source]),
    ];
    const previous = {
      instances: [
        {
          instanceId: "plan:corp.ambush_and_bluff:score-decoy",
          moduleId: "corp.ambush_and_bluff",
          moduleState: {
            kind: "ambush",
            signal: {
              commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
              ambushId:
                "score-decoy:synthetic-counter-bank-1:remote_1:agenda-1",
              sourceDefinitionId: "synthetic_counter_bank",
              sourceInstanceId: source.instanceId,
              actionIds: [],
              serverId: "remote_1",
              phase: "advance",
              patternKind: "score_decoy",
              followupAgendaInstanceId: "agenda-1",
              purposeCode: "test_score_decoy",
              assignedDomainPlanIds: ["corp.ambush_bluff"],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              plannedAtStateVersion: input.playerView.stateVersion,
              plannedAdvancementTarget: 1,
              value: 300,
              evidenceCode: "test_score_decoy",
            },
          },
        },
      ],
    } as unknown as ResidentPlanPortfolio;

    expect(
      buildCorpAmbushPlanSignals({ input, candidates: [], previous }),
    ).toEqual([]);

    source.rezzed = false;
    expect(
      buildCorpAmbushPlanSignals({ input, candidates: [], previous }),
    ).toContainEqual(
      expect.objectContaining({
        sourceInstanceId: source.instanceId,
        phase: "advance",
        patternKind: "score_decoy",
      }),
    );
  });

  it("retires an installed ambush commitment when the exact score plan owns the agenda", () => {
    const source = visibleCard("installed-agenda-1", "corp", "agenda", {
      definitionId: "synthetic_access_ambush_agenda",
      advancementCounters: 0,
      advancementRequirement: 3,
      agendaPoints: 2,
    });
    const input = aiInput("corp", []);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [source]),
    ];
    const advanceCandidate = {
      ...ambushInstallCandidate(
        "advance-installed-agenda-1",
        source.instanceId,
        source.definitionId!,
        "remote_1",
      ),
      actionType: "advance_card",
      semanticActionType: "score.advance_card",
      legalActionRef: {
        actionId: "advance-installed-agenda-1",
        actionType: "advance_card",
        originalPayloadKeys: ["cardId"],
      },
    } as ActionSemanticCandidate;
    const previous = {
      instances: [
        {
          instanceId: "plan:corp.ambush_and_bluff:installed-agenda-1",
          moduleId: "corp.ambush_and_bluff",
          viability: "ready",
          moduleState: {
            kind: "ambush",
            signal: {
              commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
              ambushId: "ambush:installed-agenda-1:remote_1",
              sourceDefinitionId: source.definitionId,
              sourceInstanceId: source.instanceId,
              actionIds: [],
              serverId: "remote_1",
              phase: "trigger",
              patternKind: "access_ambush",
              purposeCode: "test_installed_access_ambush",
              assignedDomainPlanIds: ["corp.ambush_bluff"],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              plannedAtStateVersion: input.playerView.stateVersion,
              plannedAdvancementTarget: 0,
              value: 300,
              evidenceCode: "test_installed_access_ambush",
            },
          },
        },
        {
          instanceId: "plan:corp.score_agenda:installed-agenda-1:remote_1",
          moduleId: "corp.score_agenda",
          viability: "ready",
          moduleState: {
            kind: "score",
            signal: {
              agendaInstanceId: source.instanceId,
              serverId: "remote_1",
            },
          },
        },
      ],
    } as unknown as ResidentPlanPortfolio;

    const signals = buildCorpAmbushPlanSignals({
      input,
      candidates: [advanceCandidate],
      previous,
    });

    expect(signals).toEqual([]);
    expect(
      corpAmbushAdvanceDispositionEvidence(advanceCandidate, signals),
    ).toBeUndefined();
    expect(advanceCandidate.actionId).toBe("advance-installed-agenda-1");
    expect(previous.instances[1]).toMatchObject({
      instanceId: "plan:corp.score_agenda:installed-agenda-1:remote_1",
      moduleId: "corp.score_agenda",
      viability: "ready",
    });
  });

  it("reconciles a new-remote Vacant Soulkiller install into its exact advance route", () => {
    const source = visibleCard(
      "corp_onr_v1_346_vacant-soulkiller_1",
      "corp",
      "asset",
      {
        definitionId: "onr_v1_346_vacant-soulkiller",
        title: "Vacant Soulkiller",
        advancementCounters: 0,
      },
    );
    const advance = legalAction(
      `corp.advance_card.${source.instanceId}.${source.instanceId}`,
      "corp",
      "advance_card",
      "Advance Vacant Soulkiller",
      { credits: 1, clicks: 1 },
      {
        source: source.instanceId,
        payload: { cardId: source.instanceId },
      },
    );
    const input = aiInput("corp", [advance]);
    input.playerView.own.credits = 10;
    input.playerView.own.clicks = 2;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_3", [], [source]),
    ];
    const candidates = buildActionSemanticCandidates({
      legalActions: input.legalActions,
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [source.instanceId]: source.definitionId!,
      },
    });
    const previous = {
      instances: [
        {
          instanceId: `plan:corp.ambush_and_bluff:ambush%3A${source.instanceId}`,
          moduleId: "corp.ambush_and_bluff",
          viability: "ready",
          moduleState: {
            kind: "ambush",
            signal: {
              commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
              ambushId: `ambush:${source.instanceId}`,
              sourceDefinitionId: source.definitionId,
              sourceInstanceId: source.instanceId,
              actionIds: [
                `corp.install_card.${source.instanceId}.new_remote.${source.instanceId}`,
              ],
              serverId: "new_remote",
              phase: "install",
              purposeCode: `establish_ambush:${source.definitionId}:new_remote`,
              assignedDomainPlanIds: ["corp.ambush_bluff"],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              plannedAtStateVersion: input.playerView.stateVersion - 1,
              plannedAdvancementTarget: 2,
              value: 180,
              evidenceCode: `corp_ambush_preplanned_exact_install:${source.definitionId}:new_remote`,
            },
          },
        },
      ],
    } as unknown as ResidentPlanPortfolio;

    expect(buildCorpAmbushPlanSignals({ input, candidates, previous })).toEqual(
      [
        expect.objectContaining({
          sourceInstanceId: source.instanceId,
          serverId: "remote_3",
          phase: "advance",
          actionIds: [advance.actionId],
          plannedAdvancementTarget: 2,
        }),
      ],
    );
  });
});

describe("Corp compromised Ambush disposition", () => {
  it("recycles an exactly exposed weak TRAP through the exact legal route", () => {
    const fixture = installedTrapFixture({ exposed: true, corpCredits: 3 });
    const [signal] = buildCorpAmbushPlanSignals(fixture);
    expect(signal).toMatchObject({
      sourceInstanceId: "trap-installed",
      runnerKnowledgeState: "known_exact",
      bluffCompromised: true,
      phase: "recycle",
      actionIds: ["recycle-trap"],
      compromisedDisposition: "recycle_to_hq",
      recycleRoute: {
        actionId: "recycle-trap",
        recyclerSourceInstanceId: "recycler-installed",
        recyclerSourceDefinitionId: "onr_v1_316_cowboy-sysop",
        targetCardInstanceId: "trap-installed",
      },
    });
    expect(signal?.decisionEvidenceCodes).toEqual(
      expect.arrayContaining([
        "runner_knows_installed_corp_card_exact",
        "corp_ambush_bluff_compromised",
        "corp_ambush_recycle_route_available",
        "corp_ambush_recycle_selected",
      ]),
    );
  });

  it("does not recycle merely because a recycler is available", () => {
    const fixture = installedTrapFixture({ exposed: false, corpCredits: 3 });
    const [signal] = buildCorpAmbushPlanSignals(fixture);
    expect(signal).toMatchObject({
      runnerKnowledgeState: "unknown",
      bluffCompromised: false,
      phase: "trigger",
      actionIds: [],
    });
  });

  it("holds a payable material exposed TRAP as a known threat", () => {
    const fixture = installedTrapFixture({ exposed: true, corpCredits: 4 });
    fixture.input.playerView.opponent.handCount = 3;
    const [signal] = buildCorpAmbushPlanSignals(fixture);
    expect(signal).toMatchObject({
      bluffCompromised: true,
      phase: "trigger",
      actionIds: [],
      compromisedDisposition: "hold_known_threat",
      accessThreatProjection: {
        status: "complete",
        corpCanPayActivation: true,
        damage: { type: "net", amount: 3 },
      },
    });
    expect(signal?.decisionEvidenceCodes).toContain(
      "corp_ambush_hold_selected_for_material_known_threat",
    );
  });

  it("keeps an exact current trigger ahead of recycling", () => {
    const fixture = installedTrapFixture({
      exposed: true,
      corpCredits: 3,
      triggerAction: true,
    });
    const [signal] = buildCorpAmbushPlanSignals(fixture);
    expect(signal).toMatchObject({
      phase: "trigger",
      actionIds: ["trigger-trap"],
      compromisedDisposition: "trigger_on_access",
    });
  });

  it("rezzes a prepared zero-cost ambush at the exact root access window", () => {
    const fixture = installedTrapFixture({
      exposed: false,
      corpCredits: 3,
      zeroCostAccessRez: true,
    });
    const [signal] = buildCorpAmbushPlanSignals(fixture);
    expect(signal).toMatchObject({
      sourceDefinitionId: "onr_v1_348_virus-test-site",
      phase: "trigger",
      actionIds: ["rez-prepared-trap"],
    });
  });

  it("is deterministic across different hidden Runner hand identities", () => {
    const left = installedTrapFixture({ exposed: true, corpCredits: 3 });
    const right = installedTrapFixture({ exposed: true, corpCredits: 3 });
    type InputWithTestOnlyHiddenRunnerHand = AiDecisionInput & {
      testOnlyHiddenRunnerHandDefinitionIds: string[];
    };
    (
      left.input as InputWithTestOnlyHiddenRunnerHand
    ).testOnlyHiddenRunnerHandDefinitionIds = ["hidden_runner_card_a"];
    (
      right.input as InputWithTestOnlyHiddenRunnerHand
    ).testOnlyHiddenRunnerHandDefinitionIds = ["hidden_runner_card_b"];

    const leftBelief = reconstructBeliefState(left.input);
    const rightBelief = reconstructBeliefState(right.input);
    const leftSignals = buildCorpAmbushPlanSignals(left);
    const rightSignals = buildCorpAmbushPlanSignals(right);

    expect(beliefStateInvariantSignature(leftBelief)).toBe(
      beliefStateInvariantSignature(rightBelief),
    );
    expect(leftBelief.corpOpponentModel?.runnerKnownCorpCardMemory).toEqual(
      rightBelief.corpOpponentModel?.runnerKnownCorpCardMemory,
    );
    expect(leftSignals).toEqual(rightSignals);
    expect(leftSignals[0]?.actionIds).toEqual(["recycle-trap"]);
  });
});

describe("Corp Ambush advancement support ownership", () => {
  it("keeps an exact support install inside the resident Ambush plan", () => {
    const trap = visibleCard("trap-installed", "corp", "asset", {
      definitionId: "onr_v1_346_vacant-soulkiller",
      title: "Vacant Soulkiller",
      advancementCounters: 0,
    });
    const support = visibleCard("lesley-in-hq", "corp", "upgrade", {
      definitionId: "onr_proteus_062_lesley-major",
      title: "Lesley Major",
    });
    const install = legalAction(
      "install-lesley-remote-1",
      "corp",
      "install_card",
      "Install Lesley Major in Remote 1",
      { credits: 0, clicks: 1 },
      {
        source: support.instanceId,
        payload: {
          cardId: support.instanceId,
          serverId: "remote_1",
          placement: "root",
        },
      },
    );
    const advance = legalAction(
      "advance-vacant-soulkiller",
      "corp",
      "advance_card",
      "Advance Vacant Soulkiller",
      { credits: 1, clicks: 1 },
      {
        source: trap.instanceId,
        payload: { cardId: trap.instanceId },
      },
    );
    const input = aiInput("corp", [install, advance]);
    input.playerView.own.credits = 6;
    input.playerView.own.gripOrHq = [support];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [trap]),
    ];
    setAmbushIntent(input);

    const advanceCandidate = buildActionSemanticCandidates({
      legalActions: [advance],
      observerSide: "corp",
      stateVersion: input.playerView.stateVersion,
      visibleSourceDefinitionsByInstanceId: {
        [trap.instanceId]: trap.definitionId!,
      },
    })[0]!;
    const [signal] = buildCorpAmbushPlanSignals({
      input,
      candidates: [
        ambushInstallCandidate(
          install.actionId,
          support.instanceId,
          support.definitionId!,
          "remote_1",
        ),
        advanceCandidate,
      ],
      previous: ambushSupportPrevious(input, trap),
    });

    expect(signal).toMatchObject({
      sourceInstanceId: trap.instanceId,
      phase: "install_support",
      actionIds: [install.actionId],
      plannedAdvancementTarget: 2,
      advancementSupportRoute: {
        phase: "install",
        actionId: install.actionId,
        supportSourceInstanceId: support.instanceId,
        supportSourceDefinitionId: support.definitionId,
        targetCardInstanceId: trap.instanceId,
        serverId: "remote_1",
      },
    });
    expect(
      corpAmbushAdvanceDispositionEvidence(advanceCandidate, [signal!]),
    ).toBe(
      `corp_ambush_advance_deferred_for_exact_support_route:${trap.instanceId}:install_support:${install.actionId}`,
    );
  });

  it("binds the exact support trigger and Ambush target without changing the resident root", () => {
    const trap = visibleCard("trap-installed", "corp", "asset", {
      definitionId: "onr_v1_346_vacant-soulkiller",
      title: "Vacant Soulkiller",
      advancementCounters: 0,
    });
    const support = visibleCard("lesley-installed", "corp", "upgrade", {
      definitionId: "onr_proteus_062_lesley-major",
      title: "Lesley Major",
      rezzed: true,
    });
    const trigger = legalAction(
      "trigger-lesley-on-trap",
      "corp",
      "trigger_ability",
      "Lesley Major: 2 Advancement-Counter auf Vacant Soulkiller",
      { credits: 5, clicks: 0 },
      {
        source: support.instanceId,
        payload: {
          cardId: support.instanceId,
          sourceDefinitionId: support.definitionId!,
          targetCardId: trap.instanceId,
          targetCardDefinitionId: trap.definitionId!,
          serverId: "remote_1",
          fortRunWindowAbility:
            "add_advancement_counters_after_passing_last_ice_on_this_fort",
        },
      },
    );
    const input = aiInput("corp", [trigger]);
    input.playerView.own.credits = 5;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [trap, support]),
    ];
    setAmbushIntent(input);
    const candidate = {
      ...ambushInstallCandidate(
        trigger.actionId,
        support.instanceId,
        support.definitionId!,
        "remote_1",
      ),
      actionType: "trigger_ability",
      semanticActionType: "card_ability.trigger",
      targetContext: {
        selectedTargets: [
          {
            targetId: trap.instanceId,
            targetKind: "card",
            source: "legal_action_payload",
          },
        ],
        availableTargets: [],
        targetProfileMatches: [],
      },
      costProfile: {
        clickCost: 0,
        creditCost: 5,
        paidBy: "corp",
        beneficiary: "corp",
        costKnownStatus: "known",
        additionalCosts: [],
      },
    } as unknown as ActionSemanticCandidate;

    const [signal] = buildCorpAmbushPlanSignals({
      input,
      candidates: [candidate],
      previous: ambushSupportPrevious(input, trap),
    });

    expect(signal).toMatchObject({
      ambushId: `ambush:${trap.instanceId}`,
      sourceInstanceId: trap.instanceId,
      phase: "trigger_support",
      actionIds: [trigger.actionId],
      advancementSupportRoute: {
        phase: "trigger",
        actionId: trigger.actionId,
        supportSourceInstanceId: support.instanceId,
        targetCardInstanceId: trap.instanceId,
      },
    });
  });
});

function ambushSupportPrevious(
  input: AiDecisionInput,
  trap: ReturnType<typeof visibleCard>,
): ResidentPlanPortfolio {
  return {
    instances: [
      {
        instanceId: `plan:corp.ambush_and_bluff:ambush%3A${trap.instanceId}`,
        moduleId: "corp.ambush_and_bluff",
        viability: "ready",
        moduleState: {
          kind: "ambush",
          signal: {
            commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
            ambushId: `ambush:${trap.instanceId}`,
            sourceDefinitionId: trap.definitionId,
            sourceInstanceId: trap.instanceId,
            actionIds: [],
            serverId: "remote_1",
            phase: "advance",
            assignedDomainPlanIds: ["corp.ambush_bluff"],
            duplicateAlreadyInstalled: false,
            affordableOrSupportable: true,
            plannedAtStateVersion: input.playerView.stateVersion,
            plannedAdvancementTarget: 2,
            value: 300,
            evidenceCode: "test_ambush_advancement_support",
          },
        },
      },
    ],
  } as unknown as ResidentPlanPortfolio;
}

function installedTrapFixture(options: {
  exposed: boolean;
  corpCredits: number;
  triggerAction?: boolean;
  zeroCostAccessRez?: boolean;
}): {
  input: AiDecisionInput;
  candidates: ActionSemanticCandidate[];
  previous: ResidentPlanPortfolio;
} {
  const trap = visibleCard("trap-installed", "corp", "asset", {
    definitionId: options.zeroCostAccessRez
      ? "onr_v1_348_virus-test-site"
      : "onr_v1_345_trap",
    title: options.zeroCostAccessRez ? "Virus Test Site" : "TRAP!",
    rezzed: false,
    advancementCounters: options.zeroCostAccessRez ? 3 : 0,
  });
  const recycler = visibleCard("recycler-installed", "corp", "asset", {
    definitionId: "onr_v1_316_cowboy-sysop",
    title: "Cowboy Sysop",
    rezzed: true,
  });
  const recycle = legalAction(
    "recycle-trap",
    "corp",
    "gain_credit",
    "Return installed card to HQ",
    { credits: 0, clicks: 1 },
    {
      source: recycler.instanceId,
      payload: {
        cardId: recycler.instanceId,
        v1951CorpUtilityAbility: "corp_installed_card_to_hq",
        targetCardId: trap.instanceId,
      },
    },
  );
  const accessRez = legalAction(
    "rez-prepared-trap",
    "corp",
    "rez_card",
    "Rez prepared ambush",
    { credits: 0, clicks: 0 },
    {
      source: trap.instanceId,
      payload: { cardId: trap.instanceId, serverId: "remote_1" },
    },
  );
  const legalActions = options.zeroCostAccessRez
    ? [recycle, accessRez]
    : [recycle];
  const input = aiInput("corp", legalActions);
  input.playerView.own.credits = options.corpCredits;
  input.playerView.opponent.handCount = 5;
  input.playerView.servers = [
    server("hq"),
    server("rd"),
    server("archives"),
    server("remote_1", [], [trap, recycler]),
  ];
  if (options.zeroCostAccessRez) {
    input.playerView.timingPoint = "run.movement_rez_window";
    input.playerView.run = {
      runId: "run-access-remote-1",
      attackedServerId: "remote_1",
      phase: "movement",
      position: { kind: "server", serverId: "remote_1" },
      successful: true,
    };
  }
  const exposeEvent: PublicGameEvent = {
    eventId: "evt-expose-trap",
    type: "resolve_choice",
    stateVersionBefore: 0,
    stateVersionAfter: 1,
    stateHashAfter: "hash-expose-trap",
    visibilityClass: "hidden_info_barrier",
    publicPayload: {
      actor: "runner",
      actionType: "resolve_choice",
      publicRevealKind: "expose",
      publicRevealDefinitionId: "onr_v1_345_trap",
      exposedCardDefinitionId: "onr_v1_345_trap",
      exposedServerId: "remote_1",
      exposedArea: "root",
      exposedIndex: 0,
      exposedPositionKey: "root:0",
    },
  };
  input.playerView.publicEvents = options.exposed ? [exposeEvent] : [];
  input.eventTail = options.exposed ? [exposeEvent] : [];
  const candidates = buildActionSemanticCandidates({
    legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [recycler.instanceId]: recycler.definitionId!,
      [trap.instanceId]: trap.definitionId!,
    },
  });
  if (options.triggerAction) {
    candidates.push({
      ...ambushInstallCandidate(
        "trigger-trap",
        trap.instanceId,
        trap.definitionId!,
        "remote_1",
      ),
      actionType: "trigger_ability",
      semanticActionType: "card_ability.trigger",
    });
  }
  return {
    input,
    candidates,
    previous: {
      instances: [
        {
          instanceId: "plan:corp.ambush_and_bluff:trap-installed",
          moduleId: "corp.ambush_and_bluff",
          viability: "ready",
          moduleState: {
            kind: "ambush",
            signal: {
              commitmentVersion: CORP_AMBUSH_COMMITMENT_VERSION,
              ambushId: "ambush:trap-installed",
              sourceDefinitionId: trap.definitionId,
              sourceInstanceId: trap.instanceId,
              actionIds: [],
              serverId: "remote_1",
              phase: "trigger",
              patternKind: "access_ambush",
              assignedDomainPlanIds: ["corp.ambush_bluff"],
              duplicateAlreadyInstalled: false,
              affordableOrSupportable: true,
              plannedAtStateVersion: input.playerView.stateVersion,
              plannedAdvancementTarget: 0,
              value: 0,
              evidenceCode: "test_installed_trap",
            },
          },
        },
      ],
    } as unknown as ResidentPlanPortfolio,
  };
}

function ambushInstallCandidate(
  actionId: string,
  sourceInstanceId: string,
  sourceDefinitionId: string,
  serverId: "remote_1",
): ActionSemanticCandidate {
  return {
    actionId,
    actionType: "install_card",
    actorSide: "corp",
    legalActionRef: {
      actionId,
      actionType: "install_card",
      originalPayloadKeys: ["cardId", "placement", "serverId"],
    },
    stateVersion: 1,
    sourceKind: "card",
    sourceCardInstanceId: sourceInstanceId,
    sourceDefinitionId,
    abilityBindingMethod: "unresolved",
    semanticActionType: "install.card",
    visibilityScope: "actor_private",
    cardContextSignals: [],
    actionTacticSignals: [],
    strategySupport: [],
    conditions: [],
    risks: [],
    constraints: [],
    costProfile: {
      clickCost: 1,
      creditCost: 0,
      paidBy: "corp",
      beneficiary: "corp",
      costKnownStatus: "known",
      additionalCosts: [],
    },
    timingProfile: {
      phase: "corp_action_phase",
      turnSide: "corp",
      window: "corp_action.main",
      responseWindow: true,
    },
    boardContext: {
      source: "ai_decision_input",
      sideSafe: true,
      stateVersion: 1,
      notes: [],
    },
    runProjectionSummary: {
      serverId,
      serverKind: "remote",
      source: "legal_action_payload",
      evidence: [],
    },
    confidence: "high",
    primaryProjectionStatus: "projected",
    projectionIssues: [],
    hardGates: [],
    evidence: [],
  };
}

function setAmbushIntent(input: AiDecisionInput): void {
  (input as AiDecisionInputWithDeckCapabilities).ownCorpStrategicIntent = {
    schemaVersion: "corp-strategic-intent-profile-v1",
    side: "corp",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: "corp.punish_runner",
    scorePlan: [],
    defensePlan: [],
    economyPlan: [],
    enginePlan: [],
    punishPlan: ["corp.ambush_bluff"],
    riskProfile: [],
    rejectedIntents: [],
    confidence: "high",
    evidence: ["test_corp_ambush_strategy_active"],
  } satisfies CorpStrategicIntentProfile;
}
