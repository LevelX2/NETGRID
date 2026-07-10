# Universelles Fast-Advance-Corp-Deck: 20-Spiel-Evidence

Status: `analysis_complete_awaiting_approval`

Datum: 2026-07-10

## Auftrag und Auslegung

„Cooperation Deck“ wird als Corporation-/Corp-Deck verstanden. „Universell“
bedeutet hier: ein kombiniertes Originalset-/Classic-/Proteus-Deck, das gegen
mehrere deutlich verschiedene Runner-Archetypen bestehen soll. Die Analyse
nutzt ausschließlich die aktuelle Semantic Runtime, LegalActions und
side-sichere Simulations-/Decision-Traces.

## Deckkandidat

Name: `Universal Fast Advance`

- 45 Karten
- 17 Agendapunkte
- 7 Agenden, alle mit Schwierigkeit 3
- Format:
  `netgrid_private_local_classic_proteus_playtest_v1`
- Deckvalidierung: grün
- AI-Support aller enthaltenen Karten: grün

### Agenden – 7 Karten / 17 Punkte

- 3x Corporate War
- 3x Corporate Downsizing
- 1x Superserum

### Ökonomie und Kartenzug – 11 Karten

- 3x Accounts Receivable
- 2x Annual Reviews
- 3x Day Shift
- 3x Efficiency Experts

### Fast-Advance-Paket – 15 Karten

- 3x Management Shake-Up
- 3x Overtime Incentives
- 3x Systematic Layoffs
- 3x Chicago Branch
- 3x Vapor Ops

### ICE – 12 Karten

- 3x Misleading Access Menus
- 3x Snowbank
- 3x Data Wall
- 3x Wall of Static

## Methodik

- 4 Runner-Decks mit je 5 gepaarten Seeds
- 20 Spiele insgesamt
- maximal 240 Aktionen pro Spiel
- Runner und Corp jeweils `current_candidate`
- vollständige Replay-, Redaction-, LegalAction- und Decision-Trace-Prüfung
- große Rohdaten bleiben lokal unter
  `data/local/universal-fast-advance-final-20games-2026-07-10.json`
- kompakte lokale Rohzusammenfassung:
  `data/local/universal-fast-advance-final-20games-2026-07-10.md`

Runner-Archetypen:

1. Blink Pressure Rig – Originalset Tempo-Rig und Event-Druck
2. Classic Runner – Prep Economy Pressure
3. Proteus Runner – HQ Virus & Derez
4. Proteus Runner – R&D Virus & Bad Publicity

## Ergebnis

| Runner                            | Corp-Siege | Runner-Siege | Action-Limit/ungültig | Corp-AP Ø | Runner-AP Ø | erster Corp-Scorezug Ø |
| --------------------------------- | ---------: | -----------: | --------------------: | --------: | ----------: | ---------------------: |
| Blink Pressure Rig                |          2 |            2 |                     1 |       5,6 |         4,6 |                    6,2 |
| Classic Prep Economy Pressure     |          1 |            2 |                     2 |       3,6 |         5,8 |                   11,8 |
| Proteus HQ Virus & Derez          |          1 |            2 |                     2 |       3,2 |         5,2 |                    9,5 |
| Proteus R&D Virus & Bad Publicity |          3 |            2 |                     0 |       4,6 |         3,8 |                   11,0 |
| **Gesamt**                        |      **7** |        **8** |                 **5** |  **4,25** |    **4,85** |               **9,47** |

Von den fünf nicht regulär abgeschlossenen Spielen waren vier echte
240-Aktions-Limits. Ein weiteres Spiel endete bei StateVersion 199 in einem
nicht terminalen Runner-`costPenaltyWindow` ohne LegalAction. Damit umfasst
die sicher auswertbare Stichprobe 19 Spiele: 7 Corp-Siege, 8 Runner-Siege und
4 Action-Limits. Unter den 15 regulär entschiedenen Spielen liegt die Corp bei
7:8 beziehungsweise 46,7 %.

Weitere Kennzahlen:

- 17/20 Spiele mit mindestens einem Corp-Score
- 35 Corp-Scores gegenüber 39 Runner-Steals
- 0 verpasste konkrete Scorefenster
- 0 unsicher gewählte Scores
- 0 passive Corp-Aktionen bei vorhandener konkreter Scorelinie
- 0 Replayfehler
- 0 Redactionfehler
- 0 Fallbackrate

