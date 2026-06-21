# AI222-AI224 Practical Tactic Decider Process

Status: in Umsetzung
Quelle: Nutzerfolgeauftrag vom 2026-06-21

## Zielprüfung

Die Vorgabe ist ausreichend präzise für direkte Umsetzung. Sie begrenzt den Folgeblock ausdrücklich auf drei Pakete und fordert einen Richtungswechsel weg von weiterer Witness-/Scorecard-Infrastruktur hin zu produktiv wirksamer Action-Auswahl.

## Gesamtziel

AI222 bis AI224 liefern einen kleinen, praktischen Spielstärke-Zyklus:

1. Ein kompakter Taktik-Benchmark mit konkreten side-safe Entscheidungssituationen und akzeptablen beziehungsweise schlechten LegalActions.
2. Ein begrenzter produktiver Endgame-/Immediate-Delta-Entscheider, der in klaren Situationen tatsächlich eine andere aktuelle LegalAction wählen kann.
3. Ein gepaarter Kandidat-gegen-Legacy-Vergleich mit harter Merge-oder-Revert-Entscheidung.

## Annahmen

- `main` ist lokaler Integrationsbranch.
- Der Prozess läuft im Worktree `C:\Projekte\NETGRID_AI222_AI224_PRACTICAL_TACTIC_DECIDER` auf Branch `codex/ai222-ai224-practical-tactic-decider`.
- Der bestehende Practical-Micro-Comparator bleibt default-off und wird nicht als Erfolg gewertet.
- Für AI223 ist ein deterministischer Immediate-Delta-Evaluator zulässig, wenn echtes State-Cloning pro LegalAction für diesen Block zu breit wäre.
- Der eingefrorene Legacy-Vergleich darf über vorhandene Simulation-Controller-Modi laufen, sofern der Kandidatpfad klar vom Legacy-/Baselinepfad getrennt ist.

## Nicht-Ziele

- Keine neue LegalAction-Erzeugung.
- Kein Planner-Umbau.
- Keine weitere Witness-/TargetRef-/Scorecard-Kaskade.
- Keine Hidden-Info-Erweiterung.
- Keine generischen Credit-/Draw-/Run-Mali als Ersatz für konkrete Taktiksignale.
- Kein Cutover bei nur grünen Safety-Checks ohne praktische Verbesserung.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Legalitätsautorität.
- UI, Server, menschliche Spieler und KI dürfen nur PlayerActions aus Engine-`LegalActions` verwenden.
- `applyAction`-Verträge, Replay, StateHash und Randomness werden nicht verändert.
- KI-Entscheidungen dürfen keine verdeckten Kartendaten verwenden.
- Der neue Entscheider darf nur aus `input.legalActions` wählen.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktuellen Paket eng debuggt.
- Ein Kandidat, der Safety-Gates verletzt, wird nicht weiter integriert.
- Ein Kandidat ohne praktische Verbesserung wird dokumentiert und default-off beziehungsweise verworfen.
- Keine Folgepakete zur bloßen Erklärung eines gescheiterten Kandidaten.

## Sicherheitsblocker

- IllegalActions > 0.
- ReplayFailures > 0.
- Hidden-Info-/Redaction-Verstoß.
- Kandidat erzeugt oder mutiert LegalActions.
- Kandidat braucht verdeckte Karteninformationen.
- Harte Regression in Action-Limit-Rate, Taktik-Trefferquote oder Matchmetriken ohne dokumentierte fachliche Rechtfertigung.

## State Machine

1. `process_defined`
2. `ai222_tactic_benchmark`
3. `ai223_productive_decider`
4. `ai224_paired_candidate_legacy_test`
5. `integration_preflight`
6. `merged_to_main`
7. `complete`

## Paketfolge

### AI222 Praktischer Taktik-Benchmark

Ziel: Ein kompakter Benchmarkkorpus aus konkreten Entscheidungssituationen.

Arbeit:

- 30 bis 50 side-safe Taktikfälle definieren.
- Pro Fall vorhandene LegalActions, akzeptable Aktionen, schlechte Aktionen und Begründung festhalten.
- Legacy-Trefferquote dokumentieren.
- Keine neue Reporting-Infrastruktur bauen.

Done-Gate:

- Korpus liegt als versioniertes Artefakt vor.
- Test prüft Korpusstruktur und Legacy-Baseline-Auswertung.
- Legacy-Trefferquote ist dokumentiert.

Commit-Vorschlag: `test(ai): add practical tactic benchmark corpus`

### AI223 Direkter Endgame-Entscheider

Ziel: Ein begrenzter produktiver Entscheider, der in klaren Endgame-/Taktikzuständen LegalActions anders wählen kann.

Arbeit:

- Immediate-Delta-Bewertung über aktuelle `input.legalActions` implementieren.
- Aktivierung eng begrenzen.
- Bewertung auf konkrete Progress-/Risikosignale beschränken: sofortiger Gewinn, Score/Steal, Flatline, Access/Trash, Coverage geschlossen, Server geschützt, erreichbarer Run, stale Aktion vermieden.
- Benchmark-Trefferquote gegenüber Legacy verbessern.

Done-Gate:

- Neuer Entscheider ist default bewusst kontrolliert.
- Tests zeigen mindestens eine produktiv andere Action.
- Taktik-Benchmark zeigt deutliche Verbesserung.
- Safety-Grenzen bleiben grün.

Commit-Vorschlag: `feat(ai): add practical tactic decision overlay`

### AI224 Kandidat gegen eingefrorene Baseline

Ziel: Gepaarter Kandidat-vs-Legacy-Test mit harter Entscheidung.

Arbeit:

- Candidate Runner vs Legacy Corp und Legacy Runner vs Candidate Corp laufen mit gleichen Decks/Seeds.
- x5 als schneller Test; wenn sinnvoll x20 oder größer als Stärkevergleich.
- Metriken dokumentieren: Siegquote, Agenda-Differenz, Flatlines, Action-Limits, Spiellänge, Steals/Scores, Taktik-Trefferquote, IllegalActions, ReplayFailures, Hidden-Info.
- Merge-oder-Revert-Entscheidung dokumentieren.

Done-Gate:

- 0 IllegalActions.
- 0 ReplayFailures.
- 0 Hidden-Info-Verstöße.
- Taktik-Benchmark deutlich besser als Legacy.
- Mindestens eine praktische Matchmetrik besser oder nachvollziehbares No-Go mit nicht aktivem Kandidat.

Commit-Vorschlag: `test(ai): compare practical tactic candidate against legacy`

## Verifikationsregeln

- Paketbezogene Vitest-Suites.
- `corepack pnpm --filter @netgrid/ai run typecheck`.
- `git diff --check`.
- Für AI224 zusätzlich gepaarter Simulation-/Benchmark-Lauf.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai222-ai224-practical-tactic-decider`.
- Arbeitsworktree: `C:\Projekte\NETGRID_AI222_AI224_PRACTICAL_TACTIC_DECIDER`.
- Hauptworkspace nur für finalen Merge nach `main`.
- Jedes Paket wird separat committed.
- Push erfolgt nur auf ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

Arbeite AI222-AI224 vollständig und sequenziell ab. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI222_AI224_PRACTICAL_TACTIC_DECIDER` auf Branch `codex/ai222-ai224-practical-tactic-decider`. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Committe jedes abgeschlossene Paket. Nach Abschluss lokal nach `main` mergen, Worktree entfernen und erst dann das Goal abschließen.

## Abschlusskriterien

- Alle drei Pakete abgeschlossen oder ein harter Sicherheitsblocker dokumentiert.
- Arbeitsbranch ist sauber.
- Lokaler Merge nach `main` ist erfolgt.
- Hauptworkspace ist sauber.
- Worktree wurde entfernt.

