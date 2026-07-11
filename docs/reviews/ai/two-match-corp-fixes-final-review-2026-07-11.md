# Two-Match Corp AI Fixes Final Review

Status: Abgeschlossen und lokal nach `main` integriert

## Analysierte Matches

- `match_3a9aeae8628e4f0a`
- `match_8d959dc447958cef`

Beide Spiele waren `human_runner_vs_corp_ai` mit Corp-KI auf Hard. Die
Umsetzung verwendet ausschließlich side-safe PlayerView-, PublicEvent-,
LegalAction- und Hintdaten.

## Umgesetzte Verträge

### Remote-Schutz

- `protect_remote` übernimmt das Urteil des bestehenden
  `corp-ice-placement`-Evaluators verbindlich.
- Nicht stoppendes oder sichtbar wirkungsloses ICE gilt nicht als
  Planfortschritt.
- Wirksames, aber noch nicht finanzierbares ICE erzeugt einen bezifferten
  Reservebedarf aus Installations- und Rez-Kosten.
- Ohne wirksame Handoption entsteht `find_remote_protection` mit legalem
  Draw-Schritt statt einer beliebigen ICE-Installation oder Credit-Schleife.

### Agenda-Exposition

- Die Source-Blocker `unsafe_remote`, `runner_contest` und `cheap_contest` der
  Corp-Scoreline-Bewertung werden als harte Planblocker konsumiert.
- Eine unsichere Agenda-Installation kann dadurch nicht mehr trotz bereits
  erkannter Slow-/Matchpoint-Gefahr aktueller Scoreplan-Schritt werden.

### Persistente Economy-Aktivierung

- Reviewte persistente `asset_economy`-Karten erhalten
  `corp.activate_persistent_economy`.
- Installierte Nullkosten-Engines wie `Corporate Negotiating Center` und
  `ESA Contract` werden vor passiven Off-Plan-Aktionen aktiviert.
- BBS und andere endliche Credit-Pools bleiben im bestehenden
  Finite-Economy-Owner.
- Wiederholbare Draw-Nutzung wird nur verfolgt, solange mindestens zwei
  Handplätze frei sind.

### Purge

- Purge besitzt jetzt eine sichtbare Score-Komponente aus Anzahl entfernbarer
  Virus-Counter, betroffenen kritischen ICE, aktivem Zentralserverdruck,
  Aktionskosten und konkurrierendem Scoreline-Auftrag.
- Ein einzelner Counter während dringender Scoreline-Reparatur erhält einen
  starken Malus; mehrere Counter auf kritischem ICE können außerhalb eines
  akuten Scorefensters positiven Purge-Wert erzeugen.

## Zusätzliche Testkorrektur

Der vollständige AI-Lauf deckte einen unabhängigen, fest verdrahteten
Classic-Katalogtest auf. Die feste Erwartung von 52 Karten wurde entfernt. Der
Test prüft weiterhin jede tatsächlich vorhandene Classic-Karte und zusätzlich
die Eindeutigkeit aller Card-IDs. Der aktuelle Katalog mit 54 Karten ist damit
ohne manuelle Zählwertpflege abgedeckt.

## Verifikation

- P2: 93 fokussierte Placement-/Plan-Tests, 41 Matching-/Boundary-Tests.
- P3: 122 Scoreline-/Scoring-Window-Tests.
- P4: 152 Economy-/Ranking-/Plan-/Boundary-Tests.
- P5: 145 Purge-/Corp-Score-/Board-Triage-Tests.
- Vollständig `@netgrid/ai`: 288 Testdateien, 1.887 Tests grün.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `git diff --check`: grün.

## Grenzen

- Kein neuer Karten-Sonderfall und keine Hidden-Info-Auswertung.
- Keine Engine-, LegalAction-, Replay-, StateHash- oder Randomness-Änderung.
- Die Änderungen garantieren keine optimale Deckstrategie; sie schließen die
  belegten Plan-/Bewertungswidersprüche generisch.

## Integration

Arbeitsbranch: `codex/ai-two-match-corp-fixes-20260711`.
Der Arbeitsbranch wurde per Fast-Forward lokal nach `main` integriert. Die
abschließende Main-Verifikation wiederholt fokussierte Regressionen, AI-Typecheck
und Diff-Hygiene.
