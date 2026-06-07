# AI Run Payoff Signal Inventory 2026-06-07

## Status

`review_complete`

## Scope

Dieses Review inventarisiert side-sichere AI-Hints und Taktiksignale für installierte Runner-Karten und Run-/Access-Karten, die erfolgreiche Runs auf HQ, F&E/R&D, Archive, Außenserver oder beliebige Server aufwerten, abwerten oder funktional verändern.

Geprüfte Hauptquellen:

- `packages/ai/src/runner-run-target-evaluation.ts`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/hint-ontology.ts`
- `data/ai/ai-card-hints-compiled.json`
- `data/ai/ai-card-hints-active.json`
- `data/ai/tactic-signals-v1.json`
- `data/cards/originalset-v1-cards.json`
- `data/cards/proteus-cards.json`
- `docs/architecture/ai/taktiksignale-strategieanker-guide-2026-06-02-v3.md`

## Out of Scope

- Keine Runtime-Anbindung in `RunnerRunTargetEvaluation`.
- Keine neuen Strategy-IDs.
- Keine Engine-, LegalAction-, `applyAction`-, Replay- oder StateHash-Änderung.
- Keine Hidden-Info-Ausweitung.
- Keine Protheus-`ai_supported`-, `deck_legal`- oder `format_legal`-Freigabe.
- Keine pauschale Signalvermehrung aus Kartennamen, Subtypen oder Familiennamen.

## Current Consumer Surface

`RunnerRunTargetEvaluation` bewertet aktuell:

- serverseitige LegalActions vom Typ `start_run`;
- sichtbaren Run-Pfad über PlayerView-Server und eigene Rig-Karten;
- bekannte Remote- und R&D-Payoffs über side-sichere Belief-/Public-State-Auswertung;
- `scoreThreat` aus sichtbaren oder advancement-basierten Remote-Root-Daten;
- `multiaccessAvailable` über eine enge CardId-Liste.

Die aktuelle `targetHasMultiaccess`-Logik ist zu eng und semantisch gemischt:

- R&D: `onr_v1_050_r-and-d-protocol-files`, `onr_v1_139_r-and-d-interface`.
- HQ: `onr_v1_024_expert-schedule-analyzer`, `onr_v1_041_microtech-ai-interface`.

Dabei sind `Expert Schedule Analyzer` und `Microtech AI Interface` eher Access-/Info-/Replacement-Payoffs als echte Extra-Access-Karten. Umgekehrt fehlen echte oder neue Hint-basierte Payoffs wie `HQ Interface`, `Highlighter`, `Vienna 22`, `Crumble`, `Boardwalk`, `Deep Thought` und mehrere erfolgreiche-Run-Virusprogramme.

## Existing Signal and Hint Coverage

Die vorhandene Ontologie ist für einen engen Consumer bereits ausreichend:

- `effects.kind=multiaccess` mit `scope=hq` oder `scope=rnd` modelliert echten Central-Multiaccess.
- `effects.kind=hq_info` mit `scope=hq` modelliert HQ-Informationspayoff.
- `effects.kind=topdeck_info` mit `scope=rnd` modelliert R&D-Topdeck- oder Reorder-Payoff.
- `effects.kind=persistent_counter_effect` mit `timing=successful_run` und `scope=hq|rnd|remote|server` modelliert erfolgreiche-Run-Counter.
- `effects.kind=persistent_counter_effect` mit `timing=on_access` und `target=free_trash|trash_untrashable|access_trash_pressure` modelliert Access-Trash-Payoff.
- `effects.kind=remote_tax` mit `scope=remote|server` modelliert Remote-/Server-Tax-Payoff.
- `effects.kind=global_modifier` mit `scope=ice` und `timing=successful_run` modelliert wiederkehrende Break-Cost-/ICE-Strength-Unterstützung.
- `effects.kind=recurring_economy` mit Counter-Bezug modelliert künftigen Economy-Payoff.
- `effects.kind=future_run_effect`, `future_encounter_effect`, `access_replacement`, `run_tax` und `trace_defense` decken Run-Prep-/Run-Event-Nutzen ab, sind aber keine installierten Payoff-Karten.

Relevante vorhandene Taktiksignale:

- `access.hq_multiaccess`
- `access.rnd_multiaccess`
- `access.free_trash`
- `info.hq`
- `info.rnd_topdeck`
- `access.rnd_topdeck_setup`
- `economy.trash_credit`
- `run.break_cost_support`
- `run.make_run`
- `run.any_server`
- `run.server_specific_hq`
- `run.server_specific_rnd`
- `run.server_specific_remote`
- `run.followup_run`
- `virus.counter_engine`
- `virus.trigger_hq`
- `virus.trigger_rnd`
- `virus.trigger_remote`
- `virus.trigger_any_successful_run`
- `virus.purge_tax`

Wichtig: Die Taktiksignale sind read-only Semantik. Sie erzeugen keine Legalität, keine Planner-Gewichte und keine Action-Auswahl außerhalb von Engine-`LegalActions`.

## Reviewed Cards

| Karte | Server-/Run-Bezug | Payoff-Art | Aktueller Hint-Stand | Consumer-Folge |
|---|---|---|---|---|
| `Boardwalk` | HQ successful run | künftige HQ-Info, Purge-Tax, Counter-Aufbau | `persistent_counter_effect` HQ, `hq_info`, `runner.hq_pressure` | HQ moderat aufwerten, eher future/info value |
| `Butcher Boy` | HQ successful run | künftige Economy, Purge-Tax, Counter-Aufbau | `persistent_counter_effect` HQ, `recurring_economy` | HQ leicht/moderat aufwerten, economy/future value |
| `Cascade` | R&D successful run | künftiger R&D-Trash-Druck, Purge-Tax, Counter-Aufbau | `persistent_counter_effect` R&D, R&D-card-pressure target | R&D moderat aufwerten, future/counter value |
| `Cockroach` | HQ successful run | HQ-Discard-Randomisierung, Purge-Tax, Counter-Aufbau | `persistent_counter_effect` HQ, random-discard target | HQ leicht/moderat aufwerten, future value |
| `Deep Thought` | R&D successful run | R&D-Topdeck-Info, Purge-Tax, Counter-Aufbau | `topdeck_info`, `persistent_counter_effect` R&D, `runner.rnd_pressure` | R&D moderat aufwerten, info/future value |
| `Expert Schedule Analyzer` | HQ access | HQ-Full-Reveal | `hq_info:on_access`, `runner.hq_pressure` | HQ immediate info value, kein echter Multiaccess |
| `Fait Accompli` | Remote successful run | Agenda-Difficulty-/Remote-Tax, Purge-Tax | `persistent_counter_effect` remote, `remote_tax` | Remote/score-threat moderat aufwerten, future/remote tax |
| `Incubator` | beliebiger successful run | Virus-Counter-Amplification, Purge-Tax | `persistent_counter_effect` server, counter amplification | beliebige Runs leicht aufwerten, nur future setup |
| `Microtech AI Interface` | R&D access | Access-Replacement/Reorder/Topdeck-Info | `access_replacement`, `topdeck_info`, `zone_shuffle`, `runner.rnd_pressure` | R&D immediate access setup value, kein echter Multiaccess |
| `Pattel's Virus` | beliebiger successful run nach gebrochenem ICE | Break-Cost-Unterstützung, ICE-Strength-Reduktion | `global_modifier` ICE, TargetProfiles side-safe | Runs mit relevantem ICE leicht aufwerten, future/cost value |
| `Pox` | beliebiger successful run | Server-Install-Tax, Purge-Tax | `persistent_counter_effect` server, `remote_tax` server | Remote/Server-Payoff moderat, future tax |
| `HQ Interface` | HQ access | echter HQ-Multiaccess | `multiaccess:scope=hq`, `runner.hq_pressure` | HQ immediate access value |
| `R&D Interface` | R&D access | echter R&D-Multiaccess | `multiaccess:scope=rnd`, `runner.rnd_pressure` | R&D immediate access value |
| `Crumble` | HQ successful run und HQ access | HQ free trash/untrashable trash, Purge-Tax | `persistent_counter_effect` HQ, on-access free-trash targets | HQ immediate/future access-trash value |
| `Highlighter` | R&D successful run und R&D access | R&D Multiaccess über Counter | `multiaccess:scope=rnd`, `persistent_counter_effect` R&D | R&D immediate/future multiaccess value |
| `Vienna 22` | HQ successful run und HQ access | HQ Multiaccess über Counter | `multiaccess:scope=hq`, `persistent_counter_effect` HQ | HQ immediate/future multiaccess value |
| `Priority Wreck` | HQ run event | Access-Replacement zu Corp-Credit-Loss | `access_replacement`, `run_tax`, `runner.hq_pressure` | Nicht installed-payoff; relevant für Hand-/Eventbewertung |
| `Social Engineering` | Run event | Run plus ICE-Bypass mit Risiko | `future_run_effect`, `future_encounter_effect`, TargetProfile | Nicht installed-payoff; Event-/Action-Consumer |
| `Stumble through Wilderspace` | Run event | Trace-Defense während Run | `future_run_effect`, `trace_defense` | Nicht installed-payoff; Event-/Run-Risk-Consumer |

