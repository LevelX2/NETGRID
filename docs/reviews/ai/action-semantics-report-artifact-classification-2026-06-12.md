# Action Semantics Report Artifact Classification 2026-06-12

## Scope

Dieses Inventar klassifiziert die AI-Review-Artefakte, die der Action-Semantics-Follow-up-Branch gegenüber seinem ersten Merge-Parent `b3c004d7^1` geändert oder neu eingeführt hat.

Der Vergleich gegen `origin/main` ist für diese Altarbeit inzwischen nicht mehr aussagekräftig, weil `origin/main` den Merge `b3c004d7` bereits enthält.

## Geänderte und neue Review-Artefakte

| Artefakt                                                                       | Änderung                    | Klassifikation       | Reproduzierbarkeit                                                                             | Gate-/Review-Nutzung                                                                    | Entscheidung |
| ------------------------------------------------------------------------------ | --------------------------- | -------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------ |
| `docs/reviews/ai/action-semantic-candidate-coverage-2026-06-12.json`           | geändert, +13/-0 Zeilen     | `benchmark-baseline` | Deterministisch aus `packages/ai/src/actions/action-semantic-coverage.ts` und Testfixtures     | `packages/ai/src/actions/action-semantic-coverage.test.ts` prüft die committed Baseline | Behalten     |
| `docs/reviews/ai/action-semantic-signal-catalog-2026-06-12.json`               | geändert, +1672/-137 Zeilen | `gate-required`      | Deterministisch über `node scripts/check-ai-action-semantic-signal-catalog.mjs --write-report` | `corepack pnpm check:ai` konsumiert den Report über `--check`                           | Behalten     |
| `docs/reviews/ai/action-semantic-signal-catalog-2026-06-12.md`                 | geändert, +83/-42 Zeilen    | `gate-required`      | Deterministisch über `node scripts/check-ai-action-semantic-signal-catalog.mjs --write-report` | Markdown-Spiegel des Signal-Katalog-Gates                                               | Behalten     |
| `docs/reviews/ai/action-semantics-followup-local-report-hygiene-2026-06-12.md` | neu, +45 Zeilen             | `artifact-only`      | Manuell dokumentierter Prozessbefund                                                           | Review-Hygiene und lokale Transferentscheidung                                          | Behalten     |
| `docs/reviews/ai/deck-doctrine-v2-diagnostic-fixtures-2026-06-12.md`           | neu, +30 Zeilen             | `benchmark-baseline` | Deterministisch aus DeckDoctrine-v2-Fixturetest-Matrix                                         | Review-Evidence für echte Decksnapshots, keine Runtime-Wirkung                          | Behalten     |

## Größte bestehende AI-Reports

Die größten vorhandenen `docs/reviews/ai/*.json`-Dateien stammen überwiegend aus älteren Selfplay-, Audit- und AI115-/AI123-Läufen. Sie liegen außerhalb des Action-Semantics-Follow-up-Diffs und werden in diesem Prozess nicht verändert.

## Bewertung

Kein neues oder geändertes JSON-Artefakt im geprüften Scope ist ein reines One-off-Diagnostic ohne Verbraucher:

- Der Signal-Katalog-JSON-Report ist Teil von `check:ai`.
- Der Candidate-Coverage-JSON-Report wird durch den Coverage-Test als deterministische Review-Baseline abgesichert.
- Die neuen Markdown-Berichte sind Prozess- und Review-Evidence, keine großen maschinenlesbaren Laufzeitdaten.

## Entscheidung

Keine Report-Löschung in diesem Prozess. Eine spätere Bereinigung großer historischer AI-Reports braucht ein eigenes Gate mit Ersatzpfad, Verbraucherliste und Reproduzierbarkeitsnachweis.
