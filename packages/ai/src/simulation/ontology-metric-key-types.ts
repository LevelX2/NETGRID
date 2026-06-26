export type BreakerOntologyCoverageMetricKey =
  | "breakerOntologyCoverageWall"
  | "breakerOntologyCoverageSentry"
  | "breakerOntologyCoverageCodeGate"
  | "breakerOntologyCoverageAp"
  | "breakerOntologyCoverageTrace"
  | "breakerOntologyCoverageWatchdog"
  | "breakerOntologyCoverageBlackIce"
  | "breakerOntologyCoverageUniversal"
  | "breakerOntologyCoverageUnknownSpecial";

export const BREAKER_ONTOLOGY_COVERAGE_METRIC_KEYS: Record<
  string,
  BreakerOntologyCoverageMetricKey
> = {
  wall: "breakerOntologyCoverageWall",
  sentry: "breakerOntologyCoverageSentry",
  code_gate: "breakerOntologyCoverageCodeGate",
  ap: "breakerOntologyCoverageAp",
  trace: "breakerOntologyCoverageTrace",
  watchdog: "breakerOntologyCoverageWatchdog",
  black_ice: "breakerOntologyCoverageBlackIce",
  universal: "breakerOntologyCoverageUniversal",
  unknown_special: "breakerOntologyCoverageUnknownSpecial",
};

export type RemoteRoleKindMetricKey =
  | "remoteRoleKindScoringProtection"
  | "remoteRoleKindAgendaStealTax"
  | "remoteRoleKindRunTax"
  | "remoteRoleKindRemoteCapacity"
  | "remoteRoleKindAssetEconomy"
  | "remoteRoleKindBait"
  | "remoteRoleKindAmbush"
  | "remoteRoleKindIceModifier"
  | "remoteRoleKindTaxFort";

export const REMOTE_ROLE_KIND_METRIC_KEYS: Record<
  string,
  RemoteRoleKindMetricKey
> = {
  scoring_protection: "remoteRoleKindScoringProtection",
  agenda_steal_tax: "remoteRoleKindAgendaStealTax",
  run_tax: "remoteRoleKindRunTax",
  remote_capacity: "remoteRoleKindRemoteCapacity",
  asset_economy: "remoteRoleKindAssetEconomy",
  bait: "remoteRoleKindBait",
  ambush: "remoteRoleKindAmbush",
  ice_modifier: "remoteRoleKindIceModifier",
  tax_fort: "remoteRoleKindTaxFort",
};

export type RemoteRoleServerScopeMetricKey =
  | "remoteRoleServerScopeFort"
  | "remoteRoleServerScopeRemote"
  | "remoteRoleServerScopeCentral"
  | "remoteRoleServerScopeServer";

export const REMOTE_ROLE_SERVER_SCOPE_METRIC_KEYS: Record<
  string,
  RemoteRoleServerScopeMetricKey
> = {
  fort: "remoteRoleServerScopeFort",
  remote: "remoteRoleServerScopeRemote",
  central: "remoteRoleServerScopeCentral",
  server: "remoteRoleServerScopeServer",
};
