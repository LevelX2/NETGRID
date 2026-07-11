# AI Seeds 14/15 Closeout Evidence

## Gegenstand

Zugweise Diagnose zweier deterministischer Selfplay-Partien des Runner-Decks `Krash-Clown` gegen `Fast Advance, Baby`:

| Seed | Aktionen | Endstand | StateHash | Replay |
| --- | ---: | --- | --- | --- |
| 14 | 480 | Runner 5 / Corp 4 | `fnv1a:c1700fd0` | OK |
| 15 | 480 | Runner 4 / Corp 6 | `fnv1a:f916ad3f` | OK |

Der Kontrolllauf mit vollständigen legalen Alternativen reproduzierte beide StateHashes und Endstände exakt. Es gab keine illegale Aktion, keinen Replay- oder Redaktionsfehler. Aktionsanker verwenden den nullbasierten `actionIndex`.

Lokale Roh-Evidence:

- `data/local/krash-clown-backup-post-ai-fix-v2-20x2x480-2026-07-11-raw.json`
- `data/local/krash-clown-post-fix-fast-s14-15-detailed-alternatives-raw.json`
- `data/local/krash-clown-fast-seeds-14-15-turn-extract.md`

Diese großen Rohdaten bleiben absichtlich unversioniert. Dieser Report enthält nur side-safe PlayerView-, LegalAction- und DecisionDebug-Fakten.

## Fehlervertrag 1: Erledigte Runner-Suche bleibt aktiv

### Evidence

- In der späten Phase beider Seeds bleibt `strategic_intent_state:runner.search.breaker` aktiv.
- Gleichzeitig meldet der Debug-Kontext `strategic_intent_blocker_count:0`, `strategic_intent_completeness:complete` und `strategic_intent_phase:pressure`.
- Seed 15: Der Runner erreicht in Halbzug 4 vier Agenda-Punkte, erzielt nach Halbzug 12 aber keinen weiteren Steal oder Trash. Der Suchzustand bleibt bis A475 aktiv.

### Erwarteter Vertrag

- Vollständige geforderte Coverage und leere Blockerliste beenden einen Setup-/Search-Intent.
- Eine echte sichtbare Coverage-Lücke hält Search aktiv.
- Matchpoint verstärkt den Wechsel in Pressure/Closeout, erzeugt aber keinen Zugriff auf gegnerische Hidden Information.

### Regressionen

1. Vollständige Coverage + null Blocker: `runner.search.breaker` wird nicht fortgeführt.
2. Fehlende relevante Breaker-Coverage: Search bleibt aktiv.
3. Vollständige Coverage bei Corp 6 AP: Pressure-/Closeout-Kandidat gewinnt.

## Fehlervertrag 2: Run-Finanzierung ist nicht an das Folgeziel gebunden

### Evidence

- Seed 15 A421: 16 Runner-Credits, Plan `runner.opportunistic_central_run`, gewählte Aktion `gain_credit`, Rohwert `-1121`.
- Sichtbare Alternativen: Archives-Run `1359`, Krash mit Programmtrash `959`, Cloak mit Programmtrash `464`, Draw `373`.
- A422 wählt unmittelbar danach den kostenlosen Archives-Run. Der zusätzliche Credit hat diesen Run nicht ermöglicht.
- Seed 14 A153, A212 und A243 zeigen dieselbe negative Funding-Auswahl; dort folgt jedoch ein teurer Zentral-Run, weshalb diese Anker nur die generische Schwäche, nicht jeweils einen sicheren Einzelfehler belegen.

### Erwarteter Vertrag

- Ein vorbereitender Credit-Klick benötigt ein konkretes, weiterhin gebundenes Run-Ziel und eine positive Finanzierungslücke.
- Ist das gebundene Ziel bereits bezahlbar oder wechselt der Plan auf einen kostenlosen Run, wird neu geplant.
- Ein Credit-Klick bleibt zulässig, wenn er einen sonst nicht bezahlbaren Ziel-Run tatsächlich ermöglicht.

### Regressionen

1. Bereits bezahlbarer bzw. kostenloser Ziel-Run: kein Funding-Klick.
2. Konkreter teurer Zentral-Run mit exakt einem fehlenden Credit: Funding-Klick bleibt zulässig.
3. Zielwechsel nach Funding-Plan: alter Funding-Schritt wird nicht blind fortgeführt.

## Fehlervertrag 3: Corp-Score-Window bindet die falsche Installationsvariante

### Evidence

