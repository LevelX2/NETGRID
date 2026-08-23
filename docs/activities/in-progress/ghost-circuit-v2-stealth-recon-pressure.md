# Ghost Circuit v2 – Stealth Recon Pressure

Status: in_progress  
Quelle/Vorgabe: Nutzerauftrag vom 2026-08-23

Aktueller Zustand: `doctrine_and_guide_aligned`

## Zielprüfung

Die Vorgabe ist für eine automatische Umsetzung ausreichend präzise. Deckname,
Kartenpool, vollständige 45-Karten-Liste, strategische Leitlinie, bestehender
Standarddeck-Eintrag und erwartete KI-Wirkung sind bestimmt. Die genaue
Reihenfolge der JSON-Kartenzeilen folgt der vorhandenen stabilen Karten-ID-
Sortierung.

## Gesamtziel

Den bestehenden Standarddeck-Eintrag `standard_runner_ghost_circuit` im Pool
`private-local-onr-v1` durch Ghost Circuit v2 ersetzen. Das Deck trägt danach
die Linie Recon → passendes Breaker-Profil suchen → Stealth-finanziert
durchbrechen → HQ/R&D mit Multiaccess wiederholt angreifen und wird von der
bestehenden DeckDoctrine- und Strategic-Intent-Pipeline entsprechend erkannt.

## Annahmen

- `standardDeckId` und sichtbarer Deckname `Ghost Circuit` bleiben stabil;
  die Deckversion wird auf `2.0.0` angehoben.
- `source.kind` und `sourceDeckId` bleiben stabil; `sourceDeckVersion` bezeichnet
  die neue lokale Stealth-Recon-Fassung.
- Die bestehende generische Karten- und KI-Semantik reicht aus. Produktiver
  KI-Code wird nur geändert, falls ein fokussierter Test eine echte semantische
  Lücke statt lediglich veralteter Ghost-Circuit-Erwartungen belegt.
- Der Standarddeck-Guide wird in Deutsch und Englisch auf die neue Deckidee
  aktualisiert, weil seine Analyse- und Inhaltsbindung durch die Deckänderung
  sonst veraltet wäre.

## Nicht-Ziele

- Keine Proteus-, Classic- oder Testset-Karten.
- Keine neue Kartenmechanik und keine Änderung an Engine-Legalität.
- Kein neuer KI-Plan, Choice-Resolver, Kartenname-Sonderfall oder globaler
  Bewertungsbonus.
- Kein breiter Selfplay-, Workspace-, Build- oder E2E-Lauf.
- Kein Push und keine Remote-Integration.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- DeckDoctrine leitet nur Strategie und Fähigkeiten aus dem eigenen Deck ab;
  sie wählt keine Action.
- `runner.rig_and_coverage` bleibt Owner für Coverage, Breaker-Suche und
  Minimal-Rig-Entwicklung.
- `runner.pressure_central` bleibt Owner für HQ-/R&D-Zielwahl, Interface-
  Entwicklung und wiederholten Central-Druck.
- Economy unterstützt nur gebundene Bedarfe und übernimmt weder Runziel noch
  Breakerwahl.
- Keine zweite Entscheidungsautorität und keine Hidden-Info-Nutzung.

## Automatische Fehlerbehandlung

- Unbekannte Karten-ID, Poolverletzung, falsche Kartenzahl oder Guide-Drift:
  an der Deck-/Guide-Quelle korrigieren und den fokussierten Check wiederholen.
- Unerwartete Doctrine-Klassifikation: Karten-Hints und Aggregation diagnostisch
  prüfen; keinen Ghost-Circuit-Sonderfall ergänzen.
- Rote Tests: im aktuellen Paket bleiben, Ursache eng beheben, Done-Gate erneut
  ausführen.
- Neue unabhängige Findings als Follow-up klassifizieren und nicht still in den
  Scope aufnehmen.

## Sicherheitsblocker

Ein Sicherheitsblocker liegt vor, wenn die gewünschte Strategie nur durch
Hidden-Info-Zugriff, neue Action-Autorität, einen Resolver-Shortcut oder eine
nicht im Originalset enthaltene Karte erreichbar wäre. Dann stoppt der Prozess
mit einem Blockerbericht und einer konkreten Removal Condition.

## State Machine

`prepared → deck_replaced → doctrine_and_guide_aligned → verified → merged → cleaned`

Genau ein Paket ist aktiv. Ein Übergang erfolgt erst nach erfülltem Done-Gate
und Paketcommit.

## Paketfolge

1. `GC2-01` – Prozessvertrag und Ausgangslage sichern.
2. `GC2-02` – Standarddeck-Liste und Versionsbindung ersetzen.
3. `GC2-03` – Doctrine-/Intent-Erwartungen und zweisprachigen Guide ausrichten.
4. `GC2-04` – Änderungsnahe Endverifikation, Wissensrückführung, Activity-
   Cleanup und lokale Main-Integration.

## Paketdetails

### GC2-01 – Prozessvertrag und Ausgangslage

- Ziel: ausführbaren Scope, Owner und Gates festschreiben.
- Eingang: Pflichtquellen, Release-Implementation-Agent und KI-Preflight gelesen.
- Arbeit: dieses Artefakt anlegen; aktuelle Deck-, Guide- und Testbindungen
  identifizieren.
- Kernartefakt: diese Activity.
- Checks: `git diff --check`; Worktree-/Branch-Status.
- Done-Gate: präziser Prozessvertrag liegt im Arbeitsbranch vor.
- Commit: `docs: define Ghost Circuit v2 package process`

### GC2-02 – Standarddeck ersetzen

- Ziel: exakt die vorgegebenen 45 Originalset-Karten im bestehenden Eintrag.
- Eingang: GC2-01 abgeschlossen.
- Arbeit: Deckversion, Quellenversion und Kartenliste aktualisieren; stabile
  IDs und Mengen prüfen.
