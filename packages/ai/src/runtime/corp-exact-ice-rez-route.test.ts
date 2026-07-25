import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import type { CardInstanceId, GameState } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildActionSemanticCandidates } from "../action-semantic-candidate";
import { buildAiDecisionInputDto } from "../input-dto";
import {
  projectExactCorpIceRezRoute,
  readExactInstalledCorpIceRezQuote,
} from "./corp-exact-ice-rez-route";

describe("exact Corp ICE rez route", () => {
  it("accepts the Engine's ordinary rez_ice action without an optional server payload", () => {
    const { input, candidate, sourceCard, engineAction } = engineIceRezWindow(
      "simple_barrier_ice",
      0,
    );

    const projection = projectExactCorpIceRezRoute({
      input,
      candidate,
      sourceCard,
      targetServerId: "rd",
    });
    const sourceQuote = sourceCard.effectiveRezCostQuote;
    if (
      sourceQuote?.context !== "installed" ||
      sourceQuote.complete !== true
    ) {
      throw new Error("Engine-backed ICE rez fixture has no complete quote");
    }
    expect(input.legalActions[0]).toMatchObject({
      type: "rez_ice",
      payload: {
        cardId: sourceCard.instanceId,
      },
    });
    expect(engineAction.payload).toMatchObject(
      input.legalActions[0]?.payload ?? {},
    );
    expect(input.legalActions[0]?.payload?.serverId).toBeUndefined();
    expect(projection).toMatchObject({
      actionId: input.legalActions[0]?.actionId,
      sourceCardInstanceId: sourceCard.instanceId,
      sourceDefinitionId: "simple_barrier_ice",
      targetServerId: "rd",
      effect: "satisfied",
      totalRezCredits: sourceQuote.finalCredits,
      quote: {
        context: "installed",
        complete: true,
        mandatoryAdditionalCosts: { agendaPoints: 0 },
      },
    });
  });

  it("echoes the Engine-certified mandatory agenda-point cost and fails closed when it is not payable", () => {
    const payable = engineIceRezWindow("onr_classic_011_glacier", 1);
    expect(
      readExactInstalledCorpIceRezQuote({
        input: payable.input,
        candidate: payable.candidate,
        sourceCard: payable.sourceCard,
        targetServerId: "rd",
      })?.quote.mandatoryAdditionalCosts.agendaPoints,
    ).toBe(1);

    expect(() =>
      engineIceRezWindow("onr_classic_011_glacier", 0),
    ).toThrow(
      "Engine did not expose a payable ICE rez action",
    );
  });

  it.each([
    [
      "missing quote",
      (fixture: MutableExactRezFixture) => {
        delete fixture.sourceCard.effectiveRezCostQuote;
      },
    ],
    [
      "incomplete quote",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard as any).effectiveRezCostQuote = {
          context: "installed",
          cardId: fixture.sourceCard.instanceId,
          targetServerId: "rd",
          projectedServerId: "rd",
          expiresAtStateVersion: fixture.input.playerView.stateVersion,
          complete: false,
        };
      },
    ],
    [
      "stale quote",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .expiresAtStateVersion += 1;
      },
    ],
    [
      "card drift",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any).cardId =
          "different-ice";
      },
    ],
    [
      "server drift",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any).targetServerId =
          "hq";
      },
    ],
    [
      "action cost drift",
      (fixture: MutableExactRezFixture) => {
        fixture.input.legalActions[0]!.costs = [{ credits: 99 }];
      },
    ],
    [
      "duplicate modifier ids",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .reductionSourceDefinitionIds = ["same", "same"];
      },
    ],
    [
      "unsorted modifier ids",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .reductionSourceDefinitionIds = ["z", "a"];
      },
    ],
    [
      "overlapping modifier ids",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .reductionSourceDefinitionIds = ["same"];
        (fixture.sourceCard.effectiveRezCostQuote as any)
          .increaseSourceDefinitionIds = ["same"];
      },
    ],
    [
      "invalid base credits",
      (fixture: MutableExactRezFixture) => {
        (fixture.sourceCard.effectiveRezCostQuote as any).baseCredits = 0.5;
      },
    ],
    [
      "unexplained base/final drift",
      (fixture: MutableExactRezFixture) => {
        const quote = fixture.sourceCard.effectiveRezCostQuote;
        if (
          quote?.context !== "installed" ||
          quote.complete !== true
        ) {
          throw new Error("Fixture has no complete installed quote");
        }
        quote.finalCredits += 1;
        fixture.input.legalActions[0]!.costs = [
          {
            credits: quote.finalCredits,
          },
        ];
      },
    ],
  ])("fails closed on %s", (_label, mutate) => {
    const fixture = mutableFixture(
      engineIceRezWindow("simple_barrier_ice", 0),
    );
    mutate(fixture);

    expect(
      readExactInstalledCorpIceRezQuote({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
  });

  it("fails closed when mandatory agenda-point payload and quote drift", () => {
    const fixture = mutableFixture(
      engineIceRezWindow("onr_classic_011_glacier", 1),
    );
    fixture.input.legalActions[0]!.payload!.agendaPointCost = 0;

    expect(
      readExactInstalledCorpIceRezQuote({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
  });

  it("does not create a rez route without exact access-probability progress", () => {
    const fixture = engineIceRezWindow("onr_v1_249_hunter", 0);

    expect(
      projectExactCorpIceRezRoute({
        input: fixture.input,
        candidate: fixture.candidate,
        sourceCard: fixture.sourceCard,
        targetServerId: "rd",
      }),
    ).toBeUndefined();
  });
});

type MutableExactRezFixture = ReturnType<typeof mutableFixture>;

function mutableFixture(
  fixture: ReturnType<typeof engineIceRezWindow>,
) {
  const input = structuredClone(fixture.input);
  const candidate = structuredClone(fixture.candidate);
  const sourceCard = input.playerView.servers
    .find((server) => server.id === "rd")!
    .ice.find((ice) => ice.instanceId === fixture.sourceCard.instanceId)!;
  return { input, candidate, sourceCard };
}

function engineIceRezWindow(definitionId: string, agendaPoints: number) {
  let state = createGameAfterSetup({
    seed: `exact-ice-rez-${definitionId}-${agendaPoints}`,
  });
  state.activeSide = "runner";
  state.phase = "runner_action_phase";
  state.timingPoint = "runner_action.main";
  delete state.pendingChoice;
  state.runner.clicks = 4;
  state.runner.credits = 0;
  state.corp.credits = 10;
  state.corpBonusAgendaPoints = agendaPoints;
  const iceId =
    `exact_ice_${agendaPoints}` as CardInstanceId;
  addUnrezzedIce(state, iceId, definitionId, "rd");
  const startRun = getLegalActions(state, "runner").find(
    (action) =>
      action.type === "start_run" && action.payload?.serverId === "rd",
  );
  if (!startRun) throw new Error("Engine did not expose the R&D run");
  const result = applyAction(state, {
    matchId: state.matchId,
    side: "runner",
    actionId: startRun.actionId,
    clientKnownStateVersion: state.stateVersion,
    idempotencyKey: `start-${agendaPoints}`,
  });
  if (!result.ok) throw new Error(result.error.message);
  state = result.state;
  const rezAction = getLegalActions(state, "corp").find(
    (action) =>
      action.type === "rez_ice" && action.payload?.cardId === iceId,
  );
  if (!rezAction) {
    throw new Error("Engine did not expose a payable ICE rez action");
  }
  const playerView = getPlayerView(state, "corp");
  const input = buildAiDecisionInputDto({
    side: "corp",
    playerView,
    eventTail: [],
    legalActions: [rezAction],
    difficulty: "normal",
    seed: state.seed,
    decisionId: `exact-ice-rez-${definitionId}-${agendaPoints}`,
    actionNumber: 1,
    profileId: "exact-glacier-rez-test",
  });
  const candidate = buildActionSemanticCandidates({
    legalActions: input.legalActions,
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [iceId]: definitionId,
    },
  })[0];
  const sourceCard = input.playerView.servers
    .find((server) => server.id === "rd")
    ?.ice.find((ice) => ice.instanceId === iceId);
  if (!candidate || !sourceCard) {
    throw new Error("Engine-backed ICE rez fixture is incomplete");
  }
  return { input, candidate, sourceCard, engineAction: rezAction };
}

function addUnrezzedIce(
  state: GameState,
  instanceId: CardInstanceId,
  definitionId: string,
  serverId: "rd",
): void {
  const server = state.corp.servers.find(
    (candidate) => candidate.id === serverId,
  );
  if (!server) throw new Error("Missing R&D server");
  server.ice.push(instanceId);
  state.cardInstances[instanceId] = {
    instanceId,
    definitionId,
    owner: "corp",
    controller: "corp",
    zone: { side: "corp", zone: "serverIce", serverId },
    faceup: false,
    rezzed: false,
    advancementCounters: 0,
    strengthModifier: 0,
  };
}
