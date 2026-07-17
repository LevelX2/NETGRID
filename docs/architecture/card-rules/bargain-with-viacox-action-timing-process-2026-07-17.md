# Bargain with Viacox – Aktions-Timing und Würfelwurf-Paketprozess

Status: In Umsetzung (P1)

## Quelle/Vorgabe

Nutzerauftrag vom 2026-07-17: Die bereits bestätigte Abweichung von
`Bargain with Viacox` direkt mit dem Skill `paketprozess-worktree-goal`
umsetzen.

Der echte Ablauf „Resource installieren → Runner-Zug beenden → Corp-Zug
beenden → nächster Runner-Zug“ gab nur vier statt fünf Aktionen. In diesem
Zug fehlten zudem der deterministische Würfelwurf und damit der
Chronicle-Eintrag. Eine spätere tatsächliche Auslösung transportiert den
Würfelwurf zwar aus der Engine, der Chronicle-Renderer zeigt ihn aber nicht
an.

## Zielprüfung

Die Umsetzung ist ausreichend präzise.

- Gesamtziel: Der erste Runner-Zug nach der Installation erhält die erzwungene
  fünfte Aktion, und die Chronicle nennt Würfelwurf und erzwungene Aktion.
- In-Scope: Start-of-turn-Logik, reale Installpfad-Regression, Chronicle und
  die zugehörigen Tests.
- Nicht-Ziele: Keine Änderung an Kartentext, Kartenpool, KI-Strategie,
  Zufallsalgorithmus oder Hidden-Info-Regeln.
- Verifikation: fokussierte Engine- und Chronicle-Tests, Typechecks sowie
  finale Paketchecks auf dem Integrationsstand.

## Gesamtziel

/Goal Arbeite den Prozess „Bargain with Viacox – Aktions-Timing und
Würfelwurf“ vollständig und sequenziell von P0 bis P2 ab und merge den
abgeschlossenen Arbeitsbranch lokal nach `main`.

Der echte Installpfad muss im ersten folgenden Runner-Zug eine erzwungene,
deterministisch ausgewürfelte zusätzliche Aktion erzeugen. Die Aktion bleibt
an ihre ausgewürfelte Familie gebunden und wird nur bei Unmöglichkeit als
solche aufgelöst. Der Chronicle muss den Würfelwurf anzeigen, ohne
verdeckte Handkarten oder interne Instanz-IDs offenzulegen.

## Annahmen

- „After the turn in which you install Viacox“ bedeutet: erstmals zu Beginn
  des unmittelbar folgenden Runner-Zugs, nicht erst einen Runner-Zug später.
- Die bestehende erzwungene Aktionsbindung und die deterministischen
  `RandomDrawRecords` sind fachlich korrekt und werden erhalten.
- Für einen Wurf von 6 bleibt die gezogene Handkarte ausschließlich so weit
  sichtbar, wie es der bestehende Reveal-/Hidden-Info-Vertrag verlangt.

## Controller-Invarianten

- Die Rules Engine bleibt die alleinige Regelautorität.
- Jede erzwungene Aktion wird weiterhin aus `LegalActions` abgeleitet und in
  `applyAction` validiert.
- StateHash, Replay und `RandomDrawRecords` bleiben deterministisch.
- Public Events und Chronicle dürfen keine verdeckten Kartenidentitäten oder
  Instanz-IDs enthüllen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Ein roter Paketcheck blockiert das nächste Paket, bis die Ursache behoben
  oder als echter Sicherheitsblocker mit Removal Condition dokumentiert ist.
- Bei einem Konflikt mit aktuellem `main` werden beide Intentionen geprüft;
  kein pauschales Übernehmen einer Seite.
- Push, Pull Request und Remote-Integration sind ausgeschlossen.

## State Machine

`P0 geplant → P0 verifiziert/committet → P1 aktiv → P1 verifiziert/committet
→ P2 aktiv → P2 verifiziert/committet → Final verifiziert → nach main
gemergt → Worktree und Branch entfernt → complete`

## Paketfolge

