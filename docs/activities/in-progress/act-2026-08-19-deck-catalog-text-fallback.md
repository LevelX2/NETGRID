---
activityId: act-2026-08-19-deck-catalog-text-fallback
status: in-progress
kind: implementation
area: web-ui
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-19
startedAt: 2026-08-19
completedAt:
branch: codex/deck-catalog-text-fallback
releaseTarget: local-main
blockedBy: []
resultArtifacts: []
checks: []
---

# Deck-, Decktisch- und Katalog-Textfallback-Prozess

Status: in Arbeit

## Quelle/Vorgabe

Nutzerfeedback vom 2026-08-19: Textkarten und tatsächliche
Kartenbild-Fallbacks müssen nicht nur auf dem Spielbrett, sondern ebenso im
Deck-Editor, im Decktisch und im Katalog hochwertig funktionieren. Fehlende
Bilder dürfen keine leeren Karten oder leeren Bibliotheksflächen erzeugen.

## Zielprüfung

Endzustand, betroffene Komponenten, Reihenfolge und Sicherheitsgrenzen sind
bestimmbar. „TIFF-Editor“ wird im Gesprächskontext als Decktisch-/Tisch-Editor
verstanden. Der vorhandene Spielbrettvertrag für Typfarben und Bildfehler ist
die gestalterische Referenz.

## Gesamtziel

Alle sichtbaren Editor- und Katalogflächen bevorzugen vorhandene lokale
Kartenbilder. Ist keine Bildquelle bekannt oder scheitern alle Bildvarianten
tatsächlich, zeigt die jeweilige Fläche eine passende typfarbige Textkarte mit
Titel, Typ, Werten und einem dem verfügbaren Platz angemessenen Regeltext.
Tooltips fallen bei Bildfehlern auf die vollständige Text-Schnellansicht
zurück.

## Annahmen

- Die normale Deckbibliothek behält ihre Bild-plus-Text-Aufteilung; nur der
  Bildbereich erhält einen aussagekräftigen Textfallback.
- Decktischkarten behalten das Kartenformat und zeigen im Fallback Titel,
  Typ/Werte sowie so viel Regeltext wie lesbar hineinpasst.
- Die schmale Decktischbibliothek zeigt eine kompakte Textkarte statt eines
  Anfangsbuchstabens; Name und Typ dürfen im Fallback sichtbar werden.
- Die Katalogdetailansicht behält den vollständigen Regeltext unterhalb der
  Vorschau; die Vorschau selbst wird bei Bildfehler zur großen Textkarte.

## Nicht-Ziele

- Keine Änderung an Engine, Kartenregeln, Katalogdaten, Bildimport oder
  Asset-/Rechts-Gates.
- Kein allgemeines Redesign von Deckverwaltung oder Katalogfilterung.
- Keine Offenlegung verdeckter Matchdaten; Editor und Katalog arbeiten nur
  mit öffentlichen Katalogkarten.

## Controller-Invarianten

- Kartenbilder bleiben rein lokale Darstellung und verändern keinen
  Match-/Deck-State.
- Der Bildfehler wird am gemeinsamen Bildconsumer erkannt und nicht durch
  einen erfundenen Bildwert verborgen.
- Regeltext und Werte stammen aus den vorhandenen Katalogdetails.
- Bildmodus und Textfallback verwenden dieselbe Typfarbsemantik wie die
  Spielbrett-Textkarten: insbesondere ICE cyanblau, Agenda blau und Upgrade
  silbrig-grau.

## Automatische Fehlerbehandlung

Nach Fehler der primären und optionalen Fallback-Bildvariante meldet
`CardImage` den terminalen Assetfehler. Der jeweilige Consumer blendet das
defekte Bild aus und rendert Text. Ein fehlendes noch nicht geladenes
Katalogdetail zeigt einen klaren Ladezustand statt erfundener Regeln.

## Sicherheitsblocker

Ein Fallback darf keine Identität einer verdeckten Matchkarte ableiten. Dieser
Prozess betrifft ausschließlich Deck- und Katalogkarten mit bereits
öffentlicher Identität.

## State Machine

`bekannte Editor-/Katalogkarte` → `Bildquelle vorhanden?` →
`nein: Textfallback` | `ja: Bild laden` →
`erfolgreich: Bild` | `alle Varianten fehlgeschlagen: Textfallback`.

`Katalogdetail fehlt` → `Ladezustand`; nach Detailantwort wird Bild oder Text
deterministisch dargestellt.

## Paketfolge und Paketdetails

### DCT-01: Gemeinsame Textthumbnail- und Assetfehlerbasis

Status: abgeschlossen

Ziel: `DeckCardThumb` erkennt den terminalen Bildfehler und besitzt eine
wiederverwendbare Textdarstellung mit Typ, Werten, Regeln und Typfarbe.

Eingang: vorhandener `CardImage.onUnavailable`-Vertrag und Katalogdetails.

Arbeit/Kernartefakte: `DeckCardThumb`, kleine Darstellungshelfer, CSS und
fokussierte Tests.

Done-Gate: Quelle fehlt und Quelle schlägt fehl führen beide zur Textkarte;
erfolgreiche Bilder bleiben unverändert.

Commit: `feat(web): add reusable deck text thumbnails`

