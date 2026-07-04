import {
  DEMO_CARDS_BY_ID,
  type PublicGameEvent,
  type ResolvedGameEffect,
  type Side,
} from "@netgrid/shared";
import {
  isDataFortReclamationInstallPayload,
  isDataFortReclamationRezPayload,
  isExposeOutermostIceEachDataFortPayload,
  isExposeServerCardPayload,
  isSecurityPurgePayload,
  payloadAbilityId,
  payloadRandomRoll,
} from "./action-payload";

export type ChronicleCategory =
  | "turn"
  | "economy"
  | "card"
  | "run"
  | "agenda"
  | "danger"
  | "system"
  | "hidden";
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
  turnSide?: Side | null;
  actionUse?: ChronicleActionUse | null;
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
  hidden: "Verdeckt",
};

const BRAINDANCE_CAMPAIGN_ID = "onr_v1_311_braindance-campaign";
const SHELL_TRADERS_ID = "onr_v1_176_the-shell-traders";
const SKIVVISS_ID = "onr_v1_064_skivviss";
const QUEST_FOR_CATTEKIN_ID = "onr_v1_172_quest-for-cattekin";
const VACUUM_LINK_ID = "onr_v1_275_vacuum-link";
const BLINK_ID = "onr_v1_007_blink";
const SOCIAL_ENGINEERING_ID = "onr_v1_111_social-engineering";
const VIRAL_15_ID = "onr_v1_276_viral-15";
const PLAYFUL_AI_ID = "onr_v1_104_playful-ai";
const GYPSY_SCHEDULE_ANALYZER_ID = "onr_classic_038_gypsytm-schedule-analyzer";

export function isISpySuccessfulRunFollowupPayload(
  payload: Record<string, unknown>,
): boolean {
  return payload.runnerUtilityAbility === "i_spy_put_spy_counter";
}

type EffectSummary = {
  category?: ChronicleCategory;
  suffix?: string;
  sentence?: string;
  chips: string[];
  sourceTitle?: string;
};

