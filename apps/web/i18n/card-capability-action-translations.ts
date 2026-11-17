import type { LegalAction } from "@netgrid/shared";

import type { AppLocale } from "./locale";

type TranslatedCapabilityActionLocale = Exclude<AppLocale, "de">;

export type CardCapabilityActionTranslationCatalog = Readonly<
  Record<string, string>
>;

const EN_CARD_CAPABILITY_ACTION_TRANSLATIONS = {
  "5:spend_remap_counter_end_run":
    "Data Fort Remapping: End the run",
  "28:corp_main_double_chosen_ice_strength":
    "Sterdroid: double ICE strength",
  "28:during_run_double_chosen_ice_strength":
    "Sterdroid: double ICE strength",
  "57:deposit_hosted_credits":
    "Protected Resources: deposit credits",
  "57:withdraw_hosted_credits":
    "Protected Resources: withdraw credits",
  "78:variable_rez_x": "Choose X for rez",
  "78:net_damage_subroutine": "Deal 2 net damage",
  "78:end_the_run_subroutine": "End the run",
  "119:self_rez_during_trace_attempt":
    "Rez LDL Traffic Analyzers during the trace",
  "119:trace_window_spend_advancement_for_trace_credits":
    "LDL Traffic Analyzers: spend 1 advancement counter for 5 temporary credits",
  "138:select_ice_target": "Select ICE",
  "138:break_sentry_subroutine":
    "Break sentry subroutine",
  "138:increase_strength": "+1 strength",
  "150:select_breaker_subtype":
    "Choose breaker subtype",
  "150:change_breaker_subtype":
    "Change breaker subtype",
  "150:break_selected_subtype":
    "Break a subroutine of the selected subtype",
  "150:increase_strength": "+1 strength",
  "188:trace_base_link_two":
    "Back Door to Rivals: use base link 2",
  "188:trace_post_bid_link_plus_one":
    "Back Door to Rivals: +1 link",
  "196:trace_base_link_five": "Deck, The: use base link 5",
  "196:trace_post_bid_link_plus_one": "Deck, The: +1 link",
  "206:trace_base_link_four":
    "Runner Sensei: use base link 4",
  "206:trace_post_bid_link_plus_one":
    "Runner Sensei: +1 link",
  "210:trash_source_gain_two_credits":
    "Swiss Bank Account: take 2 credits",
  "210:pay_three_trash_source_gain_six":
    "Swiss Bank Account: take 6 credits",
  "215:abilities_activated_trace_base_link_window_use_base_link":
    "Baedeker’s Net Map: use base link 1",
  "215:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Baedeker’s Net Map: +1 link",
  "216:abilities_activated_trace_base_link_window_use_base_link":
    "Bakdoor™: use base link 3",
  "216:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Bakdoor™: +1 link",
  "361:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Arasaka: use base link 4",
  "361:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Arasaka: +1 link",
  "362:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Kiribati: use base link 1",
  "362:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Kiribati: +1 link",
  "364:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Hilliard: use base link 2",
  "364:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Hilliard: +1 link",
  "365:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Orbital Air: use base link 2",
  "365:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Orbital Air: +1 link",
  "366:store_credits": "Broker: place 3 credits on Broker",
  "366:withdraw_credits": "Broker: take all credits from Broker",
  "387:abilities_activated_runner_main_look_top_stack_take_matching":
    "Ronin Around: search the top of the Stack for hardware",
  "387:abilities_activated_runner_main_expose_installed_card":
    "Ronin Around: expose an installed Corp card",
  "394:abilities_activated_trace_base_link_window_use_base_link":
    "Submarine Uplink: use base link 4",
  "394:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Submarine Uplink: +1 link",
  "530:abilities_activated_corp_main_add_hosted_credits":
    "Department of Truth Enhancement: place 3 credits on this card",
  "530:abilities_activated_corp_main_take_hosted_credits":
    "Department of Truth Enhancement: take all hosted credits",
  "559:abilities_activated_corp_main_gain_credits":
    "Vapor Ops: spend 1 advancement counter for 1 credit",
  "559:abilities_activated_corp_main_move_advancement_counters":
    "Vapor Ops: move an advancement counter",
} as const satisfies CardCapabilityActionTranslationCatalog;

