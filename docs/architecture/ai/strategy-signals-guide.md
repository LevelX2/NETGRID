# NETGRID Guide V3: Taktiksignale und Strategieanker

Stand: 2026-06-02
Status: Arbeitsleitfaden für künftige AI-Semantik-Reviews
Version: V3 nach AI020-1 bis AI026-Erkenntnissen

---

## 1. Zweck

Dieser Guide beschreibt die Regeln, Prüflogiken und Qualitätsmaßstäbe für die Vergabe von Taktiksignalen, Strategieankern, Strategie-Rollen, TargetProfiles, Conditions, Risiken und Constraints in NETGRID.

Ziel ist eine kontrollierte, konsistente und langfristig verwendbare KI-Semantik. Die KI soll Karten nicht isoliert nach Einzelaktionen bewerten, sondern entlang einer sauberen semantischen Kette verstehen:

```text
Kartendefinition / CardImplementation
→ kanonische Kartensemantik
→ Taktiksignale
→ Strategieanker mit Rolle
→ DeckDoctrine / Deckstrategieprofil
→ taktische Zwischenziele
→ semantisch verstandene LegalActions
→ Auswahl einer legalen Aktion
```

Die Ebenen müssen strikt getrennt bleiben. Eine Karte kann viele Funktionen haben, ohne eine Strategie zu tragen. Eine Strategie kann angedeutet sein, ohne vollständig zu sein. Eine LegalAction kann legal sein, aber taktisch falsch.

---

## 2. Ebenenmodell

### 2.1 Kartendefinition / CardImplementation

Diese Ebene beschreibt, was eine Karte regeltechnisch ist und tut:

```text
Kartentyp
Subtypen
Kosten
Timing
Bedingungen
Effekte
Ziele
Einschränkungen
Drawbacks
Dauer
Sichtbarkeitsregeln
```

Diese Ebene beantwortet:

```text
Was ist die Karte regeltechnisch?
Was passiert, wenn sie genutzt wird?
```

Subtypen, Typen, Kartennamen und Regelbedingungen gehören zuerst hierher. Sie sind nicht automatisch Taktiksignale.

---

### 2.2 Kanonische Kartensemantik

Die kanonische Kartensemantik ist die strukturierte, kontrollierte Beschreibung der Kartenwirkung.

Sie beantwortet:

```text
Welche technische Wirkung hat die Karte in kontrollierter Form?
```

Sie soll aus CardImplementation, Kartendefinition, strukturierten Effekten, Kosten, Timing, Bedingungen, Zielprofilen und geprüften Ableitungsregeln entstehen.

---

### 2.3 Taktiksignale

Taktiksignale sind die kontrollierte Funktionssprache der KI.

Sie beantworten:

```text
Wofür kann die KI diese Karte funktional nutzen?
```

Ein Taktiksignal beschreibt nicht, was eine Karte formal ist, sondern welchen taktischen Nutzen oder welches taktische Risiko sie erzeugt.

Beispiele:

```text
setup.memory
setup.hand_size
setup.program_search
setup.program_host
economy.burst_credit
economy.recurring_breaker_credit
draw.corp_draw
access.hq_multiaccess
access.rnd_multiaccess
access.free_trash
run.bypass_first_ice
run.followup_run
defense.damage_prevention
defense.tag_prevention
ice.trash_rezzed
risk.self_brain_damage
```

Taktiksignale sind keine Strategien, keine TargetProfiles und keine LegalActions.

---

### 2.4 Conditions

Conditions beschreiben Voraussetzungen eines Effekts.

Sie beantworten:

```text
Wann oder unter welcher Voraussetzung ist der Effekt nutzbar oder relevant?
```

Beispiele:

```text
condition.runner_attempted_run_last_turn
condition.runner_attempted_multiple_runs_last_turn
condition.runner_trashed_node_last_turn
condition.runner_installed_resource_last_turn
condition.agenda_stolen_last_turn
condition.requires_installed_advanceable_card
condition.requires_tagged_runner
```

Conditions sind keine Strategieanker. Sie sind Einschränkungen, Voraussetzungen oder Bewertungsfilter.

---

### 2.5 Risiken und Drawbacks

Risiken beschreiben negative Folgen, Kosten, Unsicherheiten oder Nachteile einer Karte.

Beispiele:

```text
risk.self_tag
risk.self_brain_damage
risk.brain_damage_self_inflicted
risk.action_loss
risk.hand_trash_cost
risk.installed_card_trash_cost
risk.temporary_program_loss
risk.random_action
risk.random_economy
risk.loss_condition
risk.leaves_play_loss
risk.agenda_point_cost
risk.temporary_credit_drawback
```

Positive Effekte und Risiken müssen getrennt sichtbar sein.

---

### 2.6 Strategieanker

Strategieanker beschreiben, ob eine Karte eine größere Decklinie direkt trägt, wesentlich ermöglicht oder abschließt.

Sie beantworten:

```text
Welche größere Deckstrategie unterstützt diese Karte direkt?
```

Strategieanker sind nur für echte Anker-, Payoff-, Engine-, Enabler-, Schlüssel- oder Win-Condition-Karten gedacht.

Normale Supportkarten erhalten keinen Strategieanker, auch wenn sie für eine Strategie nützlich sind.

---

### 2.7 Rolle innerhalb eines Strategieankers

Eine Rolle beschreibt die Funktion einer Karte innerhalb einer konkreten Strategie.

Beispiele:

```text
payoff_anchor
engine_anchor
enabler
defensive_tool
emergency_tool
win_condition
tag_source_enabler
trace_tag_source
tag_snowball_followup
access_tag_source
damage_amplifier
access_punish
```

Eine Rolle ist nur sinnvoll zusammen mit einer Strategie-ID:

```text
corp.tag_trace_punish → trace_tag_source
corp.damage_kill → tagged_meat_payoff
runner.rnd_pressure → payoff_anchor
```

Ein loses Rollenfeld ohne Strategie-ID ist nicht das Zielmodell.

---

### 2.8 TargetProfiles

Ein TargetProfile beschreibt, wie die KI unter legalen Zieloptionen sinnvoll wählen soll.

Es beantwortet:

```text
Welches legale Ziel ist taktisch sinnvoll?
```

TargetProfiles ersetzen keine Taktiksignale und erzeugen keine Legalität.

---

### 2.9 Constraints

Constraints beschreiben statische Geltungsbereiche, Einschränkungen oder Anwendungsregeln.

Beispiele:

```text
only_walls
only_code_gates
only_black_ice
not_cybernetics
deck_exclusive
unique_region_slot
hosted_program_mu_lte_1
hosted_program_must_be_icebreaker
```

Constraints sind keine TargetProfiles, solange keine Zielwahl stattfindet.

---

## 3. Grundregel für Taktiksignale

Ein Taktiksignal darf nur existieren, wenn es eine wiederverwendbare funktionale Aussage trägt.

Zulässig:

```text
Diese Karte liefert Economy.
Diese Karte verbessert Zugriff.
Diese Karte schützt vor Schaden.
Diese Karte entfernt oder verhindert Tags.
Diese Karte sucht, installiert oder hostet Programme.
Diese Karte kontrolliert ICE.
Diese Karte verändert Run-Struktur.
Diese Karte erzeugt einen Score- oder Agenda-Punkt-Effekt.
Diese Karte erzeugt ein Risiko oder eine Einschränkung, die die KI berücksichtigen muss.
```

Nicht zulässig:

```text
Diese Karte ist ein Chip.
Diese Karte ist ein Vehicle.
Diese Karte ist Cybernetics.
Diese Karte ist ein Deck.
Diese Karte ist eine Prep.
Diese Karte ist eine Operation.
Diese Karte ist ein Node oder Asset.
Diese Karte ist Black Ops, Gray Ops, Transactions, AI, Ambush, Virus oder Random.
Diese Karte heißt Scorched Earth.
Diese Karte gehört thematisch zu einer Gruppe.
```

