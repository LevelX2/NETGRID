import { type AiDecisionInput } from "@netgrid/shared";

export function runnerHasInstalledPrograms(input: AiDecisionInput): boolean {
  const rig = input.playerView.own.rig;
  if (!rig) return false;
  if (!Array.isArray(rig)) return false;
  return rig.some((card) => card.type === "program");
}
