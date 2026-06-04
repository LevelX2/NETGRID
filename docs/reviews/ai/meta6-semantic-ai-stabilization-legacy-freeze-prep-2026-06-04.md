# META 6 Semantic AI Stabilization + Legacy-Freeze Prep

Stand: 2026-06-04
Status: complete

## Ziel

META 6 stabilisiert die META-1-bis-META-5-Linie und bereitet eine spätere begrenzte Nutzung vor. Full Replacement und Legacy Removal bleiben ausgeschlossen.

## Ergebnis

Ergänzt wurden:

- Scope Readiness Matrix mit `shadow_ready`, `agreement_ready`, `test_override_ready`, `internal_canary_ready`, `limited_candidate` und `blocked`.
- Production-safe Trace Scrubber Vertrag gegen Gegnerhand, HQ/R&D-Details für die falsche Seite, unrezzed ICE Details für Runner, verdeckte Remote-Inhalte, FullState-Fragmente, Choice-Option-Leaks und private Debugdaten.
- Legacy-Freeze-Kriterien mit blockierten Bedingungen für Human Review und multi-run Metrics.
- Expansion Plan von basic economy/draw bis multi-target/multi-ability.
- Go/No-Go: `limited_rollout_candidate_for_selected_scopes`.

## Scope Readiness

| Scope | Status |
| --- | --- |
| `basic_economy_draw` | `limited_candidate` |
| `basic_install` | `agreement_ready` |
| `tag_removal` | `limited_candidate` |
| `simple_score_advance` | `limited_candidate` |
| `simple_run_choice` | `limited_candidate` |
| `simple_rez` | `agreement_ready` |
| `remote_contest` | `shadow_ready` |
| `access_trash_steal` | `blocked` |
| `trace_payment` | `blocked` |
| `damage_prevention` | `blocked` |
| `multi_target_multi_ability` | `blocked` |

## Quality Gates

| Gate | Ergebnis |
| --- | --- |
| Scope readiness matrix exists | pass |
| Trace scrubber passes | pass |
| Legacy fallback available | pass |
| Rollback available | pass |
| Hard-gate failures | 0 |
| Unsafe divergences | 0 |
| `fullProductionReady` | false |
| `legacyRemovalReady` | false |

## Go/No-Go

Ergebnis: `limited_rollout_candidate_for_selected_scopes`.

Nicht erlaubt:

- `full_production_ready`
- `legacy_removal_ready`

## Verifikation

```text
node scripts/check-meta6-semantic-ai-stabilization-legacy-freeze-prep.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Abschlussstand

META 1 bis META 6 sind abgeschlossen. Die Linie liefert einen semantischen KI-Kern mit Doctrine, Multi-Turn Goals, Decision Score, WhyNot, Cutover-Safety, Agreement-only Canary, testinternem Scoped Override und Stabilisierung. Produktive Aktivierung bleibt aus.
