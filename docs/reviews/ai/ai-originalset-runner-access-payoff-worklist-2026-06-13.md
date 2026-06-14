# Originalset Runner Access Payoff Worklist

Status: `diagnostic_tests_added`

Datum: 2026-06-13

Bezug: AI-MAT5-14

## Scope

- R&D Interface
- HQ Interface
- Executive Wiretaps
- Custodial Position
- Rush Hour
- All-Hands
- Kilroy Was Here
- Romp through HQ
- Crumble
- Garbage In
- Highlighter
- Vienna 22

## Abdeckung

Der Invariant-Test `covers runner access payoff worklist package as diagnostic semantics` prüft diese funktionalen Signale:

- `access.hq_multiaccess`
- `access.rnd_multiaccess`
- `access.free_trash`
- `access.central_payoff`
- `run.structure_only`

## Grenzen

Das Paket unterscheidet Run-Struktur von tatsächlichem Access-Payoff. Es erzeugt keine neuen LegalActions, keine TargetChoices, keine selectedChoices und keine Runtime-Gewichtung. TargetProfiles bleiben `not_available`, bis side-sichere Access- und Card-Target-Kontexte separat modelliert sind.