- Kernartefakt: `data/decks/standard-deck-catalog-1.0.0.json`.
- Checks: fokussierter `@netgrid/decks`-Katalogtest, exakte Mengen-/Poolprüfung,
  `git diff --check`.
- Done-Gate: 45 Karten, 27 eindeutige Kartenzeilen, ausschließlich
  `onr_v1_*`, Deckformat gültig.
- Commit: `feat(decks): rebuild Ghost Circuit for stealth recon pressure`

### GC2-03 – Doctrine, Intent und Guide ausrichten

- Ziel: generische KI-Erkennung und verständliche Spielanleitung bilden die
  neue Komposition ab.
- Eingang: GC2-02 abgeschlossen und katalogvalide.
- Arbeit: alte Neutral-/Coverage-Lücken-Erwartungen durch positive
  Rig-/Search-/HQ-/R&D-Nachweise ersetzen; zweisprachigen Guide samt
  Analysebindungen und Key Cards aktualisieren.
- Kernartefakte: fokussierte AI-Tests und
  `data/decks/standard-deck-guides-2.0.0.json`.
- Checks: betroffene AI-Testdateien,
  `corepack pnpm check:ai-deck-doctrine-strategy`,
  `corepack pnpm check:standard-deck-guides`, `git diff --check`.
- Done-Gate: Ghost Circuit ist nicht neutral, relevante Strategien sind
  produktiv, Guide und Hashbindungen sind aktuell, Owner bleiben unverändert.
- Commit: `test(ai): recognize Ghost Circuit stealth central strategy`

Verifikation 2026-08-23: Die drei fokussierten AI-Dateien bestehen mit 46/46
Tests, der Decktest mit 20/20 Tests und der Guide-Check mit 48/48 Decks. Das
Doctrine-Gate wurde ausgeführt und scheitert auf Arbeitsbranch und unverändertem
Main-Basisstand identisch an `Legacy planRole created Runner R&D pressure
anchor`; dies ist ein unabhängiger vorhandener Baseline-Fehler außerhalb der
geänderten Deck-, Guide- und Erwartungsdateien.

### GC2-04 – Abschluss und Integration

- Ziel: sauberen, integrierten und aufgeräumten Endzustand herstellen.
- Eingang: GC2-01 bis GC2-03 committed und grün.
- Arbeit: wiederverwendbare Änderung im August-Log vermerken; diese kurzlebige
  Activity entfernen; direkt änderungsnahe Checks erneut ausführen; aktuelles
  `main` defensiv integrieren; lokal nach `main` mergen; Task-Worktree und
  Branch entfernen und doppelt verifizieren.
- Kernartefakt: `KI-Wissen-NETGRID/03 Betrieb/Log 2026-08.md`.
- Checks: fokussierte Deck-/Doctrine-/Guide-Checks, `git diff --check`, saubere
  Git-Status vor und nach Merge.
- Done-Gate: Main enthält alle Paketcommits; Task-Worktree und Arbeitsbranch
  existieren nicht mehr; kein offener relevanter Restpunkt.
- Commit: `docs: record Ghost Circuit v2 completion`

## Verifikationsregeln

- Iterativ nur direkt änderungsnahe Tests ausführen.
- Type-/Strukturchecks nur, wenn eine entsprechende Oberfläche geändert wird.
- Nach einem Main-Abgleich nur durch neue Main-Änderungen berührte Checks
  ergänzen.
- Vor jedem Paketcommit und nach Main-Merge `git diff --check` ausführen.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_GHOST_CIRCUIT_V2`
- Arbeitsbranch: `codex/ghost-circuit-v2`
- Basis und lokaler Integrationsbranch: `main`
- Der primäre Checkout bleibt auf seinem fremden Arbeitsbranch unangetastet.
- Für den finalen Merge wird bei Bedarf ein separater kurzlebiger Main-
  Integrations-Worktree verwendet.
- Je Paket nur paketzugehörige Änderungen stagen und committen.
- Kein Push, kein PR, kein `git reset --hard`, kein pauschales Revert.

## Controller-Prompt-Kern

`/Goal Arbeite Ghost Circuit v2 – Stealth Recon Pressure vollständig und
sequenziell von GC2-01 bis GC2-04 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die
Pflichtseiten der Wissensbasis, packages/ai/AGENTS.md, den KI-
Änderungskompass und dieses Prozessartefakt. Arbeite ausschließlich im
Worktree C:\Projekte\NETGRID_GHOST_CIRCUIT_V2 auf Branch
codex/ghost-circuit-v2; nutze einen Main-Checkout nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket, führe ausschließlich änderungsnahe
Checks aus, committe jedes abgeschlossene Paket und stoppe bei einem echten
Sicherheitsblocker mit Removal Condition. Markiere das Goal erst complete,
wenn Main geprüft, der Task-Worktree entfernt, seine Entfernung in Git und
Dateisystem verifiziert und der gemergte Arbeitsbranch gelöscht ist.`

## Abschlusskriterien

- Exakte 45-Karten-Liste im bestehenden Ghost-Circuit-Standarddeck.
- Ausschließlich Karten aus `private-local-onr-v1`; kein Proteus.
- Generische Doctrine erkennt Rig-/Breaker-Suche und HQ-/R&D-Druck ohne
  Karten-Sonderlogik.
- Zweisprachiger Guide beschreibt Opening, Midgame, Endgame, Kernkarten,
  Minimal-Rig-Prinzip und Schwächen der neuen Liste.
- Direkt angrenzende Checks grün; Paketcommits vollständig.
- Lokaler Main-Merge, Main-Prüfung, Worktree- und Branch-Cleanup verifiziert.