export function formatChronicleEvent(
  event: PublicGameEvent,
  side: Side,
  context: Omit<ChronicleContext, "side"> = {},
): ChronicleItem {
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  const actor = sideValue(payload.actor);
  const amount =
    numberValue(payload.gainedCredits) ??
    numberValue(payload.gainCreditsAmount) ??
    numberValue(payload.amount);
  const serverLabel = displayServerLabel(stringValue(payload.serverLabel));
  const selectedServerLabel = displayServerLabel(
    stringValue(payload.selectedServerLabel),
  );
  const zoneLabel = stringValue(payload.zoneLabel);
  const result = stringValue(payload.result);
  const runPhase = stringValue(payload.runPhase);
  const encounterContinue = payload.encounterContinue === true;
  const redactedKind = stringValue(payload.redactedKind);
  const agendaPoints =
    numberValue(payload.agendaPoints) ?? context.agendaPoints;
  const turnNumber = positiveIntegerValue(context.turnNumber);
  const turnSide = context.turnSide ?? undefined;
  const turnChip = turnLabel(actor, turnNumber);
  const actionUse = context.actionUse ?? actionUseFromPayload(payload);
  const label = stringValue(payload.label);
  const explicitCardTitle = context.cardTitle ?? stringValue(payload.title);
  const labelCardTitle = extractCardTitleFromLabel(actionType, label, actor);
  let cardTitle = explicitCardTitle ?? labelCardTitle;
  const sourceDefinitionId = stringValue(payload.sourceDefinitionId);
  const sourceTitle = stringValue(payload.sourceTitle);
  let cardDefinitionId = stringValue(payload.cardDefinitionId);
  let cardText = context.cardText ?? undefined;
  const isAi = Boolean(
    stringValue(payload.aiExplanation) || stringValue(payload.aiReasonCode),
  );
  const subject = subjectFor(actor, side, isAi);
  const effect = summarizeEffect(cardText);
  const mergedCardResolverEffect = mergedCardResolverEventEffect(event);
  const agendaAbility = stringValue(payload.agendaAbility);
  const hiddenZoneAction = stringValue(payload.hiddenZoneAction);
  const abilityId = payloadAbilityId(payload);
  const playfulAiDiceLoop = isPlayfulAiDiceLoopPayload(payload, abilityId);
  const searchReveal = stringValue(payload.searchReveal);
  const searchDestination = stringValue(payload.searchDestination);
  const shellTradersAbility = shellTradersAbilityFromPayload(
    payload,
    abilityId ?? undefined,
  );
  const v1919OperationAbility = stringValue(payload.v1919OperationAbility);
  const shellTradersTargetTitle =
    shellTradersAbility === "set_aside_from_grip" ||
    shellTradersAbility === "remove_shell_counter" ||
    shellTradersAbility === "start_turn_remove_shell_counter" ||
    shellTradersAbility === "auto_install_after_memory_choice"
      ? (targetCardTitleFromPayload(payload) ?? cardTitle)
      : undefined;
  const v1922RunnerProgramAbility = stringValue(
    payload.v1922RunnerProgramAbility,
  );

  const baseChipList = baseChips(actor, isAi);
  let cardDetailLines = context.cardDetailLines ?? [];
  let category: ChronicleCategory = effect.category ?? categoryFor(actionType);
  let importance: ChronicleImportance = "normal";
  let visibility: ChronicleVisibility = "public";
  let title = "";
  let description: string | undefined;
  const chips = [...baseChipList];

  switch (actionType) {
    case "time_expired":
      category = "danger";
      importance = "critical";
      title =
        label ??
        `${actor ? sideLabel(actor) : "Eine Seite"} verliert durch Zeitablauf.`;
      chips.push("Spielerzeit");
      break;
    case "game_created":
      category = "system";
      visibility = "system";
      title = "Das Spiel wurde erstellt.";
      chips.push("Spielstart");
      break;
    case "resolve_choice":
      if (isSecurityPurgePayload(payload)) {
        const summary = securityPurgeChronicleSummary(payload, cardTitle);
        category = "agenda";
        importance = "important";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        title = phrase(subject, summary.title);
        description = summary.description;
        chips.push(...summary.chips);
        break;
      }
      if (v1919OperationAbility === "add_advancement_counters") {
        const added = numberValue(payload.addedAdvancementCounters) ?? 2;
        const targetCount = numberValue(payload.targetCount) ?? 1;
        const targetTitles = titlesForDefinitionIds(
          stringValue(payload.targetCardDefinitionIds),
        );
        const targetTitle = targetCardTitleFromPayload(payload);
        const targetText =
          targetTitles.length > 0
            ? targetTitles.join(", ")
            : (targetTitle ??
              (targetCount === 1 ? "eine Karte" : `${targetCount} Karten`));
        category = "agenda";
        importance = "important";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        title = phrase(
          subject,
          `${added} Advancement-Counter durch Systematic Layoffs auf ${targetText} gelegt`,
        );
        chips.push(
          "Systematic Layoffs",
          `+${added} Advancement`,
          targetCount === 1 ? "1 Ziel" : `${targetCount} Ziele`,
        );
        break;
      }
      if (shellTradersAbility === "auto_install_after_memory_choice") {
        category = "card";
        importance = "important";
        title = phrase(
          subject,
          `${cardTitle ?? "eine Karte"} durch The Shell Traders kostenlos installiert`,
        );
        chips.push("The Shell Traders", "Installiert", "0 Kosten");
        break;
      }
      if (payload.smithsPawnshopTriggered === true) {
        const gainedCredits =
          numberValue(payload.creditsGained) ??
          numberValue(payload.gainedCredits) ??
          0;
        const trashedTitle =
          stringValue(payload.trashedCardTitle) ??
          targetCardTitleFromPayload(payload) ??
          "eine andere installierte Karte";
        category = "economy";
        importance = "important";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        title = phrase(
          subject,
          `${trashedTitle} mit Smith's Pawnshop getrasht und ${creditText(gainedCredits)} erhalten`,
        );
        chips.push(
          "Smith's Pawnshop",
          `+${gainedCredits} ${creditLabel(gainedCredits)}`,
          "Trash",
        );
        break;
      }
      if (payload.smithsPawnshopTriggered === false) {
        category = "card";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        title = phrase(subject, "Smith's Pawnshop nicht genutzt");
        chips.push("Smith's Pawnshop", "Pass");
        break;
      }
      if (playfulAiDiceLoop) {
        const gainedCredits =
          numberValue(payload.playfulAiGainedCredits) ??
          numberValue(payload.randomDiceSplitGainedCredits) ??
          0;
        const setAsideDice =
          numberValue(payload.playfulAiSetAsideDice) ??
          numberValue(payload.randomDiceSplitSetAsideDice) ??
          0;
        const lastRoll = payloadRandomRoll(payload);
        const dieRolls = numberArrayValue(
          payload.playfulAiDieRolls ?? payload.randomDiceLoopRolls,
        );
        const queuedBeforeRolls = numberValue(
          payload.playfulAiDiceQueuedBeforeRolls ??
            payload.randomDiceLoopQueuedBeforeRolls,
        );
        const remainingDice =
          numberValue(payload.playfulAiRemainingDice) ??
          numberValue(payload.playfulAiDiceQueuedAfterRolls) ??
          numberValue(payload.randomDiceLoopRemainingDice) ??
          numberValue(payload.randomDiceLoopQueuedAfterRolls);
        const choiceOpened =
          (payload.playfulAiChoiceOpened ??
            payload.randomDiceSplitChoiceOpened) === true;
        const complete =
          (payload.playfulAiComplete ?? payload.randomDiceLoopComplete) ===
          true;
        category = gainedCredits > 0 ? "economy" : "card";
        visibility = "public";
        title = phrase(
          subject,
          `Playful AI aufgelöst: ${creditText(gainedCredits)} genommen${setAsideDice > 0 ? ` und ${setAsideDice} ${dieText(setAsideDice)} beiseitegelegt` : ""}`,
        );
        description = playfulAiResolveDescription(
          dieRolls,
          queuedBeforeRolls,
          remainingDice,
          choiceOpened,
          complete,
        );
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Playful AI",
          `+${gainedCredits} ${creditLabel(gainedCredits)}`,
          ...(setAsideDice > 0 ? [`${setAsideDice} beiseite`] : []),
          ...playfulAiRollChips(dieRolls, lastRoll),
          ...(choiceOpened && remainingDice !== undefined
            ? [`${remainingDice} offen`]
            : []),
        );
        break;
      }
      if (payload.discardResolved === true) {
        category = "hidden";
        visibility = "redacted";
        title = phrase(
          subject,
          `${cardCountText(numberValue(payload.discardCount) ?? 0)} abgeworfen`,
        );
        chips.push(
          "Discard",
          stringValue(payload.discardZone) === "archives" ? "Archive" : "Heap",
        );
        break;
      }
      if (payload.setupStep === "mulligan") {
        const setupSide = sideValue(payload.setupSide);
        const setupDecision = stringValue(payload.setupDecision);
        const setupDecisionKnown =
          setupDecision === "keep" || setupDecision === "mulligan";
        category = "system";
        visibility = "system";
        title = setupDecisionKnown
          ? `${sideLabel(setupSide)} hat ${setupDecision === "keep" ? "die Starthand behalten" : "einen Mulligan genommen"}`
          : `${sideLabel(setupSide)} hat die Mulligan-Entscheidung abgeschlossen`;
        chips.push(
          "Setup",
          "Starthand",
          setupDecision === "keep"
            ? "Behalten"
            : setupDecision === "mulligan"
              ? "Mulligan"
              : "Entscheidung",
        );
        break;
      }
      if (
        sourceDefinitionId === SOCIAL_ENGINEERING_ID ||
        payload.socialEngineeringRun === true ||
        payloadBooleanValue(payload, "socialEngineeringGuessCorrect") !==
          undefined ||
        payloadBooleanValue(payload, "secretSpendGuessRunGuessCorrect") !==
          undefined ||
        payloadBooleanValue(payload, "autoPassChosenIce") === true ||
        payloadBooleanValue(payload, "socialEngineeringNoIceTarget") === true ||
        payloadBooleanValue(payload, "secretSpendGuessRunNoIceTarget") === true
      ) {
        const hiddenAmount = payloadNumberValue(
          payload,
          "secretHiddenAmountRevealed",
        );
        const guessAmount = payloadNumberValue(payload, "secretGuessAmount");
        const guessCorrect =
          payloadBooleanValue(payload, "secretSpendGuessRunGuessCorrect") ??
          payloadBooleanValue(payload, "socialEngineeringGuessCorrect");
        const noIceTarget =
          payloadBooleanValue(payload, "secretSpendGuessRunNoIceTarget") ===
            true ||
          payloadBooleanValue(payload, "socialEngineeringNoIceTarget") === true;
        const autoPassChosenIce =
          payloadBooleanValue(payload, "autoPassChosenIce") === true ||
          payload.socialEngineeringRun === true;
        const runTarget =
          serverLabel ??
          selectedServerLabel ??
          displayServerLabel(stringValue(payload.serverId)) ??
          "einen Server";
        const chosenIcePosition = payloadNumberValue(
          payload,
          "chosenIcePosition",
        );
        const chosenIceLabel =
          chosenIcePosition !== undefined
            ? `ICE ${chosenIcePosition + 1}`
            : "das gewählte ICE";
        const amountDetail = socialEngineeringAmountDetail(
          hiddenAmount,
          guessAmount,
        );
        category = autoPassChosenIce
          ? "run"
          : guessCorrect === true
            ? "danger"
            : "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId = SOCIAL_ENGINEERING_ID;
        cardTitle = "Social Engineering";
        cardText = undefined;
        cardDetailLines = [];
        if (autoPassChosenIce) {
          title = phrase(
            subject,
            `durch Social Engineering ${runTarget} und ${chosenIceLabel} gewählt; Run auf ${runTarget} gestartet und Auto-Pass für dieses ICE vorgemerkt`,
          );
          description =
            "Die Korp bekommt vor dem Auto-Pass die normale Rez-Gelegenheit.";
          chips.push(
            "Social Engineering",
            "Run",
            runTarget,
            chosenIceLabel,
            "Auto-Pass",
          );
          break;
        }
        if (guessCorrect === true) {
          const lossText =
            hiddenAmount !== undefined
              ? `; Runner verliert ${creditText(hiddenAmount)}`
              : "; Runner verliert den versteckten Betrag";
          title = `Social Engineering: Korp hat richtig geraten${lossText}`;
          description = amountDetail;
          chips.push(
            "Social Engineering",
            "Guess richtig",
            ...(hiddenAmount !== undefined ? [`Runner ${hiddenAmount}`] : []),
            ...(guessAmount !== undefined ? [`Korp ${guessAmount}`] : []),
            ...(hiddenAmount !== undefined
              ? [`-${hiddenAmount} ${creditLabel(hiddenAmount)}`]
              : []),
          );
          break;
        }
        if (guessCorrect === false) {
          title = noIceTarget
            ? "Social Engineering: Korp hat falsch geraten; kein ICE-Ziel verfügbar"
            : "Social Engineering: Korp hat falsch geraten; Runner wählt Server und ICE";
          description = noIceTarget
            ? `${amountDetail} Es gibt kein installiertes ICE, das für den Auto-Pass gewählt werden kann.`
            : `${amountDetail} Der Runner darf danach einen Server und ein ICE für den Auto-Pass-Run wählen.`;
          chips.push(
            "Social Engineering",
            "Guess falsch",
            ...(hiddenAmount !== undefined ? [`Runner ${hiddenAmount}`] : []),
            ...(guessAmount !== undefined ? [`Korp ${guessAmount}`] : []),
            noIceTarget ? "Kein ICE" : "Zielwahl",
          );
          break;
        }
        title = phrase(
          subject,
          "für Social Engineering verdeckt Credits gewählt",
        );
        description = "Der Betrag bleibt bis zum Korp-Guess verdeckt.";
        chips.push("Social Engineering", "Verdeckte Wahl");
        break;
      }
      if (
        payload.runnerProgramTrashBeforeInstall === true ||
        payload.runnerProgramTrashBeforeInstallResolved === true
      ) {
        const installedDefinitionId = sourceDefinitionId ?? cardDefinitionId;
        const installedTitle =
          titleForDefinitionId(installedDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "das Programm";
        const trashedTitles = titlesForDefinitionIds(
          stringValue(payload.trashedCardDefinitionIds),
        );
        const trashedCount =
          numberValue(payload.trashedCount) ?? trashedTitles.length;
        const trashedText =
          trashedTitles.length > 0
            ? joinChronicleParts(trashedTitles)
            : trashedCount > 0
              ? `${trashedCount} Programm${trashedCount === 1 ? "" : "e"}`
              : undefined;
        const installed = payload.installed === true;
        const memoryUsedAfter = numberValue(payload.memoryUsedAfter);
        const memoryLimitAfter = numberValue(payload.memoryLimitAfter);
        category = "card";
        importance = installed ? "important" : "normal";
        visibility = "public";
        cardDefinitionId = installedDefinitionId ?? cardDefinitionId;
        cardTitle = installedTitle;
        title = installed
          ? phrase(
              subject,
              `${installedTitle} im Rig installiert${
                trashedText
                  ? `; ${trashedText} ${trashedCount === 1 ? "wurde" : "wurden"} für MU getrasht`
                  : ""
              }`,
            )
          : phrase(
              subject,
              `${installedTitle} nicht installiert; MU wurde nicht freigemacht`,
            );
        description =
          memoryUsedAfter !== undefined && memoryLimitAfter !== undefined
            ? `MU nach Installation: ${memoryUsedAfter}/${memoryLimitAfter}.`
            : installed
              ? undefined
              : "Die Installation wurde abgebrochen, weil nicht genug MU freigemacht wurde.";
        chips.push(
          installedTitle,
          "Programmtrash",
          installed ? "Installiert" : "Nicht installiert",
          installed ? "MU freigemacht" : "MU blockiert",
          ...(trashedCount > 0 ? [`${trashedCount} Trash`] : []),
          ...trashedTitles,
        );
        break;
      }
      {
        const hiddenZoneAction = stringValue(payload.hiddenZoneAction);
        const programTrashCount = numberValue(payload.programTrashCount);
        const isViral15ProgramTrash =
          hiddenZoneAction === "v1922_viral_15_program_trash" ||
          (sourceDefinitionId === VIRAL_15_ID &&
            programTrashCount !== undefined);
        if (isViral15ProgramTrash && programTrashCount !== undefined) {
          const source =
            titleForDefinitionId(sourceDefinitionId ?? VIRAL_15_ID) ??
            sourceTitle ??
            cardTitle ??
            "Viral 15";
          const trashedDefinitionId = stringValue(
            payload.trashedCardDefinitionId,
          );
          const trashedTitle =
            titleForDefinitionId(trashedDefinitionId) ??
            stringValue(payload.trashedTitle) ??
            `${programTrashCount} Programm${programTrashCount === 1 ? "" : "e"}`;
          category = "danger";
          importance = "critical";
          visibility = "public";
          cardDefinitionId = sourceDefinitionId ?? VIRAL_15_ID;
          cardTitle = source;
          title = phrase(subject, `${trashedTitle} durch ${source} getrasht`);
          description =
            "Der Programmtrash wurde über eine Runner-private Auswahl aufgelöst; verdeckte Hand- oder Stack-Daten bleiben verborgen.";
          chips.push(source, "Programm getrasht", trashedTitle);
          break;
        }
      }
      {
        const ambushEffect = resolvedEffectsFromPayload(
          payload.resolvedEffects,
        ).find(
          (effect) =>
            (effect.visibility === "hidden_info_barrier" ||
              stringValue(effect.reason) === "access_effect" ||
              isPattelAccessCounterType(effect.counterType)) &&
            (stringValue(effect.sourceDefinitionId) ||
              stringValue(effect.sourceTitle)),
        );
        const ambushDefinitionId =
          stringValue(payload.ambushDefinitionId) ??
          stringValue(payload.accessEffectSourceDefinitionId) ??
          stringValue(ambushEffect?.sourceDefinitionId);
        const ambushPaidCost =
          numberValue(payload.ambushPaidCost) ??
          (isPattelAccessCounterType(ambushEffect?.counterType) &&
          payload.ambushPaymentDeclined !== true
            ? 3
            : undefined);
        if (
          ambushDefinitionId &&
          (ambushPaidCost !== undefined ||
            payload.ambushPaymentDeclined === true ||
            ambushEffect)
        ) {
          const source =
            titleForDefinitionId(ambushDefinitionId) ??
            stringValue(ambushEffect?.sourceTitle) ??
            sourceTitle ??
            cardTitle ??
            "Access-Ambush";
          category = "run";
          importance =
            ambushPaidCost === 0 || payload.ambushPaymentDeclined === true
              ? "normal"
              : "important";
          visibility = "public";
          cardDefinitionId = cardDefinitionId ?? ambushDefinitionId;
          cardTitle = cardTitle ?? source;
          title =
            ambushPaidCost && ambushPaidCost > 0
              ? phrase(
                  subject,
                  `${creditText(ambushPaidCost)} für den Access-Ambush von ${source} bezahlt`,
                )
              : payload.ambushPaymentDeclined === true
                ? phrase(
                    subject,
                    `den Access-Ambush von ${source} nicht bezahlt`,
                  )
                : phrase(subject, `den Access-Ambush von ${source} ausgelöst`);
          chips.push(
            "Access-Ambush",
            source,
            ambushPaidCost && ambushPaidCost > 0
              ? `${ambushPaidCost} ${creditLabel(ambushPaidCost)}`
              : payload.ambushPaymentDeclined === true
                ? "Nicht bezahlt"
                : "Ausgelöst",
          );
          break;
        }
      }
      if (sourceDefinitionId === "onr_v1_199_employee-empowerment") {
        const decision = stringValue(
          payload.employeeEmpowermentStartDrawDecision,
        );
        const drawn =
          numberValue(payload.drawnCards) ??
          numberValue(payload.drawnCount) ??
          0;
        category = "card";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        cardTitle = cardTitle ?? "Employee Empowerment";
        title =
          decision === "draw"
            ? phrase(
                subject,
                `${cardTitle} genutzt und ${cardCountText(drawn)} zusätzlich gezogen`,
              )
            : phrase(subject, `${cardTitle} übersprungen`);
        chips.push(
          "Employee Empowerment",
          "Start-of-turn",
          decision === "draw" ? "Zusatzkarte" : "Übersprungen",
        );
        break;
      }
      if (payload.secretSpendRevealed === true) {
        const corpSpend = numberValue(payload.secretSpendCorp) ?? 0;
        const runnerSpend = numberValue(payload.secretSpendRunner) ?? 0;
        const endRun = payload.tooManyDoorsEndRun === true;
        const corpCreditsAfter = numberValue(payload.corpCreditsAfter);
        const runnerCreditsAfter = numberValue(payload.runnerCreditsAfter);
        category = "run";
        importance = endRun ? "important" : "normal";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        cardTitle =
          cardTitle ??
          titleForDefinitionId(sourceDefinitionId) ??
          "Too Many Doors";
        title = `Too Many Doors aufgedeckt: Korp ${creditText(corpSpend)}, Runner ${creditText(runnerSpend)}; ${endRun ? "Run endet" : "Run läuft weiter"}`;
        description =
          corpCreditsAfter !== undefined && runnerCreditsAfter !== undefined
            ? `Nach der Zahlung: Korp ${creditText(corpCreditsAfter)}, Runner ${creditText(runnerCreditsAfter)}.`
            : undefined;
        chips.push(
          "Too Many Doors",
          `Korp -${corpSpend}`,
          `Runner -${runnerSpend}`,
          endRun ? "Run endet" : "Weiter",
        );
        break;
      }
      if (payload.traceStep === "corp_bid") {
        const corpBid = numberValue(payload.corpBid) ?? 0;
        const hackerTrackerCountersSpent =
          numberValue(payload.hackerTrackerCountersSpent) ?? 0;
        const traceStrength = numberValue(payload.traceStrength);
        const runnerLink = numberValue(payload.runnerLink);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `im Trace ${creditText(corpBid)} geboten`);
        description =
          traceStrength !== undefined
            ? `Trace-Stärke: ${traceStrength}${runnerLink !== undefined ? `, Runner-Link: ${runnerLink}` : ""}${hackerTrackerCountersSpent > 0 ? `; ${hackerTrackerCountersSpent} Hacker-Tracker-Counter eingesetzt` : ""}.`
            : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Trace",
          `Korp-Gebot ${corpBid}`,
          ...(hackerTrackerCountersSpent > 0
            ? [`HTC -${hackerTrackerCountersSpent}`]
            : []),
          ...(traceStrength !== undefined ? [`Trace ${traceStrength}`] : []),
          ...(runnerLink !== undefined ? [`Link ${runnerLink}`] : []),
        );
        break;
      }
      if (payload.traceStep === "base_link") {
        const baseLinkUsed = payload.baseLinkUsed === true;
        const baseLinkValue = numberValue(payload.baseLinkValue) ?? 0;
        const baseLinkCost = numberValue(payload.traceBaseLinkCostPaid) ?? 0;
        const runnerLink = numberValue(payload.runnerLink);
        const baseLinkDefinitionId = stringValue(
          payload.traceBaseLinkSourceDefinitionId,
        );
        const baseLinkTitle =
          titleForDefinitionId(baseLinkDefinitionId) ?? "eine Base-Link-Karte";
        category = "danger";
        importance = "important";
        visibility = "public";
        title = baseLinkUsed
          ? phrase(
              subject,
              `${baseLinkTitle} als Base Link ${baseLinkValue} genutzt`,
            )
          : phrase(subject, "keine Base-Link-Karte genutzt");
        description =
          runnerLink !== undefined
            ? `Runner-Link: ${runnerLink}${baseLinkUsed && baseLinkCost > 0 ? `; Kosten: ${creditText(baseLinkCost)}` : ""}.`
            : undefined;
        cardDefinitionId =
          cardDefinitionId ?? baseLinkDefinitionId ?? sourceDefinitionId;
        cardTitle = baseLinkUsed ? baseLinkTitle : cardTitle;
        chips.push(
          "Trace",
          "Base Link",
          baseLinkUsed ? baseLinkTitle : "Nicht genutzt",
          ...(baseLinkUsed ? [`Link ${baseLinkValue}`] : []),
          ...(baseLinkCost > 0
            ? [`-${baseLinkCost} Credit${baseLinkCost === 1 ? "" : "s"}`]
            : []),
        );
        break;
      }
      if (payload.traceStep === "runner_bid") {
        const corpBid = numberValue(payload.corpBid) ?? 0;
        const runnerBid = numberValue(payload.runnerBid) ?? 0;
        const traceStrength = numberValue(payload.traceStrength);
        const runnerStrength = numberValue(payload.runnerStrength);
        const tagsAdded = numberValue(payload.tagsAdded) ?? 0;
        const addedCounterAmount = numberValue(payload.addedCounterAmount) ?? 0;
        const addedCounterLabel =
          addedCounterAmount > 0
            ? counterLabel(payload.counterType)
            : undefined;
        const hackerTrackerCountersAdded =
          numberValue(payload.hackerTrackerCountersAdded) ?? 0;
        const runnerRunLockCreditCost =
          numberValue(payload.runnerRunLockCreditCost) ??
          numberValue(payload.fangRunLockCreditCost);
        const successful = payload.traceSuccessful === true;
        const hardwareWreckerEffect =
          successful &&
          payload.traceSuccessEffect === "hardware_trash_meat_damage_end_run";
        const trashedCount = numberValue(payload.trashedCount) ?? 0;
        const damageAmount = numberValue(payload.damageAmount) ?? 0;
        category = "danger";
        importance = "important";
        visibility = "public";
        title = `Trace entschieden: ${traceParticipantLabel("corp", side)} ${creditText(corpBid)}, ${traceParticipantLabel("runner", side)} ${creditText(runnerBid)}; ${successful ? "Trace erfolgreich" : "Trace abgewehrt"}`;
        description =
          traceStrength !== undefined && runnerStrength !== undefined
            ? `Endstand: Trace ${traceStrength} gegen Runner-Stärke ${runnerStrength}${payload.runnerRunEnded === true || payload.fangRunEnded === true ? `; Karteneffekt beendet den Run und sperrt weitere Runs bis zur Zahlung von ${creditText(runnerRunLockCreditCost ?? 2)}` : ""}${addedCounterAmount > 0 && addedCounterLabel ? `; Runner erhält ${addedCounterAmount} ${addedCounterLabel}` : ""}${hardwareWreckerEffect ? `; Karteneffekt: ${trashedCount} Hardware getrasht, ${damageAmount} Meat-Schaden${payload.damageCannotBePrevented === true ? " nicht verhinderbar" : ""}, Run endet` : ""}${hackerTrackerCountersAdded > 0 ? `; Hacker Tracker Central erhält ${hackerTrackerCountersAdded} Counter` : ""}.`
            : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Trace",
          `Korp ${corpBid}`,
          `Runner ${runnerBid}`,
          ...(traceStrength !== undefined && runnerStrength !== undefined
            ? [`${traceStrength}:${runnerStrength}`]
            : []),
          successful ? "Erfolg" : "Fehlschlag",
          ...(tagsAdded > 0
            ? [`+${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`]
            : []),
          ...(addedCounterAmount > 0 && addedCounterLabel
            ? [`+${addedCounterAmount} ${addedCounterLabel}`]
            : []),
          ...(hardwareWreckerEffect
            ? [
                `Hardware -${trashedCount}`,
                `${damageAmount} Schaden`,
                "Run endet",
              ]
            : []),
          ...(payload.runnerRunEnded === true || payload.fangRunEnded === true
            ? ["Run endet", `Run-Sperre ${runnerRunLockCreditCost ?? 2}`]
            : []),
          ...(hackerTrackerCountersAdded > 0
            ? [`HTC +${hackerTrackerCountersAdded}`]
            : []),
        );
        break;
      }
      if (payload.traceStep === "post_bid_link") {
        const linkDelta = numberValue(payload.postBidTraceLinkDelta) ?? 0;
        const linkBonus = numberValue(payload.postBidTraceLinkBonus) ?? 0;
        const linkCost = numberValue(payload.postBidTraceLinkCostPaid) ?? 0;
        const linkDefinitionId = stringValue(
          payload.postBidTraceLinkSourceDefinitionId,
        );
        const linkTitle =
          titleForDefinitionId(linkDefinitionId) ??
          cardTitle ??
          "eine Link-Fähigkeit";
        const runnerLink = numberValue(payload.runnerLink);
        const runnerStrength = numberValue(payload.runnerStrength);
        const traceStrength = numberValue(payload.traceStrength);
        const runnerBid = numberValue(payload.runnerBid) ?? 0;
        const corpBid = numberValue(payload.corpBid) ?? 0;
        const successful = payload.traceSuccessful === true;
        const resolved = typeof payload.traceSuccessful === "boolean";
        const openedNext = payload.postBidTraceLinkChoiceOpened === true;
        const applied =
          payload.eventModificationDecision === "apply" && linkDelta > 0;
        category = "danger";
        importance = "important";
        visibility = "public";
        title = applied
          ? phrase(
              subject,
              `${linkTitle} für +${linkDelta} Link genutzt${resolved ? `; ${successful ? "Trace erfolgreich" : "Trace abgewehrt"}` : ""}`,
            )
          : resolved
            ? `Trace entschieden: ${traceParticipantLabel("corp", side)} ${creditText(corpBid)}, ${traceParticipantLabel("runner", side)} ${creditText(runnerBid)}; ${successful ? "Trace erfolgreich" : "Trace abgewehrt"}`
            : phrase(subject, "keine Post-Bid-Link-Fähigkeit genutzt");
        description =
          resolved &&
          traceStrength !== undefined &&
          runnerStrength !== undefined
            ? `Endstand: Trace ${traceStrength} gegen Runner-Stärke ${runnerStrength}${linkBonus > 0 ? `; Post-Bid-Link: +${linkBonus}` : ""}.`
            : runnerLink !== undefined || runnerStrength !== undefined
              ? `Runner-Link: ${runnerLink ?? 0}${runnerStrength !== undefined ? `, Runner-Stärke: ${runnerStrength}` : ""}${openedNext ? "; weitere Link-Fähigkeiten verfügbar" : ""}.`
              : undefined;
        cardDefinitionId =
          cardDefinitionId ?? linkDefinitionId ?? sourceDefinitionId;
        cardTitle = applied ? linkTitle : cardTitle;
        chips.push(
          "Trace",
          ...(applied ? [linkTitle, `+${linkDelta} Link`] : ["Post-Bid-Link"]),
          ...(linkCost > 0
            ? [`-${linkCost} Credit${linkCost === 1 ? "" : "s"}`]
            : []),
          ...(linkBonus > 0 ? [`Gesamt +${linkBonus}`] : []),
          ...(traceStrength !== undefined && runnerStrength !== undefined
            ? [`${traceStrength}:${runnerStrength}`]
            : []),
          ...(resolved ? [successful ? "Erfolg" : "Fehlschlag"] : []),
        );
        break;
      }
      if (abilityId === "arasaka_owns_you_flatline_replacement") {
        const preventedAmount =
          numberValue(payload.preventedAmount) ??
          numberValue(payload.originalAmount) ??
          0;
        const drawnCards = numberValue(payload.drawnCards) ?? 0;
        const removedTags = numberValue(payload.removedTags) ?? 0;
        const coreDamageRemoved = numberValue(payload.coreDamageRemoved) ?? 0;
        const debt = numberValue(payload.futureAgendaPointForfeitPending) ?? 0;
        category = "danger";
        importance = "critical";
        visibility = "public";
        title = phrase(
          subject,
          `${cardTitle ?? "Arasaka Owns You"} gespielt und ${preventedAmount} Schaden ersetzt`,
        );
        description = `${drawnCards} Karten nachgezogen, ${creditText(10)} erhalten, ${removedTags} Tag${removedTags === 1 ? "" : "s"} entfernt${coreDamageRemoved > 0 ? `, ${coreDamageRemoved} Core Damage entfernt` : ""}; die nächsten ${debt} Agenda-Punkte werden forfeitet.`;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Arasaka Owns You",
          "Flatline verhindert",
          "+10 Credits",
          "4 Aktionen Schuld",
          `${debt} Agenda-Punkte`,
        );
        break;
      }
      if (
        stringValue(payload.imminentEventType) === "add_tag" &&
        typeof payload.eventModificationDecision === "string"
      ) {
        const originalTags =
          numberValue(payload.originalAmount) ??
          numberValue(payload.tagsAdded) ??
          0;
        const finalTags =
          numberValue(payload.finalAmount) ??
          numberValue(payload.tagsAdded) ??
          Math.max(0, originalTags - (numberValue(payload.preventedTags) ?? 0));
        const preventedTags =
          numberValue(payload.preventedTags) ??
          Math.max(0, originalTags - finalTags);
        const preventionSource =
          titleForDefinitionId(sourceDefinitionId) ?? sourceTitle ?? cardTitle;
        const tagSourceDefinitionId =
          stringValue(payload.accessEffectSourceDefinitionId) ??
          stringValue(payload.ambushDefinitionId);
        const tagSource = titleForDefinitionId(tagSourceDefinitionId);
        category = "danger";
        importance = "important";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        if (preventionSource) cardTitle = cardTitle ?? preventionSource;
        if (
          payload.eventModificationDecision === "apply" &&
          preventedTags > 0
        ) {
          title =
            payload.sourceTrashed === true && preventionSource
              ? phrase(
                  subject,
                  `${preventionSource} getrasht und ${tagCountText(preventedTags)}${tagSource ? ` durch ${tagSource}` : ""} verhindert`,
                )
              : phrase(
                  subject,
                  `${tagCountText(preventedTags)}${tagSource ? ` durch ${tagSource}` : ""}${preventionSource ? ` mit ${preventionSource}` : ""} verhindert`,
                );
          description =
            finalTags > 0
              ? `${tagCountText(finalTags)} bleibt übrig.`
              : undefined;
          chips.push(
            "Tag verhindert",
            `${preventedTags} verhindert`,
            ...(preventionSource ? [preventionSource] : []),
            ...(tagSource ? [tagSource] : []),
            ...(payload.sourceTrashed === true ? ["Source-Trash"] : []),
            ...(finalTags > 0 ? [`${finalTags} übrig`] : []),
          );
        } else {
          title = phrase(
            subject,
            tagSource
              ? `keine Tag-Prevention gegen ${tagSource} genutzt`
              : "keine Tag-Prevention genutzt",
          );
          description = `${sideLabel("runner")} hat ${tagCountText(finalTags)} erhalten.`;
          chips.push(
            "Tag-Prevention",
            "Nicht genutzt",
            ...(preventionSource ? [preventionSource] : []),
            ...(tagSource ? [tagSource] : []),
            ...(finalTags > 0
              ? [`+${finalTags} Tag${finalTags === 1 ? "" : "s"}`]
              : []),
          );
        }
        break;
      }
      if (
        payload.eventModificationDecision === "apply" &&
        numberValue(payload.preventedAmount) !== undefined
      ) {
        const preventedAmount = numberValue(payload.preventedAmount) ?? 0;
        const damageAmount = numberValue(payload.damageAmount);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${preventedAmount} Schaden${cardTitle ? ` mit ${cardTitle}` : ""} verhindert`,
        );
        description =
          damageAmount !== undefined
            ? `${damageAmount} Schaden bleibt übrig.`
            : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Prävention",
          `${preventedAmount} verhindert`,
          ...(damageAmount !== undefined ? [`${damageAmount} übrig`] : []),
        );
        break;
      }
      if (isDataFortReclamationInstallPayload(payload)) {
        const installedCount = numberValue(payload.installedCount) ?? 0;
        const installedIceCount = numberValue(payload.installedIceCount) ?? 0;
        const installedRootCount = numberValue(payload.installedRootCount) ?? 0;
        const temporaryCreditsProvided =
          numberValue(payload.temporaryCreditsProvided) ?? 0;
        const rezCandidateCount =
          numberValue(payload.dataFortReclamationRezCandidateCount) ?? 0;
        category = "hidden";
        importance = "important";
        visibility = "redacted";
        title = phrase(
          subject,
          `${cardCountText(installedCount)} mit Data Fort Reclamation installiert`,
        );
        description = `${installedIceCount} ICE und ${installedRootCount} Root-Karte${installedRootCount === 1 ? "" : "n"} wurden verdeckt installiert${rezCandidateCount > 0 ? "; anschließend kann daraus gerezzt werden" : ""}.`;
        chips.push(
          "Data Fort",
          `${installedCount} Install`,
          `${installedIceCount} ICE`,
          `${temporaryCreditsProvided} Temp-Credits`,
        );
        break;
      }
      if (hiddenZoneAction === "v162_priority_requisition_free_rez") {
        const targetDefinitionId = stringValue(
          payload.priorityRequisitionTargetDefinitionId,
        );
        const rezCostPaid = numberValue(payload.rezCostPaid) ?? 0;
        category = "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId = targetDefinitionId ?? cardDefinitionId;
        title = phrase(
          subject,
          `${cardTitle ?? "ein ICE"} durch Priority Requisition kostenlos gerezzt`,
        );
        description = `Priority Requisition hat die Rez-Kosten auf ${creditText(rezCostPaid)} gesetzt.`;
        chips.push(
          "Priority Requisition",
          "Rez",
          `${rezCostPaid} ${creditLabel(rezCostPaid)}`,
        );
        break;
      }
      if (isDataFortReclamationRezPayload(payload)) {
        const rezzedCount = numberValue(payload.rezzedCount) ?? 0;
        const rezzedIceCount = numberValue(payload.rezzedIceCount) ?? 0;
        const rezzedRootCount = numberValue(payload.rezzedRootCount) ?? 0;
        const temporaryCreditsSpent =
          numberValue(payload.temporaryCreditsSpent) ?? 0;
        const corpCreditsSpent = numberValue(payload.corpCreditsSpent) ?? 0;
        category = "card";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${cardCountText(rezzedCount)} aus Data Fort Reclamation gerezzt`,
        );
        description = `${rezzedIceCount} ICE und ${rezzedRootCount} Root-Karte${rezzedRootCount === 1 ? "" : "n"} wurden gerezzt; ${temporaryCreditsSpent} temporäre und ${corpCreditsSpent} normale Credits wurden ausgegeben.`;
        chips.push(
          "Data Fort",
          `${rezzedCount} Rez`,
          `${temporaryCreditsSpent} Temp`,
          `${corpCreditsSpent} Credits`,
        );
        break;
      }
      if (abilityId === "force_rez_or_trash_ice") {
        const targetDefinitionId = stringValue(payload.targetCardDefinitionId);
        const targetTitle = titleForDefinitionId(targetDefinitionId);
        const targetIceLabel =
          displayServerLabel(stringValue(payload.targetIcePositionLabel)) ??
          displayServerLabel(stringValue(payload.targetServerLabel)) ??
          "einem Server";
        const corpDecision = stringValue(payload.corpDecision);
        category = "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId = targetDefinitionId ?? cardDefinitionId;
        if (corpDecision === "rez_ice") {
          const rezCostPaid = numberValue(payload.rezCostPaid) ?? 0;
          title = phrase(
            subject,
            `entschieden, ${targetTitle ? `${targetTitle} als ${targetIceLabel}` : targetIceLabel} zu rezzen`,
          );
          description = `Rez-Kosten: ${creditText(rezCostPaid)}.`;
          chips.push(
            "Forged Activation Orders",
            "Rez",
            `${rezCostPaid} ${creditLabel(rezCostPaid)}`,
            targetIceLabel,
          );
          break;
        }
        if (corpDecision === "trash_ice") {
          title = phrase(
            subject,
            `entschieden, ${targetTitle ? `${targetTitle} als ${targetIceLabel}` : targetIceLabel} zu trashen`,
          );
          chips.push("Forged Activation Orders", "Trash", targetIceLabel);
          break;
        }
        title = phrase(
          subject,
          `${targetIceLabel} für Forged Activation Orders gewählt`,
        );
        chips.push("Forged Activation Orders", "Ziel", targetIceLabel);
        break;
      }
      if (hiddenZoneAction === "aardvark_rez_trash_worm") {
        category = "danger";
        importance = "important";
        visibility = "public";
        title = phrase(subject, "Aardvark gerezzt und Worm getrasht");
        cardDefinitionId =
          cardDefinitionId ?? stringValue(payload.publicRevealDefinitionId);
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
        const targetServerLabel = displayServerLabel(
          stringValue(payload.targetServerLabel),
        );
        const rezCostPaid = numberValue(payload.rezCostPaid) ?? 0;
        category = "card";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${cardTitle ?? "ein gerezztes ICE"}${targetServerLabel ? ` in ${targetServerLabel}` : ""} getrasht und ${creditText(rezCostPaid)} bezahlt`,
        );
        cardDefinitionId =
          targetDefinitionId ?? cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Core Command",
          "Trash",
          `${rezCostPaid} ${creditLabel(rezCostPaid)}`,
          ...(targetServerLabel ? [targetServerLabel] : []),
        );
        break;
      }
      if (abilityId === "successful_hq_run_corp_pay_to_retain_hq") {
        const retainedCount = numberValue(payload.retainedCount) ?? 0;
        const discardedCount = numberValue(payload.discardedCount) ?? 0;
        const creditsPaid = retainedCount * 2;
        const isYou = subject === "Du";
        category = "hidden";
        importance = "important";
        visibility = "public";
        cardDefinitionId =
          cardDefinitionId ??
          sourceDefinitionId ??
          "onr_v1_113_synchronized-attack-on-hq";
        title = `${subject} ${isYou ? "behältst" : "behält"} mit Synchronized Attack on HQ ${hqCardCountText(retainedCount)}, ${isYou ? "wirfst" : "wirft"} ${hqCardCountText(discardedCount)} verdeckt ab und ${isYou ? "bezahlst" : "bezahlt"} dafür ${creditText(creditsPaid)}.`;
        chips.push(
          "Synchronized Attack",
          `${retainedCount} behalten`,
          `${discardedCount} verdeckt abgeworfen`,
          `${creditsPaid} ${creditLabel(creditsPaid)}`,
        );
        break;
      }
      if (hiddenZoneAction === "search_stack") {
        const destinationLabel = searchDestinationLabel(searchDestination);
        const installFailed =
          searchDestination === "install_program" &&
          payload.installSucceeded === false;
        const installPendingMemoryTrash =
          searchDestination === "install_program" &&
          payload.installPendingMemoryTrash === true;
        const temporaryInstall = payload.temporaryInstall === true;
        category = searchReveal === "public" ? "card" : "hidden";
        importance = "important";
        visibility = searchReveal === "public" ? "public" : "redacted";
        title =
          searchReveal === "public"
            ? installPendingMemoryTrash
              ? phrase(
                  subject,
                  `${cardTitle ?? "ein Programm"} aus dem Stack vorgezeigt; MU muss freigemacht werden`,
                )
              : installFailed
                ? phrase(
                    subject,
                    `${cardTitle ?? "ein Programm"} aus dem Stack vorgezeigt, aber nicht installiert`,
                  )
                : phrase(
                    subject,
                    `${cardTitle ?? "ein Programm"} aus dem Stack vorgezeigt und ${searchDestination === "install_program" ? `im Rig installiert${temporaryInstall ? "; Rückkehr am Zugende" : ""}` : `in ${destinationLabel} genommen`}`,
                  )
            : phrase(
                subject,
                `${cardCountText(numberValue(payload.selectedCount) ?? 1)} verdeckt aus dem Stack in ${destinationLabel} genommen`,
              );
        chips.push(
          "Stack",
          searchReveal === "public" ? "Vorgezeigt" : "Verdeckt",
          installPendingMemoryTrash
            ? "MU freimachen"
            : installFailed
              ? "Nicht installiert"
              : destinationLabel,
          ...(temporaryInstall ? ["Temporär"] : []),
          ...(payload.searchShuffleAfter === true || payload.shuffled === true
            ? ["Shuffle"]
            : []),
        );
        break;
      }
      if (hiddenZoneAction === "p3_37_search_stack_to_grip") {
        const revealedTitle =
          titleForDefinitionId(stringValue(payload.publicRevealDefinitionId)) ??
          titleForDefinitionId(cardDefinitionId) ??
          cardTitle;
        const isPublicReveal =
          stringValue(payload.publicRevealKind) === "reveal" ||
          Boolean(stringValue(payload.publicRevealDefinitionId)) ||
          Boolean(cardDefinitionId);
        category = isPublicReveal ? "card" : "hidden";
        importance = "important";
        visibility = isPublicReveal ? "public" : "redacted";
        title = isPublicReveal
          ? phrase(
              subject,
              `${revealedTitle ?? "eine Karte"} aus dem Stack vorgezeigt und auf die Hand genommen`,
            )
          : phrase(
              subject,
              `${cardCountText(numberValue(payload.selectedCount) ?? 1)} verdeckt aus dem Stack auf die Hand genommen`,
            );
        chips.push(
          "Stack",
          isPublicReveal ? "Vorgezeigt" : "Verdeckt",
          "Hand",
          ...(payload.shufflePerformed === true || payload.shuffled === true
            ? ["Shuffle"]
            : []),
        );
        break;
      }
      if (hiddenZoneAction === "v1911_aujourdoui_top5") {
        const revealedTitles = titlesForDefinitionIds(
          stringValue(payload.publicRevealDefinitionIds),
        );
        const selectedCount =
          numberValue(payload.selectedCount) ?? revealedTitles.length;
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          "Aujourd'Oui";
        const shuffleSuffix =
          payload.shuffled === true ? " und danach den Stack gemischt" : "";
        category = "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId =
          stringValue(payload.publicRevealDefinitionId) ?? cardDefinitionId;
        title =
          selectedCount > 0
            ? phrase(
                subject,
                `${source} genutzt, ${revealedTitles.length > 0 ? revealedTitles.join(", ") : cardCountText(selectedCount)} vorgezeigt, in den Grip genommen${shuffleSuffix}`,
              )
            : phrase(
                subject,
                `${source} genutzt, keine Programme aus den obersten 5 genommen${shuffleSuffix}`,
              );
        chips.push(
          source,
          "Top 5",
          selectedCount === 1 ? "1 Programm" : `${selectedCount} Programme`,
          ...(selectedCount > 0 ? ["Vorgezeigt", "Grip"] : ["Keine Auswahl"]),
          ...(payload.shuffled === true ? ["Shuffle"] : []),
        );
        break;
      }
      if (hiddenZoneAction === "v1911_short_circuit_search") {
        const programTitle =
          publicRevealTitleFromPayload(payload) ?? cardTitle ?? "ein Programm";
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          "The Short Circuit";
        category = "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId =
          stringValue(payload.publicRevealDefinitionId) ?? cardDefinitionId;
        title = phrase(
          subject,
          `${source} genutzt, ${programTitle} der Korp gezeigt und in die Hand genommen`,
        );
        description =
          payload.shuffled === true
            ? "Der Stack wurde danach gemischt."
            : undefined;
        chips.push(
          source,
          "Stack",
          "Vorgezeigt",
          "Hand",
          ...(payload.shuffled === true ? ["Shuffle"] : []),
        );
        break;
      }
      if (
        hiddenZoneAction ===
        "p3_38_look_top_stack_show_to_corp_then_install_matching"
      ) {
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          "Mystery Box";
        const revealCount = numberValue(payload.revealCount);
        const revealedText = mysteryBoxRevealedStackText(revealCount);
        const shuffled =
          payload.shufflePerformed === true || payload.shuffled === true;
        const selfTrashed = payload.selfTrashed === true;
        const installed =
          payload.installed === true ||
          (numberValue(payload.installedProgramCount) ?? 0) > 0 ||
          Boolean(stringValue(payload.installedProgramDefinitionId));
        category = "run";
        importance = "important";
        visibility = "public";
        if (installed) {
          const programTitle =
            titleForDefinitionId(
              stringValue(payload.installedProgramDefinitionId),
            ) ??
            publicRevealTitleFromPayload(payload) ??
            cardTitle ??
            "ein Programm";
          cardDefinitionId =
            stringValue(payload.installedProgramDefinitionId) ??
            stringValue(payload.publicRevealDefinitionId) ??
            cardDefinitionId;
          title = phrase(
            subject,
            `${programTitle} mit ${source} gewählt und im Rig installiert`,
          );
          description = `${revealedText} der Korp gezeigt; ${source} wurde getrasht${shuffled ? "; der Stack wurde danach gemischt" : ""}.`;
          chips.push(
            source,
            mysteryBoxTopChip(revealCount),
            "Korp-Reveal",
            "Installiert",
            "Source-Trash",
            ...(shuffled ? ["Shuffle"] : []),
          );
          break;
        }
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        title =
          payload.programFound === false
            ? phrase(
                subject,
                `${source} bestätigt; kein installierbares Programm wurde gefunden`,
              )
            : phrase(
                subject,
                `${source} bestätigt; Runner-Programmauswahl geöffnet`,
              );
        description =
          payload.programFound === false
            ? `${revealedText} der Korp gezeigt; ${source} bleibt installiert${shuffled ? "; der Stack wurde danach gemischt" : ""}.`
            : `${revealedText} der Korp gezeigt; anschließend wählt der Runner ein installierbares Programm.`;
        chips.push(
          source,
          mysteryBoxTopChip(revealCount),
          "Korp-Reveal",
          payload.programFound === false
            ? "Keine Installation"
            : "Programmauswahl",
          selfTrashed ? "Source-Trash" : "Bleibt installiert",
          ...(shuffled ? ["Shuffle"] : []),
        );
        break;
      }
      if (hiddenZoneAction === "self_modifying_code_install_program") {
        const programTitle =
          publicRevealTitleFromPayload(payload) ?? cardTitle ?? "ein Programm";
        const installed =
          payload.installed === true || searchDestination === "runner_rig";
        const deferredForMemory = payload.installDeferredForMemory === true;
        const blockedReason = installBlockedReasonLabel(
          stringValue(payload.installBlockedReason),
        );
        category = "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId =
          stringValue(payload.publicRevealDefinitionId) ?? cardDefinitionId;
        title = deferredForMemory
          ? phrase(
              subject,
              `${programTitle} aus dem Stack vorgezeigt; MU muss freigemacht werden`,
            )
          : installed
            ? phrase(
                subject,
                `${programTitle} aus dem Stack vorgezeigt und im Rig installiert`,
              )
            : phrase(
                subject,
                `${programTitle} aus dem Stack vorgezeigt, aber nicht installiert`,
              );
        description =
          !installed && !deferredForMemory && blockedReason
            ? `Grund: ${blockedReason}.`
            : undefined;
        chips.push(
          "Self-Modifying Code",
          "Stack",
          "Vorgezeigt",
          deferredForMemory
            ? "MU freimachen"
            : installed
              ? "Installiert"
              : "Nicht installiert",
          ...(payload.shuffled === true ? ["Shuffle"] : []),
        );
        break;
      }
      if (hiddenZoneAction === "self_modifying_code_free_mu") {
        const installedTitle =
          titleForDefinitionId(
            stringValue(payload.installedProgramDefinitionId),
          ) ??
          publicRevealTitleFromPayload(payload) ??
          cardTitle ??
          "das gewählte Programm";
        const trashedTitles = titlesForDefinitionIds(
          stringValue(payload.trashedCardDefinitionIds),
        );
        const trashedCount =
          numberValue(payload.trashedCount) ?? trashedTitles.length;
        category = "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId =
          stringValue(payload.installedProgramDefinitionId) ??
          stringValue(payload.publicRevealDefinitionId) ??
          cardDefinitionId;
        title = phrase(
          subject,
          `${installedTitle} nach MU-Auswahl im Rig installiert`,
        );
        description =
          trashedTitles.length > 0
            ? `Für MU getrasht: ${trashedTitles.join(", ")}.`
            : undefined;
        chips.push(
          "Self-Modifying Code",
          "MU freigemacht",
          "Installiert",
          ...(trashedCount > 0 ? [`${trashedCount} Trash`] : []),
        );
        break;
      }
      if (hiddenZoneAction === "sneak_preview_install_program") {
        const installPendingMemoryTrash =
          payload.installPendingMemoryTrash === true;
        const sourceLabel =
          stringValue(payload.searchSource) === "runner_heap"
            ? "Heap"
            : "Stack";
        category = "card";
        importance = "important";
        visibility = "public";
        title = installPendingMemoryTrash
          ? phrase(
              subject,
              `${cardTitle ?? "ein Programm"} aus dem ${sourceLabel} gewählt; MU muss freigemacht werden`,
            )
          : phrase(
              subject,
              `${cardTitle ?? "ein Programm"} aus dem ${sourceLabel} kostenlos im Rig installiert; Rückkehr am Zugende`,
            );
        chips.push(
          sourceLabel,
          installPendingMemoryTrash ? "MU freimachen" : "Installiert",
          "Temporär",
        );
        break;
      }
      if (hiddenZoneAction === "sneak_preview_choose_source") {
        const sourceLabel =
          stringValue(payload.searchSource) === "runner_heap"
            ? "Heap"
            : "Stack";
        category = "hidden";
        visibility = "redacted";
        title = phrase(
          subject,
          `${sourceLabel} als Sneak-Preview-Quelle gewählt`,
        );
        chips.push("Sneak Preview", sourceLabel);
        break;
      }
      if (
        hiddenZoneAction === "corp_hq_agenda_reveal" ||
        hiddenZoneAction ===
          "v1917_corporate_negotiating_center_hq_agenda_reveal"
      ) {
        const revealedTitles = publicRevealTitleList(
          payload.publicRevealTitles,
        );
        const revealedCount =
          numberValue(payload.revealedCount) ?? revealedTitles.length;
        const gainedCredits =
          numberValue(payload.gainedCredits) ?? revealedCount;
        const source = sourceTitle ?? "Corporate Negotiating Center";
        category = "agenda";
        importance = revealedCount > 0 ? "important" : "normal";
        visibility = "public";
        title =
          revealedCount > 0
            ? phrase(
                subject,
                `${agendaRevealCountText(revealedCount)} aus HQ durch ${source} vorgezeigt und ${creditText(gainedCredits)} erhalten`,
              )
            : phrase(subject, `keine Agenda aus HQ durch ${source} vorgezeigt`);
        description =
          revealedTitles.length > 0
            ? `Gezeigt: ${revealedTitles.join(", ")}. Timing: Start-of-turn.`
            : "Timing: Start-of-turn.";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        cardTitle = cardTitle ?? source;
        chips.push(
          source,
          "HQ Reveal",
          `${revealedCount} ${revealedCount === 1 ? "Agenda" : "Agenden"}`,
        );
        if (gainedCredits > 0)
          chips.push(`+${gainedCredits} ${creditLabel(gainedCredits)}`);
        chips.push("Start-of-turn");
        break;
      }
      if (
        hiddenZoneAction ===
        "schematics_search_engine_expose_installed_cards_finish"
      ) {
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "Schematics Search Engine";
        category = "hidden";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        cardTitle = cardTitle ?? source;
        title = phrase(
          subject,
          `das Ansehen der durch ${source} aufgedeckten installierten Korp-Karten beendet`,
        );
        chips.push(source, "Expose", "Ansehen beendet");
        break;
      }
      if (hiddenZoneAction === "p3_33_private_look") {
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "eine Karte";
        category = "hidden";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${source} genutzt und ${privateLookActionText(payload)}`,
        );
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(source, ...privateLookChips(payload));
        break;
      }
      if (
        hiddenZoneAction === "superior_net_barriers_reveal_walls" ||
        hiddenZoneAction === "encryption_breakthrough_reveal_code_gates"
      ) {
        const revealedCount = numberValue(payload.revealedCount) ?? 0;
        const rezzedCount = numberValue(payload.rezzedMatchingIceCount) ?? 0;
        const countedCount =
          numberValue(payload.countedMatchingIceCount) ??
          revealedCount + rezzedCount;
        const gainedCredits =
          numberValue(payload.gainedCredits) ?? countedCount;
        const source =
          hiddenZoneAction === "superior_net_barriers_reveal_walls"
            ? "Superior Net Barriers"
            : "Encryption Breakthrough";
        const subtypeLabel =
          hiddenZoneAction === "superior_net_barriers_reveal_walls"
            ? "Wall"
            : "Code Gate";
        category = "agenda";
        importance = gainedCredits > 0 ? "important" : "normal";
        visibility = "public";
        title = phrase(
          subject,
          `${source} genutzt: ${revealedCount} ${subtypeLabel}${revealedCount === 1 ? "" : "s"} aufgedeckt, ${creditText(gainedCredits)} erhalten`,
        );
        description = `${countedCount} ${subtypeLabel}${countedCount === 1 ? "" : "s"} waren aufgedeckt oder gerezzt; davon ${rezzedCount} bereits gerezzt.`;
        chips.push(
          source,
          `${revealedCount} Reveal`,
          `${rezzedCount} Rez`,
          `+${gainedCredits} ${creditLabel(gainedCredits)}`,
        );
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
    case "activated_card_ability":
      if (stringValue(payload.accessReplacement) === "archives_faceup_to_rd") {
        const movedCount = numberValue(payload.movedCount) ?? 0;
        const shuffledCount =
          numberValue(payload.shuffledFaceUpArchivesCount) ?? movedCount;
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "Record Reconstructor";
        category = "run";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${source} genutzt: ${openArchivesCardCountText(movedCount)} oben auf R&D gelegt`,
        );
        description = `${openArchivesCardCountText(shuffledCount)} wurden vorher gemischt; es gab keinen normalen Archives-Zugriff.`;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(source, "Archives", "R&D", `${movedCount} bewegt`);
        break;
      }
      if (hiddenZoneAction === "p3_33_private_look") {
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "eine Karte";
        const lookText = privateLookActionText(payload);
        category = "hidden";
        importance = "important";
        visibility = "public";
        title = phrase(subject, `${source} genutzt und ${lookText}`);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(source, ...privateLookChips(payload));
        break;
      }
      if (
        hiddenZoneAction === "p3_38_move_top_trash_to_grip" ||
        (payload.returnedToGrip === true &&
          stringValue(payload.sourceZone) === "heap" &&
          stringValue(payload.destinationZone) === "grip")
      ) {
        const returnedCount =
          numberValue(payload.returnedCount) ??
          numberValue(payload.movedCardCount) ??
          1;
        const returnedDefinitionId =
          stringValue(payload.returnedCardDefinitionId) ??
          stringValue(payload.targetDefinitionId) ??
          stringValue(payload.targetCardDefinitionId);
        const returnedTitle = titleForDefinitionId(returnedDefinitionId);
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "eine Karte";
        category = "card";
        importance = "important";
        visibility = "public";
        title = returnedTitle
          ? phrase(
              subject,
              `${source} genutzt und ${returnedTitle} aus dem Heap in den Grip genommen`,
            )
          : phrase(
              subject,
              `${source} genutzt und ${cardCountText(returnedCount)} aus dem Heap in den Grip genommen`,
            );
        if (returnedDefinitionId) cardDefinitionId = returnedDefinitionId;
        if (returnedTitle) cardTitle = returnedTitle;
        cardText = undefined;
        cardDetailLines = [];
        chips.push(
          source,
          "Heap",
          "Grip",
          ...(returnedTitle ? [returnedTitle] : [`${returnedCount} bewegt`]),
        );
        break;
      }
      if (mergedCardResolverEffect) {
        const cardResolverEffect = mergedCardResolverEffect;
        category = cardResolverEffect.category ?? "card";
        title = phrase(
          subject,
          `${cardTitle ?? cardResolverEffect.sourceTitle ?? "eine Karte"} genutzt${cardResolverEffect.suffix ? ` und ${cardResolverEffect.suffix}` : ""}`,
        );
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push("Ability", ...cardResolverEffect.chips);
        break;
      }
      category = "card";
      title = phrase(subject, `${cardTitle ?? "eine Karte"} genutzt`);
      chips.push("Ability");
      break;
    case "gain_credit":
      if (abilityId === "fang_2_0_pay_to_run") {
        const paid =
          numberValue(payload.runnerRunLockCreditCost) ??
          numberValue(payload.fangRunLockCreditCost) ??
          2;
        category = "run";
        importance = "important";
        title = phrase(
          subject,
          `die Run-Sperre für ${creditText(paid)} entfernt`,
        );
        chips.push("Run-Sperre weg", `${paid} ${creditLabel(paid)}`);
        break;
      }
      if (abilityId === "remove_runner_trace_counter") {
        const removed = numberValue(payload.removedCounterAmount) ?? 1;
        const remaining = numberValue(payload.remainingCounters) ?? 0;
        const paid = numberValue(payload.counterRemoveCreditCost) ?? 0;
        const counterText = counterLabel(payload.counterType);
        category = "card";
        importance = "important";
        title = phrase(subject, `${removed} ${counterText} entfernt`);
        chips.push(
          counterText,
          `-${removed}`,
          `${remaining} übrig`,
          `${paid} ${creditLabel(paid)}`,
        );
        break;
      }
      if (
        isExposeServerCardPayload(payload) ||
        payload.revealKind === "expose"
      ) {
        const sourceTitle = sourceTitleFromActionLabel(label);
        category = "card";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${cardTitle ?? "eine Korp-Karte"}${serverLabel ? ` in ${serverLabel}` : ""}${sourceTitle ? ` mit ${sourceTitle}` : ""} aufgedeckt`,
        );
        chips.push(
          "Expose",
          ...(serverLabel ? [serverLabel] : []),
          ...(sourceTitle ? [sourceTitle] : []),
        );
        break;
      }
      if (payload.traceStarted === true) {
        const baseTraceStrength = numberValue(payload.baseTraceStrength);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = traceStartTitle(subject, cardTitle, baseTraceStrength);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Trace",
          ...(baseTraceStrength !== undefined
            ? [`Base ${baseTraceStrength}`]
            : []),
        );
        break;
      }
      if (
        agendaAbility === "corporate_coup" ||
        agendaAbility === "political_coup"
      ) {
        const gainedCredits =
          amount ?? numberValue(payload.removePowerCounterAmount) ?? 0;
        const spentCredits =
          numberValue(payload.spentPowerCounters) ??
          numberValue(payload.removePowerCounterAmount) ??
          gainedCredits;
        const remainingCredits = numberValue(payload.remainingPowerCounters);
        category = "economy";
        importance = "important";
        title = phrase(
          subject,
          `${creditText(gainedCredits)} von ${cardTitle ?? "der Coup-Agenda"} genommen`,
        );
        chips.push(
          `+${gainedCredits} ${creditLabel(gainedCredits)}`,
          `${spentCredits} ${creditLabel(spentCredits)} von Karte`,
          ...(remainingCredits !== undefined
            ? [`${remainingCredits} ${creditLabel(remainingCredits)} übrig`]
            : []),
        );
        break;
      }
      if (
        hiddenZoneAction === "superior_net_barriers_reveal_walls" ||
        hiddenZoneAction === "encryption_breakthrough_reveal_code_gates"
      ) {
        const revealedCount = numberValue(payload.revealedCount) ?? 0;
        const rezzedCount = numberValue(payload.rezzedMatchingIceCount) ?? 0;
        const countedCount =
          numberValue(payload.countedMatchingIceCount) ??
          revealedCount + rezzedCount;
        const gainedCredits =
          numberValue(payload.gainedCredits) ?? countedCount;
        const source =
          hiddenZoneAction === "superior_net_barriers_reveal_walls"
            ? "Superior Net Barriers"
            : "Encryption Breakthrough";
        const subtypeLabel =
          hiddenZoneAction === "superior_net_barriers_reveal_walls"
            ? "Wall"
            : "Code Gate";
        category = "agenda";
        importance = gainedCredits > 0 ? "important" : "normal";
        visibility = "public";
        title = phrase(
          subject,
          `${source} genutzt: ${revealedCount} ${subtypeLabel}${revealedCount === 1 ? "" : "s"} aufgedeckt, ${creditText(gainedCredits)} erhalten`,
        );
        description = `${countedCount} ${subtypeLabel}${countedCount === 1 ? "" : "s"} waren aufgedeckt oder gerezzt; davon ${rezzedCount} bereits gerezzt.`;
        chips.push(
          source,
          `${revealedCount} Reveal`,
          `${rezzedCount} Rez`,
          `+${gainedCredits} ${creditLabel(gainedCredits)}`,
        );
        break;
      }
      if (agendaAbility) {
        category =
          agendaAbility.includes("trace") ||
          agendaAbility.includes("solo") ||
          agendaAbility.includes("kali")
            ? "danger"
            : "agenda";
        importance = "important";
        title = phrase(
          subject,
          `${cardTitle ?? "eine gescorte Agenda"} genutzt`,
        );
        chips.push("Agenda-Aktion");
        break;
      }
      if (hiddenZoneAction === "v1911_short_circuit_search") {
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          cardTitle ??
          "The Short Circuit";
        category = "card";
        importance = "important";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        title = phrase(
          subject,
          `${source} genutzt und eine Stack-Suche geöffnet`,
        );
        chips.push(source, "Stack-Suche");
        break;
      }
      if (abilityId === "deterministic_die_probe") {
        const dieRoll = payloadRandomRoll(payload);
        category = "card";
        importance = "important";
        title = phrase(
          subject,
          `${cardTitle ?? "eine Kartenfähigkeit"} aktiviert${dieRoll !== undefined ? ` und eine ${dieRoll} gewürfelt` : ""}`,
        );
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Würfel",
          ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []),
        );
        break;
      }
      if (abilityId === "schlaghund_tag_damage") {
        const dieRoll = payloadRandomRoll(payload);
        const runnerTags = numberValue(payload.runnerTags);
        const thresholdMet = payload.tagThresholdMet === true;
        const damageAmount = numberValue(payload.damageAmount) ?? 0;
        category = thresholdMet ? "danger" : "card";
        importance = thresholdMet ? "critical" : "important";
        title = phrase(
          subject,
          `Schlaghund aktiviert${dieRoll !== undefined ? ` und eine ${dieRoll} gewürfelt` : ""}`,
        );
        description = thresholdMet
          ? `${runnerTags ?? 0} Tags reichen aus: ${damageAmount} Meat Damage und Schlaghund wird getrasht.`
          : `${runnerTags ?? 0} Tags reichen nicht aus.`;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Schlaghund",
          ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []),
          `${runnerTags ?? 0} Tags`,
          thresholdMet ? "Damage" : "Kein Schaden",
        );
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
      {
        const installEffect = mergedCardResolverEffect;
        const installSuffix = installEffect?.suffix
          ? ` und ${installEffect.suffix}`
          : "";
        const deckReplacementSuffix =
          runnerHardwareDeckReplacementSuffix(payload);
        if (actor === "runner" && selectedServerLabel) {
          category = "card";
          title = phrase(
            subject,
            `${cardTitle ?? "eine Karte"} auf ${selectedServerLabel} ausgerichtet installiert${installSuffix}${deckReplacementSuffix}`,
          );
          chips.push(
            "Install",
            "Resource",
            selectedServerLabel,
            ...(installEffect?.chips ?? []),
            ...runnerHardwareDeckReplacementChips(payload),
          );
        } else if (actor === "corp" && (redactedKind || !cardTitle)) {
          category = "hidden";
          visibility = "redacted";
          title = phrase(
            subject,
            `eine verdeckte Karte${installLocation(serverLabel, zoneLabel, label)} installiert`,
          );
          chips.push(
            "Verdeckt",
            installAreaFromPayload(serverLabel, zoneLabel, label),
          );
        } else {
          category = installEffect?.category ?? "card";
          title = phrase(
            subject,
            `${cardTitle ?? "eine Karte"}${installDestinationForTitle(actor, serverLabel, zoneLabel, label)} installiert${installSuffix}${deckReplacementSuffix}`,
          );
          chips.push(
            "Install",
            installAreaFromPayload(serverLabel, zoneLabel, label),
            ...(installEffect?.chips ?? []),
            ...runnerHardwareDeckReplacementChips(payload),
          );
        }
      }
      break;
    case "play_event":
    case "play_operation":
      if (
        actionType === "play_event" &&
        abilityId === "program_install_action_bundle"
      ) {
        const gainedActions = numberValue(payload.gainedActions) ?? 0;
        const temporaryCredits =
          numberValue(payload.temporaryProgramInstallCredits) ?? 0;
        const remaining = numberValue(
          payload.valuPakProgramInstallActionsRemaining,
        );
        category = "turn";
        importance = "important";
        title = phrase(
          subject,
          `${cardTitle ?? "Valu-Pak Software Bundle"} gespielt und ${gainedActions} Programminstall-Aktionen erhalten`,
        );
        description =
          temporaryCredits > 0
            ? `${temporaryCredits} temporärer Credit ist nur für Programminstallationen verfügbar.`
            : undefined;
        chips.push(
          "Event",
          `+${gainedActions} Aktionen`,
          ...(temporaryCredits > 0
            ? [`+${temporaryCredits} Install-Credit`]
            : []),
          ...(remaining !== undefined ? [`${remaining} offen`] : []),
        );
        break;
      }
      if (
        actionType === "play_operation" &&
        abilityId === "install_action_bundle"
      ) {
        const gainedActions = numberValue(payload.gainedActions) ?? 0;
        const remaining = numberValue(
          payload.edgerunnerTempsInstallActionsRemaining,
        );
        category = "turn";
        importance = "important";
        title = phrase(
          subject,
          `${cardTitle ?? "Edgerunner, Inc., Temps"} gespielt und ${gainedActions} Installaktionen erhalten`,
        );
        chips.push(
          "Operation",
          `+${gainedActions} Installaktionen`,
          ...(remaining !== undefined ? [`${remaining} offen`] : []),
        );
        break;
      }
      if (actionType === "play_event" && playfulAiDiceLoop) {
        const dieRoll = payloadRandomRoll(payload);
        const dieRolls = numberArrayValue(
          payload.playfulAiDieRolls ?? payload.randomDiceLoopRolls,
        );
        const choiceOpened =
          (payload.playfulAiChoiceOpened ??
            payload.randomDiceSplitChoiceOpened) === true;
        const complete =
          (payload.playfulAiComplete ?? payload.randomDiceLoopComplete) ===
          true;
        category = "card";
        importance = choiceOpened ? "important" : "normal";
        title = phrase(
          subject,
          `${cardTitle ?? "Playful AI"} gespielt${dieRoll !== undefined ? ` und eine ${dieRoll} gewürfelt` : ""}`,
        );
        description = choiceOpened
          ? "Der Wurf öffnet eine Entscheidung: Credits nehmen oder Würfel beiseitelegen."
          : complete
            ? "Die Playful-AI-Schleife ist ohne weitere Entscheidung abgeschlossen."
            : undefined;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          actionType === "play_event" ? "Event" : "Operation",
          "Playful AI",
          ...playfulAiRollChips(dieRolls, dieRoll),
          choiceOpened ? "Choice" : "Fertig",
        );
        break;
      }
      if (payload.traceStarted === true) {
        const baseTraceStrength = numberValue(payload.baseTraceStrength);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = traceStartTitle(subject, cardTitle, baseTraceStrength);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Trace",
          ...(baseTraceStrength !== undefined
            ? [`Base ${baseTraceStrength}`]
            : []),
          actionType === "play_event" ? "Event" : "Operation",
        );
        break;
      }
      if (
        actionType === "play_event" &&
        stringValue(payload.accessReplacement) ===
          "reveal_rd_until_agenda_store_in_hq"
      ) {
        const summary = gypsyScheduleAnalyzerChronicleSummary(
          payload,
          cardTitle,
        );
        category = "run";
        importance = "important";
        visibility = "public";
        title = phrase(subject, summary.title);
        description = summary.description;
        cardDefinitionId = cardDefinitionId ?? summary.cardDefinitionId;
        cardTitle = summary.sourceTitle;
        chips.push(...summary.chips);
        break;
      }
      if (
        actionType === "play_event" &&
        stringValue(payload.accessReplacement)
      ) {
        const creditLoss = numberValue(payload.creditLoss) ?? 0;
        const tagsAdded = numberValue(payload.tagsAdded) ?? 0;
        const corpDrawnCount = numberValue(payload.corpDrawnCount) ?? 0;
        const gainedCredits = numberValue(payload.gainedCredits) ?? 0;
        const effectParts = accessReplacementEffectParts(
          creditLoss,
          tagsAdded,
          corpDrawnCount,
          gainedCredits,
        );
        category =
          tagsAdded > 0 ? "danger" : creditLoss > 0 ? "economy" : "run";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${cardTitle ?? "eine Karte"} gespielt: ${effectParts.join(", ")}`,
        );
        description =
          "Der erfolgreiche Run wurde ohne Zugriff auf verdeckte Korp-Karten ersetzt.";
        chips.push(
          "Event",
          "Access ersetzt",
          ...(creditLoss > 0 ? [`Korp -${creditLoss}`] : []),
          ...(tagsAdded > 0
            ? [`+${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`]
            : []),
          ...(corpDrawnCount > 0 ? [`Korp zieht ${corpDrawnCount}`] : []),
          ...(gainedCredits > 0 ? [`Runner +${gainedCredits}`] : []),
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
        title = phrase(
          subject,
          `${cardTitle ?? "Ice and Data's Guide to the Net"} gespielt und ${cardCountText(exposedCount)} äußerstes ICE aufgedeckt`,
        );
        description =
          serverLabels.length > 0
            ? `Betroffene Remotes: ${serverLabels.join(", ")}.`
            : undefined;
        chips.push("Event", "Expose", `${exposedCount} ICE`, ...serverLabels);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        break;
      }
      if (
        actionType === "play_event" &&
        stringValue(payload.runnerEventAbility) ===
          "do_the_drine_unpreventable_core_damage_for_credits"
      ) {
        const damageAmount =
          numberValue(payload.damageAmount) ?? numberValue(payload.xValue) ?? 0;
        const gainedCredits = numberValue(payload.gainedCredits) ?? 0;
        const cardsTrashed = numberValue(payload.cardsTrashed) ?? damageAmount;
        const maxHandSizeAfter = numberValue(payload.runnerMaxHandSizeAfter);
        category = "danger";
        importance = "important";
        visibility = "public";
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        title = phrase(
          subject,
          `${cardTitle ?? "Do the 'Drine"} gespielt: ${damageAmount} Core Damage gewählt und ${creditText(gainedCredits)} erhalten`,
        );
        description = `${cardCountText(cardsTrashed)} ${cardsTrashed === 1 ? "wurde" : "wurden"} aus der Grip in den Heap bewegt; der Damage konnte nicht verhindert werden${maxHandSizeAfter !== undefined ? `; Handlimit danach: ${maxHandSizeAfter}` : ""}`;
        chips.push(
          "Event",
          `${damageAmount} Core Damage`,
          `+${gainedCredits} ${creditLabel(gainedCredits)}`,
          `${cardsTrashed} Heap`,
          "Unverhinderbar",
        );
        break;
      }
      const playEffect = mergedCardResolverEffect ?? effect;
      category = playEffect.category ?? category;
      if (actionType === "play_event" && payload.runnerEventRun === true) {
        const target =
          serverLabel ?? selectedServerLabel ?? runTargetFromLabel(label);
        category = "run";
        importance = "important";
        title = phrase(
          subject,
          `${cardTitle ?? playEffect.sourceTitle ?? "eine Karte"} gespielt und einen Run auf ${target} gestartet`,
        );
        chips.push("Event", "Run", target, ...playEffect.chips);
        break;
      }
      title = phrase(
        subject,
        `${cardTitle ?? playEffect.sourceTitle ?? "eine Karte"} gespielt${playEffect.suffix ? ` und ${playEffect.suffix}` : ""}`,
      );
      chips.push(
        actionType === "play_event" ? "Event" : "Operation",
        ...playEffect.chips,
      );
      break;
    case "advance_card":
      category = "hidden";
      visibility =
        actor === "corp" && (redactedKind || !cardTitle)
          ? "redacted"
          : "public";
      title = phrase(
        subject,
        advanceTitlePart(
          cardTitle,
          context.cardType,
          serverLabel,
          visibility === "redacted",
        ),
      );
      chips.push(
        "+1 Entwicklung",
        ...(serverLabel ? [serverLabel] : []),
        ...(visibility === "redacted" ? ["Verdeckt"] : []),
      );
      break;
    case "score_agenda": {
      category = "agenda";
      importance = "important";
      if (isSecurityPurgePayload(payload)) {
        const summary = securityPurgeChronicleSummary(payload, cardTitle);
        title = phrase(subject, summary.title);
        description = summary.description;
        chips.push(...summary.chips);
        break;
      }
      const points = agendaPointSuffix(agendaPoints);
      const zurichSummary = projectZurichScoreSummary(payload);
      if (zurichSummary) {
        category = "economy";
        title = phrase(
          subject,
          `${cardTitle ?? "Project Zurich"} gescored${points} und ${zurichSummary.suffix}`,
        );
        description = zurichSummary.description;
        chips.push(
          "Score",
          ...agendaPointChips(agendaPoints),
          ...zurichSummary.chips,
        );
        break;
      }
      const scoreEffect =
        scoreAgendaPayloadEffect(payload) ?? mergedCardResolverEffect;
      const selectedServerSuffix = selectedServerLabel
        ? ` und ${selectedServerLabel} gewählt`
        : "";
      category = scoreEffect?.category ?? category;
      title = phrase(
        subject,
        `${cardTitle ?? "eine Agenda"} gescored${points}${selectedServerSuffix}${scoreEffect?.suffix ? ` und ${scoreEffect.suffix}` : ""}`,
      );
      chips.push(
        "Score",
        ...agendaPointChips(agendaPoints),
        ...(selectedServerLabel ? [selectedServerLabel] : []),
        ...(scoreEffect?.chips ?? []),
      );
      break;
    }
    case "start_run": {
      category = "run";
      importance = "important";
      const target = serverLabel ?? runTargetFromLabel(label);
      const isWilsonRun =
        payload.runOnlyAction === true ||
        stringValue(payload.runnerAbility) === "gain_run_only_action" ||
        /^Wilson-Run\b/i.test(label ?? "");
      title = phrase(
        subject,
        `einen ${isWilsonRun ? "Wilson-Run" : "Run"} auf ${target} gestartet`,
      );
      chips.push("Run", target);
      break;
    }
    case "rez_ice":
      {
        const rezEffect = mergedCardResolverEffect ?? effect;
        category =
          rezEffect.category ??
          (context.cardType === "asset" || context.cardType === "upgrade"
            ? "card"
            : "run");
        if (payload.oliviaSalazarTemporaryDerez === true) {
          const paid = numberValue(payload.rezCostPaid) ?? 0;
          const base = numberValue(payload.oliviaSalazarRezCostBase);
          title = phrase(
            subject,
            `${cardTitle ?? "ein ICE"} mit Olivia Salazar für ${creditText(paid)} gerezzt${rezSuffix(context.cardType, rezEffect)}`,
          );
          description = `Olivia Salazar reduziert die effektiven Rez-Kosten${base !== undefined ? ` von ${creditText(base)}` : ""} auf ${creditText(paid)}; das ICE wird am Runende derezzt.`;
          chips.push(
            "Olivia Salazar",
            `${paid} ${creditLabel(paid)}`,
            "Temporär",
          );
        } else {
          title = phrase(
            subject,
            `${cardTitle ?? "eine Karte"} gerezzt${rezSuffix(context.cardType, rezEffect)}`,
          );
        }
        chips.push("Rez", ...rezEffect.chips);
        if (context.cardType === "ice" || cardTitle?.includes("ICE"))
          chips.push("Begegnung");
      }
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
        const pumpBreakerCreditCost = numberValue(
          payload.pumpBreakerCreditCost,
        );
        const breakerStrengthAfter = numberValue(payload.breakerStrengthAfter);
        description = `${pumpBreakerCreditCost !== undefined ? `${creditText(pumpBreakerCreditCost)}: ` : ""}+${pumpStrengthAmount} Stärke für diese Begegnung${breakerStrengthAfter !== undefined ? `; Stärke danach ${breakerStrengthAfter}` : ""}.`;
        chips.push(
          "Breaker",
          `+${pumpStrengthAmount} Stärke`,
          ...(pumpBreakerCreditCost !== undefined
            ? [`${pumpBreakerCreditCost} ${creditLabel(pumpBreakerCreditCost)}`]
            : []),
        );
      }
      title = phrase(subject, `${cardTitle ?? "einen Icebreaker"} gepumpt`);
      break;
    case "break_subroutine":
      category = "run";
      {
        const breakSubroutineCount =
          numberValue(payload.breakSubroutineCount) ?? 1;
        const breakSubroutineBaseCost = numberValue(
          payload.breakSubroutineBaseCost,
        );
        const breakSubroutineTotalCost =
          numberValue(payload.breakSubroutineTotalCost) ??
          breakSubroutineBaseCost;
        const subroutineLabel = breakSubroutineLabel(
          payload,
          breakSubroutineCount,
        );
        const targetIceTitle = stringValue(payload.targetIceTitle);
        const targetIceSuffix = targetIceTitle ? ` auf ${targetIceTitle}` : "";
        const endsRunAfterBreak = payload.breakerEndsRunAfterBreak === true;
        const sourceDefinitionId = stringValue(payload.sourceDefinitionId);
        const blinkDieRoll = numberValue(payload.blinkDieRoll);
        const blinkBreakSuccess =
          payload.blinkBreakSuccess === true
            ? true
            : payload.blinkBreakSuccess === false
              ? false
              : undefined;
        const blinkDamageAmount = numberValue(payload.blinkDamageAmount);
        const isBlinkBreak =
          sourceDefinitionId === BLINK_ID ||
          cardDefinitionId === BLINK_ID ||
          cardTitle === "Blink";
        if (
          isBlinkBreak &&
          blinkDieRoll !== undefined &&
          blinkBreakSuccess !== undefined
        ) {
          const damageAmount =
            blinkDamageAmount ?? (blinkBreakSuccess ? 0 : blinkDieRoll);
          cardDefinitionId = BLINK_ID;
          cardTitle = "Blink";
          importance = blinkBreakSuccess ? "important" : "critical";
          description = blinkBreakSuccess
            ? `Blink würfelt eine ${blinkDieRoll}: ${subroutineLabel}${targetIceSuffix} wurde gebrochen.`
            : `Blink würfelt eine ${blinkDieRoll}: ${subroutineLabel}${targetIceSuffix} wurde nicht gebrochen; der Runner erleidet ${damageAmount} Net Damage.`;
          chips.push(
            "Blink",
            `Wurf ${blinkDieRoll}`,
            blinkBreakSuccess ? "Gebrochen" : "Nicht gebrochen",
            ...(blinkBreakSuccess ? [] : [`${damageAmount} Net Damage`]),
            ...(targetIceTitle ? [targetIceTitle] : []),
          );
          title = blinkBreakSuccess
            ? phrase(
                subject,
                `mit Blink ${subroutineLabel}${targetIceSuffix} nach Wurf ${blinkDieRoll} gebrochen`,
              )
            : phrase(
                subject,
                `mit Blink ${subroutineLabel}${targetIceSuffix} nach Wurf ${blinkDieRoll} nicht gebrochen`,
              );
          break;
        }
        description = `${breakSubroutineTotalCost !== undefined ? `${creditText(breakSubroutineTotalCost)}: ` : ""}${subroutineLabel}${targetIceSuffix} gebrochen${endsRunAfterBreak ? "; der Run endet durch diesen Break-Effekt, ohne dass das ICE als passiert gilt" : ""}.`;
        chips.push(
          "Subroutine",
          subroutineLabel,
          "Gebrochen",
          ...(endsRunAfterBreak ? ["Run endet", "ICE nicht passiert"] : []),
          ...(breakSubroutineTotalCost !== undefined
            ? [
                `${breakSubroutineTotalCost} ${creditLabel(breakSubroutineTotalCost)}`,
              ]
            : []),
          ...(cardTitle ? [cardTitle] : []),
          ...(targetIceTitle ? [targetIceTitle] : []),
        );
        title = phrase(
          subject,
          `${cardTitle ? `mit ${cardTitle} ` : ""}${subroutineLabel}${targetIceSuffix} gebrochen${endsRunAfterBreak ? " und den Run beendet" : ""}`,
        );
      }
      break;
    case "continue_run":
      if (
        stringValue(payload.corpPostPassIceAbility) ===
        "return_passed_ice_to_hq"
      ) {
        const passedIceDefinitionId = stringValue(
          payload.passedIceDefinitionId,
        );
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          titleForDefinitionId(passedIceDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "das passierte ICE";
        const decision = stringValue(payload.decision);
        const paymentAmount =
          numberValue(payload.paymentAmount) ??
          numberValue(payload.paidCredits) ??
          0;
        const target =
          serverLabel ?? displayServerLabel(stringValue(payload.serverId));
        category = "run";
        importance = decision === "return_to_hq" ? "important" : "normal";
        visibility = "public";
        cardDefinitionId =
          cardDefinitionId ?? sourceDefinitionId ?? passedIceDefinitionId;
        cardTitle = source;
        cardText = undefined;
        cardDetailLines = [];
        if (decision === "return_to_hq") {
          title = phrase(
            subject,
            `${source} nach dem Passieren${target ? ` auf ${target}` : ""} ins HQ zurückgenommen`,
          );
          description =
            paymentAmount > 0
              ? `${source} wurde statt ${creditText(paymentAmount)} zu zahlen uninstalliert und im HQ gespeichert.`
              : `${source} wurde uninstalliert und im HQ gespeichert.`;
          chips.push(source, "Post-Pass", "HQ", ...(target ? [target] : []));
          break;
        }
        if (decision === "pay") {
          title = phrase(
            subject,
            `${creditText(paymentAmount)} für ${source} nach dem Passieren bezahlt`,
          );
          description = target
            ? `${source} bleibt auf ${target} installiert; der Run läuft weiter.`
            : `${source} bleibt installiert; der Run läuft weiter.`;
          chips.push(source, "Post-Pass", creditText(paymentAmount));
          break;
        }
        if (decision === "decline") {
          title = phrase(
            subject,
            `${source} nach dem Passieren liegen gelassen`,
          );
          description = target
            ? `${source} bleibt auf ${target} installiert; der Run läuft weiter.`
            : `${source} bleibt installiert; der Run läuft weiter.`;
          chips.push(source, "Post-Pass", "Liegen gelassen");
          break;
        }
      }
      if (
        payloadBooleanValue(payload, "socialEngineeringAutoPassedIce") ===
          true ||
        (payloadBooleanValue(payload, "autoPassChosenIce") === true &&
          (sourceDefinitionId === SOCIAL_ENGINEERING_ID ||
            payload.socialEngineeringRun === true))
      ) {
        const target =
          serverLabel ?? displayServerLabel(stringValue(payload.serverId));
        const chosenIcePosition = payloadNumberValue(
          payload,
          "chosenIcePosition",
        );
        const chosenIceLabel =
          chosenIcePosition !== undefined
            ? `ICE ${chosenIcePosition + 1}`
            : "das gewählte ICE";
        category = "run";
        importance = "important";
        visibility = "public";
        cardDefinitionId = SOCIAL_ENGINEERING_ID;
        cardTitle = "Social Engineering";
        title = phrase(
          subject,
          `${chosenIceLabel} durch Social Engineering automatisch passiert`,
        );
        description = target
          ? `Der Social-Engineering-Run auf ${target} läuft nach dem Auto-Pass weiter.`
          : "Der Social-Engineering-Run läuft nach dem Auto-Pass weiter.";
        chips.push(
          "Social Engineering",
          "Auto-Pass",
          ...(target ? [target] : []),
          chosenIceLabel,
        );
        break;
      }
      if (
        payload.passIceTrashProgramPrompt === true &&
        payload.hiddenZoneBarrier === true
      ) {
        const source =
          titleForDefinitionId(sourceDefinitionId ?? VIRAL_15_ID) ??
          sourceTitle ??
          cardTitle ??
          "Viral 15";
        const candidateCount = numberValue(
          payload.passIceTrashProgramCandidateCount,
        );
        category = "run";
        importance = "critical";
        visibility = "public";
        cardDefinitionId = sourceDefinitionId ?? VIRAL_15_ID;
        cardTitle = source;
        title = phrase(
          subject,
          `trotz ${source} weitergemacht; Programmtrash muss gewählt werden`,
        );
        description =
          candidateCount !== undefined
            ? `${candidateCount} installierte Programme stehen in der Runner-privaten Auswahl.`
            : "Der Runner muss ein installiertes Programm über eine private Auswahl trashen.";
        chips.push(
          source,
          "Programmtrash-Choice",
          ...(candidateCount !== undefined
            ? [`${candidateCount} Kandidaten`]
            : []),
        );
        break;
      }
      if (
        stringValue(payload.accessReplacement) ===
        "reveal_rd_until_agenda_store_in_hq"
      ) {
        const summary = gypsyScheduleAnalyzerChronicleSummary(
          payload,
          cardTitle,
        );
        category = "run";
        importance = "important";
        visibility = "public";
        title = phrase(subject, summary.title);
        description = summary.description;
        cardDefinitionId = cardDefinitionId ?? summary.cardDefinitionId;
        cardTitle = summary.sourceTitle;
        chips.push(...summary.chips);
        break;
      }
      if (stringValue(payload.accessReplacement) === "archives_faceup_to_rd") {
        const movedCount = numberValue(payload.movedCount) ?? 0;
        const shuffledCount =
          numberValue(payload.shuffledFaceUpArchivesCount) ?? movedCount;
        const source =
          titleForDefinitionId(sourceDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "Record Reconstructor";
        category = "run";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${source} abgeschlossen: ${openArchivesCardCountText(movedCount)} oben auf R&D gelegt`,
        );
        description = `${openArchivesCardCountText(shuffledCount)} wurden vorher gemischt; es gab keinen normalen Archives-Zugriff.`;
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(source, "Archives", "R&D", `${movedCount} bewegt`);
        break;
      }
      if (abilityId === "rio_de_janeiro_passed_ice") {
        const dieRoll = payloadRandomRoll(payload);
        const runEnded = payload.rioRunEnded === true;
        const passedIceDefinitionId = stringValue(
          payload.passedIceDefinitionId,
        );
        const passedIce =
          titleForDefinitionId(passedIceDefinitionId) ??
          passedIceDefinitionId ??
          "ein gerezztes ICE";
        category = "run";
        importance = runEnded ? "critical" : "important";
        title = phrase(
          subject,
          `${passedIce} passiert und Rio de Janeiro City Grid würfelt${dieRoll !== undefined ? ` eine ${dieRoll}` : ""}`,
        );
        description = runEnded
          ? "Der Run endet durch Rio de Janeiro City Grid."
          : "Der Run läuft weiter.";
        cardDefinitionId =
          passedIceDefinitionId ??
          cardDefinitionId ??
          stringValue(payload.sourceDefinitionId);
        cardTitle = passedIceDefinitionId ? passedIce : cardTitle;
        chips.push(
          "Rio",
          ...(serverLabel ? [serverLabel] : []),
          ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []),
          runEnded ? "Run endet" : "Weiter",
        );
        break;
      }
      {
        const vacuumLinkDieRoll =
          numberValue(payload.vacuumLinkDieRoll) ??
          numberValue(payload.rezzedIceRewindDieRoll);
        if (vacuumLinkDieRoll !== undefined) {
          const rewindApplied =
            payload.vacuumLinkRewindApplied === true ||
            payload.rezzedIceRewindApplied === true;
          const rewindBack =
            numberValue(payload.vacuumLinkRewindRezzedIceBack) ??
            numberValue(payload.rezzedIceRewindRezzedIceBack);
          const targetIceIndex =
            numberValue(payload.vacuumLinkTargetIceIndex) ??
            numberValue(payload.rezzedIceRewindTargetIceIndex);
          const targetIcePosition =
            targetIceIndex !== undefined ? targetIceIndex + 1 : undefined;
          category = "run";
          importance = rewindApplied ? "important" : "normal";
          visibility = "public";
          cardDefinitionId =
            cardDefinitionId ?? sourceDefinitionId ?? VACUUM_LINK_ID;
          cardTitle =
            cardTitle ??
            titleForDefinitionId(cardDefinitionId) ??
            "Vacuum Link";
          title = phrase(
            subject,
            `${cardTitle} ausgelöst und eine ${vacuumLinkDieRoll} gewürfelt${vacuumLinkTitleOutcome(vacuumLinkDieRoll, rewindApplied, rewindBack)}`,
          );
          description = vacuumLinkDescription(
            vacuumLinkDieRoll,
            rewindApplied,
            rewindBack,
            targetIcePosition,
          );
          chips.push(
            "Vacuum Link",
            `Wurf ${vacuumLinkDieRoll}`,
            rewindApplied ? "Run zurückgesetzt" : "Weiter",
            ...(rewindBack !== undefined ? [`${rewindBack} ICE zurück`] : []),
            ...(targetIcePosition !== undefined
              ? [`Ziel ICE ${targetIcePosition}`]
              : []),
          );
          break;
        }
      }
      if (payload.traceStarted === true) {
        const baseTraceStrength = numberValue(payload.baseTraceStrength);
        category = "danger";
        importance = "important";
        visibility = "public";
        title = traceStartTitle(subject, cardTitle, baseTraceStrength);
        cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        chips.push(
          "Trace",
          ...(baseTraceStrength !== undefined
            ? [`Base ${baseTraceStrength}`]
            : []),
        );
        break;
      }
      category = "run";
      {
        const unbrokenSubroutineCount = numberValue(
          payload.unbrokenSubroutineCount,
        );
        const trashedProgramTitle =
          stringValue(payload.trashedCardType) === "program"
            ? (titleForDefinitionId(
                stringValue(payload.trashedCardDefinitionId),
              ) ?? stringValue(payload.trashedCardTitle))
            : undefined;
        if (encounterContinue && unbrokenSubroutineCount === 0) {
          title = phrase(subject, "das ICE passiert");
          chips.push("Run", "ICE passiert");
        } else {
          if (encounterContinue && trashedProgramTitle) {
            title = phrase(
              subject,
              result === "ended"
                ? `ungebrochene Subroutinen ausgelöst, ${trashedProgramTitle} getrasht und der Run endete`
                : `ungebrochene Subroutinen ausgelöst und ${trashedProgramTitle} getrasht`,
            );
          } else {
            title = encounterContinue
              ? phrase(
                  subject,
                  result === "ended"
                    ? "ungebrochene Subroutinen ausgelöst und der Run endete"
                    : "ungebrochene Subroutinen ausgelöst",
                )
              : phrase(
                  subject,
                  result === "ended"
                    ? "den Run beendet"
                    : "den Run fortgesetzt",
                );
          }
          chips.push(
            "Run",
            ...(encounterContinue
              ? ["Subroutinen"]
              : runPhase
                ? [runPhaseLabel(runPhase)]
                : []),
            ...(trashedProgramTitle
              ? [trashedProgramTitle, "Programm getrasht"]
              : []),
          );
        }
      }
      break;
    case "jack_out": {
      const target = serverLabel ?? "dem angegriffenen Server";
      category = "run";
      if (payload.v1922CorpIceAbility === "viral_15_jack_out_tax") {
        const jackOutAdditionalCost = numberValue(
          payload.jackOutAdditionalCost,
        );
        const cost = jackOutAdditionalCost ?? 1;
        cardDefinitionId = sourceDefinitionId ?? VIRAL_15_ID;
        cardTitle =
          titleForDefinitionId(cardDefinitionId) ??
          sourceTitle ??
          cardTitle ??
          "Viral 15";
        title = phrase(subject, `den Run für ${creditText(cost)} abgebrochen`);
        description = `Viral 15: Jack-out bezahlt; auf ${target} wurde keine Karte zugegriffen und kein Programm getrasht.`;
        chips.push(
          "Run",
          "Jack-out",
          "Viral 15",
          creditText(cost),
          "Rig geschützt",
          ...(serverLabel ? [serverLabel] : []),
        );
        break;
      }
      title = phrase(subject, "den Run abgebrochen");
      description = `Auf ${target} wurde keine Karte zugegriffen.`;
      chips.push(
        "Run",
        "Jack-out",
        "Kein Zugriff",
        ...(serverLabel ? [serverLabel] : []),
      );
      break;
    }
    case "access_card":
      category = "run";
      importance = "important";
      {
        const highlighterAccess = highlighterAccessExplanation(payload);
        const location = accessServerLocationSuffix(serverLabel);
        const schematicsExpose =
          hiddenZoneAction ===
          "schematics_search_engine_expose_installed_cards_review";
        const source = schematicsExpose
          ? (titleForDefinitionId(sourceDefinitionId) ??
            sourceTitle ??
            "Schematics Search Engine")
          : undefined;
        const revealedTitles = schematicsExpose
          ? publicRevealTitleList(payload.publicRevealTitles)
          : [];
        const revealedDefinitionCount = schematicsExpose
          ? definitionIdsFromCsv(stringValue(payload.publicRevealDefinitionIds))
              .length
          : 0;
        const exposedCount = schematicsExpose
          ? (numberValue(payload.revealedCount) ??
            (revealedTitles.length > 0
              ? revealedTitles.length
              : revealedDefinitionCount))
          : 0;
        const exposedText =
          exposedCount === 1
            ? "eine installierte Korp-Karte"
            : `${exposedCount} installierte Korp-Karten`;
        title = phrase(
          subject,
          `auf ${cardTitle ?? "eine Karte"}${location} zugegriffen${schematicsExpose ? ` und ${exposedText} durch ${source} aufgedeckt` : ""}${highlighterAccess ? `, weil die Korp ${highlighterAccess.counterCount} Highlighter-Counter hat` : ""}`,
        );
        if (schematicsExpose) {
          description =
            revealedTitles.length > 0
              ? `Aufgedeckt: ${revealedTitles.join(", ")}. Die Ansicht bleibt offen, bis der Runner das Ansehen beendet.`
              : `${source} hat ${exposedText} aufgedeckt; die Ansicht bleibt offen, bis der Runner das Ansehen beendet.`;
          cardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
        } else {
          description = highlighterAccess
            ? `Das ist Zugriff ${highlighterAccess.accessNumber} von ${highlighterAccess.totalAccesses}; Highlighter erlaubt diesen zusätzlichen R&D-Zugriff.`
            : undefined;
        }
        chips.push(
          "Zugriff",
          ...(serverLabel ? [serverLabel] : []),
          ...(schematicsExpose
            ? [
                source ?? "Schematics Search Engine",
                "Expose",
                `${exposedCount} ${exposedCount === 1 ? "Karte" : "Karten"}`,
              ]
            : []),
          ...(highlighterAccess
            ? [
                `${highlighterAccess.counterCount} Highlighter`,
                `Zugriff ${highlighterAccess.accessNumber}/${highlighterAccess.totalAccesses}`,
              ]
            : []),
        );
      }
      break;
    case "steal_agenda": {
      category = "agenda";
      importance = "critical";
      const points = agendaPointSuffix(agendaPoints);
      const payment = stealCostPaymentSuffix(payload);
      title = phrase(
        subject,
        `${cardTitle ?? "eine Agenda"}${accessServerSourceSuffix(serverLabel)} gestohlen${points}${payment}`,
      );
      chips.push(
        "Steal",
        ...(serverLabel ? [serverLabel] : []),
        ...agendaPointChips(agendaPoints),
        ...stealCostPaymentChips(payload),
      );
      break;
    }
    case "trash_accessed_card":
      category = "card";
      importance = "important";
      title = phrase(
        subject,
        `${cardTitle ?? "die zugegriffene Karte"}${accessServerSourceSuffix(serverLabel)} getrasht`,
      );
      {
        const freeTrashSource = freeAccessTrashSourceLabel(payload);
        if (freeTrashSource) {
          description = `${freeTrashSource} erlaubt diesen kostenlosen Trash auch für Karten, die normalerweise nicht getrasht werden können.`;
          chips.push(
            "Trash",
            ...(serverLabel ? [serverLabel] : []),
            freeTrashSource,
            "Kostenlos",
          );
        } else {
          chips.push("Trash", ...(serverLabel ? [serverLabel] : []));
        }
      }
      break;
    case "trash_resource":
      category = "danger";
      importance = "important";
      title = phrase(subject, `${cardTitle ?? "eine Resource"} getrasht`);
      chips.push("Resource", "Trash");
      break;
    case "decline_trash":
      category = "run";
      title = phrase(
        subject,
        `${serverLabel ? `den ${accessServerStatusLabel(serverLabel)}` : "den Zugriff"} abgeschlossen`,
      );
      chips.push("Zugriff", ...(serverLabel ? [serverLabel] : []));
      break;
    case "remove_tag":
      category = "danger";
      importance = "important";
      title = phrase(subject, "einen Tag entfernt");
      chips.push("Tag entfernt");
      break;
    case "purge_virus_counters": {
      const removed = numberValue(payload.purgedVirusCounters);
      const clicks = numberValue(payload.actionCostClicks) ?? 3;
      category = "danger";
      importance = "important";
      visibility = "public";
      title = phrase(
        subject,
        removed && removed > 0
          ? `${removed} Virus-Counter entfernt`
          : "alle Virus-Counter entfernt",
      );
      description = `Kosten: ${clicks} Aktion${clicks === 1 ? "" : "en"}; keine Credits.`;
      chips.push(
        "Purge",
        `${clicks} Aktion${clicks === 1 ? "" : "en"}`,
        ...(removed && removed > 0
          ? [`${removed} entfernt`]
          : ["Alle Virus-Counter"]),
      );
      break;
    }
    case "purge_runner_virus_counters": {
      const removed = numberValue(payload.purgedRunnerVirusCounters);
      const debt = numberValue(payload.actionDebtAdded) ?? 3;
      const summaryParts = purgeableRunnerVirusCounterSummaryParts(payload);
      const mustVerb = subject === "Du" ? "musst" : "muss";
      category = "danger";
      importance = "important";
      visibility = "public";
      title = `${phrase(
        subject,
        removed && removed > 0
          ? `${removed} Runner-Virus-Counter entfernt`
          : "Runner-Virus-Counter entfernt",
      )} und ${mustVerb} ${actionCountText(debt)} aussetzen`;
      description = `${summaryParts.length > 0 ? `Entfernt: ${joinChronicleParts(summaryParts)}. ` : ""}${subject} ${mustVerb} dafür die nächsten ${actionCountText(debt)} aussetzen.`;
      chips.push(
        "Runner-Virus-Purge",
        `${actionCountText(debt)} Schuld`,
        ...(removed && removed > 0
          ? [`${removed} entfernt`]
          : ["Runner-Virus-Counter"]),
        ...summaryParts.slice(0, 3),
      );
      break;
    }
    case "forgo_action": {
      const paid = numberValue(payload.actionDebtPaid) ?? 1;
      const debtBefore = numberValue(payload.corpActionDebtTotalBefore);
      const debtAfter = numberValue(payload.corpActionDebtTotalAfter);
      const totalDebt =
        actionUse && debtBefore !== undefined
          ? actionUse.start + debtBefore - 1
          : undefined;
      const progress =
        actionUse && totalDebt !== undefined
          ? `Aktion ${actionUse.start} von ${totalDebt}`
          : actionCountText(paid);
      category = "danger";
      visibility = "public";
      title = `${subject} setzt ${progress} aus`;
      description =
        debtAfter === undefined
          ? undefined
          : debtAfter > 0
            ? `Aktionsschuld: noch ${actionCountText(debtAfter)} offen.`
            : "Die Aktionsschuld ist vollständig abgetragen.";
      chips.push(
        "Aktionsschuld",
        "Ausgesetzt",
        ...(actionUse && totalDebt !== undefined
          ? [`${actionUse.start}/${totalDebt}`]
          : [`-${paid} Aktion${paid === 1 ? "" : "en"}`]),
        ...(debtAfter !== undefined
          ? [debtAfter > 0 ? `${debtAfter} offen` : "Schuld beglichen"]
          : []),
      );
      break;
    }
    case "move_to_set_aside":
      category = "card";
      importance = "important";
      title = phrase(
        subject,
        `${cardTitle ?? "eine Karte"} in Set Aside bewegt`,
      );
      chips.push("Set Aside");
      break;
    case "move_to_removed_from_game":
      category = "danger";
      importance = "important";
      title = phrase(
        subject,
        `${cardTitle ?? "eine Karte"} aus dem Spiel entfernt`,
      );
      chips.push("Removed");
      break;
    case "return_from_set_aside":
      category = "card";
      title = phrase(
        subject,
        `${cardTitle ?? "eine Karte"} aus Set Aside zurückgeholt`,
      );
      chips.push("Set Aside");
      break;
    case "change_card_control":
      category = "card";
      importance = "important";
      title = phrase(
        subject,
        `die Kontrolle von ${cardTitle ?? "einer Karte"} geändert`,
      );
      chips.push("Kontrolle");
      break;
    case "trigger_ability": {
      const resourceAbility = stringValue(payload.resourceAbility);
      if (isISpySuccessfulRunFollowupPayload(payload)) {
        const targetServerLabel =
          serverLabel ??
          displayServerLabel(stringValue(payload.targetServerLabel)) ??
          "dem angegriffenen Fort";
        const countersAfter =
          numberValue(payload.spyCountersAfter) ??
          numberValue(payload.remainingCounters);
        const exposedCount = numberValue(payload.exposedCount);
        const sourceCardTitle =
          sourceTitle ??
          titleForDefinitionId(sourceDefinitionId) ??
          cardTitle ??
          "I Spy";
        category = "run";
        importance = "important";
        visibility = "public";
        cardDefinitionId = sourceDefinitionId ?? cardDefinitionId;
        cardTitle = sourceCardTitle;
        title = phrase(
          subject,
          `mit ${sourceCardTitle} einen Spy-Counter in ${targetServerLabel} platziert`,
        );
        description =
          exposedCount !== undefined
            ? `Solange der Spy-Counter dort liegt, ${exposedCount === 1 ? "bleibt 1 installierte Korp-Karte" : `bleiben ${exposedCount} installierte Korp-Karten`} in oder auf ${targetServerLabel} für den Runner sichtbar`
            : `Solange der Spy-Counter dort liegt, bleiben installierte Korp-Karten in oder auf ${targetServerLabel} für den Runner sichtbar`;
        chips.push(
          "I Spy",
          "+1 Spy",
          targetServerLabel,
          ...(countersAfter !== undefined ? [`${countersAfter} dort`] : []),
        );
        break;
      }
      if (abilityId === "fang_2_0_pay_to_run") {
        const paid =
          numberValue(payload.runnerRunLockCreditCost) ??
          numberValue(payload.fangRunLockCreditCost) ??
          2;
        category = "run";
        importance = "important";
        title = phrase(
          subject,
          `die Run-Sperre für ${creditText(paid)} entfernt`,
        );
        chips.push("Run-Sperre weg", `${paid} ${creditLabel(paid)}`);
        break;
      }
      if (shellTradersAbility === "set_aside_from_grip") {
        const counters =
          numberValue(payload.shellCounterAmount) ??
          numberValue(payload.remainingCounters) ??
          0;
        const installed = payload.installedFromSpecialZone === true;
        category = "card";
        importance = "important";
        title = phrase(
          subject,
          `${shellTradersTargetTitle ?? "eine Karte"} mit ${counters} Shell-Counter${counters === 1 ? "" : "n"} beiseitegelegt${installed ? " und kostenlos installiert" : ""}`,
        );
        chips.push(
          "The Shell Traders",
          ...(shellTradersTargetTitle ? [shellTradersTargetTitle] : []),
          "Set Aside",
          `${counters} Shell`,
        );
        break;
      }
      if (
        shellTradersAbility === "remove_shell_counter" ||
        shellTradersAbility === "start_turn_remove_shell_counter"
      ) {
        const remaining = numberValue(payload.remainingCounters) ?? 0;
        const installed = payload.installedFromSpecialZone === true;
        const pendingMemory =
          payload.shellAutoInstallPendingMemoryTrash === true;
        category = "card";
        importance = installed || pendingMemory ? "important" : "normal";
        title = phrase(
          subject,
          `1 Shell-Counter von ${shellTradersTargetTitle ?? "einer Karte"} entfernt${installed ? "; Karte kostenlos installiert" : pendingMemory ? "; MU muss freigemacht werden" : ""}`,
        );
        chips.push(
          "The Shell Traders",
          "Shell -1",
          `${remaining} übrig`,
          ...(installed ? ["Installiert"] : []),
          ...(pendingMemory ? ["MU freimachen"] : []),
        );
        break;
      }
      if (shellTradersAbility === "auto_install_after_memory_choice") {
        category = "card";
        importance = "important";
        title = phrase(
          subject,
          `${shellTradersTargetTitle ?? "eine Karte"} durch The Shell Traders kostenlos installiert`,
        );
        chips.push("The Shell Traders", "Installiert", "0 Kosten");
        break;
      }
      if (v1922RunnerProgramAbility === "startup_immolator_trash_ice") {
        const rezCostPaid = numberValue(payload.rezCostPaid) ?? 0;
        const targetDefinitionId =
          stringValue(payload.targetIceDefinitionId) ??
          stringValue(payload.trashedCardDefinitionId);
        category = "run";
        importance = "important";
        visibility = "public";
        title = phrase(
          subject,
          `${cardTitle ?? "Startup Immolator"} erschöpft, das passierte ICE getrasht und ${creditText(rezCostPaid)} bezahlt`,
        );
        description =
          "Quelle und Ziel sind öffentlich: Startup Immolator wurde erschöpft; das Ziel-ICE wurde in die Archive bewegt.";
        cardDefinitionId =
          sourceDefinitionId ?? cardDefinitionId ?? targetDefinitionId;
        chips.push(
          "Startup Immolator",
          "ICE getrasht",
          "Archive",
          `${rezCostPaid} ${creditLabel(rezCostPaid)}`,
        );
        break;
      }
      if (resourceAbility === "broker_load_credits") {
        const addedCredits =
          numberValue(payload.addedCounterAmount) ??
          numberValue(payload.addCounterAmount) ??
          3;
        category = "economy";
        title = phrase(
          subject,
          `${creditText(addedCredits)} auf ${cardTitle ?? "Broker"} gelegt`,
        );
        break;
      }
      if (resourceAbility === "broker_take_credits") {
        const gainedCredits =
          numberValue(payload.gainedCredits) ??
          numberValue(payload.gainCreditsAmount) ??
          amount ??
          0;
        category = "economy";
        title = phrase(
          subject,
          `${creditText(gainedCredits)} von ${cardTitle ?? "Broker"} genommen`,
        );
        break;
      }
      if (resourceAbility === "short_term_contract_take_credits") {
        const gainedCredits =
          numberValue(payload.gainedCredits) ??
          numberValue(payload.gainCreditsAmount) ??
          amount ??
          0;
        const trashed =
          payload.shortTermContractTrashed === true
            ? ", Contract getrasht"
            : "";
        category = "economy";
        title = phrase(
          subject,
          `${creditText(gainedCredits)} von ${cardTitle ?? "Short-Term Contract"} genommen${trashed}`,
        );
        break;
      }
      category = "card";
      title = phrase(
        subject,
        `${cardTitle ?? "eine Kartenfähigkeit"} aktiviert${abilityTextFromLabel(label, cardTitle)}`,
      );
      chips.push("Kartenaktion", ...(cardTitle ? [cardTitle] : []));
      break;
    }
    case "end_turn":
      if (shellTradersAbility === "start_turn_remove_shell_counter") {
        const remaining = numberValue(payload.remainingCounters) ?? 0;
        const installed = payload.installedFromSpecialZone === true;
        const pendingMemory =
          payload.shellAutoInstallPendingMemoryTrash === true;
        category = "card";
        importance = installed || pendingMemory ? "important" : "normal";
        title = phrase(
          subject,
          `1 Shell-Counter von ${shellTradersTargetTitle ?? "einer Karte"} entfernt${installed ? "; Karte kostenlos installiert" : pendingMemory ? "; MU muss freigemacht werden" : ""}`,
        );
        chips.push(
          "The Shell Traders",
          "Shell -1",
          `${remaining} übrig`,
          ...(installed ? ["Installiert"] : []),
          ...(pendingMemory ? ["MU freimachen"] : []),
        );
        break;
      }
      category = "turn";
      title = phrase(
        subject,
        `den Zug beendet${turnChip ? ` (${turnChip})` : ""}`,
      );
      chips.push("Zugende", ...(turnChip ? [turnChip] : []));
      break;
    default:
      category = "system";
      visibility = "system";
      title = actor
        ? phrase(subject, "eine legale Aktion ausgeführt")
        : "Das Spiel hat einen Systemschritt ausgeführt.";
      chips.push("Aktion");
      if (!description && label) description = `Hinweis: ${safeLabel(label)}`;
      break;
  }

  const v181RunnerProgramAbility = stringValue(
    payload.v181RunnerProgramAbility,
  );
  if (v181RunnerProgramAbility === "pattels_virus_counter_choice") {
    const candidateCount = numberValue(payload.pattelsVirusCandidateCount) ?? 0;
    category = "run";
    importance = "important";
    visibility = "public";
    title = phrase(
      subject,
      `Pattel's Virus-Zielwahl für ${candidateCount} ICE geöffnet`,
    );
    chips.push("Pattel's Virus", "Choice", `${candidateCount} ICE`);
  }
  if (v181RunnerProgramAbility === "pattels_virus_counter") {
    const remaining = numberValue(payload.remainingCounters);
    const targetDefinitionId = stringValue(payload.targetCardDefinitionId);
    category = "run";
    importance = "important";
    visibility = "public";
    cardDefinitionId = targetDefinitionId ?? cardDefinitionId;
    title = phrase(
      subject,
      `1 Virus-Counter mit Pattel's Virus auf ${cardTitle ?? "ein ICE"} gelegt`,
    );
    chips.push(
      "Pattel's Virus",
      "+1 Virus",
      ...(remaining !== undefined ? [`${remaining} auf ICE`] : []),
    );
  }
  if (v181RunnerProgramAbility === "pox_counter") {
    const countersAfter = numberValue(payload.poxCountersAfter);
    const targetServerLabel = displayServerLabel(
      stringValue(payload.targetServerLabel),
    );
    category = "run";
    importance = "important";
    visibility = "public";
    title = phrase(
      subject,
      `1 Pox-Counter auf ${targetServerLabel ?? "den angegriffenen Server"} gelegt`,
    );
    chips.push(
      "Pox",
      "+1 Virus",
      ...(targetServerLabel ? [targetServerLabel] : []),
      ...(countersAfter !== undefined ? [`${countersAfter} dort`] : []),
    );
  }
  if (actionType === "install_card") {
    const recurringCreditsLoaded = numberValue(payload.recurringCreditsLoaded);
    const installCostPaid = numberValue(payload.installCostPaid);
    const normalCreditsPaid =
      numberValue(payload.runnerInstallNormalCreditsPaid) ?? 0;
    const hostedCreditsPaid =
      numberValue(payload.runnerInstallHostedCreditsPaid) ?? 0;
    const temporaryCreditsPaid =
      numberValue(payload.runnerInstallTemporaryCreditsPaid) ?? 0;
    const paymentSourceTitles = titlesForDefinitionIds(
      stringValue(payload.runnerInstallPaymentSourceDefinitionIds),
    );
    const iceInstallAdditionalCost =
      numberValue(payload.iceInstallAdditionalCost) ?? 0;
    const iceInstallTotalCost = numberValue(payload.iceInstallTotalCost);
    if (recurringCreditsLoaded !== undefined && recurringCreditsLoaded > 0) {
      description = `${recurringCreditsLoaded} Recurring Credit${recurringCreditsLoaded === 1 ? "" : "s"} wurden auf die Karte gelegt.`;
      chips.push(`${recurringCreditsLoaded} Recurring`);
    }
    if (iceInstallAdditionalCost > 0) {
      description = `Die Installation enthält ${creditText(iceInstallAdditionalCost)} Zusatzkosten${iceInstallTotalCost !== undefined ? `; Gesamtkosten: ${creditText(iceInstallTotalCost)}` : ""}.`;
      chips.push(
        `+${iceInstallAdditionalCost} Installkosten`,
        ...(iceInstallTotalCost !== undefined
          ? [`${iceInstallTotalCost} gesamt`]
          : []),
      );
    }
    if (installCostPaid !== undefined && installCostPaid > 0) {
      const paymentParts = [
        normalCreditsPaid > 0
          ? `${creditText(normalCreditsPaid)} aus dem Creditpool`
          : undefined,
        hostedCreditsPaid > 0
          ? `${creditText(hostedCreditsPaid)} aus Installationsquellen`
          : undefined,
        temporaryCreditsPaid > 0
          ? `${creditText(temporaryCreditsPaid)} temporär`
          : undefined,
      ].filter(Boolean);
      description =
        paymentParts.length > 0
          ? `Installationskosten: ${paymentParts.join(", ")}.`
          : `Installationskosten: ${creditText(installCostPaid)}.`;
      chips.push(
        `${installCostPaid} ${creditLabel(installCostPaid)} bezahlt`,
        ...(normalCreditsPaid > 0 ? [`${normalCreditsPaid} Pool`] : []),
        ...(hostedCreditsPaid > 0 ? [`${hostedCreditsPaid} Quelle`] : []),
        ...paymentSourceTitles,
      );
    }
  }

  if (effect.sentence && !description) description = effect.sentence;

  const citySurveillanceDetails = citySurveillanceChronicleDetails(
    payload,
    side,
  );
  if (citySurveillanceDetails) {
    description = description
      ? `${description} ${citySurveillanceDetails.sentence}`
      : citySurveillanceDetails.sentence;
    chips.push(...citySurveillanceDetails.chips);
    if (citySurveillanceDetails.tagsAdded > 0 && importance === "normal")
      importance = "important";
  }

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
    ...(cardDefinitionId && visibility !== "redacted"
      ? { cardDefinitionId }
      : {}),
    ...(cardTitle && visibility !== "redacted" ? { cardTitle } : {}),
    ...(cardText && visibility !== "redacted" ? { cardText } : {}),
    cardDetailLines: visibility === "redacted" ? [] : cardDetailLines,
    groupLabel: groupLabelFor(
      category,
      actor,
      label,
      serverLabel,
      turnNumber,
      turnSide,
    ),
  };
}

