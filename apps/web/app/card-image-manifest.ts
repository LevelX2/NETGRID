import { isCardDefinitionId, type CardDefinitionId } from "@netgrid/shared";
import { localizedDeCardSkinData as localizedDeCardSkin } from "@netgrid/runtime-data/display-assets";

export const LOCAL_CARD_IMAGE_VERSION = "2026-05-23-local-onr-assets-3";
export const LOCALIZED_DE_CARD_IMAGE_VERSION =
  "2026-05-24-localized-de-assets-1";

const GENERATED_CARD_IMAGE_ENTRIES = [
  [3, "corp_identity_001", "generated-identities/corp_identity_001.png"],
  [4, "efficient_fracter", "generated-icebreakers/efficient_fracter.png"],
  [587, "runner_identity_001", "generated-identities/runner_identity_001.png"],
  [588, "simple_agenda", "generated-agendas/simple_agenda.png"],
  [589, "simple_barrier_ice", "generated-ice/simple_barrier_ice.png"],
  [590, "simple_code_gate_ice", "generated-ice/simple_code_gate_ice.png"],
  [591, "simple_decoder", "generated-icebreakers/simple_decoder.png"],
  [592, "simple_draw_event", "generated-events/simple_draw_event.png"],
  [593, "simple_draw_operation", "generated-operations/simple_draw_operation.png"],
  [594, "simple_economy_asset", "generated-assets/simple_economy_asset.png"],
  [595, "simple_economy_event", "generated-events/simple_economy_event.png"],
  [596, "simple_economy_operation", "generated-operations/simple_economy_operation.png"],
  [597, "simple_fracter", "generated-icebreakers/simple_fracter.png"],
  [598, "simple_killer", "generated-icebreakers/simple_killer.png"],
  [599, "simple_priority_agenda", "generated-agendas/simple_priority_agenda.png"],
  [600, "simple_run_event", "generated-events/simple_run_event.png"],
  [601, "simple_sentry_ice", "generated-ice/simple_sentry_ice.png"],
  [602, "simple_setup_hardware", "generated-hardware/simple_setup_hardware.png"],
  [603, "simple_tag_ice", "generated-ice/simple_tag_ice.png"],
  [604, "simple_tag_punishment_operation", "generated-operations/simple_tag_punishment_operation.png"],
  [605, "simple_taxing_barrier_ice", "generated-ice/simple_taxing_barrier_ice.png"],
  [606, "simple_upgrade", "generated-assets/simple_upgrade.png"],
  [607, "v08_adaptive_killer", "generated-icebreakers/v08_adaptive_killer.png"],
  [608, "v08_archive_planning_operation", "generated-operations/v08_archive_planning_operation.png"],
  [609, "v08_burst_credit_event", "generated-events/v08_burst_credit_event.png"],
  [610, "v08_cashout_asset", "generated-assets/v08_cashout_asset.png"],
  [611, "v08_credit_surge_operation", "generated-operations/v08_credit_surge_operation.png"],
  [612, "v08_deep_draw_event", "generated-events/v08_deep_draw_event.png"],
  [613, "v08_gate_ice", "generated-ice/v08_gate_ice.png"],
  [614, "v08_memory_chip", "generated-hardware/v08_memory_chip.png"],
  [615, "v08_overclock_run_event", "generated-events/v08_overclock_run_event.png"],
  [616, "v08_precise_decoder", "generated-icebreakers/v08_precise_decoder.png"],
  [617, "v08_project_agenda", "generated-agendas/v08_project_agenda.png"],
  [618, "v08_steady_fracter", "generated-icebreakers/v08_steady_fracter.png"],
  [619, "v08_wall_ice", "generated-ice/v08_wall_ice.png"],
  [620, "v08_watchdog_ice", "generated-ice/v08_watchdog_ice.png"],
] as const;

export const GENERATED_CARD_IMAGES: Readonly<Record<string, string>> = Object.fromEntries(
  GENERATED_CARD_IMAGE_ENTRIES.map(([, printingId, asset]) => [printingId, asset]),
);

export const LOCALIZED_DE_CARD_IMAGES: Record<string, string> =
  localizedDeCardImages();
export const LOCALIZED_DE_CARD_TITLES: Record<string, string> =
  localizedDeCardTitles();

const GENERATED_CARD_IMAGE_IDS = new Set<CardDefinitionId>(
  GENERATED_CARD_IMAGE_ENTRIES.map(([id]) => id),
);
const LOCALIZED_DE_CARD_IMAGE_IDS = new Set(
  localizedDeCardSkin.cards
    .filter((card) => card.displayOnly && card.rendered.full)
    .map((card) => card.cardId),
);

export function isGeneratedCardImageId(
  cardId: CardDefinitionId | undefined | null,
): cardId is CardDefinitionId {
  return isCardDefinitionId(cardId) && GENERATED_CARD_IMAGE_IDS.has(cardId);
}

export function isLocalizedDeCardImageId(
  cardId: CardDefinitionId | undefined | null,
): cardId is CardDefinitionId {
  return isCardDefinitionId(cardId) && LOCALIZED_DE_CARD_IMAGE_IDS.has(cardId);
}

export function localizedDeCardImagePath(
  cardId: string | undefined | null,
): string | undefined {
  if (typeof cardId !== "string") return undefined;
  return LOCALIZED_DE_CARD_IMAGES[cardId];
}

export function localizedDeCardTitle(
  cardId: CardDefinitionId | undefined | null,
): string | undefined {
  if (!isCardDefinitionId(cardId)) return undefined;
  return LOCALIZED_DE_CARD_TITLES[cardId];
}

type LocalizedDeCardSkin = {
  cards?: Array<{
    cardId?: unknown;
    printingId?: unknown;
    displayOnly?: unknown;
    localizedTitle?: unknown;
    rendered?: {
      full?: unknown;
    };
  }>;
};

function localizedDeCardImages(): Record<string, string> {
  const skin = localizedDeCardSkin as LocalizedDeCardSkin;
  const entries: Array<[string, string]> = [];
  for (const card of skin.cards ?? []) {
    if (
      typeof card.printingId !== "string" ||
      card.displayOnly !== true ||
      typeof card.rendered?.full !== "string"
    )
      continue;
    entries.push([card.printingId, card.rendered.full]);
  }
  return Object.fromEntries(entries);
}

function localizedDeCardTitles(): Record<string, string> {
  const skin = localizedDeCardSkin as LocalizedDeCardSkin;
  const entries: Array<[string, string]> = [];
  for (const card of skin.cards ?? []) {
    if (
      !isCardDefinitionId(card.cardId) ||
      card.displayOnly !== true ||
      typeof card.localizedTitle !== "string"
    )
      continue;
    entries.push([String(card.cardId), card.localizedTitle]);
  }
  return Object.fromEntries(entries);
}
