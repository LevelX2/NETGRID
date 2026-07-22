# Match e2f2: Corp-Entscheidungsfenster – Remediation-Prozess

Stand: 2026-07-22
Status: technisch abgenommen; lokale Integration ausstehend

## Quelle und Zielprüfung

Quelle ist der vollständige 83/83-Entscheidungsaudit des gespeicherten Matches
`match_e2f2f6f433debe00` (Purge Window gegen Universal Fast Advance). Die
Diagnosen, betroffenen Entscheidungspunkte und gewünschten Verhaltensgrenzen
sind ausreichend präzise für eine direkte Umsetzung.

Gesamtziel ist eine generische Härtung der Corp-Semantic-Runtime. Sie soll
sichtbaren Ertrag und tatsächlichen Spielzustand bewerten, langfristigen
R&D-Druck als Gegenplan halten und sichere Same-Turn-Scorepfade vor unnötiger
Zusatzverteidigung ausführen. Der Arbeitsbranch wird nach bestandenen Gates
lokal nach `main` integriert.

## Annahmen und Nicht-Ziele

- Die Checkpoints D45, D63, D75 und folgende verwenden wegen des im Match
  nachweisbaren Serverneustarts einen strikten Warmup ab Entscheidung 44.
- Lösungen bleiben kartenunabhängig und verwenden nur Corp-PlayerView,
  side-gefilterte Events, LegalActions, Deckstrategie und vorhandene
  semantische Metadaten.
- Die Engine, Kartenregeln, LegalAction-Erzeugung und Hidden-Info-Verträge
  werden nicht geändert.
- Der alte D38-Purge stammt aus der Runtime vor dem Neustart. Er ist durch die
  bereits grüne aktuelle Purge-Regression abgedeckt und kein neues Fixpaket.
- Es entstehen weder ein stiller Fallback noch eine Ersatzaction außerhalb
  der LegalActions.

## Bestätigte Diagnosen und Zielverhalten

1. **Rez-Ertrag:** D7 rezzte Data Wall für 1 Credit bei null marginalen
   Runner-Kosten; D14 rezzte Wall of Static für 3 Credits, um am agenda-freien
   HQ höchstens 2 Credits zu taxen. Rez-Kosten, marginale Runner-Kosten,
   Stop-Wahrscheinlichkeit und geschützter sichtbarer Wert werden gemeinsam
   verglichen. Die ertragreichen Rezzes D36 und D56 bleiben positiv.
2. **Quantitativer Draw:** Annual Reviews bietet als LegalAction `drawCards=3`,
   verlor D45 bis D47 aber deutlich gegen den einzelnen Basic Draw und weitere
   Credits. Der Produktionsscore konsumiert den wirklichen Draw-Ertrag unter
   Berücksichtigung von Handlimit, R&D-Rest und konkretem Suchbedarf.
3. **Credit-Sättigung:** Die Corp nahm 16 Basic Credits und wuchs ohne
   konkreten Fundingbedarf bis 25 Credits. Eine sichtbare Zielreserve und
   tatsächlich finanzierbare Folgeaktionen begrenzen den Grenznutzen weiterer
   Credits; niedrige Reserven und reale Score-/Rez-Kosten bleiben geschützt.
4. **Persistenter R&D-Gegendruck:** Ein erfolgreicher R&D-Run je Runner-Zug
   fiel aus dem kurzen Ereignisfenster. Wiederholter Zentraldruck bleibt über
   Zuggrenzen aktiv, bis der Pfad materiell teurer wird oder mehrere
   gegnerische Züge ohne Zugriff vergehen.
5. **HQ-Matchpointschutz:** D63 legte Misleading Menus trotz agenda-freiem HQ
   nach HQ. Der Schutz bindet an bekannte HQ-Agendapunkte, vorhandene
   Schichten und den marginalen Tax. Ein garantiert noch im selben Zug
   abschließbarer Scorepfad geht zusätzlichem HQ-Schutz vor.
6. **Scorepfad-Priorität:** D75 legte vor einem garantiert vollständigen
   Overtime-Scorepfad ein viertes HQ-ICE. Eine garantierte Scoreline, die eine
   Agenda vor dem nächsten Runner-Fenster aus HQ entfernt und punktet, geht
   zusätzlichem Schutz vor.
7. **Scorepfad-Risikoklassifikation:** D78 bis D80 erhielten trotz exakt
   ausreichender Restaktionen die Komponenten
   `corp_active_remote_agenda_unsafe_advance`,
   `corp_game_ending_scoreline_exposure_penalty` und
   `corp_unsafe_delayed_scoreline_exposure`. Eine vorwärts projizierte
   Install-/Advance-/Score-Sequenz unterdrückt diese Strafen nur bei
   garantiertem Closeout; fehlende Aktionen oder Credits bleiben negativ.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird ohne grünes Done-Gate begonnen.
- Historische Fehlentscheidungen werden vor der Produktionsänderung als rote
  Decision-Checkpoints versioniert.
- Jede neue positive Regel erhält eine negative Gegenprobe, damit sie bei
  fehlender Bezahlbarkeit, fehlendem Druck oder echtem HQ-Risiko nicht greift.
