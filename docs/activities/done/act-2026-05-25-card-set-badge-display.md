---
activityId: act-2026-05-25-card-set-badge-display
status: done
kind: concept
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-25
startedAt: 2026-05-25
completedAt: 2026-05-25
branch:
releaseTarget: card display UX
blockedBy: []
resultArtifacts:
  - apps/web/app/catalog-ui.ts
  - apps/web/app/catalog-ui.test.ts
  - apps/web/app/page.tsx
  - apps/web/app/globals.css
checks:
  - corepack pnpm --filter @netgrid/web test -- catalog-ui.test.ts
  - corepack pnpm --filter @netgrid/web test -- card-text-source.test.ts
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Set-Erkennung auf bekannten Karten dezent anzeigen

## Ziel

Bekannte Karten sollen im Spiel und in kartenbezogenen Detailflächen erkennen lassen, aus welchem Set sie stammen, ohne die Kartenoberfläche zu überladen oder neue Regel-/Engine-Abhängigkeiten einzuführen.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-25: Im Spiel soll erkennbar sein, aus welchem Set eine Karte stammt; die Lösung soll wenig Overhead haben und die Oberfläche nicht verschmutzen.
- Aktive Kartendaten sind bereits setbasiert organisiert: `data/cards/*-cards.json` enthält `setId`, `setName` und `collectorNumber`.
- Der Katalogtyp enthält diese Metadaten bereits: `packages/catalog/src/catalog-types.ts` (`CatalogCard.setId`, `setName`, `collectorNumber`).
- Der Webclient nutzt Set-Labels bereits im Katalog-/Deckbuilder-Kontext, u. a. über `apps/web/app/catalog-ui.ts`.
- Die aktive Spieloberfläche hat mit V1.0.6 bewusst kompakte Kartenanzeige-Modi, Tooltips und eine platzsparende Preview vorgesehen.

## Scope

- Für bekannte Karten eine dezente Setmarke einführen, z. B. ein kleines Badge mit Kurzcode wie `OV1`, `PRO`, `CLS` oder `TEST`.
- Die ausführliche Setinformation nur in sekundären Detailflächen anzeigen, z. B. Tooltip und Vorschau: `Proteus #P001` oder `Original Version 1 #219`.
- Bestehende Katalogdaten wiederverwenden; keine parallele UI-only Setliste aufbauen, außer ein kleiner zentraler Label-/Kurzcode-Helper ist nötig.
- Boardkarten, Preview und erweiterte Karten-Tooltips prüfen und konsistent behandeln.
- Deckbuilder/Katalog nicht verschlechtern; vorhandene Setfilter und Setlabels sollen weiter funktionieren.
- Fokussierte Web-Regression ergänzen, die Set-Badge-/Tooltip-Mapping für mindestens Originalset und Proteus absichert.

## Nicht im Scope

- Keine offiziellen Set-Icons, offiziellen Frames, Logos, Card Backs oder externen Kartendatenbank-Abhängigkeiten.
- Keine Änderung an Kartendaten, Set-IDs oder Collector-Nummern, außer ein offensichtlicher bereits bestehender Datenfehler wird separat dokumentiert.
- Keine Engine-, LegalAction-, Replay-, StateHash-, Server- oder KI-Vertragsänderung.
- Keine Setinformation für verdeckte oder unbekannte Karten.
- Kein Redesign der Kartenoberfläche und keine große neue Einstellungsfläche.
- Keine Deckbau- oder Formatregel aus der Setanzeige ableiten.

## Akzeptanzkriterien

- [x] Bekannte Karten zeigen eine kleine, unaufdringliche Setmarke, die wichtige Kartenwerte, Action-Marker, Counter-Badges und Statusmarker nicht verdeckt.
- [x] Tooltip oder Vorschau zeigt die vollständige Setinformation inklusive Collector-Nummer, wenn diese aus dem Katalog verfügbar ist.
- [x] Verdeckte Karten zeigen keine Setmarke, kein Setlabel und keine setabhängige CSS-/DOM-Information.
- [x] Originalset-, Proteus-, Classic- und Testset-Karten werden verständlich und stabil gemappt.
- [x] Bestehende Setfilter im Katalog/Deckbuilder bleiben unverändert funktionsfähig.
- [x] Hidden-Info-, LegalAction-, Replay- und StateHash-Grenzen bleiben unverändert.
- [x] Fokussierte Web-Tests oder ein dokumentierter Browser-Smoke decken mindestens Board-/Preview-/Tooltip-Darstellung ab.
- [x] Checks: passende Web-Tests, Typecheck, `git diff --check`.

## Umsetzungshinweise

- Wahrscheinliche Startpunkte:
  - `apps/web/app/catalog-ui.ts`: zentraler Helper für Set-Kurzlabel und vollständiges Setdetail.
  - `apps/web/app/page.tsx`: `DisplayVisibleCard` beziehungsweise Catalog-Enrichment für bekannte Karten um display-only Setmetadaten erweitern.
  - `CardView`, `cardDetailLines` und Karten-Tooltip-Pfade: Badge und Detailzeile nur bei `card.known`.
- Falls `VisibleCard` aus `PlayerView` keine Setmetadaten enthält, nicht direkt den Shared-/Engine-Vertrag erweitern. Stattdessen Web-seitig bekannte Karten über `definitionId` und bereits geladene `CatalogCardDetail` anreichern.
- Kurzcode-Mapping sollte zentral und deterministisch sein; unbekannte Sets können auf eine kurze, aus `setId` abgeleitete Anzeige zurückfallen.
- Badge zuerst textuell lösen, nicht über neue Bildassets.

## Ergebnisnotiz

Umgesetzt: Bekannte Karten werden im Webclient aus den bereits geladenen Katalogdetails um display-only Setmetadaten angereichert. `CardView` zeigt daraus ein kleines Set-Badge wie `OV1`, `PRO`, `CLS` oder `TEST`; Tooltips, Preview-Detailzeilen und Deckbuilder-Tooltips zeigen die vollständige Setinformation mit Collector-Nummer, z. B. `Proteus #P001`. Verdeckte oder nicht angereicherte Karten bekommen keine Setmarke und keine setabhängigen DOM-Daten. Engine, LegalActions, Replay, StateHash, Server und KI bleiben unverändert.
