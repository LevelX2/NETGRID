import type { PublicGameEvent, ResolvedGameEffect, Side } from "@netgrid/shared";

export type ChronicleCategory = "turn" | "economy" | "card" | "run" | "agenda" | "danger" | "system" | "hidden";
export type ChronicleImportance = "normal" | "important" | "critical";
export type ChronicleVisibility = "public" | "side" | "redacted" | "system";

export type ChronicleContext = {
  side: Side;
  cardTitle?: string | null;
  cardText?: string | null;
  cardType?: string | null;
  cardDetailLines?: string[];
  agendaPoints?: number | null;
  turnNumber?: number | null;
};

export type ChronicleItem = {
  id: string;
  category: ChronicleCategory;
  importance: ChronicleImportance;
  visibility: ChronicleVisibility;
  actor?: Side;
  actionUse?: ChronicleActionUse;
  title: string;
  description?: string;
  chips: string[];
  cardDefinitionId?: string;
  cardTitle?: string;
  cardText?: string;
  cardDetailLines: string[];
  groupLabel: string;
};

export type ChronicleActionUse = {
  label: string;
  title: string;
  clicks: number;
  start: number;
  end: number;
};

export const CHRONICLE_CATEGORY_LABELS: Record<ChronicleCategory, string> = {
  turn: "Zug",
  economy: "Economy",
  card: "Karte",
  run: "Run",
  agenda: "Agenda",
  danger: "Gefahr",
  system: "System",
  hidden: "Verdeckt"
};

type EffectSummary = {
  category?: ChronicleCategory;
  suffix?: string;
  sentence?: string;
  chips: string[];
};

