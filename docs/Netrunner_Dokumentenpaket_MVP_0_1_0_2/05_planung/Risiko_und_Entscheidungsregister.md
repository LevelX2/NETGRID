# Netrunner-Webapplikation – Risiko- und Entscheidungsregister

**Status:** Arbeitsfassung für laufende Pflege  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1, MVP 0.2 und unmittelbare Folgeschritte  
**Primäres Ziel:** Risiken, Gegenmaßnahmen, Architekturentscheidungen und offene Punkte nachvollziehbar machen

## 1. Zweck

Dieses Dokument bündelt Risiken und Entscheidungen, die für die Netrunner-Webapplikation relevant sind. Es ergänzt Konzept, MVP-Plan, Testkonzept und Spezifikationen. Es soll regelmäßig aktualisiert werden, sobald neue technische Erkenntnisse, Regelentscheidungen, Tests oder Fehler auftreten.

## 2. Bewertungsmodell

| Feld | Bedeutung |
|---|---|
| Eintritt | Niedrig, Mittel, Hoch |
| Auswirkung | Niedrig, Mittel, Hoch, Kritisch |
| Risikostufe | Beobachten, Aktiv behandeln, Release-blockierend |
| Owner | Verantwortlicher Bereich, nicht zwingend Person |
| Status | Offen, In Arbeit, Mitigiert, Akzeptiert, Erledigt |

Release-blockierend sind insbesondere P0-Hidden-Info-Leaks, nicht deterministische Engine-Transitions, nicht reproduzierbare Replays und Multiplayer-Konsistenzfehler.

## 3. Risikoübersicht

| ID | Risiko | Eintritt | Auswirkung | Stufe | Owner | Status |
|---|---|---|---|---|---|---|
| R-001 | Hidden-Info-Leak über PlayerView oder WebSocket | Mittel | Kritisch | Release-blockierend | Backend/Visibility | Offen |
| R-002 | UI interpretiert Regeln eigenständig und divergiert von Engine | Mittel | Hoch | Aktiv behandeln | Frontend/Engine | Offen |
| R-003 | Doppelte oder gleichzeitige Actions erzeugen doppelte Transitions | Mittel | Kritisch | Release-blockierend | Backend | Offen |
| R-004 | Reconnect liefert detailreichere Informationen als normales StateUpdate | Mittel | Kritisch | Release-blockierend | Backend/Visibility | Offen |
| R-005 | Undo nach verborgenem Informationsgewinn ermöglicht unfairen Rücksprung | Mittel | Kritisch | Release-blockierend | Engine/Backend | Offen |
| R-006 | EventLog/Replay reproduziert StateHash nicht | Mittel | Hoch | Aktiv behandeln | Engine | Offen |
| R-007 | Kartenimplementierungen enthalten Sonderlogik ohne Tests | Hoch | Hoch | Aktiv behandeln | Engine/Karten | Offen |
| R-008 | Scope wächst durch offiziellen Kartenpool zu früh | Hoch | Hoch | Aktiv behandeln | Planung | Offen |
| R-009 | SQLite/Storage wird zu spät integriert | Mittel | Hoch | Aktiv behandeln | Backend | Offen |
| R-010 | Tokens oder private Kartendaten landen in Logs | Mittel | Kritisch | Release-blockierend | Backend/Betrieb | Offen |
| R-011 | Regelvereinfachungen werden nicht dokumentiert | Mittel | Mittel | Aktiv behandeln | Engine/Dokumentation | Offen |
| R-012 | Testfixtures veralten gegenüber Implementierung | Mittel | Mittel | Beobachten | Tests | Offen |
| R-013 | WebSocket-Protokoll ändert sich ohne Versionierung | Mittel | Hoch | Aktiv behandeln | Backend/Frontend | Offen |
| R-014 | Full-State-Debug wird versehentlich für Spieler verfügbar | Niedrig | Kritisch | Release-blockierend | Frontend/Betrieb | Offen |
| R-015 | Demo-Decks enthalten nicht implementierte Karten | Niedrig | Hoch | Aktiv behandeln | Karten/Tests | Offen |
| R-016 | Serverneustart zerstört laufende Matches | Mittel | Hoch | Aktiv behandeln | Backend/Betrieb | Offen |
| R-017 | Fehlertexte leaken private Targets oder Kartentitel | Mittel | Hoch | Aktiv behandeln | Backend/Engine | Offen |
| R-018 | Zufall ist nicht reproduzierbar | Mittel | Hoch | Aktiv behandeln | Engine | Offen |
| R-019 | Mobile Layout blockiert Pflichtentscheidungen | Mittel | Mittel | Beobachten | Frontend | Offen |
| R-020 | Offizielle Assets/Lizenzen werden unklar genutzt | Niedrig | Hoch | Aktiv behandeln | Planung | Offen |

