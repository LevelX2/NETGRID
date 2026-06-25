import type { CardImplementationDefinition } from "../types";
import { nasukoCycleImplementation } from "../onr-v1/runner/hardware/nasuko-cycle";
import { pandorasDeckImplementation } from "../onr-v1/runner/hardware/pandoras-deck";
import { parraline5750Implementation } from "../onr-v1/runner/hardware/parraline-5750";
import { pk6089aImplementation } from "../onr-v1/runner/hardware/pk-6089a";
import { rAndDInterfaceImplementation } from "../onr-v1/runner/hardware/r-d-interface";
import { ravenMicrocybEagleImplementation } from "../onr-v1/runner/hardware/raven-microcyb-eagle";
import { ravenMicrocybOwlImplementation } from "../onr-v1/runner/hardware/raven-microcyb-owl";
import { recordReconstructorImplementation } from "../onr-v1/runner/hardware/record-reconstructor";
import { techtronicaUtilitySuitImplementation } from "../onr-v1/runner/hardware/techtronica-utility-suit";
import { riggedInvestmentsImplementation } from "../onr-v1/runner/resources/rigged-investments";
import { restrictiveNetZoningImplementation } from "../onr-v1/runner/resources/restrictive-net-zoning";
import { scoreImplementation } from "../onr-v1/runner/preps/score";
import { shortTermContractImplementation } from "../onr-v1/runner/resources/short-term-contract";
import { siliconSaloonFranchiseImplementation } from "../onr-v1/runner/resources/silicon-saloon-franchise";
import { smithsPawnshopImplementation } from "../onr-v1/runner/resources/smiths-pawnshop";
import { technicianLoverImplementation } from "../onr-v1/runner/resources/technician-lover";
import { submarineUplinkImplementation } from "../onr-v1/runner/resources/submarine-uplink";
import { theSpringboardImplementation } from "../onr-v1/runner/resources/the-springboard";
import { theShortCircuitImplementation } from "../onr-v1/runner/resources/the-short-circuit";
import { theShellTradersImplementation } from "../onr-v1/runner/resources/the-shell-traders";

export const CARD_IMPLEMENTATION_GROUP_009 = [
  nasukoCycleImplementation,
  pandorasDeckImplementation,
  parraline5750Implementation,
  pk6089aImplementation,
  rAndDInterfaceImplementation,
  ravenMicrocybEagleImplementation,
  ravenMicrocybOwlImplementation,
  recordReconstructorImplementation,
  techtronicaUtilitySuitImplementation,
  riggedInvestmentsImplementation,
  restrictiveNetZoningImplementation,
  scoreImplementation,
  shortTermContractImplementation,
  siliconSaloonFranchiseImplementation,
  smithsPawnshopImplementation,
  technicianLoverImplementation,
  submarineUplinkImplementation,
  theSpringboardImplementation,
  theShortCircuitImplementation,
  theShellTradersImplementation,
] as const satisfies readonly CardImplementationDefinition[];
