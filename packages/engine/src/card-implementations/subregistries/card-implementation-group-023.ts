import type { CardImplementationDefinition } from "../types";
import { markedAccountsImplementation } from "../proteus/corp/agendas/marked-accounts";
import { proteusPleaseDontChokeAnyoneImplementation } from "../proteus/corp/agendas/please-dont-choke-anyone";
import { proteusProjectVeniceImplementation } from "../proteus/corp/agendas/project-venice";
import { projectZurichImplementation } from "../proteus/corp/agendas/project-zurich";
import { proteusViralBreedingGroundImplementation } from "../proteus/corp/agendas/viral-breeding-ground";
import { worldDominationImplementation } from "../proteus/corp/agendas/world-domination";
import { belDigmoAntibodyImplementation } from "../proteus/corp/assets/bel-digmo-antibody";
import { doppelgangerAntibodyImplementation } from "../proteus/corp/assets/doppelganger-antibody";
import { pattelAntibodyImplementation } from "../proteus/corp/assets/pattel-antibody";
import { stereogramAntibodyImplementation } from "../proteus/corp/assets/stereogram-antibody";
import { proteusFakedHitImplementation } from "../proteus/runner/events/faked-hit";
import { proteusFrameUpImplementation } from "../proteus/runner/events/frame-up";
import { proteusAllHandsImplementation } from "../proteus/runner/events/all-hands";
import { blackmailImplementation } from "../proteus/runner/events/blackmail";
import { proteusCruisingForNetwatchImplementation } from "../proteus/runner/events/cruising-for-netwatch";
import { proteusDecoySignalImplementation } from "../proteus/runner/events/decoy-signal";
import { proteusDemolitionRunImplementation } from "../proteus/runner/events/demolition-run";
import { proteusDisgruntledIceTechnicianImplementation } from "../proteus/runner/events/disgruntled-ice-technician";
import { proteusDroneForADayImplementation } from "../proteus/runner/events/drone-for-a-day";
import { proteusHijackImplementation } from "../proteus/runner/events/hijack";

export const CARD_IMPLEMENTATION_GROUP_023 = [
  markedAccountsImplementation,
  proteusPleaseDontChokeAnyoneImplementation,
  proteusProjectVeniceImplementation,
  projectZurichImplementation,
  proteusViralBreedingGroundImplementation,
  worldDominationImplementation,
  belDigmoAntibodyImplementation,
  doppelgangerAntibodyImplementation,
  pattelAntibodyImplementation,
  stereogramAntibodyImplementation,
  proteusFakedHitImplementation,
  proteusFrameUpImplementation,
  proteusAllHandsImplementation,
  blackmailImplementation,
  proteusCruisingForNetwatchImplementation,
  proteusDecoySignalImplementation,
  proteusDemolitionRunImplementation,
  proteusDisgruntledIceTechnicianImplementation,
  proteusDroneForADayImplementation,
  proteusHijackImplementation,
] as const satisfies readonly CardImplementationDefinition[];
