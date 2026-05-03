# Netrunner-Webapplikation – Backlog und Roadmap

**Status:** Arbeits- und Priorisierungsdokument  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1, MVP 0.2 und Folgeschritte  
**Primäres Ziel:** klare Reihenfolge der Arbeitspakete und bewusste Scope-Kontrolle

## 1. Zweck

Dieses Dokument ordnet die Arbeitspakete aus Konzept, MVP-0.2-Plan, Testkonzept und ergänzenden Spezifikationen in eine umsetzbare Roadmap. Es trennt Muss-, Soll- und spätere Themen und verhindert, dass Multiplayer-, Kartenpool- und Plattformfunktionen den MVP-Scope verwässern.

## 2. Leitprinzipien für Priorisierung

1. Erst Regelautorität und deterministische Engine, dann UI-Komfort.
2. Erst Visibility-Sicherheit, dann zusätzliche Features.
3. Erst Demo-Decks stabilisieren, dann Kartenpool erweitern.
4. Erst private Partien, dann öffentliche Plattformfunktionen.
5. Erst Reproduzierbarkeit über EventLog/StateHash, dann komplexe Betriebsfunktionen.
6. Freier Deckbau ist kein MVP-0.1/0.2-Ziel.
7. Jede neue Karte erhöht Testlast und wird nur aufgenommen, wenn Tests vorhanden sind.

## 3. Prioritätsklassen

| Klasse | Bedeutung | Entscheidung |
|---|---|---|
| P0 | Blockiert MVP oder erzeugt Hidden-Info-/Konsistenzrisiko | Sofort bearbeiten, kein Release. |
| P1 | Kernfunktion für MVP-Ziel | Vor MVP-Abnahme erforderlich. |
| P2 | Wichtig für Bedienbarkeit oder Robustheit | Nach P1, vor breiter Demo wünschenswert. |
| P3 | Komfort, polish, spätere Erweiterung | Nach MVP oder optional. |
| Out of Scope | Nicht für aktuellen Scope | Nicht einplanen, außer explizite Scope-Änderung. |

## 4. Roadmap-Übersicht

| Phase | Ziel | Ergebnis |
|---|---|---|
| 0.1-A | Engine-Grundmodell | GameState, Zonen, Karteninstanzen, Phasen, LegalActions. |
| 0.1-B | Demo-Karten und lokale Partie | Feste Decks, Runner gegen einfache Corp-KI. |
| 0.1-C | Run-/Access-Kern | Runs, ICE, Breaker, Agenda-Steal/Score. |
| 0.1-D | Determinismus und Tests | EventLog, Replay, StateHash, Visibility-Basistests. |
| 0.2-A | Match-Server und Storage | Private Matches, Sessions, SQLite, Snapshots. |
| 0.2-B | REST und WebSocket | Join, StateUpdate, LegalActions, Action Submit. |
| 0.2-C | PlayerViews und Security | Seitenspezifische Filter, Tokenmodell, Leak-Tests. |
| 0.2-D | Multiplayer-Flows | Reconnect, Undo, Concurrency, Demo-Abnahme. |
| 0.3+ | Erweiterungen | Mehr Karten, bessere UI, optionale Plattformfunktionen. |

## 5. MVP 0.1 – Backlog

### 5.1 Engine-Basis

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.1-E01 | P1 | `GameState` mit Runner/Corp, Zonen, Clicks, Credits, Scores | Initialer State reproduzierbar erzeugbar. |
| 0.1-E02 | P1 | `CardDefinition` und `CardInstance` trennen | Jede Karte hat stabile Definition und eindeutige Instanz. |
| 0.1-E03 | P1 | Zonenmodell für HQ, R&D, Archives, Stack, Grip, Heap, Rig, Servers | Karten liegen eindeutig in genau einer Zone. |
| 0.1-E04 | P1 | LegalAction-Generator | UI/KI kann vollständige legale Actions abfragen. |
| 0.1-E05 | P1 | `applyAction` mit Validierung | Illegale Actions werden engine-seitig abgelehnt. |
| 0.1-E06 | P1 | EventLog und StateVersion | Jede erfolgreiche Transition erzeugt Event und Version. |
| 0.1-E07 | P1 | Deterministischer Random-Adapter | Ziehen und zufällige Auswahl sind reproduzierbar. |
| 0.1-E08 | P2 | StateHash | Replay kann Divergenzen erkennen. |