## 4. Detailrisiken und Gegenmaßnahmen

### R-001 Hidden-Info-Leak über PlayerView oder WebSocket

**Beschreibung:** Ein Client erhält Kartentitel, CardInstanceIds, Deckreihenfolge, Choices oder andere Daten, die nur der Gegenseite bekannt sein dürfen.

**Gegenmaßnahmen:**

- zentraler `buildPlayerView(state, side)`-Pfad,
- kein FullState in REST-/WebSocket-Antworten,
- Visibility-Oracle für alle ausgehenden Payloads,
- negative Golden Cases für HQ, R&D, Stack, Grip, unrezzed ICE,
- Debug-Modus getrennt von Spielerclient,
- Payload-Snapshots in CI prüfen.

**Release-Regel:** Bekannter P0-Leak blockiert jede Abnahme.

### R-002 UI interpretiert Regeln eigenständig

**Beschreibung:** Frontend baut Regeln nach, etwa ob ein ICE gebrochen werden kann, und weicht von Engine ab.

**Gegenmaßnahmen:**

- LegalActions als einzige Buttonquelle,
- UI validiert nur Formularvollständigkeit, keine Regelwahrheit,
- Contract-Tests für LegalActions,
- UI-Komponenten mit Fake-PlayerViews testen.

### R-003 Doppelte oder gleichzeitige Actions

**Beschreibung:** Doppelklick, Paketwiederholung oder zwei gleichzeitige WebSocket-Nachrichten führen zu mehreren Transitions oder inkonsistentem State.

**Gegenmaßnahmen:**

- `idempotencyKey` je Action,
- ActionReceipts persistieren,
- Per-Match-Lock oder transaktionale Queue,
- `clientKnownStateVersion` prüfen,
- Concurrency-Tests mit parallelen Submit-Versuchen.

### R-004 Reconnect leakt mehr als StateUpdate

**Beschreibung:** Bootstrap/Reconnect sendet vollständige Matchdaten oder zu detailreiche Events.

**Gegenmaßnahmen:**

- Reconnect nutzt denselben PlayerView-Filter wie WebSocket Updates,
- kein Sonderformat mit FullState,
- Reconnect-Payload in Visibility-Oracle aufnehmen,
- Reconnect-E2E während Run/Choice/Access.

### R-005 Undo nach Hidden Information

**Beschreibung:** Ein Spieler sieht verdeckte Information und kann danach Zustand zurücksetzen.

**Gegenmaßnahmen:**

- Hidden-Info-Barrier im EventLog markieren,
- Undo nur bis letzte sichere StateVersion,
- Zustimmung beider Seiten,
- generische Blockgründe ohne konkrete Kartendetails,
- Tests für HQ-/R&D-/Stack-/Grip-Informationsgewinn.

### R-006 Replay nicht reproduzierbar

**Beschreibung:** EventLog reicht nicht aus, um finalen StateHash wiederherzustellen.

**Gegenmaßnahmen:**

- RandomSeed und RandomCounter speichern,
- Events mit deterministischen Inputs versehen,
- StateHash nach jeder Transition,
- Snapshot plus EventLog-Suffix testen,
- Nonce/Time nicht in StateHash aufnehmen, sofern nicht Spielzustand.

### R-007 Karten ohne Tests

**Beschreibung:** Neue Karten verändern Spielzustand, Visibility oder Timing ohne Tests.

**Gegenmaßnahmen:**

- Manifest-Pflicht,
- Statusmodell (`playable_mvp`, `stub`, `not_implemented`),
- Unit-, Szenario-, Visibility- und Replay-Tests,
- Review-Checkliste pro Karte.

### R-008 Scope wächst zu früh

