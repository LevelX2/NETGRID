# Two-Match Corp AI Fixes Process

Status: Abgeschlossen und lokal nach `main` integriert

## Quelle und Gesamtziel

Die zwei zuletzt abgeschlossenen Spiele `match_3a9aeae8628e4f0a` und
`match_8d959dc447958cef` zeigen vier freigegebene Corp-KI-Fehlergruppen. Ziel ist,
diese generisch und side-safe an ihren fachlichen Quellen zu beheben, fokussiert
zu verifizieren und den Arbeitsbranch lokal nach `main` zu integrieren.

## Invarianten

- Die KI nutzt ausschließlich PlayerView, side-safe PublicEvents und LegalActions.
- Die Rules Engine bleibt alleinige Regelautorität.
- Planfortschritt wird nicht durch Frontend- oder Debug-Korrekturen simuliert.
- `protect_remote` konsumiert die bestehende ICE-Platzierungsbewertung. Es entsteht
  keine zweite konkurrierende ICE-Bewertung.
- Basis-Credits, Ziehen und Purge bleiben legal, müssen aber einem konkreten,
  kontextuell besseren Planfortschritt entsprechen.
- Tests verwenden realistische Spielzustände und tatsächliche Kartenprofile.

## Nicht-Ziele

- Keine kartennamenspezifischen Sonderregeln für die beobachteten Decks.
- Keine Änderung der Engine-Regeln oder LegalActions ohne belegte Engine-Lücke.
- Keine globale Abwertung von Basis-Credits oder Ziehen.
- Keine Auswertung verdeckter Runner-Informationen.

## Paketfolge

### P1: Preflight, Evidence und Prozessvertrag

- Match-Evidence und Fehlergruppen dokumentieren.
- Quellschichten und Verifikationsregeln festlegen.
- Done-Gate: Prozess- und Evidence-Artefakt vorhanden, `git diff --check` grün.
- Commit: `docs(ai): record two-match corp fix process`

### P2: Wirksamer Remote-Schutz

- ICE-Installationen für `protect_remote` durch den bestehenden
  `corp-ice-placement`-Evaluator qualifizieren.
- Nur wirksame und finanzierbare Schutzaktionen dürfen unmittelbaren
  Planfortschritt darstellen.
- Nicht finanzierbarer, aber wirksamer Schutz erzeugt einen konkreten
  Reservebedarf. Fehlt brauchbarer Handschutz, muss der Plan Beschaffung statt
  beliebiger Installation oder Credit-Schleife abbilden.
- Done-Gate: realistische positive und negative Planregressionen sowie angrenzende
  Placement-Tests grün.
- Commit: `fix(ai): bind remote protection plans to ice placement`

### P3: Sichere Agenda-Exposition

- Agenda-Installationen werden bei erreichbarem Remote, unzureichendem
  Score-Horizont oder spielentscheidendem Steal hart aus dem aktiven Scoreplan
  ausgeschlossen.
- Done-Gate: Matchpoint-/Langzeitagenda-Regression und sichere Gegenprobe grün.
- Commit: `fix(ai): block unsafe agenda exposure`

### P4: Persistente Economy-Aktivierung

- Bereits installierte, legal aktivierbare Economy-Assets werden als notwendiger
  Konvertierungsschritt des Economy-Plans behandelt.
- Done-Gate: Nullkosten-Aktivierung schlägt grundloses Ziehen oder Basis-Credit;
  akute Score-/Defense-Gegenprobe bleibt möglich.
- Commit: `fix(ai): complete installed economy activation`

### P5: Kontextsensitiver Purge

- Purge-Wert berücksichtigt Counterzahl, betroffene Verteidigung,
  Breakkostenänderung, aktuellen Druck und Opportunitätskosten.
- Done-Gate: ein einzelner wirkungsarmer Counter verliert gegen Scoring-Reparatur;
  mehrere kritische Counter unter Druck erlauben Purge.
- Commit: `fix(ai): gate purge by tactical impact`

### P6: Abschluss

- Fokussierte und angrenzende Tests, AI-Typecheck und `git diff --check`.
- Evidence und Final-Review abschließen, dauerhaften Vertrag im Monatslog ergänzen.
- Aktuelles `main` integrieren, erneut verifizieren und lokal nach `main` mergen.
- Commit: `docs(ai): close two-match corp fixes`

## Automatische Fehlerbehandlung

Ein roter Test wird innerhalb des aktiven Pakets ursächlich untersucht. Das
nächste Paket beginnt erst nach grünem Done-Gate. Side-Safety-, Engine- oder
LegalAction-Probleme sind Stop-Blocker und werden nicht im Ranking umgangen.

## Verifikation

- Fokussierte Vitest-Dateien der jeweils geänderten Plan-/Runtime-Schicht.
- Angrenzende `corp-ice-placement`-, Scoreline-, Economy- und Purge-Regressionen.
- `corepack pnpm --filter @netgrid/ai typecheck`.
- Wenn realistisch: `corepack pnpm --filter @netgrid/ai test`.
- `git diff --check` je Paket und nach Integration.

## /Goal

Arbeite P1 bis P6 ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_TWO_MATCH_CORP_FIXES_20260711` auf Branch
`codex/ai-two-match-corp-fixes-20260711` ab. Committe jedes abgeschlossene Paket.
Nutze den Hauptworkspace nur für den finalen lokalen Merge. Markiere das Ziel erst
nach erfolgreicher Main-Verifikation als abgeschlossen.
