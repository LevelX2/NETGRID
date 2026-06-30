import type { CardImplementationDefinition } from "../types";
import { CLASSIC_CORP_ASSET_IMPLEMENTATIONS } from "./classic-corp-asset-implementations";
import { CLASSIC_CORP_AGENDA_IMPLEMENTATIONS } from "./classic-corp-agenda-implementations";
import { CLASSIC_CORP_ICE_IMPLEMENTATIONS } from "./classic-corp-ice-implementations";
import { CLASSIC_CORP_OPERATION_IMPLEMENTATIONS } from "./classic-corp-operation-implementations";
import { CLASSIC_CORP_UPGRADE_IMPLEMENTATIONS } from "./classic-corp-upgrade-implementations";
import { CLASSIC_RUNNER_EVENT_IMPLEMENTATIONS } from "./classic-runner-event-implementations";
import { CLASSIC_RUNNER_PROGRAM_IMPLEMENTATIONS } from "./classic-runner-program-implementations";

export const CLASSIC_CARD_IMPLEMENTATIONS = [
  ...CLASSIC_CORP_ASSET_IMPLEMENTATIONS,
  ...CLASSIC_CORP_AGENDA_IMPLEMENTATIONS,
  ...CLASSIC_CORP_ICE_IMPLEMENTATIONS,
  ...CLASSIC_CORP_OPERATION_IMPLEMENTATIONS,
  ...CLASSIC_CORP_UPGRADE_IMPLEMENTATIONS,
  ...CLASSIC_RUNNER_EVENT_IMPLEMENTATIONS,
  ...CLASSIC_RUNNER_PROGRAM_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
