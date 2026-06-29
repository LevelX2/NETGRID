# AB86 Corp-KI-Fixes Final

Match: `match_ab86e817041818b3`

Status: lokal umgesetzt, Tests grün, bereit für lokale `main`-Integration.

## Ausgangsbefund

Die Corp-KI verlor das AB86-Spiel trotz besserer Ansätze weiter über HQ-Agenda-Druck und zu langsame Scoreline-Nutzung. Die auffälligen Muster waren:

- Ein bestehendes Remote mit bezahlbarer relevanter ICE und fehlender sichtbar installierter Runner-Coverage wurde zu stark als unsichere Scoreline blockiert.
- Support-Roots und passive Credits verdrängten konkrete Agenda-Evakuierung aus HQ.
- Zentral-ICE wurde für HQ-Schutz zu wenig nach echtem Zugriffsstopp unterschieden.
- Das Replay enthielt Hinweise auf einen nicht neu geladenen Serverstand; der nächste Playtest muss nach einem Runtime-Neustart erfolgen.

## Umgesetzte Änderungen

- `force_scoreline_clock` greift nun nicht nur bei niedrigem R&D/Deckout-Flood, sondern auch bei side-safe HQ-Agenda-Druck, wenn eine konkrete Scoreline-LegalAction in eine bestehende Remote mit bezahlbarer relevanter ICE und ohne sichtbare installierte Runner-Coverage spielbar ist.
- Game-ending oder sichtbar contestable Scorelines bleiben von dieser Zwangs-Scoreline ausgenommen und fallen weiter an Schutz/Funding.
- Unter erzwungener Scoreline werden passive `gain_credit`/Draw-Optionen und non-scoreline Roots im Zielremote als Mismatch bewertet, solange kein Rez-Floor-Funding fehlt.
- Zentrale ICE-Installationen bei HQ/R&D-Agenda-Druck erhalten eine eigene Zugriffsstopp-Komponente: echte ETR-/Run-Lock-ICE wird positiv markiert, tax-/damage-/positionsabhängige ICE ohne Access-Stop wird negativ markiert.
- Die bestehende Central-ICE-Profilierung vertraut bei vorhandenen strukturierten Subroutinen deren genauer Wirkung vor groben Hint-Rollen. Dadurch zählt `Ball and Chain` nicht mehr als echter Access-Stop, nur weil ältere Hints es breiter einordneten.

## Grenzen

- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness-, PlayerView- oder Hidden-Info-Änderung.
- Keine Kartensonderliste. Kartenbeispiele dienen nur als Regressionen für generische Schutzwirkungslogik.
- Die Anpassung macht eine Scoreline nicht blind sicher; sie erlaubt nur konkrete bestehende Remote-Fenster, wenn sichtbare Runner-Coverage und Before-Score-Reachability dagegen nicht sprechen.

## Checks

- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000`: grün, 49 Tests.
- `corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/semantic-runtime-corp-scoring-window.test.ts src/runtime/semantic-runtime-corp-remote-score.test.ts src/runtime/semantic-runtime-corp-score.test.ts --maxWorkers=1 --testTimeout=30000`: grün, 96 Tests.
- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai test`: grün, 272 Testdateien, 2195 Tests.
- `git diff --check`: grün.

## Rest-Risiken

- Der AB86-Playtest selbst lief sehr wahrscheinlich nicht vollständig auf dem zuletzt gemergten AI-Stand. Für den nächsten Vergleich muss der lokale NETGRID-Server nach dem Merge neu gestartet werden.
- Die neue HQ-Agenda-Flood-Lage ist bewusst konservativ: Sie fordert eine konkrete bestehende Remote-Scoreline mit bezahlbarer relevanter ICE. Wenn die Corp nur ein neues Remote aufbauen könnte, bleibt Zentral-/Remote-Schutz statt erzwungener Agenda-Install führend.
