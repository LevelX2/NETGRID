# Proteus CardImplementation Paketstandard

Stand: 2026-05-26

Dieses Artefakt ist ab `PRO003` der Paketstandard für Proteus-CardImplementation-Pakete. Für neue Umsetzungsaufträge gilt der führende Detailplan `proteus-cardimplementation-detailplan-2026-05-26.md`, der ab `PRO007` in größere Mechanikfamilien-Pakete umgedeutet wurde.

## Führende Zählregel

Implementierungsfortschritt wird aus der konkreten File- und Registry-Wahrheit gezählt:

1. Gesamtbasis ist `data/cards/proteus-cards.json`.
2. Eine umgesetzte Proteus-Karte braucht genau eine konkrete CardImplementation-Datei unter `packages/engine/src/card-implementations/proteus/`.
3. Jede Datei braucht genau eine eindeutige `cardDefinitionId` aus `data/cards/proteus-cards.json`.
4. Jede Datei muss in `packages/engine/src/card-implementations/registry.ts` registriert sein.
5. `data/manifests/proteus-card-support.json` muss zur Datei- und Registry-Wahrheit passen. Das Manifest ist Driftprüfung, nicht die führende Implementierungsquelle.
6. Freigabe-Flags folgen separaten Gates: Nach dem Human-vs-Human-Decklegal-Gate sind `deck_legal` und `format_legal` für alle implementierten Proteus-Karten erlaubt; `ai_supported` bleibt ohne separates AI-Gate `false`.

`docs/activities/` bleibt Arbeits- und Planungsstatus. Ordnerpositionen, `done`-Status oder `superseded`-Status zählen nicht als Implementierungsnachweis.

## Verbindliche Engine-Gates

Jedes Proteus-CardImplementation-Paket muss diese Projektprinzipien einhalten:

- LegalActions sind die einzige Quelle zulässiger PlayerActions.
- `applyAction` validiert Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices erneut.
- Hidden-Info darf nicht in PlayerViews, PublicEvents, KI-Inputs, WebSocket-/Reconnect-Payloads, Undo-Previews, öffentlichen Replays, Logs oder Client-Fehlern leaken.
- Replay und StateHash müssen deterministisch bleiben.
- Zufall läuft nur über Seed, RandomCounter und RandomDrawRecords.
- Neue generische Engine-Bausteine sind nur zulässig, wenn sie echte mechanische Wiederverwendung schaffen und keine Proteus-ID-Sonderzweige in Runtime-Code einführen.
- Eine Karte wird erst als `human_playable` gezählt, wenn Datei, Registry, Manifest, LegalAction-/`applyAction`-Revalidierung und Tests zum Kartenverhalten zusammenpassen.

## Activity-Template

Neue PRO-Activities sollen höchstens ein PRO-Paket abdecken. Die Pakete ab `PRO007` dürfen bewusst größer sein; wenn ein Paket nach Vorprüfung mehr als vier klar getrennte neue Engine-Verträge braucht, darf der Umsetzung-Agent einzelne Karten begründet zurückstellen oder ein Suffixpaket vorschlagen, ohne den gesamten Restzuschnitt wieder in Mikro-Pakete aufzulösen.

```markdown
---
status: inbox
priority: normal
primaryAgent: release-implementation-agent
proReferences:
  - PRO0xx
---

# <kurzer Activity-Titel>

## Ziel / PRO-Referenz

- PRO-Referenz:
- Ziel:
- Nicht-Ziele:

## Kartenliste

| cardDefinitionId  | Titel | Erwartete Datei                                             |
| ----------------- | ----- | ----------------------------------------------------------- |
| `onr_proteus_...` | ...   | `packages/engine/src/card-implementations/proteus/.../*.ts` |

## Mechanikfamilien

- Betroffene Mechanikfamilien:
- Wiederverwendbare vorhandene Bausteine:
- Benötigte neue generische Engine-Bausteine:

## Konkrete Dateien

- CardImplementation-Dateien:
- Registry:
- Manifest:
- Tests:
- Dokumentation/Status, falls erforderlich:

## Tests und Nachweise

- Positive Nutzung:
- Illegale Nutzung:
- LegalAction-/PlayerAction-Ableitung:
- `applyAction`-Revalidierung für Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices:
- Hidden-Info-Nachweis:
- Replay-/StateHash-Nachweis:
- Random-Nachweis, falls betroffen:
- Manifest-/Registry-Nachweis:

## Abschlusskriterien

- Eine konkrete Datei je Karte unter `packages/engine/src/card-implementations/proteus/`.
- Jede Datei hat genau eine eindeutige `cardDefinitionId` aus `data/cards/proteus-cards.json`.
- Jede Datei ist in `packages/engine/src/card-implementations/registry.ts` registriert.
- `data/manifests/proteus-card-support.json` passt zur Datei- und Registry-Wahrheit.
- `deck_legal`, `format_legal` und `ai_supported` entsprechen dem jeweils aktuellen Gate-Stand; ohne AI-Gate bleibt `ai_supported` `false`.
- Der Proteus-Verify-Harness läuft grün; die Restliste darf nur die noch nicht umgesetzten Karten enthalten.
```

## Verify-Harness

Der Proteus-Verify-Harness ist der bestehende Test `packages/engine/src/card-implementations/coverage.test.ts`. Er wird bewusst nicht als zweites konkurrierendes System geführt.

Standardbefehl:

```powershell
corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/coverage.test.ts -t "reconciles Proteus"
```

Der Testlauf weist mindestens aus:

- Gesamtzahl der Proteus-Karten aus `data/cards/proteus-cards.json`.
- Anzahl eindeutiger implementierter Proteus-`cardDefinitionId`-Werte aus `packages/engine/src/card-implementations/proteus/*.ts`.
- Anzahl fehlender CardImplementation-Dateien.
- Liste fehlender `cardDefinitionId`-Werte mit Titel.
- Nicht registrierte Proteus-Dateien.
- Registrierte Proteus-Implementierungen ohne Datei.
- Doppelte `cardDefinitionId`-Werte in Dateien oder Registry.
- Manifest-Drift gegenüber Datei- und Registry-Wahrheit.
- Drift bei `deck_legal`, `format_legal` oder `ai_supported` gegenüber dem aktuellen Gate-Stand.

Fehlende CardImplementation-Dateien sind im laufenden Restplan informativ und schlagen den Test nicht fehl. Der Test schlägt bei Konsistenzfehlern fehl, insbesondere bei fehlender oder falscher `cardDefinitionId`, unbekannten Proteus-IDs, Registry-/Datei-Drift, doppelten IDs, Manifest-Status-/`resolverRef`-Drift und Freigabe-Flag-Drift gegenüber dem aktuellen Gate-Stand.

## PRO003-Ergebnisstand

Nach `PRO003` ist der Paketstandard dokumentiert und der Verify-Harness gibt die Restliste direkt im Testlauf aus. Der aktuelle Stand bleibt: 154 Proteus-Karten insgesamt, 50 eindeutige implementierte Proteus-`cardDefinitionId`-Werte aus Dateien und 104 fehlende konkrete CardImplementation-Dateien.
