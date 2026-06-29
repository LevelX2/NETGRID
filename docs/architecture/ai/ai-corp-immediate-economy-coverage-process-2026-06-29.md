# AI Corp Immediate Economy Coverage Process, 2026-06-29

## Status

- Branch: `codex/corp-immediate-economy-coverage`
- Worktree: `C:\Projekte\NETGRID-worktrees\corp-immediate-economy-coverage`
- Integrationsziel: lokaler `main`
- Umsetzung: Paketprozess aktiv, ohne Push/PR

## Quelle/Vorgabe

Playtest-Beobachtung zur Corp-KI: Die Corp nahm mehrfach die Grundaktion `1 Credit`, obwohl `Accounts Receivable` oder `Efficiency Experts` auf der Hand legal und klar effizienter waren. Nach der ersten Korrektur wurde ein Kartenlisten-Quercheck verlangt. Der Quercheck zeigte, dass die neue generische Erkennung weitere Immediate-Economy-Operationen wegen Textnotation oder Sprache noch nicht zuverlässig erfasst.

## Gesamtziel

Die Corp-KI soll side-safe Immediate-Economy-Operationen erkennen und in der Action-Bewertung sichtbar über äquivalente Basisaktionen stellen, wenn sie gegenüber `1 Credit` oder `draw one card` einen unmittelbaren Netto-Vorteil bringen. Das gilt für englische Credit-Texte mit bracket notation (`Gain [15].`), deutsche Testkarten-Texte (`Erhalte ... Credits.`, `Ziehe ... Karten.`) und kleinere, aber immer noch action-effiziente Value-2-Effekte.

## Zielprüfung

Erwartete zusätzlich erfasste Karten:

- `onr_proteus_047_credit-consolidation`: `Gain [15].`, Kosten 10, Netto +5.
- `simple_economy_operation`: `Erhalte 4 Credits.`, Kosten 0, Netto +4.
- `v08_credit_surge_operation`: `Erhalte 7 Credits.`, Kosten 1, Netto +6.
- `v08_archive_planning_operation`: `Ziehe 3 Karten.`, Kosten 0, Draw-Wert 3.
- `simple_draw_operation`: `Ziehe 2 Karten.`, Kosten 0, Draw-Wert 2.

Bereits erfasste Karten wie `Accounts Receivable`, `Efficiency Experts`, `Annual Reviews`, `Day Shift` und `Night Shift` bleiben positiv bewertet.

## Annahmen

- Die KI bewertet nur vorhandene `LegalActions`; es wird keine neue Action erzeugt.
- Eigene Corp-Handkarten und deren Definitionen sind für Corp-Entscheidungen zulässig.
- Die generische Bewertung bleibt statisch und unmittelbarkeitsbezogen: Kosten, sofortige Credits und sofortiger Card-Draw.
- Kostenlose Draw-2-Operationen sollen Basis-Draw schlagen, aber schwächer bewertet werden als echte Burst-Economy-Operationen ab Action-Wert 3.
- Operationen mit sichtbaren Drawbacks dürfen nicht pauschal durch die Economy-Heuristik hochgezogen werden.

## Nicht-Ziele

- Keine Engine-Regeländerung und keine Änderung an `applyAction`.
- Keine neue KI-Planungsstufe für zukünftige Extra-Actions, Tags, Traces oder variable Board-State-Effekte.
- Keine Speziallogik für `Silver Lining Recovery Protocol`, `Overtime Incentives`, `Edgerunner, Inc., Temps` oder `Corporate Guard(r) Temps`.
- Keine Freischaltung neuer Karten im AI-Support-Set.
- Kein Push und keine PR-Erstellung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI, UI und Server reichen ausschließlich Aktionen aus `LegalActions` ein.
- Die Bewertung nutzt nur Corp-PlayerView, LegalActions, sichtbare eigene Karteninformationen und side-safe Definitionen.
- Debug- und Test-Evidence darf keine verdeckten Runner-Daten oder öffentliche Hidden-Info leaken.
- Deterministisches Replay und StateHash werden nicht berührt.

## Fehlerbehandlung und Sicherheitsblocker

