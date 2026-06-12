# AI149-AI158 Same-State Semantic Endgame Process

Status: active

Datum: 2026-06-13

Branch: `codex/ai149-ai158-same-state-semantic-endgame`

Worktree: `C:\Projekte\NETGRID_AI149_AI158_SAME_STATE_SEMANTIC_ENDGAME`

## Quelle/Vorgabe

Ausgang ist die Ergebnisanalyse zu AI131-AI139 mit den Folgeaufträgen AI149 bis AI158. Der aktuelle lokale Integrationsstand enthält zusätzlich AI140-AI148. Diese neuen Pakete werden daher als neuer, nummerisch fortlaufender Analyse- und Beweisblock auf aktuellem `main` umgesetzt.

## Zielprüfung

Die Vorgabe ist ausreichend präzise:

- Gesamtziel: same-state LegalAction-Beweise statt historischer oder proxybasierter Heuristiken.
- Paketfolge: AI149 bis AI158 ist sequenziell vorgegeben.
- Sicherheitsgrenzen: keine neue LegalAction-Erzeugung, keine Hidden-Info-Ausweitung, kein generischer Credit-/Draw-/Run-/Corp-Economy-Malus.
- Cutover-Gate: höchstens ein Runtime-Fix, nur mit same-state Proof, grünen Hard-/Risk-Gates und x5/x10-Nachweis.
- Verifikation: Paketchecks, `git diff --check`, finaler x5/x10-Sweep und Projektchecks.

Kleine Lücke: Die Vorgabe nennt Artefaktdaten `2026-06-12`, während die Umsetzung am 2026-06-13 läuft. Die geforderten Review-Dateinamen bleiben für Anschlusskompatibilität erhalten; dieses Prozessartefakt nutzt das tatsächliche Prozessdatum.

## Gesamtziel

AI149 bis AI158 bauen eine beweisorientierte Endgame-Optimierungslinie:

1. same-state Challenger legal belegen oder No-Go klassifizieren,
2. TargetContext-Gaps schließen oder begründen,
3. Intent-, Coverage-, Corp-Tempo- und Lookahead-Evidence ausbauen,
4. höchstens einen eng begrenzten und default-off geflaggten Cutover vorbereiten,
5. mit Scorecard und Full Sweep abschließen.

## Nicht-Ziele

- Keine neue Erzeugung von `LegalActions`.
- Keine Änderung an Engine-, `applyAction`-, Replay-, StateHash- oder Randomness-Verträgen.
- Keine Hidden-Info-Projektion in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Replays oder Logs.
- Keine generischen Mali gegen Credit, Draw, Run oder Corp-Economy.
- Keine Wiederholung des verworfenen B005-Draw-Malus.
- Keine globale Runtime-Aktivierung ohne Flag.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- UI, Server, menschliche Spieler und KI reichen nur `PlayerActions` aus `LegalActions` ein.
- `applyAction` validiert Seite, actionId, stateVersion, Timingpunkt, Kosten, Ziele und Choices erneut.
- Same-State-Proof bedeutet: dieselbe Entscheidungssituation, side-sichere Daten, LegalAction vorhanden, TargetContext ausreichend, Hard-/Risk-Gates grün.
- Shadow-Artefakte dürfen diagnostizieren, aber nicht die Runtime-Auswahl ändern.

## Automatische Fehlerbehandlung

- Bei fehlendem TargetContext: als `target_context_missing` klassifizieren, nicht ersetzen.
- Bei historischem, aber nicht gleichem Zustand: `historical_only_not_legal_now`.
- Bei riskanter Alternative: `legal_but_risk_blocked`.
- Bei nicht reproduzierbarem Engine-State: Proxy klar als nicht cutoverfähig markieren.
- Bei roten Tests: eng debuggen; nicht zum nächsten Paket wechseln.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- Hidden-Info-Leak sichtbar wird,
- eine Runtime-Änderung ohne same-state Proof nötig wäre,
- Tests IllegalActions, Replay-Failures oder Redaction-Probleme zeigen,
- x5 oder x10 durch einen Cutover schlechter wird,
- Merge-Konflikte einen fachlichen Vertrag widersprüchlich definieren.

## State Machine

`preflight -> AI149 -> AI150 -> AI151 -> AI152 -> AI153 -> AI154 -> AI155 -> AI156 -> AI157 -> AI158 -> integration -> complete`

Nur ein Paket ist aktiv. Ein Paket wird erst nach Artefakt, Check und Commit abgeschlossen.

