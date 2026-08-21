import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import process from "node:process";
import ts from "typescript";

const root = process.cwd();
const webRoot = resolve(root, "apps/web");
const de = JSON.parse(
  readFileSync(resolve(webRoot, "messages/de.json"), "utf8"),
);
const en = JSON.parse(
  readFileSync(resolve(webRoot, "messages/en.json"), "utf8"),
);
const fr = JSON.parse(
  readFileSync(resolve(webRoot, "messages/fr.json"), "utf8"),
);
const maintenanceCatalogs = Object.fromEntries(
  ["de", "en", "fr"].map((locale) => [
    locale,
    JSON.parse(
      readFileSync(
        resolve(webRoot, `messages/maintenance/${locale}.json`),
        "utf8",
      ),
    ),
  ]),
);
const catalogs = Object.fromEntries(
  Object.entries({ de, en, fr }).map(([locale, messages]) => [
    locale,
    {
      ...messages,
      Maintenance: {
        ...messages.Maintenance,
        ...maintenanceCatalogs[locale],
      },
    },
  ]),
);
const exceptionRegistry = JSON.parse(
  readFileSync(
    resolve(root, "docs/architecture/localization/i18n-exceptions.json"),
    "utf8",
  ),
);

const localizedSurfaces = [
  "features/app-shell/AppShell.tsx",
  "features/app-shell/ActiveMatchTopbar.tsx",
  "features/app-shell/OptionsDialog.tsx",
  "features/app-shell/ConfirmationDialog.tsx",
  "features/app-shell/UndoPanel.tsx",
  "features/settings/OptionsPanel.tsx",
  "features/account/AccountPanel.tsx",
  "features/account/AccountStatisticsPanel.tsx",
  "features/account/AccountDeckLibraryHeader.tsx",
  "features/games/PublicGamesPanel.tsx",
  "features/recent/RecentGamesPanel.tsx",
  "features/match-start/MatchResumePanel.tsx",
  "features/match-start/MatchStartChoiceSections.tsx",
  "features/match-start/StandardDeckCatalogStatus.tsx",
  "features/match-start/MatchJoinConsole.tsx",
  "features/match-start/MatchHostConsole.tsx",
  "features/match-start/MatchStartAdvancedOptions.tsx",
  "features/match-start/StartLobbyPanel.tsx",
  "features/catalog/CatalogPanel.tsx",
  "features/decks/DeckSelectionControls.tsx",
  "features/decks/DeckAgendaStatusBadge.tsx",
  "features/decks/DeckValidationSummary.tsx",
  "features/decks/StandardDeckGuideDialog.tsx",
  "features/decks/DeckBuilderCards.tsx",
  "features/decks/DeckCardTooltipTrigger.tsx",
  "features/decks/DeckTableBoard.tsx",
  "features/decks/DeckEditorPanel.tsx",
  "features/game-board/ActiveRunnerZoneBoard.tsx",
  "features/game-board/ActiveServerGrid.tsx",
  "features/game-board/ArchivesDualStackLane.tsx",
  "features/game-board/CounterStrips.tsx",
  "features/game-board/PlayerClock.tsx",
  "features/game-board/ResourceStrip.tsx",
  "features/game-board/RunnerBoardStrips.tsx",
  "features/game-board/RunnerHostedCardCluster.tsx",
  "features/game-board/RunTimelineOverlay.tsx",
  "features/game-board/ScoredAgendaOverlay.tsx",
  "features/game-board/SideStatusPanels.tsx",
  "features/game-board/SpecialZonesStrip.tsx",
  "features/game-board/ZoneFrame.tsx",
  "features/actions/AccessReviewModals.tsx",
  "features/actions/ActionControls.tsx",
  "features/actions/CardChoicePanel.tsx",
  "features/actions/ChoicePanels.tsx",
  "features/actions/DamageImpactOverlay.tsx",
  "features/actions/FloatingActionPanelOverlay.tsx",
  "features/actions/LegalActionsPanel.tsx",
  "features/actions/OpponentActionOverlay.tsx",
  "features/actions/SecurityPurgeChoicePanel.tsx",
  "features/actions/SuccessfulRunOutcomeModal.tsx",
  "features/results/GameOverModal.tsx",
  "features/chronicle/ChroniclePanel.tsx",
  "features/chronicle/ChronicleEntry.tsx",
  "features/chronicle/ChronicleCardTrigger.tsx",
  "features/replay/ReplayBoard.tsx",
  "app/replays/page.tsx",
  "features/cards/CardPreviewPanel.tsx",
  "features/cards/CardTextPreview.tsx",
  "features/cards/CardView.tsx",
  "features/cards/CardBadges.tsx",
  "app/maintenance-auth-ui.tsx",
  "app/maintenance/page.tsx",
  "app/maintenance/card-images/page.tsx",
  "app/maintenance/ai-traces/page.tsx",
];

const allowedVisibleLiterals = new Set([
  "Server",
  "HTTP-Status",
  "Originalset",
  "Classic",
  "Proteus",
  "Easy",
  "Normal",
  "Hard",
  "Runner",
  "Account",
  "↗ Runner",
  "V",
  "vs",
  "Match",
  "Token",
  "Countdown",
  "Seed",
  "Set",
  "Status",
  "engine",
  "x",
  "Import",
  "Export",
  '{"schemaVersion":"editable-deck-v0.6","deck":...}',
  "MU",
  "ICE",
  "MP ·",
  "Agenda",
  "corepack pnpm maintenance:auth bootstrap --password-stdin",
  "data/local-assets/card-image-packs/build",
]);