## Immediate vs Future Payoff

Für `RunnerRunTargetEvaluation` sollte die nächste Implementierung zwischen diesen Beiträgen trennen:

- `immediate_access_value`: echte `multiaccess`, `hq_info:on_access`, `topdeck_info:on_access`, `access_replacement:on_access`, on-access free-trash.
- `future_counter_setup_value`: successful-run Counter, Start-of-turn Info/Economy, Counter-Amplification.
- `purge_tax_value`: Corp-Aktionsverlust beim Virus-Purge, nur als kleiner Zusatzwert.
- `economy_value`: künftige Runner-Credits oder Corp-Credit-Loss, nicht als Steal-/Trash-Payoff überbewerten.
- `risk_or_malus`: Runner-Kosten, guessing game, run-end/replacement side effects, known-no-current-payoff, unpayable path, missing coverage.

## Missing or Weak Signals

Für den engen Consumer ist keine neue Strategy-ID nötig und keine neue Taktiksignal-Datei blockierend.

Kleine semantische Folgeempfehlungen:

- Ein präzises read-only Signal für `access.hq_free_trash` oder ein konsistenter Derivationspfad von `target=free_trash` nach `access.free_trash` wäre nützlich, weil `Crumble` aktuell über strukturierte Effekt-Targets statt über ein explizites Function-Signal konsumiert werden muss.
- Erfolgreiche-Run-Counter können für spätere Auswertungen feiner getrennt werden, etwa `virus.trigger_hq`, `virus.trigger_rnd`, `virus.trigger_remote` und `virus.trigger_any_successful_run`; diese Signale existieren bereits, müssen aber nicht zwingend in `RunnerRunTargetEvaluation` primär verwendet werden.
- `remote_tax` ist bereits als Hint-Effect vorhanden. Ein Runner-seitiges Strategy-/Tactic-Signal für `run.remote_tax_setup` ist optional, aber nicht erforderlich, solange der Consumer strukturiert nach Effect-Kind und Scope arbeitet.
- `multiaccessAvailable` sollte fachlich in Richtung `installedRunPayoff` oder `installedCentralAccessPayoff` erweitert werden, damit Info-/Topdeck-/Free-Trash-Payoffs nicht als echter Multiaccess missverstanden werden.

