# AI Deck Doctrine Detailed Plan

Stand: 2026-05-15
Status: Planungsvorschlag, nicht umgesetzt

## Ziel

Dieser Plan beschreibt den nächsten sinnvollen KI-Ausbau nach der Corp-KI-Remote-Scoring-Härtung vom 2026-05-15. Ziel ist eine explizite Deck-Doktrin-Schicht: Die KI soll vor und während eines Spiels aus dem eigenen validierten Decksnapshot, den AI-Hints und der aktuellen sichtbaren Spielsituation ableiten, welche strategische Linie das Deck verfolgt.

Der Schnitt verbessert Strategieauswahl, Mulligan-/Starthandbewertung, Plan-Gewichtung und Selfplay-Auswertung. Er erweitert keine Regeln, keine Kartenfreigaben und keine Hidden-Info-Rechte.

Empfohlener Release-Name: `V1.9.23 AI Deck Doctrine and Matchstart Strategy`.

## Ausgangslage

Bereits vorhanden:

- planbasierte Corp-KI seit V1.4.0 mit `score_now`, `score_next_turn`, `build_scoring_remote`, `protect_hq`, `protect_rnd`, `recover_economy` und `bait_runner`.
- planbasierte Runner-KI seit V1.4.1 mit `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset` und `safe_probe_run`.
- Belief State und Gegner-Modell seit V1.4.2.
- Simulation, Selfplay und Exploit-Regression seit V1.4.3.
- AI-Hints für die decklegal freigegebenen Karten bis V1.9.22.
- Corp-KI-Remote-Scoring-Härtung vom 2026-05-15 gegen nackte Agenda-Installationen in neue Außenserver.

Noch nicht voll umgesetzt:

- keine aktuelle generische Deckanalyse für beliebige validierte KI-Decks.
- keine explizite eigene Deck-Doktrin, die Plan-Gewichte am Matchstart beeinflusst.
- keine Starthand-/Mulliganbewertung, die aus der Deck-Doktrin abgeleitet ist.
- keine mehrzügige Remote-Intent-Schicht, die `scoring`, `bait`, `asset`, `trash_tax` und `unknown` konsequent trennt.
- keine dedizierten Selfplay-Metriken für Deck-Doktrin-Fehler wie nackte Agenda-Installs, Agenda-Flood, zu spätes Scoring oder sinnlose Pressure-Loops.

## In Scope

1. Deck-Doktrin-Profil aus eigenem Decksnapshot berechnen.
2. Plan-Gewichte aus dieser Doktrin ableiten.
3. Corp- und Runner-Planbewertung doktrinbewusst machen.
4. Mulligan-/Starthandbewertung für KI-Seiten ergänzen.
5. Remote-Intent über mehrere Züge verbessern.
6. DecisionDebug um sichtbare, side-sichere Doktrin-Evidenz erweitern.
7. Selfplay-/Regression-Metriken für KI-Fehlerklassen ergänzen.

## Out of Scope

- keine neue Karten- oder Mechanikfreigabe.
- kein Zugriff auf gegnerische private Deckliste.
- keine Deckreihenfolge als KI-Wissen.
- kein FullState im KI-Decision-Pfad.
- kein LLM als Live-Regelakteur oder Action-Erzeuger.
- keine automatische Gewichtsanpassung ohne Review.
- kein öffentlicher Plattform-, Account-, Ranking- oder Matchmaking-Scope.

## Datenmodell

### `AiDeckDoctrineProfile`

Empfohlene Struktur:

```ts
type AiDeckDoctrineProfile = {
  schemaVersion: "ai-deck-doctrine-v1";
  deckSnapshotId: string;
  deckHash: string;
  side: "runner" | "corp";
  formatProfileId?: string;
  confidence: number;
  archetypeTags: string[];
  roleCounts: Record<string, number>;
  roleDensity: Record<string, number>;
  planWeights: Record<string, number>;
  mulliganWeights: Record<string, number>;
  riskFlags: string[];
  evidence: Array<{
    kind: "role_count" | "density" | "missing_role" | "curve" | "agenda_density" | "ice_mix" | "economy_mix";
    label: string;
    value: number | string;
  }>;
};
```

Wichtig:

- Das eigene Profil darf aus vollständigem eigenem Decksnapshot und AI-Hints entstehen.
- Gegnerische Profile dürfen nur aus öffentlicher Metadata, ausdrücklich freigegebenem Profil oder Beobachtung entstehen.
- `deckHash` darf nicht als heimlicher Lookup für private Gegnerprofile genutzt werden.
- `evidence` darf keine Deckreihenfolge und keine gegnerischen verdeckten Karten enthalten.

## Corp-Doktrinen

### Klassifikation

| Doktrin | Erkennungsmerkmale | Primärer Spielplan |
| --- | --- | --- |
| `rush` | hohe Agenda-Dichte, günstige ICE, frühe Economy, wenige teure Assets | schnell geschützte Scores erzwingen |
| `glacier` | viele/taxing ICE, starke Economy, wenige frühe Score-Zwänge | sicheren Remote aufbauen, später stabil scoren |
| `tag_pressure` | Tag-ICE, Trace, Tag-Punishment, Runner-Ressourcenbestrafung | Runner zu Tags zwingen und bestrafen |
| `asset_remote` | viele Assets/Nodes/Trash-Ziele, Economy-Assets, Bait-Wert | breite Remote-Bedrohungen aufbauen |
| `operation_economy` | hoher Operation-/Burst-Economy-Anteil | Tempo über Operationen sichern |
| `central_defense` | zentrale Schutzrollen, HQ/R&D-ICE, draw/agenda protection | zentrale Server schützen und Agenda-Flood abfedern |

### Analysegewichtung Corp-Deck

Die Deckanalyse sollte nicht nur zählen, sondern normalisierte Dichten verwenden. Startgewichtung:

| Signal | Gewicht |
| --- | ---: |
| Agenda-Paket und Agenda-Dichte | 20 |
| ICE-Dichte, ICE-Mix und Schutzqualität | 22 |
| Economy-Stabilität | 18 |
| Remote-Root-Paket: Assets, Upgrades, Nodes | 14 |
| Tag-/Trace-/Punishment-Paket | 10 |
| Central-Defense-Paket | 8 |
| Kurve, Rez-Kosten, Tempo-Risiko | 8 |

### Plan-Gewichtung Corp

Startmultiplikatoren auf bestehende Planfamilien:

| Doktrin | `score_now` | `score_next_turn` | `build_scoring_remote` | `protect_hq` | `protect_rnd` | `recover_economy` | `bait_runner` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `rush` | +18 | +22 | +10 | +4 | +4 | +6 | -4 |
| `glacier` | +4 | +12 | +24 | +10 | +10 | +12 | +2 |
| `tag_pressure` | +6 | +8 | +8 | +8 | +6 | +8 | +10 |
| `asset_remote` | -2 | +2 | +10 | +4 | +4 | +10 | +22 |
| `operation_economy` | +2 | +4 | +4 | +4 | +4 | +22 | +2 |
| `central_defense` | +0 | +4 | +4 | +18 | +18 | +8 | +0 |

Zusätzliche harte Leitplanken:

- Agenda in neuem nacktem Remote bleibt stark negativ.
- Agenda in bestehendem geschütztem Remote bleibt positiv.
- `rush` darf schneller scoren, aber nicht nackt und nicht ohne plausibles Score-Fenster.
- `asset_remote` darf neue nackte Remotes für Assets/Nodes nutzen, aber nicht diese Logik auf Agenden übertragen.
- `glacier` sollte nie eine einfache Agenda in einen ungeschützten Außenserver legen, solange Schutz oder ein geschützter Remote verfügbar ist.

## Runner-Doktrinen

### Klassifikation

| Doktrin | Erkennungsmerkmale | Primärer Spielplan |
| --- | --- | --- |
| `rig_builder` | Breaker-/Memory-/Hardware-Dichte, Setup-Karten | erst Rig stabilisieren |
| `rnd_pressure` | R&D-Pressure, Multiaccess, Run-Events, günstige Runs | früh und wiederholt R&D angreifen |
| `hq_pressure` | HQ-Pressure, Handattacken, HQ-Run-Events | HQ-Flood bestrafen |
| `remote_contest` | starke Economy, flexible Breaker, Run-Tempo | Corp-Remotes aktiv contesten |
| `tag_resilient` | Tag-Clear, Link, Tag-Resistenz, Ressourcenrobustheit | Tag-Pressure weniger stark fürchten |
| `economy_dense` | viele Economy-Quellen, Draw/Tutor | Tempo über Geld und Kartenzugriff |

