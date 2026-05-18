# Acceptance Criteria MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03

## Gate-Kriterien

| ID | Kriterium | Pass/Fail-Bedingung | Requirements | Tests/Szenarien |
|---|---|---|---|---|
| AC-001 | Baseline | Spiel, Szenarien und Events führen RulesBaseline `26.03` und Versionen `0.1.0`. | REQ-001 | T-BASE-001 |
| AC-002 | Deterministischer Start | Gleiches Config+Seed erzeugt identische Starthände, Deckreihenfolge, RandomDrawRecords und StateHash. | REQ-002, REQ-003 | T-SETUP-001, SCN-006 |
| AC-003 | LegalAction-Zwang | UI/KI können nur LegalActions einreichen; manipulierte PlayerActions werden abgelehnt. | REQ-006 bis REQ-011 | T-ACTION-001 bis T-ACTION-005 |
| AC-004 | Grundaktionen | Credits, Draw, Install, Play Event/Operation, Advance, Score und End Turn funktionieren für Demo-Karten. | REQ-013 bis REQ-018, REQ-031 | T-ACTION-006, T-TURN-001 bis T-TURN-003 |
| AC-005 | Run-Kern | Ungeschützter Run, geschützter Run mit Break, geschützter Run mit ETR-Fail und Remote-Run sind deterministisch. | REQ-019 bis REQ-025 | SCN-001, SCN-002, SCN-003, SCN-004 |
| AC-006 | Access/Breach | HQ, R&D, Archives und Remote sind im MVP-Scope zugreifbar; Agenda-Steal und Asset-Trash funktionieren. | REQ-025 bis REQ-030 | T-ACCESS-001 bis T-ACCESS-003 |
| AC-007 | Scoring und Sieg | Runner- und Corp-Agenda-Sieg bestehen als deterministische Tests; Teilzustand ohne Sieger bleibt möglich. | REQ-030 bis REQ-032 | T-WIN-001, T-WIN-002, SCN-001, SCN-004 |
| AC-008 | EventLog/StateHash | Jede erfolgreiche Transition erzeugt Event mit StateVersionBefore/After und StateHashAfter. | REQ-033 | T-EVENT-001 |
| AC-009 | Replay | Vollständige Beispielpartie ist aus InitialState+EventLog reproduzierbar; finaler StateHash stimmt. | REQ-039 | T-REPLAY-001, SCN-006 |
| AC-010 | Visibility | RunnerView, CorpView, PublicEvents, KI-Input, Client-Payloads, Fehler und sichtgefiltertes Replay leaken keine verdeckten Daten. | REQ-012, REQ-034 bis REQ-037 | T-VIS-001 bis T-VIS-006, SCN-005 |
| AC-011 | Corp-KI | Corp-KI wählt nur LegalActions, nutzt keine verbotenen Informationen und bleibt 100 Testzüge stabil. | REQ-037, REQ-038 | T-AI-001 bis T-AI-003 |
| AC-012 | Kartenabdeckung | Jede `playable_mvp`-Karte hat Manifest, Unit-Test und Szenario-/Integrationstest. | REQ-040 | T-CARD-000 bis T-CARD-CORP-006 |
| AC-013 | Lokale Spielbarkeit | Mensch kann als Runner eine Demo-Partie gegen Corp-KI lokal starten und beenden. | REQ-041, REQ-042 | T-E2E-001 |
| AC-014 | Dokumentation | Abweichungen, Annahmen, offene Fragen, Risiken und Status sind dokumentiert. | REQ-001 bis REQ-045 | Dokumentenreview |

## Done für MVP 0.1

MVP 0.1 darf erst als abgeschlossen markiert werden, wenn `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, alle Szenariotests, alle Card-Tests, Visibility-Tests, Replay-/StateHash-Tests und der lokale Spielbarkeitscheck bestehen.

