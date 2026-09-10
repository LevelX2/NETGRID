import type { DamageImpactCue } from "../../app/action-cues";

export type DamageImpactMeterUnit = {
  kind: "lost" | "remaining" | "flatline" | "overkill" | "unknown";
};

export function damageImpactMeterUnits(
  cue: Pick<
    DamageImpactCue,
    "amount" | "flatline" | "runnerGripBefore" | "runnerGripAfter"
  >,
): DamageImpactMeterUnit[] {
  const gripBefore = cue.runnerGripBefore;
  if (gripBefore === undefined) {
    const fallbackCount = Math.max(1, cue.amount);
    return [
      ...Array.from({ length: fallbackCount }, () => ({
        kind: "unknown" as const,
      })),
      { kind: "flatline" },
    ];
  }

  const gripAfter = cue.runnerGripAfter ?? Math.max(0, gripBefore - cue.amount);
  const lost = Math.max(0, Math.min(gripBefore, gripBefore - gripAfter));
  const remaining = Math.max(0, gripBefore - lost);
  const overkill = cue.flatline ? Math.max(0, cue.amount - gripBefore) : 0;

  return [
    ...Array.from({ length: lost }, () => ({ kind: "lost" as const })),
    ...Array.from({ length: remaining }, () => ({
      kind: "remaining" as const,
    })),
    { kind: "flatline" },
    ...Array.from({ length: overkill }, () => ({
      kind: "overkill" as const,
    })),
  ];
}
