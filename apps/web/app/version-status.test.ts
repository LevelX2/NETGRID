import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("web client release status", () => {
  it("keeps the visible client version at V1.9.21 until the V1.9.22 completion gate", () => {
    const pageSource = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

    expect(pageSource).toContain('const APP_STATUS_LABEL = "V1.9.21";');
    expect(pageSource).not.toContain('const APP_STATUS_LABEL = "V1.9.22";');
  });
});