export function formatChronicleEvent(event: PublicGameEvent, side: Side, context: Omit<ChronicleContext, "side"> = {}): ChronicleItem {
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  const actor = sideValue(payload.actor);
  const amount = numberValue(payload.gainedCredits) ?? numberValue(payload.gainCreditsAmount) ?? numberValue(payload.amount);
  const serverLabel = displayServerLabel(stringValue(payload.serverLabel));
  const zoneLabel = stringValue(payload.zoneLabel);
  const result = stringValue(payload.result);
  const runPhase = stringValue(payload.runPhase);
  const encounterContinue = payload.encounterContinue === true;
  const redactedKind = stringValue(payload.redactedKind);
  const agendaPoints = numberValue(payload.agendaPoints) ?? context.agendaPoints;
  const turnNumber = positiveIntegerValue(context.turnNumber);
  const turnChip = turnLabel(actor, turnNumber);
  const actionUse = actionUseFromPayload(payload);
  const label = stringValue(payload.label);
  const explicitCardTitle = context.cardTitle ?? stringValue(payload.title);
  const labelCardTitle = extractCardTitleFromLabel(actionType, label, actor);
  const cardTitle = explicitCardTitle ?? labelCardTitle;
  const sourceDefinitionId = stringValue(payload.sourceDefinitionId);
  let cardDefinitionId = stringValue(payload.cardDefinitionId);
  const cardText = context.cardText ?? undefined;
  const isAi = Boolean(stringValue(payload.aiExplanation) || stringValue(payload.aiReasonCode));
  const subject = subjectFor(actor, side, isAi);
  const effect = summarizeEffect(cardText);
  const agendaAbility = stringValue(payload.agendaAbility);
  const hiddenZoneAction = stringValue(payload.hiddenZoneAction);
  const searchReveal = stringValue(payload.searchReveal);
  const searchDestination = stringValue(payload.searchDestination);

  const baseChipList = baseChips(actor, isAi);
  const cardDetailLines = context.cardDetailLines ?? [];
  let category: ChronicleCategory = effect.category ?? categoryFor(actionType);
  let importance: ChronicleImportance = "normal";
  let visibility: ChronicleVisibility = "public";
  let title = "";
  let description: string | undefined;
  const chips = [...baseChipList];

  switch (actionType) {
    case "game_created":
      category = "system";
      visibility = "system";
      title = "Das Spiel wurde erstellt.";
      chips.push("Spielstart");
      break;
    case "resolve_choice":
      if (payload.discardResolved === true) {
        category = "hidden";
        visibility = "redacted";
        title = phrase(subject, `${cardCountText(numberValue(payload.discardCount) ?? 0)} abgeworfen`);
        chips.push("Discard", stringValue(payload.discardZone) === "archives" ? "Archive" : "Heap");
        break;
      }
      if (payload.setupStep === "mulligan") {
        category = "system";
        visibility = "system";
        title = `${sideLabel(sideValue(payload.setupSide))} hat die Setup-Entscheidung abgeschlossen`;
        chips.push("Setup", "Starthand");
        break;
      }
      if (payload.traceStep === "corp_bid") {
        const corpBid = numberValue(payload.corpBid) ?? 0;
        const traceStrength = numberValue(payload.traceStrength);
        const runnerLink = numberValue(payload.runnerLink);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `im Trace ${creditText(corpBid)} geboten`);
        description = traceStrength !== undefined ? `Trace-Stärke: ${traceStrength}${runnerLink !== undefined ? `, Runner-Link: ${runnerLink}` : ""}.` : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Trace", `Korp-Gebot ${corpBid}`, ...(traceStrength !== undefined ? [`Trace ${traceStrength}`] : []), ...(runnerLink !== undefined ? [`Link ${runnerLink}`] : []));
        break;
      }
      if (payload.traceStep === "runner_bid") {
        const corpBid = numberValue(payload.corpBid) ?? 0;
        const runnerBid = numberValue(payload.runnerBid) ?? 0;
        const traceStrength = numberValue(payload.traceStrength);
        const runnerStrength = numberValue(payload.runnerStrength);
        const tagsAdded = numberValue(payload.tagsAdded) ?? 0;
        const successful = payload.traceSuccessful === true;
        category = "danger";
        importance = "important";
        visibility = "public";
        title = `Trace entschieden: ${traceParticipantLabel("corp", side)} ${creditText(corpBid)}, ${traceParticipantLabel("runner", side)} ${creditText(runnerBid)}; ${successful ? "Trace erfolgreich" : "Trace abgewehrt"}`;
        description = traceStrength !== undefined && runnerStrength !== undefined ? `Endstand: Trace ${traceStrength} gegen Runner-Stärke ${runnerStrength}.` : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Trace",
          `Korp ${corpBid}`,
          `Runner ${runnerBid}`,
          ...(traceStrength !== undefined && runnerStrength !== undefined ? [`${traceStrength}:${runnerStrength}`] : []),
          successful ? "Erfolg" : "Fehlschlag",
          ...(tagsAdded > 0 ? [`+${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`] : [])
        );
        break;
      }
      if (hiddenZoneAction === "search_stack") {
        const destinationLabel = searchDestinationLabel(searchDestination);
        category = searchReveal === "public" ? "card" : "hidden";
        importance = "important";
        visibility = searchReveal === "public" ? "public" : "redacted";
        title =
          searchReveal === "public"
            ? phrase(subject, `${cardTitle ?? "ein Programm"} aus dem Stack vorgezeigt und in ${destinationLabel} genommen`)
            : phrase(subject, `${cardCountText(numberValue(payload.selectedCount) ?? 1)} verdeckt aus dem Stack in ${destinationLabel} genommen`);
        chips.push("Stack", searchReveal === "public" ? "Vorgezeigt" : "Verdeckt", destinationLabel, ...(payload.searchShuffleAfter === true || payload.shuffled === true ? ["Shuffle"] : []));
        break;
      }
      category = "system";
      visibility = "system";
      title = phrase(subject, "eine Entscheidung beantwortet");
      chips.push("Choice");
      break;
    case "mandatory_draw":
      category = "turn";
      title = phrase(subject, `${possessiveFor(subject)} Pflichtkarte gezogen`);
      chips.push("Pflichtkarte", ...(turnChip ? [turnChip] : []));
      break;
    case "gain_credit":
      if (payload.traceStarted === true) {
        const baseTraceStrength = numberValue(payload.baseTraceStrength);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = traceStartTitle(subject, cardTitle, baseTraceStrength);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Trace", ...(baseTraceStrength !== undefined ? [`Base ${baseTraceStrength}`] : []));
        break;
      }
      if (agendaAbility === "corporate_coup" || agendaAbility === "political_coup") {
        const gainedCredits = amount ?? numberValue(payload.removePowerCounterAmount) ?? 0;
        const spentCredits = numberValue(payload.spentPowerCounters) ?? numberValue(payload.removePowerCounterAmount) ?? gainedCredits;
        const remainingCredits = numberValue(payload.remainingPowerCounters);
        category = "economy";
        importance = "important";
        title = phrase(subject, `${creditText(gainedCredits)} von ${cardTitle ?? "der Coup-Agenda"} genommen`);
        chips.push(`+${gainedCredits} ${creditLabel(gainedCredits)}`, `${spentCredits} ${creditLabel(spentCredits)} von Karte`, ...(remainingCredits !== undefined ? [`${remainingCredits} ${creditLabel(remainingCredits)} übrig`] : []));
        break;
      }
      if (agendaAbility) {
        category = agendaAbility.includes("trace") || agendaAbility.includes("solo") || agendaAbility.includes("kali") ? "danger" : "agenda";
        importance = "important";
        title = phrase(subject, `${cardTitle ?? "eine gescorte Agenda"} genutzt`);
        chips.push("Agenda-Aktion");
        break;
      }
      category = "economy";
      title = phrase(subject, `${creditText(amount ?? 1)} genommen`);
      chips.push(`+${amount ?? 1} ${creditLabel(amount ?? 1)}`);
      break;
    case "draw_card":
      category = "card";
      title = phrase(subject, `${cardCountText(amount ?? 1)} gezogen`);
      chips.push(amount && amount > 1 ? `${amount} Karten` : "Karte ziehen");
      break;
    case "install_card":
      if (actor === "corp" && (redactedKind || !cardTitle)) {
        category = "hidden";
        visibility = "redacted";
        title = phrase(subject, `eine verdeckte Karte${installLocation(serverLabel, zoneLabel, label)} installiert`);
        chips.push("Verdeckt", installAreaFromPayload(serverLabel, zoneLabel, label));
      } else {
        category = "card";
        title = phrase(subject, `${cardTitle ?? "eine Karte"}${installDestinationForTitle(actor, serverLabel, zoneLabel, label)} installiert`);
        chips.push("Install", installAreaFromPayload(serverLabel, zoneLabel, label));
      }
      break;
    case "play_event":
    case "play_operation":
      if (payload.traceStarted === true) {
        const baseTraceStrength = numberValue(payload.baseTraceStrength);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = traceStartTitle(subject, cardTitle, baseTraceStrength);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Trace", ...(baseTraceStrength !== undefined ? [`Base ${baseTraceStrength}`] : []), actionType === "play_event" ? "Event" : "Operation");
        break;
      }
      title = phrase(subject, `${cardTitle ?? "eine Karte"} gespielt${effect.suffix ? ` und ${effect.suffix}` : ""}`);
      chips.push(actionType === "play_event" ? "Event" : "Operation", ...effect.chips);
      break;
    case "advance_card":
      category = "hidden";
      visibility = actor === "corp" && (redactedKind || !cardTitle) ? "redacted" : "public";
      title = phrase(subject, advanceTitlePart(cardTitle, context.cardType, serverLabel, visibility === "redacted"));
      chips.push("+1 Entwicklung", ...(serverLabel ? [serverLabel] : []), ...(visibility === "redacted" ? ["Verdeckt"] : []));
      break;
    case "score_agenda": {
      category = "agenda";
      importance = "important";
      const points = agendaPointSuffix(agendaPoints);
      title = phrase(subject, `${cardTitle ?? "eine Agenda"} gescored${points}`);
      chips.push("Score", ...agendaPointChips(agendaPoints));
      break;
    }
    case "start_run": {
      category = "run";
      importance = "important";
      const target = serverLabel ?? runTargetFromLabel(label);
      title = phrase(subject, `einen Run auf ${target} gestartet`);
      chips.push("Run", target);
      break;
    }
    case "rez_ice":
      category = context.cardType === "asset" || context.cardType === "upgrade" ? "card" : "run";
      title = phrase(subject, `${cardTitle ?? "eine Karte"} gerezzt${rezSuffix(context.cardType, effect)}`);
      chips.push("Rez", ...effect.chips);
      if (context.cardType === "ice" || cardTitle?.includes("ICE")) chips.push("Begegnung");
      break;
    case "decline_rez":
      category = "run";
      title = phrase(subject, "nicht gerezzt. Der Run geht weiter");
      chips.push("Run", "Kein Rez");
      break;
    case "pump_breaker":
      category = "run";
      title = phrase(subject, `${cardTitle ?? "einen Icebreaker"} gepumpt`);
      chips.push("Breaker", "+Stärke");
      break;
    case "break_subroutine":
      category = "run";
      title = phrase(subject, "eine Subroutine gebrochen");
      chips.push("Subroutine", "Gebrochen");
      break;
    case "continue_run":
      if (payload.traceStarted === true) {
        const baseTraceStrength = numberValue(payload.baseTraceStrength);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = traceStartTitle(subject, cardTitle, baseTraceStrength);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Trace", ...(baseTraceStrength !== undefined ? [`Base ${baseTraceStrength}`] : []));
        break;
      }
      category = "run";
      title = encounterContinue
        ? phrase(subject, result === "ended" ? "ungebrochene Subroutinen ausgelöst und der Run endete" : "ungebrochene Subroutinen ausgelöst")
        : phrase(subject, result === "ended" ? "den Run beendet" : "den Run fortgesetzt");
      chips.push("Run", ...(encounterContinue ? ["Subroutinen"] : runPhase ? [runPhaseLabel(runPhase)] : []));
      break;
    case "access_card":
      category = "run";
      importance = "important";
      title = phrase(subject, `auf ${cardTitle ?? "eine Karte"} zugegriffen`);
      chips.push("Zugriff", ...(serverLabel ? [serverLabel] : []));
      break;
    case "steal_agenda": {
      category = "agenda";
      importance = "critical";
      const points = agendaPointSuffix(agendaPoints);
      title = phrase(subject, `${cardTitle ?? "eine Agenda"} gestohlen${points}`);
      chips.push("Steal", ...agendaPointChips(agendaPoints));
      break;
    }
    case "trash_accessed_card":
      category = "card";
      importance = "important";
      title = phrase(subject, `${cardTitle ?? "die zugegriffene Karte"} getrasht`);
      chips.push("Trash");
      break;
    case "trash_resource":
      category = "danger";
      importance = "important";
      title = phrase(subject, `${cardTitle ?? "eine Resource"} getrasht`);
      chips.push("Resource", "Trash");
      break;
    case "decline_trash":
      category = "run";
      title = phrase(subject, "den Zugriff abgeschlossen");
      chips.push("Zugriff");
      break;
    case "remove_tag":
      category = "danger";
      importance = "important";
      title = phrase(subject, "einen Tag entfernt");
      chips.push("Tag entfernt");
      break;
    case "move_to_set_aside":
      category = "card";
      importance = "important";
      title = phrase(subject, `${cardTitle ?? "eine Karte"} in Set Aside bewegt`);
      chips.push("Set Aside");
      break;
    case "move_to_removed_from_game":
      category = "danger";
      importance = "important";
      title = phrase(subject, `${cardTitle ?? "eine Karte"} aus dem Spiel entfernt`);
      chips.push("Removed");
      break;
    case "return_from_set_aside":
      category = "card";
      title = phrase(subject, `${cardTitle ?? "eine Karte"} aus Set Aside zurückgeholt`);
      chips.push("Set Aside");
      break;
    case "change_card_control":
      category = "card";
      importance = "important";
      title = phrase(subject, `die Kontrolle von ${cardTitle ?? "einer Karte"} geändert`);
      chips.push("Kontrolle");
      break;
    case "trigger_ability": {
      const resourceAbility = stringValue(payload.resourceAbility);
      if (resourceAbility === "broker_load_credits") {
        const addedCredits = numberValue(payload.addedCounterAmount) ?? numberValue(payload.addCounterAmount) ?? 3;
        category = "economy";
        title = phrase(subject, `${creditText(addedCredits)} auf ${cardTitle ?? "Broker"} gelegt`);
        break;
      }
      if (resourceAbility === "broker_take_credits") {
        const gainedCredits = numberValue(payload.gainedCredits) ?? numberValue(payload.gainCreditsAmount) ?? amount ?? 0;
        category = "economy";
        title = phrase(subject, `${creditText(gainedCredits)} von ${cardTitle ?? "Broker"} genommen`);
        break;
      }
      category = "card";
      title = phrase(subject, `${cardTitle ?? "eine Kartenfähigkeit"} aktiviert`);
      chips.push("Kartenaktion");
      break;
    }
    case "end_turn":
      category = "turn";
      title = phrase(subject, `den Zug beendet${turnChip ? ` (${turnChip})` : ""}`);
      chips.push("Zugende", ...(turnChip ? [turnChip] : []));
      break;
    default:
      category = "system";
      visibility = "system";
      title = actor ? phrase(subject, "eine legale Aktion ausgeführt") : "Das Spiel hat einen Systemschritt ausgeführt.";
      chips.push("Aktion");
      if (!description && label) description = `Hinweis: ${safeLabel(label)}`;
      break;
  }

  if (effect.sentence && !description) description = effect.sentence;

  return {
    id: event.eventId,
    category,
    importance,
    visibility,
    ...(actor ? { actor } : {}),
    ...(actionUse ? { actionUse } : {}),
    title: ensurePeriod(title),
    ...(description ? { description: ensurePeriod(description) } : {}),
    chips: uniqueChips(chips.filter(Boolean)),
    ...(cardDefinitionId && visibility !== "redacted" ? { cardDefinitionId } : {}),
    ...(cardTitle && visibility !== "redacted" ? { cardTitle } : {}),
    ...(cardText && visibility !== "redacted" ? { cardText } : {}),
    cardDetailLines: visibility === "redacted" ? [] : cardDetailLines,
    groupLabel: groupLabelFor(category, actor, label, serverLabel, turnNumber)
  };
}

