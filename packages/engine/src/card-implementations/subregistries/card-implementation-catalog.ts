import type { CardImplementationDefinition } from "../types";
import { ONR_V1_CORP_AGENDA_IMPLEMENTATIONS } from "./onr-v1-corp-agenda-implementations";
import { ONR_V1_CORP_ASSET_IMPLEMENTATIONS } from "./onr-v1-corp-asset-implementations";
import { ONR_V1_CORP_ICE_IMPLEMENTATIONS } from "./onr-v1-corp-ice-implementations";
import { ONR_V1_CORP_OPERATION_IMPLEMENTATIONS } from "./onr-v1-corp-operation-implementations";
import { ONR_V1_CORP_UPGRADE_IMPLEMENTATIONS } from "./onr-v1-corp-upgrade-implementations";
import { ONR_V1_RUNNER_EVENT_IMPLEMENTATIONS } from "./onr-v1-runner-event-implementations";
import { ONR_V1_RUNNER_HARDWARE_IMPLEMENTATIONS } from "./onr-v1-runner-hardware-implementations";
import { ONR_V1_RUNNER_PROGRAM_IMPLEMENTATIONS } from "./onr-v1-runner-program-implementations";
import { ONR_V1_RUNNER_RESOURCE_IMPLEMENTATIONS } from "./onr-v1-runner-resource-implementations";

export type CardImplementationCatalogGroup = {
  set: "onr-v1";
  side: "corp" | "runner";
  cardType:
    | "agenda"
    | "asset"
    | "event"
    | "hardware"
    | "ice"
    | "operation"
    | "program"
    | "resource"
    | "upgrade";
  implementations: readonly CardImplementationDefinition[];
};

// Set, side and type order is explicit so registry iteration and replay remain deterministic.
export const CARD_IMPLEMENTATION_CATALOG_GROUPS = [
  {
    set: "onr-v1",
    side: "corp",
    cardType: "agenda",
    implementations: ONR_V1_CORP_AGENDA_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "corp",
    cardType: "asset",
    implementations: ONR_V1_CORP_ASSET_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "corp",
    cardType: "ice",
    implementations: ONR_V1_CORP_ICE_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "corp",
    cardType: "operation",
    implementations: ONR_V1_CORP_OPERATION_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "corp",
    cardType: "upgrade",
    implementations: ONR_V1_CORP_UPGRADE_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "runner",
    cardType: "event",
    implementations: ONR_V1_RUNNER_EVENT_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "runner",
    cardType: "hardware",
    implementations: ONR_V1_RUNNER_HARDWARE_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "runner",
    cardType: "program",
    implementations: ONR_V1_RUNNER_PROGRAM_IMPLEMENTATIONS,
  },
  {
    set: "onr-v1",
    side: "runner",
    cardType: "resource",
    implementations: ONR_V1_RUNNER_RESOURCE_IMPLEMENTATIONS,
  },
] as const satisfies readonly CardImplementationCatalogGroup[];

export const CARD_IMPLEMENTATION_CATALOG =
  CARD_IMPLEMENTATION_CATALOG_GROUPS.flatMap((group) => group.implementations);