const FR_CARD_CAPABILITY_ACTION_TRANSLATIONS = {
  "5:spend_remap_counter_end_run":
    "Data Fort Remapping : Mettre fin au piratage",
  "28:corp_main_double_chosen_ice_strength":
    "Sterdroid : doubler la force de la glace",
  "28:during_run_double_chosen_ice_strength":
    "Sterdroid : doubler la force de la glace",
  "57:deposit_hosted_credits":
    "Protected Resources : déposer des crédits",
  "57:withdraw_hosted_credits":
    "Protected Resources : retirer des crédits",
  "78:variable_rez_x": "Choisir X pour le rezzage",
  "78:net_damage_subroutine": "Infliger 2 dégâts réseau",
  "78:end_the_run_subroutine": "Mettre fin au piratage",
  "119:self_rez_during_trace_attempt":
    "Rezzer LDL Traffic Analyzers pendant la Trace",
  "119:trace_window_spend_advancement_for_trace_credits":
    "LDL Traffic Analyzers : dépenser 1 pion Avancement pour 5 crédits temporaires",
  "138:select_ice_target": "Choisir une glace",
  "138:break_sentry_subroutine":
    "Neutraliser une routine de sentinelle",
  "138:increase_strength": "+1 force",
  "150:select_breaker_subtype":
    "Choisir un sous-type de brise-glace",
  "150:change_breaker_subtype":
    "Changer le sous-type de brise-glace",
  "150:break_selected_subtype":
    "Neutraliser une routine du sous-type choisi",
  "150:increase_strength": "+1 force",
  "188:trace_base_link_two":
    "Back Door to Rivals : utiliser le Link de base 2",
  "188:trace_post_bid_link_plus_one":
    "Back Door to Rivals : +1 Link",
  "196:trace_base_link_five":
    "Deck, The : utiliser le Link de base 5",
  "196:trace_post_bid_link_plus_one":
    "Deck, The : +1 Link",
  "206:trace_base_link_four":
    "Runner Sensei : utiliser le Link de base 4",
  "206:trace_post_bid_link_plus_one":
    "Runner Sensei : +1 Link",
  "210:trash_source_gain_two_credits":
    "Swiss Bank Account : prendre 2 crédits",
  "210:pay_three_trash_source_gain_six":
    "Swiss Bank Account : prendre 6 crédits",
  "215:abilities_activated_trace_base_link_window_use_base_link":
    "Baedeker’s Net Map : utiliser le Link de base 1",
  "215:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Baedeker’s Net Map : +1 Link",
  "216:abilities_activated_trace_base_link_window_use_base_link":
    "Bakdoor™ : utiliser le Link de base 3",
  "216:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Bakdoor™ : +1 Link",
  "361:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Arasaka : utiliser le Link de base 4",
  "361:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Arasaka : +1 Link",
  "362:abilities_activated_trace_base_link_window_use_base_link":
    "Access to Kiribati : utiliser le Link de base 1",
  "362:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Access to Kiribati : +1 Link",
  "364:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Hilliard : utiliser le Link de base 2",
  "364:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Hilliard : +1 Link",
  "365:abilities_activated_trace_base_link_window_use_base_link":
    "Back Door to Orbital Air : utiliser le Link de base 2",
  "365:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Back Door to Orbital Air : +1 Link",
  "366:store_credits": "Broker : placer 3 crédits sur Broker",
  "366:withdraw_credits":
    "Broker : prendre tous les crédits de Broker",
  "387:abilities_activated_runner_main_look_top_stack_take_matching":
    "Ronin Around : chercher un matériel au sommet de la pile",
  "387:abilities_activated_runner_main_expose_installed_card":
    "Ronin Around : exposer une carte Corpo installée",
  "394:abilities_activated_trace_base_link_window_use_base_link":
    "Submarine Uplink : utiliser le Link de base 4",
  "394:abilities_activated_trace_post_bid_link_window_increase_trace_link":
    "Submarine Uplink : +1 Link",
  "530:abilities_activated_corp_main_add_hosted_credits":
    "Department of Truth Enhancement : placer 3 crédits sur cette carte",
  "530:abilities_activated_corp_main_take_hosted_credits":
    "Department of Truth Enhancement : prendre tous les crédits hébergés",
  "559:abilities_activated_corp_main_gain_credits":
    "Vapor Ops : dépenser 1 pion Avancement pour 1 crédit",
  "559:abilities_activated_corp_main_move_advancement_counters":
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
