import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_REF = "luscnjqtdquvcjavrmot";
const token = process.env.SUPABASE_ACCESS_TOKEN;

if (!token) {
  console.error(
    "Missing SUPABASE_ACCESS_TOKEN.\n" +
      "1. Run: npx supabase login\n" +
      "2. Or create a token at https://supabase.com/dashboard/account/tokens\n" +
      "3. Then run: $env:SUPABASE_ACCESS_TOKEN='your-token'; npm run db:migrate"
  );
  process.exit(1);
}

const sqlPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../supabase/migrations/run_all.sql"
);
const sql = readFileSync(sqlPath, "utf8");

async function runQuery(query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, read_only: false }),
    }
  );

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${body}`);
  }

  return body;
}

console.log("Running Goalpot migrations on", PROJECT_REF, "...");
await runQuery(sql);

const verifyResult = await runQuery(`
  select table_name
  from information_schema.tables
  where table_schema = 'public'
    and table_name in ('profiles', 'leagues', 'league_members', 'matches', 'predictions')
  order by table_name;
`);

console.log("Created tables:");
console.log(verifyResult);