export function formatChronicleEffectItems(event: PublicGameEvent, side: Side): ChronicleItem[] {
  return resolvedEffectsFromPayload(event.publicPayload.resolvedEffects).map((effect, index) => formatChronicleEffect(event, effect, index, side));
}

function formatChronicleEffect(event: PublicGameEvent, effect: ResolvedGameEffect, index: number, side: Side): ChronicleItem {
  const actor = sideValue(effect.side);
  const subject = subjectFor(actor, side, false);
  const sourceTitle = stringValue(effect.sourceTitle);
  const sourceDefinitionId = stringValue(effect.sourceDefinitionId);
  const cardTitle = stringValue(effect.cardTitle);
  const amount = numberValue(effect.amount) ?? 0;
  const chips = [...baseChips(actor, false)];
  let category: ChronicleCategory = "system";
  let importance: ChronicleImportance = "normal";
  let visibility: ChronicleVisibility = effect.visibility === "public" ? "public" : effect.visibility === "private_to_side" ? "side" : "redacted";
  let title = "Ein automatischer Effekt wurde aufgelöst";
  const through = sourceTitle ? ` durch ${sourceTitle}` : "";

  switch (effect.kind) {
    case "gain_credits":
      category = "economy";
      title = phrase(subject, `${creditText(amount)}${through} erhalten`);
      chips.push(`+${amount} Credit${amount === 1 ? "" : "s"}`, "Automatisch");
      break;
    case "draw_cards":
      category = "card";
      title = phrase(subject, `${cardCountText(amount)}${through} gezogen`);
      chips.push(amount === 1 ? "Karte ziehen" : `${amount} Karten`, "Automatisch");
      break;
    case "rez_card":
      category = "card";
      importance = effect.reason === "region_install" || effect.reason === "on_score" ? "important" : "normal";
      title = `${cardTitle ?? sourceTitle ?? "Eine Karte"} wurde${effect.reason === "region_install" ? " sofort" : ""} gerezzt`;
      chips.push("Rez", "Automatisch");
      break;
    case "trash_card":
      category = "card";
      importance = "important";
      title = `${cardTitle ?? "Eine Karte"} wurde${through} getrasht`;
      chips.push("Trash", effect.reason === "region_limit" ? "Region" : "Automatisch");
      break;
    case "purge_counters":
      category = "danger";
      importance = "important";
      title = phrase(subject, `${amount} ${counterLabel(effect.counterType)} entfernt`);
      chips.push("Purge", counterLabel(effect.counterType));
      break;
    case "gain_actions":
      category = "turn";
      title = phrase(subject, `${amount} zusätzliche Aktion${amount === 1 ? "" : "en"}${through} erhalten`);
      chips.push(`+${amount} Aktion${amount === 1 ? "" : "en"}`);
      break;
    case "add_tags":
      category = "danger";
      importance = "important";
      title = phrase(subject, `${amount} Tag${amount === 1 ? "" : "s"}${through} erhalten`);
      chips.push(`+${amount} Tag${amount === 1 ? "" : "s"}`);
      break;
    case "remove_tags":
      category = "danger";
      title = phrase(subject, `${amount} Tag${amount === 1 ? "" : "s"} entfernt`);
      chips.push("Tag entfernt");
      break;
    case "bad_publicity":
      category = "danger";
      importance = "important";
      title = phrase(subject, `${amount} Bad Publicity${through} erhalten`);
      chips.push(`+${amount} Bad Publicity`);
      break;
    case "damage":
      category = "danger";
      importance = "critical";
      title = phrase(subject, `${amount} Schaden${through} erlitten`);
      chips.push("Schaden");
      break;
  }

  return {
    id: `${event.eventId}:effect:${effect.effectId || index}`,
    category,
    importance,
    visibility,
    ...(actor ? { actor } : {}),
    title: ensurePeriod(title),
    chips: uniqueChips(chips.filter(Boolean)),
    ...(sourceDefinitionId && visibility !== "redacted" ? { cardDefinitionId: sourceDefinitionId } : {}),
    ...(sourceTitle && visibility !== "redacted" ? { cardTitle: sourceTitle } : {}),
    cardDetailLines: [],
    groupLabel: groupLabelFor(category, actor, undefined, displayServerLabel(effect.serverLabel), undefined)
  };
}

