# Match 7d284 Corp Play-Strength Fix Process

## Status

In Umsetzung.

## Quelle

- gespeichertes Match `match_7d284874cdf8a712`;
- Nutzerfreigabe vom 10. Juli 2026 für neun Analysepunkte;
- ergänzte Nutzeranforderung für spätes, wirkungsgebundenes Rezzen verdeckter Root-Karten;
- `netgrid-ai-spielanalyse-worktree` und `paketprozess-worktree-goal`.

## Gesamtziel

Die Corp-KI verfolgt ihre ausgewählten Pläne stringent, erkennt vollständige
Scorepfade, schützt Scorelines vor sicherem Zugriff, entwickelt wiederholbare
Economy, setzt ICE und Rez-Credits nach tatsächlichem Grenznutzen ein und deckt
verdeckte Root-Karten erst im letzten fachlich erforderlichen Fenster auf.

## /Goal

Arbeite die Pakete P1 bis P6 vollständig und sequenziell im Worktree
`C:\Projekte\NETGRID_AI_MATCH_7D284_CORP_FIXES` auf Branch
`codex/ai-match-7d284-corp-fixes` ab. Committe jedes abgeschlossene Paket,
integriere danach den aktuellen lokalen `main`, verifiziere erneut und merge den
Arbeitsbranch lokal nach `main`. Der Hauptworkspace wird bis zum finalen Merge
nicht verändert. Fremde Änderungen bleiben erhalten.

## Invarianten

- Die Engine bleibt einzige Regelautorität.
- Die KI führt ausschließlich aktuelle `LegalActions` aus.
- Zukünftige Plan-Schritte dürfen side-sicher projiziert werden, werden aber erst
  ausgeführt, wenn die Engine die konkrete Action legal anbietet.
- Keine Runner-Hidden-Info wird ausgewertet.
- Score-, Rez- und Installationsentscheidungen verwenden konkrete Karten- und
  Serveridentitäten statt loser Textähnlichkeit.
- Tests bilden reale Zugfolgen, Kosten, Klicks und LegalAction-Übergänge ab.

## Nicht-Ziele

- keine pauschale Karten-Namensliste als Ersatz für Semantik;
- kein Frontend-Korrekturscore und keine reine Debug-Kosmetik;
- keine Änderung der Kartenregeln;
- kein Server-Neustart und keine Veränderung lokaler Matchdaten;
- kein Push oder Pull Request.

## Paketfolge

### P1 - Prozess und Evidence

- Match-Evidence und Ursachen festhalten.
- Worktree-, Scope- und Sicherheitsgrenzen dokumentieren.
- Done: Prozess- und Evidence-Artefakt sind versioniert; `git diff --check` grün.

### P2 - Planbindung und Plan-first-Abdeckung

- aktionsspezifische Corp-Pläne an Action, Quelle und Ziel binden;
- planfremde semantische Treffer ausschließen;
- fehlende strategische Planabdeckung diagnostizierbar und fail-closed machen.
- Done: Setup-Punish kann Marine Arcology nicht mehr ausführen; Rez-Pläne binden
  die konkrete Rez-Variante; fokussierte Plantests sind grün.

### P3 - Scoreline-Konvertierung und Sicherheit

- `score_agenda` als klickfreie Abschlussaction behandeln;
- nach Agenda-Installation neu entstehende Advancement-Operationen projizieren;
- Same-Turn- und persistente Scoreline-Pfade planbar machen;
- unsichere Agenda-Installation und Advancement ohne expliziten Gegenwert sperren;
- Remote-Vorbereitung nach tatsächlichem Zugriffspfad statt ICE-Anzahl bewerten.
- Done: Project Zurich plus Systematic Layoffs wird vollständig gescort;
  Project Babylon wird im belegten unsicheren Zustand nicht ausgesetzt.

### P4 - Handwert und wiederholbare Economy

- Score-Konvertierungskombinationen beim Discard erhalten;
- tatsächliche Discard-Optionen und Scores im Trace ausweisen;
- gemeinsamen Planrahmen für wiederholbare Economy schaffen;
- BBS als Installieren-Rezzen-Leeren-Folge modellieren, Broker-Sondervertrag
  unverändert erhalten.
- Done: Systematic Layoffs schlägt im belegten Discard eine entbehrlichere Karte;
  BBS erhält einen ausführbaren Entwicklungs- und Ausschöpfungsplan.

### P5 - Placement und Rez-Timing

- Central-Basisschutz vor leerem Remote-Setup priorisieren;
- marginale ICE-Installationen nach realem Tax-/Stopwert abwerten;
- Rez-Budget über den gesamten Restpfad optimieren;
- verdeckte Root-Karten nur wirkungsgebunden und so spät wie nötig rezzen.
- Done: R&D bleibt in der Eröffnung nicht zugunsten eines leeren Remotes offen;
  schwache sechste ICE-Installationen werden vertagt; inneres starkes ICE kann
  Budget erhalten; Setup wird nicht für seinen Zugriffseffekt gerezzt.

### P6 - Abschluss

- fokussierte und angrenzende Vitest-Suiten ausführen;
- `@netgrid/ai` typprüfen und relevante AI-Gates ausführen;
- Final Review und Monatslog aktualisieren;
- aktuellen `main` integrieren, erneut prüfen und lokal nach `main` mergen.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden im aktiven Paket an der Ursache behoben.
- Eine fehlende Engine-LegalAction wird nicht im KI-Code erfunden; sie wird als
  Engine-Blocker dokumentiert.
- Konflikte mit neuem `main` werden inhaltlich aufgelöst, sodass beide
  kompatiblen Intentionen erhalten bleiben.

## Sicherheitsblocker

Die Umsetzung stoppt, wenn sie Runner-Hidden-Info, eine nicht legale Action oder
eine Abschwächung von Replay-/Side-Safety erfordern würde.

## Abschlusskriterien

- Alle zehn Fehlergruppen besitzen realistische Regressionen oder eine klar
  dokumentierte, gemeinsam abdeckende Regression.
- Der Arbeitsbranch ist sauber und lokal in `main` integriert.
- Fokussierte Tests, AI-Typecheck und `git diff --check` sind grün.

