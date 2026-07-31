# Match e6aca: Corp-Plan-, Defense- und Access-Korrekturprozess

## Status

Umsetzung, Paketprüfung und lokale Integration nach `main` abgeschlossen. Die
Pakete wurden sequenziell im Worktree
`C:\Projekte\NETGRID_AI_E6ACA07C_ANALYSIS` auf Branch
`codex/ai-replay-e6aca07c-analysis` umgesetzt, einzeln committed und ohne
Konflikt per Fast-Forward integriert.

## Quelle und Ausgangslage

Grundlage ist die vollständige Analyse des beendeten Matches
`match_e6aca07c69fdd5df` mit 134 lückenlos gespeicherten Corp-KI-
Entscheidungen. Die Entscheidungen waren legal; die aktuellen Fehler liegen in
Planbewertung, Planfortsetzung und Arbitration. Zusätzlich belegt der
Spielzustand beim Zugriff auf `Setup!`, dass der implementierte Access-Effekt
bei einer unrezzten installierten Karte nicht ausgelöst wurde.

Der Matchverlauf enthält einen Versionswechsel. Entscheidungen 1 bis 50
entstanden sicher vor den relevanten Corp-Fixes. Ab Entscheidung 51 lief ein
Stand nach deren Integration. Alte Funde werden deshalb nur geändert, wenn ein
aktueller spielgleicher Checkpoint sie reproduziert.

## Gesamtziel

Die Corp-KI soll Verteidigung, Agenda-Scoring, Wirtschaft und Blufflinien als
zusammenhängende, vom Zugdirigenten verglichene Pläne ausführen. ICE wird nach
seiner zusätzlichen effektiven Run-Wirkung statt nach bloßer Schichtzahl
bewertet. Unrezzte zweite oder dritte Schichten bleiben für Handentlastung,
Kartendurchsatz, Bluff und vorbereiteten Serveraufbau erlaubt. Planlogik
qualifiziert Karten über Engine- und Hint-Semantik; konkrete Planinstanzen
binden danach weiterhin exakte Karteninstanzen und `LegalAction.actionId`s.

`Setup!` muss beim Zugriff aus einem installierten Remote unabhängig vom
Rez-Zustand zwei Net Damage über die normale Engine-Pipeline auslösen.

## Annahmen

- Bekannte ICE-, Breaker-, Rez- und Breakkosten werden exakt aus dem aktuellen
  Engine-/PlayerView-Zustand abgeleitet.
- Nur verborgene Runner-Handkarten, zukünftige Entscheidungen, Trace-Gebote,
  optionale Reaktionen und echte Zufallseffekte werden als Varianten oder
  Bandbreiten bewertet.
- Die Corp kennt die Identität ihrer eigenen unrezzten Karten; der Runner
  erhält dadurch keine zusätzliche Information.
- Handdruck ist ein echter positiver Nebennutzen einer vertretbaren
  Installation, aber keine alleinige Rechtfertigung für beliebig teure und
  nicht finanzierbare ICE-Schichten.

## Nicht-Ziele

- Keine starre Obergrenze für ICE-Schichten.
- Kein hartes Gebot, jedes vorhandene ICE vor der nächsten Installation zu
  rezzen.
- Keine `Filter`-, `Vapor Ops`-, `Project Venice`-, `BBS Whispering Campaign`-
  oder Decktitel-Sonderentscheidung in generischer Planlogik.
- Kein neuer Top-Level-Köderplan und keine zweite Arbitrationsebene.
- Keine Änderung der Rules-Engine-Autorität oder Umgehung von `LegalActions`.
- Keine Korrektur historischer Altstandsentscheidungen ohne aktuelle
  Reproduktion.

## Controller-Invarianten

1. `corp.defend_servers` besitzt Serverbedarf, ICE-Schichten, Rez-Entscheidungen
   und die fachliche Bewertung zusätzlicher Run-Widerstände.
2. Ein Agenda-Plan bindet Agenda-Instanz und Zielserver. Ein Defense-Schritt
   darf diese Bindung unterstützen, aber weder Agenda noch Server wechseln.
3. `corp.economy` besitzt Kampagnenfortsetzung und zweckgebundene
   Finanzierungsziele. Eine erreichte Auszahlungsgrenze darf nur durch eine
   nachweislich höher priorisierte neue Lage verdrängt werden.
4. `corp.ambush_and_bluff` darf eine generische Köderroute anbieten. Sie bindet
   Köderinstanz, Server und mögliche Anschlussagenda, übernimmt aber nicht die
   globale Auswahl.
5. Der Zugdirigent vergleicht vollständige erreichbare Zugenden. Ein Draw ist
   eine Beobachtungsgrenze und darf nicht als sofortige Verteidigung gelten,
   wenn danach keine Aktion mehr übrig ist.
6. Choice-Resolver vervollständigen nur die Payload der bereits gebundenen
   LegalAction.