export function formatChronicleEffectItems(
  event: PublicGameEvent,
  side: Side,
): ChronicleItem[] {
  const effects = resolvedEffectsFromPayload(
    event.publicPayload.resolvedEffects,
  );
  const effectItems = effects
    .filter((effect) => !shouldMergeCardResolverEffect(event, effect))
    .map((effect, index) => formatChronicleEffect(event, effect, index, side));
  const payloadItem = endTurnCreditPayoutChronicleItem(event, side);
  const traceHardwareWreckerItem = traceHardwareWreckerChronicleItem(
    event,
    side,
  );
  return [
    ...(payloadItem ? [payloadItem] : []),
    ...(traceHardwareWreckerItem ? [traceHardwareWreckerItem] : []),
    ...effectItems,
  ];
}

function traceHardwareWreckerChronicleItem(
  event: PublicGameEvent,
  side: Side,
): ChronicleItem | undefined {
  const payload = event.publicPayload ?? {};
  if (
    payload.traceSuccessful !== true ||
    payload.traceSuccessEffect !== "hardware_trash_meat_damage_end_run"
  )
    return undefined;
  const actor = sideValue(payload.actor);
  const sourceDefinitionId = stringValue(payload.sourceDefinitionId);
  const sourceTitle =
    titleForDefinitionId(sourceDefinitionId) ??
    stringValue(payload.title) ??
    "Karteneffekt";
  const trashedCount = numberValue(payload.trashedCount) ?? 0;
  const trashedTitle = titleForDefinitionId(
    stringValue(payload.trashedCardDefinitionId),
  );
  const damageAmount = numberValue(payload.damageAmount) ?? 0;
  const damageType = damageTypeLabel(stringValue(payload.damageType) ?? "meat");
  const trashText = trashedTitle
    ? `${trashedTitle} getrasht`
    : trashedCount > 0
      ? `${trashedCount} Hardware getrasht`
      : "keine Hardware getrasht";
  const damageText =
    damageAmount > 0
      ? `${damageAmount} ${damageType} verursacht`
      : `kein ${damageType} verursacht`;
  return {
    id: `${event.eventId}:trace-hardware-wrecker`,
    category: "danger",
    importance: "critical",
    visibility: "public",
    ...(actor ? { actor } : {}),
    title: ensurePeriod(`${sourceTitle}: ${trashText} und ${damageText}`),
    description: ensurePeriod(
      `Der erfolgreiche Trace beendet den Run${payload.damageCannotBePrevented === true ? "; der Schaden kann nicht verhindert werden" : ""}`,
    ),
    chips: uniqueChips([
      ...baseChips(actor, false),
      sourceTitle,
      "Trace-Erfolg",
      trashedTitle ??
        (trashedCount > 0 ? `${trashedCount} Hardware` : "Keine Hardware"),
      `${damageAmount} ${damageType}`,
      ...(payload.damageCannotBePrevented === true
        ? ["Nicht verhinderbar"]
        : []),
      "Run endet",
    ]),
    ...(sourceDefinitionId ? { cardDefinitionId: sourceDefinitionId } : {}),
    cardTitle: sourceTitle,
    cardDetailLines: [],
    groupLabel: groupLabelFor(
      "run",
      actor,
      undefined,
      displayServerLabel(stringValue(payload.serverLabel)),
      undefined,
    ),
  };
}

