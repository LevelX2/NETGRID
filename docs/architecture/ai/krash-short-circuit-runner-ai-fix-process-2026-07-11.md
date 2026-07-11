# Krash-/Short-Circuit-Runner-KI-Fixprozess

Status: abgeschlossen

## Quelle und Zielprüfung

Quelle ist die freigegebene Detailanalyse des gespeicherten Matches
`match_ce2b72a6bf4d4e80` vom 11.07.2026. Die sieben Fehlergruppen sind
ausreichend präzise, side-safe belegt und vom Nutzer zur Umsetzung freigegeben.

## Gesamtziel

Die Runner-KI soll eine bereits durch Krash erfüllte Breaker-Coverage erkennen,
Short Circuit nur mit einem konkreten Such- und Konversionsziel nutzen,
Krash-Supportprogramme korrekt bewerten, überzählige Breaker sinnvoll abwerfen
und Economy-/Run-Pläne nach realistischer Zeit zum Payoff auswählen.

## /Goal

`/Goal Arbeite den Krash-/Short-Circuit-Runner-KI-Fix vollständig und
sequenziell von Paket 1 bis Paket 5 ab, verifiziere jede Fehlergruppe mit
side-safe Regressionen und merge den abgeschlossenen Arbeitsbranch lokal nach
main.`

## In Scope

- Coverage-Search-Scoring und strategischer Übergang nach erfüllter Coverage.
- Suchzielwahl mit Grip-/Rig-Duplikaten und Installationskonversion.
- Discard-Schutz für höchstens eine sinnvolle Breaker-Backupkopie.
- Lockjaw-, Clown-, Vewy- und Krash-Hint-/Installsemantik.
- Basic-Credit-Fallback, Draw-for-Economy und Funding-Horizont.
- Plan-Mapping-Schutz gegen stark negative opportunistische Runs.
- Integrierte Regressionen aus den side-safe Matchzuständen.

## Nicht-Ziele

- Keine Änderung der Short-Circuit-, Krash- oder Fast-Advance-Regeln.
- Keine Nutzung verdeckter Corp-Informationen oder FullState im KI-Livepfad.
- Keine Deckänderung und kein automatischer Austausch der Benutzerdeckdatei.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die KI wählt ausschließlich aus `LegalActions`.
- Entscheidungen verwenden nur PlayerView, side-filtered PublicEvents und
  erlaubte eigene Deck-/Grip-/Rig-Metadaten.
- Ein Suchziel muss eine konkrete, noch offene Funktion verbessern.
- Search-, Install- und Discard-Duplikatsemantik dürfen sich nicht widersprechen.
- Plan-Mapping darf keine stark negative Aktion gegen eine deutlich bessere
  side-safe Alternative erzwingen, außer ein harter taktischer Grund ist im
  Debug sichtbar.
- Engine-, Replay- und Hidden-Info-Verträge bleiben unverändert.

## Paketfolge

### Paket 1: Prozess und Evidence

- Matchanker, Fehlergruppen und Invarianten dokumentieren.
- Done-Gate: Prozess- und Evidence-Report vorhanden; `git diff --check` grün.
- Commit: `docs(ai): capture krash short circuit replay evidence`

### Paket 2: Suche, Konversion und Discard

- Coverage-Suche ohne Bedarf abwerten.
- Grip-Duplikate und Konversionsfähigkeit in Suchzielen berücksichtigen.
- Discard auf höchstens eine Breaker-Backupkopie begrenzen.
- Done-Gate: fokussierte Search-/Choice-/Discard-Tests grün.
- Commit: `fix(ai): stop redundant breaker search loops`

### Paket 3: Synergie- und Hintsemantik

- Lockjaw, Clown, Vewy und Krash fachlich korrigieren.
- Generierte Hintartefakte und relevante Gates aktualisieren.
- Done-Gate: Hint-/Ontology-Gates und Install-Grenznutzen-Tests grün.
- Commit: `fix(ai): recognize krash support rig synergies`

### Paket 4: Economy und Plan-Mapping

- Draw-for-Economy beziehungsweise Funding-Horizont ergänzen.
- Opportunistische negative Run-Unterbrechungen begrenzen.
- Done-Gate: Economy-/Plan-Mapping-Regressions grün.
- Commit: `fix(ai): bound runner funding and weak run overrides`

### Paket 5: Integration und Abschluss

- Integrierte Match-nahe Regressionen, AI-Typecheck und breite angrenzende Tests.
- Final-Review und Wissens-/Monatslogpflege.
- Aktuelles `main` in den Arbeitsbranch integrieren, erneut prüfen und den Branch
  lokal nach `main` mergen.
- Commit: `docs(ai): close krash short circuit runner fix`

## Sicherheitsblocker

Stoppen ohne Workaround, falls eine Verbesserung FullState oder spätere
Hidden-Info benötigt, LegalActions fehlen, Side-Safety-/Replay-Tests rot werden
oder `main` nicht kollisionsfrei integrierbar ist.

## Abschlusskriterien

- Alle sieben freigegebenen Fehlergruppen besitzen Regressionsevidence.
- Fokussierte Tests, AI-Typecheck, relevante Hint-Gates und `git diff --check`
  sind grün.
- Final-Review nennt Grenzen, Checks, Commits und Merge-Status.
- Arbeitsbranch ist lokal nach `main` integriert; der fremde Hauptworkspace-
  Änderungsstand bleibt erhalten.

## Ergebnis

Alle fünf Pakete wurden sequenziell umgesetzt. Die sieben freigegebenen
Fehlergruppen sind durch fokussierte oder integrierte Regressionen abgedeckt.
Die abschließende lokale Integration nach `main` wird im Final-Review mit dem
tatsächlichen Merge-Stand festgehalten.
