import type { CardImplementationDefinition } from "../types";
import { mainOfficeRelocationImplementation } from "../onr-v1/corp/agendas/main-office-relocation";
import { marineArcologyImplementation } from "../onr-v1/corp/agendas/marine-arcology";
import { netwatchOperationsOfficeImplementation } from "../onr-v1/corp/agendas/netwatch-operations-office";
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
import { accountsReceivableImplementation } from "../onr-v1/corp/operations/accounts-receivable";
import { annualReviewsImplementation } from "../onr-v1/corp/operations/annual-reviews";
import { auditOfCallRecordsImplementation } from "../onr-v1/corp/operations/audit-of-call-records";
import { aardvarkImplementation } from "../onr-v1/corp/upgrades/aardvark";
import { chanceObservationImplementation } from "../onr-v1/corp/operations/chance-observation";

export const CARD_IMPLEMENTATION_GROUP_011 = [
  mainOfficeRelocationImplementation,
  marineArcologyImplementation,
  netwatchOperationsOfficeImplementation,
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
  accountsReceivableImplementation,
  annualReviewsImplementation,
  auditOfCallRecordsImplementation,
  aardvarkImplementation,
  chanceObservationImplementation,
] as const satisfies readonly CardImplementationDefinition[];
