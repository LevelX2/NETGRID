import { describe, expect, it } from "vitest";
import {
  aiInput,
  legalAction,
  server,
  visibleCard,
} from "../semantic-ai-runtime-cutover.test-support";
import { withEffectiveRunQuote } from "../effective-run-quote.test-support";
import { runnerEncounterActionExclusion } from "./runner-encounter-action-exclusion";

describe("next-encounter break purpose", () => {
  it.each([0, 1])("checks the actual remaining ICE at index %i", (iceIndex) => {
    const action = legalAction(
      "break-next-ice-effect",
      "runner",
      "break_subroutine",
      "Break next-ICE lock",
      { credits: 0, clicks: 0 },
      {
        source: "blink",
        payload: { breakerId: "blink", iceId: "neural", subroutineIndex: 1 },
      },
    );
    const input = aiInput("runner", [action]);
    const ice = withEffectiveRunQuote(
      visibleCard("neural", "corp", "ice", {
        definitionId: "onr_v1_258_neural-blade",
        rezzed: true,
        strength: 4,
      }),
      {
        effectiveStrength: 4,
        subroutines: [
          { id: "damage", type: "do_damage", amount: 1, damageType: "net" },
          { id: "next", type: "set_next_encounter_no_break_subroutines" },
        ],
      },
    );
    input.playerView.servers = [
      server(
        "rd",
        iceIndex ? [visibleCard("inner", "corp", "ice"), ice] : [ice],
      ),
    ];
    input.playerView.run = {
      runId: "run",
      attackedServerId: "rd",
      phase: "encounter_ice",
      position: { kind: "ice", serverId: "rd", iceIndex },
      encounteredIce: ice,
      successful: false,
    };
    const dependencies = {
      randomBreakOrDamageBreakExclusion: () => undefined,
      pumpViabilityAssessment: () => ({ canLeadToBreak: true, evidence: [] }),
      breakAccessPathAssessment: () => ({
        canPreserveAccessPath: true,
        evidence: [],
      }),
    };
    expect(
      runnerEncounterActionExclusion(input, action, dependencies)?.key,
    ).toBe(iceIndex ? undefined : "break_targets_absent_next_encounter");
    action.payload!.subroutineIndex = 0;
    expect(
      runnerEncounterActionExclusion(input, action, dependencies),
    ).toBeUndefined();
    action.payload!.subroutineIndex = 1;
    ice.effectiveRunQuote!.subroutines.push({
      id: "redirect",
      type: "deflect_run",
    });
    expect(
      runnerEncounterActionExclusion(input, action, dependencies),
    ).toBeUndefined();
  });
});
