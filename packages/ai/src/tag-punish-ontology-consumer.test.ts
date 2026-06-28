import { describe, expect, it } from "vitest";

import {
  tagPunishOntologyConflictWithLegacy,
  type StructuredTagPunishProfile,
} from "./tag-punish-ontology-consumer";

describe("tag punish ontology conflict detection", () => {
  it("matches legacy tag and payoff roles by bounded role terms", () => {
    expect(
      tagPunishOntologyConflictWithLegacy(tagSourceProfile(), [
        "tag_punishment",
      ]),
    ).toBe(true);
    expect(
      tagPunishOntologyConflictWithLegacy(payoffProfile(), ["trace_tag"]),
    ).toBe(true);
  });

  it("ignores tag and payoff substring noise in legacy roles", () => {
    expect(
      tagPunishOntologyConflictWithLegacy(tagSourceProfile(), [
        "tag_punishmentish_noise",
        "damage_operational_noise",
      ]),
    ).toBe(false);
    expect(
      tagPunishOntologyConflictWithLegacy(payoffProfile(), [
        "tag_sourceish_noise",
        "trace_tagish_noise",
      ]),
    ).toBe(false);
  });
});

function tagSourceProfile(): StructuredTagPunishProfile {
  return profile({ tagSource: true });
}

function payoffProfile(): StructuredTagPunishProfile {
  return profile({ payoff: true });
}

function profile(
  overrides: Partial<StructuredTagPunishProfile>,
): StructuredTagPunishProfile {
  return {
    tagSource: false,
    traceTagSource: false,
    payoff: false,
    requiresRunnerTagged: false,
    requiresTraceSuccess: false,
    effectKinds: [],
    conditionKinds: [],
    payoffKinds: [],
    evidence: [],
    ...overrides,
  };
}
