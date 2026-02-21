import { readFileSync } from "fs";
import { resolve } from "path";
import postgres from "postgres";

const envPath = resolve(import.meta.dirname, "..", ".env.local");
let dbUrl = "";
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim();
  if (t.startsWith("postgresql://") || t.startsWith("postgres://")) {
    dbUrl = t;
    break;
  }
}

const sql = postgres(dbUrl, { ssl: "require" });

try {
  const stuck = await sql`
    SELECT id, user_id, puzzle_id, next_review_at, review_count
    FROM puzzle_revanche_queue
    WHERE resolved = false AND review_count = 0 AND next_review_at > now()
  `;
  console.log("Stuck entries:", JSON.stringify(stuck, null, 2));

  if (stuck.length > 0) {
    await sql`
      UPDATE puzzle_revanche_queue
      SET next_review_at = now()
      WHERE resolved = false AND review_count = 0 AND next_review_at > now()
    `;
    console.log(`Fixed ${stuck.length} entries`);
  } else {
    console.log("No stuck entries found");
  }
} finally {
  await sql.end();
}
