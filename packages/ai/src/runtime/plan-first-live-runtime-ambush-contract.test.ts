import type {
  AiDecisionInput,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import type { CorpStrategicIntentProfile } from "../corp-strategic-intent";
import { PlanResolutionFailure } from "../plans/plan-resolution-failure";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import type { AiDecisionInputWithDeckCapabilities } from "./ai-decision-input";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

describe("plan-first Corp ambush preplanning contract", () => {
  it("does not turn an Ambush card role into a plan without strategic intent support", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const install = installAmbush(trap, "new_remote", "install-trap");
    const gain = gainCredit();
    const end = endTurn();
    const input = corpInput([install, gain, end], [trap]);
    setCorpIntent(input, false);

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: gain.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("rejects the exact Ambush install when Corp intent is absent", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const install = installAmbush(trap, "new_remote", "install-trap");
    const gain = gainCredit();
    const end = endTurn();
    const input = corpInput([install, gain, end], [trap]);

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: gain.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });
  });

  it("rejects an Experimental AI install until it has a visible program payoff", () => {
    resetResidentPlanPortfolioMemory();
    const trap = experimentalAi();
    const install = installAmbush(
      trap,
      "new_remote",
      "install-experimental-ai",
    );
    const gain = gainCredit();
    const end = endTurn();
    const input = corpInput([install, gain, end], [trap]);
    setCorpIntent(input, true);

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: gain.actionId,
      reasonCode: "plan_first.corp.economy",
      fallbackUsed: false,
    });

    input.playerView.opponent.rig = [
      visibleCard("visible-runner-program", "runner", "program", {
        definitionId: "onr_v1_011_cloak",
        title: "Cloak",
      }),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
      fallbackUsed: false,
    });
  });

  it("lets an exact Ambush plan own an agenda install while its unsafe score parent stays blocked", () => {
    resetResidentPlanPortfolioMemory();
    const trap = fetalAi();
    const install = installAmbush(trap, "new_remote", "install-fetal-ai");
    const input = corpInput([install, gainCredit(), endTurn()], [trap]);
    input.playerView.own.credits = 5;
    setCorpIntent(input, true);

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: install.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_ambush_preplanned_exact_install:onr_proteus_004_fetal-ai:new_remote:assigned_domain_plan",
        "plan_first_executor:plan:corp.ambush_and_bluff:ambush%3Afetal-ai%3Asetup%3Anew_remote",
      ]),
    );

    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(portfolio?.rootForegroundInstanceId).toBe(
      "plan:corp.ambush_and_bluff:ambush%3Afetal-ai",
    );
    expect(
      portfolio?.instances.find(
        (instance) =>
          instance.instanceId ===
          "plan:corp.score_agenda:agenda%3Afetal-ai%3Anew_remote",
      ),
    ).toMatchObject({
      moduleId: "corp.score_agenda",
      viability: "blocked",
      blockers: [
        expect.objectContaining({
          code: "corp_score_route_unavailable",
        }),
      ],
      evidenceRefs: [
        expect.objectContaining({
          code: "corp_score_protection_required:new_remote",
        }),
      ],
    });
  });

  it("does not let a prepared sibling score parent reject an exact Ambush install", () => {
    resetResidentPlanPortfolioMemory();
    const trap = fetalAi();
    const installNew = installAmbush(
      trap,
      "new_remote",
      "install-fetal-ai-new",
    );
    const installPrepared = {
      ...installAmbush(trap, "remote_1", "install-fetal-ai-prepared"),
      payload: {
        cardId: trap.instanceId,
        serverId: "remote_1",
        placement: "root",
        rootReplacement: "asset_to_agenda",
      },
    } satisfies LegalAction;
    const input = corpInput(
      [installNew, installPrepared, gainCredit(), endTurn()],
      [trap],
    );
    input.playerView.own.credits = 1;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [],
        [
          visibleCard("existing-remote-asset", "corp", "asset", {
            definitionId: "onr_v1_309_bbs-whispering-campaign",
            title: "BBS Whispering Campaign",
          }),
        ],
      ),
    ];
    setCorpIntent(input, true);

    const decision = liveContext().chooseSemanticRuntimeAction(input, {});

    expect(decision).toMatchObject({
      actionId: installNew.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
      fallbackUsed: false,
    });
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "plan_assessment_evidence:corp_ambush_preplanned_exact_install:onr_proteus_004_fetal-ai:new_remote:assigned_domain_plan",
        "plan_first_executor:plan:corp.ambush_and_bluff:ambush%3Afetal-ai%3Asetup%3Anew_remote",
      ]),
    );

    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(portfolio?.rootForegroundInstanceId).toBe(
      "plan:corp.ambush_and_bluff:ambush%3Afetal-ai",
    );
    expect(
      portfolio?.instances.some(
        (instance) =>
          instance.instanceId ===
          "plan:corp.score_agenda:agenda%3Afetal-ai%3Aremote_1",
      ),
    ).toBe(true);
  });

  it("chooses one exact preplanned server without inventing an install credit cost and retains the exact Ambush sequence", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const installProtected = installAmbush(
      trap,
      "remote_1",
      "install-trap-protected",
    );
    const installNew = installAmbush(trap, "new_remote", "install-trap-new");
    const gain = gainCredit();
    const input = corpInput([installNew, installProtected, gain], [trap]);
    setCorpIntent(input, true);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-ice", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            title: "Data Wall",
            rezzed: true,
          }),
        ],
        [],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installProtected.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
      fallbackUsed: false,
    });

    const installedTrap = {
      ...trap,
      advancementCounters: 0,
    };
    input.playerView.stateVersion = 2;
    input.actionNumber = 2;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-ice", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            title: "Data Wall",
            rezzed: true,
          }),
        ],
        [installedTrap],
      ),
    ];
    const advance = advanceAmbush(installedTrap);
    input.legalActions = [advance, gain].map((action) => ({
      ...action,
      expiresAtStateVersion: 3,
    }));
    input.playerView.legalActions = input.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: advance.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
      fallbackUsed: false,
    });
  });

  it("keeps TRAP! exclusively in the Ambush plan instead of also routing it through a generic punish campaign", () => {
    resetResidentPlanPortfolioMemory();
    const trap = visibleCard("trap", "corp", "asset", {
      definitionId: "onr_v1_345_trap",
      title: "TRAP!",
    });
    const installProtected = installAmbush(
      trap,
      "remote_1",
      "install-trap-protected",
    );
    const installNew = installAmbush(trap, "new_remote", "install-trap-new");
    const input = corpInput(
      [installNew, installProtected, gainCredit()],
      [trap],
    );
    setCorpIntent(input, true);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-ice", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            title: "Data Wall",
            rezzed: true,
          }),
        ],
        [],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installProtected.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
      fallbackUsed: false,
    });
  });

  it("explicitly rejects further advancement after the committed Ambush target has been reached", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const installProtected = installAmbush(
      trap,
      "remote_1",
      "install-trap-protected",
    );
    const gain = gainCredit();
    const input = corpInput([installProtected, gain], [trap]);
    setCorpIntent(input, true);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], []),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installProtected.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
    });

    const installedTrap = { ...trap, advancementCounters: 0 };
    const advance = advanceAmbush(installedTrap);
    input.playerView.stateVersion = 2;
    input.actionNumber = 2;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [installedTrap]),
    ];
    input.legalActions = [advance, gain].map((action) => ({
      ...action,
      expiresAtStateVersion: 3,
    }));
    input.playerView.legalActions = input.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: advance.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
    });

    const developedTrap = { ...installedTrap, advancementCounters: 1 };
    input.playerView.stateVersion = 3;
    input.actionNumber = 3;
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], [developedTrap]),
    ];
    const end = endTurn();
    input.legalActions = [advanceAmbush(developedTrap), gain, end].map(
      (action) => ({
        ...action,
        expiresAtStateVersion: 4,
      }),
    );
    input.playerView.legalActions = input.legalActions;

    expect(() =>
      liveContext().chooseSemanticRuntimeAction(input, {}),
    ).toThrowError(PlanResolutionFailure);
  });

  it("abandons the resident Ambush normally after access or trash moves its source to Archives", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const installProtected = installAmbush(
      trap,
      "remote_1",
      "install-trap-protected",
    );
    const gain = gainCredit();
    const input = corpInput([installProtected, gain], [trap]);
    setCorpIntent(input, true);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], []),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installProtected.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
    });

    input.playerView.stateVersion = 2;
    input.actionNumber = 2;
    input.playerView.own.gripOrHq = [];
    const scoringAgenda = visibleCard("scoring-agenda", "corp", "agenda", {
      definitionId: "onr_v1_189_artificial-security-directors",
      title: "Artificial Security Directors",
      advancementCounters: 1,
      advancementRequirement: 3,
      agendaPoints: 2,
    });
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives", [], [trap]),
      server("remote_1", [], []),
      server("remote_2", [], [scoringAgenda]),
    ];
    const end = endTurn();
    const advanceScore = {
      ...advanceAmbush(scoringAgenda),
      actionId: "advance-scoring-agenda",
      expiresAtStateVersion: 3,
    };
    input.legalActions = [
      advanceScore,
      { ...gain, expiresAtStateVersion: 3 },
      { ...end, expiresAtStateVersion: 3 },
    ];
    input.playerView.legalActions = input.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: advanceScore.actionId,
      reasonCode: "plan_first.corp.score_agenda",
      fallbackUsed: false,
    });
    const portfolio = residentPlanPortfolioSnapshot(input);
    expect(
      portfolio?.instances.some(
        (instance) => instance.moduleId === "corp.ambush_and_bluff",
      ),
    ).toBe(false);
    expect(portfolio?.transitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instanceId: "plan:corp.ambush_and_bluff:ambush%3Avacant-soulkiller",
          reason: "target_disappeared",
          detailCode: "proposal_missing_target_contract",
        }),
      ]),
    );
  });

  it("still fails hard when a resident Ambush appears in a different active remote", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const installProtected = installAmbush(
      trap,
      "remote_1",
      "install-trap-protected",
    );
    const gain = gainCredit();
    const input = corpInput([installProtected, gain], [trap]);
    setCorpIntent(input, true);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], []),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installProtected.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
    });

    input.playerView.stateVersion = 2;
    input.actionNumber = 2;
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], []),
      server("remote_2", [], [trap]),
    ];
    input.legalActions = [{ ...gain, expiresAtStateVersion: 3 }];
    input.playerView.legalActions = input.legalActions;

    try {
      liveContext().chooseSemanticRuntimeAction(input, {});
      expect.unreachable("Expected invalid active Ambush movement to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(PlanResolutionFailure);
      expect((error as PlanResolutionFailure).context).toMatchObject({
        owner: "plan_module",
        removalCondition:
          "Resident ambush vacant-soulkiller moved away from its committed server remote_1.",
      });
    }
  });

  it("resolves a sole mandatory draw before revalidating a stale resident Ambush plan", () => {
    resetResidentPlanPortfolioMemory();
    const trap = vacantSoulkiller();
    const installProtected = installAmbush(
      trap,
      "remote_1",
      "install-trap-protected",
    );
    const input = corpInput([installProtected, gainCredit()], [trap]);
    setCorpIntent(input, true);
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server(
        "remote_1",
        [
          visibleCard("remote-ice", "corp", "ice", {
            definitionId: "onr_v1_237_data-wall",
            title: "Data Wall",
            rezzed: true,
          }),
        ],
        [],
      ),
    ];

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: installProtected.actionId,
      reasonCode: "plan_first.corp.ambush_and_bluff",
    });

    const mandatoryDraw = legalAction(
      "corp.mandatory_draw",
      "corp",
      "mandatory_draw",
      "Pflichtkarte ziehen",
      { credits: 0, clicks: 0 },
      { source: "game_rule" },
    );
    input.playerView.stateVersion = 2;
    input.playerView.timingPoint = "corp_draw.mandatory_draw";
    input.playerView.own.gripOrHq = [];
    input.playerView.servers = [
      server("hq"),
      server("rd"),
      server("archives"),
      server("remote_1", [], []),
    ];
    input.legalActions = [
      {
        ...mandatoryDraw,
        timingPoint: "corp_draw.mandatory_draw",
        expiresAtStateVersion: 3,
      },
    ];
    input.playerView.legalActions = input.legalActions;

    expect(liveContext().chooseSemanticRuntimeAction(input, {})).toMatchObject({
      actionId: mandatoryDraw.actionId,
      reasonCode: "plan_first.engine_window",
      fallbackUsed: false,
    });
  });
});

