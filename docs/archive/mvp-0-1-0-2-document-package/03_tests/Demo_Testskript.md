# NETGRID-Webapplikation – Demo- und Testskript

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** manuelle Abnahme und reproduzierbare Demo für MVP 0.1/0.2  
**Zweck:** Schritt-für-Schritt-Prüfung einer spielbaren Demo-Partie

## 1. Zweck

Dieses Skript beschreibt konkrete Demoabläufe für MVP 0.1 und MVP 0.2. Es ist kein Ersatz für automatisierte Tests, sondern ein operatives Skript für manuelle Abnahme, Entwicklungsdemos und Regressionsprüfung.

Die konkreten Kartenreihenfolgen können durch Fixtures oder Seeds hergestellt werden. Wenn die echte Shuffle-Implementierung andere Reihenfolgen erzeugt, müssen die Szenarien als Arrange-Fixtures mit definiertem Ausgangszustand umgesetzt werden.

## 2. Allgemeine Vorbereitung

### 2.1 Verwendete Decks

Runner:

- Runner Identity
- Simple Economy Event
- Simple Run Event
- Simple Fracter
- Simple Decoder
- Simple Killer

Corp:

- Corp Identity
- Simple Agenda
- Simple Economy Operation
- Simple Economy Asset
- Simple Barrier ICE
- Simple Code Gate ICE
- Simple Sentry ICE

### 2.2 Empfohlene Test-Seeds

| Seed | Zweck |
|---|---|
| `demo-runner-steal-001` | Runner-Sieg oder Agenda-Steal-Szenario. |
| `demo-corp-score-001` | Corp-Score-Szenario. |
| `demo-ice-break-001` | ICE/Breaker/Run-Szenario. |
| `demo-multiplayer-001` | Human-vs-Human-E2E. |
| `demo-undo-001` | Undo vor/nach Hidden Information. |

### 2.3 Sichtbare Prüfpunkte

Bei jedem Schritt prüfen:

- aktuelle Seite,
- Clicks,
- Credits,
- TimingPoint,
- StateVersion,
- relevante LegalActions,
- sichtbare Zonen,
- EventLog-Eintrag,
- keine verbotenen privaten Daten im falschen Client.

## 3. MVP-0.1-Demo: Human Runner gegen Corp-KI

### 3.1 Ziel

Nachweisen, dass der Runner über UI gegen Corp-KI eine Grundpartie spielen kann, bei der Economy, Installation, Run, ICE, Breaker, Access, Steal, Scoring, EventLog, Replay und StateHash funktionieren.

### 3.2 Setup

- Modus: Human Runner vs Corp-KI.
- Deckmodus: feste Demo-Decks.
- Seed: `demo-runner-steal-001`.
- Agenda-Zielwert: für Demo konfigurierbar, z. B. 4 oder 6 Punkte.
- Debuganzeige lokal erlaubt: StateVersion, TimingPoint, StateHash.
- Full-State nicht im normalen Spielerclient anzeigen.

### 3.3 Ablauf

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 1 | Neues Demo-Spiel starten | RunnerView erscheint; Corp-HQ/R&D-Titel nicht sichtbar. |
| 2 | Runner prüft LegalActions | Nur Runner-legale Aktionen sichtbar. |
| 3 | Runner spielt Simple Economy Event | Runner zahlt Click, erhält 4 Credits, Event in Heap, StateVersion erhöht. |
| 4 | Runner installiert Simple Fracter | Credits und MU werden reduziert; Fracter im Rig sichtbar. |
| 5 | Runner beendet Zug | Corp-KI wird aktiv. |
| 6 | Corp-KI führt Pflichtdraw aus | EventLog zeigt öffentlichen Draw ohne gezogene Kartendetails für Runner. |
| 7 | Corp-KI installiert ICE vor R&D | Runner sieht verdecktes ICE ohne Titel. |
| 8 | Corp-KI installiert Simple Agenda in Remote oder nimmt Economy | Runner sieht verdeckte Remote-Karte ohne Titel. |
| 9 | Runner startet Run auf R&D oder Remote | RunState aktiv; Zielserver öffentlich. |
| 10 | Corp rezzt Simple Barrier ICE | ICE-Titel, Stärke und Subroutine werden öffentlich; Corp zahlt Rez-Kosten. |
| 11 | Runner nutzt Fracter-Pump, falls nötig | Stärke reicht gegen Barrier. |
| 12 | Runner bricht End-the-run-Subroutine | Subroutine als gebrochen markiert. |
| 13 | Runner passiert ICE | Run geht zu Server/Success weiter. |
| 14 | Runner breached Server | AccessState aktiv. |
| 15 | Runner accessed Simple Agenda | Karte ist für Runner sichtbar; Steal-Action wird angeboten. |
| 16 | Runner stiehlt Agenda | Agenda in Runner Score Area; Event öffentlich; Agenda Points aktualisiert. |
| 17 | Corp-KI kann später Simple Agenda installieren/advancen/scoren | Corp Score Area aktualisiert, falls Szenario es vorsieht. |
| 18 | Spiel endet bei Zielwert | Winner gesetzt, keine weiteren normalen Actions. |
| 19 | Replay ausführen | Finaler StateHash entspricht Originalpartie. |

