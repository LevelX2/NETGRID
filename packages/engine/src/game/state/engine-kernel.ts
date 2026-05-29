import * as drawRandom from "./draw-random";
import * as economy from "./economy-mutation";
import * as lookup from "./card-server-lookup";
import * as turnFlagsCounters from "./turn-flags-counters";
import * as zones from "./zone-mutation";

export type EngineKernel = {
  lookup: typeof lookup;
  zones: typeof zones;
  economy: typeof economy;
  drawRandom: typeof drawRandom;
  counters: typeof turnFlagsCounters;
  turnFlags: typeof turnFlagsCounters;
};

export function createEngineKernel(): EngineKernel {
  return {
    lookup,
    zones,
    economy,
    drawRandom,
    counters: turnFlagsCounters,
    turnFlags: turnFlagsCounters,
  };
}