function vacantSoulkiller(): VisibleCard {
  return visibleCard("vacant-soulkiller", "corp", "asset", {
    definitionId: "onr_v1_346_vacant-soulkiller",
    title: "Vacant Soulkiller",
  });
}

function experimentalAi(): VisibleCard {
  return visibleCard("experimental-ai", "corp", "asset", {
    definitionId: "onr_v1_323_experimental-ai",
    title: "Experimental AI",
  });
}

function fetalAi(): VisibleCard {
  return visibleCard("fetal-ai", "corp", "agenda", {
    definitionId: "onr_proteus_004_fetal-ai",
    title: "Fetal AI",
    advancementCounters: 0,
    advancementRequirement: 5,
    agendaPoints: 3,
  });
}

function installAmbush(
  card: VisibleCard,
  serverId: "new_remote" | "remote_1",
  actionId: string,
): LegalAction {
  return legalAction(
    actionId,
    "corp",
    "install_card",
    `Install ${card.title} in ${serverId}`,
    { credits: 0, clicks: 1 },
    {
      source: card.instanceId,
      payload: {
        cardId: card.instanceId,
        serverId,
        placement: "root",
      },
    },
  );
}

function advanceAmbush(card: VisibleCard): LegalAction {
  return legalAction(
    "advance-trap",
    "corp",
    "advance_card",
    `Advance ${card.title}`,
    { credits: 1, clicks: 1 },
    {
      source: card.instanceId,
      payload: { cardId: card.instanceId },
    },
  );
}