export function shouldSuppressChronicleEventItem(
  event: PublicGameEvent,
): boolean {
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  if (actionType === "decline_rez") return true;
  if (
    actionType === "resolve_choice" &&
    stringValue(payload.hiddenZoneAction) === "p3_33_private_look"
  )
    return true;
  if (actionType !== "continue_run" || payload.encounterContinue !== true)
    return false;
  return resolvedEffectsFromPayload(payload.resolvedEffects).some(
    (effect) => stringValue(effect.kind) === "resolve_subroutine",
  );
}

export function chronicleTurnNumberByEventId(
  events: PublicGameEvent[],
): Record<string, number> {
  const numbers: Record<string, number> = {};
  let activeSide: Side = "corp";
  let activeTurnNumber = 1;
  let justEndedTurn: { side: Side; turnNumber: number } | null = null;

  for (const event of events) {
    const actionType =
      stringValue(event.publicPayload.actionType) ?? event.type;
    const actor = sideValue(event.publicPayload.actor);
    if (!actor) continue;

    if (
      justEndedTurn &&
      actor === justEndedTurn.side &&
      isDiscardPhaseResolution(event)
    ) {
      numbers[event.eventId] = justEndedTurn.turnNumber;
      continue;
    }
    justEndedTurn = null;

    if (actionType === "mandatory_draw" && actor === "corp") {
      if (activeSide !== "corp") {
        activeSide = "corp";
        activeTurnNumber += 1;
      }
      numbers[event.eventId] = activeTurnNumber;
      continue;
    }

    numbers[event.eventId] = activeTurnNumber;

    if (actionType === "end_turn") {
      if (activeSide !== actor) activeSide = actor;
      justEndedTurn = { side: actor, turnNumber: activeTurnNumber };
      activeSide = actor === "corp" ? "runner" : "corp";
      activeTurnNumber += 1;
    }
  }

  return numbers;
}

