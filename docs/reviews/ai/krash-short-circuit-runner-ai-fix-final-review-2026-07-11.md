# Krash-/Short-Circuit-Runner-KI: Final Review

Datum: 2026-07-11

Quellmatch: `match_ce2b72a6bf4d4e80`

Status: umgesetzt und verifiziert

## Ergebnis

Die im manuellen Spiel beobachteten Fehler waren reproduzierbare
KI-Entscheidungsfehler und keine Kartenregel- oder Replayfehler. Der Fix ist
generisch und verwendet ausschließlich side-safe sichtbare Informationen:

1. Eine bereits erfüllte Breaker-Coverage erzeugt keinen positiven
   Coverage-Search-Loop mehr.
2. Suchziele berücksichtigen installierte und in der Grip vorhandene
   Definitionen sowie Credits und freie MU.
3. Redundante Breaker-Kopien verlieren beim Discard gegen neue funktionale
   Rig-Unterstützung; höchstens eine sinnvolle Backupkopie bleibt vertretbar.
4. Lockjaw, Clown und Vewy werden als unterschiedliche Krash-Unterstützungen
   erkannt. Krash selbst ist nicht mehr zugleich sein eigener Support.
5. Lockjaw-Zieltext führt nicht mehr zur Fehlklassifikation als Eisbrecher.
6. Eine lange Finanzierungslücke mit ausschließlich Basic Credits wechselt bei
   legalem Draw auf die Suche nach einer effizienteren Economy-Route. Kurze
   Lücken von ein bis zwei Credits werden weiter konkret geschlossen.
7. Ein negativ bewerteter spekulativer Central-Run darf eine positive
   side-safe Aufbauaktion nicht allein durch Plan-Mapping erzwingen. Bekannte
   Agenda-, Score-Threat- und Fresh-R&D-Signale bleiben geschützt.

## Integrierte Regression

Der matchnahe Test bildet die Kette Search -> Choice -> Installbewertung ->
Discard ab: Mit installiertem Krash und einer weiteren Krash-Kopie in der Grip
wählt Short Circuit Lockjaw und Clown, beide erhalten positiven
Installationsfit, und die redundante Krash-Kopie besitzt den geringeren
Keep-Wert.

## Verifikation

- Fokussierte Search-/Choice-/Discard-/Installtests: grün.
- Economy-, Planfortschreibungs- und Mappingtests: 102/102 grün.
- `@netgrid/ai` Typecheck: grün.
- AI-Gesamtsuite in drei deterministischen Shards: 284 Testdateien und 1.851
  Tests grün (`575 + 659 + 617`).
- `check:ai`, Proteus-AI-Readiness, Readiness-Inventory,
  Deck-Doctrine-/Strategy-Gate und Diff-Hygiene: grün.
- Der zunächst monolithisch gestartete AI-Testlauf erreichte das externe
  Zeitlimit; die drei vorgesehenen Shards deckten anschließend denselben
  Testbestand vollständig und erfolgreich ab.

## Vertragsgrenzen

- Keine Änderung an Engine-Regeln, LegalActions, PlayerView, Hidden-Info,
  Replay, StateHash oder Zufall.
- Keine kartennamensgebundene Runtime-Sonderregel; Kartennamen erscheinen nur
  in Hintdaten und Regressionsevidence.
- Kein Decktausch und keine Veränderung der Benutzerdeckdatei.
- Ein neuer Playtest oder Benchmark ist bewusst nicht Teil dieses Fixlaufs;
  die gespeicherte Baseline bleibt dadurch für einen späteren Vorher-/Nachher-
  Vergleich erhalten.

## Führende Artefakte

- `docs/architecture/ai/krash-short-circuit-runner-ai-fix-process-2026-07-11.md`
- `docs/reviews/ai/krash-short-circuit-manual-match-evidence-2026-07-11.md`
- `docs/reviews/ai/krash-short-circuit-runner-ai-fix-final-review-2026-07-11.md`
