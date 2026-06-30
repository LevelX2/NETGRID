import { describe, expect, it } from "vitest";
import type { CardDefinition, CardDefinitionId, CorpServer } from "@netgrid/shared";
import { canInstallCorpIceInServer } from "./corp-ice-install-restrictions";

describe("Classic Corp ICE install restrictions", () => {
  const hq = server("hq", "hq");
  const rd = server("rd", "rd");
  const archives = server("archives", "archives");
  const remote = server("remote_1", "remote");
  const newRemote = { id: "new_remote", kind: "remote" } as const;

  it("prevents Dumpster from being installed on Archives", () => {
    const dumpster = ice("onr_classic_009_dumpster");

    expect(canInstallCorpIceInServer(dumpster, archives)).toBe(false);
    expect(canInstallCorpIceInServer(dumpster, hq)).toBe(true);
    expect(canInstallCorpIceInServer(dumpster, rd)).toBe(true);
    expect(canInstallCorpIceInServer(dumpster, remote)).toBe(true);
    expect(canInstallCorpIceInServer(dumpster, newRemote)).toBe(true);
  });

  it("allows Trapdoor only on HQ or R&D", () => {
    const trapdoor = ice("onr_classic_014_trapdoor");

    expect(canInstallCorpIceInServer(trapdoor, hq)).toBe(true);
    expect(canInstallCorpIceInServer(trapdoor, rd)).toBe(true);
    expect(canInstallCorpIceInServer(trapdoor, archives)).toBe(false);
    expect(canInstallCorpIceInServer(trapdoor, remote)).toBe(false);
    expect(canInstallCorpIceInServer(trapdoor, newRemote)).toBe(false);
  });

  it("allows Glacier only inside subsidiary data forts", () => {
    const glacier = ice("onr_classic_011_glacier");

    expect(canInstallCorpIceInServer(glacier, remote)).toBe(true);
    expect(canInstallCorpIceInServer(glacier, newRemote)).toBe(true);
    expect(canInstallCorpIceInServer(glacier, hq)).toBe(false);
    expect(canInstallCorpIceInServer(glacier, rd)).toBe(false);
    expect(canInstallCorpIceInServer(glacier, archives)).toBe(false);
  });
});

function ice(id: string): CardDefinition {
  return {
    id: id as CardDefinitionId,
    title: id,
    type: "ice",
    installCost: 0,
    rezCost: 0,
    agendaPoints: 0,
    advancementRequirement: 0,
    mechanics: [],
    subtypes: [],
  } as unknown as CardDefinition;
}

function server(id: CorpServer["id"], kind: CorpServer["kind"]): CorpServer {
  return {
    id,
    kind,
    label: String(id),
    ice: [],
    root: [],
  };
}
