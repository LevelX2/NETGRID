# Trace-Regelprofilvertrag

Status: aktueller NETGRID-Regelvertrag
Stand: 2026-08-28

## Geltungsbereich

NETGRID unterstützt genau drei beim Matchstart wählbare Trace-Regelprofile.
Das gewählte Profil ist Teil von `MatchSettings` und `GameState`, bleibt für
die gesamte Partie stabil und wird über Persistenz, Runtime-Neustart, Replay,
Simulation und AI-Decision-Checkpoints weitergereicht. UI- oder Client-State
ist keine Regelquelle.

`modern_open` bleibt der Default. Ein fehlendes Profil an der autoritativen
Version-0-Erzeugungs- oder Normalisierungsgrenze wird als `modern_open`
behandelt. Laufende Trace-Resolutionen raten kein Profil aus Events oder
Anzeigetexten.

Die Profile sind NETGRID-Regelprofile. Die beiden Classic-Varianten erweitern
die lokale Spielauswahl; sie ändern keine externen Originalquellen unter
`docs/source/`.

## Profile

### Modern Open (`modern_open`)

1. `Trace N` gibt der Corp die kostenlose Basisstärke N.
2. Die Corp wählt offen ein zahlbares Payment. N ist kein künstliches
   Payment-Limit.
3. Der Runner sieht die resultierende Corp-Stärke und wählt anschließend sein
   Link-Payment.
4. `corpStrength = N + corpPayment + ausdrückliche Strength-Modifier`.
5. `runnerStrength = currentLink + runnerPayment + postRevealLinkModifier`.
6. Der Trace ist nur bei `corpStrength > runnerStrength` erfolgreich.
   Gleichstand schützt den Runner.

### Classic Blind (`classic_blind`)

1. `Trace N` ist das normale Corp-Bid-Limit, keine kostenlose Basisstärke.
2. Die Corp committet ihr legales Gebot und die Payment-Quellen verdeckt.
3. Danach erklärt der Runner öffentlich, ob und welche genau eine installierte
   Base-Link-Karte er für diesen Trace verwendet. Die Corp kann ihr bereits
   gebundenes Gebot dadurch nicht mehr ändern.
4. Die Base-Link-Karte setzt den gedruckten Base Link und bezahlt ihre
   gedruckten Aktivierungskosten. Ohne verwendete Base-Link-Karte startet der
   Runner mit Base Link 0 zuzüglich ausdrücklich regelwirksamer statischer
   Modifier.
5. Der Runner committet anschließend verdeckt die Bits/Credits, die er über
   den gedruckten wiederholbaren Link-Modifikator der gewählten Base-Link-Karte
   ausgibt. Es gibt **keine** allgemeine Classic-Regel `1 Credit = +1 Link`.
   Eine Karte wie Baedeker's Net Map liefert wegen ihres Kartentextes
   `[1]: +1 link` genau dieses Verhältnis; Bakdoor liefert dagegen
   `[2]: +1 link`.
6. Nicht als Base Link verwendete Base-Link-Karten dürfen nicht teilweise als
   zusätzliche Link-Quelle benutzt werden. Andere ausdrücklich zulässige
   Link-Modifier bleiben nach ihrem eigenen Kartentiming nutzbar.
7. Nach dem Runner-Commit werden Corp-Ausgabe und Runner-Linkausgabe gemeinsam
   aufgedeckt. Danach laufen ausdrücklich als Post-Reveal definierte
   Link-/Trace-Fenster, etwa Signpost oder The Springboard.
8. `corpStrength = corpBid + ausdrückliche Strength-Modifier`.
9. `runnerStrength = baseLink + cardDerivedLinkModifier + weitere zulässige
Link-Modifier + postRevealLinkModifier`. `runnerBid` bezeichnet im
   Runtime-/Replayvertrag weiterhin die tatsächlich bezahlte verdeckte
   Runner-Ausgabe und ist im Classic-Profil **nicht** automatisch deren
   Linkzuwachs.
10. Der Trace ist nur bei `corpStrength > runnerStrength` erfolgreich.
    Gleichstand schützt den Runner.

### Classic Blind – Corp gewinnt Gleichstand

Technischer Bezeichner: `classic_blind_corp_ties`.

