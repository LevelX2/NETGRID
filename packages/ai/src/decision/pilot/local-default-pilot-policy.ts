import {
  BASIC_SETUP_PILOT_MODE,
  type AiPlayStrengthPilotScope,
} from "./pilot-scope-common";

export const AI_PLAY_STRENGTH_LOCAL_DEFAULT_ENV =
  "NETGRID_AI_PLAY_STRENGTH_LOCAL_DEFAULT";

export function localDefaultPilotScopes(params: {
  explicitPilotEnv: string | undefined;
  localDefaultEnv: string | undefined;
}): AiPlayStrengthPilotScope[] {
  if (params.explicitPilotEnv?.trim()) return [];
  if (params.localDefaultEnv?.trim() !== BASIC_SETUP_PILOT_MODE) return [];
  return [BASIC_SETUP_PILOT_MODE];
}
