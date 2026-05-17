# MVP 0.8 Detaillierter Plan

Status: detaillierte Planungsfassung, noch kein Requirements-Freeze
Stand: 2026-05-03
Empfohlener Phasenname: `MVP 0.8 playable base starter slice requirements`

## 1. Kurzentscheidung

MVP 0.8 macht nicht das ganze Basis- oder Starterset spielbar. Die Phase liefert den ersten größeren, aber streng kuratierten spielbaren Slice aus dem in V0.5 importierten und in V0.6/V0.7 produktfähig sichtbaren Kartenbestand.

Kernformel:

> Katalogdaten und Decklegalität sind Vorbedingungen, aber keine Regelautorität. Spielbar wird eine Karte erst durch Manifest, expliziten Resolver, Unit-Test, Szenario, Visibility-Test, Replay/StateHash und KI-Smoke.

Empfohlener Scope für V0.8:

- ein kleiner Basisset-/Starterset-Slice mit einfachen, engine-nahen Karten,
- Fokus auf Economy, Draw, einfache Install-/Play-Effekte, Advance/Score, Run-, ICE- und Breaker-Interaktion,
- nur Karten, deren Mechaniken bereits in MVP 0.4 vorhanden sind oder als enges V0.8-Teilgate eingeführt werden können,
- Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention und Replacement nur als getrennte Teilgates,
- keine echten Kartenabbilder außer dem in V0.7 vorbereiteten Asset-Gate,
- keine automatische Regelinterpretation aus offiziellem oder externem Kartentext.

## 2. Ziel

Nach V0.8 soll die Anwendung einen deutlich interessanteren, aber weiterhin kontrollierten Kartenpool spielen können.

Das Projekt soll danach:

- importierte Karten anhand ihres Status sicher in Kandidaten, blockierte Karten und spielbare Karten trennen,
- Decks nur mit freigegebenen spielbaren Karten startbar machen,
- für jede spielbare Karte einen expliziten Engine-Resolver und ein Manifest haben,
- die vorhandenen V0.7-UI-Flächen nutzen, ohne neue UI-Neugestaltung zu beginnen,
- Hidden-Info, deterministisches Replay und StateHash auch mit mehr Karten stabil halten,
- KI-vs-KI und Human-vs-KI-Smokes mit den neuen Decks ausführen können,
- Multiplayer-Matches mit dem neuen Slice nur starten, wenn Deck-Snapshots und Formatprofile gültig sind.

## 3. Ausgangslage

V0.5 liefert Katalog, Snapshot, Importstatus und Manifest-Abgleich.

V0.6 liefert Deckmodell, Deck-Snapshots, Deckvalidierung, Match Setup und serverseitige Revalidierung.

V0.7 liefert die neue UI-Struktur, CardView, Boardflächen, LegalActionsPanel, ChoiceRequestPanel, EventLog, Undo/Reconnect und Diagnostics.

V0.8 darf auf diesen Grundlagen aufbauen, aber:

- keine V0.7-UI-Planung überschreiben,
- keine importierten Karten automatisch spielbar machen,
- keine externen Kartendaten als Regelinterpreter verwenden,
- keine breite Komplettumsetzung eines Sets starten.

### 3.1 Harte Eingangsvoraussetzungen

V0.8 darf erst als Requirements-Freeze starten, wenn diese Gates dokumentiert grün sind:

- V0.6 Requirements, Implementierung und Final Review sind abgeschlossen.
- V0.7 Requirements, Implementierung, Visual QA, Hidden-Info-UI-Gates und Final Review sind abgeschlossen.
- Katalog-, Deck-, Matchstart-, UI-, Multiplayer-, Visibility-, Replay- und StateHash-Regressionsläufe bestehen.
- `docs/codex/CODEX_STATUS.md` weist V0.7 als abgeschlossen und V0.8 als nächsten Gate-Schritt aus.
- Es gibt keine offenen V0.7-Asset- oder UI-Entscheidungen, die V0.8-Kartenauswahl, CardView oder Hidden-Card-Darstellung blockieren.

Falls V0.7 oder V0.6 nur teilweise abgeschlossen ist, darf V0.8 höchstens als Voranalyse ohne Kartenfreigabe laufen.

## 4. Nicht-Ziele

V0.8 baut nicht:

- vollständiges Basis- oder Starterset,
- offizielle Formatlegalität oder Turnierlegalität,
- automatische Kartentextauswertung,
- neue Designrichtung oder UI-Redesign,
- echte Kartenabbilder ohne separates V0.7-Asset-Gate,
- öffentliche Plattformfunktionen,
- Accountsystem, Matchmaking, Rankings oder Decklistenplattform,
- LLM- oder externe KI als Regelakteur,
- ungeprüfte Mechaniken im Hauptpfad.

