# V1.1.2 Final Review - Full Archives Access und Matchstart Entry UX

Stand: 2026-05-07
Status: done

## Gate-Ergebnis

V1.1.2 ist vollständig implementiert und lokal verifiziert.

`V1_1_2_requirements_freeze_done: true`

`V1_1_2_implemented: true`

`V1_1_2_verified: true`

`V1_1_2_done: true`

## Verifikationsbericht

| Gate | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netgrid/shared typecheck` | pass |
| `corepack pnpm --filter @netgrid/engine test -- --run` | pass, 90 Tests |
| `corepack pnpm --filter @netgrid/server test -- --run` | pass, 53 Tests |
| `corepack pnpm --filter @netgrid/ai test -- --run` | pass, 29 Tests |
| `corepack pnpm --filter @netgrid/web test -- --run` | pass, 41 Tests |
| `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts` | pass, 14 Tests |
| `corepack pnpm lint` | pass |
| `corepack pnpm typecheck` | pass |
| `corepack pnpm test` | pass, Workspace-Tests plus Root-Specs |
| `corepack pnpm build` | pass, bekannte Turbopack-NFT-Warnung in `apps/web/next.config.ts` |
| `corepack pnpm e2e` | pass, 7 Browser-E2E-Tests |

## Finaler Befund

- Requirements Freeze: `V1_1_2_REQUIREMENTS.md`, `FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md`, `MATCHSTART_ENTRY_UX_1_1_2_SPEC.md`, `V1_1_2_TEST_MATRIX.md` und `V1_1_2_REQUIREMENTS_REVIEW.md` liegen vor; Review-Ergebnis `ready_for_implementation: true`.
- Full Archives Access: gemischte faceup/facedown Korp-Archives werden vollständig in deterministic Breach-Queues accessed.
- Visibility: Runner sieht facedown Archives-Karten vor Access nicht; Korp sieht eigene Archives vollständig; künftige Queue-Titel leaken nicht.
- Access/Trash/Steal/Decline: aktuelle Archives-Karte wird korrekt revealed, Trash aus Archives erzeugt keine doppelten Einträge, Agenda-Steal beendet den Zugriff sauber.
- Undo: Access bleibt als Hidden-Info-Barriere blockierend. Die Umsetzung ist konservativer als die minimale faceup-only-Sonderregel, aber zulässig und getestet.
- Replay/StateHash: Archives-Breach mit Reveal, Trash und Steal replayt deterministisch bis zum finalen StateHash.
- Multiplayer/Reconnect: laufender Archives-Breach wird side-sicher wiederhergestellt; Idempotency und stale StateVersion verhindern Doppel-Accesses.
- AI: Es wurde kein FullState- oder verdeckter Archives-Zugriff für Runner-KI eingeführt.
- Matchstart Entry UX: Spielart- und Format-Kacheln, Join-Link-Feld, manuelle Join-Optionen, Summary und E2E-Helfer sind umgesetzt.
- No-Scope: keine Prevention/Avoid/Interrupt/Replacement-, Kartenpool-, offizielle Asset- oder Plattform-Erweiterung wurde eingeführt.

## Bekannte Abweichungen

- Die bestehende Undo-Implementierung behandelt alle `access_card`-Events als Hidden-Info-Barriere. V1.1.2 lockert das für faceup-only Archives-Access nicht, sondern dokumentiert die konservative Regel.
- Die Build-Warnung zu Turbopack/NFT in der Next-Konfiguration besteht weiter als bekannte nicht-blockierende Warnung.

## Restpunkte

- Keine blockierenden Restpunkte für V1.1.2.
- Nächster empfohlener Gate-Schritt gemäß `docs/releases/v1/v1-1-3-mechanics-ai-card-baseline/post-v1-1-2-roadmap.md`: V1.1.3 Mechanics-AI-Card Baseline als Planungs-/Normalisierungsschritt ohne direkte Codeimplementierung.
- Nachtrag 2026-05-08: Die damalige Post-V1.1.2-Empfehlung ist in `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md` konsolidiert. Für aktuelle Releaseplanung ab V1.1.3 ist die konsolidierte Roadmap verbindlich.
