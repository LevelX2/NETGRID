# Runner-Spezialinstallationen: MU-korrekter Paketprozess

Status: abgeschlossen; Final Review:
`docs/reviews/engine/runner-special-program-install-memory-final-review-2026-07-17.md`

Quelle/Vorgabe: Nutzerfund vom 2026-07-17 zu `Sneak Preview` sowie Auftrag,
vergleichbare Programme installierende Karteneffekte zu prüfen und denselben
Regelvertrag konsistent umzusetzen.

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung präzise genug. Der fachliche
Vertrag folgt aus Comprehensive Rules 3.9.3b und 8.5.6c: Eine
Programminstallation darf nicht allein deshalb entfallen oder unanwählbar sein,
weil die aktuell freie MU nicht ausreicht. Als Teil der Installation darf und,
falls nötig, muss der Runner zuvor installierte Programme trashen, bis das neue
Programm in das MU-Limit passt.

## Gesamtziel

Alle aktiven Kartenpfade, die ein Runner-Programm durch einen Karten- oder
Zugriffseffekt installieren, verwenden denselben MU-Erreichbarkeitsvertrag wie
die normale Installation aus dem Grip. Ein Zielprogramm bleibt wählbar, wenn
es nach legalem Trash installierter Programme in das aktuelle MU-Limit passt.
Reicht bereits die freie MU, wird ohne zusätzlichen Dialog fortgesetzt; sonst
öffnet die Engine eine private, stale-sichere Trash-vor-Install-Choice und setzt
danach exakt den ursprünglichen Kartenablauf fort.

## Annahmen

- `at no cost` verändert nur Installationscredits; MU bleibt eine laufende
  Beschränkung und kein Preis.
- Die bereits installierten Programme sind während Schritt 8.5.6c grundsätzlich
  wählbar. Nur tatsächlich MU nutzende Programme tragen zur Freimachung bei.
- Eine Installation bleibt unmöglich, wenn das Ziel selbst nach Trash aller
  wählbaren Programme nicht in das MU-Limit passt oder eine andere
  Installationsbedingung wie Unique, Zone, Timing oder Credits scheitert.
- Ein automatischer Quelltrash, etwa bei `Mystery Box`, wird bei der
  MU-Erreichbarkeit berücksichtigt und vor der Zielinstallation ausgeführt.
- Die vorhandene `The Shell Traders`-Umsetzung ist der positive Referenzpfad;
  sie wird nur gehärtet, falls der Vergleichstest eine Lücke zeigt.

## Nicht-Ziele

- Keine Änderung an Installationscredits, Klickkosten, Serverwahl oder
  kartenspezifischen Rückgabe-/Penalty-Effekten.
- Keine Änderung der allgemeinen Hosting- oder Daemon-Regeln.
- Keine Freigabe neuer Karten und keine Kartenpool-Erweiterung.
- Kein breites Refactoring der Hidden-Zone- oder Access-Architektur.
- Keine Änderung daran, dass ein vorzeitig getrashtes Sneak-Preview-Programm am
  Zugende nicht in den Grip zurückkehrt.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt einzige Regelautorität und revalidiert Ziel, Zone,
  Unique, Timing, Credits, MU und Trash-Auswahl in `applyAction`.
- Hidden-Zone-Ziele und MU-Choices bleiben runner-privat; PublicPayloads nennen
  nur aufgelöste öffentliche Karteninformationen.
- Replay, StateHash, Zufallszähler und Shuffle-Reihenfolge bleiben
  deterministisch.
- Kartenspezifische Abläufe werden erst nach erfolgreicher MU-Choice
  fortgesetzt; keine Kosten, Quelltrashes oder Shuffles dürfen doppelt erfolgen.
- Jeder Paketabschluss enthält Checks, `git diff --check` und einen eigenen
  Commit.

## Automatische Fehlerbehandlung

- Ein roter enger Test wird im aktiven Paket diagnostiziert und behoben.
- Ein Fund außerhalb des beschriebenen Installationsvertrags wird als Follow-up
  dokumentiert und erweitert das Paket nicht still.
- Bei einer fachlich widersprüchlichen Kartenregel, einem Hidden-Info-Risiko
  oder nicht deterministisch fortsetzbaren PendingChoice-Vertrag stoppt der
  Prozess mit Blocker-Report und Removal Condition.

## Sicherheitsblocker

- MU-Auswahl oder Stack-/Heap-Kartenidentitäten gelangen in Korp-PlayerView,
  PublicEvent, öffentlichen Replay-Kontext oder Clientfehler.
- Eine stale Choice kann ein anderes Programm installieren oder andere Karten
  trashen als die aktuelle LegalAction erlaubt.
- Ein fehlgeschlagener Fortsetzungsversuch hinterlässt bereits bezahlte Kosten,
  getrashte Quellen oder einen veränderten Stack.