Kurzform:

```text
Funktion → mögliches Taktiksignal
Typ / Subtyp / Name / Thema → Kartendaten, kein Taktiksignal
```

---

## 4. Subtypen sind keine Taktiksignale

Subtypen müssen maschinenlesbar vorhanden sein, aber nicht als Taktiksignale.

Beispiel:

```text
card.type = "Hardware"
card.subtypes = ["Chip", "Cybernetics"]
```

Die KI muss diese Subtypen aus Kartendaten oder kanonischer Kartensemantik erkennen können. Sie benötigt dafür kein Taktiksignal wie:

```text
hardware.chip
setup.memory_chip
setup.cybernetics
setup.vehicle
```

Subtypen sind nur dann taktisch relevant, wenn daraus ein Effekt, ein Constraint, eine Zielbarkeit oder eine Bewertungsfolge entsteht. Auch dann ist die erste Modellierungsebene nicht automatisch ein Taktiksignal.

---

## 5. Effekte auf Subtypen

Wenn Regeln oder Karteneffekte auf Subtypen wirken, müssen diese Subtypen zuverlässig erkennbar sein.

Das erzeugt aber nicht automatisch ein Taktiksignal.

Beispiel:

```text
Power Grid Overload:
Trash X pieces of hardware, other than cybernetics.
```

Daraus folgt:

```text
Cybernetics muss als Subtyp erkannt werden.
Cybernetics muss für Targeting/Schutzlogik verfügbar sein.
Cybernetics ist aber nicht automatisch ein Taktiksignal.
```

Bessere Modellierung:

```text
subtypes: ["Cybernetics"]

constraint / targeting:
not_cybernetics
protected_from_generic_hardware_trash
```

Schlechte Modellierung:

```text
tacticSignals: ["setup.cybernetics"]
```

---

## 6. Nachkorrektur-Regel

Wenn ein rein beschreibendes Subtyp-Signal entfernt wird, muss pro Karte geprüft werden, ob die eigentliche Funktion vollständig erhalten bleibt.

Das Löschen eines Subtyp-Signals darf keine funktionale Lücke erzeugen.

Beispiele:

```text
setup.vehicle entfernen
→ Tag-Clear, Tag-Prevention, Meat-Damage-Prevention müssen erhalten bleiben.

setup.memory_chip entfernen
→ setup.memory muss bei echten MU-Karten erhalten bleiben.

setup.cybernetics entfernen
→ Hand-size, Damage Prevention, Memory oder Recurring Credits müssen erhalten bleiben.

hardware.deck nicht verwenden
→ deck_exclusive als Constraint oder funktionales Setup-Konfliktsignal erhalten.
```

---

## 7. Typische Fehler bei Taktiksignalen

### 7.1 Reine Beschreibung als Signal

Problematisch:

```text
setup.vehicle
setup.memory_chip
setup.cybernetics
hardware.chip
hardware.deck
corp.operation
operation.black_ops
corp.node
node.ambush
asset.campaign
corp_ice.wall
corp_ice.black_ice
```

Besser:

```text
Vehicle mit Tag-Schutz:
defense.tag_prevention

Mem Chip:
setup.memory

Black Ice wird billiger zu rezzen:
ice.corp_rez_discount + constraint only_black_ice

Ambush mit Net Damage:
access.corp_net_damage_ambush
```

---

### 7.2 Zu breite Oberklassensignale

Problematisch, wenn sie allein stehen oder die präzise Funktion ersetzen:

```text
economy.generic
economy.recurring
economy.corp_draw
setup.search
setup.recovery
defense.damage_prevention
damage.payoff
access.punish
remote.ambush
run.make_run
corp_ice.other_utility
```

Diese Signale können als Aggregations-, Kompatibilitäts- oder Legacy-Signale nützlich sein, aber sie dürfen die präzise Funktion nicht ersetzen.

Besser:

```text
economy.burst_credit
economy.conditional_burst_credit
economy.recurring_killer_credit
economy.corp_credit_burst
draw.corp_draw
archives.corp_recovery
damage.corp_tagged_meat_payoff
access.corp_net_damage_ambush
access.corp_brain_damage_ambush
corp_ice.net_damage
corp_ice.brain_damage
```

Regel:

```text
Generische Signale dürfen bestehen, aber die taktische Bewertung muss an präzisen Funktionssignalen hängen.
```

---

### 7.3 Struktur-Signale als Strategieersatz

Viele Preps erzeugen Runs. Das allein ist noch kein strategischer Nutzen.

Struktursignale:

```text
run.make_run
run.any_server
run.server_specific_hq
run.server_specific_rnd
run.server_specific_remote
run.event_tempo
```

Diese Signale beschreiben, dass und wohin eine Aktion läuft. Sie dürfen nicht allein als Strategiegrundlage zählen.

Der eigentliche Nutzen muss zusätzlich sichtbar sein:

```text
access.hq_multiaccess
access.rnd_multiaccess
access.free_trash
run.bypass_first_ice
run.bypass_chosen_ice
score.conditional_agenda_point
ice.trash_rezzed
fort.all_rezzed_ice_trash
```

Regel:

```text
Run-Struktur ist nicht gleich Run-Payoff.
```

---

### 7.4 Falsche Wirkungsrichtung im Signalnamen

Signalnamen müssen exakt ausdrücken, was die Karte tut.

Problematisch:

```text
economy.trash_credit
```

wenn die Karte keine Credits gibt, sondern kostenloses Trashen erlaubt.

Besser:

```text
access.free_trash
access.trash_cost_waiver
access.trash_cost_saving
```

Problematisch:

```text
economy.corp_conditional_credit
```

wenn die Karte den Runner Credits verlieren lässt, aber der Corp keine Credits gibt.

Besser:

```text
economy.runner_credit_loss
tag.runner_credit_punish
corp_punish.runner_credit_loss
```

Regel:

```text
"credit" nur verwenden, wenn tatsächlich Credits gewonnen, bereitgestellt oder zweckgebunden verfügbar gemacht werden.
```

---

### 7.5 Cluster ersetzt kein Signal

Eine Karte kann korrekt in einem mechanischen Cluster erkannt sein, aber trotzdem kein funktionales Taktiksignal erhalten.

Problematisch:

```text
mechanicalFamily: access_brain_damage_ambush
tacticSignals: ["damage.payoff"]
role: meat_damage_payoff
```

Besser:

```text
mechanicalFamily: access_brain_damage_ambush
tacticSignals: ["access.corp_brain_damage_ambush", "damage.payoff"]
role: access_brain_damage_payoff
```

Regel:

```text
Cluster-Erkennung ersetzt kein Taktiksignal.
Kartentext und konkrete Wirkung schlagen Cluster und Oberklasse.
```

---

### 7.6 Kartentext schlägt Name, Subtyp und Cluster

Der konkrete Kartentext ist führend.

Wenn eine Karte Black Ice derezzt, darf sie nicht nur als Expose/Scouting modelliert werden.

Wenn eine Karte Schaden verhindert, darf dieser Defense-Effekt nicht hinter einem Bad-Publicity-Signal verschwinden.

Wenn eine Karte kostenloses Trashen erlaubt, darf das nicht als Credit-Gain modelliert werden.

Wenn eine Karte Brain Damage macht, darf sie nicht als Meat-Damage-Payoff gerollt werden.

Wenn eine Karte Runner-Credits löscht, darf sie nicht als Corp-Credit-Economy modelliert werden.

Regel:

```text
Signal aus Wirkung ableiten, nicht aus Name, Subtyp oder grober Familie.
```

---

## 8. Positive Effekte und Risiken getrennt modellieren

Starke Karten haben oft Nutzen und Drawback. Beide Seiten müssen sichtbar sein.

Positive Signale:

```text
economy.burst_credit
economy.corp_credit_burst
run.run_credit_pool
access.hq_multiaccess
access.rnd_multiaccess
setup.program_install
score.agenda_point_gain
defense.flatline_prevention
action.recurring_extra_action
action.corp_repeatable_extra_action
ice.corp_free_rez
```

