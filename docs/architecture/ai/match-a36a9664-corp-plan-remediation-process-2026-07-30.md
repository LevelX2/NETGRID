# Match A36A9664: Corp-Plan-Remediation

Status: aktiv – Paket P3

Quelle:

- `docs/reviews/ai/match-a36a9664-full-corp-ai-decision-audit-2026-07-30.md`
- Nutzerfreigabe vom 2026-07-30 für alle sechs Umsetzungspunkte

## Zielprüfung

Die Vorgabe ist für die automatische Umsetzung ausreichend präzise. Die
historischen Zustände, betroffenen Decisions, erwarteten besseren
Entscheidungsgrenzen und zuständigen Plan-/Runtime-Schichten sind im
Evidence-Report belegt.

## Gesamtziel

Die sechs freigegebenen Fehlergruppen aus
`match_a36a9664458303fc` werden auf aktuellem Code spielgleich reproduziert,
generisch in den zuständigen Planmodulen behoben, mit engen Gegenproben und
breiten Gates abgesichert und lokal nach `main` integriert:

1. Vapor-Ops-/Counter-Bank-Route darf die eigene Bank nicht ersetzen.
2. Agenda-Projekte müssen wirksamen und finanzierbaren Schutz über ihren
   Planungshorizont binden.
3. Terminale Zentralgefahr darf bei unvollständiger Evidence nicht als
   unproduktive Defense vertagt werden.
4. Bedingte Score-Effekte müssen das Budget der tatsächlich gewählten
   Gesamtroute verwenden.
5. Normale Aktionen dürfen nicht allein wegen erfüllter Liquiditätsziele
   ersatzlos verfallen.
6. Action-Capacity-Operationen dürfen nicht ohne konkrete Aktionslücke als
   bloße Handüberlauf-Konversion dienen.

## Arbeitsumgebung

- Worktree: `C:\Projekte\NETGRID_AI_A36A9664`
- Branch: `codex/a36a9664-corp-plan-fixes`
- Integrationsbranch: lokaler `main`
- Standardports und Standardserver bleiben unangetastet.
- Der Worktree startet keinen Webclient oder Multiplayer-Server.

## Annahmen

- Historische Matchdaten werden nur über einen kurzlebigen
  read-only-`node:sqlite`-Client gelesen.
- Nur Checkpoints mit `behavior_regression` gelten als rote fachliche
  Reproduktion.
- Bereits grüne historische Zustände werden dokumentiert, nicht durch
  abgeschwächte Erwartungen künstlich rot gemacht.
- Ein Rush kann bewusst mit weniger Defense arbeiten. Die Lösung ist ein
  planklassenabhängiger Schutzvertrag, keine feste ICE-Anzahl.
- Corporate War darf in terminaler Lage unterhalb des Credit-Schwellenwerts
  gescored werden, wenn dies den unmittelbaren Spielverlust verhindert.
- Unrezztes ICE kann gestuften Schutz, Steuerwirkung oder Bluffwert besitzen,
  muss aber innerhalb eines mehrzügigen Agenda-Plans finanziell ausführbar
  bleiben.

## Nicht-Ziele

- Keine Kartennamen-Sonderregeln für Vapor Ops, Overtime Incentives oder
  Corporate War, sofern strukturierte Funktionssignale ausreichen.
- Keine Nutzung verdeckter Informationen des menschlichen Spielers.
- Keine globale Pflicht zu zwei oder drei ICE pro Agenda-Remote.
- Kein pauschales „bei unknown immer ICE installieren“.
- Keine Änderung von Kartenregeln zur Kompensation eines Planfehlers.
- Keine Rückwärtskompatibilitätsarbeit für alte Runtime-Daten.
- Kein Push und kein Pull Request.

## Controller-Invarianten

1. Es ist immer genau ein Paket aktiv.
2. Vor dem ersten Verhaltensfix existiert ein separater Red-Evidence-Commit.
3. Jede KI-Aktion bleibt aus `LegalActions` abgeleitet.
4. Die Rules Engine bleibt einzige Regelautorität.
5. Planung und Korrekturen bleiben in den zuständigen Planmodulen; keine
   globale Karten-Sonderlocke außerhalb der Planarchitektur.
6. Counter-Bank-Quelle und Agenda-Ziel werden als konkrete Instanzen und
   Server gebunden.
7. Informations- oder Zustandsgrenzen lösen die bestehende Replanung aus.
8. Jede neue Priorität besitzt mindestens eine enge Gegenprobe.
9. Jedes Paket endet mit Checks, `git diff --check` und eigenem Commit.

## Automatische Fehlerbehandlung

- Roter Test innerhalb des aktiven Pakets: eng diagnostizieren und beheben;
  nicht zum nächsten Paket wechseln.
