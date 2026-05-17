import type { PublicGameEvent, ResolvedGameEffect, Side } from "@netgrid/shared";
import {
  isDataFortReclamationInstallPayload,
  isDataFortReclamationRezPayload,
  isExposeOutermostIceEachDataFortPayload,
  isExposeServerCardPayload,
  isSecurityPurgePayload,
  payloadAbilityId,
  payloadRandomRoll,
} from "./action-payload";

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
  const selectedServerLabel = displayServerLabel(stringValue(payload.selectedServerLabel));
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
  let cardTitle = explicitCardTitle ?? labelCardTitle;
  const sourceDefinitionId = stringValue(payload.sourceDefinitionId);
  const sourceTitle = stringValue(payload.sourceTitle);
  let cardDefinitionId = stringValue(payload.cardDefinitionId);
  const cardText = context.cardText ?? undefined;
  const isAi = Boolean(stringValue(payload.aiExplanation) || stringValue(payload.aiReasonCode));
  const subject = subjectFor(actor, side, isAi);
  const effect = summarizeEffect(cardText);
  const mergedPlayEffect = simpleMergedPlayEffect(event);
  const agendaAbility = stringValue(payload.agendaAbility);
  const hiddenZoneAction = stringValue(payload.hiddenZoneAction);
  const abilityId = payloadAbilityId(payload);
  const searchReveal = stringValue(payload.searchReveal);
  const searchDestination = stringValue(payload.searchDestination);
  const shellTradersAbility = stringValue(payload.shellTradersAbility);
  const v1922RunnerProgramAbility = stringValue(payload.v1922RunnerProgramAbility);

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
      if (shellTradersAbility === "auto_install_after_memory_choice") {
        category = "card";
        importance = "important";
        title = phrase(subject, `${cardTitle ?? "eine Karte"} durch The Shell Traders kostenlos installiert`);
        chips.push("The Shell Traders", "Installiert", "0 Kosten");
        break;
      }
      if (abilityId === "playful_ai_dice_loop") {
        const gainedCredits = numberValue(payload.playfulAiGainedCredits) ?? 0;
        const setAsideDice = numberValue(payload.playfulAiSetAsideDice) ?? 0;
        const lastRoll = payloadRandomRoll(payload);
        const dieRolls = numberArrayValue(payload.playfulAiDieRolls);
        const queuedBeforeRolls = numberValue(payload.playfulAiDiceQueuedBeforeRolls);
        const remainingDice = numberValue(payload.playfulAiRemainingDice) ?? numberValue(payload.playfulAiDiceQueuedAfterRolls);
        const choiceOpened = payload.playfulAiChoiceOpened === true;
        const complete = payload.playfulAiComplete === true;
        category = gainedCredits > 0 ? "economy" : "card";
        visibility = "public";
        title = phrase(subject, `Playful AI aufgelöst: ${creditText(gainedCredits)} genommen${setAsideDice > 0 ? ` und ${setAsideDice} ${dieText(setAsideDice)} beiseitegelegt` : ""}`);
        description = playfulAiResolveDescription(dieRolls, queuedBeforeRolls, remainingDice, choiceOpened, complete);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Playful AI",
          `+${gainedCredits} ${creditLabel(gainedCredits)}`,
          ...(setAsideDice > 0 ? [`${setAsideDice} beiseite`] : []),
          ...playfulAiRollChips(dieRolls, lastRoll),
          ...(choiceOpened && remainingDice !== undefined ? [`${remainingDice} offen`] : [])
        );
        break;
      }
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
        const hackerTrackerCountersSpent = numberValue(payload.hackerTrackerCountersSpent) ?? 0;
        const traceStrength = numberValue(payload.traceStrength);
        const runnerLink = numberValue(payload.runnerLink);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `im Trace ${creditText(corpBid)} geboten`);
        description = traceStrength !== undefined ? `Trace-Stärke: ${traceStrength}${runnerLink !== undefined ? `, Runner-Link: ${runnerLink}` : ""}${hackerTrackerCountersSpent > 0 ? `; ${hackerTrackerCountersSpent} Hacker-Tracker-Counter eingesetzt` : ""}.` : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Trace", `Korp-Gebot ${corpBid}`, ...(hackerTrackerCountersSpent > 0 ? [`HTC -${hackerTrackerCountersSpent}`] : []), ...(traceStrength !== undefined ? [`Trace ${traceStrength}`] : []), ...(runnerLink !== undefined ? [`Link ${runnerLink}`] : []));
        break;
      }
      if (payload.traceStep === "runner_bid") {
        const corpBid = numberValue(payload.corpBid) ?? 0;
        const runnerBid = numberValue(payload.runnerBid) ?? 0;
        const traceStrength = numberValue(payload.traceStrength);
        const runnerStrength = numberValue(payload.runnerStrength);
        const tagsAdded = numberValue(payload.tagsAdded) ?? 0;
        const hackerTrackerCountersAdded = numberValue(payload.hackerTrackerCountersAdded) ?? 0;
        const fangRunLockCreditCost = numberValue(payload.fangRunLockCreditCost);
        const successful = payload.traceSuccessful === true;
        const hardwareWreckerEffect = successful && payload.traceSuccessEffect === "hardware_trash_meat_damage_end_run";
        const trashedCount = numberValue(payload.trashedCount) ?? 0;
        const damageAmount = numberValue(payload.damageAmount) ?? 0;
        category = "danger";
        importance = "important";
        visibility = "public";
        title = `Trace entschieden: ${traceParticipantLabel("corp", side)} ${creditText(corpBid)}, ${traceParticipantLabel("runner", side)} ${creditText(runnerBid)}; ${successful ? "Trace erfolgreich" : "Trace abgewehrt"}`;
        description = traceStrength !== undefined && runnerStrength !== undefined ? `Endstand: Trace ${traceStrength} gegen Runner-Stärke ${runnerStrength}${payload.fangRunEnded === true ? `; Fang 2.0 beendet den Run und sperrt weitere Runs bis zur Zahlung von ${creditText(fangRunLockCreditCost ?? 2)}` : ""}${hardwareWreckerEffect ? `; Karteneffekt: ${trashedCount} Hardware getrasht, ${damageAmount} Meat-Schaden${payload.damageCannotBePrevented === true ? " nicht verhinderbar" : ""}, Run endet` : ""}${hackerTrackerCountersAdded > 0 ? `; Hacker Tracker Central erhält ${hackerTrackerCountersAdded} Counter` : ""}.` : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Trace",
          `Korp ${corpBid}`,
          `Runner ${runnerBid}`,
          ...(traceStrength !== undefined && runnerStrength !== undefined ? [`${traceStrength}:${runnerStrength}`] : []),
          successful ? "Erfolg" : "Fehlschlag",
          ...(tagsAdded > 0 ? [`+${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`] : []),
          ...(hardwareWreckerEffect ? [`Hardware -${trashedCount}`, `${damageAmount} Schaden`, "Run endet"] : []),
          ...(payload.fangRunEnded === true ? ["Run endet", `Run-Sperre ${fangRunLockCreditCost ?? 2}`] : []),
          ...(hackerTrackerCountersAdded > 0 ? [`HTC +${hackerTrackerCountersAdded}`] : [])
        );
        break;
      }
      if (abilityId === "arasaka_owns_you_flatline_replacement") {
        const preventedAmount = numberValue(payload.preventedAmount) ?? numberValue(payload.originalAmount) ?? 0;
        const drawnCards = numberValue(payload.drawnCards) ?? 0;
        const removedTags = numberValue(payload.removedTags) ?? 0;
        const coreDamageRemoved = numberValue(payload.coreDamageRemoved) ?? 0;
        const debt = numberValue(payload.futureAgendaPointForfeitPending) ?? 0;
        category = "danger";
        importance = "critical";
        visibility = "public";
        title = phrase(subject, `${cardTitle ?? "Arasaka Owns You"} gespielt und ${preventedAmount} Schaden ersetzt`);
        description = `${drawnCards} Karten nachgezogen, ${creditText(10)} erhalten, ${removedTags} Tag${removedTags === 1 ? "" : "s"} entfernt${coreDamageRemoved > 0 ? `, ${coreDamageRemoved} Core Damage entfernt` : ""}; die nächsten ${debt} Agenda-Punkte werden forfeitet.`;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Arasaka Owns You", "Flatline verhindert", "+10 Credits", "4 Aktionen Schuld", `${debt} Agenda-Punkte`);
        break;
      }
      if (payload.eventModificationDecision === "apply" && numberValue(payload.preventedAmount) !== undefined) {
        const preventedAmount = numberValue(payload.preventedAmount) ?? 0;
        const damageAmount = numberValue(payload.damageAmount);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${preventedAmount} Schaden${cardTitle ? ` mit ${cardTitle}` : ""} verhindert`);
        description = damageAmount !== undefined ? `${damageAmount} Schaden bleibt übrig.` : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Prävention", `${preventedAmount} verhindert`, ...(damageAmount !== undefined ? [`${damageAmount} übrig`] : []));
        break;
      }
      if (isDataFortReclamationInstallPayload(payload)) {
        const installedCount = numberValue(payload.installedCount) ?? 0;
        const installedIceCount = numberValue(payload.installedIceCount) ?? 0;
        const installedRootCount = numberValue(payload.installedRootCount) ?? 0;
        const temporaryCreditsProvided = numberValue(payload.temporaryCreditsProvided) ?? 0;
        const rezCandidateCount = numberValue(payload.dataFortReclamationRezCandidateCount) ?? 0;
        category = "hidden";
        importance = "important";
        visibility = "redacted";
        title = phrase(subject, `${cardCountText(installedCount)} mit Data Fort Reclamation installiert`);
        description = `${installedIceCount} ICE und ${installedRootCount} Root-Karte${installedRootCount === 1 ? "" : "n"} wurden verdeckt installiert${rezCandidateCount > 0 ? "; anschließend kann daraus gerezzt werden" : ""}.`;
        chips.push("Data Fort", `${installedCount} Install`, `${installedIceCount} ICE`, `${temporaryCreditsProvided} Temp-Credits`);
        break;
      }
      if (isDataFortReclamationRezPayload(payload)) {
        const rezzedCount = numberValue(payload.rezzedCount) ?? 0;
        const rezzedIceCount = numberValue(payload.rezzedIceCount) ?? 0;
        const rezzedRootCount = numberValue(payload.rezzedRootCount) ?? 0;
        const temporaryCreditsSpent = numberValue(payload.temporaryCreditsSpent) ?? 0;
        const corpCreditsSpent = numberValue(payload.corpCreditsSpent) ?? 0;
        category = "card";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${cardCountText(rezzedCount)} aus Data Fort Reclamation gerezzt`);
        description = `${rezzedIceCount} ICE und ${rezzedRootCount} Root-Karte${rezzedRootCount === 1 ? "" : "n"} wurden gerezzt; ${temporaryCreditsSpent} temporäre und ${corpCreditsSpent} normale Credits wurden ausgegeben.`;
        chips.push("Data Fort", `${rezzedCount} Rez`, `${temporaryCreditsSpent} Temp`, `${corpCreditsSpent} Credits`);
        break;
      }
      if (hiddenZoneAction === "aardvark_rez_trash_worm") {
        category = "danger";
        importance = "important";
        visibility = "public";
        title = phrase(subject, "Aardvark gerezzt und Worm getrasht");
        cardDefinitionId = cardDefinitionId ?? stringValue(payload.publicRevealDefinitionId);
        chips.push("Aardvark", "Rez", "Worm Trash");
        break;
      }
      if (hiddenZoneAction === "aardvark_declined_worm_use") {
        category = "run";
        visibility = "public";
        title = phrase(subject, "Aardvark nicht gerezzt; Worm wurde genutzt");
        chips.push("Aardvark", "Kein Rez", "Worm");
        break;
      }
      if (abilityId === "successful_hq_run_pay_rez_cost_trash_rezzed_ice") {
        const targetDefinitionId = stringValue(payload.targetCardDefinitionId);
        const targetServerLabel = displayServerLabel(stringValue(payload.targetServerLabel));
        const rezCostPaid = numberValue(payload.rezCostPaid) ?? 0;
        category = "card";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${cardTitle ?? "ein gerezztes ICE"}${targetServerLabel ? ` in ${targetServerLabel}` : ""} getrasht und ${creditText(rezCostPaid)} bezahlt`);
        cardDefinitionId = targetDefinitionId ?? cardDefinitionId ?? sourceDefinitionId;
        chips.push("Core Command", "Trash", `${rezCostPaid} ${creditLabel(rezCostPaid)}`, ...(targetServerLabel ? [targetServerLabel] : []));
        break;
      }
      if (hiddenZoneAction === "search_stack") {
        const destinationLabel = searchDestinationLabel(searchDestination);
        const installFailed = searchDestination === "install_program" && payload.installSucceeded === false;
        const installPendingMemoryTrash = searchDestination === "install_program" && payload.installPendingMemoryTrash === true;
        const temporaryInstall = payload.temporaryInstall === true;
        category = searchReveal === "public" ? "card" : "hidden";
        importance = "important";
        visibility = searchReveal === "public" ? "public" : "redacted";
        title =
          searchReveal === "public"
            ? installPendingMemoryTrash
              ? phrase(subject, `${cardTitle ?? "ein Programm"} aus dem Stack vorgezeigt; MU muss freigemacht werden`)
              : installFailed
              ? phrase(subject, `${cardTitle ?? "ein Programm"} aus dem Stack vorgezeigt, aber nicht installiert`)
              : phrase(subject, `${cardTitle ?? "ein Programm"} aus dem Stack vorgezeigt und ${searchDestination === "install_program" ? `im Rig installiert${temporaryInstall ? "; Rückkehr am Zugende" : ""}` : `in ${destinationLabel} genommen`}`)
            : phrase(subject, `${cardCountText(numberValue(payload.selectedCount) ?? 1)} verdeckt aus dem Stack in ${destinationLabel} genommen`);
        chips.push("Stack", searchReveal === "public" ? "Vorgezeigt" : "Verdeckt", installPendingMemoryTrash ? "MU freimachen" : installFailed ? "Nicht installiert" : destinationLabel, ...(temporaryInstall ? ["Temporär"] : []), ...(payload.searchShuffleAfter === true || payload.shuffled === true ? ["Shuffle"] : []));
        break;
      }
      if (hiddenZoneAction === "sneak_preview_install_program") {
        const installPendingMemoryTrash = payload.installPendingMemoryTrash === true;
        const sourceLabel = stringValue(payload.searchSource) === "runner_heap" ? "Heap" : "Stack";
        category = "card";
        importance = "important";
        visibility = "public";
        title = installPendingMemoryTrash
          ? phrase(subject, `${cardTitle ?? "ein Programm"} aus dem ${sourceLabel} gewählt; MU muss freigemacht werden`)
          : phrase(subject, `${cardTitle ?? "ein Programm"} aus dem ${sourceLabel} kostenlos im Rig installiert; Rückkehr am Zugende`);
        chips.push(sourceLabel, installPendingMemoryTrash ? "MU freimachen" : "Installiert", "Temporär");
        break;
      }
      if (hiddenZoneAction === "sneak_preview_choose_source") {
        const sourceLabel = stringValue(payload.searchSource) === "runner_heap" ? "Heap" : "Stack";
        category = "hidden";
        visibility = "redacted";
        title = phrase(subject, `${sourceLabel} als Sneak-Preview-Quelle gewählt`);
        chips.push("Sneak Preview", sourceLabel);
        break;
      }
      if (hiddenZoneAction === "v1917_corporate_negotiating_center_hq_agenda_reveal") {
        const revealedTitles = publicRevealTitleList(payload.publicRevealTitles);
        const revealedCount = numberValue(payload.revealedCount) ?? revealedTitles.length;
        const gainedCredits = numberValue(payload.gainedCredits) ?? revealedCount;
        const source = sourceTitle ?? "Corporate Negotiating Center";
        category = "agenda";
        importance = revealedCount > 0 ? "important" : "normal";
        visibility = "public";
        title =
          revealedCount > 0
            ? phrase(subject, `${agendaRevealCountText(revealedCount)} aus HQ durch ${source} vorgezeigt`)
            : phrase(subject, `keine HQ-Agenda durch ${source} vorgezeigt`);
        description =
          revealedTitles.length > 0
            ? `Gezeigt: ${revealedTitles.join(", ")}. Timing: Start-of-turn.`
            : "Timing: Start-of-turn.";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        cardTitle = cardTitle ?? source;
        chips.push(source, "HQ Reveal", `${revealedCount} ${revealedCount === 1 ? "Agenda" : "Agenden"}`, `+${gainedCredits} ${creditLabel(gainedCredits)}`, "Start-of-turn");
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
      if (abilityId === "fang_2_0_pay_to_run") {
        const paid = numberValue(payload.fangRunLockCreditCost) ?? 2;
        category = "run";
        importance = "important";
        title = phrase(subject, `die Fang-2.0-Run-Sperre für ${creditText(paid)} entfernt`);
        chips.push("Fang 2.0", "Run-Sperre weg", `${paid} ${creditLabel(paid)}`);
        break;
      }
      if (isExposeServerCardPayload(payload) || payload.revealKind === "expose") {
        const sourceTitle = sourceTitleFromActionLabel(label);
        category = "card";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${cardTitle ?? "eine Korp-Karte"}${serverLabel ? ` in ${serverLabel}` : ""}${sourceTitle ? ` mit ${sourceTitle}` : ""} aufgedeckt`);
        chips.push("Expose", ...(serverLabel ? [serverLabel] : []), ...(sourceTitle ? [sourceTitle] : []));
        break;
      }
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
      if (
        abilityId === "deterministic_die_probe"
      ) {
        const dieRoll = payloadRandomRoll(payload);
        category = "card";
        importance = "important";
        title = phrase(subject, `${cardTitle ?? "eine Kartenfähigkeit"} aktiviert${dieRoll !== undefined ? ` und eine ${dieRoll} gewürfelt` : ""}`);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Würfel", ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []));
        break;
      }
      if (abilityId === "schlaghund_tag_damage") {
        const dieRoll = payloadRandomRoll(payload);
        const runnerTags = numberValue(payload.runnerTags);
        const thresholdMet = payload.tagThresholdMet === true;
        const damageAmount = numberValue(payload.damageAmount) ?? 0;
        category = thresholdMet ? "danger" : "card";
        importance = thresholdMet ? "critical" : "important";
        title = phrase(subject, `Schlaghund aktiviert${dieRoll !== undefined ? ` und eine ${dieRoll} gewürfelt` : ""}`);
        description = thresholdMet
          ? `${runnerTags ?? 0} Tags reichen aus: ${damageAmount} Meat Damage und Schlaghund wird getrasht.`
          : `${runnerTags ?? 0} Tags reichen nicht aus.`;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Schlaghund", ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []), `${runnerTags ?? 0} Tags`, thresholdMet ? "Damage" : "Kein Schaden");
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
      if (actor === "runner" && selectedServerLabel) {
        category = "card";
        title = phrase(subject, `${cardTitle ?? "eine Karte"} auf ${selectedServerLabel} ausgerichtet installiert`);
        chips.push("Install", "Resource", selectedServerLabel);
      } else if (actor === "corp" && (redactedKind || !cardTitle)) {
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
      if (actionType === "play_event" && abilityId === "program_install_action_bundle") {
        const gainedActions = numberValue(payload.gainedActions) ?? 0;
        const temporaryCredits = numberValue(payload.temporaryProgramInstallCredits) ?? 0;
        const remaining = numberValue(payload.valuPakProgramInstallActionsRemaining);
        category = "turn";
        importance = "important";
        title = phrase(subject, `${cardTitle ?? "Valu-Pak Software Bundle"} gespielt und ${gainedActions} Programminstall-Aktionen erhalten`);
        description = temporaryCredits > 0 ? `${temporaryCredits} temporärer Credit ist nur für Programminstallationen verfügbar.` : undefined;
        chips.push("Event", `+${gainedActions} Aktionen`, ...(temporaryCredits > 0 ? [`+${temporaryCredits} Install-Credit`] : []), ...(remaining !== undefined ? [`${remaining} offen`] : []));
        break;
      }
      if (actionType === "play_operation" && abilityId === "install_action_bundle") {
        const gainedActions = numberValue(payload.gainedActions) ?? 0;
        const remaining = numberValue(payload.edgerunnerTempsInstallActionsRemaining);
        category = "turn";
        importance = "important";
        title = phrase(subject, `${cardTitle ?? "Edgerunner, Inc., Temps"} gespielt und ${gainedActions} Installaktionen erhalten`);
        chips.push("Operation", `+${gainedActions} Installaktionen`, ...(remaining !== undefined ? [`${remaining} offen`] : []));
        break;
      }
      if (actionType === "play_event" && abilityId === "playful_ai_dice_loop") {
        const dieRoll = payloadRandomRoll(payload);
        const dieRolls = numberArrayValue(payload.playfulAiDieRolls);
        const choiceOpened = payload.playfulAiChoiceOpened === true;
        const complete = payload.playfulAiComplete === true;
        category = "card";
        importance = choiceOpened ? "important" : "normal";
        title = phrase(subject, `${cardTitle ?? "Playful AI"} gespielt${dieRoll !== undefined ? ` und eine ${dieRoll} gewürfelt` : ""}`);
        description = choiceOpened
          ? "Der Wurf öffnet eine Entscheidung: Credits nehmen oder Würfel beiseitelegen."
          : complete
            ? "Die Playful-AI-Schleife ist ohne weitere Entscheidung abgeschlossen."
            : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(actionType === "play_event" ? "Event" : "Operation", "Playful AI", ...playfulAiRollChips(dieRolls, dieRoll), choiceOpened ? "Choice" : "Fertig");
        break;
      }
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
      if (actionType === "play_event" && stringValue(payload.accessReplacement)) {
        const creditLoss = numberValue(payload.creditLoss) ?? 0;
        const tagsAdded = numberValue(payload.tagsAdded) ?? 0;
        const corpDrawnCount = numberValue(payload.corpDrawnCount) ?? 0;
        const effectParts = accessReplacementEffectParts(creditLoss, tagsAdded, corpDrawnCount);
        category = tagsAdded > 0 ? "danger" : creditLoss > 0 ? "economy" : "run";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${cardTitle ?? "eine Karte"} gespielt: ${effectParts.join(", ")}`);
        description = "Der erfolgreiche Run wurde ohne Zugriff auf verdeckte Korp-Karten ersetzt.";
        chips.push(
          "Event",
          "Access ersetzt",
          ...(creditLoss > 0 ? [`Korp -${creditLoss}`] : []),
          ...(tagsAdded > 0 ? [`+${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`] : []),
          ...(corpDrawnCount > 0 ? [`Korp zieht ${corpDrawnCount}`] : [])
        );
        break;
      }
      if (
        actionType === "play_event" &&
        isExposeOutermostIceEachDataFortPayload(payload)
      ) {
        const exposedCount = numberValue(payload.revealedCount) ?? 0;
        const serverLabels = (stringValue(payload.exposedServerLabels) ?? "")
          .split(",")
          .map((label) => displayServerLabel(label.trim()))
          .filter((label): label is string => Boolean(label));
        category = "card";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${cardTitle ?? "Ice and Data's Guide to the Net"} gespielt und ${cardCountText(exposedCount)} äußerstes ICE aufgedeckt`);
        description = serverLabels.length > 0 ? `Betroffene Forts: ${serverLabels.join(", ")}.` : undefined;
        chips.push("Event", "Expose", `${exposedCount} ICE`, ...serverLabels);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        break;
      }
      const playEffect = mergedPlayEffect ?? effect;
      category = playEffect.category ?? category;
      title = phrase(subject, `${cardTitle ?? "eine Karte"} gespielt${playEffect.suffix ? ` und ${playEffect.suffix}` : ""}`);
      chips.push(actionType === "play_event" ? "Event" : "Operation", ...playEffect.chips);
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
      if (isSecurityPurgePayload(payload)) {
        const revealedCount = numberValue(payload.revealedCount) ?? 0;
        const installedIceCount = numberValue(payload.installedIceCount) ?? 0;
        const trashedCount = numberValue(payload.trashedCount) ?? 0;
        title = phrase(subject, `${cardTitle ?? "Security Purge"} gescored und ${revealedCount} R&D-Karten aufgedeckt`);
        description = `${installedIceCount} ICE installiert und gerezzt; ${trashedCount} Nicht-ICE getrasht.`;
        chips.push("Score", "R&D Reveal", `${installedIceCount} ICE`, `${trashedCount} Trash`);
        break;
      }
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
      if (payload.oliviaSalazarTemporaryDerez === true) {
        const paid = numberValue(payload.rezCostPaid) ?? 0;
        const base = numberValue(payload.oliviaSalazarRezCostBase);
        title = phrase(subject, `${cardTitle ?? "ein ICE"} mit Olivia Salazar für ${creditText(paid)} gerezzt${rezSuffix(context.cardType, effect)}`);
        description = `Olivia Salazar reduziert die effektiven Rez-Kosten${base !== undefined ? ` von ${creditText(base)}` : ""} auf ${creditText(paid)}; das ICE wird am Runende derezzt.`;
        chips.push("Olivia Salazar", `${paid} ${creditLabel(paid)}`, "Temporär");
      } else {
        title = phrase(subject, `${cardTitle ?? "eine Karte"} gerezzt${rezSuffix(context.cardType, effect)}`);
      }
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
      {
        const pumpStrengthAmount = numberValue(payload.pumpStrengthAmount) ?? 1;
        const pumpBreakerCreditCost = numberValue(payload.pumpBreakerCreditCost);
        const breakerStrengthAfter = numberValue(payload.breakerStrengthAfter);
        description = `${pumpBreakerCreditCost !== undefined ? `${creditText(pumpBreakerCreditCost)}: ` : ""}+${pumpStrengthAmount} Stärke für diese Begegnung${breakerStrengthAfter !== undefined ? `; Stärke danach ${breakerStrengthAfter}` : ""}.`;
        chips.push("Breaker", `+${pumpStrengthAmount} Stärke`, ...(pumpBreakerCreditCost !== undefined ? [`${pumpBreakerCreditCost} ${creditLabel(pumpBreakerCreditCost)}`] : []));
      }
      title = phrase(subject, `${cardTitle ?? "einen Icebreaker"} gepumpt`);
      break;
    case "break_subroutine":
      category = "run";
      {
        const breakSubroutineCount = numberValue(payload.breakSubroutineCount) ?? 1;
        const breakSubroutineBaseCost = numberValue(payload.breakSubroutineBaseCost);
        const breakSubroutineTotalCost = numberValue(payload.breakSubroutineTotalCost) ?? breakSubroutineBaseCost;
        const subroutineLabel = breakSubroutineLabel(payload, breakSubroutineCount);
        const targetIceTitle = stringValue(payload.targetIceTitle);
        const targetIceSuffix = targetIceTitle ? ` auf ${targetIceTitle}` : "";
        description = `${breakSubroutineTotalCost !== undefined ? `${creditText(breakSubroutineTotalCost)}: ` : ""}${subroutineLabel}${targetIceSuffix} gebrochen.`;
        chips.push(
          "Subroutine",
          subroutineLabel,
          "Gebrochen",
          ...(breakSubroutineTotalCost !== undefined ? [`${breakSubroutineTotalCost} ${creditLabel(breakSubroutineTotalCost)}`] : []),
          ...(cardTitle ? [cardTitle] : []),
          ...(targetIceTitle ? [targetIceTitle] : [])
        );
        title = phrase(subject, `${cardTitle ? `mit ${cardTitle} ` : ""}${subroutineLabel}${targetIceSuffix} gebrochen`);
      }
      break;
    case "continue_run":
      if (abilityId === "rio_de_janeiro_passed_ice") {
        const dieRoll = payloadRandomRoll(payload);
        const runEnded = payload.rioRunEnded === true;
        const passedIce = stringValue(payload.passedIceDefinitionId) ?? "ein gerezztes ICE";
        category = "run";
        importance = runEnded ? "critical" : "important";
        title = phrase(subject, `${passedIce} passiert und Rio de Janeiro City Grid würfelt${dieRoll !== undefined ? ` eine ${dieRoll}` : ""}`);
        description = runEnded ? "Der Run endet durch Rio de Janeiro City Grid." : "Der Run läuft weiter.";
        cardDefinitionId = cardDefinitionId ?? stringValue(payload.sourceDefinitionId);
        chips.push("Rio", ...(serverLabel ? [serverLabel] : []), ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []), runEnded ? "Run endet" : "Weiter");
        break;
      }
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
      {
        const unbrokenSubroutineCount = numberValue(payload.unbrokenSubroutineCount);
        if (encounterContinue && unbrokenSubroutineCount === 0) {
          title = phrase(subject, "das ICE passiert");
          chips.push("Run", "ICE passiert");
        } else {
          title = encounterContinue
            ? phrase(subject, result === "ended" ? "ungebrochene Subroutinen ausgelöst und der Run endete" : "ungebrochene Subroutinen ausgelöst")
            : phrase(subject, result === "ended" ? "den Run beendet" : "den Run fortgesetzt");
          chips.push("Run", ...(encounterContinue ? ["Subroutinen"] : runPhase ? [runPhaseLabel(runPhase)] : []));
        }
      }
      break;
    case "jack_out": {
      const target = serverLabel ?? "dem angegriffenen Server";
      category = "run";
      title = phrase(subject, "den Run abgebrochen");
      description = `Auf ${target} wurde keine Karte zugegriffen.`;
      chips.push("Run", "Jack-out", "Kein Zugriff", ...(serverLabel ? [serverLabel] : []));
      break;
    }
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
      if (abilityId === "fang_2_0_pay_to_run") {
        const paid = numberValue(payload.fangRunLockCreditCost) ?? 2;
        category = "run";
        importance = "important";
        title = phrase(subject, `die Fang-2.0-Run-Sperre für ${creditText(paid)} entfernt`);
        chips.push("Fang 2.0", "Run-Sperre weg", `${paid} ${creditLabel(paid)}`);
        break;
      }
      if (shellTradersAbility === "set_aside_from_grip") {
        const counters = numberValue(payload.shellCounterAmount) ?? numberValue(payload.remainingCounters) ?? 0;
        const installed = payload.installedFromSpecialZone === true;
        category = "card";
        importance = "important";
        title = phrase(subject, `${cardTitle ?? "eine Karte"} mit ${counters} Shell-Counter${counters === 1 ? "" : "n"} beiseitegelegt${installed ? " und kostenlos installiert" : ""}`);
        chips.push("The Shell Traders", "Set Aside", `${counters} Shell`);
        break;
      }
      if (shellTradersAbility === "remove_shell_counter" || shellTradersAbility === "start_turn_remove_shell_counter") {
        const remaining = numberValue(payload.remainingCounters) ?? 0;
        const installed = payload.installedFromSpecialZone === true;
        const pendingMemory = payload.shellAutoInstallPendingMemoryTrash === true;
        category = "card";
        importance = installed || pendingMemory ? "important" : "normal";
        title = phrase(
          subject,
          `1 Shell-Counter von ${cardTitle ?? "einer Karte"} entfernt${installed ? "; Karte kostenlos installiert" : pendingMemory ? "; MU muss freigemacht werden" : ""}`
        );
        chips.push("The Shell Traders", "Shell -1", `${remaining} übrig`, ...(installed ? ["Installiert"] : []), ...(pendingMemory ? ["MU freimachen"] : []));
        break;
      }
      if (shellTradersAbility === "auto_install_after_memory_choice") {
        category = "card";
        importance = "important";
        title = phrase(subject, `${cardTitle ?? "eine Karte"} durch The Shell Traders kostenlos installiert`);
        chips.push("The Shell Traders", "Installiert", "0 Kosten");
        break;
      }
      if (v1922RunnerProgramAbility === "startup_immolator_trash_ice") {
        const rezCostPaid = numberValue(payload.rezCostPaid) ?? 0;
        const targetDefinitionId = stringValue(payload.targetIceDefinitionId) ?? stringValue(payload.trashedCardDefinitionId);
        category = "run";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${cardTitle ?? "Startup Immolator"} erschöpft, das passierte ICE getrasht und ${creditText(rezCostPaid)} bezahlt`);
        description = "Quelle und Ziel sind öffentlich: Startup Immolator wurde erschöpft; das Ziel-ICE wurde in die Archive bewegt.";
        cardDefinitionId = sourceDefinitionId ?? cardDefinitionId ?? targetDefinitionId;
        chips.push("Startup Immolator", "ICE getrasht", "Archive", `${rezCostPaid} ${creditLabel(rezCostPaid)}`);
        break;
      }
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
      if (resourceAbility === "short_term_contract_take_credits") {
        const gainedCredits = numberValue(payload.gainedCredits) ?? numberValue(payload.gainCreditsAmount) ?? amount ?? 0;
        const trashed = payload.shortTermContractTrashed === true ? ", Contract getrasht" : "";
        category = "economy";
        title = phrase(subject, `${creditText(gainedCredits)} von ${cardTitle ?? "Short-Term Contract"} genommen${trashed}`);
        break;
      }
      category = "card";
      title = phrase(subject, `${cardTitle ?? "eine Kartenfähigkeit"} aktiviert${abilityTextFromLabel(label, cardTitle)}`);
      chips.push("Kartenaktion", ...(cardTitle ? [cardTitle] : []));
      break;
    }
    case "end_turn":
      if (shellTradersAbility === "start_turn_remove_shell_counter") {
        const remaining = numberValue(payload.remainingCounters) ?? 0;
        const installed = payload.installedFromSpecialZone === true;
        const pendingMemory = payload.shellAutoInstallPendingMemoryTrash === true;
        category = "card";
        importance = installed || pendingMemory ? "important" : "normal";
        title = phrase(
          subject,
          `1 Shell-Counter von ${cardTitle ?? "einer Karte"} entfernt${installed ? "; Karte kostenlos installiert" : pendingMemory ? "; MU muss freigemacht werden" : ""}`
        );
        chips.push("The Shell Traders", "Shell -1", `${remaining} übrig`, ...(installed ? ["Installiert"] : []), ...(pendingMemory ? ["MU freimachen"] : []));
        break;
      }
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

  const v181RunnerProgramAbility = stringValue(payload.v181RunnerProgramAbility);
  if (v181RunnerProgramAbility === "pattels_virus_counter_choice") {
    const candidateCount = numberValue(payload.pattelsVirusCandidateCount) ?? 0;
    category = "run";
    importance = "important";
    visibility = "public";
    title = phrase(subject, `Pattel's Virus-Zielwahl für ${candidateCount} ICE geöffnet`);
    chips.push("Pattel's Virus", "Choice", `${candidateCount} ICE`);
  }
  if (v181RunnerProgramAbility === "pattels_virus_counter") {
    const remaining = numberValue(payload.remainingCounters);
    const targetDefinitionId = stringValue(payload.targetCardDefinitionId);
    category = "run";
    importance = "important";
    visibility = "public";
    cardDefinitionId = targetDefinitionId ?? cardDefinitionId;
    title = phrase(subject, `1 Virus-Counter mit Pattel's Virus auf ${cardTitle ?? "ein ICE"} gelegt`);
    chips.push("Pattel's Virus", "+1 Virus", ...(remaining !== undefined ? [`${remaining} auf ICE`] : []));
  }
  if (v181RunnerProgramAbility === "pox_counter") {
    const countersAfter = numberValue(payload.poxCountersAfter);
    const targetServerLabel = displayServerLabel(stringValue(payload.targetServerLabel));
    category = "run";
    importance = "important";
    visibility = "public";
    title = phrase(subject, `1 Pox-Counter auf ${targetServerLabel ?? "das angegriffene Fort"} gelegt`);
    chips.push("Pox", "+1 Virus", ...(targetServerLabel ? [targetServerLabel] : []), ...(countersAfter !== undefined ? [`${countersAfter} dort`] : []));
  }
  if (actionType === "install_card") {
    const recurringCreditsLoaded = numberValue(payload.recurringCreditsLoaded);
    const iceInstallAdditionalCost = numberValue(payload.iceInstallAdditionalCost) ?? 0;
    const iceInstallTotalCost = numberValue(payload.iceInstallTotalCost);
    if (recurringCreditsLoaded !== undefined && recurringCreditsLoaded > 0) {
      description = `${recurringCreditsLoaded} Recurring Credit${recurringCreditsLoaded === 1 ? "" : "s"} wurden auf die Karte gelegt.`;
      chips.push(`${recurringCreditsLoaded} Recurring`);
    }
    if (iceInstallAdditionalCost > 0) {
      description = `Die Installation enthält ${creditText(iceInstallAdditionalCost)} Zusatzkosten${iceInstallTotalCost !== undefined ? `; Gesamtkosten: ${creditText(iceInstallTotalCost)}` : ""}.`;
      chips.push(`+${iceInstallAdditionalCost} Installkosten`, ...(iceInstallTotalCost !== undefined ? [`${iceInstallTotalCost} gesamt`] : []));
    }
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
  return resolvedEffectsFromPayload(event.publicPayload.resolvedEffects)
    .filter((effect) => !shouldMergePlayEffect(event, effect))
    .map((effect, index) => formatChronicleEffect(event, effect, index, side));
}

export function chronicleTurnNumberByEventId(events: PublicGameEvent[]): Record<string, number> {
  const numbers: Record<string, number> = {};
  let activeSide: Side = "corp";
  let activeTurnNumber = 1;

  for (const event of events) {
    const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
    const actor = sideValue(event.publicPayload.actor);
    if (!actor) continue;

    if (actionType === "mandatory_draw" && actor === "corp") {
      if (activeSide !== "corp") {
        activeSide = "corp";
        activeTurnNumber += 1;
      }
      numbers[event.eventId] = activeTurnNumber;
      continue;
    }

    if (actionType === "end_turn") {
      if (activeSide !== actor) activeSide = actor;
      numbers[event.eventId] = activeTurnNumber;
      activeSide = actor === "corp" ? "runner" : "corp";
      activeTurnNumber += 1;
    }
  }

  return numbers;
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
  let visibility: ChronicleVisibility = chronicleEffectVisibility(effect, side);
  let title = "Ein automatischer Effekt wurde aufgelöst";
  let description: string | undefined;
  const through = sourceTitle && sourceTitle !== cardTitle ? ` durch ${sourceTitle}` : "";

  if (visibility === "redacted") {
    return redactedChronicleEffectItem(event, effect, index, actor, subject, amount);
  }

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
    case "steal_agenda":
      category = "agenda";
      importance = "critical";
      title = phrase(subject, `${cardTitle ?? "eine Agenda"}${through} gestohlen`);
      chips.push("Agenda", ...(amount > 0 ? [`+${amount} Agenda`] : []), "Automatisch");
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
    case "counter_change": {
      const counterText = counterLabel(effect.counterType);
      const added = numberValue(effect.addedCounterAmount) ?? 0;
      category = "card";
      title = phrase(subject, `${counterText} auf ${sourceTitle ?? cardTitle ?? "einer Karte"} aufgefrischt`);
      chips.push(counterText, `${amount} bereit`, ...(added > 0 ? [`+${added}`] : []), "Automatisch");
      break;
    }
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
    case "resolve_subroutine": {
      const source = sourceTitle ?? "ICE";
      const subroutineIndex = numberValue(effect.subroutineIndex);
      const subroutineNumber = subroutineIndex !== undefined ? subroutineIndex + 1 : undefined;
      const subroutineChip = subroutineNumber !== undefined ? `Subroutine ${subroutineNumber}` : "Subroutine";
      const subroutineType = stringValue(effect.subroutineType);
      const damageType = stringValue(effect.damageType);
      const cardsTrashed = numberValue(effect.cardsTrashed) ?? 0;
      category = subroutineType === "do_damage" ? "danger" : "run";
      importance = subroutineType === "do_damage" || effect.endedRun === true ? "critical" : "important";
      title =
        subroutineType === "do_damage"
          ? `${source}: ${subroutineChip} macht ${amount} ${damageTypeLabel(damageType)}`
          : effect.endedRun === true
            ? `${source}: ${subroutineChip} beendet den Run`
            : `${source}: ${subroutineChip} aufgelöst`;
      if (subroutineType === "do_damage")
        description = `${cardCountText(cardsTrashed)} wurden in den Heap bewegt.`;
      chips.push(
        subroutineChip,
        ...(subroutineType === "do_damage" ? [`${amount} ${damageTypeLabel(damageType)}`, `${cardsTrashed} Heap`] : []),
        ...(effect.endedRun === true ? ["Run endet"] : []),
        source
      );
      break;
    }
  }

  return {
    id: `${event.eventId}:effect:${effect.effectId || index}`,
    category,
    importance,
    visibility,
    ...(actor ? { actor } : {}),
    title: ensurePeriod(title),
    ...(description ? { description: ensurePeriod(description) } : {}),
    chips: uniqueChips(chips.filter(Boolean)),
    ...(sourceDefinitionId ? { cardDefinitionId: sourceDefinitionId } : {}),
    ...(sourceTitle ? { cardTitle: sourceTitle } : {}),
    cardDetailLines: [],
    groupLabel: groupLabelFor(category, actor, undefined, displayServerLabel(effect.serverLabel), undefined)
  };
}

