import { describe, expect, it } from "vitest";
import { choiceOptionServerForEngineKey } from "./match-offer-contracts";

describe("match choice server targets", () => {
  it("projects only canonical server IDs from engine choice keys", () => {
    expect(choiceOptionServerForEngineKey("fort_r12")).toBe("r12");
    expect(choiceOptionServerForEngineKey("r1")).toBe("r1");
    expect(choiceOptionServerForEngineKey("fort_hq")).toBe("hq");
    expect(choiceOptionServerForEngineKey("new_remote")).toBe("new_remote");
    expect(choiceOptionServerForEngineKey("fort_r01")).toBeUndefined();
    expect(choiceOptionServerForEngineKey("fort_r0")).toBeUndefined();
    expect(choiceOptionServerForEngineKey("fort_r9007199254740992")).toBeUndefined();
  });
});