Risiko- oder Einschränkungssignale:

```text
risk.self_tag
risk.self_brain_damage
risk.brain_damage_self_inflicted
risk.action_loss
risk.hand_trash_cost
risk.installed_card_trash_cost
risk.temporary_program_loss
risk.random_economy
risk.random_action
risk.agenda_forfeit_drawback
risk.temporary_rez_liability
risk.temporary_credit_drawback
risk.loss_condition
risk.leaves_play_loss
risk.trash_own_rezzed_ice
```

Regel:

```text
Eine Karte mit starkem Nutzen und relevantem Drawback braucht beide Seiten in der Semantik.
```

---

## 9. Präfix-Regel

Signalpräfixe müssen eindeutig sagen, ob sie die handelnde Seite, die betroffene Seite, den Wirkungsraum oder die betroffene Zone meinen.

Potentiell missverständlich:

```text
corp.archives_to_rnd_pressure
```

wenn das Signal auf einer Runner-Karte liegt.

Mögliche saubere Varianten:

```text
archives.to_rnd_manipulation
access.archives_to_rnd_setup
corp_zone.archives_to_rnd_pressure
```

Für Corp-Signale gilt:

```text
economy.corp_...
draw.corp_...
archives.corp_...
hq.corp_...
rnd.corp_...
ice.corp_...
```

sollte klar bedeuten:

```text
Wirkung aus Corp-Perspektive oder auf Corp-eigene Zonen/Karten.
```

Nicht vermischen:

```text
hardware.trash_payoff
```

kann unklar sein, ob die Hardware eigene Hardware, Runner-Hardware oder ein Target-Typ ist.

Besser:

```text
target.runner_hardware_trash
access.corp_hardware_trash
tag.runner_hardware_trash_payoff
```

Regel:

```text
Ein Präfix darf nicht nur historisch gewachsen sein.
Wenn ein Signal auf mehreren Seiten vorkommt, muss seine Konvention dokumentiert sein.
```

---

## 10. Action-Economy und Tempo

Zusätzliche Aktionen sind nicht automatisch Economy im Geldsinn.

Problematisch:

```text
economy.action
```

wenn damit eigentlich Aktionsökonomie oder Tempo gemeint ist.

Besser:

```text
action.extra_action
action.recurring_extra_action
action.corp_extra_action_support
action.corp_repeatable_extra_action
tempo.extra_action
tempo.recurring_action
```

Regel:

```text
Economy meint Credits, Ressourcen oder zweckgebundene Geld-/Kostenwirkung.
Zusätzliche Aktionen gehören in action.* oder tempo.*, nicht in economy.*, sofern keine klare Katalogkonvention dagegensteht.
```

---

## 11. Corp-Tempo- und Extra-Action-Regel

Zusätzliche Corp-Aktionen sind nicht automatisch Fast Advance und nicht automatisch Remote Scoring.

Extra Actions können diese Strategien unterstützen, wenn eine klare Score-Conversion besteht:

```text
Advancement-Counter werden in Aktionen konvertiert.
Zusätzliche Aktionen erleichtern unmittelbar Advance/Score-Sequenzen.
Die Karte ist dauerhaft oder wiederholbar und deckprägend genug.
```

Wenn keine eigene `corp_tempo_strategy` existiert, dürfen bestehende Strategy IDs nicht als Ersatzcontainer missbraucht werden.

Konservative Behandlung:

```text
action.* als Taktiksignal
Strategy candidate/deferred, wenn Score-Conversion nicht eindeutig ist
keine neue Strategy ID ohne separate Taxonomieentscheidung
```

Beispiele:

```text
Pacifica Regional AI:
action.corp_counter_to_action + advance.score_window_support
→ corp.fast_advance kann plausibel sein.

Remote Facility:
action.corp_repeatable_extra_action
→ nur dann corp.fast_advance / corp.remote_scoring, wenn diese Konvention ausdrücklich dokumentiert ist.

Nevinyrral:
action.corp_repeatable_extra_action + risk.leaves_play_loss
→ höchstens medium, Risiko zwingend berücksichtigen.
```

---

## 12. Hosting-Regel

Hosting-Signale sind nur dann wirklich handlungsfähig, wenn die Ziel- oder Constraint-Semantik sichtbar ist.

Beispiel:

```text
Eurocorpse Spin Chip:
setup.program_host
economy.recurring_breaker_credit
TargetProfile: hosted_install_target
Constraint: hosted program MU <= 1, icebreaker
```

Regel:

```text
Ein Hosting-Signal sagt nur, dass Hosting relevant ist.
Die taktische Qualität entsteht erst durch erlaubte und sinnvolle Host-Ziele.
```

---

## 13. Damage-Typ-Regel

Net Damage, Meat Damage und Brain Damage dürfen nie untereinander ausgetauscht oder über unscharfe Rollen vermischt werden.

Erforderlich ist, soweit möglich, ein präziser Damage-Typ:

```text
corp_ice.net_damage
corp_ice.meat_damage
corp_ice.brain_damage

damage.corp_tagged_meat_payoff
damage.corp_damage_amplifier

access.corp_net_damage_ambush
access.corp_brain_damage_ambush
access.corp_meat_damage_ambush
```

Nicht zulässig:

```text
Brain-Damage-Ambush → meat_damage_payoff
Net-Damage-Ambush → meat_damage_payoff
Runner-Credit-Loss → economy.corp_credit_burst
```

Regel:

```text
Strategy-Rollen müssen denselben Damage-Typ tragen wie der Kartentext.
```

---

## 14. `damage.payoff` als Oberklasse

`damage.payoff` darf nicht alleinige Evidenz für einen Damage-/Kill-Strategieanker sein, wenn der Kartentext einen präzisen Damage-Typ enthält.

Erforderlich ist mindestens ein präziseres Signal oder eine präzise Rolle:

```text
damage.corp_tagged_meat_payoff
access.corp_net_damage_ambush
access.corp_brain_damage_ambush
damage.corp_damage_amplifier
corp_ice.brain_damage
corp_ice.net_damage
corp_ice.meat_damage
```

Wenn nur `damage.payoff` vorhanden ist, gilt es als:

```text
legacy
aggregation
supportingEvidence
```

und nicht als alleinige Primär-Evidenz.

---

## 15. Tag-Rollen-Regel

Tag-Semantik muss mindestens diese Fälle trennen:

### 15.1 Initiale Tag-Quelle

Beispiel:

```text
Trace succeeds → give Runner a tag.
```

Rollen / Signale:

```text
tag_source_enabler
trace_tag_source
tag.source
trace.source
```

### 15.2 Tagged-Runner-Payoff

Beispiel:

```text
Play/use only if Runner is tagged.
```

Rollen / Signale:

```text
tag_payoff
punish_payoff
risk.requires_tagged_runner
tag.payoff
```

### 15.3 Tag-Snowball / Additional Tag

Beispiel:

```text
Play only if Runner is already tagged; give additional tags.
```

Rollen / Signale:

```text
tag_snowball_followup
tag_amplifier
tag.additional_tag_source
```

### 15.4 Persistent Tag Source

Beispiel:

```text
wiederkehrender oder dauerhafter Tag-Mechanismus
```

Rollen / Signale:

```text
persistent_tag_source
tag.corp_persistent_source
```

Nur verwenden, wenn der Effekt tatsächlich dauerhaft oder wiederkehrend ist.

### 15.5 Access-Tag-Ambush

Beispiel:

```text
When accessed, give Runner a tag.
```

Rollen / Signale:

```text
access_tag_source
ambush_tag_source
access.corp_tag_ambush
```

Nicht als `persistent_tag_source` modellieren.

### 15.6 Trace-Credit-Enabler

Nur Karten, die Credits oder Ressourcen für Traceversuche liefern.

Beispiele:

```text
Krumz
Hacker Tracker Central
LDL Traffic Analyzers
```

Nicht verwenden für Karten, die selbst `Trace → Tag` machen.

Regel:

```text
tag.source allein darf nicht bedeuten, dass eine Karte sowohl initiale Quelle, Snowball-Effekt als auch Access-Ambush ist.
Die Rolle oder ein präzises Signal muss den Fall unterscheiden.
```

---

## 16. Condition-Präzisionsregel

Condition-Signale dürfen nicht grober sein als der Kartentext, wenn die grobe Fassung die Legalitäts- oder Bewertungslage verändert.

Problematisch:

```text
condition.last_turn_run
```

für eine Karte, die verlangt:

```text
Runner trashed a node last turn.
Runner installed a resource last turn.
Runner attempted two or more runs last turn.
Runner attempted a run this game.
```

Besser:

```text
condition.runner_attempted_run_last_turn
condition.runner_attempted_multiple_runs_last_turn
condition.runner_trashed_node_last_turn
condition.runner_installed_resource_last_turn
condition.runner_attempted_run_this_game
condition.agenda_stolen_last_turn
condition.requires_installed_advanceable_card
```

Wichtig:

```text
Conditions sind keine Strategieanker.
Sie sind Einschränkungen, Voraussetzungen oder Bewertungsfilter.
Eine falsche Condition kann später LegalAction-Bewertung trotz formal read-only Semantik verfälschen.
```

---

## 17. Draw, Economy, Recovery und Hand Size trennen

Draw ist keine Economy im engeren Sinn.

Recovery ist kein Draw.

Hand Size ist kein Score-Effekt, außer der Effekt entsteht tatsächlich durch Agenda-Scoring.

Zu trennen:

```text
economy.*      -> Credits, Kosten, Zahlungsreserven, Credit-Pools
draw.*         -> Karten ziehen
archives.*     -> Archives-Recovery
hq.*           -> HQ-Handfilter, HQ-Recovery, HQ-Reveal
setup.*        -> Aufbau-/Kapazitätseffekte
score.*        -> Agenda-/Score-Kontext
```

Problematisch:

```text
economy.corp_draw
```

wenn die Karte nur Karten zieht.

Besser:

```text
draw.corp_draw
setup.corp_draw
```

Problematisch:

```text
archives.corp_recovery + economy.corp_draw
```

wenn eine Karte nur eine Karte aus Archives in HQ bringt.

Besser:

```text
archives.corp_recovery
hq.corp_card_recovery
```

Problematisch:

```text
score.hand_size
```

auf normalen Nodes/Assets.

Besser:

```text
setup.corp_hand_size
corp.hand_size
```

Regel:

```text
Ein Signal wie economy.corp_draw darf nur als Legacy/Aggregation bleiben, wenn das ausdrücklich dokumentiert ist.
Neue präzise Semantik sollte Draw nicht unter Economy führen.
```

---

## 18. `score.*`-Kontextregel

`score.*`-Signale sind für Agenda-/Scoring-Kontext reserviert.

Nicht verwenden für:

```text
normale installed Assets
Nodes
Hardware
Operations
generische Hand-size- oder Draw-Effekte
```

Ausnahme:

```text
Ein Nicht-Agenda-Effekt wirkt direkt auf Scoring, Scorefenster, Agenda-Punkte oder Advancement-Score-Conversion.
```

Beispiele:

```text
score.hand_size
```

ist passend für eine Agenda, die beim Score Hand Size erhöht.

Für einen normalen Asset/Node mit Hand Size +2 ist besser:

```text
setup.corp_hand_size
```

---

## 19. Advancement-Regel

Advancement-Semantik muss differenzieren:

```text
advance.counter_placement
→ erzeugt neue Advancement-Counter.

advance.counter_transfer / counter_reallocation
→ bewegt vorhandene Counter von Quelle zu Ziel.

advance.counter_bank
→ Karte speichert oder hält Counter.

advance.counter_cashout
→ Counter werden in Credits/Aktionen/sonstige Effekte konvertiert.

advance.overadvance_support
→ Karte kann bewusst zusätzliche Advancement-Counter über Difficulty hinaus unterstützen.

advance.score_window_support
→ Karte kann ein konkretes Scorefenster erleichtern.
```

Nicht verwechseln:

```text
Eine Karte, die Credits abhängig von gestohlenen Agendas bekommt,
ist keine aktive Overadvance-Unterstützung.
```

Condition-Regel:

```text
requires_advancement_counter nur verwenden,
wenn vorhandene Counter tatsächlich Voraussetzung sind.

Karten, die neue Counter hinzufügen,
brauchen eher condition.requires_installed_advanceable_card.
```

TargetProfile-Regel:

```text
Counter-Transfer braucht Quelle und Ziel.
Counter-Placement braucht legale advancebare Ziele.
Counter-Cashout braucht oft Self-Target oder Counter-Anzahl.
```

---

## 20. TargetProfile-vs-Constraint-Regel

Ein TargetProfile ist nur nötig, wenn die KI bei Nutzung einer Karte zwischen legalen Zielen, Modi oder Optionen wählen muss.

Kein TargetProfile bei:

```text
statischen Effekten
globalen Subtyp-Buffs
dauerhaften Discounts
passiven Restrictions
"all walls"
"all code gates"
"all black ice"
```

Diese Fälle gehören in:

```text
Constraints
Scope-/Applicability-Merkmale
Kartensemantik
Subtypdaten
```

Beispiele:

```text
Data Masons:
walls only → Constraint, kein TargetProfile.

Encoder, Inc.:
code gates only → Constraint, kein TargetProfile.

Skälderviken SA Beta Test Site:
black ice only → Constraint, kein TargetProfile.
```

TargetProfile ist dagegen passend bei:

```text
Choose a rezzed ICE.
Trash up to two Resources.
Move counters from one card to another.
Choose installed hardware excluding Cybernetics.
Redirect a run to a fort.
Choose a program to host/install/recover.
```

---

## 21. Access-Ambush-Wirkungspräzision

Ambush ist ein Subtyp oder Funktionskontext, aber die taktische Qualität entsteht aus der konkreten Access-Wirkung.

Erforderlich ist ein präzises Wirkungssignal:

```text
access.corp_net_damage_ambush
access.corp_brain_damage_ambush
access.corp_meat_damage_ambush
access.corp_tag_ambush
access.corp_hardware_trash
access.corp_program_trash
access.corp_counter_punish
access.corp_credit_loss_counter
access.corp_icebreaker_strength_counter
access.corp_runner_program_bounce
```

Oberklassen dürfen bleiben:

```text
remote.ambush
access.punish
damage.payoff
```

aber sie dürfen die konkrete Wirkung nicht ersetzen.

Regel:

```text
Access-Ambush braucht konkrete Access-Wirkung.
Ambush-Subtype allein ist kein Taktiksignal.
```

---

## 22. Counter-Punish-Regel

Counter-Punish braucht nach Möglichkeit ein präzises Ziel-/Wirkungssignal.

Oberklasse:

```text
access.corp_counter_punish
```

Präzisere Varianten:

```text
access.corp_credit_loss_counter
access.corp_icebreaker_strength_counter
access.corp_damage_counter
access.corp_tag_counter
access.corp_runner_action_counter
```

Die Oberklasse darf nicht alleinige Evidenz sein, wenn die konkrete Counter-Wirkung bekannt ist.

Beispiele:

```text
Doppelganger Antibody:
access.corp_credit_loss_counter

Pattel Antibody:
access.corp_icebreaker_strength_counter
```

---

## 23. Strategieanker: Grundregel

Ein Strategieanker darf nur gesetzt werden, wenn die Karte eine größere Decklinie direkt trägt.

Zulässig bei:

```text
dauerhaftem Payoff
starkem Central-Access-Payoff
direktem Score-/Closeout-Effekt
echter Such-/Installationsengine
Survival-Schlüsselkarte
wiederholbarer Engine
Win-Condition
starker und konkreter Tag-/Damage-/Remote-/ICE-Tax-Payoff
```