- Tests prüfen stabile Action- und Component-Verträge, keine zufälligen
  absoluten Scores.
- Paketfremde Änderungen auf `main` bleiben unangetastet.

## Automatische Fehlerbehandlung und Sicherheitsblocker

Ein roter Paketcheck wird eng am aktiven Paket diagnostiziert. Eine
konservative Korrektur innerhalb der beschriebenen Invarianten wird ohne
Zwischenfrage fortgesetzt. Gestoppt wird bei Hidden-Info-Leak, notwendiger
Engine-Regeländerung, nicht reproduzierbarem Matchzustand, fachlichem
Widerspruch oder nicht sicher integrierbaren fremden Änderungen. Die Removal
Condition wird dann im Prozessartefakt dokumentiert.

## State Machine und Paketfolge

`PREPARED -> RED_EVIDENCE -> ECONOMY_FIXED -> DEFENSE_FIXED -> SCORELINE_FIXED -> VERIFIED -> MERGED -> CLEANED`

### P0 – Prozessvertrag

- Arbeit: dieses Artefakt, Worktree- und Scope-Vertrag.
- Gate: Dokument vollständig, `git diff --check` grün.
- Commit: `docs(ai): define match e2f2 decision remediation process`.

### P1 – Rote spielgleiche Evidence

- Arbeit: Checkpoints für D7, D14, D45, D63, D75 und D78–D80 sowie
  ertragreiche Rez-, echter HQ-Risiko-, gelöster R&D-Druck-, Low-Credit- und
  unvollständige Scoreline-Gegenproben.
- Gate: alle Zielfälle ausschließlich `behavior_regression`; bereits korrektes
  Verhalten grün; Warmup-Drift null.
- Commit: `test(ai): capture match e2f2 decision regressions`.

### P2 – Rez, Draw und Creditbedarf

- Arbeit: marginaler Rez-Payoff, LegalAction-basierter Draw-Ertrag und
  konkrete Credit-Zielreserve.
- Gate: P1-Wirtschaftscheckpoints und angrenzende Economy-/Rez-Tests grün.
- Commit: `fix(ai): value corp rez draw and credit yield`.

### P3 – R&D-Gegenplan und HQ-Schutz

- Arbeit: zugübergreifender Zentraldruck und zustandsgebundener
  HQ-Matchpointschutz.
- Gate: D63 und R&D-Druckverträge samt Gegenproben grün.
- Commit: `fix(ai): persist central pressure and bind hq protection`.

### P4 – Garantierte Same-Turn-Scoreline

- Arbeit: sichere Vorwärtssequenz, Priorität vor Zusatzschutz und korrekte
  Expositionskomponenten.
- Gate: D75 und D78–D80 grün; unvollständige Pfade bleiben geschützt.
- Commit: `fix(ai): prioritize guaranteed same-turn scorelines`.

### P5 – Abschluss und Wissensrückführung

- Arbeit: AI-Gates, Deck-Hint-Consumer-Audit des Corp-Snapshots,
  Abschlussreview, AI-README, Status und Monatslog.
- Gate: paketnahe Tests, AI-Typecheck, `check:ai`, Deck-Doctrine-/Strategy-Gate,
  Deckaudit, Format und `git diff --check` grün.
- Commit: `docs(ai): close match e2f2 decision remediation`.

## Technisches Abschlussprotokoll

- Die zehn spielgleichen Match-Checkpoints sind grün.
- Der breite Regressionssatz umfasst 9 Dateien mit 94 grünen Tests.
- Die vollständige `@netgrid/ai`-Suite umfasst 444 Dateien mit 3.109 grünen
  Tests; der Typecheck ist grün.
- `check:ai` meldet null harte Hintfehler sowie null Runtime- und Typzyklen.
- Deck-Doctrine-/Strategy-Gate und Formatprüfung sind grün.
- Der Consumer-Audit von `Universal Fast Advance` umfasst 16 verschiedene
  und 45 Karten ohne Ausschluss, Blocker oder Warnung.
- Das Abschlussreview liegt unter
  `docs/reviews/ai/match-e2f2-corp-decision-windows-remediation-final-review-2026-07-22.md`.

## Worktree-, Git- und Integrationsregeln

Arbeitsort ist
`C:\Projekte\NETGRID_AI_MATCH_E2F2_DECISION_WINDOWS` auf
`codex/ai-match-e2f2-decision-windows`. Der Hauptworkspace wird nur für
Preflight und finalen lokalen Merge verwendet. Nach jedem Paket werden nur
paketeigene Dateien gestaged und committed. Vor dem Merge wird aktuelles
`main` defensiv integriert und final geprüft. Nach erfolgreichem Main-Merge
werden der saubere Worktree und anschließend der vollständig gemergte Branch
entfernt; Git-Liste und Dateisystem müssen die Entfernung bestätigen.

## Abschlusskriterien

Alle sieben Diagnosen besitzen grüne generische Verträge, Gegenproben bleiben
grün, Deck-/Hint-Consumer sind ohne Blocker geprüft, Dokumentation und Log
beschreiben den Current State, `main` enthält alle Paketcommits und weder
Arbeits-Worktree noch Arbeitsbranch existieren danach weiter.