- Historischer Checkpoint bereits grün: als aktuell nicht reproduzierbar
  dokumentieren und aus dem Fixscope entfernen.
- Legality-, Runtime- oder Fixture-Drift: als Infrastrukturarbeit behandeln;
  nicht als bestätigten Verhaltensfehler zählen.
- Fehlende LegalAction- oder Engine-Evidence: Engine-Vertrag im selben Paket
  sauber ergänzen oder als Sicherheitsblocker dokumentieren.
- Neue, nicht kausale Beobachtung: als Follow-up festhalten, nicht
  stillschweigend in das aktive Paket aufnehmen.

## Sicherheitsblocker

Die Umsetzung stoppt ohne Workaround, wenn:

- eine Lösung zukünftige oder gegnerische Hidden Information benötigen würde;
- der produktive Chooser nicht mit engine-erzeugten LegalActions getestet
  werden kann;
- ein Checkpoint nur durch Abschwächen der fachlichen Erwartung grün würde;
- `main` nicht ohne Verlust fremder Intentionen integrierbar ist;
- Engine-, Side-Safety- oder Replay-Gates regressieren.

## State Machine

`P0 Prozess -> P1 Red Evidence -> P2 Counter Bank -> P3 Agenda/Defense/Budget
-> P4 Turn/Overflow -> P5 Gesamtverify/Dokumentation -> P6 Main-Integration
und Cleanup -> abgeschlossen`

Ein Paketwechsel ist nur nach erfülltem Done-Gate und Commit zulässig.

## Paketfolge

### P0 – Preflight und Prozessvertrag

Ziel:

- Worktree, Branch, Scope, Invarianten und Paketfolge verbindlich festhalten.

Kernartefakt:

- dieses Prozessdokument

Checks:

- Worktree-/Branchstatus
- `git diff --check`

Done-Gate:

- sauberer eigener Commit

Commit:

- `docs(ai): define match a36a9664 remediation process`

### P1 – Spielgleiche Checkpoints und Red Evidence

Ziel:

- die sechs Fehlergruppen auf unverändertem aktuellem Code mit produktivem
  Chooser und damaligem Runtime-Zustand reproduzieren.

Arbeit:

- historische Zielzustände side-safe capturen;
- Fixture-/Runtime-Validierung ausführen;
- positive Erwartungsmengen und enge Gegenproben ergänzen;
- nur `behavior_regression` als fachlich rot akzeptieren;
- Red-Evidence-Report schreiben.

Voraussichtliche Zielzustände:

- D11/SV20: vorzeitiges Zugende mit normalen Aktionen;
- D24/SV50 sowie D42–D46/SV98–106: Agenda-Zulassung und Rez-Reserve;
- D75/SV174: Overtime ohne gebundene Aktionslücke;
- D89–D105/SV203–235: Counter Bank und vollständiges Scorebudget;
- D122/SV279: terminale R&D-Verteidigung.

Checks:

- Checkpoint-Schema und Fixture-Validierung
- fokussierte Decision-Checkpoint-Tests
- Gegenproben bleiben grün
- `git diff --check`

Done-Gate:

- rote Verhaltensnachweise und grüne Gegenproben separat committed

Commit:

- `test(ai): capture match a36a9664 decision regressions`

### P2 – Counter-Bank-/Cross-Remote-Route

Ziel:

- Counter Bank und Agenda dürfen nur in einer ausführbaren, nicht
  selbstzerstörenden Route gebunden werden.

Arbeit:

- `rootReplacement` in der Projektion konsumieren;
- Bank- und Agenda-Instanz/Server getrennt binden;
- Cross-Remote-Handoff und Revalidation implementieren;
- falschen Same-Root-Positivtest ersetzen.

Checks:

- unveränderter Zielcheckpoint wird grün;
- Same-Root-Replacement bleibt verboten;
- Cross-Remote-Gegenprobe wird gewählt;
- bestehende Counter-Bank- und Action-Capacity-Tests;
- AI-Typecheck und `git diff --check`.

Commit:

- `fix(ai): preserve counter bank across agenda handoff`

### P3 – Agenda-Schutz, terminale Defense und Routenbudget

Ziel:

- Scoring-Projekte binden wirksamen, bezahlbaren Schutz für ihren Horizont,
  während Rush- und Notfalllinien möglich bleiben.

Arbeit:

- sichtbare Breaker-/Kostenlage und Rez-Reserve im Agenda-Projektvertrag
  zusammenführen;
- Advance-Schritte an der Reservegrenze revalidieren;
- zusätzlichen ICE-Aufbau über ein planklassenabhängiges Defense-Zielband
  zulassen;
- terminale HQ-/R&D-Gefahr bei `unknown` konservativ im Defense-Plan
  behandeln;
