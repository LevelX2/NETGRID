import type { CardImplementationDefinition } from "../types";
import { rabbitImplementation } from "../onr-v1/runner/programs/rabbit";
import { microtechAiInterfaceImplementation } from "../onr-v1/runner/programs/microtech-ai-interface";
import { mouseImplementation } from "../onr-v1/runner/programs/mouse";
import { mysteryBoxImplementation } from "../onr-v1/runner/programs/mystery-box";
import { netspaceInverterImplementation } from "../onr-v1/runner/programs/netspace-inverter";
import { newsgroupFilterImplementation } from "../onr-v1/runner/programs/newsgroup-filter";
import { pattelsVirusImplementation } from "../onr-v1/runner/programs/pattels-virus";
import { pileDriverImplementation } from "../onr-v1/runner/programs/pile-driver";
import { poltergeistImplementation } from "../onr-v1/runner/programs/poltergeist";
import { poxImplementation } from "../onr-v1/runner/programs/pox";
import { rAndDProtocolFilesImplementation } from "../onr-v1/runner/programs/r-d-protocol-files";
import { rafflesImplementation } from "../onr-v1/runner/programs/raffles";
import { rammingPistonImplementation } from "../onr-v1/runner/programs/ramming-piston";
import { raptorImplementation } from "../onr-v1/runner/programs/raptor";
import { reflectorImplementation } from "../onr-v1/runner/programs/reflector";
import { replicatorImplementation } from "../onr-v1/runner/programs/replicator";
import { scatterShotImplementation } from "../onr-v1/runner/programs/scatter-shot";
import { seeyaImplementation } from "../onr-v1/runner/programs/seeya";
import { selfModifyingCodeImplementation } from "../onr-v1/runner/programs/self-modifying-code";
import { shakaImplementation } from "../onr-v1/runner/programs/shaka";

export const ONR_V1_RUNNER_PROGRAM_RABBIT_TO_SHAKA_IMPLEMENTATIONS = [
  rabbitImplementation,
  microtechAiInterfaceImplementation,
  mouseImplementation,
  mysteryBoxImplementation,
  netspaceInverterImplementation,
  newsgroupFilterImplementation,
  pattelsVirusImplementation,
  pileDriverImplementation,
  poltergeistImplementation,
  poxImplementation,
  rAndDProtocolFilesImplementation,
  rafflesImplementation,
  rammingPistonImplementation,
  raptorImplementation,
  reflectorImplementation,
  replicatorImplementation,
  scatterShotImplementation,
  seeyaImplementation,
  selfModifyingCodeImplementation,
  shakaImplementation,
] as const satisfies readonly CardImplementationDefinition[];