- Seed 14 A343: `corp.install_card.remote_1`, Rohwert `-3786`, Qualitätsmarker `remote_overbuild`; positive Economy- und Installationsalternativen werden als planfremd verdrängt.
- Seed 15 A415: Data Wall 2.0 vor Remote 1, Rohwert `-636`, Marker `agenda_flood_exposure` und `remote_overbuild`; dieselbe Karte vor R&D hat Rohwert `4193`.
- Seed 15 A427: Quandary vor Remote 1, Rohwert `-6071`, dieselben Marker; dieselbe Karte vor R&D hat Rohwert `4193`.
- Die Corp steht in beiden Seed-15-Ankern bei 6 AP. A415 beginnt mit 13 Credits und fällt durch die Installation auf 6; A427 beginnt mit 8 und fällt auf 0.

### Erwarteter Vertrag

- `corp.create_score_window` bindet nicht nur `install_card`, sondern prüft Kartenrolle, Serverziel und Scoreline-Beitrag.
- Eine negative, durch `remote_overbuild` oder Board-Triage beanstandete Zielvariante darf eine deutlich positive Variante derselben Karte nicht allein durch Plan-Mapping verdrängen.
- Eine tatsächlich sinnvolle Agenda-/Upgrade-Installation in ein vorbereitetes Scoring-Remote bleibt zulässig.

### Regressionen

1. Identisches ICE: überbautes Remote verliert gegen positiven Zentral-Schutz.
2. Negative plan-gemappte Installation verliert gegen eine positive legale Zielvariante.
3. Agenda-/Scoreline-Karte in vorbereitetes Remote bleibt plan-kompatibel.

## Fehlervertrag 4: Credit-Sammeln verlängert Score-Window ohne Fortschritt

### Evidence

- Seed 15 erreicht in Halbzug 37 sechs AP und erzielt danach keinen Agenda-Fortschritt.
- A393/A395 wählen bei 7 bis 9 Credits jeweils `gain_credit` mit Rohwert `119`; legale ICE-Installationen liegen bei `1929` bzw. `4463`.
- A404/A406 wiederholen die Wahl bei 10 bis 12 Credits gegenüber R&D-ICE mit Rohwert `4193`.
- Nach den Fehlinstallationen A415 und A427 sammelt die Corp erneut Credits. A468 bis A470 verdrängen bei `agenda_flood_exposure` eine R&D-ICE-Alternative mit Rohwert `3943` durch den Plan.
- Der Intent-Reserve-Debug meldet die Credit-Reserve wiederholt als erfüllt, der Planstatus bleibt dennoch `progressing`. Agenda-Installationen erhalten zugleich `Scoreline-Funding fehlt`.

### Erwarteter Vertrag

- Planfortschritt wird über Reserve-Lücke, Agenda in Scoring-Position, vorhandene Advancement-/Fast-Advance-Schritte und tatsächliche Zustandsänderung gemessen.
- Credit-Klicks oberhalb einer erfüllten Reserve verlängern den Plan nicht unbegrenzt.
- Unterhalb einer echten, sichtbaren Finanzierungsschwelle bleibt Ansparen zulässig.
- Bei 6 AP, Agenda-Flood und fehlendem Fortschritt wird neu geplant; die Logik verwendet nur eigene Hand-/Boarddaten und öffentliche Scoreline.

### Regressionen

1. Reserve nicht erreicht: Credit-Funding bleibt Fortschritt.
2. Reserve erreicht, keine Scoreline-Zustandsänderung: wiederholtes Funding gilt als Stagnation.
3. 6 AP + eigene Agenda-Flood + stagnierter Plan: Closeout-Neuplanung.

## Ausgeschlossene Beobachtungen

- Archives-Runs nach neuen Discards werden nicht pauschal bestraft.
- Negative `continue_run`-Anzeigescores ohne bessere legale Abbruchaktion werden nicht verändert.
- MU 0 in Seed 15 begründet ohne bessere LegalAction keine eigene Anpassung.
- Seed 14 A389 ist trotz nackter Installation korrekt, weil die Agenda im selben Halbzug per Fast Advance gescored wird.

## Sicherheits- und Abnahmegrenze

- Keine Hidden-Info-Fakten aus späteren Steals oder Scores fließen rückwirkend in Entscheidungen ein.
- Alle neuen Regeln arbeiten ausschließlich auf bestehenden side-safe Runtime-Fakten und `LegalActions`.
- Falls ein benötigtes Zielkosten- oder Fortschrittssignal nicht side-safe vorhanden ist, wird es nicht aus `GameState` ergänzt; dann ist eine saubere Schnittstellenerweiterung separat zu entscheiden.
