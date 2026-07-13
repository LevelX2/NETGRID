# KI-Remediation der Matches F450 und 10311 (2026-07-13)

Status: Aktiv; P0 bis P4 abgeschlossen, P5 in Arbeit

## Quelle und Gesamtziel

Quelle sind die zwei zuletzt abgeschlossenen Spiele aus
`C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`:

- `match_f450485d3e5be1ab`: Mensch-Corp gegen Hard-Runner-KI, Corp-Sieg
  nach Agendapunkten bei StateVersion 158;
- `match_10311b60ca1364f6`: Mensch-Corp gegen Hard-Runner-KI, Corp-Sieg
  nach Agendapunkten bei StateVersion 329.

`/Goal`: Die vier freigegebenen Runner-KI-Fehler aus beiden Spielen
sequenziell im eigenen Worktree zuerst als spielgleiche rote
Decision-Checkpoints mit grünen Gegenproben sichern, danach generisch und
side-safe beheben, vollständig verifizieren, lokal nach `main` integrieren und
Worktree sowie Arbeitsbranch sauber entfernen.

- Arbeitsbranch: `codex/ai-f450-10311-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_F450_10311_REMEDIATION_20260713`
- Ausgangs-`main`: `2260d0e5bc4ec2287316da35ab0525aadc9d8925`
- KI-Profil: Runner `hard`

## Freigegebene Fehlerverträge

1. Run-Plan-Revalidation darf einen in `movement` nachweislich erreichbaren
   und bezahlbaren Restpfad nicht wie ein aktives Encounter behandeln und per
   Runtime-Override abbrechen. Historische Anker sind alle 20 falschen
   `jack_out`-Entscheidungen beider Spiele, insbesondere SV227 in Match 10311.
2. Steht Corp bei sechs Agendapunkten vor einem unbekannten Scoring-Remote,
   muss ein side-safe erreichbarer und bezahlbarer Zugriff Bank- oder
   Setup-Aktionen verdrängen. Historische Anker: SV148 bis SV151 in F450 sowie
   SV318 bis SV321 in 10311.
3. Streetware darf bei komfortabler liquider Wirtschaft ohne konkrete
   Finanzierungslücke und mit kurzem Resthorizont nicht wiederholt bis zum
   pauschalen Speicherziel aufgeladen werden. Historische Anker: SV124,
   SV157/158, SV168/169, SV187 und SV319/320 in 10311 sowie SV148 bis SV151 in
   F450.
4. Ein explizit über einen Kredit-Schritt finanzierter persistenter
   Handkartenplan muss im nächsten ausführbaren Schritt die Zielinstallation
   gegenüber einer normalen Run-Gelegenheit schützen. Dringende Matchpoint-,
   Bedrohungs- oder Bezahlbarkeitsänderungen dürfen den Plan weiterhin
   unterbrechen. Historischer Anker: SV27/28 in Match 10311 für Cortical
   Cybermodem.

## Invarianten und Nicht-Ziele

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Checkpoints erzeugen PlayerView und LegalActions erneut über die Engine.
- Spätere Hidden-Info wird weder in Fixtures noch in Runtime-Entscheidungen
  verwendet.
- Runtime-Fixes sind generisch; Match-, Seed- und Kartennamen werden nicht als
  Sonderfälle in produktiven Code eingebaut.
- Die strategische Reihenfolge Trapdoor, Dumpster und Archives wird erst nach
  dem Run-Phasenvertrag neu bewertet und ist kein eigener Fixvertrag.
- Überlebens-Draws nach Core Damage sowie Engine-, LegalAction-, Hint- oder
  Kartenfehler sind ohne neue Evidence nicht Teil dieses Prozesses.
- Die zwei fremden Engine-Änderungen im Hauptworkspace werden weder verändert
  noch übernommen.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Nur `behavior_regression` gilt als rote Verhaltens-Evidence.
- Bereits grüne historische Erwartungen werden dokumentiert, aber nicht durch
  künstlich verschärfte oder match-spezifische Erwartungen rot gemacht.
- Engine-, Runtime-, Fixture-, Warmup- oder Redaction-Drift wird zuerst als
  Infrastrukturproblem behandelt.
- Fehlende LegalActions, Hidden-Info-Bedarf oder nicht auflösbare
  Vertragskonflikte stoppen das betroffene Paket ohne KI-Workaround.
- Erwartungen werden nach dem Fix nicht abgeschwächt; Negativkontrollen
  schützen die zulässigen Gegenfälle.

## Paketfolge

### P0 – Preflight und Prozessvertrag

