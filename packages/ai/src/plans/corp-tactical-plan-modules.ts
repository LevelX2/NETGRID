import { ambushModule } from "../corp/ambush/ambush-plan-module";
import { handModule } from "../corp/hand-management/hand-management-plan-module";
import { punishCampaignModule } from "../corp/punish/punish-campaign-plan-module";
import { punishSequenceModule } from "../corp/punish/punish-sequence-plan-module";
import { createCorpVirusPressureModule } from "../corp/virus-pressure/virus-pressure-plan-module";
import type { PlanModule } from "./plan-scheduler";
export function createCorpTacticalPlanModules(): PlanModule[] {
  return [
    createCorpVirusPressureModule(),
    punishCampaignModule(),
    punishSequenceModule(),
    ambushModule(),
    handModule(),
  ];
}
