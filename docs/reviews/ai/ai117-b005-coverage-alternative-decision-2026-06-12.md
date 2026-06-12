# AI117 B005 Coverage Alternative Decision

Datum: 2026-06-12

Branch: `codex/ai115-ai122-residual-action-limit-evidence-sweep`

## Ziel

AI117 entscheidet auf Basis von AI115/AI116, ob B005 als enger Runtime-Kandidat zulässig ist.

## Entscheidungsgrundlage

AI115 hat für Pair B / `ai-v143-tuning-005` side-safe LegalAction-Alternativen belegt.

Der harte Abschnitt beginnt bei Action-Index 100:

- Gewählt: `gain_credit`
- Plan: `runner.build_credit_base`
- Sichtbare Lücke: `runnerSetupMissingCoverageTypes: ["wall"]`
- Nicht sichere Alternativen: `start_run` auf HQ/R&D, weil bekannte ICE-Pfade wegen `missing_breaker_coverage` blockiert sind
- Beste nicht ausgeschlossene Alternative: `draw_card`
- Grund für Zurückstellung: `plan_mismatch` / `excluded_by_current_plan`

## Entscheidung

B005 ist ein zulässiger enger Runtime-Kandidat für AI121, aber nur in dieser Form:

- Runner-Seite.
- Gewählte Action ist `gain_credit`.
- Sichtbare Coverage-Lücke ist vorhanden.
- Der aktuelle oder jüngste Plan ist Credit-Base/Reserve-Aufbau.
- Mindestens eine legale, nicht ausgeschlossene `draw_card`-Alternative ist vorhanden.
- Sichere Run-Alternativen sind gerade nicht vorhanden oder durch bekannte Coverage-/No-Access-Gates blockiert.
- Keine generelle Credit-Strafe.
- Keine generelle Draw-Priorisierung.
- Keine Bestrafung von Funding-/Survival-/Reachability-Bedarf.

## Nicht zulässige Kandidaten

- `start_run` als Ersatz, solange bekannte Pfade wegen fehlender Wall-Coverage ausgeschlossen sind.
- `install_card`, solange nicht belegt ist, dass die konkrete Installation Wall-Coverage behebt.
- Pauschale Strafe gegen Runner-Credits bei Coverage-Lücke.

## Erwartete Evidence für AI121

Ein späterer Fix muss im Trace mindestens diese Evidence tragen:

- `runner_reserve_no_conversion_guard:true`
- `coverage_gap:wall`
- `safe_alternative:draw_card`
- `not_general_credit_penalty:true`

## Schlussfolgerung

AI117 ist kein Runtime-Fix. Es ist eine Freigabe für genau einen späteren, engen Testkandidaten: Coverage-Draw darf gegenüber wiederholtem späten Reserve-Credit bevorzugt werden, wenn Run-Alternativen wegen derselben Coverage-Lücke blockiert sind.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
