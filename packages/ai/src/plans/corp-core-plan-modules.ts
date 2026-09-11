import { defenseModule } from "../corp/defense/defense-plan-module";
import { economyModule } from "../corp/economy/economy-plan-module";
import { scoreModule } from "../corp/score/score-plan-module";
import { remoteModule } from "../corp/scoring-remote/scoring-remote-plan-module";
import { type CorpExactIceRezRouteProjection } from "../runtime/corp-exact-ice-rez-route";
import type { PlanModule } from "./plan-scheduler";

export const CORP_CORE_ACTION_OWNERSHIP = {
  "install.agenda": "corp.score_agenda",
  "score.advance_card": "corp.score_agenda",
  "score.agenda": "corp.score_agenda",
  "install.ice": "corp.defend_servers",
  "economy.gain_credit": "corp.economy",
} as const;

export function createCorpCorePlanModules(): PlanModule[] {
  return [scoreModule(), remoteModule(), defenseModule(), economyModule()];
}

export function corpCoreActionOwner(
  semanticFamily: keyof typeof CORP_CORE_ACTION_OWNERSHIP,
): (typeof CORP_CORE_ACTION_OWNERSHIP)[typeof semanticFamily] {
  return CORP_CORE_ACTION_OWNERSHIP[semanticFamily];
}

export type { CorpRemoteProjectSignal } from "../corp/scoring-remote/scoring-remote-types";

export type { CorpExactIceRezRouteProjection };
