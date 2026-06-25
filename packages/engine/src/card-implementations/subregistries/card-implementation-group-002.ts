import type { CardImplementationDefinition } from "../types";
import { kilroyWasHereImplementation } from "../onr-v1/runner/preps/kilroy-was-here";
import { livewiresContactsImplementation } from "../onr-v1/runner/preps/livewires-contacts";
import { lucidrineBoosterDrugImplementation } from "../onr-v1/runner/preps/lucidrine-booster-drug";
import { mantisFixerAtLargeImplementation } from "../onr-v1/runner/preps/mantis-fixer-at-large";
import { miscForSaleImplementation } from "../onr-v1/runner/preps/misc-for-sale";
import { mitWestTierImplementation } from "../onr-v1/runner/preps/mit-west-tier";
import { openEndedMileageProgramImplementation } from "../onr-v1/runner/preps/open-ended-mileage-program";
import { organDonorImplementation } from "../onr-v1/runner/preps/organ-donor";
import { playfulAiImplementation } from "../onr-v1/runner/preps/playful-ai";
import { priorityWreckImplementation } from "../onr-v1/runner/preps/priority-wreck";
import { privateLdlAccessImplementation } from "../onr-v1/runner/preps/private-ldl-access";
import { rompThroughHqImplementation } from "../onr-v1/runner/preps/romp-through-hq";
import { securityCodeWormChipImplementation } from "../onr-v1/runner/preps/security-code-worm-chip";
import { sneakPreviewImplementation } from "../onr-v1/runner/preps/sneak-preview";
import { socialEngineeringImplementation } from "../onr-v1/runner/preps/social-engineering";
import { templeMicrocodeOutletImplementation } from "../onr-v1/runner/preps/temple-microcode-outlet";
import { stumbleThroughWilderspaceImplementation } from "../onr-v1/runner/preps/stumble-through-wilderspace";
import { synchronizedAttackOnHqImplementation } from "../onr-v1/runner/preps/synchronized-attack-on-hq";
import { terroristReprisalImplementation } from "../onr-v1/runner/preps/terrorist-reprisal";
import { totalGeneticRetrofitImplementation } from "../onr-v1/runner/preps/total-genetic-retrofit";

export const CARD_IMPLEMENTATION_GROUP_002 = [
  kilroyWasHereImplementation,
  livewiresContactsImplementation,
  lucidrineBoosterDrugImplementation,
  mantisFixerAtLargeImplementation,
  miscForSaleImplementation,
  mitWestTierImplementation,
  openEndedMileageProgramImplementation,
  organDonorImplementation,
  playfulAiImplementation,
  priorityWreckImplementation,
  privateLdlAccessImplementation,
  rompThroughHqImplementation,
  securityCodeWormChipImplementation,
  sneakPreviewImplementation,
  socialEngineeringImplementation,
  templeMicrocodeOutletImplementation,
  stumbleThroughWilderspaceImplementation,
  synchronizedAttackOnHqImplementation,
  terroristReprisalImplementation,
  totalGeneticRetrofitImplementation,
] as const satisfies readonly CardImplementationDefinition[];
