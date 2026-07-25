import { describe, expect, it, vi } from "vitest";
import type {
  AiDecisionInput,
  EngineRandomizedIceInstallSelectionQuoteResult,
  EngineRandomizedIceInstallSelectionRequest,
  LegalAction,
  VisibleCard,
} from "@netgrid/shared";
import { ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION } from "@netgrid/shared";

import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import {
  resetResidentPlanPortfolioMemory,
  residentPlanPortfolioSnapshot,
} from "../plans/resident-plan-portfolio-memory";
import {
  aiInput,
  attachOwnDeckSnapshot,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { createSemanticRuntimeDecisionContext } from "./semantic-runtime-decision-context";
import type { SemanticRuntimeDecisionContextDependencies } from "./semantic-runtime-decision-context";

const DATA_WALL_DEFINITION_ID = "onr_v1_237_data-wall";
const CORPORATE_WAR_DEFINITION_ID = "onr_v1_196_corporate-war";
const CORPORATE_DOWNSIZING_DEFINITION_ID = "onr_v1_194_corporate-downsizing";
const TYCHO_EXTENSION_DEFINITION_ID = "onr_v1_220_tycho-extension";
const FILLER_DEFINITION_ID = "onr_v1_284_chance-observation";

describe("plan-first live Corp central-defense allocation contract", () => {
  it("selects HQ from complete exact facts when HQ has the material agenda risk", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = centralDefenseInput({
      hqCards: [
        agenda("hq-corporate-war", CORPORATE_WAR_DEFINITION_ID),
        dataWall(),
      ],
      rdDefinitionIds: [FILLER_DEFINITION_ID],
      hqAccessCount: 1,
      rdAccessCount: 1,
    });

    expect(
      liveContext().chooseSemanticRuntimeAction(fixture.input, {}),
    ).toMatchObject({
      selectionKind: "direct",
      actionId: fixture.installHq.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("selects R&D from complete exact facts when R&D has multiaccess agenda density", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = centralDefenseInput({
      hqCards: [dataWall(), filler("hq-filler")],
      rdDefinitionIds: [
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        CORPORATE_DOWNSIZING_DEFINITION_ID,
        FILLER_DEFINITION_ID,
      ],
      hqAccessCount: 1,
      rdAccessCount: 2,
    });

    expect(
      liveContext().chooseSemanticRuntimeAction(fixture.input, {}),
    ).toMatchObject({
      selectionKind: "direct",
      actionId: fixture.installRd.actionId,
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
  });

  it("emits only an Engine randomized command for the canonical HQ/R&D near tie", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = fourPlusOneNearTieInput();
    const seenRequests: EngineRandomizedIceInstallSelectionRequest[] = [];
    const quote = vi.fn(
      (
        request: EngineRandomizedIceInstallSelectionRequest,
      ): EngineRandomizedIceInstallSelectionQuoteResult => {
        seenRequests.push(structuredClone(request));
        return successfulQuote(request, fixture.input.legalActions);
      },
    );

    const decision = liveContext().chooseSemanticRuntimeAction(fixture.input, {
      quoteRandomizedIceInstallSelection: quote,
    });

    expect(quote).toHaveBeenCalledTimes(1);
    expect(seenRequests).toEqual([
      expect.objectContaining({
        schemaVersion: ENGINE_RANDOMIZED_ICE_INSTALL_SELECTION_SCHEMA_VERSION,
        matchId: fixture.input.matchId,
        side: "corp",
        stateVersion: fixture.input.playerView.stateVersion,
        timingPoint: "corp_action.main",
        candidates: [
          {
            actionId: fixture.installHq.actionId,
            targetServerId: "hq",
          },
          {
            actionId: fixture.installRd.actionId,
            targetServerId: "rd",
          },
        ],
      }),
    ]);
    expect(decision).toMatchObject({
      selectionKind: "engine_randomized_ice_install_selection",
      engineCommand: {
        kind: "engine_randomized_ice_install_selection",
        quote: {
          candidates: [
            {
              actionId: fixture.installHq.actionId,
              targetServerId: "hq",
            },
            {
              actionId: fixture.installRd.actionId,
              targetServerId: "rd",
            },
          ],
        },
      },
      reasonCode: "plan_first.corp.defend_servers",
      fallbackUsed: false,
    });
    expect(decision).not.toHaveProperty("actionId");
    expect(decision).not.toHaveProperty("selectedChoices");
  });

  it.each([
    {
      name: "missing",
      options: {},
    },
    {
      name: "rejected",
      options: {
        quoteRandomizedIceInstallSelection: (
          _request: EngineRandomizedIceInstallSelectionRequest,
        ): EngineRandomizedIceInstallSelectionQuoteResult => ({
          ok: false,
          error: {
            code: "ERR_STALE_STATE",
            message: "test quote rejected",
          },
        }),
      },
    },
  ])(
    "fails closed when the Engine quote is $name instead of selecting the technical route head",
    ({ options }) => {
      resetResidentPlanPortfolioMemory();
      const fixture = fourPlusOneNearTieInput();

      expect(() =>
        liveContext().chooseSemanticRuntimeAction(fixture.input, options),
      ).toThrowError("invalid_support_graph");
    },
  );

  it("does not consume the one-use 4+1 HQ hold while a near tie still awaits Engine randomness", () => {
    resetResidentPlanPortfolioMemory();
    const fixture = fourPlusOneNearTieInput();

    liveContext().chooseSemanticRuntimeAction(fixture.input, {
      quoteRandomizedIceInstallSelection: (request) =>
        successfulQuote(request, fixture.input.legalActions),
    });

    const portfolio = residentPlanPortfolioSnapshot(fixture.input);
    const defense = portfolio?.instances.find(
      (instance) => instance.moduleId === "corp.defend_servers",
    );
    expect(defense).toBeDefined();
    expect(defense?.moduleState).toMatchObject({
      kind: "defense",
      centralAllocation: {
        status: "known",
        selectedServerId: "rd",
        canonicalNearTieCandidateServerIds: ["hq", "rd"],
        hqHold: {
          status: "eligible_once",
          receiptId: "corp-central-hq-hold:server-defense-portfolio",
        },
      },
      hqHoldCadence: {
        status: "available",
        receiptId: "corp-central-hq-hold:server-defense-portfolio",
      },
    });
    expect(defense?.moduleState).not.toHaveProperty("hqHoldSelection");
  });
});

function fourPlusOneNearTieInput() {
  return centralDefenseInput({
    hqCards: [
      agenda("hq-tycho", TYCHO_EXTENSION_DEFINITION_ID),
      dataWall(),
      filler("hq-filler-1"),
      filler("hq-filler-2"),
      filler("hq-filler-3"),
    ],
    rdDefinitionIds: [
      CORPORATE_DOWNSIZING_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
      FILLER_DEFINITION_ID,
    ],
    hqAccessCount: 1,
    rdAccessCount: 2,
  });
}

function centralDefenseInput(params: {
  hqCards: VisibleCard[];
  rdDefinitionIds: string[];
  hqAccessCount: number;
  rdAccessCount: number;
}) {
  const source = params.hqCards.find((card) => card.instanceId === "data-wall");
  if (!source) throw new Error("test fixture requires Data Wall in HQ");
  const installHq = iceInstall(source, "hq");
  const installRd = iceInstall(source, "rd");
  const endTurn = legalAction(
    "end-turn",
    "corp",
    "end_turn",
    "End turn",
    { credits: 0, clicks: 0 },
    { source: "game_rule" },
  );
  const actions = [installHq, installRd, endTurn];
  const input = aiInput("corp", actions);
  input.matchId = "central-defense-runtime-contract";
  input.decisionId = "central-defense-runtime-contract:1:corp";
  input.playerView.stateVersion = 1;
  input.playerView.turnSerial = 1;
  input.playerView.own.credits = 5;
  input.playerView.own.clicks = 3;
  input.playerView.own.gripOrHq = params.hqCards;
  input.playerView.own.stackOrRdCount = params.rdDefinitionIds.length;
  input.playerView.opponent.rig = [];
  input.playerView.servers = [server("hq"), server("rd"), server("archives")];
  input.playerView.corpCentralAccessQuotes = [
    centralAccessQuote("hq", params.hqAccessCount),
    centralAccessQuote("rd", params.rdAccessCount),
  ];
  for (const action of actions) action.expiresAtStateVersion = 1;
  input.legalActions = actions;
  input.playerView.legalActions = actions;
  attachOwnDeckSnapshot(input, {
    deckSnapshotId: "central-defense-runtime-contract-deck",
    side: "corp",
    cards: definitionCounts([
      ...params.hqCards.map((card) => card.definitionId!),
      ...params.rdDefinitionIds,
    ]),
  });
  return { input, installHq, installRd };
}

function iceInstall(source: VisibleCard, serverId: "hq" | "rd"): LegalAction {
  return legalAction(
    `install-data-wall-${serverId}`,
    "corp",
    "install_card",
    `Install Data Wall protecting ${serverId}`,
    { credits: 0, clicks: 1 },
    {
      source: source.instanceId,
      payload: {
        cardId: source.instanceId,
        sourceDefinitionId: DATA_WALL_DEFINITION_ID,
        placement: "ice",
        serverId,
        iceInstallBaseCost: 0,
        iceInstallAdditionalCost: 0,
        iceInstallReduction: 0,
        iceInstallTotalCost: 0,
        postInstallRezQuoteCardId: source.instanceId,
        postInstallRezQuoteTargetServerId: serverId,
        postInstallRezQuoteProjectedServerId: serverId,
        postInstallRezQuoteExpiresAtStateVersion: 1,
        postInstallRezQuoteComplete: true,
        postInstallRezQuoteBaseCredits: 1,
        postInstallRezQuoteFinalCredits: 1,
        postInstallRezQuoteMandatoryAgendaPointCost: 0,
      },
    },
  );
}

function centralAccessQuote(serverId: "hq" | "rd", accessCount: number) {
  return {
    serverId,
    stateVersion: 1,
    complete: true as const,
    effectiveAccessCount: accessCount,
    isMultiaccess: accessCount > 1,
    sourceDefinitionIds: [],
    serverBoundEffects: [],
  };
}

function agenda(instanceId: string, definitionId: string): VisibleCard {
  return visibleCard(instanceId, "corp", "agenda", { definitionId });
}

function dataWall(): VisibleCard {
  return visibleCard("data-wall", "corp", "ice", {
    definitionId: DATA_WALL_DEFINITION_ID,
    subtypes: ["wall"],
    strength: 0,
  });
}

function filler(instanceId: string): VisibleCard {
  return visibleCard(instanceId, "corp", "operation", {
    definitionId: FILLER_DEFINITION_ID,
  });
}

function definitionCounts(definitionIds: string[]) {
  const counts = new Map<string, number>();
  for (const definitionId of definitionIds) {
    counts.set(definitionId, (counts.get(definitionId) ?? 0) + 1);
  }
  return [...counts].map(([cardId, quantity]) => ({ cardId, quantity }));
}

function successfulQuote(
  request: EngineRandomizedIceInstallSelectionRequest,
  legalActions: LegalAction[],
): EngineRandomizedIceInstallSelectionQuoteResult {
  return {
    ok: true,
    quote: {
      ...request,
      visibility: "private_to_actor",
      complete: true,
      candidateFingerprint: "test:canonical-hq-rd-near-tie",
      legalActions: request.candidates.map((candidate) => {
        const action = legalActions.find(
          (legalAction) => legalAction.actionId === candidate.actionId,
        );
        if (!action) throw new Error("quoted candidate must remain legal");
        return action;
      }),
    },
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
  return createSemanticRuntimeDecisionContext(dependencies);
}
