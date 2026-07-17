---
activityId: act-2026-07-17-own-deck-name-active-match-visibility
status: inbox
kind: fix
area: ui
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Eigenen Decknamen während der Partie sichtbar machen

## Ziel

Spielende sollen während einer laufenden Partie schnell und eindeutig nachsehen können, wie ihr eigenes aktuell verwendetes Deck heißt. Die Information soll insbesondere in Partien gegen die KI ohne Kenntnis eines eingeklappten Diagnosebereichs auffindbar sein.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-17: Während einer Partie gegen die KI ist der Name des eigenen Decks nicht auffindbar, obwohl Angaben zum KI- beziehungsweise gegnerischen Deck sichtbar sind.
- `apps/web/app/page.tsx` rendert `activeView.deckMetadata.own.deckName` bereits im Match-Statusstreifen. Dieser Streifen hängt jedoch an `matchDetailsOpen`, startet eingeklappt und wird über einen Icon-Button in `ActiveMatchTopbar` geöffnet.
- Der bestehende `PlayerView` liefert den eigenen Decknamen damit bereits side-sicher; für den Fund ist voraussichtlich keine neue Server- oder Engine-Projektion nötig.

## Scope

- Den Namen des eigenen aktuell verwendeten Decks in der aktiven Spielansicht an einer gut auffindbaren Stelle anzeigen oder über eine klar beschriftete, unmittelbar verständliche Detailansicht erreichbar machen.
- Die Anzeige für Partien gegen die KI und gegen Menschen sowie für beide Spielseiten konsistent halten.
- Bei langen Decknamen eine responsive Darstellung mit weiterhin zugänglichem vollständigem Namen vorsehen, etwa über sinnvolle Kürzung plus Tooltip oder eine umbrechende Detaildarstellung.
- Die Bezeichnung so formulieren, dass der eigene Deckname nicht mit dem gegnerischen Deck verwechselt werden kann, beispielsweise `Dein Deck` oder `Eigenes Deck` statt eines kontextlosen `Deck`.
- Fokussierten Regression-Schutz für Sichtbarkeit, korrekte Zuordnung zum eigenen Deck und einen langen Decknamen ergänzen.

## Nicht im Scope

- Kein Redesign der gesamten Topbar, des Spielbretts oder der Match-Details.
- Keine Änderung an Deckauswahl, Deckeditor, KI-Deckauswahl oder Matchstart.
- Keine Anzeige oder Offenlegung gegnerischer Decklisten, Deck-Hashes oder anderer bislang nicht sichtbarer Deckmetadaten.
- Keine Änderung an Rules Engine, KI-Entscheidungen, LegalActions, `applyAction`, Replay oder StateHash.
- Keine neue serverseitige Deckmetadatenquelle, solange der vorhandene `activeView.deckMetadata.own.deckName` den Fall vollständig abdeckt.

## Akzeptanzkriterien

- [ ] In einer laufenden Partie kann der Mensch den Namen seines eigenen Decks ohne Kenntnis eines unbeschrifteten oder diagnostischen Icon-Toggles schnell auffinden.
- [ ] Die Anzeige verwendet `activeView.deckMetadata.own.deckName` und zeigt für Runner und Korp jeweils das tatsächlich eigene Matchdeck, nicht das gegnerische oder nur das zuletzt im Deckeditor ausgewählte Deck.
- [ ] Der eigene Deckname ist in Partien gegen die KI und gegen Menschen konsistent erreichbar.
- [ ] Die Beschriftung unterscheidet den eigenen Decknamen eindeutig von Angaben zum Gegenüber beziehungsweise gegnerischen Deck.
- [ ] Lange Decknamen bleiben auf typischen Desktop- und schmalen Ansichten nutzbar, ohne zentrale Matchaktionen aus der Topbar zu verdrängen; der vollständige Name bleibt zugänglich.
- [ ] Fehlen `deckMetadata`, bleibt die Spielansicht stabil und zeigt keinen irreführenden Platzhalter als echten Decknamen.
- [ ] Es werden keine zusätzlichen gegnerischen Deckinformationen oder verdeckten Kartendaten offengelegt.
- [ ] Fokussierte Webtests sowie `git diff --check` sind grün oder ein bereits bestehender, paketfremder Fehler ist klar benannt.

## Umsetzungshinweise

- Wahrscheinliche Stellen:
  - `apps/web/app/page.tsx`
  - `apps/web/features/app-shell/ActiveMatchTopbar.tsx`
  - zugehörige Topbar-, Match-View- oder Page-Tests
  - bei Bedarf eng begrenztes Styling in `apps/web/app/globals.css`
- Der bestehende Match-Statusstreifen kann als Detailquelle erhalten bleiben. Entscheidend ist, dass der eigene Deckname oder ein eindeutig beschrifteter Zugang dazu im normalen Spielablauf auffindbar wird.
- Keine Ableitung aus lokalem React-Auswahlzustand verwenden: Maßgeblich ist das immutable Matchdeck aus dem aktiven `PlayerView`.
- Falls die fokussierte Umsetzung wider Erwarten einen Modus ohne `deckMetadata.own.deckName` nachweist, den konkreten Projektionsrest als separates kleines Folgepaket dokumentieren, statt die Anzeige mit lokalem Deckzustand zu raten.

## Ergebnisnotiz

Noch offen.