**Beschreibung:** Zusätzliche offizielle Karten, Tags, Damage, Traces oder Deckbau verzögern Kern-MVP.

**Gegenmaßnahmen:**

- Demo-Decks als feste Scope-Grenze,
- Nicht-Ziele dokumentieren,
- neue Mechanik nur mit expliziter Entscheidung,
- Testaufwand vor Aufnahme schätzen.

### R-009 Storage zu spät

**Beschreibung:** Multiplayer wird zunächst In-Memory gebaut und Reconnect/Undo/Replay werden später schwer integrierbar.

**Gegenmaßnahmen:**

- SQLite früh in MVP 0.2,
- Schema für Match, Session, Event, Snapshot, Receipt,
- Transaktionen für Action Pipeline,
- Migrationen minimal vorbereiten.

### R-010 Tokens/private Daten in Logs

**Beschreibung:** Logs enthalten InviteToken, SessionToken, HQ-Karten oder FullState.

**Gegenmaßnahmen:**

- Token nur gehasht speichern,
- Log-Scrubber,
- strukturierte Logs mit allowlist,
- Tests für Logausgaben,
- FullState nur lokale Debugdateien mit bewusstem Export.

## 5. Architekturentscheidungen

| ADR | Entscheidung | Status | Begründung | Konsequenz |
|---|---|---|---|---|
| ADR-001 | Rules Engine als reine TypeScript-Library | Beschlossen | Testbarkeit und klare Regelautorität | Keine React/WebSocket/DB-Abhängigkeiten in Engine. |
| ADR-002 | Serverautoritativer Multiplayer | Beschlossen | Hidden Info und Race Conditions brauchen zentrale Kontrolle | Clients senden nur Absichten. |
| ADR-003 | LegalActions als UI-/KI-Quelle | Beschlossen | Verhindert Regelduplikate | UI und KI dürfen keine eigenen Legalitätsregeln bauen. |
| ADR-004 | Feste Demo-Decks für MVP | Beschlossen | Scope-Reduktion | Kein freier Deckbau in 0.1/0.2. |
| ADR-005 | SQLite als bevorzugter Storage für MVP 0.2 | Beschlossen | Transaktional, lokal, einfach | JSON nur Dev/Debug. |
| ADR-006 | EventLog plus StateHash | Beschlossen | Replay und Debugging | Jede Transition muss Events und Hash erzeugen. |
| ADR-007 | Seitenspezifische PlayerViews | Beschlossen | Hidden-Info-Schutz | Kein FullState an normale Clients. |
| ADR-008 | WebSocket für laufende Partie | Beschlossen | Bidirektionale Updates und Choices | REST nur Setup/Bootstrap/Export. |
| ADR-009 | Undo konservativ mit Hidden-Info-Barrier | Beschlossen | Fairness über Komfort | Undo wird häufig blockiert, wenn Information gesehen wurde. |
| ADR-010 | Keine öffentlichen Plattformfunktionen in MVP 0.2 | Beschlossen | Scope und Sicherheit | Private Links statt Accounts/Matchmaking. |
| ADR-011 | Offizielle Regeln als Referenz, aber MVP-Ausschnitt | Beschlossen | Vollständige Regeln zu groß für MVP | Vereinfachungen müssen dokumentiert sein. |
| ADR-012 | Debug-FullState nicht im Spielerclient | Beschlossen | Leak-Vermeidung | Lokales/serverseitiges Debugging getrennt. |

## 6. Offene Entscheidungen