Nicht zulässig bei:

```text
einfacher Economy
einfachem Draw
generischer Suche
generischer Recovery
einfachem Expose
einmaliger Utility
reinem Tag-Clear
normaler Damage Prevention
reinem Subtyp
reinem Kartentyp
reiner Kartenfamilie
```

Regel:

```text
Support ist nicht automatisch Strategie.
```

---

## 24. Keine Strategie ohne Strategieanker

DeckDoctrine darf aus bloßen Taktiksignalen keine Strategie erfinden.

Ein Deck mit vielen Supportkarten bleibt ankerlos oder neutral, wenn keine echten Strategieanker vorhanden sind.

Beispiel:

```text
Economy + Draw + einfache Breaker + Tag-Clear
```

ergibt keine konkrete Strategie wie:

```text
runner.hq_pressure
runner.rnd_pressure
runner.survival_defense
```

sondern:

```text
NeutralDoctrine mit guten Supportbausteinen.
```

---

## 25. Kartenfamilie ist noch keine Strategie

Eine Gruppe ähnlicher Karten ist nicht automatisch eine Strategy ID.

Beispiele:

```text
Bad-Publicity-Preps
ICE-Control-Preps
Remote-Sabotage-Preps
Expose-Preps
Tag-Clear-Preps
Action-/Tempo-Karten
Trace-Credit-Karten
Access-Ambush-Karten
```

Eine Strategy ID entsteht erst, wenn eine belastbare Decklinie erkennbar ist:

```text
wiederholbare Quellen
Enabler
Payoffs
Abschlussfähigkeit
Deckkohärenz
ausreichende Kartenbasis
```

Bis dahin bleiben solche Familien:

```text
support-only
candidate
deferred
```

Regel:

```text
Thema oder Kartenfamilie reicht nicht für Strategieanker.
```

---

## 26. Strategieanker und Confidence

Ein Strategieanker soll eine Confidence tragen, wenn die Zuordnung nicht eindeutig stark ist.

Beispiele:

```text
high:
Die Karte ist klarer, direkter Payoff der Strategie.

medium:
Die Karte unterstützt oder ermöglicht die Linie, ist aber einmalig, konditional, widerlegbar oder mit starkem Drawback versehen.

low:
Nur diagnostisch oder Kandidat; in der Regel besser deferred.
```

Risiken senken Confidence:

```text
lose-game liability
agenda point cost
temporary liability
random outcome
heavy self-cost
single-use condition
```

---

## 27. Support-only-Evidenzregel

Support-only-Signale dürfen in `supportingEvidence` erscheinen, aber sie dürfen nicht allein eine Strategie erzeugen.

Wenn ein support-only Signal in `strategySupportPairs.evidence` auftaucht, muss klar sein:

```text
Das Signal ist Kontext/Evidenz,
nicht die Ursache des Strategieankers.
```

Besser ist eine Trennung:

```text
primaryAnchorEvidence
supportingEvidence
```

Regel:

```text
mayAnchorStrategy=false bedeutet:
Dieses Signal darf nicht allein eine StrategySupportPair-Zuordnung verursachen.
```

---

## 28. One-shot-Preps und Strategieanker

Preps sind meist One-shot-Effekte. Deshalb ist bei Strategieankern besondere Vorsicht nötig.

Eine Prep kann Strategieanker sein, wenn sie einen starken direkten Payoff erzeugt:

```text
Executive Wiretaps:
HQ-Multiaccess → runner.hq_pressure

Custodial Position:
R&D-Multiaccess → runner.rnd_pressure

Rush Hour:
R&D-Multiaccess mit Restriction → runner.rnd_pressure

Blackmail:
HQ-Run mit direktem Agenda-Punkt-Payoff → runner.hq_pressure / interface_closeout
```

Eine Prep bleibt support-only, wenn sie nur allgemein hilft:

```text
Livewire's Contacts:
Economy

Jack 'n' Joe:
Draw

Hunt Club BBS:
Expose

Open-Ended Mileage Program:
Tag-Clear

Gideon's Pawnshop:
generische Recovery
```

Regel:

```text
One-shot allein ist kein Ausschlussgrund, aber die Hürde für Strategieanker ist höher.
```

---

## 29. Interface-Closeout sauber verstehen

Wenn eine Strategy ID wie `runner.interface_closeout` verwendet wird, muss klar sein, ob sie wörtlich Interface-Karten meint oder allgemein zentrale Zugriffseffekte als Abschlusswerkzeug.

Wenn sie allgemein gemeint ist, dürfen auch Prep-Multiaccess- oder Score-Closeout-Karten darunter fallen.

Wenn sie eng gemeint ist, sollten nur echte Interface- oder Interface-artige dauerhafte Access-Payoffs darunter fallen.

Regel:

```text
Strategienamen dürfen nicht missverständlich verwendet werden.
Bei uneindeutigem Strategienamen muss die Rationale erklären, ob der Effekt oder der Kartentyp gemeint ist.
```

---

## 30. LegalActions bleiben Engine-Sache

Taktiksignale erzeugen keine Legalität.

Die Engine entscheidet, welche Aktionen legal sind. Die KI bewertet nur legal angebotene Aktionen.

Daraus folgt:

```text
Taktiksignal ≠ Aktion
Strategieanker ≠ Aktion
TargetProfile ≠ Legalität
Condition ≠ Legalität
```

Eine gute Kartensemantik wird erst handlungswirksam, wenn die Action-Semantik-Brücke vorhanden ist:

```text
LegalAction
+ Quelle
+ konkrete Ability
+ Kosten
+ Timing
+ Ziele
+ Boardstate
+ Kartensemantik
= semantisch verstandener Aktionskandidat
```

---

## 31. Prüflogik für neue Taktiksignale

Vor Einführung eines neuen Taktiksignals müssen diese Fragen geprüft werden:

```text
1. Beschreibt das Signal eine Funktion statt Typ/Subtyp/Name?
2. Ist die Funktion wiederverwendbar?
3. Gibt es mehrere Karten oder wiederkehrende Spielsituationen dafür?
4. Gibt es bereits ein bestehendes Signal mit gleicher Bedeutung?
5. Ist das Signal präzise genug?
6. Ist das Signal nicht zu speziell für eine einzelne Karte?
7. Bleibt Hidden Information geschützt?
8. Wird keine Legalität erzeugt?
9. Wird keine Strategie aus Support erfunden?
10. Ist der Signalname in seiner Wirkungsrichtung korrekt?
11. Ist der Präfix eindeutig?
12. Ist klar, ob das Signal Oberklasse, Legacy oder konkrete Funktion ist?
13. Ist der konkrete Damage-/Tag-/Condition-/Targeting-Fall richtig getrennt?
```

Wenn eine Frage negativ beantwortet wird, soll kein neues Signal entstehen.

---

## 32. Prüflogik für Strategieanker

Vor Vergabe eines Strategieankers müssen diese Fragen geprüft werden:

```text
1. Trägt die Karte eine größere Decklinie direkt?
2. Ist sie Payoff, Engine, Enabler, Schlüsselkarte oder Win-Condition?
3. Ist der Effekt stark genug, um mehr als Support zu sein?
4. Ist die Strategie-ID bereits vorhanden und fachlich passend?
5. Wird keine neue Strategie-ID aus einer bloßen Kartenfamilie erfunden?
6. Ist die Rolle innerhalb der Strategie klar?
7. Ist die Confidence angemessen?
8. Sind Bedingungen und Drawbacks berücksichtigt?
9. Ist die Karte nicht nur generische Economy, Draw, Search, Recovery oder Utility?
10. Ist die Zuordnung durch Kartentext und nicht nur durch Thema/Name/Subtyp begründet?
11. Ist die Strategie-ID semantisch breit genug für die Karte oder wird sie überdehnt?
12. Stimmt die Rolle mit dem konkreten Damage-/Tag-/Access-/Economy-Typ überein?
```