### 3.4 Sichtbarkeitsprüfung während MVP-0.1-Demo

Während der Demo darf RunnerView nicht enthalten:

- Corp-HQ-Kartentitel,
- R&D-Reihenfolge,
- unrezzed ICE-Titel,
- verdeckte Remote-Kartentitel,
- interne IDs verdeckter Corp-Karten.

KI-Input darf nicht enthalten:

- Runner-Grip-Kartentitel,
- Runner-Stack-Reihenfolge,
- vollständigen GameState.

### 3.5 Bestehenskriterien

MVP-0.1-Demo gilt als bestanden, wenn:

- die Partie ohne Hänger durchläuft,
- alle Aktionen über LegalActions gewählt werden,
- StateVersion nach Aktionen steigt,
- EventLog vollständig ist,
- Replay denselben StateHash erzeugt,
- keine Hidden-Info-Leaks sichtbar sind,
- Winner korrekt gesetzt wird.

## 4. MVP-0.2-Demo: Private Human-vs-Human-Partie

### 4.1 Ziel

Nachweisen, dass zwei Menschen über privaten Link spielen können, ohne Regeln im Client auszulegen, ohne Hidden-Info-Leaks, mit Reconnect, Undo, Idempotency und Persistenz.

### 4.2 Setup

- Modus: Human vs Human private.
- Seed: `demo-multiplayer-001`.
- Browser A: Host, Runner.
- Browser B: Joiner, Corp.
- Zwei getrennte Browserkontexte verwenden, nicht nur zwei Tabs mit gleichem Storage.
- Debug-Full-State im Spielerclient deaktivieren.
- Optional lokales Server-Debug mit StateVersion/StateHash.

### 4.3 Match-Erstellung und Join

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 1 | Browser A erstellt Match als Runner | Host erhält Reconnect-Link und Invite-Link. |
| 2 | Browser A zeigt Waiting Lobby | Status `waiting_for_second_player`; Host-Seite Runner. |
| 3 | Browser B öffnet Invite-Link | Join-Info zeigt freie Seite Corp, keine privaten Daten. |
| 4 | Browser B tritt bei | Session für Corp wird erstellt; Match `ready` oder `active`. |
| 5 | Beide WebSockets verbinden | Beide erhalten `match_joined`. |
| 6 | Initiale StateUpdates | Runner sieht RunnerView, Corp sieht CorpView. |

Prüfen:

- Runner sieht keine Corp-HQ/R&D-Karten.
- Corp sieht keine Runner-Grip/Stack-Karten.
- Tokens erscheinen nicht im EventLog.

### 4.4 Grundaktionen

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 7 | Runner nimmt Credit | Beide Clients erhalten neue StateVersion; Credits korrekt. |
| 8 | Runner doppelklickt Credit-Action absichtlich | Nur eine Transition oder zweite Action stale/duplicate rejected. |
| 9 | Runner beendet Zug | Corp wird aktiv. |
| 10 | Corp spielt Simple Economy Operation | Corp erhält Credits; Karte nach Archives; Runner sieht keine restliche HQ. |
| 11 | Corp installiert ICE vor R&D | Runner sieht verdecktes ICE ohne Titel. |
| 12 | Corp beendet Zug | Runner wird aktiv. |

### 4.5 Run und ICE

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 13 | Runner installiert passenden Breaker | Rig sichtbar; Corp sieht installierte Karte, aber nicht Runner-Grip. |
| 14 | Runner startet Run auf R&D | RunState aktiv; beide sehen Zielserver. |
| 15 | Corp erhält Rez-Choice | Nur Corp sieht konkrete Rez-Option. Runner sieht Wartezustand. |
| 16 | Corp rezzt ICE | ICE wird öffentlich; Credits reduziert. |
| 17 | Runner erhält Breaker-Optionen | Nur Runner sieht eigene relevante LegalActions. |
| 18 | Runner pumpt/bricht Subroutine | Subroutine gebrochen; StateVersion aktualisiert. |
| 19 | Runner breached R&D | AccessState aktiv. |
| 20 | Runner accessed oberste R&D-Karte | Nur erlaubte Access-Karte wird sichtbar; nicht die restliche R&D-Reihenfolge. |

