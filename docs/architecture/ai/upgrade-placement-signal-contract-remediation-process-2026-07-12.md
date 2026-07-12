# Upgrade Placement Signal Contract Remediation Process 2026-07-12

## Status

`ready_for_integration`

## Quelle und Evidence

- Nutzerfund aus dem aktiven Match `match_0919a905d2772f18`.
- Decision 56 / Event 118: Networked Center wurde in HQ installiert.
- Decision 57 / Event 119: Research Bunker wurde unmittelbar danach ebenfalls
  in HQ installiert und ersetzte Networked Center.
- Der vorhandene Consumer `corpUpgradeInstallPlacementComponent` erhielt in
  beiden Entscheidungen nicht die bereits reviewten Signale
  `remote.agenda_difficulty_discount` und
  `score.agenda_difficulty_discount`.
- Die bisherige Regression injiziert diese Signale direkt und prüft deshalb
  nicht den produktiven Vertrag von aktivem Hint über Semantic Profile und
  Action Projection bis zum Corp-Score.

## Gesamtziel

Der produktive Semantic-Runtime-Pfad transportiert kartenweite, reviewte
Placement-Signale aus den aktiven AI-Hints side-safe bis zum generischen
Upgrade-Placement-Consumer. Agenda-Difficulty-Upgrades werden auf Central-
Servern hart abgewertet und erhalten nur auf einem vorbereiteten oder aktiven
Scoring-Remote positiven Fit. Der Vertrag wird mit echten Hint-zu-Score-
Regressionen abgesichert.

## /Goal

`/Goal Behebe den Upgrade-Placement-Signalvertrag vollständig und sequenziell,
verifiziere die Änderung im Worktree
C:\Projekte\NETGRID_AI_UPGRADE_PLACEMENT_SIGNAL_CONTRACT auf Branch
codex/ai-upgrade-placement-signal-contract und merge den abgeschlossenen
Arbeitsbranch lokal nach main.`

## Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Die KI wählt weiterhin ausschließlich aus `LegalActions`.
- Der Fix nutzt nur Corp-PlayerView, LegalAction und aktive side-safe AI-Hints.
- Keine Kartennamen-Sonderregel im Runtime-Consumer.
- Keine Engine-, Replay-, StateHash-, Randomness- oder Hidden-Info-Änderung.
- Bestehende Central-Upgrades bleiben als Gegenbeispiele zulässig.

## Nicht-Ziele

- Keine neue Engine-Illegalität für Central-Installationen.
- Keine pauschale neue Region-Replacement-Strafe ohne eigene Evidence.
- Kein allgemeines Rebalancing der Corp-Scoreline- oder Board-Triage-Gewichte.
- Keine Remote-Integration und kein Push.

## Paketfolge

### Paket 1: Preflight und Prozessvertrag

- Worktree und Branch anlegen.
- Evidence, Invarianten, Paketfolge und Gates dokumentieren.
- Done-Gate: Prozessartefakt vorhanden, `git diff --check` grün, eigener Commit.

### Paket 2: Produktiven Signalvertrag reparieren

- Reviewte kartenweite Taktiksignale in den Action-Card-Semantic-Profilen
  erhalten, ohne Legacy-Rollen in produktive Taktiksignale umzudeuten.
- Der Upgrade-Placement-Consumer muss den wiederhergestellten Vertrag nutzen.
- Done-Gate: fokussierte Profil- und Score-Tests grün, `git diff --check` grün,
  eigener Commit.

### Paket 3: Echte Hint-zu-Score-Regressionen

- Regressionen für Research Bunker, Networked Center, Weapons Depot und
  Washington, D.C., City Grid über den produktiven Profilaufbau ergänzen.
- Central-Mismatch, vorbereitetes Remote-Fit und Central-Gegenbeispiele
  absichern.
- Den beobachteten HQ-Region-Ersatz als Fehlweg im Testszenario abdecken.
- Done-Gate: fokussierte Regressionen grün, `git diff --check` grün, eigener
  Commit.

### Paket 4: Review, Wissenspflege und breite Verifikation

- Evidence-/Final-Review aktualisieren oder ergänzen.
- Dauerhaften Signalvertrag im Juli-Log dokumentieren.
- AI-Typecheck, relevante Tests und `git diff --check` ausführen.
- Done-Gate: Dokumentation und Checks grün, eigener Commit.

### Paket 5: Main-Abgleich und lokale Integration

- Aktuelles lokales `main` in den Arbeitsbranch integrieren, falls nötig.
- Relevante Checks im finalen Branchzustand wiederholen.
- Arbeitsbranch lokal nach `main` mergen, Hauptworkspace verifizieren und den
  sauberen Worktree entfernen.

## Automatische Fehlerbehandlung

- Rote fokussierte Tests werden innerhalb des aktiven Pakets analysiert.
- Fremde Änderungen im Hauptworkspace werden nicht übernommen oder verändert.
- Bei Konflikten werden beide fachlichen Intentionen gelesen und erhalten;
  ein unauflösbarer Vertragskonflikt ist ein Blocker.
- Hidden-Info-, LegalAction- oder Engine-Korrektheitsregressionen stoppen die
  Integration.

## Verifikationsregeln

Mindestens:

- fokussierte Vitest-Regressionen für Semantic Profiles und Corp-Score;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- relevante AI-Hint-/Semantic-Gates, falls AI-Daten geändert werden;
- `git diff --check` nach jedem Paket und nach dem Main-Merge.

## Abschlusskriterien

- Der echte aktive Hint von Research Bunker erreicht den Placement-Consumer.
- HQ, R&D und Archives erhalten den vorgesehenen harten Mismatch-Malus.
- Ein vorbereitetes Scoring-Remote erhält positiven Fit.
- Gegenbeispiele für Central-Upgrades bleiben grün.
- Alle Paketcommits liegen auf dem Arbeitsbranch und sind lokal nach `main`
  integriert.
