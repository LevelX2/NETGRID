// These keys are still emitted by current LegalAction producers. Their versioned
// names identify the implementation family that owns the action; they are not a
// compatibility registry. New generic mechanics should prefer `abilityId` and
// only add a discriminator when execution dispatch genuinely needs one.
export const ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS = [
  "v1911HiddenZoneAbility",
  "v1912CounterAbility",
  "v1915RunnerProgramAbility",
  "v1917AssetAbility",
  "v1918UpgradeAbility",
  "v1919OperationAbility",
  "v1919RunnerEventAbility",
  "v1919RunnerProgramAbility",
  "v1920AssetAbility",
  "v1920RunnerRunLockAbility",
  "v1921AssetAbility",
  "v1921RunnerEventAbility",
  "v1921RunnerProgramAbility",
  "v1921RunnerResourceAbility",
  "v1921UpgradeAbility",
  "v1922CorpIceAbility",
  "v1922CorpOperationAbility",
  "v1922RunnerEventAbility",
  "v1922RunnerHardwareAbility",
  "v1922RunnerProgramAbility",
  "v1951CorpUtilityAbility",
  "agendaAbility",
  "resourceAbility",
  "runnerAbility",
  "delayedInstallAbility",
  "obligationDebtAbility",
] as const;

export type AbilityPayloadDiscriminatorField =
  (typeof ABILITY_PAYLOAD_DISCRIMINATOR_FIELDS)[number];

export type AbilityPayloadDiscriminators = Partial<
  Record<AbilityPayloadDiscriminatorField, string>
>;