Die fünf Spiele je Matchup reichen für Richtungs-Evidence, nicht für eine
statistisch belastbare Matchup-Rangfolge. Die auffällig gute 3:2-Serie gegen
Proteus R&D und die schwächeren 1:2-Serien gegen Classic/HQ sind daher nur
Arbeitsbeobachtungen.

## Fast-Advance-Wirkung

Die Corp-Strategie wurde in den Traces korrekt als `corp.fast_advance` und
`corp.remote_scoring` erkannt. Die tatsächliche Ausführung war jedoch weit
überwiegend klassisches Advance-Advance-Score über einen bereits liegenden
Remote:

- nur 2 von 35 Scores erfolgten im selben Zug wie die Agendainstallation;
- die Corp wählte in allen 20 Spielen keine einzige
  `activated_card_ability`;
- damit wurden weder Chicago Branch noch der Counter-Transfer von Vapor Ops
  als aktive Fast-Advance-Linie genutzt;
- zehn +2-Advancement-Choices wurden ausgeführt, aber nur drei zielten auf
  eine Agenda und sieben auf Assets;
- für die sieben Asset-Ziele ist kein späterer Corp-Ability-Transfer im Trace
  vorhanden.

Positiv ist die Abschlussdisziplin: Sobald `score_agenda` konkret legal war,
nahm die Corp die Scorelinie zuverlässig. Das Defizit liegt vor allem beim
Erzeugen und Konvertieren beschleunigter Scorelinien, nicht beim abschließenden
Score selbst.

## Testqualitätsbefunde

257 automatische Findings verteilen sich auf 255 Runner- und 2 Corp-Findings.
Die wichtigsten Runner-Gruppen sind:

- 126 Plan-/Aktions-Mismatches;
- 105 wiederholte Runs ohne sichtbaren Fortschritt;
- 31 Recovery-Loops ohne sichtbaren Fortschritt;
- 14 Bank-/Debt-Economy-Aktionen ohne konkreten Funding-Bedarf.

Die vier regulären Action-Limits sind überwiegend als Low-Value-Repeat- oder
Setup-/Economy-Loop klassifiziert. Die Ergebnisse messen daher nicht nur das
Corp-Deck, sondern auch weiterhin begrenzte Runner-Play-Strength.

Zwei lange Spiele endeten ohne Corp-Score. Der Detector markiert dies korrekt
als hoch auffällig. Am jeweils dokumentierten End-Turn war allerdings nur
`end_turn` legal; aus diesen Endpunkten allein lässt sich keine konkrete
verpasste bessere Corp-Aktion belegen.

## Verworfenes Diagnose-Deck und Roadblock-Lücke

Ein erster 20-Spiel-Lauf enthielt 3x Roadblock. Sechs Partien gerieten nach
Roadblock-Rez beziehungsweise beim erneuten Encounter in
`run.encounter_ice`/`movement` in einen nicht terminalen Zustand ohne
LegalAction. Roadblock war im Diagnose-Deck das einzige ICE mit Rez-Kosten 2;
die reproduzierten Rez-Traces und Folgezustände grenzen die Ursache darauf
ein. Dieser Lauf wird nicht als Deckleistungsserie gewertet.

Für die finale Serie wurden 3x Roadblock entfernt, Data Wall von zwei auf drei
Kopien erhöht, 3x Wall of Static ergänzt und Annual Reviews von drei auf zwei
Kopien reduziert. Dadurch stieg die reguläre Auswertbarkeit deutlich. Die
Roadblock-Lücke bleibt ein separates Engine-/LegalAction-Finding.

## Freigabereife Punkte

### Punkt 1: Fast-Advance-Enabler werden nicht in Scorelinien konvertiert

- Beschreibung Spielfehler: Nur 2/35 Corp-Scores waren Same-Turn-Scores. Die
  Corp aktivierte Chicago Branch/Vapor Ops in 20 Spielen kein einziges Mal.
  Sieben von zehn +2-Counter-Choices landeten auf Assets, ohne dass danach ein
  Counter-Transfer folgte. Sichtbar bessere Linie ist die Bevorzugung eines
  Agenda-Ziels oder eines unmittelbar anschließenden, legalen Transfers, wenn
  dadurch ein Score in diesem oder dem nächsten sicheren Fenster entsteht.
