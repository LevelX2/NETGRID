import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
} from "@netgrid/shared";
import { DEMO_CARDS_BY_ID } from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import { buildLegalAction } from "../turn/action-builders";
import {
  buildRunnerAccessActions,
  type RunnerAccessActionHost,
} from "./access-actions";

function demoDefinition(type: CardDefinition["type"], trashCost?: number): CardDefinition {
  const found = Object.values(DEMO_CARDS_BY_ID).find(
    (candidate) => candidate.type === type,
  );
  if (!found) throw new Error(`missing demo ${type}`);
  return {
    ...found,
    ...(trashCost !== undefined ? { trashCost } : {}),
  } as CardDefinition;
}

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone,
    faceup: true,
    rezzed: true,
  } as unknown as CardInstance;
}

function makeHost(overrides: {
  accessedCardId?: string;
  cardType?: CardDefinition["type"];
  trashCost?: number;
  serverId?: string;
  breach?: NonNullable<GameState["run"]>["breach"];
  corpArchives?: string[];
  runnerCredits?: number;
} = {}): RunnerAccessActionHost {
  const serverId = overrides.serverId ?? "remote_1";
  const cardType = overrides.cardType ?? "asset";
  const definitions: Record<string, CardDefinition> = {
    agenda: demoDefinition("agenda"),
    asset: demoDefinition("asset", overrides.trashCost ?? 3),
    ice: demoDefinition("ice"),
  };
  const accessedCardId = overrides.accessedCardId as CardInstanceId | undefined;
  const cardId = accessedCardId ?? "asset";
  const accessedDefinition =
    cardType === "agenda"
      ? definitions.agenda!
      : cardType === "ice"
        ? definitions.ice!
        : definitions.asset!;
  const cardInstances: Record<string, CardInstance> = {
    [cardId]: instance(
      cardId,
      accessedDefinition.id,
      overrides.corpArchives?.includes(cardId)
        ? { side: "corp", zone: "archives" }
        : ({ side: "corp", zone: "serverRoot", serverId } as CardInstance["zone"]),
    ),
  };
  const servers: CorpServer[] = [
    { id: "remote_1", ice: [], root: [cardId] } as unknown as CorpServer,
    { id: "rd", ice: [], root: [] } as unknown as CorpServer,
    { id: "hq", ice: [], root: [] } as unknown as CorpServer,
    { id: "archives", ice: [], root: [] } as unknown as CorpServer,
  ];
  const state = {
    stateVersion: 12,
    timingPoint: "runner_action",
    runner: {
      credits: overrides.runnerCredits ?? 10,
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      hq: [],
      rd: [],
      archives: overrides.corpArchives ?? [],
      servers,
    },
    cardInstances,
    run:
      overrides.accessedCardId === undefined && !overrides.breach
        ? {
            runId: "run_1",
            attackedServerId: serverId,
          }
        : {
            runId: "run_1",
            attackedServerId: serverId,
            ...(accessedCardId ? { accessedCardId } : {}),
            ...(overrides.breach ? { breach: overrides.breach } : {}),
          },
  } as unknown as GameState;
  return {
    state,
    cards: {
      definitionFor: (lookupId) => {
        const instance = cardInstances[lookupId];
        if (!instance) throw new Error(`missing card ${lookupId}`);
        const found = Object.values(definitions).find(
          (candidate) => candidate.id === instance.definitionId,
        );
        if (!found) throw new Error(`missing definition ${instance.definitionId}`);
        return found;
      },
      cardInstanceFor: (lookupId) => cardInstances[lookupId]!,
      cardHasSubtype: () => false,
    },
    servers: {
      mustServer: (lookupId) => {
        const server = servers.find((candidate) => candidate.id === lookupId);
        if (!server) throw new Error(`missing server ${lookupId}`);
        return server;
      },
    },
    actions: {
      buildLegalAction: (side, type, label, source, costs, payload) =>
        buildLegalAction(state, side, type, label, source, costs, payload),
    },
    payment: {
      hostedPaymentCredits: () => 0,
      restrictedHostedCreditSourceIds: () => [],
      isRestrictedHostedCreditSource: () => false,
    },
    counters: {
      cardCounter: () => 0,
    },
    callbacks: {
      successfulRunProgramActions: () => [],
      runnerDuringRunCardImplementationActions: () => [],
      mysteryBoxRunActions: () => [],
    },
  };
}

