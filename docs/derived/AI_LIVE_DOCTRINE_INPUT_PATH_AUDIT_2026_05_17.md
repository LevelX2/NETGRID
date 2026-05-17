# AI Live Doctrine Input Path Audit, 2026-05-17

## Zweck

Dieser Audit prüft, ob produktive und testnahe KI-Eingangspfade eine eigene Deck Doctrine erhalten oder bewusst ohne Doctrine laufen. Es wurden keine KI-Strategien, Hints, Deckdaten, Runtime-Karten oder Serverpfade geändert.

No-Cheat-Gate: Deck Doctrine darf nur aus dem eigenen Decksnapshot, erlaubten Rollen-/Hintdaten und side-sicheren AIInput-Feldern entstehen. Gegnerische Decklisten, Hidden-Zonen, künftige Draws, `privatePayload`, FullState und gegnerische Kartentitel bleiben verboten.

## Kurzbefund

- Der produktive private Multiplayer-KI-Pfad ist nicht doctrine-los: `apps/server/src/multiplayer.ts:2096` nimmt `record.privateDeckSnapshots?.[side]` und übergibt ihn an `buildAiDecisionInput`.
- Der zentrale Builder `packages/ai/src/index.ts:429` erzeugt Doctrine nur aus `ownDeckDoctrine` oder `ownDeckSnapshot`; ohne Snapshot bleibt der Input explizit doctrine-neutral.
- `buildAiDecisionInputDto` kopiert Doctrine nur über `sanitizeAiDeckDoctrineProfile`; es übernimmt keine Kartenliste in den KI-DTO.
- Die doctrine-losen Live-nahen Treffer sind Legacy-/Demo-Pfade: `apps/server/src/index.ts:30` und `apps/web/app/api/game/route.ts:40`.
- Die HTTP-AI-Simulation unter `apps/server/src/http-server.ts:754` ist ein Diagnosepfad. Der aktuelle Kandidat bekommt Doctrine aus den Simulationsdecks; Baseline-/Legacy-Controller dürfen bewusst doctrine-los bleiben, damit Vergleiche aussagekräftig bleiben.

## Callsite-Inventur

| Pfad | Klassifikation | Doctrine-Quelle | Bewertung |
| --- | --- | --- | --- |
| `packages/ai/src/index.ts:429` `buildAiDecisionInput` | zentrale AI-Input-API | `ownDeckDoctrine` direkt oder `ownDeckSnapshot -> buildDeckDoctrineProfile` | korrekt; expliziter doctrine-neutraler Fallback |
| `packages/ai/src/input-dto.ts:244` `buildAiDecisionInputDto` | DTO-/Safety-Schicht | optional `ownDeckDoctrine`, danach Sanitizing | korrekt; positive Kopie der Profilfelder |
| `packages/ai/src/deck-doctrine.ts:60` `buildDeckDoctrineProfile` | Doctrine-Builder | eigener `AiDeckDoctrineDeckSnapshot` | korrekt; nutzt eigene Karten-IDs, Runtime-AI-Status, Rollen und Dichten |
| `apps/server/src/multiplayer.ts:2088` `runAiStep` | produktiver Live-Matchpfad | `record.privateDeckSnapshots?.[side]` | produktiv abgedeckt; kein direkter Produktgap gefunden |
| `apps/server/src/http-server.ts:192` WebSocket `advance_ai` | produktive Steuerung | delegiert an `MultiplayerService.advanceAi` und danach `runAiStep` | abgedeckt |
| `apps/server/src/http-server.ts:719` `POST /api/matches` | produktive Match-Erzeugung | Deckauswahl geht in `createMatch`; dort werden private Snapshots gespeichert | abgedeckt |
| `apps/server/src/http-server.ts:754` `POST /api/simulations/ai-vs-ai` | Diagnose-/Benchmark-Pfad | Simulationsdecks; Doctrine nur für `current_candidate` Controller | bewusst gemischt: Kandidat mit Doctrine, Baseline ohne Doctrine |
| `packages/ai/src/index.ts:517` `simulateAiGame` | Test-/Diagnose-Pfad | `deckSnapshotForSimulation`, aber nur bei `current_candidate` | bewusst; Baseline-Vergleiche brauchen doctrine-lose Profile |
| `apps/server/src/index.ts:30` `runCorpAiStep` | lokaler Server-Demo-Helper | keine | bewusste Legacy-Ausnahme; nicht der private Multiplayer-Livepfad |
| `apps/web/app/api/game/route.ts:40` `corp_step` | Legacy-Web/API-Smoke | keine | bewusste Legacy-Ausnahme; kein Deckauswahl-/Multiplayerpfad |
| `apps/server/src/multiplayer.test.ts:4673` `sidePayloadBeliefInput` | Server-Testfixture | keine | bewusst; prüft Belief aus side-sicherem Payload ohne private Deckdaten |
| `packages/ai/src/index.test.ts` | Unit-/Regression-Fixtures | gemischt: oft neutral, einzelne Tests mit Doctrine | bewusst; viele Tests isolieren Baseline-Verhalten |

