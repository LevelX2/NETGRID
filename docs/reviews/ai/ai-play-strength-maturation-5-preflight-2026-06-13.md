# AI Play-Strength Maturation 5 Preflight

Datum: 2026-06-14

## Ausgangslage

AI-MAT5 startet im Arbeitsbranch `codex/ai-play-strength-maturation-5` im Worktree `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_MATURATION_5`.

Lokaler Start-HEAD:

```text
cb894d8acadd9a1c7c383fea98bfd2e73cf14b82
```

Damit ist der lokale Startstand neuer als die im MAT5-Auftrag genannten Kontrollpunkte `952f22dc`, `f880da39` und `5fac6419`.

## HEAD- und Holovid-Einordnung

`5fac6419 Fix Holovid remote trash repeat planning` ist im lokalen Startstand enthalten. Der Fix gehört nicht mehr zur Maturation-IV-Serie, sondern ist ein nachgelagerter konkreter AI-Fix. Er berührt:

- `packages/ai/src/known-remote-access-payoff.ts`
- `packages/ai/src/index.test.ts`
- `docs/activities/done/act-2026-06-13-runner-ai-holovid-remote-trash-commitment.md`

Der aktuelle Start-HEAD enthält außerdem spätere AI181-AI200-Arbeiten. AI-MAT5 wird daher nicht als direkter Nachfolger des MAT4-Branch-HEADs verstanden, sondern als neue Paketserie auf dem aktuellen `main`.

## Lokale Änderungen und Activity-Dateien

Der MAT5-Worktree war beim Start sauber. Im primären Repository `C:\Projekte\NETGRID` existiert unabhängig davon eine uncommitted Änderung in `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md` zur lokalen Python-/Toolchain-Basis. Diese Änderung wird nicht in die MAT5-Serie übernommen und nicht überschrieben.

Im MAT5-Worktree waren zum Preflight keine offenen Activity-Dateien oder sonstigen Arbeitsdateien vorhanden.

## Testzahlen

Der MAT4-Final-Report nennt als FINAL-GREEN für `@netgrid/ai test` 97 Testdateien und 1340 Tests. Der aktuelle Startstand ist weitergewachsen:

```text
corepack pnpm --filter @netgrid/ai test
101 Testdateien, 1364 Tests
```

Die Differenz ist erwartbar, weil der lokale `main` nach MAT4 weitere AI-Arbeiten und Regressionen enthält.

## Preflight-Verifikation

Vor dem ersten Testlauf musste der neue Worktree mit `corepack pnpm install --frozen-lockfile` eingerichtet werden, weil `node_modules` noch fehlte und `vitest` dadurch nicht gefunden wurde. Danach bestanden:

```text
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Ergebnis: Preflight grün.

## Scope-Grenzen für MAT5

AI-MAT5 bleibt eine AI-interne Play-Strength-, Diagnose- und Strukturserie. Nicht geändert werden:

- Engine-Regelautorität
- `LegalActions`-/`PlayerActions`-Vertrag
- `applyAction`-Revalidation
- Replay, StateHash oder Randomness
- Hidden-Info-Redaction-Vertrag
- Proteus-KI-Freigabe
- produktive TargetChoice-Auswahlpayloads
