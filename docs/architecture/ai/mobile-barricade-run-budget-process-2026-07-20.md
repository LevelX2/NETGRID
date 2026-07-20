# Mobile-Barricade-Run-Budget-Prozess

## Status

Umsetzung und Verifikation im Worktree am 2026-07-20 abgeschlossen. Die lokale
Integration nach `main` folgt nach dem Abschlusscommit.

## Quelle und Gesamtziel

Ausgehend von Match `match_2023bc6567e45faa` werden zwei historische
Runner-Entscheidungsfehler spielgleich konserviert und generisch behoben:

1. Ein Remote-Contest darf gehostete oder anderweitig eingeschränkte Credits
   nur für den konkret berechtigten Breaker anrechnen. Unbekanntes ICE wird
   anhand der sichtbaren Rezfähigkeit der Corp bewertet; niedrige Corp-Credits
   dürfen weiterhin einen sinnvollen Probe- oder Contest-Run ermöglichen.
2. Wenn ein Run trotz eines Breaks sicher endet, muss die KI nichttödlichen
   Schaden samt legaler Prävention gegen die tatsächlichen Breakkosten
   abwägen, statt Schaden pauschal um jeden Preis zu brechen.

## Arbeitsumgebung

- Worktree: `C:\Projekte\NETGRID_AI_MOBILE_BARRICADE_RUN_BUDGET`
- Branch: `codex/ai-mobile-barricade-run-budget`
- Integrationsbranch: lokaler `main`
- Runtime-Evidence: read-only aus
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

## Annahmen und Nicht-Ziele

- Die Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Es werden keine verdeckten Corp-Kartenidentitäten für die Entscheidung
  benutzt; relevant sind nur öffentlich sichtbare Corp-Credits, Rezstatus,
  ICE-Anzahl und bekannte Kosten.
- Ein Run gegen unbekanntes ICE wird nicht pauschal verhindert.
- Mobile Barricade, Gatekeeper, Krash oder einzelne Decknamen erhalten keine
  kartennamenspezifische Sonderregel.
- Die fünf separaten Blocker des deckweiten Hint-/Consumer-Audits sind nicht
  Teil dieses Prozesses, sofern sie die beiden historischen Checkpoints nicht
  kausal beeinflussen.

## Controller-Invarianten und Sicherheitsblocker

- Historische Zielentscheidungen werden vor dem Fix im aktuellen Code als
  `behavior_regression` rot reproduziert.
- Gegenproben bleiben vor und nach dem Fix grün.
- Eingeschränkte Credits müssen dieselbe Berechtigungsgrenze in Quote,
  Planung und tatsächlicher Engine-Zahlung besitzen.
- Corp-Rezfähigkeit wird ausschließlich side-safe aus sichtbaren Credits und
  öffentlich sichtbaren ICE-Daten abgeleitet.
- Damage-Prävention wird nur aus aktuellen `LegalActions` und PlayerView-
  Daten berücksichtigt.
- Bei Hidden-Info-, LegalAction-, Replay- oder Engine-Korrektheitsregression
  stoppt der Prozess ohne KI-Workaround.

## State Machine und Paketfolge

1. **Paket A – Preflight und Prozessvertrag**
   - Worktree, Branch, fremde Änderungen und Scope prüfen.
   - Dieses Prozessartefakt anlegen.
   - Done-Gate: sauberer Arbeits-Worktree und `git diff --check`.
   - Commit: `docs(ai): define mobile barricade run budget process`
2. **Paket B – Historische rote Evidence**
   - Decision 72 vor dem unterfinanzierten Run capturen.
   - Früheste kausale Encounter-Decision 73 capturen.
   - Enge Gegenproben für niedrige Corp-Rezfähigkeit, korrekt gehostete
     Credits, tödlichen Schaden und legale günstige Prävention ergänzen.
   - Done-Gate: Zieltests `behavior_regression`, Gegenproben grün.
   - Commit: `test(ai): capture remote budget and damage tradeoff regressions`
3. **Paket C – Creditpool und Corp-Rezrisiko**
   - Hosted-only-Creditpools breaker-spezifisch projizieren.
   - Unknown-ICE-Risiko an sichtbare Corp-Rezfähigkeit koppeln.
   - Run-Plan-Mapping gegen die aktuelle Funding-/Release-Empfehlung
     revalidieren.
   - Done-Gate: Run-Budget-Zielcheck grün; Low-Credit-Kontrolle grün.
   - Commit: `fix(ai): gate remote contests by usable credits and rez risk`
4. **Paket D – Schaden, Prävention und Encounter-Utility**
   - Nichttödlichen Schaden gegen Breakkosten und sicheren Runverlust
     bewerten.
   - Legale Damage-Prävention als günstigere Folgeoption berücksichtigen.
   - Access-erhaltende und echte Survival-Breaks unverändert priorisieren.
   - Done-Gate: Encounter-Zielcheck und Präventions-/Lethal-Kontrollen grün.
   - Commit: `fix(ai): compare encounter damage against prevention and break cost`
