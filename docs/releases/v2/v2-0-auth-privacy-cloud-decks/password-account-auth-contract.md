# V2.0 Passwort-Account- und Session-Vertrag

Stand: 2026-07-18

Status: aktueller Vertragsfreeze für die geschlossene Alpha

Ersetzt für den ersten Authentisierungsschritt die Passkey-first-Entscheidung
aus `account-session-auth-contract.md`. Dessen Account-/Match-Trennung,
Cookie-, CSRF-, Origin-, Revocation- und Privacy-Grenzen bleiben gültig.
Passkeys bleiben der nachgelagerte phishing-resistente Zielpfad.

## Accountanlage

- Der erste Admin wird ausschließlich über einen lokalen CLI-/Operator-Flow
  angelegt.
- Weitere Accounts entstehen durch kurzlebige, einmalige Admin-Einladungen.
- Eine Einladung speichert nur den Token-Hash und darf höchstens sieben Tage
  gültig sein.
- Die Einlösung setzt Anmeldename, Anzeigename und Passwort. E-Mail wird nicht
  erhoben.
- Anmeldenamen werden getrimmt, per Unicode-NFKC normalisiert und für den
  Vergleich kleingeschrieben. Erlaubt sind 3 bis 32 Zeichen aus Buchstaben,
  Ziffern, Punkt, Bindestrich und Unterstrich.
- Anzeigenamen sind 1 bis 60 sichtbare Zeichen lang und kein
  Authentisierungsmerkmal.

## Passwortvertrag

- Mindestlänge: 15 Unicode-Codepoints.
- Maximallänge: 256 Unicode-Codepoints.
- Keine erzwungene Mischung aus Groß-/Kleinbuchstaben, Ziffern oder
  Sonderzeichen.
- Passwortmanager, Einfügen, Leerzeichen und Unicode sind zulässig.
- Vor Hashing wird Unicode-NFC angewendet.
- Häufige, kompromittierte und NETGRID-kontextspezifische Passwörter werden
  durch eine lokale Blockliste abgelehnt.
- Keine periodische Änderung. Änderung nur auf Nutzerwunsch, Admin-Reset oder
  Kompromittierungsverdacht.

Die Alpha nutzt Node-`scrypt` als speicherharten KDF, weil dafür bereits ein
gehärteter lokaler Projektpfad besteht und keine neue native
Produktionsabhängigkeit erforderlich ist. Produktionsdefault:

| Parameter | Wert |
| --- | --- |
| `N` | `131072` |
| `r` | `8` |
| `p` | `1` |
| Key-Länge | `64` Bytes |
| Salt | `32` zufällige Bytes |
| Maximaler Speicher | mindestens `192 MiB` |
| Parameter-Version | `1` |

Tests dürfen explizit reduzierte Parameter injizieren. Verifikation verwendet
einen timing-sicheren Vergleich. Ein Credential mit älterer Parameterversion
wird nach erfolgreichem Login neu gehasht.

## Account-Session

| Eigenschaft | Vertrag |
| --- | --- |
| Cookie | `ng_account_session` |
| Browserzugriff | `HttpOnly` |
| Produktion | `Secure`, `SameSite=Lax`, `Path=/` |
| Laufzeit | maximal 14 Tage |
| DB | nur HMAC-SHA256-Hash des Roh-Tokens |
| CSRF | separater Rohwert in der JSON-Self-Response, nur im Arbeitsspeicher des Clients |
| Revocation | aktuelles Gerät, alle Geräte, Account deaktiviert/gelöscht, Passwortänderung |

Jede Session trägt die bei Login gültige `credentialVersion`. Eine
Passwortänderung erhöht diese Version und macht ältere Sessions ungültig.

## Fehler- und Rate-Limit-Vertrag

- Login antwortet unabhängig von Accountstatus oder Passwort mit derselben
  öffentlichen Fehlermeldung und demselben Status.
- Login, Einladungseinlösung und Admin-Reset erhalten eigene strengere
  Rate-Limit-Schlüssel.
- Fehlversuche dürfen keine Passwörter, Anmeldenamen oder Tokenwerte loggen.
- Erfolgreiche Authentisierung setzt den serverseitigen Fehlversuchszähler des
  Credentials zurück.
- Lokale Alpha darf kürzere Rate-Limitfenster für Tests verwenden, aber der
  private Internetpfad darf nicht ungedrosselt laufen.

## Admin-Reset ohne E-Mail

Der Admin erzeugt einen einmaligen Reset-Token. Der Token ist kurzlebig,
gehasht, zweckgebunden und wird nie geloggt. Der Nutzer setzt damit ein neues
Passwort und meldet sich anschließend normal an. Reset widerruft alle
Account-Sessions. Es gibt keine Sicherheitsfragen und kein Zusenden eines
Passworts.

## Spätere Erweiterung

E-Mail-Verifikation, Passkeys und MFA erhalten eigene Tabellen und
Credentialtypen. Sie dürfen den aktuellen Accountschlüssel nicht ersetzen und
keine Migration persönlicher Decks erfordern.