| Paket | Ziel | Kernartefakte | Done-Gate | Commit |
| --- | --- | --- | --- | --- |
| P0 | Prozess und `/Goal` festschreiben | dieses Dokument | `git diff --check` sauber | `docs: define Bargain with Viacox fix process` |
| P1 | ersten Folgezug nach echter Installation korrekt auslösen | Engine-Resolver, Engine-Regressionstest | fünf Aktionen, Wurf, Pflichtaktion, Replay/StateHash | `fix(engine): trigger Viacox on first following turn` |
| P2 | Würfelwurf in Chronicle sichtbar machen | Chronicle-Renderer und Test | Wurf + Aktion sichtbar, keine Hidden-Info-Leaks | `fix(web): show Viacox die roll in chronicle` |

## Paketdetails

### P0 – Prozessartefakt und `/Goal`

- Eingang: sauberer Hauptworkspace, eigener Worktree auf aktuellem `main`.
- Arbeit: Ziel, Scope, Invarianten, Paketfolge und Abschlussregeln erfassen.
- Checks: `git diff --check`.
- Done: Dokument ist vollständig und als einzelner Paketcommit vorhanden.

### P1 – Engine-Timing und reale Installation

- Eingang: P0-Commit.
- Arbeit: Die abgelaufene Install-Markierung darf den ersten folgenden
  Runner-Zug von Viacox nicht überspringen. Einen Test über eine tatsächliche
  `install_card`-Action und zwei Rundenwechsel ergänzen.
- Akzeptanz: Der Runner startet mit fünf Aktionen; der deterministische Wurf
  ist protokolliert, die Legal Actions sind auf die gewürfelte Familie
  beschränkt, und Replay/StateHash stimmen.
- Checks: fokussierter Engine-Test, `git diff --check`.

### P2 – Chronicle-Würfelwurf

- Eingang: P1-Commit.
- Arbeit: Den bereits im `gain_actions`-Effekt vorhandenen `dieRoll` im
  Chronicle als Wurf und als Ergebnis der erzwungenen Aktion formatieren.
- Akzeptanz: Die Chronicle nennt Karte, Wurf, zusätzliche Aktion und die
  erzwungene Familie bzw. das Ziel, sofern öffentlich. Sie nennt keine
  verdeckte Handkarte.
- Checks: fokussierter Chronicle-Test, `git diff --check`.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_BARGAIN_WITH_VIACOX_FIX`
- Arbeitsbranch: `codex/bargain-with-viacox-action-timing`
- `main` wird ausschließlich für den finalen lokalen Merge genutzt.
- Jeder abgeschlossene Paketstand wird nach seinem Done-Gate einzeln
  committed.
- Vor dem Merge wird aktuelles `main` defensiv in den Arbeitsbranch integriert,
  danach werden die finalen Checks erneut ausgeführt.
- Nach erfolgreichem Main-Merge werden Worktree und vollständig gemergter
  Branch nur nach zweifacher Entfernungskontrolle gelöscht.

## Controller-Prompt-Kern

```text
/Goal Arbeite Bargain with Viacox – Aktions-Timing und Würfelwurf vollständig
und sequenziell von P0 bis P2 ab und merge den abgeschlossenen Arbeitsbranch
lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtenden
Wiki-Einstiegsseiten, agents/release-implementation-agent.md und dieses
Prozessartefakt. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_BARGAIN_WITH_VIACOX_FIX auf Branch
codex/bargain-with-viacox-action-timing. Nutze den Hauptworkspace nur für den
finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische
Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, aktualisiere
das Prozessartefakt, führe Paketchecks aus und committe jedes abgeschlossene
Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition.
Nach P2: aktuelles main defensiv integrieren, final prüfen, lokal nach main
mergen, main prüfen, Worktree entfernen, Entfernung in Git und Dateisystem
verifizieren, den vollständig gemergten Branch löschen und erst dann Goal
complete markieren. Kein Push und kein PR.
```

## Abschlusskriterien

- Der erste Runner-Zug nach echter Viacox-Installation hat eine fünfte,
  erzwungene Aktion.
- Der Würfelwurf erscheint deterministisch im Event und lesbar in der
  Chronicle.
- Pflichtaktion, Hidden-Info-Grenze, Replay und StateHash sind getestet.
- Jeder Paketstand ist committed; der finale Stand ist lokal nach `main`
  integriert.
- Der Arbeits-Worktree und der Arbeitsbranch sind anschließend nachweislich
  entfernt.

## Umsetzungs- und Verifikationsnachweis

- P0: abgeschlossen – Prozessartefakt und `/Goal` erstellt; `git diff --check` sauber.
- P1: aktiv.
- P2: offen.
- Final: offen.
