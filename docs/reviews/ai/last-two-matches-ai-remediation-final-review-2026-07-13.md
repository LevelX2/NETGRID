# Letzte zwei Spiele: KI-Remediation – Abschlussreview (2026-07-13)

## Ergebnis

Die vier freigegebenen KI-Fehler aus `match_543e35cbdf91cee3` und
`match_1d63717d70fc81ef` sind als fünf spielgleiche Decision-Checkpoints mit
damaligem Engine-/Runtime-Zustand und ausschließlich öffentlichem Eventpräfix
dauerhaft gesichert. Alle fünf Zielerwartungen und drei neue Gegenproben sind
unverändert grün.

Die Korrekturen sind generisch, LegalAction-basiert und side-safe. Es gibt
keine Match-, Seed-, Deck- oder Kartennamen-Sonderlogik und keine Änderung an
Engine-Regeln, PlayerView, Replay, StateHash, Randomness oder Kartenpool.

## Analysierte Spiele

- `match_543e35cbdf91cee3`: Mensch-Corp gegen Runner-KI, Runner-Flatline bei
  StateVersion 20. Der historische Fehleranker ist SV12 / DI6.
- `match_1d63717d70fc81ef`: KI gegen KI, Runner-Sieg durch leeres Corp-R&D bei
  StateVersion 588. Fehleranker sind SV141 / DI142, SV209 / DI210, SV529 /
  DI530 und SV558 / DI559.
- Quelle:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`, ausschließlich
  read-only geöffnet.

## Geschlossene Fehlergruppen

### Zeitlich begrenzte Access-Vorbereitung

`Prearranged Drop` wurde in zwei eindeutigen Zuständen mit dem letzten Click
gespielt, obwohl der Nutzen nur durch einen Agenda-Zugriff im selben Zug
eingelöst werden kann. Die Runner-Handentwicklung erkennt jetzt generisch die
Kombination aus strukturiertem `on_access`-Timing und sichtbarer
`this turn`-Begrenzung. Eine aktuell legale Vorbereitung bleibt nur
`legal_now`, wenn nach ihren Click- und Creditkosten mindestens eine legale
Run-/Access-Einleitung in den verbleibenden Ressourcen liegt.

CP01 und CP02 verbieten die tote Vorbereitung. Die Gegenprobe mit einem
zusätzlichen Click wählt sie weiterhin. SV74 mit vier Clicks bleibt bewusst
kein letzter-Click-Checkpoint; der dortige mehrstufige Plan-Follow-up ist ein
separater, aus diesem Fix nicht belegter Befund.

### Movement ist kein aktives Encounter

Im Bewegungsfenster vor `Banpei` behandelte die RunnerRunPlan-Policy das
angegangene ICE bereits wie ein aktives Encounter und jackte trotz erreichbarem
Restpfad aus. Current-Encounter-Sequenzen, Safety-Prüfung und Break-Pflicht
laufen nun ausschließlich bei `run.phase === "encounter_ice"`.

CP03 verlangt in SV209 `continue_run`. Die gleiche Fehlersignatur trat im
Match bei SV271, SV334, SV378, SV412, SV523 und SV571 auf. Bestehende
Encounter-Gegenverträge für tatsächliche Safety-Bedrohungen, unbezwingbare
bekannte ICE und bereits bezahlte ICE bleiben grün.

### Aktueller Trace-Kontext

CP04 verlangt im Trace-Fenster SV529 das Gebot `5`: Basisstärke 5,
Runner-Link 0 und neun Runner-Credits machen `5` zum kleinsten garantierenden
Gebot; danach bleiben Credits und Clicks für die sichtbare
`Scorched Earth`-/`Urban Renewal`-Konvertierung.

Dieser generische Trace-Kontext- und Mindestgebotsvertrag wurde nicht doppelt
implementiert. Er kam während des Prozesses regulär über `main` aus dem bereits
freigegebenen Manhunt-Ausführungsstrang. CP04 war auf dessen Vor-Fix-Commit
`a16c71eb9` eine `behavior_regression` und ist seit der Integration
`ea4ceb2b7` grün. Ohne sichtbaren Tag-Payoff erzwingt die Gegenprobe das
Kill-Gebot `5` nicht.

### Sicherer Corp-Deckout

Bei leerem sichtbarem Corp-R&D aktivierte der Runner in SV558 noch Broker und
startete anschließend einen wirkungslosen Run, statt den obligatorischen
Corp-Draw zu erzwingen. Die Semantic Runtime besitzt nun einen kleinen
Immediate-Endgame-Vertrag: Auf Runner-Seite, bei `deckCount === 0`, ohne
bereits erklärten Sieger und mit legalem `end_turn` wird das Zugende vor
optionalen taktischen Nebenaktionen gewählt. Mit mindestens einer sichtbaren
R&D-Karte greift der Vertrag nicht.

CP05 und seine Deck-nicht-leer-Gegenprobe sichern beide Seiten dieses Vertrags.

## Checkpoint- und Red-Evidence

- Fixtures: `data/scenarios/ai-decision-checkpoints/cp-last-two-01.json` bis
  `cp-last-two-05.json`.
- Produktiver Test:
  `packages/ai/src/evaluation/decision-checkpoints/last-two-matches-decision-checkpoints.test.ts`.
- Vor-Fix-Nachweis: fünf rote Zielentscheidungen und drei grüne Gegenproben am
  Choice-fähigen Vor-Fix-Stand `a16c71eb9`; ausschließlich
  `behavior_regression`, kein Legality-, Runtime-, Fixture- oder
  Redaction-Drift.
- Detaillierte Evidence:
  `docs/reviews/ai/last-two-matches-decision-checkpoint-red-evidence-2026-07-13.md`.

## Verifikation

Im Arbeits-Worktree waren grün:

- alle fünf Zielentscheidungen und drei neuen Gegenproben;
- Runner-Handentwicklung, RunnerRunPlan Path Quote und Policy: 55 Tests;
- Trace-/Choice-/Deckout-Nachbarschaft: fünf Testdateien, 31 Tests;
- vollständige AI-Suite: 315 Testdateien, 2.084 Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Es wurde kein Benchmark- oder Selfplay-Langlauf ausgeführt. Ein solcher Lauf
war weder für die reproduzierten Verträge erforderlich noch Teil des
beauftragten Verifikationsumfangs.

## Git- und Integrationsstand

P0 bis P5 wurden paketweise committed und lokal per Fast-Forward von
`1f2a66b91` bis `a55132982` nach `main` integriert. Direkt im Hauptworkspace
sind sieben relevante Testdateien mit 74 Tests, der AI-Typecheck und
Diff-Hygiene grün.

Der Worktree
`C:\Projekte\NETGRID_AI_LAST_TWO_MATCHES_20260713` ist nach dem kontrollierten
Windows-Long-Path-Cleanup weder in Git registriert noch im Dateisystem
vorhanden. `codex/ai-last-two-matches-20260713` wurde als vollständig gemergter
Branch mit `git branch -d` gelöscht. Die zwei fremden uncommitteten
Engine-Dateien im Hauptworkspace überschneiden sich nicht mit diesem KI-Scope
und blieben unangetastet.
