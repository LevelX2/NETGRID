# KI-Gesamttestsuite – sequenzieller Bereinigungsprozess

Status: **aktiv**

Stand: 2026-07-29

Arbeitsbranch: `codex/ai-full-suite-remediation`

Worktree: `C:\Projekte\NETGRID_AI_FULL_SUITE_REMEDIATION`

## /Goal

Die gesamte NETGRID-Testsuite wird auf dem aktuellen Plan-first-Stand
reproduzierbar ausgeführt und vollständig bereinigt. Jeder Fehler wird nach
seiner gemeinsamen Wurzelursache klassifiziert. Generische Runtime-,
Planmodul-, Executor-, Testinfrastruktur- oder Diagnosefehler werden im Sinne
einer regelkonformen und gut spielenden KI behoben. Eine bestehende
Testerwartung wird nur geändert, wenn eine Positivprobe, ein Gegenfall und der
aktuelle Architekturvertrag belegen, dass das heutige Verhalten fachlich
besser und der Test veraltet ist. Einzelkarten- oder Match-IDs dürfen nur
Tests und reproduzierbare Checkpoints präzisieren; produktive Freischaltungen
bleiben generisch.

## Verbindliche Grenzen

- Die Rules Engine bleibt einzige Regelautorität; die KI wählt ausschließlich
  vorhandene `LegalActions`.
- KI-Eingaben, Diagnostik und Tests bewahren den Hidden-Info-Vertrag.
- Kein freier Credit-, Draw-, Run- oder EndTurn-Fallback kaschiert fehlende
  Planabdeckung, unbekannte Assessments oder Executorfehler.
- `assessment_unknown` blockiert nur seinen unbewiesenen Pfad und niemals
  eine unabhängig exakt gebundene produktive Route.
- Corp-ICE-Allokation und Rez-Entscheidungen bleiben Eigentum von
  `corp.defend_servers`; Score-, Remote- und Economy-Pläne delegieren nur
  exakte Needs und Parentbindung.
- Agenda-Install, Advance und Score bleiben Phasen derselben exakten
  `corp.score_agenda`-Instanz.
- Runner-Run-, Access-, Pump-, Break- und Jack-out-Routen benötigen weiterhin
  ein positives planlokales Assessment.
- Es entstehen keine produktiven Abfragen nach konkreter Karten-ID.
- Umfangreiche Rohdaten bleiben lokal und werden nicht versioniert.

## Fehlerklassifikation

Jeder rote Test erhält genau eine primäre Klasse:

1. **Runtimefehler:** Die gewählte oder fehlende Aktion verletzt den aktuellen
   fachlichen Plan-first-Vertrag oder führt nachweislich zu schlechterem Spiel.
2. **Infrastruktur-/Diagnosefehler:** Executor-, Quote-, Planattributions-,
   Fixture- oder Auswertungsvertrag ist inkonsistent, ohne dass die
   gewünschte Spielentscheidung falsch sein muss.
3. **Veralteter Testvertrag:** Die Runtime wählt nachweislich die bessere
   legale Aktion; Positiv- und Gegenprobe schützen den neuen Vertrag.
4. **Nichtdeterminismus:** Derselbe Seed und dieselben side-sicheren Inputs
   führen nicht reproduzierbar zu derselben Entscheidung oder Evidence.

Ein Test wird nicht allein deshalb aktualisiert, weil eine andere Aktion
gewählt wird. Rohscores allein entscheiden ebenfalls keine Klassifikation.

## Sequenzielle Pakete

| Paket | Status | Inhalt | Mindest-Gates |
| --- | --- | --- | --- |
| P00 | aktiv | Prozess, `/Goal`, Grenzen und Paketfolge versionieren | Dokumentprüfung, `git diff --check` |
| P01 | ausstehend | Gesamte Testsuite unverändert ausführen, alle roten Tests und gemeinsame Ursachen inventarisieren | `corepack pnpm test`, reproduzierbare fokussierte Gegenläufe |
| P02 | ausstehend | Executor-, Planabdeckungs-, Quote- und Diagnoseinvarianten generisch reparieren | fokussierte Unit-/Integrationstests, AI-Typecheck, Source-Structure |
| P03 | ausstehend | Corp-Score-, Schutz-, Defense-, Rez- und Economy-Ursachen beheben | positive und negative Corp-Checkpoints, Hidden-Info-Gegenprobe |
| P04 | ausstehend | Runner-Runrisiko-, Coverage-, Wiederholungs- und Sequenzursachen beheben | positive und negative Runner-Checkpoints, Hidden-Info-Gegenprobe |
| P05 | ausstehend | Nur nachweislich veraltete Testverträge aktualisieren und Lücken mit Gegenproben schließen | betroffene Tests plus benachbarte Suiten |
| P06 | ausstehend | Paketübergreifende Gates und vollständige Testsuite schließen; Review- und Wissensstand aktualisieren | Typecheck, Struktur-/Vertragsgates, `corepack pnpm test`, Build |
| P07 | ausstehend | Aktuelles `main` integrieren, dort vollständig verifizieren, Hauptinstanz über das Startscript aktualisieren und Worktree/Branch entfernen | Main-Gates, Server-SHA/Health, Git-/Dateisystem-Cleanup |

Es ist immer genau ein Paket aktiv. Paketgrenzen dürfen nach P01 nur dann
verfeinert werden, wenn die Baseline mehrere unabhängige Wurzelursachen
belegt; jede Änderung wird vor der Umsetzung hier dokumentiert.

## Paketabnahme

Für jedes Paket gilt:

1. Ausgangsfehler oder Vertragslücke reproduzieren.
2. Wurzelursache im fachlichen Owner beheben.
3. Mindestens eine Positivprobe und einen relevanten Gegenfall ausführen.
4. Keine unabhängigen Testfehler in derselben Nachbarsuite neu erzeugen.
5. `git diff --check` ausführen.
6. Ergebnis und Reststatus in diesem Artefakt dokumentieren.
7. Ausschließlich den Paketumfang committen.

## Abschlusskriterien

Das `/Goal` ist erst erreicht, wenn:

- die vollständige Root-Testsuite ohne übersprungene Fehler grün ist;
- alle aktiven Projektgates einschließlich Typecheck, Struktur,
  Hidden-Info-/Authority-Verträgen und Build grün sind;
- keine Erwartung ohne fachlichen Nachweis bloß auf die aktuelle Ausgabe
  umgeschrieben wurde;
- der integrierte `main`-Stand erneut vollständig verifiziert ist;
- die lokale Hauptinstanz exakt diesen `main`-SHA meldet;
- eigener Worktree und gemergter Arbeitsbranch nachweislich entfernt sind;
- fremde Worktrees und Nutzerartefakte unverändert geblieben sind.

## Ausführungschronik

### P00 – Prozessstart

- 2026-07-29: Wiki-, Rollen-, AI-Architektur- und Plan-first-Verträge gelesen.
- 2026-07-29: Nutzerartefakt
  `apps/web/.next-e2e-1785273470251/` und fremden detached Baseline-Worktree
  als unberührten Fremdumfang klassifiziert.
- 2026-07-29: Isolierten Worktree und Branch auf `57cc652a3` angelegt.