## 5. Scope-Entscheidung

### 5.1 Primärer Slice

Der erste V0.8-Slice sollte bewusst konservativ sein:

| Gruppe | Aufnahme in V0.8-Hauptscope | Begründung |
|---|---|---|
| einfache Economy | Ja | geringe Hidden-Info-Komplexität, gute Deckvarianz. |
| einfache Draw-/Click-Effekte | Ja | baut auf RandomDrawRecords auf und härtet Zufall. |
| einfache Install-/Play-Effekte | Ja | vorhandene Resolverpfade können erweitert werden. |
| einfache ICE | Ja | vorhandener Run-/Encounter-/Subroutine-Pfad wird vertieft. |
| einfache Icebreaker | Ja | bestehendes Pump-/Break-Modell wird erweitert. |
| einfache Agendas und Assets | Ja | Score, Steal und Trash sind bereits zentrale Gates. |
| Tags und einfache Tag-Punishment-Karten | Ja, falls sie MVP-0.4-Modell nutzen | vorhandene Tags werden regressionsfest gemacht. |
| Damage | Nur Teilgate | Zufall, Hidden Info, Undo und KI-Sichtbarkeit berühren sich. |
| Resources | Nur Teilgate | neuer Kartentyp mit Install-/Trash-/Persistenzfragen. |
| Traces | Nur Teilgate | interaktive geheime/öffentliche Bids und Timingfenster. |
| Identitätsfähigkeiten | Nur Teilgate | dauerhafte passive oder ausgelöste Effekte. |
| Multiaccess | Nur Teilgate | Access-Sequenz, Hidden Info und Replay werden deutlich komplexer. |
| Hosting, Viren | Nur Teilgate | neue Objektbeziehungen, Counter und Timingregeln. |
| Prevention/Replacement | Nur Teilgate | Resolver-Pipeline und Event-Ersatzlogik betroffen. |

### 5.2 Empfohlene Größenordnung

Der Requirements-Freeze soll die genaue Kartenzahl festlegen. Für die Planungsphase ist die Empfehlung:

- 8 bis 14 neue spielbare Karten im Hauptslice,
- ungefähr gleich verteilt auf Runner und Corp,
- je Seite mindestens eine Economy-Karte, eine zentrale Boardkarte und ein Run-/Interaction-Werkzeug,
- höchstens ein neues Mechanik-Teilgate im ersten V0.8-Durchlauf,
- lieber mehrere kleine V0.8.x-Freigaben als ein großer Kartenblock.

### 5.3 Quellen- und Nutzungsentscheidung

Der Begriff Basisset-/Starterset muss vor dem Requirements-Freeze konkret entschieden werden:

| Option | Bedeutung | V0.8-Folge |
|---|---|---|
| lokaler starterset-artiger Slice | fiktive oder projektinterne Karten mit ähnlichen Rollen wie ein Starterset. | bevorzugter sicherer Pfad, keine externe Nutzungsentscheidung nötig. |
| offizieller Daten-Snapshot als Quelle | Kartendaten stammen aus einer erlaubten externen/offiziellen Quelle, aber nur als lokaler Snapshot. | nur nach dokumentierter Quellen-, Nutzungs- und Feldfreigabe. |
| offizielle Karte als spielbares Vorbild | Karte ist funktional an eine bekannte Karte angelehnt. | nur mit Per-Card-Deviation/Approximation und explizitem Resolver. |

Kein Pfad erlaubt Kartentext als Regelinterpreter. Wenn keine klare Quellen- und Nutzungsentscheidung vorliegt, muss V0.8 auf einen lokalen starterset-artigen Slice begrenzt bleiben.

