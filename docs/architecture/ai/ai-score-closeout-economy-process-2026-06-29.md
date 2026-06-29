# AI Score-Closeout und Corp-Economy Prozess 2026-06-29

Status: in Arbeit

## Quelle

Ausgang ist die Analyse des neuesten abgeschlossenen Matches `match_8ff8d058ccad6138`.
Die Korp gewann zwar, zeigte aber drei wiederverwendbare KI-Schwächen:

- Same-Turn-Score-Closeouts werden nicht als vollständige Sequenz erkannt.
- `score_agenda` verliert gegen unnötiges weiteres Advancen, wenn eine Agenda bereits scorebar ist.
- Scored-Agenda-Economy wie `Marine Arcology` wird gegenüber Basis-`gain_credit` unterbewertet.

## Gesamtziel

Die Corp-KI soll legale Score-Closeouts zuverlässiger schließen, scorebare Agendas ohne Overadvance-Nutzen nicht weiter advancen und sichtbare eigene/scored Economy-Fähigkeiten korrekt als Economy bewerten. Die Engine bleibt Regelautorität; die KI bewertet nur vorhandene `LegalActions`.

## Annahmen

- `Project Zurich` ist ein legitimer Overadvance-Fall, weil die CardImplementation `overadvance_start_of_corp_turn_credits` nutzt.
- `Marine Arcology` hat keinen Overadvance-Payoff; zusätzliche Counter über 3 sind Verschwendung.
- Sichtbare eigene ScoreArea-Karten und deren legale aktivierte Fähigkeiten sind side-safe für die Korp-KI.
- Die Lösung bleibt generisch und nutzt Kosten, Effekte, Agenda-Anforderungen und vorhandene CardImplementation-/Action-Semantik statt Kartennamen-Sonderregeln.

## Nicht-Ziele

- Keine Engine-Legalitätsänderung.
- Keine Hidden-Info-Erweiterung.
- Keine neue Kartenfreischaltung.
- Keine Deckänderung.
- Keine große Semantikdaten-Migration.

## Controller-Invarianten

- LegalActions sind die einzige Aktionsbasis.
- `applyAction` bleibt finaler Guardrail.
- Keine verdeckten Runner-Zonen oder nicht sichtbaren Karteninhalte für KI-Entscheidungen.
- Debug-Evidence darf keine Hidden Info enthalten.

## Paketfolge

### Paket 1: Preflight und Prozess

Ziel: Worktree, Branch, Prozessartefakt und Paketregeln festlegen.

Done-Gate:
- Prozessartefakt liegt vor.
- Worktree ist auf `codex/ai-score-closeout-economy`.
- `git diff --check` ist grün.

Commit: `docs(ai): add score closeout economy process`

### Paket 2: Replay-Evidence

Ziel: Match-Evidence mit StateVersions, besseren Alternativen und Schichtdiagnose dokumentieren.

Done-Gate:
- Evidence-Report unter `docs/reviews/ai/`.
- Keine Codeänderungen.
- `git diff --check` ist grün.

Commit: `docs(ai): record score closeout replay evidence`

### Paket 3: Score-Closeout und Overadvance-Fix

Ziel:
- Same-Turn-Score-Closeouts erkennen.
- Score-now gegen unnötiges Overadvancen absichern.
- Overadvance nur bei erkanntem Overadvance-Payoff zulassen.

Kernartefakte:
- Corp-Scoring-Runtime.
- Fokussierte Tests für scorebaren Non-Overadvance-Fall und Same-Turn-Closeout.

Checks:
- relevante Vitest-Dateien.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- `git diff --check`.

Commit: `fix(ai): prioritize corp score closeouts`

### Paket 4: Scored-Agenda-Economy-Fix

Ziel:
- Aktivierte Corp-Fähigkeiten mit sichtbarem `gain_credits`-Effekt und Klickkosten als Economy bewerten.
- Zwei Aktionen für drei Credits gegenüber zwei Basis-Credits bevorzugen, wenn kein Score-now blockiert.

Kernartefakte:
- Action-/Runtime-Semantik für Corp-activated Economy.
- Fokussierter Regressionstest für `Marine Arcology`.

Checks:
- relevante Vitest-Dateien.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- `git diff --check`.

Commit: `fix(ai): value corp scored agenda economy abilities`

### Paket 5: Abschluss, Reports und Integration

Ziel:
- Final-Report schreiben.
- relevante Checks wiederholen.
- Arbeitsbranch lokal nach `main` mergen.

Checks:
- fokussierte Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- `git diff --check`.

Commit: `docs(ai): summarize score closeout economy fixes`

## Sicherheitsblocker

Stoppen, wenn:

- eine Umsetzung Hidden Info erfordern würde;
- LegalActions fehlen;
- Tests auf Engine-/Replay-/Side-Safety-Regressionen hinweisen;
- `main` nicht konfliktfrei integrierbar ist.

## Worktree-Regeln

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_SCORE_CLOSEOUT_ECONOMY`

Branch: `codex/ai-score-closeout-economy`

Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge genutzt.

