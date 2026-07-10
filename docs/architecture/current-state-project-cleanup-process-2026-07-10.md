# Current-State-Projekt-Cleanup 2026-07-10

## Status

`complete`

## Quelle und Zielprüfung

Der Nutzer hat am 2026-07-10 die Umsetzung der priorisierten Architektur-
und Cleanup-Findings freigegeben. Der Endzustand ist ausreichend bestimmt:
NETGRID soll in der privaten Version-0-Phase nur aktuelle Runtime-, Daten-,
Dokumentations- und Betriebsverträge behalten. Große Schichten werden nur an
klaren fachlichen Nähten zerlegt; Engine-Korrektheit, Hidden-Info-Sicherheit,
LegalAction-Disziplin, Replay und StateHash bleiben unverändert.

## Gesamtziel

- tote Demo-/Fallback-Runtime entfernen;
- Rückwärtskompatibilität ohne aktuellen lokalen Nutzen beseitigen;
- Wissensbasis, Reviews, Rohreports und Scripts auf Current State reduzieren;
- Shared- und Kartenregistrierungsverantwortung modularisieren;
- große Web-, Server- und AI-Module risikoarm nach Fachverantwortung teilen;
- schnelle und vollständige Teststufen sowie Package-Boundaries festschreiben;
- generierte Assetduplikate und verwaiste Worktrees kontrolliert bereinigen;
- alle Pakete einzeln verifizieren und lokal nach `main` integrieren.

## Annahmen

- Ausgangscommit ist `158e8cd4f`.
- Arbeitsbranch ist `codex/current-state-project-cleanup`.
- Arbeits-Worktree ist
  `C:\Projekte\NETGRID_CURRENT_STATE_PROJECT_CLEANUP`.
- Im Hauptworkspace bearbeitet ein paralleler Agent mindestens
  `packages/engine/src/game/apply-action.test.ts` sowie zwei Proteus-
  Engine-Tests. Diese Änderungen werden nicht übernommen, verändert oder
  zurückgesetzt.
- `codex/proteus-ai-release-reconciliation` ist ein aktiver paralleler
  Arbeitsstrang. Vor AI-, Web- oder Teständerungen wird dessen aktueller Diff
  erneut geprüft.
- Drei unversionierte Strategy-Panel-Berichte im Hauptworkspace sind fremde
  Rohartefakte und werden nicht gestaged, verschoben oder gelöscht.
- Legacy-Storage wird erst entfernt, wenn kein noch benötigter lokaler
  Importfall nachweisbar ist. Ein einmaliges Offline-Werkzeug ist einem
  dauerhaften Runtime-Import vorzuziehen.
- Asset-Rohquellen werden nicht gelöscht, wenn ein reproduzierbarer Renderer
  oder ein benötigtes Anzeigeformat sonst verloren ginge.

## Nicht-Ziele

- keine neue Spielmechanik oder Kartenfreischaltung;
- keine Änderung der LegalAction-Erzeugung oder `applyAction`-Validierung;
- keine neue Hidden-Info-Projektion;
- keine Änderung an Replay-, StateHash- oder Randomness-Verträgen;
- kein Redesign der Oberfläche;
- keine Löschung fremder oder aktiver Worktrees ohne Eigentumsnachweis;
- kein Push und kein Pull Request.

## Controller-Invarianten

- Die Engine bleibt alleinige Regelautorität.
- UI, Server und KI reichen ausschließlich vorhandene LegalActions ein.
- Öffentliche und side-sichere Projektionen bleiben fail-closed.
- Genau ein Paket ist aktiv.
- Jedes Paket erhält fokussierte Checks, `git diff --check` und einen eigenen
  Commit.
- Änderungen des parallelen Test-Agenten werden erst über einen defensiven
  `main`-Abgleich integriert.

## Automatische Fehlerbehandlung

- Ein vermeintlich toter Pfad mit aktivem Consumer wird nicht gelöscht,
  sondern als aktueller Vertrag klassifiziert.
