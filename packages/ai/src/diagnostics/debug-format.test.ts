import { describe, expect, it } from "vitest";
import { formatDebugFieldValue, uniqueDebugStrings } from "./debug-format";

describe("debug format diagnostics", () => {
  it("formats debug field values without delimiters or line breaks", () => {
    expect(formatDebugFieldValue(" a|b\r\nc ")).toBe("a b c");
    expect(formatDebugFieldValue(12)).toBe("12");
    expect(formatDebugFieldValue(true)).toBe("true");
  });

  it("keeps the first occurrence order when deduping debug strings", () => {
    expect(uniqueDebugStrings(["b", "a", "b", "c", "a"])).toEqual([
      "b",
      "a",
      "c",
    ]);
  });
});
