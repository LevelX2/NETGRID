# AI Rush Scoring Window und Deck-Prozess 2026-06-29

Status: in Umsetzung

## Quelle/Vorgabe

Aus dem zuletzt gespielten Human-Runner-vs-Corp-AI-Match `match_41020769c9f35150` mit dem Deck `KI Rush Score - Static ICE Mix` sollen die wiederkehrenden Corp-Schwächen pragmatisch behoben werden. Der Nutzer hat die Umsetzung im Worktree freigegeben.

## Gesamtziel

Die Corp-KI soll die Rush-Grundstrategie besser spielen: erkennbare Scoring-Fenster nutzen, nicht-immediate Agenda-Exposition über den Runner-Zug härter bewerten, Remote-ICE nicht spammen, Archives gegenüber HQ/R&D korrekt abwägen und ein KI-freundlicheres Corp-Deck für diese Strategie bereitstellen.

## Annahmen

- Die Rules Engine bleibt die einzige Regelautorität.
- Die KI nutzt nur `AiDecisionInput`, PlayerView, LegalActions, side-safe PublicEvents und erlaubte Kartenmetadaten.
- `Project Consultants` ist auf aktuellem `main` als CardImplementation mit vier Advancement-Countern registriert und wird nicht ohne neuen Engine-Befund geändert.
- Lokale Benutzerdecks unter `%APPDATA%\NetGrid\Decks` sind private Runtime-Artefakte und werden nicht versioniert.

## Nicht-Ziele

- Kein neuer Parallel-Planner.
- Keine FullState-Auswertung und keine Annahmen über Runner-Hand, Runner-Stack oder verdeckte Runner-Ressourcen.
- Kein Push oder Pull Request.
- Keine generelle Balance-Neuerfindung des Kartenpools.

## Controller-Invarianten

- Jede KI-Aktionswahl bleibt LegalActions-only.
- Debug-/Evidence-Kanäle dürfen keine verdeckten ICE-Identitäten oder gegnerseitigen Hidden-Info-Daten ausgeben.
- Scoring-Window-Bewertungen müssen pro konkreter LegalAction und Server-Kontext entstehen.
- Remote-ICE-Boni müssen gedeckelt bleiben, wenn bereits ein ausreichendes Scoring-Remote existiert.

## Paketfolge

### Paket 1: Preflight, Evidence und Prozess

Ziel: Replay-Funde und Prozess-Grenzen versioniert festhalten.

Kernartefakte:

- `docs/architecture/ai/ai-rush-scoring-window-deck-process-2026-06-29.md`
- `docs/reviews/ai/ai-rush-scoring-window-deck-evidence-2026-06-29.md`

Checks:

- `git diff --check`

Done-Gate:

- Prozess und Evidence sind geschrieben und paketweise committed.

Commit-Vorschlag:

- `docs: record AI rush scoring window process`

### Paket 2: Scoring-Window- und Server-Priorisierung nachhärten

Ziel: Bestehende Semantic-Runtime-Bausteine härten, ohne einen Parallel-Planner einzuführen.

Konkrete Arbeit:

- Nicht-immediate Agenda-Install-/Advance-Linien mit Runner-Exposure-Window strenger bewerten, wenn nur ein einzelnes temporary-safe ICE den Plan trägt.
- Hohe sichtbare Runner-Credits und volle Runner-Aktionslage als Unsicherheitsfaktor gegen delayed scoring einbeziehen, ohne Runner-Hand/Deck zu behaupten.
- Archives-ICE nach ausreichendem Archives-Schutz deckeln und bei HQ-Agenda-Druck oder R&D-Druck stärker gegenüber Central-ICE abwerten.
- Remote-ICE-Bau nur belohnen, wenn er eine Scoreline vorbereitet, eine Schwachstelle behebt oder es noch keine brauchbare Scoring-Remote-Kapazität gibt.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-scoring-window.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.ts`
- passende fokussierte Vitest-Regressionen

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-score.test.ts src/runtime/semantic-runtime-corp-passive-scoreline.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- Fokussierte Tests sind grün und Evidence zeigt die neuen Gründe.

Commit-Vorschlag:

- `fix(ai): harden corp rush scoring windows`

### Paket 3: Corp-Rush-Deck optimieren

Ziel: Ein neues lokales Benutzerdeck bereitstellen, das zur aktuellen KI passt: schnelle Agendas, statische bezahlbare ETR-ICE, Economy/Draw und tatsächlich nutzbare Advancement-Bursts.

Konkrete Arbeit:

- Altes Testdeck nicht löschen.
- Neues Benutzerdeck mit eindeutiger ID und Namen speichern.
- Weniger 3-Advance-/2-Punkt-Risiko ohne direkte Closeout-Linie, mehr statische frühe ICE und mehr Economy/Draw.
- `Project Consultants` und andere Advancement-Karten nur so einplanen, wie sie im aktuellen Engine-Stand legal funktionieren.

Kernartefakt:

- `%APPDATA%\NetGrid\Decks\local_corp_ki_rush_score_window_v2_2026_06_29.json`

Checks:

- Deck-JSON parsen.
- Deck über vorhandene Validierungslogik prüfen, soweit lokal ohne Server möglich.

Done-Gate:

- Neues Deck ist im Benutzerdeckordner vorhanden und validierbar oder ein Validierungsgrund ist dokumentiert.

Commit-Vorschlag:

- Kein Git-Commit für das lokale Benutzerdeck; Deckpfad und Name werden im Final-Report genannt.

### Paket 4: Review, Wissenspflege und lokale Integration

Ziel: Abschlussreport, Wissenslog, finale Verifikation und lokaler Merge nach `main`.

Kernartefakte:

- `docs/reviews/ai/ai-rush-scoring-window-deck-final-2026-06-29.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`

Checks:

- fokussierte AI-Tests wie Paket 2
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- nach lokalem Merge dieselben relevanten Checks im Hauptworkspace

Done-Gate:

- Arbeitsbranch ist sauber, lokal nach `main` gemerged, Worktree entfernt oder sauber belassen, Final-Report nennt Checks und Restgrenzen.

Commit-Vorschlag:

- `docs: summarize AI rush scoring window changes`

## Sicherheitsblocker

Stoppen, wenn eine Verbesserung verdeckte Runner-Daten, FullState, nicht-legale Aktionen oder nicht-redigierte private ICE-Identitäten in öffentliche Debugflächen benötigen würde.

