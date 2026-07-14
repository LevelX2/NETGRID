# Match E676: Decision-Remediation Abschlussreview

## Ergebnis

Die drei freigegebenen Entscheidungen aus `match_e6761d8fcdbd7996` sind als
spielgleiche Decision-Checkpoints dauerhaft gesichert. Auf dem unveränderten
Ausgangsstand war der Tycho-Vertrag bereits grün; nur Chester Mix und Night
Shift reproduzierten `behavior_regression` und erhielten Produktionsfixes.

Alle drei Zielzustände und ihre drei begrenzenden Gegenproben sind nach dem
Fix grün. Es wurden keine Erwartungen abgeschwächt und keine Match-, Seed-
oder Kartennamen-Sonderfälle in die Runtime eingebaut.

## Dauerhafte Entscheidungsverträge

### Persistenten Fort-Rabatt vor einer ICE-Installation aktivieren

Die Corp-Scorekomposition erkennt eine unmittelbare, kostenlose Reihenfolge,
wenn alle folgenden Bedingungen erfüllt sind:

- Die legale Rez-Aktion kostet weder Credits noch Klicks.
- Der sichtbare Source-Hint beschreibt einen persistenten Credit-
  Installationsrabatt mit Scope `fort` und `requires_rezzed_card`.
- Im selben Fort ist mindestens eine aktuell legale, kostenpflichtige
  ICE-Installation vorhanden.
- Eine hochkritische Board-Triage priorisiert nicht gerade ein anderes Fort.

Dann erhält der Rez die Komponente
`corp_persistent_install_discount_sequence`. Der Wert berücksichtigt den
sofort sichtbaren Rabatt, ohne spätere Hidden-Info oder einen Kartennamen zu
verwenden. Im Zielzustand SV221 / DI101 wird Chester Mix dadurch vor der
Fetch-Installation auf HQ rezzed. Ohne Same-Fort-ICE-Gelegenheit wird der Rez
nicht erzwungen.

### Reserveplan darf höherwertige Burst-Economy nutzen

Der Scoreline-Plan bleibt grundsätzlich führend. Nur der konkrete Schritt
`build_rez_reserve` gibt seine gemappte Basisaktion `gain_credit` frei, wenn
eine besser bewertete `play_operation`-Alternative eine positive
`corp_operation_burst_economy`-Komponente trägt und R&D noch mindestens eine
Karte enthält. Andere Scoreline-Schritte, insbesondere `protect_remote`,
behalten ihre bisherige Planbindung.

Im Zielzustand SV340 / DI158 wird damit Night Shift statt des schwächeren
Basis-Credits gewählt. Bei leerem R&D bleibt die Gegenprobe auf dem Planpfad;
ein schädlicher oder unmöglicher Draw wird nicht durch den Economy-Score
erzwungen.

### Tycho-Matchpoint-Vertrag

SV162 / DI78 wählte bereits auf dem unveränderten Ausgangsstand
`corp.gain_credit` und exponierte die langsame Vier-Punkte-Agenda nicht. Der
Checkpoint bleibt als Regressionstest erhalten, aber es wurde kein neuer
Tycho-Fix umgesetzt. Die Gegenprobe mit Project Consultants und ausreichenden
Credits erlaubt weiterhin eine Installation, wenn die Agenda noch im selben
Zug konvertiert werden kann.

## Verifikation

Vor dem Fix:

- Zwei Zieltests rot mit `behavior_regression`, vier Verträge grün.
- Kein Engine-, LegalAction-, Runtime-State-, Fixture- oder Redaction-Drift.

Nach dem Fix:

- Match-E676-Zielzustände und Gegenproben: 6/6 grün.
- Fokussierte Checkpoint-, Ranking- und Corp-Score-Suite: 170/170 grün.
- Vollständige `@netgrid/ai`-Suite: 2.154/2.154 Tests in 324 Dateien grün.
- `@netgrid/ai`-Typecheck, Prettier-Changed-Gate und `git diff --check` grün.
- Nach Einzug des zwischenzeitlich fortgeschrittenen `main`: erneut 170/170
  fokussierte Tests und AI-Typecheck grün.

Es wurden keine Benchmarks, Selfplays oder Serverprozesse gestartet. Die
Rules Engine, LegalActions, PlayerViews, Replay-, StateHash-, Randomness-,
Kartenpool- und Hidden-Info-Verträge wurden nicht verändert.

Der verifizierte Arbeitsstand wurde nach Einzug des aktuellen lokalen
`main` per Fast-Forward wieder nach `main` integriert. Der separate Worktree
und der Arbeitsbranch wurden anschließend verifiziert entfernt; ein Push
erfolgte nicht.

## Führende Artefakte

- Prozess:
  `docs/architecture/ai/ai-match-e676-decision-remediation-process-2026-07-14.md`
- Rote Evidence:
  `docs/reviews/ai/match-e676-decision-checkpoint-red-evidence-2026-07-14.md`
- Dauerhafte Fixtures:
  `data/scenarios/ai-decision-checkpoints/cp-e676-01-unsafe-tycho.json`,
  `cp-e676-02-rez-chester-before-hq-ice.json` und
  `cp-e676-03-night-shift-reserve.json`
- Spielgleicher Test:
  `packages/ai/src/evaluation/decision-checkpoints/match-e676-decision-checkpoints.test.ts`
