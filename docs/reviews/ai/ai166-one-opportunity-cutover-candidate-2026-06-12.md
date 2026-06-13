# AI166 One Opportunity Cutover Candidate

Datum: 2026-06-12

Branch: `codex/ai159-ai169-endgame-opportunity`

## Ziel

AI166 sollte genau einen belegten Opportunity-Cutover-Kandidaten auswählen, falls AI159 bis AI165 einen same-state besseren LegalAction-Nachweis liefern. Der Eingriff durfte den Testgegenstand nicht verändern: keine neuen LegalActions, keine Hidden-Info-Ausweitung, keine generischen Credit-/Draw-/Run-/Corp-Economy-Strafen und kein Runtime-Cutover ohne LegalAction-Beweis.

## Entscheidung

Kein Runtime-Cutover.

| Voraussetzung | Befund | Entscheidung |
| --- | ---: | --- |
| Same-state Opportunity besser als tatsächliche Aktion | 0/17 | nicht erfüllt |
| Opportunity-Zielkontext fehlt | 2/17 | blockiert |
| Kein Opportunity-State gefunden | 15/17 | blockiert |
| Deterministischer Lookahead mit Proxy-Win | 7/10 | Shadow-Evidence, kein Runtime-Beweis |
| echte Opportunity-LegalAction-Snapshots | 0 | blockiert |

## Begründung

AI159 fand keine verwertbare same-state bessere LegalAction. AI161, AI162 und AI164 zeigen zwar konkrete Pfade und Ladder-Stufen, aber sie beweisen nur, welche Richtung aus Sicht der Analyse plausibel wäre. AI165 verstärkt diesen Befund mit 7 Lookahead-Proxy-Wins aus 10 Proben, bleibt aber ebenfalls ohne Opportunity-LegalAction-Snapshot.

Damit wäre jeder produktive Cutover aktuell eine Heuristik auf später beobachteten Endfenstern statt eine Auswahl aus den zum ursprünglichen Entscheidungszeitpunkt legalen Aktionen. Das würde den Testgegenstand verändern und gegen den Paketprozess verstoßen.

## Umgesetzter Umfang

- kein neuer Runtime-Flag
- keine Änderung an `@netgrid/ai`
- keine Änderung an Engine-, Server- oder Web-Runtime
- keine neue LegalAction-Generierung
- kein Fixture-Fixrun, weil es keinen zulässigen Kandidaten gibt

## Nächster zulässiger Schritt

Der nächste technische Schritt ist nicht ein Cutover, sondern Instrumentierung: Opportunity-State-LegalAction-Snapshots müssen für frühere relevante Zustände redaction-sicher erhoben werden. Erst danach kann ein einzelner Kandidat gegen tatsächliche same-state LegalActions geprüft und optional hinter einem Default-off-Micro-Flag getestet werden.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai159-opportunity-state-mining.ts`
- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai165-deterministic-endwindow-lookahead-v2.ts`
- `git diff --check`