Blockierend sind Änderungen, die neue Actions außerhalb von `LegalActions` bauen, `applyAction` umgehen, verdeckte gegnerische Daten für die Bewertung nutzen oder unklare dynamische Operationen über eine statische Economy-Heuristik bevorzugen. In solchen Fällen wird das Paket gestoppt, der Blocker dokumentiert und nicht lokal nach `main` integriert.

## Paketfolge

### Paket 1: Prozessartefakt und Coverage-Zuschnitt

Ziel: Paketprozess, Zielkarten, Nicht-Ziele und Gates dokumentieren.

Arbeit:
- Prozessartefakt unter `docs/architecture/ai/` anlegen.
- Zielkarten und ausgeschlossene Spezialkarten festhalten.
- Verifikationsregeln für die Folgepakete definieren.

Checks:
- `git diff --check`

Commit:
- `docs(ai): record corp immediate economy coverage process`

### Paket 2: Immediate-Economy-Parser und Score-Tiers

Ziel: Die generische Economy-Erkennung auf die fehlenden statischen Textmuster erweitern.

Arbeit:
- Englische bracket notation wie `Gain [15].` als Credit-Gain erkennen.
- Deutsche Texte `Erhalte ... Credits.` und `Ziehe ... Karten.` erkennen.
- Action-Wert 2 als schwache, aber basisaktionsdominierende Economy bewerten.
- Sichtbare Drawback-Indikatoren als Guard gegen pauschale Economy-Aufwertung berücksichtigen.
- Fokussierte Runtime-Regressionen für Parser und Scorekomponenten ergänzen.

Checks:
- fokussierte AI-Runtime-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:
- `fix(ai): broaden corp immediate economy operation scoring`

### Paket 3: LegalActions-/AI-Regressionen und Abschlussprüfung

Ziel: Sicherstellen, dass die KI die nun erkannten Operationen im legalen Spielkontext tatsächlich gegenüber Basisaktionen bevorzugt.

Arbeit:
- AI-Index-Regressionen für mindestens eine bracket-notation Operation und eine deutsche Operation ergänzen.
- Bestandsschutz für `Accounts Receivable`, `Efficiency Experts` und vergleichbare bestehende Fälle sicherstellen.
- Finalen Verifikationsstand im Prozessartefakt dokumentieren.

Checks:
- fokussierte AI-Index-Tests
- relevante AI-Runtime-Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:
- `test(ai): cover corp immediate economy legal action choices`

## Verifikationsregeln

- Positive Tests müssen die Scorekomponenten oder Decision-Traces so prüfen, dass Credit-Gain, Draw-Count, Netto-Wert und Action-Wert nachvollziehbar sind.
- Drawback-Tests müssen verhindern, dass eine Operation nur wegen Credit-/Draw-Texten pauschal bevorzugt wird.
- Value-2-Operationen dürfen Basis-Draw/Basis-Credit schlagen, aber nicht die hohen Endgame-, Scoreline- oder Meat-Damage-Prioritäten verdrängen.
- Alle Änderungen bleiben auf AI-Runtime, AI-Tests und Prozessdokumentation begrenzt.

## Worktree/Git/Integration

Der Arbeitsbranch wird im eigenen Worktree umgesetzt. Nach jedem abgeschlossenen Paket wird lokal committed. Nach Paket 3 wird aktueller `main` in den Arbeitsbranch integriert, der relevante Check-Satz erneut ausgeführt und der Branch lokal nach `main` gemergt, sofern keine Blocker bestehen. Der Arbeitsworktree wird nach erfolgreichem Merge entfernt.

## Abschlusskriterien

- `Credit Consolidation`, `simple_economy_operation`, `v08_credit_surge_operation`, `v08_archive_planning_operation` und `simple_draw_operation` werden generisch erkannt, soweit sie AI-seitig legal angeboten werden.
- Bereits erkannte O:NR-Economy-Operationen bleiben positiv bewertet.
- Drawback-Operationen werden nicht pauschal durch die Immediate-Economy-Heuristik hochgezogen.
- Fokussierte Tests und Typecheck bestehen.
- Arbeitsbranch ist lokal nach `main` gemergt.
