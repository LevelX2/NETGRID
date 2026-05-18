# V1.5.0 Test Matrix - Private Replay, Analyse und Lernhilfe

Stand: 2026-05-08
Status: eingefroren

## Replay- und Metadatentests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V150-T001 | Abhängigkeit | V150-MUST-001 | Review: V1.4.3 Final Gate ist grün. |
| V150-T002 | Loader | V150-MUST-002 | Storage-Test: Replay wird aus vorhandenen Match-/Event-/Snapshot-Daten geladen. |
| V150-T003 | Metadaten-Redaction | V150-MUST-003 | Redaction-Test: keine Tokens, Sessions, Pfade oder Decklisten in Metadaten. |
| V150-T004 | Timeline | V150-MUST-004 | UI/Unit-Test: Event, Seite, Timing, StateVersion und StateHash werden angezeigt/geprüft. |
| V150-T005 | Perspektiven | V150-MUST-005, V150-MUST-006 | Hidden-Info-Test: Runner-/Corp-/Local-Analysis-Sichten sind getrennt. |
| V150-T006 | Barrieren | V150-MUST-007 | Szenario: Hidden-Info-Barrieren sind markiert. |
| V150-T007 | RandomDrawRecords | V150-MUST-008 | Replay-Test: Zufall ist nachvollziehbar ohne Leak. |
| V150-T008 | Eventfamilien | V150-MUST-009 | Rendering-Test: wichtige Mechanikfamilien sind mindestens abstrakt renderbar. |

## Analyse- und Exporttests

| Test-ID | Bereich | Requirement-IDs | Testspur |
| --- | --- | --- | --- |
| V150-T009 | DecisionDebug | V150-MUST-010 | Redaction-Test: KI-Debug bleibt side-sicher. |
| V150-T010 | Export | V150-MUST-011 | Export-Test: Secrets, Pfade und unzulässige Hidden Info fehlen. |
| V150-T011 | Exploit-Kandidaten | V150-MUST-012 | Artifact-Test: Export markiert Kandidaten nur als Vorschlag. |
| V150-T012 | Lernhinweise | V150-MUST-013 | Content-Test: Hinweise erklären LegalActions ohne Hidden Info. |
| V150-T013 | No Public | V150-MUST-014 | No-Scope-Test: keine Public-Replay-/Spectator-/Accountfläche. |
| V150-T014 | Engine-Isolation | V150-MUST-015 | Regression: Replay verändert keine Regeln, Karten, KI-Pools oder StateHashes. |

## Browser-Smokes

- Replay-Liste öffnet lokal.
- Replay-Timeline scrollt und springt zu Schlüsselmomenten.
- Runner- und Corp-Perspektive zeigen unterschiedliche redigierte Daten.
- Export-Dialog erzeugt redigiertes Artefakt.

## Pflichtchecks

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- `corepack pnpm e2e` oder ein gezielter Browser-Replay-Smoke

## Gate-Auswertung

V1.5.0 darf finalisiert werden, wenn private Replay-Ansicht, StateHash-Prüfung, Perspektiv-Redaction und Export sicher funktionieren.