function actionUseFromPayload(payload: Record<string, unknown>): ChronicleActionUse | undefined {
  const clicks = positiveIntegerValue(payload.actionCostClicks);
  const start = positiveIntegerValue(payload.turnActionOrdinalStart);
  const end = positiveIntegerValue(payload.turnActionOrdinalEnd) ?? start;
  if (!clicks || !start || !end) return undefined;
  const label = start === end ? String(start) : `${start}-${end}`;
  const title = start === end ? `${start}. Aktion in diesem Zug` : `Aktionen ${start} bis ${end} in diesem Zug`;
  return { label, title, clicks, start, end };
}

export function chronicleGroupLabel(item: ChronicleItem): string {
  return item.groupLabel;
}

function categoryFor(actionType: string): ChronicleCategory {
  if (["mandatory_draw", "end_turn"].includes(actionType)) return "turn";
  if (["gain_credit"].includes(actionType)) return "economy";
  if (["start_run", "rez_ice", "decline_rez", "pump_breaker", "break_subroutine", "continue_run", "access_card", "decline_trash"].includes(actionType)) return "run";
  if (["score_agenda", "steal_agenda"].includes(actionType)) return "agenda";
  if (["remove_tag"].includes(actionType)) return "danger";
  if (["game_created"].includes(actionType)) return "system";
  return "card";
}

