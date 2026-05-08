# V1.1.3 Final Review - Mechanics-AI-Card Baseline

Stand: 2026-05-08
Status: done

## Gate-Ergebnis

V1.1.3 ist formal abgeschlossen.

`V1_1_3_requirements_freeze_done: true`

`V1_1_3_preflight_checked: true`

`V1_1_3_done: true`

`ready_for_implementation: false`

`ready_for_next_release_implementation: true`

V1.1.3 ist ein Planungs- und Normalisierungsrelease ohne Engine-, Server-, Web-, KI- oder Test-Codeimplementierung. Der Release schließt die Baseline-Arbeit nach V1.1.2K ab: Mechanik-Coverage, Kartenstatusmodell, 52-Karten-Mapping, AI-Level-Audit, AI-Hints-Sollvertrag, `AiDecisionDebug`-Sollvertrag und Folgegates für V1.2.x.

V1.2.0 und V1.2.1 werden hier nicht neu umgesetzt. Sie werden als bereits umgesetzte und lokal verifizierte Folge-Releases referenziert, die durch diese Baseline ausreichend getragen wurden.

## Evidence

| Artefakt | Rolle |
| --- | --- |
| `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md` | Baseline-Plan, Scope, No-Scope, Mechanik-Coverage, Kartenmapping, AI-Level-Audit und KI-Sollverträge. |
| `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_REQUIREMENTS.md` | eingefrorene Must-/Should-Anforderungen V113-MUST-001 bis V113-MUST-022. |
| `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_TEST_MATRIX.md` | dokumentarische Prüfgates V113-T001 bis V113-T014 und harte Folgegates. |
| `docs/derived/V1_1_3_REQUIREMENTS_REVIEW.md` | Requirements Review mit `ready_for_implementation: false` und nicht blockierenden Restpunkten. |
| `docs/derived/V1_1_3_TO_V1_2_1_IMPLEMENTATION_HANDOFF.md` | Handoff mit Reihenfolge V1.2.0 vor V1.2.1, Folgeprompt und Ready-Status. |
| `docs/derived/MECHANICS_COVERAGE_MATRIX.md` | menschliche Mechanik-Coverage mit V1.1.3-Normalisierung und V1.2.1-Update. |
| `data/rules/mechanics-coverage-1.2.1.json` | aktueller maschinenlesbarer Mechanik-Coverage-Stand nach V1.2.0/V1.2.1. |
| `docs/derived/V1_2_0_FINAL_REVIEW.md` | Beleg, dass V1.2.0 Event Modification Foundation umgesetzt und lokal verifiziert wurde. |
| `docs/derived/V1_2_1_FINAL_REVIEW.md` | Beleg, dass V1.2.1 Replacement Effects umgesetzt und lokal verifiziert wurde. |

## Testmatrix-Abschluss

| Test-ID | Ergebnis | Evidence |
| --- | --- | --- |
| V113-T001 | pass | Plan und Requirements erklären V1.1.3 ausdrücklich als No-Code-Release. |
| V113-T002 | pass | Plan, Requirements Review und Status referenzieren V1.1.2/V1.1.2K als abgeschlossen und unverändert. |
| V113-T003 | pass | Mechanik-Coverage normalisiert Setup, Mulligan, Discard, Handlimit, Core Damage, Full Archives, Event Modification, Replacement und Special Zones. |
| V113-T004 | pass | Das Modell `listed`/`engine_supported`/`human_playable`/`ai_supported` ist definiert; `deck_legal` setzt künftig `human_playable` voraus. |
| V113-T005 | pass | Alle 52 O:NR-v1-Runtime-Karten sind dokumentarisch gemappt; V1.1.3 gibt keine weitere Karte frei. |
| V113-T006 | pass | KI-Smokes sind als LegalAction-/PlayerView-Sicherheitsbelege eingeordnet, nicht als `ai_supported`. |
| V113-T007 | pass | AI-Level 0 bis 6 sind auditiert: Level 0/1 eng erfüllt, Level 2 teilweise, Level 3 bis 6 offen. |
| V113-T008 | pass | AI-Hints-Sollvertrag enthält Rollen, Mechaniken, Fenster, Ziele, Risiken, Fallback und Szenarioreferenzen. |
| V113-T009 | pass | `AiDecisionDebug`-Sollvertrag enthält Baselines, Scores, Confidence, Fallback, Zeitbudget, Seed und Redaction. |
| V113-T010 | pass | V1.2.x vor weiteren K-Releases ist im Plan und Handoff begründet. |
| V113-T011 | pass | Hidden Info, Replay, StateHash, LegalActions/applyAction, PlayerViews, WebSocket, Reconnect, Undo und KI-Inputs sind harte Folgegates. |
| V113-T012 | pass | Accounts, Matchmaking, Rankings, Turniere, offizielle Assets und externe Kartendatenbanken bleiben ausgeschlossen. |
| V113-T013 | pass | `CODEX_STATUS.md` und Wissensbasis benennen den abgeschlossenen V1.1.3-Stand. |
| V113-T014 | pass | Umsetzungshandoff und kopierbarer Folgeprompt existieren. |

