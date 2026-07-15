# Runner-Remediation aus Match E8886 (2026-07-15)

Status: P4 abgeschlossen; P5 als nächstes

## Quelle und Gesamtziel

Quelle ist das zuletzt abgeschlossene Hard-Runner-KI-Spiel
`match_e8886c6f5a9d0c24` aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`. Der Runner
gewann zwar durch sieben Agendapunkte, zeigte aber vier freigegebene
Fehlentscheidungen bei StateVersion 24, 28, 39 und 41.

`/Goal`: Die vier freigegebenen KI-Fehler sequenziell im eigenen Worktree
zuerst als spielgleiche rote Decision-Checkpoints mit grünen Gegenproben
sichern, danach generisch und side-safe beheben, vollständig verifizieren,
lokal nach `main` integrieren und Worktree sowie Arbeitsbranch sauber
entfernen.

- Arbeitsbranch: `codex/ai-match-e8886-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_E8886_REMEDIATION`
- Ausgangs-`main`: `ebe70b88870beada70f0fb9b130aab431ba35338`
- Match-Modus: `human_corp_vs_runner_ai`
- KI-Profil: Runner `hard`
- Seed: `match-mrlndgdz-1s1jeg`

## Zielprüfung und Annahmen

Der Scope ist nach der zugweisen Analyse aller 47 Runner-Entscheidungen und
der ausdrücklichen Nutzerfreigabe präzise genug für direkte Umsetzung.

- Der frühe Check-Run bei D2/D3 bleibt ausdrücklich eine legitime Option.
  Unbekanntes ICE kann günstig sein, den installierten falschen Breaker
  zerstören oder eine frühe Breaker-Installation anderweitig bestrafen.
- Der neue Risiko- oder Finanzierungsvertrag darf einen Check-Run daher nicht
  pauschal durch eine Breaker-Installation ersetzen. Er begrenzt nur Läufe
  ohne sinnvolle Finanzierungs-, Probe- oder Zugriffsperspektive.
- Jede historische Situation wird vor dem Fix mit damaligem Runtime-Zustand,
  öffentlichem Eventpräfix, neu erzeugter PlayerView und neuen LegalActions
  über den produktiven Chooser geprüft.
- Nur `behavior_regression` gilt als roter Reproduktionsnachweis. Bereits
  grüne historische Erwartungen lösen keinen künstlichen Fix aus.

## Freigegebene Fehlerverträge

1. **Unfinanzierter unbekannter R&D-Pfad, D13/SV24:** Ein nicht dringlicher
   Run mit null Credits gegen vom Corp bezahlbares unbekanntes ICE darf die
   vorhandene side-safe Unrezzed-ICE-Risikoanalyse nicht als erwartete Kosten
   von null behandeln. Funding oder ein freier zentraler Zugriff müssen
   gegenüber dem aussichtslosen Run gewinnen.
2. **Junkyard BBS als falsche Economy, D16/SV28:** Trash-Recovery ohne
   sichtbares Heap-Ziel erzeugt keine Credits und darf weder den
   Economy-Hint noch den generischen Economy-Installbonus erhalten.
3. **Inside Job trotz `blocked_unpayable`, D22/SV39:** Ein kartengestützter
   Run-Plan darf nicht absolut gewählt werden, wenn die Bewertung genau
   dieser Aktion den verbleibenden sichtbaren Pfad als unbezahlbar ausweist.
4. **Weiterlaufen trotz konkretem Abbruch, D23/SV41:** Eine allgemeine
   Continue-Präferenz darf eine aktuelle, vollständig bekannte und
   unbezahlbare Restpfad-Revalidierung nicht überschreiben.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln, LegalActions oder Kartenkosten.
- Keine Match-, Seed-, Deck- oder Kartennamen-Sonderlogik im produktiven
  Runtime-Code.
- Keine pauschale Bevorzugung von Breaker-Installation vor einem Check-Run.
- Keine Nutzung späterer Access-Information oder anderer Hidden-Info.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- PlayerView, PublicEvents, Decision-Input und Debug bleiben side-safe.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Erwartungen werden nach dem Fix nicht abgeschwächt.
- Jeder Paketabschluss umfasst relevante Checks, `git diff --check`, nur
  paketzugehöriges Staging und einen eigenen Commit.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- `engine_legality_drift`, `runtime_state_drift`, Fixture-, Redaction- oder
  Warmup-Fehler werden als Infrastrukturproblem behandelt und vor einem
  Verhaltensfix geklärt.
- Fehlen für eine generische Lösung side-safe Daten, stoppt das betroffene
  Paket ohne FullState- oder Hidden-Info-Workaround.
- Zeigen Gegenproben eine Verschlechterung legitimer Check-Runs, erreichbarer
  Run-Events oder sicherer Continue-Entscheidungen, bleibt das Paket offen.
- Nicht auflösbare Konflikte mit zwischenzeitlichem `main` blockieren die
  Integration und werden dokumentiert.

## State Machine

`P0 Preflight -> P1 Checkpoints/Red-Evidence -> P2 Hint-Vertrag ->`
`P3 Run-Start/Run-Event -> P4 Run-Abbruch -> P5 Verifikation/Reviews ->`
`P6 Integration/Cleanup`

## Paketfolge

### P0 - Preflight und Prozessvertrag

- Ziel: Worktree, Scope, Nutzerpräzisierung, Invarianten und `/Goal` sichern.
- Gate: korrekter sauberer Worktree, Prozessartefakt und `git diff --check`.
- Commit: `docs(ai): plan match e8886 remediation`

### P1 - Spielgleiche Checkpoints und rote Evidence

- Capture D13/SV24, D16/SV28, D22/SV39 und D23/SV41.
- Gegenproben: D39 vollständig bekannter finanzierter R&D-Pfad; legitimer
  früher Check-Run ohne installierten Breaker; echte Economy-Aktion;
  Junkyard mit sichtbarem Recovery-Ziel; erreichbarer Inside Job; sichere
  Continue-Entscheidung trotz veralteter Abbruchmeldung.
- Kernartefakte: versionierte Fixtures, fokussierter Checkpoint-Test und
  Evidence-Report unter `docs/reviews/ai/`.
- Gate: alle weiterverfolgten Ziele `behavior_regression`, alle Gegenproben
  grün, Fixture-Validierung und `git diff --check` grün.
- Commit: `test(ai): capture match e8886 regressions`

### P2 - Hint- und Recovery-Semantik

- Ziel: Junkyard BBS aus der Economy-Rolle lösen und Recovery-Installationen
  nur mit sichtbarem Ziel oder belegter Synergie aufwerten.
- Gate: D16 und Hint-Verträge grün; Livewire und nutzbare Recovery-Gegenprobe
  bleiben grün; relevante Hint-Artefakte konsistent.
- Commit: `fix(ai): correct recovery economy semantics`

### P3 - Unbekannte Run-Pfade und kartengestützte Runs

- Ziel: vorhandenes Unrezzed-ICE-Risiko side-safe in nicht dringliche
  Start-Run-Entscheidungen einbeziehen und aktionsspezifisch unbezahlbare
  Run-Events aus absoluten taktischen Plänen ausschließen.
- Gate: D13 und D22 grün; D2/D3-artiger Check-Run, D39 und erreichbarer
  Inside Job bleiben grün.
- Commit: `fix(ai): respect run risk and action reachability`

Umgesetzt: Die bereits side-safe rekonstruierte Unrezzed-ICE-Risikokurve
liefert für tatsächlich unbekanntes, nicht gerezztes ICE eine kleine
Finanzierungsreserve. Score-Threats, finanzierte Probes und ein Corp ohne
Rez-Credits bleiben davon ausgenommen. Aktionsprojektionen werden nun auch
von der harten Exclusion-Schicht vollständig konsumiert: Ein nach Eventkosten
unbezahlbarer Pfad wird ausgeschlossen. Zusätzlich wird ein bezahltes
Run-Event gegenüber dem legalen Basic Run ausgeschlossen, wenn seine
projizierte Sonderwirkung am gewählten Ziel gar nicht eintritt. Das verhindert
insbesondere den nachgelagert sichtbar gewordenen nutzlosen Inside Job auf ein
freies HQ.

### P4 - Konkreter Run-Abbruch

- Ziel: Continue darf einen aktuell nachgewiesenen bekannten unbezahlbaren
  Restpfad nicht überstimmen, aber veraltete vorsichtige Abbrüche weiterhin
  übergehen.
- Gate: D23 und beide Continue-/Abort-Gegenrichtungen grün; angrenzende
  RunnerRunPlan-Tests grün.
- Commit: `fix(ai): honor concrete unpayable run aborts`

Umgesetzt: Die aktive Restpfad-Quote bestimmt ihren Known-Status nur noch aus
dem tatsächlich noch vor dem Runner liegenden ICE; bereits passiertes
unbekanntes ICE hält die Quote nicht künstlich auf `partially_known`. Eine im
aktuellen State revalidierte, `known_complete` und nicht zugriffsfähige Quote
darf deshalb nicht mehr allein wegen eines höheren generischen Continue-Scores
überstimmt werden. Vorsichtige oder veraltete Abort-Schätzungen mit unbekannter
Quote dürfen weiterhin an eine sichtbar bessere Continue-Entscheidung
abgeben.

### P5 - Breite Verifikation, Review und Wissenspflege

- Ziel: unveränderte Checkpoints, Gegenproben, angrenzende Regressionen,
  Hint-/Ontology-Gates, AI-Typecheck und möglichst vollständige AI-Suite
  ausführen; Evidence-, Final-Report und Monatslog abschließen.
- Gate: alle verpflichtenden Checks grün, Abweichungen dokumentiert,
  Arbeitsbranch sauber.
- Commit: `docs(ai): close match e8886 remediation`

### P6 - Main-Integration und Cleanup

- Ziel: aktuelles `main` defensiv integrieren, finale relevante Checks
  wiederholen, bevorzugt per Fast-Forward lokal nach `main` mergen und
  Worktree sowie Branch verifiziert entfernen.
- Gate: Main-Prüfung grün; Worktree weder registriert noch im Dateisystem;
  gemergter Arbeitsbranch gelöscht; `/Goal` abgeschlossen.

## Verifikationsregeln

Mindestens ausführen:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/match-e8886-runner-decision-checkpoints.test.ts `
  src/runtime/runner-run-target-evaluation.test.ts `
  src/runtime/runner-run-plan-policy.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

Bei Änderungen unter `data/ai/` folgen die relevanten Hint-/Ontology-Gates.
Nach stabilem fokussiertem Stand wird, soweit realistisch, die vollständige
AI-Suite ausgeführt. Nach dem Main-Merge werden die relevanten Checkpoints,
der Typecheck und `git diff --check` erneut geprüft.

## Controller-Prompt-Kern

Arbeite ausschließlich im Worktree
`C:\Projekte\NETGRID_AI_MATCH_E8886_REMEDIATION` auf Branch
`codex/ai-match-e8886-remediation`. Nutze den Hauptworkspace nur für den
finalen lokalen Merge. Arbeite immer nur am aktiven Paket, führe dessen Gates
aus und committe es separat. Stoppe bei einem Sicherheitsblocker ohne
Workaround. Nach Abschluss integriere aktuelles `main`, verifiziere erneut,
merge lokal nach `main`, entferne den sauberen Worktree, prüfe Registrierung
und Dateisystem, lösche den gemergten Branch und schließe den `/Goal` erst
dann ab.