function subjectFor(actor: Side | undefined, side: Side, isAi: boolean): string {
  if (!actor) return "Das Spiel";
  if (actor === side) return "Du";
  if (actor === "corp") return isAi ? "Die Korp-KI" : "Die Korp";
  return isAi ? "Die Runner-KI" : "Der Runner";
}

function possessiveFor(subject: string): string {
  if (subject === "Du") return "deine";
  if (subject === "Die Korp" || subject.endsWith("-KI")) return "ihre";
  if (subject === "Der Runner") return "seine";
  return "die";
}

function phrase(subject: string, action: string): string {
  return `${subject} ${subject === "Du" ? "hast" : "hat"} ${action}`;
}

function baseChips(actor: Side | undefined, isAi: boolean): string[] {
  const chips: string[] = [];
  if (actor) chips.push(actor === "corp" ? "Korp" : "Runner");
  if (isAi) chips.push("KI");
  return chips;
}

function summarizeEffect(cardText: string | undefined): EffectSummary {
  if (!cardText) return { chips: [] };
  const gain = cardText.match(/Erhalte\s+(\d+)\s+Credits/i);
  if (gain) return { category: "economy", suffix: "Credits erhalten", chips: [`+${gain[1]} Credits`] };
  const draw = cardText.match(/Ziehe\s+(\d+)\s+Karten/i);
  if (draw) return { category: "card", suffix: "Karten gezogen", chips: [`${draw[1]} Karten`] };
  const lose = cardText.match(/Runner verliert\s+(\d+)\s+Credits/i);
  if (lose) return { category: "danger", sentence: `Der Runner verliert bis zu ${lose[1]} Credits.`, chips: [`-${lose[1]} Runner-Credits`] };
  const tag = cardText.match(/Gib dem Runner\s+(\d+)\s+Tag/i);
  if (tag) return { category: "danger", sentence: `Der Runner erhält ${tag[1]} Tag.`, chips: [`+${tag[1]} Tag`] };
  const coreDamage = cardText.match(/(\d+)\s+Core Damage/i);
  if (coreDamage) return { category: "danger", sentence: `Der Runner erleidet ${coreDamage[1]} Core Damage.`, chips: [`${coreDamage[1]} Core`] };
  if (/Run auf einen Server/i.test(cardText)) return { category: "run", suffix: "Run-Druck aufgebaut", chips: ["Run"] };
  return { chips: [] };
}

