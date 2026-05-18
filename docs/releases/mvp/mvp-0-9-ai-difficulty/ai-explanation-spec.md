# AI Explanation 0.9 Spec

Status: Requirements Freeze
Stand: 2026-05-03

## Ziel

Jede KI-Entscheidung soll kurz erklären, warum eine aktuelle LegalAction gewählt wurde. Die Erklärung ist Lern- und Diagnoseinformation, keine Regelautorität.

## Struktur

Eine Entscheidung enthält:

- `reasonCode`,
- `explanation`,
- `evidence`,
- `confidence`,
- `fallbackUsed`,
- `timeoutUsed`,
- `profileId`,
- `difficulty`.

## Reason-Code-Taxonomie

Prefixe:

- `runner.access.*`
- `runner.encounter.*`
- `runner.economy.*`
- `runner.setup.*`
- `runner.run.*`
- `runner.tag.*`
- `runner.end_turn`
- `corp.mandatory.*`
- `corp.score.*`
- `corp.remote.*`
- `corp.ice.*`
- `corp.rez.*`
- `corp.economy.*`
- `corp.tag.*`
- `corp.end_turn`
- `fallback.*`

## Leak-Regeln

Explanations dürfen nicht enthalten:

- `cardInstances`,
- Session-, Join-, Reconnect- oder Tokenwerte,
- private gegnerische Hand-/Deck-/Stack-/HQ-/R&D-/Grip-Titel,
- unrezzed Corp-Kartentitel aus Runner-Sicht,
- Runner-Grip-/Stack-Titel aus Corp-Sicht,
- private Decklisten.

## Sprache

Sichtbare Erklärtexte sind kurz, deutsch und direkt. Debugdetails bleiben strukturiert und side-sicher.
