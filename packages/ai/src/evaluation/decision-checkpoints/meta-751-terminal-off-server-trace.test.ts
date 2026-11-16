import { expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
  getPlayerView,
} from "@netgrid/engine";
import {
  DEMO_DECKS,
  type AiDecisionInput,
  type DeckDefinition,
  type GameState,
  type LegalAction,
} from "@netgrid/shared";
import checkpoint from "../../../../../data/scenarios/ai-decision-checkpoints/cp-meta-751-g19-d134.json";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { buildAiDecisionInputDto } from "../../input-dto";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";
import { scoreRunnerAgendaForTest } from "../../../../engine/src/test-fixtures/mechanic-smoke-fixtures";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { buildActionSemanticCandidates } from "../../action-semantic-candidate";
import {
  allocateCorpCentralDefenseFromAiFacts,
  readCorpPublicOffServerAccessThreat,
} from "../../corp/defense/corp-central-defense-facts-adapter";
import { corpGlobalDefenseInstallRouteAssessment } from "../../corp/defense/corp-defense-domain-signals";
import { CORP_DEFENSE_DOMAIN_SIGNAL_FACTS } from "../../corp/defense/defense-discovery-support";
import {
  restoreAiRuntimeCheckpoint,
  type AiRuntimeCheckpointV1,
} from "./runtime-checkpoint";

const cinderella = "corp_onr_v1_228_cinderella_1";
const archivesInstall = `corp.install_card.${cinderella}.archives.${cinderella}.0`;

function inputForDecision(): AiDecisionInputWithDeckCapabilities {
  const source = structuredClone(
    checkpoint.input,
  ) as unknown as AiDecisionInputWithDeckCapabilities;
  return { ...source, ...buildAiDecisionInputDto(source) };
}

function archivesAssessment(input: AiDecisionInput) {
  const action = input.legalActions.find(
    (offer) => offer.actionId === archivesInstall,
  )!;
  const [candidate] = buildActionSemanticCandidates({
    legalActions: [action],
    observerSide: "corp",
    stateVersion: input.playerView.stateVersion,
    visibleSourceDefinitionsByInstanceId: {
      [cinderella]: "onr_v1_228_cinderella",
    },
  });
  return corpGlobalDefenseInstallRouteAssessment(
    input,
    candidate!,
    "archives",
    allocateCorpCentralDefenseFromAiFacts({ input }),
    CORP_DEFENSE_DOMAIN_SIGNAL_FACTS,
  );
}

it("protects the terminal HQ access at the publicly reachable Archives entrance in P751 G19 D134", () => {
  const input = inputForDecision();
  expect(checkpoint.stateHash).toBe("fnv1a:13b0d832");
  expect(Object.values(checkpoint.validation)).toEqual(Array(9).fill(true));
  expect(readCorpPublicOffServerAccessThreat(input, "archives")).toEqual({
    threat: "terminal",
    accessServerIds: ["hq"],
  });
  expect(archivesAssessment(input)).toMatchObject({
    knowledge: "known",
    disposition: "productive",
    progressKind: "engine_certified_access",
    rezFundingGap: 0,
    projection: {
      actionId: archivesInstall,
      certifiedZeroBidTraceStopId: "printed_subroutines_trace",
      installCredits: 0,
      installClicks: 1,
      creditsAfterDefense: 11,
      selectedRezCosts: [{ iceInstanceId: cinderella, credits: 8 }],
      before: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 1, denominator: 1 },
        },
      },
      after: {
        protection: {
          runnerAccessSuccessProbability: { numerator: 0, denominator: 1 },
        },
      },
    },
  });

  restoreAiRuntimeCheckpoint(
    input,
    input.ownDeckSnapshot!.deckSnapshotId,
    checkpoint.runtime as unknown as AiRuntimeCheckpointV1,
  );
  const choice = chooseAiAction(input);
  const decision = choice.decisionDebug?.planFirstDecision;
  expect(choice.fallbackUsed).toBe(false);
  expect(choice.timeoutUsed).toBe(false);
  expect(choice.actionId).toBe(archivesInstall);
  expect(decision?.selectedPlan?.moduleId).toBe("corp.defend_servers");
  expect(decision?.route).toMatchObject({
    actionId: archivesInstall,
    planInstanceId: decision?.selectedStep?.planInstanceId,
    stepId: decision?.selectedStep?.stepId,
    stateVersion: checkpoint.stateVersion,
  });
});

it("leaves the Archives candidate unproductive without the visible redirect", () => {
  const input = inputForDecision();
  input.playerView.opponent.rig = input.playerView.opponent.rig!.filter(
    (card) => card.definitionId !== "onr_v1_062_shredder-uplink-protocol",
  );
  expect(archivesAssessment(input)).toEqual({
    knowledge: "known",
    disposition: "effect_missing",
    evidenceCode: "corp_archives_ice_install_has_no_visible_agenda_pressure",
  });
});