## Produktive Pfade

Der relevante Live-Pfad ist `advance_ai` über WebSocket oder Server-Service:

1. Client sendet `advance_ai` an `apps/server/src/http-server.ts`.
2. `handleAdvanceAi` ruft `MultiplayerService.advanceAi`.
3. `advanceAi` validiert Session, StateVersion, MatchVersion und aktive KI-Seite.
4. `runAiStep` baut `buildAiDecisionInput` mit `ownDeckSnapshot: record.privateDeckSnapshots?.[side]`.
5. `buildAiDecisionInput` erzeugt daraus `ownDeckDoctrine`.

Damit bekommt die KI nur die eigene Deck Doctrine. Die gespeicherten `privateDeckSnapshots` bleiben serverprivat und werden nicht als PlayerView, Reconnect-Payload, PublicEvent oder Gegnerdaten ausgegeben.

Restunsicherheit: `runAiStep` toleriert fehlende `privateDeckSnapshots` und läuft dann doctrine-neutral. Die aktuellen aktiven Match-Erzeugungspfade befüllen die Snapshots; ein kleiner Invariant-Test wäre trotzdem sinnvoll, damit spätere Match-Erzeugungsvarianten diesen Vertrag nicht versehentlich umgehen.

## Bewusste Ausnahmen

### Legacy-Demo-Helper

`apps/server/src/index.ts:30` und `apps/web/app/api/game/route.ts:40` starten einfache Demo-/Smoke-Spiele ohne Deckauswahl und ohne private Match-Snapshots. Das ist kein Befund gegen den produktiven Multiplayerpfad. Diese Pfade dürfen doctrine-neutral bleiben, solange sie als Legacy-/Smoke-Pfade gelten und nicht als Qualitätsreferenz für Live-KI ausgewertet werden.

### Baseline- und Testfixtures

Viele Unit-Tests bauen AIInputs ohne Doctrine, um Baseline-Entscheidungen, einzelne LegalActions, Visibility-Gates oder Belief-Rekonstruktion isoliert zu prüfen. Das ist zulässig, solange Doctrine-spezifische Erwartungen eigene Tests behalten und die doctrine-neutralen Tests nicht als Live-Qualitätsmaßstab missverstanden werden.

### Simulation-Baselines

`simulateAiGame` ist gemischt: `current_candidate` erhält Doctrine, ältere Benchmark-Profile laufen absichtlich ohne Doctrine. Dadurch misst der Benchmark den Unterschied zwischen alter KI und aktuellem Kandidaten. Das ist kein Produktgap.

## Folgeempfehlungen

1. `ai-live-doctrine-invariant-test`: kleiner Server-Test, der für `human_runner_vs_corp_ai` und `human_corp_vs_runner_ai` bestätigt, dass aktive KI-Seiten vor `runAiStep` einen eigenen privaten Decksnapshot besitzen.
2. `ai-legacy-demo-doctrine-boundary`: entscheiden, ob `apps/web/app/api/game/route.ts` und `runCorpAiStep` als Legacy-Smokes dokumentiert bleiben oder mit festen Demo-Snapshots eine eigene Doctrine bekommen.
3. `ai-simulation-doctrine-mode-contract`: kleiner Test oder Bericht, der festhält, dass `current_candidate` im Simulationpfad Doctrine nutzt, Baseline-Profile aber bewusst doctrine-neutral bleiben.

## Ergebnis

Keine produktive Doctrine-Lücke wurde gefunden. Die wichtigsten doctrine-losen Pfade sind bewusst doctrine-neutrale Demo-, Baseline- oder Testpfade. Der einzige sinnvolle produktnahe Nachzug ist ein Invariant-Test gegen spätere Regressionen bei `privateDeckSnapshots`.