- Kompatibilität mit belegtem aktuellem Nutzwert wird in ein enges Offline-
  Werkzeug verschoben oder als Blocker dokumentiert.
- Große Dateien werden nur über fachlich benannte Extraktionen verkleinert;
  keine mechanische Dateizersplitterung ohne Verantwortungsgewinn.
- Historische Evidence wird nur behalten, wenn sie ein aktuelles Gate, eine
  Removal Condition oder eine reproduzierbare Regression trägt.
- Bei parallelen Änderungen derselben Datei wird zuerst `main` integriert und
  beide Intentionen werden fachlich geprüft.

## Sicherheitsblocker

Der Prozess stoppt paketlokal, wenn eine Änderung:

- Hidden-Info-Schutz schwächen würde;
- LegalActions außerhalb der Engine erzeugen müsste;
- Replay oder StateHash nicht deterministisch halten kann;
- noch benötigte persönliche Daten ohne bestätigten Ersatz unlesbar macht;
- einen aktiven fremden Worktree oder uncommitted Teststand überschreiben
  würde.

## State Machine

```text
preflight -> dead_runtime -> compatibility -> docs_scripts
docs_scripts -> shared_registry -> module_slices -> test_boundaries
test_boundaries -> assets_worktrees -> integrate_main -> complete

any_package -> blocker
integrate_main -> blocker
```

## Paketfolge und Fortschritt

1. `PCS-0 Prozess, Parallelitätsgrenze und Preflight` – `done`
2. `PCS-1 Verwaiste Web-Demo-Runtime entfernen` – `done`; außerhalb
   historischer Dokumentation bestand kein Consumer. Web-Typecheck, 38
   Testdateien mit 483 Tests und der Production Build sind grün; die Build-
   Routentabelle enthält `/api/game` nicht mehr.
3. `PCS-2 Version-0-Kompatibilitätsflächen reduzieren` – `done`; der bereits
   am 2026-05-06 vollständig importierte separate JSON-/SQLite-Importpfad ist
   aus Start-Runtime, Storage-CLI, Health-Payload, Backupformat und E2E-Env
   entfernt. Allgemeine Matchvalidierung verwendet nun
   `stored_match_invalid`. Server-Typecheck und sechs Testdateien mit 129 Tests
   sind grün. Ability-Payloadfelder sind entgegen dem ersten Namensbefund noch
   aktiver Engine-Vertrag und werden erst in PCS-4 normalisiert; Participant-
   Deckinputs überschneiden sich mit dem aktiven Proteus-Branch und werden
   nach dessen Main-Integration in PCS-5 geschnitten. Browser-Key-Migrationen
   werden zusammen mit dem Page-Schnitt entfernt.
4. `PCS-3 Current-State-Dokumente, Reviews und Scripts konsolidieren` –
   `done`; 125 einmalige nummerierte Generator-/Check-/Apply-Scripts, 193
   zugehörige Einzelreports/Roh-JSON und 28 ersetzte Prozessseiten
   sind durch ein Historienrollup ersetzt. Das aktive Scriptinventar ist von
   163 auf 38 Dateien reduziert. Projektstatus, Wissensindex und AI-README sind
   auf Current State verdichtet. `check:ai:full` und das aktualisierte
   Card-Function-Abstraction-Gate sind grün; alle Root-Scriptziele existieren.
   `docs/codex/CODEX_STATUS.md` bleibt bis zum Proteus-Merge parallel besessen
   und wird in PCS-8 abschließend konsolidiert.
