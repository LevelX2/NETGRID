# City-Surveillance-Einzelziehentscheidungen – Umsetzungsprozess

## Status

P01 bis P06 sind fachlich abgeschlossen. Die lokale Main-Integration und der
verifizierte Worktree-/Branch-Cleanup stehen noch aus. Umsetzung im Worktree
`C:\Projekte\NETGRID_CITY_SURVEILLANCE_DRAW_CHOICES` auf Branch
`codex/city-surveillance-draw-choices`.

Paketfortschritt:

- P01: rote Regel-Evidence, Commit `3e560570e`.
- P02: fortsetzbare Einzelziehsequenz, Commit `03623a079`.
- P03: Mehrfachziehen, mehrere Quellen, Stack-Ende und Crash Everett, Commit
  `6cfa795fa`.
- P04: gedrucktes Pre-Draw-Rez-/Pass-Fenster, Commit `ab95d6edf`.
- P05: generische UI-, produktive KI-, PlayerView- und Replay-Härtung, Commit
  `06e110735`.
- P06: unabhängiger Abschlussreview, Arasaka-Nicht-Draw-Gegenprobe,
  Wissenspflege und vollständige Verifikation abgeschlossen.

## Quelle und Vorgabe

- Kartentext: Für jede vom Runner gezogene Karte erhält der Runner einen Tag,
  sofern er nicht 1 Credit bezahlt; City Surveillance darf unmittelbar vor
  dem Ziehen gerezzt werden.
- Offizielle Ruling-Evidence in `docs/source/Netrunner Errata 1.70.md`: Bei
  `Jack 'n' Joe` sind drei Tags, drei Credits oder jede Mischung daraus
  zulässig.
- Nutzerfund: Mehrfachziehen wird derzeit ohne Auswahl automatisch mit Credits
  bezahlt.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung ausreichend präzise. Der erwartete
Endzustand, die betroffenen Engine-Grenzen, die Regelreferenz und die
Verifikationsanforderungen sind bestimmbar.

## Gesamtziel

Runner-Ziehsequenzen werden fortsetzbar und regelgetreu aufgelöst. Vor jeder
einzelnen gezogenen Karte erhält die Korp das gedruckte Rez-/Pass-Fenster für
eine installierte, bezahlbare City Surveillance. Anschließend entscheidet der
Runner für jede aktive City-Surveillance-Quelle frei zwischen 1 Credit und
1 Tag. Mehrfachziehen, zusätzliche Draws, mehrere Quellen, leere Stacks,
Replay, PlayerViews, UI und KI bleiben deterministisch und hidden-info-sicher.

## Annahmen

- `Jack 'n' Joe` ist der im Nutzerfund gemeinte Drei-Karten-Draw.
- „Bit“ aus dem Originalspiel entspricht im aktuellen UI „Credit“.
- Jede rezzed City-Surveillance-Kopie erzeugt pro tatsächlich gezogener Karte
  eine eigene Vermeidungsentscheidung.
- Eine kompakte UI-Darstellung ist zulässig, die Engine modelliert jedoch jede
  Entscheidung einzeln, damit Zwischenzustände und weitere Trigger korrekt
  bleiben.
- Bereits begonnene Ziehsequenzen werden nach Choices automatisch fortgesetzt;
  die ursprüngliche Karte oder Aktion wird nicht erneut bezahlt oder gespielt.

## Nicht-Ziele

- Keine allgemeine Neufassung aller Trigger- oder Paid-Ability-Fenster.
- Keine Änderung von Effekten, die Karten nur ansehen, aufdecken, suchen oder
  in den Grip verschieben, ohne sie zu „ziehen“.
- Keine Remote-Integration, kein Push und kein Pull Request.
- Keine Legacy-Migration für lokale Version-0-Spielstände oder Replays.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Nur Engine-erzeugte `LegalActions` und `ChoiceRequests` dürfen eine
  Ziehsequenz fortsetzen.
- `applyAction` revalidiert Quelle, Kosten, Seite, Sequenzstand,
  `stateVersion` und Timing.
- Gezogene Kartenidentitäten bleiben ausschließlich in der Runner-Sicht.
- PublicEvents nennen nur öffentliche Quellen, Counts, Credits und Tags.
- Replay und StateHash reproduzieren jede Einzelentscheidung.
- Genau ein Paket ist aktiv; Pakete werden nicht übersprungen.

## Automatische Fehlerbehandlung

- Ist keine City Surveillance installiert oder rezzed, läuft das Ziehen ohne
  zusätzliche Choice weiter.
- Ist eine installierte City Surveillance nicht bezahlbar zu rezzen, wird nur
  „passen“ angeboten.
- Kann der Runner 1 Credit nicht bezahlen, bleibt nur „1 Tag nehmen“ legal.
- Ist der Stack vor oder während einer Sequenz leer, endet die Sequenz mit der
  tatsächlich gezogenen Anzahl.
- Verändert eine vorherige Entscheidung Quellen oder Credits, werden die
  LegalActions für den nächsten Schritt aus dem aktuellen State neu erzeugt.
