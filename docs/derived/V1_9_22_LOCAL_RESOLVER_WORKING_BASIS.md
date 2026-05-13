# V1.9.22 Local Resolver Working Basis

Stand: 2026-05-13
Status: Arbeitsgrundlage fuer den naechsten engen Implementierungsschnitt, keine Runtime-, Catalog- oder AI-Promotion

## Zweck

Dieses Artefakt ueberfuehrt lokal vorhandene, nicht versionierte Kontrollquellen aus dem Hauptworkspace in eine versionierte, umsetzbare Arbeitsgrundlage fuer V1.9.22. Es kopiert keine privaten Volltexte breit in die Release-Dokumentation, sondern dokumentiert daraus abgeleitete Resolververtraege mit Quellenverweisen, Gate-Status und Testanforderungen.

Maschinenlesbarer Begleiter: `data/rules/v1922-local-resolver-working-basis.json`.

## Quellenlage

Gepruefte private lokale Quellen im Hauptworkspace:

- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\card-snapshot-onr-v1-limited.local.json`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\agenda-text-review.local.md`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\agenda-implementation-review.local.md`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\onr-v1-open-card-review.local.md`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\text-review-galleries\gallery-02-confirmed-texts.local.md`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\text-review-galleries\gallery-03-confirmed-texts.local.md`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\text-review-galleries\gallery-11-13-confirmed-texts.local.md`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\text-review-galleries\gallery-20-22-confirmed-texts.local.md`
- `C:\Projekte\NETGRID\data\local\card-import\onr-v1-limited\text-review-galleries\confirmed-texts-normalized-mechanics.local.md`

Die private lokale Quelle bleibt bewusst nicht versioniert. Dieses Artefakt ist die erlaubte schmale Bruecke: Es macht nur die fuer Engine-/Testarbeit noetigen Fakten und Entscheidungen versioniert sichtbar.

## Ergebnis

- `Corporate War` ist der erste enge V1.9.22-Kandidat mit vollstaendig genug bestaetigtem lokalen Resolververtrag fuer einen Implementierungsschnitt.
- `Political Overthrow` ist nach Nutzerbestaetigung vom 2026-05-13 als zweiter enger Kandidat verwertbar; der lokale Wertkonflikt ist auf `Gain 3` entschieden.
- `Anonymous Tip`, `Core Command: Jettison Ice` und `Forged Activation Orders` haben lokale Kosten- und Textbasis, brauchen aber vor Implementierung je einen Ziel-/Choice-/Timing-Vertrag.
- `Arasaka Portable Prototype` und `Pandora's Deck` haben lokale Kosten- und Textbasis, sind aber wegen Deck-Einzigartigkeit, MU, wiederkehrenden eingeschraenkten Bits und Spezialkosten groesser als der erste enge Schnitt.
- Keine Karte wird durch dieses Artefakt `human_playable`, `deck_legal` oder `ai_supported`.

## Implementierungsreifer Kandidat

### Corporate War

Karte: `onr_v1_196_corporate-war`

Lokale Bestaetigung:

- Seite/Typ/Subtyp: Corp Agenda, Black Ops.
- Advancement Requirement / Agenda Points: 3 / 3.
- Ausloeser: beim Scoren durch die Corp.
- Bedingung: aktueller Corp-Creditpool im Score-Fenster ist mindestens 12.
- Effekt bei erfuellter Bedingung: Corp gewinnt 12 Credits.
- Effekt bei nicht erfuellter Bedingung: Corp verliert alle Credits.
- Zielauswahl: keine.
- Choice-Flow: keine Spielerentscheidung.
- Zonebewegung: nur die normale Agenda-Score-Bewegung; der Karteneffekt bewegt keine weiteren Karten.
- Visibility: oeffentlicher Score- und Credit-Delta-Pfad; keine verdeckten Kartenidentitaeten im PublicEvent.
- Replay/StateHash: deterministisch, weil keine Zufallsquelle und keine verdeckte Entscheidung.
- AI-Fallback: bestehende Score-Entscheidung darf legal bleiben; ohne spezielle Wertung kann die KI den Score-Pfad wie normale scorebare Agenden behandeln.

Quellenanker:

- `gallery-03-confirmed-texts.local.md`, Abschnitt `196 - Corporate War`, lokale Werte und Text.
- `gallery-11-13-confirmed-texts.local.md`, Abschnitt `196 - Corporate War`, zweite bestaetigende lokale Erfassung.
- `agenda-text-review.local.md`, Zeile zu `196 | Corporate War`.
- `onr-v1-open-card-review.local.md`, Zeile zu `Corporate War`, Status `manual-reviewed`.

### Handoff an `release-implementation-agent`

Der naechste engste Code-Schnitt darf diesen Vertrag umsetzen:

1. Runtime-/Catalog-Promotion fuer `Corporate War` erst nach Engine- und Gate-Abdeckung.
2. Engine: On-score-Resolver fuer `onr_v1_196_corporate-war`.
3. LegalAction/applyAction: normale Agenda-Score-Revalidation bleibt fuehrend; der Effekt haengt nur am erfolgreichen Score.
4. Tests:
   - Score mit mindestens 12 Corp-Credits fuehrt zu +12 Credits.
   - Score mit weniger als 12 Corp-Credits setzt Corp-Credits auf 0.
   - Steal durch Runner loest keinen Corporate-War-Corp-Score-Effekt aus.
   - PublicEvents/PlayerViews leaken keine verdeckten HQ/R&D/Archives-Identitaeten.
   - Replay/StateHash bleibt stabil.
   - Stale-/Wrong-Side-Schutz bleibt ueber den bestehenden Score-Pfad erhalten oder wird explizit nachgewiesen.