7. Konkrete IDs sind in Planinstanzen und Action-Bindungen erlaubt. Semantische
   Qualifikation und strategische Bewertung dürfen nicht durch Titel- oder
   Karten-ID-Abfragen ersetzt werden.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Vor jedem KI-Fix wird die Situation als spielgleicher Decision-Checkpoint
  mit damaligem Zustand und Gegenprobe gesichert.
- Reproduziert ein aktueller Checkpoint einen historischen Fehler nicht, wird
  kein weiterer Fix für diesen Fund vorgenommen.
- Ein Paket bleibt aktiv, solange sein enger Test oder Done-Gate rot ist.
- Konflikte mit weitergelaufenem `main` werden inhaltlich aufgelöst; keine
  fremden Änderungen werden verworfen.
- Worktree-Tests verwenden keine Standardports und keine Runtime-Datenbank der
  Hauptinstanz. Für diese Pakete sind keine Browser- oder Serverstarts geplant.

## State Machine

```text
evidence_captured
  -> exact_regression_red
  -> owner_fix_applied
  -> exact_regression_green
  -> package_checks_green
  -> package_committed
  -> next_package
  -> final_gates_green
  -> main_integrated
  -> worktree_removed
```

## Paketfolge

### P0 – Prozess und Invarianten

- Dieses Prozessartefakt erstellen.
- Worktree, Branch, Scope und Owner festhalten.
- Check: `git diff --check`.
- Commit: `docs(ai): plane e6aca Corp-Korrekturprozess`.

### P1 – Setup!-Access-Korrektheit

- `Setup!` für installierte Zugriffe auf `any_rez_state` stellen.
- Den generischen Access-Aktivierungsvertrag berichtigen.
- Regression für unrezzten Remote-Zugriff mit Grip 4 -> 2, Damage-Event,
  Replay und StateHash ergänzen.
- Prüfen, dass Archives weiterhin keinen Schaden auslösen und R&D-Reveal
  erhalten bleibt.
- Commit: `fix(engine): loese Setup beim unrezzten Zugriff aus`.

### P2 – Spielgleiche KI-Regressionsevidence

- Checkpoints für falsche Vapor-Ops-Sicherheitsannahme, kostenloses ETR-Rez,
  Project-Zurich-Unterbrechung, Project-Venice-Zielwechsel, BBS-Fortsetzung,
  teure R&D-Überstapelung und Accounts-Reserve sichern.
- Jeder Checkpoint muss den damaligen Enginezustand, die falsche aktuelle
  Entscheidung und eine fachliche Gegenprobe enthalten.
- Commit: `test(ai): sichere e6aca Decision-Checkpoints`.

### P3 – Effektive Defense- und Rez-Bewertung

- Zusätzlichen Run-Widerstand aus ETR, Breakkosten, Trace-/Schadens-/Tag-
  Effekten, Runner-Ressourcen und Route bewerten.
- Installationskosten, Rez-Reserve, Handentlastung, Bluffwert und verdrängte
  Pläne gemeinsam berücksichtigen.
- Kostenlose oder sehr effiziente ETR-Rez-Aktionen generisch erkennen.
- Keine starre Schichtgrenze und kein pauschales Rez-vor-Install-Gebot.
- Commit: `fix(ai): bewerte effektive ICE-Verteidigung`.

### P4 – Scorekohärenz und generische Köderroute

- Agenda-Instanz und Zielserver über Defense-Unterstützung hinweg stabil
  halten.
- Letzten Click und Draw-Beobachtungsgrenzen im Turnplan korrekt bewerten.
- Eine generische Köderroute innerhalb von `corp.ambush_and_bluff` ergänzen:
  advancebare Nicht-Agenda, vorbereiteter Server, messbarer Runner-Aufwand und
  gebundene Anschlusslinie.
- Nach einem Run anhand tatsächlich verbrauchter Ressourcen neu planen; der
  Zugdirigent behält die globale Auswahl.
- Commit: `fix(ai): halte Score- und Koederlinien kohaerent`.

### P5 – Wirtschaftskampagnen und Reserven

- Den BBS-Hint-/Consumer-Vertrag an `up_to_amount_if_available` angleichen.
- Kampagnen generisch von Installation über Rez bis Auszahlung fortsetzen.
- Zweckgebundene Finanzierung nach Erreichen der Schwelle gegen niedrigere
  Parallelpläne schützen; echte höher priorisierte Zustandsänderungen bleiben
  zulässig.
- Commit: `fix(ai): vollende Wirtschaftslinien und Reserven`.

### P6 – Doctrine-, Gesamt- und Abschlussprüfung

- Den Einfluss von `corp.ice_tax_glacier` auf die konkrete Arbitration prüfen.
- Nur bei kausalem Nachweis generische Doctrine-Gewichtung ändern.
- Deckweiten Hint-/Consumer-Audit erneut ausführen.
- Enge Tests, AI-Shards und relevante Engine-/Shared-Gates ausführen.
- Evidence und Resultat dokumentieren.
- Commit: `docs(ai): schliesse e6aca Corp-Korrekturen ab`.

## Verifikationsregeln

Nach jedem Paket:

1. enge paketbezogene Tests;
2. `git diff --check`;
3. ausschließlich paketbezogene Dateien stagen;
4. Paketcommit;
5. Arbeitsstatus aktualisieren.

