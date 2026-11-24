import { isRemoteServerId } from "@netgrid/shared";
import { afterEach, expect, it } from "vitest";
import {
  applyAction,
  createGameAfterSetup,
  getLegalActions,
} from "@netgrid/engine";
import type { DeckDefinition } from "@netgrid/shared";
import { chooseAiAction } from "../../ai-runtime-public-entrypoints";
import { corpFloodInstallCreatesCombinedTerminalExposure } from "../../corp/score/score-flood-exposure";
import { resetResidentPlanPortfolioMemory } from "../../plans/resident-plan-portfolio-memory";
import {
  buildAiDecisionInput,
  type AiDecisionInputWithDeckCapabilities,
} from "../../runtime/ai-decision-input";
import { RealEngineFixtureBuilder } from "../real-engine-fixture-builder";

const corporateWar = 408;
const fetalAi = 62;
const fireWall = 457;
const sphinx = 97;
const broker = 366;
const corpDeck: DeckDefinition = {
  id: "paid-flood-corp",
  name: "Paid flood exposure",
  side: "corp",
  identity: 3,
  cards: [
    { id: corporateWar, quantity: 3 },
    { id: fetalAi, quantity: 3 },
    { id: fireWall, quantity: 2 },
    { id: sphinx, quantity: 2 },
    { id: 596, quantity: 3 },
  ],
};
const runnerDeck: DeckDefinition = {
  id: "paid-flood-runner",
  name: "Funded access",
  side: "runner",
  identity: 587,
  cards: [
    { id: 228, quantity: 1 }, // Cyfermaster
    { id: 286, quantity: 1 }, // Worm
    { id: 278, quantity: 1 }, // Snowball
    { id: broker, quantity: 1 },
    { id: 594, quantity: 5 },
  ],
};

afterEach(resetResidentPlanPortfolioMemory);

function fixture(sourceDefinitionId = corporateWar) {
  const initial = createGameAfterSetup({
    seed: "paid-remote-flood",
    agendaPointsToWin: 7,
    corpDeck,
    runnerDeck,
  });
  const draw = getLegalActions(initial, "corp").find(
    (action) => action.type === "mandatory_draw",
  );
  if (!draw) throw new Error("Missing mandatory draw");
  const result = applyAction(initial, {
    matchId: initial.matchId,
    side: "corp",
    actionId: draw.actionId,
    clientKnownStateVersion: initial.stateVersion,
  });
  if (!result.ok) throw new Error(result.error.message);
  const state = result.state;
  RealEngineFixtureBuilder.forState(state)
    .withCorpHqSize(0)
    .withCorpRemoteRoot("r1", corporateWar)
    .withRezzedCorpIceOnServer("r1", fireWall)
    .withCorpIceOnServer("r1", sphinx)
    .withCorpCredits(11)
    .withRunnerCredits(11)
    .withRunnerProgramInstalled(228)
    .withRunnerProgramInstalled(286)
    .withRunnerProgramInstalled(278)
    .withRunnerResourceInstalled(broker, { bit: 6 })
    .withRunnerGripSize(3);
  state.corp.clicks = 2;

  const stolen = state.corp.rd.find(
    (id) => state.cardInstances[id]?.definitionId === fetalAi,
  )!;
  state.corp.rd = state.corp.rd.filter((id) => id !== stolen);
  state.runner.scoreArea.push(stolen);
  Object.assign(state.cardInstances[stolen]!, {
    controller: "runner",
    faceup: true,
    rezzed: true,
    zone: { side: "runner", zone: "scoreArea" },
  });
  for (const id of state.corp.rd.filter((id) => {
    const definitionId = state.cardInstances[id]?.definitionId;
    return definitionId === corporateWar || definitionId === fetalAi;
  })) {
    state.corp.rd = state.corp.rd.filter((candidate) => candidate !== id);
    state.corp.hq.push(id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "hq" };
  }
  for (const id of state.corp.rd.splice(3)) {
    state.corp.archives.push(id);
    state.cardInstances[id]!.zone = { side: "corp", zone: "archives" };
  }

  const input = buildAiDecisionInput(state, "corp", {
    difficulty: "hard",
    ownDeckSnapshot: {
      deckSnapshotId: corpDeck.id,
      side: "corp",
      cards: corpDeck.cards.map(({ id, quantity }) => ({
        cardId: id,
        quantity,
      })),
    },
  });
  const agenda = input.playerView.own.gripOrHq.find(
    (card) => card.definitionId === sourceDefinitionId,
  )!;
  const install = input.legalActions.find(
    (action) =>
      action.source === agenda.instanceId &&
      action.payload?.serverId === "new_remote",
  )!;
  return { input, agenda, install };
}