function rezSuffix(cardType: string | null | undefined, effect: EffectSummary): string {
  if (effect.suffix) return ` und ${effect.suffix}`;
  if (cardType === "ice") return ". Die Begegnung beginnt";
  return "";
}

function creditText(amount: number): string {
  return `${amount} ${creditLabel(amount)}`;
}

function creditLabel(amount: number): string {
  return amount === 1 ? "Credit" : "Credits";
}

function traceParticipantLabel(participant: Side, viewer: Side): string {
  if (participant === viewer) return "Du";
  return participant === "corp" ? "Korp" : "Runner";
}

function traceStartTitle(subject: string, cardTitle: string | undefined, baseTraceStrength: number | undefined): string {
  return phrase(subject, `${cardTitle ? `mit ${cardTitle} ` : ""}einen Trace${baseTraceStrength !== undefined ? ` ${baseTraceStrength}` : ""} ausgelöst`);
}

function cardCountText(amount: number): string {
  return amount === 1 ? "eine Karte" : `${amount} Karten`;
}

function searchDestinationLabel(destination: string | undefined): string {
  if (destination === "grip") return "den Grip";
  return "die Hand";
}

function installLocation(serverLabel: string | undefined, zoneLabel: string | undefined, label: string | undefined): string {
  if (serverLabel) return zoneLabel === "ICE" ? ` vor ${serverLabel}` : ` in ${serverLabel}`;
  if (zoneLabel === "Rig") return " im Rig";
  if (zoneLabel === "Resource") return " als Resource";
  const area = installAreaFromLabel(label);
  if (area === "Fort") return " in einem Fort";
  if (area === "ICE") return " als ICE";
  return "";
}

