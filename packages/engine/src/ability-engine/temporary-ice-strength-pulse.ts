/** Same capped temporary bonus for execution and Engine projections. */
export function temporaryIceStrengthPulseBonus(
  currentStrength: number,
  maxStrength: number,
): number {
  if (
    !Number.isSafeInteger(currentStrength) ||
    currentStrength < 0 ||
    !Number.isSafeInteger(maxStrength) ||
    maxStrength <= 0
  )
    throw new Error("temporary_ice_strength_pulse_strength_contract_invalid");
  return Math.max(
    0,
    Math.min(maxStrength, currentStrength * 2) - currentStrength,
  );
}