- Replay oder StateHash driftet nach einer der neuen Fortsetzungen.

## State Machine

`PREPARED -> AUDITED -> CONTRACT_IMPLEMENTED -> REGRESSION_VERIFIED ->
DOCUMENTED -> FINAL_VERIFIED -> MERGED -> CLEANED`

Bei einem Sicherheitsblocker wechselt der Prozess nach `BLOCKED`; eine
Fortsetzung ist erst nach dokumentierter Removal Condition zulässig.

## Vergleichskarten-Audit

| Karte/Pfad | Installationsquelle | Aktueller Befund | Sollbehandlung |
|---|---|---|---|
| Sneak Preview | Stack oder Heap, kostenlos, temporär | behoben und mit 4/4-MU-, Sichtbarkeits- und Replay-Fall belegt | Ziel wählen, bei Bedarf Programme trashen, kostenlos installieren, Stack ggf. shufflen, temporäre Rückgabe tracken |
| Self-Modifying Code | Stack, normale Kosten, Source-Trash | behoben über den gemeinsamen Search-Install-Vertrag; der 2-MU-Quelltrash reicht für alle aktuell maximal 2 MU großen Zielprogramme bereits aus | Source-Trash berücksichtigen, Ziel wählen, bei Bedarf weitere Programme trashen, Kosten zahlen und installieren |
| Airport Locker | Stack, normale Kosten | behoben über denselben getesteten bezahlten Search-Install-Vertrag | Ziel wählen, bei Bedarf Programme trashen, Kosten zahlen und installieren |
| Mystery Box | oberste fünf Stackkarten, kostenlos, Source-Trash | behoben; automatischer Quelltrash wird vor der Installation und in der Erreichbarkeit berücksichtigt | öffentliche Top-5-Präsentation erhalten, Mystery Box vor Installation trashen, bei Bedarf weitere Programme trashen |
| Test Spin | Stack, kostenlos, temporär für Run | behoben und mit 4/4-MU-, Run-Cleanup-, Sichtbarkeits- und Replay-Fall belegt | Ziel wählen, bei Bedarf Programme trashen, installieren, shufflen, Run-/Return-/Penalty-Vertrag erhalten |
| Hijack | Grip, drei temporäre Installationscredits | behoben und mit 4/4-MU-, stale-, Sichtbarkeits- und Replay-Fall belegt | Hardware unverändert; Programm wählen, bei Bedarf Programme trashen, temporäre Credits korrekt abrechnen |
| Theorem Proof | öffentliches Access-Replacement als 2-MU-Programm | behoben und mit 4/4-MU-, Zwei-Programm-Trash- und Replay-Fall belegt | Installationsoption anbieten, wenn 2 MU durch Trash erreichbar sind; Access erst nach Choice fortsetzen |
| Valu-Pak Software Bundle | eingeschränkte normale Grip-Programminstallationen | behoben; Bundle-Markierung und Aktionsverbrauch bleiben über die normale MU-Choice erhalten | Erreichbarkeit nach Trash für Bundle-Start und Folgeaktionen verwenden; vorhandenen normalen Install-Choice-Vertrag beibehalten |
| The Shell Traders | vorbereitete Karte aus Set-aside, kostenlos | bereits korrekt: eigener privater MU-Freimach-Dialog mit Revalidation | als positive Regression absichern, keine unnötige Produktionsänderung |
| Normale Grip-Installation / Edgerunner Temps | Grip über `install_card` | bereits korrekt: Trash-vor-Install-Pfad vorhanden | unverändert lassen und als gemeinsame Verhaltensreferenz nutzen |

## Paketfolge

### NGMU-01: Prozessartefakt und Audit

- Ziel: vollständigen Scope, Regeln, Vergleichskarten und Gates festschreiben.
- Eingang: sauberer Worktree auf `codex/sneak-preview-mu-installs`.
- Kernartefakt: dieses Dokument.
- Checks: Quellen- und Codeaudit, `git diff --check`.
- Done-Gate: jeder aktive Spezialinstallationspfad ist als betroffen, korrekt
  oder out of scope klassifiziert.
- Commit: `docs: define special program install MU process`.

### NGMU-02: Gemeinsamer MU-Vertrag und Migration

- Ziel: eine kleine reine Installationskomponente für Erreichbarkeit,
  MU-Choice-Aufbau und Auswahlvalidierung schaffen und die betroffenen
  Kartenfortsetzungen daran anbinden.
- Eingang: NGMU-01 abgeschlossen.
- Konkrete Arbeit: MU-Vorfilter durch Erreichbarkeit nach Trash ersetzen;
  kartenspezifische PendingChoice-Fortsetzungen für Search/Heap/Stack,
  Grip-Event, Access-Replacement und Restricted Actions ergänzen.
