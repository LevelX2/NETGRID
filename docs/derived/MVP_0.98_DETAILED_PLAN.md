# MVP 0.98 Detailed Plan - Identitätsfähigkeiten und Hidden-Zone-Manipulation

Status: historischer Detailplan, durch V0.98 umgesetzt
Stand: 2026-05-04

Hinweis: Dieses Artefakt dokumentiert die Vorplanung vor Requirements Freeze und Umsetzung. Maßgeblich für den aktuellen Stand sind `MVP_0.98_REQUIREMENTS.md`, `IDENTITY_MODIFIERS_0.98_SPEC.md`, `HIDDEN_ZONE_TOOLS_0.98_SPEC.md`, `MVP_0.98_IMPLEMENTATION_REVIEW.md` und `MVP_0.98_FINAL_REVIEW.md`.

## Kurzentscheidung

V0.98 bündelt M7 und M8, sollte aber intern in zwei Subgates umgesetzt werden: zuerst echte Identity-Fähigkeiten und dauerhafte Effekte, danach Hidden-Zone-Tools wie Search, Reveal, Expose, Arrange, Shuffle und Swap. Der Grund für die Bündelung ist Abhängigkeit: Hidden-Zone-Tools brauchen das gleiche Ability-/Trigger-/Choice-Fundament, aber sie sind deutlich riskanter für Visibility.

Die empfohlene Umsetzung ist daher V0.98a Identity/Modifier und V0.98b Hidden-Zone-Manipulation. Wenn V0.98a instabil ist, darf V0.98b nicht beginnen.

## Voraussetzungen

- V0.93 M1 ist abgeschlossen.
- V0.94 bis V0.97 sind abgeschlossen oder bewusst als nicht blockierende Reihenfolgeentscheidung dokumentiert.
- `SETUP_GAME_END_0.93_SPEC.md` ist für Identity-Setup erneut geprüft.
- Bestehende PlayerViews, PublicEvents, Replay, Undo und AI-Verträge sind grün.
- CR-v26.03-Regeln für Reveal/Expose/Search/Shuffle/Arrange sind vor Requirements-Freeze geprüft.

## Ziele

- Identities als echte Karten mit Setup-, statischen, ausgelösten und einmaligen Fähigkeiten nutzbar machen.
- Dauerhafte und bedingte Modifikatoren deterministisch modellieren.
- Trigger-Zähler für once-per-turn, once-per-run und first-time-per-turn statehash-sicher planen.
- Search/Reveal/Expose/Arrange/Shuffle/Swap als side-sichere Engine-Werkzeuge spezifizieren.
- Hidden-Zone-Choices nur der berechtigten Side zeigen.
- Öffentliche Information bewusst durch Reveal/Expose-Events erzeugen, nicht durch zufällige UI-Leaks.

## Nicht-Ziele

- Keine Prevention, Replacement oder Interrupt-Timingkette.
- Keine Hosting-/Virus-/Counter-Familien.
- Keine volle offizielle Deckbuilding-/Faction-/Influence-Regel.
- Keine automatische Spielbarkeit importierter Identities.
- Keine Hidden-Zone-Manipulation, die nicht vollständig im Replay reproduzierbar ist.
- Keine öffentlichen Replay- oder Zuschauerfunktionen.

## Subgate V0.98a - Identities und dauerhafte Effekte

### Vorgeschlagene Erweiterungen

| Bereich | Vorgabe |
|---|---|
| `AbilityKind` | Bestehende `setup`, `static`, `triggered`, `paid` nutzen; `future_interrupt` und `future_replacement` bleiben nicht spielbar. |
| `ModifierDefinition` | Typisierte Modifikatoren für Link, Memory, Handlimit, Kosten, Strength oder Trace-Basis vorbereiten. |
| Trigger-State | `usedAbilities` oder `abilityUsage` nach Turn/Run/Encounter, deterministisch im GameState. |
| Setup-Ability | Nur im Setup-Fenster, keine verdeckte gegnerische Information. |
| Static Modifier | Abgeleitet über Engine-Getter, nicht durch UI. |
| Triggered Ability | Nur aus Events, die der Engine bekannt und side-sicher klassifiziert sind. |

