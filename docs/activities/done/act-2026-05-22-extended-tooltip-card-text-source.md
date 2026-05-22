---
activityId: act-2026-05-22-extended-tooltip-card-text-source
status: done
kind: fix
area: web
priority: high
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt: 2026-05-22
completedAt: 2026-05-22
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/page.tsx
  - apps/web/app/card-text-source.ts
  - apps/web/app/card-text-source.test.ts
checks:
  - "corepack pnpm --filter @netgrid/web exec vitest run app/card-text-source.test.ts"
  - "corepack pnpm --filter @netgrid/web typecheck"
  - "git diff --check"
---

# Erweiterter Tooltip zeigt falsche Kartentexte

## Ziel

Der erweiterte Karten-Tooltip soll immer den zur angezeigten Karte passenden Kartentext aus der korrekten Quelle rendern und keine Texte anderer Karten oder ähnlicher IDs anzeigen.

## Kontext und Quellen

- Nutzerfund vom 2026-05-22: In einem erweiterten Tooltip wird ein unpassender Text wie `ISA Contract` angezeigt; vermutlich ist `ESA Contract` gemeint.
- Der Nutzer ordnet den Fehler ausdrücklich dem erweiterten Tooltip zu, nicht der Karte `Arbeiter zur Turm`.
- Relevante Wissensbasis: `docs/architecture/card-rules/card-rule-text-formatting-spec.md` beschreibt den Zielzustand, dass Katalog, Board, Preview und Tooltip denselben normalisierten Kartentext verwenden.
- Vorarbeit: `docs/architecture/card-images/card-image-performance-stage-1-implementation-review.md` erwähnt Bild-Tooltips und Tooltip-Pfade.

## Scope

- Datenquelle und Mapping des erweiterten Tooltips prüfen.
- Prüfen, ob der Tooltip nach Karten-ID, Instanz-ID, Slug, Name oder Fallback-Index falsch aufgelöst wird.
- Mindestens den gemeldeten Contract-Fall reproduzieren und korrigieren.
- Prüfen, ob Katalog, Boardkarte, kompakte Vorschau und erweiterter Tooltip denselben sichtbaren Kartentext zeigen.
- Eine fokussierte Regression ergänzen, die eine Karte mit ähnlich benannter oder generisch verwalteter Textquelle gegen falsche Tooltip-Zuordnung schützt.

## Nicht im Scope

- Kein neues Kartentext-Normalisierungsmodell.
- Keine Änderung an Rules-Engine-Karteneffekten.
- Keine Korrektur einzelner Kartendaten ohne Nachweis, dass die Daten selbst falsch sind.
- Keine offiziellen Fremdassets oder externen Kartendatenbank-Abhängigkeiten.

## Akzeptanzkriterien

- [x] Der gemeldete Tooltip-Fall zeigt den korrekten Kartentext zur Karte.
- [x] Tooltip, Boardkarte und Katalog verwenden für denselben Karten-Datensatz keinen widersprüchlichen Langtext.
- [x] Ähnliche Karten-/Contract-Namen werden nicht durch unscharfes Matching vertauscht.
- [x] Hidden-Info bleibt geschützt: verdeckte Karten erhalten keine erweiterten fremden Tooltipdaten.
- [x] Fokussierte Web- oder Helper-Tests decken die Zuordnung ab.
- [x] Checks: passende Web-Tests, `corepack pnpm --filter @netgrid/web typecheck`, `git diff --check`.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte sind Tooltip-/Preview-Rendering in `apps/web/app/page.tsx`, Kartendaten-Lookups im Webclient und gemeinsame Card-Display-Helfer.
- Wenn der Fehler aus einer Dateninkonsistenz kommt, die betroffene Karten-ID und Datenquelle im Ergebnis festhalten.

## Ergebnisnotiz

Der Board-/Tooltip-Enrichment-Pfad bevorzugt für bekannte Karten jetzt den geladenen Katalogtext und nutzt die PlayerView-Projektion nur noch als Fallback, wenn kein Katalogdetail geladen ist. Damit zeigt `ESA Contract` im erweiterten Tooltip denselben Text wie der Katalog (`A: Draw two cards.`) statt eines generischen Implementierungstexts. Es gibt kein unscharfes Matching; die Auswahl bleibt ID-basiert über `definitionId`. Verdeckte Karten laufen weiterhin nicht durch diesen Enrichment-Pfad.