- Rote Tests blockieren das nächste Paket, bis Ursache oder erwartete
  Regeländerung dokumentiert ist.

## Sicherheitsblocker

- Ein PlayerView-, PublicEvent-, WebSocket-, Reconnect- oder AI-Payload leakt
  eine gezogene Kartenidentität an die Korp.
- Eine Choice kann mit veralteter `stateVersion`, falscher Seite, falscher
  Quelle oder ohne ausreichende Credits angewendet werden.
- Eine laufende Sequenz kann übersprungen, doppelt fortgesetzt oder durch eine
  normale Hauptaktion umgangen werden.
- Replay oder StateHash weichen nach einer Sequenz ab.

## State Machine

`idle -> draw_requested -> pre_draw_rez_window -> draw_card ->
city_source_decision* -> next_draw_or_complete -> idle`

- `draw_requested`: Quelle, verbleibende Basismenge und Draw-Kontext sind
  gebunden.
- `pre_draw_rez_window`: Korp rezzt genau eine zulässige City Surveillance
  oder passt; danach wird das Fenster bei Bedarf erneut angeboten, bis sie
  passt oder keine weitere Quelle legal ist.
- `draw_card`: Genau eine Karte wird aus dem Stack in den Grip bewegt.
- `city_source_decision`: Pro beim Draw aktiver Quelle zahlt der Runner
  1 Credit oder nimmt 1 Tag.
- `next_draw_or_complete`: Zusatz-/Ersatzdraws und Restmenge werden
  deterministisch fortgesetzt; Follow-up-Choices wie Crash Everett öffnen erst
  nach der vollständigen Ziehsequenz.

## Paketfolge

1. P01 – Prozess, Regelvertrag und rote Evidence
2. P02 – Fortsetzbare Runner-Draw-State-Machine
3. P03 – Mehrfachziehen, mehrere Quellen und Draw-Ersatzfälle
4. P04 – Gedrucktes City-Surveillance-Rez-Fenster
5. P05 – UI-, AI-, Replay- und Hidden-Info-Härtung
6. P06 – Final Review, Wissenspflege und Gesamtverifikation

## Paketdetails

### P01 – Prozess, Regelvertrag und rote Evidence

- Ziel: Regelabweichung reproduzierbar festhalten und Implementierungsvertrag
  fixieren.
- Eingang: committed `main`-Stand `6f29d63ee`; fremde Änderungen im
  Hauptworkspace bleiben unangetastet.
- Arbeit: Prozessartefakt; fokussierte rote Tests für freie Mischentscheidung
  bei `Jack 'n' Joe`, mehrere Quellen und Rez-vor-Draw.
- Kernartefakte: dieses Dokument und fokussierte Engine-Tests.
- Checks: gezielte Vitest-Dateien; `git diff --check`.
- Done-Gate: Die Tests scheitern ausschließlich an der bestätigten aktuellen
  Auto-Pay-/fehlenden-Rez-Fenster-Semantik.
- Commit: `test(engine): capture City Surveillance draw choice gaps`.

### P02 – Fortsetzbare Runner-Draw-State-Machine

- Ziel: Einzelne Draws über Engine-Zustände und revalidierte Actions
  fortsetzen.
- Eingang: P01 committed.
- Arbeit: Shared State/Action-Vertrag, Sequenzstart, Einzelziehschritt,
  Abschluss und Schutz vor Doppelauflösung.
- Kernartefakte: `packages/shared`, `packages/engine/src/game/turn` und
  Engine-Runtime.
- Checks: State-/Action-/Replay-Tests, Typecheck, `git diff --check`.
- Done-Gate: Eine Mehrfachziehaktion kann ohne City Surveillance vollständig,
  deterministisch und ohne zusätzliche Nutzeraktion aufgelöst werden; mit
  aktiver Quelle pausiert sie am richtigen Schritt.
- Commit: `fix(engine): sequence City Surveillance draw choices`.

### P03 – Mehrfachziehen, mehrere Quellen und Draw-Ersatzfälle

- Ziel: Freie Credit-/Tag-Entscheidungen für jede Karte und Quelle.
- Eingang: P02 committed.
- Arbeit: Pay-/Tag-Actions, Kostenrevalidation, `Jack 'n' Joe`, Fünf-Karten-
  Draws, mehrere City-Kopien, Crash-Everett-Zusatzdraw und Stack-Ende.
- Kernartefakte: Draw-Runtime, CardImplementation-Adapter und fokussierte
  Originalset-/Mechaniktests.
- Checks: neue Kombinationstests, bestehende Draw-/Crash-Regressionen,
  Replay/StateHash, `git diff --check`.
- Done-Gate: Jede Kombination ist legal und reproduzierbar; keine automatische
  Zahlung verbleibt.
- Commit: `test(engine): cover City Surveillance draw combinations`.

### P04 – Gedrucktes City-Surveillance-Rez-Fenster

