import { isCanonicalCapabilityId, type CanonicalCapabilityId } from "@netgrid/shared";
import type { LegalAction } from "../lib/presented-player-view";

import type { AppLocale } from "./locale";

type TranslatedCapabilityActionLocale = Exclude<AppLocale, "de">;

export type CardCapabilityActionTranslationCatalog = Readonly<
  Partial<Record<CanonicalCapabilityId, string>>
>;

const EN_CARD_CAPABILITY_ACTION_TRANSLATIONS = {
  4:
    "Data Fort Remapping: End the run",
  36:
    "Sterdroid: double ICE strength",
  37:
    "Sterdroid: double ICE strength",
  71:
    "Protected Resources: deposit credits",
  72:
    "Protected Resources: withdraw credits",
  104: "Choose X for rez",
  103: "Deal 2 net damage",
  102: "End the run",
  167:
    "Rez LDL Traffic Analyzers during the trace",
  168:
    "LDL Traffic Analyzers: spend 1 advancement counter for 5 temporary credits",
  187: "Select ICE",
  185:
    "Break sentry subroutine",
  186: "+1 strength",
  208:
    "Choose breaker subtype",
  206:
    "Change breaker subtype",
  205:
    "Break a subroutine of the selected subtype",
  207: "+1 strength",
  251:
    "Back Door to Rivals: use base link 2",
  252:
    "Back Door to Rivals: +1 link",
  259: "Deck, The: use base link 5",
  260: "Deck, The: +1 link",
  268:
    "Runner Sensei: use base link 4",
  269:
    "Runner Sensei: +1 link",
  273:
    "Swiss Bank Account: take 2 credits",
  272:
    "Swiss Bank Account: take 6 credits",
  278:
    "Baedeker’s Net Map: use base link 1",
  279:
    "Baedeker’s Net Map: +1 link",
  280:
    "Bakdoor™: use base link 3",
  281:
    "Bakdoor™: +1 link",
  431:
    "Access to Arasaka: use base link 4",
  432:
    "Access to Arasaka: +1 link",
  433:
    "Access to Kiribati: use base link 1",
  434:
    "Access to Kiribati: +1 link",
  436:
    "Back Door to Hilliard: use base link 2",
  437:
    "Back Door to Hilliard: +1 link",
  438:
    "Back Door to Orbital Air: use base link 2",
  439:
    "Back Door to Orbital Air: +1 link",
  440: "Broker: place 3 credits on Broker",
  441: "Broker: take all credits from Broker",
  462:
    "Ronin Around: search the top of the Stack for hardware",
  461:
    "Ronin Around: expose an installed Corp card",
  469:
    "Submarine Uplink: use base link 4",
  470:
    "Submarine Uplink: +1 link",
  641:
    "Department of Truth Enhancement: place 3 credits on this card",
  642:
    "Department of Truth Enhancement: take all hosted credits",
  665:
    "Vapor Ops: spend 1 advancement counter for 1 credit",
  666:
    "Vapor Ops: move an advancement counter",
} as const satisfies CardCapabilityActionTranslationCatalog;

const FR_CARD_CAPABILITY_ACTION_TRANSLATIONS = {
  4:
    "Data Fort Remapping : Mettre fin au piratage",
  36:
    "Sterdroid : doubler la force de la glace",
  37:
    "Sterdroid : doubler la force de la glace",
  71:
    "Protected Resources : déposer des crédits",
  72:
    "Protected Resources : retirer des crédits",
  104: "Choisir X pour le rezzage",
  103: "Infliger 2 dégâts réseau",
  102: "Mettre fin au piratage",
  167:
    "Rezzer LDL Traffic Analyzers pendant la Trace",
  168:
    "LDL Traffic Analyzers : dépenser 1 pion Avancement pour 5 crédits temporaires",
  187: "Choisir une glace",
  185:
    "Neutraliser une routine de sentinelle",
  186: "+1 force",
  208:
    "Choisir un sous-type de brise-glace",
  206:
    "Changer le sous-type de brise-glace",
  205:
    "Neutraliser une routine du sous-type choisi",
  207: "+1 force",
  251:
    "Back Door to Rivals : utiliser le Link de base 2",
  252:
    "Back Door to Rivals : +1 Link",
  259:
    "Deck, The : utiliser le Link de base 5",
  260:
    "Deck, The : +1 Link",
  268:
    "Runner Sensei : utiliser le Link de base 4",
  269:
    "Runner Sensei : +1 Link",
  273:
    "Swiss Bank Account : prendre 2 crédits",
  272:
    "Swiss Bank Account : prendre 6 crédits",
  278:
    "Baedeker’s Net Map : utiliser le Link de base 1",
  279:
    "Baedeker’s Net Map : +1 Link",
  280:
    "Bakdoor™ : utiliser le Link de base 3",
  281:
    "Bakdoor™ : +1 Link",
  431:
    "Access to Arasaka : utiliser le Link de base 4",
  432:
    "Access to Arasaka : +1 Link",
  433:
    "Access to Kiribati : utiliser le Link de base 1",
  434:
    "Access to Kiribati : +1 Link",
  436:
    "Back Door to Hilliard : utiliser le Link de base 2",
  437:
    "Back Door to Hilliard : +1 Link",
  438:
    "Back Door to Orbital Air : utiliser le Link de base 2",
  439:
    "Back Door to Orbital Air : +1 Link",
  440: "Broker : placer 3 crédits sur Broker",
  441:
    "Broker : prendre tous les crédits de Broker",
  462:
    "Ronin Around : chercher un matériel au sommet de la pile",
  461:
    "Ronin Around : exposer une carte Corpo installée",
  469:
    "Submarine Uplink : utiliser le Link de base 4",
  470:
    "Submarine Uplink : +1 Link",
  641:
    "Department of Truth Enhancement : placer 3 crédits sur cette carte",
  642:
    "Department of Truth Enhancement : prendre tous les crédits hébergés",
  665:
    "Vapor Ops : dépenser 1 pion Avancement pour 1 crédit",
  666:
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
): CanonicalCapabilityId | null {
  const abilityRefId = action.abilityRef?.sourceAbilityId;
  const payloadId = action.payload?.cardImplementationAbilityId;
  if (
    (abilityRefId !== undefined && !isCanonicalCapabilityId(abilityRefId)) ||
    (payloadId !== undefined && !isCanonicalCapabilityId(payloadId))
  ) {
    return null;
  }
  if (
    isCanonicalCapabilityId(abilityRefId) &&
    isCanonicalCapabilityId(payloadId) &&
    abilityRefId !== payloadId
  ) {
    return null;
  }
  return abilityRefId ?? payloadId ?? null;
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
