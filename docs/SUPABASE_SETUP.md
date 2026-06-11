# Goalpot – Supabase & OAuth Setup

Steg-för-steg guide för att koppla Goalpot till Supabase med Google, Facebook och Apple-inloggning.

---

## 0. Koppla Supabase MCP i Cursor

MCP låter agenten köra SQL, hämta API-nycklar och hantera databasen direkt från chatten.

### Snabbaste vägen (rekommenderas)

1. Öppna ditt Supabase-projekt i dashboarden.
2. Klicka **Connect** (uppe till höger) → fliken **MCP**.
3. Välj **Cursor** som klient och klicka **Add to Cursor** / installationsknappen.
4. Cursor öppnas och du loggar in med ditt Supabase-konto i webbläsaren.
5. Välj den **organisation** som innehåller Goalpot-projektet och godkänn åtkomst.

### Manuellt via Cursor Settings

1. Öppna **Cursor Settings** (`Ctrl + ,`).
2. Gå till **Tools & MCP** (äldre versioner: **Features → MCP**).
3. Kontrollera att **supabase** finns i listan (projektet har redan `.cursor/mcp.json`).
4. Slå på servern med växlingsknappen.
5. Om status är röd/fel: klicka **Connect** / **Authenticate** och logga in via webbläsaren.
6. **Starta om Cursor** (`Ctrl+Shift+P` → *Developer: Reload Window*) om verktygen inte syns.

### Begränsa till ett projekt (säkrare)

Ersätt `YOUR_PROJECT_REF` med ditt projekts ref (finns i Project URL: `https://abcdefghij.supabase.co` → ref är `abcdefghij`):

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
    }
  }
}
```

> Använd **inte** `read_only=true` när du ska köra migrationer — då kan agenten inte skriva till databasen.

### Verifiera att det fungerar

Skriv i chatten:

> *"Lista alla tabeller i min Supabase-databas med MCP"*

Om MCP fungerar ska agenten kunna anropa verktyg som `list_tables` och `execute_sql`.

### Felsökning MCP

| Problem | Lösning |
|---------|---------|
| Röd status / "errored" | Öppna Tools & MCP → Authenticate igen, starta om Cursor |
| Inga Supabase-verktyg | Reload Window, kontrollera att `.cursor/mcp.json` finns |
| OAuth-fönster öppnas inte | Tillåt popup-fönster för Cursor i webbläsaren |
| Fel organisation | Logga ut MCP, autentisera igen och välj rätt org |
| Behöver PAT (sällan) | Skapa token på [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) |

---

## 1. Skapa Supabase-projekt

1. Gå till [supabase.com/dashboard](https://supabase.com/dashboard) och skapa ett nytt projekt.
2. Vänta tills databasen är klar (1–2 minuter).
3. Gå till **Project Settings → API** och kopiera:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Publishable key** (under API Keys) → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 2. Kör databasmigrationer

Öppna **SQL Editor** i Supabase Dashboard och kör filerna i ordning:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_matches_and_predictions.sql`

Klicka **Run** efter varje fil.

## 3. Konfigurera Auth (alla providers)

Gå till **Authentication → URL Configuration**:

| Fält | Värde (lokal utveckling) |
|------|--------------------------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

För produktion, lägg även till din domän, t.ex. `https://goalpot.se/auth/callback`.

> **Viktigt:** OAuth-providers (Google, Facebook, Apple) använder Supabase som mellanhand. Deras redirect-URL är alltid:
>
> `https://<DITT-PROJEKT-REF>.supabase.co/auth/v1/callback`
>
> Hitta ditt projekt-ref i Project URL (t.ex. `abcdefghij` i `https://abcdefghij.supabase.co`).

---

## 4. Google OAuth

### Google Cloud Console