Lifecycle, Basisstärke, Limit, Base-Link-Erklärung und gedruckte
Link-Modifikatoren sind identisch zu Classic Blind. Nur der Vergleich ändert
sich: Der Trace ist bei `corpStrength >= runnerStrength` erfolgreich. Dieses
Tie-Verhalten entspricht dem ursprünglichen Netrunner-1996-Vergleich.

Eine Variante mit kostenloser Basis N **und** Blind-Bid bis N sowie ein
pauschales `+1` für die Corp existieren nicht.

## Gemeinsamer Lifecycle und Regelautorität

Alle Profile verwenden dieselbe Trace-State-Machine. Das Profil bestimmt
jedoch, wie der Runner-Link in ihrem Zahlungsfenster materialisiert wird:

```text
Trace start
→ Corp bid/payment
→ optional Base-Link-Erklärung des Runners
→ Runner payment / Classic: gedruckter Base-Link-Modifikator
→ gemeinsamer Reveal, wenn Blind
→ Post-Reveal-Link-/Trace-Fenster
→ finaler Strength-Vergleich
→ strukturierte Trace-Folge
```

Die Engine erzeugt die aktuelle `LegalAction` und die gebundenen Choices,
revalidiert StateVersion, Seite, Action-ID, Choice, Betrag und Quellen und ist
die einzige Autorität für Zahlung und Ergebnis. Karten starten oder
modifizieren den generischen Trace-Vertrag über strukturierte Semantik; es
gibt keine Karten-ID-Schalter und keine zweite Trace-State-Machine.

Der technische Profilvertrag führt deshalb die Achse `runnerLinkSpendMode`:

- `generic_credit_per_link` für Modern Open;
- `printed_card_modifiers` für beide Classic-Profile.

Damit bleiben Payment-Betrag und regelwirksamer Linkzuwachs im Classic-Profil
getrennte Größen.

## Trace Limit, Strength und Payment-Quellen

`printedTrace`, `effectiveTraceLimit`, `corpBidMax`, `corpBid`,
`corpStrength`, `runnerBid` und `runnerStrength` sind getrennte Größen.

- In Blind-Profilen deckelt das effektive Trace-Limit das normale Corp-Gebot.
- Ausdrücklich regelwirksame Trace-Counter können das effektive Limit und die
  zahlbare Kapazität erweitern.
- Rabbit reduziert bei ICE-Traces das effektive Limit. Diese Reduktion deckelt
  Classic-Bids, aber nicht das offene Modern-Payment.
- Variable und X-basierte Trace-Werte werden vor dem Bid als gedruckter und
  effektiver Wert im Trace-State gebunden.
- Spezialisierte Corp-Trace-, Fort-, Encounter- und temporäre Credits sowie
  Runner-Link-/Trace-Pools bleiben Engine-gequotete Payment-Quellen.
- Eine Quellen-Choice bestimmt nur, wie ein bereits gewähltes Gesamtgebot
  bezahlt wird. Temporäre oder wiederaufladbare Pools folgen ihrem
  strukturierten Lifecycle.
- Im Classic-Profil darf ein Runner-Payment nur Beträge anbieten, die ein
  legaler ganzzahliger Einsatz des gedruckten wiederholbaren Modifikators der
  verwendeten Base-Link-Karte tatsächlich kosten kann. Bei Bakdoor entstehen
  deshalb beispielsweise 0, 2, 4, ... Credits als Zahlbeträge und 0, 1, 2,
  ... als Linkzuwachs.

Signpost, The Springboard, Wired Switchboard und vergleichbare ausdrücklich
nach dem Aufdecken nutzbare Fähigkeiten laufen nach dem Reveal und vor dem
finalen Vergleich. Modern erreicht dasselbe Fenster nach dem sichtbaren
sequenziellen Payment; Blind erreicht es erst nach dem gemeinsamen Reveal.
Der wiederholbare Link-Modifikator einer im Classic-Profil gewählten
Base-Link-Karte wird dort nicht ein zweites Mal angeboten.

## Hidden Information, Events und Replay

