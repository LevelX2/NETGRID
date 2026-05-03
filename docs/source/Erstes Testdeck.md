# Erste feste Demo-Decks für Netrunner MVP 0.1

Stand: 2026-05-03T06:48:51.659016+00:00

Diese Decks sind interne Demo- und Testdecks. Sie sind nicht turnierlegal und verwenden fiktive Kartenbezeichnungen bzw. vereinfachte Kartentexte. Zweck ist der kontrollierte Aufbau von Engine, UI, KI und Tests.

## Runner Demo Deck 01 – Run & Steal

Ausrichtung: Criminal-orientiert, Credits aufbauen, Runs durchführen, ICE mit Breakern überwinden, Agendas stehlen.

| Karte | Anzahl | Typ | Zweck |
|---|---:|---|---|
| Runner Identity | 1 | Identity | Startidentität ohne aktive Sonderfähigkeit |
| Simple Economy Event | 3 | Event | Sofortige Credits |
| Simple Run Event | 3 | Event | Einfacher Run mit kleinem Bonus |
| Simple Fracter | 2 | Program: Icebreaker – Fracter | Bricht Barrier-Subroutinen |
| Simple Decoder | 2 | Program: Icebreaker – Decoder | Bricht Code-Gate-Subroutinen |
| Simple Killer | 2 | Program: Icebreaker – Killer | Bricht Sentry-Subroutinen |

### Kartendefinitionen

**Runner Identity**
Typ: Runner Identity
Fähigkeit: deaktiviert
Implementierungsstatus: sichtbar, aber ohne aktive Ability.

**Simple Economy Event**
Typ: Event
Kosten: 0 Credits
Text: „Erhalte 4 Credits.“
Rolle: Economy.

**Simple Run Event**
Typ: Event
Kosten: 0 Credits
Text: „Mache einen Run auf einen Server deiner Wahl. Wenn der Run erfolgreich ist, erhältst du 2 Credits.“
Rolle: Run-Event.

**Simple Fracter**
Typ: Program – Icebreaker – Fracter
Installationskosten: 2 Credits
Memory: 1 MU
Stärke: 2
Fähigkeiten: „1 Credit: +1 Stärke.“ / „1 Credit: Brich 1 Barrier-Subroutine.“

**Simple Decoder**
Typ: Program – Icebreaker – Decoder
Installationskosten: 3 Credits
Memory: 1 MU
Stärke: 2
Fähigkeiten: „1 Credit: +1 Stärke.“ / „1 Credit: Brich 1 Code-Gate-Subroutine.“

**Simple Killer**
Typ: Program – Icebreaker – Killer
Installationskosten: 3 Credits
Memory: 1 MU
Stärke: 1
Fähigkeiten: „1 Credit: +1 Stärke.“ / „1 Credit: Brich 1 Sentry-Subroutine.“

## Corp Demo Deck 01 – Build & Score

Ausrichtung: Weyland-orientiert, ICE installieren und rezzen, Remote-Server bauen, Agendas installieren, advancen und scoren.

| Karte | Anzahl | Typ | Zweck |
|---|---:|---|---|
| Corp Identity | 1 | Identity | Startidentität ohne aktive Sonderfähigkeit |
| Simple Agenda | 3 | Agenda | Installieren, advancen, scoren oder stehlen |
| Simple Economy Operation | 3 | Operation | Sofortige Credits |
| Simple Economy Asset | 3 | Asset | Remote-Installation, Rez, Trash-Kosten |
| Simple Barrier ICE | 3 | ICE – Barrier | Einfacher Stopper |
| Simple Code Gate ICE | 3 | ICE – Code Gate | Kleiner Tax-Effekt plus End-the-run |
| Simple Sentry ICE | 3 | ICE – Sentry | Einfache Strafwirkung ohne Damage/Tags |

### Kartendefinitionen

**Corp Identity**
Typ: Corp Identity
Fähigkeit: deaktiviert
Implementierungsstatus: sichtbar, aber ohne aktive Ability.

**Simple Agenda**
Typ: Agenda
Advancement Requirement: 3
Agenda Points: 2
Text: keine zusätzliche Fähigkeit.

**Simple Economy Operation**
Typ: Operation
Kosten: 0 Credits
Text: „Erhalte 4 Credits.“

**Simple Economy Asset**
Typ: Asset
Rez-Kosten: 1 Credit
Trash-Kosten: 3 Credits
Text: „Wenn diese Karte gerezzt wird, erhält die Corp 3 Credits.“

**Simple Barrier ICE**
Typ: ICE – Barrier
Rez-Kosten: 3 Credits
Stärke: 3
Subroutinen: „End the run.“

**Simple Code Gate ICE**
Typ: ICE – Code Gate
Rez-Kosten: 2 Credits
Stärke: 2
Subroutinen: „Die Corp erhält 1 Credit.“ / „End the run.“

**Simple Sentry ICE**
Typ: ICE – Sentry
Rez-Kosten: 4 Credits
Stärke: 3
Subroutinen: „Der Runner verliert 2 Credits, falls möglich.“ / „End the run.“

## Bewusste Vereinfachungen

Keine Tags, Traces, Viren, Damage-Effekte, Hosted Cards, Multiaccess, Bypass, Replacement-Effekte oder komplexe Paid-Ability-Fenster. Identitätsfähigkeiten bleiben deaktiviert. Jede Karte deckt eine isolierte Mechanik ab, damit Fehler in Engine, UI oder KI leicht reproduzierbar bleiben.