### 5.2 Spielablauf

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.1-R01 | P1 | Grundphasen und Click-Actions | Runner/Corp können Grundaktionen ausführen. |
| 0.1-R02 | P1 | Install/Play/Rez einfacher Karten | Demo-Karten bewegen sich korrekt zwischen Zonen. |
| 0.1-R03 | P1 | Run initiieren | Runner kann zentralen oder Remote-Server anlaufen. |
| 0.1-R04 | P1 | ICE approach/encounter | Corp kann ICE rezzen, Runner kann begegnen. |
| 0.1-R05 | P1 | Breaker vs ICE | Breaker können passende Subroutines brechen. |
| 0.1-R06 | P1 | Access Agenda | Runner kann Agenda stehlen. |
| 0.1-R07 | P1 | Corp Score Agenda | Corp kann Agenda nach Voraussetzung scoren. |
| 0.1-R08 | P2 | Run-Ende und Eventtexte | Outcome ist im EventLog nachvollziehbar. |

### 5.3 Demo-Karten und Decks

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.1-C01 | P1 | Runner Demo Deck implementieren | Deckvalidierung besteht. |
| 0.1-C02 | P1 | Corp Demo Deck implementieren | Deckvalidierung besteht. |
| 0.1-C03 | P1 | Simple Economy Event/Operation | Credits ändern sich korrekt. |
| 0.1-C04 | P1 | Simple Agenda | Steal/Score funktioniert. |
| 0.1-C05 | P1 | Simple Barrier/Code Gate/Sentry ICE | Subroutines und Rez-Kosten funktionieren. |
| 0.1-C06 | P1 | Simple Fracter/Decoder/Killer | Nur passende ICE-Typen werden gebrochen. |
| 0.1-C07 | P2 | Manifest mit Statusmodell | Kein Deck nutzt `not_implemented` Karten. |

### 5.4 KI und UI

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.1-AI01 | P1 | Einfache Corp-KI | KI wählt nur LegalActions. |
| 0.1-UI01 | P1 | Game Board Grundansicht | Runner kann Spiel bedienen. |
| 0.1-UI02 | P1 | LegalActions-Panel | Buttons entsprechen Engine-Output. |
| 0.1-UI03 | P2 | EventLog-Anzeige | Spielverlauf nachvollziehbar. |
| 0.1-UI04 | P2 | Lokales Debug Panel | StateVersion/StateHash sichtbar, ohne normale Sichtregeln zu brechen. |

### 5.5 Tests

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.1-T01 | P1 | Unit-Tests Engine | Kernaktionen bestehen. |
| 0.1-T02 | P1 | Szenariotests Demo-Spiel | Spiel kann bis Score/Steal laufen. |
| 0.1-T03 | P1 | Visibility-Basistests | Keine privaten Gegenseitendaten in PlayerViews. |
| 0.1-T04 | P2 | Replay-Tests | EventLog reproduziert StateHash. |
| 0.1-T05 | P2 | Golden Fixtures | Regressionsbasis für spätere Änderungen. |

## 6. MVP 0.2 – Backlog

### 6.1 Match-Server und Storage

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.2-S01 | P1 | Match-Erstellung über REST | Host erhält Session und Invite-Link. |
| 0.2-S02 | P1 | Session- und Tokenmodell | SideToken/SessionToken werden gehasht gespeichert. |
| 0.2-S03 | P1 | SQLite-Schema | Match, Sessions, Events, Snapshots, Receipts persistiert. |
| 0.2-S04 | P1 | Per-Match-Lock | Gleichzeitige Actions werden serialisiert. |
| 0.2-S05 | P1 | Idempotency Receipts | Doppelte Sendungen erzeugen keine doppelte Transition. |
| 0.2-S06 | P2 | Snapshot-Strategie | Recovery und Replay sind performant genug. |
| 0.2-S07 | P2 | Migration-Grundgerüst | SchemaVersion wird verwaltet. |

### 6.2 REST und WebSocket

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.2-P01 | P1 | REST `POST /api/matches` | Match creation getestet. |
| 0.2-P02 | P1 | REST Join/Bootstrap | Gast kann beitreten, falscher Token leakt nichts. |
| 0.2-P03 | P1 | WebSocket `join_match` | Verbindung wird seitenspezifisch authentifiziert. |
| 0.2-P04 | P1 | WebSocket `submit_action` | Actions erreichen Engine und erzeugen Updates. |
| 0.2-P05 | P1 | StateUpdate/LegalActions Events | Beide Clients werden korrekt aktualisiert. |
| 0.2-P06 | P2 | Heartbeat/Ping | Disconnected-Status wird zuverlässig erkannt. |
| 0.2-P07 | P2 | Protokollversionierung | Inkompatible Clients werden sauber abgelehnt. |

