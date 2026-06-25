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

export type RemoteRoleServerScopeMetricKey =
  | "remoteRoleServerScopeFort"
  | "remoteRoleServerScopeRemote"
  | "remoteRoleServerScopeCentral"
  | "remoteRoleServerScopeServer";
