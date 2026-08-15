# Trace-Regelprofilvertrag

Status: aktueller NETGRID-Regelvertrag
Stand: 2026-08-15

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
2. Corp und Runner committen ihre legalen Gebote und Payment-Quellen verdeckt
   und unabhängig.
3. Vor dem eigenen Commitment sieht keine Seite Gebot oder konkrete
   Payment-Quellen der Gegenseite.
4. Nach beiden Commitments werden die Gebote gemeinsam aufgedeckt.
5. Danach laufen strukturierte Post-Reveal-Link-/Trace-Fenster.
6. `corpStrength = corpBid + ausdrückliche Strength-Modifier`.
7. `runnerStrength = currentLink + runnerBid + postRevealLinkModifier`.
8. Der Trace ist nur bei `corpStrength > runnerStrength` erfolgreich.
   Gleichstand schützt den Runner.

### Classic Blind – Corp gewinnt Gleichstand

Technischer Bezeichner: `classic_blind_corp_ties`.

Lifecycle, Basisstärke, Limit und Hidden-Commit-Vertrag sind identisch zu
Classic Blind. Nur der Vergleich ändert sich: Der Trace ist bei
`corpStrength >= runnerStrength` erfolgreich.

Eine Variante mit kostenloser Basis N **und** Blind-Bid bis N sowie ein
pauschales `+1` für die Corp existieren nicht.

## Gemeinsamer Lifecycle und Regelautorität

Alle Profile verwenden dieselbe Trace-State-Machine:

```text
Trace start
→ Corp bid/payment
→ Runner bid/payment
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

## Trace Limit, Strength und Payment-Quellen

`printedTrace`, `effectiveTraceLimit`, `corpBidMax`, `corpBid` und
`corpStrength` sind getrennte Größen.

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

Signpost, The Springboard und vergleichbare Fähigkeiten laufen nach dem
Reveal und vor dem finalen Vergleich. Modern erreicht dasselbe Fenster nach
dem sichtbaren sequenziellen Payment; Blind erreicht es erst nach dem
gemeinsamen Reveal.

## Hidden Information, Events und Replay

Blind-Choices tragen `hidden_info_barrier`. Vor Reveal enthalten gegnerische
PlayerViews und PublicEvents weder Bid noch konkrete Payment-Quellen oder
daraus ableitbare Details. Insbesondere wird ein durch den verdeckten
Counter-Einsatz intern erhöhtes Limit erst beim gemeinsamen Reveal sichtbar;
vorher bleibt nur das vor dem Commitment öffentliche Basislimit verfügbar.
Nach Reveal dürfen die öffentlichen Ergebnisfelder beide Gebote und finalen
Stärken enthalten. Normale WebSocket-, Reconnect-, Chronik- und Replay-Flächen
verwenden dieselbe side-sichere Projektion.

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
Reserve und Low-/Normal-/High-/Terminal-Stakes. Erst danach wird eine kleine
konsequenzabhängige Tendenz (`conservative`, `normal`, `aggressive` oder
`polarized`) auf wirtschaftlich plausible legale Kandidaten angewendet.
Terminale Entscheidungen besitzen eine enge Verteilung; ein polarisierter
Low-Stakes-Mix kann sowohl 0 als auch einen Randwert bevorzugen.

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

Während eines Blind-Bids zeigt die Spieler-UI nur den eigenen Commit und einen
neutralen gegnerischen Wartezustand. Nach Reveal zeigt sie die offengelegten
Gebote, Modifier, finalen Stärken und das Ergebnis. Rationale AI-Zielwerte und
Gewichtungen bleiben privat.

## Technische Anker

- Profil- und Replaytypen: `packages/shared/src/index.ts`
- Profilregeln: `packages/engine/src/game/trace/trace-rules-profile.ts`
- Lifecycle: `packages/engine/src/game/trace/trace-orchestration.ts`
- Gedruckte ICE-Traces: `packages/engine/src/game/run/encounter-printed-effects.ts`
- Payment: `packages/engine/src/game/payment/`
- PlayerView/PublicEvents: `packages/engine/src/game/view/`
- AI-Bewertung: `packages/ai/src/runtime/trace-bid-assessment.ts`
- Plan-first-Bindung: `packages/ai/src/runtime/plan-first-live-runtime.ts`
- RNG/Requote/Replay: `packages/engine/src/game/randomized-trace-bid-selection.ts`
- Match/UI: `apps/server/src/multiplayer.ts`, `apps/web/app/page.tsx`

Die fokussierten Regel-, Hidden-Info-, Payment-, Post-Reveal-, Ownership-,
Seed- und Szenariotests liegen bei diesen Modulen sowie unter
`packages/ai/src/simulation/trace-profile-scenario-comparison.test.ts`.
