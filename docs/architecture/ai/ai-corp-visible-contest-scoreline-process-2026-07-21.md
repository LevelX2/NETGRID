# Corp-Scoreline: sichtbarer Contest und temporär sichere Agenda-Remotes

Status: abgeschlossen

## Quelle und Zielprüfung

Quelle ist die Entscheidung, dass die Corp eine Agenda grundsätzlich schnell
ausspielen und scoren soll, sobald ein rezzbares, tatsächlich blockierendes
Remote-ICE bis zum nächsten Scorezeitpunkt keinen **sichtbaren** Runner-
Contest zulässt. Die Regel gilt nicht nur in den ersten Zügen. Eine sichtbare
Krash-Coverage mit ausreichenden Credits bleibt dagegen ein konkreter
Contestpfad.

Der Scope ist präzise: Die bestehende Semantic-Scoreline bleibt der einzige
Entscheidungsweg. Es entsteht kein zweiter Opening-Plan, keine Engine- oder
Kartenänderung und keine Annahme über die verdeckte Runner-Hand oder den
Stack.

## Gesamtziel

Eine temporär sichere Remote-Scoreline soll Agenda-Installation und
Advancement vor allgemeiner Economy oder defensivem Ausbau bevorzugen, wenn
der Runner keinen sichtbaren und bezahlbaren Zugang besitzt. Reale sichtbare
Coverage, Multiaccess, Zentraldruck, fehlende Rezreserve und dynamisch
unsichere ICE bleiben unverändert wirksame Schutzgrenzen.

## Invarianten

- Die KI konsumiert ausschließlich Corp-PlayerView, PublicEvents und
  LegalActions.
- Fehlende sichtbare Breaker-Coverage ist keine Behauptung über die
  Runner-Hand.
- Nur die Engine erzeugt und validiert LegalActions.
- Ein konkreter sichtbarer Contestpfad darf nicht durch die neue Priorität
  überstimmt werden.
- Die Anpassung gilt unabhängig von Zugnummer oder Spielphase.

## Paketfolge

### CSV-01 – Prozess und Ausgangslage

- Dieses Prozessartefakt anlegen.
- Vorhandene Scoring-Window- und Scoreline-Regressionen als Ausgangslage
  erfassen.
- Done-Gate: Scope, Nicht-Ziele und Testgrenzen sind dokumentiert.
- Commit: `docs(ai): define visible-contest scoreline process`

### CSV-02 – Sichtbaren Contest korrekt gewichten

- Die verzögerte Exposition so eingrenzen, dass hohe Runner-Credits ohne
  sichtbare Breaker- oder Zugangscard die temporär sichere Scoreline nicht
  allein zu `unsafe` degradieren.
- Die bestehende Scoreline-Priorisierung für sichere Agenda-Installation und
  Advancement prüfen und nur bei nachgewiesener Überstimmung ergänzen.
- Regressionen für fehlende sichtbare Coverage, sichtbare Krash-Coverage und
  konkrete Zugangspfade ergänzen.
- Done-Gate: fokussierte AI-Tests und `git diff --check` sind grün.
- Commit: `fix(ai): prioritize visible-safe corp scorelines`

### CSV-03 – Abschluss und Integration

- Paketnahe Checks sowie AI-Gates ausführen.
- Ergebnis und verbleibende Grenzen in einem Final Review dokumentieren.
- Aktuelles `main` defensiv integrieren, final prüfen, lokal nach `main`
  mergen sowie Worktree und Branch verifiziert entfernen.
- Commit: `docs(ai): review visible-contest scoreline change`

## Automatische Fehlerbehandlung

Ein roter fokussierter Test blockiert CSV-02. Ein Gatefehler wird auf die
kleinste betroffene Änderung zurückgeführt; keine Lockerung von Hidden-Info-,
LegalAction- oder Contest-Schutzgrenzen ist zulässig. Neue, nicht unmittelbar
notwendige Beobachtungen werden als Follow-up statt als Scope-Erweiterung
behandelt.

## Worktree- und Integrationsregel

- Worktree: `C:\Projekte\NETGRID_CORP_SCORELINE_CONTEST`
- Branch: `codex/corp-scoreline-contest`
- Basis: lokales `main` bei Prozessstart
- Kein Remote-Push und keine Pull Request.

## Controller-Prompt-Kern

> /Goal Arbeite den Prozess Corp-Scoreline: sichtbarer Contest und temporär
> sichere Agenda-Remotes vollständig und sequenziell von CSV-01 bis CSV-03
> ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst
> AGENTS.md, packages/ai/AGENTS.md und dieses Prozessartefakt. Arbeite
> ausschließlich im benannten Worktree auf dem benannten Branch. Stelle keine
> Zwischenfragen, solange die dokumentierten Sicherheitsgrenzen eine
> konservative Fortsetzung erlauben. Führe Paketchecks aus, committe jedes
> abgeschlossene Paket und entferne nach erfolgreichem Main-Merge Worktree und
> Branch verifiziert.

## Abschlusskriterien

- Temporär sichere Scorelines werden nicht wegen unbekannter Runner-Karten
  abgewertet.
- Sichtbare, bezahlbare Breaker-Coverage bleibt ein Schutzgrund.
- Die neue Entscheidung ist durch fokussierte Regressionen und die relevanten
  AI-Gates nachgewiesen.
- Main enthält die Paketcommits; Worktree und Arbeitsbranch sind entfernt.

## Abschlussstand

- Die Verzögerungsrisiko-Projektion darf hohe sichtbare Credits nicht mehr als
  Ersatz für eine verdeckte Runner-Karte behandeln, aber ausschließlich beim
  tatsächlichen Agenda-Install in ein Remote.
- Vorhandene Advancement-, Rezreserve-, Zentraldruck-, Multiaccess- und
  sichtbare-Breaker-Checks bleiben unverändert. Nicht-Agenda-Roots behalten
  damit ihre bestehende Stale-Remote- und Funding-Absicherung.
- Fokussierte Scoring-Window- und Decision-Checkpoint-Tests sowie alle drei
  AI-Testshards sind grün. `check:ai`,
  `check:ai-deck-doctrine-strategy` und der AI-Typecheck sind ebenfalls grün.
