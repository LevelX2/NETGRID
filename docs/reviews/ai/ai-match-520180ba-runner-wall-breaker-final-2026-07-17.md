# Match 520180BA: Wall-Breaker-Selbstschaden-Finalreview

Status: fachlich abgeschlossen

## Entscheidung

Aus dem vollständigen Runner-Audit von `match_520180ba217781ad` ist ein
spielgleicher produktiver Fehler geschlossen: An D98 spielte der Runner eine
unvermeidbare Core-Damage-Ökonomieaktion, obwohl danach nur zwei Karten
verblieben und eine davon die einzige sichtbare Antwort auf einen aktuell
blockierenden Wall-Pfad war. Der zufällige Verlust dieser Breaker-Coverage lag
damit bei 50 Prozent.

Die Runtime schließt nun eine solche Aktion aus, wenn alle folgenden
Bedingungen zugleich gelten:

- Der Selbstschaden ist im LegalAction als unvermeidbar ausgewiesen.
- Der Runner würde zwar nicht flatlinen, aber genau eine sichtbare Handkarte
  deckt eine aktuell sichtbare blockierende Breaker-Anforderung ab.
- Die Damage-Menge kann mindestens die Hälfte der nach Aktionskosten
  verbleibenden Hand treffen.
- Die Aktion gewinnt nicht unmittelbar.

Der Schutz ist karten-, Match- und Instanznamenfrei. Er verwendet ausschließlich
die eigene sichtbare Hand, sichtbares rezzed ICE, LegalActions und bereits
vorhandene Breaker-Coverage-Projektion.

## LegalAction- und Input-Vertrag

Die Engine führt bei der betroffenen variablen Runner-Event-Action jetzt
`xValue`, `damageCannotBePrevented`, `damageType` und `damageAmount` bereits
vor der Ausführung. Der AI-Input-DTO übernimmt genau diese actor-sicheren
Kostenfelder und verwirft weiter unbekannte Payload-Daten. Damit wird weder
eine Corp-Hidden-Zone noch eine zukünftige Zufallsziehung für die KI sichtbar.

## Nicht übernommene Befunde

Die historischen Handlimit-/Funding-, Run-Lock- und wiederholten HQ-Run-Funde
stoppen bei Strict-Warmup D119: Die aktuelle KI pumpt dort, wo der historische
Trace eine Run-Fortsetzung enthält. D151, D168, D189, D200, D206 und D207 sind
deshalb nicht spielgleich erreichbar. Sie wurden nicht gerebased und erhielten
keine Produktionsänderung.

D118 bleibt ausdrücklich als Gegenprobe bestehen: Der erste HQ-Informationsrun
bleibt zulässig. Er ist kein unerwünschter Wiederholungsrun.

## Verifikation

| Gate | Ergebnis |
| --- | --- |
| Match-520180BA-Decision-Checkpoints | 2/2 grün |
| Selbstschaden- und DTO-Unit-Tests | 9/9 grün |
| Classic-Runner-Rest-Card-Smoke | 10/10 grün |
| Fokussierter Gesamtlauf | 21/21 grün |
| `@netgrid/ai` und `@netgrid/engine` Typecheck | grün |
| `git diff --check` | grün |

## Paketcommits

1. `47debf900` – `test(ai): capture match 5201 runner regressions`
2. `15ad90eea` – `test(ai): preserve initial HQ information run`
3. `3e495fbb9` – `fix(ai): preserve critical breaker coverage from self-damage`

Führender Prozess:
`docs/architecture/ai/match-520180ba-runner-remediation-process-2026-07-17.md`.