it("holds the new naked agenda when the best funded existing ICE still permits the first steal", () => {
  const { input } = fixture();
  const bareAgendaInstalls = input.legalActions.filter(
    (action) =>
      action.type === "install_card" &&
      action.payload?.serverId === "new_remote" &&
      input.playerView.own.gripOrHq.some(
        (card) => card.instanceId === action.source && card.type === "agenda",
      ),
  );
  expect(bareAgendaInstalls).toHaveLength(4);
  for (const install of bareAgendaInstalls) {
    const agenda = input.playerView.own.gripOrHq.find(
      (card) => card.instanceId === install.source,
    )!;
    expect(
      corpFloodInstallCreatesCombinedTerminalExposure(
        input,
        agenda,
        "new_remote",
        install.actionId,
      ),
    ).toBe(true);
  }
  const decision = chooseAiAction(input);
  expect(decision.fallbackUsed).toBe(false);
  expect(bareAgendaInstalls.map((action) => action.actionId)).not.toContain(
    decision.actionId,
  );
});

it.each([
  [
    "the visible bank has no credits for the extra steal cost",
    (input: AiDecisionInputWithDeckCapabilities) => {
      const bank = input.playerView.opponent.rig!.find(
        (card) => card.definitionId === broker,
      )!;
      expect(bank.counters?.bit).toBe(6);
      bank.counters = { ...bank.counters, bit: 0 };
    },
  ],
  [
    "the current hand cannot take the on-access damage",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.handCount = 1;
    },
  ],
] as const)(
  "keeps the Fetal AI exposure uncertain when %s",
  (_name, adjust) => {
    const { input, agenda, install } = fixture(fetalAi);
    adjust(input);
    expect(
      corpFloodInstallCreatesCombinedTerminalExposure(
        input,
        agenda,
        "new_remote",
        install.actionId,
      ),
    ).toBe(false);
  },
);

it("does not count a bare remote whose current run restriction blocks access", () => {
  const { input, agenda, install } = fixture();
  const existing = input.playerView.servers.find(
    (server) =>
      isRemoteServerId(server.id) &&
      server.root.length === 1 &&
      server.root[0]?.type === "agenda",
  )!;
  existing.ice = [];
  const hasExposure = () =>
    corpFloodInstallCreatesCombinedTerminalExposure(
      input,
      agenda,
      "new_remote",
      install.actionId,
    );
  expect(hasExposure()).toBe(true);
  existing.statuses = [
    {
      id: "run-restriction",
      kind: "run_prohibited",
      scope: "target_server",
      reason: "required_corp_activity_during_latest_corp_turn_missing",
      targetServerId: existing.id,
      sourceCardInstanceId: "run-restriction-source",
      sourceAbilityId: "public-restriction",
      sourceTitle: "Run restriction",
      sourceSide: "corp",
    },
  ];

  expect(hasExposure()).toBe(false);
});

it.each([
  [
    "two steals stay below the win target",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.agendaPoints = 0;
    },
  ],
  [
    "the existing remote really stops the runner",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.opponent.credits = 0;
    },
  ],
  [
    "one Runner run remains",
    (input: AiDecisionInputWithDeckCapabilities) => {
      input.playerView.runnerNextTurnCreditClicks = 0;
    },
  ],
] as const)("does not infer a paid terminal pair when %s", (_name, adjust) => {
  const { input, agenda, install } = fixture();
  adjust(input);
  expect(
    corpFloodInstallCreatesCombinedTerminalExposure(
      input,
      agenda,
      "new_remote",
      install.actionId,
    ),
  ).toBe(false);
});
