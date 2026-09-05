---
activityId: act-2026-09-05-hidden-node-character-improvement
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: release-implementation-agent
createdAt: 2026-09-05
startedAt: 2026-09-05
branch: codex/hidden-node-character-improvement
---

# Hidden Node: Spielweise erhalten und Konversion verbessern

## Auftrag und Zielprüfung

Der Nutzer hat den vorgeschlagenen fünfteiligen Prozess vollständig zur
direkten Umsetzung freigegeben, einschließlich begründeter kleiner
Deckanpassungen. Die Vorgabe ist ausreichend bestimmt. Der Paketprozess-Skill
steuert sequenzielle Arbeit, Einzelcommits, lokalen Main-Merge und Cleanup.

Ziel ist eine evidenzgestützte Verbesserung der generischen KI und bei Bedarf
des Standarddecks `standard_proteus_corp_hidden_node_control_2026_05_25`.
Der Charakter bleibt: glaubwürdiges Remote-Scoring, Fallen und Schadensdruck,
Region-/Node-Unterstützung und überwiegender Proteus-Kartenpool. Bug Zapper,
Fetal AI, Networked Center, Corporate Headhunters und Government Contract
bleiben zunächst als vorhandene charaktertragende Kandidaten erhalten.
Eine reine Rush-/Glacier-Ersatzliste erfüllt den Auftrag nicht.

## Annahmen und Nicht-Ziele

- Basis: `3e81f68e7f0b88437eb20a21b6a86e81e350bf31`, nach SP-082.
- Die sechs vorhandenen Änderungen im Main-Checkout gehören fremder E2E-Arbeit.
- Kein garantierter Siegquotensprung: Ein erfolgloses Experiment wird ehrlich
  verworfen; jeder nachgewiesene Ursachenfix benötigt eigene Gegenproben.
- Keine Deck-/Seed-Sonderfälle in produktiver KI; keine Änderung der Regeln.
- Keine Remote-Veröffentlichung, keine E-Mail oder Nachricht an Dritte.
- Vergleiche laufen im lokalen Simulator mit side-sicherem Input, ohne Server.
- Frühere Narrative (insbesondere automatisch übernommene Kennzahlen und
  generische Verlusttexte) sind Hypothesen; neue Aussagen werden aus
  Einzelergebnissen und tatsächlichen Entscheidungen berechnet.

## Controller-Invarianten und Fehlerbehandlung

Engine und aktuelle LegalActions bleiben die einzige Ausführungsautorität.
`corp.economy` besitzt Finanzierung, `corp.defend_servers` Schutz und ICE,
`corp.score_agenda` die Scorelinie, bestehende Punish-/Ambush-Owner ihre
Vorbereitung. Parent, Need, Provider und konkrete Invocation bleiben erhalten.
Unknown sperrt nur die unbewiesene Aussage. Gegnerische Hidden Info wird nie
zur Begründung einer Corp-Auswahl verwendet. Angriff und Ignorieren einer
Falle werden getrennt beurteilt; kein Nutzen setzt absichtlich schlechtes
Runner-Spiel voraus.

Fehler werden an der erzeugenden Schicht behoben. Keine pauschalen Boni,
Auswahl-Fallbacks oder Absenkung von Sicherheitsprüfungen. Bei fehlender
Evidence wird die Hypothese verworfen oder als offen dokumentiert. Ein echter
Blocker nennt Ursache und Removal Condition.

## Paketfolge

`HN-A aktiv -> HN-B -> HN-C -> HN-D -> HN-E -> Main -> Cleanup`

### HN-A: Identität, Messung und reproduzierbare Ausgangslage

- Eingang: unveränderter Basisstand und vorhandene Deck-/Registry-Evidence.
- Arbeit: Deckidentität und Messgrößen festhalten; reproduzierbaren
  Simulatorvergleich mit vollständigen Quellen und kompakten Resultaten
  vorbereiten; drei bis fünf konkrete Zustände für Economy, Schutz und Fallen
  auswählen; direkte Verluste und Grenzen belegen.
- Artefakte: Test-/Evaluationsskript, lokale Evidence, dieses Paketprotokoll.
- Checks: kleiner deterministischer Pilot, Ergebnisabgleich und diff-check.
- Done: Ausgangsverhalten und erster Verlustpunkt je untersuchter Fähigkeit
  sind belegt oder die Hypothese explizit als unbewiesen markiert.
- Commit: `test(ai): establish hidden node capability baseline`.

### HN-B: Finanzierung und Schutzkonversion

- Eingang: HN-A fertig; konkrete Fehler- oder Grenzenanalyse.
- Arbeit: Government-Contract-Funktion generisch über vollständige
  Kosten-/Zweckbindungs-/Verfallsquote untersuchen; bewiesene Lücken bei den
  vorhandenen Economy-/Defense-Ownern vertikal schließen.
