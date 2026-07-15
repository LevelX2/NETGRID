# Node-Zugriffseffekte – Rez-Vertragsprozess

## Status

Aktive sequenzielle Umsetzung seit 2026-07-15. Arbeitsbranch:
`codex/node-access-rez-audit`.

## Quelle und Vorgabe

Ausgangspunkt ist die Regelfrage zu `Vacant Soulkiller`: Ein installierter
Node muss grundsätzlich gerezzt sein, damit sein Zugriffseffekt wirkt. Die
führende Regelpräzisierung unter `docs/source/Netrunner Errata 1.70.md` nennt
für installierte Nodes und Upgrades die Rez-Anforderung und `Virus Test Site`
als einzige ausdrückliche V1.0-/Proteus-Ausnahme. Der aktuelle
`Vacant Soulkiller`-Regressionstest lässt dagegen das Rez-Fenster verstreichen
und erwartet trotzdem advancementskalierenden Core Damage.

Der Nutzer verlangt die Prüfung aller aktiven Nodes auf diese Fehlerklasse und
die direkte Umsetzung als paketierten Worktree-Prozess mit `/Goal`.

## Zielprüfung

Der Endzustand ist ausreichend präzise bestimmbar:

- Aktive historische Nodes werden im Runtime-Modell als Corp-Assets geführt.
- Installierte Nodes dürfen Zugriffseffekte standardmäßig nur gerezzt
  auslösen.
- Eine Abweichung ist nur mit ausdrücklichem Kartentext oder führender
  Einzelregel zulässig.
- Zugriffe aus HQ, R&D oder Archives werden getrennt vom Aktivierungszustand
  installierter Karten behandelt.
- `Virus Test Site` bleibt im installierten unrezzed Zustand die bestätigte
  Sonderregel: genau 1 Net Damage, unabhängig von Advancement-Countern.

## Gesamtziel

Alle aktiven Corp-Nodes/Assets aus Originalset V1, Classic und Proteus sind
gegen die Rez-Grundregel inventarisiert. Die Engine bildet den Vertrag
generisch und explizit ab: installierte Zugriffseffekte benötigen Rez, sofern
eine Kartenimplementierung keine belegte Ausnahme deklariert. Sämtliche
betroffenen Karten besitzen Regressionen für rezzed, unrezzed und – wo
relevant – nicht installierte Zugriffspfade. PlayerView, PublicEvent, Replay,
StateHash und Hidden-Info-Grenzen bleiben intakt.

## Annahmen

- Die Originalset-Bezeichnung `Node` entspricht im aktuellen Daten- und
  Engine-Modell dem Corp-Kartentyp `asset`.
- Die Grundregel gilt setübergreifend auch für aktive Classic-Nodes, sofern
  kein neuerer führender Kartentext oder eine Einzelregel widerspricht.
- Die Version-0-Umgebung benötigt keine Migration bestehender Matches oder
  Replays.
- Die moderne Runtime-Bezeichnung `core` bleibt die technische Entsprechung
  des historischen Brain Damage.

## Nicht-Ziele

- Keine Änderung von ICE-, Agenda-, Operation- oder Runner-Kartenregeln.
- Keine allgemeine Neugestaltung des Breach-/Access-Systems.
- Keine Änderung des Kartenpools, der Decklegalität oder des AI-Pools.
- Keine inhaltliche Neuinterpretation von Upgrade-Karten außerhalb gemeinsam
  genutzter generischer Zugriffsinvarianten.
- Kein Push, Pull Request oder Remote-Merge.

## Controller-Invarianten

- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Die Rules Engine bleibt einzige Regelautorität.
- PlayerActions werden ausschließlich aus LegalActions abgeleitet und in
  `applyAction` erneut validiert.
- Keine verdeckten Karteninformationen gelangen in öffentliche Payloads,
  PlayerViews, KI-Inputs, Replays oder Fehlertexte.
- Ausdrückliche Ausnahmen werden kartennah und positiv deklariert; der
  generische Default bleibt `installed_requires_rezzed`.
- Nach jedem Paket laufen die engsten relevanten Checks und
  `git diff --check`; nur paketzugehörige Änderungen werden committed.

## Automatische Fehlerbehandlung

Fokussierte Testfehler werden innerhalb des aktiven Pakets eng diagnostiziert
und behoben. Neue Kartenfunde werden als Bestandteil des laufenden Inventars
klassifiziert, nicht still aus dem Scope entfernt. Scope-fremde rote Tests
werden reproduziert und als bestehende Abweichung dokumentiert. Kein
Folgepaket beginnt vor erfülltem Done-Gate.

## Sicherheitsblocker