## Paketfolge

| Paket | Titel | Kernartefakte | Done-Gate | Commit |
| --- | --- | --- | --- | --- |
| AI149 | Same-State Challenger Probe | `docs/reviews/ai/ai149-same-state-challenger-probe-2026-06-12.{md,json}` | Top-17 klassifiziert, keine Runtime-Wirkung, redaction-safe | `docs(ai): probe same-state challenger legality` |
| AI150 | TargetContext Closure for Same-State Probe | `docs/reviews/ai/ai150-same-state-target-context-closure-2026-06-12.md` | Top-5 vollständig oder begründet fehlend, keine Legalitätserzeugung | `feat(ai): close target context for same-state probes` |
| AI151 | Endgame Intent Memory Shadow | `docs/reviews/ai/ai151-endgame-intent-memory-shadow-2026-06-12.md` | stale Intents sichtbar, keine Runtime-Wirkung | `feat(ai): shadow endgame intent memory` |
| AI152 | Runner Coverage Solver Shadow | `docs/reviews/ai/ai152-runner-coverage-solver-shadow-2026-06-12.md` | Coverage-Kategorien sichtbar, side-safe, Tests/Checks | `feat(ai): shadow runner coverage solver` |
| AI153 | Corp Scoreline/Tempo Converter Shadow | `docs/reviews/ai/ai153-corp-tempo-converter-shadow-2026-06-12.md` | Corp-Konversionen klassifiziert, keine Economy-Strafe | `feat(ai): shadow corp scoreline tempo converter` |
| AI154 | MCTS-lite Endwindow Probe v1 | `docs/reviews/ai/ai154-mcts-lite-endwindow-probe-v1-2026-06-12.md` | mindestens 10 Endfenster bewertet, Vergleich gegen AI136 | `feat(ai): prototype mcts-lite endwindow probes` |
| AI155 | Same-State Cutover Candidate v1 | `docs/reviews/ai/ai155-same-state-cutover-candidate-v1-2026-06-12.md` | Runtime-Fix oder No-Go; kein Fix ohne x5/x10 | `fix(ai): cut over one proven same-state endgame action` oder No-Go-Commit |
| AI156 | Semantic Endgame Scorecard v1 | `docs/reviews/ai/ai156-semantic-endgame-scorecard-v1.{md,json}` | Scorecard mit Safety und Semantikmetriken | `docs(ai): add semantic endgame scorecard` |
| AI157 | Controlled Micro-Cutover Flag | Code und/oder No-Go-Report | Flag default-off nur bei Kandidat; sonst dokumentiertes No-Go | `feat(ai): gate proven endgame semantic candidate` oder No-Go-Commit |
| AI158 | Full Sweep | `docs/reviews/ai/ai158-final-semantic-endgame-sweep-2026-06-12.md` | Pflichtchecks grün, x5/x10 final, main-ready | `test(ai): complete same-state semantic endgame sweep` |

## Verifikationsregeln

Nach jedem Paket:

- Paketgenerator oder relevante Analyse ausführen.
- `git diff --check`.
- Nur paketzugehörige Dateien stagen.
- Ein Commit je Paket.

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

- Umsetzung ausschließlich im Worktree `C:\Projekte\NETGRID_AI149_AI158_SAME_STATE_SEMANTIC_ENDGAME`.
- Branch: `codex/ai149-ai158-same-state-semantic-endgame`.
- Hauptworkspace nur für finalen lokalen Merge nach `main`.
- Kein Push ohne ausdrücklichen Nutzerauftrag.
- Vor finalem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Worktree nach erfolgreichem Merge entfernen.

## Controller-Prompt-Kern

`/Goal Arbeite AI149 bis AI158 sequenziell im Worktree C:\Projekte\NETGRID_AI149_AI158_SAME_STATE_SEMANTIC_ENDGAME auf Branch codex/ai149-ai158-same-state-semantic-endgame ab. Lies AGENTS.md, AGENTS.local.md, die Wissensbasis und dieses Prozessartefakt. Arbeite immer nur am aktuellen Paket. Schreibe Artefakte, führe Checks aus, committe jedes Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report. Nach AI158 final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann abschließen.`

## Abschlusskriterien

- AI149 bis AI158 sind vollständig bearbeitet oder als belegtes No-Go dokumentiert.
- Jeder abgeschlossene Schritt ist committed.
- Finalchecks sind dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
- `main` ist sauber.
- Kein Push wurde ohne ausdrückliche Freigabe ausgeführt.
