# AI A7D1 Replay Fixes Process 2026-06-27

## Status

`in_progress`

## Quelle

- Lokale SQLite-Runtime: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Match: `match_a7d1feae5a06829c`
- Modus: `human_runner_vs_corp_ai`
- Ergebnis: Runner-Sieg durch Agenda-Punkte, StateVersion 109, beendet 2026-06-27 18:00:01 MESZ.

## Gesamtziel

Die zwei aus `match_a7d1feae5a06829c` freigegebenen Corp-KI-Fehler generisch beheben:

1. Variable-X-Rez mit sichtbarer Nullwirkung als riskant erkennen.
2. Remote-Scorelines, die nicht sofort schließbar und sichtbar contestable sind, stärker gegen Scoreline-/Plan-Mapping-Drang absichern.

## Invarianten

- Die KI nutzt nur `LegalActions`, Corp-PlayerView, side-safe PublicEvents und redigierte AI-Metadaten.
- Keine FullState- oder Hidden-Info-Nutzung für Entscheidungen, Debug oder Tests.
- `applyAction`, Replay, StateHash und Randomness bleiben unverändert.
- Keine Kartennamen-Sonderlogik im produktiven Verhalten.

## Nicht-Ziele

- Keine Engine-/LegalAction-Erweiterung.
- Keine Änderungen an Kartendaten oder AI-Hints, sofern die Runtime aus vorhandenen sichtbaren Signalen entscheiden kann.
- Kein tagged-payoff-Folgefix aus diesem Match; das Spiel belegt dafür kein relevantes Corp-Entscheidungsfenster.

## Paketfolge

### Paket A: Prozess und Evidence

- Prozessartefakt und Evidence-Report anlegen.
- Done-Gate: Match-ID, Fehlerpunkte, Invarianten und Paketplan dokumentiert.
- Commit: `docs(ai): record a7d1 replay fix plan`

### Paket B: Variable-X-Rez-Wirkung

- Effective-Defense-Kontext so erweitern, dass variable Stärke/Rezzes mit `X=0` ohne Stop-/Tax-/Damage-Wirkung als `zeroEffectRisk` gelten.
- Rez-Scoring so absichern, dass solche Aktionen nicht durch generischen Rez-Druck vor `decline_rez` gewinnen.
- Fokussierte Tests für Digiconda-artige variable Stärke ohne Trace-Signal.
- Commit: `fix(ai): reject zero-value variable rez defense`

### Paket C: Remote-Scoreline-Viability

- Remote-Contestability auch für neu installierte Scoreline-Roots und nur unrezzed geschützte Remotes aus sichtbarem Runner-Kostendruck beurteilen.
- Passive-Scoreline-Penalties nur stark anwenden, wenn die Scoreline-Viability nicht wegen Contestability oder Rez-Floor blockiert ist.
- Fokussierte Tests für die A7D1-Muster SV42, SV77/SV79 und SV94/SV95/SV96.
- Commit: `fix(ai): harden contestable remote scorelines`

### Paket D: Verification und Integration

- Fokussierte Runtime-/Cutover-Tests ausführen.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- Wenn realistisch: `corepack pnpm --filter @netgrid/ai test`
- Finalen Review aktualisieren und Arbeitsbranch lokal nach `main` integrieren.
- Commit: `docs(ai): finalize a7d1 replay fixes`

## Worktree

- Worktree: `C:\Projekte\NETGRID_AI_A7D1_REPLAY_FIXES`
- Branch: `codex/ai-a7d1-replay-fixes`
- Finaler Merge: lokal per `main`, kein Push ohne ausdrücklichen Nutzerwunsch.
