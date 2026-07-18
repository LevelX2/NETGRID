import type { CardImplementationDefinition } from "../types";
import { proteusHermanRevistaImplementation } from "../proteus/corp/upgrades/herman-revista";
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
import { proteusWeaponsDepotImplementation } from "../proteus/corp/upgrades/weapons-depot";

export const PROTEUS_CORP_UPGRADE_IMPLEMENTATIONS = [
  proteusHermanRevistaImplementation,
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
  proteusWeaponsDepotImplementation,
] as const satisfies readonly CardImplementationDefinition[];
