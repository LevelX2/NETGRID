import type { CardImplementationDefinition } from "../types";
import { proteusAiBoardMemberImplementation } from "../proteus/corp/agendas/ai-board-member";
import { proteusCharityTakeoverImplementation } from "../proteus/corp/agendas/charity-takeover";
import { corporateHeadhuntersImplementation } from "../proteus/corp/agendas/corporate-headhunters";
import { fetalAiImplementation } from "../proteus/corp/agendas/fetal-ai";
import { markedAccountsImplementation } from "../proteus/corp/agendas/marked-accounts";
import { proteusPleaseDontChokeAnyoneImplementation } from "../proteus/corp/agendas/please-dont-choke-anyone";
import { proteusProjectVeniceImplementation } from "../proteus/corp/agendas/project-venice";
import { projectZurichImplementation } from "../proteus/corp/agendas/project-zurich";
import { proteusViralBreedingGroundImplementation } from "../proteus/corp/agendas/viral-breeding-ground";
import { worldDominationImplementation } from "../proteus/corp/agendas/world-domination";

export const PROTEUS_CORP_AGENDA_IMPLEMENTATIONS = [
  proteusAiBoardMemberImplementation,
  proteusCharityTakeoverImplementation,
  corporateHeadhuntersImplementation,
  fetalAiImplementation,
  markedAccountsImplementation,
  proteusPleaseDontChokeAnyoneImplementation,
  proteusProjectVeniceImplementation,
  projectZurichImplementation,
  proteusViralBreedingGroundImplementation,
  worldDominationImplementation,
] as const satisfies readonly CardImplementationDefinition[];
