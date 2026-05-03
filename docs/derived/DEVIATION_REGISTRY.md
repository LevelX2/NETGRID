# Deviation Registry MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03  
Maschinenlesbar: `data/deviations/rule-deviations.json`

## Abweichungen

| ID | Bereich | Offizielle Referenz | MVP-Verhalten | Grund | Tests |
|---|---|---|---|---|---|
| DEV-001 | Deckbuilding | CR 1.4 | Keine freie Deckwahl, keine Format-, Einfluss-, Mindestgröße- oder Agenda-Dichte-Prüfung. | Feste Demo-Decks sind kontrollierte Testartefakte. | T-BASE-001, T-SETUP-001 |
| DEV-002 | Kartenpool | CR 1.8, 3 | Nur interne Demo-Karten mit Manifeststatus `playable_mvp`. | Scope klein halten, keine offiziellen Daten/Assets. | T-CARD-000 |
| DEV-003 | Identitäten | CR 1.5, 3.1 | Demo-Identitäten sind sichtbar, aber ohne aktive Fähigkeit. | Keine Identitäts-Sonderregeln im Demo-Pool. | T-CARD-RUN-000, T-CARD-CORP-000 |
| DEV-004 | Mulligan | CR 1.6.6a | Kein Mulligan in MVP 0.1. | Nicht nötig für deterministische Demo-Szenarien. | T-SETUP-001 |
| DEV-005 | Timingfenster | CR 5, 6, 9, 11 | TimingPointIds existieren; viele Paid-Ability-/Triggerfenster bieten keine Actions. | Struktur vorbereiten, Kartenpool braucht nur Breaker/Rez. | T-TURN-001, T-RUN-002 |
| DEV-006 | Paid Abilities | CR 9.2 | Nur demo-relevante Breaker-Pump/Break- und ICE-Rez-Aktionen. | Keine anderen Paid Abilities im Pool. | T-RUN-004 |
| DEV-007 | Tags/Trace/Damage/Viren | CR 10.4, 10.5, 10.1 | Nicht implementiert; Sentry verliert Credits statt Damage/Tags. | Komplexität ohne Bedarf im Demo-Pool. | T-CARD-CORP-006 |
| DEV-008 | Prevention/Replacement/Interrupt | CR 9 | Nicht implementiert. | Kein Demo-Effekt benötigt diese Schichten. | T-ACTION-003 |
| DEV-009 | Hosting/Hosted Cards | CR 1.13 | Nicht implementiert. | Keine Demo-Karten mit Hosting. | T-STATE-001 |
| DEV-010 | Siegpunktwert | CR 1.7.2a, 1.17 | Demo-Partien gewinnen bei 6 Agenda Points, konfiguriert über `agendaPointsToWin`. | Corp-Demo-Deck enthält nur 6 Agenda Points. | T-WIN-001, T-WIN-002 |
| DEV-011 | Jack Out | CR 6.9.4c | Jack-out wird in MVP 0.1 nicht als Abnahmepflicht angeboten. | Kernruns sollen zuerst deterministisch durchlaufen. | T-RUN-002 |
| DEV-012 | Multiaccess | CR 7.3-7.5 | Immer ein HQ/R&D-Kandidat, keine Multiaccess-Effekte. | Kein Demo-Effekt erhöht Access-Anzahl. | T-ACCESS-001 |
| DEV-013 | Archives | CR 7.5.2 | Archives wird MVP-einfach behandelt; facedown-Komplexität nur soweit testsicher nötig. | Keine Archives-Spezialkarten. | T-ACCESS-003 |
| DEV-014 | Public Replay | Konzept 20 | Nur lokaler EventLog-/Replay-Nachweis, keine öffentliche Replay-Plattform. | Plattformfunktion ist Nicht-Ziel. | T-REPLAY-001 |
| DEV-015 | UI | Konzept 27 | Desktop-orientierte Debug-/Lern-UI reicht. | UI-Politur ist nicht Gate vor Engine-Korrektheit. | T-UI-001 |

## Rückbauprinzip

Jede Abweichung bleibt nur erlaubt, solange sie für den aktiven Kartenpool unschädlich ist. Sobald eine Karte, ein Modus oder ein Gate die offizielle Mechanik benötigt, muss die Abweichung entfernt oder enger gefasst und getestet werden.