const failures = [];
if (
  exceptionRegistry.schemaVersion !== "netgrid-i18n-exceptions-v1" ||
  !Array.isArray(exceptionRegistry.exceptions) ||
  exceptionRegistry.exceptions.some(
    (entry) =>
      typeof entry?.scope !== "string" ||
      entry.scope.trim() === "" ||
      typeof entry?.reason !== "string" ||
      entry.reason.trim() === "",
  )
) {
  failures.push("The localization exception registry is invalid.");
}
const leavesByLocale = Object.fromEntries(
  Object.entries(catalogs).map(([locale, messages]) => [
    locale,
    leafMessages(messages),
  ]),
);
const referenceKeys = [...leavesByLocale.de.keys()].sort();

for (const [locale, leaves] of Object.entries(leavesByLocale)) {
  const keys = [...leaves.keys()].sort();
  if (JSON.stringify(referenceKeys) !== JSON.stringify(keys)) {
    failures.push(`German and ${locale} message leaf keys differ.`);
  }
  for (const key of referenceKeys) {
    const referenceMessage = leavesByLocale.de.get(key);
    const message = leaves.get(key);
    if (typeof referenceMessage !== "string" || typeof message !== "string")
      continue;
    if (message.trim().length === 0)
      failures.push(`${key}: ${locale} message is empty.`);
    const referenceParameters = [...icuParameters(referenceMessage)].sort();
    const parameters = [...icuParameters(message)].sort();
    if (JSON.stringify(referenceParameters) !== JSON.stringify(parameters)) {
      failures.push(
        `${key}: ${locale} ICU parameters differ (${referenceParameters.join(", ")} vs ${parameters.join(", ")}).`,
      );
    }
  }
}

for (const relativePath of localizedSurfaces) {
  const absolutePath = resolve(webRoot, relativePath);
  const source = readFileSync(absolutePath, "utf8");
  if (!source.includes("useTranslations")) {
    failures.push(`${relativePath}: missing useTranslations binding.`);
  }
  const sourceFile = ts.createSourceFile(
    absolutePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  visitVisibleJsx(sourceFile, relativePath);
}

const pageSource = readFileSync(resolve(webRoot, "app/page.tsx"), "utf8");
const pageFile = ts.createSourceFile(
  "app/page.tsx",
  pageSource,
  ts.ScriptTarget.Latest,
  true,
  ts.ScriptKind.TSX,
);
visitPagePresentationCalls(pageFile);
if (/serverErrorNotice\(/u.test(pageSource)) {
  failures.push("app/page.tsx: raw server error presentation remains active.");
}
if (
  /currentStep\.(?:label|learningHint)/u.test(
    readFileSync(resolve(webRoot, "app/replays/page.tsx"), "utf8"),
  )
) {
  failures.push(
    "app/replays/page.tsx: stored replay prose is used as presentation authority.",
  );
}

if (failures.length > 0) {
  process.stderr.write(`I18N gate failed:\n- ${failures.join("\n- ")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `I18N gate passed: ${referenceKeys.length} aligned messages across ${Object.keys(catalogs).length} locales, ${localizedSurfaces.length} localized surfaces.\n`,
  );
}

function leafMessages(value, prefix = "", target = new Map()) {
  if (typeof value === "string") {
    target.set(prefix, value);
    return target;
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    failures.push(`${prefix || "<root>"}: message leaf must be a string.`);
    return target;
  }
  for (const [key, child] of Object.entries(value)) {
    leafMessages(child, prefix ? `${prefix}.${key}` : key, target);
  }
  return target;
}

function icuParameters(message) {
  const parameters = new Set();
  for (const match of message.matchAll(
    /\{([A-Za-z][A-Za-z0-9_]*)\s*(?:,|\})/gu,
  )) {
    const prefix = message.slice(Math.max(0, match.index - 12), match.index);
    if (/(?:^|[\s{])(?:one|other|zero|two|few|many|=\d+)\s*$/u.test(prefix))
      continue;
    parameters.add(match[1]);
  }
  return parameters;
}

function visitPagePresentationCalls(sourceFile) {
  const visit = (node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "setNotice" &&
      node.arguments.length > 0
    ) {
      const value = node.arguments[0];
      if (
        (ts.isStringLiteral(value) ||
          ts.isNoSubstitutionTemplateLiteral(value)) &&
        value.text.trim() !== ""
      ) {
        const position = sourceFile.getLineAndCharacterOfPosition(
          value.getStart(),
        );
        failures.push(
          `app/page.tsx:${position.line + 1}: setNotice receives an unclassified literal.`,
        );
      }
      if (ts.isTemplateExpression(value)) {
        const position = sourceFile.getLineAndCharacterOfPosition(
          value.getStart(),
        );
        failures.push(
          `app/page.tsx:${position.line + 1}: setNotice receives an unclassified template literal.`,
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

function visitVisibleJsx(sourceFile, relativePath) {
  const visit = (node) => {
    if (ts.isJsxText(node)) classify(node.text, relativePath, node);
    if (
      ts.isJsxAttribute(node) &&
      node.initializer &&
      ts.isStringLiteral(node.initializer) &&
      ["aria-label", "title", "placeholder", "alt"].includes(
        node.name.getText(sourceFile),
      )
    ) {
      classify(node.initializer.text, relativePath, node);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
}

function classify(rawText, relativePath, node) {
  const text = rawText.replace(/\s+/gu, " ").trim();
  if (!text || !/[\p{L}]/u.test(text) || allowedVisibleLiterals.has(text))
    return;
  const position = node
    .getSourceFile()
    .getLineAndCharacterOfPosition(node.getStart());
  failures.push(
    `${relativePath}:${position.line + 1}: unclassified visible literal ${JSON.stringify(text)}.`,
  );
}
