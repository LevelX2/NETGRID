/** Composition port for choice and hidden-zone runtime domains. */
import type { CorpZoneRuntimePort } from "./corp-zone-runtime-port";
import type { HiddenZoneArrangeRuntimePort } from "./hidden-zone-arrange-runtime-port";
import type { HiddenZoneDiceLoopRuntimePort } from "./hidden-zone-dice-loop-runtime-port";
import type { HiddenZoneNonSearchRuntimePort } from "./hidden-zone-nonsearch-runtime-port";
import type { HiddenZoneSearchRuntimePort } from "./hidden-zone-search-runtime-port";
import type { PendingChoiceRuntimePort } from "./pending-choice-runtime-port";

export type ChoiceHiddenZoneRuntimePort = HiddenZoneSearchRuntimePort &
  HiddenZoneArrangeRuntimePort &
  HiddenZoneNonSearchRuntimePort &
  HiddenZoneDiceLoopRuntimePort &
  CorpZoneRuntimePort &
  PendingChoiceRuntimePort;
