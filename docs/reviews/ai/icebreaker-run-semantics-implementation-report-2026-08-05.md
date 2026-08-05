# Icebreaker Run Semantics – Implementierungsbericht

## Ergebnis

Die sichtbare Engine-Quote `visibleBreakerEncounterQuote` ist die gemeinsame
Quelle für effektive Stärke, Coverage, Pump- und Breakwerte eines sichtbaren
Breaker-/ICE-Encounters. Die AI-Pfadberechnung konsumiert diese Quote vor ihren
historischen Profil- und Text-Fallbacks. Der Black-Widow-Bonus wird dabei über
die deklarative Kartenimplementierung und die exakte Instanzbindung bestimmt.

## Geänderte Dateien

- `packages/engine/src/game/view/visible-breaker-encounter-quote.ts`
- `packages/ai/src/run-analysis/visible-run-breaker-path.ts`
- `scripts/check-icebreaker-run-semantics.mjs`
- `docs/reviews/ai/icebreaker-run-semantics-audit-2026-08-05.json`

## Katalog und Validierung

Der Check erfasst 47 aktive Icebreaker aus Originalset, Classic und Proteus.
Er verlangt für jeden Eintrag ein maschinenlesbares Profil, strukturierte
Engine-Abdeckung und keinen `unknown_special`- oder Rule-Text-Pflichtpfad.

| Karte | Engine-Regelmodell | Effektive Quote | Pre-Run-Solver | Runtime-Encounter | Tests | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Black Widow | Instanzbindung | ja | ja | ja | Quote | complete |
| Snowball | Runstärkebonus | bestehend | partial | ja | Bestand | partial |
| Grubb | Runstärke | bestehend | partial | ja | Bestand | partial |
| Dupré | Counter/Fort-Bindung | bestehend | partial | ja | Bestand | partial |
| Bulldozer | Folgeeffekt/Stealth | ja | partial | ja | Bestand | partial |
| Fubar | gewählter Subtype | ja | partial | ja | Quote | partial |
| Morphing Tool | gewählter Subtype | ja | partial | ja | Bestand | partial |
| Pile Driver | Mehrfachbreak/Stealth | ja | ja | ja | Bestand | complete |
| Replicator | Trace-Tag | Legacy-Subroutinepfad | ja | ja | Bestand | complete |
| Reflector | Subroutine-Tags | Legacy-Subroutinepfad | ja | ja | Bestand | complete |
| Dogcatcher | ICE-Subtype-Liste | ja | ja | ja | Bestand | complete |
| Japanese Water Torture | Actionfolge | bestehend | partial | ja | Bestand | partial |
| Dropp | Runende-Folge | Quote sperrt Zugriff | ja | ja | Bestand | complete |
| Bartmoss Memorial Icebreaker | Zufalls-Entsorgung | bestehend | partial | ja | Bestand | partial |
| Blink | Zufallsbreak | bestehend | partial | ja | Bestand | partial |
| AI Boon | Runwurf | sichtbare Stärke | partial | ja | Bestand | partial |
| Forward’s Legacy | Runwurf | sichtbare Stärke | partial | ja | Bestand | partial |

## Verifikation

- `corepack pnpm check:icebreaker-run-semantics`
- Engine-Typecheck
- Quote-Regressionstest (2 Tests)
- AI-visible-run-analysis (43 Tests)
- `git diff --check`