## 6. Must-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V08-MUST-001 | V0.8 Requirements Freeze | `docs/derived/MVP_0.8_REQUIREMENTS.md` definiert Slice, Nicht-Ziele, Gates, Artefakte und Abnahmekriterien. |
| V08-MUST-002 | Kartenkandidatenliste | Eine versionierte Kandidatenliste trennt `candidate`, `blocked`, `requires_mechanic_gate`, `implemented`, `playable` und `deck_legal`. |
| V08-MUST-003 | Explizites Resolver-Modell | Jede neue spielbare Karte hat einen benannten Resolver; kein Kartentext wird interpretiert. |
| V08-MUST-004 | Manifestpflicht | Jede spielbare Karte hat Manifest-Eintrag mit Mechaniken, Risiken, Tests, Szenarien und KI-Smoke. |
| V08-MUST-005 | Unit-Test je Karte | Jede neue spielbare Karte hat gezielte Unit-Tests für Kosten, Ziele, Timing, Effekt und illegale Nutzung. |
| V08-MUST-006 | Szenario je Karte | Jede neue spielbare Karte ist in mindestens einem versionierten Szenario abgedeckt. |
| V08-MUST-007 | Visibility-Test je Hidden-Info-Risiko | Jede Karte mit verdeckten Zonen, Access, Draw, Reveal, Trash oder Randomness hat side-sichere Payload-/View-Tests. |
| V08-MUST-008 | Replay/StateHash je Slice | Szenarien reproduzieren finalen StateHash mit gleichem Seed, Deck-Snapshot und RulesBaseline. |
| V08-MUST-009 | KI-Smoke je spielbarer Karte | KI kann Matches mit neuen Decks spielen, wählt nur LegalActions und erhält keine FullState-/Hidden-Info-Daten. |
| V08-MUST-010 | Decklegalität | V0.8-Decks starten nur mit `playable` und formatfreigegebenen Karten; Importstatus allein reicht nie. |
| V08-MUST-011 | Multiplayer-Kompatibilität | Human-vs-Human-Start, Reconnect, Undo-Barriere und side-gefilterte Payloads bleiben mit V0.8-Decks korrekt. |
| V08-MUST-012 | Regression | MVP-0.1 bis MVP-0.7-Gates bleiben grün. |
| V08-MUST-013 | Eingangsgates | V0.8 startet erst, wenn V0.6 und V0.7 dokumentiert abgeschlossen und grün sind. |
| V08-MUST-014 | Quellenentscheidung | Requirements Freeze entscheidet, ob der Slice lokal/fiktiv, aus freigegebener Quelle oder funktional an offizielle Vorbilder angelehnt ist. |
| V08-MUST-015 | Kandidaten-Scoring | Jede Kandidatenkarte hat nachvollziehbaren Score für Aufwand, Risiken und Spielwert. |
| V08-MUST-016 | Resolver-Registry | Jede spielbare Karte referenziert typisierten Resolvernamen, Visibility-Klasse, Risk Flags und Test-IDs in einer Registry. |
| V08-MUST-017 | Per-Card-Deviation | Jede spielbare Karte dokumentiert `full`, `simplified`, `functional_replacement` oder `local_original` mit Begründung. |
| V08-MUST-018 | Minimale KI-Rollen | Jede neue spielbare Karte erhält einfache Rollen-Tags als Anschluss für V0.9. |
| V08-MUST-019 | Playability-Smoke | Kuratierte V0.8-Decks laufen über mehrere Seeds ohne häufige tote Partien, Actionlimits oder einseitige Nicht-Spiele. |
| V08-MUST-020 | Golden-Hash-Prozess | Erzeugung und Änderung von Golden StateHashes sind dokumentiert und reviewbar. |
| V08-MUST-021 | Performance-Budget | `getLegalActions`, `applyAction`, `getPlayerView` und KI-Smokes bleiben innerhalb eines dokumentierten lokalen Budgets oder bekommen Blocker. |

## 7. Should-Anforderungen

| ID | Anforderung | Akzeptanzkriterium |
|---|---|---|
| V08-SHOULD-001 | Mechanik-Risiko-Matrix | Karten werden nach Engine-, Visibility-, Replay-, UI-, KI- und Multiplayer-Risiko bewertet. |
| V08-SHOULD-002 | Kuratierte Starter-Decks | Mindestens ein Runner- und ein Corp-Deck nutzen den neuen Slice und bleiben klein genug für schnelle Tests. |
| V08-SHOULD-003 | Kandidaten-Ranking-Review | Blockierte und aufgenommene Karten werden mit Score, Blockgrund und Review-Entscheidung dokumentiert. |
| V08-SHOULD-004 | KI-Reason-Codes | KI-Smokes melden Reason-Codes für neue Kartenrollen, soweit sie über vorhandene Sichtdaten erklärbar sind. |
| V08-SHOULD-005 | Soak-Smokes | KI-vs-KI läuft über mehrere Seeds mit V0.8-Decks ohne illegal actions oder StateHash-Drift. |
| V08-SHOULD-006 | Blocked-Karten-Dokumentation | Nicht gewählte Karten bekommen klare Blockgründe und benötigte Teilgates. |

## 8. Could-Anforderungen

| ID | Idee | Bedingung |
|---|---|---|
| V08-COULD-001 | V0.8.x Mikrofreigaben | Nur wenn Hauptslice stabil ist und Karten klar getrennte Mechaniken haben. |
| V08-COULD-002 | Mechanik-Prototyp-Szenarien | Nur als nicht decklegale Experimente mit klarer Sperre gegen Matchstart. |
| V08-COULD-003 | KI-Simulationsmatrix pro Kartengruppe | Nur wenn V0.9 nicht vorweggenommen wird. |

## 9. Karten- und Mechanik-Auswahlstrategie

### 9.1 Auswahlpipeline

