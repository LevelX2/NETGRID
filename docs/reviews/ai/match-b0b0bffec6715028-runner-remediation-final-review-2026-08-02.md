# Match B0B0 – Runner-KI-Remediation Final Review

Stand: 2026-08-02

Match: `match_b0b0bffec6715028`

## Ergebnis

Die drei freigegebenen Runner-KI-Befunde sind spielgleich behoben. Der bereits
auf `main` vorhandene Fix für Punkt 2 war für D57 korrekt, aber als allgemeiner
Vertrag noch nicht ausreichend: Er zählte jede sichtbare Tagquelle als
Draw-Tax und besaß keine vollständig bezahlbare Fünf-Karten-Gegenprobe. Die
Härtung behält den vorhandenen Planowner und die D57-Entscheidung unverändert.

## Behobene Befunde

### 1. Lucidrine auf Archive in D9

`Lucidrine Booster Drug` wurde als allgemeines Bank-/Entwicklungswerkzeug
gespielt, obwohl alle neun temporären Run-Credits verfielen und anschließend
ein Core Damage entstand. `during_run`-Credits mit Ziel `run_credit_pool` sind
nun aus allgemeinen Bank- und Handentwicklungsrouten ausgeschlossen. Ein
Engine-bestätigtes Runner-Event mit konkretem Server wird stattdessen als
RunAction mit temporärem Budget und anschließendem Eigenschaden projiziert.

Der strikte D9-Checkpoint verbietet Lucidrine und wählt weiterhin
`runner.draw_card` unter der residenten Planinstanz
`runner.rig_and_coverage`, Capability `draw_for_answer_breaker_code_gate`.
Eine positive Gegenprobe belegt, dass ein real bezahlbarer Run den temporären
Pool weiterhin nutzen kann. Allgemeine Credits werden nach dem Run getrennt
berechnet; negative Funding-Gaps bleiben sichtbar.

### 2. City-Surveillance-Draw-Tax in D57

Die bestehende Main-Lösung wurde auf echte Ziehsteuern verengt. Eine Quelle
muss strukturiert sowohl `requires_runner_draw` als auch
`requires_runner_pay_or_take_tag` tragen. `Omniscience Foundation` ist damit
keine Draw-Tax-Quelle. Ein Fünf-Karten-Draw mit sieben Credits und zwei
Eventkosten bleibt vollständig zulässig.

D57 bleibt unverändert grün: `runner.draw_card` wird weiter durch
`runner.rig_and_coverage` und den Step
`draw_for_answer_breaker_sentry` ausgewählt.

### 3. Arasaka-Notfallkarte im D65-Discard

Der allgemeine Runner-Discard warf `Arasaka Owns You` trotz vier Tags und
bestätigtem Flatline-Risiko ab. Der bestehende Owner
`runner.defense_and_recovery` bindet nun die exakte aktuelle
`runner.resolve_choice`-LegalAction, Choice-ID, StateVersion und die vier
ausgewählten Optionen in `discard_window`.

Nur `confirmed` oder `critical` schützt eine über strukturierte Hints belegte
`flatline_prevention`; bei `none` und `suspected` bleibt die Karte normal
abwerfbar. Der Choice-Resolver übernimmt ausschließlich die gebundene Payload
und schlägt ohne exakten Executor geschlossen fehl. D65 behält Arasaka und
wirft beide `R&D Interface`, `Tycho Mem Chip` und `The Shell Traders` ab.

## Architektur- und Sicherheitsgrenzen

- Die Rules Engine bleibt alleinige Legalitätsautorität.
- Es werden nur bestehende, aktuelle `LegalActions` gerankt und gebunden.
- Run-, Entwicklungs-, Defense- und Choice-Ownership sind getrennt; es wurde
  kein paralleler Resolver- oder Override-Chooser ergänzt.
- Runner-eigene Handdaten werden nur im privilegierten Runner-Input verwendet;
  öffentliche Payloads und Gegner-Hidden-Info bleiben unberührt.
- Die lokale Matchdatenbank wurde ausschließlich read-only zum Capture der
  D9- und D65-Checkpoints gelesen. Server und Hauptinstanz wurden nicht neu
  gestartet oder verändert.

## Verifikation

- drei spielgleiche B0B0-Decision-Checkpoints: grün;
- fokussierte Punkt-1-Suite: 6 Dateien, 142 Tests;
- fokussierte Punkt-3-Suite: 6 Dateien, 295 Tests;
- vollständige AI-Shards: 559 Dateien, 4575 Tests, grün;
- AI-Typecheck mit 8-GB-Heap: grün;
- `check:ai`: Hint-Metadaten grün, 760 Produktionsdateien, 0 Runtime-/Type-
  Zyklen, 0 unerlaubte Generic-ID-Verstöße;
- Deck-Doctrine-Gate: 5 Profile, grün;
- Deck-Hint-Consumer-Audits für D9 und D65: jeweils 0 Blocker und 0 Warnungen;
- `git diff --check`: grün.

Der erste breite Shard-Lauf deckte eine vorübergehende Regression im
bestehenden Krash-HQ-Checkpoint auf: Ein negativer Funding-Gap wurde auf null
geklemmt. Die General-/Temporary-Credit-Rückrechnung bewahrt negative Defizite
nun wieder; der isolierte Krash-Test und der vollständige Wiederholungslauf
sind grün.

## Paketcommits

- `805f89a2d` – Prozess und Ausgangsevidence;
- `fd55fe6c9` – draw-spezifischer Quellenvertrag;
- `e59462ce5` – Run-only-Economy-Routing;
- `e9d9e4695` – planseitige Emergency-Discard-Bindung;
- `9c87e8f4a` – Final Review, Wissenspflege und breite Abschlusskorrektur.

Der Branch wurde bis `9c87e8f4a` per Fast-Forward lokal nach `main`
integriert. Die drei B0B0-Checkpoints und der AI-Typecheck sind auf `main`
erneut grün. Arbeitsworktree und gemergter Arbeitsbranch sind entfernt.

Es verbleibt kein fachlicher Restpunkt aus den drei freigegebenen Befunden.
