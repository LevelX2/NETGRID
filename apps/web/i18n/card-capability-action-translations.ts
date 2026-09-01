import type { LegalAction } from "@netgrid/shared";

import type { AppLocale } from "./locale";

type TranslatedCapabilityActionLocale = Exclude<AppLocale, "de">;

export type CardCapabilityActionTranslationCatalog = Readonly<
  Record<string, string>
>;

const EN_CARD_CAPABILITY_ACTION_TRANSLATIONS = {
  "onr_classic_024_sterdroid:corp_main_double_chosen_ice_strength":
    "Sterdroid: double ICE strength",
  "onr_classic_024_sterdroid:during_run_double_chosen_ice_strength":
    "Sterdroid: double ICE strength",
  "onr_classic_053_protected-resources:deposit_hosted_credits":
    "Protected Resources: deposit credits",
  "onr_classic_053_protected-resources:withdraw_hosted_credits":
    "Protected Resources: withdraw credits",
  "onr_proteus_020_digiconda:variable_rez_x": "Choose X for rez",
  "onr_proteus_020_digiconda:net_damage_subroutine": "Deal 2 net damage",
  "onr_proteus_020_digiconda:end_the_run_subroutine": "End the run",
  "onr_proteus_061_ldl-traffic-analyzers:self_rez_during_trace_attempt":
    "Rez LDL Traffic Analyzers during the trace",
  "onr_proteus_061_ldl-traffic-analyzers:trace_window_spend_advancement_for_trace_credits":
    "LDL Traffic Analyzers: spend 1 advancement counter for 5 temporary credits",
  "onr_proteus_080_black-widow:select_ice_target": "Select ICE",
  "onr_proteus_080_black-widow:break_sentry_subroutine":
    "Break sentry subroutine",
  "onr_proteus_080_black-widow:increase_strength": "+1 strength",
  "onr_proteus_092_morphing-tool:select_breaker_subtype":
    "Choose breaker subtype",
  "onr_proteus_092_morphing-tool:change_breaker_subtype":
    "Change breaker subtype",
  "onr_proteus_092_morphing-tool:break_selected_subtype":
    "Break a subroutine of the selected subtype",
  "onr_proteus_092_morphing-tool:increase_strength": "+1 strength",
  "onr_proteus_130_back-door-to-rivals:trace_base_link_two":
    "Back Door to Rivals: use base link 2",
  "onr_proteus_130_back-door-to-rivals:trace_post_bid_link_plus_one":
    "Back Door to Rivals: +1 link",
  "onr_proteus_138_deck-the:trace_base_link_five": "Deck, The: use base link 5",
  "onr_proteus_138_deck-the:trace_post_bid_link_plus_one": "Deck, The: +1 link",
  "onr_proteus_148_runner-sensei:trace_base_link_four":
    "Runner Sensei: use base link 4",
  "onr_proteus_148_runner-sensei:trace_post_bid_link_plus_one":
    "Runner Sensei: +1 link",
  "onr_proteus_152_swiss-bank-account:trash_source_gain_two_credits":
    "Swiss Bank Account: take 2 credits",
  "onr_proteus_152_swiss-bank-account:pay_three_trash_source_gain_six":
    "Swiss Bank Account: take 6 credits",
  "onr_v1_003_baedekers-net-map:abilities_activated_trace_base_link_window_use_base_link":
    "Baedeker’s Net Map: use base link 1",
  "onr_v1_003_baedekers-net-map:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Baedeker’s Net Map: +1 link",
  "onr_v1_004_bakdoor:abilities_activated_trace_base_link_window_use_base_link":
    "Bakdoor™: use base link 3",
  "onr_v1_004_bakdoor:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Bakdoor™: +1 link",
  "onr_v1_149_access-to-arasaka:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Arasaka: use base link 4",
  "onr_v1_149_access-to-arasaka:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Arasaka: +1 link",
  "onr_v1_150_access-to-kiribati:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Kiribati: use base link 1",
  "onr_v1_150_access-to-kiribati:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Kiribati: +1 link",
  "onr_v1_152_back-door-to-hilliard:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Hilliard: use base link 2",
  "onr_v1_152_back-door-to-hilliard:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Hilliard: +1 link",
  "onr_v1_153_back-door-to-orbital-air:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Orbital Air: use base link 2",
  "onr_v1_153_back-door-to-orbital-air:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Orbital Air: +1 link",
  "onr_v1_154_broker:store_credits": "Broker: place 3 credits on Broker",
  "onr_v1_154_broker:withdraw_credits": "Broker: take all credits from Broker",
  "onr_v1_175_ronin-around:abilities_activated_runner_main_look_top_stack_take_matching":
    "Ronin Around: search the top of the Stack for hardware",
  "onr_v1_175_ronin-around:abilities_activated_runner_main_expose_installed_card":
    "Ronin Around: expose an installed Corp card",
  "onr_v1_182_submarine-uplink:abilities_activated_trace_base_link_window_use_base_link":
    "Submarine Uplink: use base link 4",
  "onr_v1_182_submarine-uplink:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Submarine Uplink: +1 link",
  "onr_v1_318_department-of-truth-enhancement:abilities_activated_corp_main_add_hosted_credits":
    "Department of Truth Enhancement: place 3 credits on this card",
  "onr_v1_318_department-of-truth-enhancement:abilities_activated_corp_main_take_hosted_credits":
    "Department of Truth Enhancement: take all hosted credits",
  "onr_v1_347_vapor-ops:abilities_activated_corp_main_gain_credits":
    "Vapor Ops: spend 1 advancement counter for 1 credit",
  "onr_v1_347_vapor-ops:abilities_activated_corp_main_move_advancement_counters":
    "Vapor Ops: move an advancement counter",
} as const satisfies CardCapabilityActionTranslationCatalog;