5. `PCS-4 Shared- und Kartenregistrierungsgrenzen modularisieren` – `done`;
   9.487 Zeilen konkrete Kartenregistrierung liegen nun in
   `card-definitions.ts`, während das Shared-Barrel von 11.683 auf rund 2.200
   Zeilen sinkt. `CARD_DEFINITIONS` und `CARD_DEFINITIONS_BY_ID` sind die
   neutralen Current-State-Namen; die temporären `DEMO_*`-Aliase und alle
   Consumer-Verwendungen sind in PCS-8 entfernt.
   Ein Boundarytest verhindert konkrete Kartendaten im Barrel. Shared-Tests
   (10), alle sechs Package-/App-Typechecks und Card-Function-Abstraction sind
   grün. Das zuvor auf `main` rote Engine-Architektur-Gate ist in PCS-8 durch
   datengetriebene Mark-Counter-Anzeigemetadaten ohne Baseline-Ausnahme
   geschlossen.
6. `PCS-5 Fachliche Web-/Server-/AI-Modulschnitte` – `done`; der aktuelle
   Deckrequest-Vertrag liegt in `apps/server/src/deck-request.ts` statt im
   HTTP-Monolith. Create-Match akzeptiert nur noch participant-scoped
   Deckpaare; die alte top-level Spiegelung und der
   `legacyParticipantDeckPair`-Fallback sind entfernt. AI-vs-AI verwendet
   explizit Participant A. Server-Typecheck sowie acht Testdateien mit 138
   Tests sind grün. Breite Chronicle-/Page- oder Corp-Score-Umschichtungen
   werden bewusst nicht mit dem noch uncommitteten parallelen Engine-Teststand
   gekoppelt; ihre nächsten Schnitte werden durch die Boundary-/Testbudgets
   aus PCS-6 abgesichert.
7. `PCS-6 Teststufen, Sharding und Package-Boundaries` – `done`; Paket-,
   Contract- und Full-Gate-Stufen sind dokumentiert. Die vollständige
   AI-Suite besitzt drei feste Shards. Der erste Shard deckte 21 verbliebene
   historische Batchtests auf, deren Generatoren bereits entfernt waren;
   Tests und zugehörige Rohreports sind nun ebenfalls gelöscht. Alle drei
   Shards sind mit 514, 630 und 584 Tests grün. Das neue Import-Gate prüft
   1.688 Produktionsdateien und sein positiver/negativer Selbsttest ist grün.
8. `PCS-7 Asset- und Worktree-Hygiene` – `done`; die Web-Runtime konsumiert
   nur Full-PNGs. 142 reproduzierbare SVG-, Preview-, Thumb-, Kontaktbogen-
   und Style-Variant-Dateien mit rund 182,5 MB sind entfernt; Art-Quellen,
   33 Full-PNGs und 37 aktive Basis-Fallbackbilder bleiben. Renderer und
   Manifest erzeugen nur noch Full-PNGs; das Retention-Gate ist mit 33 Karten
   und 113,3 MB grün. Project Babylon wurde aus aktuellen Quellen korrekt
   regeneriert. Web-Typecheck, 38 Testdateien mit 485 Tests, Production Build
   und Card-Function-Abstraction sind grün. Fremde Worktrees bleiben wegen
   fehlendem Eigentumsnachweis und aktivem Teststand unangetastet.
9. `PCS-8 Main-Abgleich, Full Gate und Integration` – `done`; der
   Arbeitsbranch ist per Fast-Forward in lokales `main` integriert. Der Full
   Gate ist mit Projekt-Typecheck, rekursivem Build, 179 Engine-Testdateien
   mit 1.598 Tests, 275 AI-Testdateien mit 1.728 Tests, 38 Web-Testdateien mit
   485 Tests, acht Server-Testdateien mit 138 Tests sowie allen Contract-,
   AI-, Proteus-, Boundary-, Asset- und Architekturchecks grün. Der
   uncommittete parallele Engine-Teststand bleibt unangetastet und erhöht den
   abschließenden Main-Lauf auf 1.602 grüne Engine-Tests. Ein veralteter
   `.next`-Cache mit `/api/game`-Referenz wurde entfernt; Production Build und
   anschließender Typecheck sind grün.

## Paketdetails

### PCS-0 Prozess, Parallelitätsgrenze und Preflight

