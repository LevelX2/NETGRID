# V2.4 Spectator-Projektion Spike

Stand: 2026-05-17  
Status: Architektur-Spike, keine Implementierungsfreigabe  
Zielrelease: V2.4 Spectator Private/Delayed

## Findings

### Hoch: Spectator darf keine dritte PlayerView werden

Betroffene Anker:

- `packages/shared/src/index.ts:1072` bis `packages/shared/src/index.ts:1149` definiert `PlayerView` als seitengebundene Sicht mit `own`, `opponent`, `pendingChoice`, `publicEvents` und `legalActions`.
- `packages/engine/src/index.ts:2116` bis `packages/engine/src/index.ts:2285` baut `getPlayerView(state, side)` explizit für `runner` oder `corp`.
- `apps/server/src/multiplayer-payload.ts:37` bis `apps/server/src/multiplayer-payload.ts:83` baut Live-Payloads aus `getPlayerView`, `getLegalActions` und side-redigiertem `eventTail`.

Risiko: Ein Zuschauer, der technisch als Runner- oder Korp-PlayerView modelliert wird, erhält zwangsläufig private Rollenfelder, LegalActions, Choice-Kontext oder eigene Hidden-Zonen dieser Seite. Das wäre kein neutraler Zuschauer, sondern ein zusätzlicher Spielerkanal.

Empfehlung: V2.4 braucht eine eigene DTO-Familie, z. B. `SpectatorProjectionV1`. Diese Projektion darf nicht `PlayerView` erweitern, nicht `SidePayload` wiederverwenden und keine `legalActions`, `pendingChoice`, `own`-/`opponent`-Privatsicht oder seitenprivate Zone enthalten.

### Hoch: Spectator darf nicht direkt ReplayView oder PublicGameEvent-Listen veröffentlichen

Betroffene Anker:

- `packages/shared/src/index.ts:859` bis `packages/shared/src/index.ts:871` trennt `PublicGameEvent` und `GameEvent.privatePayload`.
- `apps/server/src/event-projection.ts:8` bis `apps/server/src/event-projection.ts:54` reduziert Engine-Events zu `ServerEventRecord.publicPayload` und redigiert Replay-Events nur für `runner`, `corp` oder `local_analysis`.
- `apps/server/src/multiplayer.ts:366` bis `apps/server/src/multiplayer.ts:376` enthält in `ReplayView` Felder wie `randomDrawRecords`, `exploitSuggestions` und `localAnalysis`.
- `apps/server/src/multiplayer.ts:1584` bis `apps/server/src/multiplayer.ts:1636` lädt private Replay-Perspektiven und blockiert nur `local_analysis` beim Export.

Risiko: `ReplayView` ist eine historische Lern-/Analysefläche, keine Live-Zuschauerfläche. `PublicGameEvent` ist außerdem nur ein Baustein: side-redigierte Runner-/Korp-Replays sind keine public-sichere Zuschauerprojektion, und `local_analysis` ist ausdrücklich lokal.

Empfehlung: Spectator braucht einen eigenen Builder über `ServerEventRecord` plus live-sichere Matchmetadaten. Replay-Projektionen bleiben für historische Runner-/Korp-/lokale Analysepfade. Public Replay bleibt V2.8 und wird nicht durch V2.4 implizit freigegeben.

### Mittel: Hidden-Info-Barrieren sind wiederverwendbar, aber kein Freibrief

Betroffene Anker:

- `packages/engine/src/index.ts:21019` bis `packages/engine/src/index.ts:21061` baut Events mit `visibilityClass`, `publicPayload` und `privatePayload`.
- `apps/server/src/event-projection.ts:23` bis `apps/server/src/event-projection.ts:33` speichert `privatePayloadLocalOnly` und `hiddenInfoBarrier` im `ServerEventRecord`.
- `apps/server/src/multiplayer.ts:2377` bis `apps/server/src/multiplayer.ts:2448` nutzt Replay-StateHash-Checks aus Engine-Events, nicht aus einer Zuschauerprojektion.

Risiko: `hiddenInfoBarrier` markiert kritische Stellen, beweist aber nicht automatisch, dass eine neue Zuschauerprojektion public-safe ist. Besonders gefährlich sind Payloadfelder mit Kartentiteln, `instanceId`, Zielreferenzen, Deckmetadaten und Timing von Zugriffen auf verdeckte Zonen.

Empfehlung: Spectator-Builder muss eine positive Allowlist haben. `hiddenInfoBarrier` soll als Marker und Testanker in der Ausgabe erscheinen, aber alle sichtbaren Eventdetails müssen separat public-sanitized werden.

## Minimaler Spectator-Zielvertrag

### `private_spectator_live_v1`

Zweck: privater Zuschauerlink für ein laufendes Match ohne Live-Hidden-Zones.

Erlaubt:

