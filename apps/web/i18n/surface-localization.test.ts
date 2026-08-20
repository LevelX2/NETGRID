import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import deMessages from "../messages/de.json";
import enMessages from "../messages/en.json";

const localizedSurfaces = [
  "../features/app-shell/AppShell.tsx",
  "../features/app-shell/ActiveMatchTopbar.tsx",
  "../features/app-shell/OptionsDialog.tsx",
  "../features/app-shell/ConfirmationDialog.tsx",
  "../features/app-shell/UndoPanel.tsx",
  "../features/settings/OptionsPanel.tsx",
  "../features/account/AccountPanel.tsx",
  "../features/account/AccountStatisticsPanel.tsx",
  "../features/account/AccountDeckLibraryHeader.tsx",
  "../features/games/PublicGamesPanel.tsx",
  "../features/recent/RecentGamesPanel.tsx",
  "../features/match-start/MatchResumePanel.tsx",
  "../features/match-start/MatchStartChoiceSections.tsx",
  "../features/match-start/StandardDeckCatalogStatus.tsx",
  "../features/match-start/MatchJoinConsole.tsx",
  "../features/match-start/MatchHostConsole.tsx",
  "../features/match-start/MatchStartAdvancedOptions.tsx",
  "../features/match-start/StartLobbyPanel.tsx",
  "../features/catalog/CatalogPanel.tsx",
  "../features/decks/DeckSelectionControls.tsx",
  "../features/decks/DeckAgendaStatusBadge.tsx",
  "../features/decks/DeckValidationSummary.tsx",
  "../features/decks/StandardDeckGuideDialog.tsx",
  "../features/decks/DeckBuilderCards.tsx",
  "../features/decks/DeckCardTooltipTrigger.tsx",
  "../features/decks/DeckTableBoard.tsx",
  "../features/decks/DeckEditorPanel.tsx",
] as const;

describe("localized app shell, settings, and account surfaces", () => {
  it("binds every migrated surface to typed translations", () => {
    for (const relativePath of localizedSurfaces) {
      const source = readFileSync(new URL(relativePath, import.meta.url), "utf8");
      expect(source, relativePath).toContain("useTranslations");
    }
  });

  it("provides distinct German and English surface messages", () => {
    expect(deMessages.AppShell.navigation.options).toBe("Optionen");
    expect(enMessages.AppShell.navigation.options).toBe("Options");
    expect(deMessages.Settings.aiPacing.fast).toBe("Schnell");
    expect(enMessages.Settings.aiPacing.fast).toBe("Fast");
    expect(deMessages.Account.panel.login).toBe("Anmelden");
    expect(enMessages.Account.panel.login).toBe("Sign in");
    expect(deMessages.Games.public.refresh).toBe("Aktualisieren");
    expect(enMessages.Games.public.refresh).toBe("Refresh");
    expect(deMessages.MatchStart.host.createMatch).toBe("Match erstellen");
    expect(enMessages.MatchStart.host.createMatch).toBe("Create match");
    expect(deMessages.Decks.editor.save).toBe("Speichern");
    expect(enMessages.Decks.editor.save).toBe("Save");
    expect(deMessages.Catalog.title).toBe("Katalog");
    expect(enMessages.Catalog.title).toBe("Catalog");
  });
});