it.each([
  "nonterminal",
  "can-tie-trace",
  "cannot-rez",
  "central-rez-reserve",
  "missing-preparation-quote",
  "route-prohibited",
] as const)("withholds the scoped trace defense when %s", (condition) => {
  const input = inputForDecision();
  const { playerView } = input;
  switch (condition) {
    case "nonterminal":
      playerView.opponent.agendaPoints = 0;
      break;
    case "can-tie-trace":
      // Three public preparation clicks plus three liquid credits tie Trace 6.
      playerView.opponent.credits = 3;
      break;
    case "cannot-rez":
      playerView.own.credits = 7;
      break;
    case "central-rez-reserve":
      playerView.own.credits = 8;
      break;
    case "missing-preparation-quote":
      delete playerView.runnerNextTurnCreditClicks;
      break;
    case "route-prohibited":
      playerView.servers.find((server) => server.id === "archives")!.statuses =
        [
          {
            id: "blocked-archives",
            kind: "run_prohibited",
            scope: "target_server",
            reason: "required_corp_activity_during_latest_corp_turn_missing",
            targetServerId: "archives",
            sourceCardInstanceId: "control-root",
            sourceAbilityId: "control-run-limitation",
            sourceTitle: "Control",
            sourceSide: "corp",
          },
        ];
      break;
  }
  expect(archivesAssessment(input)).toMatchObject({
    knowledge: "known",
    disposition: "effect_missing",
  });
});

it("rezzes the installed layer and stops a real Shredder run after three credit clicks", () => {
  const runnerDeck: DeckDefinition = {
    ...DEMO_DECKS.demo_runner_001,
    cards: [
      ...DEMO_DECKS.demo_runner_001.cards,
      { id: "onr_v1_062_shredder-uplink-protocol", quantity: 1 },
      { id: "onr_v1_039_krash", quantity: 1 },
    ],
  };
  const corpDeck: DeckDefinition = {
    ...DEMO_DECKS.demo_corp_001,
    cards: [
      ...DEMO_DECKS.demo_corp_001.cards,
      { id: "onr_v1_228_cinderella", quantity: 1 },
      { id: "onr_v1_196_corporate-war", quantity: 1 },
      { id: "onr_v1_220_tycho-extension", quantity: 1 },
      { id: "onr_v1_191_black-ice-quality-assurance", quantity: 1 },
    ],
  };
  let state = createGameAfterSetup({
    seed: "p751-off-server-trace-control",
    traceRulesProfile: "modern_open",
    runnerDeck,
    corpDeck,
  });
  const act = (
    select: (action: LegalAction) => boolean,
    selectedChoices?: Record<string, unknown>,
  ) => {
    const side = state.activeSide;
    const action = getLegalActions(state, side).find(select);
    if (!action) throw new Error("Missing action at " + state.timingPoint);
    const result = applyAction(state, {
      actionId: action.actionId,
      matchId: state.matchId,
      clientKnownStateVersion: state.stateVersion,
      side,
      ...(selectedChoices ? { selectedChoices } : {}),
    });
    if (!result.ok) throw new Error(result.error.message);
    state = result.state;
  };
  act((action) => action.type === "mandatory_draw");
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpCardInHq("onr_v1_228_cinderella")
    .withCorpCardInHq("onr_v1_196_corporate-war")
    .withCorpCredits(19)
    .withRunnerCredits(1)
    .withRunnerProgramInstalled("onr_v1_062_shredder-uplink-protocol")
    .withRunnerProgramInstalled("onr_v1_039_krash");
  state.corp.clicks = 1;
  scoreRunnerAgendaForTest(state, "onr_v1_220_tycho-extension");
  scoreRunnerAgendaForTest(state, "onr_v1_191_black-ice-quality-assurance");
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(6);
  act((a) => a.type === "install_card" && a.payload?.serverId === "archives");
  act((a) => a.type === "end_turn");
  for (let click = 0; click < 3; click++) act((a) => a.type === "gain_credit");
  act(
    (a) =>
      a.type === "activated_card_ability" && a.payload?.accessServerId === "hq",
  );
  expect(state.run?.attackedServerId).toBe("archives");
  expect(state.run?.accessServerOverride).toBe("hq");
  expect(
    getPlayerView(state, "corp").servers.find((s) => s.id === "archives")!
      .ice[0]!.currentTraceIceRezQuotes,
  ).toEqual([
    expect.objectContaining({
      rezCredits: 8,
      corpBid: 0,
      corpTraceStrength: 6,
      maximumRunnerTraceStrength: 4,
      runnerCanBreak: false,
      guaranteedRunEnd: true,
    }),
  ]);
  const chooseCorp = (s: GameState) =>
    chooseAiAction(
      buildAiDecisionInput(s, "corp", {
        difficulty: "hard",
        ownDeckSnapshot: {
          deckSnapshotId: corpDeck.id,
          side: "corp",
          cards: corpDeck.cards.map((card) => ({
            cardId: card.id,
            quantity: card.quantity,
          })),
        },
      }),
    );
  const rez = chooseCorp(state);
  expect(rez.decisionDebug?.planFirstDecision?.selectedPlan?.moduleId).toBe(
    "corp.defend_servers",
  );
  act((a) => a.type === "rez_ice" && a.actionId === rez.actionId);
  act((a) => a.type === "continue_run");
  const bid = chooseCorp(state);
  act((a) => a.actionId === bid.actionId, bid.selectedChoices);
  act((a) => a.type === "resolve_choice", {
    choiceId: getPlayerView(state, "runner").pendingChoice!.choiceId,
    selectedOptionIds: ["bid_4"],
  });
  expect(state.run).toBeUndefined();
  expect(getPlayerView(state, "runner").own.agendaPoints).toBe(6);
  expect(state.corp.credits).toBe(11);
});