export function chronicleTurnSideByEventId(
  events: PublicGameEvent[],
): Record<string, Side> {
  const sides: Record<string, Side> = {};
  let activeSide: Side = "corp";
  let justEndedTurn: { side: Side } | null = null;

  for (const event of events) {
    const actionType =
      stringValue(event.publicPayload.actionType) ?? event.type;
    const actor = sideValue(event.publicPayload.actor);
    if (!actor) continue;

    if (
      justEndedTurn &&
      actor === justEndedTurn.side &&
      isDiscardPhaseResolution(event)
    ) {
      sides[event.eventId] = justEndedTurn.side;
      continue;
    }
    justEndedTurn = null;

    if (actionType === "mandatory_draw" && actor === "corp") {
      activeSide = "corp";
      sides[event.eventId] = activeSide;
      continue;
    }

    if (actionType === "end_turn" && activeSide !== actor) activeSide = actor;
    sides[event.eventId] = activeSide;

    if (actionType === "end_turn") {
      justEndedTurn = { side: actor };
      activeSide = actor === "corp" ? "runner" : "corp";
    }
  }

  return sides;
}

function isDiscardPhaseResolution(event: PublicGameEvent): boolean {
  const payload = event.publicPayload ?? {};
  return (
    payload.discardResolved === true ||
    stringValue(payload.hiddenZoneAction) === "discard_phase"
  );
}

export function chronicleActionUseByEventId(
  events: PublicGameEvent[],
): Record<string, ChronicleActionUse> {
  const spentBySide: Partial<Record<Side, number>> = {};
  const result: Record<string, ChronicleActionUse> = {};

  for (const event of events) {
    const payload = event.publicPayload ?? {};
    const actionType = stringValue(payload.actionType) ?? event.type;
    const actor = sideValue(payload.actor);
    if (!actor) continue;

    const clicks = positiveIntegerValue(payload.actionCostClicks);
    if (clicks !== undefined) {
      const runningStart = (spentBySide[actor] ?? 0) + 1;
      const payloadStart = positiveIntegerValue(payload.turnActionOrdinalStart);
      const start = Math.max(runningStart, payloadStart ?? 0);
      const payloadEnd = positiveIntegerValue(payload.turnActionOrdinalEnd);
      const end = Math.max(start + clicks - 1, payloadEnd ?? 0);
      const label = start === end ? String(start) : `${start}-${end}`;
      const title =
        start === end
          ? `${start}. Aktion in diesem Zug`
          : `Aktionen ${start} bis ${end} in diesem Zug`;
      result[event.eventId] = { label, title, clicks, start, end };
      spentBySide[actor] = end;
    }

    if (actionType === "end_turn") spentBySide[actor] = 0;
  }

  return result;
}

