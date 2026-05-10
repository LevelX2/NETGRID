# V1.9.1 Requirements - Deferred-Aufloesung und Zufall-Restfaelle

Stand: 2026-05-10  
Status: eingefroren

## Ziel

V1.9.1 schliesst den expliziten Deferred-Ueberhang aus V1.8.1/V1.9.0 mit einem strikt begrenzten 3-Karten-Kern und ohne Scope-Ausweitung.

## Must-Anforderungen

| ID | Anforderung |
| --- | --- |
| V191-MUST-001 | V1.9.1 startet erst nach gruenem V1.9.0-Final-Gate. |
| V191-MUST-002 | Der V1.9.1-Kernkorb enthaelt exakt drei Karten: `onr_v1_013_cockroach`, `onr_v1_034_incubator`, `onr_v1_030_grubb`. |
| V191-MUST-003 | Die Resolver fuer den 3er-Kern nutzen deterministische Random-/State-Vertraege auf Basis `seed`, `randomCounter`, `randomDrawRecords`. |
| V191-MUST-004 | `Grubb` erhaelt einen deterministischen remainder-of-run Breaker-Strength-Lifecycle ohne Hidden-Info-Leak. |
| V191-MUST-005 | `Incubator` erhaelt einen deterministischen Start-of-turn-/Counter-Transform-Vertrag mit legalem ChoiceFlow. |
| V191-MUST-006 | `Cockroach` erhaelt einen deterministischen HQ-Discard-Umlenkungs-/Counter-Kontextvertrag gemaess Scope. |
| V191-MUST-007 | Replay/StateHash/Visibility bleiben regressionsfrei; keine Leaks in PlayerView, PublicEvents, Reconnect, Undo, Logs, Errors oder DecisionDebug. |
| V191-MUST-008 | Keine Karte ausserhalb des 3er-Kerns wird implizit `human_playable`/`deck_legal` oder `ai_supported`. |
| V191-MUST-009 | Keine V2.x-Features und keine Mechanikfamilien ausserhalb des V1.9.1-Scope. |

## Should-Anforderungen

| ID | Anforderung |
| --- | --- |
| V191-SHOULD-001 | Resolverpfade teilen wiederverwendbare Helper statt kartenindividuelle Spezialpfade. |
| V191-SHOULD-002 | Der 3er-Kern wird in einem dedizierten Preflight-Artefakt vor Code final bestaetigt. |
| V191-SHOULD-003 | Neue Counter-/Run-Flags werden mit negativer Regression gegen V1.9.0 abgesichert. |

## Gate

`ready_for_implementation_after_V1_9_0_and_V1_9_1_preflight: true`

V1.9.1 ist als enger Deferred-Aufloesungsrelease umsetzungsreif eingegrenzt.
