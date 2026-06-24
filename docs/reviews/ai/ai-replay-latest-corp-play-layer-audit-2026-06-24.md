# AI Replay Latest Corp Play Layer Audit 2026-06-24

Status: RCP-3 layer audit

Quelle: `docs/reviews/ai/ai-replay-latest-corp-play-evidence-2026-06-24.md`

## Ergebnis

Die im Replay belegten Fehler liegen nicht in der Rules Engine und nicht in falschen Kartentext-Hints. Die Hauptursache ist der Runtime-Verbrauch vorhandener Semantik:

- Korp-Card-Economy aus aktivierten/triggered LegalActions wird nicht als stärkeres Economy-Ziel gegenüber Basic-`gain_credit` kalibriert.
- Tag-Source-Ontologie wird diagnostisch erkannt, aber nicht ausreichend als Enabler-Score-Komponente in der Semantic Runtime verwendet.
- Persistente Tag-Enabler-Assets in ungeschützten Remotes werden zu wenig gegen ihre Verwundbarkeit und gegen sofortige Operation-Tag-Enabler abgewogen.

## Schichtzuordnung je Fehlergruppe

| Fehlergruppe | Hintdaten | Ontologie | Runtime-Scoring | Plan/Memory | Engine/LegalActions | Testlücke |
| --- | --- | --- | --- | --- | --- | --- |
| F1 BBS-ähnliche +2-Card-Economy verliert gegen Basic-Credit | korrekt | nicht nötig | defekt/fehlend | nicht nötig | korrekt | fehlt |
| F2 `Chance Observation` als Tag-Enabler zu spät | korrekt | korrekt klassifizierbar | defekt/fehlend | `own_hand_future_play_plan_model:not_modelled` sichtbar | korrekt | fehlt |
| F3 `City Surveillance` ungeschützt über Operation-Taglinie | korrekt | korrekt klassifizierbar | zu grob | Remote-Verwundbarkeit fehlt | korrekt | fehlt |
| F4 Resource-Trash spät | kein konkreter Fehler im Match | ok | Follow-up nur für No-Kill-Fenster | nicht in Scope | korrekt | teilweise vorhanden |
| F5 Schlaghund | kein konkreter Fehler im Match | ok | bestehende Tests vorhanden | nicht in Scope | keine LegalAction im Replay | kein neuer Test nötig |

## Hints

### `Chance Observation`

Der aktive Hint ist fachlich passend:

- `effects`: `trace`, `tag_source`
- `conditions`: `requires_trace_success`
- `lineSupport`: `corp.tag_trace_punish`
- `strategicRole`: `enabler`
- `tacticSignals`: `condition.last_turn_run`, `tag.source`, `trace.source`

Keine Hintkorrektur nötig. Der Fehler ist, dass `semanticRuntimeCorpScoreComponents` diesen Tag-Source-Hint nicht als eigene Komponente nutzt.

### `Closed Accounts` und `Urban Renewal`

Beide Payoffs sind korrekt als tagabhängige Payoffs markiert. `Urban Renewal` wurde bei `sv95` korrekt als `corp_tag_punish` erkannt und gewann per Flatline.

Keine Hintkorrektur nötig.

### `City Surveillance`

Der Hint ist fachlich passend als persistente Tag-Quelle:

- `lineSupport`: `corp.tag_trace_punish`
- `strategicRole`: `enabler`
- `effects`: `tag_source`, `run_tax`
- `conditions`: `requires_runner_pay_or_take_tag`

Keine Hintkorrektur nötig. Der Runtime-Fehler ist Kontextbewertung: ungeschütztes, contestbares Remote-Root-Setup muss schwächer sein als eine sofortige Operation-Tagquelle mit sichtbarem Payoff.

### `BBS Whispering Campaign`

Die Engine-Implementation erzeugt eine sichtbare aktivierte Korp-Aktion mit +2 Credits. Der Fehler ist nicht die Karte, sondern dass die Semantic Runtime diese Aktion nur über `semantic_type_priority: activated_card_ability` bewertet und Low-Credit-/Reserve-Kontext nur für Basic-`gain_credit` addiert.

Keine Hintkorrektur nötig.

## Umsetzungsvertrag RCP-4

### A1: Korp-Card-Economy-Komponente

Ergänze eine generische Score-Komponente für Korp-Aktionen vom Typ `activated_card_ability` oder `trigger_ability`, wenn side-safe aus Action-Payload, Resolved-Effect-Hinweisen, Label oder Source-Definition ein Credit-Gain ableitbar ist.

Mindestverhalten:

- +2-Credit-Card-Economy schlägt Basic-`gain_credit` bei Low-Credit-/Reserve-Kontext.
- Opake Ability ohne sichtbaren Credit-Gain bekommt keinen Economy-Bonus.
- Debug-Key: `corp_card_action_economy_gain`.

### A2: Tag-Source-mit-Payoff-Komponente

Ergänze eine generische Score-Komponente für Korp-Tagquellen, wenn:

- die Aktion durch Ontologie oder bestehende Helper als Tag-Source erkennbar ist,
- ein sichtbarer eigener tagabhängiger Payoff in LegalActions, HQ, ScoreArea oder Board vorhanden ist,
- die Trace-/Tag-Erfolgserwartung nicht offensichtlich niedrig ist.

Mindestverhalten:

- `Chance Observation` mit sichtbarem `Urban Renewal`/`Closed Accounts`-Payoff schlägt generische Economy und ungeschütztes Remote-Tag-Asset-Setup.
- Ohne sichtbaren Payoff bleibt der Bonus klein oder entfällt.
- Debug-Key: `corp_tag_source_visible_payoff_pressure`.

### A3: Ungeschützte Remote-Tag-Asset-Abwertung

Ergänze einen Abschlag für Korp-Install-/Rez-Linien, wenn eine persistente Tagquelle als ungeschütztes Remote-Root aufgebaut oder gerezzt wird und gleichzeitig eine sofortige Tag-Operation mit Payoff-Kontext legal ist.

Mindestverhalten:

- Ungeschützte `City Surveillance`-Linie wird nicht höher bewertet als `Chance Observation` mit sichtbarem Payoff.
- Geschützte Remote-Assets oder Situationen ohne Operation-Tagquelle bleiben spielbar.
- Debug-Key: `corp_unprotected_tag_asset_setup_penalty`.

## Akzeptanztests

1. `chooseCorpAction` wählt +2-Card-Economy statt Basic-`gain_credit` und zeigt `corp_card_action_economy_gain`.
2. Eine opake Korp-Ability ohne Credit-Gain schlägt Basic-`gain_credit` nicht.
3. `chooseCorpAction` wählt `Chance Observation`, wenn eine tagabhängige Payoff-Karte sichtbar verfügbar ist und `City Surveillance` ungeschützt installiert werden könnte.
4. `Chance Observation` ohne sichtbaren Payoff wird nicht blind über sinnvolle Defense/Economy gehoben.

## Nicht ändern

- Keine Engine- oder LegalAction-Erzeugung.
- Keine Hidden-Info-Projektion.
- Keine Spezialregel für `Schlaghund`.
- Keine Änderung an vorhandenen korrekten Hints.
