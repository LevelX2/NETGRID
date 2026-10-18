import { describe, expect, it } from "vitest";
import {
  MatchRuntimeMemory,
  releaseAiMatchRuntime,
} from "./match-runtime-memory";

describe("match runtime ownership", () => {
  it("releases all registered stores for the exact owner without interpreting opaque keys", () => {
    const plans = new MatchRuntimeMemory<string>();
    const intent = new MatchRuntimeMemory<string>();
    plans.set("opaque-plan-a", "finished", "runtime-test-match");
    plans.set("opaque-plan-b", "live", "runtime-test-match:other");
    intent.set("unrelated-key", "finished-intent", "runtime-test-match");
    intent.set(
      "runtime-test-match:misleading",
      "live-intent",
      "other-runtime-match",
    );
    releaseAiMatchRuntime("runtime-test-match");
    expect(plans.get("opaque-plan-a")).toBeUndefined();
    expect(intent.get("unrelated-key")).toBeUndefined();
    expect(plans.get("opaque-plan-b")).toBe("live");
    expect(intent.get("runtime-test-match:misleading")).toBe("live-intent");
    plans.clear();
    intent.clear();
  });
  it("does not delete a key that has been rebound to a different match", () => {
    const memory = new MatchRuntimeMemory<object>();
    const live = { commitment: "preserve" };
    memory.set("same-key", {}, "old-runtime-owner");
    memory.set("same-key", live, "new-runtime-owner");
    releaseAiMatchRuntime("old-runtime-owner");
    expect(memory.get("same-key")).toBe(live);
    releaseAiMatchRuntime("new-runtime-owner");
    expect(memory.get("same-key")).toBeUndefined();
  });
});
