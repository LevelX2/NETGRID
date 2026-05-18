# V1.5.0 Requirements - Private Replay, Analyse und Lernhilfe

Stand: 2026-05-08
Status: eingefroren

## Ziel

V1.5.0 führt private lokale Replay- und Analysefunktionen ein. Es ist kein Public-Replay- oder Coaching-Release.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V150-MUST-001 | V1.5.0 startet erst nach grünem V1.4.3-Final-Gate. |
| V150-MUST-002 | Replays werden lokal aus bestehenden Match-/Event-/Snapshot-Daten geladen. |
| V150-MUST-003 | Replay-Metadaten enthalten keine Tokens, Session-IDs, privaten lokalen Pfade oder Decklisten. |
| V150-MUST-004 | Replay-Timeline zeigt pro Schritt Event, Seite, Timing, StateVersion und StateHash-Prüfung. |
| V150-MUST-005 | Replay-Perspektiven für Runner und Corp nutzen dieselben Visibility-Regeln wie PlayerViews. |
| V150-MUST-006 | Eine lokale Analyseperspektive darf nur ausdrücklich lokale private Analyse sein und nicht in öffentliche Payloads gelangen. |
| V150-MUST-007 | Hidden-Info-Barrieren werden in der Timeline sichtbar markiert. |
| V150-MUST-008 | RandomDrawRecords werden nachvollziehbar, aber nicht leakend dargestellt. |
| V150-MUST-009 | Access-, Damage-, Trace-, Replacement-, Special-Zone- und Control-Events sind mindestens abstrakt renderbar. |
| V150-MUST-010 | DecisionDebug wird im Replay side-sicher kontextualisiert. |
| V150-MUST-011 | Replay-Export entfernt Tokens, Sessions, lokale Pfade, private Runtime-Konfiguration und unzulässige Hidden Info. |
| V150-MUST-012 | Replay-Export kann Exploit-Kandidaten als Testfallvorschlag markieren, erzeugt aber keine Tests automatisch ohne Review. |
| V150-MUST-013 | Analyse- und Lernhinweise erklären nur erlaubte Projektionen und LegalActions. |
| V150-MUST-014 | Kein Public Replay, Spectator, Cloud Sync, Accountsystem, Ranking, Matchmaking oder Turnierfeature wird eingeführt. |
| V150-MUST-015 | Replay verändert keine Engine-Regeln, keine Kartenfreigaben, keine KI-Deckpools und keinen StateHash echter Spiele. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V150-SHOULD-001 | Replay-Liste sollte nach Datum, Matchmodus, Seiten und Ergebnis filterbar sein. |
| V150-SHOULD-002 | Timeline sollte Sprung zu Hidden-Info-Barrieren, Runs und Scoring-Events erlauben. |
| V150-SHOULD-003 | DecisionDebug sollte Fallbacks, Timeouts und Planwechsel hervorheben. |

## Gate

`ready_for_implementation_after_V1_4_3: true`

V1.5.0 ist nach V1.4.3 bereit für Umsetzung.