- Artefakte: betroffene Semantik/Quotes/Planmodule und Regressionen.
- Checks: aktuelle Action, Ownership, Ressourcenverbrauch, kein nutzbarer
  Verbraucher, Unknown und Folgeausführung; Typecheck nur bei Typänderung.
- Done: Bessere Route produktiv belegt oder begründetes No-change-Ergebnis.
- Commit: `fix(ai): close proven hidden node funding gaps` (bei No-change docs).

### HN-C: Bedingte Fallen- und Schadensvorbereitung

- Eingang: HN-B fertig.
- Arbeit: aktuelle Wirkung und spätere Kampagnenwirkung unterscheiden;
  vorhandene Punish-/Ambush-Owner auf überstrenge Zulassung untersuchen;
  bewiesene generische Lücke mit Angriffs-/Ignorier-Gegenfällen schließen.
- Artefakte: fokussierte Regressionen und gegebenenfalls Ownerfix.
- Checks: exakte heutige Wirkung, keine garantierte Flatlinebehauptung,
  Hidden-Info-Äquivalenz und Ende nutzloser Vorbereitung.
- Done: konkreter produktiver Nachweis oder explizit begründetes No-change.
- Commit: `fix(ai): preserve productive conditional preparation` (oder docs).

### HN-D: Kleine charaktererhaltende Deckvarianten

- Eingang: HN-C fertig; Originaldeck mit neuem KI-Stand gemessen.
- Arbeit: höchstens zwei Varianten mit je zwei bis vier getauschten Slots
  anhand verbleibender Engpässe prüfen. Thematischer Kern und Format bleiben.
  Original und Varianten verwenden dieselbe KI und dieselben Pilotseeds.
- Artefakte: reproduzierbare Variantenbeschreibung, Deckvalidierung,
  vergleichbare Messung und Entscheidung.
- Checks: Format, Slotdifferenz, thematischer Kern, echte Effekte statt bloßer
  Installationszahlen. Übernahme erst nach HN-E-Kontrolle.
- Done: begründete Auswahl einer Variante oder Beibehaltung des Originals.
- Commit: `test(decks): compare identity-preserving hidden node variants`.

### HN-E: Kontrollvergleich, Übernahme und Abschluss

- Eingang: HN-D fertig.
- Arbeit: Basis-KI/Original, neue KI/Original und gegebenenfalls Kandidat
  getrennt vergleichen: 40 bekannte Krashkurs-Seeds, vorab festgelegte frische
  Seeds und zwei weitere unterschiedliche Runnerdecks. Mindestens zehn
  frische Seeds je zusätzlichem Gegner; keine nachträgliche Seedselektion.
- Metriken: Sieg/Terminalgrund, Scorepunkte und erste Meilensteine, tatsächlich
  finanzierte Schutzaktionen, Economy-Konversion, Fallen-/Regionbeitrag und
  Runtime-/Replayintegrität. Keine pauschale Gleichsetzung von null
  Auswahlen mit null Kartenwirkung. Rohdaten und Nenner müssen abstimmen.
- Artefakte: kompakte Evidence in zentraler Registry, gegebenenfalls
  aktualisierte Standardliste/Deckbeschreibung, erforderliche lebende Verträge.
- Checks: direkt betroffene Regressionen, reproduzierbare Resultate,
  Registry-Integrität, diff-check. Kein automatischer Volltestlauf.
- Done: Nur belegte Verbesserungen übernommen; Restunsicherheit transparent;
  jeder Teil abgeschlossen und committed.
- Commit: `feat(decks): improve hidden node without losing its identity` oder
  `docs(ai): record hidden node improvement evidence` bei unverändertem Deck.

## Worktree und Abschluss

Arbeitsort: `C:\Projekte\NETGRID-worktrees\hidden-node-character-improvement`.
Branch: `codex/hidden-node-character-improvement`. Main: `C:\Projekte\NETGRID`.
Genau ein Paket ist aktiv. Jeder Abschluss braucht fokussierte grüne Checks,
diff-check und einen eigenen Commit. Vor Main-Integration dessen neue
Änderungen defensiv abgleichen. Fremde E2E-Arbeit bewahren.

`/Goal Arbeite HN-A bis HN-E vollständig im genannten Worktree ab. Lies die
Projekt- und KI-Verträge, beweise Ursachen vor Änderungen, halte Charakter
und side-sichere Ownership ein, committe jedes Paket. Integriere anschließend
lokal nach main, prüfe die betroffenen Pfade und entferne Worktree und Branch
nach nachgewiesenem Merge. Markiere das Goal erst nach verifiziertem Cleanup
als complete.`

## Fortschritt

HN-A aktiv. Preflight und Worktree angelegt; keine Verhaltensänderung.
