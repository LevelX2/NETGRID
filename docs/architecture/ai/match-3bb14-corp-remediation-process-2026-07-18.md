# Match-3bb14-Corp-KI-Remediation (2026-07-18)

Status: P6 abgeschlossen

## Quelle und Gesamtziel

Quelle ist das zuletzt beendete Hard-Corp-KI-Spiel
`match_3bb14a8fd2102c9a` aus der lokalen Runtime-SQLite-Datenbank. Die
Entscheidungsabdeckung ist geschlossen: 42 erwartete und 42 vorhandene
Decision-Traces, ohne fehlende, verwaiste oder doppelte Entscheidungen.

Ziel ist, die freigegebenen Befunde an DI39/SV87 und DI40/SV88 zuerst als
spielgleiche Decision-Checkpoints zu sichern und danach drei generische Lücken
zu schließen:

1. Scored-only-Tag-Semantik darf Installieren oder Advancen einer noch nicht
   gescorten Agenda nicht als unmittelbar verfügbaren Tag-Payoff bewerten.
2. Öffentlich und erreichbar bei The Shell Traders bereitliegende
   Breaker-Coverage muss in die Corp-Bewertung einer Remote-Erreichbarkeit
   eingehen.
3. Advance-/Score-Horizont und Folgeaktionswert müssen die noch fehlenden
   Advancement-Counter und die verbleibenden Klicks korrekt berücksichtigen.

- Arbeitsbranch: `codex/ai-match-3bb14-remediation`
- Worktree: `C:\Projekte\NETGRID_AI_MATCH_3BB14_REMEDIATION`
- Ausgangs-`main`: `81f9e0e0d89fb8e7d534d7e8ecb3f161c3c0fca7`
- KI-Profil: Corp `hard`

## Explizites Nicht-Ziel

Punkt 4 der Analyse, der deckweite `compiled_effect_overlap`-Audit, wird in
einem anderen Thread bearbeitet. Dieser Prozess ändert weder die elf dort
gemeldeten Kartenprofile noch deren Consumer-Abdeckung und benutzt diesen
separaten Audit nicht als Gate für die hier freigegebenen Punkte 1 bis 3.

## Invarianten

- Rules Engine und `LegalActions` bleiben alleinige Regelautorität.
- Checkpoints erzeugen PlayerView und LegalActions erneut über die Engine.
- Es werden nur der Corp-PlayerView und das öffentliche Eventpräfix bis zur
  jeweiligen StateVersion verwendet.
- Öffentlich bereitliegende Karten dürfen berücksichtigt werden; verdeckte
  Runner-Hand-, Stack- oder Deckinformation bleibt ausgeschlossen.
- Produktiver Code erhält keine Match-, Seed-, Deck- oder Kartennamenlogik.
- Kartenprofile bleiben die semantische Quelle; Consumer müssen Timing, Zone,
  Action und Erreichbarkeit korrekt auswerten.
- Bereits grüne historische Erwartungen erzeugen keinen künstlichen Fix.

## Sicherheitsblocker und Fehlerbehandlung

- Nur `behavior_regression` gilt als roter Verhaltensnachweis.
- `engine_legality_drift`, `runtime_state_drift`, Fixture-, Redaction- oder
  Warmup-Fehler werden vor einer Verhaltensänderung als Infrastrukturproblem
  behandelt.
- Historische Erwartungen werden nach dem Fix nicht abgeschwächt.
- Fehlt für öffentlich erreichbare Coverage ein side-safe Signal im
  PlayerView, stoppt das Paket ohne FullState- oder Hidden-Zone-Workaround.
- Das nächste Paket beginnt erst, wenn das aktuelle Gate grün und committed ist.

## State Machine

`P0 Preflight -> P1 Checkpoints -> P2 scored-only Timing ->`
`P3 öffentliche Breaker-Coverage -> P4 Score-Horizont ->`
`P5 Verifikation/Dokumentation -> P6 Integration/Cleanup`

## Paketfolge

### P0 - Preflight und Prozessvertrag

- Scope, Nicht-Ziel, Worktree und Invarianten festhalten.
- Gate: sauberer Worktree, korrekter Branch, `git diff --check`.
- Commit: `docs(ai): plan match 3bb14 remediation`

### P1 - Spielgleiche Checkpoints und rote Evidence

- DI39/SV87 erfassen: Eine zweite ICE-Lage vor `remote_1` muss gegenüber der
  Installation der ungescorten Private Cybernet Police gewinnen; deren
  scored-only-Tag-Payoff darf nicht aktiv sein.
- DI40/SV88 erfassen: Das erste Advance einer Sieben-Counter-Agenda mit einem
  verbleibenden Klick ist kein Score-Fenster für den nächsten Zug; eine zweite
  ICE-Lage bleibt die sichere Alternative.
- Gegenproben sichern scored-only-Payoff nach tatsächlich gescorter Agenda,
  nicht erreichbare Remote-Coverage und eine real im Horizont scorebare Agenda.
