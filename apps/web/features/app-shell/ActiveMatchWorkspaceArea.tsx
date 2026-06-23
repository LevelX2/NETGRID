"use client";

import type { ComponentProps } from "react";

import { CatalogPanel } from "../catalog/CatalogPanel";
import { DeckEditorPanel } from "../decks/DeckEditorPanel";
import { RecentGamesPanel } from "../recent/RecentGamesPanel";
import { OptionsPanel } from "../settings/OptionsPanel";
import type { ActiveMatchWorkspace } from "./AppShell";

export function ActiveMatchWorkspaceArea({
  workspace,
  catalogPanelProps,
  deckEditorPanelProps,
  recentGamesPanelProps,
  optionsPanelProps
}: {
  workspace: ActiveMatchWorkspace;
  catalogPanelProps: ComponentProps<typeof CatalogPanel>;
  deckEditorPanelProps: ComponentProps<typeof DeckEditorPanel>;
  recentGamesPanelProps: ComponentProps<typeof RecentGamesPanel>;
  optionsPanelProps: ComponentProps<typeof OptionsPanel>;
}) {
  return (
    <div className={`activeMatchWorkspace ${workspace === "decks" ? "deckWorkspaceView" : ""}`} data-testid={`active-match-${workspace}`}>
      {workspace === "catalog" ? <CatalogPanel {...catalogPanelProps} /> : null}
      {workspace === "decks" ? <DeckEditorPanel {...deckEditorPanelProps} /> : null}
      {workspace === "recent" ? <RecentGamesPanel {...recentGamesPanelProps} /> : null}
      {workspace === "options" ? <OptionsPanel {...optionsPanelProps} /> : null}
    </div>
  );
}