### Analysegewichtung Runner-Deck

| Signal | Gewicht |
| --- | ---: |
| Breaker-/Rig-Abdeckung | 24 |
| Economy-Stabilität | 18 |
| Draw-/Tutor-/Setup-Dichte | 14 |
| Run-Pressure auf R&D/HQ/Remote | 18 |
| Tag-/Damage-/Risk-Resilienz | 10 |
| Memory-/Hosting-/Programmslots | 8 |
| Kurve, Tempo und tote Starthandrisiken | 8 |

### Plan-Gewichtung Runner

| Doktrin | `pressure_rnd` | `pressure_hq` | `contest_remote` | `build_rig` | `recover_economy` | `draw_for_answers` | `trash_asset` | `safe_probe_run` |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `rig_builder` | -4 | -4 | -2 | +24 | +10 | +14 | +0 | +8 |
| `rnd_pressure` | +24 | +4 | +4 | +6 | +6 | +8 | +0 | +8 |
| `hq_pressure` | +4 | +24 | +4 | +6 | +6 | +8 | +0 | +8 |
| `remote_contest` | +4 | +4 | +24 | +8 | +10 | +4 | +8 | +4 |
| `tag_resilient` | +6 | +6 | +8 | +8 | +8 | +6 | +4 | +4 |
| `economy_dense` | +4 | +4 | +6 | +8 | +22 | +10 | +4 | +4 |

Leitplanken:

- Runner darf unbekannte ICE weiter nur als Risiko modellieren, nicht als bekannte Kartentitel.
- `rig_builder` darf nicht endlos Setup spielen, wenn die Corp klar scoren kann.
- `rnd_pressure` muss R&D-Freshness und bereits gesehene Karten berücksichtigen.
- `remote_contest` muss das Corp-Scoringfenster gegen Run-Kosten abwägen.

## Mulligan- und Starthandbewertung

### Corp-Starthandscore

Skala 0 bis 100. Erste Defaultgewichtung:

| Merkmal | Gewicht | Gute Evidenz | Warnsignal |
| --- | ---: | --- | --- |
| ICE-Startschutz | 25 | mindestens 2 ICE oder 1 ICE plus Draw/Economy | 0 ICE |
| Economy | 20 | spielbare Economy in den ersten zwei Zügen | teure Hand ohne Einnahme |
| Agenda-Last | 20 | 0 bis 1 Agenda gut, 2 abhängig von Schutz | 3+ Agenden |
| Remote-Plan | 15 | schützbarer Remote oder geschützter Central-Plan | Agenda ohne Schutzpfad |
| Operation-/Tempo-Plan | 10 | frühe Operationen/Draw sinnvoll | Hand blockiert sich selbst |
| Doktrin-Passung | 10 | Hand unterstützt eigene Doktrin | Rush-Hand im Glacier-Deck usw. |

Empfehlung:

- Keep ab 60.
- Mulligan unter 45.
- Zwischen 45 und 59 abhängig von Difficulty und Doktrin.
- Hard darf knapper behalten, wenn die Hand einen klaren Doktrinpfad hat.
- Easy darf defensiver mulliganen.

### Runner-Starthandscore

| Merkmal | Gewicht | Gute Evidenz | Warnsignal |
| --- | ---: | --- | --- |
| Economy | 20 | spielbare frühe Economy | kein Geldpfad |
| Setup/Rig | 25 | Breaker, Memory, Tutor oder stabiler Aufbau | nur teure Programme |
| Draw/Tutor | 15 | Zugriff auf mehr Karten | tote Hand ohne Suche |
| Früher Druck | 15 | sinnvoller früher Run oder Probe-Run | gar kein Druck |
| Risikoantworten | 10 | Tag-/Damage-/Trace-Antworten je Matchup | anfällig gegen bekannte öffentliche Rolle |
| Doktrin-Passung | 15 | Hand stützt eigene Doktrin | Pressure-Deck ohne Pressure oder Setup |

Empfehlung:

- Keep ab 62.
- Mulligan unter 45.
- Zwischenbereich über Doktrin: `rig_builder` bevorzugt Setup, `rnd_pressure` bevorzugt frühe Runs plus Economy.