### 6.3 Visibility und Security

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.2-V01 | P0 | Zentraler PlayerView-Filter | Kein Endpoint sendet FullState an Spieler. |
| 0.2-V02 | P0 | WebSocket-Visibility-Oracle | Alle ausgehenden Payloads geprüft. |
| 0.2-V03 | P1 | Fehlerhygiene | Errors enthalten keine privaten Details. |
| 0.2-V04 | P1 | Logging-Regeln | Logs enthalten keine Tokens/Kartendetails. |
| 0.2-V05 | P1 | Debugzugriff einschränken | FullState nur lokal/serverseitig. |
| 0.2-V06 | P1 | Reconnect-Visibility | Reconnect nicht detailreicher als normales Update. |
| 0.2-V07 | P1 | Undo-Visibility | Blockgründe ohne private Details. |

### 6.4 Multiplayer-Flows

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.2-M01 | P1 | Zwei Spieler verbinden | Beide erhalten korrekte PlayerView. |
| 0.2-M02 | P1 | Turn-/Priority-/Choice-Sync | Nur zuständige Seite kann entscheiden. |
| 0.2-M03 | P1 | Reconnect | Reload während Choice/Run/Access funktioniert. |
| 0.2-M04 | P1 | Undo vor Hidden-Info-Barrier | Anfrage, Zustimmung, Rollback funktionieren. |
| 0.2-M05 | P1 | Undo nach Barrier blockieren | Keine Rücknahme nach Informationsgewinn. |
| 0.2-M06 | P2 | Connection-Status UI | Gegnerstatus ist klar sichtbar. |
| 0.2-M07 | P2 | Recovery nach Serverneustart | Match kann weitergeführt oder kontrolliert pausiert werden. |

### 6.5 Betriebsfähigkeit

| ID | Priorität | Arbeitspaket | Abnahmekriterium |
|---|---:|---|---|
| 0.2-B01 | P1 | `.env`-Konfiguration | Secrets und Ports konfigurierbar. |
| 0.2-B02 | P1 | Docker- oder reproduzierbarer Start | Privater Server startbar. |
| 0.2-B03 | P1 | Backup-Hinweis für SQLite | Daten können gesichert werden. |
| 0.2-B04 | P2 | Healthcheck | Serverstatus prüfbar. |
| 0.2-B05 | P2 | Rollback-Anleitung | Vor Release dokumentiert. |

## 7. Abhängigkeiten

| Von | Abhängig von | Grund |
|---|---|---|
| WebSocket Action Submit | Engine `applyAction` und LegalActions | Server muss Actions validieren können. |
| PlayerView | Zonenmodell und Visibility-Regeln | Filter braucht stabile State-Struktur. |
| Reconnect | Persistenz und Sessions | Zustand muss wiederherstellbar sein. |
| Undo | EventLog, Snapshot, Hidden-Info-Barrier | Rollback braucht stabile Historie. |
| Multiplayer-E2E | REST, WebSocket, Storage, UI | Voller Flow ist integrationsabhängig. |
| Kartenpool-Erweiterung | Manifest und Kartentests | Sonst steigt Regressionsrisiko stark. |

## 8. Nicht-Ziele für MVP 0.1/0.2

Nicht einplanen:

- freier Deckbau,
- vollständiger offizieller Kartenpool,
- Nutzerkonten,
- Matchmaking,
- öffentliche Matchliste,
- Rangliste,
- Turniermodus,
- Zuschauer,
- Chat,
- Mobile-first-Layout,
- hochverfügbare Infrastruktur,
- horizontale Skalierung,
- vollständige Implementierung aller Comprehensive-Rules-Sonderfälle,
- Tags, Traces, Viruses, Damage, Hosting, Multiaccess, Bypass und komplexe Replacement Effects, solange sie nicht explizit für spätere Version freigegeben werden.

## 9. Erweiterungsroadmap nach MVP 0.2

Aktueller konsolidierter Stand: `docs/derived/POST_MVP_0.2_ROADMAP.md` ist die führende abgeleitete Roadmap für die Zeit nach MVP 0.2. Die frühere Idee, V0.3 direkt als Kartenpool- und Regelbreite-Stufe zu führen, wurde nach dem MVP-0.2-Finalstand umsortiert.

Begründung: Vor einer Kartenpool-Erweiterung soll V0.3 zuerst KI-vs-KI, Runner-KI, verbesserte Corp-KI, Erklärmodus und Simulationstests liefern. Dadurch entsteht eine stärkere Regressionsbasis für neue Karten und Mechaniken.

