# AI Deck Doctrine Test Matrix

Stand: 2026-05-15  
Status: Testmatrix für ersten Corp-MVP

| ID | Bereich | Requirement | Testidee |
| --- | --- | --- | --- |
| AIDD-T001 | Profilgenerator | AIDD-MUST-001 | Gleiches Corp-Decksnapshot erzeugt deterministisch gleiches `AiDeckDoctrineProfile`. |
| AIDD-T002 | Corp-Archetypen | AIDD-MUST-003 | Tax-/ICE-lastiges Corp-Deck erhält `glacier`/`central_defense`; Tag-Ops-Deck erhält `tag_pressure`. |
| AIDD-T003 | AI-supported Gate | AIDD-MUST-001, AIDD-SHOULD-002 | Nicht `ai_supported` Karten erzeugen Risk Flag und reduzieren Confidence. |
| AIDD-T004 | KI-Input | AIDD-MUST-002 | `buildAiDecisionInput` nimmt eigenes Snapshotprofil auf und enthält keine Deckliste oder Deckreihenfolge. |
| AIDD-T005 | Server-AI | AIDD-MUST-002 | `runAiStep` übergibt nur das Snapshot der aktiven KI-Seite als eigenes Doctrine-Profil. |
| AIDD-T006 | Corp-Plan Rush | AIDD-MUST-004 | Rush-Doktrin erhöht `score_next_turn`, ohne nackte Agenda-Leitplanke zu brechen. |
| AIDD-T007 | Corp-Plan Glacier | AIDD-MUST-004 | Glacier-Doktrin bevorzugt Remote-Aufbau/Schutz gegenüber bloßer Economy, wenn passende Actions legal sind. |
| AIDD-T008 | Nackte Agenda | AIDD-MUST-005 | Neue nackte Agenda-Installation bleibt schlechter als ICE-Schutz oder geschützter Remote. |
| AIDD-T009 | Asset-Remote | AIDD-MUST-004 | Asset-Doktrin darf Assets in neue Remotes fördern, aber Agenden nicht als Assets behandeln. |
| AIDD-T010 | Corp-Mulligan Agenda-Flood | AIDD-MUST-006 | Corp mit 3+ Agenden und 0 ICE wählt `mulligan`. |
| AIDD-T011 | Corp-Mulligan Keep | AIDD-MUST-006 | Corp mit ICE, Economy und maximal 1 Agenda wählt `keep`. |
| AIDD-T012 | Debug-Redaction | AIDD-MUST-007 | `DecisionDebug` enthält Doktrin-Tags, aber keine verbotenen Felder oder gegnerischen privaten Karten. |
| AIDD-T013 | Fallback | AIDD-MUST-009 | Ohne Snapshot bleibt KI legal und verwendet neutrale Doktrin. |
| AIDD-T014 | Regression | AIDD-MUST-010 | Bestehende AI-Regressionen bleiben grün. |

## Verifikation

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`
