# Match 36BA22D6: Runner-Remediation Final Review

Datum: 2026-07-17

Match: `match_36ba22d6a89b2ac4`

Arbeitsbranch: `codex/ai-match-36ba22d6-remediation`

## Urteil

Der freigegebene Matchaudit ist umgesetzt, soweit der verbindliche
Decision-Checkpoint-Vertrag einen aktuellen Verhaltensfix erlaubt. D01 ist
als `behavior_regression` reproduziert und generisch korrigiert. Die späteren
Plan-, Bank-, Remote-, Trace- und Access-Funde bleiben wegen eines frühen
Strict-Warmup-Drifts beziehungsweise zusätzlicher Engine-Legalitätsdrift ohne
Produktionsänderung. Es gibt keine Match-, Seed-, Karten- oder
Instanzsonderregel.

## Vollständige Evidence

- 180 Events und 180 Snapshots;
- 98 gespeicherte Runner-KI-Entscheidungen;
- 98/98 verknüpfte Detailed-Traces;
- keine fehlenden, verwaisten, doppelten oder falsch zugeordneten Traces;
- 20/20 eindeutige Deckkarten und 45/45 Kopien im Hint-/Consumer-Audit;
- null blockierende Hint-Findings und null Warnungen.

Die vollständige zugweise Evidence steht in
`docs/reviews/ai/match-36ba22d6-runner-remediation-evidence-2026-07-17.md`.
Capture, roter Zieltest, grüne Gegenprobe und Driftklassifikation stehen in
`docs/reviews/ai/match-36ba22d6-runner-checkpoint-red-evidence-2026-07-17.md`.

## Reproduzierter und behobener Vertrag

Der spielgleiche D01-Checkpoint enthält State 0, das öffentliche Eventpräfix,
Hard-Profil, eigenen Decksnapshot und die historische Starthand. Vor dem Fix
wählte der produktive Chooser `mulligan`; der Runner meldete
`behavior_regression`. Die Gegenprobe tauscht nur Temple Microcode Outlet aus
der Hand gegen die dritte Kopie Panzer Run aus dem Stack und blieb bereits vor
dem Fix korrekt bei `mulligan`.

`evaluateRunnerOpeningHand` verwendet jetzt neben direkt gehaltenen Breakern
einen begrenzten `breakerAccessCount`. Eine Suchlinie zählt höchstens einmal
und nur dann, wenn:

- der Capability-Consumer den Sucher als `in_hand` und als Breaker-Suche mit
  mindestens mittlerer Konfidenz ausweist;
- die sichtbaren unmittelbaren Creditkosten bezahlbar sind;
- das eigene Deck eine mindestens mittelkonfidente Wall-, Code-Gate-, Sentry-
  oder Universal-Coverage im Stack kennt.

Alle bisherigen Scoregewichte und Schwellen bleiben bestehen. Der Fix ersetzt
nur direkte Breaker-Verfügbarkeit durch den engeren Begriff ausführbarer
Breaker-Zugriff.

## Bewusst nicht umgesetzte historische Funde

Der erste Strict-Capture nach D01 stoppt bereits im Warmup an D02:

```text
warmup_behavior_drift:decision=2:expected=runner.gain_credit:actual=runner.start_run.rd
```

Damit sind die historischen Runtime-Speicher für D40, D68, D81, D91 und D95
auf aktuellem Code nicht mehr spielgleich herstellbar. Ein `rebase` würde den
Drift verwerfen und wurde nicht verwendet. F5 wählt in der direkten
zustandslosen Prüfung bereits `bid_0`; F6 besitzt am aktuellen Engine-Stand am
historischen Snapshot keine LegalActions. Keiner dieser Fälle war deshalb als
neue `behavior_regression` freigegeben.

## Verifikation nach aktuellem Main-Abgleich

Der lokale `main` einschließlich Match 03575 wurde konfliktfrei über
Merge-Commit `a37835808` in den Arbeitsbranch eingebunden.

| Gate | Ergebnis |
| --- | --- |
| D01-Checkpoint plus Gegenprobe | 2/2 grün |
| Opening-, Capability-, Real-Engine- und Match-03575-Nachbarschaft | 38/38 grün |
| `@netgrid/ai` Typecheck | grün |
| `corepack pnpm check:ai:full` | grün |
| Deckhint-/Consumer-Audit | 20/20 Karten, 45/45 Kopien, 0 Findings, 0 Warnungen |
| `git diff --check` | grün |
| AI-Shard 1 | 115 Dateien und 764 Tests grün; 5 bekannte Altfehler |
| AI-Shard 2 | 115 Dateien und 858 Tests grün; 5 bekannte Altfehler |
| AI-Shard 3 | 115 Dateien und 810 Tests grün; 5 bekannte Altfehler |

Aggregiert sind 345 von 353 Dateien und 2.432 von 2.447 Tests grün. Die 15
roten Tests liegen in denselben acht Broker-, Plan- und Hint-Quality-Dateien,
die der aktuelle lokale `main` vor diesem Slice mit 15 Fehlern dokumentiert.
Der Unterschied zur Main-Baseline von 352 Dateien und 2.441 Tests besteht
exakt aus einer zusätzlichen grünen Checkpoint-Datei und sechs zusätzlichen
grünen Tests.

## Grenzen

- Keine Engine-, LegalAction-, PlayerAction-, Replay-, StateHash-,
  Randomness- oder Hidden-Info-Grenze wurde verändert.
- Hints, Kartendaten und Decklisten blieben unverändert.
- Die breite bekannte Main-Schuld ist nicht Teil dieses freigegebenen
  Opening-Hand-Slices.
- Die fünf späteren Findings bleiben als historisch plausible, aber aktuell
  nicht spielgleich reproduzierbare Diagnose dokumentiert.

## Lokale Integration und Cleanup

Der Arbeitsbranch wurde lokal per Fast-Forward bis `de109e990` nach `main`
integriert. Direkt auf `main` sind anschließend 38/38 betroffene und
angrenzende Tests, AI-Typecheck und `git diff --check` grün geblieben. Der
Git-Worktree-Eintrag, der absolute Pfad
`C:\Projekte\NETGRID_AI_MATCH_36BA22D6_REMEDIATION` und der Branch
`codex/ai-match-36ba22d6-remediation` sind verifiziert entfernt. `main` ist
sauber. Push und Pull Request wurden nicht ausgeführt.