function gainCredit(): LegalAction {
  return legalAction("gain-credit", "corp", "gain_credit", "Gain 1 Credit", {
    credits: 0,
    clicks: 1,
  });
}

function endTurn(): LegalAction {
  return legalAction(
    "end-turn",
    "corp",
    "end_turn",
    "End turn",
    { credits: 0 },
    { source: "game_rule" },
  );
}

function corpInput(
  actions: LegalAction[],
  grip: VisibleCard[],
): AiDecisionInput {
  const input = aiInput("corp", actions);
  input.playerView.own.gripOrHq = grip;
  input.playerView.own.credits = 8;
  input.playerView.own.clicks = 3;
  input.playerView.legalActions = actions;
  input.legalActions = actions;
  return input;
}

function setCorpIntent(input: AiDecisionInput, ambush: boolean): void {
  (input as AiDecisionInputWithDeckCapabilities).ownCorpStrategicIntent =
    corpIntent(ambush);
}

function corpIntent(ambush: boolean): CorpStrategicIntentProfile {
  return {
    schemaVersion: "corp-strategic-intent-profile-v1",
    side: "corp",
    source: {
      deckStrategyProfile: "ai_internal_strategy_profile",
      deckCapabilities: "ai_internal",
      strategicIntentState: "strategic_intent_state_v1",
      plannerEffect: "runtime_projection",
    },
    primaryWinIntent: ambush ? "corp.punish_runner" : "corp.score_agendas",
    scorePlan: ambush ? [] : ["corp.remote_scoreline"],
    defensePlan: [],
    economyPlan: [],
    enginePlan: [],
    punishPlan: ambush ? ["corp.ambush_bluff"] : [],
    riskProfile: [],
    rejectedIntents: ambush ? [] : ["corp.ambush_bluff_blocked"],
    confidence: "high",
    evidence: [
      ambush
        ? "test_corp_ambush_strategy_active"
        : "test_corp_ambush_strategy_blocked",
    ],
  };
}

