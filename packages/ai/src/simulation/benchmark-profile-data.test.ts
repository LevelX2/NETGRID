import { describe, expect, it } from "vitest";

import { listCurrentBenchmarkProfiles } from "./benchmark-profile-data";

describe("current simulation benchmark profiles", () => {
  it("provides the generic baseline and candidate profiles", () => {
    expect(
      listCurrentBenchmarkProfiles().map(
        (profile) => profile.benchmarkProfileId,
      ),
    ).toEqual(["random_legal_bot", "current_candidate"]);
  });
});