5. Manifest, Mechanics-Coverage, AI-Hints/Smokes und Webclient-Version bleiben bis zur verifizierten Promotion geschlossen.

### Political Overthrow

Karte: `onr_v1_210_political-overthrow`

Lokale Bestaetigung:

- Seite/Typ/Subtyp: Corp Agenda, Black Ops.
- Advancement Requirement / Agenda Points: 9 / 6.
- Ausloeser: aktive Faehigkeit einer bereits von der Corp gescorten Agenda.
- Kosten: 1 Corp-Aktion.
- Effekt: Corp gewinnt 3 Credits.
- Zielauswahl: keine.
- Choice-Flow: keine weitere Spielerentscheidung nach Auswahl der Faehigkeit.
- Zonebewegung: keine.
- Visibility: oeffentlicher Action- und Credit-Delta-Pfad; keine verdeckten Kartenidentitaeten im PublicEvent.
- Replay/StateHash: deterministisch, weil keine Zufallsquelle und keine verdeckte Entscheidung.
- AI-Fallback: Score-Area-Agenda-Faehigkeit nur nutzen, wenn die Aktion legal ist; ohne Spezialbewertung kann die KI sie als einfache Economy-Aktion behandeln.

Konfliktentscheidung:

- `gallery-03-confirmed-texts.local.md` fuehrte die aktive Gain-Faehigkeit mit Wert 3.
- `gallery-11-13-confirmed-texts.local.md` markierte einen abweichenden Wert 2 als Konflikt.
- Nutzerbestaetigung vom 2026-05-13 entscheidet den Wert verbindlich auf 3.

### Handoff an `release-implementation-agent`

Dieser Vertrag ist nach `Corporate War` als zweiter enger Schnitt geeignet:

1. Engine: LegalAction fuer aktive scored-agenda Ability von `onr_v1_210_political-overthrow`, nur fuer die Corp und nur wenn die Agenda in der Corp-Score-Area liegt.
2. applyAction: Seite, actionId, stateVersion, Score-Area-Quelle, verfuegbare Aktion und Kosten erneut validieren.
3. Tests:
   - Gescorte Political Overthrow oeffnet eine Corp-Economy-Aktion.
   - Nutzung kostet 1 Aktion und gibt 3 Credits.
   - Runner-Steal oeffnet keine Corp-Faehigkeit.
   - Wrong-Side und stale State werden abgelehnt.
   - PublicEvents/PlayerViews bleiben side-sicher.
   - Replay/StateHash bleibt stabil.
4. AI-Hints/Smokes und Promotion erst nach Engine-/Catalog-Gate.

## Gepruefte, aber noch nicht freigegebene Kandidaten

| Karte | Lokale Lage | Warum noch kein enger Implementierungsschnitt |
| --- | --- | --- |
| `onr_v1_077_anonymous-tip` | Lokale Kosten- und Textbasis liegt vor. | Zielvertrag fuer `black ice`, Derez-Timing und erlaubte Zielmenge muss gegen vorhandene ICE-Taxonomie geprueft werden. |
| `onr_v1_080_core-command-jettison-ice` | Lokale Kosten- und Textbasis liegt vor. | Erfolgreicher-HQ-Run-Tracking, Rezzed-ICE-Zielmenge und Rez-Kosten-Zahlung brauchen einen eigenen Vertrag. |
| `onr_v1_086_forged-activation-orders` | Lokale Kosten- und Textbasis liegt vor. | Opponent-Choice-Flow Corp rezzen oder trashen plus Rez-Kosten-/Zielrevalidierung braucht einen eigenen Vertrag. |
| `onr_v1_119_arasaka-portable-prototype` | Lokale Kosten-, MU-, Agenda-Punkt-Zusatzkosten- und Recurring-Bits-Basis liegt vor. | Groesserer Hardware-Schnitt: Deck-Einzigartigkeit, Agenda-Punkt-Installkosten, eingeschraenkte wiederkehrende Bits und Refresh. |
| `onr_v1_136_pandoras-deck` | Lokale Kosten-, MU- und Recurring-Link-Bits-Basis liegt vor. | Groesserer Hardware-Schnitt: Deck-Einzigartigkeit, Link-Zahlungsfenster, eingeschraenkte wiederkehrende Bits und Refresh. |

## Gate-Entscheidung

Der bisherige harte Befund "kein vollstaendiger lokaler Resolververtrag fuer mindestens einen Zielpfad" ist fuer die engen `Corporate War`- und `Political Overthrow`-Schnitte aufgehoben. V1.9.22 bleibt trotzdem offen, weil noch keine Engine-Implementierung, keine Runtime-/Catalog-/AI-Promotion, kein Webclient-Versionshub und kein Final Review erfolgt sind.

Naechster sinnvoller Schritt: zuerst `Corporate War`, danach `Political Overthrow` als isolierte V1.9.22-Resolver-WIPs implementieren und erst danach ueber die normalen Gates promoten.
