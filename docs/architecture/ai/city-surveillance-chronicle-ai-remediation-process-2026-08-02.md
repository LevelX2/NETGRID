# City-Surveillance-Chronicle- und KI-Remediation

Status: **in Umsetzung**  
Quelle: Playtest-Fund und vollständige Analyse von
`match_b0b0bffec6715028`  
Primärer Agent: `release-implementation-agent`  
Arbeitsbranch: `codex/city-surveillance-chronicle-ai`  
Arbeits-Worktree:
`C:\Projekte\NETGRID_CITY_SURVEILLANCE_CHRONICLE_AI`

## Zielprüfung

Die Vorgabe ist vollständig genug für eine direkte sequenzielle Umsetzung.
Das gespeicherte Spiel belegt sowohl die korrekte Engine-Auflösung als auch
vier Darstellungsfehler und eine falsche KI-Planentscheidung.

## Gesamtziel

City Surveillance bleibt regeltechnisch unverändert korrekt, wird aber in
Chronik und Aktionshinweisen mit ihrem tatsächlichen Ergebnis dargestellt.
Mehrkarten-Draws werden als zusammengehörige Sequenz verständlich, eine
verwendete Präventionskarte wird nicht mit der Tagquelle verwechselt und eine
Flatline wird eindeutig benannt. Der vorhandene Owner
`runner.rig_and_coverage` berücksichtigt für seine Draw-/Search-Route die
side-sicher sichtbare, Engine-zertifizierte Draw-Tax-Folgelast und wählt im
gespeicherten Entscheidungspunkt nicht mehr die ruinöse Fünf-Karten-Aktion.

## Annahmen

- Die per Karte einzeln suspendierte City-Surveillance-Auflösung bleibt
  unverändert die Regelautorität.
- `drawCardsAmount`, sichtbare gerezzte Draw-Tax-Quellen, aktuelle Runner-
  Credits und Engine-LegalActions genügen für eine konservative Projektion.
- Die Projektion endet am Draw. Gezogene Karten und zukünftige Folgeaktionen
  werden nicht vorhergesagt.
- Lokale SQLite-Daten werden ausschließlich read-only als Evidence genutzt
  und nicht versioniert.

## Nicht-Ziele

- keine Karten-ID-Sonderlogik in der produktiven KI;
- kein neuer Chooser, Resolverplan, Override oder Fallback;
- keine Änderung von City-Surveillance-Legalität, Tagprävention oder
  Scorched-Earth-Regelwirkung;
- keine Migration historischer lokaler Matches;
- kein Push, Pull Request oder Produktversionswechsel.

## Controller-Invarianten

1. Genau ein Paket ist aktiv; kein Paket wird übersprungen.
2. Jedes Paket erhält eigene Checks, `git diff --check` und einen Commit.
3. Die Engine bleibt einzige Regelautorität; KI und UI konsumieren nur
   side-sichere bestehende Verträge.
4. Owner der fraglichen freiwilligen Entscheidung bleibt die residente
   Instanz `runner.rig_and_coverage:coverage:breaker_sentry`, Phase
   `draw_for_answer`, Step `draw_for_answer_breaker_sentry`.
5. Engine-Choices D58 bis D63 ergänzen ausschließlich die bereits laufende
   Draw-Sequenz; sie treffen keine neue Strategieentscheidung.
6. Die historische Action-ID und StateVersion werden im Checkpoint gebunden;
   der Fix darf keine alternative Entscheidungsautorität einführen.
7. Hidden-Info-, Replay-, StateHash- oder IllegalAction-Abweichungen sind
   Sicherheitsblocker.

## Automatische Fehlerbehandlung

- Rote Pakettests werden im aktiven Paket eng diagnostiziert und behoben.
- Unklare Projektionen bleiben `assessment_unknown` beziehungsweise
  unproduktiv; sie werden nicht auf null oder auf einen sicheren Effekt
  geschätzt.
- Eine fehlende aktuelle Engine-Quote wird nicht durch Kartenname,
  Kartentext oder statische Kosten ersetzt.
- Neue fachlich unabhängige Findings werden als Follow-up dokumentiert und
  erweitern den Paketumfang nicht still.

## Sicherheitsblocker

Der Prozess stoppt bei Hidden-Info-Leak, IllegalAction, Replay-/StateHash-
Abweichung, Nondeterminismus, veralteter Action-ID, geändertem Executor oder
einem roten Gate ohne eng benannten Owner und Removal Condition.

## State Machine

```text
planned
→ package_active
→ package_verifying
→ package_committed
→ next_package
→ final_verifying
→ main_integrating
→ worktree_cleaning
→ complete
```

## Paketfolge

| Paket | Titel | Ergebnis |
| --- | --- | --- |
| CS00 | Prozess und Ausgangsevidence | verbindlicher Scope und Pakete |
| CS01 | Chronicle-Echtspielkorrekturen | eindeutige, nicht doppelte Darstellung |
| CS02 | Draw-Tax-Planvertrag | gespeicherter Checkpoint und KI-Korrektur |
| CS03 | Gesamtverifikation und Abschluss | Reviews, Gates, Main-Integration |

## CS00 – Prozess und Ausgangsevidence

### Ziel

Den vollständigen 65/65-Entscheidungsaudit, die vier UI-Befunde, den einen
KI-Befund und die Ownergrenze als unveränderte Ausgangsevidence sichern.

### Kernartefakte

- dieses Prozessdokument;
- lokaler Match `match_b0b0bffec6715028` als read-only Quelle;
- Ausgangscommit `40667b5b6` für konkrete City-Choice-Texte.

### Done-Gate

- Paketfolge, Owner, Nicht-Ziele und Sicherheitsgrenzen sind benannt;
- Worktree und Branch sind isoliert;
- noch kein produktiver KI-Code geändert.