describe("access action generation", () => {
  it("builds no actions without an active access context", () => {
    const host = makeHost();
    delete host.state.run;

    expect(buildRunnerAccessActions(host)).toEqual({
      handled: false,
      legalActions: [],
    });
  });

  it("builds access or finish actions before a card is accessed", () => {
    const accessHost = makeHost();
    const accessActions = buildRunnerAccessActions(accessHost).legalActions;

    const emptyHost = makeHost();
    emptyHost.state.corp.servers[0]!.root = [];
    const finishActions = buildRunnerAccessActions(emptyHost).legalActions;

    expect(accessActions.map((action) => action.type)).toEqual(["access_card"]);
    expect(accessActions[0]!.actionId).toBe("runner.access_card");
    expect(finishActions.map((action) => action.type)).toEqual(["continue_run"]);
    expect(finishActions[0]!.actionId).toBe("runner.continue_run");
  });

  it("builds stable steal actions only for accessed agendas", () => {
    const agendaHost = makeHost({
      accessedCardId: "agenda",
      cardType: "agenda",
    });
    const agendaActions = buildRunnerAccessActions(agendaHost).legalActions;
    const assetActions = buildRunnerAccessActions(
      makeHost({ accessedCardId: "asset", cardType: "asset" }),
    ).legalActions;

    expect(agendaActions).toHaveLength(1);
    expect(agendaActions[0]).toMatchObject({
      type: "steal_agenda",
      source: "agenda",
      actionId: "runner.steal_agenda.agenda",
    });
    expect(agendaActions[0]!.payload).toBeUndefined();
    expect(assetActions.some((action) => action.type === "steal_agenda")).toBe(false);
  });

  it("builds stable trash and decline actions for trashable accessed cards", () => {
    const host = makeHost({
      accessedCardId: "asset",
      cardType: "asset",
      trashCost: 3,
    });
    const before = JSON.stringify(host.state);

    const actions = buildRunnerAccessActions(host).legalActions;

    expect(actions.map((action) => action.type)).toEqual([
      "trash_accessed_card",
      "decline_trash",
    ]);
    expect(actions[0]).toMatchObject({
      actionId: "runner.trash_accessed_card.asset.3",
      source: "asset",
      costs: [{ credits: 3 }],
      payload: {
        accessTrashBaseCost: 3,
        accessTrashCostModifier: 0,
        accessTrashTotalCost: 3,
      },
    });
    expect(actions[1]).toMatchObject({
      actionId: "runner.decline_trash",
      label: "Nicht trashen",
    });
    expect(actions[1]!.payload).toBeUndefined();
    expect(JSON.stringify(host.state)).toBe(before);
  });

  it("does not build trash actions for Archives access", () => {
    const host = makeHost({
      accessedCardId: "asset",
      cardType: "asset",
      serverId: "archives",
      corpArchives: ["asset"],
    });

    const actions = buildRunnerAccessActions(host).legalActions;

    expect(actions.map((action) => action.type)).toEqual(["decline_trash"]);
    expect(actions[0]).toMatchObject({
      actionId: "runner.decline_trash",
      label: "Zugriff abschließen",
    });
  });

  it("keeps breach continue wording stable for multiaccess", () => {
    const host = makeHost({
      accessedCardId: "asset",
      cardType: "asset",
      corpArchives: ["asset"],
      breach: {
        breachId: "breach_1",
        serverId: "archives",
        accessMode: "multi",
        completed: false,
        accessedSummaries: [],
        currentIndex: 0,
        queue: [
          {
            entryId: "entry_1",
            serverId: "archives",
            cardInstanceId: "asset",
            status: "accessed",
            zone: "archives",
            hiddenInfo: false,
          },
        ],
      },
    });

    const actions = buildRunnerAccessActions(host).legalActions;

    expect(actions).toHaveLength(1);
    expect(actions[0]).toMatchObject({
      actionId: "runner.decline_trash",
      label: "Weiter accessen",
    });
  });
});
