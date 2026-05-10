# V1.9.1 bis V1.9.4 Sequenz-Audit (Abschluss)

Stand: 2026-05-10  
Status: completed

## Ziel als konkrete Erfolgskriterien

1. Umsetzung strikt sequenziell: `V1.9.1 -> V1.9.2 -> V1.9.3 -> V1.9.4`.
2. Umsetzung im selben separaten Worktree und auf demselben Arbeitsbranch.
3. Keine Freigabe-Pausen zwischen den vier Releases.
4. Pro Release vollständiger Ablauf mit Pflichtartefakten und Pflichtchecks.
5. Harte Gates bleiben erfüllt: Engine-Korrektheit, Hidden-Info-Schutz, Replay-/StateHash-Determinismus, LegalAction-only.
6. Kein Scope-Drift in Richtung V2.x.

## Prompt-zu-Artefakt-Checkliste

| Pflichtpunkt | Evidenz | Status |
| --- | --- | --- |
| Ein Worktree für alle vier Schritte | `codex/v1-9-1-bis-v1-9-4-sequenziell` unter `C:\\Projekte\\NETGRID-worktrees\\v1-9-1-bis-v1-9-4-sequenziell` | erfüllt |
| Sequenz ohne Zwischenfreigabe | V1.9.1 bis V1.9.4 nacheinander abgeschlossen, kein Stop-and-Approve mehr aktiv | erfüllt |
| V1.9.1 Pflichtartefakte | `docs/derived/V1_9_1_*`, `data/*1.9.1*` | erfüllt |
| V1.9.2 Pflichtartefakte | `docs/derived/V1_9_2_*`, `data/*1.9.2*` | erfüllt |
| V1.9.3 Pflichtartefakte | `docs/derived/V1_9_3_RELEASE_ASSIGNMENT_PREFLIGHT.md`, `docs/derived/V1_9_3_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_9_3_FINAL_REVIEW.md`, `data/*1.9.3*` | erfüllt |
| V1.9.4 Pflichtartefakte | `docs/derived/V1_9_4_RELEASE_ASSIGNMENT_PREFLIGHT.md`, `docs/derived/V1_9_4_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_9_4_FINAL_REVIEW.md`, `data/*1.9.4*` | erfüllt |
| Sichtbare Web-Version am Abschluss | `apps/web/app/page.tsx` zeigt `V1.9.4`; Visibility-Vertrag angepasst | erfüllt |
| Status- und Wissenspflege aktualisiert | `docs/codex/CODEX_STATUS.md`, `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md` | erfüllt |

## Harte Gate-Evidenz

1. Hidden-Info-Schutz:
   - `tests/specs/visibility-contract.test.ts`
   - `packages/engine/src/index.test.ts`
2. Replay/StateHash-Determinismus:
   - Engine-Replay-/Hash-Checks in `packages/engine/src/index.test.ts`
3. LegalAction-only und stale/illegal rejection:
   - Engine-/Server-Tests in `packages/engine/src/index.test.ts` und `apps/server/src/multiplayer.test.ts`

## Pflichtchecks (Abschlusslauf)

- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass
- `corepack pnpm --filter @netgrid/engine test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/catalog test -- index.test.ts`: pass
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: pass

## Ergebnis

Die Sequenz `V1.9.1 -> V1.9.2 -> V1.9.3 -> V1.9.4` ist vollständig abgeschlossen.  
Gate-Status: `V1_9_1_bis_V1_9_4_sequenziell_abgeschlossen: true`.
