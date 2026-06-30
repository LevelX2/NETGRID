import type { CardImplementationDefinition } from "../types";
import { classicCrashSpaceImplementation } from "../classic/runner/resources/crash-space";
import { classicElenaLaskovaImplementation } from "../classic/runner/resources/elena-laskova";
import { classicExecutiveFileClerkImplementation } from "../classic/runner/resources/executive-file-clerk";
import { classicSandboxDigImplementation } from "../classic/runner/resources/sandbox-dig";

export const CLASSIC_RUNNER_RESOURCE_IMPLEMENTATIONS = [
  classicCrashSpaceImplementation,
  classicElenaLaskovaImplementation,
  classicExecutiveFileClerkImplementation,
  classicSandboxDigImplementation,
] as const satisfies readonly CardImplementationDefinition[];
