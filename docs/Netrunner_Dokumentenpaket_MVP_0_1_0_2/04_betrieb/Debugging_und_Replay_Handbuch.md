# Netrunner-Webapplikation – Debugging- und Replay-Handbuch

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Primäres Ziel:** reproduzierbare Fehleranalyse ohne Hidden-Info-Leaks

## 1. Zweck

Dieses Dokument beschreibt, wie Fehler reproduziert, analysiert und behoben werden. Zentrale Werkzeuge sind EventLog, StateVersion, StateHash, Seeds, Snapshots, Replay und Visibility-Oracle.

Debugging darf nicht zu Hidden-Info-Leaks führen. Full-State-Debug bleibt lokal oder serverseitig und ist nicht Teil des normalen Spielerclients.

## 2. Debug-Grunddaten

Für jeden Bugreport sollen erfasst werden:

```text
Build/Commit:
Datum:
Modus: MVP 0.1 / MVP 0.2
MatchId:
Seed:
RulesVersion:
EngineSchemaVersion:
ProtocolVersion:
PlayerViewSchemaVersion:
StateVersion vor Fehler:
StateVersion nach Fehler:
EventId:
TimingPoint:
Aktive Seite:
ActionId:
IdempotencyKey:
Finaler StateHash:
Browser/Client:
Serverlog-Auszug ohne Tokens:
Replay-Datei vorhanden: ja/nein
```

Private Tokens und nicht freigegebene Kartendaten werden nicht in Bugreports kopiert.

## 3. StateVersion und EventId

StateVersion ist der wichtigste Zeiger auf den Spielzustand. Jeder erfolgreiche Engine-Schritt erhöht oder dokumentiert die StateVersion. EventId referenziert die konkrete Transition.

Debug-Fragen:

- Welche StateVersion sah der Client?
- Welche StateVersion hatte der Server?
- War die Action stale?
- Gibt es ein Event für die behauptete Transition?
- Passt der StateHash nach dem Event?
- Wurde ein ActionReceipt gespeichert?

## 4. Replay-Analyse

Replay-Ablauf:

1. Passenden Snapshot laden.
2. EventLog ab Snapshot-StateVersion laden.
3. Events in Reihenfolge anwenden.
4. Nach jedem Event StateHash prüfen.
5. Bei erster Abweichung EventId und ActionType ausgeben.
6. Original- und Replay-State nur lokal/serverseitig vergleichen.

Soll-Befehl:

```bash
npm run replay -- --match match_abc123 --from-snapshot latest
```

Erwartete Ausgabe:

```text
Replay start: snapshot snap_010, stateVersion 10
Event evt_011 ok, hash match
Event evt_012 ok, hash match
Event evt_013 mismatch
Expected: hash_a
Actual:   hash_b
TimingPoint: run_encounter_ice_paid_window
ActionType: break_subroutine
```

## 5. Fehlerklassen und Diagnose

### 5.1 Illegale Action akzeptiert

Prüfen:

- War Action in LegalActions?
- Hat `applyAction` erneut validiert?
- Wurde Seite aus Session oder Clientpayload verwendet?
- Stimmen TimingPoint und StateVersion?
- Waren Kosten und Targets gültig?

Gegenmaßnahmen:

- Engine-Validierung ergänzen.
- Integrationstest mit manipuliertem Clientpayload hinzufügen.
- Error darf keine privaten Details nennen.

### 5.2 LegalAction wird angeboten, aber abgelehnt

Prüfen:

- Wurde LegalAction aus altem State berechnet?
- Ist `expiresAtStateVersion` korrekt?
- Gibt es Race Condition?
- Ist Target nach StateChange nicht mehr gültig?

Gegenmaßnahmen:

- StateVersion im UI strenger verwenden.
- LegalActions nach jeder Transition neu senden.
- Szenariotest für LegalAction/ApplyAction-Konsistenz hinzufügen.

### 5.3 Doppelte Transition

Prüfen:

- IdempotencyKey vorhanden?
- ActionReceipt gespeichert?
- Wurde Doppelklick im UI deaktiviert?
- Hat Server Locking verwendet?
- Gibt es zwei Events mit gleichem Key?

Gegenmaßnahmen:

- Receipt-Constraint `(matchId, side, idempotencyKey)` prüfen.
- Per-Match-Lock erzwingen.
- Concurrency-Test ergänzen.

### 5.4 Hidden-Info-Leak

Prüfen:

- Welcher Payload enthält verbotene Daten?
- Kam Leak aus PlayerView, LegalActions, EventLog, Error oder Debug?
- War es ein Reconnect- oder Undo-Payload?
- Wurde PublicPayload statt PrivatePayload genutzt?
- Enthält Testfixture verbotene CardIds/Titel?

Gegenmaßnahmen:

- Filter zentral korrigieren.
- Visibility-Oracle um Fall erweitern.
- PublicEvent-Schema prüfen.
- Alte Replays bei Bedarf als read-only markieren.

### 5.5 Replay-Hash-Abweichung

Prüfen:

