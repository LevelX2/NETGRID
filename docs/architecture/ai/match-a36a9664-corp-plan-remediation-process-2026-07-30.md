# Match A36A9664: Corp-Plan-Remediation

Status: abgeschlossen – lokal in `main` integriert

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
- D24/SV50 sowie D46/SV106: Agenda-Zulassung und bezahlte zweite
  Rez-Schicht;
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

Umgesetzt:

- eine bezahlte, exakt erreichte ICE-Schicht wird bei unveränderter
  Zugriffswahrscheinlichkeit als produktiv erkannt, wenn die bekannte
  Vorher-/Nachher-Bewertung eine positive Runner-Pfadsteuer ausweist;
- der Fallback bleibt an das aktuell angegriffene ICE und bei Remotes an eine
  sichtbare Agenda gebunden; unvollständige Gratis-Resource-Quotes werden
  nicht überdeckt;
- terminales Zentralrisiko wird unabhängig von einer unsicheren
  Breaker-Kombinationsanalyse aus vollständigem Deckinventar,
  Zugriffszahl und Matchpoint bestimmt;
- bei `unknown` darf der Defense-Plan genau die zweite zentrale Schicht
  vorbereiten, nicht beliebig weiter stapeln;
- ein kohärenter ausführbarer Score-Plan behält Vorrang vor dieser
  qualitativen Zusatzschicht;
- die korrigierte Cross-Remote-Counter-Bank-Route vermeidet die teure
  Layoffs-Ersatzroute; die vorhandene konkrete Kandidatenreserve enthält
  Aktionskosten, verbleibende Advancement-Kosten und den bedingten
  Post-Score-Floor, während terminale Notfallwertung bewusst zulässig bleibt.

Gegenproben:

- bewusst vertretbarer früher Rush mit weniger ICE bleibt möglich;
- Corporate War darf in echter terminaler Notlage unterhalb zwölf Credits
  gescored werden;
- nicht-terminale `unknown`-Lage erzwingt keine pauschale ICE-Installation.

Checks:

- D24, D46, D89, D101 und D122 grün;
- zentrale Defense-, Remote-Projekt-, Conditional-Score- und Scheduler-Tests;
- AI-Typecheck und `git diff --check`.

Commit:

- `fix(ai): bind funded defense to agenda routes`

### P4 – Zugabschluss und Action-Capacity-Overflow

Ziel:

- normale Aktionskapazität wird nicht ersatzlos aufgegeben und bezahlte
  Zusatzaktionen werden nur mit konkretem Planbedarf erzeugt.

Umgesetzt:

- der P6-Liquiditätsplan bindet als endliche Obergrenze
  `aktuelle Credits + verbleibende normale Aktionen` und bleibt damit nach
  jeder Basis-Credit-Aktion bis zur vollständigen Nutzung der normalen
  Zugkapazität stabil;
- ein höherer sichtbarer Score-/Defense-Bedarf darf das Ziel weiterhin
  anheben, und stärkere Pläne behalten durch ihre Prioritätsklasse Vorrang;
- die Debug- und Scheduler-Begründung unterscheidet nun
  `forgo_exhausted_voluntary_capacity` ausdrücklich von echter
  `forgo_restricted_capacity`;
- jede Action-Capacity-Projektion ist aus der generischen
  HQ-Overflow-Konversion ausgeschlossen; eine solche Karte bleibt nur über
  ein zuständiges Planmodul mit gebundener Restzuglinie spielbar.

Gegenproben:

- regelbedingt nutzlose oder ausschließlich eingeschränkte Kapazität darf
  weiterhin aufgegeben werden;
- Overtime bleibt für eine konkrete Fast-Advance-Aktionslücke zulässig;
- gewöhnliche günstige Handkonversion bleibt möglich.

Checks:

- D11- und D75-Checkpoints grün;
- Turn-Completion-, Overflow-, Scheduler- und Action-Capacity-Tests;
- AI-Typecheck und `git diff --check`.

Commit:

- `fix(ai): require productive use of remaining actions`

### P5 – Gesamtverify, Deck-Audit und Abschlussdokumentation

Ziel:

- alle Korrekturen gemeinsam absichern und dauerhafte Verträge
  dokumentieren.

Umgesetzt:

- vollständiger Deck-Hint-/Consumer- und Action-Capacity-Audit wiederholt;
- alle fokussierten und breiten AI-Gates einschließlich der drei festen
  Parallelshards ausgeführt;
- Engine- und AI-Replay-Verträge gegengeprüft;
- die im breiten Shadow-Lauf sichtbare `new_remote`-Receipt-Lücke generisch
  über die konkrete, eindeutig zuordenbare ICE-Instanz geschlossen;
- den begrenzten Rush gegen sichtbare Breaker-Antworten, Mehrpunkt- und
  Matchpoint-Exposition abgesichert;
- Final-Report, Testvertrag und aktuellen Wissenslog ergänzt;
- den vollständigen AI-Normallauf technisch auf drei parallele,
  jeweils einworkerige Shards umgestellt.

Checks:

- alle neuen Checkpoints und Gegenproben grün;
- AI-Typecheck mit explizitem 6-GB-Node-Heap grün;
- vollständige AI-Suite 540/4.405 seriell und über den parallelen
  Standardpfad grün;
- relevante Engine-/Replay-/Hint-/Action-Capacity-/Strukturgates grün;
- `format:changed` und `git diff --check` grün.

Commit:

- `docs(ai): close match a36a9664 remediation`

### P6 – Main-Abgleich, Integration und Cleanup

Ziel:

- aktuellen `main` defensiv in den Arbeitsbranch integrieren, final
  verifizieren, lokal nach `main` mergen und Arbeitsartefakte entfernen.

Umgesetzt:

- die während der Umsetzung entstandenen Main-Stände `d09db080b` und
  `0bb60c732` nacheinander defensiv in den Arbeitsbranch eingebunden;
- die beiden rein additiven Konflikte im Juli-Wissenslog unter Erhalt aller
  Einträge gelöst; die produktive Plan-Runtime führte beide
  Verhaltensstränge konfliktfrei zusammen;
- auf dem kombinierten Stand 540 AI-Testdateien mit 4.409 Tests, den
  AI-Typecheck und das Format-/Diff-Gate grün ausgeführt;
- Arbeitsbranch per Fast-Forward bis `9ecbb05b2` nach lokalem `main`
  integriert;
- Worktree aus Git entfernt, verbliebene ignorierte Installationsartefakte
  wiederherstellbar in den Windows-Papierkorb verschoben und den vollständig
  gemergten Arbeitsbranch gelöscht.

Erfülltes Done-Gate:

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
