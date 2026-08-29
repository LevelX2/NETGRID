import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const selectionSource = readFileSync(
  new URL("./DeckSelectionControls.tsx", import.meta.url),
  "utf8",
);
const editorSource = readFileSync(
  new URL("./DeckEditorPanel.tsx", import.meta.url),
  "utf8",
);
const globalStyles = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8",
);
const pageSource = readFileSync(
  new URL("../../app/page.tsx", import.meta.url),
  "utf8",
);

describe("standard deck table navigation contract", () => {
  it("opens the exact selected standard deck from match setup", () => {
    expect(selectionSource).toContain(
      "onOpenStandardDeck(selectedStandardDeckId)",
    );
    expect(pageSource).toContain(
      "setStandardDeckTablePreviewId(standardDeckId)",
    );
    expect(pageSource).toContain('setEntryTab("decks")');
  });

  it("keeps standard deck composition read-only while preserving table arrangement", () => {
    expect(editorSource).toContain("standardPreviewDraft");
    expect(pageSource).toContain("tableLayout: draft.tableLayout");
    expect(editorSource).toContain("deckStandardPreviewHidden");
    expect(globalStyles).toContain(
      ".deckBuilderGridStandardPreview .deckTableSaveButton",
    );
    expect(globalStyles).toContain(
      ".deckBuilderGridStandardPreview .deckTableCardMenu",
    );
  });

  it("returns to setup without a copy and keeps the copied deck in the editor", () => {
    expect(pageSource).toContain("closeStandardDeckTablePreview");
    expect(pageSource).toContain("finishStandardDeckTablePreviewCopy");
    expect(editorSource).toContain("onCloseStandardDeckPreview?.()");
    expect(editorSource).toContain("onStandardDeckPreviewCopied?.()");
  });
});
