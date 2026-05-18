# NETGRID-Webapplikation – Ergänzendes Dokumentenpaket

**Status:** verbindliche Arbeitsfassung für Planung und Umsetzung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 und MVP 0.2  
**Dokumenttyp:** Index und Navigationsdokument

Dieses Dokumentenpaket ergänzt das konsolidierte MVP-0.1-Konzept, den MVP-0.2-Plan und das detaillierte Testkonzept. Es trennt die bisher gemischten Themen in spezialisierte Arbeitsdokumente, damit Implementierung, Tests, Betrieb und Planung konsistent erfolgen können.

## 1. Referenzbasis

Die Dokumente beziehen sich auf folgende vorhandene Arbeitsgrundlagen:

- `docs/source/NETGRID_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
- `docs/source/NETGRID_MVP_0.2_Plan.md`
- `docs/NETGRID_Detailliertes_Testkonzept_MVP_0_1_0_2.md`
- `docs/source/Erstes Testdeck.txt`
- `docs/source/Null_Signal_Games_NETGRID_Comprehensive_Rules_v26.03.pdf`

Die Comprehensive Rules v26.03 werden als Regelreferenz verwendet. Der MVP bildet daraus bewusst nur einen kleinen, dokumentierten Ausschnitt ab. Die internen Demo-Karten sind technische Testkarten und keine offiziellen, turnierlegalen Decklisten.

## 2. Dokumentenstruktur

```text
NETGRID_Dokumentenpaket/
  README_Dokumentenpaket.md

  02_spezifikationen/
    Architekturkonzept.md
    API_und_WebSocket_Spezifikation.md
    Datenmodell_und_Persistenz.md
    Visibility_und_Security_Konzept.md
    Rules_Engine_Spezifikation.md
    Kartenimplementierungsleitfaden.md
    UX_Flow_Spezifikation.md

  03_tests/
    Abnahmekatalog.md
    Demo_Testskript.md

  04_betrieb/
    Developer_Setup.md
    Deployment_Handbuch.md
    Debugging_und_Replay_Handbuch.md

  05_planung/
    Backlog_und_Roadmap.md
    Risiko_und_Entscheidungsregister.md
```

## 3. Dokumente und Zweck

| Dokument | Zweck | Primäre Nutzer |
|---|---|---|
| `Architekturkonzept.md` | Schichten, Modulgrenzen, Datenflüsse, Serverautorität, technische Entscheidungen | Entwicklung, Architektur, Review |
| `API_und_WebSocket_Spezifikation.md` | Verbindliche REST- und WebSocket-Verträge für MVP 0.2 | Backend, Frontend, Tests |
| `Datenmodell_und_Persistenz.md` | Domänenmodell, SQLite-Schema, Snapshots, EventLog, Recovery, Migration | Backend, Engine, Tests |
| `Visibility_und_Security_Konzept.md` | Hidden-Info-Schutz, Tokenmodell, Logging, Debug-Grenzen, Leak-Regeln | Backend, Frontend, Tests, Betrieb |
| `Rules_Engine_Spezifikation.md` | Unterstützter Regelausschnitt, Engine-API, Phasen, Actions, Runs, Access | Engine, Tests |
| `Kartenimplementierungsleitfaden.md` | Vorgehen für neue Karten, Manifest, Statusmodell, Testpflichten | Engine, Kartenentwicklung, Tests |
| `UX_Flow_Spezifikation.md` | Screens, Zustände, Interaktionsregeln, Reconnect-, Undo- und Choice-Flows | Frontend, UX, Tests |
| `Abnahmekatalog.md` | Prüfbasis für MVP-0.1- und MVP-0.2-Abnahme | Product, Entwicklung, Tests |
| `Demo_Testskript.md` | Manuelles Demo- und Regressionsskript für Beispielpartien | Entwicklung, Abnahme, Debugging |
| `Developer_Setup.md` | Soll-Anleitung für lokale Entwicklung und Testausführung | Entwicklung |
| `Deployment_Handbuch.md` | Privater Betrieb, Konfiguration, TLS/WSS, Backup, Rollback | Betrieb, Entwicklung |
| `Debugging_und_Replay_Handbuch.md` | Fehleranalyse über EventLog, Replay, StateHash und Payloads | Entwicklung, Tests |
| `Backlog_und_Roadmap.md` | Arbeitspakete, Reihenfolge, Prioritäten, Nicht-Ziele | Planung, Entwicklung |
| `Risiko_und_Entscheidungsregister.md` | Risiken, Gegenmaßnahmen, Architekturentscheidungen, offene Punkte | Planung, Review |

## 4. Verbindliche Querschnittsentscheidungen

Die folgenden Entscheidungen gelten dokumentübergreifend:

1. Die Rules Engine ist die alleinige Regelautorität.
2. Clients senden Absichten, niemals Zustandsänderungen.
3. Der vollständige GameState bleibt serverseitig oder in lokaler Debugumgebung.
4. Alle Clientausgaben sind seitenspezifisch gefiltert.
5. Jede erfolgreiche Engine-Transition erzeugt Event, StateVersion und StateHash.
6. Zufall wird über Seed, Counter und RandomDrawRecords reproduzierbar gemacht.
7. MVP 0.1 nutzt feste Demo-Decks und eine einfache Corp-KI.
8. MVP 0.2 ergänzt Human-vs-Human über privaten Link, WebSocket, Reconnect, Undo und Persistenz.
9. Freier Deckbau, öffentliche Plattformfunktionen, Matchmaking, Ranglisten und breiter Kartenpool bleiben außerhalb von MVP 0.1/0.2.
10. Jede neue Karte benötigt Manifest-Eintrag, Implementierungsstatus und Tests.

## 5. Reihenfolge der Nutzung

Für Implementierungsarbeit empfiehlt sich folgende Reihenfolge:

1. `Architekturkonzept.md` lesen, um Modulgrenzen und Verantwortlichkeiten festzulegen.
2. `Rules_Engine_Spezifikation.md` und `Kartenimplementierungsleitfaden.md` für Engine- und Kartenarbeit verwenden.
3. `Datenmodell_und_Persistenz.md` für Backend, Storage und Recovery verwenden.
4. `API_und_WebSocket_Spezifikation.md` als Vertrag zwischen Backend und Frontend verwenden.
5. `Visibility_und_Security_Konzept.md` als verpflichtendes Gate für alle ausgehenden Daten verwenden.
6. `UX_Flow_Spezifikation.md` für Frontend-Zustände und Interaktionslogik verwenden.
7. `Abnahmekatalog.md` und `Demo_Testskript.md` für manuelle und automatisierte Abnahme verwenden.
8. `Developer_Setup.md`, `Deployment_Handbuch.md` und `Debugging_und_Replay_Handbuch.md` für Betrieb und Fehlersuche verwenden.
9. `Backlog_und_Roadmap.md` und `Risiko_und_Entscheidungsregister.md` fortlaufend pflegen.

## 6. Pflegekonvention

Bei Änderungen an einem Dokument ist zu prüfen, ob abhängige Dokumente angepasst werden müssen. Besonders kritisch sind Änderungen an:

- `PlayerAction`, `LegalAction`, `ChoiceRequest`
- `PlayerView`
- WebSocket-Message-Typen
- EventLog- und StateHash-Schema
- Token-, Session- und Reconnect-Regeln
- Hidden-Info-Barrier für Undo
- Demo-Karten und CardImplementation-Manifest

Änderungen an diesen Bereichen dürfen nicht nur lokal im Code erfolgen. Sie müssen in Spezifikation, Testkonzept und gegebenenfalls Abnahmekatalog nachgezogen werden.
