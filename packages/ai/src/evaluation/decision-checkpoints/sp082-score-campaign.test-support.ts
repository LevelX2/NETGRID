import { hashGameState } from "@netgrid/engine";
import game36Json from "../../../../../data/scenarios/ai-decision-checkpoints/cp-sp082-01-game36-score-parent-funding-gap.json";
import type { AiDecisionCheckpointV1 } from "./checkpoint-types";

/** Current Engine companion of the funding boundary. The old unrezzed fort
 * cannot protect an agenda from today's visible Krash/preparation budget.
 * Here the same Mobile Barricade is already paid, with no public breaker:
 * precisely the four-credit score floor remains, across the opponent turn. */
export function sp082KnownProtectionFundingCompanion(): AiDecisionCheckpointV1 {
  const fixture = structuredClone(game36Json) as AiDecisionCheckpointV1;
  const state = fixture.engine.testOnlyGameState;
  for (const id of state.runner.rig.programs) {
    state.runner.stack.push(id);
    Object.assign(state.cardInstances[id]!, {
      zone: { side: "runner", zone: "stack" },
      faceup: false,
      rezzed: false,
    });
  }
  state.runner.rig.programs = [];
  const fort = state.corp.servers.find((server) => server.id === "remote_1")!;
  const ice = state.cardInstances[fort.ice[0]!]!;
  if (ice.definitionId !== "onr_proteus_033_mobile-barricade")
    throw Error("Expected the native Mobile Barricade");
  ice.rezzed = true;
  ice.faceup = true;
  fixture.source.kind = "synthetic_companion";
  fixture.source.findingId = "SP082-CURRENT-KNOWN-PROTECTION-FUNDING-CONTROL";
  fixture.engine.stateHash = hashGameState(state);
  return fixture;
}