### 9.1 MVP 0.3 – KI und Simulation

Mögliche Themen:

- side-neutrales AI-Input-Modell,
- Controller-Abstraktion für Human, KI und Replay,
- Runner-KI,
- verbesserte Corp-KI,
- KI-vs-KI-Simulationen,
- Erklärmodus für KI-Entscheidungen,
- Simulationstests mit Seed, Replay und StateHash,
- AI-Visibility-Tests für Inputs, Erklärungen, Logs und Fehler.

Voraussetzung: Die KI darf nur PlayerViews, LegalActions, side-gefilterte Events und explizit erlaubte Metadaten verwenden. Kein FullState und keine gegnerischen verdeckten Informationen.

### 9.2 MVP 0.4 – Kartenpool und Regelbreite

Der detaillierte V0.4-Plan liegt in `docs/derived/MVP_0.4_DETAILED_PLAN.md`.

Mögliche Themen:

- zusätzliche Basisaktionen,
- weitere ICE-/Breaker-Varianten,
- einfache Assets/Upgrades,
- Tags und einfache Tag-Strafen,
- einfache Damage-Regeln,
- größere Demo-Decks,
- Deckvalidierung mit eingeschränktem Kartenpool.

Voraussetzung: Kartenimplementierungsleitfaden, Testmatrix und KI-/Simulation-Regressionsharness werden eingehalten.

Planungsentscheidung:

- Zuerst Safe Card Batch und eingeschränkte Deckvalidierung.
- Danach Tags als erste neue Regelgruppe.
- Damage nur als eigenes Teilgate oder V0.4.x.

### 9.3 MVP 0.5 – Komfort und Stabilität

Mögliche Themen:

- verbesserte Board-Visualisierung,
- bessere Replay-UI,
- Save/Resume im UI,
- bessere Error-Benachrichtigung,
- Bedienhilfen für Run-Flow,
- Keyboard Shortcuts,
- verbesserte Mobile-Tauglichkeit.

### 9.4 MVP 0.6+ – Kuratierte Lern-Decks, privater Betrieb und Plattformoptionen

Nur nach expliziter Scope-Entscheidung:

- kuratierte Lern-Decks,
- eingeschränkte lokale Deckvalidierung,
- SQLite-/Storage-Härtung,
- private Deployment-Härtung,
- Nutzerkonten,
- Freundeslinks,
- Match-Historie,
- öffentliche Lobbies,
- Zuschauer mit strenger Visibility,
- Chat,
- Moderation,
- Missbrauchsschutz,
- Skalierung.

## 10. Release Gates

### 10.1 MVP 0.1 Gate

MVP 0.1 darf als abgeschlossen gelten, wenn:

- lokale Runner-vs-Corp-KI-Partie spielbar ist,
- Demo-Decks validiert sind,
- Run/Encounter/Access/Score für Demo-Fälle funktionieren,
- LegalActions vollständig genutzt werden,
- Engine- und Szenariotests bestehen,
- PlayerViews keine privaten Gegenseitendaten enthalten,
- Replay/StateHash mindestens für zentrale Szenarien besteht.

### 10.2 MVP 0.2 Gate

MVP 0.2 darf als abgeschlossen gelten, wenn:

- private Human-vs-Human-Partie über Invite-Link spielbar ist,
- beide Seiten über WebSocket synchronisiert werden,
- Reconnect in kritischen Zuständen funktioniert,
- Undo vor Hidden-Info-Barrier funktioniert und danach blockiert wird,
- Storage, EventLog und Snapshots konsistent sind,
- Concurrency/Idempotency-Tests bestehen,
- alle Visibility-Gates für REST, WebSocket, Reconnect, Undo, Errors und Logs bestehen,
- Abnahmekatalog und Demo-Testskript erfolgreich durchgeführt wurden.

## 11. Backlog-Pflege

Jedes neue Ticket soll mindestens enthalten:

```text
Titel:
Priorität:
Phase:
Betroffener Bereich:
Beschreibung:
Akzeptanzkriterien:
Visibility-Auswirkung: ja/nein
Replay-/StateHash-Auswirkung: ja/nein
API-/Schema-Auswirkung: ja/nein
Testpflicht:
Abhängigkeiten:
Nicht-Ziele:
```

Tickets mit Visibility-, API- oder Schema-Auswirkung dürfen nicht nur im Code umgesetzt werden. Die zugehörigen Spezifikationen und Tests müssen angepasst werden.
