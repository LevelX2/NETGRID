# AI-Derived Basic Facts Gap Triage

Datum: 2026-05-25

## Kurzfazit

Die neun vom Gate markierten Manual-Overlay-/Descriptor-Lücken wurden fachlich geschnitten. Drei Lücken sind geschlossen: `Netwatch Operations Office`, `Viral 15` und `Closed Accounts`. Zusätzlich wurden mechanische Target-Details für `Self-Modifying Code` und `Mystery Box` sowie die Access-Bedingung für `Red Herrings` im read-only Report präzisiert.

Das Gate bleibt read-only. Es gibt keine Engine-Regeländerung, keine Strategieänderung, keine Planerwirkung, keine Runtime-Nutzung der Derived Facts, keine Consumer-Anbindung und keine Änderung an `aiSupportStatus`.

## Kennzahlen

Vorher:

- Harte Errors: 0
- Warnings: 56
- Karten mit Manual-Overlay-/Descriptor-Bedarf: 9
- Manual/generated Mismatches: 12

Nachher:

- Harte Errors: 0
- Warnings: 49
- Karten mit Manual-Overlay-/Descriptor-Bedarf: 6
- Manual/generated Mismatches: 8

## Karten

### Japanese Water Torture

Aktueller Gap: `breaker` und `breakerCoverage:wall` sind ableitbar. `forgo_actions` ist nur aus Kartentext/Kommentar sichtbar, nicht als strukturierter Resolver-Descriptor.

Entscheidung: Descriptor-Gap, bewusst offen.

Änderung: keine. Die Break-Legalität bleibt unverändert. Ein späterer Descriptor sollte die Future-Action-Debt mechanisch ausdrücken, damit die Ableitung nicht auf Textscan angewiesen ist.

### Self-Modifying Code

Aktueller Gap: `search` und `requires_during_run` sind ableitbar. Zieltyp, Stack-Zone und Install-Ziel waren im Report bisher nicht sichtbar.

Entscheidung: Derived-Facts-Verbesserung plus verbleibender Schema-Gap.

Änderung: Der Report enthält jetzt `targetProfiles` mit `zone: "stack"`, `targetCardType: "program"`, `installsTarget: true`, `installCost: "normal"` und `shuffleAfterwards: true`. `install_discount` wird nicht künstlich aus `installCost: "normal"` erzeugt.

### Mystery Box

Aktueller Gap: Search, Topdeck-Info, Install und During-Run sind ableitbar; Top-five und Programmtarget waren zu grob.

Entscheidung: Derived-Facts-Verbesserung plus verbleibender Schema-Gap.

Änderung: Der Report enthält jetzt `targetProfiles` mit `zone: "stack_top"`, `lookCount: 5`, `targetCardType: "program"`, `installsTarget: true`, `installCost: "free"` und `shuffleAfterwards: true`. Das ersetzt keine strategischen Hints und wird nicht konsumiert.

### Deep Thought

Aktueller Gap: `topdeck_info` ist mechanisch ableitbar. `requires_rnd_pressure` und die konkrete Pressure-Line bleiben strategische Bewertung.

Entscheidung: bewusst manuelles Overlay.

Änderung: keine. Der mechanische Counter-/Threshold-Pfad ist komplex genug, dass der jetzige Gate-Slice keine zusätzliche Bedingung erzwingt.

### Netwatch Operations Office

Aktueller Gap: Die Implementation erzeugt mechanisch Trace und Tag-Quelle; das manuelle Hint hatte zusätzlich den Legacy-Effekt `tag`.

Entscheidung: Vergleichsmismatch geschlossen.

Änderung: Der Gate-Vergleich wertet generated `tag_source` als mechanische Abdeckung für manuelles `tag`. Die Hintdaten bleiben unverändert, und es entsteht keine neue scored-agenda Consumer-Logik.

### Viral 15

Aktueller Gap: `future_run_effect`, `program_trash` und `requires_during_run` waren ableitbar; Jack-out-Tax war nur manuell vorhanden.

Entscheidung: Derived-Facts-Verbesserung.

Änderung: Der Deriver erkennt `run_duration_jack_out_cost` jetzt als `run_tax` mit `amount: 1`. Ein eigenes `jack_out_tax`-Ontology-Feld wurde nicht eingeführt, weil die bestehende Known-List für den aktuellen read-only Vergleich reicht.

### Crystal Palace Station Grid

Aktueller Gap: `run_tax` und `remoteRole:run_tax` sind mechanisch. `remote_protection` ist eine kontextuelle strategische Folgerung.

Entscheidung: bewusst manuelles Overlay.

Änderung: keine. Die Crystal-Palace-Denylist gegen Economy-/Counter-Fehlklassifikation bleibt erhalten.

### Red Herrings

Aktueller Gap: `run_tax` und `remoteRole:agenda_steal_tax` sind ableitbar. `requires_accessed_card` war im Report nicht abgeleitet; `remote_protection` bleibt strategisch.

Entscheidung: Derived-Facts-Verbesserung plus bewusstes manuelles Overlay.

Änderung: Der Deriver setzt `steal_cost` jetzt als `on_access`/`accessed_card` und ergänzt `requires_accessed_card`. `remote_protection` wird nicht mechanisch überdehnt.

### Closed Accounts

Aktueller Gap: `counter_economy`, `tag_punish_payoff` und `requires_runner_tagged` sind mechanisch ableitbar; `counter_economy` fehlte im manuellen Hint.

Entscheidung: kleine Hint-Korrektur.

Änderung: `data/ai/ai-card-hints-active.json` spiegelt `counter_economy` für `Closed Accounts`. Es gibt keine Tag/Punish-Consumer-Änderung und keine LegalAction-Erzeugung.

## Bewusst Nicht Geändert

- Keine CardImplementation-Logik.
- Keine Engine-Regeln.
- Keine AI-Strategie, Planner, Profile oder Consumer.
- Keine neuen Decks.
- Keine Runtime-Nutzung der Derived Facts.
- Keine Änderung an `aiSupportStatus`.
- Keine Holdout-Optimierung.
- Keine Ontology-/Known-List-Erweiterung.

## Nächster Schritt

Der nächste praktische Schritt ist ein kleiner Descriptor-Slice für die sechs verbleibenden offenen Karten. Priorität haben strukturierte Resolver-Descriptoren für `Japanese Water Torture` und ein klares Schema für Search-/Install-Targetprofile, bevor irgendeine Compiler- oder Consumer-Pipeline geplant wird.