---

## 33. Anwendung auf Runner-Hardware

### 33.1 Memory-Hardware

Funktion:

```text
Erhöht MU / Programmkapatität.
```

Signal:

```text
setup.memory
```

Nicht nötig:

```text
setup.memory_chip
hardware.chip
```

---

### 33.2 Chip-Hardware

Der Subtyp Chip ist kein einheitlicher taktischer Nutzen.

Beispiele:

```text
Tycho Mem Chip → setup.memory
WuTech Mem Chip → setup.memory
Zetatech Mem Chip → setup.memory

Corolla Speed Chip → economy.recurring_killer_credit
ZZ22 Speed Chip → economy.recurring_killer_credit

MRAM Chip → setup.hand_size
Militech MRAM Chip → setup.hand_size

Eurocorpse Spin Chip → setup.program_host + TargetProfile
```

Kein generisches Signal:

```text
hardware.chip
```

---

### 33.3 Vehicle-Hardware

Vehicle ist ein Subtyp, kein Setup-Ziel.

Beispiele:

```text
Armadillo Armored Road Home:
economy.recurring_tag_clear_credit
defense.meat_damage_prevention

Drifter Mobile Environment:
economy.recurring_tag_clear_credit

Nasuko Cycle:
defense.tag_prevention
```

Nicht nötig:

```text
setup.vehicle
```

---

### 33.4 Cybernetics-Hardware

Cybernetics muss als Subtyp erkennbar sein, vor allem wegen Targeting-/Schutzlogik.

Aber:

```text
setup.cybernetics
hardware.cybernetics
```

sind keine funktionalen Taktiksignale.

Funktionale Signale nach Kartentext:

```text
setup.hand_size
defense.meat_damage_prevention
defense.net_damage_prevention
defense.brain_damage_prevention
defense.damage_recovery_draw
setup.memory
economy.recurring_breaker_credit
```

---

### 33.5 Deck-Hardware

Deck ist ein Subtyp. Aber Decks haben zusätzlich eine echte Exklusivitätsregel:

```text
Only one deck can be in play at a time. Trash any older decks.
```

Diese Regel kann als Constraint oder funktionales Setup-Konfliktsignal modelliert werden:

```text
constraints.deck_exclusive
constraints.unique_deck_slot
setup.deck_exclusive
```

Nicht ausreichend:

```text
hardware.deck
```

Funktionale Deck-Effekte müssen separat modelliert werden:

```text
setup.memory
setup.hand_size
economy.recurring_breaker_credit
economy.recurring_link_credit
economy.recurring_non_noisy_breaker_credit
defense.net_damage_prevention
defense.meat_damage_prevention
run.extra_run_after_success
```

---

## 34. Anwendung auf Runner-Preps

### 34.1 Run-Preps

Run-Preps brauchen Struktur- und Wirkungssignale.

Struktur:

```text
run.make_run
run.any_server
run.server_specific_hq
run.server_specific_rnd
run.server_specific_remote
run.event_tempo
```

Wirkung:

```text
access.hq_multiaccess
access.rnd_multiaccess
run.bypass_first_ice
run.bypass_chosen_ice
run.followup_run
score.conditional_agenda_point
ice.trash_rezzed
fort.all_rezzed_ice_trash
```

Regel:

```text
Keine Run-Prep nur mit Struktur-Signal bewerten, wenn der Kartentext einen konkreten Payoff enthält.
```

---

### 34.2 Economy-Preps

Einfache Economy bleibt support-only.

Signale:

```text
economy.burst_credit
economy.conditional_burst_credit
economy.high_risk_burst_credit
economy.run_restricted_credit
```

Risiken ergänzen:

```text
risk.self_tag
risk.self_brain_damage
risk.random_economy
risk.hand_trash_cost
```

---

### 34.3 Search-/Recovery-Preps

Generische Suche oder Recovery ist support-only.

Signale:

```text
setup.card_search
setup.card_recovery
setup.stack_filter
setup.stack_reorder
```

Ein Strategieanker `runner.search.breaker` ist nur gerechtfertigt, wenn die Karte eng genug auf Programme/Breaker/Installationslinien wirkt.

---

### 34.4 Expose-/Scouting-Preps

Expose ist grundsätzlich support-only.

Signale:

```text
info.expose
info.expose_multiple
info.expose_outermost_ice
info.run_recon
info.ice_approach_expose
```

Kein Strategieanker allein durch Scouting.

---

### 34.5 Bad-Publicity-Preps

Bad Publicity kann eine erkennbare Kartenfamilie sein.

Aber solange keine belastbare Runner-Strategie-ID vorhanden ist, bleibt sie:

```text
support-only
candidate
deferred
```

Keine automatische neue Strategy ID.

---

### 34.6 ICE-Control- und Sabotage-Preps

Diese Karten sind echte taktische Werkzeuge, aber nicht automatisch Strategieanker.

Signale:

```text
ice.trash_rezzed
ice.trash_unrezzed
ice.rez_or_trash_choice
ice.derez
ice.derez_black_ice
fort.reorder_ice
fort.all_rezzed_ice_trash
```

Wenn eine Karte ICE-Sabotage ausführt, darf `tacticSignals` nicht leer bleiben.

---

## 35. Anwendung auf Corp-Agendas

### 35.1 Agenda-Score-Kontext

`score.*`-Signale sind hier passend, wenn sie Effekte beim Scoren, Agenda-Punkte, Difficulty, Overadvance oder Scorefenster beschreiben.

Beispiele:

```text
score.agenda_difficulty_discount
score.overadvance_bonus
score.overadvance_scaling
score.economy_burst
score.free_rez_ice
score.remote_fort_creation
score.tagged_meat_damage_payoff
score.net_damage_access_punish
```

### 35.2 Overadvance vs. Fast Advance

Overadvance ist nicht automatisch Fast Advance.

```text
Fast Advance:
schnelleres oder leichteres Scoring.

Overadvance:
Payoff für zusätzliche Advancement-Investition über Difficulty hinaus.
```

Overadvance darf nur dann an `corp.fast_advance` hängen, wenn die Taxonomie ausdrücklich festlegt, dass Overadvance-Payoffs Teil dieser Linie sind.

Sonst:

```text
support/candidate/deferred
```

oder spätere eigene Strategieentscheidung.

### 35.3 Bad Publicity

Bad Publicity ist eine Kartenfamilie und Risiko-/Pressure-Linie, aber nicht automatisch Strategy ID.

---

## 36. Anwendung auf Corp-ICE

### 36.1 Vanilla ETR

Ein einzelnes End-the-run ist support-only.

```text
corp_ice.end_run
```

ist kein Strategieanker.

### 36.2 Multi-ETR

`corp_ice.multi_end_run` nur setzen, wenn tatsächlich mehrere ETR-Subroutinen vorhanden sind oder eine Fähigkeit mehrere ETR erzeugt.

Kartentext prüfen; Cluster reicht nicht.

### 36.3 Program-Trash

Program-Trash ist nicht automatisch Glacier.

Anchorfähig erst bei besonderer Härte:

```text
mehrfacher Program-Trash
Program-Trash plus Run-Lock
Program-Trash plus Brain Damage
Program-Trash als wiederkehrender Run-Zwang
besonders harte Pay-or-Trash-Tax
```

Einfaches:

```text
Trash a program.
End the run.
```

ist grundsätzlich support/tax function, nicht automatisch Strategieanker.

### 36.4 Damage-ICE

Damage-ICE braucht Damage-Typ:

```text
corp_ice.net_damage
corp_ice.meat_damage
corp_ice.brain_damage
corp_ice.damage_source
```

`damage.payoff` darf nicht die Typ-Signale ersetzen.

### 36.5 `corp_ice.other_utility`

`corp_ice.other_utility` ist nur Fallback.