## Remote-Intent-Schicht

Die Corp-KI sollte pro Remote einen sicht- und side-sicheren Intent führen:

| Intent | Zweck | Typische Aktionen |
| --- | --- | --- |
| `scoring` | Agenda sicher scoren | ICE installieren, Agenda installieren, advancen, score |
| `bait` | Runner zu ineffizientem Run verleiten | Asset/Upgrade/ambushartige Root-Karte installieren |
| `asset` | Asset-Ökonomie oder Boardvalue | Asset installieren, rezzen, schützen |
| `trash_tax` | Runner-Credits belasten | trashbare Bedrohung mit Schutz aufbauen |
| `unknown` | noch nicht klassifiziert | konservative Defaults |

Regeln:

- Intent darf eigene verdeckte Karten berücksichtigen, weil die Corp ihr eigenes Board kennt.
- Runner-DecisionDebug darf unrezzed Corp-Kartentitel oder Corp-Intent nicht sehen.
- Remote-Intent muss bei Trash, Score, Access, Undo und Reconnect deterministisch invalidieren.

## Umsetzungsslices

### Slice A: Requirements und Dateninventar

Ergebnis:

- `AI_DECK_DOCTRINE_REQUIREMENTS.md`
- `AI_DECK_DOCTRINE_TEST_MATRIX.md`
- Inventar der vorhandenen AI-Hints und Decksnapshots.
- Liste fehlender oder unklarer Rollen.

Akzeptanz:

- Kein Code erforderlich.
- Alle genutzten Datenquellen und No-Scope-Grenzen sind dokumentiert.

### Slice B: Doctrine-Profilgenerator

Ergebnis:

- Generator aus Decksnapshot plus AI-Hints.
- JSON-Artefakt für berechnete Profile.
- Schema- und Determinismustests.

Primäre Dateien:

- `packages/ai/src/*`
- `data/ai/*`
- `packages/decks/src/index.ts`

Akzeptanz:

- Gleiches Deck erzeugt deterministisch gleiches Profil.
- Nicht `ai_supported` Karten lösen Warnung oder Ablehnung aus.
- Keine Deckreihenfolge im Profil.

### Slice C: KI-Input und DecisionDebug

Ergebnis:

- Eigene Doktrin im AI-Input.
- Gegnerische Doktrin nur als öffentliche oder beobachtete Projektion.
- DecisionDebug mit `doctrineProfileId`, `archetypeTags`, `confidence` und sichtbarer Evidenz.

Akzeptanz:

- Hidden-State-Invariance bleibt grün.
- Runner sieht keine Corp-HQ-/R&D-/unrezzed-Titel.
- Corp sieht keine Runner-Stack-/Grip-Privatdaten.

### Slice D: Corp-Planintegration

Ergebnis:

- Corp-Planbewertung nutzt Doktrinmultiplikatoren.
- Remote-Intent-Schicht.
- Agenda-Schutzregeln bleiben stärker als Rush-Bonus.

Neue Regressionen:

- Rush-Corp scoret früh, aber nicht nackt.
- Glacier-Corp baut zuerst geschützten Remote.
- Asset-Corp installiert Assets in neue Remotes, aber Agenden nicht wie Assets.
- Tag-Corp priorisiert Tag-Lines nur bei legaler sichtbarer Gelegenheit.

### Slice E: Runner-Planintegration

Ergebnis:

- Runner-Planbewertung nutzt Doktrinmultiplikatoren.
- `rnd_pressure`, `hq_pressure`, `rig_builder` und `remote_contest` werden unterscheidbar.
- R&D-Freshness wird gegen Wiederholungsruns genutzt.

Neue Regressionen:

- R&D-Pressure wiederholt Runs nicht blind auf bekannte/leere Information.
- Rig-Builder baut nicht endlos, wenn Corp kurz vor Score steht.
- Remote-Contest greift schützbare Scoring-Remotes rechtzeitig an.

### Slice F: Mulligan und Opening Policy

Ergebnis:

- KI kann Setup-Mulligan-Choices nach Starthandscore treffen.
- Reason-Code für Keep/Mulligan.
- Difficulty beeinflusst Schwellen, aber nicht Wissen.

Akzeptanz:

- Gleiche Starthand und gleicher Seed erzeugen gleiche Entscheidung.
- Corp mulligant 3+ Agenda/0 ICE-Hände zuverlässig.
- Runner mulligant Hände ohne Economy und Setup-Pfad zuverlässig.

### Slice G: Selfplay- und Fehlerklassenmetriken

Ergebnis:

- Metriken für konkrete KI-Fehler:
  - nackte Agenda-Installation,
  - agenda flood exposure,
  - score window missed,
  - remote overbuild,
  - economy stall,
  - repeated low-value central run,
  - rig stall,
  - asset trash neglect.
- Holdout-Seeds für mindestens drei Corp- und drei Runner-Doktrinen.

Akzeptanz:

- Reports zeigen Verbesserung gegenüber eingefrorener Baseline.
- Keine erhöhte IllegalAction-, Timeout- oder Fallbackquote.
- StateHash und Replay bleiben stabil.

## Priorisierung

Empfohlene Reihenfolge:

1. Slice A, weil ohne saubere Requirements die Gewichtungen zu schnell zufällig werden.
2. Slice B, weil alle weiteren Schritte davon abhängen.
3. Slice C, weil Debug und Hidden-Info-Gates früh stehen müssen.
4. Slice D, weil der aktuelle beobachtete Schmerzpunkt Corp/Cooperation betrifft.
5. Slice F für Corp-Mulligan als kleiner, gut testbarer Zusatz.
6. Slice E für Runner-Doktrinen.
7. Slice G für Tuning und Messung.

Minimaler MVP dieses KI-Releases:

- Slice A bis D plus Corp-Teil von Slice F.

Voller Release:

- Slice A bis G.

## Risiken und Gegenmaßnahmen

| Risiko | Folge | Gegenmaßnahme |
| --- | --- | --- |
| Rollenprofil wird zu grob | KI spielt weiter generisch | Confidence-Wert, Missing-Role-Warnungen und Testfixtures pro Doktrin |
| Gewichtungen übersteuern Boardlage | KI verfolgt Doktrin trotz akuter Gefahr | Board-State- und LegalAction-Scorer bleiben stärker als reine Doktrinboni |
| Rush-Bonus erzeugt wieder nackte Agenda | Regression des aktuellen Fixes | Agenda-Schutz-Leitplanke als harte Penalty vor Doktrinbonus |
| Gegnerdeck wird indirekt geleakt | Hidden-Info-Bruch | Gegnerprofile nur öffentlich/observed; Hidden-State-Invariance-Test |
| Selfplay optimiert auf falsche Seeds | Überanpassung | Holdout-Seeds und Reviewpflicht für Gewichtungsänderungen |
| DecisionDebug verrät eigene private Strategie zu stark im falschen View | Informationsleck | Debug-Ausgabe side-filtern; private Doktrin nur lokal/eigene Seite |

## Handoff an `release-implementation-agent`

Empfohlener erster Implementierungsschnitt:

1. `AI_DECK_DOCTRINE_REQUIREMENTS.md` und Testmatrix anlegen.
2. `AiDeckDoctrineProfile`-Typen und Generator im AI-Paket ergänzen.
3. Profile nur für eigene Decksnapshots berechnen.
4. Corp-Planbewertung mit Doktrinprofil speisen.
5. Remote-Scoring-Regressionen aus `AI_CORP_REMOTE_SCORING_HARDENING_2026_05_15.md` behalten und um Doktrinfälle erweitern.
6. Danach Corp-Mulligan-Fixtures ergänzen.

Pflichtchecks:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm lint`

## Empfehlung

Der nächste praktische Schritt sollte nicht sofort eine große automatische KI-Tuningmaschine sein. Besser ist ein enger, erklärbarer Deck-Doktrin-MVP für die Corp:

1. eigenes Corp-Deck profilieren,
2. `rush`, `glacier`, `tag_pressure`, `asset_remote`, `operation_economy` und `central_defense` unterscheiden,
3. Corp-Plan-Gewichte daran koppeln,
4. Agenda-Schutzregeln als harte Leitplanke behalten,
5. Corp-Mulligan für Agenda-/ICE-/Economy-Starthände ergänzen.

Damit wird genau die beobachtete Schwäche adressiert: Die Korp handelt nicht mehr nur nach lokaler Aktion, sondern nach Deckplan plus Boardlage.