Ergebnis: `CardTextPreview` stellt Titel, Typ, Werte und formatierten
Regeltext in drei Dichten mit denselben Typfarben wie die Spielbrettkarte
bereit. `DeckCardThumb` wechselt sowohl ohne Quelle als auch nach dem
terminalen `CardImage.onUnavailable`-Signal auf diese Textoberfläche.

Checks: `vitest run features/cards/CardTextPreview.test.tsx
app/deck-card-text-fallback.test.ts` (3 Tests grün), `git diff --check`.

### DCT-02: Deck-Editor und Decktisch

Status: abgeschlossen

Ziel: Normale Deckbibliothek, Deckliste, Preview, Decktischkarten und
Decktischbibliothek zeigen jeweils eine platzgerechte Textdarstellung.

Eingang: DCT-01 abgeschlossen.

Arbeit/Kernartefakte: `DeckBuilderCards`, `DeckTableBoard`,
`DeckCardTooltipTrigger`, CSS und Tests.

Done-Gate: Keine Editorfläche bleibt ohne Bild nur leer oder bei einem
Anfangsbuchstaben; der Decktisch zeigt direkt Regelhinweise und vollständige
Regeln bleiben im Tooltip erreichbar.

Commit: `feat(web): add text fallbacks to deck table`

Ergebnis: Alle Thumbnail-Consumer erhalten gemeinsame Typ- und Wertezeilen.
Die schmale Decktischbibliothek nutzt eine detailreiche Textdichte ohne ihre
Kartenbreite zu verändern, Decktischkarten zeigen Regelhinweise direkt. Lange
Texte werden per Größenmessung bis zu einer definierten Lesbarkeitsgrenze
verkleinert statt über eine feste Zeilenzahl abgeschnitten. Bild-Tooltips
wechseln nach terminalem Ladefehler in den erweiterten, typfarbigen
Texttooltip.

Checks: `vitest run app/deck-card-text-fallback.test.ts
features/cards/CardTextPreview.test.tsx
features/decks/deck-card-text-lines.test.ts
features/decks/deck-table-model.test.ts` (14 Tests grün), `git diff --check`.
Der Web-Typecheck erreicht ausschließlich zwei bereits im Ausgangsstand
vorhandene unabhängige Fehler in `packages/ai/...selected-choices...` und
`app/ai-turn-plan-comparison-ui.test.ts`; die geänderten Webdateien erzeugen
keinen zusätzlichen TypeScript-Befund.

### DCT-03: Katalogvorschau und Katalog-Tooltip

Ziel: Die Katalogdetailvorschau wechselt bei fehlendem Bild auf eine große,
typfarbige Textkarte und behält die bestehenden vollständigen Detaildaten.

Eingang: DCT-01 abgeschlossen.

Arbeit/Kernartefakte: `CatalogPanel`, gemeinsame Textdarstellung, CSS und
Tests.

Done-Gate: Bild-404 und fehlende Quelle sind visuell gleichwertig nutzbar;
Katalogtitel, Werte und kompletter Regeltext bleiben sichtbar.

Commit: `feat(web): add catalog text card fallback`

### DCT-04: Integrationsgate und Abschluss

Ziel: Fokussierte Webtests, relevante Typprüfung, Main-Abgleich, lokaler Merge
und vollständiger Worktree-/Branch-Cleanup.

Done-Gate: Arbeitsbranch sauber; fokussierte Tests grün; neue Typecheckfehler
ausgeschlossen; Commit in `main`; Worktreepfad, Git-Registrierung und Branch
entfernt.

## Verifikationsregeln

- Pro Paket die engsten neuen/angrenzenden Vitest-Dateien.
- Nach gemeinsamen Typoberflächen Web-Typecheck; unabhängige Baselinefehler
  separat ausweisen.
- Vor jedem Commit und nach Main-Merge `git diff --check`.
- Kein Start auf Standardports aus dem Worktree.

## Worktree-, Git- und Integrationsregeln

Arbeitsworktree: `C:\Projekte\NETGRID_DECK_CATALOG_TEXT_FALLBACK`

Arbeitsbranch: `codex/deck-catalog-text-fallback`

Der Hauptworkspace wird nur für den finalen Merge verwendet. Seine fremden
offenen Änderungen werden weder gestagt noch verändert. Push und Pull Request
sind nicht im Scope.

## Controller-Prompt-Kern

`/Goal Arbeite den Deck-, Decktisch- und Katalog-Textfallback-Prozess
vollständig und sequenziell von DCT-01 bis DCT-04 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md,
apps/web/AGENTS.md, die Wissensbasis und diese Activity. Arbeite ausschließlich
im Worktree C:\Projekte\NETGRID_DECK_CATALOG_TEXT_FALLBACK auf Branch
codex/deck-catalog-text-fallback. Nutze den Hauptworkspace nur für den finalen
Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und
committe jedes abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe mit
Blocker-Report und Removal Condition. Nach Abschluss final verifizieren,
lokal nach main mergen, main prüfen, den sauberen Worktree entfernen, die
Entfernung in Git und Dateisystem verifizieren, den gemergten Branch löschen
und Goal erst dann als complete markieren.`

## Abschlusskriterien

- DCT-01 bis DCT-04 erfüllen ihre Done-Gates.
- Bild- und Textdarstellung sind in Deck-Editor, Decktisch und Katalog
  konsistent und typfarbig.
- Das temporäre Prozessartefakt wird nach Ergebnisrückführung gemäß
  Current-State-Retention entfernt.