function formatChronicleEffect(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
  index: number,
  side: Side,
): ChronicleItem {
  const actor = sideValue(effect.side);
  const subject = subjectFor(actor, side, false);
  const sourceTitle = stringValue(effect.sourceTitle);
  const sourceDefinitionId = stringValue(effect.sourceDefinitionId);
  let displayCardDefinitionId = sourceDefinitionId;
  let displayCardTitle = sourceTitle;
  const cardTitle = stringValue(effect.cardTitle);
  const cardDefinitionId = stringValue(effect.cardDefinitionId);
  const amount = numberValue(effect.amount) ?? 0;
  const chips = [...baseChips(actor, false)];
  let category: ChronicleCategory = "system";
  let importance: ChronicleImportance = "normal";
  let visibility: ChronicleVisibility = chronicleEffectVisibility(effect, side);
  let title = "Ein automatischer Effekt wurde aufgelöst";
  let description: string | undefined;
  const through =
    sourceTitle && sourceTitle !== cardTitle ? ` durch ${sourceTitle}` : "";

  if (visibility === "redacted") {
    const accessDamage = accessEffectDamageChronicleItem(
      event,
      effect,
      index,
      actor,
      subject,
      sourceTitle,
      sourceDefinitionId,
      amount,
    );
    if (accessDamage) return accessDamage;
    const accessAmbushTrash = accessAmbushTrashInstalledChronicleItem(
      event,
      effect,
      index,
      actor,
    );
    if (accessAmbushTrash) return accessAmbushTrash;
    const redactedAccessAmbushCounter =
      redactedAccessAmbushCounterChronicleItem(
        event,
        effect,
        index,
        actor,
        subject,
      );
    if (redactedAccessAmbushCounter) return redactedAccessAmbushCounter;
    return redactedChronicleEffectItem(
      event,
      effect,
      index,
      actor,
      subject,
      amount,
    );
  }

  const randomStartTurnOutcome = startTurnRandomEffectOutcome(effect);
  if (effect.reason === "start_of_turn" && randomStartTurnOutcome) {
    const payload = effect as Record<string, unknown>;
    const dieRoll = numberValue(payload.v1921DieRoll);
    const outcome = randomStartTurnOutcome;
    const outcomeDamageType = startTurnRandomEffectDamageType(outcome);
    const displayDamageType = damageTypeLabel(
      stringValue(effect.damageType) ?? outcomeDamageType,
    );
    category =
      outcomeDamageType !== undefined
        ? "danger"
        : outcome === "permanent_action"
          ? "turn"
          : "card";
    importance =
      outcomeDamageType !== undefined
        ? "critical"
        : outcome === "permanent_action"
          ? "important"
          : "normal";
    const source =
      sourceTitle ?? titleForDefinitionId(sourceDefinitionId) ?? "Die Quelle";
    const rollText =
      dieRoll !== undefined ? ` würfelt eine ${dieRoll}` : " würfelt";
    const gainsAction = subject === "Du" ? "Du erhältst" : `${subject} erhält`;
    const suffersDamage =
      subject === "Du" ? "Du erleidest" : `${subject} erleidet`;
    if (outcome === "permanent_action") {
      title = `${source}${rollText}: ${gainsAction} dauerhaft 1 zusätzliche Aktion`;
      description = `${source} wurde getrasht; die zusätzliche Aktion gilt ab diesem und den folgenden Runner-Zügen.`;
      chips.push(
        source,
        ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []),
        "Extra-Aktion",
        "Dauerhaft",
        "Trash",
      );
    } else if (outcomeDamageType !== undefined) {
      title = `${source}${rollText}: ${suffersDamage} ${amount || 1} ${displayDamageType}`;
      if (payload.damageCannotBePrevented === true)
        description = `Der Schaden von ${source} kann nicht verhindert werden.`;
      chips.push(
        source,
        ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []),
        displayDamageType,
        ...(payload.damageCannotBePrevented === true
          ? ["Nicht verhinderbar"]
          : []),
      );
    } else {
      title = `${source}${rollText}: kein weiterer Effekt`;
      chips.push(
        source,
        ...(dieRoll !== undefined ? [`Wurf ${dieRoll}`] : []),
        "Kein Effekt",
      );
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
      cardTitle: source,
      cardDetailLines: [],
      groupLabel: groupLabelFor(
        category,
        actor,
        undefined,
        displayServerLabel(effect.serverLabel),
        undefined,
      ),
    };
  }

  switch (effect.kind) {
    case "gain_credits": {
      category = "economy";
      title =
        effect.reason === "start_of_turn" && sourceTitle
          ? `${sourceTitle} gibt ${sideLabel(actor)} ${creditText(amount)}`
          : phrase(subject, `${creditText(amount)}${through} erhalten`);
      chips.push(`+${amount} Credit${amount === 1 ? "" : "s"}`, "Automatisch");
      break;
    }
    case "lose_credits":
      category = "danger";
      title = phrase(subject, `${creditText(amount)}${through} verloren`);
      chips.push(`-${amount} ${creditLabel(amount)}`, "Automatisch");
      break;
    case "draw_cards":
      category = "card";
      if (sourceDefinitionId === SKIVVISS_ID) {
        const targetSubject = subject === "Du" ? "Du" : subject;
        title = `${sourceTitle ?? "Skivviss"}: ${targetSubject} ${
          targetSubject === "Du" ? "ziehst" : "zieht"
        } zu Beginn ${
          targetSubject === "Du" ? "deines" : "ihres"
        } Zugs ${amount} ${
          amount === 1 ? "zusätzliche Karte" : "zusätzliche Karten"
        }`;
        description = `Grund: ${amount} Skivviss-Counter auf der Korp.`;
        chips.push(
          "Skivviss",
          "Automatisch",
          "Korp-Zugstart",
          `${amount} Skivviss-Counter`,
          amount === 1 ? "1 Zusatzkarte" : `${amount} Zusatzkarten`,
        );
      } else {
        title = phrase(subject, `${cardCountText(amount)}${through} gezogen`);
        chips.push(
          amount === 1 ? "Karte ziehen" : `${amount} Karten`,
          "Automatisch",
        );
      }
      break;
    case "rez_card":
      category = "card";
      importance =
        effect.reason === "region_install" ||
        effect.reason === "install_rez" ||
        effect.reason === "on_score"
          ? "important"
          : "normal";
      title = `${cardTitle ?? sourceTitle ?? "Eine Karte"} wurde${
        effect.reason === "region_install" || effect.reason === "install_rez"
          ? " sofort"
          : ""
      } gerezzt`;
      chips.push("Rez", "Automatisch");
      break;
    case "steal_agenda":
      category = "agenda";
      importance = "critical";
      title = phrase(
        subject,
        `${cardTitle ?? "eine Agenda"}${through} gestohlen`,
      );
      chips.push(
        "Agenda",
        ...(amount > 0 ? [`+${amount} Agenda`] : []),
        "Automatisch",
      );
      break;
    case "trash_card":
      category = "card";
      importance = "important";
      title =
        effect.reason === "region_limit"
          ? `${cardTitle ?? "Eine vorhandene Region"} wurde${through} ins Archiv gelegt`
          : `${cardTitle ?? "Eine Karte"} wurde${through} getrasht`;
      chips.push(
        "Trash",
        effect.reason === "region_limit" ? "Region" : "Automatisch",
      );
      break;
    case "purge_counters":
      category = "danger";
      importance = "important";
      title = phrase(
        subject,
        `${amount} ${counterLabel(effect.counterType)} entfernt`,
      );
      chips.push("Purge", counterLabel(effect.counterType));
      break;
    case "counter_change": {
      const counterText = counterLabel(effect.counterType);
      const added = numberValue(effect.addedCounterAmount) ?? 0;
      const removed = numberValue(effect.removedCounterAmount) ?? 0;
      if (effect.reason === "cockroach_successful_hq_run" && added > 0) {
        const source = sourceTitle ?? "Cockroach";
        category = "run";
        importance = "important";
        title = phrase(
          subject,
          `${added} ${counterText} durch ${source} erhalten`,
        );
        description = `Diese Cockroach-Counter zählen als Virus-Counter, weil Cockroach ein Programm-Virus ist, und werden durch Virus-Purge entfernt.`;
        chips.push(
          source,
          `+${added} ${counterText}`,
          ...(effect.remainingCounters !== undefined
            ? [`${effect.remainingCounters} gesamt`]
            : []),
          "Virus/Purge",
          "Erfolgreicher HQ-Run",
        );
        break;
      }
      const pattelAccessCounter = pattelAccessCounterChronicleText(
        event,
        effect,
      );
      if (pattelAccessCounter) {
        category = "run";
        importance = "important";
        title = pattelAccessCounter.title;
        description = pattelAccessCounter.description;
        chips.push(
          "Access-Ambush",
          "Pattel Antibody",
          counterText,
          ...(pattelAccessCounter.targetChips ?? []),
        );
        break;
      }
      if (
        effect.reason === "proteus_runner_virus_successful_run" &&
        added > 0
      ) {
        const source = sourceTitle ?? "Proteus-Virus";
        const server = displayServerLabel(effect.serverLabel);
        category = "run";
        importance = "important";
        if (isSocketCounterType(effect.counterType) && server) {
          title = `${server} hat ${added} ${counterText} durch ${source} erhalten`;
        } else {
          title = phrase(
            subject,
            `${added} ${counterText} durch ${source} erhalten`,
          );
        }
        if (effect.counterType === "cascade") {
          const serverText = server ? ` auf ${server}` : "";
          description = `Nach einem erfolgreichen Run${serverText} hat die Korp ${added} ${counterText} erhalten. Je 2 Cascade-Counter zwingen die Korp zu Beginn ihres Zugs, 1 offene Karte aus R&D ins Archiv zu legen.`;
        }
        chips.push(
          source,
          `+${added} ${counterText}`,
          ...(server ? [server] : []),
          ...(effect.remainingCounters !== undefined
            ? [`${effect.remainingCounters} gesamt`]
            : []),
          "Erfolgreicher Run",
        );
        break;
      }
      const shellTradersRemoval =
        sourceDefinitionId === SHELL_TRADERS_ID &&
        effect.counterType === "shell" &&
        removed > 0;
      const counterTargetTitle = shellTradersRemoval
        ? (cardTitle ?? "einer Karte")
        : (sourceTitle ?? cardTitle ?? "einer Karte");
      category = "card";
      if (removed > 0) {
        title = phrase(
          subject,
          `${removed} ${counterText} von ${counterTargetTitle} entfernt`,
        );
        chips.push(
          counterText,
          `${removed} entfernt`,
          `${amount} übrig`,
          "Automatisch",
        );
        if (shellTradersRemoval) {
          displayCardDefinitionId = cardDefinitionId ?? sourceDefinitionId;
          displayCardTitle = cardTitle ?? sourceTitle;
          chips.push("The Shell Traders");
        }
      } else {
        title = phrase(
          subject,
          `${counterText} auf ${sourceTitle ?? cardTitle ?? "einer Karte"} aufgefrischt`,
        );
        chips.push(
          counterText,
          `${amount} bereit`,
          ...(added > 0 ? [`+${added}`] : []),
          "Automatisch",
        );
      }
      break;
    }
    case "add_hosted_credits":
      category = "economy";
      title = `${creditText(amount)} wurden auf ${sourceTitle ?? cardTitle ?? "die Karte"} gelegt`;
      chips.push(`+${amount} ${creditLabel(amount)} auf Karte`, "Automatisch");
      break;
    case "take_hosted_credits": {
      const remaining = numberValue(effect.remainingCounters) ?? 0;
      category = "economy";
      title =
        effect.reason === "start_of_turn" && sourceTitle
          ? `${sourceTitle} gibt ${sideLabel(actor)} ${creditText(amount)} von der Karte`
          : phrase(
              subject,
              `${creditText(amount)} von ${sourceTitle ?? cardTitle ?? "der Karte"} genommen`,
            );
      chips.push(
        `+${amount} ${creditLabel(amount)}`,
        `${amount} ${creditLabel(amount)} von Karte`,
        `${remaining} ${creditLabel(remaining)} übrig`,
        "Automatisch",
      );
      break;
    }
    case "trash_source_when_empty":
      category = "economy";
      title = `${sourceTitle ?? cardTitle ?? "Die Quelle"} wurde getrasht`;
      chips.push("Quelle getrasht", "Automatisch");
      break;
    case "trash_source":
      category = "card";
      title =
        effect.reason === "run_start"
          ? `${sourceTitle ?? cardTitle ?? "Die Quelle"} wurde getrasht, weil Runner einen Run startet`
          : `${sourceTitle ?? cardTitle ?? "Die Quelle"} wurde getrasht`;
      chips.push("Quelle getrasht", "Automatisch");
      break;
    case "pay_credits_or_lose_game": {
      const paid = numberValue(effect.paidCredits) ?? 0;
      category = effect.gameLost === true ? "danger" : "economy";
      importance = effect.gameLost === true ? "critical" : "important";
      title =
        effect.gameLost === true
          ? `${sourceTitle ?? cardTitle ?? "Eine Karte"} verlässt das Spiel; ${sideLabel(actor)} verliert das Spiel`
          : `${sourceTitle ?? cardTitle ?? "Eine Karte"} verlässt das Spiel; ${sideLabel(actor)} zahlt ${creditText(paid)}`;
      chips.push(
        effect.gameLost === true
          ? "Spielverlust"
          : `${paid} ${creditLabel(paid)} gezahlt`,
        "Leave play",
      );
      break;
    }
    case "gain_actions":
      category = "turn";
      title =
        effect.reason === "start_of_turn" && sourceTitle
          ? `${sourceTitle} gibt ${sideLabel(actor)} ${amount} Aktion${amount === 1 ? "" : "en"}`
          : phrase(
              subject,
              `${amount} zusätzliche Aktion${amount === 1 ? "" : "en"}${through} erhalten`,
            );
      chips.push(`+${amount} Aktion${amount === 1 ? "" : "en"}`);
      break;
    case "add_tags":
      category = "danger";
      importance = "important";
      title = phrase(
        subject,
        `${amount} Tag${amount === 1 ? "" : "s"}${through} erhalten`,
      );
      chips.push(`+${amount} Tag${amount === 1 ? "" : "s"}`);
      break;
    case "remove_tags":
      category = "danger";
      title = phrase(
        subject,
        `${amount} Tag${amount === 1 ? "" : "s"} entfernt`,
      );
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
      {
        const damageType = damageTypeLabel(stringValue(effect.damageType));
        const cardsTrashed = numberValue(effect.cardsTrashed) ?? 0;
        title = phrase(subject, `${amount} ${damageType}${through} erlitten`);
        if (cardsTrashed > 0)
          description = `${cardCountText(cardsTrashed)} ${cardsTrashed === 1 ? "wurde" : "wurden"} dadurch in den Heap bewegt.`;
        chips.push(
          "Schaden",
          damageType,
          ...(sourceTitle ? [sourceTitle] : []),
          ...(cardsTrashed > 0 ? [`${cardsTrashed} Heap`] : []),
          ...(effect.reason === "access_effect" ? ["Access-Effekt"] : []),
        );
      }
      break;
    case "resolve_subroutine": {
      const source = sourceTitle ?? "ICE";
      const subroutineIndex = numberValue(effect.subroutineIndex);
      const subroutineNumber =
        subroutineIndex !== undefined ? subroutineIndex + 1 : undefined;
      const subroutineChip =
        subroutineNumber !== undefined
          ? `Subroutine ${subroutineNumber}`
          : "Subroutine";
      const subroutineType = stringValue(effect.subroutineType);
      const damageType = stringValue(effect.damageType);
      const cardsTrashed = numberValue(effect.cardsTrashed) ?? 0;
      const damageLabel = damageTypeLabel(damageType);
      const preventionSummary = subroutineDamagePreventionSummary(
        event.publicPayload ?? {},
        amount,
        damageType,
        source,
      );
      const trashedProgramTitle =
        subroutineType === "trash_installed_program" && cardsTrashed > 0
          ? (titleForDefinitionId(cardDefinitionId) ??
            cardTitle ??
            "ein Programm")
          : undefined;
      category = subroutineType === "do_damage" ? "danger" : "run";
      importance =
        subroutineType === "do_damage" || effect.endedRun === true
          ? "critical"
          : "important";
      title =
        subroutineType === "do_damage" && preventionSummary
          ? `${source}: ${subroutineChip} macht ${preventionSummary.originalAmount} ${damageLabel}; ${preventionSummary.preventedAmount} durch ${preventionSummary.sourceTitle} verhindert, Ergebnis ${preventionSummary.finalAmount} ${damageLabel}`
          : subroutineType === "do_damage"
            ? `${source}: ${subroutineChip} macht ${amount} ${damageLabel}`
            : trashedProgramTitle
              ? `${source}: ${subroutineChip} trasht ${trashedProgramTitle}`
              : effect.endedRun === true
                ? `${source}: ${subroutineChip} beendet den Run`
                : `${source}: ${subroutineChip} aufgelöst`;
      if (subroutineType === "do_damage" && cardsTrashed > 0)
        description = `${cardCountText(cardsTrashed)} ${cardsTrashed === 1 ? "wurde" : "wurden"} in den Heap bewegt.`;
      if (
        subroutineType === "do_damage" &&
        preventionSummary &&
        preventionSummary.finalAmount === 0
      )
        description = `Kein ${damageLabel} bleibt übrig.`;
      if (trashedProgramTitle)
        description = `${trashedProgramTitle} wurde in den Heap bewegt.`;
      chips.push(
        subroutineChip,
        ...(subroutineType === "do_damage"
          ? [
              ...(preventionSummary
                ? [
                    `${preventionSummary.originalAmount} ${damageLabel}`,
                    `${preventionSummary.preventedAmount} verhindert`,
                    `${preventionSummary.finalAmount} ${damageLabel}`,
                    preventionSummary.sourceTitle,
                  ]
                : [`${amount} ${damageLabel}`]),
              ...(cardsTrashed > 0 ? [`${cardsTrashed} Heap`] : []),
            ]
          : []),
        ...(trashedProgramTitle
          ? [trashedProgramTitle, "Programm getrasht"]
          : []),
        ...(effect.endedRun === true ? ["Run endet"] : []),
        source,
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
    ...(displayCardDefinitionId
      ? { cardDefinitionId: displayCardDefinitionId }
      : {}),
    ...(displayCardTitle ? { cardTitle: displayCardTitle } : {}),
    cardDetailLines: [],
    groupLabel: groupLabelFor(
      category,
      actor,
      undefined,
      displayServerLabel(effect.serverLabel),
      undefined,
    ),
  };
}

function accessEffectDamageChronicleItem(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
  index: number,
  actor: Side | undefined,
  subject: string,
  sourceTitle: string | undefined,
  sourceDefinitionId: string | undefined,
  amount: number,
): ChronicleItem | null {
  if (effect.kind !== "damage" || effect.reason !== "access_effect")
    return null;
  const source =
    sourceTitle ?? titleForDefinitionId(sourceDefinitionId) ?? "Access-Effekt";
  const damageType = damageTypeLabel(stringValue(effect.damageType));
  const cardsTrashed = numberValue(effect.cardsTrashed) ?? 0;
  return {
    id: `${event.eventId}:effect:${effect.effectId || index}`,
    category: "danger",
    importance: "critical",
    visibility: "public",
    ...(actor ? { actor } : {}),
    title: ensurePeriod(
      phrase(subject, `${amount} ${damageType} durch ${source} erlitten`),
    ),
    ...(cardsTrashed > 0
      ? {
          description: ensurePeriod(
            `${cardCountText(cardsTrashed)} ${cardsTrashed === 1 ? "wurde" : "wurden"} dadurch in den Heap bewegt`,
          ),
        }
      : {}),
    chips: uniqueChips([
      ...baseChips(actor, false),
      "Access-Effekt",
      source,
      damageType,
      ...(cardsTrashed > 0 ? [`${cardsTrashed} Heap`] : []),
    ]),
    ...(sourceDefinitionId ? { cardDefinitionId: sourceDefinitionId } : {}),
    cardTitle: source,
    cardDetailLines: [],
    groupLabel: groupLabelFor(
      "run",
      actor,
      undefined,
      displayServerLabel(effect.serverLabel),
      undefined,
    ),
  };
}

function accessAmbushTrashInstalledChronicleItem(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
  index: number,
  actor: Side | undefined,
): ChronicleItem | null {
  if (effect.kind !== "trash_card" || effect.reason !== "access_effect")
    return null;
  const payload = event.publicPayload ?? {};
  const sourceDefinitionId =
    stringValue(effect.sourceDefinitionId) ??
    stringValue(payload.ambushDefinitionId) ??
    stringValue(payload.accessEffectSourceDefinitionId);
  const isAccessAmbushTrash =
    stringValue(payload.hiddenZoneAction) ===
      "v1919_access_ambush_trash_installed" || Boolean(sourceDefinitionId);
  if (!isAccessAmbushTrash) return null;
  const source =
    stringValue(effect.sourceTitle) ??
    titleForDefinitionId(sourceDefinitionId) ??
    "Access-Ambush";
  const trashedTitles = titlesForDefinitionIds(
    stringValue(payload.trashedCardDefinitionIds) ??
      stringValue(effect.cardDefinitionId),
  );
  const trashedCount =
    numberValue(payload.trashedCount) ??
    (trashedTitles.length > 0
      ? trashedTitles.length
      : (numberValue(effect.amount) ?? 0));
  const counterCount =
    numberValue(payload.advancementCounterCount) ??
    numberValue(payload.targetTrashCount);
  const counterText =
    counterCount !== undefined
      ? `${counterCount} Advancement-Counter`
      : "Advancement-Counter";
  const targetText =
    trashedTitles.length > 0
      ? joinChronicleParts(trashedTitles)
      : trashedCount > 0
        ? `${trashedCount} Programm${trashedCount === 1 ? "" : "e"}`
        : "kein Programm";
  const trashVerb = trashedCount === 1 ? "trashte" : "trashten";
  const title =
    trashedCount > 0
      ? `${source} wurde beim Zugriff ausgelöst: ${counterText} ${trashVerb} ${targetText}`
      : `${source} wurde beim Zugriff ausgelöst: ${counterText} trashte kein Programm`;
  const serverLabel = displayServerLabel(effect.serverLabel);
  return {
    id: `${event.eventId}:effect:${effect.effectId || index}`,
    category: "run",
    importance: trashedCount > 0 ? "important" : "normal",
    visibility: "public",
    ...(actor ? { actor } : {}),
    title: ensurePeriod(title),
    chips: uniqueChips([
      ...baseChips(actor, false),
      "Access-Ambush",
      source,
      ...(counterCount !== undefined ? [counterText] : []),
      ...(trashedTitles.length > 0
        ? trashedTitles
        : trashedCount > 0
          ? [`${trashedCount} Programm${trashedCount === 1 ? "" : "e"}`]
          : ["Kein Programm"]),
    ]),
    ...(sourceDefinitionId ? { cardDefinitionId: sourceDefinitionId } : {}),
    cardTitle: source,
    cardDetailLines: [],
    groupLabel: groupLabelFor("run", actor, undefined, serverLabel, undefined),
  };
}

function pattelAccessCounterChronicleText(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
): { title: string; description?: string; targetChips?: string[] } | null {
  if (
    effect.kind !== "counter_change" ||
    !isPattelAccessCounterType(effect.counterType)
  )
    return null;
  const payload = event.publicPayload ?? {};
  const sourceDefinitionId =
    stringValue(effect.sourceDefinitionId) ??
    stringValue(payload.ambushDefinitionId) ??
    stringValue(payload.accessEffectSourceDefinitionId);
  const sourceTitle =
    stringValue(effect.sourceTitle) ?? titleForDefinitionId(sourceDefinitionId);
  const isPattelAccessCounter =
    effect.reason === "access_effect" ||
    sourceDefinitionId === "onr_proteus_068_pattel-antibody" ||
    sourceTitle === "Pattel Antibody" ||
    stringValue(payload.hiddenZoneAction) ===
      "proteus_breaker_strength_penalty_access_counters";
  if (!isPattelAccessCounter) return null;
  const targetTitles = titlesForDefinitionIds(
    stringValue(payload.targetCardDefinitionIds),
  );
  const added = numberValue(effect.addedCounterAmount) ?? 0;
  const targetCount =
    numberValue(payload.targetCount) ??
    (targetTitles.length > 0 ? targetTitles.length : added);
  if (targetCount <= 0 || added <= 0) {
    return {
      title:
        "Es wurden keine Pattel-Counter auf Icebrecher gelegt, da keine im Spiel waren",
      targetChips: ["Keine Icebrecher"],
    };
  }
  const targetText =
    targetTitles.length > 0
      ? joinChronicleParts(targetTitles)
      : targetCount === 1
        ? "einen Icebrecher"
        : `${targetCount} Icebrecher`;
  return {
    title: `1 Pattel-Counter auf ${targetText} gelegt`,
    ...(targetCount > 1
      ? {
          description: `Jeder betroffene Icebrecher hat 1 Pattel-Counter erhalten.`,
        }
      : {}),
    targetChips: [
      targetCount === 1 ? "1 Icebrecher" : `${targetCount} Icebrecher`,
      ...targetTitles,
    ],
  };
}

function isPattelAccessCounterType(counterType: unknown): boolean {
  return (
    counterType === "breaker_strength_penalty" ||
    counterType === "pattel_antibody"
  );
}

function endTurnCreditPayoutChronicleItem(
  event: PublicGameEvent,
  side: Side,
): ChronicleItem | undefined {
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  if (actionType !== "end_turn") return undefined;
  const gainedCredits =
    numberValue(payload.gainedCredits) ??
    numberValue(payload.gainCreditsAmount);
  if (gainedCredits === undefined || gainedCredits <= 0) return undefined;
  const sourceDefinitionId = stringValue(payload.sourceDefinitionId);
  const sourceTitle =
    titleForDefinitionId(sourceDefinitionId) ??
    stringValue(payload.sourceTitle) ??
    stringValue(payload.title);
  const actor = sideValue(payload.actor);
  const recipient = subjectFor(actor, side, false);
  const rezzedIceCount =
    numberValue(payload.corpRezzedIceThisTurnCount) ??
    numberValueFromRecord(payload.amounts, "corpRezzedIceThisTurnCount");
  const iceClause =
    rezzedIceCount !== undefined && rezzedIceCount > 0
      ? `Die Korp hat in diesem Zug ${rezzedIceCount} ICE gerezzt. `
      : "Die Korp hat in diesem Zug ICE gerezzt. ";
  const recipientClause =
    recipient === "Du" ? "Du erhältst" : `${recipient} erhält`;
  const sourceClause = sourceTitle ? ` durch ${sourceTitle}` : "";
  return {
    id: `${event.eventId}:end-turn-credit-payout`,
    category: "economy",
    importance: "important",
    visibility: "public",
    ...(actor ? { actor } : {}),
    title: `${iceClause}${recipientClause}${sourceClause} ${creditText(gainedCredits)}.`,
    chips: uniqueChips([
      "Zugende",
      `+${gainedCredits} ${creditLabel(gainedCredits)}`,
      ...(rezzedIceCount !== undefined && rezzedIceCount > 0
        ? [`${rezzedIceCount} ICE gerezzt`]
        : []),
      ...(sourceTitle ? [sourceTitle] : []),
    ]),
    ...(sourceDefinitionId ? { cardDefinitionId: sourceDefinitionId } : {}),
    ...(sourceTitle ? { cardTitle: sourceTitle } : {}),
    cardDetailLines: [],
    groupLabel: groupLabelFor(
      "economy",
      actor,
      undefined,
      undefined,
      undefined,
    ),
  };
}

function chronicleEffectVisibility(
  effect: ResolvedGameEffect,
  viewerSide: Side,
): ChronicleVisibility {
  if (effect.visibility === "public") return "public";
  if (effect.visibility === "private_to_side" && effect.side === viewerSide)
    return "side";
  return "redacted";
}

function redactedAccessAmbushCounterChronicleItem(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
  index: number,
  actor: Side | undefined,
  subject: string,
): ChronicleItem | null {
  if (effect.kind !== "counter_change") return null;
  const payload = event.publicPayload ?? {};
  const sourceDefinitionId =
    stringValue(effect.sourceDefinitionId) ??
    stringValue(payload.ambushDefinitionId) ??
    stringValue(payload.accessEffectSourceDefinitionId);
  if (!sourceDefinitionId) return null;
  const source =
    stringValue(effect.sourceTitle) ??
    titleForDefinitionId(sourceDefinitionId) ??
    "Access-Ambush";
  const counterText = counterLabel(effect.counterType);
  const added =
    numberValue(effect.addedCounterAmount) ?? numberValue(effect.amount) ?? 0;
  if (added <= 0) return null;
  const remaining = numberValue(effect.remainingCounters);
  const title =
    subject === "Du"
      ? `Du hast ${added} ${counterText} durch ${source} erhalten`
      : `${subject} hat ${added} ${counterText} durch ${source} erhalten`;
  return {
    id: `${event.eventId}:effect:${effect.effectId || index}`,
    category: "card",
    importance: "important",
    visibility: "public",
    ...(actor ? { actor } : {}),
    title: ensurePeriod(title),
    chips: uniqueChips([
      ...baseChips(actor, false),
      "Access-Ambush",
      source,
      `+${added} ${counterText}`,
      ...(remaining !== undefined ? [`${remaining} gesamt`] : []),
    ]),
    cardDefinitionId: sourceDefinitionId,
    cardTitle: source,
    cardDetailLines: [],
    groupLabel: groupLabelFor(
      "card",
      actor,
      undefined,
      displayServerLabel(effect.serverLabel),
      undefined,
    ),
  };
}

function redactedChronicleEffectItem(
  event: PublicGameEvent,
  effect: ResolvedGameEffect,
  index: number,
  actor: Side | undefined,
  subject: string,
  amount: number,
): ChronicleItem {
  const chips = uniqueChips([
    ...baseChips(actor, false),
    "Verdeckt",
    "Automatisch",
  ]);
  const zoneLabel =
    actor === "corp"
      ? "ins Archiv"
      : actor === "runner"
        ? "in den Heap"
        : "abgelegt";
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
    groupLabel: groupLabelFor(
      category,
      actor,
      undefined,
      displayServerLabel(effect.serverLabel),
      undefined,
    ),
  };
}