## Hidden-Info Review

Die verwendbaren Eingänge sind side-safe:

- eigene installierte Runner-Karten aus `input.playerView.own.rig`;
- AI-Hints aus versionierten Kartendaten;
- LegalActions vom Typ `start_run`;
- sichtbare Serverpfade aus PlayerView;
- bestehende Known-Access-Evaluationen aus side-sicherer Belief-/Public-State-Schicht.

Nicht zulässig:

- FullState;
- verdeckte Korp-Handkarten;
- verdeckte R&D-/Stack-Reihenfolge;
- gegnerische private Payloads;
- unredigierte Decklisten oder Snapshot-IDs;
- Ableitung einer Action, die nicht in `input.legalActions` steht.

## Implementation Handoff

Das Folgepaket `act-2026-06-07-ai-run-payoff-hints-consumer` kann direkt auf diesem Inventar aufsetzen.

Empfohlene Umsetzung:

- Einen kleinen `InstalledRunPayoff`-Builder in oder neben `runner-run-target-evaluation.ts` ergänzen.
- Installierte Runner-Karten nur aus `input.playerView.own.rig` lesen.
- Hints über `createAiHintsByCard()` oder eine paketlokale Map aus `ai-card-hints-compiled.json` konsumieren.
- Payoffs pro Zielserver aggregieren: `hq`, `rd`, `archives`, `remote`, `any`.
- Score-Beiträge niedrig bis moderat halten und deckeln.
- `known_no_current_payoff`, Low-Value, fehlende Coverage, unpayable path, Score-Threat und Economy-Posture müssen stärkere Signale bleiben.
- Evidence nur als Kategorien ausgeben, z. B. `installed_run_payoff:hq:multiaccess`, `installed_run_payoff:rd:topdeck_info`, `installed_run_payoff:hq:free_trash`.

## Risiken

- Die Hint-Dateien enthalten auch Protheus-Karten mit Hintstatus. Das ist keine Produktfreigabe: Protheus-AI-Decklegalität und AI-Gameplay-Freigabe bleiben durch separate Gates geschlossen.
- Virus-Payoffs sind oft future/counter-basiert. Ein zu hoher Bonus würde sinnlose Runs forcieren. Deshalb braucht der Consumer Diminishing Returns und ein Cap.
- `Expert Schedule Analyzer` und `Microtech AI Interface` dürfen nicht als echter Multiaccess gezählt werden, sondern als Info-/Access-Setup-Payoffs.

## Verifikation

- Quellenreview der oben genannten Code-, Hint- und Datenartefakte.
- Keine Code- oder Datenänderung außer diesem Review.
- `git diff --check` im Paketabschluss.