1. Katalogdaten aus V0.5 als Kandidatenquelle lesen.
2. V0.6-Deckstatus und Formatprofile prüfen.
3. Quellen-/Nutzungsstatus und Per-Card-Deviation-Kategorie klären.
4. Karten nach Side, Type, Mechaniken, Hidden-Info-Risiko und Resolver-Aufwand taggen.
5. Kandidaten-Scoring berechnen und begründen.
6. Karten ohne neue Mechanik oder mit vorhandener MVP-0.4-Mechanik priorisieren.
7. Karten mit Damage, Resource, Trace, Identity, Multiaccess, Hosting, Viren, Prevention oder Replacement in Teilgate-Buckets verschieben.
8. Pro Kandidat Resolvername, Visibility-Klasse, Risk Flags, minimale KI-Rollen und Testspur notieren.
9. Erst nach Review `playable` und danach `deck_legal` setzen.

### 9.2 Priorisierungsregeln

Hohe Priorität:

- Karten mit klaren Kosten und sofortigem Effekt,
- Karten, die vorhandene Actions nutzen,
- Karten, die keine verdeckten Zielauswahlen erzwingen,
- Karten, deren KI-Nutzung durch einfache Heuristiken erklärbar ist,
- Karten, die Runner- und Corp-Spielplan sichtbar abwechslungsreicher machen.

Mittlere Priorität:

- Karten mit bedingten Effekten,
- Karten mit Tags auf dem vorhandenen V0.4-Modell,
- Karten, die neue Timingpunkte brauchen, aber keine Hidden-Info-Entscheidung öffnen.

Niedrige Priorität oder Block:

- Karten mit mehrstufigem Access,
- Karten mit Damage,
- Karten mit geheimen Bids oder Trace,
- Karten mit Hosting/Virus-Countern,
- Karten mit Prevention/Replacement,
- Karten mit Identitäts- oder dauerhaft passiven Effekten,
- Karten, deren Spielwert erst durch andere nicht implementierte Karten entsteht.

### 9.3 Kandidaten-Scoring

Jede Kandidatenkarte erhält einen kleinen Score, damit Aufnahme und Blockade nachvollziehbar bleiben. Niedrigere Risikowerte sind besser, höherer Spielwert ist besser.

| Kriterium | Skala | Bedeutung |
|---|---:|---|
| Engine-Aufwand | 0-5 | neue Actions, Timingpunkte, Resolverkomplexität, Invarianten. |
| Hidden-Info-Risiko | 0-5 | verdeckte Zonen, Reveal, Access, Randomness, private Payloads. |
| UI-Aufwand | 0-5 | neue V0.7-Flächen, Choices, CardView-Zustände, Text-/Layoutdruck. |
| KI-Aufwand | 0-5 | neue Rollen, Heuristiken, Fallbackbedarf, Reason-Codes. |
| Multiplayer-Risiko | 0-5 | Reconnect, Undo-Barriere, WebSocket-Payload, Concurrency. |
| Spielwert | 0-5 | Beitrag zu abwechslungsreichen, sinnvollen Starterpartien. |

Empfohlene Formel:

```txt
candidateScore = spielwert * 2 - engineAufwand - hiddenInfoRisiko - uiAufwand - kiAufwand - multiplayerRisiko
```

Regeln:

- Karten mit `Hidden-Info-Risiko >= 4` brauchen ein Teilgate oder bleiben blockiert.
- Karten mit `Engine-Aufwand >= 4` brauchen Resolver-Design vor Aufnahme.
- Karten mit `Spielwert <= 1` werden nur aufgenommen, wenn sie für Deckfunktion oder Tests notwendig sind.
- Das Ranking ersetzt kein Review; es macht die Entscheidung prüfbar.

### 9.4 Per-Card-Deviation und Approximation

Jede spielbare Karte dokumentiert, wie nah sie an ihrer Quelle oder ihrem Vorbild liegt:

| Kategorie | Bedeutung |
|---|---|
| `full` | Effekt ist im V0.8-Scope vollständig umgesetzt. |
| `simplified` | Effekt ist bewusst vereinfacht; Abweichung und spätere Entfernung sind dokumentiert. |
| `functional_replacement` | Karte erfüllt eine ähnliche Spielrolle, aber nicht denselben Effekt. |
| `local_original` | rein lokale/fiktive Karte ohne offizielles Vorbild. |

Diese Angabe gehört in Manifest, Kandidatenliste und Deviation-Register. Sie verhindert, dass importierter oder angelehnter Kartentext später mit Engine-Regeln verwechselt wird.

### 9.5 Teilgate-Modell

Ein Teilgate darf erst starten, wenn es eigene Anforderungen, Resolver-Regeln, Szenarien und Visibility-Gates hat.

Empfohlene Reihenfolge, falls V0.8 mehr als den Hauptslice braucht:

