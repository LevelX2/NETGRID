export const LOCAL_CARD_IMAGE_VERSION = "2026-05-23-local-onr-assets-3";

export const GENERATED_CARD_IMAGES: Record<string, string> = {
  corp_identity_001: "generated-identities/corp_identity_001.png",
  efficient_fracter: "generated-icebreakers/efficient_fracter.png",
  runner_identity_001: "generated-identities/runner_identity_001.png",
  simple_agenda: "generated-agendas/simple_agenda.png",
  simple_barrier_ice: "generated-ice/simple_barrier_ice.png",
  simple_code_gate_ice: "generated-ice/simple_code_gate_ice.png",
  simple_decoder: "generated-icebreakers/simple_decoder.png",
  simple_draw_event: "generated-events/simple_draw_event.png",
  simple_draw_operation: "generated-operations/simple_draw_operation.png",
  simple_economy_asset: "generated-assets/simple_economy_asset.png",
  simple_economy_event: "generated-events/simple_economy_event.png",
  simple_economy_operation: "generated-operations/simple_economy_operation.png",
  simple_fracter: "generated-icebreakers/simple_fracter.png",
  simple_killer: "generated-icebreakers/simple_killer.png",
  simple_priority_agenda: "generated-agendas/simple_priority_agenda.png",
  simple_run_event: "generated-events/simple_run_event.png",
  simple_sentry_ice: "generated-ice/simple_sentry_ice.png",
  simple_setup_hardware: "generated-hardware/simple_setup_hardware.png",
  simple_tag_ice: "generated-ice/simple_tag_ice.png",
  simple_tag_punishment_operation: "generated-operations/simple_tag_punishment_operation.png",
  simple_taxing_barrier_ice: "generated-ice/simple_taxing_barrier_ice.png",
  simple_upgrade: "generated-assets/simple_upgrade.png",
  v08_adaptive_killer: "generated-icebreakers/v08_adaptive_killer.png",
  v08_archive_planning_operation: "generated-operations/v08_archive_planning_operation.png",
  v08_burst_credit_event: "generated-events/v08_burst_credit_event.png",
  v08_cashout_asset: "generated-assets/v08_cashout_asset.png",
  v08_credit_surge_operation: "generated-operations/v08_credit_surge_operation.png",
  v08_deep_draw_event: "generated-events/v08_deep_draw_event.png",
  v08_gate_ice: "generated-ice/v08_gate_ice.png",
  v08_memory_chip: "generated-hardware/v08_memory_chip.png",
  v08_overclock_run_event: "generated-events/v08_overclock_run_event.png",
  v08_precise_decoder: "generated-icebreakers/v08_precise_decoder.png",
  v08_project_agenda: "generated-agendas/v08_project_agenda.png",
  v08_steady_fracter: "generated-icebreakers/v08_steady_fracter.png",
  v08_wall_ice: "generated-ice/v08_wall_ice.png",
  v08_watchdog_ice: "generated-ice/v08_watchdog_ice.png",
  v094_neural_sentry_ice: "generated-ice/v094_neural_sentry_ice.png"
};

const GENERATED_CARD_IMAGE_IDS = new Set(Object.keys(GENERATED_CARD_IMAGES));

export function isGeneratedCardImageId(cardId: string | undefined | null): cardId is string {
  return typeof cardId === "string" && GENERATED_CARD_IMAGE_IDS.has(cardId);
}

export function isLocalOnrCardId(cardId: string | undefined | null): cardId is string {
  return typeof cardId === "string" && (cardId.startsWith("onr_v1_") || cardId.startsWith("onr_proteus_") || cardId.startsWith("onr_classic_"));
}