### Commit

`docs(ai): plan City Surveillance chronicle remediation`

## CS01 – Chronicle-Echtspielkorrekturen

### Ziel

Die realen Events 107 bis 118 aus Sicht beider Seiten korrekt und ohne
Hidden-Info-Leak formatieren.

### Konkrete Arbeit

- Credit- und Tagentscheidung konkret benennen;
- automatischen Tag-Effekt nicht zusätzlich als Duplikat ausgeben;
- Fall Guy als getrashte Präventionskarte und City Surveillance als
  Tagquelle getrennt darstellen;
- Bodyweight als Fünf-Karten-Draw statt als Einzelkarte darstellen;
- zweite Scorched Earth als Flatline kenntlich machen;
- bestehende breit formatierte Testdatei auf einen fokussierten Diff
  zurückführen.

### Checks

```text
corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts app/action-cues.test.ts
corepack pnpm --filter @netgrid/web typecheck
git diff --check
```

### Done-Gate

- jeder reale Befund besitzt einen Regressionstest;
- keine doppelte Chronicle-/Cue-Zeile für denselben Tag;
- keine verdeckte Kartenidentität wird neu veröffentlicht.

### Commit

`fix(web): clarify City Surveillance draw sequence outcomes`

## CS02 – Draw-Tax-Planvertrag

### Ziel

Entscheidung 57 wird spielgleich gesichert und der vorhandene
`runner.rig_and_coverage`-Owner verwirft eine Draw-for-Answer-Route, deren
sichtbare Draw-Tax-Folgelast die konkrete Coverage-Suche unvertretbar macht.

### Konkrete Arbeit

- Entscheidung 57 vor der Korrektur als Decision Checkpoint erfassen;
- Producer-/Consumer-Grenze für generische Draw-Anzahl und Draw-Tax-
  Projektion bestimmen;
- LegalAction-/ActionSemantic-Evidence side-sicher und ohne Karten-ID
  vervollständigen;
- die planinterne Route des bestehenden Rig-/Coverage-Plans korrigieren;
- Owner, Step, Route, Executor und Action-ID-Bindung in Tests sichern;
- positive bezahlbare Ein-Karten- und negative Multi-Draw-Gegenfälle testen;
- Deck-Hint-Consumer-Audit für den gespeicherten Decksnapshot ausführen.

### Checks

```text
corepack pnpm --filter @netgrid/ai exec vitest run <fokussierte Testdateien>
corepack pnpm --filter @netgrid/engine exec vitest run <fokussierte Testdateien>
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm check:ai-source-structure
corepack pnpm check:ai-generic-card-id-guards
git diff --check
```

### Done-Gate

- der Checkpoint ist vor dem Fix rot und danach grün;
- Entscheidung 57 wählt nicht mehr Bodyweight;
- `runner.rig_and_coverage`, Planinstanz, Step und Executor bleiben Owner;
- D58 bis D63 bleiben reine Engine-Fortsetzungen;
- kein Kartenname und keine Karten-ID steuert die Entscheidung.

### Commit

`fix(ai): account for visible multi-draw tax liability`

## CS03 – Gesamtverifikation und Abschluss

### Ziel

Den zusammengeführten Stand fachlich dokumentieren, breit verifizieren und
lokal nach `main` integrieren.

### Konkrete Arbeit

- Final Review mit 65/65-Audit, Vorher-/Nachher-Evidence und Restpunkten;
- AI-README beziehungsweise Projektwissen nur bei dauerhaft neuem Vertrag
  aktualisieren;
- vollständige relevante Web-, Engine- und AI-Gates ausführen;
- aktuelles `main` in den Arbeitsbranch integrieren;
- final nach `main` mergen und Cleanup verifizieren.

### Finale Checks

```text
corepack pnpm --filter @netgrid/web typecheck
corepack pnpm --filter @netgrid/engine typecheck
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm test:ai:shards
corepack pnpm check:ai
corepack pnpm check:ai-source-structure
corepack pnpm check:ai-generic-card-id-guards
corepack pnpm check:ai-deck-doctrine-strategy
git diff --check
```

### Done-Gate

- alle Paket- und Finalchecks sind grün;
- Arbeitsbranch ist sauber und vollständig committed;
- lokaler Main-Merge, Worktree-Entfernung und Branch-Löschung sind
  nachgewiesen.

### Commit

`docs(ai): close City Surveillance chronicle remediation`

## Controller-Prompt-Kern

```text
/Goal Arbeite die City-Surveillance-Chronicle- und KI-Remediation vollständig
und sequenziell von CS00 bis CS03 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main.

Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_CITY_SURVEILLANCE_CHRONICLE_AI auf Branch
codex/city-surveillance-chronicle-ai. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus
und committe jedes bestandene Paket. Erhalte den bestehenden Planowner und
führe keine Karten-ID-, Resolver-, Override- oder Fallback-Autorität ein.

Nach CS03: aktuelles main integrieren, finale Checks wiederholen, lokal nach
main mergen, main prüfen, den sauberen Worktree entfernen, Entfernung in Git
und Dateisystem verifizieren und den gemergten Branch löschen. Goal erst
danach als complete markieren.
```

## Abschlusskriterien

- CS00 bis CS03 sind jeweils mit bestandenem Done-Gate committed;
- Chronicle und Aktionshinweise entsprechen dem realen Engine-Ablauf;
- der historische KI-Befund ist spielgleich geschlossen;
- keine zweite Entscheidungsautorität und kein Hidden-Info-Leak;
- Arbeitsbranch ist lokal nach `main` integriert;
- Worktree und Arbeitsbranch sind nachweislich entfernt.