- Ziel: Worktree, Scope, Invarianten und `/Goal` sichern.
- Gate: sauberer Arbeits-Worktree und `git diff --check`.
- Commit: `docs(ai): plan f450 10311 remediation`

### P1 – Spielgleiche Red-Evidence

- Ziel: historische Zustände, öffentliche Event-Präfixe und Runtime-Memory für
  alle vier Fehlerverträge capturen; rote Erwartungen und grüne Gegenproben
  mit dem produktiven Chooser ausführen.
- Kernartefakte: Fixtures unter
  `data/scenarios/ai-decision-checkpoints/`, fokussierter Vitest unter
  `packages/ai/src/evaluation/decision-checkpoints/` und Evidence-Report unter
  `docs/reviews/ai/`.
- Gate: ausschließlich erwartete `behavior_regression`-Fehlschläge, grüne
  Gegenproben, Fixture-Validierung und `git diff --check`.
- Commit: `test(ai): capture f450 10311 regressions`

### P2 – Matchpoint- und Streetware-Entscheidungen

- Ziel: erreichbare Matchpoint-Zugriffe als Interrupt priorisieren und
  komfortable Streetware-Überladung durch Liquidität, Bedarf und Resthorizont
  begrenzen.
- Gate: unveränderte Checkpoint-Erwartungen und neue Negativkontrollen grün;
  angrenzende Bank-, Run- und Endgame-Tests grün.
- Commit: `fix(ai): prioritize matchpoint access over banking`

### P3 – Run-Phase und finanzierter Installationsplan

- Ziel: den auf `main` integrierten Movement/Encounter-Vertrag gegen die neuen
  Match-Checkpoints bestätigen oder generisch ergänzen und die unmittelbare
  Zielkontinuität eines finanzierten Handkartenplans sichern.
- Gate: Run-Plan- und Cybermodem-Ziele sowie Gegenproben grün; keine pauschale
  Run-Unterdrückung.
- Commit: `fix(ai): preserve funded runner development plans`

### P4 – Breite Verifikation

- Ziel: alle fokussierten und angrenzenden Tests, AI-Typecheck und vollständige
  AI-Suite ausführen.
- Gate: verpflichtende Checks sowie `git diff --check` grün; Abweichungen klar
  dokumentiert.
- Commit: `test(ai): close f450 10311 verification`

### P5 – Review, Wissen, Main-Integration und Cleanup

- Ziel: Final-Review und Wissenslog aktualisieren, aktuelles `main` integrieren,
  final verifizieren, per Fast-Forward nach `main` mergen und Worktree sowie
  Branch entfernen.
- Gate: lokales `main` enthält alle Pakete und ist geprüft; Arbeits-Worktree und
  Arbeitsbranch existieren nicht mehr.
- Commit: `docs(ai): close f450 10311 remediation`

## Controller-Regeln

Genau ein Paket ist aktiv. Kein Paket wird übersprungen. Nach jedem Paket
werden seine Checks ausgeführt, nur zugehörige Dateien gestaged und ein eigener
Commit erstellt. Vor dem finalen Merge wird aktuelles `main` in den
Arbeitsbranch integriert. Push oder Pull Request sind nicht Teil dieses
Prozesses.

## Verifikationsstand P4

Am 13. Juli 2026 wurden im Arbeits-Worktree ausgeführt:

```powershell
corepack pnpm --filter @netgrid/ai exec vitest run `
  src/evaluation/decision-checkpoints/f450-10311-decision-checkpoints.test.ts `
  src/runtime/runner-run-plan-revalidation.test.ts `
  src/runtime/runner-run-plan-policy.test.ts `
  src/runtime/runner-run-plan-path-quote.test.ts `
  src/runtime/semantic-choice-ranking.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai test
git diff --check
```

Ergebnis:

- alle vier historischen Zielentscheidungen und drei neuen
  Checkpoint-Gegenproben grün;
- fünf fokussierte Checkpoint-/Run-/Plan-Testdateien mit 86 Tests grün;
- drei P2-Unit-Testdateien mit 20 Tests grün;
- vollständige AI-Suite: 318 Testdateien, 2.102 Tests, vollständig grün;
- AI-Typecheck und Diff-Hygiene grün;
- der erste Volltest deckte drei zu breite Bank-Komfortfälle sowie eine zu
  konkrete ältere Deckout-Gegenprobe auf. Wiederverwendbare Auszahlungsbanken
  behalten nun ihr Mehrlade-/Auszahlungsziel; die Deckout-Gegenprobe prüft
  weiterhin strikt gegen vorzeitiges Zugende. Der vollständige
  Wiederholungslauf ist grün.
