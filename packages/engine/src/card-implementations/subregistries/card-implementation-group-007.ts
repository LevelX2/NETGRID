import type { CardImplementationDefinition } from "../types";
import { backDoorToHilliardImplementation } from "../onr-v1/runner/resources/back-door-to-hilliard";
import { backDoorToOrbitalAirImplementation } from "../onr-v1/runner/resources/back-door-to-orbital-air";
import { aujourdhuiImplementation } from "../onr-v1/runner/resources/aujourdhui";
import { crashEverettInventiveFixerImplementation } from "../onr-v1/runner/resources/crash-everett-inventive-fixer";
import { corporateAllyImplementation } from "../onr-v1/runner/resources/corporate-ally";
import { danshisSecondIdImplementation } from "../onr-v1/runner/resources/danshis-second-id";
import { databrokerImplementation } from "../onr-v1/runner/resources/databroker";
import { diplomaticImmunityImplementation } from "../onr-v1/runner/resources/diplomatic-immunity";
import { fieldReporterForIceAndDataImplementation } from "../onr-v1/runner/resources/field-reporter-for-ice-and-data";
import { fallGuyImplementation } from "../onr-v1/runner/resources/fall-guy";
import { brokerImplementation } from "../onr-v1/runner/resources/broker";
import { codeViralCacheImplementation } from "../onr-v1/runner/resources/code-viral-cache";
import { floatingRunnerBbsImplementation } from "../onr-v1/runner/resources/floating-runner-bbs";
import { hellsRunImplementation } from "../onr-v1/runner/resources/hells-run";
import { junkyardBbsImplementation } from "../onr-v1/runner/resources/junkyard-bbs";
import { karlDeVeresCorporateStoogeImplementation } from "../onr-v1/runner/resources/karl-de-veres-corporate-stooge";
import { lelandCorporateBodyguardImplementation } from "../onr-v1/runner/resources/leland-corporate-bodyguard";
import { loanFromChibaImplementation } from "../onr-v1/runner/resources/loan-from-chiba";
import { nEtoImplementation } from "../onr-v1/runner/resources/n-e-t-o";
import { nomadAlliesImplementation } from "../onr-v1/runner/resources/nomad-allies";

export const CARD_IMPLEMENTATION_GROUP_007 = [
  backDoorToHilliardImplementation,
  backDoorToOrbitalAirImplementation,
  aujourdhuiImplementation,
  crashEverettInventiveFixerImplementation,
  corporateAllyImplementation,
  danshisSecondIdImplementation,
  databrokerImplementation,
  diplomaticImmunityImplementation,
  fieldReporterForIceAndDataImplementation,
  fallGuyImplementation,
  brokerImplementation,
  codeViralCacheImplementation,
  floatingRunnerBbsImplementation,
  hellsRunImplementation,
  junkyardBbsImplementation,
  karlDeVeresCorporateStoogeImplementation,
  lelandCorporateBodyguardImplementation,
  loanFromChibaImplementation,
  nEtoImplementation,
  nomadAlliesImplementation,
] as const satisfies readonly CardImplementationDefinition[];