- Ziel: Scope, Fremdänderungen, Branch und Sicherheitsgrenzen festhalten.
- Kernartefakte: dieses Prozessdokument, Git-/Worktree-Inventar.
- Checks: Branch-/Statusprüfung, `git diff --check`.
- Done-Gate: eigener sauberer Worktree; parallele Änderungen klassifiziert.
- Commit: `docs(architecture): define current-state project cleanup`.

### PCS-1 Verwaiste Web-Demo-Runtime entfernen

- Ziel: den ungenutzten globalen `/api/game`-State mit V0.8-Demos entfernen.
- Arbeit: Consumer-Nachweis wiederholen; Route und ausschließlich zugehörige
  Tests/Imports entfernen; Web-Verträge prüfen.
- Checks: Web-Typecheck, Web-Tests, Build-Routenprüfung.
- Done-Gate: kein `/api/game`-Consumer und kein globaler Demo-GameState.
- Commit: `refactor(web): remove obsolete local game runtime`.

### PCS-2 Version-0-Kompatibilitätsflächen reduzieren

- Ziel: Runtime-Migrationen ohne aktuellen Nutzen entfernen.
- Arbeit: Legacy-Storage-Import, alte Deckeingaben, Ability-Payloadformen und
  Local-Storage-Key-Migration getrennt inventarisieren und nach Nutzwert
  löschen oder in ein Offline-Werkzeug kapseln.
- Checks: Engine-/Server-/Web-Typecheck; fokussierte Storage-, Payload-,
  Replay-, Hidden-Info- und Browserzustandstests.
- Done-Gate: jeder verbleibende Compatibility-Pfad hat aktuellen Consumer und
  dokumentierte Removal Condition.
- Commit: `refactor(runtime): retire obsolete compatibility paths`.

### PCS-3 Current-State-Dokumente, Reviews und Scripts konsolidieren

- Ziel: wiki-first wieder zuverlässig und Repository-Evidence klein halten.
- Arbeit: führende Statusseiten neu verdichten; tote Links entfernen;
  historische AI-Prozess-/Rohartefakte in Rollups überführen; einmalige
  nummerierte Scripts nach Consumer-/Gate-Prüfung löschen; Raw-Output-Policy
  festschreiben.
- Checks: Link-/Referenzscan, aktive Root-Gates, Script-Consumer-Scan.
- Done-Gate: keine führende Seite verweist auf gelöschte Runtime; nur aktive
  Scripts und aktuelle Evidence bleiben.
- Commit: `docs: consolidate current-state evidence and tooling`.

### PCS-4 Shared- und Kartenregistrierungsgrenzen modularisieren

- Ziel: `@netgrid/shared` bleibt Vertragsschicht statt Kartenmonolith.
- Arbeit: Typen/Sanitizer/Card-Registry intern modularisieren; neutralen
  Registry-Namen und explizite Submodule einführen; Barrel klein halten.
- Checks: Shared-, Catalog-, Engine-, AI-, Server- und Web-Typechecks;
  Import-/Boundarytests; relevante Unit-Tests.
- Done-Gate: keine Kartenmassen oder Sanitizer-Implementierung im Barrel;
  Abhängigkeitsrichtung bleibt azyklisch.
- Commit: `refactor(shared): modularize contracts and card registry`.

### PCS-5 Fachliche Web-/Server-/AI-Modulschnitte

- Ziel: größte aktive Monolithen an stabilen Fachgrenzen verkleinern.
- Arbeit: mindestens je einen klaren Schnitt in Chronicle/Page-Komposition,
  Multiplayer/Storage oder Corp-Scoring/Triage durchführen; parallelen
  Proteus-/Test-Diff vor Auswahl prüfen.
- Checks: paketnahe Tests und Typechecks; UI-/Hidden-Info-Smoke bei Webschnitt.
- Done-Gate: extrahierte Module besitzen eindeutige Verantwortung und kleine
  öffentliche Verträge; Verhalten unverändert.
