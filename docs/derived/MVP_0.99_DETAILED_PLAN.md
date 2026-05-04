# MVP 0.99 Detailed Plan - Hosting, Viren, Purge und Counter-Familien

Status: detaillierte Planungsfassung, keine Implementierung
Stand: 2026-05-04

## Kurzentscheidung

V0.99 bildet M9 und M10 ab: Objektbeziehungen, Hosting, Virus/Purge und zusätzliche Counter-/Token-Familien. Dieses Gate ist der breite Kartenpool-Anschluss vor einem möglichen V1.0- oder V1.1-Kernabschluss. Es sollte intern streng gestaffelt werden: zuerst generische Counter, dann Hosting-Beziehungen, danach Virus/Purge, danach Recurring Credits, Bad Publicity und seltenere Token wie Charge, Mark oder Dividends nur bei konkretem Kartenbedarf.

V0.99 startet keine Prevention-/Replacement-Pipeline und keine vollständigen Deckbuilding-Formatregeln. Diese bleiben V1.0/V1.1 oder V1.x.

## Voraussetzungen

- V0.93 M1 ist abgeschlossen.
- V0.94 bis V0.98 sind abgeschlossen oder bewusst neu priorisiert.
- Existing Counter wie Advancement, Tags, Strength Modifier und Memory sind regressionsgeschützt.
- CR-v26.03-Regeln für Hosting, Hosted Cards, Virus Counter, Purge, Recurring Credits und Bad Publicity sind vor Requirements-Freeze geprüft.
- Manifest- und Matchstart-Gates verhindern Spielbarkeit ohne Mechanik-Coverage.

## Ziele

- Generisches Counter-Modell einführen, ohne bestehende Advancement-/Tag-Regressionen zu brechen.
- Hosting-Beziehungen zwischen Karten deterministisch modellieren.
- Trash/Move-Regeln für Hosts und hosted Objects planen.
- Virus Counter und Purge als erstes breites Counter-Subgate planen.
- Recurring Credits mit Refresh und zweckgebundener Nutzung planen.
- Bad Publicity als Run-bezogene temporäre Creditquelle planen.
- Charge, Mark, Dividends und Spezialressourcen nur als spätere freigeschaltete Counterfamilien modellieren.

## Nicht-Ziele

- Keine Prevention, Avoid, Interrupts oder Replacement.
- Keine Ownership-/Control-Wechsel über Hosting hinaus.
- Keine Set-Aside-/Remove-from-Game-Spezialfälle.
- Keine vollständige Faction-/Influence-/Rotation-/Banlisten-Implementierung.
- Keine Karten mit mehrdeutigen Hosted-Target-Regeln ohne Requirements Review.
- Keine automatische Spielbarkeit durch Katalog oder Import.

## Empfohlene Subgates

### V0.99a - Generische Counter-API

Ziel:

- Einheitliche API für Karten-Counter, ohne bestehende Felder abrupt zu entfernen.

Plan:

- `CardInstance.counters?: Record<CounterType, number>` additiv planen.
- Bestehende `advancementCounters` zunächst als kompatibles Legacy-Feld behalten oder über Adapter spiegeln.
- CounterType-Startliste: `advancement`, `virus`, `power`, `agenda`, `recurring_credit`, `bad_publicity`, `charge`, `mark`, `dividend`, `core_damage`.
- Counter-Sichtbarkeit pro Typ und Hoststatus dokumentieren.
- Kosten- und Zielprüfung für Counter-Verbrauch zentralisieren.

### V0.99b - Hosting und Hosted Objects

Ziel:

- Karten können andere Karten, Counters oder Credits hosten, ohne Zone-/Visibility-Invarianten zu brechen.

Plan:

- `hostedOn?: CardInstanceId` und/oder `hostedCards` als ableitbare Relation planen.
- Gehostete Karten behalten Owner/Controller.
- Host-Trash/Move hat definierte Folge für hosted Cards: trashen, mitbewegen oder explizit nach Kartentext, aber niemals implizit unklar.
- PlayerView zeigt hosted Objects nur entsprechend Kartenstatus und Side.
- No circular hosting als harte Invariante.

### V0.99c - Virus Counter und Purge

Ziel:

- Virus-Counter und Corp-Purge als erste konkrete Counter-Familie spielbar machen.

Plan:

- Virus Counter liegen auf Karten oder gehosteten Objekten.
- Corp Basic Action `purge_virus_counters` wird nur legal, wenn Kosten/Clicks nach CR-v26.03 erfüllt sind.
- Purge entfernt nur Virus Counter, nicht Power/Agenda/Charge/etc.
- Event ist öffentlich und replaybar.
- AI kann Purge bewerten, ohne gegnerische verdeckte Karten zu kennen.

### V0.99d - Recurring Credits und Bad Publicity

Ziel:

- Zweckgebundene temporäre/erneuerbare Credits über das M1-Kostenmodell integrieren.

Plan:

- Recurring Credits haben Quelle, Zweckbindung, Refresh-Zeitpunkt und aktuellen Restwert.
- Refresh passiert an explizitem Timingpunkt, nicht in UI.
- Bad Publicity wird als Corp-weiter öffentlicher Wert modelliert.
- Runner erhält während Runs temporäre Bad-Publicity-Credits mit eindeutiger Verfallsregel.
- `CostRequirement.source` wird von `future_recurring` zu konkreter revalidierter Quelle erweitert.

### V0.99e - Charge, Mark, Dividends und Spezialressourcen

Ziel:

- Seltenere moderne Counterfamilien nicht blockieren, aber auch nicht ohne Kartenbedarf ausimplementieren.

Plan:

- Countertypen sind im Datenmodell vorbereitet.
- Spielbare Nutzung nur nach konkreten Kartenkandidaten.
- Jeder Spezialcounter braucht Sichtbarkeit, Refresh/Verbrauch, Kostenintegration und Tests.
- Nicht genutzte Counter bleiben `specified_not_implemented`, nicht `implemented`.

## Integration in bestehende Mechanismen

| Mechanismus | Integration |
|---|---|
| CardInstance/ZoneRef | Hosting erweitert Objektbeziehungen, darf Owner/Controller/Zone-Invarianten nicht brechen. |
| EffectCommand | Counter add/remove/spend, host/unhost und purge als Commands planen. |
| CostRequirement | Recurring/hosted Credits werden echte Kostenquellen mit Revalidierung. |
| PlayerView | Counter und hosted Objects nur entsprechend Sichtbarkeitsregel zeigen. |
| Eventklassifikation | Counter/Purge meist `public`; hosted Hidden-Info-Objekte ggf. `private_to_side` oder `hidden_info_barrier`. |
| Replay/StateHash | Jede Counteränderung und Host-Relation muss deterministisch hashen. |
| AI | AI darf Counter/Hosting nur aus PlayerView und LegalActions bewerten. |
| Deck/Manifest | Karten mit Hosting/Virus/Recurring dürfen erst nach Mechanik-Coverage `playable` werden. |

## Testmatrix

| Test-ID | Bereich | Erwartung |
|---|---|---|
| V099-T001 | Shared Types | Counter-/Hosting-Typen sind additiv und brechen bestehende Karten nicht. |
| V099-T002 | Advancement Regression | Bestehende Agenda-Advance-/Score-Tests bleiben grün. |
| V099-T003 | Counter Add/Remove | Generische Counteränderungen sind deterministisch und nicht negativ. |
| V099-T004 | Counter Visibility | Public/Private Counter werden in PlayerViews korrekt gefiltert. |
| V099-T005 | Hosting Basic | Karte kann legal auf erlaubtem Host gehostet werden. |
| V099-T006 | Hosting Illegal | Circular Hosting, falsche Side, falscher Hosttyp und stale StateVersion werden abgelehnt. |
| V099-T007 | Host Trash | Trash/Move eines Hosts behandelt hosted Objects nach Spezifikation. |
| V099-T008 | Virus Counter | Virus Counter können nur auf erlaubten Quellen liegen. |
| V099-T009 | Purge Legal | Corp-Purge ist nur bei erfüllten Kosten/Timing legal und entfernt nur Virus Counter. |
| V099-T010 | Purge Illegal | Falsche Side, zu wenige Clicks, falsches Timing oder keine LegalAction werden abgelehnt. |
| V099-T011 | Recurring Refresh | Recurring Credits refreshen am definierten Timingpunkt. |
| V099-T012 | Recurring Spend | Zweckgebundene Credits bezahlen nur erlaubte Kosten und werden in `applyAction` revalidiert. |
| V099-T013 | Bad Publicity | Runner erhält Bad-Publicity-Credits nur während erlaubter Runs und verliert sie danach. |
| V099-T014 | Replay/StateHash | Counter-, Hosting-, Purge- und Recurring-Szenarien replayen deterministisch. |
| V099-T015 | Visibility | WebSocket, Reconnect, Undo, Errors, Logs und AI-Input leaken keine hosted Hidden Info. |
| V099-T016 | AI Contract | AI kann Purge/Counter/Hosted-Boardstates legal und fallback-sicher bewerten. |
| V099-T017 | Manifest Gate | Karten mit Counter-/Hostingbedarf werden ohne Mechanikfreigabe nicht deck-legal. |
| V099-T018 | No M11 | Keine Prevention-, Avoid-, Interrupt- oder Replacement-Action wird spielbar. |
| V099-T019 | Build Gate | `lint`, `typecheck`, `test`, `build` laufen grün oder Blocker sind dokumentiert. |

## Daten- und Doku-Artefakte für V0.99

Vor Implementierung:

- `docs/derived/MVP_0.99_REQUIREMENTS.md`
- `docs/derived/COUNTER_HOSTING_0.99_SPEC.md`
- `docs/derived/VIRUS_PURGE_0.99_SPEC.md`
- `docs/derived/RECURRING_BAD_PUBLICITY_0.99_SPEC.md`
- `docs/derived/MVP_0.99_TEST_MATRIX.md`
- `docs/derived/MVP_0.99_REQUIREMENTS_REVIEW.md`
- optionale Szenarien `data/scenarios/v099-*.json`

Nach Implementierung:

- `docs/derived/MVP_0.99_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.99_FINAL_REVIEW.md`
- aktualisierte Mechanik-Coverage
- aktualisierte Daten-/Manifestartefakte für freigegebene lokale Karten

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Counter-API bricht Advancement. | Legacy-Feld zunächst behalten, Adaptertests. |
| Hosting erzeugt zyklische oder verlorene Karten. | Invarianten: kein Kreis, eindeutiger Owner/Controller, definierte Host-Trash-Folge. |
| Hosted Hidden Info leakt. | Side-sichere PlayerView-Serializer, Payload-/DOM-Leaktests. |
| Recurring Credits umgehen Kostenprüfung. | `CostRequirement` mit Quelle und doppelter Revalidierung. |
| V0.99 wird zu breit. | Subgates a-e; Spezialcounter nur bei konkretem Kartenbedarf. |

## Definition of Done

V0.99 ist fertig, wenn generische Counter, Hosting, Virus/Purge sowie freigegebene Recurring-/Bad-Publicity-Quellen deterministisch, side-sicher, replaybar und manifest-gated funktionieren. Seltene Counterfamilien sind entweder implementiert, spezifiziert verschoben oder explizit nicht im aktuellen Kartenbedarf. M11-Mechaniken bleiben gesperrt.

