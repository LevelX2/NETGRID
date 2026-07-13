# KI-Remediation F450 und 10311 – Abschlussreview (2026-07-13)

## Ergebnis

Die vier freigegebenen Runner-KI-Fehler aus
`match_f450485d3e5be1ab` und `match_10311b60ca1364f6` sind als vier
spielgleiche Decision-Checkpoints mit damaligem Engine-/Runtime-Zustand und
ausschließlich öffentlichem Eventpräfix dauerhaft gesichert. Alle vier
Zielerwartungen und drei Gegenproben sind nach den Korrekturen unverändert
grün.

Die Änderungen sind generisch, LegalAction-basiert und side-safe. Es gibt
keine Match-, Seed-, Deck- oder Kartennamen-Sonderlogik und keine Änderung an
Engine-Regeln, PlayerView, Replay, StateHash, Randomness oder Kartenpool.

## Analysierte Spiele

- `match_f450485d3e5be1ab`: Mensch-Corp gegen Hard-Runner-KI, Corp-Sieg nach
  Agendapunkten bei StateVersion 158. Die wiederkehrenden Fehler lagen in
  falschen Run-Abbrüchen, fehlendem Matchpoint-Contest und Streetware-Aufbau.
- `match_10311b60ca1364f6`: Mensch-Corp gegen Hard-Runner-KI, Corp-Sieg nach
  Agendapunkten bei StateVersion 329. Die vier exakten Checkpoints liegen bei
  SV28, SV124, SV227 und SV318.
