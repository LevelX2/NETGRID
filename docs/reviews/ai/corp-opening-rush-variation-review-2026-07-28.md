# Corp-Opening-Rush-Variation – Review

Stand: 2026-07-28

## Ergebnis

Die Opening-Rush-Varianz ist kein neuer Aktionsowner. Sie ist eine Admission
innerhalb von `corp.score_agenda` für eine bereits vorhandene, unsichere
P4-Agenda-Installationslinie.

Eine Gelegenheit ist nur qualifiziert, wenn:

- sie in einem der ersten drei Corp-Züge liegt (`turnSerial` 0, 2 oder 4);
- eine bekannte Agenda über genau eine aktuelle LegalAction in ein bereits
  existierendes Remote installiert werden kann;
- dieses Remote mindestens ein ICE besitzt;
- Installkosten, Klickkosten, vollständige Score-Reserve und die finanzierbare
  Rez-Auswahl exakt bekannt sind;
- die bestehende Score-Protection-Projektion bekannt ist und Credit- sowie
  Klickreserve erhält;
- die strikte Standardgrenze von 1/4 knapp verfehlt, die Opening-Grenze von
  1/2 aber nicht überschritten wird;
- die Restunsicherheit aus einer exakt modellierten öffentlichen
  Random-Breaker-Route stammt;
- kein öffentlicher, beiseite gesetzter Breaker über eine vorbereitete
  Delayed-Install-Route bereitliegt;
- kein bekannter akuter oder terminaler Central-Defense-Befund besteht.

Bereits sichere Scorelines werden nicht variiert. Wahrscheinlichkeiten über
1/2, unbekannte Schutz- oder Rezprojektionen, unzureichende Reserven, neue
Remotes ohne bestehendes Fort und öffentliche Shell-Traders-Breaker bleiben
fail-closed.

## Determinismus

Der Opportunity-Key besteht aus:

```text
opening-rush:<turnSerial>:<agendaInstanceId>:<targetServerId>
```

Aus Match-Seed und Opportunity-Key wird über einen lokalen, reinen FNV-1a-Hash
ein Bucket von 0 bis 99 erzeugt. Buckets unter 50 nehmen die Gelegenheit an,
die übrigen lehnen sie ab. Es wird weder `Math.random` noch der
Engine-`RandomCounter` verwendet.

Der Key enthält absichtlich weder `stateVersion` noch `actionNumber`. Eine
Economy-, ICE- oder sonstige State-Revalidierung innerhalb derselben
Gelegenheit führt daher nicht zu einer Neuverlosung.

## Kontrollierte Seeds

Für dieselbe qualifizierte Gelegenheit wurden 40 Seeds geprüft:

- 18 Annahmen;
- 22 Ablehnungen;
- gleiche Seeds ergeben bei Wiederholung identische Buckets;
- `opening-seed-0` nimmt mit Bucket 21 an;
- `opening-seed-1` lehnt mit Bucket 52 ab.

Im integrierten Runtime-Gegenfall konkurriert die angenommene Linie als
`corp.score_agenda` gegen Accounts Receivable. Bei Ablehnung bleibt
Accounts Receivable regulär bei `corp.economy`. Ein öffentliches Rent-I-Con in
der Set-aside-Zone blockiert die Rush-Admission auch für einen sonst
annehmenden Seed.

## Trace- und Replay-Grenze

Admission, Bucket, Quote und Blocker liegen ausschließlich im Corp-privaten
Plan-first-Debug der residenten Scoreinstanz. Es wurden keine neuen
PlayerView-, PublicEvent-, WebSocket- oder öffentlichen Replay-Felder
eingeführt.