function actionUseFromPayload(
  payload: Record<string, unknown>,
): ChronicleActionUse | undefined {
  const clicks = positiveIntegerValue(payload.actionCostClicks);
  const start = positiveIntegerValue(payload.turnActionOrdinalStart);
  const end = positiveIntegerValue(payload.turnActionOrdinalEnd) ?? start;
  if (!clicks || !start || !end) return undefined;
  const label = start === end ? String(start) : `${start}-${end}`;
  const title =
    start === end
      ? `${start}. Aktion in diesem Zug`
      : `Aktionen ${start} bis ${end} in diesem Zug`;
  return { label, title, clicks, start, end };
}

export function chronicleGroupLabel(item: ChronicleItem): string {
  return item.groupLabel;
}

export function chronicleStartTurnEffectGroupFromEvent(
  event: PublicGameEvent,
  eventTurnNumber: number | null | undefined,
  item: ChronicleItem,
): { label: string; kind: Side } | null {
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  const eventActor = sideValue(payload.actor);
  if (
    !chronicleEventCanCarryNextTurnStartEffects(event, actionType) ||
    !eventActor ||
    !item.actor ||
    item.actor === eventActor
  )
    return null;
  if (!chronicleItemIsStartTurnEffectFromEvent(event, item)) return null;
  const label = chronicleTurnGroupLabel(
    item.actor,
    eventTurnNumber ? eventTurnNumber + 1 : null,
  );
  return { label, kind: item.actor };
}

function chronicleEventCanCarryNextTurnStartEffects(
  event: PublicGameEvent,
  actionType: string,
): boolean {
  return actionType === "end_turn" || isDiscardPhaseResolution(event);
}

function chronicleItemIsStartTurnEffectFromEvent(
  event: PublicGameEvent,
  item: ChronicleItem,
): boolean {
  const effectPrefix = `${event.eventId}:effect:`;
  if (!item.id.startsWith(effectPrefix)) return false;
  return resolvedEffectsFromPayload(event.publicPayload.resolvedEffects).some(
    (effect, index) =>
      item.id === `${effectPrefix}${effect.effectId || index}` &&
      effect.reason === "start_of_turn" &&
      sideValue(effect.side) === item.actor,
  );
}

function startTurnRandomEffectOutcome(
  effect: ResolvedGameEffect,
): string | undefined {
  const payload = effect as Record<string, unknown>;
  const outcome =
    stringValue(payload.randomEffectOutcome) ??
    stringValue(payload.questForCattekinOutcome);
  if (
    outcome === "no_effect" ||
    outcome === "permanent_action" ||
    startTurnRandomEffectDamageType(outcome) !== undefined
  )
    return outcome;
  return undefined;
}

function startTurnRandomEffectDamageType(
  outcome: string | undefined,
): string | undefined {
  const match = outcome?.match(/^(net|meat|core)_damage$/);
  return match?.[1];
}

function categoryFor(actionType: string): ChronicleCategory {
  if (["mandatory_draw", "end_turn"].includes(actionType)) return "turn";
  if (["gain_credit"].includes(actionType)) return "economy";
  if (
    [
      "start_run",
      "rez_ice",
      "decline_rez",
      "pump_breaker",
      "break_subroutine",
      "continue_run",
      "jack_out",
      "access_card",
      "decline_trash",
    ].includes(actionType)
  )
    return "run";
  if (["score_agenda", "steal_agenda"].includes(actionType)) return "agenda";
  if (["remove_tag"].includes(actionType)) return "danger";
  if (["game_created"].includes(actionType)) return "system";
  return "card";
}

function subjectFor(
  actor: Side | undefined,
  side: Side,
  isAi: boolean,
): string {
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
  if (gain)
    return {
      category: "economy",
      suffix: "Credits erhalten",
      chips: [`+${gain[1]} Credits`],
    };
  const draw = cardText.match(/Ziehe\s+(\d+)\s+Karten/i);
  if (draw)
    return {
      category: "card",
      suffix: "Karten gezogen",
      chips: [`${draw[1]} Karten`],
    };
  const lose = cardText.match(/Runner verliert\s+(\d+)\s+Credits/i);
  if (lose)
    return {
      category: "danger",
      sentence: `Der Runner verliert bis zu ${lose[1]} Credits.`,
      chips: [`-${lose[1]} Runner-Credits`],
    };
  const tag = cardText.match(/Gib dem Runner\s+(\d+)\s+Tag/i);
  if (tag)
    return {
      category: "danger",
      sentence: `Der Runner erhält ${tag[1]} Tag.`,
      chips: [`+${tag[1]} Tag`],
    };
  const coreDamage = cardText.match(/(\d+)\s+Core Damage/i);
  if (coreDamage)
    return {
      category: "danger",
      sentence: `Der Runner erleidet ${coreDamage[1]} Core Damage.`,
      chips: [`${coreDamage[1]} Core`],
    };
  if (/Run auf einen Server/i.test(cardText))
    return { category: "run", suffix: "Run-Druck aufgebaut", chips: ["Run"] };
  return { chips: [] };
}

function scoreAgendaPayloadEffect(
  payload: Record<string, unknown>,
): EffectSummary | undefined {
  const gainedCredits = numberValue(payload.onScoreGainCredits);
  if (gainedCredits !== undefined && gainedCredits > 0)
    return {
      category: "economy",
      suffix: `${creditText(gainedCredits)} erhalten`,
      chips: [`+${gainedCredits} ${creditLabel(gainedCredits)}`],
    };
  if (payload.onScoreLostAllCredits === true)
    return {
      category: "danger",
      suffix: "alle Credits verloren",
      chips: ["Alle Credits verloren"],
    };
  return undefined;
}

function projectZurichScoreSummary(
  payload: Record<string, unknown>,
): { suffix: string; description: string; chips: string[] } | undefined {
  const overadvancedBy = numberValue(payload.projectZurichOveradvance);
  const recurringCredits = numberValue(payload.overadvanceRecurringCredits);
  if (overadvancedBy === undefined && recurringCredits === undefined)
    return undefined;
  const overadvance = Math.max(0, Math.floor(overadvancedBy ?? 0));
  const credits = Math.max(0, Math.floor(recurringCredits ?? 0));
  const creditPhrase = creditText(credits);
  const overadvanceText =
    overadvance === 1
      ? "1 zusätzlicher Advancement-Counter"
      : `${overadvance} zusätzliche Advancement-Counter`;
  return {
    suffix:
      credits > 0
        ? `${creditPhrase} zu Beginn jedes Korp-Zugs vorbereitet`
        : "keine wiederkehrenden Credits vorbereitet",
    description:
      credits > 0
        ? `Overadvance: ${overadvanceText}. Project Zurich gibt der Korp zu Beginn jedes ihrer Züge ${creditPhrase}.`
        : `Overadvance: ${overadvanceText}; dadurch entstehen keine wiederkehrenden Credits.`,
    chips: [
      "Project Zurich",
      `Overadvance ${overadvance}`,
      `+${credits} ${creditLabel(credits)}/Zug`,
    ],
  };
}

function mergedCardResolverEventEffect(
  event: PublicGameEvent,
): EffectSummary | undefined {
  const effects = resolvedEffectsFromPayload(
    event.publicPayload.resolvedEffects,
  );
  if (
    effects.length === 0 ||
    !effects.every((effect) => shouldMergeCardResolverEffect(event, effect))
  )
    return undefined;
  const effectSides = new Set(
    effects.map((effect) => sideValue(effect.side)).filter(Boolean),
  );
  const includeSideForGainCredits = effectSides.size > 1;
  const parts = effects
    .map((effect) =>
      cardResolverPlayEffectPart(effect, { includeSideForGainCredits }),
    )
    .filter((part): part is EffectSummary => Boolean(part));
  if (parts.length !== effects.length) return undefined;
  const suffix = joinChronicleParts(
    parts
      .map((part) => part.suffix)
      .filter((value): value is string => Boolean(value)),
  );
  const sourceTitle = stringValue(effects[0]?.sourceTitle);
  return {
    category: parts.some((part) => part.category === "danger")
      ? "danger"
      : parts.some((part) => part.category === "economy")
        ? "economy"
        : "card",
    chips: parts.flatMap((part) => part.chips),
    ...(suffix ? { suffix } : {}),
    ...(sourceTitle ? { sourceTitle } : {}),
  };
}

function cardResolverPlayEffectPart(
  effect: ResolvedGameEffect,
  options: { includeSideForGainCredits?: boolean } = {},
): EffectSummary | undefined {
  const amount = numberValue(effect.amount) ?? 0;
  if (effect.kind === "draw_cards")
    return {
      category: "card",
      suffix: `${cardCountText(amount)} gezogen`,
      chips: [amount === 1 ? "Karte ziehen" : `${amount} Karten`],
    };
  if (effect.kind === "gain_credits")
    return {
      category: "economy",
      suffix: options.includeSideForGainCredits
        ? `${sideLabel(effect.side)} erhält ${creditText(amount)}`
        : `${creditText(amount)} erhalten`,
      chips: [`+${amount} ${creditLabel(amount)}`],
    };
  if (effect.kind === "lose_credits")
    return {
      category: "danger",
      suffix: `${sideLabel(effect.side)} verliert ${creditText(amount)}`,
      chips: [`${sideLabel(effect.side)} -${amount} ${creditLabel(amount)}`],
    };
  if (effect.kind === "add_tags")
    return {
      category: "danger",
      suffix: `${sideLabel(effect.side)} erhält ${amount} Tag${amount === 1 ? "" : "s"}`,
      chips: [`+${amount} Tag${amount === 1 ? "" : "s"}`],
    };
  if (effect.kind === "damage")
    return {
      category: "danger",
      suffix: `${sideLabel(effect.side)} erleidet ${amount} ${damageTypeLabel(stringValue(effect.damageType))}`,
      chips: [`${amount} ${damageTypeLabel(stringValue(effect.damageType))}`],
    };
  if (effect.kind === "add_hosted_credits")
    return {
      category: "economy",
      suffix: `${creditText(amount)} auf die Karte gelegt`,
      chips: [`+${amount} ${creditLabel(amount)} auf Karte`],
    };
  if (effect.kind === "take_hosted_credits")
    return {
      category: "economy",
      suffix: `${creditText(amount)} von der Karte genommen`,
      chips: [
        `+${amount} ${creditLabel(amount)}`,
        `${amount} ${creditLabel(amount)} von Karte`,
        `${numberValue(effect.remainingCounters) ?? 0} ${creditLabel(numberValue(effect.remainingCounters) ?? 0)} übrig`,
      ],
    };
  if (effect.kind === "trash_source_when_empty")
    return {
      category: "economy",
      suffix: `${stringValue(effect.sourceTitle) ?? "Quelle"} getrasht`,
      chips: ["Quelle getrasht"],
    };
  if (effect.kind === "trash_source")
    return {
      category: "card",
      suffix: `${stringValue(effect.sourceTitle) ?? "Quelle"} getrasht`,
      chips: ["Quelle getrasht"],
    };
  return undefined;
}

function citySurveillanceChronicleDetails(
  payload: Record<string, unknown>,
  side: Side,
): { sentence: string; chips: string[]; tagsAdded: number } | undefined {
  const sourceCount = numberValue(payload.citySurveillanceSourceCount) ?? 0;
  if (sourceCount <= 0) return undefined;
  const creditsPaid = numberValue(payload.citySurveillanceCreditsPaid) ?? 0;
  const tagsAdded =
    numberValue(payload.citySurveillanceTagsAdded) ??
    numberValue(payload.citySurveillanceTags) ??
    0;
  if (creditsPaid <= 0 && tagsAdded <= 0) return undefined;

  const runnerSubject = side === "runner" ? "Du" : "Der Runner";
  const runnerVerb = runnerSubject === "Du" ? "hast" : "hat";
  const parts: string[] = [];
  if (creditsPaid > 0) parts.push(`${creditText(creditsPaid)} gezahlt`);
  if (tagsAdded > 0) parts.push(`${tagCountText(tagsAdded)} erhalten`);
  else if (creditsPaid > 0) parts.push("keinen Tag erhalten");

  return {
    sentence: `City Surveillance: ${runnerSubject} ${runnerVerb} ${joinChronicleParts(parts) ?? "keinen Effekt erhalten"}.`,
    chips: [
      "City Surveillance",
      ...(creditsPaid > 0
        ? [`-${creditsPaid} ${creditLabel(creditsPaid)}`]
        : []),
      ...(tagsAdded > 0
        ? [`+${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`]
        : ["Kein Tag"]),
    ],
    tagsAdded,
  };
}