function liveContext() {
  const dependencies = {
    buildActionSemanticCandidates,
    deckCapabilitiesForInput: () => ({}),
    runnerStrategicIntentForInput: () => ({
      primaryWinIntent: "runner.access_agendas",
    }),
    evaluateRunnerHandDevelopment: () => [],
    buildRunnerEconomyPosture: () => ({
      minimumCreditFloor: 3,
      desiredCreditReserve: 5,
      fundingNeed: true,
      evidence: ["test_visible_funding_need"],
    }),
    evaluateRunnerRunTargets: () => [],
    runnerEncounterActionExclusion: () => undefined,
    semanticRuntimeChoices: () => [],
    selectedChoicesForDecision: () => undefined,
    practicalMicroRuntimeCandidates: () => [],
  } as unknown as SemanticRuntimeDecisionContextDependencies;
  const context = createSemanticRuntimeDecisionContext(dependencies);
  return {
    chooseSemanticRuntimeAction: (
      input: Parameters<typeof context.chooseSemanticRuntimeAction>[0],
      options: Parameters<typeof context.chooseSemanticRuntimeAction>[1],
    ) =>
      context.chooseSemanticRuntimeAction(input, {
        corpTurnPlannerMode: "legacy_compare",
        ...options,
      }),
  };
}