Blind-Choices für die eigentlichen Corp- und Runner-Ausgaben tragen
`hidden_info_barrier`. Vor Reveal enthalten gegnerische PlayerViews und
PublicEvents weder Bid noch konkrete Payment-Quellen oder daraus ableitbare
Details. Die Auswahl der verwendeten Base-Link-Karte ist im ursprünglichen
Classic-Protokoll dagegen eine öffentliche Erklärung und wird deshalb nach
dem bereits erfolgten Corp-Commit nicht als gegnerisches Geheimnis behandelt.

Insbesondere wird ein durch den verdeckten Counter-Einsatz intern erhöhtes
Limit erst beim gemeinsamen Reveal sichtbar; vorher bleibt nur das vor dem
Commitment öffentliche Basislimit verfügbar. Das konkrete Blind-Payment wird
dabei nicht vorzeitig ausgeführt: Die Engine bindet das Gebot an ein
vollständiges transientes Payment-Quote im laufenden `TraceState`, lässt
Credits und sichtbare Counter bis zum gemeinsamen Reveal unverändert und
bietet der bereits committen Seite keine konkurrierende LegalAction an. Beim
Reveal werden Korp- und Runner-Quote zuerst fail-closed gegen den aktuellen
Zustand revalidiert und anschließend innerhalb desselben atomaren
Engine-Actions verbraucht. Erst dieses Reveal-Event veröffentlicht den
regelwirksamen Ressourcenverbrauch. Die eigene PlayerView darf den eigenen
Commit und dessen Quellen weiterhin anzeigen; die gegnerische Projektion
enthält weder Commit noch Quellen.

Nach Reveal dürfen die öffentlichen Ergebnisfelder beide Zahlungsbeträge und
finalen Stärken enthalten. Im Classic-Profil darf aus dem veröffentlichten
Runner-Zahlbetrag nicht erneut `+runnerBid` auf die bereits gebundene
Runner-Stärke gerechnet werden. Normale WebSocket-, Reconnect-, Chronik- und
Replay-Flächen verwenden dieselbe side-sichere Projektion.

Die private lokale Betreiber-/KI-Diagnostik bleibt von dieser Spielerfläche
getrennt. Sie darf rationale Range, Stakes, Bias, gewichtete Kandidaten,
Auswahl, Plan-Step und RNG-Nachweis zeigen, aber keine gegnerische Hidden Info
als KI-Input verwenden oder in Spielerkanäle spiegeln.

Jede tatsächliche AI-Bid-Varianz wird erst nach rationaler Kandidatenbildung
über den autoritativen Match-RNG gezogen. Der Engine-Command bindet Match,
StateVersion, Timing, Seite, dieselbe `resolve_choice`-Action, Choice,
Plan-Step, Profil und legale Optionen. Requote geschieht vor dem Draw;
`RandomDrawRecord`, privates Receipt und StateHash-Replay reproduzieren das
Ergebnis. `Math.random()`, Zeitstempel und UI-Randomisierung sind verboten.

Im `StateHash` ist das explizite Defaultprofil `modern_open` kanonisch
gleichbedeutend mit einem historisch fehlenden Feld. Nicht-defaultige Profile
und der Hidden-/Reveal-Zustand eines Blind-Traces bleiben ausdrücklich
hashwirksam. Damit verhalten sich alte lokale Modern-Snapshots wie Modern,
ohne die Replay-Identität der Blind-Varianten zu verwischen.

## KI-Ownership und Bewertung

Der auslösende Punish-, Defense-, Run- oder Scoreplan bleibt Owner. Die
Trace-Resolution darf weder einen anderen strategischen Plan wählen noch eine
globale Action-Chooser-Schicht bilden.

Die side-sichere Bewertung berücksichtigt strukturierte Trace-Folge,
sichtbaren Link, sichtbare Credit- und Zweckpools, effektives Limit, Tie-Regel,
Reserve und Low-/Normal-/High-/Terminal-Stakes. Für Runner-Choices werden
Zahlbetrag und erzeugter Linkzuwachs getrennt bewertet. Damit darf die KI im
Classic-Profil beispielsweise 4 Credits auf Bakdoor nicht als `+4 Link`
interpretieren; es sind zwei Aktivierungen und damit `+2 Link`.

