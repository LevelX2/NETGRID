import type {
  CardDefinition,
  CardDefinitionId,
  CardInstance,
  CardInstanceId,
  CorpServer,
  GameState,
} from "@netgrid/shared";
import { describe, expect, it } from "vitest";
import {
  accessQueueEntries,
  buildBreachState,
  type BreachStateHost,
} from "./breach-state";

function definition(id: string, type: CardDefinition["type"]): CardDefinition {
  return { id: id as CardDefinitionId, title: id, type } as CardDefinition;
}

function instance(
  id: string,
  definitionId: string,
  zone: CardInstance["zone"],
  faceup = false,
  rezzed = false,
): CardInstance {
  return {
    id: id as CardInstanceId,
    definitionId: definitionId as CardDefinitionId,
    owner: "corp",
    controller: "corp",
    zone,
    faceup,
    rezzed,
  } as unknown as CardInstance;
}

function makeHost(): BreachStateHost {
  const definitions = {
    agenda: definition("agenda_def", "agenda"),
    asset: definition("asset_def", "asset"),
    upgrade: definition("upgrade_def", "upgrade"),
    operation: definition("operation_def", "operation"),
  };
  const servers = [
    { id: "rd", ice: [], root: [] },
    { id: "hq", ice: [], root: ["hq_upgrade"] },
    { id: "archives", ice: [], root: [] },
    { id: "remote_1", ice: [], root: ["remote_asset", "remote_upgrade"] },
  ] as unknown as CorpServer[];
  const cardInstances: Record<string, CardInstance> = {
    rd_top: instance("rd_top", "operation_def", { side: "corp", zone: "rd" }),
    rd_second: instance("rd_second", "agenda_def", { side: "corp", zone: "rd" }),
    hq_card_a: instance("hq_card_a", "operation_def", { side: "corp", zone: "hq" }),
    hq_card_b: instance("hq_card_b", "agenda_def", { side: "corp", zone: "hq" }),
    hq_upgrade: instance(
      "hq_upgrade",
      "upgrade_def",
      { side: "corp", zone: "serverRoot", serverId: "hq" } as CardInstance["zone"],
      true,
      true,
    ),
    archive_face_down: instance(
      "archive_face_down",
      "operation_def",
      { side: "corp", zone: "archives" },
    ),
    archive_face_up: instance(
      "archive_face_up",
      "agenda_def",
      { side: "corp", zone: "archives" },
      true,
    ),
    remote_asset: instance(
      "remote_asset",
      "asset_def",
      { side: "corp", zone: "serverRoot", serverId: "remote_1" } as CardInstance["zone"],
    ),
    remote_upgrade: instance(
      "remote_upgrade",
      "upgrade_def",
      { side: "corp", zone: "serverRoot", serverId: "remote_1" } as CardInstance["zone"],
      true,
      true,
    ),
  };
  const state = {
    runner: {
      rig: { programs: [], hardware: [], resources: [] },
    },
    corp: {
      rd: ["rd_top", "rd_second"],
      hq: ["hq_card_a", "hq_card_b"],
      archives: ["archive_face_down", "archive_face_up"],
      servers,
    },
    cardInstances,
    randomCounter: 0,
    randomDrawRecords: [],
  } as unknown as GameState;
  const randomValues = [0.75, 0.1];
  return {
    state,
    cards: {
      definitionFor: (cardId) => {
        const instance = cardInstances[cardId];
        if (!instance) throw new Error(`missing ${cardId}`);
        const found = Object.values(definitions).find(
          (candidate) => candidate.id === instance.definitionId,
        );
        if (!found) throw new Error(`missing definition ${instance.definitionId}`);
        return found;
      },
      cardInstanceFor: (cardId) => cardInstances[cardId]!,
    },
    servers: {
      mustServer: (serverId) => {
        const server = servers.find((candidate) => candidate.id === serverId);
        if (!server) throw new Error(`missing server ${serverId}`);
        return server;
      },
    },
    rng: {
      nextRandom: () => randomValues.shift() ?? 0,
    },
  };
}

describe("breach state builder", () => {
  it("builds R&D queue in current R&D order and marks hidden entries", () => {
    const host = makeHost();
    const breach = buildBreachState(host, {
      runId: "run_1",
      attackedServerId: "rd",
      accessCount: 2,
    } as NonNullable<GameState["run"]>);

    expect(breach).toMatchObject({
      breachId: "run_1.breach",
      serverId: "rd",
      accessMode: "multi",
      currentIndex: 0,
      completed: false,
    });
    expect(breach.queue.map((entry) => entry.cardInstanceId)).toEqual([
      "rd_top",
      "rd_second",
    ]);
    expect(breach.queue.map((entry) => entry.zone)).toEqual(["rd", "rd"]);
    expect(breach.queue.every((entry) => entry.hiddenInfo)).toBe(true);
  });

  it("uses deterministic HQ selection and appends HQ root upgrades", () => {
    const host = makeHost();
    const server = host.servers.mustServer("hq");
    const queue = accessQueueEntries(
      host,
      server,
      { runId: "run_hq", attackedServerId: "hq", accessCount: 1 } as NonNullable<GameState["run"]>,
      1,
    );

    expect(queue).toEqual([
      { cardInstanceId: "hq_card_b", zone: "hq" },
      { cardInstanceId: "hq_upgrade", zone: "remote_root" },
    ]);
  });

  it("builds full Archives and remote-root queues with stable zones", () => {
    const host = makeHost();

    const archives = buildBreachState(host, {
      runId: "run_archives",
      attackedServerId: "archives",
    } as NonNullable<GameState["run"]>);
    const remote = buildBreachState(host, {
      runId: "run_remote",
      attackedServerId: "remote_1",
    } as unknown as NonNullable<GameState["run"]>);

    expect(archives.queue.map((entry) => entry.cardInstanceId)).toEqual([
      "archive_face_down",
      "archive_face_up",
    ]);
    expect(archives.queue.map((entry) => entry.hiddenInfo)).toEqual([true, false]);
    expect(remote.queue.map((entry) => entry.zone)).toEqual([
      "remote_root",
      "remote_root",
    ]);
  });
});
