import { centralPressureModule } from "../runner/central-pressure/central-pressure-plan-module";
import { createRunnerExposeInformationModule } from "../runner/expose-information/expose-information-plan-module";
import { developmentModule } from "../runner/hand-development/development-plan-module";
import { remoteContestModule } from "../runner/remote-contest/remote-contest-plan-module";
import { runWindowModule } from "../runner/run-window/run-window-plan-module";
import { createRunnerTerminalWinModule } from "../runner/terminal-win/terminal-win-plan-module";
import type { PlanModule } from "./plan-scheduler";

export function createRunnerTacticalPlanModules(): PlanModule[] {
  return [
    createRunnerTerminalWinModule(),
    centralPressureModule(),
    remoteContestModule(),
    developmentModule(),
    createRunnerExposeInformationModule(),
    runWindowModule(),
  ];
}
