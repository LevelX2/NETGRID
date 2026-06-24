import type { CardImplementationDefinition } from "../types";
import { proteusExecutiveBootCampImplementation } from "../proteus/corp/assets/executive-boot-camp";
import { proteusLdlTrafficAnalyzersImplementation } from "../proteus/corp/assets/ldl-traffic-analyzers";
import { proteusLesleyMajorImplementation } from "../proteus/corp/upgrades/lesley-major";
import { proteusLisaBlightImplementation } from "../proteus/corp/upgrades/lisa-blight";
import { proteusMarcelDesoleilImplementation } from "../proteus/corp/upgrades/marcel-desoleil";
import { proteusNetworkedCenterImplementation } from "../proteus/corp/upgrades/networked-center";
import { proteusObfuscatedFortressImplementation } from "../proteus/corp/upgrades/obfuscated-fortress";
import { proteusPanicButtonImplementation } from "../proteus/corp/upgrades/panic-button";
import { proteusPavitBharatImplementation } from "../proteus/corp/upgrades/pavit-bharat";
import { proteusRaymondEllisonImplementation } from "../proteus/corp/upgrades/raymond-ellison";
import { proteusRasminBridgerImplementation } from "../proteus/corp/upgrades/rasmin-bridger";
import { proteusResearchBunkerImplementation } from "../proteus/corp/upgrades/research-bunker";
import { proteusSimonFranciscoImplementation } from "../proteus/corp/upgrades/simon-francisco";
import { proteusSirenImplementation } from "../proteus/corp/assets/siren";
import { proteusSydMeyerSuperstoresImplementation } from "../proteus/corp/assets/syd-meyer-superstores";
import { proteusWeaponsDepotImplementation } from "../proteus/corp/upgrades/weapons-depot";
import { proteusAiBoardMemberImplementation } from "../proteus/corp/agendas/ai-board-member";
import { proteusCharityTakeoverImplementation } from "../proteus/corp/agendas/charity-takeover";
import { corporateHeadhuntersImplementation } from "../proteus/corp/agendas/corporate-headhunters";
import { fetalAiImplementation } from "../proteus/corp/agendas/fetal-ai";

export const CARD_IMPLEMENTATION_GROUP_022 = [
  proteusExecutiveBootCampImplementation,
  proteusLdlTrafficAnalyzersImplementation,
  proteusLesleyMajorImplementation,
  proteusLisaBlightImplementation,
  proteusMarcelDesoleilImplementation,
  proteusNetworkedCenterImplementation,
  proteusObfuscatedFortressImplementation,
  proteusPanicButtonImplementation,
  proteusPavitBharatImplementation,
  proteusRaymondEllisonImplementation,
  proteusRasminBridgerImplementation,
  proteusResearchBunkerImplementation,
  proteusSimonFranciscoImplementation,
  proteusSirenImplementation,
  proteusSydMeyerSuperstoresImplementation,
  proteusWeaponsDepotImplementation,
  proteusAiBoardMemberImplementation,
  proteusCharityTakeoverImplementation,
  corporateHeadhuntersImplementation,
  fetalAiImplementation,
] as const satisfies readonly CardImplementationDefinition[];
