# AI159-AI169 Endgame Opportunity Process

Status: active

Datum: 2026-06-13

Branch: `codex/ai159-ai169-endgame-opportunity`

Worktree: `C:\Projekte\NETGRID_AI159_AI169_ENDGAME_OPPORTUNITY`

## Quelle/Vorgabe

Ausgang ist die GitHub-geprüfte Rückmeldung zu AI149-AI158. Der Block hat Safety bestätigt, aber keinen Runtime-Cutover erlaubt: AI149 fand 17 historische Challenger, 0 Same-State-Matches und 0 `same_state_legal_better`; AI158 blieb safety-grün, aber x5/x10 lagen weiter bei 11/23 Action-Limits.

## Zielprüfung

Die Vorgabe ist präzise genug für automatische Abarbeitung:

- Gesamtziel: nicht mehr terminale historische Challenger prüfen, sondern frühere Opportunity-States und Intent-Konversionen untersuchen.
- Paketfolge: AI159 bis AI169 ist vollständig vorgegeben.
- Artefakte: Review- und JSON-Dateien sind je Paket benannt.
- Sicherheitsgrenzen: keine neue LegalAction-Erzeugung, keine Hidden-Info-Ausweitung, keine generischen Credit-/Draw-/Run-/Corp-Economy-Strafen.
- Cutover-Gate: höchstens ein produktiver Fix, nur mit same-state oder opportunity-state LegalAction-Proof und x5/x10-Nachweis.
- Abschluss: Full Sweep mit Pflichtchecks und lokalem Merge nach `main`.

Kleine Lücke: Die Vorgabe nennt Artefaktdaten `2026-06-12`, die Umsetzung läuft am 2026-06-13. Die geforderten Review-Dateinamen bleiben für Anschlusskompatibilität erhalten; das Prozessartefakt nutzt das tatsächliche Prozessdatum.

## Gesamtziel

AI159 bis AI169 sollen den bisher bewiesenen Terminal-State-Blocker umgehen, ohne in Heuristik-Tuning zurückzufallen:

1. frühere Opportunity-States aus den 17 Challenger-Fällen minen,
2. stale Intents priorisieren,
3. konkrete Runner-Coverage- und Corp-Tempo-Pfade klassifizieren,
4. positive Selfplay-Progress-Patterns extrahieren,
5. Opportunity-Ladders und deterministischen Lookahead im Shadow bewerten,
6. höchstens einen bewiesenen Opportunity-Cutover schneiden oder No-Go dokumentieren,
7. Scorecard v2 und Full Sweep abschließen.

## Nicht-Ziele

- Keine Runtime-Wirkung ohne bewiesenen Opportunity-State.
- Keine neue LegalAction-Erzeugung.
- Keine Engine-, `applyAction`-, Replay-, StateHash- oder Randomness-Vertragsänderung.
- Keine Hidden-Info-Projektion in KI-Inputs, PlayerViews, PublicEvents, WebSocket-Payloads, Reconnect, Replays oder Logs.
- Keine generischen Mali gegen Credit, Draw, Run oder Corp-Economy.
- Keine pauschale Flag-Einführung ohne Kandidat.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- AI bewertet ausschließlich aus LegalActions abgeleitete Aktionen.
- Opportunity-Proof bedeutet: früherer relevanter Entscheidungszustand, side-safe LegalAction-Alternativen, Zielkontext ausreichend, Hard-/Risk-Gates grün.
- Shadow-Artefakte dürfen Prioritäten liefern, aber keine produktive Auswahl ändern.
- Default für neue Runtime-Wirkung bleibt off.

## Sicherheitsblocker

Stoppen und Blocker-Report schreiben, wenn:

- Hidden-Info-Leaks auftreten,
- eine LegalAction synthetisch erzeugt werden müsste,
- x5 oder x10 durch einen Fix schlechter wird,
- ein Cutover ohne Opportunity-Proof nötig wäre,
- TargetContext oder Kosten-/Timingprofil für einen Kandidaten nicht ausreichend belegbar ist.

## State Machine

`preflight -> AI159 -> AI160 -> AI161 -> AI162 -> AI163 -> AI164 -> AI165 -> AI166 -> AI167 -> AI168 -> AI169 -> integration -> complete`

Nur ein Paket ist aktiv. Kein Paket wird übersprungen.

## Paketfolge