const FR_CARD_CAPABILITY_ACTION_TRANSLATIONS = {
  "onr_classic_024_sterdroid:corp_main_double_chosen_ice_strength":
    "Sterdroid : doubler la force de la glace",
  "onr_classic_024_sterdroid:during_run_double_chosen_ice_strength":
    "Sterdroid : doubler la force de la glace",
  "onr_classic_053_protected-resources:deposit_hosted_credits":
    "Protected Resources : déposer des crédits",
  "onr_classic_053_protected-resources:withdraw_hosted_credits":
    "Protected Resources : retirer des crédits",
  "onr_proteus_020_digiconda:variable_rez_x": "Choisir X pour le rezzage",
  "onr_proteus_020_digiconda:net_damage_subroutine": "Infliger 2 dégâts réseau",
  "onr_proteus_020_digiconda:end_the_run_subroutine": "Mettre fin au piratage",
  "onr_proteus_061_ldl-traffic-analyzers:self_rez_during_trace_attempt":
    "Rezzer LDL Traffic Analyzers pendant la Trace",
  "onr_proteus_061_ldl-traffic-analyzers:trace_window_spend_advancement_for_trace_credits":
    "LDL Traffic Analyzers : dépenser 1 pion Avancement pour 5 crédits temporaires",
  "onr_proteus_080_black-widow:select_ice_target": "Choisir une glace",
  "onr_proteus_080_black-widow:break_sentry_subroutine":
    "Neutraliser une routine de sentinelle",
  "onr_proteus_080_black-widow:increase_strength": "+1 force",
  "onr_proteus_092_morphing-tool:select_breaker_subtype":
    "Choisir un sous-type de brise-glace",
  "onr_proteus_092_morphing-tool:change_breaker_subtype":
    "Changer le sous-type de brise-glace",
  "onr_proteus_092_morphing-tool:break_selected_subtype":
    "Neutraliser une routine du sous-type choisi",
  "onr_proteus_092_morphing-tool:increase_strength": "+1 force",
  "onr_proteus_130_back-door-to-rivals:trace_base_link_two":
    "Back Door to Rivals : utiliser le Link de base 2",
  "onr_proteus_130_back-door-to-rivals:trace_post_bid_link_plus_one":
    "Back Door to Rivals : +1 Link",
  "onr_proteus_138_deck-the:trace_base_link_five":
    "Deck, The : utiliser le Link de base 5",
  "onr_proteus_138_deck-the:trace_post_bid_link_plus_one":
    "Deck, The : +1 Link",
  "onr_proteus_148_runner-sensei:trace_base_link_four":
    "Runner Sensei : utiliser le Link de base 4",
  "onr_proteus_148_runner-sensei:trace_post_bid_link_plus_one":
    "Runner Sensei : +1 Link",
  "onr_proteus_152_swiss-bank-account:trash_source_gain_two_credits":
    "Swiss Bank Account : prendre 2 crédits",
  "onr_proteus_152_swiss-bank-account:pay_three_trash_source_gain_six":
    "Swiss Bank Account : prendre 6 crédits",
  "onr_v1_003_baedekers-net-map:abilities_activated_trace_base_link_window_use_base_link":
    "Baedeker’s Net Map : utiliser le Link de base 1",
  "onr_v1_003_baedekers-net-map:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Baedeker’s Net Map : +1 Link",
  "onr_v1_004_bakdoor:abilities_activated_trace_base_link_window_use_base_link":
    "Bakdoor™ : utiliser le Link de base 3",
  "onr_v1_004_bakdoor:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Bakdoor™ : +1 Link",
  "onr_v1_149_access-to-arasaka:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Arasaka : utiliser le Link de base 4",
  "onr_v1_149_access-to-arasaka:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Arasaka : +1 Link",
  "onr_v1_150_access-to-kiribati:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Kiribati : utiliser le Link de base 1",
  "onr_v1_150_access-to-kiribati:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Kiribati : +1 Link",
  "onr_v1_152_back-door-to-hilliard:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Hilliard : utiliser le Link de base 2",
  "onr_v1_152_back-door-to-hilliard:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Hilliard : +1 Link",
  "onr_v1_153_back-door-to-orbital-air:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Orbital Air : utiliser le Link de base 2",
  "onr_v1_153_back-door-to-orbital-air:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Orbital Air : +1 Link",
  "onr_v1_154_broker:store_credits": "Broker : placer 3 crédits sur Broker",
  "onr_v1_154_broker:withdraw_credits":
    "Broker : prendre tous les crédits de Broker",
  "onr_v1_175_ronin-around:abilities_activated_runner_main_look_top_stack_take_matching":
    "Ronin Around : chercher un matériel au sommet de la pile",
  "onr_v1_175_ronin-around:abilities_activated_runner_main_expose_installed_card":
    "Ronin Around : exposer une carte Corpo installée",
  "onr_v1_182_submarine-uplink:abilities_activated_trace_base_link_window_use_base_link":
    "Submarine Uplink : utiliser le Link de base 4",
  "onr_v1_182_submarine-uplink:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Submarine Uplink : +1 Link",
  "onr_v1_318_department-of-truth-enhancement:abilities_activated_corp_main_add_hosted_credits":
    "Department of Truth Enhancement : placer 3 crédits sur cette carte",
  "onr_v1_318_department-of-truth-enhancement:abilities_activated_corp_main_take_hosted_credits":
    "Department of Truth Enhancement : prendre tous les crédits hébergés",
  "onr_v1_347_vapor-ops:abilities_activated_corp_main_gain_credits":
    "Vapor Ops : dépenser 1 pion Avancement pour 1 crédit",
  "onr_v1_347_vapor-ops:abilities_activated_corp_main_move_advancement_counters":
    "Vapor Ops : déplacer un pion Avancement",
} as const satisfies CardCapabilityActionTranslationCatalog;

