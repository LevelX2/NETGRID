# Aufgabe 007: Batch-1 Generated-Facts-Rollup

Aufgabe-ID: Aufgabe 007

## Kurzfazit

Batch 1 ist nach Aufgabe 005 und Aufgabe 006 read-only future-migration-ready: 11 von 11 Karten sind conflict-free und gap-free. Es gibt 40 bestätigte Generated Facts, 0 Preview-Adds, 0 Hard Errors, 0 echte semantische Konflikte, 0 verbleibende Shape-Differences, 0 Monolith-only mechanical facts, 0 Deriver-Follow-ups, 0 Descriptor-Gaps und 0 Human-Review-Kandidaten.

`data/ai/ai-card-hints-active.json` bleibt unverändert die einzige Runtime-Quelle. Es wurde keine Runtime-, Planner-, Consumer- oder Engine-Wirkung eingeführt.

## Quellen / Gates

Geprüfte Quellen:

- `ai-derived-basic-facts-gate-2026-05-25.json`
- `ai-hint-compiled-index-pilot-report-2026-05-25.json`
- `ai-generated-fact-migration-priority-report-2026-05-25.json`
- `aufgabe-003-generated-fact-batch1-dry-run-report-2026-05-25.json`
- `aufgabe-004-batch1-compiler-diff-review-report-2026-05-25.json`
- `aufgabe-005-batch1-normalization-dry-run-report-2026-05-25.json`
- `aufgabe-006-employee-empowerment-start-turn-draw-deriver-2026-05-25.md`

Der neue Check ist `corepack pnpm check:ai-generated-fact-batch1-rollup`.

## Batch-1-Gesamtstatus

| Kennzahl                        | Wert |
| ------------------------------- | ---: |
| Batch-1-Karten                  |   11 |
| bestätigte Generated Facts      |   40 |
| Preview-Adds                    |    0 |
| Hard Errors                     |    0 |
| Konflikte                       |    0 |
| echte semantische Konflikte     |    0 |
| Shape-Differences               |    7 |
| normalisierte Shape-Differences |    7 |
| verbleibende Shape-Differences  |    0 |
| Monolith-only mechanical facts  |    0 |
| Deriver-Follow-ups              |    0 |
| Descriptor-Gaps                 |    0 |
| Human-Review-Kandidaten         |    0 |
| Board-Context-Warnings          |   31 |
| Consumer-relevante Fact-Signale |   40 |
| Legacy-Compat-Hinweise          |   11 |

Bewertung: Batch 1 ist als künftiger Generated-Facts-Batch fachlich bereit, solange eine spätere echte Migration Board-/LegalAction-Kontext nicht statisch interpretiert.

## Kartenstatus

Alle elf Karten sind `futureMigrationReady=true` und `ready_but_board_context_required`:

- `Corporate Boon`
- `Corporate Coup`
- `Employee Empowerment`
- `Netwatch Operations Office`
- `On-Call Solo Team`
- `Political Overthrow`
- `Strike Force Kali`
- `Audit of Call Records`
- `Chance Observation`
- `Closed Accounts`
- `Scorched Earth`

Die bestätigten Fact-Gruppen decken scored-agenda Actions, Trace/Tag, Tag/Punish sowie Draw/Economy/Extra-Action ab. Es bleiben keine kartenbezogenen Folgeissues im Rollup.

## Board-Kontext-Regeln

Scored-agenda facts beschreiben Kartenfunktion. Tatsächliche Nutzbarkeit hängt weiterhin davon ab, ob die Agenda gescored ist und ob die Engine eine LegalAction anbietet.

Trace/tag facts beschreiben die Aktion. Tags entstehen nur nach tatsächlichem Trace-Erfolg; `requires_trace_success` beschreibt die Bedingung, garantiert aber keinen Erfolg.

Tag-punish facts beschreiben den Payoff. `requires_runner_tagged` muss gegen sichtbaren Runner-Tag-State geprüft werden; keine Punish-Bewertung ohne LegalAction.

Start-of-turn draw beschreibt passive/triggered Kartenfunktion und ist keine Action-Legalität.

## Nächster Batch

Empfehlung: Aufgabe 008 als `batch_2_breaker_target_trash_credit`.

Kandidaten:

- `Japanese Water Torture`
- `Krash`
- `Mystery Box`
- `Poltergeist`
- `Scatter Shot`
- `Self-Modifying Code`

Begründung: BreakerProfile, TargetProfiles und dedicated trash-credit Facts sind mechanisch stabiler als Future-run-ICE, haben bereits relevante Diagnose-/Consumer-Anknüpfung und bauen direkt auf dem Generated-Facts-Pfad auf. `R&D-Protocol Files` bleibt bewusst zurückgestellt, weil Topdeck-/Access-Replacement-Pressure besser in den späteren Information/Pressure-Longtail passt.

## Bewusst Nicht Geändert

- keine Änderung an `data/ai/ai-card-hints-active.json`
- keine Änderung an `aiSupportStatus`
- keine aktive Hintmigration
- keine Runtime-Nutzung des Compilers
- keine Planner-/Consumer-Anbindung
- keine Engine- oder LegalAction-Änderung
- keine Performanceinterpretation

## Nächster Praktischer Schritt

Aufgabe 008: read-only Dry-Run für `BreakerProfile / TargetProfiles / Dedicated Credits`, mit Fokus auf Breaker-Coverage, Search-/Install-TargetProfiles und dedicated trash-credit Facts.
