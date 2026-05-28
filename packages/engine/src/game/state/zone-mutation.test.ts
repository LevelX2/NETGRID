import {
  type CardInstance,
  type CardInstanceId,
  type CorpServer,
  type GameState,
} from "@netgrid/shared";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { setCardCounter } from "./turn-flags-counters";
import {
  ensureSpecialZones,
  removeFromAllZones,
  uninstallCorpInstalledCardToHq,
} from "./zone-mutation";

const RUNNER_PROGRAM = "runner_program" as CardInstanceId;
const CORP_ASSET = "corp_asset" as CardInstanceId;

function card(
  id: CardInstanceId,
  side: "runner" | "corp",
  zone: CardInstance["zone"],
): CardInstance {
  return {
    instanceId: id,
    definitionId: `${id}_definition`,
    owner: side,
    controller: side,
    zone,
    faceup: true,
    rezzed: true,
    advancementCounters: 0,
    strengthModifier: 0,
  } as CardInstance;
}

function state(): GameState {
  const remote: CorpServer = {
    id: "remote_1",
    kind: "remote",
    label: "Remote 1",
    ice: [],
    root: [CORP_ASSET],
  };
  return {
    runner: {
      grip: [RUNNER_PROGRAM],
      stack: [RUNNER_PROGRAM],
      heap: [RUNNER_PROGRAM],
      scoreArea: [RUNNER_PROGRAM],
      rig: {
        programs: [RUNNER_PROGRAM],
        hardware: [RUNNER_PROGRAM],
        resources: [RUNNER_PROGRAM],
      },
    },
    corp: {
      hq: [CORP_ASSET],
      rd: [CORP_ASSET],
      archives: [CORP_ASSET],
      scoreArea: [CORP_ASSET],
      servers: [remote],
    },
    specialZones: {
      setAside: [RUNNER_PROGRAM, CORP_ASSET],
      removedFromGame: [RUNNER_PROGRAM, CORP_ASSET],
    },
    cardInstances: {
      [RUNNER_PROGRAM]: card(RUNNER_PROGRAM, "runner", {
        side: "runner",
        zone: "rig",
      }),
      [CORP_ASSET]: card(CORP_ASSET, "corp", {
        side: "corp",
        zone: "serverRoot",
        serverId: "remote_1",
      }),
    },
  } as unknown as GameState;
}

describe("zone-mutation", () => {
  it("does not import index or contain public payload wiring", () => {
    const source = readFileSync(
      new URL("./zone-mutation.ts", import.meta.url),
      "utf8",
    );

    expect(source).not.toContain("../index");
    expect(source).not.toContain("../../index");
    expect(source).not.toContain("PublicPayload");
    expect(source).not.toContain("publicContext");
    expect(source).not.toContain("hiddenZoneAction");
    expect(source).not.toContain("randomPurpose");
  });

  it("removes a card from every normal and special zone", () => {
    const current = state();
    setCardCounter(current, RUNNER_PROGRAM, "virus", 2);

    removeFromAllZones(current, RUNNER_PROGRAM);

    expect(current.runner.grip).toEqual([]);
    expect(current.runner.stack).toEqual([]);
    expect(current.runner.heap).toEqual([]);
    expect(current.runner.scoreArea).toEqual([]);
    expect(current.runner.rig.programs).toEqual([]);
    expect(current.runner.rig.hardware).toEqual([]);
    expect(current.runner.rig.resources).toEqual([]);
    expect(current.specialZones?.setAside).toEqual([CORP_ASSET]);
    expect(current.specialZones?.removedFromGame).toEqual([CORP_ASSET]);
    expect(current.cardInstances[RUNNER_PROGRAM]?.counters).toBeUndefined();
  });

  it("ensures special zones and uninstalls corp cards to HQ", () => {
    const current = state();
    delete current.specialZones;

    expect(ensureSpecialZones(current)).toEqual({
      setAside: [],
      removedFromGame: [],
    });

    uninstallCorpInstalledCardToHq(current, CORP_ASSET);
    expect(current.corp.hq[0]).toBe(CORP_ASSET);
    expect(current.corp.servers[0]?.root).toEqual([]);
    expect(current.cardInstances[CORP_ASSET]).toMatchObject({
      faceup: false,
      rezzed: false,
      zone: { side: "corp", zone: "hq" },
    });
  });
});
