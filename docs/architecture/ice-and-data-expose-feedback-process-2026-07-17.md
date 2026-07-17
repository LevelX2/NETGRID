# Prozess: Expose-Transparenz für Ice and Data Special Report

## Status

Final im Worktree verifiziert auf `codex/ice-and-data-expose-feedback` nach
defensivem Abgleich mit `main`; die nachfolgende lokale Integration und der
Worktree-Cleanup sind Teil dieses Prozessabschlusses.

## Quelle/Vorgabe

Beim Spielen von `Ice and Data Special Report` muss sichtbar sein, welche
Karten und welches Data Fort exposed wurden:

- in der Chronik mit den tatsächlich exposed Karten und ihrem Fort;
- auf dem Spielfeld als farbiger Rahmen an den exposed Karten;
- der Rahmen bleibt mindestens zehn Sekunden sichtbar, unabhängig von Run- und
  Zugende;
- die lokale Komfortanzeige ist in den Optionen ein- und ausschaltbar.

## Zielprüfung

Der Endzustand ist hinreichend bestimmt. Der bestehende Engine-Expose-Effekt
ist öffentlich und der Viewer darf die exponierten Karten bereits sehen. Die
Umsetzung bleibt daher eine side-sichere Projektion und lokale Darstellung;
sie erweitert weder Regelautorität noch Spielzustand.

## Gesamtziel

Expose-Ergebnisse werden für berechtigte Viewer in der Chronik verständlich
und auf dem Board kurz eindeutig hervorgehoben. Die Darstellung ist lokal
konfigurierbar, läuft deterministisch aus Sicht des Clients ab und kann keine
vorher verdeckten Karten offenlegen.

## Annahmen

- Der farbige Rahmen ist standardmäßig aktiv und bleibt mindestens zehn
  Sekunden sichtbar.
- Run-Ende und ein Wechsel der `turnNumber` im PlayerView verkürzen die
  Mindestdauer nicht.
- Nur Expose-Ereignisse mit im jeweiligen PlayerView sichtbaren Karten dürfen
  einen Chronik- oder Board-Hinweis erzeugen.

## Nicht-Ziele

- Keine Änderungen an CardImplementation, Rules Engine, LegalActions,
  StateHash, Replay oder Serverpersistenz.
- Kein neues öffentliches Event ohne vorhandene Sichtbarkeitsprüfung.
- Keine dauerhafte Markierung und keine Änderung der Kartenbilder.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Der Client verarbeitet ausschließlich PlayerView- und öffentliche bzw.
  seitenspezifisch freigegebene Ereignisdaten.
- Verdeckte Karten, IDs und Fort-Kontexte gelangen weder über die Chronik noch
  über lokale Markierungen an nicht berechtigte Seiten.
- Der Timer beeinflusst ausschließlich lokalen UI-State.

## Automatische Fehlerbehandlung

- Fehlen bei einem Expose-Ereignis sichere Kartenreferenzen, bleibt der
  Board-Rahmen aus; die Chronik nutzt einen neutralen, sicheren Fallback.
- Ungültige oder alte lokale Optionswerte fallen auf „aktiv“ zurück.
- Mehrere Expose-Ereignisse ersetzen nicht versehentlich noch gültige
  Markierungen anderer Karten.

## Sicherheitsblocker

Stoppen und dokumentieren, falls die nötigen Expose-Karten nur aus Full
GameState, fremden privaten Payloads oder nicht redigierten Serverevents
ableitbar wären. Nach aktuellem Event-/Chronik-Audit wird dies nicht erwartet.

## State Machine

`idle` → sicheres Expose-Ereignis → `highlighted` → (mindestens 10 Sekunden;
weitere Expose-Ereignisse verlängern die Dauer, oder Option aus) → `idle`.

Neue sichere Expose-Ereignisse aktualisieren die Menge markierter Karten und
setzen deren lokale Ablaufzeit neu.

## Paketfolge

1. **EXP-01 – Prozess und sichere Expose-Projektion**
2. **EXP-02 – Chronik und Board-Highlight**
3. **EXP-03 – Option, Regressionen und Wissenspflege**

## Paketdetails

### EXP-01 – Prozess und sichere Expose-Projektion

- Ziel: Prozessvertrag festschreiben und den vorhandenen Eventdatenweg bis
  PlayerView, Chronik und Board nachvollziehen.
- Kernartefakte: diese Prozessseite, gezielte Tests bzw. Formatter-Helfer.
- Checks: fokussierte Webtests, `git diff --check`.
- Done-Gate: Keine neue Hidden-Info-Quelle; sichere Karten- und Fort-Bezüge
  sind anhand bestehender Eventdaten ableitbar.
