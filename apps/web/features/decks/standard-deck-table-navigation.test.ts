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
const builderCardsSource = readFileSync(
  new URL("./DeckBuilderCards.tsx", import.meta.url),
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
    expect(editorSource).toContain("readOnly={standardPreviewActive}");
    expect(editorSource).not.toContain("deckStandardPreviewHidden");
    expect(globalStyles).not.toContain(
      ".deckBuilderGridTableMode.deckBuilderGridStandardPreview",
    );
    expect(builderCardsSource).toContain("draggable={!readOnly}");
    expect(builderCardsSource).toContain("if (readOnly) return;");
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

  it("opens a selected personal deck directly in editable table mode", () => {
    expect(selectionSource).toContain(
      "onOpenLocalDeck(selectedPersonalDeckId)",
    );
    expect(selectionSource).toContain('t("editOnTable")');
    expect(pageSource).toContain("openLocalDeckOnTable");
    expect(pageSource).toContain("setSelectedLocalDeckId(deckId)");
    expect(pageSource).toContain("setLocalDeckTableEditId(deckId)");
    expect(editorSource).toContain("onLocalDeckTableOpened?.()");
    expect(editorSource).toContain(
      "personalSelectedDeck?.deckId !== openLocalDeckOnTableId",
    );
    expect(editorSource).toContain('setDeckEditorMode("table")');
  });
});
