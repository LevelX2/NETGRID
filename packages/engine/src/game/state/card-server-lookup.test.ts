import {
  DEMO_CARDS_BY_ID,
  type CardDefinition,
  type CardDefinitionId,
  type CardInstance,
  type CardInstanceId,
  type CardType,
  type CorpServer,
  type GameState,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  cardInstanceFor,
  corpInstalledCardIds,
  corpRootAssetIdsInServer,
  corpRootMainCardIdsInServer,
  definitionFor,
  mustInstance,
  mustRun,
  mustServer,
  publicInstalledCorpCardIdentityKnown,
  rezzedRootCardIdOnServer,
  runnerInstalledCardIds,
  scoredCorpAgendaIds,
  serverById,
  unrezzedRootCardIdOnServer,
} from "./card-server-lookup";

const PROGRAM_ID = "program_1" as CardInstanceId;
const HARDWARE_ID = "hardware_1" as CardInstanceId;
const RESOURCE_ID = "resource_1" as CardInstanceId;
const ASSET_ID = "asset_1" as CardInstanceId;
const AGENDA_ID = "agenda_1" as CardInstanceId;
const ICE_ID = "ice_1" as CardInstanceId;
const UNKNOWN_DEF_ID = "missing_definition" as CardDefinitionId;

function definitionIdFor(type: CardType): CardDefinitionId {
  const definition = Object.values(DEMO_CARDS_BY_ID).find(
    (candidate): candidate is CardDefinition => candidate.type === type,
  );
  if (!definition) throw new Error(`Missing fixture definition for ${type}`);
  return definition.id;
}

function card(
  instanceId: CardInstanceId,
  definitionId: CardDefinitionId,
  options: Partial<CardInstance> = {},
): CardInstance {
  return {
    instanceId,
    definitionId,
    owner: options.owner ?? "corp",
    controller: options.controller ?? options.owner ?? "corp",
    zone: options.zone ?? { side: "corp", zone: "serverRoot", serverId: "remote_1" },
    faceup: options.faceup ?? false,
    rezzed: options.rezzed ?? false,
    advancementCounters: options.advancementCounters ?? 0,
    strengthModifier: options.strengthModifier ?? 0,
    ...options,
  } as CardInstance;
}

function server(id: CorpServer["id"], root: CardInstanceId[] = []): CorpServer {
  return {
    id,
    kind: id.startsWith("remote_") ? "remote" : id,
    label: id,
    ice: id === "remote_1" ? [ICE_ID] : [],
    root,
  } as CorpServer;
}

function state(): GameState {
  const programDefinitionId = definitionIdFor("program");
  const hardwareDefinitionId = definitionIdFor("hardware");
  const resourceDefinitionId = definitionIdFor("resource");
  const assetDefinitionId = definitionIdFor("asset");
  const agendaDefinitionId = definitionIdFor("agenda");
  const iceDefinitionId = definitionIdFor("ice");

  return {
    matchId: "lookup-test",
    stateVersion: 1,
    activeSide: "runner",
    phase: "run",
    timingPoint: "run.encounter",
    baseline: { engineSchemaVersion: "0.99.0" },
    runner: {
      identity: "runner_identity" as CardInstanceId,
      credits: 5,
      clicks: 4,
      tags: 0,
      stack: [],
      grip: [],
      heap: [],
      scoreArea: [],
      rig: {
        programs: [PROGRAM_ID],
        hardware: [HARDWARE_ID],
        resources: [RESOURCE_ID],
      },
    },
    corp: {
      identity: "corp_identity" as CardInstanceId,
      credits: 5,
      clicks: 3,
      badPublicity: 0,
      hq: [],
      rd: [],
      archives: [],
      scoreArea: [AGENDA_ID],
      servers: [server("hq"), server("remote_1", [ASSET_ID, AGENDA_ID])],
    },
    cardInstances: {
      [PROGRAM_ID]: card(PROGRAM_ID, programDefinitionId, {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        faceup: true,
      }),
      [HARDWARE_ID]: card(HARDWARE_ID, hardwareDefinitionId, {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        faceup: true,
      }),
      [RESOURCE_ID]: card(RESOURCE_ID, resourceDefinitionId, {
        owner: "runner",
        controller: "runner",
        zone: { side: "runner", zone: "rig" },
        faceup: true,
      }),
      [ASSET_ID]: card(ASSET_ID, assetDefinitionId, {
        faceup: false,
        rezzed: true,
      }),
      [AGENDA_ID]: card(AGENDA_ID, agendaDefinitionId, {
        faceup: true,
        rezzed: false,
      }),
      [ICE_ID]: card(ICE_ID, iceDefinitionId, {
        zone: { side: "corp", zone: "serverIce", serverId: "remote_1" },
        rezzed: true,
      }),
    },
    run: {
      attackedServerId: "remote_1",
      position: "approach_server",
      phase: "approach_server",
    },
    eventLog: [],
    randomCounter: 0,
  } as unknown as GameState;
}