Ein Widerspruch zwischen führender Regelquelle und ausdrücklichem Kartentext,
ein nicht side-sicher lösbarer Zugriffseffekt, ein Replay-/StateHash-Bruch oder
ein fachlich nicht defensiv lösbarer Mergekonflikt stoppt den Prozess. Removal
Condition ist eine eindeutige Regelentscheidung beziehungsweise ein
side-sicherer, erneut geprüfter Vertrag.

## State Machine

`P0 Prozess-Freeze -> P1 Vollinventar und Regelklassifikation -> P2 generischer Enginevertrag und Kartenausnahmen -> P3 breite Kartenregression -> P4 Wissenspflege und Final Review -> Final Verify -> Merge main -> Cleanup -> Complete`

## Paketfolge und Paketdetails

### P0 – Prozess-Freeze

- Ziel: Scope, Invarianten, Paketfolge, Checks und Integrationsweg verbindlich
  festhalten.
- Eingang: sauberer Hauptworkspace und eigener Worktree auf aktuellem `main`.
- Arbeit: dieses Prozessartefakt einschließlich `/Goal` erstellen.
- Kernartefakt: dieses Dokument.
- Checks: `git diff --check`.
- Done-Gate: Prozessartefakt ist committed und der Worktree bleibt sauber.
- Commit: `docs(cards): define node access rez audit process`.

### P1 – Vollinventar und Regelklassifikation

- Ziel: Alle aktiven Node-/Asset-Zugriffseffekte vollständig klassifizieren.
- Eingang: P0 abgeschlossen.
- Arbeit: Kartendaten, CardImplementations, Resolver und Tests für Originalset
  V1, Classic und Proteus automatisiert sowie manuell gegen die Rez-Grundregel
  prüfen. Jeder Fall erhält Set, Karten-ID, Quelle, Source-Zone,
  Installiert-/Rez-Vertrag, Ausnahmebeleg, Runtimepfad und Teststatus.
- Kernartefakt:
  `docs/reviews/engine/node-access-rez-audit-2026-07-15.md`.
- Checks: reproduzierbare `rg`-/Inventarabfragen, Vollständigkeitsabgleich
  gegen aktive Asset-Kartendaten, `git diff --check`.
- Done-Gate: Jede aktive Node-/Asset-Karte mit Zugriffseffekt ist genau einer
  belegten Vertragsklasse zugeordnet; Lücken sind als Implementierungsfälle
  benannt.
- Commit: `docs(cards): audit node access rez contracts`.

### P2 – Generischer Enginevertrag und Kartenausnahmen

- Ziel: Rez-Anforderung fail-closed im semantischen Access-Vertrag abbilden.
- Eingang: P1 abgeschlossen.
- Arbeit: CardImplementation-Typen und Access-Resolver um eine explizite
  Installiert-Aktivierungsregel ergänzen beziehungsweise vorhandene
  Aktivierungsmetadaten verwenden. Default für installierte Node-/Asset-
  Zugriffseffekte ist `requires_rezzed`; belegte Ausnahmen werden kartennah
  deklariert. `Vacant Soulkiller`, `Experimental AI` und verwandte Ambushes
  werden auf den korrekten Default umgestellt; `Virus Test Site` bildet
  rezzed und unrezzed getrennt korrekt ab.
- Kernartefakte: CardImplementation-Typen, generischer Access-Resolver,
  betroffene Kartenimplementierungen und fokussierte Engine-Regressionen.
- Checks: fokussierte Tests für Access-Resolver, `Vacant Soulkiller`,
  `Experimental AI`, `Virus Test Site` und erkannte Ausnahmen;
  `@netgrid/engine`-Typecheck; `git diff --check`.
- Done-Gate: Unrezzed installierte Standard-Nodes lösen nicht aus, rezzed
  Nodes lösen unverändert aus und belegte Ausnahmen folgen exakt ihrem
  Sondervertrag.
- Commit: `fix(engine): require rez for installed node access effects`.

### P3 – Breite Karten- und Sicherheitsregression

- Ziel: Den Vertrag über alle inventarisierten Karten und angrenzenden
  Zugriffspfade absichern.
- Eingang: P2 abgeschlossen.
- Arbeit: tabellen- oder familiengetriebene Regressionen für alle
  Vertragsklassen ergänzen; HQ-/R&D-/Archives-Ausnahmen, Reveal-Verhalten,
  Damage/Trash/Counter-Choices, Rez-Fenster, PublicPayload-Redaction, Replay
  und StateHash prüfen. Verbleibende fehlerhafte Deskriptoren korrigieren.
- Kernartefakte: Originalset-/Proteus-/Classic-Access-Tests und gegebenenfalls
  weitere kartenspezifische Implementierungen.
