Exit code: 0
Wall time: 0.3 seconds
Output:
# Selfplay-Analyse der Überraschungsdecks 2026-07-10

## Status

- Analyse abgeschlossen.
- Keine KI-, Hint-, Engine- oder Teständerung umgesetzt.
- Vier Änderungspunkte warten auf Nutzerfreigabe.

## Gegenstand

Analysiert wurden 20 deterministische KI-gegen-KI-Partien mit den persönlichen Benutzerdecks:

- Runner: `Mit Ansage: Der perfekte Coup`
- Korp: `Syds ICE-Pfandhaus`
- Format: `netgrid_private_local_classic_proteus_playtest_v1`
- Controller: Runner und Korp jeweils `current_candidate`
- Seeds: `surprise-decks-2026-07-10-01` bis `surprise-decks-2026-07-10-20`
- Aktionslimit: 480 je Partie

Der vollständige lokale Analysebestand liegt unter
`data/local/ai-selfplay-surprise-decks-20x480-2026-07-10.json`. Die Datei ist
lokale Benchmark-Evidence und bleibt gemäß Retention-Regel unversioniert.

## Gesamtbild

| Kennzahl | Ergebnis |
| --- | ---: |
| Partien | 20 |
| KI-Entscheidungen | 5.404 |
| Durchschnittliche Aktionen | 270,2 |
| Runner-Siege | 13 |
| Korp-Siege | 4 |
| Technische Abbrüche | 3 |
| Replay-Fehler | 0 |
| Fallback-Rate | 0 |
| Timeout-Rate | 0 |
| Korp-Agenda-Scores | 13 |
| Runner-Agenda-Steals | 52 |

Die 13 Runner-Siege teilen sich in neun Agendapunkt-Siege und vier Siege durch
leeres R&D. Die vier Korp-Siege bestehen aus einem Agendapunkt-Sieg und drei
Flatlines. Die drei technischen Abbrüche wurden vom Simulator als
`action_limit_reached` dargestellt, beruhten aber nicht auf dem 480er-Limit,
sondern jeweils auf derselben abgewiesenen Choice-Aktion.

## Belastbare Findings

### 1. Data Fort Reclamation wählt ein unbezahlbares optionales Rez-Paket

Betroffene Seeds und StateVersions:

- Seed `04`, StateVersion 258
- Seed `09`, StateVersion 306
- Seed `12`, StateVersion 187

In allen drei Partien scorete die Korp `Data Fort Reclamation`. Die erste
Choice zur Installation aus HQ wurde legal aufgelöst. In der folgenden
optionalen Rez-Choice wählte die KI jedoch pauschal alle angebotenen Karten:

- Seed `04`: `Puzzle`, `Colonel Failure`, `Syd Meyer Superstores` und
  `Dr. Dreff`; Rez-Gesamtkosten 19 bei 10 temporären und 4 regulären Credits.
- Seed `09`: `Chihuahua` und `Colonel Failure`; `Colonel Failure` blieb mit
  insgesamt 10 verfügbaren Credits unbezahlbar.
- Seed `12`: `Colonel Failure`; ebenfalls nur 10 verfügbare Credits.

`applyAction` verhielt sich korrekt und blockierte jeweils mit
`ERR_INVALID_TARGET` und der Meldung, dass die Korp die Rez-Kosten nicht
bezahlen kann. Der Fehler liegt in der KI-Choice-Auswahl: Die allgemeine
`select_cards`-Behandlung nimmt für die optionale Rez-Choice alle Optionen,
ohne die kumulierten sichtbaren Rez-Kosten gegen temporäres und reguläres
Budget zu prüfen.

Geplante generische Maßnahme:

- budgetierte Auswahl für optionale Mehrfach-Rez-Choices;
- nur eine vollständig bezahlbare Teilmenge auswählen, bei Bedarf keine Karte;
- sichtbare Rez-Kosten, temporäres Budget und reguläre Korp-Credits verwenden;
- Regressionen für bezahlbare Teilmenge, vollständig unbezahlbare Auswahl und
  gemischte Null-/Hochkostenkarten;
- `applyAction` bleibt unverändert der finale Guardrail.

### 2. Bekannt wertlose Archives-Runs werden über Zuggrenzen wiederholt

Der Selfplay-Detektor markierte 16 wiederholte Archives-Runs in sechs Seeds.
Die klarste Folge liegt in Seed `05` bei StateVersion 140 und 148:

- Die Runner-KI startete einen Archives-Run.
- Im anschließenden Endfenster erkannte die Runtime `known_non_agenda:12` und
  schloss einen weiteren Archives-Run korrekt aus.
- Zu Beginn des nächsten Runner-Zugs erhielt derselbe Archives-Run wieder den
  hohen Score 1.359 und wurde erneut gewählt.
- Ein legaler Draw lag mit Score 1.328 nahezu gleichauf und hätte sichtbaren
  Fortschritt erzeugt.

Dasselbe Muster ist in Seed `07` bei StateVersion 371 und 381 sichtbar. Die
No-Payoff-Einschätzung wirkt im laufenden Zug, bleibt aber nicht zuverlässig
über den Zugwechsel erhalten beziehungsweise wird bei der nächsten
Start-Run-Bewertung nicht wieder angewandt.

