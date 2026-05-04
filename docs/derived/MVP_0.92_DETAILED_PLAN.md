# MVP 0.92 Detailed Plan - Mechanik-Inventar und M1-Spezifikation

Status: detaillierte Planungsfassung, keine Engine-, UI-, Server-, KI- oder Testimplementierung
Stand: 2026-05-03

## 1. Kurzentscheidung

V0.92 ist ein reines Planungs- und Requirements-Gate. Es konsolidiert den aktuellen Mechanikstand, räumt die Abweichungslisten auf und friert das Konzept für das allgemeine Timing-, Ability- und Effect-Fundament ein. V0.92 verändert kein Laufzeitverhalten.

Die wichtigste Produktentscheidung lautet: V0.92 darf die Mechanikarbeit fachlich von V0.91 trennen, muss aber den widersprüchlichen V0.91-Status sichtbar machen. Der Kartenbild-Asset-Stand ist kein fachlicher Blocker für Mechaniken, darf aber nicht stillschweigend als erledigt oder als dauerhaft blockiert doppelt geführt werden.

Nachtrag vom 2026-05-03: Der Benutzer erlaubt für dieses private lokale Projekt die Nutzung eigener privater Kartenscans und lokaler Kartenbilder. Diese Entscheidung gilt nur für den Privatgebrauch und nicht für öffentliche Distribution, offizielle Logos, offizielle Card Frames, Card Backs oder externe Kartendatenbank-Abhängigkeiten.

## 2. Arbeitsbasis

Verbindliche Grundlage:

- `docs/derived/MECHANICS_COMPLETION_PLAN.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/derived/DEVIATION_REGISTRY.md`
- `docs/derived/GAME_STATE_MODEL.md`
- `docs/derived/TIMING_AND_RUN_MODEL.md`
- `docs/derived/MVP_0.8_FINAL_REVIEW.md`
- `docs/derived/MVP_0.9_FINAL_REVIEW.md`
- `docs/source/Netrunner_MVP_0.1_Konsolidiertes_Konzept_geprueft.md`
- `docs/source/Null_Signal_Games_Netrunner_Comprehensive_Rules_v26.03.pdf` nur als Regelreferenz, nicht als Scope-Erweiterung

Zusätzlich zu prüfen, aber nicht unbesehen als Spezifikation zu übernehmen:

- uncommitted oder lokale V0.91-Artefakte zu Kartenbildern
- alte Konzeptdateien, Zwischenstände und historische Prompts

## 3. Ziele

V0.92 soll folgende Ergebnisse liefern:

- eine normalisierte, versionierte Mechanik-Coverage-Matrix,
- eine bereinigte Sicht auf gelöste, teilweise gelöste, offene und bewusst verschobene Regelabweichungen,
- ausführbare Anforderungen für das M1-Fundament: Timing, Abilities, Effects, Costs, Targets, Choices, Modifikatoren und Eventklassifikation,
- eine Testmatrix für V0.93, bevor Code geschrieben wird,
- eine klare Übergabegrenze: V0.93 implementiert M1, V0.94 und später implementieren konkrete Mechanikgruppen wie Damage, Resources oder Trace.

## 4. Nicht-Ziele

V0.92 implementiert ausdrücklich nicht:

- neue Kartenmechaniken,
- neue spielbare Karten,
- Damage, Trace, Resources, Mulligan, Multiaccess oder Identitätsfähigkeiten,
- vollständige offizielle Timing-Priorität,
- Freitextinterpretation von Kartentexten,
- UI-Umbauten,
- Server- oder Multiplayer-Verhalten,
- KI-Strategieänderungen.

## 5. Geplante Artefakte

V0.92 sollte diese neuen oder aktualisierten Artefakte erzeugen:

| Artefakt | Pflicht | Zweck |
|---|---:|---|
| `docs/derived/MVP_0.92_REQUIREMENTS.md` | ja | Exekutable Must/Should/Could-Anforderungen für M0 und M1. |
| `docs/derived/MECHANICS_COVERAGE_MATRIX.md` | ja | Menschlich lesbares Mechanik-Inventar mit Status, Risiko, Quellen und Folgegate. |
| `data/rules/mechanics-coverage-0.92.json` | empfohlen | Maschinenlesbare Matrix für spätere Coverage- und Statuschecks. |
| `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md` | ja | Detailkonzept für Timing-, Ability-, Effect-, Cost-, Target- und Choice-Grundlage. |
| `docs/derived/MECHANIC_M1_TEST_MATRIX.md` | ja | V0.93-Testplan mit Unit-, Szenario-, Visibility-, Replay-, AI- und Multiplayer-Gates. |
| `docs/derived/MVP_0.92_REQUIREMENTS_REVIEW.md` | ja | Review gegen Scope, Quellenpriorität, Hidden-Info-Regeln und Implementierbarkeit. |
| `docs/derived/MVP_0.92_FINAL_REVIEW.md` | ja | Gate-Ergebnis und explizite Freigabe oder Blocker für V0.93. |

Bestehende Status- oder Wissensseiten werden nur aktualisiert, wenn V0.92 tatsächlich abgeschlossen wird. Die jetzige Datei ist nur die Planung dafür.

## 6. Detailablauf

### Schritt 0 - Arbeitsgrenze sichern

Vor Beginn der V0.92-Umsetzung:

- Arbeitsbranch prüfen und bestehende lokale Änderungen identifizieren.
- V0.91-Artefakte nicht mit Mechanikplanung vermischen.
- Wenn lokale V0.91-Dateien noch uncommitted sind, entweder bewusst ausklammern oder zuerst durch den Benutzer freigeben lassen.
- Keine alten Abweichungen überschreiben, bevor sie gegen den aktuellen Engine-Stand geprüft wurden.

Akzeptanz:

- Die V0.92-Artefakte können isoliert reviewed werden.
- Der Status benennt offen, ob V0.91 als privat-lokal freigegeben, blockiert oder noch widersprüchlich ist.

### Schritt 1 - Status-Reconciliation

Aufgabe:

- `CODEX_STATUS.md`, V0.91-Requirements und die aktuelle Roadmap vergleichen.
- Die Aussage zu V0.91 auf eine von drei Varianten reduzieren:
  - `blocked_official_assets`: keine Umsetzung offizieller Bilder erlaubt,
  - `private_local_assets_allowed`: private lokale Nutzung ist als Projektentscheidung dokumentiert,
  - `status_unresolved`: mechanisch unabhängig, aber Status noch zu klären.
- V0.92 darf weiterlaufen, solange klar ist, dass keine Kartenbildarbeit Teil des Gates ist.

Empfehlung:

V0.92 sollte V0.91 als `private_local_assets_allowed` dokumentieren, diese Entscheidung aber strikt vom Mechanik-Gate trennen. Die Mechanik-Roadmap hängt nicht von Kartenbildern ab, und private Scans dürfen keine öffentlichen Asset-, Artwork-, Logo-, Card-Frame- oder Datenbank-Abhängigkeiten erzeugen.

### Schritt 2 - Mechanik-Coverage-Matrix erstellen

Die Matrix sollte nicht nur alte Deviations kopieren. Sie muss den heutigen Stand aus Code, Tests, Roadmap und Reviews normalisieren.

Empfohlenes Feldschema:

| Feld | Bedeutung |
|---|---|
| `mechanic_id` | stabile ID, zum Beispiel `mechanic.damage.net` oder `mechanic.timing.paid_ability_windows`. |
| `label` | lesbarer deutscher Name. |
| `source_refs` | relevante Dokumente oder CR-Abschnitte. |
| `current_status` | `implemented`, `implemented_limited`, `specified_not_implemented`, `open`, `blocked`, `out_of_scope`. |
| `current_scope_note` | kurze Einordnung des Ist-Standes. |
| `priority` | P0 bis P4 gemäß Mechanik-Komplettierungsplan. |
| `risk` | niedrig, mittel, hoch oder sehr hoch. |
| `depends_on` | technische oder fachliche Vorgänger. |
| `target_gate` | erstes empfohlenes Gate, etwa V0.93, V0.94 oder post-V1.x. |
| `coverage_needed` | Unit, Szenario, Visibility, Replay, AI, Multiplayer, UI. |
| `known_deviations` | Verweise auf alte oder neue Abweichungen. |

Statusregeln:

- `implemented`: Verhalten ist umgesetzt, getestet und nicht nur Demo-spezifisch.
- `implemented_limited`: Kernverhalten existiert, aber Scope ist bewusst schmal.
- `specified_not_implemented`: Anforderungen existieren, Code nicht.
- `open`: bekannt, aber noch nicht spezifiziert.
- `blocked`: braucht Produkt-, Rechte- oder Scope-Entscheidung.
- `out_of_scope`: bewusst nicht Teil der privaten MVP/V1.x-Roadmap.

### Schritt 3 - M1-Anforderungen ableiten

M1 umfasst das Fundament, nicht die späteren Mechaniken selbst.

Pflichtanforderungen für V0.92:

- Jede zukünftige Karte mit nichttrivialem Effekt muss über einen typisierten Effekt- oder Ability-Eintrag abbildbar sein.
- Effekte dürfen nicht aus Freitext-Kartentexten interpretiert werden.
- Alle spielbaren Entscheidungen bleiben aus `LegalActions` abgeleitet.
- `applyAction` revalidiert Side, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- Bestehende Action Types dürfen nicht ohne explizite Migration gebrochen werden.
- Hidden-Info-Events bekommen eine zentrale Klassifikation und dürfen keine Details in PublicEvents, PlayerViews, KI-Inputs, WebSocket-Payloads, Reconnect, Undo-Previews, Logs oder Fehlertexte leaken.
- Deterministisches Replay und StateHash bleiben Gate-Anforderungen.

Empfohlene Anforderungs-IDs:

- `M092-M0-STATUS-001` bis `M092-M0-STATUS-n`
- `M092-M0-COVERAGE-001` bis `M092-M0-COVERAGE-n`
- `M092-M1-EFFECT-001` bis `M092-M1-EFFECT-n`
- `M092-M1-ABILITY-001` bis `M092-M1-ABILITY-n`
- `M092-M1-TIMING-001` bis `M092-M1-TIMING-n`
- `M092-M1-CHOICE-001` bis `M092-M1-CHOICE-n`
- `M092-M1-VISIBILITY-001` bis `M092-M1-VISIBILITY-n`
- `M092-M1-REPLAY-001` bis `M092-M1-REPLAY-n`

### Schritt 4 - M1-Lösungskonzept festlegen

Das Spezifikationsdokument `MECHANIC_M1_EFFECT_TIMING_SPEC.md` sollte diese Lösung festschreiben:

#### Effect Kernel

Ein Effect ist kein direkter freier Codepfad aus Kartentext, sondern ein typisierter Plan:

- Quelle: Karte, Core-Regel, Subroutine oder Systemaktion.
- Kosten: Credits, Klicks, Tags, Counters oder spätere Hosted/Recurring Credits.
- Ziele: Karte, Server, Zone, Subroutine, Side oder Auswahl aus sichtbaren Kandidaten.
- Choices: serverseitig erzeugte Auswahl mit Side, Optionen, Min/Max und StateVersion.
- Schritte: deterministische Effect Commands.
- Sichtbarkeit: zentrale Eventklassifikation pro Schritt oder Gesamteffekt.

V0.93 darf intern noch Adapter für vorhandene Resolver nutzen, aber der Zielvertrag muss in V0.92 festgelegt sein.

#### Ability Registry

Eine Ability ist eine deklarierte auslösbare oder passive Fähigkeit:

- `paid`: bezahlbare Fähigkeit in erlaubten Fenstern,
- `triggered`: ausgelöste Fähigkeit nach Ereignis,
- `static`: dauerhafter Modifikator,
- `setup`: Start-of-game-Fähigkeit,
- `interrupt` oder `replacement`: nur als spätere Kategorie vormerken, nicht in V0.93 voll implementieren.

Bestehende Breaker-Pump- und Break-Subroutine-Aktionen sollten in V0.93 zunächst kompatibel bleiben. Intern können sie aus Ability-Definitionen generiert werden, ohne die UI sofort auf eine generische `trigger_ability`-Aktion umzustellen.

#### Timing-Fenster

M1 führt keine vollständige offizielle Prioritätsmaschine ein. Es definiert stattdessen:

- eine kleine Liste freigegebener Timingpunkte auf Basis bestehender `TimingPointId`s,
- pro Ability erlaubte Timingpunkte,
- eine zentrale Prüfung, ob eine Ability im aktuellen Zustand legal ist,
- einen klaren Erweiterungspfad für Trace, Prevention, Jack-out und Multiaccess.