Sobald ein präzises Signal möglich ist, muss es ersetzt werden.

Beispiele:

```text
Zombie:
brain_damage + end_run
nicht other_utility.

Shock.r:
next_ice_break_lock + jackout_lock
nicht other_utility.

Coyote:
future_strength_buff + rez_economy
nicht other_utility.
```

### 36.6 Rez-paid vs. Encounter-paid vs. Maintenance

Diese Funktionen sind getrennt:

```text
corp_ice.rez_paid_scaling
→ X beim Rezzen.

corp_ice.encounter_paid_subroutine_add
→ Zahlung während Encounter erzeugt Subroutine.

corp_ice.self_bounce_or_maintenance_drawback
→ Pay-or-uninstall / self-bounce / maintenance cost.

corp_ice.optional_self_bounce_gain
→ optionaler Bounce/Gain nach Passieren.
```

Nicht vermischen.

### 36.7 Trace-Fälle

Zu trennen:

```text
Trace → Tag
Trace → End the run
Trace → Run-Lock
Trace-Credit-Support
```

Beispiel:

```text
Hunter / Fetch:
Trace -> Tag.

Asp / Fang / Rex:
Trace -> ETR + Run-Lock, kein Tag.

Hacker Tracker Central:
Trace-Credit-Support, keine Tagquelle.
```

### 36.8 Jackout-Lock und Action-Loss

Jackout-Lock, Jackout-Tax und Action-Loss sind getrennt:

```text
corp_ice.jackout_lock
corp_ice.jackout_tax
corp_ice.runner_action_loss
corp_ice.run_lock
```

Nicht alles als `run_lock` oder `other_utility` ablegen.

---

## 37. Anwendung auf Corp-Operations

### 37.1 Operations-Subtypen

Keine Signale wie:

```text
corp.operation
operation.black_ops
operation.gray_ops
operation.transactions
operation.scorched_earth
```

Subtypen bleiben Kartendaten.

### 37.2 Draw/Economy/Recovery

```text
Annual Reviews:
draw.corp_draw

Day Shift / Night Shift:
draw.corp_draw + economy.corp_credit_burst

Off-Site Backups:
archives.corp_recovery / hq.corp_card_recovery
kein draw-Signal

Closed Accounts:
economy.runner_credit_loss / tag.runner_credit_punish
kein corp-credit-gain
```

### 37.3 Conditions

Operation-Conditions müssen textgenau sein:

```text
Audit of Call Records:
condition.runner_attempted_multiple_runs_last_turn

Chance Observation:
condition.runner_attempted_run_last_turn

Data Sifters:
condition.runner_trashed_node_last_turn

Underworld Mole:
condition.runner_installed_resource_last_turn

Schlaghund Pointers:
condition.runner_attempted_run_this_game
```

### 37.4 Advancement-Operations

Unterscheiden:

```text
Counter-Erzeugung
Counter-Transfer
Overadvance-Support
Score-Window-Support
```

Nicht alle Advancement-Karten brauchen:

```text
requires_advancement_counter
requires_score_window
```

### 37.5 ICE-Rez-Operations

Unterscheiden:

```text
ice.corp_free_rez
ice.corp_temporary_rez
ice.corp_deferred_rez
risk.temporary_rez_liability
risk.deferred_rez_payment_liability
```

Emergency Rig ist temporary.

Rent-to-Own ist deferred/installment, nicht normales temporary.

---

## 38. Anwendung auf Corp-Nodes/Assets

### 38.1 Nodes/Assets-Subtypen

Keine Signale wie:

```text
corp.node
corp.asset
node.ai
node.ambush
node.virus
asset.campaign
node.transactions
```

Subtypen bleiben Kartendaten.

### 38.2 Access-Ambush

Access-Ambush braucht konkrete Access-Wirkung:

```text
Setup!:
access.corp_net_damage_ambush

TRAP!:
access.corp_net_damage_ambush
access.corp_tag_ambush

Vacant Soulkiller:
access.corp_brain_damage_ambush

Virus Test Site:
access.corp_net_damage_ambush

Experimental AI:
access.corp_program_trash

Corprunner's Shattered Remains:
access.corp_hardware_trash

Doppelganger Antibody:
access.corp_credit_loss_counter

Pattel Antibody:
access.corp_icebreaker_strength_counter
```

### 38.3 Statische ICE-Support-Assets

Data Masons, Encoder, Inc. und Skälderviken SA Beta Test Site haben keine Zielwahl. Sie brauchen Constraints, keine TargetProfiles.

```text
Data Masons:
constraint only_walls
ice.corp_rez_discount
ice.corp_strength_support

Encoder, Inc.:
constraint only_code_gates
ice.corp_rez_discount
ice.corp_subroutine_support

Skälderviken:
constraint only_black_ice
ice.corp_rez_discount
```

### 38.4 Corp-Installed-Economy

Installed Economy muss präziser als nur “drip” modelliert werden, wenn möglich:

```text
campaign drip
counter bank
charge bank
counter cashout
multi-action credit
asset cashout
temporary run credit
install/rez credit
```

Generische Signale wie `economy.corp_installed_credit_drip` dürfen nicht alles ersetzen.

### 38.5 Installed Card Bounce

Uninstall/store-in-HQ ist keine Archives-Recovery.

```text
Cowboy Sysop:
hq.corp_installed_card_bounce
install.corp_uninstall_to_hq
```

nicht:

```text
archives.corp_recovery
```

### 38.6 HQ/R&D-Refresh vs. Topdeck Setup

HQ in R&D shufflen und anschließend ziehen ist Hand-Refresh, kein kontrolliertes Topdeck-Setup.

```text
Rescheduler:
hq.corp_hand_refresh
rnd.corp_shuffle_hq_into_rnd
draw.corp_draw
```

nicht:

```text
rnd.corp_topdeck_setup
```

---

## 39. Mindestanforderungen an Review-Reports

Ein Semantik-Review soll mindestens enthalten:

```text
Scope
Out-of-Scope
Inventarcounts
geprüfte aktive Karten
geprüfte inaktive Karten
Count-Abweichungen
Clusterübersicht
neue Taktiksignale
geänderte Taktiksignale
entfernte Taktiksignale
verbotene Typ-/Subtyp-Signale
Strategieanker
strategySupportPairs
primaryAnchorEvidence
supportingEvidence
TargetProfile-Status
Deferred Items
Post-Review-Kartenliste
Hidden-Info-Review
Verifikation
bekannte Risiken
Folgeempfehlungen
```

Zusätzlich wichtig:

```text
Repo-Wahrheit dokumentieren, wenn Prompt/Spoiler/Repo abweichen.
Keine Count-Abweichung ungeklärt lassen.
Bei verschiedenen Count-Metriken die Begriffe sauber trennen.
```

Beispiele:

```text
newCatalogSignals
activeCardSignals
compiledSignals
changedExistingSignals
strategySupportPairCount
requiredSignals
removedSubtypeSignals
activeTestCards
inactiveClassicCards
```

---

## 40. Test-/Fixture-Karten-Regel

Aktive Test-, Fixture- oder V08-Karten dürfen als Repo-Wahrheit geprüft werden, müssen aber in Reports getrennt ausgewiesen werden.

Reports sollen trennen:

```text
productionOriginalset
productionProteus
activeTestOrFixture
inactiveClassic
```

StrategySupportPairs auf Testkarten müssen als testOnly/fixtureOnly erkennbar sein oder aus produktiven Aggregationen ausgeschlossen werden.

Regel:

```text
Testkarten dürfen Semantik-Checks bestehen, aber nicht unbemerkt Produktions-DeckDoctrine oder Produktions-Taxonomiegewichte verfälschen.
```

---

## 41. Mindestanforderungen an Invariant Checks

Checks sollten mindestens prüfen:

```text
Alle aktiven Karten im Scope sind abgedeckt.
Alle verwendeten Taktiksignale sind katalogisiert.
Keine verbotenen Typ-/Subtyp-only-Signale werden verwendet.
Support-only-Signale erzeugen keine Strategy IDs.
Keine neuen Strategy IDs ohne ausdrückliche Entscheidung.
StrategySupportPairs sind konsistent.
primaryAnchorEvidence und supportingEvidence sind plausibel getrennt.
Keine Planner-/ActionScore-/PlanWeight-/Engine-/Legalitätswirkung entsteht.
Keine Corp-Strategie wird aus Runner-Karten abgeleitet.
Keine generische runner.prep-, runner.hardware-, corp.operation-, corp.node- oder corp.asset-Strategie entsteht.
TargetProfiles bleiben side-safe.
Hidden-Info-Policy bleibt gewahrt.
```

Für Damage zusätzlich:

```text
Net/Meat/Brain Damage werden nicht verwechselt.
damage.payoff steht nicht allein, wenn präziser Damage-Typ bekannt ist.
Strategy-Rollen entsprechen dem tatsächlichen Damage-Typ.
```

Für Tags zusätzlich:

```text
Trace-Credit-Enabler werden nicht mit Trace-Tag-Quellen verwechselt.
Access-Tag-Ambush ist nicht persistent_tag_source.
Tag-Snowball ist nicht initiale Tagquelle.
```

Für Conditions zusätzlich:

```text
condition.last_turn_run wird nicht für spezifischere Bedingungen missbraucht.
requires_advancement_counter nur, wenn vorhandene Counter Voraussetzung sind.
```

Für TargetProfiles zusätzlich:

```text
Statische Constraints erzeugen keine TargetProfiles.
TargetProfiles nur bei echter Ziel-/Modus-/Optionswahl.
```

Für Testkarten zusätzlich:

```text
Test-/V08-Karten sind getrennt reportet.
Testkarten verfälschen keine Produktionsaggregation.
```

---

## 42. Check-Regel für Nachkorrekturen

Ein Cleanup-Check soll die fachliche Zielkorrektur explizit prüfen.

Ein reiner Wrapper, der nur einen bestehenden Check importiert, ist nur dann ausreichend, wenn der bestehende Check selbst nachweislich alle neuen Invarianten enthält.

Besser ist ein eigener Check mit expliziten Assertions:

```text
Verbotene Signale fehlen.
Erwartete Funktionssignale bleiben erhalten.
Falsche Signale wurden entfernt.
Strategieanker bleiben begrenzt.
TargetProfiles bleiben begrenzt.
No-effect-Flags bleiben false.
Count-Metriken sind plausibel.
```

Regel:

```text
Nachkorrekturen brauchen explizite Prüfungen für den korrigierten Mangel.
```

---

## 43. Entscheidungsbaum

```text
1. Ist es nur Typ, Subtyp, Name oder Thema?
   → Kartendaten / Subtypen / Traits, kein Taktiksignal.

2. Wirkt eine Regel auf diesen Typ oder Subtyp?
   → Constraint-/Targeting-Merkmal prüfen.

3. Hat die Karte eine wiederverwendbare taktische Funktion?
   → Taktiksignal vergeben.

4. Hat die Karte einen konkreten Damage-, Tag-, Draw-, Economy-, Recovery-, Access- oder Condition-Typ?
   → Präzises Signal statt Oberklasse verwenden.

5. Hat die Karte zusätzlich relevante Bedingungen, Kosten oder Risiken?
   → Risiko-/Constraint-/Bedingungssignale ergänzen.

6. Gibt es eine echte Ziel-, Modus- oder Optionswahl?
   → TargetProfile prüfen.

7. Ist es nur statischer Geltungsbereich?
   → Constraint, kein TargetProfile.

8. Trägt die Karte eine größere Decklinie direkt?
   → Strategieanker mit Rolle prüfen.

9. Ist die Karte nur Support?
   → Kein Strategieanker.

10. Gibt es keine passende Strategie-ID?
   → Candidate/deferred dokumentieren, keine neue ID erzwingen.

11. Ist die spätere Action-Wirkung ohne LegalAction-Semantik-Brücke nicht sicher?
   → Keine Plannerwirkung, nur read-only Semantik.

12. Ist die Nachkorrektur nur Löschung?
   → Pro Karte prüfen, ob die funktionale Semantik vollständig bleibt.
```

---

## 44. Qualitätsmaßstab

Eine gute Semantik ist nicht maximal detailliert, sondern nützlich, kontrolliert und belastbar.

Gute Taktiksignale sind:

```text
funktional
wiederverwendbar
präzise
nicht redundant
nicht rein beschreibend
side-safe
nicht strategisch übergriffig
durch Kartentext begründet
mit klarer Wirkungsrichtung
mit eindeutigem Präfix
mit korrektem Damage-/Tag-/Condition-Typ
```

Gute Strategieanker sind:

```text
selten
begründet
rollenbezogen
konfidenzbewertet
durch Decklinienlogik gedeckt
nicht aus bloßem Support abgeleitet
nicht aus bloßer Kartenfamilie abgeleitet
mit korrekter konkreter Rolle
```

Gute TargetProfiles sind:

```text
nur bei echter Ziel-/Optionswahl vorhanden
side-safe
nicht regelsetzend
nicht für statische Constraints missbraucht
mit LegalAction-Zieloptionen kompatibel
```

---

## 45. Kurzform der Leitplanken

```text
Taktiksignale beschreiben Funktion, nicht Form.

Subtypen gehören in Kartendaten, nicht in Taktiksignale.

Effekte auf Subtypen brauchen erkennbare Subtypen, aber nicht automatisch Signale.

Wenn Subtyp-Signale entfernt werden, müssen funktionale Signale erhalten bleiben.

Kartentext schlägt Name, Subtyp, Cluster und historische Hintbegriffe.

Run-Struktur ist nicht gleich Run-Payoff.

Positive Effekte und Drawbacks getrennt modellieren.

Signalnamen müssen die Wirkungsrichtung korrekt ausdrücken.

Signalpräfixe müssen eindeutig sein.

Keine Synonym-Wucherung.

Generische Oberklassensignale dürfen präzise Funktionssignale nicht ersetzen.

damage.payoff darf präzise Damage-Typen nicht ersetzen.

Net, Meat und Brain Damage nie vermischen.

Tag-Quelle, Tag-Payoff, Tag-Snowball, Persistent Tag und Access-Tag-Ambush trennen.

Conditions müssen textgenau sein.

Draw, Economy, Recovery und Hand Size trennen.

score.* bleibt Agenda-/Score-Kontext.

Advancement-Counter-Erzeugung, Transfer, Bank, Cashout und Overadvance trennen.

TargetProfiles nur bei echter Ziel-/Optionswahl.

Statische Scope-Regeln sind Constraints, keine TargetProfiles.

Access-Ambush braucht konkrete Access-Wirkung.

Counter-Punish braucht konkrete Counter-Wirkung.

Corp-Tempo ist nicht automatisch Fast Advance.

Vanilla ETR ist kein Strategieanker.

Program-Trash-ICE ist nicht automatisch Glacier.

corp_ice.other_utility ist nur Fallback.

Support ist keine Strategie.

Kartenfamilie ist keine Strategie.

Keine Strategie ohne Strategieanker.

Strategieanker nur für echte Anker, Payoffs, Engines, Enabler oder Schlüssel-/Survivalkarten.

Action-Economy braucht eigene klare Taxonomie und ist nicht automatisch Credit-Economy.

Hosting braucht TargetProfile oder Constraint-Semantik.

TargetProfiles sind Zielwahlhilfen, keine Taktiksignale.

Taktiksignale erzeugen keine Legalität.

Die Engine bleibt Regelautorität.

Neue Semantik bleibt read-only, bis die Action-Semantik-Brücke zuverlässig vorhanden ist.

Nachkorrektur-Checks müssen die korrigierte Fachregel explizit prüfen.

Test-/V08-Karten müssen getrennt reportet werden.
```
