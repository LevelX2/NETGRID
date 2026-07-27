# EFA215: Remote-Defense bei sichtbaren Breaker-Credit-Pools – Final Review

Status: **abgeschlossen; lokal auf `main` integriert**

Stand: 2026-07-27

Arbeitscommits: `da5089d35`, `2669c393e`, `b40162d51`, `e417a4d88`

## Reviewurteil

Die Corp-KI bewertet zusätzliche ICE wieder über die bestehende
`corp.defend_servers`-/Score-Protection-Kette, wenn der Runner sichtbare
wiederkehrende Credits besitzt. Es wurde kein paralleles ICE-Bewertungs- oder
Remote-Planungssystem eingeführt.

Die zentrale Ursache im EFA215-Fall war ein zu grober Unknown-Ausgang für
sichtbare, beschränkte Breaker-Credit-Pools. Dadurch wurde eine ansonsten
vollständig gequotete zusätzliche ICE-Route nicht als konkrete
Score-Protection bewertet.

## Fachlicher Endvertrag

- `corp-score-protection-assessment` verwendet nun das bereits vorhandene
  sichtbare Run-Credit-Budget. Es prüft für jeden Breaker, welche Credit-Pools
  dieser tatsächlich verwenden darf, und verbraucht sie über aufeinander
  folgende ICE hinweg.
- Passende nicht-laute Breaker-Credits unterstützen einen kompatiblen
  Icebreaker. Killer-only-Credits finanzieren keinen Decoder; ein einzelner
  wiederkehrender Credit reicht nicht fälschlich für zwei ICE. Sichtbare
  beschränkte Credits ohne sichtbaren Icebreaker bleiben fail-closed.
- Eine Route ist nicht nur bei geringerer Zugangswahrscheinlichkeit
  produktiv, sondern auch dann, wenn sie auf dem besten Zugangspfad die
  verbleibenden allgemeinen Runner-Credits senkt. Bei gleicher
  Zugangswahrscheinlichkeit bevorzugt die Auswahl die höhere konkrete
  Credit-Tax.
- Ein bereits vorhandenes, leeres Remote darf als wiederverwendbarer
  Scoring-Remote vorbereitet und mit exakt gequotetem ICE verstärkt werden.
  Eine installierte Agenda ist dafür keine Voraussetzung. Die Installation
  verlangt weiterhin einen nachweisbaren Zugangs- oder Credit-Tax-Gewinn und
  verliert gegen eine vorhandene residente Score-Linie.
- Das Erzeugen eines völlig neuen Remotes bleibt beim bestehenden
  Score-Plan; die generische Defense-Autorität erfindet kein ungebundenes
  Remote-Ziel. Ein reiner Zukunfts-Remote verdrängt umgekehrt keinen bereits
  residenten Score-Schutz.

## EFA215- und Gegenprobevidence

Der spielgleiche Checkpoint
`cp-efa215-01-protect-project-babylon-with-visible-breaker-credit.json`
wählt mit sichtbarem Invisibility-/wiederkehrenden-Credit-Kontext legal
`Sleeper` für `remote_1`. Der Deck-Hint-Consumer-Audit meldet dafür `status:
ok`, `0` Blocking Findings und `0` Warnings.

Die Gegenproben decken ab:

- passender und unpassender Breaker-Credit-Pool;
- Credit-Verbrauch über mehrere ICE;
- sichtbarer Pool ohne sichtbaren Icebreaker (fail-closed);
- dringliche Archives-Agenda-Defense;
- bestehende Rent-I-Con-Score- und Funding-Linien;
- ein vorhandenes leeres, wiederverwendbares Remote ohne Agenda.

Die frühere ICE-Installation vor Archives war kein Zufall: Sie gehörte zu
einem inzwischen separat verhinderten HQ-Überlauf-/Handkarten-Entsorgungspfad
und ist nicht Bestandteil dieser Änderung.

## Verifikation

| Prüfung | Ergebnis |
| --- | --- |
| Fokussierte Defense-, EFA215-, Rent-I-Con- und Runtime-Tests | grün, 234/234 |
| Leeres wiederverwendbares Remote | grün, 1/1 |
| `@netgrid/ai typecheck` | grün |
| Deck-Hint-Consumer-Audit mit EFA215-Checkpoint | grün, 0 Blocker, 0 Warnings |
| `git diff --check` | grün |
| Vollständige `@netgrid/ai test`-Suite | 31 bekannte Fehler, identisch zur vorab erhobenen `main`-Baseline; keine neue Regression |

Die 31 Volltestfehler liegen außerhalb dieses Pakets (unter anderem bestehende
Runner-Plan-, Known-ICE- und Simulationsfälle). Sie bleiben sichtbar und
werden nicht als grüne Gate-Evidence ausgegeben.

## Grenzen

Alle Entscheidungen bleiben an die aktuelle PlayerView, vorhandene
LegalActions und Engine-Quotes gebunden. Unbekannte Karten, unvollständige
Quotes, nicht zuordenbare Kosten oder nicht sicher nutzbare Credit-Pools
erzeugen keine produktive Defense-Route.