Geplante generische Maßnahme:

- side-sicheres Archives-Payoff-Wissen über Zuggrenzen erhalten;
- einen bekannten No-Agenda-/No-Trash-Zustand bis zu einem sichtbaren
  Archives-Änderungsereignis als Start-Run-Ausschluss oder starke Abwertung
  anwenden;
- Invalidierung testen, sobald neue Karten in Archives gelangen oder ein
  sonstiger sichtbarer Payoff entsteht;
- Regression mit zwei Runner-Zügen und unverändertem Archives-Zustand.

### 3. Niedrigwertige Broker-Duplikate überstimmen die eigene Defer-Evidence

Fünf Installationen in vier Seeds wurden vom vorhandenen Diagnostikmodell
selbst als `runnerLowValueDuplicateInstallAction` klassifiziert:

- `05:278`
- `08:334`
- `09:203`
- `09:284`
- `18:400`

Die sichtbaren Fakten nennen jeweils `onr_v1_154_broker`, keine neue
funktionale Coverage und keinen konkreten Funding-Bedarf. Vier der fünf Fälle
tragen zusätzlich `why_bank_install_deferred:no_plausible_followup_load`.
Besonders deutlich ist Seed `05`, StateVersion 278: Die gewählte Broker-Kopie
hatte einen Runtime-Rohscore von -1.096, während ein legaler Draw mit +78 nur
wegen des aktiven `runner.play_best_hand_card`-Plans ausgeschlossen wurde.

Geplante generische Maßnahme:

- vorhandene Defer-/Grenznutzen-Evidence für persistente Bank- und
  Economy-Duplikate in die produktive Auswahl durchreichen;
- negative Duplicate-Fits dürfen einen positiven Draw-, Coverage- oder
  Pressure-Kandidaten nicht allein durch Planbindung überstimmen;
- Gegenprobe für tatsächlich additive beziehungsweise ausdrücklich
  stackbare Economy-Kopien;
- fokussierte Regression für Plan-Mapping gegen negative Install-Fits.

### 4. Der Selfplay-Finding-Gate ist nicht stabil genug für automatische Triage

Der ursprüngliche Lauf meldete 20 kritische `hidden_info_marker`-Findings,
obwohl der Aggregate-Check `allRedactionSafe: true` meldete. Eine erneute
Detektion aus exakt den persistierten Summaries ergab 0
`hidden_info_marker`-Findings. Das deutet auf eine Mutation oder eine andere
Zwischenrepräsentation zwischen initialer Detektion und persistiertem Report
hin; die 20 kritischen Meldungen sind aus diesem Lauf nicht als Leak-Evidence
verwendbar.

Zusätzlich bestehen zwei große Fehlklassifikationscluster:

- 433 von 813 `recovery_low_value_loop`-Findings sind normale
  `continue_run`-Mikroschritte.
- 681 von 901 `plan_step_action_mismatch`-Findings sind ebenfalls normale
  `continue_run`-Mikroschritte.

Geplante generische Maßnahme:

- Findings auf einer unveränderlichen, final redigierten Trace-Repräsentation
  erzeugen;
- Idempotenztest: Erstdetektion und erneute Detektion aus dem gespeicherten
  Report müssen identische Safety-Findings liefern;
- verpflichtende Run-, Access- und Choice-Mikroschritte aus Recovery- und
  Plan-Mismatch-Detektoren ausschließen, sofern keine echte alternative
  Hauptentscheidung vorlag;
- bestehende Leak-Tests beibehalten und nicht abschwächen.

## Nicht freigabereif aus diesem Lauf

- Das Verhältnis 13:4 zugunsten des Runners ist kein isolierter KI-Fehlerbeleg.
  Das Korp-Deck enthält nur sechs Agendakarten mit insgesamt zwölf Punkten und
  muss vier davon scoren; vier Partien endeten durch leeres R&D.
- Drei lange Partien ohne Korp-Score enthielten laut Trace kein verpasstes
  legales Scorefenster. Ohne ein konkretes besseres LegalAction-Fenster folgt
  daraus keine eigene KI-Maßnahme.
- 273 allgemeine `repeated_no_progress_run`-Findings betreffen überwiegend
  Zentralserver-Runs. Der Detektor zählt normale Access-Fortschritte zu eng und
  ist ohne Einzelfallprüfung kein Beleg für 273 Fehlentscheidungen.
- Aus diesem Lauf folgt keine kartennamenspezifische Sonderregel für die
  Runner-Coup-Karten oder die Korp-Recyclingkarten.

## Sicherheitsgrenzen

- Beide KIs nutzten ausschließlich ihre PlayerView, PublicEvents,
  LegalActions und erlaubte Metadaten.
- Es gab keine Replay-Abweichung, keinen Timeout und keinen Runtime-Fallback.
- Spätere Spielereignisse wurden nicht als Wissen einer früheren Entscheidung
  verwendet.
- Keine Umsetzung darf Hidden-Info, FullState oder eigene LegalAction-Erzeugung
  in die KI einführen.