1. Resources-Gate nur für einfache Runner-Ressourcen ohne Hosting oder Prevention.
2. Damage-Gate nur mit RandomDrawRecords, Undo-Barriere und KI-Visibility.
3. Trace-Gate mit klarer Bid-/Choice-Sequenz und Replay.
4. Identitäts-Gate mit persistenten Triggern und StateHash-Tests.
5. Multiaccess-Gate mit Access-Sequenz, Hidden-Info-Schutz und Undo-Sperre.

## 10. Vorgeschlagene Artefakte

Derived Docs:

- `docs/derived/MVP_0.8_REQUIREMENTS.md`
- `docs/derived/PLAYABLE_SLICE_0.8_SPEC.md`
- `docs/derived/CARD_RESOLVER_MODEL_0.8_SPEC.md`
- `docs/derived/CARD_CANDIDATE_SCORING_0.8_SPEC.md`
- `docs/derived/MECHANIC_GATES_0.8_SPEC.md`
- `docs/derived/PLAYABLE_SLICE_0.8_TEST_MATRIX.md`
- `docs/derived/MVP_0.8_STATEHASH_REVIEW.md`
- `docs/derived/MVP_0.8_REQUIREMENTS_REVIEW.md`

Daten:

- `data/cards/playable-slice-0.8.json`
- `data/manifests/card-implementation-manifest-0.8.json`
- `data/manifests/card-playability-status-0.8.json`
- `data/manifests/card-resolver-registry-0.8.json`
- `data/ai/card-role-tags-0.8.json`
- `data/decks/deck-format-profiles-0.8.json`
- `data/decks/deck-snapshots-0.8.json`
- `data/rules/rules-baseline-0.8.json`
- `docs/derived/DEVIATION_REGISTRY.md` (historische Abweichungsdokumentation)
- `data/scenarios/v08-*.json`

Tests:

- `tests/specs/playable-slice-0.8-acceptance-tests.todo.md`

Mögliche Codebereiche in der späteren Implementierung:

- `packages/engine/src/cards` oder lokale Resolver-Struktur,
- `packages/engine/src/effects`,
- `packages/ai/src`,
- `packages/decks` für Format-/Decklegalität,
- `packages/catalog` nur für Statusabgleich, nicht für Regelinterpretation.

## 11. Teilphasen

### V0.8-A Requirements und Kandidatenfreeze

Ergebnisse:

- Requirements,
- Kandidatenliste,
- Mechanik-Risiko-Matrix,
- Blocked-/Deferred-Liste,
- Testmatrix.

Gate:

Keine Karte wird als spielbar geplant, ohne Resolver-, Manifest- und Testspur.

### V0.8-B Resolver- und Manifest-Modell

Ergebnisse:

- Resolver-Konventionen,
- Manifestfelder,
- zentrale Statusregeln,
- Abgrenzung Katalogdaten zu Engine-Karten.

Gate:

Kartentext ist Anzeigeinformation; Resolver bleiben explizit und versioniert.

### V0.8-C Hauptslice einfache Karten

Ergebnisse:

- erste Economy-, Draw-, Install-/Play-, ICE-, Breaker-, Agenda-/Asset-Karten,
- Unit- und Szenariotests,
- Decklegalität für den Hauptslice.

Gate:

Jede Karte besteht Unit, Szenario, Visibility, Replay/StateHash und KI-Smoke.

### V0.8-D Optionales Mechanik-Teilgate

Ergebnisse:

- höchstens eine neue riskantere Mechanikgruppe,
- eigene Spezifikation,
- eigene Szenarien,
- harte Regression gegen Hidden Info und Undo.

Gate:

Teilgate kann separat bestanden, verschoben oder zurückgenommen werden, ohne den Hauptslice zu gefährden.

### V0.8-E Deck- und Matchfreigabe

Ergebnisse:

- V0.8-Formatprofil,
- kuratierte Runner-/Corp-Deck-Snapshots,
- Matchstart-Preflight,
- KI- und Multiplayer-Smokes,
- Playability-/Balance-Smokes über mehrere Seeds.

Gate:

Matchstart dokumentiert RulesBaseline, Kartenpool, Deck-Snapshot-Hashes und Seed; kuratierte Decks produzieren keine häufigen toten Partien oder action-limit games.

### V0.8-F Final Review und Hardening

Ergebnisse:

- Requirements Review,
- Final Review,
- StateHash Review,
- Regressionsergebnis,
- offene Karten und Teilgates dokumentiert.

Gate:

Keine bekannten Hidden-Info-Leaks, keine StateHash-Drift, keine Auto-Playable-Pfade.

## 12. Teststrategie

### 12.1 Unit-Tests

Pflicht:

