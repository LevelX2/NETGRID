# Upgrade Install Placement Guardrails Final Review 2026-07-05

## Status

`ready_for_integration`

## Ergebnis

Die Corp-KI bewertet Upgrade-Root-Installationen jetzt mit einer eigenen signalbasierten Zielserver-Fit-Komponente.

Umgesetzt:

- neuer Runtime-Verbraucher `corpUpgradeInstallPlacementComponent`;
- Einbindung in `semanticRuntimeCorpScoreComponents` für `install_card` mit `placement: "root"`;
- harter Mismatch-Malus für Agenda-Difficulty-Upgrades auf Central-Servern;
- HQ-only- und HQ/R&D-only-Gates für Signale wie `condition.during_hq_run` und `access.corp_central_access_reduction`;
- positiver Fit für Agenda-Difficulty-Upgrades nur auf aktivem oder vorbereitetem Scoring-Remote;
- Defer für signalfreie Support-/Low-Value-Upgrades;
- Regressionen für Washington, Panic Button, Simon Francisco und Simple Upgrade.

## Fachliche Wirkung

`Washington, D.C., City Grid` und die drei subtype-spezifischen Agenda-Difficulty-Upgrades können weiterhin als legale Engine-Aktionen erscheinen, werden aber auf HQ/R&D/Archives von der KI hart abgewertet. Damit ersetzt der neue Verbraucher keine Regeln, sondern verhindert strategisch unsinnige Auswahl unter vorhandenen `LegalActions`.

Central-Upgrades bleiben als Gegenbeispiele erhalten:

- `Panic Button` erhält Fit auf HQ und Mismatch auf Remote.
- `Simon Francisco` erhält Fit auf HQ/R&D und Mismatch auf Remote.

Support-only-Upgrades ohne sinnvolles semantisches Placement-Signal erhalten keinen versteckten positiven Scoreline-Aufbau.

## Geänderte Artefakte

- `docs/architecture/ai/upgrade-install-placement-guardrails-process-2026-07-05.md`
- `docs/reviews/ai/upgrade-install-placement-guardrails-evidence-2026-07-05.md`
- `docs/reviews/ai/upgrade-install-placement-guardrails-final-review-2026-07-05.md`
- `packages/ai/src/runtime/corp-upgrade-placement.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-score.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-score.test.ts`

## Verifikation

Bereits vor diesem Review gelaufen:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000`
- `git diff --check`

Final vor Integration erneut auszuführen:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000`
- `git diff --check`

## Nicht geändert

- Keine Engine-Regeln.
- Keine LegalAction-Erzeugung.
- Keine PlayerViews, Replays, StateHash- oder Randomness-Verträge.
- Keine Hidden-Info-Auswertung.
- Keine Kartennamen-Sonderlogik im Runtime-Verbraucher.

## Restpunkte

- Remote-Tax-/Ambush-/ICE-Support-Upgrades werden bewusst konservativer bewertet als die harten Mismatch-Klassen. Sie haben jetzt erste Fit-/Defer-Logik, aber spätere Playtest-Evidence kann feinere Serverzustandsmodelle für erwartete Runs, Tags, Traces und ICE-Dichte rechtfertigen.