### Startscope

- Mindestens eine Runner-Identity mit einfacher sichtbarer Fähigkeit.
- Mindestens eine Corp-Identity mit einfacher sichtbarer Fähigkeit.
- Eine static oder setup Fähigkeit darf Link, Credits, Memory oder einen sichtbaren Cost-/Gain-Wert verändern.
- Keine Identity darf gegnerische Hand, Deckreihenfolge oder verdeckte Karten als Triggerbedingung verwenden.

### Tests

- Setup-Ability läuft genau einmal und ist replaybar.
- Static Modifier wird in LegalActions und `applyAction` identisch berücksichtigt.
- Once-per-turn Marker resetten deterministisch.
- Trigger löst nicht doppelt aus.
- AI-Reason-Codes nennen nur sichtbare Triggergründe.

## Subgate V0.98b - Search, Reveal, Expose, Arrange, Shuffle und Swap

### Vorgeschlagene Erweiterungen

| Mechanik | Plan |
|---|---|
| Search | `PendingChoice` mit `select_cards` aus einer für die Side erlaubten Zone; PlayerView zeigt nur zulässige Kandidaten. |
| Reveal | Explizites PublicEvent macht definierte Karteninformationen öffentlich. |
| Expose | Enthüllung installierter/verdeckt bekannter Karten nach CR-Abgleich; Sichtbarkeit im Event klar klassifizieren. |
| Arrange | Private Reihenfolge-Choice für berechtigte Side; keine Optionsliste im gegnerischen Payload. |
| Shuffle | Deterministische Shuffle-Operation mit RandomDrawRecords und Zweckstring. |
| Swap | Zone-Move-Operation mit Owner/Controller- und Faceup-Invarianten. |

### Startscope

- Search zuerst nur in eigener Stack/R&D/HQ/Grip-Zone, keine gegnerische komplette Hidden-Zone-Suche.
- Reveal/Expose zuerst als öffentlicher Informationswechsel mit klarer Eventklassifikation.
- Arrange nur für kleine, klar begrenzte Kartenmengen.
- Shuffle muss dieselbe Randomness-Infrastruktur wie Setup, HQ-Zugriff und Damage nutzen.
- Swap nur zwischen zulässigen Zonen, keine Ownership-/Control-Wechsel in V0.98.

## Integration in bestehende Mechanismen

| Mechanismus | Integration |
|---|---|
| Ability Registry | Identity-Fähigkeiten sind normale AbilityDefinitions mit strengem Timing. |
| Modifier System | Modifikatoren werden zentral berechnet und in LegalAction-Bau sowie `applyAction` revalidiert. |
| `pendingChoice` | Search/Arrange nutzen vorhandene Choice-Pipeline. |
| Eventklassifikation | Reveal/Expose erzeugen bewusste öffentliche Information; Search/Arrange bleiben `private_to_side` oder `hidden_info_barrier`. |
| RandomDrawRecords | Shuffle wird vollständig record-basiert. |
| PlayerView | Hidden-Zone-Kandidaten nur der berechtigten Side zeigen, keine DOM-/Payload-Leaks. |
| AI | AI darf nur sichtbare Trigger und eigene Choices bewerten. |

## Testmatrix