Der vollständige AI-Lauf verwendet `corepack pnpm test:ai:shards`. Der
serielle Pfad wird nur bei nachgewiesener Instabilität verwendet. Engine- und
Shared-Tests werden nach betroffenen Paketen eng und im Abschluss angemessen
breit ausgeführt.

## Worktree-, Git- und Integrationsregeln

- Hauptworkspace: `C:\Projekte\NETGRID`, Branch `main`.
- Arbeitsworktree: `C:\Projekte\NETGRID_AI_E6ACA07C_ANALYSIS`.
- Arbeitsbranch: `codex/ai-replay-e6aca07c-analysis`.
- Der Hauptworkspace wird bis zum finalen Merge nicht verändert.
- Nach allen Paketen wird aktuelles `main` in den Arbeitsbranch integriert,
  erneut verifiziert und bevorzugt per Fast-Forward nach `main` gemergt.
- Danach werden der saubere Worktree und der vollständig gemergte Arbeitsbranch
  entfernt und beide Entfernungen verifiziert.
- Kein Push und kein Pull Request ohne gesonderten Nutzerauftrag.

## Abschlusskriterien

- Setup! verursacht unrezzed im installierten Remote korrekt zwei Net Damage.
- Alle freigegebenen aktuellen Decision-Checkpoints sind grün.
- Neue ICE-Schichten bleiben als begründete Hand-, Bluff- und Aufbauaktion
  möglich, ohne teure nutzlose Überstapelung zu fördern.
- Score-, Köder- und Economy-Linien behalten Owner, Ziel und gebundene
  Ressourcen bis zur fachlichen Replanung.
- Deck-Audit und relevante Gates sind grün oder ein präziser Restbefund ist als
  nicht still erweiterter Follow-up dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert; Worktree und Branch sind
  verifiziert entfernt.

## Abschlussresultat vor Integration

### Umgesetzte Korrekturen

- `Setup!` löst den Access-Schaden nun unabhängig vom Rez-Zustand über die
  bestehende Engine-Access-Pipeline aus. Archives-Ausnahme, Replay und
  StateHash bleiben intakt.
- `corp.defend_servers` bewertet bekannte Runner-Pfadkosten über die exakte
  Engine-Quote des ganzen Pfads. Zusätzliche ICE-Schichten bleiben ohne harte
  Obergrenze möglich, verlieren aber bei hohem Rez-Gap und geringer
  Zusatzwirkung relativ an Wert.
- Score-Unterstützung behält residente Agenda- und Serverbindung. Ungebundene
  Servervarianten bleiben echte Alternativen; erst eine vorhandene Bindung
  sperrt konkurrierende Varianten derselben Agenda.
- Eine Advance-Aktion verdrängt einen Defense-/Draw-Schritt nur, wenn genau
  diese Agenda-Advance-Aktion bereits als Knoten des laufenden Zugplans
  gebunden war. Bloß neu entstandene Legalität reicht nicht.
- Die generische Score-Köderroute gehört weiterhin
  `corp.ambush_and_bluff`; der Zugdirigent bleibt globale Auswahlinstanz.
- Endliche Economy-Pools werden innerhalb von `corp.economy` von Installation
  über Rez bis Auszahlung geführt. Eine aktionsgebundene Auszahlung wird nur
  im eigenen `corp_action.main`-Fenster aktiviert und nicht im Runner-Zug
  vorzeitig offengelegt.

### Doctrine-Befund

`corp.ice_tax_glacier` ist im untersuchten Deck die primäre Strategie und
liefert passenden strategischen Kontext. Für keinen der reproduzierten Fehler
war ihre Gewichtung jedoch die kausale Auswahlursache. Die Korrekturen lagen
in Engine-Quote, Plan-Ownership, Zielbindung, Zugplan-Commitment und
Economy-Timing. Deshalb wurde keine zusätzliche Doctrine-Gewichtung und kein
kartenspezifischer Strategiepfad ergänzt.

### Verifikation

- Alle zehn e6aca-Entscheidungskontrollen einschließlich der beiden
  Schicht-Gegenproben bestehen.
- Die fünf im ersten vollständigen AI-Lauf gefundenen Querregressionen wurden
  gegen ihre bestehenden Invarianten korrigiert; die zugehörigen 24
  Checkpoint- und 53 Runtime-/Simulationskontrollen sind grün.
- `corepack pnpm test:ai:shards`: drei parallele Shards grün mit 1.768,
  1.516 und 1.160 Tests.
- AI-Typecheck, AI-Hint-/Source-Struktur, Economy-Verträge,
  Deckstrategieprüfung, Deck-Hint-Consumer-Audit und Formatprüfung sind grün.
- Der Engine-Gesamtlauf aus P1 bestand mit 210 Dateien und 1.825 Tests. Seit
  diesem Lauf wurde kein Engine-Produktionscode mehr geändert.
- Es wurden keine Server gestartet, keine Standardports berührt und keine
  Runtime-Datenbank beschrieben.
