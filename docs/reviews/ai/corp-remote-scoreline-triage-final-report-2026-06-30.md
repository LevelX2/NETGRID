# Corp Remote Scoreline Triage Final Report 2026-06-30

## Analysiertes Match

- Match: `match_95e375a5711a40ae`
- Quelle: `data/runtime/multiplayer/netgrid.sqlite`
- Ende: Runner-Sieg durch `agenda_points` bei `state_version` 324

## Umgesetzte Änderungen

- `semanticRuntimeCorpScoringWindowAssessment` stuft eine nicht sofort schließbare Scoreline nicht mehr als `durable` ein, wenn die Sicherheit nur an fehlender sichtbarer Breaker-Coverage hängt und der Runner vor dem Score ein volles Exposure-Fenster mit ausreichend Credits bekommt.
- `semanticRuntimeCorpInstallRemoteScore` erhält eine bestehende leere Scoring-Remote mit 1-2 ICE und Agenda-Druck im HQ besser als künftige Score-Basis. Der Bonus ist auf bestehende Remotes begrenzt, verlangt bezahlbare Reserve und endet vor generischem viertem ICE; dynamisch/positionsabhängig schwache ICE bleiben deutlich niedriger.
- `semanticRuntimeCorpBoardTriageActionComponent` behandelt `protect_score_remote` bei hoher oder kritischer Severity als echten Sperrkontext. Economy, Draw, End-Turn, Archives-/Off-Target-Installationen und nicht zielgerichtete Rezzes werden dann als harter Mismatch bewertet, sofern sie nicht konkret Remote-Schutz oder einen side-safe Score-Closeout bedienen.
- Die Triage-Evidence zeigt neben Roh- und Normalwert jetzt auch `triage_component_value`, damit sichtbar ist, wann ein kritischer Remote-Schutz bewusst härter als der normalisierte Triage-Hinweis wirkt.

## Regressionen

Neue Tests decken ab:

- Zwei bezahlbare relevante ICE erzeugen keine `durable`-Next-Turn-Scoreline, wenn der Runner mit vollem Exposure und nur fehlender sichtbarer Coverage contesten kann.
- Eine bestehende leere Remote 1 mit zwei ICE und Agenda im HQ bekommt Remote-Erhaltungswert; eine Remote mit drei ICE bekommt keinen weiteren generischen Spam-Bonus.
- `Marine Arcology`-Economy wird bei `protect_score_remote critical` nicht mehr neutral durchgelassen und verliert gegen konkrete Remote-ICE-Protection.

## Verifikation

Grün:

- `.\node_modules\.bin\vitest.cmd --run packages/ai/src/runtime/semantic-runtime-corp-score.test.ts packages/ai/src/runtime/semantic-runtime-corp-scoring-window.test.ts packages/ai/src/runtime/semantic-runtime-corp-remote-score.test.ts` - 3 Dateien, 100 Tests
- `.\node_modules\.bin\tsc.cmd -p packages/ai/tsconfig.json --noEmit`
- `node scripts/check-format-changed.mjs`
- `node scripts/check-ai-compiled-hints.mjs`
- `node scripts/check-ai-derived-facts.mjs --check`
- `node scripts/check-ai-hint-compiled-index.mjs --check`
- `node scripts/check-ai-manual-overlays.mjs --check`
- `node scripts/check-ai-action-semantic-signal-catalog.mjs --check`

Nicht als Gate-Erfolg gewertet:

- Der breite direkte AI-Vitest-Lauf `.\node_modules\.bin\vitest.cmd run --maxWorkers=1 --testTimeout=30000 packages/ai/src` lief nach 184 Sekunden in das Tool-Timeout ohne verwertbare Testausgabe. Ein verbliebener Vitest-Node-Prozess aus diesem Lauf wurde beendet. Es gab keinen fachlichen Fehleroutput, aber der Lauf zählt nicht als bestanden.
- Ein erster `pnpm vitest`-Aufruf scheiterte im frischen Worktree am pnpm-Build-Approval-Guard für `esbuild`/`sharp`. Die Verifikation wurde deshalb direkt über die lokalen `node_modules`-Binaries ausgeführt.

## Restrisiko

Der Fix stärkt gezielt die beobachteten Fehlmuster, bleibt aber heuristisch. In kritischen Remote-Schutzlagen können nicht zielgerichtete Economy-Aktionen nun deutlich stärker verlieren; wenn keine brauchbare Remote-Schutzaktion legal ist, wählt die KI weiterhin nur die beste vorhandene LegalAction. Die echte Spielstärke sollte im nächsten 100-Seed-Benchmark und in weiteren Playtests verglichen werden.
