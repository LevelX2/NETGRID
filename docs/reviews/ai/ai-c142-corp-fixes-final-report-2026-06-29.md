# AI C142 Corp Fixes Final Report 2026-06-29

## Ergebnis

Die freigegebenen Corp-KI-Fixpunkte aus `match_c1426609ec05a7d5` wurden im Worktree `C:\Projekte\NETGRID_AI_C142_CORP_FIXES` umgesetzt:

- `Social Engineering` nutzt nun für die Corp eine eigene Secret-Guess-Bid-Policy. Auf `hard` wird der höchste sichtbare Legal-Choice-Wert gewählt; normale Trace- und `Too Many Doors`-Bids bleiben konservativ.
- Post-Pass-ICE-Lifecycle-Aktionen bewerten Schutzverlust explizit. `return_to_hq` wird auf Zentralservern stark bestraft; bei HQ wird die spätere +2-Installationsbelastung als Evidence geführt.
- Rez-Entscheidungen berücksichtigen eine innere ICE-Reserve: ein sichtbar breakbares oder wirkungsschwaches äußeres Rez wird bestraft, wenn danach das relevante innere ICE nicht mehr rezbar ist.
- Scoring-Window-Zentraldruck berücksichtigt jetzt auch sichtbare Access-Erreichbarkeit gegen vorhandenes HQ-/R&D-ICE, nicht nur komplett leere Zentralserver.
- Remote-Support, der Advancement-Counter-Kontext braucht, wird ohne Agenda/Counter im Remote heruntergestuft.
- `gain_credit` erhält eine Reserve-satisfied-Strafe, wenn kein Remote-/Central-Rez-Funding mehr fehlt und konkrete Entwicklungsaktionen legal sind.

## Verifikation

Grün:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/bid-choice-option.test.ts src/runtime/semantic-runtime-corp-score.test.ts src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-effective-defense.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts --maxWorkers=1 --reporter=dot`
- `corepack pnpm --filter @netgrid/ai typecheck`

Nicht als Gate-Erfolg gewertet:

- Vollständige `@netgrid/ai`-Vitest-Suite wurde mit kompakter Ausgabe versucht, lief aber nach 300 Sekunden in das Tool-Timeout und brach mit `EPIPE` ab. Es lag kein einzelner fachlicher Testfehler vor, aber der Lauf ist nicht als erfolgreich gezählt.

## Restrisiko

Die Änderungen bleiben heuristisch. Sie verbessern die Replay-Fehlmuster, garantieren aber nicht, dass die Corp jedes Scoring-Fenster optimal erkennt. Besonders Secret-Guess-Spiele bleiben ohne Runner-Hand-/Stack-Annahmen strategisch unvollständig; die neue Policy vermeidet aber das beobachtete Low-Guess-Default-Muster.
