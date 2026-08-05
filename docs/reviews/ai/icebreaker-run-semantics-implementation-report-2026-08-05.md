# Icebreaker Run Semantics – Implementierungsbericht

## Ergebnis

Die sichtbare Engine-Quote `visibleBreakerEncounterQuote` ist die gemeinsame
Quelle für effektive Stärke, konkrete Subroutinen-Coverage, Pump- und
Breakoptionen eines sichtbaren Breaker-/ICE-Encounters. Die AI-Pfadberechnung
konsumiert diese Quote. Der Black-Widow-Bonus wird über die deklarative
Kartenimplementierung und die exakte Instanzbindung bestimmt.

Run-dauerhafte Breakerfolgen liegen in `RunState.breakerState`: Stärke-
modifikatoren, erfolgreiche Break-Zähler und einmalige Free-Breaks sind nicht
mehr als kartenspezifische Runfelder modelliert. Die Pre-Run-Pfadberechnung
führt dieselben Stärkefortschreibungen, Pending-Free-Breaks,
Stealth-Nebenkosten und sichtbaren Risikofolgen fort. Für Bartmoss werden die
Fortsetzungen „bleibt installiert“ und „wird getrasht“ separat ausgewiesen;
die Trash-Fortsetzung plant den Breaker nicht mehr für spätere ICE ein.

## Geänderte Dateien

- `packages/engine/src/game/view/visible-breaker-encounter-quote.ts`
- `packages/ai/src/run-analysis/visible-run-breaker-path.ts`
- `scripts/check-icebreaker-run-semantics.mjs`
- `docs/reviews/ai/icebreaker-run-semantics-audit-2026-08-05.json`

## Katalog und Validierung

Der Check erfasst 47 aktive Icebreaker aus Originalset, Classic und Proteus.
Er verlangt für jeden Eintrag ein maschinenlesbares Profil, strukturierte
Engine-Abdeckung und keinen `unknown_special`- oder Rule-Text-Pflichtpfad.

Die statusführende Einzelkarten-Evidenz liegt im erzeugten
`icebreaker-run-semantics-audit-2026-08-05.json`. Dieser Bericht dokumentiert
Architektur und Verifikation, nicht eine historische Teilstatus-Tabelle.

## Verifikation

- `corepack pnpm check:icebreaker-run-semantics`
- Engine-Typecheck
- Quote-Regressionstest (11 Tests)
- AI-visible-run-analysis (60 Tests)
- `git diff --check`
