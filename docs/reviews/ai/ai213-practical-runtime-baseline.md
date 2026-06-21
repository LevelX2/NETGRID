# AI213 Practical Runtime Baseline

Datum: 2026-06-21

## Zweck

AI213 fuehrt einen explizit geflaggten Comparator fuer praktische Micro-Runtime-Regeln ein. Der Comparator liegt hinter der bestehenden semantischen AI-Runtime und veraendert ohne Flag keine Entscheidung.

## Verhalten

- `mode: "off"` ist der Default und gibt die Runtime-Entscheidung unveraendert zurueck.
- `mode: "compare"` laesst die Runtime-Entscheidung aktiv, protokolliert aber Legacy-Aktion, Runtime-Aktion und den besten legalen Micro-Kandidaten in `evidence` und `decisionDebug.detailSections`.
- `mode: "apply"` darf nur einen Kandidaten auswaehlen, wenn dessen `actionId` in `input.legalActions` vorhanden ist und dessen Regel in `enabledRules` freigeschaltet wurde.
- Kandidaten ausserhalb von `input.legalActions` werden nicht angewendet.

## Sicherheitsgrenzen

- Der Comparator erzeugt keine neuen `LegalActions`.
- Der Comparator erweitert keine AI-Inputs und nutzt keine verdeckten Kartendaten.
- Bei einer angewendeten kandidatbasierten Entscheidung werden alte `selectedChoices` der Runtime-Referenz nicht uebernommen.
- Der Default-Pfad ist regressionsarm, weil ohne Flag exakt die bestehende Runtime-Entscheidung zurueckgegeben wird.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/practical-micro-runtime.test.ts`
- `corepack pnpm --filter @netgrid/ai run typecheck`

