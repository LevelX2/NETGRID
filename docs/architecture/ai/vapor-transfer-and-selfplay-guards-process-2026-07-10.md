# Vapor-Transfer und Selfplay-Guardrails

## Status

- Status: in Umsetzung
- Datum: 2026-07-10
- Agent: `card-enablement-ai-knowledge-agent`
- Branch: `codex/ai-vapor-transfer-and-selfplay-guards`
- Worktree: `C:\Projekte\NETGRID_AI_VAPOR_TRANSFER_AND_SELFPLAY_GUARDS`
- Integration: lokales `main`

## Quelle und Freigabe

Eine 100-Versuche-Serie mit dem Corp-Deck `Universal Fast Advance` gegen vier
Runner-Archetypen belegte drei unabhängige Fehlergruppen. Die vollständige
Analyse und die geplanten generischen Maßnahmen wurden dem Nutzer vorgelegt.
Der Nutzer hat die Umsetzung mit „js“, im Gesprächskontext als „ja“
verstanden, freigegeben.

## Gesamtziel

1. Advancement-Counter-Transfer wird anhand der Engine-Capability und des
   sichtbaren Zielkontexts als Score-Conversion behandelt und kann Basic
   Advances oder Economy-Cashout verdrängen, wenn er einen Agenda-Score
   beschleunigt oder Ressourcen spart.
2. Secret-Spend-Guess-Aktionen sind nur LegalActions, wenn ihre von
   `applyAction` verlangte Mindestcredit-Bedingung erfüllt ist.
3. Access-Projektionen tragen Free-Trash- oder Trash-Waiver-Signale nur bei
   tatsächlichem Trash-Intent.

## Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Die KI wählt ausschließlich aus aktuellen `LegalActions`.
- `applyAction` revalidiert unverändert fail-closed.
- Keine Karten-ID-Sonderlogik für Vapor Ops oder einzelne Agenda-Titel.
- Keine Hidden-Info-Leaks in PlayerViews, Debug, Replays oder Reports.
- Countermenge, Ziel, Klicks, Credits und Agenda-Schwelle werden nur aus
  side-safe sichtbarem Zustand abgeleitet.
- Fremde uncommittete Änderungen im Hauptworkspace bleiben unangetastet.

## Nicht-Ziele

- keine allgemeine Neugewichtung sämtlicher Corp-Aktionen;
- keine Freigabe eines Chicago-Branch-Fixes ohne agenda-spezifische Evidence;
- kein Push und kein Pull Request;
- keine Legacy- oder Datenmigration.

## Paketfolge

### P0 – Prozess und Evidence

- Prozessartefakt und Evidence-Report erstellen.
- Checks: Format und `git diff --check`.
- Commit: `docs(ai): record vapor transfer selfplay evidence`.

### P1 – Generischer target-aware Countertransfer

- LegalAction-Capability in Action-Semantik und Scoreplan-Mapping prüfen.
- Countertransfer gegen Basic Advances und Cashout target-aware vergleichen.
- Positive Regressionen für Ressourcensparen, Cashout-Verdrängung und
  unmittelbaren Score; negative Regressionen ohne Agenda-Ziel oder Vorteil.
- Checks: fokussierte AI-Tests, AI-Typecheck, Diff-Check.
- Commit: `fix(ai): convert advancement transfers into score lines`.

### P2 – Secret-Spend-Guess LegalAction-Konsistenz

- Die über Blink Seeds 06 und 11 reproduzierte Kartenquelle bestimmen.
- LegalAction-Erzeugung und `applyAction`-Revalidierung auf denselben
  Mindestcredit-Vertrag bringen.
- Engine-Negativtests und Seed-Regressionen ergänzen.
- Checks: fokussierte Engine-/Simulationstests, Engine-Typecheck, Diff-Check.
- Commit: `fix(engine): align secret spend guess legal actions`.

### P3 – Access-Intent-Invariante

- Proteus-R&D Seeds 06, 18 und 21 reproduzieren.
- Free-Trash/Waiver nur zusammen mit Trash-Intent projizieren.
- Direkte Access-Gegenproben und Seed-Regressionen ergänzen.
- Checks: fokussierte AI-Tests, AI-Typecheck, Diff-Check.
- Commit: `fix(ai): bind access trash waivers to trash intent`.

### P4 – Breite Verifikation und Integration

- AI- und Engine-Gates ausführen.
- Vapor-Fälle Blink 07 sowie Classic 04 und 22 nachtesten.
- Fehlerseeds 06, 11, 18 und 21 nachtesten.
- Relevanten breiteren Selfplay-Nachtest ausführen.
- Final Review und Wissenslog ergänzen.
- Arbeitsbranch lokal nach `main` integrieren und Worktree entfernen.
- Commit: `docs(ai): verify vapor transfer and selfplay guards`.

## Verbindliches `/Goal`

```text
/Goal Arbeite Vapor-Transfer und Selfplay-Guardrails vollständig und
sequenziell von P0 bis P4 ab und merge den abgeschlossenen Arbeitsbranch lokal
nach main. Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_AI_VAPOR_TRANSFER_AND_SELFPLAY_GUARDS auf Branch
codex/ai-vapor-transfer-and-selfplay-guards. Nutze den Hauptworkspace nur für
den finalen Merge. Arbeite immer nur am aktuellen Paket, führe die Paketchecks
aus und committe jedes abgeschlossene Paket. Stoppe bei Engine-, Hidden-Info-,
Replay- oder Side-Safety-Regression. Integriere nach Abschluss aktuelles main,
verifiziere final, merge lokal nach main, entferne den Worktree und schließe
das Goal erst danach ab.
```

## Abschlusskriterien

- Die drei freigegebenen Fehlergruppen besitzen generische Fixes und
  Regressionen.
- Die drei Vapor-Evidence-Spiele nutzen Transfer korrekt, wenn er den
  Scorepfad verbessert.
- Die fünf fehlerhaften Selfplay-Seeds laufen ohne IllegalAction oder
  Access-Invariantenabbruch.
- Relevante AI-/Engine-Gates sind grün.
- Branch ist lokal nach `main` integriert; fremde Änderungen bleiben erhalten.