- Dafür geplante Anpassungsmaßnahme: Generische Fast-Advance-Projektion für
  LegalActions ergänzen: Advancement-Counter nach konkreter
  `advances_remaining`-/Score-Konversion bewerten, Agenda-Ziele vor
  nicht konvertierbaren Asset-Zielen priorisieren, Chicago-/Transfer-Fähigkeiten
  in eine zusammenhängende Scorelinie aufnehmen und Gegenproben ohne
  erreichbares Scorefenster ergänzen. Keine Karten-ID-Sonderregel.

### Punkt 2: Roadblock erzeugt einen nicht terminalen Zustand ohne LegalAction

- Beschreibung Spielfehler: Sechs Diagnosepartien endeten nach Roadblock-Rez
  oder Roadblock-Encounter in `run.encounter_ice`/`movement` ohne legale Aktion
  für eine Seite. Die Partie war nicht terminal und konnte nicht fortgesetzt
  werden.
- Dafür geplante Anpassungsmaßnahme: Engine-/LegalAction-Vertrag für
  Roadblocks Zufalls-Encounter und die End-the-run-/Pass-Folge korrigieren;
  deterministische Regressionen für Rez, Würfelergebnis 6, andere Ergebnisse,
  bezahlbaren/unbezahlbaren Break und Replay/StateHash ergänzen.

### Punkt 3: Runner-Cost-Penalty-Fenster kann ohne LegalAction hängen bleiben

- Beschreibung Spielfehler: Proteus HQ Virus & Derez, Seed
  `universal-fast-advance-05`, StateVersion 199: Nach einer legal gewählten
  Runner-Kartenfähigkeit blieb ein aktives `costPenaltyWindow` in
  `runner_action.main`, aber weder Runner noch Corp erhielten eine LegalAction.
- Dafür geplante Anpassungsmaßnahme: Producer und Abschlussbedingung des
  Cost-Penalty-Fensters im Engine-Pfad prüfen, immer eine legale Auflösung oder
  ein deterministisches automatisches Schließen erzeugen und den konkreten
  Replayzustand als Regression absichern.

### Punkt 4: Runner wiederholt stale Zentralruns und Recovery-Aktionen

- Beschreibung Spielfehler: 105 Findings für wiederholte Runs ohne Fortschritt,
  31 Recovery-Loops und 126 Plan-/Aktions-Mismatches; vier valide Spiele liefen
  deshalb bis zum 240-Aktions-Limit. Sichtbar bessere Alternativen waren je
  nach Zustand Economy, Setup, Remote-Contest oder End Turn statt eines erneut
  wertlosen Zentralruns.
- Dafür geplante Anpassungsmaßnahme: Stale-Central-Memory und
  Plan-/Aktions-Kompatibilität generisch verschärfen, Low-Value-Repeats nach
  unverändertem Access-Fingerprint abwerten, Recovery nur bei belegtem
  Funding-/Coverage-Bedarf zulassen und Matchup-übergreifende
  Selfplay-Regressionen ergänzen.

## Nicht freigabereif aus dieser Stichprobe

- Die drei Spiele ohne Corp-Score belegen nicht allein einen konkreten
  Corp-Entscheidungsfehler; Agenda-Draw, vorherige Steals und legale
  Alternativen müssen dafür gezielt rekonstruiert werden.
- Eine endgültige Deckänderung weg von Chicago Branch/Vapor Ops wäre verfrüht:
  Die Karten könnten nach Punkt 1 korrekt stark sein. Ohne KI-Anpassung wären
  zusätzliche Kartenzieh-/Economy-/direkte Advancement-Operationen allerdings
  konsistenter als sechs derzeit ungenutzte Ability-Karten.
- Die Matchup-Rangfolge aus jeweils fünf Spielen ist nicht stabil genug für
  eine Pool- oder Balanceentscheidung.

## Gate

Keine Code-, Hint-, Ontologie-, Engine- oder Teständerung wurde vorgenommen.
Die vier freigabereifen Punkte dürfen erst nach Nutzerfreigabe in einem
eigenen Worktree paketiert und umgesetzt werden.