#### ChoiceRequest

ChoiceRequest wird als einheitliches Protokoll für spätere Mechaniken spezifiziert:

- Mulligan,
- Trace/Bidding,
- Damage-Prevention,
- Reveal/Expose/Choose,
- Multiaccess-Reihenfolge,
- Replacement/Interrupt-Auswahl.

V0.92 spezifiziert das Modell. V0.93 implementiert nur die generische Grundlage und höchstens harmlose Adaptertests, keine neuen sichtbaren Spielmechaniken.

#### Eventklassifikation

Jeder Effekt muss eine der folgenden Sichtbarkeitsklassen verwenden:

- `public`: komplett öffentlich.
- `private_to_side`: nur eine Side darf Details sehen.
- `hidden_info_barrier`: Aktion oder Effekt erzeugt neue verdeckte Information und blockiert Undo/öffentliche Details.
- `replay_only`: nur vollständiges privates Replay darf Details enthalten.

Diese Klassifikation soll später Damage, HQ-Zugriff, R&D-Reihenfolgen, Shuffle, Search, Trace-Bids und Prevention absichern.

### Schritt 5 - Testmatrix für V0.93 planen

Die V0.92-Testmatrix muss V0.93 so konkret machen, dass die Umsetzung nicht während des Codings neu designed werden muss.

Pflichtbereiche:

- Unit-Tests für Effect Command Execution.
- Unit-Tests für Ability-Legalität nach Side, Timing, Kosten und Ziel.
- Regressionstests für bestehende Actions: Draw, Gain Credit, Install, Play Event/Operation, Advance, Score, Run, Rez, Pump, Break, Access, Steal, Trash, Remove Tag.
- Visibility-Tests für Eventklassifikation.
- Replay- und StateHash-Tests für alte Szenarien.
- Stale Action und illegal Choice Tests.
- AI-Smokes: unbekannte oder nicht bewertbare Ability-Formen dürfen nicht zu illegalen Aktionen führen.
- Multiplayer-Smokes: WebSocket/Reconnect/Undo dürfen neue optionale Felder side-sicher behandeln.

### Schritt 6 - Review und Gate

V0.92 ist fertig, wenn:

- die Coverage-Matrix vollständig genug ist, um alle bekannten Mechanikgruppen einzuordnen,
- M1-Anforderungen reviewt und implementierbar sind,
- V0.93 einen klaren Umsetzungsplan hat,
- V0.94+ nicht versehentlich in V0.93 hineingezogen wird,
- offene Entscheidungen explizit dokumentiert sind,
- keine Laufzeitdateien verändert wurden.

## 7. Offene Entscheidungen

| Entscheidung | Empfehlung | Blockiert V0.92? | Blockiert V0.93? |
|---|---|---:|---:|
| V0.91-Status: blockiert oder private lokale Assets erlaubt? | Als `private_local_assets_allowed` dokumentieren, strikt getrennt von Mechanikarbeit und ohne öffentliche Asset-Abhängigkeiten. | nein | nein |
| Maschinenlesbare Coverage-Matrix? | Ja, `data/rules/mechanics-coverage-0.92.json` zusätzlich zur Markdown-Matrix. | nein | ja, wenn spätere Gates automatisiert geprüft werden sollen |
| Public Action API sofort auf `trigger_ability` umstellen? | Nein. Bestehende Action Types kompatibel halten, generische Ability intern vorbereiten. | nein | ja, falls anders entschieden |
| ChoiceRequest bereits in V0.93 implementieren? | Ja, aber nur als generische Grundlage ohne neue sichtbare Mechanik. | nein | ja |
| V0.93 darf bestehende Resolver intern migrieren? | Ja, wenn Verhalten, LegalActions und StateHash entweder gleich bleiben oder Rebaselines explizit dokumentiert werden. | nein | ja |

## 8. Übergabe an V0.93

V0.93 darf erst starten, wenn V0.92 mindestens diese Aussagen liefert:

- Welche Mechaniken gelten als aktuell abgebildet?
- Welche alten Deviations sind erledigt, teilweise erledigt oder weiterhin offen?
- Welche M1-Typen und Verträge sind verbindlich?
- Welche bestehenden Aktionen müssen in V0.93 unverändert kompatibel bleiben?
- Welche Tests gelten als Gate für die M1-Umsetzung?
