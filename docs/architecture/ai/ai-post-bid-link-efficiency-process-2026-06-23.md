# AI Post-Bid-Link Efficiency Process 2026-06-23

Status: `completed`

Quelle/Vorgabe: Playtest-Analyse zu `match_b05eb9010f32c761` vom 2026-06-23. Die Runner-KI nutzte im Data-Raven-Trace nach bereits abgewehrtem Trace viermal `Submarine Uplink: +1 Link`, gab dadurch alle Credits aus und löste den erzwungenen Jack-out nach dem Encounter aus.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung:

- Gesamtziel: Runner-KI soll Post-Bid-Link-Fähigkeiten nur nutzen, wenn sie das Trace-Ergebnis side-safe verbessert.
- Relevante Module: `packages/ai/src/index.ts`, fokussierte AI-Tests, bei Bedarf kleine Hilfslogik unter `packages/ai/src/`.
- Nicht-Ziel: keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Hidden-Info-Ausweitung.
- Akzeptanz: Repro-Fall wählt nach `Trace 5`, Runner-Link 1, Runner-Bid 4 `pass`; minimal notwendige Link-Nutzung bleibt möglich; überflüssige Submarine-Uplink-Nutzung mit Jack-out-Folge wird verhindert.

## Gesamtziel

/Goal Arbeite den AI-Post-Bid-Link-Effizienzprozess vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die Pflichtseiten der Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI_POST_BID_LINK_EFFICIENCY` auf Branch `codex/ai-post-bid-link-efficiency`. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblockern mit Blocker-Report.

## Annahmen

- Im NETGRID-Trace gilt mindestens Gleichstand des Runner-Gesamtwerts als Trace abgewehrt; der laufende Event 108 belegt `traceStrength: 5`, `runnerStrength: 5` und danach `postBidTraceLinkChoiceOpened: true`.
- `Submarine Uplink` ist korrekt implementiert: Jede Nutzung während eines Runs zwingt zum Jack-out nach dem aktuellen Encounter.
- Die KI darf nur `PlayerView`, `LegalActions`, `pendingChoice` und side-safe PublicEvents nutzen.

## Nicht-Ziele

- Keine Änderung am Trace-Regelmodell.
- Keine Änderung an `applyAction`, StateHash, Replay oder Randomness.
- Keine produktive Korp-Bid-Umstellung.
- Keine Kartentext- oder Kartenpooländerung.

## Controller-Invarianten

- Nur `LegalActions` werden ausgewählt.
- Keine Hidden-Info-Felder im AI-Input.
- Post-Bid-Link-Entscheidungen müssen aus sichtbaren Trace-Zahlen und Choice-Optionen ableitbar sein.
- Kostenlose oder bezahlte Link-Quellen werden nach minimalem Ergebnisnutzen bewertet, nicht nach maximaler Link-Erhöhung.

## Automatische Fehlerbehandlung

- Wenn öffentlicher Trace-Kontext fehlt, bleibt das bisherige konservative Choice-Verhalten als Fallback zulässig.
- Wenn mehrere gleichwertige Optionen existieren, wählt die KI die billigste mit stabiler ID-Sortierung.
- Wenn eine Option den Trace nicht verbessert, wird sie gegenüber `pass` verworfen.
- Wenn eine Option Submarine-Uplink-Jack-out auslöst und der Trace bereits abgewehrt ist, muss `pass` gewählt werden.

## Sicherheitsblocker

- Fehlende side-safe Trace-Felder für reproduzierbaren Entscheidungsgrund.
- Tests zeigen, dass Post-Bid-Link-Policy Hidden-Info oder Full GameState benötigt.
- Engine-LegalActions enthalten keine `pass`-Option im Post-Bid-Link-Fenster.

## State Machine

1. `process_defined`
2. `repro_tests_red_or_existing_bug_documented`
3. `policy_implemented`
4. `integration_verified`
5. `package_commits_done`
6. `merged_to_main`

## Paketfolge

### AI-PBL-0 - Prozessartefakt und Preflight

Ziel: Prozess, Scope, Invarianten und Worktree festhalten.

Arbeit:

- Prozessartefakt erstellen.
- Worktree/Branch prüfen.
- `git diff --check` ausführen.

Checks:

- `git diff --check`

Done-Gate:

- Artefakt existiert, Worktree ist auf `codex/ai-post-bid-link-efficiency`, keine unerklärten Änderungen.

Commit:

- `docs(ai): define post-bid link efficiency process`

### AI-PBL-1 - Repro- und Varianten-Tests

Ziel: KI-Fehler als fokussierte Tests abdecken.

Arbeit:

- Tests für `trace_post_bid_link` ergänzen:
  - bereits abgewehrter Trace wählt `pass`;
  - nur minimal notwendige Link-Nutzung wird gewählt;
  - bei unnützer Submarine-Uplink-Nutzung wird wegen Jack-out-Folge nicht gepumpt;
  - wiederholt geöffnetes Post-Bid-Fenster endet nach erreichtem Ziel mit `pass`.

Checks:

- fokussierte AI-Tests, zunächst erwartbar rot oder als Repro dokumentiert.

Done-Gate:

- Tests bilden den Playtestfehler und relevante Varianten ab.

Commit:

- `test(ai): reproduce wasteful post-bid link choices`

### AI-PBL-2 - Generische Post-Bid-Link-Policy

Ziel: Side-safe Policy zur Auswahl von Post-Bid-Link-Choices.

Arbeit:

- Pure Hilfslogik für `trace_post_bid_link` ergänzen.
- Kontext aus PublicEvents ermitteln: `traceStrength`, `runnerStrength`, `runnerLink`, `runnerBid`, vorhandener `postBidTraceLinkBonus`.
- Ergebnisdelta und Kosten bewerten.
- `pass` wählen, wenn der Trace schon abgewehrt ist oder keine Option das Ergebnis verbessert.
- Minimal notwendige Option wählen, wenn sie von Verlust zu Abwehr führt.

Checks:

- neue Hilfslogiktests.
- relevante `index.test.ts`-Reprotests.

Done-Gate:

- Tests grün, keine Hidden-Info-Nutzung.

Commit:

- `fix(ai): choose efficient post-bid link options`

### AI-PBL-3 - Integration und Diagnose

Ziel: Runtime-Auswahl und Debugausgaben bleiben konsistent.

Arbeit:

- Choice-Auflösung in `packages/ai/src/index.ts` an die Policy anbinden.
- Reason/Evidence bei Post-Bid-Link-Choice verständlich halten.
- Bestehende Trace-Bid-Efficiency nicht regressieren.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/trace-bid-efficiency.test.ts src/index.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`

