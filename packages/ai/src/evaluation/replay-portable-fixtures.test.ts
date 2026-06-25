import { afterEach, describe, expect, it } from "vitest";
import { chooseRunnerAction } from "../index";
import { containsForbiddenSemanticMarker } from "../diagnostics/semantic-redaction";
import { resetTacticalPlanMemory } from "../tactical-plans";
import {
  coverageRunGapNoRunNegativeFixture,
  coverageRunGapPortableFixture,
} from "./replay-portable-fixtures";

describe("replay portable fixtures", () => {
  afterEach(() => {
    resetTacticalPlanMemory();
  });

  it("reproduces the coverage/run gap through PlayerView and LegalActions only", () => {
    const fixture = coverageRunGapPortableFixture();

    expect(containsForbiddenSemanticMarker(fixture)).toBe(false);

    const decision = chooseRunnerAction(fixture.input, {
      persistTacticalPlanMemory: false,
    });
    const selected = fixture.input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(decision.actionId).toBe(fixture.expected.actionId);
    expect(selected?.type).toBe("start_run");
    expect(decision.evidence).toEqual(
      expect.arrayContaining([
        "semantic_runtime_default:true",
        "action_type:start_run",
      ]),
    );
    expect(JSON.stringify(fixture)).not.toMatch(
      /cardInstances|privatePayload|sessionToken|reconnectToken|joinToken|tokenHash|fullGameState|deckOrder/i,
    );
  });

  it("does not invent a run when the fixture omits start_run LegalActions", () => {
    const fixture = coverageRunGapNoRunNegativeFixture();

    expect(containsForbiddenSemanticMarker(fixture)).toBe(false);

    const decision = chooseRunnerAction(fixture.input, {
      persistTacticalPlanMemory: false,
    });
    const selected = fixture.input.legalActions.find(
      (action) => action.actionId === decision.actionId,
    );

    expect(selected?.type).not.toBe("start_run");
    expect(fixture.input.legalActions.some((action) => action.type === "start_run")).toBe(
      false,
    );
  });
});