## Must-Prüfung

| Prüffeld | Ergebnis | Befund |
| --- | --- | --- |
| Mechanik-Coverage nach V1.1.2K | pass | V1.1.3 normalisiert den Stand nach V1.1.2K; V1.2.0/V1.2.1 aktualisieren danach die Event-Modification- und Replacement-Einträge. |
| Statusmodell | pass | `listed`, `engine_supported`, `human_playable` und `ai_supported` sind verbindlich getrennt. |
| Mapping der bestehenden 52 Runtime-Karten | pass | Alle 52 Karten sind dokumentarisch als `listed`, `engine_supported`, `human_playable` und nicht `ai_supported` erfasst. Es existiert kein zusätzliches maschinenlesbares Kartenstatus-Artefakt für dieses Mapping. |
| AI-Level-Audit 0 bis 6 | pass | Level 0/1 bleiben enge Sicherheits-/Basis-KI, Level 2 ist teilweise erfüllt, Level 3 bis 6 bleiben spätere Gates. |
| AI-Hints-Sollvertrag | pass | Pflichtfelder und Reviewpflicht sind dokumentiert; Hints erzeugen keine Spielbarkeit. |
| `AiDecisionDebug`-Sollvertrag | pass | Redaction, PlayerView-only-Herkunft und Debug-Felder sind als Sollvertrag dokumentiert. |
| Priorisierung V1.2.x vor weiteren K-Kartenreleases | pass | V1.2.0/V1.2.1 wurden vor weiteren Kartenreleases priorisiert und inzwischen umgesetzt/verifiziert. |
| Harte Folgegates | pass | Hidden Info, Replay, StateHash, LegalActions/applyAction, PlayerViews, WebSocket/Reconnect/Undo und KI-Inputs bleiben verbindlich. |

## Folge-Release-Befund

| Release | Status | ready_for_implementation | Befund |
| --- | --- | --- | --- |
| V1.1.3 | done | false | Planungs-/Normalisierungsrelease; kein Implementierungsschritt vorgesehen. |
| V1.2.0 | done | true | Durch V1.1.3 ausreichend getragen; Event Modification Foundation wurde umgesetzt und lokal verifiziert. |
| V1.2.1 | done | true | Durch V1.1.3 und grünes V1.2.0-Gate ausreichend getragen; Replacement Effects wurden umgesetzt und lokal verifiziert. |

## Offene Restpunkte

Keine blockierenden Restpunkte für V1.1.3.

Nicht blockierend:

- Das 52-Karten-Mapping ist derzeit dokumentarisch im V1.1.3-Plan enthalten; ein zusätzliches maschinenlesbares Card-Support-Manifest wurde nicht angelegt.
- Spätere echte Kartenfreigaben, KI-Deckfreigaben, weitere Eventfamilien, Avoid-/Interrupt-Runtime-Piloten, Special Zones, Set Aside, Remove from Game sowie Ownership-/Control-Wechsel brauchen eigene Requirements, Resolver, Visibility-, Replay-/StateHash-, KI- und Multiplayer-Gates.
- Für diesen reinen Dokumentationsabschluss wurden keine Code-Tests ausgeführt. Das ist passend, weil keine Engine-, Server-, Web-, KI- oder Test-Codepfade geändert wurden; Plausibilitätsprüfung erfolgt über Markdown-/Whitespace-Diffcheck.
