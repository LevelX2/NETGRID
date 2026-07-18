import type { CardImplementationDefinition } from "../types";
import { dwarfImplementation } from "../onr-v1/runner/programs/dwarf";
import { emergencySelfConstructImplementation } from "../onr-v1/runner/programs/emergency-self-construct";
import { evilTwinImplementation } from "../onr-v1/runner/programs/evil-twin";
import { expertScheduleAnalyzerImplementation } from "../onr-v1/runner/programs/expert-schedule-analyzer";
import { falseEchoImplementation } from "../onr-v1/runner/programs/false-echo";
import { flakImplementation } from "../onr-v1/runner/programs/flak";
import { forceShieldImplementation } from "../onr-v1/runner/programs/force-shield";
import { grubbImplementation } from "../onr-v1/runner/programs/grubb";
import { faitAccompliImplementation } from "../onr-v1/runner/programs/fait-accompli";
import { gremlinsImplementation } from "../onr-v1/runner/programs/gremlins";
import { hammerImplementation } from "../onr-v1/runner/programs/hammer";
import { impImplementation } from "../onr-v1/runner/programs/imp";
import { incubatorImplementation } from "../onr-v1/runner/programs/incubator";
import { invisibilityImplementation } from "../onr-v1/runner/programs/invisibility";
import { iSpyImplementation } from "../onr-v1/runner/programs/i-spy";
import { jackhammerImplementation } from "../onr-v1/runner/programs/jackhammer";
import { japaneseWaterTortureImplementation } from "../onr-v1/runner/programs/japanese-water-torture";
import { joanOfArcImplementation } from "../onr-v1/runner/programs/joan-of-arc";
import { krashImplementation } from "../onr-v1/runner/programs/krash";
import { loonyGoonImplementation } from "../onr-v1/runner/programs/loony-goon";

export const ONR_V1_RUNNER_PROGRAM_DWARF_TO_LOONY_GOON_IMPLEMENTATIONS = [
  dwarfImplementation,
  emergencySelfConstructImplementation,
  evilTwinImplementation,
  expertScheduleAnalyzerImplementation,
  falseEchoImplementation,
  flakImplementation,
  forceShieldImplementation,
  grubbImplementation,
  faitAccompliImplementation,
  gremlinsImplementation,
  hammerImplementation,
  impImplementation,
  incubatorImplementation,
  invisibilityImplementation,
  iSpyImplementation,
  jackhammerImplementation,
  japaneseWaterTortureImplementation,
  joanOfArcImplementation,
  krashImplementation,
  loonyGoonImplementation,
] as const satisfies readonly CardImplementationDefinition[];