- Ziel: Die Korp kann eine installierte City Surveillance unmittelbar vor
  jeder anstehenden Karte rezzen oder passen.
- Eingang: P03 committed.
- Arbeit: side-sicheres Rez-/Pass-Fenster, Rez-Kosten, mehrere installierte
  Kopien, veraltete Actions und Fortsetzung.
- Kernartefakte: Rez-/Draw-Runtime und LegalAction-Tests.
- Checks: positive/negative Rez-Fälle, unzureichende Credits, stale Action,
  Mehrfachziehen, Replay, `git diff --check`.
- Done-Gate: Das offizielle `Jack 'n' Joe`-Ruling ist end-to-end abgedeckt.
- Commit: `feat(engine): add City Surveillance pre-draw rez window`.

### P05 – UI-, AI-, Replay- und Hidden-Info-Härtung

- Ziel: Neue Fenster sind bedienbar und für menschliche sowie KI-Spieler
  transitionssicher.
- Eingang: P04 committed.
- Arbeit: generische Action-/Choice-Darstellung prüfen und bei Bedarf
  ergänzen; AI-Auswahl für Pay/Tag und Corp-Rez/Pass; PublicContext und
  Reconnect/Replay redigieren.
- Kernartefakte: `packages/ai`, `apps/web`, PublicContext-/PlayerView-Tests.
- Checks: fokussierte AI-/Web-/Engine-Tests, Hidden-Info-Marker,
  `git diff --check`.
- Done-Gate: Human- und AI-Pfade können jede neue Action legal wählen; keine
  private Kartenidentität wird öffentlich.
- Commit: `test(ai-ui): harden City Surveillance choice surfaces`.

### P06 – Final Review, Wissenspflege und Gesamtverifikation

- Ziel: belastbarer Abschlussstand mit aktueller Dokumentation.
- Eingang: P05 committed.
- Arbeit: Final Review, relevante Wissensseite/Status- oder Logpflege,
  Gesamtchecks und Restpunktprüfung.
- Kernartefakte: `docs/reviews`, `KI-Wissen-NETGRID` und bei Bedarf
  `docs/codex/CODEX_STATUS.md`.
- Checks: alle fokussierten Suites, Typecheck, relevante breitere Gates,
  `git diff --check`.
- Done-Gate: Regelvertrag, Tests, Review und Wissensstand stimmen überein; der
  Worktree ist sauber.
- Commit: `fix(engine): close City Surveillance draw review`.

## Verifikationsregeln

- Nach jedem Paket gezielte Tests und `git diff --check`.
- Engine- oder Shared-Änderungen mindestens mit Engine-Typecheck und den
  betroffenen Vitest-Dateien prüfen.
- AI-/Web-Änderungen zusätzlich in ihren Paketgrenzen testen.
- Vor dem Merge fokussierte Suites erneut ausführen; bei vertretbarer Laufzeit
  relevante breitere Projektchecks ergänzen.
- Nicht ausgeführte Checks und Gründe im Final Review nennen.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich im oben genannten Worktree und Arbeitsbranch arbeiten.
- Der Hauptworkspace wird erst für den finalen lokalen Merge verwendet.
- Nur paketzugehörige Dateien stagen; fremde Änderungen nie übernehmen oder
  verwerfen.
- Jedes bestandene Paket erhält genau einen klaren Commit.
- Vor dem finalen Merge aktuelles `main` defensiv in den Arbeitsbranch
  integrieren und Konflikte inhaltlich lösen.
- Nach finalen Checks `main` bevorzugt per Fast-Forward aktualisieren.
- Anschließend Worktree sauber entfernen, Entfernung in Git und Dateisystem
  verifizieren und den gemergten Branch mit `git branch -d` löschen.

## Controller-Prompt-Kern

`/Goal Arbeite den Prozess City-Surveillance-Einzelziehentscheidungen
vollständig und sequenziell von P01 bis P06 ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die
Pflichtseiten der Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich
im Worktree C:\Projekte\NETGRID_CITY_SURVEILLANCE_DRAW_CHOICES auf Branch
codex/city-surveillance-draw-choices. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus,
committe es und beginne erst danach das nächste. Stoppe bei einem
Sicherheitsblocker mit Blocker-Report und Removal Condition. Integriere danach
aktuelles main, verifiziere final, merge lokal nach main und entferne Worktree
und Arbeitsbranch verifiziert. Markiere das Goal erst danach als complete.`

## Abschlusskriterien

- Alle Pakete sind mit bestandenem Done-Gate committed.
- Der offizielle City-Surveillance-/Jack-'n'-Joe-Vertrag ist end-to-end grün.
- Mehrere Quellen, Zusatzdraws, leere Stacks, Rez-/Pass-, Pay-/Tag-, stale-,
  Replay- und Hidden-Info-Fälle sind abgedeckt.
- Der Arbeitsbranch ist lokal nach `main` integriert.
- Hauptworkspace-Prüfung, Worktree-Entfernung, Entfernungskontrollen und
  Branch-Cleanup sind erfolgreich.