function joinChronicleParts(parts: string[]): string | undefined {
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} und ${parts[parts.length - 1]}`;
}

function actionCountText(amount: number): string {
  return `${amount} Aktion${amount === 1 ? "" : "en"}`;
}

function purgeableRunnerVirusCounterSummaryParts(
  payload: Record<string, unknown>,
): string[] {
  const summary = stringValue(payload.purgedCounterSummary);
  if (!summary) return [];
  return summary
    .split(";")
    .map((part) => part.trim())
    .flatMap((part) => {
      const match = part.match(/:([a-z_]+)=(\d+)$/);
      const counterType = match?.[1];
      const amount = Number(match?.[2]);
      if (!counterType || !Number.isInteger(amount) || amount <= 0) return [];
      return [`${amount} ${counterLabel(counterType)}`];
    });
}

function securityPurgeChronicleSummary(
  payload: Record<string, unknown>,
  fallbackTitle: string | null | undefined,
): { title: string; description?: string; chips: string[] } {
  const agendaTitle =
    fallbackTitle ??
    titleForDefinitionId(stringValue(payload.sourceDefinitionId)) ??
    "Security Purge";
  const revealedCount = numberValue(payload.revealedCount) ?? 0;
  const installedIceCount = numberValue(payload.installedIceCount) ?? 0;
  const revealedIceCount =
    numberValue(payload.revealedIceCount) ?? installedIceCount;
  const trashedCount = numberValue(payload.trashedCount) ?? 0;
  const pendingTrashCount = numberValue(payload.pendingTrashCount) ?? 0;
  const revealedTitles = titlesForDefinitionIds(
    stringValue(payload.publicRevealDefinitionIds),
  );
  const revealedIceTitles = iceTitlesForDefinitionIds(
    stringValue(payload.publicRevealDefinitionIds),
  );
  const installedTitles = titlesForDefinitionIds(
    stringValue(payload.installedIceDefinitionIds),
  );
  const installedServerLabels = (
    stringValue(payload.installedIceServerLabels) ?? ""
  )
    .split(",")
    .map((label) => displayServerLabel(label.trim()))
    .filter((label): label is string => Boolean(label));
  const trashedTitles = titlesForDefinitionIds(
    stringValue(payload.trashedDefinitionIds),
  );
  const revealedDescription =
    revealedTitles.length > 0
      ? `Aufgedeckt: ${revealedTitles.join(", ")}`
      : undefined;
  const targetChoiceResolved =
    payload.securityPurgeTargetChoiceResolved === true ||
    payload.agendaPurgeTargetChoiceResolved === true;
  const targetChoiceOpened =
    payload.securityPurgeTargetChoiceOpened === true ||
    payload.agendaPurgeTargetChoiceOpened === true;
  if (targetChoiceResolved) {
    const singleInstalledTitle = installedTitles[0];
    const singleServerLabel = installedServerLabels[0];
    const installedPairs = installedTitles.map((title, index) => {
      const serverLabel = installedServerLabels[index];
      return serverLabel ? `${title} vor ${serverLabel}` : title;
    });
    const installedDescription =
      installedPairs.length > 0
        ? `Installiert und gerezzt: ${installedPairs.join("; ")}`
        : `${installedIceCount} ICE installiert und gerezzt`;
    const trashDescription =
      trashedTitles.length > 0
        ? `Getrasht: ${joinChronicleParts(trashedTitles)}`
        : trashedCount > 0
          ? `${trashedCount} übrige ${trashedCount === 1 ? "Karte" : "Karten"} getrasht`
          : undefined;
    return {
      title:
        installedIceCount === 1 && singleInstalledTitle && singleServerLabel
          ? `${singleInstalledTitle} durch ${agendaTitle} vor ${singleServerLabel} installiert und gerezzt`
          : `${agendaTitle} aufgelöst: ${installedIceCount} ICE installiert und gerezzt`,
      description: [revealedDescription, installedDescription, trashDescription]
        .filter((part): part is string => Boolean(part))
        .join(". "),
      chips: [
        "Security Purge",
        revealedCount > 0 ? `Top ${revealedCount}` : "R&D Reveal",
        `${installedIceCount} ICE`,
        ...installedServerLabels,
        `${trashedCount} Trash`,
      ],
    };
  }
  if (targetChoiceOpened) {
    const iceText =
      revealedIceTitles.length > 0
        ? `ICE zur Installation: ${joinChronicleParts(revealedIceTitles)}`
        : `${revealedIceCount} ICE gefunden`;
    return {
      title: `${agendaTitle} gescored und ${revealedCount} R&D-Karten aufgedeckt`,
      description: [
        revealedDescription,
        `${iceText}; die Korp wählt Zielserver`,
        `${pendingTrashCount} Nicht-ICE ${pendingTrashCount === 1 ? "wird" : "werden"} anschließend getrasht`,
      ]
        .filter((part): part is string => Boolean(part))
        .join(". "),
      chips: [
        "Score",
        "R&D Reveal",
        revealedCount > 0 ? `Top ${revealedCount}` : "",
        `${revealedIceCount} ICE`,
        `${pendingTrashCount} Trash offen`,
      ],
    };
  }
  return {
    title: `${agendaTitle} gescored und ${revealedCount} R&D-Karten aufgedeckt`,
    description: [
      revealedDescription,
      installedIceCount > 0
        ? `${installedIceCount} ICE installiert und gerezzt; ${trashedCount} Nicht-ICE getrasht`
        : `Kein ICE gefunden; ${trashedCount} Nicht-ICE getrasht`,
    ]
      .filter((part): part is string => Boolean(part))
      .join(". "),
    chips: [
      "Score",
      "R&D Reveal",
      revealedCount > 0 ? `Top ${revealedCount}` : "",
      `${installedIceCount || revealedIceCount} ICE`,
      `${trashedCount} Trash`,
    ],
  };
}

function shouldMergeCardResolverEffect(
  event: PublicGameEvent,
  effect: ResolvedGameEffect | undefined,
): boolean {
  if (!effect) return false;
  const payload = event.publicPayload ?? {};
  const actionType = stringValue(payload.actionType) ?? event.type;
  const activatedCardAbility =
    actionType === "activated_card_ability" &&
    stringValue(payload.cardImplementationAbility) === "activated";
  if (
    actionType !== "play_event" &&
    actionType !== "play_operation" &&
    actionType !== "rez_ice" &&
    actionType !== "install_card" &&
    actionType !== "score_agenda" &&
    !activatedCardAbility
  )
    return false;
  if (
    (actionType === "rez_ice" || actionType === "install_card") &&
    effect.kind !== "add_hosted_credits"
  )
    return false;
  if (
    actionType === "score_agenda" &&
    !["add_hosted_credits", "gain_credits", "lose_credits"].includes(
      effect.kind,
    )
  )
    return false;
  if (
    ![
      "draw_cards",
      "gain_credits",
      "lose_credits",
      "add_tags",
      "damage",
      "add_hosted_credits",
      "take_hosted_credits",
      "trash_source_when_empty",
      "trash_source",
    ].includes(effect.kind) ||
    effect.visibility !== "public"
  )
    return false;
  if (effect.reason !== "card_resolver") return false;
  const actor = sideValue(payload.actor);
  if (
    !["lose_credits", "add_tags", "damage"].includes(effect.kind) &&
    actor &&
    effect.side &&
    actor !== effect.side
  )
    return false;
  const amount = numberValue(effect.amount);
  if (amount === undefined || amount < 0) return false;
  if (effect.kind !== "lose_credits" && amount <= 0) return false;
  const playedDefinitionId = stringValue(payload.cardDefinitionId);
  const sourceDefinitionId = stringValue(effect.sourceDefinitionId);
  if (
    playedDefinitionId &&
    sourceDefinitionId &&
    playedDefinitionId !== sourceDefinitionId
  )
    return false;
  const playedTitle = stringValue(payload.title);
  const sourceTitle = stringValue(effect.sourceTitle);
  if (
    !playedDefinitionId &&
    !sourceDefinitionId &&
    playedTitle &&
    sourceTitle &&
    playedTitle !== sourceTitle
  )
    return false;
  return true;
}

function highlighterAccessExplanation(payload: Record<string, unknown>): {
  counterCount: number;
  accessNumber: number;
  totalAccesses: number;
} | null {
  const highlighterCounterCount =
    numberValue(payload.highlighterCounterCount) ?? 0;
  const highlighterAccessBonus =
    numberValue(payload.highlighterAccessBonus) ??
    Math.max(0, highlighterCounterCount - 1);
  const accessIndex = numberValue(payload.accessIndex);
  const baseAccessCount = numberValue(payload.baseAccessCount) ?? 1;
  const effectiveAccessCount = numberValue(payload.effectiveAccessCount);
  if (
    highlighterCounterCount <= 1 ||
    highlighterAccessBonus <= 0 ||
    accessIndex === undefined ||
    effectiveAccessCount === undefined ||
    accessIndex < Math.max(1, baseAccessCount)
  )
    return null;
  return {
    counterCount: highlighterCounterCount,
    accessNumber: accessIndex + 1,
    totalAccesses: Math.max(accessIndex + 1, effectiveAccessCount),
  };
}

function freeAccessTrashSourceLabel(
  payload: Record<string, unknown>,
): string | null {
  if (payload.freeAccessTrash !== true) return null;
  const counterType = stringValue(
    payload.proteusRunnerVirusFreeTrashCounterType,
  );
  if (counterType === "garbage") return "Garbage In";
  if (counterType === "crumble") return "Crumble";
  return "Gratis-Trash";
}

function rezSuffix(
  cardType: string | null | undefined,
  effect: EffectSummary,
): string {
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

function socialEngineeringAmountDetail(
  hiddenAmount: number | undefined,
  guessAmount: number | undefined,
): string {
  const hiddenText =
    hiddenAmount !== undefined
      ? `Runner versteckte ${creditText(hiddenAmount)}`
      : "Der versteckte Runner-Betrag wurde nicht öffentlich benannt";
  const guessText =
    guessAmount !== undefined
      ? `die Korp riet ${creditText(guessAmount)}`
      : "die Korp gab einen Guess ab";
  return `${hiddenText}; ${guessText}.`;
}

function hqCardCountText(amount: number): string {
  return `${amount} HQ-Karte${amount === 1 ? "" : "n"}`;
}

function breakSubroutineLabel(
  payload: Record<string, unknown>,
  fallbackCount: number,
): string {
  if (payload.breakAllMatchingSubroutines === true) return "alle Subroutinen";
  const rawIndex = numberValue(payload.subroutineIndex);
  if (rawIndex !== undefined && Number.isInteger(rawIndex) && rawIndex >= 0)
    return `Subroutine ${rawIndex + 1}`;
  const rawIndexes = stringValue(payload.subroutineIndexes);
  const indexes = rawIndexes
    ?.split(",")
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value >= 0);
  if (indexes && indexes.length > 0)
    return `Subroutinen ${indexes.map((index) => index + 1).join(", ")}`;
  return fallbackCount === 1
    ? "eine Subroutine"
    : `${fallbackCount} Subroutinen`;
}

function dieText(amount: number): string {
  return amount === 1 ? "Würfel" : "Würfel";
}

function isPlayfulAiDiceLoopPayload(
  payload: Record<string, unknown>,
  abilityId: string | null,
): boolean {
  const eventAbility = stringValue(payload.v1921RunnerEventAbility);
  if (
    abilityId === "playful_ai_dice_loop" ||
    eventAbility === "playful_ai_dice_loop"
  )
    return true;
  const sourceDefinitionId =
    stringValue(payload.sourceDefinitionId) ??
    stringValue(payload.cardDefinitionId) ??
    stringValueFromRecord(payload.targets, "sourceDefinitionId");
  return (
    sourceDefinitionId === PLAYFUL_AI_ID &&
    (abilityId === "random_dice_loop" || eventAbility === "random_dice_loop")
  );
}

function playfulAiRollChips(
  dieRolls: number[],
  fallbackRoll: number | undefined,
): string[] {
  if (dieRolls.length > 1) return [`Würfe ${dieRolls.join(", ")}`];
  const roll = dieRolls[0] ?? fallbackRoll;
  return roll !== undefined ? [`Wurf ${roll}`] : [];
}

function playfulAiResolveDescription(
  dieRolls: number[],
  queuedBeforeRolls: number | undefined,
  remainingDice: number | undefined,
  choiceOpened: boolean,
  complete: boolean,
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
        : "Der letzte Wurf öffnet eine weitere Entscheidung.",
    );
  } else if (complete) {
    parts.push("Die Playful-AI-Schleife ist abgeschlossen.");
  }
  return parts.join(" ") || undefined;
}

function vacuumLinkTitleOutcome(
  dieRoll: number,
  rewindApplied: boolean,
  rewindBack: number | undefined,
): string {
  if (!rewindApplied) return ": kein Zurücksetzen";
  const back = rewindBack ?? dieRoll;
  const backText = back === 1 ? "1 gerezztes ICE" : `${back} gerezzte ICE`;
  return `: ${backText} zurück, sonst zum ersten ICE; Runner darf ausstöpseln`;
}

function vacuumLinkDescription(
  dieRoll: number,
  rewindApplied: boolean,
  rewindBack: number | undefined,
  targetIcePosition: number | undefined,
): string {
  if (!rewindApplied)
    return `Wurf ${dieRoll}: Kein Zurücksetzen; der Run läuft weiter.`;
  const back = rewindBack ?? dieRoll;
  const backText = back === 1 ? "1 gerezztes ICE" : `${back} gerezzte ICE`;
  const targetText =
    targetIcePosition !== undefined
      ? ` Ziel ist ICE ${targetIcePosition}.`
      : "";
  return `Wurf ${dieRoll}: Runner wird um ${backText} zurückgesetzt oder darf ausstöpseln; wenn nicht so viele ICE vorhanden sind, geht es zum ersten ICE.${targetText}`;
}

function traceParticipantLabel(participant: Side, viewer: Side): string {
  if (participant === viewer) return "Du";
  return participant === "corp" ? "Korp" : "Runner";
}

function traceStartTitle(
  subject: string,
  cardTitle: string | undefined,
  baseTraceStrength: number | undefined,
): string {
  return phrase(
    subject,
    `${cardTitle ? `mit ${cardTitle} ` : ""}einen Trace${baseTraceStrength !== undefined ? ` ${baseTraceStrength}` : ""} ausgelöst`,
  );
}

function cardCountText(amount: number): string {
  return amount === 1 ? "eine Karte" : `${amount} Karten`;
}

function privateLookActionText(payload: Record<string, unknown>): string {
  const zone = stringValue(payload.privateLookZone);
  const count = numberValue(payload.privateLookCount) ?? 1;
  if (zone === "rd")
    return count === 1
      ? "die oberste R&D-Karte angesehen"
      : `die obersten ${count} R&D-Karten angesehen`;
  if (zone === "hq")
    return count === 1
      ? "eine HQ-Karte angesehen"
      : `${count} HQ-Karten angesehen`;
  return `${cardCountText(count)} angesehen`;
}

function privateLookChips(payload: Record<string, unknown>): string[] {
  const zone = stringValue(payload.privateLookZone);
  const count = numberValue(payload.privateLookCount) ?? 1;
  const zoneChip =
    zone === "rd" ? "R&D" : zone === "hq" ? "HQ" : "Private Look";
  return [zoneChip, `${count} angesehen`];
}

function tagCountText(amount: number): string {
  return `${amount} Tag${amount === 1 ? "" : "s"}`;
}

function subroutineDamagePreventionSummary(
  payload: Record<string, unknown>,
  effectAmount: number,
  damageType: string | undefined,
  subroutineSource: string,
):
  | {
      originalAmount: number;
      preventedAmount: number;
      finalAmount: number;
      sourceTitle: string;
    }
  | undefined {
  const preventedAmount = numberValue(payload.preventedAmount);
  if (preventedAmount === undefined || preventedAmount <= 0) return undefined;
  const payloadDamageType = stringValue(payload.damageType);
  if (payloadDamageType && damageType && payloadDamageType !== damageType)
    return undefined;
  const finalAmount =
    numberValue(payload.damageAmount) ??
    numberValue(payload.finalAmount) ??
    effectAmount;
  if (finalAmount !== effectAmount) return undefined;
  const originalAmount =
    numberValue(payload.originalAmount) ?? finalAmount + preventedAmount;
  if (originalAmount <= finalAmount) return undefined;
  const preventionSourceDefinitionId =
    stringValue(payload.sourceDefinitionId) ??
    stringValue(payload.cardDefinitionId);
  const sourceTitle =
    titleForDefinitionId(preventionSourceDefinitionId) ??
    stringValue(payload.title) ??
    stringValue(payload.sourceTitle);
  if (!sourceTitle || sourceTitle === subroutineSource) return undefined;
  return {
    originalAmount,
    preventedAmount,
    finalAmount,
    sourceTitle,
  };
}

function openArchivesCardCountText(amount: number): string {
  return amount === 1
    ? "eine offene Archives-Karte"
    : `${amount} offene Archives-Karten`;
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

function accessReplacementEffectParts(
  creditLoss: number,
  tagsAdded: number,
  corpDrawnCount: number,
  gainedCredits = 0,
): string[] {
  const parts: string[] = [];
  if (creditLoss > 0) parts.push(`Korp verliert ${creditText(creditLoss)}`);
  if (tagsAdded > 0)
    parts.push(`Runner erhält ${tagsAdded} Tag${tagsAdded === 1 ? "" : "s"}`);
  if (gainedCredits > 0)
    parts.push(`Runner erhält ${creditText(gainedCredits)}`);
  if (corpDrawnCount > 0)
    parts.push(`Korp zieht ${cardCountText(corpDrawnCount)}`);
  return parts.length > 0 ? parts : ["der Zugriff wird ersetzt"];
}

function gypsyScheduleAnalyzerChronicleSummary(
  payload: Record<string, unknown>,
  fallbackCardTitle: string | undefined,
): {
  title: string;
  description: string;
  chips: string[];
  cardDefinitionId: string;
  sourceTitle: string;
} {
  const sourceDefinitionId =
    stringValue(payload.sourceDefinitionId) ?? GYPSY_SCHEDULE_ANALYZER_ID;
  const sourceTitle =
    titleForDefinitionId(sourceDefinitionId) ??
    stringValue(payload.sourceTitle) ??
    fallbackCardTitle ??
    "Gypsy Schedule Analyzer";
  const revealedTitles = publicRevealTitlesFromPayload(payload);
  const revealedCount =
    numberValue(payload.revealedCount) ?? revealedTitles.length;
  const storedAgendaDefinitionId =
    stringValue(payload.storedAgendaDefinitionId) ??
    definitionIdsFromCsv(stringValue(payload.revealedAgendaDefinitionIds))[0];
  const storedAgendaTitle = titleForDefinitionId(storedAgendaDefinitionId);
  const agendaStored =
    payload.agendaStoredInHq === true || Boolean(storedAgendaDefinitionId);
  const shuffledIntoRdCount =
    numberValue(payload.shuffledIntoRdCount) ??
    Math.max(0, revealedCount - (agendaStored ? 1 : 0));
  const revealDescription =
    revealedTitles.length > 0
      ? `Aufgedeckt: ${revealedTitles.join(", ")}.`
      : revealedCount > 0
        ? `${cardCountText(revealedCount)} aus R&D wurden aufgedeckt.`
        : "R&D war leer.";
  const shuffleDescription = agendaStored
    ? `${shuffledIntoRdCount} Nicht-Agenda-${shuffledIntoRdCount === 1 ? "Karte wurde" : "Karten wurden"} in R&D gemischt; es gab keinen normalen Zugriff.`
    : `${shuffledIntoRdCount} aufgedeckte ${shuffledIntoRdCount === 1 ? "Karte wurde" : "Karten wurden"} in R&D gemischt; es gab keinen normalen Zugriff.`;

  return {
    title: agendaStored
      ? `${sourceTitle} abgeschlossen: ${storedAgendaTitle ?? "eine Agenda"} gefunden und in HQ gespeichert`
      : `${sourceTitle} abgeschlossen: keine Agenda in R&D gefunden`,
    description: `${revealDescription} ${shuffleDescription}`,
    chips: [
      sourceTitle,
      "R&D Reveal",
      revealedCount > 0 ? `Top ${revealedCount}` : "R&D leer",
      agendaStored ? "Agenda nach HQ" : "Keine Agenda",
      `${shuffledIntoRdCount} gemischt`,
    ],
    cardDefinitionId: sourceDefinitionId,
    sourceTitle,
  };
}

function publicRevealTitlesFromPayload(
  payload: Record<string, unknown>,
): string[] {
  const fromIds = titlesForDefinitionIds(
    stringValue(payload.publicRevealDefinitionIds),
  );
  if (fromIds.length > 0) return fromIds;
  const rawTitles = stringValue(payload.publicRevealTitles);
  if (!rawTitles) return [];
  const separator = rawTitles.includes("||")
    ? "||"
    : rawTitles.includes("|")
      ? "|"
      : ",";
  return rawTitles
    .split(separator)
    .map((title) => title.trim())
    .filter(Boolean);
}

function searchDestinationLabel(destination: string | undefined): string {
  if (destination === "install_program") return "das Rig";
  if (destination === "grip") return "den Grip";
  return "die Hand";
}

function installLocation(
  serverLabel: string | undefined,
  zoneLabel: string | undefined,
  label: string | undefined,
): string {
  if (serverLabel)
    return zoneLabel === "ICE" ? ` vor ${serverLabel}` : ` in ${serverLabel}`;
  if (zoneLabel === "Rig") return " im Rig";
  if (zoneLabel === "Resource") return " als Resource";
  const area = installAreaFromLabel(label);
  if (area === "Remote") return " in einem Remote";
  if (area === "ICE") return " als ICE";
  return "";
}

function installDestinationForTitle(
  actor: Side | undefined,
  serverLabel: string | undefined,
  zoneLabel: string | undefined,
  label: string | undefined,
): string {
  if (zoneLabel === "Resource") return " als Resource";
  if (actor === "runner" || zoneLabel === "Rig") return " im Rig";
  return installLocation(serverLabel, zoneLabel, label);
}

function installAreaFromPayload(
  serverLabel: string | undefined,
  zoneLabel: string | undefined,
  label: string | undefined,
): string {
  if (zoneLabel) return zoneLabel;
  if (serverLabel) return /Remote/.test(serverLabel) ? "Remote" : serverLabel;
  return installAreaFromLabel(label);
}

function installAreaFromLabel(label: string | undefined): string {
  if (!label) return "Installation";
  if (/ice|vor/i.test(label)) return "ICE";
  if (/remote|außenserver|aussenserver|fort/i.test(label)) return "Remote";
  return "Installation";
}

function advanceTitlePart(
  cardTitle: string | undefined,
  cardType: string | null | undefined,
  serverLabel: string | undefined,
  redacted: boolean,
): string {
  if (redacted || !cardTitle)
    return `eine Installation${serverLabel ? ` in ${serverLabel}` : ""} ausgebaut`;
  if (cardType === "agenda") return `das Projekt ${cardTitle} weiterentwickelt`;
  if (cardType === "asset") return `die Anlage ${cardTitle} ausgebaut`;
  if (cardType === "upgrade") return `das Upgrade ${cardTitle} ausgebaut`;
  return `${cardTitle} weiterentwickelt`;
}

function displayServerLabel(label: string | undefined): string | undefined {
  if (!label) return undefined;
  if (label === "hq" || label === "HQ") return "HQ";
  if (label === "rd" || label === "R&D") return "R&D";
  if (label === "archives" || label === "Archives") return "Archive";
  if (label === "new_remote") return "neuem Remote";
  const remote = /^remote_(\d+)$/.exec(label);
  if (remote?.[1]) return `Remote ${remote[1]}`;
  return label;
}

function accessServerLocationSuffix(serverLabel: string | undefined): string {
  if (!serverLabel) return "";
  if (serverLabel === "Archive") return " im Archiv";
  return ` in ${serverLabel}`;
}

function accessServerSourceSuffix(serverLabel: string | undefined): string {
  if (!serverLabel) return "";
  if (serverLabel === "Archive") return " aus dem Archiv";
  return ` aus ${serverLabel}`;
}

function accessServerStatusLabel(serverLabel: string): string {
  return `${serverLabel === "Archive" ? "Archiv" : serverLabel}-Zugriff`;
}

function runTargetFromLabel(label: string | undefined): string {
  const match = label?.match(/Run auf (.+)$/i);
  return match?.[1]?.trim() || "einen Server";
}

function extractCardTitleFromLabel(
  actionType: string,
  label: string | undefined,
  actor: Side | undefined,
): string | undefined {
  if (
    !label ||
    (actor === "corp" && ["install_card", "advance_card"].includes(actionType))
  )
    return undefined;
  if (actionType === "trigger_ability") {
    const title = label.match(/^(.+?):\s+.+$/)?.[1]?.trim();
    if (title && !isGenericCardLabel(title)) return title;
  }
  if (actionType === "break_subroutine") {
    const title = sourceTitleFromActionLabel(label);
    if (title) return title;
  }
  const patterns: RegExp[] = [];
  if (
    [
      "install_card",
      "play_event",
      "play_operation",
      "rez_ice",
      "pump_breaker",
      "trash_accessed_card",
      "trash_resource",
      "steal_agenda",
    ].includes(actionType)
  ) {
    patterns.push(
      /^(.+?)\s+(?:installieren|spielen|rezzen|pumpen|trashen|stehlen)$/i,
    );
    patterns.push(/^(.+?)\s+auf\s+.+$/i);
  }
  for (const pattern of patterns) {
    const match = label.match(pattern);
    const title = match?.[1]?.trim();
    if (title && !isGenericCardLabel(title)) return title;
  }
  return undefined;
}

function sourceTitleFromActionLabel(
  label: string | undefined,
): string | undefined {
  const title = label?.match(/^(.+?):\s+.+$/)?.[1]?.trim();
  return title && !isGenericCardLabel(title) ? title : undefined;
}

function shellTradersAbilityFromPayload(
  payload: Record<string, unknown>,
  abilityId: string | undefined,
): string | undefined {
  const explicit = stringValue(payload.shellTradersAbility);
  if (explicit) return explicit;
  if (
    stringValue(payload.sourceDefinitionId) === SHELL_TRADERS_ID &&
    (abilityId === "set_aside_from_grip" ||
      abilityId === "remove_shell_counter" ||
      abilityId === "start_turn_remove_shell_counter")
  ) {
    return abilityId;
  }
  return undefined;
}

function targetCardTitleFromPayload(
  payload: Record<string, unknown>,
): string | undefined {
  const targetDefinitionId = stringValue(payload.targetCardDefinitionId);
  return targetDefinitionId
    ? DEMO_CARDS_BY_ID[targetDefinitionId]?.title
    : undefined;
}

function publicRevealTitleFromPayload(
  payload: Record<string, unknown>,
): string | undefined {
  return titleForDefinitionId(stringValue(payload.publicRevealDefinitionId));
}

function titleForDefinitionId(
  definitionId: string | undefined,
): string | undefined {
  return definitionId ? DEMO_CARDS_BY_ID[definitionId]?.title : undefined;
}

function definitionIdsFromCsv(value: string | undefined): string[] {
  return value
    ? value
        .split(",")
        .map((definitionId) => definitionId.trim())
        .filter(Boolean)
    : [];
}

function titlesForDefinitionIds(value: string | undefined): string[] {
  return definitionIdsFromCsv(value)
    .map((definitionId) => titleForDefinitionId(definitionId))
    .filter((title): title is string => Boolean(title));
}

function iceTitlesForDefinitionIds(value: string | undefined): string[] {
  return definitionIdsFromCsv(value)
    .map((definitionId) => DEMO_CARDS_BY_ID[definitionId])
    .flatMap((definition) =>
      definition?.type === "ice" ? [definition.title] : [],
    );
}

function runnerHardwareDeckReplacementSuffix(
  payload: Record<string, unknown>,
): string {
  if (payload.deckUniqueReplacement !== true) return "";
  const titles = titlesForDefinitionIds(
    stringValue(payload.trashedDeckDefinitionIds),
  );
  const target =
    titles.length > 0
      ? joinChronicleParts(titles)
      : "ein älteres Hardware-Deck";
  const verb = titles.length > 1 ? "wurden" : "wurde";
  return `; ${target} ${verb} getrasht, weil nur ein Hardware-Deck installiert sein darf`;
}

function runnerHardwareDeckReplacementChips(
  payload: Record<string, unknown>,
): string[] {
  if (payload.deckUniqueReplacement !== true) return [];
  const titles = titlesForDefinitionIds(
    stringValue(payload.trashedDeckDefinitionIds),
  );
  return [
    "Deck-Einzigartigkeit",
    "Trash",
    ...(titles.length > 0
      ? [`${titles.length} Deck${titles.length === 1 ? "" : "s"}`]
      : []),
  ];
}

function installBlockedReasonLabel(
  reason: string | undefined,
): string | undefined {
  if (reason === "insufficient_credits") return "nicht genug Credits";
  if (reason === "unique_already_installed")
    return "Unique bereits installiert";
  return undefined;
}

function mysteryBoxRevealedStackText(revealCount: number | undefined): string {
  if (revealCount === 1) return "Die oberste Stack-Karte wurde";
  if (revealCount && revealCount > 1)
    return `Die obersten ${revealCount} Stack-Karten wurden`;
  return "Die gezeigten Stack-Karten wurden";
}

function mysteryBoxTopChip(revealCount: number | undefined): string {
  return revealCount && revealCount > 0 ? `Top ${revealCount}` : "Top 5";
}

function abilityTextFromLabel(
  label: string | undefined,
  cardTitle: string | undefined,
): string {
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
    complete: "Abschluss",
  };
  return labels[phase] ?? phase;
}

function groupLabelFor(
  category: ChronicleCategory,
  actor: Side | undefined,
  label: string | undefined,
  serverLabel: string | undefined,
  turnNumber?: number,
  turnSide?: Side,
): string {
  if (category === "system") return "System";
  if (category === "run")
    return `Run${serverLabel ? ` auf ${serverLabel}` : label && /Run auf/i.test(label) ? ` auf ${runTargetFromLabel(label)}` : ""}`;
  if (category === "turn" && actor)
    return chronicleTurnGroupLabel(actor, turnNumber);
  if (turnSide) return chronicleTurnGroupLabel(turnSide, turnNumber);
  if (actor) return chronicleTurnGroupLabel(actor, undefined);
  return "Spiel";
}

export function chronicleTurnGroupLabel(
  side: Side,
  turnNumber: number | undefined | null,
): string {
  return turnNumber
    ? `Zug ${turnNumber} - ${side === "corp" ? "Korp" : "Runner"}`
    : `Zug - ${side === "corp" ? "Korp" : "Runner"}`;
}

export function chronicleRunGroupLabelFromEvent(
  event: PublicGameEvent,
): string | null {
  const actionType = stringValue(event.publicPayload.actionType) ?? event.type;
  const startsRun =
    actionType === "start_run" ||
    (actionType === "play_event" &&
      event.publicPayload.runnerEventRun === true) ||
    (actionType === "resolve_choice" &&
      (event.publicPayload.socialEngineeringRun === true ||
        payloadBooleanValue(event.publicPayload, "autoPassChosenIce") ===
          true));
  if (!startsRun) return null;
  const serverLabel = stringValue(event.publicPayload.serverLabel);
  const label = stringValue(event.publicPayload.label);
  const target =
    (serverLabel
      ? displayServerLabel(serverLabel)
      : runTargetFromLabel(label)) ?? "einen Server";
  return `Run auf ${target}`;
}

function turnLabel(
  side: Side | undefined,
  turnNumber: number | undefined,
): string | undefined {
  if (!side || !turnNumber) return undefined;
  return chronicleTurnGroupLabel(side, turnNumber);
}

function agendaPointSuffix(points: number | null | undefined): string {
  return typeof points === "number"
    ? ` und ${points} Agenda-Punkte erhalten`
    : "";
}

function agendaPointChips(points: number | null | undefined): string[] {
  return typeof points === "number" ? [`+${points} Agenda`] : [];
}

function stealCostPaymentSuffix(payload: Record<string, unknown>): string {
  const amount =
    positiveIntegerValue(payload.stealAdditionalCost) ??
    positiveIntegerValue(payload.stealCost);
  if (!amount) return "";
  const source = joinChronicleParts(stealCostSourceTitles(payload));
  return ` und ${creditText(amount)}${source ? ` wegen ${source}` : ""} bezahlt`;
}

function stealCostPaymentChips(payload: Record<string, unknown>): string[] {
  const amount =
    positiveIntegerValue(payload.stealAdditionalCost) ??
    positiveIntegerValue(payload.stealCost);
  if (!amount) return [];
  return [
    `${amount} ${creditLabel(amount)}`,
    ...stealCostSourceTitles(payload),
  ];
}

function stealCostSourceTitles(payload: Record<string, unknown>): string[] {
  return (
    stringValue(payload.stealCostSourceTitles)
      ?.split(",")
      .map((title) => title.trim())
      .filter(Boolean) ?? []
  );
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
    return (
      typeof candidate.effectId === "string" &&
      typeof candidate.kind === "string" &&
      typeof candidate.visibility === "string"
    );
  });
}

function counterLabel(counterType: unknown): string {
  if (counterType === "trace_tag_counter" || counterType === "data_raven")
    return "Data-Raven-Counter";
  if (counterType === "cerberus") return "Cerberus-Counter";
  if (counterType === "mastiff") return "Mastiff-Counter";
  if (counterType === "crying") return "Crying-Counter";
  if (
    counterType === "link_reduction_counter" ||
    counterType === "doppelganger_antibody"
  )
    return "Doppelganger-Counter";
  if (isPattelAccessCounterType(counterType)) return "Pattel-Counter";
  if (counterType === "cockroach") return "Cockroach-Counter";
  if (counterType === "cascade") return "Cascade-Counter";
  if (counterType === "highlighter") return "Highlighter-Counter";
  if (counterType === "garbage") return "Garbage-Counter";
  if (counterType === "scaldan") return "Scaldan-Counter";
  if (counterType === "tax") return "Tax-Counter";
  if (counterType === "vienna") return "Vienna-Counter";
  if (counterType === "pipe") return "Pipe-Counter";
  if (counterType === "spy") return "Spy-Counter";
  if (isSocketCounterType(counterType)) return "Socket-Counter";
  if (counterType === "recurring_credit") return "Recurring Credits";
  if (counterType === "bit") return "Bit";
  if (counterType === "shell") return "Shell-Counter";
  return counterType === "virus" ? "Virus-Counter" : "Counter";
}

function isSocketCounterType(counterType: unknown): boolean {
  return (
    counterType === "socket_archives" ||
    counterType === "socket_hq" ||
    counterType === "socket_rd"
  );
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function payloadNumberValue(
  payload: Record<string, unknown>,
  key: string,
): number | undefined {
  return (
    numberValue(payload[key]) ?? numberValueFromRecord(payload.amounts, key)
  );
}

function payloadBooleanValue(
  payload: Record<string, unknown>,
  key: string,
): boolean | undefined {
  const direct = payload[key];
  if (typeof direct === "boolean") return direct;
  const targets = payload.targets;
  if (!targets || typeof targets !== "object") return undefined;
  const nested = (targets as Record<string, unknown>)[key];
  return typeof nested === "boolean" ? nested : undefined;
}

function numberValueFromRecord(
  value: unknown,
  key: string,
): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  return numberValue((value as Record<string, unknown>)[key]);
}

function stringValueFromRecord(
  value: unknown,
  key: string,
): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  return stringValue((value as Record<string, unknown>)[key]);
}

function numberArrayValue(value: unknown): number[] {
  if (typeof value === "string")
    return value
      .split(",")
      .map((item) => Number(item.trim()))
      .filter((item) => Number.isFinite(item));
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is number => typeof item === "number" && Number.isFinite(item),
  );
}

function publicRevealTitleList(value: unknown): string[] {
  return (
    stringValue(value)
      ?.split("||")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

function positiveIntegerValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : undefined;
}

function sideValue(value: unknown): Side | undefined {
  return value === "corp" || value === "runner" ? value : undefined;
}

function sideLabel(side: Side | undefined): string {
  if (side === "corp") return "Korp";
  if (side === "runner") return "Runner";
  return "Eine Seite";
}