### 4.6 Reconnect während Entscheidung

Variante A: Reconnect während Corp-Rez-Choice.

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 21 | Neuen Run mit unrezzed ICE starten | Corp-Rez-Choice offen. |
| 22 | Corp-Browser WebSocket trennen | Runner sieht Gegner disconnected oder Wartezustand. |
| 23 | Corp reconnectet mit SessionToken | Corp erhält dieselbe Rez-Choice; Runner erhält keine ICE-Titel vor Rez. |

Variante B: Reconnect während Access.

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 24 | Runner erreicht Access auf Remote | AccessChoice offen. |
| 25 | Runner-Browser trennt Verbindung | Corp sieht Runner disconnected. |
| 26 | Runner reconnectet | Runner erhält gleiche Access-Choice; keine zusätzlichen Karten werden sichtbar. |

### 4.7 Undo vor Hidden Information

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 27 | Vor einem Access: Runner nimmt Credit | Event ist undo-fähig. |
| 28 | Runner fordert Undo bis vor Credit an | Corp erhält Anfrage. |
| 29 | Corp akzeptiert | State wird zurückgesetzt; neues Undo-Systemevent; Views aktualisiert. |
| 30 | Replay/StateHash prüfen | Wiederhergestellter State ist konsistent. |

### 4.8 Undo nach Hidden Information

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 31 | Runner accessed zufällige HQ-Karte oder oberste R&D-Karte | Hidden-Info-Barrier wird gesetzt. |
| 32 | Runner fordert Undo vor diesen Access an | Server blockiert Undo. |
| 33 | Beide Clients sehen generischen Grund | Keine konkrete Karte im Blockgrund. |

### 4.9 Persistenz und Recovery

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 34 | Während aktivem Match Server geordnet neu starten | Match wird aus Storage geladen oder pausiert. |
| 35 | Beide Clients reconnecten | Korrekte Views, LegalActions und PendingChoices werden wiederhergestellt. |
| 36 | EventLog replayen | Finaler StateHash stimmt. |

### 4.10 Spielende

| Schritt | Aktion | Erwartung |
|---:|---|---|
| 37 | Runner stiehlt oder Corp scored genug Agendas | Winner wird gesetzt. |
| 38 | Beide Clients erhalten Match-Ende | Keine normalen Actions mehr. |
| 39 | Replay exportieren | EventLog vollständig, gefilterte Sicht korrekt. |

## 5. Negative Tests während Demo

Diese Tests können manuell oder mit Hilfstools ausgeführt werden.

| Test | Erwartung |
|---|---|
| Falscher Join-Token | Generische Ablehnung, keine Matchdetails. |
| Runner sendet Corp-Action | Ablehnung `ACTION_WRONG_SIDE` oder `ACTION_NOT_LEGAL`. |
| Client manipuliert StateVersion nach unten | Ablehnung `ACTION_STALE_STATE_VERSION`. |
| Gleicher Idempotency-Key anderer Payload | Ablehnung. |
| WebSocket sendet Action vor Join | Ignorieren oder Auth-Fehler. |
| Replay im Player-Modus | Keine Full-State-Daten. |
| Browser DevTools prüft Payloads | Keine verbotenen Kartentitel/IDs/Tokens. |

## 6. Abschlussprotokoll

Für jede Demo festhalten:

```text
Datum:
Build/Commit:
EngineSchemaVersion:
ProtocolVersion:
Seed:
MatchId:
Final StateVersion:
Final StateHash:
Winner:
Replay erfolgreich: ja/nein
Visibility-Oracle bestanden: ja/nein
Offene Defects:
Go/No-Go:
```

## 7. Go/No-Go für Demo

Go, wenn:

- alle Pflichtschritte bestanden sind,
- keine P0/P1-Defects offen sind,
- keine Hidden-Info-Leaks beobachtet wurden,
- Replay den finalen StateHash reproduziert,
- Reconnect und Undo wie erwartet funktionieren.

No-Go, wenn:

- ein Client private Karten der Gegenseite sieht,
- doppelte Actions doppelte Transitions erzeugen,
- Reconnect falsche oder zusätzliche Informationen liefert,
- Undo nach Informationsgewinn möglich ist,
- Match nach Serverneustart inkonsistent ist,
- Replay nicht reproduzierbar ist.