Für `classic_blind_corp_ties` berücksichtigt auch die Corp-Bid-Bewertung, dass
sie keinen zusätzlichen Punkt oberhalb eines bereits ausreichenden
Gleichstands benötigt. Die vorhandene konservative Betrachtung sichtbarer
Runner-Ressourcen bleibt erhalten; das Profil ändert keine Hidden-Info-
Autorität.

Erst nach der rationalen Kandidatenbildung wird eine kleine
konsequenzabhängige Tendenz (`conservative`, `normal`, `aggressive` oder
`polarized`) auf wirtschaftlich plausible legale Kandidaten angewendet.
Terminale Entscheidungen besitzen eine enge Verteilung; ein polarisierter
Low-Stakes-Mix kann sowohl 0 als auch einen Randwert bevorzugen.

Die gegnerische Blind-Bid-Kapazität kommt aus einer Engine-projizierten
aggregierten Sichtquote. Sie addiert normale Credits und im aktuellen Trace
tatsächlich verwendbare, öffentlich erkennbare Trace-/Link-Pools; verdeckte
Ressourcen und die konkrete gegnerische Payment-Auswahl bleiben ausgeschlossen.
Das effektive Classic-Limit deckelt die sichtbare Korp-Kapazität, während
Modern weiterhin keinem künstlichen `Trace N`-Payment-Limit unterliegt. Die
private Decision-Diagnostik führt den verwendeten aggregierten Kapazitätswert
mit, ohne Quellenidentitäten der Gegenseite zu übernehmen.

Der Bias wird derzeit je Trace aus Stakes und Outcome-Wert bestimmt. Eine
kurzfristig persistierte Stimmung wird bewusst nicht als zusätzlicher
Match-/Personality-State eingeführt; die replaybare Kandidatenauswahl liefert
die gewünschte kleine Varianz ohne neue Metaarchitektur.

Im Modern-Profil reagiert der Runner auf die tatsächlich sichtbare
Corp-Stärke und entscheidet weiterhin wirtschaftlich, ob die Verhinderung den
Preis wert ist. Künstliche Blind-Varianz gibt es dort nicht.

## UI

Die erweiterte Spielanlage bietet eine Auswahl `Trace-Regel` mit verständlicher
Kurzbeschreibung aller drei Profile. Lobby, gespeicherte Matchsettings und
Accountpräferenz zeigen beziehungsweise halten denselben Wert. Default ist
`Modern`.

Während eines Blind-Bids zeigt die Spieler-UI den eigenen geheimen Commit und
einen neutralen gegnerischen Wartezustand. Die vorher erklärte Base-Link-Karte
ist davon ausgenommen. Nach Reveal zeigt die UI die offengelegten
Zahlungsbeträge, Modifier, finalen Stärken und das Ergebnis. Rationale
AI-Zielwerte und Gewichtungen bleiben privat.

## Technische Anker

- Profil- und Replaytypen: `packages/shared/src/index.ts`
- Profilregeln: `packages/engine/src/game/trace/trace-rules-profile.ts`
- Profiladapter/Lifecycle: `packages/engine/src/game/trace/trace-orchestration.ts`
- gemeinsamer Trace-Kern: `packages/engine/src/game/trace/trace-orchestration-core.ts`
- Base-Link-Quotes: `packages/engine/src/game/trace/base-link.ts`
- Gedruckte ICE-Traces: `packages/engine/src/game/run/encounter-printed-effects.ts`
- Payment: `packages/engine/src/game/payment/`
- PlayerView/PublicEvents: `packages/engine/src/game/view/`
- AI-Bewertung: `packages/ai/src/runtime/trace-bid-assessment.ts`
- Runner-Bid-Auflösung: `packages/ai/src/runtime/bid-choice-option.ts`
- Plan-first-Bindung: `packages/ai/src/runtime/plan-first-live-runtime.ts`
- RNG/Requote/Replay: `packages/engine/src/game/randomized-trace-bid-selection.ts`
- Match/UI: `apps/server/src/multiplayer.ts`, `apps/web/app/page.tsx`

Die fokussierten Regel-, Hidden-Info-, Payment-, Post-Reveal-, Ownership-,
Seed- und Szenariotests liegen bei diesen Modulen sowie unter
`packages/ai/src/simulation/trace-profile-scenario-comparison.test.ts`.