export const CARD_CAPABILITY_ACTION_TRANSLATION_CATALOGS: Readonly<
  Record<
    TranslatedCapabilityActionLocale,
    CardCapabilityActionTranslationCatalog
  >
> = {
  en: EN_CARD_CAPABILITY_ACTION_TRANSLATIONS,
  fr: FR_CARD_CAPABILITY_ACTION_TRANSLATIONS,
};

export function cardCapabilityIdForAction(
  action: Pick<LegalAction, "abilityRef" | "payload">,
): string | null {
  const abilityRefId = action.abilityRef?.sourceAbilityId;
  const payloadId = action.payload?.cardImplementationAbilityId;
  if (
    typeof abilityRefId === "string" &&
    typeof payloadId === "string" &&
    abilityRefId !== payloadId
  ) {
    return null;
  }
  if (typeof abilityRefId === "string" && abilityRefId.length > 0)
    return abilityRefId;
  return typeof payloadId === "string" && payloadId.length > 0
    ? payloadId
    : null;
}

export function localizedCardCapabilityActionLabel(
  action: Pick<LegalAction, "abilityRef" | "payload">,
  locale: TranslatedCapabilityActionLocale,
): string | null {
  const capabilityId = cardCapabilityIdForAction(action);
  return capabilityId
    ? (CARD_CAPABILITY_ACTION_TRANSLATION_CATALOGS[locale][capabilityId] ??
        null)
    : null;
}