- Kosten, Klicks, Credits und zusätzliche Kosten werden validiert.
- Timingpunkt und Side werden validiert.
- Ziele und Choices werden erneut in `applyAction` geprüft.
- illegale Zielzonen und falsche Kartentypen werden abgelehnt.
- Resolver verändern nur erlaubte Statebereiche.
- Resolver-Registry validiert Resolvernamen, Visibility-Klasse, Risk Flags, Test-IDs und Per-Card-Deviation.
- minimale KI-Rollen-Tags validieren Side, Rolle, Risk Flags und Bezug zur spielbaren Karte.
- `validateGameState` bleibt nach jedem Effekt grün.

### 12.2 Szenario-Tests

Pflicht:

- mindestens ein Szenario pro spielbarer Karte,
- kombinierte Runner-/Corp-Szenarien für Interaktion,
- Szenarien für Score, Steal, Trash, Rez, Break, ETR, Tags und neue Teilgates,
- negative Szenarien für geblockte oder falsch eingesetzte Karten.

### 12.3 Visibility-Tests

Pflicht:

- PlayerViews enthalten keine verdeckten gegnerischen Kartenidentitäten.
- PublicEvents enthalten keine privaten Payloads.
- WebSocket-, Reconnect-, Undo-, Error- und Diagnostics-Payloads bleiben side-gefiltert.
- Access-, Draw-, Damage- oder Reveal-Pfade haben eigene Leak-Scans.
- Hidden Cards enthalten keine Bildmetadaten, Titel, IDs oder DOM-Hilfsdaten.

### 12.4 Replay- und StateHash-Tests

Pflicht:

- jedes V0.8-Szenario hat reproduzierbaren finalen StateHash,
- Replay nutzt Seed, RandomCounter, RandomDrawRecords, RulesBaseline und Deck-Snapshot,
- gleiche Inputs erzeugen gleiche Hashes,
- andere Deck-Snapshots oder Seeds erzeugen erwartbar andere Hashes,
- Golden Hashes werden erst nach bestandenem Szenario- und Visibility-Lauf eingefroren,
- absichtliche Golden-Hash-Änderungen nennen Ursache, betroffene Szenarien, alte/neue Hashes und Review-Entscheidung in `MVP_0.8_STATEHASH_REVIEW.md`,
- RandomDrawRecords enthalten nur das notwendige private Auditwissen und werden nicht öffentlich geleakt.

### 12.5 KI-Tests

Pflicht:

- KI wählt mit V0.8-Decks nur LegalActions,
- KI erhält nur PlayerView, LegalActions und side-gefilterte Events,
- KI-Smoke deckt jede neue spielbare Karte mindestens einmal als verfügbare oder beobachtete Karte ab,
- KI-vs-KI läuft mehrere Seeds ohne illegal action, Endlosschleife oder StateHash-Drift,
- Reason-Codes nennen keine verdeckten Karten.

### 12.6 Multiplayer-Tests

Pflicht:

- Human-vs-Human startet mit V0.8-Deck-Snapshots.
- Server revalidiert Decklegalität beim Matchstart.
- Reconnect während Action Phase, Run, Encounter und Access bleibt side-sicher.
- Undo vor Hidden-Info-Barriere funktioniert weiter.
- Undo nach Access, Draw, Damage oder relevanter Hidden-Info wird blockiert.
- simultane Actions, stale StateVersion und Idempotency bleiben korrekt.

### 12.7 Playability- und Balance-Smokes

Pflicht:

- kuratierte Runner-/Corp-Starterdecks laufen über mehrere Seeds bis zu Sieg, Niederlage oder sinnvollem Limit,
- beide Seiten können in Smoke-Matrix mindestens punkten oder Agenda-Fortschritt erzeugen,
- action-limit games und turn-limit games bleiben unter einem im Requirements-Freeze definierten Grenzwert,
- häufige Starthände ohne spielbare Linien werden als Deck- oder Kartenpoolproblem markiert,
- Score-/Steal-/Trash-/Run-/Rez-Pfade werden in realistischen Partien erreicht,
- Smokes prüfen Spielbarkeit, nicht Turnierbalance; harte Balancearbeit bleibt späteren Phasen vorbehalten.

### 12.8 Regression

