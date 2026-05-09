# V1.6.1 Final Review - Mechanikpaket A

Stand: 2026-05-09  
Status: passed

## Gate-Ergebnis

V1.6.1 ist als Kernrelease implementiert, lokal verifiziert und final reviewt.

Gate: `V1_6_1_implemented: true`; `V1_6_1_verified: true`; `V1_6_1_done: true`; `ready_for_V1_6_2: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| Abhängigkeitsgate V1.6.0 | pass |
| Preflight `freigabefähig`/`deferred` | pass |
| Kernkorb exakt 6 Karten | pass |
| Runtime-Damage-Prevention aus Karten | pass |
| Core-Damage-ICE-Erweiterung | pass |
| V1.2.0/V1.2.1/V0.2-Regression | pass |
| Hidden-Info-Schutz | pass |
| Catalog-/Manifest-/Scenario-Konsistenz | pass |
| No-Scope-Grenzen | pass |

## Pflichtchecks

- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: pass

## Bekannte Grenzen

- Der ursprüngliche 111-Kartenkorb ist nicht vollständig in V1.6.1 umgesetzt.
- V1.6.1 liefert einen dokumentierten Kernkorb plus deferred Restkandidaten.
- Zusätzliche Runtime-Replacement- und Avoid/Tag-Familien bleiben in der Folgekette.
