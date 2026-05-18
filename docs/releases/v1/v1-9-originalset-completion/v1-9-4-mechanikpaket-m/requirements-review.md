# V1.9.4 Requirements Review

Stand: 2026-05-10  
Status: pass

## Review-Gegenstand

Geprueft wurden:

- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/plan-to-v1-9-4.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/requirements.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/spec.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-4-mechanikpaket-m/test-matrix.md`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-1-mechanikpaket-j/open-points-grobplan-to-v1-9-8.md`

## Ergebnis

`V1_9_4_requirements_freeze_done: true`  
`ready_for_V1_9_4_implementation_after_V1_9_3_and_preflight: true`

V1.9.4 ist als Damage-/Prevention-/Core-Hochrisiko-Release umsetzungsreif vorbereitet, mit verpflichtendem Preflight vor Code.

## Geklaerte Entscheidungen

- Scope bleibt strikt auf Damage/Prevention/Core-Familien.
- `Data Darts` ist als Pflichtentscheid vor Implementierung verankert.
- Kein Vorziehen von V1.9.5+-Themen.

## Offene Punkte (nicht blockierend fuer V1.9.4)

1. Finale V1.9.4-Allowlist wird erst im Preflight eingefroren.
2. Uebergabe der verbleibenden Deferred-Menge an V1.9.5 muss im V1.9.4-Final-Review dokumentiert werden.

## Gate

V1.9.4 ist nach V1.9.3-Final-Gate und V1.9.4-Preflight zur Umsetzung freigegeben.