5. **Paket E – Review, Gates und Wissenspflege**
   - Fokussierte Tests, angrenzende Checkpoints, AI-Typecheck und breite
     realistische AI-Tests ausführen.
   - Evidence-/Final-Review und Monatslog pflegen.
   - Done-Gate: relevante Checks grün und `git diff --check` sauber.
   - Commit: `docs(ai): close mobile barricade run budget remediation`
6. **Paket F – Lokale Integration und Cleanup**
   - Aktuelles `main` defensiv einbinden, final prüfen und lokal integrieren.
   - Arbeits-Worktree und gemergten Branch nur bei sauberem Stand entfernen.

## Automatische Fehlerbehandlung

- Capture-Drift ist Infrastrukturarbeit und kein bestätigter KI-Fehler.
- Ist ein historischer Checkpoint bereits grün, wird dafür kein Fix
  implementiert.
- Rote Tests werden ausschließlich im aktiven Paket und ohne Abschwächung der
  historischen Erwartung behoben.
- Fremde Replay-UI-Änderungen im Hauptworkspace werden weder gestaged noch
  verändert.

## Verifikationsregeln

Mindestens:

- unveränderte historische Decision-Checkpoints rot vor und grün nach Fix;
- Low-Corp-Credit-, Hosted-Credit-, Lethal-Damage- und Prevention-Kontrollen;
- fokussierte Vitest-Dateien;
- angrenzende Runner-RunPlan- und Creditbudget-Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- relevante AI-Testshards, soweit realistisch;
- `git diff --check` nach jedem Paket und nach dem Main-Merge.

## Abschlusskriterien

- Beide historischen Fehler sind auf aktuellem Code spielgleich reproduziert
  und mit unveränderten Erwartungen behoben.
- Low-Credit-Facechecks bleiben erlaubt, wenn sichtbare Corp-Rezfähigkeit das
  Risiko tatsächlich begrenzt.
- Damage-Prävention und echte Survival-Gefahr besitzen grüne Gegenproben.
- Evidence, Consumer-Kette, Grenzen und Checks sind dokumentiert.
- Arbeitsbranch ist lokal in `main` integriert; Worktree und Branch sind
  anschließend verifiziert entfernt.

## Ausführungsstand

- Paket A ist mit Commit `60f509e1e` abgeschlossen.
- Paket B ist mit Commit `f6fc53bd5` abgeschlossen. Die historischen
  Decisions 72, 73 und 76 wurden mit strengem, driftfreiem Suffix-Warmup ab
  Decision 70 konserviert. Vor dem Fix waren die drei Zielentscheidungen als
  `behavior_regression` rot; Low-Corp- und korrekt-gehostete Kontrollen waren
  grün.
- Paket C ist mit Commit `d07d4f3a7` abgeschlossen. PlayerView und AI-DTO
  transportieren die Engine-Berechtigung `requireHostedBreakerForIcebreakerUse`.
  RunBudget, Pfadquote, Pump- und Encounter-Zahlung führen hosted-only Credits
  breaker-spezifisch. Ein Score-Remote-Probe darf bei null oder einem
  sichtbaren Corp-Credit und finanzierter bekannter Route weiter starten. Bei
  hohem Corp-Creditstand, null/äußerst knapper Reserve oder bereits
  unbezahlbarer bekannter Route wird zuerst finanziert. Gewöhnliche
  Informationsprobes mit vorhandenem Restpolster bleiben erhalten.
- Paket D ist mit Commit `a72472d17` abgeschlossen. Nichtpermanenter Schaden
  wird nur dann als zwingender Safety-Break klassifiziert, wenn er den Runner
  flatlinen würde. Core-/Brain-Damage, Programmtrash und andere unmittelbare
  Gefahren bleiben unverändert geschützt. Endet der Run ohnehin, darf die KI
  nichttödlichen Net-/Meat-Damage akzeptieren; ein danach legales
  Prevention-Fenster wird weiterhin vom bestehenden Prevention-Chooser
  bedient.
- Paket E ist fachlich abgeschlossen. Die acht historischen und synthetischen
  Checkpoints, 125 fokussierte/angrenzende KI-Tests, Engine-View-Test und alle
  drei AI-Shards sind grün. Die Shards umfassen 423 Testdateien und 2.927
  Tests. Shared-, Engine- und AI-Typecheck sowie Format- und Diff-Gate sind
  grün.
- Der deckweite Audit bestätigt das Zielverhalten und 20/20 eindeutige Karten,
  bleibt aber wegen fünf vorbestehenden, nicht kausalen Hint-Consumer-Blockern
  rot: Disgruntled Ice Technician, Streetware Distributor, Cloak, Clown und
  Vewy Vewy Quiet. Diese Blocker wurden gemäß Scope nicht mit diesem Fix
  vermischt.
- Paket F steht bis zum Abschlusscommit, defensiven Main-Abgleich, lokalen
  Merge und verifizierten Cleanup aus.
