import { describe, expect, it } from "vitest";

import { benchmarkProfileById } from "./benchmark-profile-lookup";
import { listCurrentBenchmarkProfiles } from "./benchmark-profile-data";

describe("current simulation benchmark profiles", () => {
  it("provides the generic baseline and candidate profiles", () => {
    expect(
      listCurrentBenchmarkProfiles().map(
        (profile) => profile.benchmarkProfileId,
      ),
    ).toEqual(["random_legal_bot", "current_candidate"]);
  });

  it("rejects a profile missing from the declared benchmark registry", () => {
    const profiles = listCurrentBenchmarkProfiles().filter(
      ({ benchmarkProfileId }) => benchmarkProfileId !== "current_candidate",
    );
    expect(() => benchmarkProfileById("current_candidate", profiles)).toThrow(
      "Unknown simulation benchmark profile: current_candidate",
    );
  });
});