- vollständige Kosten der gewählten Scoringroute in den bedingten
  Credit-Schwellenwert einbeziehen.

Gegenproben:

- bewusst vertretbarer früher Rush mit weniger ICE bleibt möglich;
- Corporate War darf in echter terminaler Notlage unterhalb zwölf Credits
  gescored werden;
- nicht-terminale `unknown`-Lage erzwingt keine pauschale ICE-Installation.

Checks:

- alle zugehörigen Match-Checkpoints grün;
- zentrale Defense-, Remote-Projekt-, Conditional-Score- und Scheduler-Tests;
- AI-Typecheck und `git diff --check`.

Commit:

- `fix(ai): bind funded defense to agenda routes`

### P4 – Zugabschluss und Action-Capacity-Overflow

Ziel:

- normale Aktionskapazität wird nicht ersatzlos aufgegeben und bezahlte
  Zusatzaktionen werden nur mit konkretem Planbedarf erzeugt.

Arbeit:

- Turn Completion für verbleibende normale Aktionen enger fassen;
- normale und eingeschränkte Kapazität in Debug-Evidence unterscheiden;
- Action-Capacity-Operationen aus generischer Overflow-Konversion
  ausschließen, sofern keine ausführbare Restzuglinie die Zusatzaktionen
  benötigt.

Gegenproben:

- regelbedingt nutzlose oder ausschließlich eingeschränkte Kapazität darf
  weiterhin aufgegeben werden;
- Overtime bleibt für eine konkrete Fast-Advance-Aktionslücke zulässig;
- gewöhnliche günstige Handkonversion bleibt möglich.

Checks:

- D11- und D75-Checkpoints grün;
- Turn-Completion-, Overflow- und Action-Capacity-Tests;
- AI-Typecheck und `git diff --check`.

Commit:

- `fix(ai): require productive use of remaining actions`

### P5 – Gesamtverify, Deck-Audit und Abschlussdokumentation

Ziel:

- alle Korrekturen gemeinsam absichern und dauerhafte Verträge
  dokumentieren.

Arbeit:

- vollständigen Deck-Hint-/Consumer-Audit wiederholen;
- fokussierte und breite AI-Gates ausführen;
- Final-Report und aktuellen Wissenslog ergänzen;
- offene Nicht-Ziele und Follow-ups abgrenzen.

Checks:

- alle neuen Checkpoints und Gegenproben grün;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `corepack pnpm --filter @netgrid/ai test`;
- relevante Engine-/Replay-/Hint-Gates;
- `git diff --check`.

Commit:

- `docs(ai): close match a36a9664 remediation`

### P6 – Main-Abgleich, Integration und Cleanup

Ziel:

- aktuellen `main` defensiv in den Arbeitsbranch integrieren, final
  verifizieren, lokal nach `main` mergen und Arbeitsartefakte entfernen.

Arbeit:

- Arbeitsbranch sauber prüfen;
- neuen `main`-Stand einbinden;
- relevante Checks wiederholen;
- Hauptworkspace prüfen und bevorzugt fast-forward mergen;
- Main-Status und Diff prüfen;
- Worktree sauber entfernen und doppelt verifizieren;
- gemergten Branch mit `git branch -d` löschen.

Done-Gate:

- Änderungen auf lokalem `main`;
- Hauptworkspace sauber;
- Worktree weder in Git noch im Dateisystem vorhanden;
- Arbeitsbranch gelöscht.

## Verifikationsregeln

- Tests werden nicht durch Abschwächen der historischen Erwartung grün.
- Fokussierte Zieltests laufen vor breiten Gates.
- Breite Gates erst nach grünen Paketchecks.
- Bekannte Warnungen sind nur zulässig, wenn der Gate-Status weiterhin `OK`
  ist und keine neue Warnung eingeführt wurde.
- Nicht ausgeführte Checks werden mit Grund dokumentiert.

## Controller-Prompt-Kern

Arbeite diesen Prozess ausschließlich im festgelegten Worktree sequenziell
von P0 bis P6 ab. Stelle keine Zwischenfragen, solange eine konservative
Fortsetzung innerhalb der dokumentierten Freigabe möglich ist. Ändere
Verhalten erst nach dem separaten roten Reproduktionscommit. Committe jedes
Paket einzeln. Nutze den Hauptworkspace nur für die finale lokale Integration.

## Abschlusskriterien

- alle auf aktuellem Code reproduzierbaren freigegebenen Fehler behoben;
- Match-Checkpoints und Gegenproben dauerhaft grün;
- keine Karten-Sonderlocke außerhalb der Planarchitektur;
- Final- und Wissensdokumentation aktuell;
- Arbeitsbranch lokal nach `main` integriert;
- Worktree und gemergter Branch nachweislich entfernt;
- Goal erst danach als abgeschlossen markiert.
