import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const panelSource = readFileSync(
  new URL("./DeckEditorPanel.tsx", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);

describe("standard deck copy UI contract", () => {
  it("keeps the copy entry visible for signed-in players while the catalog loads or fails", () => {
    expect(panelSource).toContain("{onCopyStandard ? (");
    expect(panelSource).not.toContain(
      "{onCopyStandard && standardDecks.length > 0 ? (",
    );
    expect(panelSource).toContain("disabled={standardDecks.length === 0}");
    expect(panelSource).toContain("Standard-Decks werden geladen");
    expect(panelSource).toContain(
      "Standard-Decks konnten nicht geladen werden.",
    );
    expect(panelSource).toContain("onClick={onReloadStandardDecks}");
  });

  it("exposes copying only to account deck libraries in both deck-editor render paths", () => {
    const normalizedPageSource = pageSource.replace(/\s+/g, " ");
    expect(normalizedPageSource).toContain(
      "...(accountSession.account ? { onCopyStandard: copyStandardToAccount } : {})",
    );
    expect(
      normalizedPageSource.match(
        /accountSession\.account \? \{ onCopyStandard: copyStandardToAccount \} : \{\}/g,
      ),
    ).toHaveLength(2);
    expect(normalizedPageSource.match(/onReloadStandardDecks/g)).toHaveLength(
      2,
    );
  });
});
