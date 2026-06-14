# Originalset Corp ICE Tax Worklist

Status: `diagnostic_tests_added`

Datum: 2026-06-13

Bezug: AI-MAT5-17

## Scope

- Data Masons
- Encoder Inc.
- Skälderviken SA Beta Test Site
- Jerusalem City Grid
- Crystal Palace Station Grid
- Tesseract Fort Construction
- Ball and Chain
- Virizz
- Newsgroup Taunting

## Abdeckung

Der Invariant-Test `covers corp ice tax worklist package as diagnostic semantics` prüft:

- `ice_tax`
- `rez_discount`
- `subroutine_support`
- `break_cost_tax`
- `run_tax`
- `constraint.only_model`
- `target_profile.required`

## Grenzen

Das Paket trennt constraints-only Effekte von TargetProfiles. Es erzeugt keine Rez-Kosten-Änderung, keine Break-Kosten-Neuberechnung, keine ICE-Subroutine-Ausführung und keine Runtime-Scoring-Änderung. Reale RunTax- und BreakCost-Projektionen bleiben an separate Engine-/AI-Quote-Modelle gebunden.