- Gate: historische Zielpunkte liefern auf Ausgangscode ausschließlich
  `behavior_regression`; Gegenproben sind aussagekräftig und Fixture-Validierung
  ist grün.
- Commit: `test(ai): capture match 3bb14 corp regressions`

### P2 - Scored-only-Semantik an Action-Timing binden

- Persistente Tag-Engine-Aktivierung nur für Aktionen und Zonen bewerten, die
  den Profil-Timingvertrag tatsächlich erfüllen.
- Unit-Gegenproben für installierte, advanced und gescorte Quellen ergänzen.
- Gate: DI39 verliert die falsche Tag-Komponente; fokussierte Runtime-Tests und
  `git diff --check` grün.
- Commit: `fix(ai): respect scored-only tag source timing`

### P3 - Öffentlich erreichbare Breaker-Coverage

- Side-safe, öffentlich bereitliegende und legal erreichbar installierbare
  Breaker in der Remote-Erreichbarkeit berücksichtigen.
- Universelle sowie subtype-spezifische Coverage unterscheiden; keine bloß
  bekannte, aber aktuell unerreichbare Karte als installiert behandeln.
- Gate: DI39/DI40 erkennen den Shell-Traders-/Rent-I-Con-Pfad; negative
  Erreichbarkeits-Gegenprobe bleibt grün.
- Commit: `fix(ai): model public staged breaker coverage`

### P4 - Korrekter Advance- und Score-Horizont

- Score-Horizont aus benötigten Advancement-Countern, verfügbaren Klicks und
  legalen Beschleunigern ableiten, statt jedes `advance_card` pauschal als
  `next_turn` zu klassifizieren.
- Folgeaktionsbewertung darf gewöhnliches Advancen nicht als unmittelbare
  scored-only-Trace-Aktivierung behandeln und muss sichere Verteidigung gegen
  einen nicht rechtzeitig konvertierbaren Scoreplan abwägen.
- Gate: DI40 grün; scorebare und nicht scorebare synthetische Gegenproben grün.
- Commit: `fix(ai): project realistic corp scoring horizons`

### P5 - Verifikation, Evidence und Wissenspflege

- Fokussierte und angrenzende Checkpoint-/Runtime-/Scoreline-Tests ausführen.
- AI-Typecheck, vollständige AI-Suite soweit realistisch und `git diff --check`.
- Evidence, Final-Review und dauerhaften Consumer-Vertrag dokumentieren.
- Gate: verpflichtende Checks grün; ausgeschlossener Punkt 4 klar abgegrenzt.
- Commit: `docs(ai): close match 3bb14 remediation`

### P6 - Main-Integration und Cleanup

- Aktuelles `main` in den Arbeitsbranch integrieren und relevante Checks erneut
  ausführen.
- Per Fast-Forward lokal nach `main` mergen.
- Worktree und gemergten Arbeitsbranch verifiziert entfernen.
- Kein Push und kein Pull Request.

## Mindestverifikation

```powershell
corepack pnpm exec vitest run `
  packages/ai/src/evaluation/decision-checkpoints/match-3bb14-corp-remediation-decision-checkpoints.test.ts `
  packages/ai/src/runtime/corp-tag-source-payoff-context.test.ts `
  packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoring-window-projection.test.ts `
  --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Paketabschluss

- P0: `d78c3498b` (`docs(ai): plan match 3bb14 remediation`)
- P1: `04e8321c6` (`test(ai): capture match 3bb14 corp regressions`)
- P2: `885bb7191` (`fix(ai): respect scored-only tag source timing`)
- P3: `51eeb6db0` (`fix(ai): model public staged breaker coverage`)
- P4: `1942542e7` (`fix(ai): project realistic corp scoring horizons`)
- P4-Folgeprüfung: `542abcf6b`
  (`fix(ai): preserve safety after timing correction`)

Die spielgleichen Zielverträge und alle fokussierten Gegenproben sind grün.
Der vollständige Abschlusslauf am 19.07.2026 bestand 402/402 Testdateien und
2.846/2.846 Tests; der AI-Typecheck und `git diff --check` sind ebenfalls
grün. Evidence und Final-Review liegen unter `docs/reviews/ai/`. Punkt 4 der
ursprünglichen Spielanalyse bleibt weiterhin explizites Nicht-Ziel dieses
Prozesses.

Nach konfliktfreiem Abgleich mit dem aktuellen `main` bestanden erneut
117/117 relevante Tests und der AI-Typecheck. Der Arbeitsbranch wurde als
`028082b42` per Fast-Forward lokal nach `main` integriert; Worktree und
gemergter Arbeitsbranch wurden anschließend verifiziert entfernt. Es erfolgte
kein Push.

## /Goal

Arbeite P0 bis P6 ausschließlich im genannten Worktree sequenziell ab und
committe jedes abgeschlossene Paket. Nutze den Hauptworkspace nur für die
finale lokale Integration. Markiere das Ziel erst nach erfolgreicher
Main-Verifikation und verifiziertem Cleanup als abgeschlossen.