- Quelle:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`, ausschließlich
  read-only geöffnet.

## Geschlossene Fehlergruppen

### Umgeleitete Runs verwenden den aktuellen Restpfad

Nach einer legalen Umleitung blieb der gespeicherte RunnerRunPlan auf dem
ursprünglichen Server verankert. Die Revalidation erklärte deshalb den alten
Zielbezug für ungültig und erzwang einen Jack-out, obwohl der aktive Run nach
dem bereits passierten ICE einen erreichbaren und bezahlbaren Restpfad besaß.

Die Revalidation übernimmt nun im Movement den tatsächlich von der Engine
angegriffenen Server, markiert den Plan als `redirected_run` und quotiert nur
den aktuellen Restpfad. Ein nachweislich erreichbarer Pfad wird fortgesetzt;
ein nicht mehr erreichbarer oder unbezahlbarer Pfad darf weiterhin zum
Abbruch führen. CP01 verlangt bei SV227 `continue_run`; bestehende
Encounter-, Safety- und Unreachability-Gegenverträge bleiben grün.

### Öffentlicher Gegner-Matchpoint unterbricht normales Setup

Bei sechs öffentlichen Corp-Agendapunkten konnten Draw-, Bank- oder
Setup-Werte den letzten legalen Contest eines Scoring-Remotes verdrängen. Die
Semantic Runtime besitzt nun einen kleinen Runner-Endgame-Interrupt: Steht die
Gegenseite genau einen Punkt vor dem Sieg, priorisiert sie einen sichtbaren,
erreichbaren und bezahlbaren Remote-Zugriff vor normaler Plan- und
Scoreauswahl.

Der Vertrag nutzt ausschließlich öffentliche Punkte, sichtbare
Serverstruktur, bekannte Agenda-/Score-Threat-Signale und LegalActions. Leere,
unerreichbare oder unbezahlbare Remotes sowie Zustände ohne Matchpoint lösen
ihn nicht aus. CP02 verlangt bei SV318 einen legalen `start_run`; die
Gegenprobe ohne Corp-Matchpoint erhält den historischen Draw.

### Streetware-Aufbau endet bei komfortabler Gesamtliquidität

Die Bankbewertung lud Streetware wiederholt bis zu einem pauschalen Ziel,
obwohl genügend sofortige Credits und kein konkreter Finanzierungsbedarf
vorlagen. Nicht auszahlende Banken werden jetzt bei komfortabler Liquidität
und spätestens zwölf kombinierten Credits aus Cash und gehostetem Guthaben
nicht weiter aufgebaut.

Wiederverwendbare Auszahlungsbanken behalten bewusst ihren mehrstufigen
Aufbau- und Cashout-Vertrag. CP03 verbietet das Laden von Streetware bei 23
liquiden Credits; die historische Niedrigkredit-Gegenprobe lädt Streetware
weiterhin.

### Finanzierter Handkartenplan schützt den Folgeschritt

Der Runner finanzierte Cortical Cybermodem mit einem expliziten
`gain_credit`-Planschritt, verwarf aber im unmittelbar folgenden Zustand die
nun bezahlbare Installation zugunsten eines gewöhnlichen R&D-Runs. Die
Handentwicklung erkennt jetzt exakt diesen Übergang: gleicher persistenter
Zielgegenstand, unmittelbar vorhergehender Finanzierungsfortschritt, aktuell
legale und bezahlbare Installation sowie keine neue Speicher- oder
Redundanzblockade.

Der finanzierte Installationsschritt bindet die normale Off-Plan-Auswahl.
Reaktive Sicherheitsentscheidungen und der neue Gegner-Matchpoint-Interrupt
bleiben höher priorisiert. CP04 verlangt bei SV28 die Cybermodem-Installation;
mit weiterhin unzureichenden zehn Credits bleibt der nächste
Finanzierungs-Klick korrekt.

## Checkpoint- und Red-Evidence

- Fixtures: `data/scenarios/ai-decision-checkpoints/cp-f450-10311-01.json`
  bis `cp-f450-10311-04.json` sowie
  `cp-f450-10311-03-control.json`.
- Produktiver Test:
  `packages/ai/src/evaluation/decision-checkpoints/f450-10311-decision-checkpoints.test.ts`.
- Vor-Fix-Nachweis: vier rote Zielentscheidungen und drei grüne Gegenproben
  auf Ausgangs-`main` `2260d0e5b`; ausschließlich `behavior_regression`, kein
  Legality-, Runtime-, Fixture-, Warmup- oder Redaction-Drift.
- Detaillierte Evidence:
  `docs/reviews/ai/ai-matches-f450-10311-red-evidence-2026-07-13.md`.

## Verifikation

Im Arbeits-Worktree waren grün:

- alle vier historischen Zielentscheidungen und drei neuen Gegenproben;
- fünf fokussierte Checkpoint-/Run-/Plan-Testdateien mit 86 Tests;
- drei Bank-/Matchpoint-Unit-Testdateien mit 20 Tests;
- vollständige AI-Suite: 318 Testdateien, 2.102 Tests;
- `corepack pnpm --filter @netgrid/ai typecheck`;
- `git diff --check`.

Der erste Volltest deckte drei zu breite Bank-Komfortfälle sowie eine zu
konkrete ältere Deckout-Gegenprobe auf. Wiederverwendbare Auszahlungsbanken
behalten nun ihr Mehrlade-/Auszahlungsziel; die Deckout-Gegenprobe schützt
weiterhin den eigentlichen Vertrag gegen vorzeitiges Zugende. Der vollständige
Wiederholungslauf ist grün.

Es wurde kein Benchmark- oder Selfplay-Langlauf ausgeführt. Die exakten
historischen Checkpoints, Gegenproben und vollständige AI-Suite decken den
beauftragten Verifikationsumfang ab.

## Git- und Integrationsstand

P0 bis P5 wurden auf `codex/ai-f450-10311-remediation` paketweise committed
und lokal per Fast-Forward von `2260d0e5b` bis `95edd0eae` nach `main`
integriert. Direkt im Hauptworkspace sind die fünf relevanten
Checkpoint-/Run-/Plan-Testdateien mit 86 Tests, der AI-Typecheck und die
Diff-Hygiene des integrierten Commitbereichs grün.

Der Worktree
`C:\Projekte\NETGRID_AI_F450_10311_REMEDIATION_20260713` ist nach dem
kontrollierten Windows-Long-Path-Cleanup weder in Git registriert noch im
Dateisystem vorhanden. `codex/ai-f450-10311-remediation` wurde als vollständig
gemergter Branch mit `git branch -d` gelöscht. Die zwei fremden uncommitteten
Engine-Dateien im Hauptworkspace überschneiden sich nicht mit diesem KI-Scope
und blieben unangetastet. Es erfolgte kein Push und kein Pull Request.