| Paket | Titel | Kernartefakte | Done-Gate | Commit |
| --- | --- | --- | --- | --- |
| AI159 | Opportunity-State Mining | `docs/reviews/ai/ai159-opportunity-state-mining-2026-06-12.{md,json}` | 17 Fälle klassifiziert, redaction-safe, keine Runtime-Wirkung | `docs(ai): mine same-state opportunity windows` |
| AI160 | Stale Intent Root-Cause Review | `docs/reviews/ai/ai160-stale-intent-root-cause-review-2026-06-12.md` | 27 stale Intents priorisiert, keine Action-Malus-Heuristik | `docs(ai): classify stale endgame intents` |
| AI161 | Coverage Path Solver v2 | `docs/reviews/ai/ai161-coverage-path-solver-v2-2026-06-12.md` | konkrete Coverage-Pfade getrennt, Opportunity-Kandidat oder No-Go | `feat(ai): classify concrete runner coverage paths` |
| AI162 | Corp Tempo Conversion v2 | `docs/reviews/ai/ai162-corp-tempo-conversion-v2-2026-06-12.md` | Corp-Pfade in Reserve/Scoreline/Protection/Punish-Stale getrennt | `feat(ai): classify corp tempo conversion paths` |
| AI163 | Selfplay Progress Pattern Library | `docs/reviews/ai/ai163-selfplay-progress-pattern-library-2026-06-12.{md,json}` | positive Patterns redaction-safe wiederverwendbar | `docs(ai): build selfplay progress pattern library` |
| AI164 | Opportunity Ladder Shadow | `docs/reviews/ai/ai164-opportunity-ladder-shadow-2026-06-12.md` | mindestens 10 x10-Failure-Fälle mit Ladder-Blocker | `feat(ai): add shadow opportunity ladders` |
| AI165 | Deterministic Endwindow Lookahead v2 | `docs/reviews/ai/ai165-deterministic-endwindow-lookahead-v2-2026-06-12.md` | Top-10 bewertet, Kandidat oder No-Go | `feat(ai): evaluate deterministic endwindow lookahead` |
| AI166 | One Opportunity Cutover Candidate | `docs/reviews/ai/ai166-one-opportunity-cutover-candidate-2026-06-12.md` | sicherer Fix oder No-Go, kein Feature ohne Nachweis | `fix(ai): cut over one proven opportunity action` oder No-Go-Commit |
| AI167 | Endgame Scorecard v2 | `docs/reviews/ai/ai167-endgame-scorecard-v2-2026-06-12.{md,json}` | Scorecard mit Opportunity-/Lookahead-Metriken | `docs(ai): refine semantic endgame scorecard` |
| AI168 | Controlled Micro-Flag for Proven Candidate | Code und/oder Report | Flag nur bei Kandidat, sonst No-Go | `feat(ai): gate proven endgame opportunity candidate` oder No-Go-Commit |
| AI169 | Full Sweep | `docs/reviews/ai/ai169-final-endgame-opportunity-sweep-2026-06-12.md` | Pflichtchecks, final x5/x10, Safety grün | `test(ai): complete endgame opportunity sweep` |

## Verifikationsregeln

Nach jedem Paket:

- Generator/Analyse ausführen.
- `git diff --check`.
- Nur Paketdateien stagen.
- Eigenen Commit schreiben.

Final:

- `corepack pnpm install --frozen-lockfile`
- `corepack pnpm test`
- `corepack pnpm -r --if-present run typecheck`
- `corepack pnpm -r --if-present run test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/engine test`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm --filter @netgrid/web test`
- finaler x5 Trace
- finaler x10 Watch
- `git diff --check`

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_AI159_AI169_ENDGAME_OPPORTUNITY`.
- Branch: `codex/ai159-ai169-endgame-opportunity`.
- Hauptworkspace nur für finalen lokalen Merge nach `main`.
- Kein Push ohne ausdrücklichen Nutzerauftrag.
- Vor finalem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Worktree nach erfolgreichem Merge entfernen.

## Controller-Prompt-Kern

`/Goal Arbeite AI159 bis AI169 sequenziell im Worktree C:\Projekte\NETGRID_AI159_AI169_ENDGAME_OPPORTUNITY auf Branch codex/ai159-ai169-endgame-opportunity ab. Lies AGENTS.md, AGENTS.local.md, die Wissensbasis und dieses Prozessartefakt. Arbeite immer nur am aktuellen Paket. Schreibe Artefakte, führe Checks aus, committe jedes Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report. Nach AI169 final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann abschließen.`

## Abschlusskriterien

- AI159 bis AI169 vollständig bearbeitet oder als belegtes No-Go dokumentiert.
- Jeder Schritt ist committed.
- Full Sweep ist dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- `main` ist sauber.
- Kein Push wurde ohne ausdrückliche Freigabe ausgeführt.