1. Gå till [console.cloud.google.com](https://console.cloud.google.com).
2. Skapa ett projekt (eller välj befintligt).
3. **APIs & Services → OAuth consent screen** – konfigurera (External, lägg till testanvändare vid behov).
4. **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
5. Typ: **Web application**.
6. **Authorized redirect URIs** – lägg till:
   ```
   https://<PROJEKT-REF>.supabase.co/auth/v1/callback
   ```
7. Kopiera **Client ID** och **Client Secret**.

### Supabase Dashboard

1. **Authentication → Providers → Google** – aktivera.
2. Klistra in Client ID och Client Secret.
3. Spara.

---

## 5. Facebook OAuth

### Meta for Developers

1. Gå till [developers.facebook.com](https://developers.facebook.com) och skapa en app.
2. Lägg till produkten **Facebook Login**.
3. Under **Facebook Login → Settings → Valid OAuth Redirect URIs**:
   ```
   https://<PROJEKT-REF>.supabase.co/auth/v1/callback
   ```
4. Gå till **Settings → Basic** och kopiera **App ID** och **App Secret**.

### Supabase Dashboard

1. **Authentication → Providers → Facebook** – aktivera.
2. Klistra in App ID som Client ID och App Secret som Client Secret.
3. Spara.

> Facebook kräver att appen är i **Live mode** för att alla användare ska kunna logga in. Under utveckling fungerar testanvändare i Development mode.

---

## 6. Apple OAuth

### Apple Developer

1. Gå till [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles**.
2. Skapa ett **App ID** med Sign in with Apple aktiverat.
3. Skapa ett **Services ID** (detta blir ditt Client ID):
   - Aktivera Sign in with Apple.
   - **Domains**: `supabase.co` (eller `<PROJEKT-REF>.supabase.co`)
   - **Return URLs**:
     ```
     https://<PROJEKT-REF>.supabase.co/auth/v1/callback
     ```
4. Skapa en **Key** med Sign in with Apple aktiverat – ladda ner `.p8`-filen.
5. Notera **Key ID**, **Team ID** och **Services ID**.

### Supabase Dashboard

1. **Authentication → Providers → Apple** – aktivera.
2. Fyll i:
   - **Client ID**: Services ID
   - **Secret Key**: innehållet i `.p8`-filen
   - **Key ID**: från Apple
   - **Team ID**: från Apple Developer-kontot
3. Spara.

---

## 7. E-post / lösenord

1. **Authentication → Providers → Email** – ska vara aktiverat som standard.
2. Under **Authentication → Email Templates** kan du anpassa bekräftelsemejl.
3. För lokal utveckling: **Authentication → Providers → Email** → inaktivera "Confirm email" om du vill slippa e-postbekräftelse under test.

---

## 8. Lokal miljövariabel

Kopiera `.env.local.example` till `.env.local`:

```bash
cp .env.local.example .env.local
```

Fyll i dina värden:

```env
NEXT_PUBLIC_SUPABASE_URL=https://luscnjqtdquvcjavrmot.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 9. Starta appen

```bash
npm install
npm run dev
```

Öppna [http://localhost:3000](http://localhost:3000) och testa inloggning.

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| OAuth redirectar till fel URL | Kontrollera Redirect URLs i Supabase och provider-konsolen |
| `Invalid login credentials` | Verifiera att e-postbekräftelse är gjord, eller stäng av confirm email |
| RLS-fel vid skapa liga | Kör migration 001 igen, kontrollera att användaren är inloggad |
| Poäng uppdateras inte | Kör migration 002, kontrollera att resultat sparas som siffror |
| Apple login fungerar inte | `.p8`-nyckeln roteras var 6:e månad – generera ny i Apple Developer |

## Poängsystem (automatiskt)

När ligaskaparen sparar matchresultat beräknas poäng automatiskt:

- **3 poäng** – exakt rätt resultat (t.ex. tips 2–1, resultat 2–1)
- **1 poäng** – rätt tecken/outcome (1/X/2) men fel målsiffra
- **0 poäng** – fel

Topplistan uppdateras automatiskt via databastrigger.
