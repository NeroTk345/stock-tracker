# Northstar · Multi-User Portfolio Tracker

Een moderne, privacy-bewuste fintech webapplicatie voor het bijhouden van beleggingsportefeuilles, gebouwd voor zowel individueel lokaal gebruik als multi-user gebruik met accountregistratie en veilige cloud synchronisatie.

---

## Inhoudsopgave
1. [Wat zie je als je NIET bent ingelogd? (Gast-modus)](#1-wat-zie-je-als-je-niet-bent-ingelogd-gast-modus)
2. [Wat zie je als je WEL bent ingelogd? (Gebruikersaccount)](#2-wat-zie-je-als-je-wel-bent-ingelogd-gebruikersaccount)
3. [Multi-User Architectuur & Isolatie](#3-multi-user-architectuur--isolatie)
4. [Backend & Database (`server.py`)](#4-backend--database-serverpy)
5. [API Endpoints](#5-api-endpoints)
6. [Beveiliging & Wachtwoordhashing](#6-beveiliging--wachtwoordhashing)
7. [Installatie & Opstarten](#7-installatie--opstarten)

---

## 1. Wat zie je als je NIET bent ingelogd? (Demo-modus)

Als je de website opent zonder in te loggen, bevindt de app zich duidelijk in **🎭 DEMO-MODUS**:

- **Duidelijke Visuele Indicatie**:
  - Bovenaan het dashboard verschijnt een opvallende gouden **`🎭 DEMO MODUS`** banner:
    > *"Je bekijkt momenteel een voorbeeldportfolio met fictieve demo-data. Elke ingelogde gebruiker ziet uitsluitend zijn eigen persoonlijke portfolio. Wil je jouw eigen transacties en CSV's veilig bijhouden? Maak binnen 10 seconden gratis een account aan!"*
  - In de navigatiebalk staat de knop: **`[ DEMO · Account Aanmaken / Inloggen ]`**.
  - De broker-kiezer toont expliciet: **`[ 💼 DEMO Trade Republic ▾ ]`**.
  - Het begroetingsvak toont: **`🎭 DEMO MODUS · Goedemiddag, Bezoeker (Demo)`**.
- **Wat kan een bezoeker in demo-modus doen?**:
  - Alle dashboards, grafieken, rendementsanalyses, verdelingen (sector, type, regio, individueel) en prognoses interactief bekijken.
- **Account Vereist voor eigen beheer**:
  - Zodra een bezoeker op **"+ Transactie toevoegen"**, **"CSV / Excel importeren"** of **"+ Nieuwe Broker toevoegen"** klikt, verschijnt een vriendelijke modal:
    **🔒 Gratis Account Vereist**:
    Hierin wordt uitgelegd dat demo-data fictief is en dat een gratis account nodig is om een eigen, strikt afgeschermd portfolio in de cloud op te slaan.
- **Direct registreren of inloggen**:
  - Binnen 10 seconden kan een bezoeker een gratis account aanmaken. Elk account start standaard met een eigen schoon, leeg portfolio dat direct gekoppeld is aan diens veilige cloudopslag.

---

## 2. Wat zie je als je WEL bent ingelogd? (Gebruikersaccount)

Zodra je inlogt met je e-mailadres en wachtwoord, verandert de interface naar een gepersonaliseerde cloud-omgeving:

- **Topbar Profielknop**:
  - In plaats van `Inloggen / Registreren` zie je nu een gepersonaliseerde avatar met jouw initialen en naam:
    `[ 🟢 N · Nero (nero@voorbeeld.nl) ▾ ]`.
  - Naast je naam staat een groen **synchronisatie-bolletje** dat aangeeft dat je portfolio gesynchroniseerd is met de cloud.
- **Persoonlijke begroeting**:
  - Het dashboard begroet je met je eigen voornaam: bijv. `Good evening, Nero`.
- **Automatische Cloud Synchronisatie**:
  - Elke wijziging die je doet (nieuwe transactie, aankoop, brokerwissel, CSV import) wordt op de achtergrond automatisch (debounced) opgeslagen in de centrale SQLite database op de server.
  - Je kunt nu op elk apparaat inloggen en dezelfde actuele portefeuille terugvinden.
- **Gebruikersmenu (Modal)**:
  - Klikken op je naam opent een venster met:
    - Jouw naam, e-mailadres en datum van registratie.
    - **Cloud synchronisatiestatus** (met tijdstip van laatste sync).
    - **`☁ Nu forceren synchroniseren`**: Direct een back-up sturen naar de cloud.
    - **`🏛️ Beheer Brokers & Portefeuilles`**: Schakelen tussen brokers (Trade Republic, DEGIRO, IBKR).
    - **`📁 Exporteer persoonlijke backup (JSON)`**: Download een offline kopie van je gegevens.
    - **`🚪 Uitloggen`**: Beëindigt je sessie, wist de actieve weergave en zet het scherm terug naar Gast-modus.

---

## 3. Multi-User Architectuur & Isolatie

De applicatie maakt een strikt onderscheid tussen:
1. **Gebruikersaccount (User Profile / Auth)**: De echte mens met een e-mailadres en wachtwoord.
2. **Brokers / Portefeuilles (Accounts binnen het gebruikersaccount)**: Elke gebruiker heeft zijn eigen portefeuille met onderliggende brokers (Trade Republic, DEGIRO, Alle Accounts Geconsolideerd).

### Isolatiegarantie:
- Gebruiker A (`jan@test.nl`) ziet **uitsluitend** zijn eigen portfolio's en transacties.
- Gebruiker B (`sophie@test.nl`) ziet **uitsluitend** haar eigen portfolio's en transacties.
- Zodra Gebruiker A uitlogt, wordt het lokale scherm opgeschoond zodat een eventuele volgende gebruiker op dezelfde computer geen gegevens van Gebruiker A kan inzien.

---

## 4. Backend & Database (`server.py`)

De backend draait op Python 3 met een ingebouwde SQLite database (`portfolio_users.db`). Er zijn geen externe database-servers of zware dependencies nodig.

### Databaseschema:

```sql
-- 1. Geregistreerde gebruikers
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- 2. Actieve inlogsessies (30 dagen geldig)
CREATE TABLE sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL
);

-- 3. Persoonlijke portfolio data per gebruiker
CREATE TABLE user_portfolios (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    data_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

---

## 5. API Endpoints

Alle endpoints ondersteunen CORS en sturen/ontvangen JSON.

| Methode | Endpoint | Beschrijving | Authenticatie vereist |
|---|---|---|---|
| `POST` | `/api/auth/register` | Maakt nieuw account aan met email, wachtwoord en naam | Nee |
| `POST` | `/api/auth/login` | Controleert inloggegevens en geeft sessietoken terug | Nee |
| `POST` | `/api/auth/logout` | Verwijdert het actieve sessietoken uit de database | Ja (`Bearer <token>`) |
| `GET` | `/api/auth/me` | Geeft gegevens van de ingelogde gebruiker terug | Ja (`Bearer <token>`) |
| `GET` | `/api/user/data` | Haalt de cloud portfolio data van de gebruiker op | Ja (`Bearer <token>`) |
| `POST` | `/api/user/data` | Slaat de actuele portfolio data op in de cloud | Ja (`Bearer <token>`) |
| `GET` | `/api/yahoo?url=...` | Lokale CORS proxy voor live Yahoo Finance beurskoersen | Nee |

---

## 6. Beveiliging & Wachtwoordhashing

- **Wachtwoordbeveiliging**: Wachtwoorden worden **nooit** in platte tekst opgeslagen. De backend gebruikt de industriestandaard **PBKDF2-HMAC-SHA256** met:
  - Een unieke, cryptografisch willekeurige salt van 16 bytes per gebruiker (`secrets.token_hex(16)`).
  - 600.000 iteraties (OWASP-advies). Het aantal iteraties wordt per hash opgeslagen (`pbkdf2_sha256$600000$...`); oude hashes met 100.000 iteraties worden bij de eerstvolgende login automatisch omgezet.
  - Hashes worden in constante tijd vergeleken (`hmac.compare_digest`).
- **Sessietokens**: Sessietokens zijn cryptografisch willekeurige hex-tokens van 32 bytes (`secrets.token_hex(32)`) die verlopen na 30 dagen. Ze worden alleen geaccepteerd via de `Authorization: Bearer`-header, nooit via de URL. Verlopen sessies worden bij het opstarten opgeruimd.
- **Rate limiting** (in het geheugen): max. 10 mislukte logins per IP en 5 per e-mailadres per 15 minuten, en max. 5 registraties per IP per uur. Daarna volgt `429 Too Many Requests`. Achter een reverse proxy op dezelfde machine wordt het echte IP uit `X-Forwarded-For` gelezen.
- **Maximale verzoekgrootte**: 5 MB per JSON-verzoek; grotere verzoeken krijgen `413`.
- **Statische bestanden** worden altijd uit de projectmap geserveerd, ongeacht vanuit welke map de server wordt gestart, en alleen met website-extensies (`.html`, `.css`, `.js`, afbeeldingen, fonts).
- **E-mailvalidatie**: E-mails worden getrimd en omgezet naar kleine letters (`lower()`) om dubbele registraties te voorkomen.

---

## 7. Installatie & Opstarten

### Server starten (lokaal):
Open een terminal (PowerShell of Command Prompt) in de projectmap en start:

```powershell
python server.py
```

De server start op poort **8080** (een andere poort kan als argument: `python server.py 8000`):
```text
==================================================
 Northstar Multi-User Server (Auth & Database)
 Database: c:\jarvis\portfolio_users.db
 Open in je browser: http://localhost:8080
==================================================
```

### Browser openen:
Ga naar [http://localhost:8080](http://localhost:8080) of open de pagina via Live Server op [http://127.0.0.1:5500](http://127.0.0.1:5500). De frontend detecteert automatisch de lokale proxy en API op poort 8080!
