# Match FD6320: Run-Prioritäts-Remediation – Final Review 2026-07-17

## Ergebnis

Die beiden freigegebenen Runner-KI-Fehler aus
`match_fd63201b6a7fa27a` sind behoben. Die Planbildung behält jetzt die
relative Qualität konkreter HQ-/R&D-Ziele, statt gleich klassifizierte Runs auf
eine grobe Empfehlung zu reduzieren. Am eigenen Matchpoint kann ein bereits
erreichbarer, günstiger Zentral-Run langsames Setup überstimmen, wenn der
sichtbare Access-Payoff noch plausibel ist.

Im historischen Zustand D11 / StateVersion 21 gewinnt damit der offen bessere
HQ-Run sowohl die Raw-Bewertung als auch das Plan-Mapping. In D69 /
StateVersion 120 konvertiert die KI bei 6 von 7 Agenda-Punkten den kostenlosen
HQ-Zugriff, obwohl Gain Credit weiterhin Raw-Score-Sieger bleiben darf. Die
engen Gegenproben belegen, dass frisches R&D, bekannte niedrige Payoffs,
teurere Pfade und Lagen unterhalb des Matchpoints nicht pauschal überschrieben
werden.

## Audit und Red Evidence

- Match: `match_fd63201b6a7fa27a`
- Modus: `human_corp_vs_runner_ai`, Runner-KI `hard`
- Finale StateVersion: 146
- Finaler StateHash: `fnv1a:784e6325`
- Geprüfte KI-Entscheidungen: 87/87
- Strict-Capture D11: 10 Warmup-Decisions, 22 öffentliche Events,
  Warmup-Drift 0
- Strict-Capture D69: 68 Warmup-Decisions, 121 öffentliche Events,
  Warmup-Drift 0

Vor dem Fix waren beide Zieltests ausschließlich als `behavior_regression`
rot; Engine-Legalität, Runtime-Zustand, Fixture und Redaction waren stabil. Die
Gegenproben waren bereits auf unverändertem Code grün. Die vollständige
Red-Evidence steht in
`docs/reviews/ai/match-fd6320-run-priority-red-evidence-2026-07-17.md`.

Die separat beobachteten Decisions 51 und 54 bleiben Nicht-Ziel: Ihre
historische Action ist im aktuellen Reproduktionszustand nicht mehr legal.
Dieser LegalAction-Reproduktionsdrift wurde nicht durch abgeschwächte
Erwartungen oder einen Fixture-Rebase kaschiert.

## Umgesetzte Verträge

### Relative Zentral-Run-Qualität

- HQ und R&D werden nur innerhalb derselben RunTarget-Empfehlungsklasse
  miteinander verglichen.
- Der Plan-Delta-Wert übernimmt die Abweichung vom serverweisen Mittel und ist
  auf ±240 begrenzt; bestehende Empfehlung, Payoff-, Gefahren- und
  Ökonomiekomponenten bleiben führende Grenzen.
- Mehrere legale Actions auf denselben Zentralserver werden über die beste
  Projektion dieses Servers zusammengefasst. Ein Basis- und ein Bypass-Run auf
  R&D zählen damit nicht als zwei unabhängige Zielstimmen.
- Es gibt keine feste HQ-Bevorzugung. In der Fresh-R&D-Gegenprobe bleibt R&D
  korrekt ausgewählt.

### Erreichbare Matchpoint-Konvertierung

Der neue terminale Bonus von 720 greift nur, wenn:

- dem Runner höchstens ein Agenda-Punkt zum Sieg fehlt;
- das Ziel HQ oder R&D ist;
- der sichtbare Access-Payoff `unknown`, `fresh`, `access_bonus` oder `agenda`
  lautet;
- die Empfehlung `run_now`, `run_if_free` oder `gain_credits_first` ist;
- der Pfad `reachable`, höchstens 1 Credit teuer und nach dem Run nicht
  überschuldet ist;
- mindestens ein Klick vorhanden ist.

Der bestehende 520-Punkte-Vertrag für innerhalb der verbleibenden Klicks
finanzierbare `blocked_unpayable`-Matchpoint-Runs bleibt unverändert. Bekannte
niedrige Payoffs, Pfadkosten ab 2, nicht erreichbare Ziele und Lagen unterhalb
des Matchpoints erhalten den neuen Bonus nicht.