function installDestinationForTitle(actor: Side | undefined, serverLabel: string | undefined, zoneLabel: string | undefined, label: string | undefined): string {
  if (zoneLabel === "Resource") return " als Resource";
  if (actor === "runner" || zoneLabel === "Rig") return " im Rig";
  return installLocation(serverLabel, zoneLabel, label);
}

function installAreaFromPayload(serverLabel: string | undefined, zoneLabel: string | undefined, label: string | undefined): string {
  if (zoneLabel) return zoneLabel;
  if (serverLabel) return /Fort/.test(serverLabel) ? "Fort" : serverLabel;
  return installAreaFromLabel(label);
}

function installAreaFromLabel(label: string | undefined): string {
  if (!label) return "Installation";
  if (/ice|vor/i.test(label)) return "ICE";
  if (/remote|außenserver|aussenserver|fort/i.test(label)) return "Fort";
  return "Installation";
}

function advanceTitlePart(cardTitle: string | undefined, cardType: string | null | undefined, serverLabel: string | undefined, redacted: boolean): string {
  if (redacted || !cardTitle) return `eine Installation${serverLabel ? ` in ${serverLabel}` : ""} ausgebaut`;
  if (cardType === "agenda") return `das Projekt ${cardTitle} weiterentwickelt`;
  if (cardType === "asset") return `die Anlage ${cardTitle} ausgebaut`;
  if (cardType === "upgrade") return `das Upgrade ${cardTitle} ausgebaut`;
  return `${cardTitle} weiterentwickelt`;
}

