# MVP 0.7 Test Matrix

Status: Requirements/Design Freeze
Stand: 2026-05-03

## Coverage

| Test-ID | Typ | Deckt ab | Beschreibung |
|---|---|---|---|
| V07-T001 | Artifact | V07-MUST-001 | V0.7-Dokumente existieren; alle Must-IDs stehen in Requirements und Testmatrix; Requirements Review meldet `ready_for_implementation: true`. |
| V07-T002 | Visual smoke | V07-MUST-002 | Entry, RunnerBoard und CorpBoard werden gegen Design-C-Struktur geprüft. |
| V07-T003 | Interaction | V07-MUST-003 | Aktiver Run zeigt Timeline und aktuelle Encounter-/Access-Choice. |
| V07-T004 | Contract | V07-MUST-004 | UI-Mapping akzeptiert nur side-sichere Datenquellen. |
| V07-T005 | Visibility | V07-MUST-005 | Browserseite importiert keine Engine und enthält kein `GameState`/`cardInstances`. |
| V07-T006 | Regression | V07-MUST-006 | Katalog, Deckeditor, Match Setup und bestehende Spielmodi bleiben erreichbar. |
| V07-T007 | Visual smoke | V07-MUST-007 | Startscreen zeigt private Modi, Decks, Katalog, Resume und Diagnostics ohne Plattform-Scope. |
| V07-T008 | Runner UI | V07-MUST-008 | RunnerBoard rendert eigene Zonen, Rig, Run und Actions aus Runner-View. |
| V07-T009 | Visibility | V07-MUST-004, V07-MUST-008 | Runner-HTML/Payload enthält keine Corp-HQ/R&D/unrezzed-Titel. |
| V07-T010 | Corp UI | V07-MUST-009 | CorpBoard rendert HQ, Server, Remotes, Runner Public Info, Rez Window und Actions. |
| V07-T011 | Visibility | V07-MUST-009 | Corp-HTML/Payload enthält keine Runner-Grip-/Stack-Titel. |
| V07-T012 | Interaction | V07-MUST-010 | Action- und Choice-Panels sperren pending Actions und melden stale/rejected side-sicher. |
| V07-T013 | Interaction/Visibility | V07-MUST-011 | EventLog, Undo, Reconnect und Diagnostics zeigen keine Tokens oder privaten Payloads. |
| V07-T014 | Component | V07-MUST-012 | CardView rendert `placeholder`, `text-card`, `compact`, `preview`, `zoom`, `hidden` und `redacted` side-sicher. |
| V07-T015 | Visual QA | V07-MUST-002, V07-MUST-015, V07-MUST-016 | Desktop und schmalere Viewports haben keine Überlappungen, Textüberläufe oder unbedienbaren Actions. |
| V07-T016 | Run smoke | V07-MUST-003 | Aktiver Run und Rez-/Encounter-Zustände bleiben lesbar und side-sicher. |
| V07-T017 | Asset | V07-MUST-012 | Display-Mode-Wechsel verändert keinen Match-State, keine LegalActions und keine StateVersion. |
| V07-T018 | Asset/Visibility | V07-MUST-013 | Ohne Asset-Freigabe werden keine externen oder offiziellen Kartenbilder geladen; Hidden Cards enthalten keine Bildmetadaten. |
| V07-T019 | Accessibility | V07-MUST-014, V07-MUST-015 | Fokus, Labels, Tastaturbedienung, Kontrast und responsive Lesbarkeit werden geprüft. |
| V07-T020 | Regression | V07-MUST-006, V07-MUST-016 | `corepack pnpm lint`, `typecheck`, `test`, `build` sowie paketbezogene Tests bleiben grün. |

## Gate-Regeln

- Jede Must-Anforderung hat mindestens eine Testspur.
- Visibility- und FullState-Leaks sind Blocker.
- Fehlgeschlagene Workspace-Checks blockieren V0.7-Abschluss.
- Visual-Smokes dürfen bekannte kosmetische Restpunkte dokumentieren, aber keine Überlappungen, Textüberläufe oder Hidden-Info-Risiken offen lassen.