Done-Gate:

- KI-Tests und Typecheck grün.

Commit:

- `test(ai): verify post-bid link runtime integration`

### FINAL-GREEN - Finalprüfung und Integration

Ziel: Arbeitsbranch final prüfen und lokal nach `main` integrieren.

Checks:

- relevante AI-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- bei Engine-/Web-Berührung entsprechende Paketchecks
- `git diff --check`
- `git status --short`

Merge-Regeln:

- Arbeitsbranch muss sauber sein.
- `main` in Arbeitsbranch integrieren, falls abgewichen.
- Danach im Hauptworkspace `main` fast-forwarden oder begründet mergen.
- Kein Push und kein PR ohne Nutzerwunsch.

## Abschlusskriterien

- Runner-KI verschwendet im Post-Bid-Link-Fenster keine Credits mehr, wenn der Trace bereits abgewehrt ist.
- Runner-KI nutzt Link weiterhin, wenn das Ergebnis dadurch erstmals verbessert wird.
- `Submarine Uplink` wird nicht mehr unnötig ausgelöst und beendet dadurch keine aussichtsreichen Runs mehr.
- Änderungen sind paketweise committed und lokal nach `main` gemerged.

## Ergebnisstand 2026-06-23

Umgesetzt:

- `AI-PBL-1`: Repro- und Varianten-Tests für bereits abgewehrte Traces, minimal notwendige Link-Nutzung, Submarine-Uplink-Vermeidung und erneut geöffnetes Post-Bid-Fenster.
- `AI-PBL-2`: Generische side-safe Post-Bid-Link-Policy in `packages/ai/src/trace-bid-efficiency.ts`.
- `AI-PBL-3`: Runtime-Anbindung in `packages/ai/src/index.ts` über öffentlichen Trace-Kontext.

Verifiziert:

- `vitest run packages/ai/src/trace-bid-efficiency.test.ts packages/ai/src/index.test.ts -t "Trace bid efficiency|post-bid" --maxWorkers=1 --testTimeout=30000`: grün, 13 bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `git diff --check`: grün.

Breiter Testlauf:

- `vitest run packages/ai/src/trace-bid-efficiency.test.ts packages/ai/src/index.test.ts --maxWorkers=1 --testTimeout=30000`: Trace-Fälle grün, aber vier isoliert reproduzierbare bestehende Shell-Traders-Tests in `packages/ai/src/index.test.ts` fallen weiter, weil dort erwartete Shell-Traders-LegalActions fehlen. Separater Lauf `-t "Shell Traders"` zeigt denselben Blocker und ist nicht durch die Post-Bid-Link-Änderung verursacht.

Integration:

- Arbeitsbranch `codex/ai-post-bid-link-efficiency` wurde lokal per Fast-Forward nach `main` integriert.
