import type { CardImplementationDefinition } from "../types";
import { proteusSkeletonPasskeysImplementation } from "../proteus/runner/programs/skeleton-passkeys";
import { proteusSkullcapImplementation } from "../proteus/runner/programs/skullcap";
import { proteusTaxmanImplementation } from "../proteus/runner/programs/taxman";
import { proteusVienna22Implementation } from "../proteus/runner/programs/vienna-22";
import { proteusViralPipelineImplementation } from "../proteus/runner/programs/viral-pipeline";
import { proteusWreckingBallImplementation } from "../proteus/runner/programs/wrecking-ball";
import { proteusAirportLockerImplementation } from "../proteus/runner/resources/airport-locker";
import { proteusBargainWithViacoxImplementation } from "../proteus/runner/resources/bargain-with-viacox";
import { proteusBackDoorToNetwatchImplementation } from "../proteus/runner/resources/back-door-to-netwatch";
import { proteusBackDoorToRivalsImplementation } from "../proteus/runner/resources/back-door-to-rivals";
import { proteusBoltHoleImplementation } from "../proteus/runner/resources/bolt-hole";
import { proteusChibaBankAccountImplementation } from "../proteus/runner/resources/chiba-bank-account";
import { proteusCreditSubversionImplementation } from "../proteus/runner/resources/credit-subversion";
import { proteusDeathFromAboveImplementation } from "../proteus/runner/resources/death-from-above";
import { proteusExpendableFamilyMemberImplementation } from "../proteus/runner/resources/expendable-family-member";
import { proteusGetReadyToRumbleImplementation } from "../proteus/runner/resources/get-ready-to-rumble";
import { proteusHqMoleImplementation } from "../proteus/runner/resources/hq-mole";
import { proteusLiberatedSavingsAccountImplementation } from "../proteus/runner/resources/liberated-savings-account";
import { proteusMercenarySubcontractImplementation } from "../proteus/runner/resources/mercenary-subcontract";
import { proteusPrecisionBriberyImplementation } from "../proteus/runner/resources/precision-bribery";

export const CARD_IMPLEMENTATION_GROUP_026 = [
  proteusSkeletonPasskeysImplementation,
  proteusSkullcapImplementation,
  proteusTaxmanImplementation,
  proteusVienna22Implementation,
  proteusViralPipelineImplementation,
  proteusWreckingBallImplementation,
  proteusAirportLockerImplementation,
  proteusBargainWithViacoxImplementation,
  proteusBackDoorToNetwatchImplementation,
  proteusBackDoorToRivalsImplementation,
  proteusBoltHoleImplementation,
  proteusChibaBankAccountImplementation,
  proteusCreditSubversionImplementation,
  proteusDeathFromAboveImplementation,
  proteusExpendableFamilyMemberImplementation,
  proteusGetReadyToRumbleImplementation,
  proteusHqMoleImplementation,
  proteusLiberatedSavingsAccountImplementation,
  proteusMercenarySubcontractImplementation,
  proteusPrecisionBriberyImplementation,
] as const satisfies readonly CardImplementationDefinition[];
