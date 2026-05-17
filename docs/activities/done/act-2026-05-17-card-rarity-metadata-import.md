---
activityId: act-2026-05-17-card-rarity-metadata-import
status: done
kind: fix
area: cards
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: catalog UX
blockedBy: []
resultArtifacts:
  - packages/catalog/src/rarity.ts
  - packages/catalog/src/catalog-types.ts
  - packages/catalog/src/index.ts
  - packages/catalog/src/index.test.ts
  - apps/web/app/api/cards/catalog-data.test.ts
  - docs/codex/CODEX_STATUS.md
  - KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md
checks:
  - corepack pnpm --filter @netgrid/catalog test
  - corepack pnpm --filter @netgrid/web test -- catalog-data.test.ts
  - corepack pnpm --filter @netgrid/catalog typecheck
  - corepack pnpm --filter @netgrid/web typecheck
---

# Kartenrarität aus Spoilerquellen importieren

## Ziel

Die Rarität aus den lokalen Spoilerdateien soll als stabile Kartenmetadaten verfügbar werden, damit Katalog und Deckeditor später danach anzeigen und filtern können.

## Kontext und Quellen

- Nutzerwunsch vom 2026-05-17: Rarität der ursprünglichen Sets als Information und Filtermöglichkeit einbauen.
- Lokale Quellen enthalten `Rarity:`-Felder, u. a. `docs/source/Corpspoiler 1.0.txt`, `docs/source/Runnerspoiler 1.0.txt`, `docs/source/Proteusspoiler.txt` und `docs/source/Classicspoiler.txt`.
- In den Originalset-Spoilern kommen neben `Common`, `Uncommon`, `Rare` auch einzelne `Vital`-Werte vor; deutsche Anzeige muss bewusst gemappt werden.

## Scope

- Raritätswerte aus den lokalen Spoilerquellen extrahieren und normalisieren.
- Datenmodell um ein nicht-regelrelevantes Raritätsfeld ergänzen, z. B. `rarity`.
- Deutsche Labels definieren, mindestens `Common` = `Häufig`, `Uncommon` = `Ungewöhnlich`, `Rare` = `Selten`; `Vital` separat prüfen und projektweit eindeutig benennen oder als Sonderwert behandeln.
- Rarität in Catalog-/Card-Snapshot-/API-Daten sichtbar machen, ohne Engine, AIInput, Replay oder StateHash zu beeinflussen.
- Test oder Report ergänzen, der Quellzählungen und unbekannte Raritätswerte prüft.

## Nicht im Scope

- Keine Deckbau-Regel aus Rarität ableiten.
- Keine Kartenfreigabe oder Mechanikänderung.
- Keine Proteus-Spielbarkeit.
- Kein UI-Filter in diesem Paket, außer wenn minimal zur Datenprüfung nötig.
- Keine Übersetzung offizieller Kartentexte.

## Akzeptanzkriterien

- [x] Rarität ist für Karten aus den lokalen Spoilerquellen als Metadatum verfügbar.
- [x] Unbekannte oder nicht gemappte Raritätswerte werden reportet statt still ignoriert.
- [x] Deutsche Labels sind zentral definiert und wiederverwendbar.
- [x] Engine, Replay, StateHash, LegalActions und AIInput bleiben unverändert.
- [x] Tests oder ein Importreport decken mindestens Originalset und Proteus-Spoiler ab.

## Umsetzungshinweise

- Primärer Folgeagent: `card-enablement-ai-knowledge-agent`.
- Bestehende Catalog-/Snapshot-Pipeline verwenden, keine parallele UI-only-Raritätsliste.
- Rarität ist Anzeige-/Filtermetadatum, keine Regelautorität.

## Ergebnisnotiz

Abgeschlossen. Rarität ist als display-only Catalog-Metadatum mit zentralen Codes `common`, `uncommon`, `rare`, `vital` und deutschen Labels (`Häufig`, `Ungewöhnlich`, `Selten`, `Vital`) ergänzt. Der neue Spoilerparser liest Originalset-, Proteus- und Classic-Quellen, reportet unbekannte Werte und ist gegen bekannte Formatabweichungen in den lokalen Spoilern gehärtet. Runtime-CardSnapshots, Catalog-Summaries und die Web-Catalog-API geben Rarität aus; Engine, Replay, StateHash, LegalActions und AIInput wurden nicht erweitert. Checks: `corepack pnpm --filter @netgrid/catalog test`, `corepack pnpm --filter @netgrid/web test -- catalog-data.test.ts`, `corepack pnpm --filter @netgrid/catalog typecheck`, `corepack pnpm --filter @netgrid/web typecheck`.
