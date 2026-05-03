# Conflict Matrix MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03

## Konflikte und Auflösungen

| ID | Thema | Quelle A | Quelle B | Auflösung für MVP 0.1 | Status |
|---|---|---|---|---|---|
| CM-001 | Siegpunktwert | Comprehensive Rules: üblicher Sieg bei 7 Agenda Points. | Demo-Deck: 3 Agendas zu je 2 Punkten, also 6 Punkte. | Demo-Partien verwenden `agendaPointsToWin = 6`; als DEV-010 und OQ-001 dokumentiert. | Gelöst |
| CM-002 | Decklegalität | Comprehensive Rules: Mindestgröße, Einfluss, Agenda-Dichte. | MVP-Konzept: feste interne Demo-Decks, nicht turnierlegal. | Keine Deckbuilding-Prüfung in MVP 0.1; DEV-001. | Gelöst |
| CM-003 | Vollständige Timingfenster | Comprehensive Rules: umfangreiche Paid-/Trigger-/Priority-Strukturen. | MVP-Konzept: TimingPointIds vorbereiten, viele Fenster leer. | Struktur modellieren, nur demo-relevante Actions anbieten; DEV-005/DEV-006. | Gelöst |
| CM-004 | Identitätsfähigkeiten | Regeln erlauben Setup-/Startfähigkeiten. | Demo-Identitäten ohne aktive Ability. | Identitäten sichtbar, Fähigkeiten deaktiviert; DEV-003. | Gelöst |
| CM-005 | Damage/Tags/Trace | Offizielle Regeln enthalten komplexe Mechaniken. | Demo-Sentry nutzt Credit Loss statt Damage/Tags. | Damage/Tags/Trace nicht implementieren; DEV-007. | Gelöst |
| CM-006 | Archives-Facedown-Komplexität | Comprehensive Rules haben differenzierte Archives-Sicht. | MVP-Konzept verlangt nur Kern-Access/Visibility. | Side-sicheres MVP-Archives ohne Spezialkarten; DEV-013/OQ-004. | Gelöst |
| CM-007 | Multiplayer-Vorbereitung | 0.2-Plan verlangt Tokens, WebSocket, Reconnect, Undo. | 0.1-Scope verbietet Multiplayer. | 0.1 modelliert API/Views/EventLog zukunftskompatibel, baut aber keinen Multiplayer. | Gelöst |
| CM-008 | UI-Debug vs Hidden Info | Entwickler braucht Debug/Replay. | Hidden-Info-Gate verbietet Leaks. | Spieler-Debug side-gefiltert; Full-State nur lokal/serverintern. | Gelöst |