Pflicht:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`
- vorhandene Engine-, AI-, Server-, Catalog-, Deck-, UI-, Visibility-, Replay- und StateHash-Tests bleiben grün.

## 13. Kritische Härtungen und Optimierungen

### 13.1 Hidden Info

- Redaction bleibt vor UI, KI und PublicEvents.
- Keine FullState-Payloads in Browser, KI, WebSocket, Reconnect, Undo, Replay oder Logs.
- Access-, Draw- und Damage-Pfade werden als Hidden-Info-Barrieren markiert.
- Fehlertexte nennen keine verdeckten Karten oder Resolverdetails.

### 13.2 Randomness

- Jeder zufällige Draw oder Discard nutzt Seed, RandomCounter und RandomDrawRecords.
- RandomDrawRecords sind Audit- und Replaydaten, keine PublicEvents.
- Replay darf keinen neuen Zufall ziehen.
- Szenarien fixieren Seed und erwarteten Hash.

### 13.3 Undo-Barrieren

- Hidden-Info-Barrieren werden zentral markiert.
- Undo vor Barriere nutzt Snapshots.
- Undo nach Barriere wird mit side-sicherer Begründung blockiert.
- Damage, Access, Reveal und zufällige Draw-/Discard-Effekte bekommen eigene Barriere-Tests.

### 13.4 Decklegalität

- `deck_legal` setzt `playable` voraus.
- Matchstart revalidiert Snapshots serverseitig.
- Formatprofile referenzieren konkrete Kartenpool- und RulesBaseline-Versionen.
- Import-only, blocked oder mechanic-gated Karten blockieren Matchstart.

### 13.5 Importstatus

- Import- und Katalogstatus bleiben read-only für die Engine.
- Statuspromotion erfolgt nur über Manifest, Tests und Review.
- Manuelle Overrides sind versioniert und diffbar.
- Externe IDs oder Kartentexte werden nie Resolver-Schlüssel.

### 13.6 Resolver-Modell

- Resolver sind explizit, typisiert und testbar.
- Die Resolver-Registry ist ein Must-Artefakt, nicht nur eine Codekonvention.
- Jede Registry-Zeile verbindet Karte, Resolvername, Visibility-Klasse, Risk Flags, Test-IDs, Szenario-IDs und Deviation-Kategorie.
- Resolver validieren Timing, Kosten, Ziele und Choices.
- Resolver erzeugen kanonische Events und side-gefilterte Payloads.
- Jeder Resolver dokumentiert betroffene Mechaniken und Hidden-Info-Risiken.

### 13.7 KI-Verhalten

- KI-Heuristiken werden um Kartenrollen erweitert, nicht um FullState.
- KI braucht Fallbacks, wenn neue Kartenrollen nicht bewertet werden können.
- V0.8 pflegt minimale Rollen-Tags wie `economy`, `draw`, `breaker_fracter`, `tag_punishment`, `taxing_ice`, `agenda_2pt`, `agenda_3pt` oder `asset_trash_target`.
- Diese Rollen dienen nur KI-Smokes und V0.9-Anschluss; sie sind keine Regelquelle.
- KI-Smokes prüfen LegalActions, Timeout/Fallback und Reason-Code-Sicherheit.
- V0.9-Verbesserungen werden nicht in V0.8 vorweggenommen.

### 13.8 Golden-Hash-Prozess

- Golden Hashes werden nach grünem Szenario-, Visibility- und Replay-Lauf erzeugt.
- Der Requirements-Freeze legt fest, welche Szenarien Golden Hashes bekommen.
- Jede absichtliche Änderung an einem Golden Hash braucht eine Review-Notiz mit Ursache, altem Hash, neuem Hash, betroffenen Karten, RulesBaseline und Deck-Snapshot.
- Unbegründete Hash-Drift ist ein Blocker.
- Golden Hashes dürfen nicht aktualisiert werden, um fehlerhafte Tests bequem grün zu machen.

### 13.9 Performance-Budget

V0.8 soll mehr Karten spielbar machen, ohne die autoritativen Pfade spürbar zu verlangsamen. Konkrete Zahlen werden im Requirements-Freeze kalibriert; als Planungsbudget gilt lokal:

| Pfad | Zielbudget pro typischem Aufruf |
|---|---:|
| `getLegalActions` | unter 10 ms |
| `applyAction` inklusive Validierung und Hash | unter 20 ms |
| `getPlayerView` | unter 10 ms |
| `hashState` für Szenario-State | unter 10 ms |
| KI-Smoke-Entscheidung mit V0.8-Deck | unter 50 ms |

Wenn ein Teilgate diese Budgets verletzt, muss es entweder optimiert, kleiner geschnitten oder als Blocker dokumentiert werden.

## 14. Risiken

| Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|
| Importstatus wird mit Spielbarkeit verwechselt | ungeprüfte Karten im Match | harte Statusregeln und Matchstart-Revalidierung. |
| Zu viele Karten auf einmal | Testmatrix explodiert | 8 bis 14 Karten und höchstens ein Teilgate. |
| Offizieller Kartentext wird faktisch Interpreter | Regeldivergenz | explizite Resolver und keine Textparser. |
| Damage zu früh im Hauptscope | Hidden-Info- und Undo-Fehler | Damage nur mit eigenem Teilgate. |
| Multiaccess/Trace/Prevention schleichen ein | komplexe Timingfehler | separate Mechanik-Gates. |
| KI spielt neue Karten illegal oder schlecht | instabile Smokes | LegalActions-only und Fallback-Heuristiken. |
| Multiplayer-Payloads leaken neue Karten | Fairnessbruch | Payload- und DOM-Leaktests je Risiko. |
| V0.8 repariert UI statt Karten | V0.7-Scope wird verwischt | UI nur nutzen, nicht neu schneiden. |
| Quellenentscheidung bleibt unklar | offizieller/fiktiver Scope verschwimmt | Requirements-Freeze muss lokalen Slice oder freigegebene Quelle entscheiden. |
| Kandidaten-Scoring wird mechanisch statt fachlich genutzt | gute Karten werden falsch blockiert oder schlechte aufgenommen | Score ist Review-Hilfe, keine automatische Freigabe. |
| Golden Hashes werden unkritisch aktualisiert | Regressionen werden maskiert | StateHash Review mit alter/neuer Hashspur. |
| Mehr LegalActions verlangsamen Kernpfade | schlechte UX und langsame Soaks | Performance-Budget und kleine Teilgates. |

## 15. Offene Entscheidungen

| ID | Entscheidung | Empfehlung |
|---|---|---|
| V08-O-001 | Exakte Kartenanzahl | Im Requirements-Freeze auf 8 bis 14 neue Karten begrenzen. |
| V08-O-002 | Erster Mechanik-Bucket | Zuerst keine neue riskante Mechanik; falls nötig Resources vor Damage. |
| V08-O-003 | Umgang mit Damage | Nur starten, wenn konkrete Karten es erzwingen und Random/Undo/Visibility-Gate steht. |
| V08-O-004 | Starter-Deck-Größe | Klein genug für schnelle Regression, groß genug für neue Kartenrollen. |
| V08-O-005 | Statusnamen | V0.5/V0.6-Statusmodell wiederverwenden und nur ergänzen, nicht neu erfinden. |
| V08-O-006 | V0.8.x Aufteilung | Nach Hauptslice entscheiden, ob Teilgates eigene Mikroversionen bekommen. |
| V08-O-007 | Basisset-/Starterset-Quelle | bevorzugt lokaler starterset-artiger Slice; offizielle Quelle nur nach dokumentierter Freigabe. |
| V08-O-008 | Scoring-Schwellen | Hidden-Info >= 4 und Engine-Aufwand >= 4 nur mit Teilgate oder explizitem Review aufnehmen. |
| V08-O-009 | Playability-Grenzwerte | Requirements-Freeze definiert erlaubte Quote für action-limit games, turn-limit games und tote Starts. |
| V08-O-010 | Performance-Budget | Zielwerte im Requirements-Freeze anhand aktueller Hardware und Deckgröße kalibrieren. |
| V08-O-011 | Golden-Hash-Reviewdatei | `docs/derived/MVP_0.8_STATEHASH_REVIEW.md` als Pflichtartefakt verwenden. |

## 16. Done-Kriterien

V0.8 ist fertig, wenn:

- V0.6- und V0.7-Gates grün und als Eingangsvoraussetzung dokumentiert sind,
- Requirements und Kartenkandidaten eingefroren sind,
- Quellen-/Nutzungsentscheidung für Basisset-/Starterset-Scope getroffen ist,
- der spielbare Slice explizit und klein genug dokumentiert ist,
- jede Kandidatenentscheidung über Scoring, Review und Block-/Aufnahmegrund nachvollziehbar ist,
- jede spielbare Karte Deviation/Approximation, Resolver-Registry-Eintrag, Visibility-Klasse, Risk Flags und minimale KI-Rollen-Tags hat,
- jede spielbare Karte Manifest, Resolver, Unit-Test, Szenario, Visibility-Test, Replay/StateHash und KI-Smoke hat,
- alle V0.8-Decks validierte immutable Snapshots mit Hashes sind,
- Import-only und blocked Karten keinen Matchstart erreichen,
- Human-vs-KI, KI-vs-KI und Human-vs-Human mit V0.8-Decks starten,
- Playability-/Balance-Smokes zeigen keine häufigen toten Partien oder action-limit games,
- Golden Hashes erzeugt und absichtliche Änderungen im StateHash Review dokumentiert sind,
- Performance-Budgets für `getLegalActions`, `applyAction`, `getPlayerView` und KI-Smokes eingehalten oder Blocker dokumentiert sind,
- Reconnect, Undo-Barrieren und side-gefilterte Payloads mit V0.8-Karten sicher bleiben,
- keine echten Kartenabbilder ohne V0.7-Asset-Gate genutzt werden,
- bekannte nicht umgesetzte Mechaniken als Teilgates oder Blocker dokumentiert sind,
- `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestehen.
