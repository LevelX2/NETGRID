import type { CardImplementationDefinition } from "../types";
import { CLASSIC_CORP_AGENDA_IMPLEMENTATIONS } from "./classic-corp-agenda-implementations";
import { CLASSIC_CORP_ASSET_IMPLEMENTATIONS } from "./classic-corp-asset-implementations";
import { CLASSIC_CORP_ICE_IMPLEMENTATIONS } from "./classic-corp-ice-implementations";
import { CLASSIC_CORP_OPERATION_IMPLEMENTATIONS } from "./classic-corp-operation-implementations";
import { CLASSIC_CORP_UPGRADE_IMPLEMENTATIONS } from "./classic-corp-upgrade-implementations";
import { CLASSIC_RUNNER_EVENT_IMPLEMENTATIONS } from "./classic-runner-event-implementations";
import { CLASSIC_RUNNER_HARDWARE_IMPLEMENTATIONS } from "./classic-runner-hardware-implementations";
import { CLASSIC_RUNNER_PROGRAM_IMPLEMENTATIONS } from "./classic-runner-program-implementations";
import { CLASSIC_RUNNER_RESOURCE_IMPLEMENTATIONS } from "./classic-runner-resource-implementations";
import { DEMO_CORP_ASSET_IMPLEMENTATIONS } from "./demo-corp-asset-implementations";
import { ONR_V1_CORP_AGENDA_IMPLEMENTATIONS } from "./onr-v1-corp-agenda-implementations";
import { ONR_V1_CORP_ASSET_IMPLEMENTATIONS } from "./onr-v1-corp-asset-implementations";
import { ONR_V1_CORP_ICE_IMPLEMENTATIONS } from "./onr-v1-corp-ice-implementations";
import { ONR_V1_CORP_OPERATION_IMPLEMENTATIONS } from "./onr-v1-corp-operation-implementations";
import { ONR_V1_CORP_UPGRADE_IMPLEMENTATIONS } from "./onr-v1-corp-upgrade-implementations";
import { ONR_V1_RUNNER_EVENT_IMPLEMENTATIONS } from "./onr-v1-runner-event-implementations";
import { ONR_V1_RUNNER_HARDWARE_IMPLEMENTATIONS } from "./onr-v1-runner-hardware-implementations";
import { ONR_V1_RUNNER_PROGRAM_IMPLEMENTATIONS } from "./onr-v1-runner-program-implementations";
import { ONR_V1_RUNNER_RESOURCE_IMPLEMENTATIONS } from "./onr-v1-runner-resource-implementations";
import { PROTEUS_CORP_AGENDA_IMPLEMENTATIONS } from "./proteus-corp-agenda-implementations";
import { PROTEUS_CORP_ASSET_IMPLEMENTATIONS } from "./proteus-corp-asset-implementations";
import { PROTEUS_CORP_ICE_IMPLEMENTATIONS } from "./proteus-corp-ice-implementations";
import { PROTEUS_CORP_OPERATION_IMPLEMENTATIONS } from "./proteus-corp-operation-implementations";
import { PROTEUS_CORP_UPGRADE_IMPLEMENTATIONS } from "./proteus-corp-upgrade-implementations";
import { PROTEUS_RUNNER_EVENT_IMPLEMENTATIONS } from "./proteus-runner-event-implementations";
import { PROTEUS_RUNNER_HARDWARE_IMPLEMENTATIONS } from "./proteus-runner-hardware-implementations";
import { PROTEUS_RUNNER_PROGRAM_IMPLEMENTATIONS } from "./proteus-runner-program-implementations";
import { PROTEUS_RUNNER_RESOURCE_IMPLEMENTATIONS } from "./proteus-runner-resource-implementations";
import { V08_CORP_ASSET_IMPLEMENTATIONS } from "./v08-corp-asset-implementations";

export type CardImplementationCatalogGroup = {
  set: "classic" | "demo" | "onr-v1" | "proteus" | "v08";
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
    set: "classic",
    side: "corp",
    cardType: "agenda",
    implementations: CLASSIC_CORP_AGENDA_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "corp",
    cardType: "asset",
    implementations: CLASSIC_CORP_ASSET_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "corp",
    cardType: "ice",
    implementations: CLASSIC_CORP_ICE_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "corp",
    cardType: "operation",
    implementations: CLASSIC_CORP_OPERATION_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "corp",
    cardType: "upgrade",
    implementations: CLASSIC_CORP_UPGRADE_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "runner",
    cardType: "event",
    implementations: CLASSIC_RUNNER_EVENT_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "runner",
    cardType: "hardware",
    implementations: CLASSIC_RUNNER_HARDWARE_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "runner",
    cardType: "program",
    implementations: CLASSIC_RUNNER_PROGRAM_IMPLEMENTATIONS,
  },
  {
    set: "classic",
    side: "runner",
    cardType: "resource",
    implementations: CLASSIC_RUNNER_RESOURCE_IMPLEMENTATIONS,
  },
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
  {
    set: "proteus",
    side: "corp",
    cardType: "agenda",
    implementations: PROTEUS_CORP_AGENDA_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "corp",
    cardType: "asset",
    implementations: PROTEUS_CORP_ASSET_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "corp",
    cardType: "ice",
    implementations: PROTEUS_CORP_ICE_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "corp",
    cardType: "operation",
    implementations: PROTEUS_CORP_OPERATION_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "corp",
    cardType: "upgrade",
    implementations: PROTEUS_CORP_UPGRADE_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "runner",
    cardType: "event",
    implementations: PROTEUS_RUNNER_EVENT_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "runner",
    cardType: "hardware",
    implementations: PROTEUS_RUNNER_HARDWARE_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "runner",
    cardType: "program",
    implementations: PROTEUS_RUNNER_PROGRAM_IMPLEMENTATIONS,
  },
  {
    set: "proteus",
    side: "runner",
    cardType: "resource",
    implementations: PROTEUS_RUNNER_RESOURCE_IMPLEMENTATIONS,
  },
  {
    set: "demo",
    side: "corp",
    cardType: "asset",
    implementations: DEMO_CORP_ASSET_IMPLEMENTATIONS,
  },
  {
    set: "v08",
    side: "corp",
    cardType: "asset",
    implementations: V08_CORP_ASSET_IMPLEMENTATIONS,
  },
] as const satisfies readonly CardImplementationCatalogGroup[];

export const CARD_IMPLEMENTATION_CATALOG =
  CARD_IMPLEMENTATION_CATALOG_GROUPS.flatMap((group) => group.implementations);
