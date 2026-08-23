import { describe, expect, it } from "vitest";
import type { CardDefinitionId, CardInstanceId } from "@netgrid/shared";
import {
  automaticRunnerStartSourceId,
  type RunnerStartOrderingCandidate,
} from "./turn-runner-start-ordering";

function candidate(
  sourceId: string,
  patch: Partial<RunnerStartOrderingCandidate> = {},
): RunnerStartOrderingCandidate {
  return {
    sourceId: sourceId as CardInstanceId,
    sourceDefinitionId: "safe_definition" as CardDefinitionId,
    lifecycleOnly: true,
    orderIndependentBetweenCopies: true,
    ...patch,
  };
}

describe("Runner start ordering", () => {
  it("selects the stable first source for safe copies", () => {
    expect(
      automaticRunnerStartSourceId([candidate("safe_2"), candidate("safe_1")]),
    ).toBe("safe_1");
  });

  it("keeps mixed definitions as a player choice", () => {
    expect(
      automaticRunnerStartSourceId([
        candidate("safe_1"),
        candidate("other_1", {
          sourceDefinitionId: "other_definition" as CardDefinitionId,
        }),
      ]),
    ).toBeUndefined();
  });

  it("keeps unmarked copies as a player choice", () => {
    expect(
      automaticRunnerStartSourceId([
        candidate("safe_1"),
        candidate("safe_2", { orderIndependentBetweenCopies: false }),
      ]),
    ).toBeUndefined();
  });

  it("keeps sources with an additional start path as a player choice", () => {
    expect(
      automaticRunnerStartSourceId([
        candidate("safe_1"),
        candidate("safe_2", { lifecycleOnly: false }),
      ]),
    ).toBeUndefined();
  });
});
