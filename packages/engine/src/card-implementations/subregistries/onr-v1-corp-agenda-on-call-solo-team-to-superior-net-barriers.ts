import type { CardImplementationDefinition } from "../types";
import { onCallSoloTeamImplementation } from "../onr-v1/corp/agendas/on-call-solo-team";
import { politicalCoupImplementation } from "../onr-v1/corp/agendas/political-coup";
import { politicalOverthrowImplementation } from "../onr-v1/corp/agendas/political-overthrow";
import { polymerBreakthroughImplementation } from "../onr-v1/corp/agendas/polymer-breakthrough";
import { privateCybernetPoliceImplementation } from "../onr-v1/corp/agendas/private-cybernet-police";
import { priorityRequisitionImplementation } from "../onr-v1/corp/agendas/priority-requisition";
import { projectBabylonImplementation } from "../onr-v1/corp/agendas/project-babylon";
import { securityNetOptimizationImplementation } from "../onr-v1/corp/agendas/security-net-optimization";
import { securityPurgeImplementation } from "../onr-v1/corp/agendas/security-purge";
import { strikeForceKaliImplementation } from "../onr-v1/corp/agendas/strike-force-kali";
import { subsidiaryBranchImplementation } from "../onr-v1/corp/agendas/subsidiary-branch";
import { superiorNetBarriersImplementation } from "../onr-v1/corp/agendas/superior-net-barriers";

export const ONR_V1_CORP_AGENDA_ON_CALL_SOLO_TEAM_TO_SUPERIOR_NET_BARRIERS_IMPLEMENTATIONS =
  [
    onCallSoloTeamImplementation,
    politicalCoupImplementation,
    politicalOverthrowImplementation,
    polymerBreakthroughImplementation,
    privateCybernetPoliceImplementation,
    priorityRequisitionImplementation,
    projectBabylonImplementation,
    securityNetOptimizationImplementation,
    securityPurgeImplementation,
    strikeForceKaliImplementation,
    subsidiaryBranchImplementation,
    superiorNetBarriersImplementation,
  ] as const satisfies readonly CardImplementationDefinition[];