- Commit: `docs: define expose feedback process`.

### EXP-02 – Chronik und Board-Highlight

- Ziel: Expose-Entry nennt Fort und Karten; sichtbare exposed Karten erhalten
  den zeitlich begrenzten Rahmen.
- Kernartefakte: Chronicle-Formatter, lokale Highlight-Ableitung, Board-CSS
  und fokussierte Tests.
- Checks: betroffene Vitest-Dateien, Web-Typecheck, `git diff --check`.
- Done-Gate: Die zwei sichtbaren Feedbackkanäle sind side-sicher, mehrfaches
  Expose ist stabil und der Rahmen endet fristgerecht.
- Commit: `feat(web): surface exposed cards and forts`.

### EXP-03 – Option, Regressionen und Wissenspflege

- Ziel: Komfortoption persistiert lokal; relevante Tests und Abschlusswissen
  dokumentieren das Ergebnis.
- Kernartefakte: Settings-Modell, Optionen-UI, Tests, Done-Activity,
  Monatslog und Final Review.
- Checks: fokussierte Tests, `corepack pnpm typecheck`, erforderliche
  Projektchecks, `git diff --check`.
- Done-Gate: Option steuert nur den lokalen Rahmen, alle Tests sind grün und
  die wiederverwendbare Erkenntnis ist dokumentiert.
- Commit: `feat(web): add exposed-card highlight preference`.

## Verifikationsregeln

- Kein Test darf unredigierte fremde private Daten als Fixture voraussetzen.
- Regressionen prüfen den vollständigen Chronicle-Text inklusive Fort und
  Karten, die Highlight-Erzeugung, die Mindestdauer über Run-/Turnwechsel
  hinweg und die aktivierte bzw. deaktivierte Option.
- Mindestens Web-Typecheck und die betroffenen Vitest-Dateien müssen grün sein.

## Worktree-, Git- und Integrationsregeln

- Ausschließlich im genannten Worktree auf dem genannten `codex/`-Branch
  arbeiten; der Hauptworkspace bleibt bis zum finalen Merge unverändert.
- Jedes abgeschlossene Paket einzeln prüfen und mit ausschließlich zugehörigen
  Dateien committen.
- Vor dem Merge aktuelles `main` defensiv integrieren, finale Checks auf dem
  Branch wiederholen, nach `main` mergen und dort prüfen.
- Erst danach den sauberen Worktree entfernen, Entfernung in Git und
  Dateisystem verifizieren und den gemergten Branch löschen.

## Controller-Prompt-Kern

Arbeite ausschließlich am aktuellen Paket. Nutze nur bereits für den Viewer
freigegebene Expose-Daten. Stoppe bei einem Hidden-Info-Risiko, dokumentiere
die Removal Condition und gehe nicht zum nächsten Paket über. Prüfe und
committe jedes Done-Gate, bevor das nächste Paket beginnt.

## Abschlusskriterien

- Chronik nennt die durch `Ice and Data Special Report` exposed Karten und
  ihren Data Fort, ohne verdeckte Informationen zu leaken.
- Der Board-Rahmen zeigt genau die berechtigt sichtbaren exposed Karten, bleibt
  unabhängig von Run- und Turnwechsel mindestens zehn Sekunden aktiv und ist
  standardmäßig eingeschaltet.
- Die Option deaktiviert den lokalen Rahmen ohne Chronik oder Spielregeln zu
  verändern.
- Alle Paketcommits sind lokal nach `main` integriert; Worktree und
  Arbeitsbranch sind nachweislich entfernt.

## Umsetzungsergebnis

- Der Expose-Resolver für ein einzelnes Data Fort projiziert nur die bereits
  public exposed `exposedCardInstanceIds` zusätzlich zu Titel und Position.
- Die Chronik nennt zu jeder exposed Karte die Fort-Position.
- Das Board hebt diese konkreten, im PlayerView sichtbaren Karten lokal grün
  hervor. Die Hervorhebung bleibt unabhängig von Run- und Turnwechsel
  mindestens zehn Sekunden sichtbar.
- Derselbe Cue-Vertrag gilt auch für die durch `Schematics Search Engine` beim
  HQ-Access ohne Einzelauswahl exposed installierten Korp-Karten. Der
  Access-Event führt dafür ausschließlich die bereits öffentlich exposed
  Karteninstanzen.
- `Exposed-Karten hervorheben` ist standardmäßig aktiv, lokal persistiert und
  beeinflusst weder Chronik noch Match-State.
- Details und Checks stehen im
  `docs/reviews/web/ice-and-data-expose-feedback-final-review-2026-07-17.md`.