- Kernartefakte: `packages/engine/src/game/install/`, Hidden-Zone-,
  Nonsearch-, Access- und Restricted-Action-Runtimes.
- Checks: neue Komponenten-Unit-Tests, Engine-Typecheck, enge betroffene Tests,
  `git diff --check`.
- Done-Gate: alle sieben fehlerhaften Kartenpfade und Valu-Pak verwenden den
  gemeinsamen Erreichbarkeits-/Validierungsvertrag; Shell Traders bleibt
  funktional unverändert.
- Commit: `fix(engine): allow MU replacement for special program installs`.

### NGMU-03: Kartenübergreifende Regression

- Ziel: den vollständigen Gameplayvertrag je betroffener Kartenfamilie
  ausführbar belegen.
- Eingang: NGMU-02 abgeschlossen.
- Konkrete Arbeit: Tests bei vollem MU für Sneak Preview, Search-Install,
  Reveal-Install, Proteus-Events, Access-Replacement und Restricted Bundle;
  insufficient-trash, wrong-side, stale, Visibility, Replay und StateHash.
- Kernartefakte: passende gesplittete Engine-Testdateien und Szenarioverweise.
- Checks: alle geänderten Testdateien, Engine-Gesamttest, Typecheck,
  `git diff --check`.
- Done-Gate: jede betroffene Familie besitzt mindestens einen positiven
  4/4-MU-Fall und negative Revalidation; Replay/StateHash bleiben stabil.
- Commit: `test(engine): cover MU replacement across special installs`.

### NGMU-04: Review, Wissen und Finalverifikation

- Ziel: Ergebnis, bewusst unveränderte Vergleichspfade und Restpunkte dauerhaft
  dokumentieren und den Arbeitsbranch final prüfen.
- Eingang: NGMU-03 abgeschlossen.
- Kernartefakte: Final Review, Karten-/Mechanikübersicht und Projektlog nach
  Relevanzregel.
- Checks: relevante Projektgates, Engine-/Web-Typecheck nach Berührung,
  `git diff --check`, sauberer Worktree.
- Done-Gate: Review nennt alle geprüften Karten, Checks und verbleibende Risiken;
  kein uncommitteter Paketstand bleibt offen.
- Commit: `docs: record special program install MU completion`.

## Verifikationsregeln

- Pro Paket enge Unit-/Gameplaytests zuerst, dann betroffene Paketgates.
- Pflicht mindestens:
  - `corepack pnpm --filter @netgrid/engine typecheck`
  - betroffene Vitest-Dateien
  - `corepack pnpm --filter @netgrid/engine test`
  - `corepack pnpm --filter @netgrid/web typecheck`, falls sichtbare
    Choice-Verträge geändert werden
  - `git diff --check`
- Keine grüne Bewertung allein aufgrund bestehender, nicht einschlägiger Tests.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_SNEAK_PREVIEW_MU_INSTALLS`
- Arbeitsbranch: `codex/sneak-preview-mu-installs`
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für den finalen lokalen Merge.
- Vor dem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls nötig,
  und relevante Tests erneut ausführen.
- Final bevorzugt Fast-forward nach `main`; kein Push und kein Pull Request.
- Nach erfolgreichem Merge den sauberen Arbeitsworktree entfernen, Entfernung
  in Git und Dateisystem prüfen und den vollständig gemergten Branch mit
  `git branch -d` löschen.

## Controller-Prompt-Kern

`/Goal Arbeite den Paketprozess Runner-Spezialinstallationen MU-korrekt von
NGMU-01 bis NGMU-04 vollständig und sequenziell ab und merge den abgeschlossenen
Arbeitsbranch lokal nach main. Lies AGENTS.md, AGENTS.local.md, die wiki-first
Pflichtseiten, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_SNEAK_PREVIEW_MU_INSTALLS
auf Branch codex/sneak-preview-mu-installs. Nutze den Hauptworkspace nur für den
finalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und
committe es. Bei Sicherheitsblocker stoppe mit Blocker-Report und Removal
Condition. Nach Abschluss final verifizieren, lokal nach main mergen, main
prüfen, Worktree und gemergten Arbeitsbranch verifiziert entfernen und Goal erst
dann als complete markieren.`

## Abschlusskriterien

- Alle im Audit als fehlerhaft markierten aktiven Kartenpfade erlauben
  regelkonformen Programmaustausch bei voller MU.
- Vergleichspfade sind nachweisbar geprüft; bereits korrekte Pfade bleiben
  stabil.
- Hidden-Info-, stale-action-, Replay- und StateHash-Gates bestehen.
- Jedes Paket besitzt einen Commit, der Arbeitsbranch ist nach `main` gemergt,
  und Worktree sowie Arbeitsbranch sind verifiziert entfernt.