- RandomCounter identisch?
- RandomDrawRecords vollständig?
- Canonical JSON stabil?
- Timestamps oder ConnectionIds versehentlich im Hash?
- EventResolver deterministisch?
- Kartenreihenfolge eindeutig?

Gegenmaßnahmen:

- Hash-Eingabefelder reduzieren und dokumentieren.
- Random-API zentralisieren.
- Replay-Test pro betroffener Mechanik hinzufügen.

### 5.6 Reconnect verliert PendingChoice

Prüfen:

- Ist ChoiceRequest im GameState gespeichert oder deterministisch ableitbar?
- Wurde Side korrekt aus Token bestimmt?
- Wurde alte Connection ersetzt?
- Wird Bootstrap aus aktuellem State erzeugt?

Gegenmaßnahmen:

- PendingChoices persistieren.
- Reconnect-Test für TimingPoint hinzufügen.
- Bootstrap-Filter mit Visibility-Oracle prüfen.

### 5.7 Undo stellt falschen State wieder her

Prüfen:

- Existiert Snapshot für Zielstate?
- Wurde bis richtige StateVersion replayt?
- Lag Hidden-Info-Barrier dazwischen?
- Wurde neues Undo-Systemevent geschrieben?
- Wurden LegalActions nach Restore neu berechnet?

Gegenmaßnahmen:

- Snapshot-Strategie anpassen.
- Hidden-Info-Barrier-Erkennung ergänzen.
- Undo-Restore-Test hinzufügen.

## 6. Payload-Debugging

Für WebSocket-Debugging dürfen Payloads nur gefiltert exportiert werden.

Erlaubt:

```json
{
  "type": "state_update",
  "matchId": "match_abc123",
  "stateVersion": 42,
  "side": "runner",
  "payloadHash": "...",
  "forbiddenInfoScan": "passed"
}
```

Nicht erlaubt im normalen Debugexport:

- vollständige PlayerView mit privaten gegnerischen Daten,
- Full GameState,
- Token,
- private Payloads beider Seiten zusammen,
- unredigierte WebSocket-Historie.

## 7. Visibility-Oracle im Debugging

Bei jedem Leakverdacht:

1. GameState lokal laden.
2. Verbotene Werte für Zielseite generieren.
3. Payload serialisieren.
4. Payload auf verbotene Titel, CardIds, Tokenmuster und Zoneinformationen prüfen.
5. Falsch positive Access-Ausnahmen dokumentieren.

Beispiel-Pseudocode:

```ts
const forbidden = collectForbiddenInfo(fullState, "runner")
const payload = buildStateUpdate(fullState, "runner")
expect(serialized(payload)).not.toContainAny(forbidden.cardTitles)
expect(serialized(payload)).not.toContainAny(forbidden.instanceIds)
expect(serialized(payload)).not.toContainAny(forbidden.tokenPatterns)
```

## 8. Minimaler Bugreport

```md
# Bugreport

## Kurzbeschreibung

## Umgebung
- Build/Commit:
- Modus:
- Browser:
- Seed:
- MatchId:

## Schritte zur Reproduktion
1.
2.
3.

## Erwartetes Verhalten

## Tatsächliches Verhalten

## Technische Daten
- StateVersion before:
- StateVersion after:
- EventId:
- TimingPoint:
- ActionId:
- StateHash:

## Anhänge
- gefilterter EventLog:
- Replay-Datei:
- Screenshot ohne private Gegenseite:

## Klassifikation
- P0/P1/P2/P3:
- Hidden-Info-Relevanz: ja/nein
```

## 9. Defect-Klassifikation

| Priorität | Bedeutung | Beispiele |
|---|---|---|
| P0 | Abnahmeblocker | Hidden-Info-Leak, illegale Action akzeptiert, Replay nicht reproduzierbar. |
| P1 | Schwerer Fehler | Reconnect hängt, falsche LegalActions, Undo falsch blockiert. |
| P2 | Mittlerer Fehler | UI-Zustand unklar, EventLog-Text ungenau, nichtkritischer Persistenzfehler. |
| P3 | Niedrig | Schreibfehler, Layout, Komfort. |

## 10. Debugging-Regeln

- Erst reproduzieren, dann fixen.
- Erst StateVersion/EventId sichern, dann UI interpretieren.
- Bei Hidden-Info-Leak keine Screenshots mit privaten Daten weitergeben.
- Kein Fix nur im Frontend, wenn Serverpayload falsch ist.
- Nach jedem Bugfix Regressionstest hinzufügen.
- Bei Replay-Abweichung erste divergierende EventId isolieren.
- Bei Concurrency-Fehlern immer Idempotency und Locking gemeinsam prüfen.

## 11. Abschluss einer Fehleranalyse

Ein Bug gilt als sauber abgeschlossen, wenn:

- Ursache dokumentiert ist,
- Fix implementiert ist,
- passender Regressionstest existiert,
- Replay/StateHash bei betroffenen Szenarien stimmt,
- Visibility-Tests bestehen, falls Payload betroffen war,
- Dokumente aktualisiert wurden, falls Spezifikationsverhalten geändert wurde.