- Checks: vollständige betroffene Engine-Testdateien, Engine-Typecheck,
  Leakscan-/Replay-/StateHash-Regressionen, `git diff --check`.
- Done-Gate: Das P1-Inventar besitzt geschlossene Testevidence; keine
  unrezzed Standard-Node-Wirkung und keine beschädigte Ausnahme bleibt.
- Commit: `test(engine): cover node access rez matrix`.

### P4 – Wissenspflege und Final Review

- Ziel: Wiederverwendbaren Regel- und Abschlussstand projektweit festhalten.
- Eingang: P3 abgeschlossen.
- Arbeit: Final Review mit Auditmatrix, Implementierungsentscheidung,
  Verifikation und Restpunkten erstellen; relevante Wissensübersicht,
  Current-State-Status und Juli-Log nach Projektregel aktualisieren; dieses
  Prozessartefakt um den Umsetzungsnachweis ergänzen.
- Kernartefakte:
  `docs/reviews/engine/node-access-rez-contract-final-review-2026-07-15.md`,
  passende Wissens- und Statusseiten sowie dieses Dokument.
- Checks: Dokumentlink-/Plausibilitätsprüfung, fokussierte Engine-Suite,
  Engine-Typecheck und `git diff --check`.
- Done-Gate: Regelvertrag, Kartenmatrix, Checks und Restpunkte sind in den
  führenden Current-State-Artefakten nachvollziehbar.
- Commit: `docs(cards): close node access rez audit`.

## Verifikationsregeln

- Nach jedem Paket: engste Paketchecks und `git diff --check`.
- P2/P3: mindestens fokussierte Kartenfamilien-Tests und Engine-Typecheck.
- Vor Integration: vollständige `@netgrid/engine`-Tests, Engine-Typecheck,
  relevante Catalog-/Shared-Checks bei geänderten Verträgen sowie
  `git diff --check`.
- Nach Main-Abgleich: dieselben finalen Checks erneut, sofern der Abgleich
  betroffene Dateien oder Abhängigkeiten verändert.
- Technisches Grün belegt Regel-, Replay- und Hidden-Info-Stabilität, nicht
  globale Karten- oder Deckstärke.

## Worktree-, Git- und Integrationsregeln

- Umsetzung ausschließlich in
  `C:\Projekte\NETGRID_NODE_ACCESS_REZ_AUDIT`.
- Arbeitsbranch: `codex/node-access-rez-audit`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für den finalen lokalen Merge.
- Jedes abgeschlossene Paket erhält einen eigenen Commit.
- Vor dem finalen Merge wird aktuelles lokales `main` defensiv in den
  Arbeitsbranch integriert, wenn `main` weitergelaufen ist.
- Bevorzugter Merge nach `main`: Fast-Forward.
- Worktree erst nach erfolgreichem Main-Merge und sauberer Main-Prüfung
  entfernen; Entfernung in Git und Dateisystem doppelt verifizieren.
- Den vollständig gemergten Arbeitsbranch anschließend mit `git branch -d`
  löschen und seine Abwesenheit prüfen.

## Controller-Prompt-Kern

`/Goal Arbeite den Node-Zugriffseffekt-Rez-Vertrag vollständig und sequenziell von P0 bis P4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die verpflichtenden Wiki-Einstiegsseiten, agents/card-enablement-ai-knowledge-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_NODE_ACCESS_REZ_AUDIT auf Branch codex/node-access-rez-audit und nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, aktualisiere die Paketartefakte, führe die Paketchecks aus und committe jedes abgeschlossene Paket. Stoppe bei einem Sicherheitsblocker mit Blocker-Report und Removal Condition. Verifiziere nach P4 final, integriere aktuelles main defensiv in den Arbeitsbranch, merge lokal nach main, prüfe main, entferne den sauberen Arbeits-Worktree und den vollständig gemergten Branch verifiziert und markiere das Goal erst danach als complete.`

## Abschlusskriterien

- Vollständiges aktives Node-/Asset-Zugriffsinventar für Originalset V1,
  Classic und Proteus.
- Installierte Standard-Nodes wirken beim Zugriff nur gerezzt.
- `Virus Test Site` und jede weitere belegte Ausnahme sind exakt und explizit
  modelliert.
- Rezzed-, unrezzed- und relevante nicht installierte Zugriffspfade sind
  regressiv abgedeckt.
- Hidden-Info, LegalActions, PublicPayload, Replay und StateHash bleiben grün.
- Alle Paketcommits und finalen Checks sind abgeschlossen.
- Arbeitsbranch ist lokal nach `main` integriert; Worktree und Branch sind
  verifiziert entfernt.

