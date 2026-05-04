import { describe, expect, it } from "vitest";
import { deriveMatchStart } from "./match-start";

describe("V1.0.3 match start derivation", () => {
  it("keeps Human-vs-Human side assignment server-readable", () => {
    expect(deriveMatchStart({ playMode: "human_vs_human", humanSideSelection: "random", humanAiSideSelection: "random" })).toMatchObject({
      technicalMode: "human_vs_human",
      hostSide: "random",
      createRequest: { mode: "human_vs_human", hostSide: "random" }
    });
    expect(deriveMatchStart({ playMode: "human_vs_human", humanSideSelection: "runner", humanAiSideSelection: "random" }).createRequest).toEqual({
      mode: "human_vs_human",
      hostSide: "runner"
    });
    expect(deriveMatchStart({ playMode: "human_vs_human", humanSideSelection: "corp", humanAiSideSelection: "random" }).createRequest).toEqual({
      mode: "human_vs_human",
      hostSide: "corp"
    });
  });

  it("keeps Human-vs-AI random side assignment on the server", () => {
    expect(deriveMatchStart({ playMode: "human_vs_ai", humanSideSelection: "random", humanAiSideSelection: "runner" })).toMatchObject({
      technicalMode: "human_runner_vs_corp_ai",
      createRequest: { playMode: "human_vs_ai", humanSide: "runner" }
    });
    expect(deriveMatchStart({ playMode: "human_vs_ai", humanSideSelection: "random", humanAiSideSelection: "corp" })).toMatchObject({
      technicalMode: "human_corp_vs_runner_ai",
      createRequest: { playMode: "human_vs_ai", humanSide: "corp" }
    });
    const random = deriveMatchStart({ playMode: "human_vs_ai", humanSideSelection: "random", humanAiSideSelection: "random" });
    expect(random.technicalMode).toBeUndefined();
    expect(random).toMatchObject({
      hostSide: "random",
      createRequest: { playMode: "human_vs_ai", humanSide: "random", hostSide: "random" }
    });
  });

  it("routes AI-vs-AI to the simulation path", () => {
    expect(deriveMatchStart({ playMode: "ai_vs_ai", humanSideSelection: "random", humanAiSideSelection: "random" })).toMatchObject({
      isSimulation: true,
      createRequest: { simulation: "ai_vs_ai" }
    });
  });
});