describe("card-server-lookup", () => {
  it("does not import from index or contain mutation/public payload wiring", () => {
    const source = readFileSync(
      new URL("./card-server-lookup.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("removeFromAllZones");
    expect(source).not.toContain("spendCredits");
    expect(source).not.toContain("spendClick");
    expect(source).not.toContain("randomPurpose");
  });

  it("looks up card definitions and instances without copying objects", () => {
    const current = state();
    const instance = cardInstanceFor(current, ASSET_ID);

    expect(instance).toBe(current.cardInstances[ASSET_ID]);
    expect(cardInstanceFor(current, "missing" as CardInstanceId)).toBeUndefined();
    expect(mustInstance(current.cardInstances, ASSET_ID)).toBe(instance);
    expect(() =>
      mustInstance(current.cardInstances, "missing" as CardInstanceId),
    ).toThrow("CardInstance fehlt: missing");
    expect(definitionFor(current, ASSET_ID).type).toBe("asset");
  });

  it("preserves must lookup error messages", () => {
    const current = state();
    current.cardInstances["broken" as CardInstanceId] = card(
      "broken" as CardInstanceId,
      UNKNOWN_DEF_ID,
    );

    expect(() => definitionFor(current, "broken" as CardInstanceId)).toThrow(
      "Unbekannte Karte: missing_definition",
    );
    expect(() => mustServer(current, "missing")).toThrow("Server fehlt: missing");
    expect(() =>
      mustRun({ ...current, run: undefined } as unknown as GameState),
    ).toThrow("Es läuft kein Run.");
  });

  it("looks up servers and the current run by object identity", () => {
    const current = state();
    const remote = current.corp.servers[1];

    expect(serverById(current, "remote_1")).toBe(remote);
    expect(serverById(current, "missing")).toBeUndefined();
    expect(mustServer(current, "remote_1")).toBe(remote);
    expect(mustRun(current)).toBe(current.run);
  });

  it("returns installed and scored card ids with stable ordering", () => {
    const current = state();

    expect(runnerInstalledCardIds(current)).toEqual([
      PROGRAM_ID,
      HARDWARE_ID,
      RESOURCE_ID,
    ]);
    expect(corpInstalledCardIds(current)).toEqual([
      ASSET_ID,
      AGENDA_ID,
      ICE_ID,
    ]);
    expect(scoredCorpAgendaIds(current)).toEqual([AGENDA_ID]);
    expect(scoredCorpAgendaIds(current)).not.toBe(current.corp.scoreArea);
  });

  it("filters root cards and public corp identity visibility without mutating state", () => {
    const current = state();
    const before = JSON.stringify(current);
    const remote = mustServer(current, "remote_1");

    expect(corpRootAssetIdsInServer(current, remote)).toEqual([ASSET_ID]);
    expect(corpRootMainCardIdsInServer(current, remote)).toEqual([
      AGENDA_ID,
      ASSET_ID,
    ]);
    expect(publicInstalledCorpCardIdentityKnown(current, ASSET_ID)).toBe(true);
    expect(publicInstalledCorpCardIdentityKnown(current, ICE_ID)).toBe(true);
    expect(
      publicInstalledCorpCardIdentityKnown(current, "missing" as CardInstanceId),
    ).toBe(false);

    expect(JSON.stringify(current)).toBe(before);
  });

  it("finds rezzed and unrezzed root cards on a server", () => {
    const current = state();

    expect(
      rezzedRootCardIdOnServer(
        current,
        "remote_1",
        definitionFor(current, ASSET_ID).id,
      ),
    ).toBe(ASSET_ID);
    expect(
      unrezzedRootCardIdOnServer(
        current,
        "remote_1",
        definitionFor(current, AGENDA_ID).id,
      ),
    ).toBe(AGENDA_ID);
  });
});
