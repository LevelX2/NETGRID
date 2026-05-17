---
activityId: act-2026-05-17-proteus-spoiler-ingestion
status: done
kind: concept
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: Proteus planning
blockedBy: []
resultArtifacts:
  - packages/catalog/src/proteus-spoiler.ts
  - packages/catalog/src/index.ts
  - packages/catalog/src/index.test.ts
  - data/card-import/proteus-card-basis-2026-05-17.json
  - data/card-import/source-registry-proteus-2026-05-17.json
  - data/reports/proteus-spoiler-import-report-2026-05-17.json
  - docs/derived/PROTEUS_SPOILER_IMPORT_REPORT.md
checks:
  - corepack pnpm --filter @netgrid/catalog test
  - corepack pnpm --filter @netgrid/catalog typecheck
---

# Proteus-Spoiler als Kartenbasis anlegen

## Ziel

Die lokale Proteus-Spoilerquelle soll in eine versionierte, reviewbare Kartenbasis überführt werden, ohne dadurch Karten automatisch spielbar, decklegal oder KI-unterstützt zu machen.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-17: erste Erweiterung `Proteus` analysieren, Karten aus dem Spoiler anlegen und Umsetzungsschritte planen.
- Lokale Quelle: `docs/source/Proteusspoiler.txt`.
- Der Spoiler nennt `154 Cards Total (44 Rares, 44 Uncommons, 66 Commons)`, davon 77 Korp- und 77 Runner-Karten.
- Private Scanquellen liegen unter `docs/source/PrivateScans/v2.1 Proteus_*.pdf`; sie bleiben private lokale Anzeige-/Prüfquellen und keine öffentliche Assetfreigabe.

## Scope

- Spoilerparser oder Importskript für `Proteusspoiler.txt` prüfen oder erstellen.
- Alle 154 Proteus-Karten mit stabilen IDs, Titel, Seite, Typ, Subtypen, Kosten-/Stärke-/Agenda-/Trash-Werten, Text und Rarität als Datenbasis anlegen.
- Set-/Quellmetadaten eindeutig setzen, z. B. Set `proteus` oder ein projektkonformes Äquivalent.
- Importstatus bewusst auf nicht spielbar halten, z. B. `listed`/`imported`/`blocked`, aber nicht `human_playable`, `deck_legal` oder `ai_supported`.
- Parser-Report mit Anzahl, Typverteilung, Raritätsverteilung und nicht normalisierbaren Feldern erzeugen.
- Auffällige OCR-/Formatierungsfälle als Reviewliste festhalten.

## Nicht im Scope

- Keine Runtime-Resolver.
- Keine Kartenfreigabe für Decks oder KI.
- Keine Nutzung offizieller Bilder, Frames, Logos oder Card Backs außerhalb des privaten lokalen Assetpfads.
- Keine automatische Regelinterpretation aus Kartentext.
- Keine Änderung an Engine, Replay, StateHash, LegalActions oder AIInput.

## Akzeptanzkriterien

- [x] 154/154 Proteus-Karten sind aus `docs/source/Proteusspoiler.txt` als nicht spielbare Kartenbasis erfasst.
- [x] Korp-/Runner- und Raritätszählung stimmt mit dem Spoilerkopf überein.
- [x] Jede Karte hat eine stabile ID und einen nachvollziehbaren Quellenverweis.
- [x] Kartenstatus erzeugt keine automatische Spielbarkeit, Decklegalität oder KI-Freigabe.
- [x] Ein Import-/Reviewreport benennt Parsergrenzen und offene Text-/Attributfragen.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Bestehende ONR-v1-Spoilerparser, Snapshot- oder Catalog-Pipeline-Muster bevorzugen.
- Wenn der Import konkrete Mechanikcluster sichtbar macht, Folgeactivities anlegen statt Runtime-Umsetzung in dieses Paket zu ziehen.

## Ergebnisnotiz

Erledigt. `packages/catalog/src/proteus-spoiler.ts` importiert `docs/source/Proteusspoiler.txt` als separate, blockierte Planungsdatenbasis. Der Snapshot `data/card-import/proteus-card-basis-2026-05-17.json` enthält 154/154 Karten mit stabilen `onr_proteus_*`-IDs, Set-/Quellmetadaten, Typen, Subtypen, Rarität und Basiswerten.

Alle Proteus-Karten sind `imported`, `validated`, `catalog_ready` und bewusst `blocked`; keine Karte ist `implemented`, `engine_supported`, `playable`, `human_playable`, `deck_legal`, `format_legal` oder `ai_supported`. Tests sichern außerdem, dass der Runtime-Snapshot keine Proteus-Karte aufnimmt.

Der Report bestätigt 77 Korp-/77 Runner-Karten und Raritäten 66 Common, 44 Uncommon, 44 Rare, 0 Vital. Reviewpunkte: variable Stärke bei `Digiconda` und `Homing Missile`, `Cost 3 (0)` bei `Ice and Data Special Report`, plus die Quellenkopf-Abweichung `26 Prep`/`7 Hardware` gegenüber den geparsten Kartenzeilen `27 Prep/Event`/`6 Hardware`.
