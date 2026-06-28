import type { AiHintRemoteRole } from "./hint-ontology";
import { describe, expect, it } from "vitest";

import { structuredRemoteRoleConflictWithLegacy } from "./remote-role-ontology-consumer";

describe("remote role ontology legacy conflict detection", () => {
  it("matches legacy scoring-protection and economy roles by bounded terms", () => {
    expect(
      structuredRemoteRoleConflictWithLegacy(role("asset_economy"), [
        "remote_agenda_protection",
      ]),
    ).toBe(true);
    expect(
      structuredRemoteRoleConflictWithLegacy(role("run_tax"), ["remote_economy_asset"]),
    ).toBe(true);
  });

  it("ignores scoring-protection and economy substring noise", () => {
    expect(
      structuredRemoteRoleConflictWithLegacy(role("asset_economy"), [
        "scoringish_noise",
        "protect_remoteish_noise",
        "remote_agenda_protectionish_noise",
      ]),
    ).toBe(false);
    expect(
      structuredRemoteRoleConflictWithLegacy(role("run_tax"), [
        "uneconomy_noise",
        "economyish_noise",
      ]),
    ).toBe(false);
  });
});

function role(kind: AiHintRemoteRole["kind"]): AiHintRemoteRole {
  return { kind };
}