| OID | Entscheidung | Optionen | Kriterium | Frist/Phase |
|---|---|---|---|---|
| O-001 | WebSocket-Bibliothek | native `ws`, Socket.io | Protokollklarheit, Reconnect-Unterstützung, Einfachheit | Beginn MVP 0.2 |
| O-002 | Paketmanager | npm, pnpm, yarn | Monorepo-Komfort, CI, Teampräferenz | Projektsetup |
| O-003 | ORM/DB-Zugriff | Prisma, Kysely, Drizzle, direkter sqlite client | Migrationen, Typisierung, Einfachheit | Storage-Start |
| O-004 | Snapshot-Intervall | jedes Event, alle N Events, manuell | Performance vs Recovery | MVP 0.2 Storage |
| O-005 | UI-Routenstruktur | Next.js App Router, Pages, andere | Projektstruktur | Frontend-Setup |
| O-006 | Replay-Exportformat | JSON, NDJSON, Debug Bundle | Reproduzierbarkeit, Datenschutz | Test/Debug-Phase |
| O-007 | Docker als Pflicht oder optional | Pflicht, optional | Betriebsziel | Vor privater Serverdemo |
| O-008 | Undo-Zeitfenster | kein Zeitlimit, kurzes Zeitlimit, nur letzter Schritt | Bedienbarkeit vs Fairness | Undo-Implementierung |
| O-009 | Handling abgebrochener Matches | pausieren, abbrechen, Timeout | Private Nutzung | Betriebskonzept |
| O-010 | Ausweitung Kartenpool nach 0.2 | weitere Demo-Karten, beschränkter offizieller Pool | Testaufwand, Regelmechaniken | Post-MVP |

## 7. Bekannte Vereinfachungen

| Bereich | Vereinfachung | Risiko | Dokumentationspflicht |
|---|---|---|---|
| Kartenpool | Nur Demo-Karten | Geringe Spieltiefe | Manifest und Testdeck. |
| Identitäten | Deaktiviert oder minimal | Keine echten Deckstrategien | Kartenleitfaden. |
| Tags/Traces/Viruses/Damage | Nicht im MVP | Regelabdeckung begrenzt | Rules-Engine-Spezifikation. |
| Hosting | Nicht im MVP | Viele Karten nicht abbildbar | Backlog. |
| Multiaccess | Nicht im MVP | Runs vereinfacht | Rules-Engine-Spezifikation. |
| Replacement Effects | Nicht im MVP | Timing begrenzt | Backlog. |
| Öffentliche Plattform | Nicht im MVP | Nur private Nutzung | Betriebskonzept. |

## 8. Entscheidungsprozess

Neue Architekturentscheidungen werden als ADR ergänzt, wenn mindestens eine Bedingung erfüllt ist:

- Änderung betrifft Engine-API,
- Änderung betrifft PlayerView oder Visibility,
- Änderung betrifft Persistenzschema,
- Änderung betrifft WebSocket-/REST-Protokoll,
- Änderung betrifft Undo oder Reconnect,
- Änderung erweitert Kartenpool oder Regelumfang,
- Änderung hat Sicherheits- oder Betriebsfolgen.

Minimalformat:

```text
ADR-ID:
Titel:
Status: Vorgeschlagen/Beschlossen/Ersetzt/Verworfen
Kontext:
Entscheidung:
Alternativen:
Begründung:
Konsequenzen:
Betroffene Dokumente:
Betroffene Tests:
```

## 9. Release-Blocker

Ein Release oder eine MVP-Abnahme ist zu blockieren bei:

- bekanntem Hidden-Info-Leak,
- WebSocket-/Reconnect-Payload mit FullState,
- Token im Log oder Clientpayload,
- nicht serialisierter Action Pipeline,
- doppelten Transitions durch Idempotency-Fehler,
- Replay-StateHash-Divergenz in Kernscenario,
- Undo nach Hidden-Info-Barrier,
- Demo-Deck mit nicht implementierter Pflichtkarte,
- Engine-Regeländerung ohne aktualisierte Tests.

## 10. Regelmäßige Review-Fragen

Vor jedem Meilenstein:

1. Gibt es neue private Informationen, die gefiltert werden müssen?
2. Haben neue Cards/Actions eigene Visibility-Tests?
3. Hat sich ein Payload-Schema geändert?
4. Müssen EventLog, StateHash oder Replay angepasst werden?
5. Ist eine neue Hidden-Info-Barrier entstanden?
6. Gibt es neue Race Conditions?
7. Sind Fehlertexte weiterhin generisch genug?
8. Wurde Scope unbeabsichtigt erweitert?
9. Sind die Nicht-Ziele noch gültig?
10. Sind offene ADRs releasekritisch?

## 11. Pflegezustand

Dieses Register ist kein statisches Abschlussdokument. Es soll bei jeder relevanten Änderung am Konzept, Testkonzept, API-Protokoll, Datenmodell, Kartenpool oder Betriebsmodell aktualisiert werden. Ein veraltetes Risiko- und Entscheidungsregister ist selbst ein Projektrisiko.
