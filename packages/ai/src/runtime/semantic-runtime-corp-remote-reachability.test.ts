import type { VisibleCard } from "@netgrid/shared";
import { describe, expect, it } from "vitest";

import { visibleCorpRootProvidesRemoteProtection } from "./semantic-runtime-corp-remote-reachability";

const remote = {
  id: "remote_1",
  ice: [card("remote-ice", "test_ice", { type: "ice", rezzed: true })],
  root: [],
};

describe("visibleCorpRootProvidesRemoteProtection", () => {
  it("does not activate a scored-agenda modifier from an installed agenda", () => {
    const agenda = card(
      "black-ice-quality-assurance",
      403,
      { type: "agenda" },
    );

    expect(
      visibleCorpRootProvidesRemoteProtection(agenda, {
        zone: "root",
        state: "after_install",
        server: remote,
        serverId: remote.id,
        runnerTags: 0,
      }),
    ).toBe(false);
  });

  it("keeps the same persistent modifier active in the score area", () => {
    const agenda = card(
      "black-ice-quality-assurance",
      403,
      { type: "agenda" },
    );

    expect(
      visibleCorpRootProvidesRemoteProtection(agenda, {
        zone: "score_area",
        state: "current",
        server: remote,
        serverId: remote.id,
        runnerTags: 0,
      }),
    ).toBe(true);
  });

  it("counts persistent root protection only after the upgrade is rezzed", () => {
    const upgrade = card(
      "antiquated-interface-routines",
      562,
      { type: "upgrade", rezzed: false },
    );

    expect(
      visibleCorpRootProvidesRemoteProtection(upgrade, {
        zone: "root",
        state: "after_install",
        server: remote,
        serverId: remote.id,
        runnerTags: 0,
      }),
    ).toBe(false);
    expect(
      visibleCorpRootProvidesRemoteProtection(upgrade, {
        zone: "root",
        state: "after_rez",
        server: remote,
        serverId: remote.id,
        runnerTags: 0,
      }),
    ).toBe(true);
  });

  it("keeps an unrezzed on-access trap as a defensive root benefit", () => {
    const accessTrap = card("crybaby", 566, {
      type: "upgrade",
      rezzed: false,
    });

    expect(
      visibleCorpRootProvidesRemoteProtection(accessTrap, {
        zone: "root",
        state: "after_install",
        server: remote,
        serverId: remote.id,
        runnerTags: 0,
      }),
    ).toBe(true);
  });

  it("does not activate an advancement-dependent access trap at zero counters", () => {
    const accessTrap = card(
      "shattered-remains",
      527,
      { type: "asset", rezzed: false, advancementCounters: 0 },
    );

    expect(
      visibleCorpRootProvidesRemoteProtection(accessTrap, {
        zone: "root",
        state: "current",
        server: remote,
        serverId: remote.id,
        runnerTags: 0,
      }),
    ).toBe(false);
    expect(
      visibleCorpRootProvidesRemoteProtection(
        { ...accessTrap, advancementCounters: 1 },
        {
          zone: "root",
          state: "current",
          server: remote,
          serverId: remote.id,
          runnerTags: 0,
        },
      ),
    ).toBe(true);
  });

  it("does not treat trace-credit or remote-capacity upgrades as protection", () => {
    for (const [instanceId, definitionId] of [
      ["paris-city-grid", 577],
      ["namatoki-plaza", 573],
    ] as const)
      expect(
        visibleCorpRootProvidesRemoteProtection(
          card(instanceId, definitionId, { type: "upgrade", rezzed: true }),
          {
            zone: "root",
            state: "current",
            server: remote,
            serverId: remote.id,
            runnerTags: 0,
          },
        ),
      ).toBe(false);
  });
});

function card(
  instanceId: string,
  definitionId: number,
  overrides: Partial<VisibleCard> = {},
): VisibleCard {
  return {
    instanceId,
    definitionId,
    known: true,
    owner: "corp",
    controller: "corp",
    counterDisplays: [],
    ...overrides,
  } as VisibleCard;
}
