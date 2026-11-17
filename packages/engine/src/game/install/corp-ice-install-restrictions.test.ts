import { describe, expect, it } from "vitest";
import type {
  CardDefinition,
  CardDefinitionId,
  CorpServer,
} from "@netgrid/shared";
import { canInstallCorpIceInServer } from "./corp-ice-install-restrictions";

describe("Classic Corp ICE install restrictions", () => {
  const hq = server("hq", "hq");
  const rd = server("rd", "rd");
  const archives = server("archives", "archives");
  const remote = server("r1", "remote");
  const newRemote = { id: "new_remote", kind: "remote" } as const;

  it("prevents Dumpster from being installed on Archives", () => {
    const dumpster = ice(13);

    expect(canInstallCorpIceInServer(dumpster, archives)).toBe(false);
    expect(canInstallCorpIceInServer(dumpster, hq)).toBe(true);
    expect(canInstallCorpIceInServer(dumpster, rd)).toBe(true);
    expect(canInstallCorpIceInServer(dumpster, remote)).toBe(true);
    expect(canInstallCorpIceInServer(dumpster, newRemote)).toBe(true);
  });

  it("allows Trapdoor only on HQ or R&D", () => {
    const trapdoor = ice(18);

    expect(canInstallCorpIceInServer(trapdoor, hq)).toBe(true);
    expect(canInstallCorpIceInServer(trapdoor, rd)).toBe(true);
    expect(canInstallCorpIceInServer(trapdoor, archives)).toBe(false);
    expect(canInstallCorpIceInServer(trapdoor, remote)).toBe(false);
    expect(canInstallCorpIceInServer(trapdoor, newRemote)).toBe(false);
  });

  it("allows Panic Button only on HQ", () => {
    const panicButton = ice(125);

    expect(canInstallCorpIceInServer(panicButton, hq)).toBe(true);
    expect(canInstallCorpIceInServer(panicButton, rd)).toBe(false);
    expect(canInstallCorpIceInServer(panicButton, archives)).toBe(false);
    expect(canInstallCorpIceInServer(panicButton, remote)).toBe(false);
    expect(canInstallCorpIceInServer(panicButton, newRemote)).toBe(false);
  });

  it("allows Roving Submarine only inside a subsidiary data fort", () => {
    const rovingSubmarine = ice(580);

    expect(canInstallCorpIceInServer(rovingSubmarine, remote)).toBe(true);
    expect(canInstallCorpIceInServer(rovingSubmarine, newRemote)).toBe(true);
    expect(canInstallCorpIceInServer(rovingSubmarine, hq)).toBe(false);
    expect(canInstallCorpIceInServer(rovingSubmarine, rd)).toBe(false);
    expect(canInstallCorpIceInServer(rovingSubmarine, archives)).toBe(false);
  });

  it("allows Glacier on every data fort", () => {
    const glacier = ice(15);

    expect(canInstallCorpIceInServer(glacier, remote)).toBe(true);
    expect(canInstallCorpIceInServer(glacier, newRemote)).toBe(true);
    expect(canInstallCorpIceInServer(glacier, hq)).toBe(true);
    expect(canInstallCorpIceInServer(glacier, rd)).toBe(true);
    expect(canInstallCorpIceInServer(glacier, archives)).toBe(true);
  });
});

function ice(id: number): CardDefinition {
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
