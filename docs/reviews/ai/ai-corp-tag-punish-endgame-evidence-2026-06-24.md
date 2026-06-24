# AI Corp Tag-Punish Endgame Evidence 2026-06-24

## Status

Review-Evidence für den Prozess `AI Corp Tag-Punish Endgame`.

## Datenbasis

- Lokale Runtime-DB: `data/runtime/multiplayer/netgrid.sqlite`
- Match: `match_d3b4e1a8e415d15a`
- Modus: `human_runner_vs_corp_ai`
- Abschluss: Runner-Sieg durch Agenda-Punkte bei `stateVersion 521`
- AI-Traces: 208 Korp-Entscheidungen

Die Bewertung nutzt nur side-safe sichtbare Entscheidungsdaten: Korp-PlayerView, LegalActions, öffentliche Runner-Rig-Karten, Tags, Credits, Klicks, Agenda-ScoreArea-Counts und AI-Debug-Traces. Verdeckte Runner-Hand-, Stack- oder zukünftige R&D-Informationen werden nicht als Entscheidungsgrundlage verwendet.

## Spielausgang

- Runner gewinnt durch Agendapunkte.
- Runner-Endstand: 28 Tags, 21 Credits, mehrere sichtbare Meat-Damage-Prevention-Hardwarekarten und zwei sichtbare Ressourcen.
- Korp-Endstand: 0 Credits, keine gepunkteten Agenden, `Schlaghund` und `City Surveillance` installiert, mehrere Tag-/Damage-Payoffs bereits verbraucht oder im Archiv.

Wesentlich: Die Korp hat Tags erzeugt, aber diese Tags nicht rechtzeitig in Spielgewinn oder wirksame Bremsung übersetzt.

## Agenda- und Druck-Zeitlinie

| Ereignis | StateVersion | Sichtbarer Kontext vor dem Steal | Bewertung |
|---|---:|---|---|
| Runner stiehlt `Hostile Takeover` aus R&D | 193 -> 194 | Korp 10 Credits, Runner 11 Credits, 3 Tags | Ab hier muss die Korp die vorhandenen Tags als Payoff-Fenster behandeln. |
| Runner stiehlt `Hostile Takeover` aus HQ | 259 -> 260 | Korp 1 Credit, Runner 2 Credits, 7 Tags | Korp ist trotz 7 Tags zu arm; Credit-Aufbau war vorher nicht zielgerichtet. |
| Runner stiehlt `Strike Force Kali` aus R&D | 370 -> 371 | Korp 2 Credits, Runner 3 Credits, 7 Tags | Ab hier akuter Endgame-Modus: Runner hat drei Score-Karten und genug Tags für Payoff-Druck. |
| Runner stiehlt `On-Call Solo Team` aus R&D | 520 -> 521 | Korp 0 Credits, Runner 21 Credits, 28 Tags | Tags sind völlig entkoppelt vom Korp-Siegplan geblieben. |

## Bereits Durch Vorarbeiten Adressierte Punkte

### `Diplomatic Immunity` vor Meat Damage

Vorarbeit auf `main`:

- `docs/architecture/ai/corp-ai-diplomatic-immunity-trash-activity-process-2026-06-24.md`
- Regression in `packages/ai/src/index.test.ts`: `prioritizes trashing Diplomatic Immunity over low-credit economy in a tagged meat-damage plan`
- Codepfad: `corpTaggedDamagePreventionResourceTrashPressure`

Abgedeckter Fehler:

- D096/D106-Sequencing: Die Korp spielte später `Scorched Earth`, obwohl sichtbare Meat-Damage-Prävention die Linie neutralisierte. Der neue Scoring-Baustein bevorzugt `Diplomatic Immunity`-Trash im getaggten Meat-Damage-Kontext.

### `Schlaghund` als Tag-Meat-Damage-Payoff

Vorarbeit auf `main`:

- `docs/architecture/ai/corp-ai-tagged-meat-damage-payoff-process-2026-06-24.md`
- Regression in `packages/ai/src/index.test.ts`: `prioritizes Schlaghund tagged meat damage over economy and generic ICE setup`
- Codepfad: `corpTaggedMeatDamagePayoffPressure`

Abgedeckter Fehler:

- `Schlaghund` wurde in den Traces als `gain_credit` angezeigt und im Score oft punktgleich mit `1 Credit nehmen` behandelt. Der neue Baustein erkennt LegalActions mit tagbasiertem Meat-Damage-Payoff über Ontologie/Quelle und gibt side-safe Debug-Evidence aus.

## Offene Fehlergruppen Für Diesen Prozess

### CTPE-F1: Kein Endgame-Modus bei Agenda-Druck

Beleg:

- D156-D158, `stateVersion 373-375`, TurnSerial 50: Runner hatte 7 Tags und drei Score-Karten. Legal waren unter anderem `Schlaghund`, `Chance Observation`, `Trojan Horse` und Resource-Trash. Die Korp nahm drei Mal `1 Credit`.
- D176-D178, `stateVersion 436-438`, TurnSerial 56: Runner hatte 14 Tags und drei Score-Karten. `Schlaghund` und `Punitive Counterstrike` waren legal, gewählt wurden drei Credits.
- D182-D184, `stateVersion 448-450`, TurnSerial 58: Runner hatte 16 Tags und drei Score-Karten. Wieder drei Credits, kein Payoff.

Erwartete zukünftige Behandlung:

- Bei sichtbaren Runner-Tags und hohem Runner-Agenda-Druck muss die Korp Score-Komponenten für Payoff-/Trash-Fenster deutlich anheben.
- Passive Economy darf nur gewinnen, wenn sie ein erkennbares Credit-Ziel für einen vorhandenen Payoff vorbereitet.
- Langsame Setup-Aktionen ohne Sofortwirkung sollen gedämpft werden.

### CTPE-F2: Resource-Trash ist zu flach und zu spät

Beleg:

- D088-D096: Runner hatte sechs Ressourcen und 3-8 Tags. Trash-Aktionen waren legal, aber lange niedriger bewertet als Install/Rez/Operation.
- D167-D169: Erst bei TurnSerial 54 wurden `Databroker` und `Floating Runner BBS` getrasht.
- D191/D196: `Nomad Allies` und `The Springboard` wurden erst bei 18/20 Tags getrasht.
- `Technician Lover` und `Submarine Uplink` blieben bis zum Endgame relevant.

Erwartete zukünftige Behandlung:

- Sichtbare Ressourcen brauchen eine generische Priorisierung nach Funktion, nicht nur gleiche Basiswerte.
- Hohe Priorität: globale Meat-Damage-Prävention, Tag-Removal/Tag-Avoid, Trace-Link/Trace-Vermeidung, R&D-Topdeck-Wissen, große Deferred Economy.
- Die Priorität soll mit Runner-Tags und Runner-Agenda-Druck steigen.

### CTPE-F3: Credit-Aufbau ohne Payoff-Ziel

Beleg:

- D156-D158: Korp nimmt drei Credits, obwohl sofortige Payoff-/Trash-Aktionen legal waren.
- D176-D178 und D182-D184: Korp baut von 0 auf 3 beziehungsweise von 3 auf 6 Credits auf, löst aber keinen Payoff aus.
- D200-D202: Korp nimmt zwei Credits und spielt dann `Urban Renewal`; der Schaden wird durch sichtbare Prävention vollständig neutralisiert.

Erwartete zukünftige Behandlung:

- Economy soll bei Tag-Endgame-Druck nur dann Bonus erhalten, wenn ein sichtbarer Payoff vorhanden ist und die Credits unter einem plausiblen Zielwert liegen.
- Sobald ein Payoff bei den aktuellen Credits besser ist als Funding, muss der Payoff bevorzugt werden.
- Debug-Evidence muss Funding und Zielwert unterscheiden.

### CTPE-F4: Langsamer Board-/Remote-/Archives-Aufbau trotz Payoff-Fenster

Beleg:

- D115/D126/D137: Archives-ICE wird installiert, obwohl Runner über HQ/R&D punktet und Tags vorhanden sind.
- D188/D189: `City Surveillance` wird bei 18 Tags installiert/gerezzt; als langfristige Tag-Quelle ist sie spät weniger relevant als sofortiger Payoff/Trash.
- D161/D162: HQ-Root wird installiert/gerezzt, während Runner bei 8 Tags und drei Score-Karten steht.

Erwartete zukünftige Behandlung:

- Setup-Aktionen dürfen nicht pauschal verboten werden, sollen aber bei hohem Endgame-Druck und vorhandenen legalen Payoff-/Trash-Aktionen einen Malus erhalten.
- Zentralserver-Schutz bleibt erlaubt, aber reine Remote-/Archives-/späte Tag-Snowball-Aktionen müssen gegen die sofortige Siegbedrohung verlieren.

### CTPE-F5: Damage-Payoff ignoriert sichtbare Prevention-Kosten

Beleg:

- `Scorched Earth` bei D106 wurde auf 0 Schaden verhindert.
- `Urban Renewal` bei D202 wurde ebenfalls auf 0 Schaden verhindert.
- Sichtbare Hardware wie `Full Body Conversion`, `Dermatech Bodyplating` und `Techtronica Utility Suit` war relevant für den Netto-Schaden.

Erwartete zukünftige Behandlung:

- Bereits vorhandener Code schätzt sichtbare Meat-Prevention an. Dieser Prozess erweitert die Nutzung: Funding, Trash und Payoff-Sequencing sollen denselben Prevention-Kontext teilen.
- Ein Payoff bleibt wertvoll, wenn er Druck erzeugt oder mit ausreichendem Credit-Ziel Schaden durchbringen kann; er darf aber nicht blind über bessere Trash-/Funding-Aktionen gehen.

## Akzeptanzkriterien Für Codepakete

- Ein Regressionsfall mit 7 Tags, drei Runner-Score-Karten und legalem `Schlaghund`/Resource-Trash wählt keine generische `gain_credit`-Aktion, sofern der Payoff/Trash side-safe besser ist.
- Ein Regressionsfall mit wichtigen sichtbaren Runner-Ressourcen priorisiert Resource-Trash differenziert gegenüber einfacher Economy.
- Ein Gegenfall ohne Runner-Tags oder ohne Agenda-Druck bleibt konservativ.
- Debug-Evidence enthält Endgame-, Resource- und Funding-Gründe ohne Hidden-Info-Marker.

## Follow-ups Außerhalb Dieses Prozesses

- Vollständige mehrzügige Kill-Line-Suche mit Simulation ist nicht Teil dieses Prozesses.
- Tiefer Zentralserver-Schutz anhand zukünftiger R&D-/HQ-Zugriffe bleibt separate Run-/Coverage-Arbeit.
- Balancing gegen größere Benchmark-Korpora kann nach den fokussierten Regressionen folgen.