function chronicleEffectVisibility(effect: ResolvedGameEffect, viewerSide: Side): ChronicleVisibility {
  if (effect.visibility === "public") return "public";
  if (effect.visibility === "private_to_side" && effect.side === viewerSide) return "side";
  return "redacted";
}

function redactedChronicleEffectItem(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
  index: number,
  actor: Side | undefined,
  subject: string,
  amount: number
): ChronicleItem {
  const chips = uniqueChips([...baseChips(actor, false), "Verdeckt", "Automatisch"]);
  const zoneLabel = actor === "corp" ? "ins Archiv" : actor === "runner" ? "in den Heap" : "abgelegt";
  let category: ChronicleCategory = "hidden";
  let importance: ChronicleImportance = "normal";
  let title = "Ein verdeckter Effekt wurde aufgelöst";

  switch (effect.kind) {
    case "draw_cards":
      category = "card";
      title = phrase(subject, `${cardCountText(amount)} verdeckt gezogen`);
      break;
    case "trash_card":
      importance = "important";
      title =
        effect.redactedKind === "region_replacement"
          ? "Ein verdecktes Region Upgrade wurde ersetzt"
          : `Eine verdeckte Karte wurde ${zoneLabel} gelegt`;
      break;
    case "damage":
      category = "danger";
      importance = "critical";
      title = phrase(subject, `${amount} Schaden erlitten`);
      break;
  }

  return {
    id: `${event.eventId}:effect:${effect.effectId || index}`,
    category,
    importance,
    visibility: "redacted",
    ...(actor ? { actor } : {}),
    title: ensurePeriod(title),
    chips,
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
  if (["start_run", "rez_ice", "decline_rez", "pump_breaker", "break_subroutine", "continue_run", "jack_out", "access_card", "decline_trash"].includes(actionType)) return "run";
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

function simpleMergedPlayEffect(event: PublicGameEvent): EffectSummary | undefined {
  const effects = resolvedEffectsFromPayload(event.publicPayload.resolvedEffects);
  const effect = effects[0];
  if (effects.length !== 1 || !effect || !shouldMergePlayEffect(event, effect)) return undefined;
  const amount = numberValue(effect.amount) ?? 0;
  if (effect.kind === "draw_cards") return { category: "card", suffix: `${cardCountText(amount)} gezogen`, chips: [amount === 1 ? "Karte ziehen" : `${amount} Karten`] };
  if (effect.kind === "gain_credits") return { category: "economy", suffix: `${creditText(amount)} erhalten`, chips: [`+${amount} ${creditLabel(amount)}`] };
  return undefined;
}

function shouldMergePlayEffect(event: PublicGameEvent, effect: ResolvedGameEffect | undefined): boolean {
  if (!effect) return false;
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  if (actionType !== "play_event" && actionType !== "play_operation") return false;
  if (!["draw_cards", "gain_credits"].includes(effect.kind) || effect.visibility !== "public") return false;
  if (effect.reason !== "card_resolver") return false;
  const actor = sideValue(payload.actor);
  if (actor && effect.side && actor !== effect.side) return false;
  const amount = numberValue(effect.amount);
  if (!amount || amount <= 0) return false;
  const playedDefinitionId = stringValue(payload.cardDefinitionId);
  const sourceDefinitionId = stringValue(effect.sourceDefinitionId);
  if (playedDefinitionId && sourceDefinitionId && playedDefinitionId !== sourceDefinitionId) return false;
  const playedTitle = stringValue(payload.title);
  const sourceTitle = stringValue(effect.sourceTitle);
  if (!playedDefinitionId && !sourceDefinitionId && playedTitle && sourceTitle && playedTitle !== sourceTitle) return false;
  return true;
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

function breakSubroutineLabel(payload: Record<string, unknown>, fallbackCount: number): string {
  const rawIndex = numberValue(payload.subroutineIndex);
  if (rawIndex !== undefined && Number.isInteger(rawIndex) && rawIndex >= 0) return `Subroutine ${rawIndex + 1}`;
  const rawIndexes = stringValue(payload.subroutineIndexes);
  const indexes = rawIndexes
    ?.split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0);
  if (indexes && indexes.length > 0) return `Subroutinen ${indexes.map((index) => index + 1).join(", ")}`;
  return fallbackCount === 1 ? "eine Subroutine" : `${fallbackCount} Subroutinen`;
}

function dieText(amount: number): string {
  return amount === 1 ? "Würfel" : "Würfel";
}

function playfulAiRollChips(dieRolls: number[], fallbackRoll: number | undefined): string[] {
  if (dieRolls.length > 1) return [`Würfe ${dieRolls.join(", ")}`];
  const roll = dieRolls[0] ?? fallbackRoll;
  return roll !== undefined ? [`Wurf ${roll}`] : [];
}

function playfulAiResolveDescription(
  dieRolls: number[],
  queuedBeforeRolls: number | undefined,
  remainingDice: number | undefined,
  choiceOpened: boolean,
  complete: boolean
): string | undefined {
  const parts: string[] = [];
  if (dieRolls.length > 0) {
    const verb = dieRolls.length === 1 ? "wurde" : "wurden";
    const diceText =
      queuedBeforeRolls && queuedBeforeRolls > dieRolls.length
        ? `${dieRolls.length} von ${queuedBeforeRolls} beiseitegelegten Würfeln`
        : dieRolls.length === 1
          ? "ein beiseitegelegter Würfel"
          : `${dieRolls.length} beiseitegelegte Würfel`;
    parts.push(`Danach ${verb} ${diceText} geworfen: ${dieRolls.join(", ")}.`);
  }
  if (choiceOpened) {
    parts.push(
      remainingDice && remainingDice > 0
        ? `Der letzte Wurf öffnet eine weitere Entscheidung; ${remainingDice === 1 ? "ein Würfel bleibt" : `${remainingDice} Würfel bleiben`} danach noch offen.`
        : "Der letzte Wurf öffnet eine weitere Entscheidung."
    );
  } else if (complete) {
    parts.push("Die Playful-AI-Schleife ist abgeschlossen.");
  }
  return parts.join(" ") || undefined;
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

function damageTypeLabel(damageType: string | undefined): string {
  if (damageType === "net") return "Net Damage";
  if (damageType === "meat") return "Meat Damage";
  if (damageType === "core") return "Core Damage";
  return "Damage";
}

function agendaRevealCountText(amount: number): string {
  return amount === 1 ? "eine Agenda" : `${amount} Agenden`;
}

function accessReplacementEffectParts(creditLoss: number, tagsAdded: number, corpDrawnCount: number): string[] {
  const parts: string[] = [];
  if (creditLoss > 0) parts.push(`Korp verliert ${creditText(creditLoss)}`);
  if (tagsAdded > 0) parts.push(`Runner erhält ${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`);
  if (corpDrawnCount > 0) parts.push(`Korp zieht ${cardCountText(corpDrawnCount)}`);
  return parts.length > 0 ? parts : ["der Zugriff wird ersetzt"];
}

function searchDestinationLabel(destination: string | undefined): string {
  if (destination === "install_program") return "das Rig";
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
  if (actionType === "trigger_ability") {
    const title = label.match(/^(.+?):\s+.+$/)?.[1]?.trim();
    if (title && !isGenericCardLabel(title)) return title;
  }
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

function sourceTitleFromActionLabel(label: string | undefined): string | undefined {
  const title = label?.match(/^(.+?):\s+.+$/)?.[1]?.trim();
  return title && !isGenericCardLabel(title) ? title : undefined;
}

function abilityTextFromLabel(label: string | undefined, cardTitle: string | undefined): string {
  if (!label || !cardTitle) return "";
  const escapedTitle = cardTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = label.match(new RegExp(`^${escapedTitle}:\\s*(.+)$`, "i"));
  const abilityText = match?.[1]?.trim();
  return abilityText ? `: ${abilityText}` : "";
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
  if (counterType === "recurring_credit") return "Recurring Credits";
  if (counterType === "bit") return "Bit";
  return counterType === "virus" ? "Virus-Counter" : "Counter";
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function numberArrayValue(value: unknown): number[] {
  if (typeof value === "string")
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is number => typeof item === "number" && Number.isFinite(item));
}

function publicRevealTitleList(value: unknown): string[] {
  return stringValue(value)
    ?.split("||")
    .map((item) => item.trim())
    .filter(Boolean) ?? [];
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
