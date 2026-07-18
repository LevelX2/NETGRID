import type { CardImplementationDefinition } from "../types";
import { ONR_V1_CORP_AGENDA_ARTIFICIAL_SECURITY_DIRECTORS_TO_NETWATCH_OPERATIONS_OFFICE_IMPLEMENTATIONS } from "./onr-v1-corp-agenda-artificial-security-directors-to-netwatch-operations-office";
import { ONR_V1_CORP_AGENDA_ON_CALL_SOLO_TEAM_TO_SUPERIOR_NET_BARRIERS_IMPLEMENTATIONS } from "./onr-v1-corp-agenda-on-call-solo-team-to-superior-net-barriers";

/** Deterministic alphabetic leaves keep this semantic set/side/type registry merge-light. */
export const ONR_V1_CORP_AGENDA_IMPLEMENTATIONS = [
  ...ONR_V1_CORP_AGENDA_ARTIFICIAL_SECURITY_DIRECTORS_TO_NETWATCH_OPERATIONS_OFFICE_IMPLEMENTATIONS,
  ...ONR_V1_CORP_AGENDA_ON_CALL_SOLO_TEAM_TO_SUPERIOR_NET_BARRIERS_IMPLEMENTATIONS,
] as const satisfies readonly CardImplementationDefinition[];
