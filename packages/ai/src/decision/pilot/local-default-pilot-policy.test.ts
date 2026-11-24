import { describe, expect, it } from "vitest";
import {
  AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV,
  localDefaultPilotScopes,
} from "./local-default-pilot-policy";

describe("local default pilot policy", () => {
  it("allows only basic setup as an explicit local default env when pilot env is unset", () => {
    expect(AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV).toBe(
      "NETGRID_AI_PLAY_STRENGTH_LOCAL_DEFAULT",
    );
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: undefined,
        localDefaultEnv: "basic_setup",
      }),
    ).toEqual(["basic_setup"]);
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: "runner_safe_access",
        localDefaultEnv: "basic_setup",
      }),
    ).toEqual([]);
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: undefined,
        localDefaultEnv: "runner_safe_access",
      }),
    ).toEqual([]);
    expect(
      localDefaultPilotScopes({
        explicitPilotEnv: undefined,
        localDefaultEnv: undefined,
      }),
    ).toEqual([]);
  });
});
