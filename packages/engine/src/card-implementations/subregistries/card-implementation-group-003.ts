import type { CardImplementationDefinition } from "../types";
import { valuPakSoftwareBundleImplementation } from "../onr-v1/runner/preps/valu-pak-software-bundle";
import { weatherToFinancePipeImplementation } from "../onr-v1/runner/preps/weather-to-finance-pipe";
import { afreetImplementation } from "../onr-v1/runner/programs/afreet";
import { aiBoonImplementation } from "../onr-v1/runner/programs/ai-boon";
import { baedekersNetMapImplementation } from "../onr-v1/runner/programs/baedekers-net-map";
import { bakdoorImplementation } from "../onr-v1/runner/programs/bakdoor";
import { bartmossMemorialIcebreakerImplementation } from "../onr-v1/runner/programs/bartmoss-memorial-icebreaker";
import { blackDahliaImplementation } from "../onr-v1/runner/programs/black-dahlia";
import { blinkImplementation } from "../onr-v1/runner/programs/blink";
import { boardwalkImplementation } from "../onr-v1/runner/programs/boardwalk";
import { butcherBoyImplementation } from "../onr-v1/runner/programs/butcher-boy";
import { cascadeImplementation } from "../onr-v1/runner/programs/cascade";
import { cloakImplementation } from "../onr-v1/runner/programs/cloak";
import { clownImplementation } from "../onr-v1/runner/programs/clown";
import { codecrackerImplementation } from "../onr-v1/runner/programs/codecracker";
import { codeslingerImplementation } from "../onr-v1/runner/programs/codeslinger";
import { cockroachImplementation } from "../onr-v1/runner/programs/cockroach";
import { cyfermasterImplementation } from "../onr-v1/runner/programs/cyfermaster";
import { deepThoughtImplementation } from "../onr-v1/runner/programs/deep-thought";
import { dogcatcherImplementation } from "../onr-v1/runner/programs/dogcatcher";

export const CARD_IMPLEMENTATION_GROUP_003 = [
  valuPakSoftwareBundleImplementation,
  weatherToFinancePipeImplementation,
  afreetImplementation,
  aiBoonImplementation,
  baedekersNetMapImplementation,
  bakdoorImplementation,
  bartmossMemorialIcebreakerImplementation,
  blackDahliaImplementation,
  blinkImplementation,
  boardwalkImplementation,
  butcherBoyImplementation,
  cascadeImplementation,
  cloakImplementation,
  clownImplementation,
  codecrackerImplementation,
  codeslingerImplementation,
  cockroachImplementation,
  cyfermasterImplementation,
  deepThoughtImplementation,
  dogcatcherImplementation,
] as const satisfies readonly CardImplementationDefinition[];