function displayServerLabel(label: string | undefined): string | undefined {
  if (!label) return undefined;
  return label.replace(/\bRemote\s+(\d+)\b/g, "Fort $1").replace(/\bneuem Remote\b/g, "neuem Fort");
}

function runTargetFromLabel(label: string | undefined): string {
  const match = label?.match(/Run auf (.+)$/i);
  return match?.[1]?.trim() || "einen Server";
}

function extractCardTitleFromLabel(actionType: string, label: string | undefined, actor: Side | undefined): string | undefined {
  if (!label || (actor === "corp" && ["install_card", "advance_card"].includes(actionType))) return undefined;
  const patterns: RegExp[] = [];
  if (["install_card", "play_event", "play_operation", "rez_ice", "pump_breaker", "trash_accessed_card", "trash_resource", "steal_agenda"].includes(actionType)) {
    patterns.push(/^(.+?)\s+(?:installieren|spielen|rezzen|pumpen|trashen|stehlen)$/i);
    patterns.push(/^(.+?)\s+auf\s+.+$/i);
  }
  for (const pattern of patterns) {
    const match = label.match(pattern);
    const title = match?.[1]?.trim();
    if (title && !isGenericCardLabel(title)) return title;
  }
  return undefined;
}

function isGenericCardLabel(value: string): boolean {
  return /^(karte|eine karte|agenda|corp|runner|run|nicht)$/i.test(value);
}

function runPhaseLabel(phase: string): string {
  const labels: Record<string, string> = {
    approach_ice: "Annäherung",
    encounter_ice: "Begegnung",
    break: "Brechen",
    access: "Zugriff",
    complete: "Abschluss"
  };
  return labels[phase] ?? phase;
}

function groupLabelFor(category: ChronicleCategory, actor: Side | undefined, label: string | undefined, serverLabel: string | undefined, turnNumber?: number): string {
  if (category === "system") return "System";
  if (category === "run") return `Run${serverLabel ? ` auf ${serverLabel}` : label && /Run auf/i.test(label) ? ` auf ${runTargetFromLabel(label)}` : ""}`;
  if (category === "turn" && actor === "corp") return turnNumber ? `Korp-Zug ${turnNumber}` : "Korp-Zug";
  if (category === "turn" && actor === "runner") return turnNumber ? `Runner-Zug ${turnNumber}` : "Runner-Zug";
  if (actor === "corp") return "Korp-Zug";
  if (actor === "runner") return "Runner-Zug";
  return "Spiel";
}

function turnLabel(side: Side | undefined, turnNumber: number | undefined): string | undefined {
  if (!side || !turnNumber) return undefined;
  return `${side === "corp" ? "Korpzug" : "Runnerzug"} ${turnNumber}`;
}

function agendaPointSuffix(points: number | null | undefined): string {
  return typeof points === "number" ? ` und ${points} Agenda-Punkte erhalten` : "";
}

function agendaPointChips(points: number | null | undefined): string[] {
  return typeof points === "number" ? [`+${points} Agenda`] : [];
}

function safeLabel(label: string): string {
  return label.replace(/\b[a-z]+_[a-z0-9_.-]+/gi, "Aktion");
}

function ensurePeriod(value: string): string {
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function uniqueChips(chips: string[]): string[] {
  return Array.from(new Set(chips));
}

function resolvedEffectsFromPayload(value: unknown): ResolvedGameEffect[] {
  if (!Array.isArray(value)) return [];
  return value.filter((effect): effect is ResolvedGameEffect => {
    if (!effect || typeof effect !== "object") return false;
    const candidate = effect as Partial<ResolvedGameEffect>;
    return typeof candidate.effectId === "string" && typeof candidate.kind === "string" && typeof candidate.visibility === "string";
  });
}

function counterLabel(counterType: unknown): string {
  return counterType === "virus" ? "Virus-Counter" : "Counter";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function positiveIntegerValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}

function sideLabel(side: Side | undefined): string {
  if (side === "corp") return "Korp";
  if (side === "runner") return "Runner";
  return "Eine Seite";
}