Wenn ein reaktiver Portfolio-Interrupt aktuell auf keine LegalAction abbildbar
ist, wird ein suspendiertes Foreground nur dann wieder freigegeben, wenn dessen
ScoreBreakdown die terminale `runner_matchpoint_run_conversion` trägt. Das
Evidenzsignal
`plan_portfolio_unmappable_interrupt_released:<planType>` macht diesen Fall im
DecisionDebug sichtbar. Andere suspendierte Pläne bleiben unverändert.

## Vorher/Nachher

| Zustand | Vorher | Nachher |
| --- | --- | --- |
| D11, HQ Score 300 vs. R&D 180, beide `run_now` | Plan mappt R&D; R&D wird gewählt | Plan mappt HQ; HQ wird gewählt |
| D69, 6/7 Punkte, HQ kostenlos erreichbar | Draw wird gewählt | HQ-Run wird gewählt |
| frisches R&D gegenüber HQ | R&D | weiterhin R&D |
| identische Basis-/Bypass-Actions auf R&D | konnten R&D im Peer-Mittel doppelt zählen | eine beste Serverprojektion |
| unterhalb des Matchpoints | kein terminaler Zwang | weiterhin kein terminaler Zwang |
| unerfüllbarer Tag-Cleanup-Interrupt | suspendiert terminales Foreground | gibt nur terminalen Matchpoint-Run frei |

## Side-Safety und Architektur

Die Änderung konsumiert ausschließlich vorhandene `PlayerView`,
`LegalActions`, öffentliche Events, RunTarget-Evaluationen und erlaubten
Runtime-Planstatus. Es gibt keine Karten-ID-, Deck-ID- oder Match-ID-Sonderregel
und keine Auswertung verdeckter Informationen. Engine, LegalAction-Erzeugung,
Karteneffekte, Hints und Replay-Vertrag wurden nicht geändert.

Der vollständige Deck-Hint-/Consumer-Audit war grün. Das aktualisierte
Card-Function-Abstraction-Report enthält weiterhin exakt die 140 bekannten
Baseline-Treffer und keine neue Kartennamenkopplung.

## Verifikation

- FD6320 Strict-Checkpoints und Gegenproben: 4/4 grün.
- Fokussierte und angrenzende Plan-, Matchpoint-, Semantik- und historische
  Decision-Checkpoint-Tests: grün.
- AI-Typecheck: grün.
- `check:ai`: grün.
- Card-Function-Abstraction-Gate: grün, 140/140 Baseline-Treffer unverändert.
- AI-Shards: 349/355 Dateien und 2479/2488 Tests grün.

Die neun roten Shard-Tests wurden jeweils mit denselben betroffenen Dateien
und Erwartungen auf unverändertem `main` reproduziert. Sie sind keine
Regression dieses Slices:

- drei ECFE3CE-Broker-Planarbitrationen;
- ein Combined-Target-Broker-Checkpoint;
- ein komfortabler Broker-Cashout-Vertrag;
- zwei AI-Hint-Quality-Gates;
- DFE6-F01;
- MRGSG-R&D-Planfortsetzung.

## Grenzen und Nicht-Ziele

- Kein pauschaler Run-Zwang am Matchpoint.
- Keine Aufwertung bekannter leerer oder unproduktiver Zentralen.
- Keine Änderung an der allgemeinen Tag-Cleanup-Priorität; nur ein aktuell
  nicht ausführbarer Interrupt kann das eng markierte terminale Foreground
  nicht länger blockieren.
- Keine Behebung der neun bestehenden Broker-/Hint-/DFE6-/MRGSG-Baselines.
- Kein Push und keine Remote-Integration.

## Lokale Integration

Der Arbeitsbranch `codex/ai-match-fd6320-run-priority` ist nach vollständiger
Verifikation für die lokale Fast-Forward-Integration nach `main` freigegeben.
Der Abschlusszustand von Merge, Post-Merge-Prüfung und Worktree-Cleanup wird in
P6 des Prozessartefakts festgehalten.
