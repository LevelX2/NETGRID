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
