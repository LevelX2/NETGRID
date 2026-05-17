---
activityId: act-2026-05-17-runner-two-turn-rig-economy-plan
status: done
kind: fix
area: ai
priority: normal
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch: codex/activity-worker-1
parallelWorker: worker-1
releaseTarget:
blockedBy:
  - act-2026-05-17-ai-visible-run-runtime-card-audit
  - act-2026-05-17-ai-match-progression-benchmark
resultArtifacts:
  - packages/ai/src/runner-plans.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai test -- --runInBand
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm -r --if-present typecheck
  - git diff --check
---

# Runner-Zwei-Zug-Plan für Rig und Economy vorbereiten

## Ziel

Die Runner-KI soll erkennbare Zielserver nicht sofort unprofitabel anlaufen, sondern über ein kleines side-sicheres Zwei-Zug-Intent erst Credits, Breaker oder Kartenaufbau vorbereiten und danach zum sinnvollen Run wechseln.

## Kontext und Quellen

- `docs/derived/AI_CAPABILITY_DEEP_ANALYSIS_2026_05_17.md`, Abschnitte `P1: Runner Zwei-Zug-Rig/Economy-Plan`, `Runner-Analyse` und `Größte Schwächen`.
- Verwandtes erledigtes Paket: `docs/activities/done/act-2026-05-17-runner-ai-repeat-rd-run.md` hat nur den wirkungslosen Repeat-R&D-Spezialfall behoben.
- Dieses Paket ist die nächste bewusst kleine Planhorizont-Erweiterung, nicht eine komplette Runner-KI-Neuschreibung.

## Scope

- Einen side-sicheren Runner-Intent modellieren oder vorhandene Planbewertung erweitern: `Zielserver später contesten`.
- Benötigte Credits, installierte sichtbare Breaker, Memory und aktuelle Boardlage aus eigener Sicht und sichtbaren/rezzed ICE ableiten.
- Economy-, Draw-, Search- oder Breaker-Install-Aktionen höher bewerten, wenn sie eine realistische Schwelle für den geplanten Run erreichen.
- Nach Erreichen der Schwelle zum Zielrun wechseln, statt weiter nur aufzubauen.
- Fixtures für mindestens zwei Fälle:
  - unprofitabler Sofortrun wird durch Setup/Economy verdrängt,
  - nach Setup wird der geplante Run tatsächlich gewählt.

## Nicht im Scope

- Keine Hidden-ICE-Titel, keine Corp-Hand, keine Corp-Deckliste und keine reale Hidden-State-Welt.
- Keine allgemeine probabilistische Rollout-KI.
- Keine Änderung an Run-Legalität oder Breaker-Regeln.
- Keine harte Sperre gegen opportunistische Runs, wenn die sichtbare Lage bereits gut ist.

## Akzeptanzkriterien

- [x] Runner-KI wählt in einem klaren Fixture Setup/Economy vor einem sichtbar unprofitablen Run.
- [x] Runner-KI wechselt nach erreichter sichtbarer Kosten-/Breaker-Schwelle zum Zielrun.
- [x] Der Intent ist kurzlebig und wird invalidiert, wenn sich Zielserver, Credits, sichtbare ICE oder installierte Breaker relevant ändern.
- [x] Benchmark- oder Testdaten zeigen keine Safety-Regression und keine neue Action-Limit-Endlosschleife.
- [x] Die Implementierung nutzt nur eigene private Informationen, PlayerView, LegalActions und side-sichere Events.

## Umsetzungshinweise

- Erst nach oder gemeinsam mit dem sichtbaren Runtime-Karten-Audit angehen, damit Breaker-/ICE-Kosten nicht auf falschen Definitionen beruhen.
- Den Planhorizont klein halten: ein konkretes Ziel und ein kurzer Aufbaupfad reichen.
- Bei mehreren Zielservern lieber eine nachvollziehbare Priorisierung testen als alle Heuristiken in einem Schritt optimieren.

## Ergebnisnotiz

Umgesetzt in `packages/ai/src/runner-plans.ts` als side-sicherer, nicht persistierter Runner-Zwei-Zug-Intent. Der Intent wird pro Entscheidung aus PlayerView und LegalActions rekonstruiert, priorisiert einen strategischen Zielserver mit sichtbarer Breakkosten-Schwelle, boostet Economy/Setup vor nicht bezahlbaren Runs und boostet den Zielrun, sobald die sichtbare Schwelle erreicht ist. Die Debug-Evidence dokumentiert Ziel, Ready-State, Schwelle, Credits-Bedarf und die Invalidierungsbasis aus Zielserver, Credits, sichtbarem ICE und sichtbaren installierten Breakern.

`packages/ai/src/index.test.ts` ergänzt zwei Fixtures: Economy vor unprofitablem sichtbaren HQ-Run bei Credits unter der Schwelle und Wechsel zum HQ-Run nach erreichter sichtbarer Schwelle. Der AI-Testlauf, AI-Typecheck, Workspace-Typecheck und `git diff --check` sind grün. Keine Hidden-Info, FullState-Auswertung oder Run-Regeländerung wurde eingeführt.