- Commit: `refactor: split current-state responsibility hotspots`.

### PCS-6 Teststufen, Sharding und Package-Boundaries

- Ziel: schnelle lokale Rückmeldung und reproduzierbaren Full Gate schaffen.
- Arbeit: Fast-/Contract-/Full-Stufen, feste AI-Shards, Laufzeitreport und
  packageweite Importgrenzen definieren; Änderungen des Test-Agenten zuerst
  integrieren.
- Checks: jede neue Stufe einmal ausführen; Boundary-Selftests.
- Done-Gate: dokumentierte Befehle ersetzen manuelles Sharding; verbotene
  Abhängigkeiten schlagen fail-closed fehl.
- Commit: `test: codify project test tiers and boundaries`.

### PCS-7 Asset- und Worktree-Hygiene

- Ziel: generierte Binärduplikate und verwaiste Arbeitskopien reduzieren.
- Arbeit: Asset-Quellen-/Derivatmatrix erstellen; reproduzierbare Derivate aus
  Git entfernen oder auf ein notwendiges optimiertes Format reduzieren;
  aktive Worktrees inventarisieren und nur eindeutig verwaiste entfernen.
- Checks: Card-Image-Lookup, Web-Typecheck/Build, Asset-Regeneration,
  Worktree-/Git-Status.
- Done-Gate: keine unnötig mehrfach versionierten Derivate; kein fremder
  Worktree verändert.
- Commit: `chore(repo): reduce generated assets and stale worktrees`.

### PCS-8 Main-Abgleich, Full Gate und Integration

- Ziel: parallele Arbeit erhalten und den Cleanup lokal integrieren.
- Arbeit: aktuelles `main` in den Branch mergen; Konflikte fachlich lösen;
  Full Gate; Branch nach `main` integrieren; Worktree entfernen.
- Checks: Typecheck, vollständige Tests in festgeschriebenen Stufen, Build,
  AI-Gates, `git diff --check`.
- Done-Gate: `main` grün, Arbeits-Worktree entfernt, kein Push.
- Commit: `docs: finalize current-state project cleanup`.

## Verifikations- und Git-Regeln

- Nur Paketdateien werden gestaged.
- Tests mit Timeout werden nicht als bestanden gewertet.
- Der Hauptworkspace bleibt bis zur Integration unangetastet.
- Vor AI-/Web-/Testpaketen wird der Proteus-/Test-Agent-Diff neu geprüft.
- Bevorzugter Main-Merge ist Fast-Forward; sonst begründeter Merge-Commit.
- Kein `reset --hard`, kein pauschales Revert, kein Push.

## Controller-Prompt-Kern

```text
/Goal Arbeite den NETGRID Current-State-Projekt-Cleanup sequenziell von PCS-0
bis PCS-8 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Arbeite ausschließlich im Worktree
C:\Projekte\NETGRID_CURRENT_STATE_PROJECT_CLEANUP auf Branch
codex/current-state-project-cleanup. Respektiere den parallelen Test- und
Proteus-Agenten. Bearbeite immer nur ein Paket, verifiziere es und committe es.
Bei Sicherheitsblocker schreibe einen Blocker mit Removal Condition. Gleiche
vor der finalen Integration aktuelles main defensiv ab, prüfe main, entferne
den Worktree und markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- keine verwaiste globale Demo-Game-Runtime;
- verbleibende Compatibility-Flächen sind aktuell begründet;
- führende Statusseiten und aktive Scripts bilden den Current State ab;
- Shared-/Registry- und Package-Grenzen sind ausführbar gesichert;
- mindestens die priorisierten Monolithnähte sind fachlich extrahiert;
- Teststufen und AI-Shards sind reproduzierbar;
- Assetderivate und Worktrees sind kontrolliert inventarisiert/bereinigt;
- alle Paketcommits sind lokal in `main`, Full Gate grün, Worktree entfernt.