| Test-ID | Bereich | Erwartung |
|---|---|---|
| V098-T001 | Shared Types | Modifier-/Trigger-/Search-Typen sind additiv. |
| V098-T002 | Runner Identity Setup | Runner-Setup-Fähigkeit läuft genau einmal und ist replaybar. |
| V098-T003 | Corp Identity Setup | Corp-Setup-Fähigkeit läuft genau einmal und leakt keine Hidden Info. |
| V098-T004 | Static Modifier | Modifier beeinflusst LegalActions und `applyAction` konsistent. |
| V098-T005 | Triggered Ability | Trigger feuert nur im erlaubten Timing und nicht doppelt. |
| V098-T006 | Usage Marker | Once-per-turn/run/encounter Marker resetten korrekt. |
| V098-T007 | Search Own Zone | Eigene Hidden-Zone-Suche zeigt Kandidaten nur der berechtigten Side. |
| V098-T008 | Search Illegal | Falsche Side, stale StateVersion, falsche Zone und ungültige Ziele werden abgelehnt. |
| V098-T009 | Reveal | Reveal erzeugt ein öffentliches Event mit exakt freigegebenen Kartendaten. |
| V098-T010 | Expose | Expose folgt dokumentierter Sichtbarkeitsregel und ist replaybar. |
| V098-T011 | Arrange | Private Reihenfolge wird nicht in gegnerischen Payloads sichtbar. |
| V098-T012 | Shuffle | Shuffle nutzt RandomDrawRecords und ist deterministisch replaybar. |
| V098-T013 | Swap/Move | Zone-Moves respektieren Owner, Controller, Faceup und Trash-/Install-Invarianten. |
| V098-T014 | Undo | Hidden-Zone-Manipulation blockiert Undo an den dokumentierten Barrieren. |
| V098-T015 | AI Contract | AI nutzt keine verdeckten gegnerischen Kandidaten oder privaten Reihenfolgen. |
| V098-T016 | Multiplayer/UI | Reconnect und UI zeigen nur side-sichere Choice- und Reveal-Daten. |
| V098-T017 | No Scope Creep | Keine Prevention, Hosting, Virus, Counter- oder Deckbuilding-Mechanik wird freigeschaltet. |
| V098-T018 | Build Gate | `lint`, `typecheck`, `test`, `build` laufen grün oder Blocker sind dokumentiert. |

## Daten- und Doku-Artefakte für V0.98

Vor Implementierung:

- `docs/derived/MVP_0.98_REQUIREMENTS.md`
- `docs/derived/IDENTITY_MODIFIERS_0.98_SPEC.md`
- `docs/derived/HIDDEN_ZONE_TOOLS_0.98_SPEC.md`
- `docs/derived/MVP_0.98_TEST_MATRIX.md`
- `docs/derived/MVP_0.98_REQUIREMENTS_REVIEW.md`
- optionale Szenarien `data/scenarios/v098-*.json`

Nach Implementierung:

- `docs/derived/MVP_0.98_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.98_FINAL_REVIEW.md`
- aktualisierte Mechanik-Coverage
- aktualisierte Identity-/Manifest-/Szenario-Artefakte, falls lokale Test-Identities freigegeben werden

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Identity-Trigger brauchen verdeckte Informationen. | Nur sichtbare oder engine-eigene öffentliche Trigger im Startscope. |
| Modifier werden im LegalAction-Bau und Apply unterschiedlich berechnet. | Zentraler Getter und doppelte Revalidierungstests. |
| Search/Arrange leakt Kandidaten oder Reihenfolge. | Side-spezifische Choice-Serializer und negative Payload-/DOM-Tests. |
| Shuffle ist nicht replaybar. | RandomDrawRecords mit Zweckstring und StateHash-Szenarien. |
| V0.98 wird zu groß. | V0.98a muss vor V0.98b grün sein; sonst splitten. |

## Definition of Done

V0.98 ist fertig, wenn mindestens eine Runner- und eine Corp-Identity mit sicherer Fähigkeit funktionieren, Modifier und Trigger deterministisch revalidiert werden, Hidden-Zone-Tools side-sicher, replaybar und undo-barriered sind und keine V0.99+- oder M11-Mechanik nebenbei aktiv wurde.
