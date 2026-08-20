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
  });
});