- `matchId` oder public-safe Alias, Matchstatus, Matchversion, aktueller StateVersion-Stand.
- Rollenlabels `Runner` und `Korp`, optional consent-gesteuerte Anzeigenamen.
- öffentliche Ressourcen: Credits, Klicks, Agendapunkte, Tags, sichtbare öffentliche Score-Areas, bekannte/rezzed Karten und reine Zähler für verdeckte Zonen.
- Board-Snapshot nur mit public-sicheren Karten. Verdeckte Installationen bleiben anonyme Slots ohne Titel, Definition-ID, Bilddaten, private `instanceId` oder Herkunft.
- Event-Tail aus eigenem Spectator-Eventtyp mit Eventfamilie, StateVersion vor/nach, `stateHashAfter`, `visibilityClass`, `hiddenInfoBarrier` und public-sanitized Label.

Ausgeschlossen:

- `PlayerView`, `SidePayload`, `legalActions`, `pendingChoice`, `choice_request`, `action_receipt`.
- FullState, `GameState`, `cardInstances`, `privatePayload`, private Decksnapshots, Decklisten, Deckhashes, Cloud-Deck-IDs.
- Session-, Reconnect-, Join-, Invite-, Recovery- und Account-Session-Tokens oder Hashes.
- `AIInput`, `DecisionDebug`, `exploitSuggestions`, `randomDrawRecords`, `local_analysis`.
- private Hand-/HQ-/Grip-/Stack-/R&D-Inhalte und facedown Archives-Inhalte, solange sie nicht durch das Spiel public geworden sind.

### `delayed_public_spectator_v1`

Zweck: späteres, optional öffentliches Zuschauen mit Delay. Das ist nicht automatisch Public Replay.

Zusätzliche Gates:

- explizite Consent-Policy vor Veröffentlichung,
- Delay-Policy mit Mindestverzögerung, Reconnect-Verhalten und Abbruch bei Widerruf,
- Datenschutz-/Moderationsintegration,
- keine automatische Freigabe alter Matches,
- keine Kartenbilder, offiziellen Assets oder Decklisten ohne eigenes Gate.

Erlaubte Datenmenge: höchstens dieselbe public-sanitized Projektion wie `private_spectator_live_v1`, zusätzlich verzögert und mit neutralisierten oder consent-gesteuerten Namen.

## Delay, Consent, Linkschutz und Reconnect

| Thema | Gatepunkt |
| --- | --- |
| Delay | Server muss Events nach `stateVersionAfter` und Serverzeit puffern. Reconnect darf nur bis zum freigegebenen Delay-Cursor liefern, nicht den aktuellen Live-State. |
| Consent | Vor privaten Links mindestens Host-Entscheidung plus klare Gegnerinformation; für delayed public mindestens beide menschlichen Seiten oder ein noch zu entscheidender Account-/Matchvertrag. |
| Linkschutz | Spectator-Link ist eigene Capability, nicht Join-/Session-/Reconnect-Token. Token wird gehasht gespeichert, rotiert/widerrufen und nie in Logs, PublicEvents, Replay oder Browser-Storage-Listen geschrieben. |
| Reconnect | Spectator-Reconnect liefert nur `SpectatorProjectionV1` und den erlaubten Event-Cursor. Kein Fallback auf Runner-/Korp-Reconnect und keine `PlayerView` im Fehlerpayload. |
| Hidden-Zonen | Live-Spectator sieht keine Hand-, HQ-, R&D-, Stack-, facedown-Archives- oder private Choice-Inhalte. Private Zuschauerlinks erhöhen die Sichtklasse nicht. |

## Testbarer Folge-Schnitt

Ein späterer erster Test-Slice sollte ohne UI und ohne Link-API starten:

1. Einen reinen Builder `buildSpectatorProjectionV1(record, policy)` anlegen, der nur aus `StoredMatch`, `ServerEventRecord` und einer expliziten Policy liest.
2. Fixture mit verdeckter Korp-Installation, R&D-/HQ-Zugriff, Damage/Discard, Trace, Undo-naher Hidden-Info-Barriere und Reconnect-Cursor aufbauen.
3. Payloadscan gegen verbotene Schlüssel und Inhalte: `PlayerView`, `legalActions`, `pendingChoice`, `privatePayload`, `cardInstances`, FullState/GameState, Hidden-Kartentitel, Decklisten, Deckhashes, Tokens, Token-Hashes, `AIInput`, `DecisionDebug`, `local_analysis`, `exploitSuggestions`, `randomDrawRecords`, lokale Pfade.
4. Delay-Test: Projektion bei Delay-Cursor N enthält kein Event und keinen Boardzustand aus N+1.
5. Reconnect-Test: Spectator-Reconnect rekonstruiert dieselbe Projektion für denselben Cursor und rotiert nur Spectator-Capabilities.

## Folgepaket

Angelegt: `docs/activities/inbox/act-2026-05-17-v2-spectator-payload-leakscan-harness.md`.

## Entscheidung

V2.4 Spectator bleibt analysebereit, aber nicht implementierungsfrei. Der minimale tragfähige Weg ist eine eigene, versionierte, positive Zuschauerprojektion ohne PlayerView-, ReplayView-, LegalAction-, KI- oder StateHash-Kopplung. Private Zuschauerlinks dürfen live nur public-safe Daten sehen. Delayed public view ist ein eigenes Gate mit Delay, Consent, Datenschutz, Moderation und Linkschutz.
